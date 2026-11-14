// Player races (sim: Agent.race): the cat is the sheet as drawn; the others are the cat's own frames with the head
// rebuilt (ears off, the top rounded, the race's own ears, eyes, muzzle or bill put on), so every race has every
// animation. Designed in design/enemies/site/races.html. Clothes are painted on afterwards (wear.js).

const Races = (() => {
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BASE = {a: "#5c4e92", b: "#f3f2c0", c: "#e8b5ac", d: "#ddd5de", e: "#f3d8c5", f: "#766daa", g: "#eae178"};
  const CLASS = Object.fromEntries(Object.entries(BASE).map(([k, h]) => [rgb(h).join(), k]));
  const CELL = 48, DIRS = ["down", "up", "right", "left"];
  const RACES = [
    {key: "cat", name: "Cat", col: {},
      text: "The player as it is today: pointed ears with pink inside, whiskers, a collar with a bell.", head() {}},
    {key: "bunny", name: "Bunny", col: {a: "#8a6f8f", b: "#fbf3ee", d: "#e6d9dc", c: "#f2a9b4", e: "#f6cfd0"},
      text: "Two long, straight ears with rounded tips, pink inside, the same width down to the head and joined to it with no line across the foot. Side on, the far ear shows as a shaded edge behind the near one. From behind, a white tuft of a tail. It keeps the whiskers.",
      head(H, A) {
        H.round();
        // An ear: nine rows, straight, a rounded tip, pink down the inside. `out` says which side the pink is on (-1 left, 1 right).
        const SHAPE = [".aa.", "abba", "abca", "abca", "abca", "abca", "abca", "abca", "abba"];      // the same width all the way down
        const ear = (x0, out, fill = "b", pink = true, dy = 0) => SHAPE.forEach((row, i) => {
          [...(out > 0 ? row : [...row].reverse().join(""))].forEach((ch, j) => {
            if (ch !== "." && A.sy - 9 + i + 1 + dy <= A.sy) H.put(x0 + j, A.sy - 9 + i + 1 + dy, ch === "c" ? (pink ? "c" : fill) : ch === "b" ? fill : "a"); });
        });
        if (A.side) {                              // side on, the far ear shows behind the near one, in shade. The near ear's pink
          const back = A.facing === "right" ? -1 : 1;      // inside faces the way the bunny faces (it faced backwards: "rabbit ears are
          ear(A.cx - 2 + back, back, "d", false, 1); ear(A.cx - 2, -back, "b", true);      // backwards"); the far one a pixel back and lower: only its edge shows
          H.put(A.cx - 1, A.sy, "b"); H.put(A.cx, A.sy, "b");                              // the near ear runs into the head: no line across its foot
        } else for (const [x0, out] of [[A.cx - 5, -1], [A.cx + 1, 1]]) {
          ear(x0, out, "b", A.facing !== "up");
          H.put(x0 + 1, A.sy, "b"); H.put(x0 + 2, A.sy, "b");
        }
        if (A.facing === "up") for (const [x, y] of [[-1, 0], [0, 0], [-1, 1], [0, 1]]) H.put(A.cx + x, A.k + 3 + y, "w");
      }},
    {key: "bear", name: "Bear", col: {a: "#6b4a3a", b: "#d6a878", d: "#b98958", c: "#b98958", e: "#e0b58c"},
      text: "Small round ears set wide, a pale muzzle with a dark nose, no whiskers. The stockiest outline of the four.",
      head(H, A) {
        H.round(); H.whiskers();
        const ear = (x0) => { H.put(x0, A.sy - 2, "a"); H.put(x0 + 1, A.sy - 2, "a"); H.put(x0 - 1, A.sy - 1, "a"); H.put(x0, A.sy - 1, "c"); H.put(x0 + 1, A.sy - 1, "c"); H.put(x0 + 2, A.sy - 1, "a");
          H.put(x0, A.sy, "b"); H.put(x0 + 1, A.sy, "b"); };
        if (A.side) ear(A.cx - (A.facing === "right" ? 2 : -1)); else { ear(A.hmin + 2); ear(A.hmax - 3); }
        if (A.facing === "down") { for (let y = 6; y <= 7; y++) for (let x = -2; x <= 1; x++) H.put(A.cx + x, A.sy + y, "m", "bde"); H.put(A.cx - 1, A.sy + 6, "n"); H.put(A.cx, A.sy + 6, "n"); }
        if (A.side) { const f = A.facing === "right" ? A.hmax - 1 : A.hmin + 1, s = A.facing === "right" ? -1 : 1;
          for (let y = 6; y <= 7; y++) for (let x = 0; x < 2; x++) H.put(f + s * x, A.sy + y, "m", "bde"); H.put(f, A.sy + 6, "n"); }
      }},
    {key: "frog", name: "Frog", col: {a: "#2f6672", b: "#74c9bd", d: "#4aa3a0", c: "#74c9bd", e: "#74c9bd"},
      text: "Built like the game's own hopper, in its colours: a round head with two low bumps on top and a dark eye in each, a soft wide mouth, pink cheeks, a pale belly, spots down its back. No ears, no whiskers.",
      head(H, A) {
        H.round(); H.whiskers(); H.eyes(); H.plain();
        // A bump: four wide, two tall, part of the head's own outline (not a stalk), with the eye in it: two dark pixels, one above the other.
        const bump = (x0, ex) => {
          H.put(x0 + 1, A.sy - 2, "a"); H.put(x0 + 2, A.sy - 2, "a"); H.put(x0, A.sy - 1, "a"); H.put(x0 + 3, A.sy - 1, "a");
          for (const j of [1, 2]) { H.put(x0 + j, A.sy - 1, "b"); H.put(x0 + j, A.sy, "b"); }
          if (A.facing !== "up") { H.put(x0 + ex, A.sy - 1, "n"); H.put(x0 + ex, A.sy, "n"); }
        };
        if (!A.side) {
          bump(A.hmin + 1, 2); bump(A.hmax - 4, 1);
          if (A.facing === "down") {
            for (let x = A.hmin + 4; x <= A.hmax - 4; x++) H.put(x, A.sy + 5, "d", "b");                      // the mouth: a shade, not a line
            H.put(A.hmin + 2, A.sy + 4, "p", "b"); H.put(A.hmax - 2, A.sy + 4, "p", "b");                     // cheeks
          } else for (const [x, y] of [[-3, 3], [-2, 3], [1, 5], [2, 5], [-1, 7], [3, 2]]) H.put(A.cx + x, A.sy + y, "d", "b");   // spots
        } else {
          const right = A.facing === "right", f = right ? A.hmax - 1 : A.hmin + 1, s = right ? -1 : 1;        // f: the front of the face
          bump(right ? A.hmax - 5 : A.hmin + 2, right ? 2 : 1);                                               // one bump, just behind the brow
          for (let x = 0; x < 3; x++) H.put(f + s * x, A.sy + 5, "d", "b");                                   // the mouth, from the front of the face
        }
        H.belly();
      }},
    {key: "duck", name: "Duck", col: {a: "#9a6a2e", b: "#f9dd6e", d: "#e6c355", c: "#f9dd6e", e: "#f7c98a"},
      text: "A yellow duckling: a round head with one curl of down on top, an orange bill that sticks out in front when seen from the side, and orange feet. No ears, no whiskers.",
      head(H, A) {
        H.round(); H.whiskers(); H.plain();
        const curl = (x) => { H.put(x, A.sy - 2, "a"); H.put(x + 1, A.sy - 3, "a"); H.put(x - 1, A.sy - 1, "a"); H.put(x, A.sy - 1, "b"); H.put(x + 1, A.sy - 2, "b"); H.put(x + 2, A.sy - 2, "a"); H.put(x + 1, A.sy - 1, "a"); H.put(x, A.sy, "b"); };
        if (!A.side) {
          curl(A.cx - 1);
          if (A.facing === "down") for (let x = -2; x <= 1; x++) { H.put(A.cx + x, A.sy + 6, "o"); H.put(A.cx + x, A.sy + 7, x === -2 || x === 1 ? "B" : "O"); }     // the bill, from the front
        } else {
          const right = A.facing === "right", f = right ? A.hmax : A.hmin, out = right ? 1 : -1;            // f: the front edge of the face
          curl(A.cx - 1 - out);
          for (let j = 0; j <= 2; j++) H.put(f + out * j, A.sy + 6, "o");                                    // the bill sticks out past the face
          for (let j = 0; j <= 1; j++) H.put(f + out * j, A.sy + 7, "O");
          H.put(f + out * 3, A.sy + 6, "B"); H.put(f + out * 2, A.sy + 7, "B");
          for (let j = 1; j <= 2; j++) H.put(f + out * j, A.sy + 5, "B"); H.put(f + out, A.sy + 8, "B");
        }
        H.feet();
      }},
  ];
  const EXTRA = {w: "#fffdf4", m: "#f1dfbd", n: "#3a2a30", y: "#f4f3c4", p: "#f2a9b4", o: "#f59a4a", O: "#e07f38", B: "#a85a2a"};     // ... and the bill and feet        // white, muzzle, nose and pupil, belly
  function analyse(d, row, col) {
    // What is in the frame: the body, and on the swings a tool, its arc and sometimes a hand apart from the body. The
    // head is measured on the body alone (the piece that wears the collar). Measured on everything, a raised axe was
    // taken for the head: ears were put on it, the head came out as a slab, the tool above the head was wiped.
    const raw = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && d[(y * CELL + x) * 4 + 3] ? CLASS[[d[(y * CELL + x) * 4], d[(y * CELL + x) * 4 + 1], d[(y * CELL + x) * 4 + 2]].join()] || "?" : null;
    const body = new Uint8Array(CELL * CELL), stack = [];
    const own = (x, y) => { const c = raw(x, y); return c && c !== "?"; };
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (raw(x, y) === "f") { body[y * CELL + x] = 1; stack.push([x, y]); }
    if (!stack.length) for (let y = 0; y < CELL && !stack.length; y++) for (let x = 0; x < CELL; x++) if (own(x, y)) { body[y * CELL + x] = 1; stack.push([x, y]); break; }
    while (stack.length) { const [x, y] = stack.pop();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy;
        if (u >= 0 && v >= 0 && u < CELL && v < CELL && !body[v * CELL + u] && own(u, v)) { body[v * CELL + u] = 1; stack.push([u, v]); } } }
    const at = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && body[y * CELL + x] ? raw(x, y) : null;
    let top = CELL, bottom = 0, k = null, sy = null;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (at(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); if (k === null && at(x, y) === "f") k = y; }
    if (k === null) k = top + 9;
    for (let y = top; y < k && sy === null; y++) {                 // the skull starts at the first row that is one unbroken run (the ears are two)
      let run = 0, best = 0, runs = 0;
      for (let x = 0; x < CELL; x++) { if (at(x, y)) { run++; best = Math.max(best, run); if (run === 1) runs++; } else run = 0; }
      if (runs === 1 && best >= 6) sy = y;
    }
    if (sy === null) sy = top + 1;
    let hmin = CELL, hmax = 0;
    for (let x = 0; x < CELL; x++) if (at(x, sy + 3)) { hmin = Math.min(hmin, x); hmax = Math.max(hmax, x); }
    const facing = DIRS[row % 4], side = facing === "left" || facing === "right";
    if (side) {                                    // side on, the cat's ear flops as it walks: measure the head lower down, where it
      // never changes (three rows and one row above the collar: the narrower of the two, so a hand resting against one
      // of them is not taken for the face), and find the top of the skull above the face, not above the ear.
      let mid = 0, nf = 0; for (let x = 0; x < CELL; x++) if (at(x, k) === "f") { mid += x; nf++; }
      mid = nf ? Math.round(mid / nf) : Math.round((hmin + hmax) / 2);
      let lo = -1, hi = CELL;
      for (const y of [k - 3, k - 1]) { if (!at(mid, y)) continue;
        let a = mid, b = mid; while (at(a - 1, y)) a--; while (at(b + 1, y)) b++; lo = Math.max(lo, a); hi = Math.min(hi, b); }
      if (lo >= 0) { hmin = lo; hmax = hi; }
      // A hand held out beside the face (the hoe's first frame) is the body's, but it is not the head: it is set apart
      // with the tool, so that rounding the head, taking the whiskers off and the rest leave it alone (it came out
      // flattened, and the muzzle or the bill was put on it). The head's box: its edges, the front one a pixel in above the snout.
      const front = facing === "right" ? 1 : -1;
      const out = (x, y) => y < k - 4 ? (front > 0 ? x < hmin || x > hmax - 1 : x < hmin + 1 || x > hmax) : x < hmin || x > hmax;
      const seen = new Uint8Array(CELL * CELL);
      for (let y = top; y < k + 2; y++) for (let x = 0; x < CELL; x++) {
        if (!body[y * CELL + x] || seen[y * CELL + x] || !out(x, y)) continue;
        const blob = [], st = [[x, y]]; seen[y * CELL + x] = 1;
        while (st.length) { const [u, v] = st.pop(); blob.push(v * CELL + u);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const p = u + dx, q = v + dy;
            if (q >= 0 && q < k + 2 && p >= 0 && p < CELL && body[q * CELL + p] && !seen[q * CELL + p] && out(p, q)) { seen[q * CELL + p] = 1; st.push([p, q]); } } }
        if (blob.length >= 5) for (const i of blob) body[i] = 0;
      }
      const xf = facing === "right" ? hmax - 2 : hmin + 2;
      sy = top; while (sy < k && !at(xf, sy)) sy++;
    }
    return {top, bottom, k, sy, hmin, hmax, cx: Math.round((hmin + hmax + 1) / 2), facing, side, at, raw, body, walk: row >= 4 && row < 8, col};
  }
  function remake(d, A, race) {                    // d: the frame's pixels, rewritten in place
    const g = [], other = [];                      // the body as colour classes (null is empty); other: the tool, its arc, a hand apart
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { g.push(A.at(x, y)); other.push(A.at(x, y) ? null : A.raw(x, y)); }
    const get = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL ? g[y * CELL + x] : null;
    const span = (y) => { let a = CELL, b = -1; for (let x = 0; x < CELL; x++) if (get(x, y)) { a = Math.min(a, x); b = x; } return [a, b]; };
    const H = {
      get,
      put(x, y, c, over) { if (x < 0 || y < 0 || x >= CELL || y >= CELL) return; if (!over || (get(x, y) && over.includes(get(x, y)))) g[y * CELL + x] = c; },
      round() {                                    // take the cat's ears off and close the top of the head in a curve
        for (let y = A.top; y < A.sy; y++) for (let x = 0; x < CELL; x++) g[y * CELL + x] = null;
        if (A.side) {                              // side on: the top three rows of the head are built new, a plain dome,
          for (let i = 0; i < 3; i++) {            // so nothing of the cat's ear (which moves) is left
            const y = A.sy + i, a = A.hmin + 2 - i, b = A.hmax - 2 + i;
            for (let x = A.hmin - 3; x <= A.hmax + 3; x++) g[y * CELL + x] = x < a || x > b ? null : x === a || x === b || i === 0 ? "a" : "b";
          }
          return;
        }
        const [a, b] = span(A.sy), inset = 2;
        for (let x = a; x <= b; x++) g[A.sy * CELL + x] = x < a + inset || x > b - inset ? null : "a";
        for (const [x, s] of [[a, 1], [b, -1]]) if (get(x, A.sy + 1)) { g[(A.sy + 1) * CELL + x] = null; g[(A.sy + 1) * CELL + x + s] = "a"; }
        for (let y = A.sy; y < A.k; y++) for (let x = 0; x < CELL; x++) if (get(x, y) === "c") g[y * CELL + x] = "b";
      },
      whiskers() { for (let y = A.sy + 2; y < A.k; y++) { const [a, b] = span(y), [ua, ub] = span(y - 1), [da, db] = span(y + 1);
        if (a < ua && a < da) g[y * CELL + a] = null; if (b > ub && b > db) g[y * CELL + b] = null; } },
      eyes() { for (let y = A.sy + 3; y < A.k - 1; y++) for (let x = 0; x < CELL; x++)           // outline pixels inside the face are the eyes
        if (get(x, y) === "a" && get(x - 1, y) && get(x + 1, y) && get(x, y - 1) && get(x, y + 1) && get(x - 1, y) !== "a" && get(x + 1, y) !== "a") g[y * CELL + x] = "b"; },
      plain() { for (let y = A.sy; y < A.k; y++) for (let x = 0; x < CELL; x++) if (get(x, y) === "d") g[y * CELL + x] = "b"; },    // no forehead patch
      feet() { for (let y = A.bottom - 1; y <= A.bottom; y++) for (let x = 0; x < CELL; x++) if ("bd".includes(get(x, y) || "?")) g[y * CELL + x] = "o"; },
      belly() { if (A.facing !== "up") for (let y = A.k + 2; y < A.bottom - 1; y++) for (let x = 0; x < CELL; x++) if (get(x, y) === "b") g[y * CELL + x] = "y"; },
    };
    race.head(H, A);
    // A tool held over the head is held by a hand, which on the cat is a few pixels above the skull, where its ears are:
    // rounding the head took the hand with the ears, and the tool hung in the air. What was body within two pixels of the
    // tool, above the skull, is put back.
    if (A.facing !== "down") for (let y = 0; y <= A.sy; y++) for (let x = 0; x < CELL; x++) {       // (facing us, the tool is in front of the body)
      const was = A.at(x, y); if (!was || g[y * CELL + x]) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (other[(y + dy) * CELL + x + dx] === "?") { near = true; break; }
      if (near) g[y * CELL + x] = was === "c" ? "b" : was;                // (the cat's pink ear lining is not a hand's colour)
    }
    for (let i = 0; i < g.length; i++) if (other[i]) g[i] = other[i];      // the tool, the arc and the hand go back on top, untouched
    for (let i = 0; i < g.length; i++) {
      const c = g[i], hex = c && (race.col[c] || EXTRA[c] || BASE[c]);
      if (!hex) { if (!c) d[i * 4 + 3] = 0; continue; }
      const v = rgb(hex); d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = 255;
    }
    return g;                                    // the frame as colour classes, for the clothes
  }
  // One person's sheet: their race, with their own tint mixed into its body colour. It carries, per frame, the grid of
  // colour classes and the measurements of the head, for the clothes.
  const sheets = new Map();
  let baseData = null, analysis = null;
  const blend = (h, tint, k) => "#" + rgb(h).map((v, i) => Math.round(v * (1 - k) + rgb(tint)[i] * k).toString(16).padStart(2, "0")).join("");
  function raceSheet(key, tint) {
    const race = RACES.find((r) => r.key === key);
    if (!race || key === "cat") return characterSheet(tint);
    if (sheets.has(key + tint)) return sheets.get(key + tint);
    const W = IMG.character.width, H = IMG.character.height, cols = W / CELL, rows = H / CELL;
    const frame = (r, c) => { const d = new Uint8ClampedArray(CELL * CELL * 4);
      for (let y = 0; y < CELL; y++) d.set(baseData.subarray(((r * CELL + y) * W + c * CELL) * 4, ((r * CELL + y) * W + c * CELL + CELL) * 4), y * CELL * 4);
      return d; };
    if (!baseData) {
      const b = document.createElement("canvas"); b.width = W; b.height = H;
      const g = b.getContext("2d"); g.drawImage(IMG.character, 0, 0);
      baseData = g.getImageData(0, 0, W, H).data;
      analysis = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) analysis.push(analyse(frame(r, c), r, c));
    }
    const mine = {...race, col: {...race.col, b: blend(race.col.b, tint, .35), d: blend(race.col.d, tint, .3)}};      // a little of the person's colour
    for (const k of ["c", "e"]) if (race.col[k] === race.col.b) mine.col[k] = mine.col.b;
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const img = new ImageData(W, H);
    out.grids = []; out.an = analysis;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = frame(r, c);
      out.grids.push(remake(d, analysis[r * cols + c], mine));
      for (let y = 0; y < CELL; y++) img.data.set(d.subarray(y * CELL * 4, (y + 1) * CELL * 4), ((r * CELL + y) * W + c * CELL) * 4);
    }
    out.getContext("2d").putImageData(img, 0, 0);
    sheets.set(key + tint, out);
    return out;
  }
  return {RACES, raceSheet};
})();
const raceSheet = Races.raceSheet;

