#!/usr/bin/env node
// Key plans: where the camera stood for each frame, drawn on a plan of the bar (metres, x east, z south = down).
// Room, bar, window and jukebox are the game's own layout (render/room: irradiance ROOM, bar BAR/BACK, shell WINDOW,
// anchors.jukebox); the poses come from src/data/frames.json.   node tools/keyplans.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frames = JSON.parse(readFileSync(join(ROOT, 'src/data/frames.json'), 'utf8'));
const out = join(ROOT, 'public/media/plans'); mkdirSync(out, { recursive: true });

const ROOM = { x0: -5.4, x1: 5.8, z0: -3.6, z1: 3.6 };
const n = v => +v.toFixed(3);
const rect = (x0, z0, x1, z1, a) => `<rect x="${x0}" y="${z0}" width="${n(x1 - x0)}" height="${n(z1 - z0)}" ${a}/>`;
// the room is 11.2 m wide but sits off-centre (x −5.4…5.8): the 11.6 × 7.6 view is centred on it
const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5.6 -3.8 11.6 7.6" width="96" height="62">` +
  `<rect x="-5.6" y="-3.8" width="11.6" height="7.6" rx=".3" fill="rgba(23,17,12,.6)"/>` +
  `<clipPath id="room">${rect(ROOM.x0, ROOM.z0, ROOM.x1, ROOM.z1, '')}</clipPath>` +
  rect(ROOM.x0, ROOM.z0, ROOM.x1, ROOM.z1, 'fill="none" stroke="#C9A55A" stroke-opacity=".7" stroke-width=".14"') +
  `<path d="M-1.8 3.6H1.8" stroke="#6FA3E0" stroke-width=".32"/>` +                    // the storefront window, south wall
  rect(3.72, -2.6, 4.42, 2.6, 'fill="#5A3A24"') + rect(5.2, -2.8, 5.8, 2.0, 'fill="#5A3A24"') +   // counter and back bar
  `<circle cx="-4.95" cy="0" r=".3" fill="#E8A23A" fill-opacity=".8"/>` +                // the jukebox, west wall
  rect(-1.45, -.815, 1.45, .815, 'fill="#1F6644"');                                      // the table, 2.90 × 1.63

let count = 0;
for (const [name, f] of Object.entries(frames)) {
  const [ex, , ez] = f.eye, [ax, , az] = f.at, aspect = f.w / f.h;
  if (ex < ROOM.x0 || ex > ROOM.x1 || ez < ROOM.z0 || ez > ROOM.z1) throw new Error(`${name}: eye outside the room`);
  const half = Math.atan(Math.tan(f.fov * Math.PI / 360) * aspect), dir = Math.atan2(az - ez, ax - ex), L = 3;
  const p = a => `${n(ex + L * Math.cos(a))} ${n(ez + L * Math.sin(a))}`;
  const cone = `<path clip-path="url(#room)" d="M${n(ex)} ${n(ez)}L${p(dir - half)}L${p(dir + half)}Z" fill="#E8A23A" fill-opacity=".28" stroke="#E8A23A" stroke-opacity=".7" stroke-width=".08"/>`;
  writeFileSync(join(out, `${name}.svg`), `${base}${cone}<circle cx="${n(ex)}" cy="${n(ez)}" r=".22" fill="#E8A23A"/></svg>\n`);
  count++;
}
console.log(`key plans: ${count}`);
