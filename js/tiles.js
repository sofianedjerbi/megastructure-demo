// The client's copy of the world: 32x32 blocks patched by tile events, and the ground layer renderer.

// =====================================================================================
//  Tile store: 32x32 blocks, filled from the server and patched by tile events
// =====================================================================================
const B = 32, P = 16;
const smooth = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };   // 0..1, eased
const blocks = new Map();
const bkey = (bx, by) => bx + "," + by;
// The block a tile is in. Tiles are asked for in runs (a tile and the eight round it, a row of a picture), so the
// last block found is kept: no key to put together, nothing to look up. Forgotten whenever the blocks change.
let hitB = null, hitX = NaN, hitY = NaN;
for (const m of ["set", "delete", "clear"]) { const o = blocks[m].bind(blocks); blocks[m] = (...a) => { hitX = NaN; return o(...a); }; }
function blockOf(x, y) {
  const bx = Math.floor(x / B), by = Math.floor(y / B);
  if (bx !== hitX || by !== hitY) { hitX = bx; hitY = by; hitB = blocks.get(bkey(bx, by)) || null; }
  return hitB;
}
function tile(x, y) {
  const b = blockOf(x, y);
  if (!b) return null;
  const i = (y - b.by * B) * B + (x - b.bx * B);
  return [b.comb[i], b.gnd[i]];
}
const combAt = (x, y) => { const t = tile(x, y); return t ? t[0] : null; };
const gndAt = (x, y) => { const t = tile(x, y); return t ? t[1] : null; };
const dirtyTiles = [];                 // tiles to redraw (x, y), processed within a per-frame budget
function touch(x, y) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) dirtyTiles.push(x + dx, y + dy); }
// picked plants: full -> bare (fruit flies to the picker); bare -> full when it grows back
const PICK = {F: "U", b: "v"};
function setTile(x, y, comb, gnd, who = null, col = null) {    // (col: its column of cells, when sent: cells.js)
  const bx = Math.floor(x / B), by = Math.floor(y / B), b = blocks.get(bkey(bx, by));
  if (!b) return;
  const i = (y - by * B) * B + (x - bx * B);
  const relief = col !== null && col >>> 0 !== colAt(x, y);
  if (b.comb[i] === comb && b.gnd[i] === gnd && !relief) return;
  if (relief) {                              // the land changed: edges around redraw
    const c = col >>> 0, f = colFloor(c);
    b.lv[i] = String.fromCharCode(SEA + f);
    if (c !== colSolid(f)) (b.col || (b.col = {}))[i] = c; else if (b.col) delete b.col[i];
    for (let d = -2; d <= 2; d++) touch(x + d, y);
  }
  const old = b.comb[i], now = performance.now();
  if (PICK[old] === comb) picked(x, y, old, who, now);
  else if (old === "T" && comb !== "T") felled(x, y, who, now);
  else if (old !== comb && isObject(comb) && comb !== "x" && PICK[old] !== comb) pops.set(x + "," + y, now);
  const spr = old !== comb && old !== "T" && PICK[old] !== comb && isObject(old) && !isObject(comb) ? objectSprite(old, x, y, now / 1000) : null;
  if (spr && PLUCKED.includes(old)) plucked(x, y, spr, who, now);   // small plants come up and go to the picker
  else if (spr) {                              // anything else taken away falls apart into its own pixels
    shatter(x, y, spr);
    if ("M*%Y^".includes(old)) smoke(x, y + .25, 3, .3);   // stone kicks up a little dust
  } else if (old !== comb && !GROUND.has(old) && old !== "Z" && old !== "z") burst(x, y, old, 10);
  if (gnd === "o" && b.gnd[i] !== "o") debris(x, y, null, 6, {kind: "o", dust: true});
  b.comb[i] = comb; b.gnd[i] = gnd;
  b.objs.delete(i); if (isObject(comb)) b.objs.set(i, comb);
  if (ENCLOSE.has(old) || ENCLOSE.has(comb)) roomsDirty = true;
  touch(x, y);
}
function onRegion(d) {
  if (d.w !== B || d.h !== B || d.x % B || d.y % B) return;
  const bx = d.x / B, by = d.y / B, k = bkey(bx, by);
  const comb = [], gnd = [], lv = [], col = d.cols || null;     // (col: the hollow tiles' columns, by index)
  for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) { comb.push(d.rows[j][i]); gnd.push(d.ground[j][i]); lv.push(d.levels ? d.levels[j][i] : "@"); }
  requested.delete(k);
  const old = blocks.get(k);
  if (old && old.drawn) {             // resync: only redraw what actually changed
    for (let i = 0; i < B * B; i++) {
      const c = col && col[i] !== undefined ? col[i] : colSolid(lv[i].charCodeAt(0) - SEA);
      if (old.comb[i] === comb[i] && old.gnd[i] === gnd[i] && c === colAt(bx * B + i % B, by * B + (i / B | 0))) continue;
      setTile(bx * B + i % B, by * B + (i / B | 0), comb[i], gnd[i], null, c);
    }
    old.at = performance.now(); return;
  }
  const b = {bx, by, comb, gnd, lv, col, objs: new Map(), drawn: false, canvas: null, at: performance.now()};
  comb.forEach((c, i) => { if (isObject(c)) b.objs.set(i, c); });
  blocks.set(k, b);
  // neighbours' edge tiles depend on this block for autotiling
  for (let i = 0; i < B; i++) { dirtyTiles.push(bx * B - 1, by * B + i, bx * B + B, by * B + i, bx * B + i, by * B - 1, bx * B + i, by * B + B); }
}

