import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// §G.4 Copy: the built page never promises what does not exist (§E.16), and says what does.
// PJ_DIST lets a shared checkout check a private build directory.

test('copy guardrails on the built page', ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'one run is enough: it reads the file, not a browser');
  const html = readFileSync(`${process.env.PJ_DIST ?? 'dist'}/index.html`, 'utf8');
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const banned: [RegExp, string][] = [
    [/wishlist/i, 'wishlist'], [/play now/i, 'play now'], [/galliano/i, 'a real brand'], [/buy yourself a kessler/i, 'Kessler ad'],
    [/\b10 m\/s/, '10 m/s'], [/(?<!nothing to )sign up/i, 'sign up as an offer'], [/(?<!no )matchmaking/i, 'matchmaking'],
    [/(?<!(no|a) )public server/i, 'a public server'], [/(?<!no )release date/i, 'a release date'],
    [/\b(out|coming|available|launch(es|ing)?) (on|in) (19|20)\d\d\b/i, 'a release date'], [/price[sd]? (at|from) \$/i, 'a price'],
  ];
  const hits = banned.filter(([re]) => re.test(text)).map(([re, why]) => `${why}: ${text.match(re)![0]}`);
  expect(hits).toEqual([]);
  for (const must of ['Doors open soon.', '2281e03a', 'In development']) expect(text).toContain(must);
});
