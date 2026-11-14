// Relief, stacked: each level is drawn RELIEF_STEP px higher than the one under it (sea level in place, a pit's floor
// lower), with everything standing on it, so a two-layer drop looks taller than a one-layer one. A block's ground
// canvas is drawn at its lowest level; over it goes one more picture, its raised levels: for each level above, a
// copy of the ground cut to the tiles at least that high, painted one over the other when the block is built (not
// each frame: a level a canvas was ten canvases a block, and eight screens of paint a frame). Where a lifted level
// ends over lower ground its wall is painted down to the ground below: solid earth, a band per layer (lit along its
// top, darker at its foot), in the colours of that layer's own sheet, the pack's ink at the very foot.

// A layer is half a tile high: two layers, one tile (a cave two blocks high is as tall as you are)
const RELIEF_STEP = 8;                                       // art px a level
const shOf = (L) => RELIEF_STEP * L;                          // how far up a level is drawn (a pit's, down): every layer the same step

// Where a body stands in its tile, a person or a creature alike: STAND art px higher than its sheet puts it. The
// sheets put the feet 2 px over the tile's bottom: the shadow on the line between two tiles, hanging off a ledge's
// brink, a tile short of a wall to the north. So: feet 5 px over the bottom, in line with the rocks and crops beside
// it, the body in the middle of its tile. UP: the same in tiles (its dust, what flies to it, where it is looked for).
const STAND = 3, UP = STAND / 16;
const bodyY = (p, sy) => sy(p.y, p.x) - STAND * zoom;         // a body's place on screen (the top of its tile, lifted with its ground, and STAND)

// Something flying off from a spot (a puff, a spark, debris): it keeps the height of where it started, however it
// drifts (it doesn't step up and down with the tiles it passes over)
function liftFrom(o) { if (o.lift === undefined) o.lift = liftOf({x: o.x, y: o.y}); return o.lift; }
// Screen px something on tile (x, y) is drawn higher by
const liftAt = (x, y) => shOf(standAt(x, y)) * zoom;
// ...and someone between two tiles: in proportion to how far along they are
function liftOf(p) {
  const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
  const f = ax === bx ? p.y - ay : p.x - ax, a = liftAt(ax, ay), b = liftAt(bx, by);
  return a + (b - a) * f;
}

// A sheet's colours, read off its own tiles: its wall bands [lit, mid, dark] (its south face) and its side edge from
// the outside in (its west edge tile), which the ledges are drawn in; and its plain top
const sheetCols = new Map();
function colsOf(sheet) {
  if (sheetCols.has(sheet)) return sheetCols.get(sheet);
  const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
  const g = c.getContext("2d"); g.drawImage(sheet, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data, at = (x, y) => Array.from(data.slice((y * c.width + x) * 4, (y * c.width + x) * 4 + 4));
  const [ex, ey] = blobCell(N_ | E_ | W_ | NE | NW), [wx, wy] = blobCell(N_ | S_ | E_ | NE | SE), [ix, iy] = blobCell(255);
  let ink = 15; while (ink > 0 && at(ex * 16 + 8, ey * 16 + ink)[3] === 0) ink--;
  const l = at(ex * 16 + 8, ey * 16 + ink - 1), d = at(ex * 16 + 8, ey * 16 + ink - 2);
  let w0 = 0; while (w0 < 15 && at(wx * 16 + w0, wy * 16 + 8)[3] < 128) w0++;
  const side = [0, 1, 2, 3].map((i) => at(wx * 16 + w0 + i, wy * 16 + 8));
  const [nx, ny] = blobCell(S_ | E_ | W_ | SE | SW);
  let n0 = 0; while (n0 < 15 && at(nx * 16 + 8, ny * 16 + n0)[3] < 128) n0++;
  const out = {bands: [l, [(d[0] + l[0]) / 2, (d[1] + l[1]) / 2, (d[2] + l[2]) / 2], d], side, top: at(ix * 16 + 8, iy * 16 + 8),
               foot: ink + 1, inset: w0, north: n0};   // (in the tile: where its south face ends, its side edge and its far edge start)
  sheetCols.set(sheet, out); return out;
}

// A sheet cell's shape: 1 where its pixel is drawn (16x16)
const cellAlphas = new Map();
function cellAlpha(sheet, cx, cy) {
  let m = cellAlphas.get(sheet);
  if (!m) {
    const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
    const g = c.getContext("2d"); g.drawImage(sheet, 0, 0);
    m = {data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, cells: new Map()}; cellAlphas.set(sheet, m);
  }
  const key = cx * 100 + cy;
  if (!m.cells.has(key)) {
    const a = new Uint8Array(256);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) a[j * 16 + i] = m.data[((cy * 16 + j) * m.w + cx * 16 + i) * 4 + 3] > 128 ? 1 : 0;
    m.cells.set(key, a);
  }
  return m.cells.get(key);
}

