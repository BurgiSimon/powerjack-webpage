import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';

type Frame = { w: number; h: number; sizes: number[]; focal: [number, number]; ph: string; alt: string };
type Neon = { band: [number, number, number, number]; letters: { ch: string; pts: [number, number][] }[] };
const json = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8'));
const SITE = process.env.SITE_URL ?? './';                       // set by the Pages workflow; './' locally
const now = new Date(), pad = (n: number) => String(n).padStart(2, '0');
const DATE76 = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/76`;
const MON76 = `${now.toLocaleString('en-US', { month: 'short' }).toUpperCase()} · 76`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attrs = (s: string) => Object.fromEntries([...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m => [m[1], m[2] ?? '']));

function frame(a: Record<string, string>, frames: Record<string, Frame>): string {
  const f = frames[a.name], p = a.portrait ? frames[a.portrait] : undefined;
  if (!f || (a.portrait && !p)) throw new Error(`<pj-frame>: unknown frame "${a.name}" or portrait "${a.portrait}"`);
  const sizes = a.sizes || '100vw';
  const set = (n: string, fr: Frame, media = '') => (['avif', 'webp'] as const).map(t => `<source${media ? ` media="${media}"` : ''}` +
    ` type="image/${t}" sizes="${sizes}" srcset="${fr.sizes.map(w => `media/frames/${n}-${w}.${t} ${w}w`).join(', ')}">`).join('');
  const style = `object-position:${a.focal || `${f.focal[0] * 100}% ${f.focal[1] * 100}%`}` + ('noph' in a ? '' : `;background-image:url(${f.ph})`);
  return `<picture${a.class ? ` class="${a.class}"` : ''}>` +
    (p ? set(a.portrait, p, '(max-width: 899.98px) and (orientation: portrait)') : '') + set(a.name, f) +
    `<img src="media/frames/${a.name}-${f.sizes[0]}.webp" width="${f.w}" height="${f.h}" alt="${esc(a.alt ?? f.alt)}"` +
    ('eager' in a ? ' fetchpriority="high"' : ' loading="lazy"') + ` decoding="async" style="${style}"></picture>`;
}

function sign(a: Record<string, string>, frames: Record<string, Frame>, neon: Neon | null): string {
  const lit = frame({ name: 'jukebox-neon', class: 'sign__lit', ...('quiet' in a ? { alt: '' } : {}) }, frames);
  if (!neon || !frames['jukebox-neon-off']) return `<div class="sign" data-sign="${a.id}"><div class="sign__box">${lit}</div></div>`;
  const [x, y, w, h] = neon.band, id = a.id;
  const img = (src: string, cls: string, i: number) => `<image class="${cls}" href="media/frames/${src}.webp" x="${x}" y="${y}"` +
    ` width="${w}" height="${h}" clip-path="url(#${id}-l${i})" opacity="0"/>`;
  return `<div class="sign" data-sign="${id}"><div class="sign__box">` +
    frame({ name: 'jukebox-neon-off', class: 'sign__off', alt: '', noph: '' }, frames) + lit +
    `<svg class="sign__letters" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>` +
    neon.letters.map((l, i) => `<clipPath id="${id}-l${i}"><polygon points="${l.pts.map(p => p.join(',')).join(' ')}"/></clipPath>`).join('') +
    `</defs>` + neon.letters.map((_, i) => img('jukebox-neon-band', 'sign__on', i)).join('') +
    img('jukebox-neon-off-band', 'sign__joff', 5) + `</svg></div></div>`;
}

const partials = (): Plugin => ({
  name: 'pj-partials',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      const frames = json<Record<string, Frame>>('src/data/frames.json');
      const neon = existsSync('src/data/neon.json') ? json<Neon>('src/data/neon.json') : null;
      return html
        .replace(/<!--\s*@include ([\w-]+)\s*-->/g, (_, id: string) => readFileSync(`src/sections/${id}/${id}.html`, 'utf8'))
        .replace(/<pj-frame([^>]*)><\/pj-frame>/g, (_, s: string) => frame(attrs(s), frames))
        .replace(/<pj-sign([^>]*)><\/pj-sign>/g, (_, s: string) => sign(attrs(s), frames, neon))
        .replaceAll('%DATE76%', DATE76).replaceAll('%MON76%', MON76).replaceAll('%SITE_URL%', SITE);
    },
  },
  handleHotUpdate({ file, server }) {   // partials and data are read by hand, so reload the page when they change
    if (/[\\/]src[\\/](sections|data)[\\/].*\.(html|json)$/.test(file)) server.ws.send({ type: 'full-reload' });
  },
});

const preloadFonts = (): Plugin => ({
  name: 'pj-preload-fonts',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      if (!ctx.bundle || !ctx.path.endsWith('index.html')) return html;
      const want = [/fraunces-latin-soft-normal.*\.woff2$/, /barlow-condensed-latin-600-normal.*\.woff2$/];
      return { html, tags: Object.keys(ctx.bundle).filter(f => want.some(r => r.test(f))).map(f => ({ tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `./${f}` }, injectTo: 'head' as const })) };
    },
  },
});

export default defineConfig({
  base: './',
  plugins: [partials(), preloadFonts()],
  build: { target: 'es2022', rolldownOptions: { input: { main: 'index.html', notFound: '404.html' } } },
});
