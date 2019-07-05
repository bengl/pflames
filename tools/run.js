'use strict';

const { spawner, checkIsLinux } = require('./common.js');

checkIsLinux('run');

let command = process.argv.slice(3);
if (command[0] === '--') {
  command.shift();
}

let first = command[0];
if (first === 'node' || first.endsWith('/node')) {
  if (!command.includes('--perf-basic-prof')) {
    command.shift();
    command.unshift('--perf-basic-prof');
    command.unshift(first);
  }
}
command = command.join(' ');
const args = `perf record -i -g -F 99 -- ${command}`;

console.log(`Starting perf record for command: ${command}`);
spawner(args.split(' '));
