import './sign.css';
import { gsap, Q, reveal } from '../../core/motion';
import { play } from '../../core/clip';
import type { Init } from '../../core/types';

// Old Jack's haze drifts up past the dark sign, then the sign wakes (V5) and stays lit
export const init: Init = () => {
  const sec = document.getElementById('sign')!, q = <T extends Element>(s: string) => sec.querySelector<T>(s);
  const wake = q<HTMLVideoElement>('.sg__wake video');
  const smoke = sec.querySelectorAll('.sg__smoke');

  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    // the stills' own wake-up, timed, not scrubbed (a sign switches on, it does not dim up with your thumb): for no V5, or a V5
    // the browser refused to play (paused right after play(), e.g. iOS Low Power Mode), so the sign never stays dark
    const fade = gsap.to(q('.sg__off'), { autoAlpha: 0, duration: 1.4, paused: true });
    let woken = false;
    // a V5 that cannot load (every <source> fails, the last one reports it) leaves the wake-up to the stills too
    const src = wake?.querySelector('source:last-of-type'), failed = () => { if (woken) fade.play(); };
    src?.addEventListener('error', failed);
    // its own dissolve → the end of its hold (base.css): the haze rises as the sign comes in, and it wakes once it is all there
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom 135%', scrub: 1,
      onUpdate: (s) => {
        if (!woken && s.progress >= .45) {
          woken = true;
          if (wake) play(wake);
          if (!wake || wake.paused || wake.networkState === wake.NETWORK_NO_SOURCE) fade.play();
        } else if (woken && s.progress < .4) {
          woken = false;
          fade.reverse();
          if (wake) { wake.pause(); wake.currentTime = 0; wake.classList.remove('is-on'); }
        }
      } } });
    tl.fromTo(smoke, { autoAlpha: 0, y: '30vh', x: 0, scale: .8 }, { autoAlpha: .5, y: '-5vh', x: '12vw', scale: 1.7, duration: .55, stagger: .08 }, 0)
      .to(smoke, { autoAlpha: .15, y: '-30vh', x: '18vw', scale: 2.1, duration: .37, stagger: .08 }, .55);

    // with the wake (45 % of the hold)
    reveal(q('.sg__quote p')!, 'top -38%', sec);
    gsap.from(q('.sg__quote figcaption'), { opacity: 0, duration: .9, delay: .3, scrollTrigger: { trigger: sec, start: 'top -38%', once: true } });
    // and leaves before the cut to last call
    gsap.to(q('.sg__quote'), { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#last-call', start: 'top top', end: 'top -12%', scrub: true } });
    return () => src?.removeEventListener('error', failed);
  });
  return () => mm.revert();
};
