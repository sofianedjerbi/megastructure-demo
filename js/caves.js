// Caves (client). The land is cells (cells.js); a cave is empty cells under solid ones, and nothing more. From outside
// it is the hill over it; where its empty cells meet a face of the hill you can see, they show (an entry is only
// that). The cave you walk into is seen through the hill, like a house with its roof off. (The lifted ground: relief.js.)

// The cave you're in: from your tile, the tiles beside it you'd walk (or drop) onto under solid cells, and on from
// there (up to a few thousand). "x,y" -> the height of its floor there.
function caveOf(at) {
  const seen = new Map([[at.x + "," + at.y, at.z]]), stack = [[at.x, at.y, at.z]];
  while (stack.length && seen.size < 4000) {
    const [x, y, z] = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + "," + (y + dy);
      if (seen.has(k)) continue;
      const z2 = landAt(z, x + dx, y + dy, x, y);
      if (z2 !== null && coveredAt(x + dx, y + dy, z2)) { seen.set(k, z2); stack.push([x + dx, y + dy, z2]); }
    }
  }
  return seen;
}
// Walking into a cave (or out): that cave is shown through the hill (or not) at once. Nothing of the land is redrawn:
// the open cave is an overlay, a canvas a block, drawn once (below).
let caveStamp = 0;                        // (goes up when the open cave changes: the overlays are redrawn)
function setCaveOpen() {
  const me = ents.get("agent" + myId);
  let into = null;                        // the cave tile you're stepping into: its cave opens as you set off, not half way
  if (me) {
    const x = Math.round(me.x), y = Math.round(me.y);        // (where you're seen, which runs ahead of the server's tile)
    if (!myAt || myAt.x !== x || myAt.y !== y) {             // your height, kept as the server keeps it (Movement.landing)
      let z = myAt && Math.abs(myAt.x - x) + Math.abs(myAt.y - y) === 1 ? landAt(myAt.z, x, y, myAt.x, myAt.y) : null;
      const told = me.e && me.e.z !== undefined ? me.e.z : meObs && meObs.self.z !== undefined ? meObs.self.z : 99;
      if (z === null) z = settleAt(x, y, told);              // (woken, moved: where the server has you)
      myAt = {x, y, z};
    } else myAt.z = settleAt(x, y, myAt.z);                  // (the ground dug from under you: down you come)
    // standing where the server has you: its height for you is the truth (yours can go stale: a fall you didn't see,
    // a respawn; you then couldn't step off a height you weren't on)
    if (me.e && me.e.z !== undefined && me.e.x === x && me.e.y === y && Math.abs(me.x - x) < .001 && Math.abs(me.y - y) < .001 && !pred) myAt.z = settleAt(x, y, me.e.z);
    const ox = x + (me.x > x + .001 ? 1 : me.x < x - .001 ? -1 : 0), oy = y + (me.y > y + .001 ? 1 : me.y < y - .001 ? -1 : 0);
    if ((ox !== x) !== (oy !== y)) { const z = landAt(myAt.z, ox, oy, x, y); if (z !== null && coveredAt(ox, oy, z)) into = {x: ox, y: oy, z}; }
  }
  showXYZ();
  const here = myAt && coveredAt(myAt.x, myAt.y, myAt.z) ? myAt : into;
  if (!here === !caveOpen && (!here || openCave.get(here.x + "," + here.y) === here.z)) return;
  caveOpen = !!here; openCave = here ? caveOf(here) : new Map(); caveStamp++;
  caveDepth = caveDepths();
}
// Someone under a hill you're not in: not seen. Nor someone up on the hill over the cave you are in (its roof isn't
// drawn: you look in). (You: by the height you're at; the others, people and creatures, by the server's.)
function unseen(p) {
  const x = Math.round(p.x), y = Math.round(p.y);
  if (!roofAt(x, y)) return false;
  const mine = p.e.kind === "agent" && p.e.id === myId, z = mine && myAt ? settleNear(x, y, myAt.z) : p.e.z !== undefined ? p.e.z : floorAt(x, y);
  return inOpenCave(x, y) ? !mine && z > openCave.get(x + "," + y) : coveredAt(x, y, z);
}

