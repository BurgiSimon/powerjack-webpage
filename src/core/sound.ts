// Round-0 stub: the toggle UI is real, every voice is a no-op until the engine lands (P6, §E.4).
type Name = 'switch' | 'click' | 'stamp' | 'stamp-heavy' | 'hover';
let on = false;

export const sound = {
  get on() { return on; },
  toggle(): void {
    on = !on;   // never persisted: sound is off on every visit
    for (const b of document.querySelectorAll('.hdr__sound')) b.setAttribute('aria-pressed', String(on));   // CSS draws Off/On from it
    if (on) sound.play('switch');
    dispatchEvent(new CustomEvent('pj:sound', { detail: { on } }));
  },
  play(_name: Name, _o?: { gain?: number; rate?: number }): void {},
  scene(_inside: number): void {},
  neon(_level: number): void {},
  thunder(_km: number): void {},
  hiss(_dir: 1 | -1): void {},
  breakClicks(): void {},
  tock(_v: number): void {},
  strike(): void {},
  stopAll(): void {},
};

export function initSound(): void {
  document.querySelector('.hdr__sound')?.addEventListener('click', () => sound.toggle());
}