// =====================================================================================
//  Drawing one tile's ground layers into its block canvas (16 px cell)
// =====================================================================================
const isLand = (g) => g !== null && !wet(g) && g !== ":";
const isObject = (c) => "TFbM*#%+^&?!x\"wtCQ;fBhLpKrgWVXYJmqeyUv".includes(c) && !GROUND.has(c);
function maskOf(x, y, pred) {
  let m = 0;
  const p = (dx, dy) => { const t = tile(x + dx, y + dy); return t === null ? true : pred(t[0], t[1], x + dx, y + dy); };
  if (p(0, -1)) m |= N_; if (p(1, 0)) m |= E_; if (p(0, 1)) m |= S_; if (p(-1, 0)) m |= W_;
  if (p(1, -1)) m |= NE; if (p(1, 1)) m |= SE; if (p(-1, 1)) m |= SW; if (p(-1, -1)) m |= NW;
  return m;
}
function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function drawBlobLayer(g, sheet, x, y, pred, ox, oy, decor) {
  const m = maskOf(x, y, pred), [cx, cy] = blobCell(m);
  let sx = cx * 16, sy = cy * 16;
  if (decor && reduce(m) === 255 && hash(x, y, 3) < decor) {       // plain interior: sprinkle decor variants
    sx = Math.floor(hash(x, y, 4) * (sheet === IMG.grass ? 6 : 5)) * 16; sy = (5 + (hash(x, y, 5) < .5 ? 0 : 1)) * 16;
  }
  g.drawImage(sheet, sx, sy, 16, 16, ox, oy, 16, 16);
}
// The land is painted in the page, a px a number, and handed to the GPU whole, once (a block's ground: relief.js).
// Painted through canvases a piece at a time, a phone's GPU got it wrong where a desktop's did not.
// A sheet's px, read once: a Uint32 a px, its alpha on top.
const BW = B * 16, sheetPx = new Map();
function sheetData(sheet) {
  let m = sheetPx.get(sheet);
  if (!m) {
    const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
    const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(sheet, 0, 0);
    m = {px: new Uint32Array(g.getImageData(0, 0, c.width, c.height).data.buffer), w: c.width, solid: new Map()}; sheetPx.set(sheet, m);
  }
  return m;
}
// Is a sheet's 16 px cell drawn in full, every px of it solid? (what is under such a cell does not show)
function cellSolid(sheet, sx, sy) {
  const m = sheetData(sheet), key = sy * 4096 + sx; let v = m.solid.get(key);
  if (v === undefined) {
    v = true;
    for (let j = 0; j < 16 && v; j++) for (let i = 0; i < 16; i++) if (m.px[(sy + j) * m.w + sx + i] >>> 24 !== 255) { v = false; break; }
    m.solid.set(key, v);
  }
  return v;
}
// A px over another, as a canvas lays it (the sheets' shadows are see-through)
function pxOver(s, d) {
  const sa = (s >>> 24) / 255, da = (d >>> 24) / 255 * (1 - sa), a = sa + da;
  const ch = (k) => Math.round(((s >>> k & 255) * sa + (d >>> k & 255) * da) / a);
  return (Math.round(a * 255) << 24 | ch(16) << 16 | ch(8) << 8 | ch(0)) >>> 0;
}
// A sheet's cell laid on px (to, W wide, at o): a solid one copied a row at a time, another px by px over what is there
function layCell(to, o, W, sheet, sx, sy, solid) {
  const m = sheetData(sheet);
  for (let j = 0, s = sy * m.w + sx; j < 16; j++, s += m.w, o += W) {
    if (solid) { to.set(m.px.subarray(s, s + 16), o); continue; }
    for (let i = 0; i < 16; i++) { const v = m.px[s + i], a = v >>> 24; if (a === 255) to[o + i] = v; else if (a) to[o + i] = pxOver(v, to[o + i]); }
  }
}
// What a tile is made of is first noted, a sheet's cell after the other (LAID), then painted from the last cell that
// is solid all over: on a plateau twelve layers high, the one that shows and not the thirteen under it.
const LAID = {n: 0, img: [], at: [], drawImage(img, sx, sy) { this.img[this.n] = img; this.at[this.n++] = sy * 4096 + sx; }};
let landVer = 0;                                    // (goes up whenever a tile of the land is drawn again: what was worked out from the land is out of date)
function drawTile(x, y, to = null) {                 // (to: {g, ox, oy}, somewhere else than its block's canvas)
  const b = blockOf(x, y);
  if (!b || !(to || b.px)) return;
  const lx = x - b.bx * B, ly = y - b.by * B, i = ly * B + lx, ox = to ? to.ox : lx * 16, oy = to ? to.oy : ly * 16;
  const c = b.comb[i], gr = b.gnd[i], g = LAID, lv = levelAt(x, y), up = (cc, gg, tx, ty) => levelAt(tx, ty) >= k;
  let k = lv;
  g.n = 0;
  // relief: each level lays its hill sheet (grass, darker grass, then stone) over the tiles at least that high; the
  // sheets' edge tiles carry the cliff face, so a plateau shows its south cliff and a soft rim round the rest
  // (looked at from the top level down: under one that is solid all over, nothing is laid)
  for (; k >= 1; k--) { drawBlobLayer(g, hillSheet(k), x, y, up, ox, oy, k < 3 ? .25 : .1); if (cellSolid(g.img[g.n - 1], g.at[g.n - 1] % 4096, g.at[g.n - 1] >> 12)) break; }
  const hills = g.n, covered = k >= 1;
  if (!covered) {                                    // (water tiles stay clear: water.js draws the sea under the land)
    if (gr === ":") {                                // bridge planks run across the direction of travel
      const ew = [-1, 1].some((d) => { const q = gndAt(x + d, y); return q === ":" || isLand(q); });
      g.drawImage(IMG.bridge, ew ? 0 : 32, 32, 16, 16, ox, oy, 16, 16);
    }
    if (isLand(gr)) {
      drawBlobLayer(g, IMG.soil, x, y, (_, gg) => isLand(gg), ox, oy, .15);
      if (gr === "." || gr === "_" || gr === "n") drawBlobLayer(g, IMG.grass, x, y, (_, gg) => gg === "." || gg === "_" || gg === "n", ox, oy, gr === "." ? .3 : 0);
      groundMarks(g, x, y, gr, ox, oy);
    }
    // (round a pit, at sea level and below: the hill sheet's edge alone, the regular border of raised ground, so
    // every side of a hole shows; the ground's own look inside it stays)
    let low = lv;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) low = Math.min(low, levelAt(x + dx, y + dy));
    for (k = low + 1; k <= Math.min(0, lv); k++) drawBlobLayer(g, edgeSheet("hill1"), x, y, up, ox, oy, 0);
  }
  const base = g.n;
  if (lv && isLand(gr)) groundMarks(g, x, y, gr, ox, oy);           // paths, tilled soil, floors up on the hill
  if (c === "H") drawBlobLayer(g, IMG.hedge, x, y, (cc) => cc === "H", ox, oy, 0);
  const hd = hash(x, y, 41);
  if (gr === "~" && hd < .09) {                      // shore water: lily pads, reeds, little rocks
    const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isLand(gndAt(x + dx, y + dy)));
    if (shore || hd < .015) {
      const pick = Math.floor(hash(x, y, 42) * 7), col = [8, 9, 10, 11, 6, 7, 0][pick];
      g.drawImage(IMG.water_objects, col * 16, 0, 16, 16, ox, oy, 16, 16);
    }
  }
  // in the order they lie: the ground and what is laid on it, the hill's levels from the lowest (they were noted
  // from the top down), then what is on top of the hill. From the last one that hides all under it.
  const order = [];
  for (let j = hills; j < base; j++) order.push(j);
  for (let j = hills - 1; j >= 0; j--) order.push(j);
  for (let j = base; j < g.n; j++) order.push(j);
  let first = order.length - 1;
  while (first >= 0 && !cellSolid(g.img[order[first]], g.at[order[first]] % 4096, g.at[order[first]] >> 12)) first--;
  const at = (q) => [g.img[order[q]], g.at[order[q]] % 4096, g.at[order[q]] >> 12];
  if (to) { for (let q = Math.max(0, first); q < order.length; q++) { const [img, sx, sy] = at(q); to.g.drawImage(img, sx, sy, 16, 16, ox, oy, 16, 16); } return; }
  const o = ly * 16 * BW + lx * 16;
  if (first < 0) for (let j = 0; j < 16; j++) b.px.fill(0, o + j * BW, o + j * BW + 16);   // (nothing solid all over it: what was there must go first)
  for (let q = Math.max(0, first); q < order.length; q++) layCell(b.px, o, BW, ...at(q), q === first);
  (b.solid || (b.solid = new Uint8Array(B * B)))[i] = first < 0 ? 0 : 1;   // (relief.js: under a tile solid all over, nothing shows)
  b.reliefDirty = true;                              // (its stacked levels are rebuilt from these px: relief.js)
  b.ver = (b.ver || 0) + 1; landVer++;
}
// what's laid on the ground: tilled soil (wet or not), floors, ash, cobble
function groundMarks(g, x, y, gr, ox, oy) {
  if (gr === "o" || gr === "u") drawBlobLayer(g, IMG.tilled, x, y, (_, gg) => gg === "o" || gg === "u", ox, oy, 0);
  if (gr === "u") drawBlobLayer(g, IMG.tilled_wet, x, y, (_, gg) => gg === "u", ox, oy, 0);
  if (gr === "n") g.drawImage(IMG.bridge, 0, 32, 16, 16, ox, oy, 16, 16);
  if (gr === "'") drawBlobLayer(g, IMG.ash, x, y, (_, gg) => gg === "'", ox, oy, 0);
  if (gr === "_") g.drawImage(IMG.cobble, [16, 32, 0][Math.floor(hash(x, y, 9) * 3)], [16, 32, 48][Math.floor(hash(x, y, 10) * 3)], 16, 16, ox, oy, 16, 16);
}

