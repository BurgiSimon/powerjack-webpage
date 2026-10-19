#!/usr/bin/env node
// The favicon: the game's 8-ball, its "8" drawn as two stroked circles so it never depends on a system font.
// Writes public/favicon.svg and renders favicon-32.png and apple-touch-icon.png (180, on ink) with Playwright.
//   node tools/icons.mjs   (PW_CHROMIUM=<path> if Playwright's own Chromium isn't installed)
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), PUB = join(ROOT, 'public');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#141414"/>` +
  `<circle cx="16" cy="16" r="7" fill="#EFE4CC"/><g fill="none" stroke="#141414" stroke-width="1.6">` +
  `<circle cx="16" cy="13.6" r="2.4"/><circle cx="16" cy="18.6" r="2.9"/></g></svg>\n`;
writeFileSync(join(PUB, 'favicon.svg'), svg);

const bundled = chromium.executablePath();
const executablePath = existsSync(bundled) ? undefined : [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium'].find(p => p && existsSync(p));
const browser = await chromium.launch({ executablePath });
try {
  for (const [file, size, pad, bg] of [['favicon-32.png', 32, 0, 'transparent'], ['apple-touch-icon.png', 180, 18, '#17110C']]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0;background:${bg}}img{display:block;margin:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px}</style>` +
      `<img src="data:image/svg+xml,${encodeURIComponent(svg)}" alt="">`);
    await page.locator('img').evaluate(i => i.decode());
    await page.screenshot({ path: join(PUB, file), omitBackground: bg === 'transparent' });
    await page.close();
  }
} finally { await browser.close(); }
console.log('icons: favicon.svg, favicon-32.png, apple-touch-icon.png');
