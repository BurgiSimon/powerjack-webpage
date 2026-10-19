import './fulton.css';
import { gsap, ScrollTrigger, Q } from '../../core/motion';
import { acquireGlass, type Glass } from '../../fx/glass';
import type { Init } from '../../core/types';

export const init: Init = () => {
  const mm = gsap.matchMedia();
  mm.add(Q.motion, () => {
    const sec = document.getElementById('fulton')!, canvas = sec.querySelector('canvas')!, img = sec.querySelector('img')!;
    // in view until the next scene has dissolved over it (base.css: the stage sticks till the section's bottom meets the viewport's)
    const clip = sec.querySelector('video'), view = ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom bottom' });
    gsap.to('.fulton__title', { '--sink': '14vh', opacity: 0, ease: 'none',   // sinks into the mist, quickly: never a ghost over the cloth
      scrollTrigger: { trigger: sec, start: 'top top', end: 'top -20%', scrub: true } });
    // a slow dolly-in toward the table, all the way into the dissolve to the shot
    gsap.to(sec.querySelector('.stage'), { scale: 1.16, transformOrigin: '51% 58%', ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', endTrigger: '#get-down', end: 'top -12%', scrub: true } });

    // the glass waits for load and an idle moment: the still is the LCP, the shader is a bonus
    let glass: Glass | null = null, gone = false;
    const start = () => (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200)))(() => {
      if (gone) return;
      acquireGlass(canvas, img, clip && getComputedStyle(clip).display !== 'none' ? clip : null,
        { phone: matchMedia(Q.mobile).matches, active: () => view.isActive })
        .then((g) => { if (gone) g?.destroy(); else glass = g; });
    }, { timeout: 1500 });
    if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });

    // a finger on the cold glass: a mouse wipes as it moves, a tap (not a scroll) wipes a bigger spot
    let down: PointerEvent | null = null;
    const wipe = (e: PointerEvent, px: number) => {
      const r = canvas.getBoundingClientRect();
      glass?.wipe((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, px);
    };
    const move = (e: PointerEvent) => { if (e.pointerType === 'mouse') wipe(e, 36); };
    const press = (e: PointerEvent) => { down = e; };
    const lift = (e: PointerEvent) => {
      if (down && e.pointerType !== 'mouse' && Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) <= 10) wipe(e, 48);
      down = null;
    };
    sec.addEventListener('pointermove', move); sec.addEventListener('pointerdown', press); sec.addEventListener('pointerup', lift);
    return () => {
      gone = true; removeEventListener('load', start); glass?.destroy(); glass = null;
      sec.removeEventListener('pointermove', move); sec.removeEventListener('pointerdown', press); sec.removeEventListener('pointerup', lift);
    };
  });
  return () => mm.revert();
};
