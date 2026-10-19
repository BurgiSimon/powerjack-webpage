// Round-0 stub (P1 builds the strike, §E.1): drop the overlay and tell the hero the room is lit.
export function initLoader(): void {
  document.querySelector('.strike')?.remove();
  dispatchEvent(new Event('pj:struck'));
}