// The join box: pick who you are. The choice is kept in this browser and sent with your name (agent.js).
let myRace = localStorage.getItem("megastructure-race") || "cat";
(() => {
  const row = document.createElement("div");
  row.id = "racepick";
  row.style.cssText = "display:flex; gap:6px; justify-content:center; margin:10px 0 2px";
  $("join").closest(".row").after(row);
  const draw = () => {
    if (!IMG.character || !IMG.character.complete || !IMG.character.width) return setTimeout(draw, 150);
    row.innerHTML = "";
    for (const r of Races.RACES) {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.race = r.key; b.title = r.name;
      b.style.cssText = `padding:2px; border-radius:10px; cursor:pointer; background:${r.key === myRace ? "#ffe2a6" : "transparent"}; border:3px solid ${r.key === myRace ? "#5b3f36" : "transparent"}`;
      const c = document.createElement("canvas"); c.width = c.height = 48; c.style.cssText = "width:48px; height:48px; image-rendering:pixelated; display:block";
      const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
      g.drawImage(raceSheet(r.key, "#f3f2c0"), 12, 12, 24, 24, 0, 0, 48, 48);
      b.appendChild(c);
      b.onclick = () => { myRace = r.key; localStorage.setItem("megastructure-race", myRace); draw(); };
      row.appendChild(b);
    }
  };
  draw();
})();
