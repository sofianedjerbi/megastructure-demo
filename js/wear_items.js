// Clothes and armor as items and effects: each piece's icon in a bag (16 x 16, drawn here, not on a sheet), the
// special effects around a player wearing a charm, and the small parts of the HUD that wearing needs.

const WearItems = (() => {
  const {TOPS, PANTS, SHOES, HEADS, rgb} = WearParts;
  const beside = (a, r) => (Math.cos(a) < 0 ? -1 : 1) * (9 + Math.abs(Math.cos(a)) * r);      // an orbit that stays off the face
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const EFFECTS = [
    {id: "none", name: "None"},
    {id: "sparkle", name: "Sparkles", front(g, F) { for (let i = 0; i < 6; i++) { const a = F.t / 900 + i * 1.05, tw = (F.t / 160 + i * 3) % 6;
      if (tw < 3) dot(g, F.fx + beside(a, 5), F.fy - 9 + Math.sin(a * 1.3) * 9, tw < 1 ? "#fff9d6" : "#ffe07a", 1, tw >= 1 && tw < 2); } }},
    {id: "fireflies", name: "Fireflies", front(g, F) { for (let i = 0; i < 3; i++) { const a = F.t / 1400 + i * 2.1, x = F.fx + Math.cos(a) * (9 + i * 2), y = F.fy - 10 + Math.sin(a * 1.7 + i) * 7;
      g.fillStyle = "rgba(220,255,140,.25)"; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); dot(g, x, y, (F.t / 300 + i) % 3 < 2 ? "#eaff9a" : "#b8e86a"); } }},
    {id: "leaves", name: "Leaves", front(g, F) { for (let i = 0; i < 5; i++) { const p = (F.t / 2600 + i / 5) % 1, a = p * 6.28 * 1.5 + i * 1.3;
      dot(g, F.fx + beside(a, 5), F.fy - 20 + p * 20, i % 2 ? "#6fbb62" : "#9ada7c"); dot(g, F.fx + beside(a, 5) + 1, F.fy - 20 + p * 20, "#4c9556"); } }},
    {id: "hearts", name: "Hearts", front(g, F) { for (let i = 0; i < 2; i++) { const p = (F.t / 1800 + i / 2) % 1, x = Math.round(F.fx + (i ? 6 : -8) + Math.sin(p * 6) * 1.5), y = Math.round(F.fy - 14 - p * 12);
      g.globalAlpha = 1 - p; g.fillStyle = "#f2788a"; g.fillRect(x, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y + 2, 1, 1); g.globalAlpha = 1; } }},
    {id: "flame", name: "Flame aura", back(g, F) { for (const [x, y] of F.edge) { const n = hash(x + Math.floor(F.t / 90), y);
      dot(g, x, y, n < .35 ? "#ffe07a" : n < .75 ? "#f59a4a" : "#e0635a"); if (n > .55 && y < F.fy - 6) dot(g, x, y - 1 - Math.floor(n * 3), "#f59a4a", .7); } }},
    {id: "frost", name: "Frost aura", back(g, F) { for (const [x, y] of F.edge) { const n = hash(x, y + Math.floor(F.t / 240));
      dot(g, x, y, n < .5 ? "#d8f4ff" : "#9ad4f2"); if (n > .8) dot(g, x + (x < F.fx ? -1 : 1), y, "#ffffff", .8); } }},
    {id: "halo", name: "Halo", front(g, F) { const y = Math.round(F.top - 4 + Math.sin(F.t / 500));
      g.fillStyle = "#ffe07a"; g.fillRect(F.fx - 4, y, 8, 1); g.fillRect(F.fx - 4, y + 2, 8, 1); g.fillRect(F.fx - 5, y + 1, 1, 1); g.fillRect(F.fx + 4, y + 1, 1, 1);
      g.fillStyle = "rgba(255,240,170,.3)"; g.fillRect(F.fx - 6, y - 1, 12, 5); }},
    {id: "spores", name: "Spore trail", back(g, F) { for (let i = 0; i < 6; i++) { const p = (F.t / 900 + i / 6) % 1;
      if (!F.walking && i > 1) continue;
      dot(g, F.fx + F.back[0] * p * 14 + (hash(i, 1) - .5) * 8, F.fy - 2 + F.back[1] * p * 12 - p * 6 - hash(i, 2) * 4, p < .6 ? "#f3f2a0" : "#e6e59a", 1 - p); } }},
    {id: "flowers", name: "Flower steps", back(g, F) { for (let i = 0; i < 4; i++) { const p = (F.t / 1600 + i / 4) % 1;
      if (!F.walking) continue;
      const x = Math.round(F.fx + F.back[0] * (4 + p * 16) + (i % 2 ? 3 : -3) * (F.back[1] ? 1 : 0)), y = Math.round(F.fy + F.back[1] * (3 + p * 12) + (i % 2 ? 1 : -1) * (F.back[0] ? 1 : 0));
      g.globalAlpha = p < .15 ? p / .15 : 1 - Math.max(0, (p - .7) / .3);
      g.fillStyle = "#4c9556"; g.fillRect(x, y, 1, 1); g.fillStyle = ["#f29aa8", "#ffe07a", "#fff6de", "#c9a8f2"][i]; g.fillRect(x, y - 1, 1, 1); if (p > .25) { g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x, y - 3, 1, 1); }
      g.globalAlpha = 1; } }},
  ];
  function dot(g, x, y, c, alpha = 1, big = false) { g.globalAlpha = alpha; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1);
    if (big) { g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); g.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); } g.globalAlpha = 1; }
  const mix = (h, k, to = [70, 48, 66]) => "#" + rgb(h).map((v, i) => Math.round(v * (1 - k) + to[i] * k).toString(16).padStart(2, "0")).join("");
  const GEM = {sparkle: "#ffe07a", fireflies: "#b8e86a", leaves: "#6fbb62", hearts: "#f2788a", flame: "#f59a4a", frost: "#9ad4f2", halo: "#fff3b8", spores: "#d9d77a", flowers: "#f29aa8"};
  const ARMOR = ["iron", "gold", "moss"], LOW = ["red", "blue", "moss"], SKIRT = ["robe", "moss"];
  HEADS.find((h) => h.id === "flowers").icon = (put) => { for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7;
    put(Math.round(Math.cos(a) * 5), Math.round(Math.sin(a) * 3.4), ["#f29aa8", "#6fbb62", "#ffe07a", "#6fbb62", "#fff6de", "#6fbb62", "#c9a8f2"][i % 7]); } };
  HEADS.find((h) => h.id === "bandana").icon = (put) => { for (let y = 0; y < 5; y++) for (let x = -5 + y; x <= 5 - y; x++) put(x, y, y === 0 ? "#f39a86" : "#e0635a");
    put(6, 0, "#c94f4a"); put(7, 1, "#c94f4a"); put(6, -1, "#c94f4a"); };
  function itemIcon(part, o) {                    // -> Map of pixel (y * 16 + x) -> colour, outlined; null for nothing
    if (o.id === "none") return null;
    const raw = [], put = (x, y, c) => { const i = raw.findIndex((p) => p[0] === x && p[1] === y); if (i >= 0) raw.splice(i, 1); if (c) raw.push([x, y, c]); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
    let line;
    if (part === "head") {
      line = o.line || (o.recolour && o.recolour.a) || "#4c7a52";
      if (o.icon) o.icon(put);
      else {
        if (o.recolour) { line = o.recolour.a;                       // a helmet or a cap: the dome it makes of the skull
          for (let y = -5; y <= 0; y++) for (let x = -6; x < 6; x++) if (((x + .5) / 6) ** 2 + ((y - .5) / 5.6) ** 2 <= 1)
            put(x, y, y === 0 ? o.recolour.c : x < -1 && y < -2 && x > -5 ? o.recolour.d : o.recolour.b); }
        o.draw({put: (x, y, c) => put(Math.round(x), Math.round(y), c)}, {cx: 0, sy: o.recolour ? -4 : 0, top: -6, hmin: -6, hmax: 6, facing: "down", side: true});
      }
    } else if (part === "top") {
      const body = o.b || o.f, shade = o.d || mix(o.f, .2);
      line = o.a || mix(body, .5);
      if (!o.b) {                                                    // a scarf: a loop and a hanging end
        box(3, 4, 12, 7, o.f); box(6, 5, 9, 6, null); box(9, 8, 11, 12, o.f); box(9, 12, 11, 12, o.g); box(3, 7, 8, 7, mix(o.f, .2));
      } else if (ARMOR.includes(o.id)) {                             // a chestplate: shoulders, a neck notch, a shine
        box(4, 4, 11, 13, body); box(2, 3, 4, 5, o.f); box(11, 3, 13, 5, o.f); box(4, 3, 11, 4, o.f); box(7, 3, 8, 4, null);
        box(4, 12, 11, 13, shade); box(11, 6, 11, 13, shade); box(5, 6, 6, 7, o.g); box(7, 9, 8, 9, shade);
      } else {                                                       // a shirt: sleeves, a collar, buttons or a stripe
        box(4, 4, 11, 13, body); box(1, 4, 3, 7, o.f); box(12, 4, 14, 7, o.f); box(5, 3, 10, 4, o.f); box(7, 3, 8, 3, null);
        box(11, 8, 11, 13, shade); box(4, 13, 11, 13, shade); box(1, 7, 3, 7, shade); box(12, 7, 14, 7, shade);
        if (o.stripe) { box(4, 7, 11, 7, o.stripe); box(4, 10, 11, 10, o.stripe); } else for (const y of [6, 9, 12]) put(7, y, o.g);
      }
    } else if (part === "pants") {
      line = o.a || mix(o.b, .5);
      if (SKIRT.includes(o.id)) { for (let y = 3; y <= 12; y++) { const w = 3 + Math.floor((y - 3) / 2.5); for (let x = 7 - w; x <= 8 + w; x++) put(x, y, y === 3 ? o.d : (x + 20) % 3 === 0 ? o.d : o.b); } }
      else { const end = o.id === "linen" ? 9 : 13;
        box(3, 3, 12, 5, o.b); box(3, 3, 12, 3, o.d); box(3, 6, 7, end, o.b); box(8, 6, 12, end, o.b); box(7, 8, 8, end, null);
        box(6, 8, 6, end, o.d); box(12, 6, 12, end, o.d); box(3, end, 5, end, o.d); box(9, end, 11, end, o.d); }
    } else if (part === "shoes") {
      line = o.a;
      if (LOW.includes(o.id)) { box(3, 8, 13, 11, o.m); box(3, 8, 5, 8, null); box(12, 8, 13, 8, null); box(3, 12, 13, 12, o.a); put(7, 9, "#fff6de"); put(9, 9, "#fff6de"); box(3, 9, 5, 9, mix(o.m, .25, [255, 255, 255])); }
      else { box(5, 3, 9, 9, o.m); box(5, 10, 13, 12, o.m); box(12, 10, 13, 10, null); box(4, 13, 13, 13, o.a); box(5, 3, 9, 3, mix(o.m, .3, [255, 255, 255])); box(9, 5, 9, 9, mix(o.m, .2)); box(10, 10, 11, 10, mix(o.m, .3, [255, 255, 255])); }
    } else {                                                         // an effect is worn as a charm: a gem on a loop of cord
      const c = GEM[o.id]; line = mix(c, .5);
      for (let y = 5; y <= 13; y++) for (let x = 3; x <= 12; x++) if (Math.abs(x - 7.5) + Math.abs(y - 9) <= 4.5) put(x, y, x + y < 15 ? mix(c, .35, [255, 255, 255]) : x + y > 18 ? mix(c, .22) : c);
      for (const [x, y] of [[6, 1], [7, 0], [8, 0], [9, 1], [6, 2], [9, 2], [7, 3], [8, 3]]) put(x, y, "#c9a27a");
    }
    const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);     // centre it in the 16 x 16 slot
    const dx = Math.round(7.5 - (Math.min(...xs) + Math.max(...xs)) / 2), dy = Math.round(7.5 - (Math.min(...ys) + Math.max(...ys)) / 2);
    const L = new Map(raw.filter(([x, y]) => x + dx >= 0 && x + dx < 16 && y + dy >= 0 && y + dy < 16).map(([x, y, c]) => [(y + dy) * 16 + x + dx, c]));
    for (const key of [...L.keys()]) for (const [nx, ny] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const x = key % 16 + nx, y = Math.floor(key / 16) + ny;
      if (x >= 0 && y >= 0 && x < 16 && y < 16 && !L.has(y * 16 + x)) L.set(y * 16 + x, null);
    }
    for (const [key, c] of L) if (c === null) L.set(key, line);
    return L;
  }
  const LISTS = {head: HEADS, top: TOPS, pants: PANTS, shoes: SHOES, effect: EFFECTS};
  const look = (name) => LISTS[WEAR[name][0]].find((o) => o.id === WEAR[name][1]);
  const icons = new Map();
  function icon(name) {                         // a fresh 16 x 16 canvas each time (the HUD keeps what it is given)
    if (!icons.has(name)) icons.set(name, itemIcon(WEAR[name][0], look(name)));
    const c = document.createElement("canvas"); c.width = c.height = 16;
    const g = c.getContext("2d");
    for (const [key, col] of icons.get(name)) { g.fillStyle = col; g.fillRect(key % 16, Math.floor(key / 16), 1, 1); }
    return c;
  }
  // The effect of a charm, drawn on a small stage and blown up with the player: phase "back" goes under them, "front" over.
  const STAGE = 64, OX = 8, OY = 14, stage = document.createElement("canvas");
  stage.width = stage.height = STAGE;
  function fx(phase, e, sheet, idx, x0, y0, z, now, walking, back) {      // (x0, y0): where the player's 48 x 48 cell is drawn
    const item = e.worn && e.worn.effect, fn = item && WEAR[item] && look(item)[phase];
    if (!fn) return;
    const s = stage.getContext("2d");
    s.clearRect(0, 0, STAGE, STAGE);
    fn(s, {t: now + e.id * 173, walking, back, fx: OX + 24, fy: OY + 32, top: OY + (sheet.tops ? sheet.tops[idx] : 16),
      edge: (sheet.edges ? sheet.edges[idx] : []).map(([x, y]) => [x + OX, y + OY])});
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(stage, Math.round(x0 - OX * z), Math.round(y0 - OY * z), STAGE * z, STAGE * z);
  }
  return {icon, fx};
})();
const wearIcon = WearItems.icon, wearFx = WearItems.fx;

