#!/usr/bin/env node
// public/og.jpg (1200 × 630, ≤ 150 KB): a screenshot of tools/og.html with Playwright.
//   node tools/og.mjs   (PW_CHROMIUM=<path> if Playwright's own Chromium isn't installed)
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), out = join(ROOT, 'public/og.jpg');
const bundled = chromium.executablePath();
const executablePath = existsSync(bundled) ? undefined : [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium'].find(p => p && existsSync(p));
const browser = await chromium.launch({ executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(join(ROOT, 'tools/og.html')).href);
  await page.evaluate(async () => { await document.fonts.ready; await document.querySelector('img').decode(); });
  for (let q = 88; q >= 60; q -= 4) {   // the best quality that fits the 150 KB budget
    await page.screenshot({ path: out, type: 'jpeg', quality: q });
    if (statSync(out).size <= 150_000) break;
  }
} finally { await browser.close(); }
const kb = statSync(out).size / 1000;
if (kb > 150) throw new Error(`og.jpg is ${kb} KB`);
console.log(`og.jpg ${kb.toFixed(0)} KB`);
