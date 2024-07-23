# How to synchronously block NodeJS

Ever wanted to `sleep` in NodeJS?

If so, you've probably seen something like this:

```js, title="Async Sleep"
import { promisify } from 'node:util';

const asyncSleep = promisify(setTimeout);

// sleep for 500 ms
await asyncSleep(500);
```

But, has that not been enough? Have you wanted to sleep _synchronously_, rather than _asynchronously_? Ever wanted to just pause the NodeJS thread for a given amount of time?

Preferably without busy waiting like `while (Date.now() < someLimit) {}`?

Well, want no further! I have the solution for you!

```js
function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

// sleep for 500 ms
sleep(500);
```

Yes, that's right. Now you can use `sleep` whevever you want in NodeJS!
