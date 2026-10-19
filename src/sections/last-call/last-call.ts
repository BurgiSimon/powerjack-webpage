import './last-call.css';
import { gsap, Q, reveal } from '../../core/motion';
import type { Init } from '../../core/types';

// the page's end: the rain on the window settles in as you arrive, the two lines rise; V4 loops via core/clip
export const init: Init = () => {
  const sec = document.getElementById('last-call')!;
  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    gsap.fromTo(sec.querySelector('.lc__media'), { scale: 1.08 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    reveal(sec.querySelector('h2')!);
    reveal(sec.querySelector('.lc__line')!);
  });
  return () => mm.revert();
};
