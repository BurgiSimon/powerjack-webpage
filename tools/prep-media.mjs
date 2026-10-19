#!/usr/bin/env node
// Copy the encoded game frames and the break sequence into public/media, and write src/data/frames.json (sizes, focal,
// blur placeholder, alt text, preset and camera pose per frame). Copies without re-encoding; re-run after new captures.
//   node tools/prep-media.mjs <media dir>   (the dir holding shots/manifest.json, shots/*.{avif,webp} and shots/seq/)
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2] && join(resolve(process.argv[2]), 'shots');
if (!SRC || !existsSync(join(SRC, 'manifest.json'))) { console.error('usage: node tools/prep-media.mjs <media dir with shots/manifest.json>'); process.exit(1); }

// Alt texts (spec §D; the fuller per-frame alts where a section passes its own), preset, and the camera pose in the
// game's world metres (x east, z south, y above the cloth): eye, at, vertical fov. From the capture scripts' pose tables.
const FRAMES = {
  'room-wide': { preset: 'ultra', eye: [4.9, 1.25, 2.9], at: [-1, -.1, -.6], fov: 62,
    alt: 'In-game frame from the window corner: the pool table lit under three slag-glass shades, the POWERJACK neon over the glowing jukebox, the dartboard, stools and ceiling beams.' },
  'portrait-table': { preset: 'ultra', eye: [-2.3, .42, .02], at: [.4, .55, 0], fov: 62,
    lamps: [[.50, .28, .22], [.50, .36, .16], [.49, .08, .32]],
    alt: 'In-game frame up the length of the table: three slag-glass shades stacked over the green cloth, the balls spread, the back bar glowing beyond.' },
  'lamps-haze': { preset: 'ultra', eye: [-2.0, .62, -.95], at: [.9, .95, .15], fov: 50,
    lamps: [[.549, .37, .20], [.464, .44, .15], [.768, .17, .30]],
    alt: 'In-game frame: three glowing slag-glass shades over the green cloth, the back bar glowing beyond.' },
  'k1-break-view': { preset: 'high', eye: [-2.05, .24, 0], at: [1.3, 0, 0], fov: 60,
    alt: 'In-game frame at the head of the table: the rack under the shades, the back bar glowing beyond.' },
  'low-rack': { preset: 'ultra', eye: [-1.2, .075, .28], at: [.635, .03, 0], fov: 34,
    alt: 'In-game frame at eye level with the cloth: the cue ball in front, the rack under the lamp, the back bar glowing beyond.' },
  'rack-macro': { preset: 'ultra', eye: [.2, .07, .2], at: [.66, .028, 0], fov: 26,
    alt: 'In-game frame close on the racked balls on the green cloth, the bar soft behind them.' },
  'cue-tip': { preset: 'ultra', eye: [-1.0, .15, 0], at: [.635, 0, 0], fov: 42,
    alt: 'In-game frame, first person, down on the break: a bridge hand on the cloth, the cue tip at the cue ball, the rack at the far end.' },
  'table-wide-rack': { preset: 'ultra', eye: [1.8, .4, .78], at: [.25, -.03, -.05], fov: 44,
    alt: "In-game frame from the foot corner before the break: the rack, the POWERJACK neon over the jukebox, the BANK SHOT ’75 arcade, the chalkboard." },
  'mid-game-high': { preset: 'ultra', eye: [.02, 1.55, .9], at: [0, 0, -.05], fov: 52,
    alt: 'In-game frame from high over the near rail: balls scattered across the cloth under the shades.' },
  'mid-game': { preset: 'ultra', eye: [-2.25, 1.15, 1.45], at: [.15, -.05, -.1], fov: 50,
    alt: 'In-game frame after the break, from behind the head: balls spread on the cloth, three shades, the bar beyond.' },
  'back-bar': { preset: 'ultra', eye: [2.55, .78, 1.3], at: [5.6, .55, -.7], fov: 55,
    alt: 'In-game frame: the lacquered bar, stools, amber-lit shelves of bottles, a brass cash register and the corner TV.' },
  'k2-bar-top': { preset: 'high', eye: [3.5, .7, .4], at: [4.9, .55, -.9], fov: 60,
    alt: 'In-game frame from a bar stool: rings on the bar top, the taps, the back bar, the TV.' },
  'jukebox-neon': { preset: 'ultra', eye: [-2.55, .45, .75], at: [-5.4, .95, -.05], fov: 52,
    alt: 'In-game frame: the POWERJACK sign in red neon over the arched, amber-lit jukebox, the damask wallpaper washed red.' },
  'jukebox-neon-off': { preset: 'ultra', eye: [-2.55, .45, .75], at: [-5.4, .95, -.05], fov: 52,
    alt: 'In-game frame: the same jukebox with the POWERJACK sign switched off, its tubes pale under the room light.' },
  'window-rain': { preset: 'ultra', eye: [-.2, .62, 2.25], at: [.6, .5, 3.75], fov: 55,
    alt: 'In-game frame: rain beads on the storefront glass, COLD BEER in blue neon backwards from inside, sodium light from the street.' },
  'chalkboard': { preset: 'ultra', eye: [-1.0, .62, -1.5], at: [-1.2, .72, -3.6], fov: 50,
    alt: 'In-game frame: the live chalkboard reading 8-BALL, Player 1, Player 2, OPEN, beside the HOUSE RULES sign.' },
  'k3-window-street': { preset: 'high', eye: [1.6, .79, -1.7], at: [.5, -.3, 3.75], fov: 60,
    alt: 'In-game frame past the foot of the table toward the rainy window and the door, a patch of street light on the floor.' },
  // the title's dolly at t = 22 s (ui/title.ts): x 2.72, eye .52, looking up the back bar
  'title-matchbook': { preset: 'screenshot', eye: [2.72, .52, -.03], at: [5.72, .52, -.21], fov: 60,
    alt: "The game’s title screen: a cream matchbook menu reading Powerjack, Play, A friend’s table, Settings, Controls, Stats & records, Credits, over the back bar." },
  'k4-under-table': { preset: 'high', eye: [2.2, -.5, .5], at: [1.45, -.45, 0], fov: 60,
    alt: 'In-game frame from low under the table: a carved leg, the ball-return gully and the floorboards.' },
};

