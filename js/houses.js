// Houses: finding rooms (walls closing a compact space) and drawing them from outside. The roof (the pack's 9-slice
// roof, pulled up and out so it overhangs the side walls) covers the room down to a front wall 1.5 tiles tall: the
// pack's plank wall with its top trim, windows, and the door panel that swings open when someone is in the doorway.
// Inside, the roof and the top of the front wall fade away.

let roomOf = new Map(), rooms = [], roomsAt = 0, roomsDirty = true;
const ENCLOSE = new Set("W%+g");
function findRooms(vx, vy, vw, vh) {
  const seen = new Set(), found = [], of = new Map();
  let anyWall = false;                               // (no wall in sight, no room: nothing to look for)
  for (const b of blocks.values()) if (b.bx * B < vx + vw && (b.bx + 1) * B > vx && b.by * B < vy + vh && (b.by + 1) * B > vy && b.comb.includes("W")) { anyWall = true; break; }
  if (!anyWall) { rooms = found; roomOf = of; return; }
  for (let y = vy; y < vy + vh; y++) for (let x = vx; x < vx + vw; x++) {
    const k0 = x + "," + y, c = combAt(x, y);
    if (seen.has(k0) || c === null || ENCLOSE.has(c)) continue;
    const q = [[x, y]], cells = [], walls = new Set(), mine = new Set([k0]); seen.add(k0);
    let open = false;
    while (q.length) {
      const [cx, cy] = q.pop(); cells.push([cx, cy]);
      if (cells.length > 160) { open = true; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + "," + ny, cc = combAt(nx, ny);
        if (cc === null) { open = true; continue; }
        if (ENCLOSE.has(cc)) { walls.add(cc); continue; }
        if (!seen.has(k)) { seen.add(k); mine.add(k); q.push([nx, ny]); }
        else if (!mine.has(k)) open = true;        // touches an area already found to be outside: not a room
      }
    }
    if (open || !walls.has("W")) continue;
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    if (w > 14 || h > 14 || cells.length < .6 * w * h) continue;   // houses are compact; long corridors are not rooms
    const room = {cells, x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, y0: Math.min(...ys) - 1, y1: Math.max(...ys) + 1, fade: 1, id: Math.min(...xs) + "," + Math.min(...ys)};
    const old = rooms.find((r) => r.id === room.id); if (old) room.fade = old.fade;
    found.push(room); for (const [cx, cy] of cells) of.set(cx + "," + cy, room);
  }
  rooms = found; roomOf = of;
}


const FRONT = [[48, 16], [56, 16], [64, 16]];        // house_walls.png: front wall with top trim (left, middle, right)
function drawHouses(sx, sy, S, dt, now) {
  const s0 = myPos(), z = zoom;
  for (const rm of rooms) {
    const inside = s0 && (roomOf.get(s0.x + "," + s0.y) === rm);
    rm.fade += ((inside ? .15 : 1) - rm.fade) * Math.min(1, dt * 8);
    drawRoof(rm, sx, sy, S, z);
    drawFront(rm, sx, sy, S, z, now);
    if (Math.random() < dt * 1.2) puffs.push({x: rm.x1 - .5, y: rm.y0 - .9, vx: .15, vy: -.35, r: .8, grow: 3, life: 1.6, age: 0});   // chimney smoke
  }
  ctx.globalAlpha = 1;
}
function drawRoof(rm, sx, sy, S, z) {
  // pixel-exact, never stretched: the scalloped top edge (7 px of its tile), whole shingle rows with the ridge band in
  // the middle, and the eave (7 px) overhanging the front wall's trim
  ctx.globalAlpha = rm.fade;
  const top = sy(rm.y0, rm.x0) - 8 * z, bottom = sy(rm.y1, rm.x0) - 6 * z, inner = Math.max(0, Math.round((bottom - top) / z) - 14);
  const strip = (row, srcY, h, y) => {
    for (let x = rm.x0; x <= rm.x1; x++) ctx.drawImage(IMG.house_roof, 16, row * 16 + srcY, 16, h, sx(x), y, S, h * z);
    ctx.drawImage(IMG.house_roof, 0, row * 16 + srcY, 16, h, sx(rm.x0) - 11 * z, y, S, h * z);   // edges overhang the walls
    ctx.drawImage(IMG.house_roof, 32, row * 16 + srcY, 16, h, sx(rm.x1) + 11 * z, y, S, h * z);
  };
  strip(0, 9, 7, top);
  const n = Math.ceil(inner / 16), ridge = Math.floor((n - 1) / 2);
  for (let i = 0, y = top + 7 * z, left = inner; i < n; i++, y += 16 * z, left -= 16)
    strip(i === ridge ? 2 : i % 2 ? 3 : 1, 0, Math.min(16, left), y);
  strip(4, 0, 7, top + (7 + inner) * z);
  ctx.drawImage(IMG.house_roof, 80, 0, 16, 16, sx(rm.x1 - 1), top - 9 * z, S, S);   // chimney
}
function drawFront(rm, sx, sy, S, z, now) {
  const y = rm.y1, doorsAt = [];
  for (let x = rm.x0; x <= rm.x1; x++) if (combAt(x, y) === "+") doorsAt.push(x);
  for (let x = rm.x0; x <= rm.x1; x++) {
    const [fx, fy] = FRONT[x === rm.x0 ? 0 : x === rm.x1 ? 2 : 1];
    ctx.globalAlpha = rm.fade;                                               // the upper half (over the room) fades inside
    ctx.drawImage(IMG.house_walls, fx, fy, 16, 8, sx(x), sy(y, x) - 8 * z, S, 8 * z);
    ctx.globalAlpha = 1;
    ctx.drawImage(IMG.house_walls, fx, fy + 8, 16, 8, sx(x), sy(y, x), S, 8 * z);
    ctx.drawImage(IMG.house_walls, fx, fy + 8, 16, 8, sx(x), sy(y, x) + 8 * z, S, 8 * z);
    ctx.fillStyle = "rgba(60,40,30,.25)"; ctx.fillRect(sx(x), sy(y, x) - 8 * z, S, 2 * z);   // shadow under the eave
    if (doorsAt.includes(x)) drawDoor(x, y, sx, sy, S, z, now);
    else if (x > rm.x0 && x < rm.x1 && (x - rm.x0) % 3 === 1 && !doorsAt.some((d) => Math.abs(d - x) <= 1))
      ctx.drawImage(IMG.gen, GEN.window * 16, 0, 16, 16, sx(x), sy(y, x) - 5 * z, S, S);
  }
}
function drawDoor(x, y, sx, sy, S, z, now) {
  const key = x + "," + y, near = [[0, 0], [0, -1], [0, 1]].some(([dx, dy]) => occupied.has((x + dx) + "," + (y + dy)));
  const o = Math.max(0, Math.min(1, (doors.get(key) || 0) + (near ? .15 : -.1)));
  if (!(doors.get(key) || 0) && o) sfx("gate", x, y);
  doors.set(key, o);
  ctx.fillStyle = "#4a3530"; ctx.fillRect(sx(x) + 2 * z, sy(y, x) - 6 * z, S - 4 * z, S + 6 * z);   // the dark doorway
  const f = 5 - Math.round(o * 5);                                           // door.png row 0: open (0) .. closed (5)
  ctx.drawImage(IMG.door, f * 16, 0, 16, 16, sx(x), sy(y, x) - 6 * z, S, S + 6 * z);
}
