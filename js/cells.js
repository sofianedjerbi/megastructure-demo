// The land is cells, solid or empty (gen.py): a tile's column is its 32 cells from the bottom (LOW) up, a bit each,
// set where the cell is solid; cell z is the block whose top is at height z, so land h high is solid up to cell h
// (0: sea level). Nothing else is kept about relief. A cave is empty cells with solid ones over them; a pit, a column
// dug low. A block of tiles (tiles.js) keeps a char a tile for its lowest ground (SEA + height) and, for the tiles
// where that isn't the whole story (a hollow under a hill), their column.

const SEA = 64, LOW = -16;
function tileIdx(x, y) { const b = blockOf(x, y); return b ? [b, (y - b.by * B) * B + (x - b.bx * B)] : null; }
const colSolid = (lv) => (lv - LOW >= 31 ? 0xFFFFFFFF : ((1 << (lv - LOW + 1)) - 1) >>> 0);   // a plain column: solid up to lv
const colTop = (c) => 31 - Math.clz32(c) + LOW;                                 // its highest solid cell
const colFloor = (c) => 30 - Math.clz32(~c & (c + 1)) + LOW;                    // the top of the solid cells standing on the bottom
const floorAt = (x, y) => { const t = tileIdx(x, y); return t ? t[0].lv[t[1]].charCodeAt(0) - SEA : 0; };   // the lowest ground
function colAt(x, y) {
  const t = tileIdx(x, y); if (!t) return colSolid(0);
  const c = t[0].col ? t[0].col[t[1]] : undefined;
  return c === undefined ? colSolid(t[0].lv[t[1]].charCodeAt(0) - SEA) : c;
}
const topAt = (x, y) => colTop(colAt(x, y));                                    // the land as seen from above
const roofAt = (x, y) => { const t = tileIdx(x, y); return t && t[0].col && t[0].col[t[1]] !== undefined ? colTop(t[0].col[t[1]]) - floorAt(x, y) : 0; };   // over the lowest ground: how far up the land goes (0: open sky)
const solidAt = (x, y, z) => z < LOW || (z - LOW < 32 && (colAt(x, y) >>> (z - LOW) & 1) === 1);
const coveredAt = (x, y, z) => z - LOW < 31 && colAt(x, y) >>> (z - LOW + 1) !== 0;   // standing at z: something solid over you
function surfacesAt(x, y) {                 // every height you can stand at, lowest first
  const c = colAt(x, y), tops = (c & ~(c >>> 1)) >>> 0, out = [];
  for (let i = 0; i < 32; i++) if (tops >>> i & 1) out.push(i + LOW);
  return out;
}
// as Movement.height: the ground at or under z here (the lowest ground, if none is)
function settleAt(x, y, z) { const s = surfacesAt(x, y), under = s.filter((v) => v <= z); return under.length ? under[under.length - 1] : s[0]; }
// as Movement.landing: the height a step from height h onto (x, y) lands at, or null (a wall). Where the cell at
// your body's height is solid you jump up onto it if it's ground (and nothing is over your head); where it's empty you step in and come down on the
// ground under you there (a fall, however far)
function landAt(h, x, y, fx, fy) {       // (fx, fy: the tile you step from: a jump needs room over your head there)
  if (solidAt(x, y, h + 1)) return solidAt(x, y, h + 2) || (fx !== undefined && solidAt(fx, fy, h + 2)) ? null : h + 1;
  let z = h; while (!solidAt(x, y, z)) z--;
  return z;
}

// The cave you're in is seen through the hill over it (caves.js): its tiles ("x,y") and the height of its floor there
let caveOpen = false, openCave = new Map(), peekFloors = false;   // (peekFloors: while its floor is being drawn)
const inOpenCave = (x, y) => caveOpen && openCave.has(x + "," + y);
const levelAt = (x, y) => (peekFloors && inOpenCave(x, y) ? openCave.get(x + "," + y) : topAt(x, y));   // the height the land is drawn at
const standAt = (x, y) => (inOpenCave(x, y) ? openCave.get(x + "," + y) : topAt(x, y));   // ...and what's on the tile
const hiddenAt = (x, y) => roofAt(x, y) > 0 && !inOpenCave(x, y);   // what lies on the lowest ground, under a hill you're not in

let myAt = null;                            // your tile and the height you stand at (caves.js keeps it, as the server does)
const myZ = (x, y) => (myAt && Math.abs(myAt.x - x) + Math.abs(myAt.y - y) <= 2 ? settleNear(x, y, myAt.z) : topAt(x, y));
function settleNear(x, y, z) { return surfacesAt(x, y).reduce((a, v) => (Math.abs(v - z) < Math.abs(a - z) ? v : a)); }   // the ground nearest z
function rimAt(x, y) {                      // as World.rim: lower ground around it (nothing built)
  const lv = floorAt(x, y);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && floorAt(x + dx, y + dy) < lv) return true;
  return false;
}
// for your own steps: from the height you're at on (x0, y0), is the tile beside it not a wall?
const canStep = (x0, y0, x1, y1) => landAt(myZ(x0, y0), x1, y1, x0, y0) !== null;
