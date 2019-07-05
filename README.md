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

```
$ pflames thing1.cpuprofile thing2.cpuprofile
```

You can also use the same data to generate an icicle graph, so you can get a
better view of what's calling a heavy function:

```
$ pflames --icicle thing1.cpuprofile
```

### Easily create `perf.data` files (Linux only)

You can use the `run` and `attach` commands to profile Node.js and other Linux
processes. This will run `perf record` behind the scenese to generate a
`perf.data`.

* **`run`** spawns a process with the given command with `perf record`, profiling
it for its entire lifetime. If the process binary being run is `node`, it will
add `--perf-basic-prof` to the options. Examples:

```
# profile a Node.js app
$ pflames run node myapp.js
# profile a Rust app (you should use release builds for this)
$ pflames run target/release/myapp
```

* **`attach`** starts profiling a given PID until the that process exits, a
SIGINT (Ctrl+C) is received, or a given number of seconds has elapsed.

```
# Assume PID 1234 is running and we want to profile it:
$ pflames attach 1234
# Now either Ctrl+C to finish profiling or wait for 1234 to finish
# Or profile it for exactly 5 seconds:
$ pflames attach 1234 5
```

Both of these commands produce `perf.data` files which can be then processed
with `plfames`:

```
$ pflames perf.data
```

## License

MIT License. See LICENSE.txt
