import { STILL } from './motion';

export const CAN_PLAY = !STILL && !matchMedia('(prefers-reduced-motion: reduce)').matches;

// a clip dissolves in over its still on its first real frame; a clip that cannot play leaves the still standing
export function play(v: HTMLVideoElement): void {
  if (!CAN_PLAY) return;
  if (v.ended) v.currentTime = 0;
  v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });
  v.play().catch(() => {});
}

export function initClips(): void {
  if (!CAN_PLAY) return;
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      const v = e.target as HTMLVideoElement;
      if (e.intersectionRatio >= .5) play(v); else v.pause();
    }
  }, { threshold: [0, .5] });
  const go = () => document.querySelectorAll<HTMLVideoElement>('video[data-clip]:not([data-manual])').forEach((v) => io.observe(v));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}
