import { mulberry32, fmix } from '../lib/rng.ts';

// The rain on the hero glass (SPEC §E.8), after the game's render/room/droplets.ts. Pure arrays: glass.ts uploads them.

// the beads: 512² RGBA, tileable. RG = surface normal (128 ± 115), B = lens (h², sharp at a bead's centre), A = wet;
// dry glass is (128, 128, 0, 90). Later beads overwrite earlier ones where they touch (merging).
export function dropsMap(n = 512, count = 900): Uint8Array {
  const d = new Uint8Array(n * n * 4), r = mulberry32(1976);
  for (let i = 0; i < d.length; i += 4) d.set([128, 128, 0, 90], i);
  for (let k = 0; k < count; k++) {
    const rad = r() < .85 ? 1.5 + r() * 2.5 : 5 + r() * 7, cx = r() * n, cy = r() * n;
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      const dx = (x - cx) / rad, dy = (y - cy) / rad, q = 1 - dx * dx - dy * dy;
      if (q <= 0) continue;
      const i = 4 * (((y + n) % n) * n + ((x + n) % n));
      d[i] = 128 + 115 * dx; d[i + 1] = 128 + 115 * dy; d[i + 2] = 255 * q; d[i + 3] = 255;
    }
  }
  return d;
}

type Drip = { x: number; y: number; rad: number; wait: number; v: number; run: number; drift: number };

// the drips: W×H RGBA, v up like GL. R = the trail a drip (or a finger) cleared, misting over in ≈ 40 s; G = the moving heads.
export function drips(W = 256, H = 128) {
  const data = new Uint8Array(W * H * 4), trail = new Float32Array(W * H), r = mulberry32(fmix(1976 ^ 0xd819));
  const spawn = (top: boolean): Drip => ({ x: r() * W, y: top ? H + 3 : r() * H, rad: 1.5 + r() * 1.5, wait: .5 + r() * 3.5, v: 0, run: 0, drift: 0 });
  const list = Array.from({ length: 6 + Math.floor(r() * 7) }, () => spawn(false));
  const disc = (cx: number, cy: number, rad: number, put: (i: number) => void) => {
    for (let y = Math.max(0, Math.floor(cy - rad)); y <= Math.min(H - 1, cy + rad); y++)
      for (let x = Math.max(0, Math.floor(cx - rad)); x <= Math.min(W - 1, cx + rad); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) put(y * W + x);
  };
  const clear = (i: number) => { trail[i] = 1; };
  return {
    data,
    step(dt: number): void {
      for (let i = 0; i < trail.length; i++) { trail[i] *= .995; data[4 * i] = 255 * trail[i]; data[4 * i + 1] = 0; }
      for (const p of list) {
        if (p.wait > 0) {
          p.wait -= dt;
          if (p.wait <= 0) { p.v = 20 + r() * 40; p.run = .2 + r() * .8; p.drift = (r() - .5) * 6; }
        } else {
          const y0 = p.y;
          p.y -= p.v * dt; p.x += p.drift * dt;
          for (let y = y0; y > p.y; y -= 1) disc(p.x, y, p.rad, clear);
          if ((p.run -= dt) <= 0) p.wait = .5 + r() * 3.5;
        }
        if (p.y < -3) Object.assign(p, spawn(true));
        disc(p.x, p.y, p.rad, (i) => { data[4 * i + 1] = 255; });
      }
    },
    wipe(u: number, v: number, rad: number): void { disc(u * W, v * H, rad, clear); },
  };
}
