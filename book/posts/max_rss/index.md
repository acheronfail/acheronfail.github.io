# Measuring Max Resident Set Size

Did you know that the `ru_maxrss` field (Maximum Resident Set Size) isn't always accurate?

Well, I didn't either, until I wanted to get a rough memory usage benchmark across a few different programs, and noticed that it wasn't quite right.

- [Measuring Max Resident Set Size](#measuring-max-resident-set-size)
  - [Using `wait4`](#using-wait4)
    - [`rusage.ru_maxrss` is inaccurate](#rusageru_maxrss-is-inaccurate)
  - [Reading `/proc/$PID/smaps`](#reading-procpidsmaps)
    - [`gdb` to the rescue!](#gdb-to-the-rescue)
  - [Enter `ptrace`](#enter-ptrace)
    - [Who saves the day? `max_rss` does](#who-saves-the-day-max_rss-does)
- [See also](#see-also)

## Using `wait4`

My first attempt at measuring the max RSS was using `wait4`. Looking at its man page with `man wait4`, we see the following signature:

```txt
pid_t wait4(pid_t pid, int *stat_loc, int options, struct rusage *rusage);
```

I whipped up a small program to use that, and called it [timeRS](https://github.com/acheronfail/timeRS/blob/master/src/ffi/mod.rs#L30) (because it's basically the `time` command, but in Rust).

Using this program, we can measure what the `rusage.ru_maxrss` field is for a any command.

### `rusage.ru_maxrss` is inaccurate

As far as I was concerned, the max RSS reported here was just fine. That was, until I noticed some odd behaviour, especially when running commands which used very little memory.

I have a [toy project](https://github.com/acheronfail/count) which pits different programming languages against each other, and I started seeing these results when using `rusage.ru_maxrss`:

<div style="text-align: center;">

| Language    | Max Resident Set Size |
| :---------- | --------------------: |
| `assembly`  |        262.1440000 kB |
| `zig`       |        262.1440000 kB |
| `pascal`    |        393.2160000 kB |
| `c-clang`   |          1.4417920 MB |
| `c-gcc`     |          1.4417920 MB |
| `nim`       |          1.4417920 MB |
| `rust`      |          1.8350080 MB |
| `fortran`   |          2.6214400 MB |
| `lua`       |          2.6214400 MB |
| `forth`     |          3.1457280 MB |
| `go`        |          3.2931840 MB |
| `cpp-clang` |          3.4078720 MB |
| `cpp-gcc`   |          3.4078720 MB |
| `haskell`   |          4.1943040 MB |
| `perl`      |          4.8496640 MB |


[See the full table of results here](https://github.com/acheronfail/count/releases/tag/149)
</div>

I mean, what are the chances that languages have _the exact same max RSS value??_. I was okay when it was `c-clang` and `c-gcc`, because maybe - just maybe - they had the same optimisations and both compiled into a program that's essentially exactly the same.

But `assembly` and `zig`? And what about `fortran` (compiled) and `lua` (interpreted)? Surely not!

And thus started the investigation. After some searching, I found others who had noticed issues with using `rusage.ru_maxrss`, too:

* <https://jkz.wtf/random-linux-oddity-1-ru_maxrss>
* <https://tbrindus.ca/sometimes-the-kernel-lies-about-process-memory-usage/>
* <https://github.com/ziglang/gotta-go-fast/issues/23>
* <https://github.com/golang/go/issues/32054>

If you read those, you'll find that there's a this section in the Linux man pages:

~~~admonish quote title="From `man 2 getrusage`"
Resource usage metrics are preserved across an execve(2).
~~~

Well, that's going to definitely play a part in why I'm seeing the behaviour I'm seeing.

But that's not all! Upon further inspection, I also discovered this:

~~~admonish quote title="From `man 5 proc`"
Resident Set Size: number of pages the process has in real memory. This is just the pages which count toward text, data, or stack space. This does not include pages which have not been demand-loaded in, or which are swapped out. **This value is inaccurate; see `/proc/pid/statm` below.**

...

Some of these values are inaccurate because of a kernel-internal scalability optimization. If accurate values are required, use `/proc/pid/smaps` or `/proc/pid/smaps_rollup instead`, which are much slower but provide accurate, detailed information.
~~~

Ahh, there we go. So we've found the reason we're not getting good numbers from `rusage.ru_maxrss`, and we also potentially we have a workaround by reading `/proc/$PID/smaps` and its ilk.

## Reading `/proc/$PID/smaps`

There's an inherit problem with reading `/proc/$PID/smaps`: **when** do we read it? What if the process only runs for an extremely short amount of time?

Really, we need to read this at the end of the process' life, right before it exits. Otherwise we might miss memory that would be allocated after we read `/proc/$PID/smaps`.

### `gdb` to the rescue!

Let's use `gdb` to run the program, set a breakpoint just before it exits to pause it, and at that point we can read from `/proc/$PID/smaps`.

First, let's create a script to make running `gdb` a little easier:

```bash title="gdb script"
# set breakpoint 1 before the program exits
catch syscall exit exit_group

# add condition to breakpoint 1, to only catch the main thread's exit
# this avoids any spawned threads from triggering the breakpoint
python
gdb.execute("condition 1 $_thread == 1")

# run the program until it stops on the above breakpoing
run

# the program has stopped on the exit breakpoing, capture its pid
python
gdb.execute("set $pid = " + str(gdb.selected_inferior().pid))
end

# now read from `/proc/$PID/smaps`
eval "shell cat /proc/%d/smaps_rollup > rss.txt", $pid

# let the program exit
continue
# quit gdb
quit
```

Awesome! For simple single-threaded programs, this seemed to work well.

However, I did find some issues with more complex programs:

However, I noticed that if a program created threads or spawned child processes, then the RSS values were far smaller than expected. Unfortunately, this only tracks the RSS value of the main thread, not all threads/processes that the program launched.

In summary:

* Works for single-threaded programs
* Does not return an accurate RSS for multi-threaded programs or programs that spawn other processes
* `gdb` seems to often get stuck with some programs
  * for some reason some processes exit even after hitting the breakpoint, so by the time we read from `/proc` it's no longer there - this seemed to only happen for more complex programs
  * again for reasons I don't know, this didn't work for Erlang programs (the breakpoint wouldn't trigger)

It was already getting frustrating trying to script `gdb` to do what I wanted. And at this point, what I wanted was this:

1. Run `program`
2. Stop program moments before it exits
3. Read `/proc/$PID/smaps` and get its RSS
4. Do this for every thread/process that `program` spawns during its lifetime

So, rather than continue to bend `gdb` to my will, I thought I'd use the same APIs that `gdb` itself uses to debug programs.

## Enter `ptrace`

If you're unaware, PTRACE is the Linux API that powers debuggers. It's what `gdb` itself uses, and it's actually quite easy to use!

There's a little setup required, but `man 2 ptrace` is an absolutely excellent (required, I'd say) resource to refer to when using it. In essence, it boils down to something like this:

1. Your program `fork`s
2. The newly spawned child issues a `PTRACE_TRACEME` and then `SIGSTOP`s itself
3. The parent then calls `waitpid` on the child
4. The parent then controls the child via PTRACE APIs, etc

With this approach, it's quite easy to halt the traced process just before it exits, and also to automatically begin tracing all of the process' children whenever they're created.

So, I built a tool using Rust that makes use of the PTRACE API and does exactly what I want. I present to you, [`max_rss`](https://github.com/acheronfail/max_rss).

### Who saves the day? `max_rss` does

Here's an updated table of the max RSS tests, now using `max_rss`:

<div style="text-align: center">

| Language    | Max Resident Set Size |
| :---------- | --------------------: |
| `assembly`  |         12.2880000 kB |
| `zig`       |        192.5120000 kB |
| `pascal`    |        528.3840000 kB |
| `c-clang`   |          1.4868480 MB |
| `nim`       |          1.5319040 MB |
| `vala`      |          1.5523840 MB |
| `c-gcc`     |          1.6138240 MB |
| `rust`      |          2.0193280 MB |
| `fortran`   |          2.4330240 MB |
| `lua`       |          2.6705920 MB |
| `pony`      |          2.6910720 MB |
| `forth`     |          3.2604160 MB |
| `cpp-gcc`   |          3.6864000 MB |
| `cpp-clang` |          3.7068800 MB |

[See the full table of results here](https://github.com/acheronfail/count/releases/tag/193)
</div>

That looks MUCH better! No processes suspiciously have the exact same values, and it tracks forks/execs/clones/etc and captures all of their RSS values, too.

Rust makes it very simple too, using PTRACE, argument parsing, error checking and a load of comments in the code, [it only clocks in at ~300 LOC](https://github.com/acheronfail/max_rss/blob/master/src/main.rs).

# See also

Some pages I found while investigating this, that you may also find interesting:

* <https://jkz.wtf/random-linux-oddity-1-ru_maxrss>
* <https://tbrindus.ca/sometimes-the-kernel-lies-about-process-memory-usage/>
* Debugger deep-dive mini series
  * <https://eli.thegreenplace.net/2011/01/23/how-debuggers-work-part-1/>
  * <https://eli.thegreenplace.net/2011/01/27/how-debuggers-work-part-2-breakpoints>
  * <https://eli.thegreenplace.net/2011/02/07/how-debuggers-work-part-3-debugging-information>
* <https://www.kernel.org/doc/html/latest/filesystems/proc.html>
