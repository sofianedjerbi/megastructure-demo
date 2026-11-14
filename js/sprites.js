// Object and character sprites (per-tile chars to sprite rects).

// =====================================================================================
//  Sprites drawn every frame (y-sorted with characters)
// =====================================================================================
const AGENT_TINTS = ["#f4b6b6", "#a9cdf2", "#b8e0a0", "#f2d58f", "#d3b6ef", "#9fdcd0", "#f3b7d6", "#e8c9a4", "#c9d0f5", "#f6c79a"];
const agentTint = (name) => AGENT_TINTS[[...name].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, 7) % AGENT_TINTS.length];
const tinted = new Map();
function characterSheet(tint, src = IMG.character) {   // recolour the cream body to a per-person colour
  const key = tint + (src === IMG.character ? "" : ":" + src.src);
  if (tinted.has(key)) return tinted.get(key);
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  const tr = parseInt(tint.slice(1, 3), 16), tg = parseInt(tint.slice(3, 5), 16), tb = parseInt(tint.slice(5, 7), 16);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], gg = px[i + 1], bb = px[i + 2];
    if (px[i + 3] && r > 200 && gg > 190 && bb > 150 && r - bb < 90) {   // cream / white body pixels
      const k = (r + gg + bb) / (243 + 242 + 192);   // 1.0 for the main body colour, keeps shading
      px[i] = Math.min(255, tr * k); px[i + 1] = Math.min(255, tg * k); px[i + 2] = Math.min(255, tb * k);
    }
  }
  g.putImageData(d, 0, 0); tinted.set(key, c); return c;
}
// premium character sheet: 8-frame rows, 4 directions each: down, up, right, left
// (checked from the eye and collar-bell position; the pink spot is the inner ear, at the back)
const ANIM = {idle: 0, walk: 4, run: 8, hoe: 12, axe: 16, water: 20, pickaxe: 24, sword: 28, spear: 32};   // water = watering can; the last three are drawn by tool_art.js
const DIR_ROW = (p) => (p.fy < 0 ? 1 : p.fx > 0 ? 2 : p.fx < 0 ? 3 : 0);
let troughFullC = null;
function troughFull() {                     // the feeding box with hay heaped in it (18 px tall: hay pokes out)
  if (troughFullC) return troughFullC;
  const c = troughFullC = document.createElement("canvas"); c.width = 16; c.height = 18; const g = c.getContext("2d");
  g.drawImage(IMG.barn, 0, 0, 16, 16, 0, 2, 16, 16); g.drawImage(IMG.barn, 2, 51, 11, 10, 2, 1, 11, 10);
  return c;
}
function genCell(name) { return [GEN[name] * 16, 0]; }
// object sprite for a tile char: [img, sx, sy, sw, sh, dx (from tile left), dy (from tile top)]
function objectSprite(c, x, y, t) {
  const h = hash(x, y, 21);
  switch (c) {
    case "T": {
      if (h < .7) {                                                                       // animated round tree
        const hit = shakes.get(x + "," + y), k = hit ? (performance.now() - hit) / 1000 : 9;
        if (k < .32) return [IMG.tree_anim, 48 * Math.min(3, Math.floor(k * 12.5)), 48, 48, 48, -16, -28];
        const f = Math.floor(t * 6 + h * 60) % 12;
        return [IMG.tree_anim, 48 * f, 144, 48, 48, -16, -28];
      }
      return [IMG.trees, 0, 0, 16, 32, 0, -13];                                         // young tree (base at y 28)
    }
    case "F": {                                                                           // fruit tree, 4 species
      const img = fruitSheet(x, y), hit = shakes.get(x + "," + y), k = hit ? (performance.now() - hit) / 1000 : 9;
      if (k < .32) return [img, 48 * Math.min(3, Math.floor(k * 12.5)), 48, 48, 48, -16, -28];
      return [img, 48 * (Math.floor(t * 5 + h * 30) % 6), 96, 48, 48, -16, -28];
    }
    case "b": return [IMG.trees, BERRY_BUSH[Math.floor(h * 3)], 48, 16, 16, 0, -3];
    case "v": return [IMG.trees, 16, 48, 16, 16, 0, -3];                                 // picked bush: leaves only
    case "U": {                                                                           // picked fruit tree: the same tree, bare
      return [IMG.fruit_bare, fruitKind(x, y) * 48, 0, 48, 48, -16, -28];
    }
    case "*": return [IMG.gen, ...genCell("ore"), 16, 16, 0, -3];
    case "M": return [IMG.gen, ...genCell("boulder"), 16, 16, 0, -3];
    case "%": return [IMG.gen, ...genCell("stone_wall"), 16, 16, 0, -4];
    case "Q": return [IMG.nature, [0, 16, 48][Math.floor(h * 3)], 0, 16, 16, 0, 0];
    case "#": return fenceSprite(x, y);
    case "X": return mailAt.has(x + "," + y)                                            // a letter pops up when mail waits
      ? [IMG.mailbox, 64, 64 + (Math.floor(t * 2) % 2 ? 0 : -1), 16, 32, 0, -16] : [IMG.mailbox, 0, 16, 16, 32, 0, -16];
    case "V": return [IMG.boats, (Math.floor(t * 1.5 + h * 9) % 2) * 48, 32, 48, 32, -16, -10];   // moored, rocking
    case "W": {
      const room = (dx, dy) => roomOf.has((x + dx) + "," + (y + dy));
      let c = [3, 1];                                   // a lone wall: a small plank block
      if (room(0, 1)) c = [1, 0]; else if (room(0, -1)) c = [1, 2]; else if (room(1, 0)) c = [0, 1]; else if (room(-1, 0)) c = [2, 1];
      else if (room(1, 1)) c = [0, 0]; else if (room(-1, 1)) c = [2, 0]; else if (room(1, -1)) c = [0, 2]; else if (room(-1, -1)) c = [2, 2];
      return [IMG.house_walls, c[0] * 16, c[1] * 16, 16, 16, 0, 0];
    }
    case "+": return [IMG.house_walls, 48, 32, 16, 16, 0, 0];                          // doorway in the wall
    case "^": return [IMG.gen, ...genCell(Math.floor(t * 6 + x) % 2 ? "campfire1" : "campfire0"), 16, 16, 0, -2];
    case "x": return [IMG.gen, ...genCell(Math.floor(t * 8 + x + y) % 2 ? "fire1" : "fire0"), 16, 16, 0, -3];
    case "&": return [IMG.gen, ...genCell("workbench"), 16, 16, 0, -3];
    case "?": return [IMG.signs, 0, 0, 16, 16, 0, -2];
    case "!": return [IMG.gen, ...genCell("flag"), 16, 16, 0, -6];
    case ";": return [IMG.crops, 0, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -2];
    case "\"": return [IMG.crops, 32, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -3];
    case "w": return [IMG.crops, 48, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -4];
    case "f": {
      if (h < .06) return [IMG.nature, 48, 48, 16, 32, 0, -16];                         // tall sunflower (both halves)
      const [fx, fy] = FLOWERS[Math.floor(hash(x, y, 44) * FLOWERS.length)];
      return [IMG.nature, fx * 16, fy * 16, 16, 16, 0, -1];
    }
    case "B": return [IMG.furniture, Math.floor(h * 3) * 16, 16, 16, 32, 0, -16];         // bed: foot on this tile
    case "h": return [IMG.furniture, 64, 32, 16, 16, 0, -3];
    case "L": return [IMG.furniture, 48, 48, 16, 16, 0, -3];
    case "p": return [IMG.furniture, 48 + Math.floor(h * 3) * 16, 0, 16, 32, 0, -16];
    case "K": return [IMG.furniture, 96, 48, 16, 16, 0, -3];
    case "r": return [IMG.furniture, Math.floor(h * 3) * 16, 80, 16, 16, 0, 0];
    case "g": {                                                                           // opens next to people
      const key = x + "," + y, near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => occupied.has((x + dx) + "," + (y + dy)));
      const was = doors.get(key) || 0, o = Math.max(0, Math.min(1, was + (near ? .12 : -.08)));
      if (!was && o) sfx("gate", x, y);                                                     // it starts to swing open
      doors.set(key, o);
      return [IMG.gates, Math.round(o * 3) * 16, 0, 16, 16, 0, -3];
    }
    case "t": {                                       // a stump, cut flat: the felling sheet's own, or the thin tree's
      // hidden while the fall animation still draws the tree there: the round sheet draws its stump until its fade
      // (frame 9); the thin one stands whole for frames 0-2, then it is cut and the stump tile shows
      const now = performance.now();
      if (falls.some((f) => f.x === x && f.y === y && now - f.t0 < (f.thin ? 3 : 9) / 14 * 1000)) return null;
      return h < .7 ? [IMG.tree_fall, 12 * 64 + 32, 28, 16, 16, 0, 0] : [IMG.stump_thin, 0, 0, 16, 16, 0, 0];
    }
    case "Y": return [IMG.well, 0, 0, 32, 32, 0, -16];                                   // 2x2, drawn from the bottom-left tile
    case "J": { const k = Math.floor(h * 6); return [IMG.coop, 160 + (k % 3) * 32, 80 + Math.floor(k / 3) * 48, 32, 44, 0, -28]; }
    case "m": return [IMG.blanket, 0, 8, 48, 32, 0, -16];
    case "q": return [IMG.basket, 0, 0, 16, 16, 0, -3];
    case "e": return troughAt.has(x + "," + y) ? [troughFull(), 0, 0, 16, 18, 0, -5] : [IMG.barn, 0, 0, 16, 16, 0, -3];
    case "y": return [IMG.barn, 0, 16, 16, 16, 0, -2];
    case "Z": case "z": return null;                                                       // drawn by the structure itself
    case "C": {                                                                           // lid opens when used
      const o = chestOpen.get(x + "," + y), k = o ? (performance.now() - o) / 1000 : 9;
      const f = k < .2 ? Math.floor(k / .2 * 4) : k < 1.2 ? 4 : k < 1.4 ? 4 - Math.floor((k - 1.2) / .2 * 4) : 0;
      return [IMG.chest, f * 48 + 16, 16, 16, 16, 0, -2];
    }
  }
  return null;
}
// ---- sound: short procedural effects through WebAudio; M mutes ---------------------------
// The opaque part of a sprite frame (in its own pixels): the white aiming box hugs the thing, not its tile.
let boundsIds = 0;
const boundsCache = new Map(), boundsCv = document.createElement("canvas");
function spriteBounds(img, a, b, w, h) {
  if (!img.bid) img.bid = ++boundsIds;          // canvases have no src: give every image its own id
  const key = `${img.bid}|${a},${b},${w},${h}`;
  if (boundsCache.has(key)) return boundsCache.get(key);
  boundsCv.width = w; boundsCv.height = h;
  const g = boundsCv.getContext("2d", {willReadFrequently: true});
  g.clearRect(0, 0, w, h); g.drawImage(img, a, b, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  // count solid pixels per row and column, then trim edges with fewer than 2: stray specks (a leaf, a chip) don't count
  const cols = new Array(w).fill(0), rows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= 120) { cols[x]++; rows[y]++; }
  let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
  while (x0 <= x1 && cols[x0] < 2) x0++;
  while (x1 >= x0 && cols[x1] < 2) x1--;
  while (y0 <= y1 && rows[y0] < 2) y0++;
  while (y1 >= y0 && rows[y1] < 2) y1--;
  const r = x1 < x0 || y1 < y0 ? null : [x0, y0, x1 + 1, y1 + 1];
  if (!(img instanceof HTMLImageElement) || (img.complete && img.naturalWidth)) boundsCache.set(key, r);
  return r;
}
