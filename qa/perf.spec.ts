import { test, expect } from '@playwright/test';

// SPEC2 §8 Performance: the LCP is the hero (still or title), nothing shifts, and the first view stays under 1.5 MB.

test('LCP is in the hero, CLS < .01, first view ≤ 1.5 MB', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  await page.addInitScript(() => {
    const w = window as any;
    w.__cls = 0; w.__lcp = null;
    // scenes hold by native sticky (base.css), not fixed pins, so every shift counts
    new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) w.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1) as any; if (e) w.__lcp = e.element; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/');
  await page.waitForTimeout(4000);   // load + 4 s idle, no scroll: the hero clip and the glass have started
  const bytes = await page.evaluate(() => (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    .reduce((s, r) => s + r.transferSize, (performance.getEntriesByType('navigation')[0] as PerformanceResourceTiming).transferSize));
  expect(bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  // Chrome takes an image covering the whole viewport for a background and skips it, so the LCP is the hero still or,
  // as here at 100svh, its title (painted with the first frame); never a clip, the glass or a later scene
  expect(await page.evaluate(() => { const e = (window as any).__lcp as Element | null; return !!e?.matches('#fulton img, #fulton .fulton__title *'); })).toBe(true);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 450) { await page.mouse.wheel(0, 450); await page.waitForTimeout(60); }
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__cls)).toBeLessThan(.01);
});
