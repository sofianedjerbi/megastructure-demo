// Clothes and armor (sim/wear.py): how each piece looks on the player. Nothing is redrawn: each frame of the character
// sheet is read once (where the skull starts, where the collar is, where the feet are) and the pieces are painted there,
// so they follow every bob, step and swing. Designed in design/enemies/site/clothes.html; a test keeps WEAR equal to tiles.py.

// item -> [slot, the look it has in the tables below]
const WEAR = {
  straw_hat: ["head", "straw"], sporecap_hat: ["head", "sporecap"], wizard_hat: ["head", "wizard"], gold_crown: ["head", "crown"], iron_helmet: ["head", "iron"], mossback_helm: ["head", "shell"], wool_beanie: ["head", "beanie"], flower_crown: ["head", "flowers"], bandana: ["head", "bandana"], sprout: ["head", "sprout"],
  linen_shirt: ["top", "linen"], red_scarf: ["top", "scarf"], wool_sweater: ["top", "wool"], overalls: ["top", "overalls"], leather_vest: ["top", "leather"], wizard_robe: ["top", "robe"], iron_chestplate: ["top", "iron"], gold_chestplate: ["top", "gold"], mossback_plate: ["top", "moss"],
  linen_shorts: ["pants", "linen"], denim: ["pants", "denim"], red_trousers: ["pants", "red"], leather_chaps: ["pants", "leather"], robe_skirt: ["pants", "robe"], iron_greaves: ["pants", "iron"], gold_greaves: ["pants", "gold"], moss_kilt: ["pants", "moss"],
  leather_boots: ["shoes", "leather"], red_sneakers: ["shoes", "red"], rain_boots: ["shoes", "rain"], blue_slippers: ["shoes", "blue"], iron_boots: ["shoes", "iron"], gold_boots: ["shoes", "gold"], moss_slippers: ["shoes", "moss"],
  sparkle_charm: ["effect", "sparkle"], firefly_charm: ["effect", "fireflies"], leaf_charm: ["effect", "leaves"], heart_charm: ["effect", "hearts"], flame_charm: ["effect", "flame"], frost_charm: ["effect", "frost"], halo_charm: ["effect", "halo"], spore_charm: ["effect", "spores"], flower_charm: ["effect", "flowers"],
};
const WearParts = (() => {
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // The player's own colours: outline, body, blush, shade, cheek, collar, bell.
  const BASE = {a: "#5c4e92", b: "#f3f2c0", c: "#e8b5ac", d: "#ddd5de", e: "#f3d8c5", f: "#766daa", g: "#eae178"};
  const CLASS = Object.fromEntries(Object.entries(BASE).map(([k, h]) => [rgb(h).join(), k]));
  const CELL = 48, DIRS = ["down", "up", "right", "left"];
  // A top, pants or shoes entry maps the player's colour classes in its rows to new colours ("a" recolours the outline: armor).
  const TOPS = [
    {id: "none", name: "Collar and bell"},
    {id: "linen", name: "Linen shirt", f: "#f4efe2", g: "#c9b48f", b: "#f4efe2", d: "#d6ccb8"},
    {id: "scarf", name: "Red scarf", f: "#e0635a", g: "#f39a86"},
    {id: "wool", name: "Wool sweater", f: "#7fb4c9", g: "#f4efe2", b: "#7fb4c9", d: "#5e93ab", stripe: "#f4efe2"},
    {id: "overalls", name: "Overalls", f: "#f4efe2", g: "#e0b34f", b: "#5f86c4", d: "#4a6ba3"},
    {id: "leather", name: "Leather vest", f: "#b07a4e", g: "#e0c08a", b: "#c4905e", d: "#94623c", a: "#6b4632"},
    {id: "robe", name: "Wizard robe", f: "#8a6bc4", g: "#ffe07a", b: "#7458ad", d: "#5c4590"},
    {id: "iron", name: "Iron chestplate", f: "#b9c2cc", g: "#e9eef2", b: "#9aa5b1", d: "#7a8591", a: "#4d5663"},
    {id: "gold", name: "Gold chestplate", f: "#f2cf5c", g: "#fff3b8", b: "#e0b540", d: "#bd9230", a: "#8a6424"},
    {id: "moss", name: "Mossback plate", f: "#6fbb62", g: "#9ada7c", b: "#d3a970", d: "#a97c55", a: "#5a4048"},
  ];
  const PANTS = [
    {id: "none", name: "None"},
    {id: "linen", name: "Linen shorts", b: "#e6dcc6", d: "#c9bda3"},
    {id: "denim", name: "Denim", b: "#5f86c4", d: "#4a6ba3"},
    {id: "red", name: "Red trousers", b: "#d9675c", d: "#b54f4a"},
    {id: "leather", name: "Leather chaps", b: "#b07a4e", d: "#8a5a3a", a: "#6b4632"},
    {id: "robe", name: "Robe skirt", b: "#7458ad", d: "#5c4590"},
    {id: "iron", name: "Iron greaves", b: "#9aa5b1", d: "#7a8591", a: "#4d5663"},
    {id: "gold", name: "Gold greaves", b: "#e0b540", d: "#bd9230", a: "#8a6424"},
    {id: "moss", name: "Moss kilt", b: "#6fbb62", d: "#4c9556", a: "#3a7350"},
  ];
  const SHOES = [
    {id: "none", name: "Barefoot"},
    {id: "leather", name: "Leather boots", m: "#a8704a", a: "#6b4632"},
    {id: "red", name: "Red sneakers", m: "#e0635a", a: "#a8434f"},
    {id: "rain", name: "Rain boots", m: "#f2cf5c", a: "#b98f2e"},
    {id: "blue", name: "Blue slippers", m: "#7fb4c9", a: "#4f7f96"},
    {id: "iron", name: "Iron boots", m: "#b9c2cc", a: "#4d5663"},
    {id: "gold", name: "Gold boots", m: "#f2cf5c", a: "#8a6424"},
    {id: "moss", name: "Moss slippers", m: "#6fbb62", a: "#3a7350"},
  ];
  // A hat draws pixels relative to the skull: (cx, sy) is the middle of its top row. P.put(x, y, colour); the outline comes after.
  const dome = (P, A, rx, ry, low, col) => { for (let y = -ry; y <= low; y++) for (let x = -rx; x < rx; x++)
    if (((x + .5) / rx) ** 2 + ((y - low + .5) / (ry + low)) ** 2 <= 1) P.put(A.cx + x, A.sy + y, col(x, y)); };
  const HEADS = [
    {id: "none", name: "Bare ears"},
    {id: "straw", name: "Straw hat", line: "#a8793c", draw(P, A) {
      const w = A.side ? 4 : 6;
      for (let y = -3; y <= -1; y++) for (let x = -w + (y === -3); x < w - (y === -3); x++) P.put(A.cx + x, A.sy + y, y === -1 ? "#d9675c" : "#f0d48a");
      for (let x = -w - 3; x < w + 3; x++) P.put(A.cx + x, A.sy, (x + 99) % 3 ? "#f0d48a" : "#dcbb6a");
    }},
    {id: "sporecap", name: "Sporecap hat", line: "#a8434f", draw(P, A) {
      const rx = A.side ? 7 : 9;
      dome(P, A, rx, 4, 1, (x, y) => y === 1 ? "#cf5560" : ((x + 6) % 6 < 2 && (y + 9) % 3 < 2 && y < 0) ? "#fff3d6" : "#ec7a66");
    }},
    {id: "wizard", name: "Wizard hat", line: "#463773", draw(P, A) {
      for (let i = 0; i < 8; i++) { const hw = Math.max(1, Math.round((8 - i) * .62)), lean = i > 4 ? i - 4 : 0;
        for (let x = -hw; x < hw; x++) P.put(A.cx + x + lean, A.sy - 1 - i, i === 0 ? "#ffe07a" : "#7458ad"); }
      for (let x = (A.side ? -6 : -8); x < (A.side ? 6 : 8); x++) P.put(A.cx + x, A.sy, "#5c4590");
      P.put(A.cx, A.sy - 4, "#ffe07a");
    }},
    {id: "crown", name: "Gold crown", line: "#8a6424", draw(P, A) {
      const w = A.side ? 3 : 4;
      for (let x = -w; x < w; x++) { P.put(A.cx + x, A.sy - 1, "#f2cf5c"); P.put(A.cx + x, A.sy - 2, "#f2cf5c"); if ((x + w) % 3 === 0 || x === w - 1) P.put(A.cx + x, A.sy - 3, "#fff3b8"); }
      P.put(A.cx - 1, A.sy - 1, "#e0635a"); P.put(A.cx, A.sy - 1, "#e0635a");
    }},
    {id: "iron", name: "Iron helmet", recolour: {rows: 4, b: "#b9c2cc", c: "#9aa5b1", d: "#e9eef2", e: "#9aa5b1", a: "#4d5663"}, draw(P, A) {
      for (let y = -3; y <= -1; y++) P.put(A.cx - (A.side ? -2 : 0), A.sy + y, "#e0635a"), P.put(A.cx - 1 - (A.side ? -2 : 0), A.sy + y, "#e0635a");     // the plume
    }, line: "#a8434f"},
    {id: "shell", name: "Mossback helm", line: "#5a4048", draw(P, A) {
      const rx = A.side ? 6 : 8;
      dome(P, A, rx, 4, 1, (x, y) => y === 1 ? "#a97c55" : y < -1 ? ((x * 7 + y * 13 + 99) % 5 ? "#6fbb62" : "#9ada7c") : (x + 40) % 5 ? "#d3a970" : "#a97c55");
    }},
    {id: "beanie", name: "Wool beanie", recolour: {rows: 3, b: "#d9675c", c: "#d9675c", d: "#f4efe2", e: "#d9675c", a: "#a8434f"}, line: "#c9bda3", draw(P, A) {
      for (const [x, y] of [[-1, -2], [0, -2], [-1, -3], [0, -3]]) P.put(A.cx + x, A.top + 1 + y, "#f4efe2");                                    // a pompom
    }},
    {id: "flowers", name: "Flower crown", draw(P, A) {
      for (let x = A.hmin + 1; x < A.hmax; x++) P.put(x, A.sy + 1, ["#f29aa8", "#6fbb62", "#ffe07a", "#6fbb62", "#fff6de", "#6fbb62"][(x - A.hmin) % 6]);
    }},
    {id: "bandana", name: "Bandana", draw(P, A) {
      for (let x = A.hmin + 1; x < A.hmax; x++) P.put(x, A.sy + 2, "#e0635a");
      const k = A.facing === "left" ? A.hmax : A.facing === "right" ? A.hmin : A.hmax;
      P.put(k, A.sy + 3, "#e0635a"); P.put(k + (A.facing === "right" ? -1 : 1), A.sy + 4, "#c94f4a");
    }},
    {id: "sprout", name: "Sprout", draw(P, A) {
      P.put(A.cx, A.sy - 1, "#4c9556"); P.put(A.cx, A.sy - 2, "#4c9556");
      for (const [x, y, c] of [[-1, -3, "#6fbb62"], [-2, -3, "#6fbb62"], [-2, -4, "#9ada7c"], [1, -3, "#6fbb62"], [2, -4, "#6fbb62"], [1, -4, "#9ada7c"]]) P.put(A.cx + x, A.sy + y, c);
    }},
  ];
  function analyse(d, row) {                      // d: one 48 x 48 frame's pixels
    // The head is measured on the body alone: the piece that wears the collar, not the tool, its arc or a hand apart
    // from the body (measured on everything, a raised axe was taken for the head, and a hat jumped onto it).
    const at = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && d[(y * CELL + x) * 4 + 3] ? CLASS[[d[(y * CELL + x) * 4], d[(y * CELL + x) * 4 + 1], d[(y * CELL + x) * 4 + 2]].join()] || "?" : null;
    const body = new Uint8Array(CELL * CELL), stack = [];
    const mine = (x, y) => { const c = at(x, y); return c && c !== "?"; };
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (at(x, y) === "f") { body[y * CELL + x] = 1; stack.push([x, y]); }
    if (!stack.length) for (let y = 0; y < CELL && !stack.length; y++) for (let x = 0; x < CELL; x++) if (mine(x, y)) { body[y * CELL + x] = 1; stack.push([x, y]); break; }
    while (stack.length) { const [x, y] = stack.pop();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy;
        if (u >= 0 && v >= 0 && u < CELL && v < CELL && !body[v * CELL + u] && mine(u, v)) { body[v * CELL + u] = 1; stack.push([u, v]); } } }
    const on = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && body[y * CELL + x] ? at(x, y) : null;
    let top = CELL, bottom = 0, k = null, sy = null;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (on(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); if (k === null && on(x, y) === "f") k = y; }
    if (k === null) k = top + 9;
    for (let y = top; y < k && sy === null; y++) {                 // the skull starts at the first row that is one unbroken run (the ears are two)
      let run = 0, best = 0, runs = 0;
      for (let x = 0; x < CELL; x++) { if (on(x, y)) { run++; best = Math.max(best, run); if (run === 1) runs++; } else run = 0; }
      if (runs === 1 && best >= 6) sy = y;
    }
    if (sy === null) sy = top + 1;
    let hmin = CELL, hmax = 0;
    for (let x = 0; x < CELL; x++) if (on(x, sy + 3)) { hmin = Math.min(hmin, x); hmax = Math.max(hmax, x); }
    const facing = DIRS[row % 4];
    return {top, bottom, k, sy, hmin, hmax, cx: Math.round((hmin + hmax + 1) / 2), facing, side: facing === "left" || facing === "right", at};
  }
  // grid: the frame's colour classes when it is not the cat's own (a race: races.js). tall: its ears stand above a hat.
  function dress(d, A, o, grid, tall) {
    const set = (x, y, hex) => { if (x < 0 || y < 0 || x >= CELL || y >= CELL) return; const c = rgb(hex), i = (y * CELL + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    const cls = [];                                                // the player's own classes, before anything is painted
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) cls.push(grid ? grid[y * CELL + x] : A.at(x, y));
    const BODY = {y: "b", o: "b", O: "d"};       // a race's belly and feet take cloth like the body does
    const paint = (y0, y1, map, body = true) => { for (let y = y0; y <= y1; y++) for (let x = 0; x < CELL; x++) { const raw = cls[y * CELL + x], c = body && BODY[raw] || raw; if (c && map(c, y)) set(x, y, map(c, y)); } };
    const top = TOPS.find((t) => t.id === o.top), pants = PANTS.find((t) => t.id === o.pants), shoes = SHOES.find((t) => t.id === o.shoes), head = HEADS.find((t) => t.id === o.head);
    const feet = A.bottom - 1;
    if (top.id !== "none") paint(A.k, Math.min(A.k + 2, feet - 1), (c, y) => c === "f" && top.stripe && y === A.k + 1 ? top.stripe : top[c]);
    if (pants.id !== "none") paint(A.k + 3, feet - 1, (c) => pants[c]);
    if (shoes.id !== "none") paint(feet, A.bottom, (c) => c === "a" ? shoes.a : shoes.m);
    if (head.recolour) paint(grid ? A.sy - (tall ? 0 : 3) : A.top, A.sy + head.recolour.rows - 1, (c) => head.recolour[c], false);
    if (head.draw) {
      const layer = new Map(), P = {put: (x, y, c) => layer.set(Math.round(y) * CELL + Math.round(x), c)};
      head.draw(P, A);
      if (head.line) for (const key of [...layer.keys()]) for (const n of [key - 1, key + 1, key - CELL, key + CELL])
        if (!layer.has(n) && !(head.recolour && cls[n])) layer.set(n, null);                  // null: the outline
      for (const [key, c] of layer) set(key % CELL, Math.floor(key / CELL), c || head.line);
    }
  }
  // The sheet for one person: their tinted sheet (sprites.js) with what they wear painted on, built once per outfit.
  // It carries, per frame, the pixels just outside the dressed player (for the auras) and the top of the head.
  const sheets = new Map();
  let analysis = null;
  function wornSheet(tint, worn, race = "cat") {
    const plain = raceSheet(race, tint);              // (races.js; the cat's is sprites.js characterSheet)
    if (!worn) return plain;
    const o = {head: "none", top: "none", pants: "none", shoes: "none"};
    for (const [slot, item] of Object.entries(worn)) if (WEAR[item] && slot in o) o[slot] = WEAR[item][1];
    const key = tint + race + Object.values(o).join();
    if (sheets.has(key)) return sheets.get(key);
    const W = plain.width, H = plain.height, cols = W / CELL, rows = H / CELL;
    const frame = (data, r, c) => { const d = new Uint8ClampedArray(CELL * CELL * 4);
      for (let y = 0; y < CELL; y++) d.set(data.subarray(((r * CELL + y) * W + c * CELL) * 4, ((r * CELL + y) * W + c * CELL + CELL) * 4), y * CELL * 4);
      return d; };
    if (!analysis) {
      const b = document.createElement("canvas"); b.width = W; b.height = H;
      const bg = b.getContext("2d"); bg.drawImage(IMG.character, 0, 0);
      const data = bg.getImageData(0, 0, W, H).data;
      analysis = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) analysis.push(analyse(frame(data, r, c), r));
    }
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d"); g.drawImage(plain, 0, 0);
    const img = g.getImageData(0, 0, W, H);
    out.edges = []; out.tops = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, d = frame(img.data, r, c), A = plain.an ? plain.an[i] : analysis[i];
      dress(d, A, o, plain.grids && plain.grids[i], race === "bunny");
      for (let y = 0; y < CELL; y++) img.data.set(d.subarray(y * CELL * 4, (y + 1) * CELL * 4), ((r * CELL + y) * W + c * CELL) * 4);
      const edge = [], solid = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && d[(y * CELL + x) * 4 + 3];
      for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++)
        if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
      out.edges.push(edge); out.tops.push(A.top);
    }
    g.putImageData(img, 0, 0);
    sheets.set(key, out);
    return out;
  }
  return {TOPS, PANTS, SHOES, HEADS, rgb, wornSheet};
})();
const wornSheet = WearParts.wornSheet;
