// https://github.com/astuyve/lambda-stream
// https://docs.aws.amazon.com/lambda/latest/dg/response-streaming-tutorial.html
// https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html

import { promisify } from 'node:util';

const sleep = promisify(setTimeout);
// TODO: ansi
const message = JSON.stringify(
  {
    name: 'acheronfail',
    what: 'Software Engineer',
    email: 'acheronfail@gmail.com',
    social: {
      gitlab: 'https://gitlab.com/acheronfail',
      github: 'https://github.com/acheronfail',
    },
  },
  null,
  2
);
const lines = message.split('\n');
const maxLineLen = lines.reduce((max, line) => Math.max(max, line.length), 0);

export const handler = awslambda.streamifyResponse(async (_event, responseStream, _context) => {
  console.log('# hello');

  // start streaming response
  // responseStream = awslambda.HttpResponseStream.from(responseStream, {
  //   statusCode: 200,
  //   headers: {
  //     foo: 'bar',
  //   },
  // });

  // console.log('# setup stream');

  // do the thing
  for (let i = 0; i <= maxLineLen; ++i) {
    const parts: string[] = [];
    if (i > 0) parts.push('\x1b[F'.repeat(maxLineLen - 1));
    parts.push(...lines.map((line) => (i >= line.length ? line : line.substring(0, i) + '|')).join('\n'));
    responseStream.write(parts.join(''));
    await sleep(100);
  }

  console.log('# finish loop');

  // have a nice day
  responseStream.end();
  // TODO: should be `responseStream.finished()`
  await new Promise((resolve) => responseStream.on('finish', resolve));

  console.log('# complete');
});
