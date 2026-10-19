import { STILL } from './motion';

// Motion (the pause for every clip, the glass and the scrubs): the state is drawn by CSS from aria-pressed; a change reloads into the other branch
export function initNav(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('button[data-still]')) {
    b.setAttribute('aria-pressed', String(!STILL));
    b.hidden = false;
    b.addEventListener('click', () => {
      try { localStorage.setItem('pj-still', STILL ? '0' : '1'); } catch { /* storage blocked: nothing to remember */ }
      location.reload();
    });
  }
}
