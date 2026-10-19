// image-fraction (u, v) → box px for an <img> drawn with object-fit: cover at object-position (fx, fy)
export function coverMap(boxW: number, boxH: number, imgW: number, imgH: number, fx = .5, fy = .5): (u: number, v: number) => [x: number, y: number] {
  const s = Math.max(boxW / imgW, boxH / imgH), w = imgW * s, h = imgH * s, x0 = (boxW - w) * fx, y0 = (boxH - h) * fy;
  return (u, v) => [x0 + u * w, y0 + v * h];
}

export const AVIF: Promise<boolean> = new Promise((done) => {
  const i = new Image();
  i.onload = () => done(i.width > 0);
  i.onerror = () => done(false);
  i.src = 'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAACIAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAqbWRhdBIACgc4AAaQENBpMhUZQmMEw88880EgAJBBEdVElRj0HHg=';
});
