import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// SPEC2 §8 Accessibility (axe: 0 serious/critical), keyboard, and a silent page.

for (const path of ['/', '/404.html']) {
  test(`axe: no serious or critical issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(bad).toEqual([]);
  });
}

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard walk-through runs on the desktop projects');

  test('Tab 1 is the skip link, Tab 2 is Motion', async ({ page }, info) => {
    test.skip(info.project.name === 'reduced', 'under reduced motion the OS setting is the switch, so Motion is hidden');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to the page');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAccessibleName('Motion');
  });

  test('Motion turns the page still across a reload, and back', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'the switch is hidden under OS reduced motion');
    await page.goto('/');
    const b = page.locator('.hdr__motion');
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await Promise.all([page.waitForEvent('load'), b.click()]);
    await expect(page.locator('html')).toHaveClass(/\bstill\b/);
    await expect(b).toHaveAttribute('aria-pressed', 'false');
    await Promise.all([page.waitForEvent('load'), b.click()]);
    await expect(page.locator('html')).not.toHaveClass(/\bstill\b/);
  });
});

test('a silent page: no audio element, no AudioContext through a full scroll', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one run is enough');
  await page.addInitScript(() => {
    for (const k of ['AudioContext', 'webkitAudioContext'] as const) {
      const C = (window as any)[k];
      if (C) (window as any)[k] = class extends C { constructor(...a: any[]) { super(...a); (window as any).__audio = ((window as any).__audio ?? 0) + 1; } };
    }
  });
  await page.goto('/');
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(30); }
  await page.mouse.click(700, 450);
  expect(await page.evaluate(() => (window as any).__audio ?? 0)).toBe(0);
  await expect(page.locator('audio')).toHaveCount(0);
});
