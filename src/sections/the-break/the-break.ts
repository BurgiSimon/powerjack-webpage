import './the-break.css';
import { gsap, ScrollTrigger, Q } from '../../core/motion';
import { AVIF } from '../../core/media';
import { order } from '../../lib/order';
import type { Init } from '../../core/types';

const N = 60;   // media/seq/break-000 … 059, 1280×720, the game's own break

// sixty real frames on a 2D canvas, scrubbed through the scene's hold; frames stream in coarse-to-fine, the nearest loaded one stands in
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
  mm.add({ go: Q.motion, tall: '(max-aspect-ratio: 3/4)' }, (c) => {
    if (!c.conditions!.go) return;
    // the break is the third scene, so a trigger further out would fire at load: start once the visitor scrolls; any toggle,
    // so a page restored below loads too
    ScrollTrigger.create({ trigger: sec, start: 'top 140%', onToggle: load });
    // half dissolved in → the end of the hold (base.css): sixty frames, then the last one holds while the sign comes in
    const range = { trigger: sec, start: 'top -15%', end: 'bottom 135%' };
    ScrollTrigger.create({ ...range, onUpdate: (s) => draw(Math.round(s.progress * (N - 1))) });
    // a portrait screen shows a quarter of the frame: the camera pans left with the burst
    if (c.conditions!.tall) gsap.fromTo(cv, { objectPosition: '64% 60%' }, { objectPosition: '42% 60%', ease: 'none', scrollTrigger: { ...range, scrub: true } });
    // the cut to the sign: the camera tilts up off the table (zooming just enough that the frame's top edge never shows)
    gsap.to(sec.querySelector('.stage'), { yPercent: 10, scale: 1.1, transformOrigin: '50% 100%', ease: 'none',
      scrollTrigger: { trigger: '#sign', start: 'top top', end: 'top -35%', scrub: true } });
  });
  return () => mm.revert();
};
