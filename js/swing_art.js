// A weapon's own attack, drawn over the body: a sword cuts across in front of you, a spear is thrust out and drawn
// back. The sheet's only swing is a chop down onto a block (right for an axe or a pickaxe, and for breaking things
// with anything), so an attack with a sword or a spear looked like breaking a block. Here the body is the standing
// one, stepped into the blow (STEP), and the weapon, the hand on it and the streak it leaves are a sheet of their own:
// 8 frames by 4 ways faced, in the sheet's 48 px cells. Nothing here is on the character sheet, so the races and the
// clothes built from it have nothing to work around.

const SwingArt = (() => {
  const CELL = 48, SS = 4, CX = 23.5, CY = 26;             // (CX, CY): the middle of the body, at the hips
  const C = {wood: [170, 121, 89], dark: [144, 98, 93], iron: [129, 129, 129], steel: [183, 183, 183], edge: [158, 170, 182],
    blade: [226, 232, 236], gold: [222, 178, 86], streak: [243, 244, 231]};
  const FACE = [90, -90, 0];                               // down, up, right, in degrees on the screen (left is right, mirrored)
  // The sword: where it points on each frame, in degrees from the way faced (it starts on the sword arm's side and
  // ends across the body), and the streak behind it: [from, to, how thick].
  const SLASH = {at: [-120, -75, 20, 85, 100, 100, 70, 40], streak: [null, null, [-115, 20, 2.6], [-70, 85, 2.6], [5, 100, 1.3], null, null, null]};
  // Side on it comes down from over the shoulder and stops out in front: carried on to the feet, it was a chop again.
  const SIDE = {at: [-125, -95, -20, 28, 36, 36, 22, 10], streak: [null, null, [-120, -20, 2.6], [-90, 28, 2.6], [-30, 36, 1.3], null, null, null]};
  // The spear: how far it is pushed out along the way faced, and how long the streak behind its point is.
  const THRUST = {out: [-3, -5, 2, 6, 6, 5, 2, 0], streak: [0, 0, 6, 9, 4, 0, 0, 0]};
  const STEP = {sword: [-1, -1, 1, 2, 2, 2, 1, 0], spear: [-1, -1, 1, 3, 3, 2, 1, 0]};   // the body's step into the blow, in px
  const REACH = 6, SWORD = 11.5;                           // the hand's distance from the middle; the sword, hand to tip
  const rad = (a) => a * Math.PI / 180;
  const inside = (pts, x, y) => {                          // (a convex shape, its corners in order)
    let sign = 0;
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (c) { if (sign && Math.sign(c) !== sign) return false; sign = Math.sign(c); } }
    return true;
  };
  const box = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // One frame as 48 x 48 RGBA. `row`: 0 down, 1 up, 2 right, 3 left. `hand`: its outline, shade and fur colours.
  function frame(kind, row, f, hand) {
    const d = new Uint8ClampedArray(CELL * CELL * 4), flip = row === 3, phi = FACE[flip ? 2 : row];
    let gx, gy, ang, shapes, streak = () => false;
    if (kind === "sword") {
      // side on it comes down from over the shoulder; facing or backing the screen it crosses from the sword arm's side
      const S = row >= 2 ? SIDE : SLASH, turn = row >= 2 ? 1 : -1, a = rad(phi + turn * S.at[f]);
      ang = a; gx = CX + Math.cos(a) * REACH; gy = CY + Math.sin(a) * REACH;
      const tip = SWORD;
      shapes = [[box(1.9, 3.1, -2.6, 2.6), C.gold], [[[3.1, .3], [tip - 2, .3], [tip - 1, .7], [tip - 2, 1.4], [3.1, 1.4]], C.edge],
        [[[3.1, -1.4], [tip - 2, -1.4], [tip, 0], [tip - 2, 1.4], [3.1, 1.4]], C.blade], [box(-1, 2, -.7, .7), C.dark]];
      const s = S.streak[f];
      if (s) streak = (x, y) => {
        const r = Math.hypot(x - CX, y - CY); let t = (Math.atan2(y - CY, x - CX) * 180 / Math.PI - phi) * turn;
        t = ((t + 180) % 360 + 360) % 360 - 180;
        if (f < 4 && t > 60 && s[0] < -100) t -= 360;      // (the start of the cut is behind the back: past the half turn)
        const k = (t - s[0]) / (s[1] - s[0]); if (k < 0 || k > 1) return false;
        const out = REACH + SWORD - .5; return r <= out && r >= out - s[2] * Math.pow(k, .75);
      };
    } else {
      // held low on the spear arm's side (in front of the body side on), along the way faced
      const a = rad(phi), side = row >= 2 ? [0, 1.5] : row === 0 ? [-7, 0] : [7, 0], near = row >= 2 ? 3 : 1, out = THRUST.out[f];
      ang = a; gx = CX + side[0] + Math.cos(a) * (near + out); gy = CY + side[1] + Math.sin(a) * (near + out);
      const tip = 14, n = THRUST.streak[f];
      shapes = [[[[tip - 6, 0], [tip - 4.2, -2.5], [tip, 0]], C.steel], [[[tip - 6, 0], [tip, 0], [tip - 4.2, 2.5]], C.iron]];
      if (n) shapes.push([[[tip - 5.5, -1.6], [tip - 5.5, 1.6], [tip - 5.5 - n, 0]], C.streak]);      // (over the shaft, thinning back from the point)
      shapes.push([box(-7, tip - 5, -.6, .6), C.wood]);
    }
    const ux = Math.cos(ang), uy = Math.sin(ang), PAL = Object.values(C);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const votes = new Array(PAL.length).fill(0); let n = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = x + (sx + .5) / SS, py = y + (sy + .5) / SS, lu = (px - gx) * ux + (py - gy) * uy, lv = -(px - gx) * uy + (py - gy) * ux;
        const hit = shapes.find(([pts]) => inside(pts, lu, lv));
        const c = hit ? hit[1] : streak(px, py) ? C.streak : null;
        if (c) { n++; votes[PAL.indexOf(c)]++; }
      }
      if (n < SS * SS * .45) continue;
      const c = PAL[votes.indexOf(Math.max(...votes))], i = ((flip ? CELL - 1 - x : x) + y * CELL) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    // the hand on it, as the sheet draws a hand: 2 x 2 of fur in a ring of outline with the corners off
    const hx = Math.round(gx - 2), hy = Math.round(gy - 2);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const rim = x % 3 === 0 || y % 3 === 0; if (rim && x % 3 === 0 && y % 3 === 0) continue;
      const c = rim ? hand[0] : x === 1 ? hand[1] : hand[2], X = hx + x, i = ((flip ? CELL - 1 - X : X) + (hy + y) * CELL) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    return d;
  }

  // The hand's colours of one person's sheet, read off a hand the sheet draws (the axe swung to the right, frame 4).
  const hands = new WeakMap(), sheets = new Map();
  function handOf(sheet) {
    if (!hands.has(sheet)) {
      const c = document.createElement("canvas"); c.width = 3; c.height = 1;
      const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(sheet, 4 * CELL + 24, 18 * CELL + 28, 3, 1, 0, 0, 3, 1);
      const p = g.getImageData(0, 0, 3, 1).data;
      hands.set(sheet, p[3] && p[7] && p[11] ? [[p[0], p[1], p[2]], [p[4], p[5], p[6]], [p[8], p[9], p[10]]] : [[92, 78, 146], [221, 213, 222], [243, 242, 192]]);
    }
    return hands.get(sheet);
  }
  // The weapon's sheet for someone drawn from `sheet`: 8 frames across, the 4 ways faced down (one per hand colour).
  function sheetFor(kind, sheet) {
    const hand = handOf(sheet), key = kind + hand.join();
    if (!sheets.has(key)) {
      const c = document.createElement("canvas"); c.width = CELL * 8; c.height = CELL * 4;
      const g = c.getContext("2d");
      for (let row = 0; row < 4; row++) for (let f = 0; f < 8; f++) g.putImageData(new ImageData(frame(kind, row, f, hand), CELL, CELL), f * CELL, row * CELL);
      sheets.set(key, c);
    }
    return sheets.get(key);
  }
  return {frame, sheetFor, STEP, KINDS: ["sword", "spear"]};
})();