// Crafting: all of it under one bookmark, clothes first, then armor, then charms (craft.js RECIPE_GROUPS).
const wearOf = (slots, pick = () => true) => Object.keys(WEAR).filter((n) => slots.includes(WEAR[n][0]) && pick(n));
const isArmor = (n) => /^(iron|gold|leather|moss)/.test(n);
RECIPE_GROUPS.find(([t]) => t === "Wear")[2].push(...wearOf(["head", "top", "pants", "shoes"], (n) => !isArmor(n)), ...wearOf(["head", "top", "pants", "shoes"], isArmor), ...wearOf(["effect"]));

// What you wear, beside the hotbar: click a piece to take it off.
const wearingEl = document.createElement("div");
wearingEl.id = "wearing";
wearingEl.style.cssText = "position:fixed; right:12px; bottom:64px; display:none; gap:4px; z-index:5";
document.body.appendChild(wearingEl);
setInterval(() => {
  const worn = typeof meObs !== "undefined" && meObs && meObs.self.wearing || {}, sig = JSON.stringify(worn);
  if (wearingEl.dataset.sig === sig) return;
  wearingEl.dataset.sig = sig;
  wearingEl.innerHTML = "";
  wearingEl.style.display = Object.keys(worn).length ? "flex" : "none";
  for (const slot of ["head", "top", "pants", "shoes", "effect"]) {
    if (!worn[slot]) continue;
    const d = document.createElement("div"); d.className = "slot"; d.dataset.slot = slot;
    d.appendChild(slotIcon(worn[slot]));
    d.insertAdjacentHTML("beforeend", `<span class="tip">${esc(label(worn[slot]))} · click to take off</span>`);
    d.onclick = () => act("unwear", {slot});
    wearingEl.appendChild(d);
  }
}, 250);
