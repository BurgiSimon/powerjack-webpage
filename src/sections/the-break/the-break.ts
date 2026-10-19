import './the-break.css';
import { gsap, ScrollTrigger, Q } from '../../core/motion';
import { AVIF } from '../../core/media';
import { order } from '../../lib/order';
import type { Init } from '../../core/types';

const N = 60;   // media/seq/break-000 … 059, 1280×720, the game's own break

// sixty real frames on a 2D canvas, scrubbed by the pin; frames stream in coarse-to-fine, the nearest loaded one stands in
export const init: Init = () => {
  const sec = document.getElementById('the-break')!, cv = sec.querySelector<HTMLCanvasElement>('.tb__seq')!, g = cv.getContext('2d')!;
  const got: HTMLImageElement[] = [];
  let want = 0, shown = -1, started = false;
  const draw = (i: number) => {
    want = i;
    for (let d = 0; d < N; d++) for (const j of [i - d, i + d]) if (got[j]) {
      if (j !== shown) { g.drawImage(got[j], 0, 0); shown = j; }
      return;
    }
  };
  const load = async () => {
    if (started) return;
    started = true;
    const ext = (await AVIF) ? 'avif' : 'webp', q = order(N);
    const next = async (): Promise<void> => {
      const i = q.shift();
      if (i === undefined) return;
      const im = new Image();
      im.src = `media/seq/break-${String(i).padStart(3, '0')}.${ext}`;
      try { await im.decode(); got[i] = im; draw(want); } catch { /* a frame that fails leaves its neighbour standing in */ }
      return next();
    };
    for (let k = 0; k < 6; k++) next();   // six in flight
  };

  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    // the break sits two viewports down, so 200 % would fire at load: start once the visitor scrolls; any toggle, so a page restored below loads too
    ScrollTrigger.create({ trigger: sec, start: 'top 175%', onToggle: load });
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom',   // the sticky stretch (.pin in base.css)
      onUpdate: (s) => draw(Math.round(s.progress * (N - 1))) });
  });
  return () => mm.revert();
};
