// 0 … n-1 as ends first, then midpoints breadth-first: any prefix is an evenly spread preview of the whole sequence
export function order(n: number): number[] {
  const out = n > 1 ? [0, n - 1] : n ? [0] : [], todo: [number, number][] = [[0, n - 1]];
  for (let i = 0; i < todo.length; i++) {
    const [a, b] = todo[i];
    if (b - a < 2) continue;
    const m = Math.round((a + b) / 2);
    out.push(m); todo.push([a, m], [m, b]);
  }
  return out;
}
