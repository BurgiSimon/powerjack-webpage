import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// §G.4 Accessibility (axe: 0 serious/critical) and Keyboard.

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

  test('the first Tab lands on the skip link', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to the page');
  });

  test('the matchbook opens with Enter, closes with Esc, and gives focus back', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.hdr__menu');
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#matchbook')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#matchbook')).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('a chapter in the matchbook focuses its section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hdr__menu').click();
    await page.locator('#matchbook a[href="#same-pot"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#matchbook')).toBeHidden();
    await expect(page.locator('#same-pot')).toBeFocused({ timeout: 5000 });
  });

  test('arrow keys change Jack', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="jack"][value="regular"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('input[name="jack"][value="shark"]')).toBeChecked();
  });

  test('slider arrows step the break one frame', async ({ page }, info) => {
    test.skip(info.project.name === 'reduced', 'the scrubber is part of the motion branch; reduced motion shows the stills');
    await page.goto('/');
    const s = page.locator('#break-scrub');
    await s.focus();
    await page.keyboard.press('ArrowRight');
    await expect(s).toHaveValue('2');
  });

  test('Turn over toggles a print', async ({ page }) => {
    test.fixme(true, 'core/paper.ts lands in P4; un-fixme it then');
    await page.goto('/');
    const b = page.locator('.print__turn').first();
    await b.focus();
    await page.keyboard.press('Enter');
    await expect(b).toHaveAttribute('aria-pressed', 'true');
  });
});
