// Sprite sheets, the generated sheet, and the blob autotile table.

// =====================================================================================
//  Assets
// =====================================================================================
const IMG = {};
const ANIMAL_SHEETS = ["chicken_brown", "chicken_red", "chicken_blue", "chicken_green", "cow_light", "cow_pink", "cow_purple", "cow_green",
  "chick", "chick_brown", "chick_red", "chick_blue", "chick_green", "calf", "calf_light", "calf_pink", "calf_purple", "calf_green"];
const ASSETS = [...ANIMAL_SHEETS, "thin_fall", "stump_thin", "fruit_bare", "barn", "well", "coop", "blanket", "basket", "mailbox", "boats", "deep_mask", "house_walls", "house_roof", "gates", "bridge", "furniture", "tilled_wet", "tree_apple", "tree_pear", "tree_peach", "tree_orange", "water_objects", "emoji", "hearts", "sliders", "hill1", "hill2", "hill3", "tree_anim", "tree_fall", "water", "water_deep", "soil", "grass", "tilled", "ash", "stone", "hedge", "cobble", "planks", "fences", "chest",
  "door", "trees", "nature", "workbench", "signs", "crops", "items", "character", "chicken", "cow", "gen", "tusker", "pincer", "strawman", "wisp", "wyrm", "mossback", "sporeling"];
let GEN = {};
function loadImg(n) {   // decoded up front: a sheet decoded lazily on first draw stalls that frame (~100 ms)
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => i.decode().catch(() => {}).then(() => { if (n === "character") IMG[n] = ToolArt.extend(i); res(i); }); i.onerror = rej; i.src = `assets/${n}.png`;
    if (n !== "character") IMG[n] = i; });       // (the character sheet is only there once the rows of its other tools are under it: tool_art.js)
}
const ready = Promise.all([...ASSETS.map(loadImg),
  fetch("assets/gen.txt").then((r) => r.text()).then((t) => t.trim().split("\n").forEach((n, i) => GEN[n] = i)),
  document.fonts.load("18px SproutPixel")]);

// The ground sheets share one 11x5 "blob" layout. Work out which neighbours each cell connects to from
// the alpha of the grass layer, then look tiles up by the neighbour mask of the world tile.
const N_ = 1, E_ = 2, S_ = 4, W_ = 8, NE = 16, SE = 32, SW = 64, NW = 128;
let BLOB = new Map();
function reduce(m) {
  if (!(m & N_ && m & E_)) m &= ~NE; if (!(m & S_ && m & E_)) m &= ~SE;
  if (!(m & S_ && m & W_)) m &= ~SW; if (!(m & N_ && m & W_)) m &= ~NW;
  return m;
}
function buildBlob() {
  const c = document.createElement("canvas"); c.width = IMG.grass.width; c.height = IMG.grass.height;
  const g = c.getContext("2d"); g.drawImage(IMG.grass, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const op = (x, y) => d[(y * c.width + x) * 4 + 3] > 128;
  for (let cy = 0; cy < 5; cy++) for (let cx = 0; cx < 11; cx++) {
    const X = cx * 16, Y = cy * 16;
    if (!op(X + 8, Y + 8)) continue;
    let m = 0;
    if (op(X + 8, Y)) m |= N_; if (op(X + 15, Y + 8)) m |= E_; if (op(X + 8, Y + 15)) m |= S_; if (op(X, Y + 8)) m |= W_;
    if (op(X + 15, Y)) m |= NE; if (op(X + 15, Y + 15)) m |= SE; if (op(X, Y + 15)) m |= SW; if (op(X, Y)) m |= NW;
    m = reduce(m);
    if (!BLOB.has(m)) BLOB.set(m, [cx, cy]);
  }
}
const blobCache = new Map();
function blobCell(mask) {
  mask = reduce(mask);
  let hit = blobCache.get(mask);
  if (hit) return hit;
  hit = BLOB.get(mask);
  if (!hit) {   // nearest available: same edges, as many of the wanted corners as possible
    let best = null, bs = -1;
    for (const [m, cell] of BLOB) {
      if ((m & 15) !== (mask & 15)) continue;
      const s = 8 - popcount((m ^ mask) & 0xf0);
      if (s > bs) { bs = s; best = cell; }
    }
    hit = best || BLOB.get(15) || [1, 1];
  }
  blobCache.set(mask, hit); return hit;
}
const popcount = (v) => { let c = 0; while (v) { c += v & 1; v >>= 1; } return c; };
