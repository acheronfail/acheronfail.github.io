#!/usr/bin/env bun

import cp from 'child_process';

function parseDate(input: string): Date {
  const date = new Date(/^[0-9]+$/.test(input) ? parseInt(input) : input);
  if (isNaN(date.getTime())) error(`Invalid date: ${input}`);
  return date;
}

function rfc2822(date: Date): string {
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const getDayName = (date: Date) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const getMonthName = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const getTime = (date: Date) => [pad2(date.getHours()), pad2(date.getMinutes()), pad2(date.getSeconds())].join(':');
  const getTimeZone = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const absOffset = Math.abs(offset);
    return offset ? [offset < 0 ? '+' : '-', pad2(Math.floor(absOffset / 60)), pad2(absOffset % 60)].join('') : '+0000';
  };

  return [
    `${getDayName(date)},`,
    date.getDate(),
    getMonthName(date),
    date.getFullYear(),
    getTime(date),
    getTimeZone(date),
  ].join(' ');
}

function error(msg: string): never {
  console.error(msg);
  process.exit(1);
}

(function main() {
  const inputDate = process.argv[2];
  if (!inputDate) error('Please provide an ISO date string or milliseconds');

  const gitDate = rfc2822(parseDate(inputDate));
  const result = cp.spawn('git', ['commit'], {
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: gitDate,
      GIT_COMMITTER_DATE: gitDate,
    },
    stdio: 'inherit',
  });

  result.on('exit', (code, signal) => (process.exitCode = code ?? signal ? 1 : 0));
})();
