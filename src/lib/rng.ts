// The game's Rng.next (core/rng.ts): mulberry32, so a seed gives every visitor the same night.
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const a = s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// murmur3's finaliser: every input bit reaches every output bit
export function fmix(h: number): number {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

// Box–Muller: one standard normal from two uniforms (1 − u keeps log away from 0)
export const gauss = (rand: () => number): number => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
