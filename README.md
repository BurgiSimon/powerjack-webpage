# Powerjack — the website

The promo site for Powerjack, a first-person pool game set in a Chicago corner tavern at 1:40 a.m., 1976 (in development).
Five scenes, no lecture: every picture and clip is a frame the game rendered. Vite, TypeScript, GSAP and Lenis; no framework.

```
npm ci
npm run dev        # http://localhost:5173
npm run check      # unit tests, build, Playwright QA (axe, keyboard, reduced motion, copy, perf)
```

Deploys to GitHub Pages from `main` (`.github/workflows/pages.yml`); set Settings → Pages → Source to "GitHub Actions" once.
Third-party files and their licences: `public/LICENSES.txt`.
