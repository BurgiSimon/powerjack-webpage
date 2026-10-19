import { test, expect, type Page } from '@playwright/test';

// SPEC2 §8 Screenshots: every scene once dissolved in, plus halfway through its hold → qa/out/, judged by eye
// (the lit table is never under the title; nothing overlays the break).
// Console: zero errors and warnings, no 4xx, on load and after a full scroll (all projects, the @smoke browsers too).

const scrollThrough = async (page: Page) => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(40); }
};

test('loads and scrolls with a clean console @smoke', async ({ page }) => {
  const bad: string[] = [];
  // GL driver notes are the test machine's software compositor reading the canvas back, not the page's own errors
  page.on('console', (m) => { if (/error|warning/.test(m.type()) && !/GL Driver Message \(.*Performance/.test(m.text())) bad.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto('/?qa');
  await scrollThrough(page);
  expect(bad).toEqual([]);
});

test('scene screenshots', async ({ page }, info) => {
  await page.goto('/?qa');
  await scrollThrough(page);   // lazy frames load on the way down
  await page.evaluate(() => document.fonts.ready);
  const ids = await page.$$eval('main section.scene[id]', (els) => els.map((e) => e.id));
  expect(ids).toEqual(['fulton', 'get-down', 'the-break', 'sign', 'last-call']);
  for (const id of ids) {
    // in motion a scene starts dissolving in at its top (over --fade, 35 % of a viewport) and holds for its extra height
    const at = await page.evaluate((id) => {
      const s = document.getElementById(id)!, r = s.getBoundingClientRect(), top = r.top + scrollY, extra = r.height - innerHeight;
      return { top: top + (s.previousElementSibling && extra > 1 ? innerHeight * .35 : 0), mid: extra > 1 ? top + extra / 2 : null };
    }, id);
    await page.evaluate((y) => window.scrollTo(0, y), at.top);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `qa/out/${info.project.name}-${id}.png` });
    if (at.mid !== null) {
      await page.evaluate((y) => window.scrollTo(0, y), at.mid);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `qa/out/${info.project.name}-${id}-mid.png` });
    }
  }
});
