'use strict';

const { spawner, checkIsLinux } = require('./common.js');

checkIsLinux('attach');

const pid = process.argv[3];
let timeout;
if (process.argv[4] !== undefined) {
  timeout = parseInt(process.argv[4], 10);
}

let args = `perf record -i -g -F 99 -p ${pid}`;
if (timeout !== undefined) {
  args += ` -- sleep ${timeout}`
}

console.log(`Starting perf record on PID ${pid}`);
spawner(args.split(' '));
