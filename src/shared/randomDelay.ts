import { ok } from 'node:assert';

const ARC_ENV = process.env.ARC_ENV;
ok(ARC_ENV, 'Missing ARC_ENV');

export function delayRandomly() {
  if (ARC_ENV === 'testing') {
    return Promise.resolve();
  }

  const delay = 500 + Math.random() * 1500;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
