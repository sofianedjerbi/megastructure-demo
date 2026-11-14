// Light in the cave you're in. Daylight comes in at its openings and dies away a few tiles in; past that it is dark,
// but for what gives light: you and anyone else in there (a little), and fires (more). Drawn over the cave's floor
// and whoever stands on it, a shade a tile; nothing outside the cave is touched.
const SUN_REACH = 6, DARKEST = .7, GLOW = {me: [4.5, .85], other: [3.5, .75], fire: [6, 1]};   // (tiles of reach, strength)
let caveDarkC = null, caveMaskC = null, caveLightC = null, caveDepth = new Map();                  // "x,y" -> steps in from the nearest opening onto ground under the sky
function caveDepths() {
  const depth = new Map(), queue = [];
  for (const [k, z] of openCave) {
    const [x, y] = k.split(",").map(Number);
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const z2 = landAt(z, x + dx, y + dy); return z2 !== null && !coveredAt(x + dx, y + dy, z2); })) { depth.set(k, 1); queue.push([x, y]); }
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i], d = depth.get(x + "," + y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + "," + (y + dy); if (openCave.has(k) && !depth.has(k)) { depth.set(k, d + 1); queue.push([x + dx, y + dy]); } }
  }
  return depth;
}
function drawCaveDark(vis, sx, sy, S, t) {
  if (!caveOpen) return;
  const phase = clock.phase || 0, sun = 1 - Math.max(Math.max(0, Math.min(1, (phase - .70) / .05)), phase < .03 ? 1 - phase / .03 : 0);
  const lights = [];
  for (const p of ents.values()) if (p.e && p.e.kind === "agent" && inOpenCave(Math.round(p.x), Math.round(p.y))) lights.push([p.x, p.y, ...(p.e.id === myId ? GLOW.me : GLOW.other)]);
  for (const b of vis) for (const [i, c] of b.objs) if (c === "^" || c === "x") { const x = b.bx * B + i % B, y = b.by * B + (i / B | 0); if (inOpenCave(x, y)) lights.push([x, y, GLOW.fire[0] * (.95 + .05 * Math.sin(t * 13 + x)), GLOW.fire[1]]); }
  // a light map, a px a tile (the tiles round the cave take their neighbour's light, so its edges don't fade), drawn
  // stretched and smoothed over the cave: no squares. On its own canvas, then cut to the cave's floor as drawn
  // (caves.js: rounded corners and all), so no rock is shaded.
  const [vx, vy, vw, vh0] = viewRect(2), vh = vh0 + 6, n = (vw + 3) * (vh + 3), dark = new Float32Array(n).fill(-1), at = (x, y) => (y - vy + 1) * (vw + 3) + x - vx + 1;
  let lift = 0;
  for (const [k, z] of openCave) {
    const [x, y] = k.split(",").map(Number);
    if (x < vx || x > vx + vw || y < vy || y > vy + vh) continue;
    let light = sun * Math.max(0, 1 - ((caveDepth.get(k) || 99) - 1) / SUN_REACH);
    for (const [lx, ly, r, st] of lights) light = Math.max(light, st * Math.max(0, 1 - Math.hypot(lx - x, ly - y) / r));
    dark[at(x, y)] = (1 - Math.min(1, light)) * DARKEST; lift = shOf(z) * zoom;
  }
  if (!caveLightC) caveLightC = document.createElement("canvas");
  if (caveLightC.width !== vw + 3 || caveLightC.height !== vh + 3) { caveLightC.width = vw + 3; caveLightC.height = vh + 3; }
  const lg = caveLightC.getContext("2d"), img = lg.createImageData(vw + 3, vh + 3);
  for (let i = 0; i < n; i++) {
    let d = dark[i];
    const tx = vx - 1 + i % (vw + 3), ty = vy - 1 + (i / (vw + 3) | 0);
    if (d < 0 && !roofAt(tx, ty)) d = 0;                  // (open ground beside the cave: daylight)
    if (d < 0) { let sum = 0, cnt = 0; for (const o of [-1, 1, -(vw + 3), vw + 3, -(vw + 4), -(vw + 2), vw + 2, vw + 4]) if (dark[i + o] >= 0) { sum += dark[i + o]; cnt++; } d = cnt ? sum / cnt : 0; }
    img.data[i * 4] = 14; img.data[i * 4 + 1] = 10; img.data[i * 4 + 2] = 18; img.data[i * 4 + 3] = d * 255;
  }
  lg.putImageData(img, 0, 0);
  if (!caveDarkC) caveDarkC = document.createElement("canvas");
  if (caveDarkC.width !== cv.width || caveDarkC.height !== cv.height) { caveDarkC.width = cv.width; caveDarkC.height = cv.height; }
  const g = caveDarkC.getContext("2d");
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, W, H);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(caveLightC, sx(vx - 1), sy(vy - 1) - lift, (vw + 3) * S, (vh + 3) * S);
  if (!caveMaskC) caveMaskC = document.createElement("canvas");
  if (caveMaskC.width !== cv.width || caveMaskC.height !== cv.height) { caveMaskC.width = cv.width; caveMaskC.height = cv.height; }
  const m = caveMaskC.getContext("2d");
  m.setTransform(DPR, 0, 0, DPR, 0, 0); m.clearRect(0, 0, W, H); m.imageSmoothingEnabled = false;
  for (const b of vis) if (b.caveOv) m.drawImage(b.caveOv, sx(b.bx * B) - OV_M * zoom, sy(b.by * B) - OV_M * zoom, b.caveOv.width * zoom, b.caveOv.height * zoom);
  g.globalCompositeOperation = "destination-in"; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(caveMaskC, 0, 0);
  ctx.drawImage(caveDarkC, 0, 0, W, H);
}
