import { test, expect } from '@playwright/test';

// SPEC2 §5/§8 Reduced motion (one static branch) and length. In motion the page is one continuous shot: every scene's stage
// sticks while the next dissolves in over it (base.css), so a held scene is taller than the viewport with a sticky stage.

const sticky = () => [...document.querySelectorAll('main > section')]
  .filter((s) => s.getBoundingClientRect().height > innerHeight + 1 && getComputedStyle(s.querySelector('.stage')!).position === 'sticky').map((s) => s.id).sort();

test('reduced motion: no pins, no live canvas, clips never start, no hidden text', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced', 'reduced project only');
  await page.goto('/?qa');
  await page.waitForFunction(() => (window as any).__pj);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(sticky)).toEqual([]);
  await expect(page.locator('canvas[data-live]')).toHaveCount(0);
  expect(await page.$$eval('video', (vs) => vs.filter((v) => !v.paused || v.currentTime !== 0).length)).toBe(0);
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
  expect(await page.evaluate(() => document.documentElement.scrollHeight / innerHeight)).toBeCloseTo(5, 1);
});

test('every scene holds its frame, at most six viewports, one glass at most', async ({ page }, info) => {
  test.skip(!['desktop', 'phone'].includes(info.project.name), 'desktop and phone projects');
  await page.goto('/?qa');
  await page.waitForFunction(() => (window as any).__pj);
  expect(await page.evaluate(sticky)).toEqual(['fulton', 'get-down', 'last-call', 'sign', 'the-break']);
  expect(await page.evaluate(() => document.documentElement.scrollHeight / innerHeight)).toBeLessThanOrEqual(6);
  for (let i = 0; i < 6; i++) {
    expect(await page.locator('canvas[data-live]').count()).toBeLessThanOrEqual(1);
    await page.waitForTimeout(500);
  }
});
