import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { sound } from './sound';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('house', '.2,.7,.2,1');
gsap.defaults({ ease: 'house', duration: .22 });

export { gsap, ScrollTrigger, SplitText };

// html.still is set by the inline head script before first paint (Less motion)
export const STILL = document.documentElement.classList.contains('still');
export const Q = {
  desk: '(min-width: 900px) and (min-height: 640px)',
  mobile: '(max-width: 899.98px), (max-height: 639.98px)',
  reduce: STILL ? 'all' : '(prefers-reduced-motion: reduce)',
  fine: '(hover: hover) and (pointer: fine)',
};

// one text reveal site-wide; never on text that contains links (aria:'auto' hides them)
export const reveal = (el: Element, trigger: Element = el) => SplitText.create(el, {
  type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto',
  onSplit: (s) => gsap.from(s.lines, { yPercent: 100, duration: .9, stagger: .08, ease: 'house',
    scrollTrigger: { trigger, start: 'top 85%', once: true } }),
});

const wipe = (el: Element, duration: number, steps: number, y = '0') => gsap.fromTo(el,
  { clipPath: `inset(${y} 100% ${y} 0)` }, { clipPath: `inset(${y} 0% ${y} 0)`, duration, ease: `steps(${steps})` });
export const pencil = (el: Element) => wipe(el, .3, 8);
export const chalk = (el: Element) => wipe(el, .25, 9, '-20%');   // the chalk word is tilted: keep its tops and tails
export function type(el: Element, cps = 90) {   // the line must be as wide as its text (inline-block or max-content)
  const n = Math.max(1, el.textContent?.length ?? 1);
  return wipe(el, n / cps, n);
}

const deg = (el: Element, prop: string, fallback: number) => {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(prop));
  return Number.isNaN(v) ? fallback : v;
};
export const drop = (el: Element) => gsap.fromTo(el, { y: -8, rotation: deg(el, '--tilt', -1.5), opacity: 0 },
  { y: 0, rotation: deg(el, '--rest', 0), opacity: 1, duration: .22, ease: 'house' });

export const stamp = (el: Element) => gsap.fromTo(el, { scale: 1.6, rotation: -12, opacity: 0 },
  { scale: 1, rotation: -7, opacity: .85, duration: .16, ease: 'power4.in', onComplete: () => sound.play('stamp') });

let soon = 0;
export function refreshSoon(): void {
  clearTimeout(soon);
  soon = window.setTimeout(() => ScrollTrigger.refresh(), 200);
}
