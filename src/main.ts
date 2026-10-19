import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource/barlow-condensed/600.css';
import './styles/tokens.css'; import './styles/base.css';
import { gsap, ScrollTrigger, Q } from './core/motion';
import { lenis, initAnchors } from './core/scroll';
import { initNav } from './core/nav';
import { initClips } from './core/clip';
import type { Init } from './core/types';

const mods = import.meta.glob<{ init: Init }>('./sections/*/*.ts', { eager: true });
const byId = new Map(Object.entries(mods).map(([path, m]) => [path.split('/')[2], m.init]));

// a matchMedia handler only runs while one of its conditions matches, so 'all' keeps this one running both ways
gsap.matchMedia().add({ reduce: Q.reduce, all: 'all' }, (c) => { document.documentElement.classList.toggle('motion', !c.conditions!.reduce); });
initAnchors(); initNav(); initClips();
// one continuous shot (base.css): each scene dissolves in over the held frame before it, across --fade, while that frame dips
// to ink (--veil), so the two never sit as a muddy double exposure; the break is a hard cut on the stroke. Opacity, not
// autoAlpha: a scene still to come stays in the accessibility tree
gsap.matchMedia().add(Q.motion, () => {
  for (const s of document.querySelectorAll('main > section + section')) gsap.timeline({ defaults: { ease: 'none', duration: 1 },
    scrollTrigger: { trigger: s, start: 'top top', end: s.id === 'the-break' ? 'top -1px' : 'top -12%', scrub: true } })
    .fromTo(s.querySelector('.stage'), { opacity: 0 }, { opacity: 1 }, 0)
    .fromTo(s.previousElementSibling!.querySelector('.stage'), { '--veil': 0 }, { '--veil': 1, duration: .6 }, 0);   // gone before the new frame is
});
for (const el of document.querySelectorAll<HTMLElement>('main > section[id]')) byId.get(el.id)?.();   // DOM order
document.fonts.ready.then(() => ScrollTrigger.refresh());
if (new URLSearchParams(location.search).has('qa')) Object.assign(window, { __pj: { ScrollTrigger, lenis } });
