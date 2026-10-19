import './last-call.css';
import { gsap, Q, reveal } from '../../core/motion';
import type { Init } from '../../core/types';

// the page's end: the rain on the window settles in as you arrive, the two lines rise; V4 loops via core/clip
export const init: Init = () => {
  const sec = document.getElementById('last-call')!;
  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    gsap.fromTo(sec.querySelector('.lc__media'), { scale: 1.08 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true } });   // its dissolve → the page's end
    reveal(sec.querySelector('h2')!, 'top -20%', sec);   // the stage sticks: time the words by the scene, not their own box
    reveal(sec.querySelector('.lc__line')!, 'top -25%', sec);
  });
  return () => mm.revert();
};
