import { test, expect } from '@playwright/test';

// §G.4 Reduced motion, Pins and length.

test('reduced motion: no pins, no live canvas, no hidden text', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced', 'reduced project only');
  await page.goto('/?qa');
  await page.waitForFunction(() => (window as any).__pj);
  expect(await page.evaluate(() => (window as any).__pj.ScrollTrigger.getAll().every((t: any) => !t.pin))).toBe(true);
  await expect(page.locator('canvas[data-live]')).toHaveCount(0);
  const hidden = await page.evaluate(() => {
    const out: string[] = [], walk = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement!;
      if (!n.textContent!.trim() || el.closest('[aria-hidden="true"]') || !el.getClientRects().length) continue;   // decoration or not rendered
      for (let a: Element | null = el; a; a = a.parentElement) if (getComputedStyle(a).opacity === '0') { out.push(n.textContent!.trim().slice(0, 40)); break; }
    }
    return out;
  });
  expect(hidden).toEqual([]);
});

test('pins and length', async ({ page }, info) => {
  test.skip(!['desktop', 'phone'].includes(info.project.name), 'desktop and phone projects');
  await page.goto('/?qa');
  await page.waitForFunction(() => (window as any).__pj);
  const pins = await page.evaluate(() => (window as any).__pj.ScrollTrigger.getAll().filter((t: any) => t.pin).length);
  expect(pins).toBeLessThanOrEqual(info.project.name === 'desktop' ? 5 : 3);   // exactly 5 / 3 at launch
  if (info.project.name === 'desktop') {
    expect(await page.evaluate(() => document.documentElement.scrollHeight / innerHeight)).toBeLessThanOrEqual(17);
  }
});
