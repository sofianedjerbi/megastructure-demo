// Water: clear, and you see the bottom through it (tiles.py DEPTH: the bottom lies one to four layers under the surface).
// Drawn under everything else in a block (the land goes over it), from the bottom up:
//   the bottom   sand with ridges, pebbles, rocks, weed and shells; a shaded step where it drops a layer; the land's shadow
//   refraction   the bottom wobbles sideways in thin strips, as things do seen through moving water
//   the light    two nets of caustics drifting across each other on the bottom (the water over them dims them with depth)
//   the water    a thin tint that thickens and turns from aqua to blue with depth, blended smoothly from tile to tile
//   the surface  small waves drifting, glints of sun that twinkle, and foam that breathes along every shore
// Nothing flows: the water is where the world says it is. The still parts are kept per block and redone when it changes.

const WATER = {
  sand: ["#ecdcae", "#ecdcae", "#dfcfa1", "#cdbf98", "#b9ae90"],                        // the bottom, by depth (0: under a shore's edge)
  tint: [[176, 236, 226, .08], [136, 224, 214, .22], [78, 188, 208, .4], [44, 136, 190, .56], [24, 90, 152, .7]],
  caustics: [.22, .13], waves: [.5, .3], wobble: 1.3, strip: 4, foam: "#ffffff",
};
const depthAt = (x, y) => DEPTH_OF[gndAt(x, y)] || 0;
let causticPat = null, wavePat = null;
function causticPattern() {                        // a net of light, tileable: lines where three waves cancel
  const n = 64, c = document.createElement("canvas"); c.width = c.height = n;
  const g = c.getContext("2d"), img = g.createImageData(n, n), k = 2 * Math.PI / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = Math.sin(k * (2 * x + 3 * Math.sin(k * 2 * y))) + Math.sin(k * (3 * y + 2 * Math.sin(k * 3 * x))) + Math.sin(k * (x + y) * 2);
    const a = Math.max(0, 1 - Math.abs(v) / .3);
    img.data.set([255, 255, 255, Math.round(255 * a * a)], (y * n + x) * 4);
  }
  g.putImageData(img, 0, 0);
  return ctx.createPattern(c, "repeat");
}
function wavePattern() {                           // small waves, tileable: a short bright crest with its shade under it
  const n = 64, c = document.createElement("canvas"); c.width = c.height = n;
  const g = c.getContext("2d");
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(hash(i, 3, 41) * n), y = Math.floor(i * 4 + hash(i, 5, 42) * 3), len = 3 + Math.floor(hash(i, 7, 43) * 4);
    for (const o of [0, -n]) {
      g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(x + o, y, len, 1);
      g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x + o - 1, y, 1, 1); g.fillRect(x + o + len, y, 1, 1);
      g.fillStyle = "rgba(18,64,112,.22)"; g.fillRect(x + o + 1, y + 1, len, 1);
    }
  }
  return ctx.createPattern(c, "repeat");
}
function bedTile(g, x, y, u, ox, oy, under, land) {   // one tile of the bottom
  const d = Math.abs(u), h = (k) => hash(x, y, k);
  g.fillStyle = WATER.sand[u < 0 ? 0 : d];
  g.fillRect(ox, oy, 16, 16);
  for (let k = 0; k < 5; k++) {                    // grains
    g.fillStyle = h(60 + k) < .5 ? "rgba(255,255,255,.25)" : "rgba(96,78,60,.22)";
    g.fillRect(ox + Math.floor(h(70 + k) * 15), oy + Math.floor(h(80 + k) * 15), 1, 1);
  }
  if (h(50) < .45) {                               // a ridge in the sand: light on top, shade under
    const rx = ox + 1 + Math.floor(h(51) * 6), ry = oy + 2 + Math.floor(h(52) * 11), len = 5 + Math.floor(h(53) * 5);
    g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(rx, ry, len, 1); g.fillRect(rx + len, ry + 1, 2, 1);
    g.fillStyle = "rgba(110,88,64,.22)"; g.fillRect(rx + 1, ry + 1, len - 1, 1);
  }
  const r = h(54), px = ox + 2 + Math.floor(h(55) * 10), py = oy + 3 + Math.floor(h(56) * 9);
  if (r < .16) {                                   // a pebble
    g.fillStyle = "#8f8a86"; g.fillRect(px, py, 3, 2);
    g.fillStyle = "#c9c5bd"; g.fillRect(px, py, 2, 1);
    g.fillStyle = "rgba(60,50,60,.3)"; g.fillRect(px, py + 2, 3, 1);
  } else if (r < .22 && d >= 2) {                  // a rock, on the deeper bottom
    g.fillStyle = "#6f6c74"; g.fillRect(px - 1, py, 6, 4); g.fillRect(px, py - 1, 4, 1);
    g.fillStyle = "#a3a0a6"; g.fillRect(px, py, 3, 1); g.fillRect(px - 1, py + 1, 1, 1);
    g.fillStyle = "rgba(50,44,60,.35)"; g.fillRect(px - 1, py + 4, 6, 1);
  } else if (r < .32 && d >= 2) {                  // weed
    for (const [wx, wy, wh] of [[0, 2, 5], [2, 0, 7], [4, 3, 4]]) {
      g.fillStyle = "#3f8a5c"; g.fillRect(px + wx, py + wy - 2, 1, wh);
      g.fillStyle = "#6fb878"; g.fillRect(px + wx, py + wy - 2, 1, 1);
    }
  } else if (r < .35 && d === 1) {                 // a shell
    g.fillStyle = "#f2a48c"; g.fillRect(px, py, 2, 2);
    g.fillStyle = "#fbd9c8"; g.fillRect(px, py, 1, 1);
  } else if (r < .37 && d <= 2) {                  // a starfish
    g.fillStyle = "#e8825a"; g.fillRect(px, py + 1, 3, 1); g.fillRect(px + 1, py, 1, 3);
  }
  if (u < 0) return;
  const up = (dx, dy) => { const o = under(x + dx, y + dy); return o && Math.abs(o) < d; };       // a shallower neighbour: a step down to here
  const shade = (a, ...rect) => { g.fillStyle = `rgba(44,40,64,${a})`; g.fillRect(...rect); };
  if (up(0, -1)) { shade(.34, ox, oy, 16, 2); shade(.2, ox, oy + 2, 16, 2); shade(.09, ox, oy + 4, 16, 2); }   // its face is in shade
  if (up(-1, 0)) { shade(.26, ox, oy, 1, 16); shade(.12, ox + 1, oy, 2, 16); }
  if (up(1, 0)) { shade(.26, ox + 15, oy, 1, 16); shade(.12, ox + 13, oy, 2, 16); }
  if (up(0, 1)) { g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(ox, oy + 15, 16, 1); }
  if (land(x, y - 1)) { shade(.26, ox, oy, 16, 3); shade(.12, ox, oy + 3, 16, 3); }     // the bank's shadow on the bottom
  if (land(x - 1, y)) shade(.14, ox, oy, 3, 16);
}
// What a block's water is made of, and nothing else: for its tiles and the two round them, the depth drawn there (a
// land tile by the water has shallows under its edge: -1) and whether it is land.
function waterStuff(b) {
  const m = B + 6, n = B + 4, x0 = b.bx * B - 3, y0 = b.by * B - 3, dep = new Int8Array(m * m), isL = new Uint8Array(m * m);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { const g = gndAt(x0 + i, y0 + j); dep[j * m + i] = DEPTH_OF[g] || 0; isL[j * m + i] = isLand(g) ? 1 : 0; }
  const un = new Int8Array(n * n), land = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const q = (j + 1) * m + i + 1; let u = dep[q];
    for (let d = 0; d < 9 && !u; d++) if (dep[q + ((d / 3 | 0) - 1) * m + d % 3 - 1]) u = -1;
    un[j * n + i] = u; land[j * n + i] = isL[q];
  }
  return {un, land};
}
// The still parts of a block's water (b.water): made as the last steps of building the block (relief.js: a block shows
// once its land and its water are both there; one made again keeps what it had until then), and only when what it
// is made of changed: its tiles drawn again the same, a block arriving beside it with no water near, leave it be.
function* waterSteps(b) {
  const {un, land} = waterStuff(b), old = b.water, same = (p, q) => p.every((v, i) => v === q[i]);
  if (old && same(old.un, un) && same(old.land, land)) return;
  const n = B * 16, m = B + 4, x0 = b.bx * B, y0 = b.by * B, foam = [], glints = [], rows = new Array(B).fill(false);
  const box = [B, B, -1, -1];                                       // the tiles of the block with water (or shallows): x0, y0, x1, y1
  const under = (x, y) => un[(y - y0 + 2) * m + x - x0 + 2], isL = (x, y) => land[(y - y0 + 2) * m + x - x0 + 2] === 1;
  let any = false;
  for (let ly = 0; ly < B && !any; ly++) for (let lx = 0; lx < B; lx++) if (under(x0 + lx, y0 + ly)) { any = true; break; }
  if (!any) { b.water = {un, land, any, foam, glints, rows, box: [0, 0, 0, 0]}; return; }
  const c = document.createElement("canvas"), bed = document.createElement("canvas");
  c.width = c.height = n; bed.width = bed.height = n + 32;          // (the bottom has a tile of margin: it slides when it wobbles)
  const g = c.getContext("2d"), bg = bed.getContext("2d");
  for (let ly = -1; ly <= B; ly++) {
    for (let lx = -1; lx <= B; lx++) {
      const x = x0 + lx, y = y0 + ly, u = under(x, y);
      if (!u) continue;
      bedTile(bg, x, y, u, (lx + 1) * 16, (ly + 1) * 16, under, isL);
      if (lx < 0 || ly < 0 || lx >= B || ly >= B) continue;
      rows[ly] = true;
      box[0] = Math.min(box[0], lx); box[1] = Math.min(box[1], ly); box[2] = Math.max(box[2], lx); box[3] = Math.max(box[3], ly);
      if (u < 0) continue;
      for (const [dx, dy, side] of [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]]) if (isL(x + dx, y + dy)) foam.push([lx, ly, side, hash(x, y, 30 + side)]);
      if (hash(x, y, 20) < .4) glints.push([lx * 16 + Math.floor(hash(x, y, 21) * 14), ly * 16 + 1 + Math.floor(hash(x, y, 22) * 13), hash(x, y, 23)]);
    }
    if ((ly & 3) === 3) yield;                                     // (a step every four rows of tiles)
  }
  const s = document.createElement("canvas"); s.width = s.height = B + 2;   // the water over it: one pixel a tile, blown up smooth
  const sg = s.getContext("2d"), img = sg.createImageData(B + 2, B + 2);
  for (let j = 0; j < B + 2; j++) for (let i = 0; i < B + 2; i++) {
    const u = under(x0 + i - 1, y0 + j - 1), [r, gg, bb, a] = WATER.tint[u < 0 ? 0 : u];
    img.data.set([r, gg, bb, Math.round(255 * a)], (j * (B + 2) + i) * 4);
  }
  sg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(s, .5, .5, B + 1, B + 1, -8, -8, n + 16, n + 16);
  b.water = {un, land, canvas: c, bed, any, foam, glints, rows, box: box.map((v, i) => (v + (i > 1)) * 16)};
}
// All of it is art pixels (the patterns slide by whole ones), so it is put together small, a pixel an art pixel, on a
// canvas the size of the view (and only where a block has water), then blown up onto the screen in one go: painting
// each layer at the screen's size was seven screens of paint a frame wherever a block in view held a puddle.
let waterCv = null, waterView = null;                             // (waterView: where waterCv's corner is, in art px, this frame; null: no water in view)
function drawWater(vis, ox, oy, t) {
  waterView = null;
  if (!causticPat) { causticPat = causticPattern(); wavePat = wavePattern(); }
  const vx = Math.floor(-ox / zoom) - 1, vy = Math.floor(-oy / zoom) - 1, vw = Math.ceil(W / zoom) + 3, vh = Math.ceil(H / zoom) + 3;   // the view, in art px
  let g = null, ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9;       // (and the part of it with water in it)
  const drift = (pat, dx, dy, alpha, x, y, w, h) => {               // a tiling pattern, slid by whole pixels
    const mx = ((Math.round(dx) % 64) + 64) % 64, my = ((Math.round(dy) % 64) + 64) % 64;
    g.globalAlpha = alpha;
    g.save(); g.translate(mx, my); g.fillStyle = pat; g.fillRect(x - mx, y - my, w, h); g.restore();
  };
  for (const b of vis) {
    const w = b.water, n = B * 16, X = b.bx * n, Y = b.by * n, st = WATER.strip;
    if (!w || !w.any) continue;
    const x0 = Math.max(X + w.box[0], vx), y0 = Math.max(Y + w.box[1], vy), x1 = Math.min(X + w.box[2], vx + vw), y1 = Math.min(Y + w.box[3], vy + vh);
    if (x1 <= x0 || y1 <= y0) continue;                             // (its water isn't in view)
    if (!g) {
      if (!waterCv) waterCv = document.createElement("canvas");
      if (waterCv.width !== vw || waterCv.height !== vh) { waterCv.width = vw; waterCv.height = vh; }
      g = waterCv.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, vw, vh);
      g.translate(-vx, -vy); g.imageSmoothingEnabled = false;
    }
    ux0 = Math.min(ux0, x0); uy0 = Math.min(uy0, y0); ux1 = Math.max(ux1, x1); uy1 = Math.max(uy1, y1);
    const bw = x1 - x0, bh = y1 - y0;
    g.save(); g.beginPath(); g.rect(x0, y0, bw, bh); g.clip();
    // the bottom, in strips that slide: refraction
    for (let ly = Math.floor((y0 - Y) / 16); ly * 16 < y1 - Y; ly++) if (w.rows[ly]) for (let k = 0; k < 16; k += st) {
      const py = ly * 16 + k, dx = Math.round(Math.sin(t * 1.5 + (Y + py) * .09) * WATER.wobble);
      g.drawImage(w.bed, 16 + x0 - X + dx, 16 + py, bw, st, x0, Y + py, bw, st);
    }
    g.globalCompositeOperation = "lighter";        // light through the surface, on the bottom
    drift(causticPat, t * 5, t * 3, WATER.caustics[0], x0, y0, bw, bh);
    drift(causticPat, -t * 4, t * 6, WATER.caustics[1], x0, y0, bw, bh);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.drawImage(w.canvas, x0 - X, y0 - Y, bw, bh, x0, y0, bw, bh);  // the water itself
    drift(wavePat, t * 4, Math.sin(t * .6) * 2, WATER.waves[0], x0, y0, bw, bh);         // the surface
    drift(wavePat, 32 - t * 2.5, 21 + Math.cos(t * .5) * 2, WATER.waves[1], x0, y0, bw, bh);
    g.fillStyle = WATER.foam;
    for (const [gx, gy, h] of w.glints) {          // glints of sun, each on its own time
      const s = Math.sin(t * 2.2 + h * 40);
      if (s < .86) continue;
      g.globalAlpha = .95;
      g.fillRect(X + gx, Y + gy, 2, 1);
      if (s > .95) { g.fillRect(X + gx, Y + gy - 1, 1, 3); g.globalAlpha = .5; g.fillRect(X + gx - 1, Y + gy, 4, 1); }
    }
    for (const [lx, ly, side, h] of w.foam) {      // foam along the shore, coming in and going out
      const wave = Math.sin(t * 1.4 + h * 6.28), inset = wave > .2 ? 2 : 1, px = X + lx * 16, py = Y + ly * 16;
      const a = 2 + Math.floor(h * 5), len = 16 - a - Math.floor(h * 3);          // not a ruled line: it starts and stops
      for (const [off, alpha] of [[0, .5 + .35 * wave], [1, .22 + .15 * wave]]) {  // a bright line, a paler one behind it
        g.globalAlpha = alpha;
        const i = inset + off * 2;
        if (side === 0) g.fillRect(px + a + off, py + i - 1, len - off * 2, 1);
        else if (side === 2) g.fillRect(px + a + off, py + 16 - i, len - off * 2, 1);
        else if (side === 3) g.fillRect(px + i - 1, py + a + off, 1, len - off * 2);
        else g.fillRect(px + 16 - i, py + a + off, 1, len - off * 2);
      }
    }
    g.restore();
  }
  if (!g) return;
  waterView = {x: vx, y: vy};
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(waterCv, ux0 - vx, uy0 - vy, ux1 - ux0, uy1 - uy0, ox + ux0 * zoom, oy + uy0 * zoom, (ux1 - ux0) * zoom, (uy1 - uy0) * zoom);
}
