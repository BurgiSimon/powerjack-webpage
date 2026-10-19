import { lenis, goTo } from './scroll';
import { STILL } from './motion';
import { sound } from './sound';
import { hush } from './jack';

// The matchbook menu (native <dialog>), chapter links, Less motion and Hush. Burnt/lit states come with the clock (P3).
export function initNav(): void {
  const dlg = document.getElementById('matchbook') as HTMLDialogElement | null;

  // Invoker Commands open/close the dialog natively; older browsers get the same from a click
  if (!('command' in HTMLButtonElement.prototype)) {
    for (const b of document.querySelectorAll<HTMLButtonElement>('button[commandfor]')) {
      b.addEventListener('click', () => {
        const d = document.getElementById(b.getAttribute('commandfor')!) as HTMLDialogElement | null;
        if (b.getAttribute('command') === 'show-modal') d?.showModal(); else d?.close();
      });
    }
  }

  if (dlg) {
    // one observer catches every way the dialog opens or closes (command, fallback, Esc, a chapter)
    new MutationObserver(() => {
      if (dlg.open) { lenis.stop(); sound.play('click'); } else lenis.start();
    }).observe(dlg, { attributes: true, attributeFilter: ['open'] });

    dlg.addEventListener('click', (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();   // the strike plays first; initAnchors must not scroll a stopped Lenis
      const head = a.querySelector('.comb__head');
      head?.classList.add('is-striking');
      setTimeout(() => {
        head?.classList.remove('is-striking');
        dlg.close(); lenis.start();
        history.replaceState(null, '', a.hash); goTo(a.hash);
      }, STILL || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
    });
  }

  // Less motion: the menu checkbox and the footer button both mirror html.still; a change reloads into the other branch
  for (const c of document.querySelectorAll<HTMLInputElement | HTMLButtonElement>('[data-still]')) {
    if (c instanceof HTMLInputElement) c.checked = STILL; else c.setAttribute('aria-pressed', String(STILL));
    c.addEventListener(c instanceof HTMLInputElement ? 'change' : 'click', () => {
      try { STILL ? localStorage.removeItem('pj-still') : localStorage.setItem('pj-still', '1'); } catch { /* storage blocked */ }
      location.reload();
    });
  }

  for (const c of document.querySelectorAll<HTMLInputElement>('input[data-hush]')) c.addEventListener('change', () => hush(c.checked));
  document.querySelector('.band__hush')?.addEventListener('click', () => hush(true));
}
