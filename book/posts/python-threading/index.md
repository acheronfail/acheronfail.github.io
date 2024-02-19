# Race threads in Python without asyncio

While writing a small python script, I faced a challenge where I needed to:

- Respond based on user input; or
- Act on notifications from a subprocess

Both of these functions were _blocking_ - meaning they halt the program's execution until completion - and I wanted to act on whichever returned first. I didn't want to setup an async runtime with `asyncio` and all that boilerplate.

So then, how could I run two blocking calls simultaneously?

- [Race threads in Python without asyncio](#race-threads-in-python-without-asyncio)
  - [Some setup](#some-setup)
  - [Threads to the res-`Queue`](#threads-to-the-res-queue)

## Some setup

First, let's define two functions as examples. I've greatly simplified these programs for the sake of simplicity:

```python
# simply wait for a line to be entered on STDIN:
def wait_for_input():
  print("Press Enter to continue: ", end='', flush=True)
  sys.stdin.readline()

# spawn a program, and wait for it to emit a line of output:
def wait_for_program():
  program = subprocess.Popen(["bash", "-c", "sleep 3; echo 'Hi!'"], stdout=PIPE)
  program.stdout.readline()
```

As you can see, both of them are blocking, so execution will halt until the `.readline()` calls complete. Now, I'm sure there's a way to handle this gracefully with `asyncio` runtimes and such, but I didn't want to set all that up in this simple script.

## Threads to the res-`Queue`

With the builtin `threading` and the `queue` modules, I found - what I thought - was quite an elegant solution.

So, it turned out that Python's `Queue` has a `get()` method _which blocks until an item is returned_. And we can share it safely between threads!

First, let's update our `wait_for_input` and `wait_for_program` functions above to take a `Queue` and put an item in it:

```python
# simply wait for a line to be entered on STDIN:
def wait_for_input(result):
  print("Press Enter to continue: ", end='', flush=True)
  sys.stdin.readline()
  result.put("input")

# spawn a program, and wiat for it to emit a line of output:
def wait_for_program(result):
  program = subprocess.Popen(["bash", "-c", "sleep 3; echo 'Hi!'"], stdout=PIPE)
  program.stdout.readline()
  result.put("timeout")
```

And then we simply create the `Queue` and race the functions in threads:

```python
# we only care who returns first, so a queue size of 1 is fine for this case:
result = Queue(1)

# spawn both functions in background threads:
Thread(target=wait_for_input,   daemon=True, args=[result]).start()
Thread(target=wait_for_program, daemon=True, args=[result]).start()

# block and see who finishes first:
who_won = result.get()
print(who_won) # either "input" or "timeout" depending on which finished first
```

As you can see there's not much code to this, and it can work for more advanced use-cases, too. Again, I'm sure there are some gems in `asyncio`, but for simple Python programs and scripts, I'll be reaching for this instead.

You can [see a small example script here](github:./race.py) if you're interested.
