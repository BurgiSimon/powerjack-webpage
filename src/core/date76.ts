const pad = (n: number) => String(n).padStart(2, '0');

// every paper in the game is dated today, in '76 (ui/dom.ts)
export const date76 = (d = new Date()): string => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/76`;

export function fillDates(): void {   // the build stamped its own date; the visitor's today replaces it
  const d = new Date(), mon = `${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()} · 76`;
  for (const el of document.querySelectorAll<HTMLElement>('[data-date76]')) el.textContent = el.dataset.date76 === 'mon' ? mon : date76(d);
}
