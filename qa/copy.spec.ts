import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// SPEC2 §1/§8 Copy: the built page never promises what does not exist, says what does, and says very little.
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
    [/No aim line/i, 'the line the frame already says'], [/Thunder/i, 'the chalk word'],
  ];
  const hits = banned.filter(([re]) => re.test(text)).map(([re, why]) => `${why}: ${text.match(re)![0]}`);
  expect(hits).toEqual([]);
  for (const must of ['Powerjack', 'Thursday, 1:40 a.m. One table still lit.', 'In development', 'Just the cue.',
    'Don’t mind the cold spot. That’s just me.', 'Old Jack', 'Doors open soon.', 'Play Old Jack. Or a friend, online.',
    'Game footage · effects added here']) expect(text).toContain(must);
});

test('the page says at most 40 words, and lists nothing', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the words are the same in every project');
  await page.goto('/');
  const words = await page.evaluate(() => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), out: string[] = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode())
      if (!n.parentElement!.closest('.lc__foot, .skip, script, style')) out.push(...(n.textContent!.match(/[\p{L}\p{N}][^\s—]*/gu) ?? []));
    return out;
  });
  expect(words.length + 2).toBeLessThanOrEqual(40);   // + the toggle's CSS-drawn "· On"
  await expect(page.locator('main :is(ul, ol, table, dialog, details)')).toHaveCount(0);
});
