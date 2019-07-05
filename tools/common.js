'use strict';

const os = require('os');
const { spawn } = require('child_process');

function checkIsLinux(tool) {
  if (!os.type() === 'Linux') {
    console.error(`pflames ${tool} is only supported on Linux at the moment.`);
    process.exit(1);
  }
}

function spawner(args) {
  spawn('sudo', args, { stdio: 'inherit' })
  .on('close', (code, signal) => {
    if (signal && signal !== 'SIGINT') {
      console.error(`perf exited due to ${signal}`);
      process.exit(1);
    }
    if (code !== null && code !== 0) {
      console.error(`perf exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    // Ignore and wait for child process to end.
  });
}

module.exports = {
  spawner,
  checkIsLinux
};
