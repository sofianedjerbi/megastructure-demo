// Loot: what a creature (or a person) drops pops out of the poof, arcs up and lands with a bounce or two, right where
// the pile then shows. The pile at that tile waits until everything has landed, so nothing appears twice.
// A thing on the ground is smaller than its icon (16 px across, it was far too big beside a body), and a pixel of it
// is a pixel of the land all the same: the icon is made two thirds the size by whole pixels, 11 for 16 (smallPx).
// The HUD shows the same small picture in its slots, at the land's pixel too (slotIcon, ui.js).

const loot = [];
const LOOT_G = 26;   // gravity, in tiles/s² (a quick, light hop)
// Where the things of a pile lie (up to three show), in art px from the middle of the tile; the last one is in front
const PILE_AT = [[[0, 0]], [[-3, 0], [3, 1]], [[-4, -1], [4, -1], [0, 1]]];
const pileAt = (i, n) => PILE_AT[Math.min(3, n) - 1][i];
// The small icon: of every three px across and down, the first two become one (the colour most of them have, the
// darker of two as many: an outline holds, and a torch keeps its stick) and the third stays. The white sticker edge
// of the pack's item icons goes first: in pieces it would be noise, and nothing else on the ground has one.
const ghosts = new Map(), smalls11 = new Map(), DROP = 11, DROP_AT = [0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 16];
const smallCanvas = (name) => {                // a fresh one each time (the HUD keeps what it is given)
  const cv = document.createElement("canvas"), px = smallPx(name); cv.width = cv.height = DROP;
  cv.getContext("2d").putImageData(px, (DROP - px.width) >> 1, (DROP - px.height) >> 1); return cv;
};
const ghostIcon = (n) => ghosts.get(n) || (ghosts.set(n, smallCanvas(n)), ghosts.get(n));     // the one the land draws from
function smallPx(name) {
  if (smalls11.has(name)) return smalls11.get(name);
  const ic = ICONS[name];
  if (ic && ic[0] !== "gen" && (ic[3] > 16 || ic[4] > 16)) {       // a big thing (a boat, a well): straight from its sprite
    smalls11.set(name, smallArt(IMG[ic[0]], ic[1], ic[2], ic[3], ic[4], DROP)); return smalls11.get(name);
  }
  const d = iconCanvas(name).getContext("2d").getImageData(0, 0, 16, 16).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && d[(y * 16 + x) * 4 + 3] >= 128;
  const rim = (x, y, o) => solid(x, y) && Math.min(d[o], d[o + 1], d[o + 2]) > 225 && [-1, 0, 1].some((a) => [-1, 0, 1].some((b) => !solid(x + a, y + b)));
  let white = 0, round = 0;                                // has it a sticker edge: is most of its outline near white? (the pack's item icons, and the pickaxe drawn like them)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (solid(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !solid(x + a, y + b))) { round++; white += rim(x, y, (y * 16 + x) * 4) ? 1 : 0; }
  const sticker = white * 2 > round, edge = (x, y, o) => sticker && rim(x, y, o);
  const dark = (c) => (c >> 16) * 3 + (c >> 8 & 255) * 6 + (c & 255), out = new ImageData(DROP, DROP);
  for (let j = 0; j < DROP; j++) for (let i = 0; i < DROP; i++) {
    const seen = new Map(); let n = 0, cells = 0;
    for (let y = DROP_AT[j]; y < DROP_AT[j + 1]; y++) for (let x = DROP_AT[i]; x < DROP_AT[i + 1]; x++) {
      const o = (y * 16 + x) * 4; cells++;
      if (!solid(x, y) || edge(x, y, o)) continue;
      const c = d[o] << 16 | d[o + 1] << 8 | d[o + 2]; n++; seen.set(c, (seen.get(c) || 0) + 1);
    }
    if (n * 2 < cells) continue;
    let best = 0, votes = 0;
    for (const [c, v] of seen) if (v > votes || (v === votes && dark(c) < dark(best))) { best = c; votes = v; }
    out.data.set([best >> 16, best >> 8 & 255, best & 255, 255], (j * DROP + i) * 4);
  }
  smalls11.set(name, out);
  return out;
}

function dropLoot(x, y, items, now) {
  const names = Object.keys(items || {}).filter((n) => items[n] > 0);
  names.slice(0, 3).forEach((name, i, all) => {
    const [dx, dy] = pileAt(i, all.length);                        // the same place the pile draws it
    const flight = .42 + Math.random() * .08;
    loot.push({x, y, name, dx, dy, t0: now + 90 + i * 70, flight, vy: -LOOT_G * flight / 2});
  });
}
const lootAt = (x, y) => loot.some((l) => l.x === x && l.y === y);

const LOOT_HOPS = [.16, .08];                 // after the hop out: two smaller bounces in place, this long
const lootRests = (l, now) => (now - l.t0) / 1000 >= l.flight + LOOT_HOPS[0] + LOOT_HOPS[1];
function drawLoot(sx, sy, S, now, list) {   // queued into the depth-sorted list, like everything on the ground
  const z = zoom;
  // A tile's loot hands over to its pile once all of it has come to rest: taken off here, before any of it is drawn,
  // so nothing shows twice. (Found out one by one while drawing, two that came to rest in the same long frame did.)
  for (let i = loot.length - 1; i >= 0; i--) {
    const l = loot[i];
    if (!lootRests(l, now) || loot.some((m) => m.x === l.x && m.y === l.y && !lootRests(m, now))) continue;
    if (!l.landed) sfx("loot", l.x, l.y);
    loot.splice(i, 1);
  }
  loot.forEach((l, i) => {
    const s = (now - l.t0) / 1000;
    if (s < 0) return;
    let h = 0, dxk = 1, since = 1;                                  // (at rest, waiting for the others)
    if (s < l.flight) { h = -(l.vy * s + LOOT_G * s * s / 2); dxk = s / l.flight; }   // the hop from the middle of the tile out to its place
    else {
      if (!l.landed) { l.landed = true; sfx("loot", l.x, l.y); }
      let t = s - l.flight, n = 0;
      while (n < LOOT_HOPS.length && t > LOOT_HOPS[n]) t -= LOOT_HOPS[n++];
      if (n < LOOT_HOPS.length) { h = LOOT_G * LOOT_HOPS[n] / 2 * t - LOOT_G * t * t / 2; since = t; }
    }
    const cx = sx(l.x) + S / 2 + Math.round(l.dx * dxk) * z, ground = sy(l.y, l.x) + S / 2 + Math.round(l.dy * dxk) * z;
    const dip = s > l.flight && since < .05 ? 1 : 0;                // a pixel lower just as it touches down, its last row in
                                                                    //  the ground (only then: it ends at rest, as the pile shows)
    list.push({y: l.y - .01 + i * 1e-4, x: l.x, fx: () => {         // (in the pile's order: the last in front)
      ctx.fillStyle = "rgba(60,40,30,.25)";
      pixelOval(cx, ground + 5 * z, Math.max(1, 4 - h * 4), 1.5, 0, .5);
      ctx.drawImage(ghostIcon(l.name), 0, 0, DROP, DROP - dip, Math.round(cx - DROP * z / 2), Math.round(ground - DROP * z / 2 - h * S) + dip * z, DROP * z, (DROP - dip) * z);
    }});
  });
}
