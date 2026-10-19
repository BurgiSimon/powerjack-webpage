// Round-0 stub: Hush works (menu checkbox + band button); the subtitle engine lands in P4 (§E.10).
const KEY = 'pj-hush';

export function hush(on: boolean): void {
  try { on ? sessionStorage.setItem(KEY, '1') : sessionStorage.removeItem(KEY); } catch { /* storage blocked: hush for this page only */ }
  document.querySelector('.band')?.toggleAttribute('hidden', on);
  for (const c of document.querySelectorAll<HTMLInputElement>('input[data-hush]')) c.checked = on;
}

export function say(_line: string, _o?: { force?: boolean }): boolean { return false; }

export function initJack(): void {
  let on = false;
  try { on = sessionStorage.getItem(KEY) === '1'; } catch { /* no storage: not hushed */ }
  hush(on);
}
