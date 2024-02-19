import subprocess
import sys

from queue import Queue
from subprocess import PIPE
from threading import Thread

# simply wait for a line to be entered on STDIN:
def wait_for_input(result: Queue[str]):
  print("Press Enter to continue: ", end='', flush=True)
  sys.stdin.readline()
  result.put("input")

# spawn a program, and wait for it to emit a line of output:
def wait_for_program(result: Queue[str]):
  program = subprocess.Popen(["bash", "-c", "sleep 3; echo 'Hi!'"], stdout=PIPE)
  program.stdout.readline() # type: ignore - we set `stdout=PIPE` above
  result.put("timeout")

# we only care who returns first, so a queue size of 1 is fine for this case:
result: Queue[str] = Queue(1)

# spawn both functions in background threads:
Thread(target=wait_for_input,   daemon=True, args=[result]).start()
Thread(target=wait_for_program, daemon=True, args=[result]).start()

# block and see who finishes first:
who_won = result.get()
print(who_won) # either "input" or "timeout" depending on which finished first
