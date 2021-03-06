# pflames

**`pflames`** is a tool for generating
[flamegraphs](http://www.brendangregg.com/flamegraphs.html) from various profile
formats.

The following formats are supported (detected by file extension):

* **`*.cpuprofile`**, as generated by older Chrome DevTools,
  [v8-profiler](https://npm.im/v8-profiler),
  [cli-profile](https://npm.im/cli-profile), etc.
* **`perf.data`**, as generated by `perf record` on Linux.
* **`isolate*.log`**, as generated by `node --prof`.

The data is processed from these formats into flamegraphs generated by Brendan
Gregg's [FlameGraph](https://github.com/brendangregg/FlameGraph) tool, saved to
a local file based on the input filename, then immediately opened in your web
browser.

## Usage

Examples:

```
$ npm i -g cli-profile
$ cli-profile myscript.js
$ ls *.cpuprofile
profile1522910623600.cpuprofile
$ pflames profile1522910623600.cpuprofile
```

```
$ # Note: Ensure your script has `process.on('SIGINT', process.exit)`
$ node --prof myscript.js
$ ls *.log
isolate-0x2259700-v8.log
$ pflames isolate-0x2259700-v8.log
```

```
$ sudo perf record -i -g -F 99 -- node --perf-basic-prof myscript.js
$ pflames perf.data
```

You can also compare two profiles of the same format by passing them both in. A
difference flamegraph will be generated:

* `$ pflames thing1.cpuprofile thing2.cpuprofile`

You can also use the same data to generate an icicle graph, so you can get a
better view of what's calling a heavy function:

* `$ pflames --icicle thing1.cpuprofile`

## License

MIT License. See LICENSE.txt
