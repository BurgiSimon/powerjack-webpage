import './get-down.css';
import { gsap, Q, reveal } from '../../core/motion';
import type { Init } from '../../core/types';

export const init: Init = () => {
  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    const sec = document.getElementById('get-down')!;
    reveal(sec.querySelector('h2')!);
    if (sec.querySelector('video')) return;   // the clip is the shot; the crane only stands in for it
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } })
      .fromTo('.gd__dim', { autoAlpha: .8 }, { autoAlpha: 0, duration: .35 }, 0)                       // the lamps come on
      .fromTo('.gd__crane--2', { scale: 1.12, yPercent: -3 }, { scale: 1, yPercent: 0, duration: .4 }, .3)
      .to('.gd__crane--1', { autoAlpha: 0, duration: .25 }, .35)
      .to('.gd__crane--2', { autoAlpha: 0, duration: .25 }, .7);                                       // lands on cue-tip
  });
  return () => mm.revert();
};
