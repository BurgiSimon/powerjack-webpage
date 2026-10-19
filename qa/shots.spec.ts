import { test, expect, type Page } from '@playwright/test';

// §G.4 Screenshots: every section top, plus mid-pin for pinned ones → qa/out/, reviewed by eye against §D.
// §G.4 Console: zero errors and warnings on load and after a full scroll (all projects, the @smoke browsers too).

const scrollThrough = async (page: Page) => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(40); }
};

test('loads and scrolls with a clean console @smoke', async ({ page }) => {
  const bad: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') bad.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto('/?qa');
  await scrollThrough(page);
  expect(bad).toEqual([]);
});

test('section screenshots', async ({ page }, info) => {
  await page.goto('/?qa');
  await scrollThrough(page);   // lazy frames load on the way down
  await page.evaluate(() => document.fonts.ready);
  const ids = await page.$$eval('main > section[id], body > footer[id]', (els) => els.map((e) => e.id));
  for (const id of ids) {
    // a pinned section measures from its pin spacer; mid-pin is halfway through its trigger
    const at = await page.evaluate((id) => {
      const el = document.getElementById(id)!, box = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
      const st = (window as any).__pj?.ScrollTrigger?.getAll().find((t: any) => t.pin && el.contains(t.trigger));
      return { top: box.getBoundingClientRect().top + scrollY, mid: st ? (st.start + st.end) / 2 : null };
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
  expect(ids.length).toBe(11);
});
