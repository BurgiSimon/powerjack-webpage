import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger, STILL } from './motion';

export const lenis = new Lenis({ smoothWheel: !STILL });   // no autoRaf: GSAP's ticker drives it; syncTouch stays off
lenis.on('scroll', ScrollTrigger.update);                   // keep ScrollTrigger in sync
gsap.ticker.add((time) => lenis.raf(time * 1000));         // seconds → ms
gsap.ticker.lagSmoothing(0);                                // scroll and animation never drift
ScrollTrigger.config({ ignoreMobileResize: true });

// pinned sections sit inside a .pin-spacer: scroll to the spacer, then hand focus to the section
export function goTo(target: string | HTMLElement, o: { duration?: number; immediate?: boolean } = {}): void {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const box = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
  lenis.scrollTo(box, { duration: o.duration ?? 1.6, immediate: o.immediate || STILL,
    onComplete: () => el.focus({ preventScroll: true }) });
}
export function initAnchors(): void {   // same-page links: smooth scroll + focus, instead of Lenis's own anchors option
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    e.preventDefault(); history.replaceState(null, '', a.hash); goTo(a.hash);
  });
}
