import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';

type Frame = { w: number; h: number; sizes: number[]; focal: [number, number]; ph: string; alt: string };
export type Clip = { w: number; h: number; loop: boolean; files: { mp4: string; webm: string }; poster?: string };
const json = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8'));
const SITE = process.env.SITE_URL ?? './';                       // set by the Pages workflow; './' locally
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

// <pj-video name class manual> → a muted inline <video>, or nothing when the clip is not on disk (the still underneath stands in).
// A poster is the clip's own first frame, for a clip whose opening shot differs from the still under it (base.css: no
// dissolve); core/clip sets it only in motion, so the static branch never fetches it
export function video(a: Record<string, string>, clips: Record<string, Clip> | null, pub = 'public'): string {
  const c = clips?.[a.name];
  if (!c || !c.files?.webm || !c.files?.mp4 || ![c.files.webm, c.files.mp4].every(f => existsSync(`${pub}/${f}`))) return '';
  return `<video class="clip${a.class ? ` ${a.class}` : ''}" data-clip="${a.name}"${'manual' in a ? ' data-manual' : ''} muted playsinline` +
    ` disablepictureinpicture disableremoteplayback${c.loop ? ' loop' : ''} preload="none"` +
    (c.poster && existsSync(`${pub}/${c.poster}`) ? ` data-poster="${c.poster}"` : '') +
    ` width="${c.w}" height="${c.h}" aria-hidden="true"><source src="${c.files.webm}" type="video/webm">` +
    `<source src="${c.files.mp4}" type="video/mp4"></video>`;
}

const partials = (): Plugin => ({
  name: 'pj-partials',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      const frames = json<Record<string, Frame>>('src/data/frames.json');
      const clips = existsSync('src/data/video.json') ? json<Record<string, Clip>>('src/data/video.json') : null;
      return html
        .replace(/<!--\s*@include ([\w-]+)\s*-->/g, (_, id: string) => {
          const p = `src/sections/${id}/${id}.html`;
          if (existsSync(p)) return readFileSync(p, 'utf8');
          this.warn(`@include ${id}: ${p} is missing`);   // parallel builds: a scene not written yet must not stop the page
          return `<!-- missing: ${id} -->`;
        })
        .replace(/<pj-frame([^>]*)><\/pj-frame>/g, (_, s: string) => frame(attrs(s), frames))
        .replace(/<pj-video([^>]*)><\/pj-video>/g, (_, s: string) => video(attrs(s), clips))
        .replaceAll('%SITE_URL%', SITE);
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
