import './get-down.css';
import { gsap, ScrollTrigger, Q, reveal } from '../../core/motion';
import { play } from '../../core/clip';
import type { Init } from '../../core/types';

export const init: Init = () => {
  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    const sec = document.getElementById('get-down')!, v = sec.querySelector('video');
    reveal(sec.querySelector('h2')!, 'top -20%', sec);
    // the words leave before the cut: nothing overlays the break
    gsap.to('.gd__copy', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#the-break', start: 'top top', end: 'top -12%', scrub: true } });
    // the stage sticks, so it is "in view" (to an observer) a viewport before it shows: the shot starts with its dissolve
    // and stops once the break has covered it; it plays once per entry (core/clip: an ended clip restarts from 0)
    if (v) {
      ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onToggle: (s) => (s.isActive ? play(v) : v.pause()) });
      return;   // the clip is the shot; the crane only stands in for it
    }
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom 135%', scrub: true } })
      .fromTo('.gd__dim', { autoAlpha: .8 }, { autoAlpha: 0, duration: .35 }, 0)                       // the lamps come on
      .fromTo('.gd__crane--2', { scale: 1.12, yPercent: -3 }, { scale: 1, yPercent: 0, duration: .4 }, .3)
      .to('.gd__crane--1', { autoAlpha: 0, duration: .25 }, .35)
      .to('.gd__crane--2', { autoAlpha: 0, duration: .25 }, .7);                                       // lands on cue-tip
  });
  return () => mm.revert();
};