// A block's caves as seen now, on one canvas in art px (with OV_M px round it), or null when there's nothing to see:
// where the empty cells of its hills show on their faces, and the open cave's floor, shadowed along its edges, with the wall
// at its back.
const OV_M = 128, HOLE = "#2a1d28", HOLE_DEEP = "#1d141c", HOLE_RIM = "rgba(48,30,34,.55)", SHADE = "30,20,28";
const SPILL = [[9, 1], [5, 2]], SPILL_AL = [0, .17, .31];   // an opening's shadow: how far out, and how dark, in two steps
// The empty cells of the hill on (x, y) that show on its face toward (dx, dy): runs [lowest, highest] of cells above
// the ground in front of it and under its top. (None where that side isn't lower, or for the cave you're in.)
function shownVoids(x, y, dx, dy) {
  const c = colAt(x, y), top = colTop(c), front = topAt(x + dx, y + dy), out = [];
  if (front >= top || inOpenCave(x, y)) return out;
  for (let z = front + 1; z < top; z++) {
    if (c >>> (z - LOW) & 1) continue;
    const lo = z; while (z + 1 < top && !(c >>> (z + 1 - LOW) & 1)) z++;
    out.push([lo, z]);
  }
  return out;
}
const shownCell = (x, y, z, dx, dy) => !inOpenCave(x, y) && z > topAt(x + dx, y + dy) && z < topAt(x, y) && !solidAt(x, y, z);
// The openings on one face of a hill tile, a cell at a time: an opening is only the empty cells that show there, so
// cells side by side or one over the other (on this tile or the next along the face) run together into one hole of
// whatever shape they make. (X, Y): the tile's corner at sea level, in art px. Always in the hill's wall: facing south
// a layer of the wall a cell; facing east or west the same opening turned on its side, in the side's wall (LEDGE px
// a cell: the lowest outermost, the next one in from it; rimmed and darker in under the hill, open outward); under
// the lowest its shadow spills out (on the ground, or down the wall). Facing north it is behind the hill: only that
// shadow, on the ground from under the hill's edge, fading.
// Round a corner they are one opening too: at a corner of the hill, where a cell shows on its south wall and on its
// side, the hole in the wall runs to the one in the side; in a corner between two walls, the side's runs up to the
// wall's. Their shadows join the same way (m: the block's shadow px, W wide, each shaded once however many reach it).
// Higher ground in front of it (south) is drawn over it: from that ground's far edge down, nothing of it shows.
// (faceSkip: but for the ground it says: the rock the x-ray circle sees through.)
let faceSkip = null;
function drawFace(g, m, W, X, Y, x, y, dx, dy) {
  const top = topAt(x, y), front = topAt(x + dx, y + dy), cols = colsOf(hillSheet(Math.max(1, top))), px = dy ? 1 : 0, py = dy ? 0 : 1;
  const open = (z, side) => shownCell(x + side * px, y + side * py, z, dx, dy);      // the same cell, a tile along the face
  let lim = 1e9;
  if (dy >= 0) for (let ty = y + dy + 1; ty <= y + 9; ty++) { const l = topAt(x + dx, ty); if (l > front && !(faceSkip && faceSkip(x + dx, ty))) lim = Math.min(lim, Y + (ty - y) * 16 - shOf(l) + 1); }
  const fill = (col, ax, ay, w, h) => { h = Math.min(h, lim - Y - ay); if (w > 0 && h > 0) { g.fillStyle = col; g.fillRect(X + ax, Y + ay, w, h); } };
  const clear = (ax, ay, w, h) => { h = Math.min(h, lim - Y - ay); if (h > 0) g.clearRect(X + ax, Y + ay, w, h); };
  const mark = (ax, ay, v) => { const k = (Y + ay) * W + X + ax; if (Y + ay < lim && m[k] < v) m[k] = v; };
  // a side wall's layer z (on the side sdx of tile tx, ty): how far in from the tile's edge it starts (under 0: out
  // over the ground). The side's wall shows SIDE_MAX layers at the most: the lowest outermost, the rest in from it
  const sideOut = (tx, ty, sdx, z) => { const f = topAt(tx + sdx, ty), n = Math.min(topAt(tx, ty) - f - 1, SIDE_MAX); return cols.inset - LEDGE * Math.max(1, n - (z - f - 1)); };
  const footOf = (z) => colsOf(hillSheet(Math.max(1, z))).foot - shOf(z - 1);      // where the south wall's layer z ends, down the tile
  const spill = (n, r0, r1, at) => {                      // its shadow, n px along: in steps, rounded off at an end where the opening ends
    for (const [d, v] of SPILL) for (let a = 0; a < n; a++) {
      const f = Math.min(1, r0 ? (a + .5) / 8 : 1, r1 ? (n - a - .5) / 8 : 1), len = Math.round(d * Math.sqrt(1 - (1 - f) ** 2));
      for (let q = 0; q < len; q++) at(a, q, v);
    }
  };
  for (let z = front + 1; z < top; z++) {
    if (!shownCell(x, y, z, dx, dy)) continue;
    const roofed = !shownCell(x, y, z + 1, dx, dy), low = !shownCell(x, y, z - 1, dx, dy);
    if (dy < 0) {                                         // north: its shadow only, cut to the edge tile's own shape
      if (z !== front + 1) continue;
      const a = open(z, -1) ? 0 : 1, e = open(z, 1) ? 0 : 1, y0 = cols.north - shOf(top) + 4;
      [.4, .28, .18, .09].forEach((al, k) => fill(`rgba(${SHADE},${al})`, a, y0 - 3 * (k + 1), 16 - a - e, 3));
      const [cx, cy] = blobCell(maskOf(x, y, (cc, gg, tx, ty) => levelAt(tx, ty) >= top)), shape = cellAlpha(hillSheet(Math.max(1, top)), cx, cy);
      for (let j = 0; j < cols.north + 4; j++) for (let q = 0; q < 16; q++) if (shape[j * 16 + q]) g.clearRect(X + q, Y - shOf(top) + j, 1, 1);
    } else if (dy > 0) {                                  // south: the wall's layer z, the RELIEF_STEP px over foot - shOf(z - 1)
      const foot = footOf(z), y0 = foot - RELIEF_STEP + (roofed ? 1 : 0);
      // its two ends (at: how far in from the tile's edge the hole ends; to: its shadow): it runs on along the face,
      // or to the opening in the side at this corner of the hill, or to the one in the next wall's side, or it ends
      const [A, E] = [-1, 1].map((s) => {
        if (open(z, s)) return {at: 0, to: 0, rim: 0, end: 0};
        if (shownCell(x, y, z, s, 0)) return {at: sideOut(x, y, s, z) + LEDGE, to: sideOut(x, y, s, topAt(x + s, y) + 1), rim: 0, end: 0};
        if (!shownCell(x + s, y + 1, z, -s, 0)) return {at: 2, to: 0, rim: 1, end: 1};
        let zc = z; while (shownCell(x + s, y + 1, zc + 1, -s, 0)) zc++;             // (its rim runs on down that side's)
        return {at: 1 - sideOut(x + s, y + 1, -s, zc) - LEDGE, to: -sideOut(x + s, y + 1, -s, front + 1), rim: 1, end: 0};
      }), L = A.at, R = 16 - E.at;
      fill(HOLE_RIM, L - A.rim, y0 - (roofed ? 1 : 0), R - L + A.rim + E.rim, foot - y0 + (roofed ? 1 : 0));    // its rim: a px round it, where it ends
      fill(HOLE, L, y0, R - L, foot - y0);
      if (roofed) {
        fill(HOLE_DEEP, L + A.rim, y0, R - L - A.rim - E.rim, 3);
        for (const [q, s, on] of [[L, -1, A.rim], [R - 2, 1, E.rim]]) if (on) { clear(q + s, y0 - 1, 2, 2); fill(HOLE_RIM, q + (s < 0 ? 0 : 1), y0, 1, 1); }
      }
      if (low) spill(16 - E.to - A.to, A.end, E.end, (a, q, v) => mark(A.to + a, foot + q, v));
    } else {                                              // east, west: the side wall's layer for z
      const mx = (ax, w) => (dx > 0 ? 16 - ax - w : ax), out = sideOut(x, y, dx, z), Yg = -shOf(front);
      const inner = !open(z, -1) && shownCell(x + dx, y - 1, z, 0, 1), outer = !open(z, 1) && shownCell(x, y, z, 0, 1);   // (a wall's opening to run up to; one to run down to)
      const a = open(z, -1) || inner ? 0 : 2, e = open(z, 1) || outer ? 0 : 2;
      const r0 = inner ? footOf(front + 1) - 16 : Yg + 1 + a, r1 = outer ? footOf(front + 1) : Yg + 17 - e;
      let wall = front + 1; while (outer && shownCell(x, y, wall + 1, 0, 1)) wall++;
      const h = out + LEDGE - 1, t = !roofed ? r0 : outer ? footOf(wall) - RELIEF_STEP + 1 : r1;   // (h: its far side, in under the hill, rimmed down to t: where the wall's opening it runs into starts)
      fill(HOLE, mx(out, LEDGE - 1), r0, LEDGE - 1, r1 - r0); fill(HOLE, mx(h, 1), t, 1, r1 - t);
      if (a) fill(HOLE_RIM, mx(out, LEDGE), r0 - 1, LEDGE, 1);
      if (e) fill(HOLE_RIM, mx(out, LEDGE), r1, LEDGE, 1);
      if (roofed) {
        const dw = z > front + 1 ? 3 : 1;
        fill(HOLE_RIM, mx(h, 1), r0, 1, t - r0); fill(HOLE_DEEP, mx(h - dw, dw), r0, dw, (outer ? t + 3 : r1) - r0); if (outer) fill(HOLE_DEEP, mx(h, 1), t, 1, 3);
        if (a) { clear(mx(h - 1, 2), r0 - 1, 2, 2); fill(HOLE_RIM, mx(h - 1, 1), r0, 1, 1); }      // its corners, rounded off
        if (e) { clear(mx(h - 1, 2), r1 - 1, 2, 2); fill(HOLE_RIM, mx(h - 1, 1), r1 - 1, 1, 1); }
      }
      if (!low) continue;
      const side = (q) => (dx > 0 ? 16 - out + q : out - 1 - q);
      spill(r1 - r0, a, e, (ay, q, v) => mark(side(q), r0 + ay, v));
      if (outer) for (const [d, v] of SPILL) for (let j = 0; j < d; j++) for (let q = 0; q < d; q++) if (Math.hypot(q + .5, j + .5) < d) mark(side(q), r1 + j, v);   // round the corner
    }
  }
}
// The edge of the open cave's edge tiles: its floor right to the rock, a soft shadow along it; where two walls meet
// the corner is rounded off (a passage running diagonally isn't a staircase of squares), and where the rock pokes in
// at a corner the shadow goes round it.
// (floor: the cave you're in, or open ground level with it. Ground a layer up or down outside is a step: shadowed
// along, like rock, but never cut into; rock proper is what stands two layers or more over the floor.)
// (floor: the cave you're in, or open ground level with it. Rock: what stands two layers or more over the floor, or
// is hollow itself. Ground a layer up or down outside is neither: a step, with its own edge.)
const caveFloor = (x, y, z) => inOpenCave(x, y) || (!roofAt(x, y) && topAt(x, y) === z);
const caveRock = (x, y, z) => !inOpenCave(x, y) && (roofAt(x, y) > 0 || Math.abs(topAt(x, y) - z) > 1);
// The open cave's shadow, from its floor's own outline (f: the floor; o: more floor in the next block, or open ground
// level with it, which is no edge): a soft shadow on the floor along everything else, the same all the way round.
function caveShade(f, o, size) {
  const a = f.getImageData(0, 0, size, size).data, open = o.getImageData(0, 0, size, size).data, shade = [.34, .24, .15, .08];
  const at = (d, i, j) => i >= 0 && j >= 0 && i < size && j < size && d[(j * size + i) * 4 + 3] > 0;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    if (!at(a, i, j)) continue;                           // floor: how near is its edge?
    let d = 9;
    for (let q = -4; q <= 4 && d > 1; q++) for (let p = -4; p <= 4; p++) if ((p || q) && !at(a, i + p, j + q) && !at(open, i + p, j + q)) d = Math.min(d, Math.hypot(p, q));
    if (d < 4.5) { f.fillStyle = `rgba(${SHADE},${shade[Math.min(3, Math.round(d) - 1)]})`; f.fillRect(i, j, 1, 1); }
  }
}
function buildCaveOverlay(b) {
  let c = null, g = null, sm = null;                      // (sm: the openings' shadows, a px each)
  let fc = null, f = null, o = null;                      // (the open cave's floor, on its own: its shadow is worked out from its shape)
  const need = () => { if (!c) { c = document.createElement("canvas"); c.width = c.height = B * 16 + 2 * OV_M; g = c.getContext("2d"); } };
  const needFloor = () => { need(); if (!fc) { fc = document.createElement("canvas"); fc.width = fc.height = c.width; f = fc.getContext("2d", {willReadFrequently: true}); const oc = document.createElement("canvas"); oc.width = oc.height = c.width; o = oc.getContext("2d", {willReadFrequently: true}); } };
  for (const key in b.col) {                              // (only its hollow tiles)
    const i = +key, x = b.bx * B + i % B, y = b.by * B + (i / B | 0), X = OV_M + (i % B) * 16, Y = OV_M + (i / B | 0) * 16;
    if (inOpenCave(x, y)) {                               // the cave you're in: its floor here, seen through the hill
      needFloor();
      const z = openCave.get(x + "," + y), Yz = Y - shOf(z);
      peekFloors = true; drawTile(x, y, {g: f, ox: X, oy: Yz}); peekFloors = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && caveFloor(x + dx, y + dy, z)) o.fillRect(X + dx * 16, Yz + dy * 16, 16, 16);   // (more floor, here or in the next block, or open ground level with it: no edge)
      if (!roofAt(x, y + 1) && !inOpenCave(x, y + 1) && topAt(x, y + 1) === z + 1) {   // a step up in front of it, outside: its
        f.clearRect(X, Yz + 16 - RELIEF_STEP, 16, RELIEF_STEP); o.fillRect(X, Yz + 16 - RELIEF_STEP, 16, RELIEF_STEP);   //  edge stays (rock is seen through)
      }
      for (const dx of [-1, 1]) {                         // a way out to the east or west: through the hill's side wall, which
        const tx = x + dx, t = topAt(tx, y);              //  is drawn out over the ground beside it
        if (roofAt(tx, y) || inOpenCave(tx, y) || Math.abs(t - z) > 1) continue;
        const Yt = Y - shOf(t), wall = LEDGE * SIDE_MAX, x0 = dx > 0 ? X + 16 : X - wall;
        g.save(); g.beginPath(); g.rect(x0, Yt, wall, 16); g.clip();
        drawTile(tx, y, {g, ox: X + dx * 16, oy: Yt}); g.restore();
        const rock = (dy) => !(inOpenCave(x, y + dy) || (!roofAt(x, y + dy) && Math.abs(topAt(x, y + dy) - z) <= 1));
        [.34, .24, .15, .08].forEach((al, k) => {         // (shadowed along its sides like the cave)
          g.fillStyle = `rgba(${SHADE},${al})`;
          if (rock(-1)) g.fillRect(x0, Yt + k, wall, 1);
          if (rock(1)) g.fillRect(x0, Yt + 15 - k, wall, 1);
        });
      }
      for (let n = 1; n <= 3; n++) {                      // a way out to the north: the ground it opens onto is behind the hill;
        // shown too, as far as the hill hides it, right through the hill's border (one passage, out into the open)
        const ty = y - n, t = topAt(x, ty);
        if (roofAt(x, ty) || inOpenCave(x, ty) || Math.abs(t - z) > 1 || (topAt(x, y) - t) * RELIEF_STEP <= (n - 1) * 16) break;
        drawTile(x, ty, {g, ox: X, oy: Y - n * 16 - shOf(t)});
        [.34, .24, .15, .08].forEach((al, k) => {         // (shadowed along its sides like the cave)
          g.fillStyle = `rgba(${SHADE},${al})`;
          if (!inOpenCave(x - 1, y)) g.fillRect(X + k, Y - n * 16 - shOf(t), 1, 16);
          if (!inOpenCave(x + 1, y)) g.fillRect(X + 15 - k, Y - n * 16 - shOf(t), 1, 16);
        });
      }
      continue;
    }
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (shownVoids(x, y, dx, dy).length) { need(); sm = sm || new Uint8Array(c.width * c.width); drawFace(g, sm, c.width, X, Y, x, y, dx, dy); }
  }
  if (sm) spillShadows(g, sm, c.width);
  if (fc) { caveShade(f, o, fc.width); g.drawImage(fc, 0, 0); }
  return c;
}
function spillShadows(g, sm, w) {                         // the shadows, under the openings
  g.globalCompositeOperation = "destination-over";
  for (let k = 0; k < sm.length; k++) if (sm[k]) { g.fillStyle = `rgba(${SHADE},${SPILL_AL[sm[k]]})`; g.fillRect(k % w, k / w | 0, 1, 1); }
  g.globalCompositeOperation = "source-over";
}
// The mouths of the caves in a part of the land, for the x-ray circle (xray.js): of the hollow tiles of the blocks
// `near` that are not `rock` (what the circle sees through), on a canvas w x h art px with its corner at (x0, y0) of
// the world as drawn (and OV_M px round it), hidden only by ground in front that is not `rock`. null: none
function caveMouths(near, x0, y0, w, h, rock) {
  let c = null, g = null, sm = null;
  for (const b of near) for (const key in b.col || {}) {
    const x = b.bx * B + key % B, y = b.by * B + (key / B | 0), X = OV_M + x * 16 - x0, Y = OV_M + y * 16 - y0;
    if (X < OV_M - 16 || X > OV_M + w || Y < 0 || Y > h + 2 * OV_M - 64 || rock(x, y) || inOpenCave(x, y)) continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (shownVoids(x, y, dx, dy).length) {
      if (!c) { c = document.createElement("canvas"); c.width = w + 2 * OV_M; c.height = h + 2 * OV_M; g = c.getContext("2d"); sm = new Uint8Array(c.width * c.height); }
      faceSkip = rock; drawFace(g, sm, c.width, X, Y, x, y, dx, dy); faceSkip = null;
    }
  }
  if (sm) spillShadows(g, sm, c.width);
  return c;
}
// The part of a block's overlay that can have anything in it: round its hollow tiles, as far as an opening, its
// shadow, the ground seen behind it (three tiles north) and the block's highest lift reach
function caveBox(b, size) {
  let x0 = size, y0 = size, x1 = 0, y1 = 0;
  for (const key in b.col) {
    const X = OV_M + (key % B) * 16, Y = OV_M + (key / B | 0) * 16;
    x0 = Math.min(x0, X - 40); x1 = Math.max(x1, X + 56); y0 = Math.min(y0, Y - 64 - b.relief.up); y1 = Math.max(y1, Y + 48);
  }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0);
  return [x0, y0, Math.max(1, Math.min(size, x1) - x0), Math.max(1, Math.min(size, y1) - y0)];
}
// Called each frame after the ground: each block's caves, a picture a block (redrawn only when it changed)
function drawCaves(vis, sx, sy) {
  for (const b of vis) {
    if (!b.col || !b.relief) continue;
    const key = (b.ver || 0) + ":" + caveStamp;
    if (b.caveKey !== key && (!dirtyTiles.length || b.caveKey === undefined)) {   // (not while its ground is still being drawn again: once, after)
      b.caveKey = key; b.caveOv = buildCaveOverlay(b); b.caveBox = b.caveOv && caveBox(b, b.caveOv.width);
    }
    if (!b.caveOv) continue;
    const [cx, cy, cw, ch] = b.caveBox;                  // (only the part of it round its hollow tiles: the rest is empty)
    ctx.drawImage(b.caveOv, cx, cy, cw, ch, sx(b.bx * B) + (cx - OV_M) * zoom, sy(b.by * B) + (cy - OV_M) * zoom, cw * zoom, ch * zoom);
  }
}
