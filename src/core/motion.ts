import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('house', '.2,.7,.2,1');
gsap.defaults({ ease: 'house', duration: .22 });

export { gsap, ScrollTrigger };

// html.still is set by the inline head script before first paint (Motion off, or Save-Data)
export const STILL = document.documentElement.classList.contains('still');
export const Q = {
  mobile: '(max-width: 899.98px), (max-height: 639.98px)',
  reduce: STILL ? 'all' : '(prefers-reduced-motion: reduce)',
  motion: STILL ? 'not all' : '(prefers-reduced-motion: no-preference)',
};

// the one text effect site-wide. Lines only never split a word, so the text reads as it is (aria 'none'): 'auto' would
// put an aria-label on a <p>, which ARIA prohibits
export const reveal = (el: Element, start = 'top 85%', trigger: Element | string = el) => SplitText.create(el, {
  type: 'lines', mask: 'lines', autoSplit: true, aria: 'none',
  onSplit: (s) => gsap.from(s.lines, { yPercent: 100, duration: .9, stagger: .08, ease: 'house',
    scrollTrigger: { trigger, start, once: true } }),
});
