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
for (const el of document.querySelectorAll<HTMLElement>('main > section[id]')) byId.get(el.id)?.();   // DOM order
document.fonts.ready.then(() => ScrollTrigger.refresh());
if (new URLSearchParams(location.search).has('qa')) Object.assign(window, { __pj: { ScrollTrigger, lenis } });
