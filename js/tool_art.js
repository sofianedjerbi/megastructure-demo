// Swings for the tools the character sheet has no drawing of. The sheet (Sprout Lands) has an axe, a hoe and a watering
// can; a pickaxe, a sword and a spear were all swung as the axe. Each gets its own rows, made from the axe's: the same
// frames, hand and arc, with only the tool redrawn where the axe was (its handle gives the direction it points).
// The rows are added under the sheet once, when it loads (assets.js), so everything built from the sheet afterwards
// (a person's colour, their race, their clothes) has them too. ANIM in sprites.js names the rows.

const ToolArt = (() => {
  const CELL = 48, AXE_ROW = 16, KINDS = ["pickaxe", "sword", "spear"];
  const HEAD = new Set(["129,129,129", "183,183,183"]), HANDLE = new Set(["170,121,89", "144,98,93"]);
  const C = {wood: [170, 121, 89], dark: [144, 98, 93], iron: [129, 129, 129], steel: [183, 183, 183], edge: [158, 170, 182], blade: [226, 232, 236], gold: [222, 178, 86]};
  const pad = document.createElement("canvas"); pad.width = pad.height = CELL * 8;

  // One frame (48 x 48 RGBA, changed in place): the axe out, `kind` in.
  function redraw(d, kind) {
    const key = (i) => d[i * 4 + 3] ? d[i * 4] + "," + d[i * 4 + 1] + "," + d[i * 4 + 2] : null;
    const head = [], handle = [];
    for (let i = 0; i < CELL * CELL; i++) { const k = key(i); if (HEAD.has(k)) head.push(i); else if (HANDLE.has(k)) handle.push(i); }
    if (!head.length) return;
    const xy = (i) => [i % CELL, Math.floor(i / CELL)], mean = (list) => { let x = 0, y = 0; for (const i of list) { x += i % CELL; y += Math.floor(i / CELL); } return [x / list.length, y / list.length]; };
    const ch = mean(head), cn = handle.length ? mean(handle) : null;
    // which way the tool points: from the middle of the handle to the middle of the head
    let ux, uy;
    if (cn && Math.hypot(ch[0] - cn[0], ch[1] - cn[1]) > .8) { ux = ch[0] - cn[0]; uy = ch[1] - cn[1]; }
    else { let bx = 0, by = 0, n = 0;                      // seen end on (no handle to speak of): away from the body
      for (let i = 0; i < CELL * CELL; i++) if (d[i * 4 + 3] && !HEAD.has(key(i)) && !HANDLE.has(key(i))) { bx += i % CELL; by += Math.floor(i / CELL); n++; }
      ux = ch[0] - bx / n; uy = ch[1] - by / n; }
    const len = Math.hypot(ux, uy) || 1; ux /= len; uy /= len;
    const vx = -uy, vy = ux, along = (i) => (i % CELL) * ux + Math.floor(i / CELL) * uy;
    const all = handle.concat(head), first = all.reduce((a, b) => along(a) <= along(b) ? a : b), last = all.reduce((a, b) => along(a) >= along(b) ? a : b);
    const grip = handle.length ? xy(handle.reduce((a, b) => along(a) <= along(b) ? a : b)) : xy(first);
    const reach = along(last) - (grip[0] * ux + grip[1] * uy);               // from the hand to the tip of the axe
    const was = new Uint8Array(CELL * CELL);              // 1: the axe was here (it may be painted on); 2: painted
    for (const i of all) was[i] = 1;
    // The tool is drawn eight times too big, as solid shapes along its own axis (x from the hand outwards, y across),
    // then each pixel takes the colour that covers most of it. Drawn straight onto the pixels, a thin tool at an angle
    // came out as a dotted line.
    const UP = 8, big = pad.getContext("2d", {willReadFrequently: true});
    big.setTransform(1, 0, 0, 1, 0, 0); big.clearRect(0, 0, CELL * UP, CELL * UP);
    big.setTransform(UP * ux, UP * uy, UP * vx, UP * vy, UP * (grip[0] + .5 - ux * .5), UP * (grip[1] + .5 - uy * .5));
    const box = (x0, x1, y0, y1, c) => { big.fillStyle = `rgb(${c})`; big.fillRect(x0, y0, x1 - x0, y1 - y0); };
    const shape = (pts, c) => { big.fillStyle = `rgb(${c})`; big.beginPath(); pts.forEach(([x, y], i) => i ? big.lineTo(x, y) : big.moveTo(x, y)); big.closePath(); big.fill(); };
    if (kind === "pickaxe") {                              // the handle stays; across its end, a bar bent back, pointed at both tips
      for (const i of head) d[i * 4 + 3] = 0;
      const k = Math.max(reach - 1, 3.5);
      shape([[k - 2.2, -4.8], [k - .1, -2.7], [k + 1.1, -1], [k + 1.1, 1], [k - .1, 2.7], [k - 2.2, 4.8], [k - 2.9, 3.5], [k - 1.6, 1.7], [k - 1.1, 0], [k - 1.6, -1.7], [k - 2.9, -3.5]], C.iron);
      shape([[k - 2.2, -4.8], [k - 1, -3.5], [k - 2, -2.7], [k - 2.9, -3.5]], C.steel);
      shape([[k - 2.2, 4.8], [k - 1, 3.5], [k - 2, 2.7], [k - 2.9, 3.5]], C.steel);
    } else if (kind === "sword") {                         // a short grip, a guard across, then the blade to past where the axe reached
      for (const i of all) d[i * 4 + 3] = 0;
      const tip = Math.max(reach + 2.5, 9);
      box(0, 2, -.6, .6, C.dark);
      shape([[2.9, -1], [tip - 1.6, -1], [tip, 0], [tip - 1.6, 1], [2.9, 1]], C.blade);
      shape([[2.9, .1], [tip - 1.6, .1], [tip - .8, .5], [tip - 1.6, 1], [2.9, 1]], C.edge);
      box(1.9, 2.9, -2.2, 2.2, C.gold);
    } else {                                               // spear: a long shaft through the hand, a leaf-shaped point at the end
      for (const i of all) d[i * 4 + 3] = 0;
      const tip = Math.max(reach + 4.5, 11);
      box(-3.5, tip - 3, -.6, .6, C.wood);
      box(tip - 4, tip - 3, -.9, .9, C.dark);
      shape([[tip - 3.2, 0], [tip - 2.2, -1.6], [tip + .6, 0], [tip - 2.2, 1.6]], C.steel);
      shape([[tip - 3.2, 0], [tip - 2.2, 1.6], [tip + .6, 0]], C.iron);
    }
    const px = big.getImageData(0, 0, CELL * UP, CELL * UP).data, PAL = Object.values(C);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const votes = new Array(PAL.length).fill(0); let n = 0;
      for (let sy = 0; sy < UP; sy++) for (let sx = 0; sx < UP; sx++) { const j = ((y * UP + sy) * CELL * UP + x * UP + sx) * 4;
        if (px[j + 3] < 128) continue; n++;
        let best = 0, bd = 1e9; PAL.forEach((c, q) => { const dd = (c[0] - px[j]) ** 2 + (c[1] - px[j + 1]) ** 2 + (c[2] - px[j + 2]) ** 2; if (dd < bd) { bd = dd; best = q; } });
        votes[best]++; }
      if (n < UP * UP * .42) continue;
      const i = y * CELL + x; if (d[i * 4 + 3] && !was[i]) continue;          // never over the body or the arc: the tool passes behind
      const c = PAL[votes.indexOf(Math.max(...votes))];
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; was[i] = 2;
    }
    // Where the axe lay over the body and the new tool does not, the body shows through: the commonest colour around.
    for (let pass = 0; pass < 2; pass++) for (const i of all) {
      if (was[i] === 2 || d[i * 4 + 3]) continue;
      const x = i % CELL, y = Math.floor(i / CELL), seen = {}; let n = 0, best = null;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * CELL + x + dx;
        if ((dx || dy) && x + dx >= 0 && x + dx < CELL && y + dy >= 0 && y + dy < CELL && d[j * 4 + 3] && was[j] !== 2) { n++; const k = key(j); seen[k] = (seen[k] || 0) + 1; if (!best || seen[k] > seen[best]) best = k; } }
      if (n >= 5) { const c = best.split(",").map(Number); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
    }
  }

  // The sheet with the new rows under it: a canvas that stands in for the image (same width, taller).
  function extend(img) {
    const W = img.width, H = img.height, c = document.createElement("canvas");
    c.width = W; c.height = H + KINDS.length * 4 * CELL;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    KINDS.forEach((kind, n) => {
      for (let r = 0; r < 4; r++) for (let col = 0; col < W / CELL; col++) {
        const f = g.getImageData(col * CELL, (AXE_ROW + r) * CELL, CELL, CELL);
        redraw(f.data, kind);
        g.putImageData(f, col * CELL, H + (n * 4 + r) * CELL);
      }
    });
    c.complete = true; c.src = img.src;                    // (what the code asks of the image it replaces)
    return c;
  }
  return {extend, KINDS, redraw};
})();
