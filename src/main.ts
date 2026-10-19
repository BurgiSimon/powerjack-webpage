import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource/caveat-brush/400.css';
import './styles/tokens.css'; import './styles/base.css'; import './styles/paper.css';
import './styles/storefront.css'; import './styles/print.css';
import { gsap, ScrollTrigger, Q, STILL } from './core/motion';
import { lenis, initAnchors } from './core/scroll';
import { initLoader } from './core/loader';
import { initNav } from './core/nav';
import { initClock } from './core/clock';
import { initCursor } from './core/cursor';
import { initSound } from './core/sound';
import { initJack } from './core/jack';
import { initLamp } from './core/lamp';
import { initPaper } from './core/paper';
import { fillDates } from './core/date76';
import type { Ctx, Init } from './core/types';

const mods = import.meta.glob<{ init: Init }>('./sections/*/*.ts', { eager: true });
const byId = new Map(Object.entries(mods).map(([path, m]) => [path.split('/')[2], m.init]));
const ctx: Ctx = { lenis, still: STILL };

// a matchMedia handler only runs while one of its conditions matches, so 'all' keeps this one running both ways
gsap.matchMedia().add({ reduce: Q.reduce, all: 'all' }, (c) => { document.documentElement.classList.toggle('motion', !c.conditions!.reduce); });
initLoader(); fillDates(); initAnchors(); initSound(); initJack(); initNav(); initCursor(); initLamp(); initPaper();
for (const el of document.querySelectorAll<HTMLElement>('main > section[id], body > footer[id]')) byId.get(el.id)?.(ctx);  // DOM order
initClock();                                       // after the sections, so pin spacers exist
document.fonts.ready.then(() => ScrollTrigger.refresh());
if (new URLSearchParams(location.search).has('qa')) Object.assign(window, { __pj: { ScrollTrigger, lenis } });
console.log("It's always Kessler time.");
