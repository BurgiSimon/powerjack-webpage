import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, fmix, gauss } from '../src/lib/rng.ts';

test('mulberry32(1976) matches the game Rng for the first 5 draws', () => {
  const r = mulberry32(1976);
  // from the game's Rng(1976).next() (core/rng.ts)
  assert.deepEqual(Array.from({ length: 5 }, r),
    [0.5185857235919684, 0.5082261464558542, 0.7140329466201365, 0.5097665323410183, 0.17207102640531957]);
});

test('mulberry32 is stable and stays in [0, 1)', () => {
  const a = mulberry32(7), b = mulberry32(7);
  for (let i = 0; i < 1000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});

test('fmix is murmur3 fmix32', () => {
  assert.equal(fmix(0), 0);
  assert.equal(fmix(1), 1364076727);
  assert.equal(fmix(1976), 929783196);
});

test('gauss is a standard normal', () => {
  const r = mulberry32(1976), n = 20000, xs = Array.from({ length: n }, () => gauss(r));
  const mean = xs.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
  assert.ok(Math.abs(mean) < .03, `mean ${mean}`);
  assert.ok(Math.abs(sd - 1) < .03, `sd ${sd}`);
  assert.ok(xs.every(Number.isFinite));
});