// Level k's sheet: grass (1-2), darker grass (3-4), stone above; each layer up a touch brighter, so terraces of the
// same sheet still read as steps
const hillSheets = {};
function hillSheet(k) {
  if (hillSheets[k]) return hillSheets[k];
  const img = IMG[k <= 2 ? "hill1" : k <= 4 ? "hill2" : "hill3"], f = k <= 0 ? 1 : k <= 4 ? 1 + .04 * ((k - 1) % 2) : .92 + .024 * (k - 5);
  if (f === 1) return hillSheets[k] = img;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  for (let i = 0; i < px.length; i += 4) for (let j = 0; j < 3; j++) px[i + j] = Math.min(255, px[i + j] * f);
  g.putImageData(d, 0, 0);
  return hillSheets[k] = c;
}
// A hill sheet with its top cleared: only its edges, rims and cliff faces (for holes, and the rock round caves)
// (the rock's own, underground: "rock", the stone sheet's edges a good deal darker, so a cave's rim reads as rock,
// not as a pale frame on the dark)
const EDGE_TOP = {hill1: [192, 212, 112], hill3: [193, 200, 185], rock: [193, 200, 185]}, edgeSheets = {};
function edgeSheet(name) {
  if (edgeSheets[name]) return edgeSheets[name];
  const img = IMG[name === "rock" ? "hill3" : name], c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data, [r, gg, b] = EDGE_TOP[name];
  for (let i = 0; i < px.length; i += 4) {
    if (Math.abs(px[i] - r) + Math.abs(px[i + 1] - gg) + Math.abs(px[i + 2] - b) < 30) px[i + 3] = 0;
    else if (name === "rock") { px[i] *= .52; px[i + 1] *= .5; px[i + 2] *= .5; }
  }
  g.putImageData(d, 0, 0);
  return edgeSheets[name] = c;
}
// A block's ground: its px (b.px), every tile of it painted a little a frame, or at once. What is shown of it is a
// canvas made of them when its raised picture is (b.canvas: relief.js)
function startBlock(b) {
  b.px = new Uint32Array(BW * BW); b.drawn = true;
  for (let ly = B - 1; ly >= 0; ly--) for (let lx = B - 1; lx >= 0; lx--) dirtyTiles.push(b.bx * B + lx, b.by * B + ly);
}
function renderBlock(b) {
  b.px = new Uint32Array(BW * BW);
  for (let ly = 0; ly < B; ly++) for (let lx = 0; lx < B; lx++) drawTile(b.bx * B + lx, b.by * B + ly);
  b.drawn = true;
}
// px as a canvas, made once and never drawn on again
function pxCanvas(px, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(px.buffer, px.byteOffset, w * h * 4), w, h), 0, 0);
  return c;
}
