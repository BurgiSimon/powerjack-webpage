import { test } from 'node:test';
import assert from 'node:assert/strict';
import { order } from '../src/lib/order.ts';

test('order(60) is a permutation of 0…59 that starts at the ends, then the middle', () => {
  const o = order(60);
  assert.deepEqual(o.slice(0, 3), [0, 59, 30]);
  assert.deepEqual([...o].sort((a, b) => a - b), Array.from({ length: 60 }, (_, i) => i));
});

test('every prefix of 2^k + 1 frames covers 0…59 with gaps ≤ ⌈59 / 2^k⌉', () => {
  const o = order(60);
  for (let k = 0; 2 ** k + 1 <= 60; k++) {
    const p = o.slice(0, 2 ** k + 1).sort((a, b) => a - b);
    const gap = Math.max(...p.slice(1).map((v, i) => v - p[i]));
    assert.ok(p[0] === 0 && p.at(-1) === 59 && gap <= Math.ceil(59 / 2 ** k), `k ${k}: gap ${gap}`);
  }
});

test('order handles tiny sequences', () => {
  assert.deepEqual(order(0), []); assert.deepEqual(order(1), [0]); assert.deepEqual(order(2), [0, 1]); assert.deepEqual(order(3), [0, 2, 1]);
});