// The lifted levels of a rect of tiles R = {x, y, w, h}: a block's, built when its ground canvas changed, or the few
// tiles round you the x-ray circle shows (xray.js). Each level k: its body (a wall band a layer high, lit at its top,
// dark at its foot), the ledge round the level above it (LEDGE px, in the sheet's own side-edge colours: a +3 shows
// three edges on every side), then its own tiles on top, where you stand. Worked out over the rect and a tile round
// it, so ledges cross block borders.
const LEDGE = 4, SIDE_MAX = 2;
// The rect's levels and two tiles round it, read once: lv, and gone (no tile there yet: for the tiles beside it, it
// counts as ground of every height, as maskOf has it)
function rectLevels(R) {
  const Ws = R.w + 4; R.lv = new Int8Array(Ws * (R.h + 4)); R.gone = new Uint8Array(R.lv.length);
  for (let ty = -2; ty < R.h + 2; ty++) for (let tx = -2; tx < R.w + 2; tx++) {
    const j = (ty + 2) * Ws + tx + 2; R.lv[j] = levelAt(R.x + tx, R.y + ty); R.gone[j] = tile(R.x + tx, R.y + ty) === null ? 1 : 0;
  }
}
// A level's shape in the rect and a tile round it (a byte a px, 1 where it is): `own`, its own tiles, from its sheet's
// cells; `sh`, that and the ledges of the levels above it (shape: those, already worked out); `edge`: where in it the
// tiles are that end it on a side (the others, whole and with whole tiles round them, grow no ledge). ta..tb: the rows
// of tiles asked for. keep: of the tiles it says only (and of a shape already made: `of`)
const wholeCells = new Map();                          // (a sheet's inner cell: every px of it drawn?)
function levelShape(R, k, shape, ta, tb, keep, of) {
  const Ws = R.w + 4, Wm = (R.w + 2) * 16, own = new Uint8Array(Wm * (R.h + 2) * 16), sheet = hillSheet(k), edge = [];
  const full = keep ? null : new Uint8Array(R.lv.length);     // (the tiles that are this level's all over: every px, with its own all round)
  if (!wholeCells.has(sheet)) wholeCells.set(sheet, cellAlpha(sheet, ...blobCell(255)).every((v) => v === 1));
  const whole = wholeCells.get(sheet), at = new Uint8Array(R.lv.length);   // (at: this high, or not here yet)
  for (let j = 0; j < at.length; j++) at[j] = R.gone[j] || R.lv[j] >= k ? 1 : 0;
  for (let ty = ta; ty <= tb; ty++) for (let tx = -1, run = -2; tx <= R.w + 1; tx++) {
    const j = (ty + 2) * Ws + tx + 2, o = (ty + 1) * 16 * Wm + (tx + 1) * 16;
    let m = -1;
    if (tx <= R.w && R.lv[j] >= k && !(keep && !keep[j])) {
      m = 0;
      if (at[j - Ws]) m |= N_; if (at[j + 1]) m |= E_; if (at[j + Ws]) m |= S_; if (at[j - 1]) m |= W_;
      if (at[j - Ws + 1]) m |= NE; if (at[j + Ws + 1]) m |= SE; if (at[j + Ws - 1]) m |= SW; if (at[j - Ws - 1]) m |= NW;
      if (m !== 255 || !whole) edge.push(o);
    }
    const plain = m === 255 && whole && !of;                // (a run of whole tiles side by side is filled a row of px at a time)
    if (plain) { full[j] = 1; if (run < -1) run = tx; }
    else if (run >= -1) { for (let r = 0, q = (ty + 1) * 16 * Wm + (run + 1) * 16; r < 16; r++, q += Wm) own.fill(1, q, q + (tx - run) * 16); run = -2; }
    if (m < 0 || plain) continue;
    if (of) { for (let r = 0; r < 16; r++) own.set(of.subarray(o + r * Wm, o + r * Wm + 16), o + r * Wm); continue; }
    const [cx, cy] = blobCell(m), a = cellAlpha(sheet, cx, cy);
    for (let r = 0; r < 16; r++) for (let i = 0; i < 16; i++) if (a[r * 16 + i]) own[o + r * Wm + i] = 1;
  }
  // (round it, the layers over it stick out a ledge each: SIDE_MAX of them at the most, so a cliff's side never
  // reaches further than half a tile onto the ground beside it, where people stand: n px out from every px of theirs
  // that ends a row)
  const sh = new Uint8Array(own);
  // (kept tiles only: out from where the land itself ends, not from beside a tile left out)
  for (let n = 1; n <= SIDE_MAX; n++) if (shape[k + n]) for (const o of shape[k + n].edge) {
    const src = shape[k + n].own, land = shape[k + n].land;
    for (let r = 0; r < 16; r++) for (let q = o + r * Wm, e = q + 16, row = q - q % Wm; q < e; q++) {
      if (!src[q]) continue;
      sh[q] = 1;                                         // (its own px too: a level's edge may be set in further than the one over it)
      if (!land[q - 1]) for (let d = 1; d <= LEDGE * n && q - d >= row; d++) sh[q - d] = 1;
      if (!land[q + 1]) for (let d = 1; d <= LEDGE * n && q + d < row + Wm; d++) sh[q + d] = 1;
    }
  }
  return {own, sh, edge, full, land: of || own};
}
// Painted lowest level first into one picture, a few rows a step (so no frame waits on a whole block). ground: the
// rect's tiles as painted flat, a Uint32 a px (a block's: tiles.js). The picture is px too, worked out here and made
// a canvas once, at the end: nothing of it is put together by the GPU. -> {flat, up, maxLv, minLv}: the picture is
// `up` px taller than the rect at its top (the highest level's lift), the lowest level's worth at its foot.
// see (xray.js): the land without the rock in the way. Only the tiles see.keep says are painted, exactly as they are
// with that rock there (every shape and colour is still worked out from the whole land), into the rows c0..c1 of the
// picture alone. What becomes of each px is noted as the land is painted, in the order it is painted in: see.state
// (1: ground that is kept is on top of what is painted; 2: the inside of the rock, where it stood against kept ground:
// nothing to see), see.cover (1: on the real land the rock left out is on top there), see.wet (water shows there).
function* reliefSteps(R, ground, see) {
  rectLevels(R);
  const M = 16, W = R.w * 16, H = R.h * 16, Wm = W + 2 * M, Ws = R.w + 4, STEP = RELIEF_STEP;
  let maxLv = -99, minLv = see ? 99 : 0;                // (a block's ground canvas is drawn at its lowest level, the sea's at the highest)
  for (let ty = -1; ty <= R.h; ty++) for (let tx = -1; tx <= R.w; tx++) { const l = R.lv[(ty + 2) * Ws + tx + 2]; maxLv = Math.max(maxLv, l); minLv = Math.min(minLv, l); }
  const up = shOf(maxLv), top = see ? -see.c0 : up, tall = see ? see.c1 - see.c0 : H + up - shOf(minLv);
  // level k's px rows that land in the picture (and STEP over them: where its wall may start), and the rows of tiles
  // its shape is asked for (the two levels under it take their ledges from it)
  const span = (k) => [Math.max(0, shOf(k) - top - STEP), Math.min(H + STEP, tall + shOf(k) - top)];
  const tiles = (k) => see ? [Math.max(-1, (shOf(k) - top - 3 * STEP >> 4) - 1), Math.min(R.h, (tall + shOf(k) - top >> 4) + 1)] : [-1, R.h];
  const shape = {}, kept = {};
  for (let k = maxLv; k > minLv; k--) {                // the shapes, from the top down: each grows round the one above
    shape[k] = levelShape(R, k, shape, ...tiles(k));
    if (see) kept[k] = levelShape(R, k, kept, ...tiles(k), see.keep, shape[k].own);
    yield;
  }
  const out = see || maxLv > minLv ? new Uint32Array(W * tall) : null;
  // a tile of the ground as painted, put at row Y of the picture (see: the ground itself, at the lowest level)
  if (see) see.base(R, (i, j, Y) => { for (let r = Math.max(0, -Y); r < 16 && Y + r < tall; r++) out.set(ground.subarray((j * 16 + r) * W + i * 16, (j * 16 + r) * W + i * 16 + 16), (Y + r) * W + i * 16); }, top - shOf(minLv), minLv);
  // px rows since the shape was last met, down each column; and since kept ground was
  const since = new Int16Array(W), mine = see ? new Int16Array(W) : since;
  // see: the line over row ty of tiles, at level k, a px column each. 1: rock left out stands this high under it,
  // against kept ground: under a kept tile, or, over lower ground, beside a kept hill that goes on south, as far out
  // as that hill's side reaches (reach: the columns a kept ledge has got to at a level under this one, where the
  // side is widest: they hold for every level of the rock, so nothing of the side is left over higher up). There is
  // no wall there and nothing to see but the rock's inside, whatever is painted there otherwise. 2: a kept tile ends
  // there over lower ground: its wall, which the rock's ledge may have hidden
  const reach = see && new Uint8Array((R.h + 2) * W), ja = see && new Uint8Array(W), jb = see && new Uint8Array(W);
  const joins = (k, ty, ksh, to) => {
    to.fill(0);
    for (let tx = 0; tx < R.w; tx++) {
      const j = (ty + 1) * Ws + tx + 2, x0 = tx * 16, under = !see.keep[j + Ws] && R.lv[j + Ws] >= k;   // (j: the tile over the line)
      if (see.keep[j] && R.lv[j] >= k) to.fill(under ? 1 : R.lv[j + Ws] < k ? 2 : 0, x0, x0 + 16);
      else if (under && R.lv[j] < k) for (const d of [-1, 1]) {
        const hill = see.keep[j + d] && R.lv[j + d] >= k && R.lv[j + d + Ws] >= k;
        for (let x = d < 0 ? x0 : x0 + 8, e = x + 8; x < e; x++) {
          const q = ty * W + x;
          if (hill) for (let r = 0, i = ty * 16 * Wm + x + M; r < 16 && !reach[q]; r++, i += Wm) reach[q] = ksh[i];
          to[x] = reach[q];
        }
      }
    }
  };
  for (let k = minLv + 1; k <= maxLv; k++) {
    const {own, sh} = shape[k], kown = see && kept[k].own, ksh = see && kept[k].sh, cols = colsOf(hillSheet(k)), off = top - shOf(k), [ya, yb] = span(k), n = yb - ya;
    const state = see && see.state, cover = see && see.cover, wet = see && see.wet;
    if (n <= 0) continue;
    // A block's tiles are gone over sixteen px at a time where there is nothing to work out. 1: a tile that is this
    // level's all over, with the level above all over it and all over the tile south of it, both solid as drawn
    // (tiles.js): those two hide it to the last px, nothing of it is painted (of a terrace twelve layers up, the
    // eleven under it). 2: a tile the level is nowhere near: not its own, no ledge of the two levels above can reach
    // it from the tile beside it, and none of that in the tile north of it either, whose wall would come down into
    // it. 3: a tile that is this level's all over, and shows: the ground as drawn, the whole of it.
    let skip = null;
    if (!see) {
      const f = shape[k].full, f1 = shape[k + 1] && shape[k + 1].full, near = (j) => R.lv[j] >= k || R.lv[j - 1] > k || R.lv[j + 1] > k;
      skip = new Uint8Array(R.w * R.h);
      for (let ty = 0; ty < R.h; ty++) for (let tx = 0; tx < R.w; tx++) {
        const j = (ty + 2) * Ws + tx + 2, q = ty * R.w + tx;
        if (!near(j) && !near(j - Ws)) skip[q] = 2;
        else if (f1 && R.solid && ty < R.h - 1 && f[j] && f1[j] && f1[j + Ws] && R.solid[q] && R.solid[q + R.w]) skip[q] = 1;
        else if (f[j]) skip[q] = 3;
      }
    }
    since.fill(99); mine.fill(99);
    for (let y = ya; y < yb; y++) {
     if (y > ya && !(y - ya & 31)) yield;                 // (a step every 32 rows: no frame waits on more)
     if (see && (y === ya || !(y & 15))) { if (y === ya) joins(k, y >> 4, ksh, ja); else ja.set(jb); joins(k, (y >> 4) + 1, ksh, jb); }
     const row = skip && y < H ? (y >> 4) * R.w : -1, fy = y + off, fo = fy * W, inPic = fy >= 0 && fy < tall;
     for (let x = 0; x < W; x++) {
      const sk = row >= 0 && !(x & 15) ? skip[row + (x >> 4)] : 0;
      if (sk) {                                          // (in a tile of its own the shape was just met; past an empty one it is as far as it was)
        if (sk === 3 && R.solid && R.solid[row + (x >> 4)]) out.set(ground.subarray(y * W + x, y * W + x + 16), fo + x);
        else if (sk === 3) for (let i = x; i < x + 16; i++) { const v = ground[y * W + i], a = v >>> 24; if (a === 255) out[fo + i] = v; else if (a) out[fo + i] = pxOver(v, out[fo + i]); }
        if (sk !== 2 && (y & 15) === 15) since.fill(0, x, x + 16);
        x += 15; continue;
      }
      const i = (y + M) * Wm + x + M, s = sh[i], on = y < H && s, cut = see && ja[x] === 1 && (y & 15) < STEP;
      const ours = on && !cut && (!see || kown[i] || (ksh[i] && !own[i]));
      since[x] = on ? 0 : since[x] + 1; if (see) mine[x] = ours ? 0 : mine[x] + 1;
      const f = fo + x, shown = see && inPic;
      let c = null;
      if (ours && own[i]) {                                                   // its own tiles: the ground as painted, cut to its shape
        const v = ground[y * W + x], a = v >>> 24;
        if (inPic) { if (a === 255) out[f] = v; else if (a) out[f] = pxOver(v, out[f]); }
      } else if (ours) {                                                      // the ledge, where the shape is not its own tiles
        let ownL = false, ownR = false;
        for (let j = 1; j <= LEDGE; j++) { if (own[i - j]) ownL = true; if (own[i + j]) ownR = true; }
        if (ownL && ownR) c = cols.top;                    // (a sliver between two of its own edges: its top)
        else { let dd = 0; while (dd < 3 && sh[i - dd - 1] && sh[i + dd + 1]) dd++; c = cols.side[dd]; }
      }
      // under its edge, its body: the wall, a band. (see: none where rock left out stands against kept ground, a
      // layer down from the line (joins), nor in what a ledge's rounded end leaves over that line; and none on the
      // rock left out, but under a kept tile whose wall its ledge hid. A wall: where the level ends, as anywhere)
      const inside = cut || (see && !ours && jb[x] === 1 && !s && mine[x] <= STEP);
      if (!ours && !inside && mine[x] <= STEP && (!s || (see && on && ja[x] === 2))) c = cols.bands[mine[x] === 1 ? 0 : mine[x] === STEP ? 2 : 1];
      if (c && inPic) out[f] = (255 << 24 | (c[2] | 0) << 16 | (c[1] | 0) << 8 | (c[0] | 0)) >>> 0;
      if (!shown) continue;
      if (ours || c) { state[f] = 1; cover[f] = !ours && (on || since[x] < mine[x]) ? 1 : 0; if (k === 0 && ours && own[i]) wet[f] = 1; }
      else {                                                                  // the rock left out, and its wall
        if (on || (!s && since[x] <= STEP && since[x] < mine[x])) cover[f] = 1;
        if (inside) state[f] = 2, wet[f] = 0;
      }
     }
    }
    yield;
  }
  const flat = out && pxCanvas(out, W, tall);            // (handed to the GPU whole, once)
  return {flat, up, maxLv, minLv};
}
// A block's: its picture, and where that has anything in it (a small hill in a wide plain: the rest is not painted,
// frame after frame): the raised tiles, their ledges beside them, their walls down to the lowest ground
function* blockRelief(b) {
  const R = {x: b.bx * B, y: b.by * B, w: B, h: B, solid: b.solid}, Wb = B * 16, Ws = B + 4;
  const {flat, up, maxLv, minLv} = yield* reliefSteps(R, b.px);
  let box = null;
  if (flat) {
    let x0 = Wb, y0 = flat.height, x1 = 0, y1 = 0;
    for (let ty = -1; ty <= B; ty++) for (let tx = -1; tx <= B; tx++) {
      const l = R.lv[(ty + 2) * Ws + tx + 2]; if (l <= minLv) continue;
      x0 = Math.min(x0, tx * 16 - LEDGE * SIDE_MAX); x1 = Math.max(x1, tx * 16 + 16 + LEDGE * SIDE_MAX);
      y0 = Math.min(y0, ty * 16 + up - shOf(l)); y1 = Math.max(y1, ty * 16 + 17 + up - shOf(minLv));
    }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(Wb, x1); y1 = Math.min(flat.height, y1);
    if (x1 > x0 && y1 > y0) box = [x0, y0, x1 - x0, y1 - y0];
  }
  yield* waterSteps(b);                                // (its water too, water.js: the block shows once all of it is there)
  if (b.shown !== b.ver) { b.canvas = pxCanvas(b.px, Wb, Wb); b.shown = b.ver; }   // (its ground as it is now, a canvas: with the raised picture made of it, never one without the other)
  b.relief = {flat: box && flat, up, maxLv, minLv, box};
}
function buildRelief(b) { for (const _ of blockRelief(b)); b.reliefDirty = false; }   // (all at once: tests, tools)
// The raised ground of the blocks coming (render.js: in the order they are wanted) is built a step at a time, until
// the frame's time for land is up. Not while tiles wait to be drawn: it is built from the ground as drawn, whole.
// (A block's ground redrawn while it is being built, the first time too (the block beside it arriving changes its
// edge): it is built again from the start, what it had read being out of date. Dropped, that left a column of flat
// ground along the edge.)
function reliefWork(coming, until) {
  if (dirtyTiles.length) return;
  let stepped = false;
  for (const b of coming) {
    if (!b.px) continue;
    if (b.reliefDirty || (!b.relief && !b.reliefGen)) b.reliefGen = blockRelief(b);
    b.reliefDirty = false;
    while (b.reliefGen && (!stepped || performance.now() < until)) { stepped = true; if (b.reliefGen.next().done) b.reliefGen = null; }
    if (b.reliefGen) return;
  }
}
// A block's ground, with its levels stacked. One never built isn't shown until it is (never its flat ground, which
// would then jump up); one rebuilt keeps showing what it was until the new one is ready.
function drawBlockRelief(b, sx, sy, S) {
  if (!b.relief) return;
  const X = sx(b.bx * B), Y = sy(b.by * B);
  ctx.drawImage(b.canvas, X, Y - shOf(b.relief.minLv) * zoom, B * S, B * S);
  const f = b.relief.flat, [fx, fy, fw, fh] = b.relief.box || [];
  if (f) ctx.drawImage(f, fx, fy, fw, fh, X + fx * zoom, Y + (fy - b.relief.up) * zoom, fw * zoom, fh * zoom);
}
