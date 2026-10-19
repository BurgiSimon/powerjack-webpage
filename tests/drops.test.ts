import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dropsMap, drips } from '../src/fx/drops.ts';

test('dropsMap: 512² RGBA, dry glass is (128, 128, 0, 90), beads are wet with a bounded normal, and it is the same every time', () => {
  const d = dropsMap();
  assert.equal(d.length, 512 * 512 * 4);
  let dry = 0, wet = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 90) { dry++; assert.deepEqual([d[i], d[i + 1], d[i + 2]], [128, 128, 0]); continue; }
    wet++; assert.equal(d[i + 3], 255);
    assert.ok(d[i] >= 13 && d[i] <= 243 && d[i + 1] >= 13 && d[i + 1] <= 243);
  }
  assert.ok(wet > 0.05 * dry && dry > wet, `wet ${wet}, dry ${dry}`);
  assert.deepEqual(dropsMap().slice(0, 4096), d.slice(0, 4096));
});

test('drips: a wipe clears the glass, the clearing mists over, and drips run down', () => {
  const r = drips(256, 128), R = (x: number, y: number) => r.data[4 * (y * 256 + x)];
  r.wipe(.5, .5, 4);
  r.step(1 / 15);
  assert.ok(R(128, 64) >= 250, 'wiped spot is clear');
  for (let i = 0; i < 15 * 20; i++) r.step(1 / 15);          // 20 s later
  assert.ok(R(128, 64) < 60 && R(128, 64) > 0, 'misting over, not yet gone');
  let trail = 0;
  for (let i = 0; i < r.data.length; i += 4) if (r.data[i] > 0) trail++;
  assert.ok(trail > 200, 'drips have left trails');
});
