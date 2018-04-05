'use strict';

const {
  execSync: exec
} = require('child_process');

exec(`rm -rf FlameGraph`);
exec(`git clone https://github.com/brendangregg/FlameGraph.git`);
