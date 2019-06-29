#!/usr/bin/env node
'use strict';

const fs = require('fs');
const c2s = require('cpuprofile2stackcollapse');
const { spawn, execSync } = require('child_process');
const { Transform } = require('stream');
const path = require('path');
const opn = require('opn');
const os = require('os');

let args = process.argv.slice(2);
let icicleArgs = [];

if (args.includes('--icicle')) {
  args = args.filter(arg => arg !== '--icicle');
  icicleArgs = ['--inverted', '--reverse'];
}

if (args.length === 1) {
  oneFile(...getStream(args[0]));
} else if (args.length === 2) {
  diffFiles(...getStream(args[0]), ...getStream(args[1]));
}

function flamegraph(command, args = []) {
  return spawn(path.join(__dirname, 'FlameGraph', `${command}.pl`), args);
}

function getStream(filename) {
  const longname = normalizeFilename(filename);
  const extname = path.extname(longname);
  switch (extname) {
    case '.cpuprofile':
      return [fs.createReadStream(longname).pipe(c2s()), longname];
    case '.data':
      return [perfDataStream(longname), longname];
    case '.log':
      return [preprocessLog(longname).pipe(preprocessedToStacks()), longname];
    default:
      throw new Error('unrecognized file format');
  }
}

function preprocessLog(filename) {
  return spawn('node', ['--prof-process', '--preprocess', '--ignore-unknown', filename]).stdout;
}

function preprocessedToStacks() {
  const output = new Transform({
    transform(chunk, encoding, callback) {
      if (!this._bufs) {
        this._bufs = [];
      }
      this._bufs.push(chunk);
      callback();
    },
    flush(callback) {
      let data = Buffer.concat(this._bufs).toString();
      let firstNewline = data.indexOf('\n');
      if (
        data.substring(0, firstNewline) === 'Testing v8 version different from logging version'
      ) {
        data = data.substr(firstNewline + 1);
      }
      data = data.replace(/^\n/, '');
      data = JSON.parse(data);
      const stacks = {};
      data.ticks.forEach(tick => {
        const converted = tick.s.map(n => data.code[n]).reverse();
        const collapsed = converted.map(n => n ? `(${n.type}) ${n.name}` : '(unknown)').join(';');
        stacks[collapsed] = stacks[collapsed] ? stacks[collapsed] + 1 : 1;
      });
      for (const [stack, hits] of Object.entries(stacks)) {
        this.push(`${stack} ${hits}\n`);
      }
      callback();
    }
  });
  return output;
}

function perfDataStream(filename) {
  const stackcollapseProc = flamegraph('stackcollapse-perf');
  let needsRoot = false;
  try {
    fs.accessSync(filename, fs.constants.R_OK);
  } catch (e) {
    needsRoot = true;
  }
  const perfScriptProc = needsRoot ?
    spawn('sudo', ['perf', 'script', '-i', filename]) :
    spawn('perf', ['script', '-i', filename]);
  perfScriptProc.stdout.pipe(stackcollapseProc.stdin);
  return stackcollapseProc.stdout;
}

function normalizeFilename(filename) {
  if (!path.isAbsolute(filename)) {
    return path.resolve(filename);
  }
  return filename;
}

function openInBrowser(filename) {
  if ('BROWSER' in process.env) {
    execSync(`${process.env.BROWSER} file://${filename}`);
  } else {
    opn(`${filename}`);
  }
}

function oneFile(strm, filename) {
  const flameProc = flamegraph('flamegraph', icicleArgs);
  strm.pipe(flameProc.stdin);
  const svgBufs = [];
  flameProc.stdout.on('data', d => svgBufs.push(d));
  flameProc.stdout.on('end', () => {
    const svg = Buffer.concat(svgBufs);
    const svgFilename = path.join(process.cwd(), `${path.basename(filename)}.html`);
    fs.writeFile(svgFilename, svg, () => {
      console.log(`Flamechart saved as ${svgFilename}`);
      openInBrowser(svgFilename);
    });
  });
}

function diffFiles(strm1, filename1, strm2, filename2) {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pflames-'));
  const stackFile1 = path.join(tmpdir, '1.stacks');
  const stackFile2 = path.join(tmpdir, '2.stacks');
  let toBeDone = 2;
  const done = () => {
    if (--toBeDone !== 0) {
      return;
    }
    const svgBufs = [];
    const difffoldedProc = flamegraph('difffolded', [stackFile1, stackFile2]);
    const flameProc = flamegraph('flamegraph', icicleArgs);
    difffoldedProc.stdout.pipe(flameProc.stdin);
    flameProc.stdout.on('data', d => svgBufs.push(d));
    flameProc.stdout.on('end', () => {
      const svg = Buffer.concat(svgBufs);
      const svgFilename = path.join(process.cwd(), `diff-${path.basename(filename1)}-${path.basename(filename2)}.html`);
      fs.writeFile(svgFilename, svg, () => {
        console.log(`Flamechart saved as ${svgFilename}`);
        openInBrowser(svgFilename);
        fs.unlinkSync(stackFile1);
        fs.unlinkSync(stackFile2);
        fs.rmdirSync(tmpdir);
      });
    });
  };

  const writeStream1 = fs.createWriteStream(stackFile1);
  writeStream1.on('close', done);
  const writeStream2 = fs.createWriteStream(stackFile2);
  writeStream2.on('close', done);
  strm1.pipe(writeStream1);
  strm2.pipe(writeStream2);
}
