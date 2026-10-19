import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Sandboxes without Playwright's own download ship a system Chromium; CI installs the bundled one.
const sys = '/opt/pw-browsers/chromium';
const executablePath = process.env.PW_CHROMIUM ?? (existsSync(sys) ? sys : undefined);
const chromium = { ...devices['Desktop Chrome'], launchOptions: { executablePath } };
const desk = { width: 1440, height: 900 };
// PW_BASE_URL points QA at an already-running preview (a private port in a shared checkout)
const baseURL = process.env.PW_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: 'qa',
  outputDir: 'test-results',
  reporter: [['list']],
  webServer: process.env.PW_BASE_URL ? undefined : { command: 'npm run preview', url: baseURL, reuseExistingServer: true },
  use: { baseURL },
  projects: [
    { name: 'desktop', use: { ...chromium, viewport: desk } },
    { name: 'phone', use: { ...chromium, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'reduced', use: { ...chromium, viewport: desk, reducedMotion: 'reduce' } },
    { name: 'webkit', grep: /@smoke/, use: { ...devices['Desktop Safari'], viewport: desk } },
    { name: 'firefox', grep: /@smoke/, use: { ...devices['Desktop Firefox'], viewport: desk } },
  ],
});
