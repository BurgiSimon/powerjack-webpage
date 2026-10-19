import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { video, type Clip } from '../vite.config.ts';

const pub = mkdtempSync(join(tmpdir(), 'pj-pub-'));
mkdirSync(join(pub, 'media/video'), { recursive: true });
for (const f of ['a.mp4', 'a.webm', 'a.webp', 'b.webm']) writeFileSync(join(pub, 'media/video', f), '');
const clip = (name: string, loop = true): Clip => ({ w: 1280, h: 720, loop,
  files: { mp4: `media/video/${name}.mp4`, webm: `media/video/${name}.webm` } });
const clips = { a: clip('a'), b: clip('b') };

test('a present clip becomes a muted <video> with both sources, webm first, loading nothing until it plays', () => {
  const v = video({ name: 'a', class: 'x' }, clips, pub);
  assert.match(v, /^<video class="clip x" data-clip="a" muted playsinline/);
  assert.match(v, / loop preload="none" width="1280" height="720" aria-hidden="true">/);
  assert.match(v, /<source src="media\/video\/a.webm" type="video\/webm"><source src="media\/video\/a.mp4" type="video\/mp4"><\/video>$/);
  assert.doesNotMatch(v, /poster|data-manual/);
});

test('a poster only when the manifest lists one that is on disk', () => {
  assert.match(video({ name: 'a' }, { a: { ...clip('a'), poster: 'media/video/a.webp' } }, pub), / preload="none" data-poster="media\/video\/a.webp" width/);
  assert.doesNotMatch(video({ name: 'a' }, { a: { ...clip('a'), poster: 'media/video/gone.webp' } }, pub), /poster/);
});

test('manual clips: data-manual, preload none, loop only from the manifest', () => {
  const v = video({ name: 'a', manual: '' }, { a: clip('a', false) }, pub);
  assert.match(v, /data-clip="a" data-manual muted/);
  assert.match(v, /preload="none"/);
  assert.doesNotMatch(v, / loop/);
});

test('an absent name, a missing file and no manifest all expand to nothing', () => {
  assert.equal(video({ name: 'nope' }, clips, pub), '');
  assert.equal(video({ name: 'b' }, clips, pub), '');    // b.mp4 is not on disk
  assert.equal(video({ name: 'a' }, null, pub), '');
});
