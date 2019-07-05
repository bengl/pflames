'use strict';

const { spawner, checkIsLinux } = require('./common.js');

checkIsLinux('run');

const command = process.argv.slice(3).join(' ');

const args = `perf record -i -g -F 99 -- ${command}`;

console.log(`Starting perf record for command: ${command}`);
spawner(args.split(' '));