const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
const byName = new Map(manifest.shots.map(s => [s.name, s]));
const out = join(ROOT, 'public/media/frames'), seqOut = join(ROOT, 'public/media/seq');
mkdirSync(out, { recursive: true }); mkdirSync(seqOut, { recursive: true }); mkdirSync(join(ROOT, 'src/data'), { recursive: true });

const data = {}, missing = [];
for (const [name, f] of Object.entries(FRAMES)) {
  const s = byName.get(name);
  if (!s) { missing.push(name); continue; }
  const sizes = Object.keys(s.files).map(Number).sort((a, b) => a - b);
  for (const w of sizes) for (const t of ['avif', 'webp']) copyFileSync(join(SRC, s.files[w][t]), join(out, `${name}-${w}.${t}`));
  data[name] = { w: s.width, h: s.height, sizes, focal: s.focal, ph: s.placeholder, alt: f.alt, preset: f.preset,
    eye: f.eye, at: f.at, fov: f.fov, ...(f.lamps ? { lamps: f.lamps } : {}) };
}
let seq = 0;
if (existsSync(join(SRC, 'seq'))) for (const f of readdirSync(join(SRC, 'seq'))) { copyFileSync(join(SRC, 'seq', f), join(seqOut, f)); seq++; }
writeFileSync(join(ROOT, 'src/data/frames.json'), JSON.stringify(data, null, 1) + '\n');

// self-check: every frame resolves to files on disk
for (const [n, d] of Object.entries(data)) for (const w of d.sizes) for (const t of ['avif', 'webp'])
  if (!existsSync(join(out, `${n}-${w}.${t}`))) throw new Error(`missing ${n}-${w}.${t}`);
console.log(`frames.json: ${Object.keys(data).length} frames, ${seq} sequence files${missing.length ? `; not in the manifest yet: ${missing.join(', ')}` : ''}`);
