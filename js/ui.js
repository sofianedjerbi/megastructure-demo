// HUD: item icons, hotbar, bag, mail, toasts. (Crafting: craft.js)

function groundPreview(g, x, y) {
  if (g === "_") return [IMG.cobble, 16, 16, 16, 16, 0, 0];
  if (g === "n") return [IMG.bridge, 0, 32, 16, 16, 0, 0];
  if (g === ":") return [IMG.bridge, 0, 32, 16, 16, 0, 0];
  return [IMG.soil, 16, 16, 16, 16, 0, 0];
}
const fulls = new Map();                         // an item's icon, kept (what lies on the ground is a smaller one: ghostIcon, loot.js)
const fullIcon = (n) => fulls.get(n) || (fulls.set(n, iconCanvas(n)), fulls.get(n));
const slotIcon = (n) => smallCanvas(n);          // what a slot shows: the small picture, as on the ground, at the land's pixel (--i)
function openCraft() { $("craft").style.display = "block"; craftOpened(); }
// item icons from the sheets: [image name, sx, sy]
const ICONS = {   // [sheet, x, y, w, h]: the items sheet has seed packets in column 0, produce in column 1, materials in 2-3
  wood: ["items", 32, 48], plank: ["items", 32, 64], stone: ["items", 32, 80], ingot: ["items", 48, 64], fiber: ["gen", "fiber"],
  ore: ["gen", "ore"], path: ["cobble", 16, 16], dirt: ["soil", 0, 80], seed: ["items", 0, 128],
  axe: ["items", 32, 0], pickaxe: ["gen", "pickaxe"], hoe: ["items", 48, 0], watering_can: ["items", 32, 16], spear: ["gen", "spear"], sword: ["gen", "sword"],
  torch: ["gen", "torch"], rope: ["gen", "rope"],
  berries: ["items", 32, 160], fruit: ["items", 32, 96], mushroom: ["nature", 16, 0], egg: ["items", 48, 176], milk: ["items", 64, 0],
  meat: ["gen", "meat"], cooked_meat: ["gen", "cooked_meat"], bread: ["gen", "bread"],
  wheat: ["items", 16, 128], pumpkin: ["items", 16, 144], cauliflower: ["items", 16, 48], lettuce: ["items", 16, 112],
  eggplant: ["items", 16, 80], carrot: ["items", 16, 32],
  flower: ["nature", 16, 48], workbench: ["gen", "workbench"], campfire: ["gen", "campfire0"], chest: ["chest", 16, 16],
  boat: ["boats", 8, 36, 32, 24], mailbox: ["mailbox", 0, 16, 16, 32], fence: ["fences", 0, 48], gate: ["gates", 0, 0], wood_wall: ["house_walls", 16, 32], stone_wall: ["gen", "stone_wall"], door: ["house_walls", 48, 32],
  sign: ["signs", 0, 0], flag: ["gen", "flag"], bed: ["furniture", 0, 16, 16, 32], chair: ["furniture", 64, 32],
  table: ["furniture", 48, 48], plant: ["furniture", 48, 0, 16, 32], clock: ["furniture", 96, 48], rug: ["furniture", 0, 80], well: ["well", 0, 0, 32, 32], coop: ["coop", 160, 80, 32, 44], picnic_blanket: ["blanket", 2, 8, 44, 32], basket: ["basket", 0, 0], trough: ["barn", 0, 0], hay: ["barn", 0, 16],
};
// An item's picture is 16 x 16 art pixels, and wherever it shows, an art pixel is a whole number of screen pixels:
// the land's own on the ground (zoom; loot.js), the frames' own in the HUD (--u: hudFit below). A thing bigger than a tile (a
// boat, a bed, a well) is made smaller by whole pixels, never squeezed: each n x n block becomes one pixel, of the
// colour most of it has (the darker of two as many: an outline holds). The px are worked out here and put once.
const smalls = new Map();
function smallArt(img, x, y, w, h, size = 16) {     // (size: how many px it may be across; 11 on the ground, loot.js)
  const src = document.createElement("canvas"); src.width = w; src.height = h;
  const sg = src.getContext("2d", {willReadFrequently: true}); sg.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = sg.getImageData(0, 0, w, h).data, at = (i, j) => (j * w + i) * 4;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;                    // what is drawn of it (a mailbox is 8 px of its cell: as it is)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[at(i, j) + 3] >= 128) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, n = Math.ceil(Math.max(bw, bh) / size), ow = Math.ceil(bw / n), oh = Math.ceil(bh / n), out = new ImageData(ow, oh);
  const dark = (c) => (c >> 16) * 3 + (c >> 8 & 255) * 6 + (c & 255);
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const seen = new Map(); let solid = 0, cells = 0;
    for (let b = 0; b < n && j * n + b < bh; b++) for (let a = 0; a < n && i * n + a < bw; a++) {
      const o = at(x0 + i * n + a, y0 + j * n + b); cells++;
      if (d[o + 3] < 128) continue;
      const c = d[o] << 16 | d[o + 1] << 8 | d[o + 2]; solid++; seen.set(c, (seen.get(c) || 0) + 1);
    }
    if (solid * 2 < cells) continue;
    let best = 0, votes = 0;
    for (const [c, v] of seen) if (v > votes || (v === votes && dark(c) < dark(best))) { best = c; votes = v; }
    out.data.set([best >> 16, best >> 8 & 255, best & 255, 255], (j * ow + i) * 4);
  }
  return out;
}
// The tools without the white edge the pack's icons have round them (a sticker's: a ring of white px, and the hole in
// the can's handle filled with it). A tool has no white of its own, so every near white px of it goes. In the bar,
// the book, the inventory and the hand they are then as the sword and the spear always were: no ring.
const BARE = new Set(["axe", "pickaxe", "hoe", "watering_can"]);
function bare(c) {
  const g = c.getContext("2d"), im = g.getImageData(0, 0, 16, 16), d = im.data;
  for (let o = 0; o < d.length; o += 4) if (Math.min(d[o], d[o + 1], d[o + 2]) > 225) d[o + 3] = 0;
  g.putImageData(im, 0, 0);
  return c;
}
function iconCanvas(name) {
  const c = document.createElement("canvas"); c.width = 16; c.height = 16; const g = c.getContext("2d", {willReadFrequently: BARE.has(name)});
  const ic = ICONS[name];
  if (!ic && WEAR[name]) return wearIcon(name);          // clothes and armor draw their own (wear_items.js)
  if (!ic) { g.fillStyle = "#8a6a55"; g.fillRect(4, 4, 8, 8); return c; }
  if (ic[0] === "gen") { g.drawImage(IMG.gen, GEN[ic[1]] * 16, 0, 16, 16, 0, 0, 16, 16); return BARE.has(name) ? bare(c) : c; }
  const [img, x, y, w = 16, h = 16] = ic;
  if (w <= 16 && h <= 16) { g.drawImage(IMG[img], x, y, w, h, (16 - w) >> 1, (16 - h) >> 1, w, h); return BARE.has(name) ? bare(c) : c; }
  if (!smalls.has(name)) smalls.set(name, smallArt(IMG[img], x, y, w, h));
  const small = smalls.get(name);
  g.putImageData(small, (16 - small.width) >> 1, (16 - small.height) >> 1);
  return c;
}
// The bar at the bottom is what you carry: ten slots, keys 1 to 9 and 0. (No button on it: I opens the inventory,
// C the crafting.) What is beyond ten kinds of thing is in the inventory.
const BAR = 10;
// The HUD's art pixels, each a whole number of screen pixels, so that all is cut on the screen's own grid: --u for
// a slot's frame (about 2 CSS px), --i for the item in it (the land's own pixel at the zoom the game starts with: 3,
// or 2 on a small phone, so an item looks in the bar as it does on the ground), --u3 for the crafting's big picture.
// The bar's (--u) is a screen pixel less, and again, while its ten slots would not fit across, or the HUD would take
// more than hudTall of the height (a phone: touch.js); the item's is no more than fits the frame. Nothing is scaled.
// --q is the recipe book's own (craft.js): everything in it is a number of them.
let hudU = 2, hudTall = 1, hudK = 2.5, hudSig = "";   // (hudK: CSS px an art pixel of the hearts and the food: 2.5, less where the two rows would not fit across)
function hudFit() {
  const d = window.devicePixelRatio || 1, st = document.documentElement.style, h = $("hud").offsetHeight, was = hudU;
  let n = Math.max(1, Math.round(2 * d));
  while (n > 1 && ((BAR * 32 - 2) * n / d > innerWidth - 16 || (h && h + 30 * (n / d - was) > innerHeight * hudTall))) n--;
  hudU = n / d; hudK = Math.min(2.5, Math.max(1, Math.floor((innerWidth - 34) * d / 198)) / d);   // (two rows of ten icons: 99 art px each)
  const small = document.body.classList.contains("touch") && Math.min(innerWidth, innerHeight) < 520, land = small ? 2 : 3;
  const item = Math.max(1, Math.min(Math.round(land * d), Math.floor(1.6 * n)));    // (11 px of it in a hole of 16: its edge px are empty)
  let book = Math.round(land * d) + (small ? 1 : 0);                                // the recipe book's pixel (--q): the land's (a screen pixel more under a thumb), less while its 272 x 160 would not fit
  while (book > 1 && (272 * book / d > innerWidth - 12 || 160 * book / d > innerHeight - 12)) book--;
  if (hudSig === (hudSig = [n, d, item, book].join())) return false;
  st.setProperty("--u", hudU + "px"); st.setProperty("--i", item / d + "px"); st.setProperty("--u3", Math.max(1, Math.round(3 * d)) / d + "px"); st.setProperty("--q", book / d + "px"); st.setProperty("--w", Math.max(1, Math.round(book * .7)) / d + "px");
  let bag = book; while (bag > 1 && (224 * bag / d > innerWidth - 12 || 162 * bag / d > innerHeight - 12)) bag--;       // (--b: the inventory's, bag.js)
  st.setProperty("--b", bag / d + "px");   // (--w: what Tab shows, who.js: a size under the book's)
  return hudU !== was;
}
hudFit(); addEventListener("resize", hudFit);
new ResizeObserver(() => document.documentElement.style.setProperty("--hudh", $("hud").offsetHeight + "px")).observe($("hud"));   // (the bag sits on it)
let slots = JSON.parse(localStorage.getItem("megastructure-slots") || "[]");
function slotOrder(inv) {               // items keep their slot; new items take the first free one
  slots = slots.map((n) => (n && inv[n] ? n : null));
  for (const n of Object.keys(inv)) if (!slots.includes(n)) { const i = slots.indexOf(null); if (i >= 0) slots[i] = n; else slots.push(n); }
  while (slots.length < BAR) slots.push(null);
  localStorage.setItem("megastructure-slots", JSON.stringify(slots));
  return slots;
}
function drawHotbar(inv) {
  const el = $("hotbar");
  if (selected && !inv[selected]) selected = null;
  const order = slotOrder(inv).slice(0, BAR);
  const extra = Object.keys(inv).filter((n) => !order.includes(n));
  const can = meObs ? meObs.self.can ?? CAN_SIZE : CAN_SIZE;
  const sig = JSON.stringify(inv) + order.join() + selected + can; if (el.dataset.sig === sig) return; el.dataset.sig = sig;
  el.innerHTML = "";
  order.forEach((name, i) => {
    const d = document.createElement("div"); d.className = "slot" + (name && name === selected ? " sel" : "");
    if (name) {
      d.appendChild(slotIcon(name));
      const how = WEAR[name] ? " · E to wear" : FOODS.includes(name) ? " · E to eat, or feed animals" : name === "watering_can" ? ` · ${can}/${CAN_SIZE} water · click a crop; refill at a well or water`
        : (PLACEABLE_BLOCK[name] || FILLS[name] || name === "seed") ? " · select, click the ground to place" : "";
      d.insertAdjacentHTML("beforeend", `<span class="c">${inv[name]}</span><span class="tip">${esc(label(name) + how)}</span>`);
      if (name === "watering_can") d.insertAdjacentHTML("beforeend", `<span class="lvl"><i style="width:${Math.round(can / CAN_SIZE * 100)}%"></i></span>`);
      d.onclick = () => { selected = selected === name ? null : name; el.dataset.sig = ""; drawHotbar(meObs.self.inventory); };
      d.ondblclick = () => useSelected(name);
    }
    d.insertAdjacentHTML("beforeend", `<span class="k">${(i + 1) % 10}</span>`);
    el.appendChild(d);
  });
  drawBag();                                         // (bag.js: the inventory, if it is open)
}
// Hearts and food sit on the hotbar, ten of each, halves allowed: a heart is a tenth of full health, a piece a tenth
// of full food (state.js: HP_MAX, FOOD_MAX; a part of a half shows as the half). Hearts are the UI pack's small hearts (full,
// half, empty); food is an apple drawn here in the hearts' own palette (plum outline, rose, glint, a leaf; empty is
// the bare outline colour, like an empty heart). Pixel-exact: every art pixel is a whole number of device pixels.
const HEART = [4, 84, 9, 8];                     // full; half and empty are the next 16 px cells along
const APPLE = ["....sg...", "...sgg...", ".aa.s.aa.", "abbabbbba", "abcbbbbba", "abbbbbbba", "abbbbbbda", ".abbbbda.", "..aaaaa.."];
const APPLE_COL = {a: "#664165", b: "#c87c86", c: "#e8b5ac", d: "#a8606e", s: "#7a5236", g: "#7fae5a"};
function pixelCanvas(cv, w, h, k = hudK) {       // sizes a canvas for art w x h at about k CSS px an art pixel
  const SC = Math.max(1, Math.round(k * (window.devicePixelRatio || 1)));
  if (cv.width !== w * SC || cv.height !== h * SC) {
    cv.width = w * SC; cv.height = h * SC;
    cv.style.width = w * SC / (window.devicePixelRatio || 1) + "px"; cv.style.height = h * SC / (window.devicePixelRatio || 1) + "px";
  }
  const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
  return [g, SC];
}
function drawIcons(cv, icon, value, gain = 0) {   // gain: food points to preview (what eating would give back)
  const N = 10, hearts = icon === "heart", iw = hearts ? HEART[2] : APPLE[0].length, ih = hearts ? HEART[3] : APPLE.length;
  const one = (hearts ? HP_MAX : FOOD_MAX) / N;                // what an icon is worth
  value = Math.ceil(value / (one / 2) - 1e-9) * (one / 2);
  const step = iw + 1, sig = [icon, value, gain, window.devicePixelRatio || 1, hudK].join();
  if (cv.dataset.sig === sig) return;
  cv.dataset.sig = sig;
  const [g, SC] = pixelCanvas(cv, step * (N - 1) + iw, 9);
  for (let i = 0; i < N; i++) {
    const x = i * step, full = value >= (i + 1) * one, half = !full && value >= i * one + one / 2, top = 9 - ih;
    if (hearts) {
      g.drawImage(IMG.hearts, (full ? 0 : half ? 1 : 2) * 16 + HEART[0], HEART[1], iw, ih, x * SC, top * SC, iw * SC, ih * SC);
      continue;
    }
    const after = value + gain, fullA = after >= (i + 1) * one, halfA = !fullA && after >= i * one + one / 2;
    APPLE.forEach((row, j) => [...row].forEach((c, k) => {
      if (c === ".") return;
      const lit = full || (half && k < 5), soon = !lit && (fullA || (halfA && k < 5));
      g.fillStyle = lit ? APPLE_COL[c] : APPLE_COL.a;
      g.fillRect((x + k) * SC, (top + j) * SC, SC, SC);
      if (soon) { g.globalAlpha = .55; g.fillStyle = APPLE_COL[c]; g.fillRect((x + k) * SC, (top + j) * SC, SC, SC); g.globalAlpha = 1; }
    }));
  }
  cv.classList.toggle("low", value <= one * 2.5);
}
// Holding food: the apples it would give back blink on the bar (every frame, from render; redrawn only on change).
function foodPreview() {
  if (!meObs) return;
  const h = meObs.self.hunger, gain = selected && foodValue[selected] && h < FOOD_MAX ? foodValue[selected] : 0;
  drawIcons($("foods"), "food", h, gain && Math.floor(performance.now() / 450) % 2 === 0 ? gain : 0);
}
function drawVitals(s) {
  drawIcons($("hearts"), "heart", s.hp);
  foodPreview();
  const status = s.hunger <= 0 || (SPRINT_FOOD < 0 && s.hunger < 25) ? "Starving: eat something (E)" : s.hunger <= SPRINT_FOOD ? "Too hungry to sprint: eat something (E)" : "";
  if (walking && walking.run !== sprinting()) syncWalk();          // (fed again, or not enough any more: the sprint follows)
  $("status").textContent = status; $("status").style.display = status ? "block" : "none";
}
// what animals eat: what grows (no eggs, meat or milk), and hay (tiles.FEED)
const FEEDS = ["pumpkin", "cauliflower", "lettuce", "eggplant", "carrot", "fruit", "berries", "mushroom", "wheat", "bread", "hay"];
const FOODS = ["pumpkin", "cauliflower", "lettuce", "eggplant", "carrot", "fruit", "berries", "mushroom", "egg", "milk", "meat", "cooked_meat", "wheat", "bread"];
function useSelected(name = selected) {
  if (!name) return toast("Nothing selected.", true);
  if (FOODS.includes(name)) return act("eat", {item: name});
  if (WEAR[name]) return act("wear", {item: name});
  toast(`Face a tile and press Space (or click it) to use the ${label(name)}.`);
}
let mailAtTile = null;   // the mailbox the panel is open on (posting and taking aim at it exactly)
function openMailPanel(p) {
  mailAtTile = p ? {x: p.x, y: p.y} : null; $("mail").style.display = "block"; $("letters").innerHTML = `<span style="color:var(--ink2)">Write a letter, or take the letters out.</span>`;
  $("mailtitle").textContent = "Mailbox"; setTimeout(() => $("letter").focus(), 50);
}
async function postLetter() {
  const text = $("letter").value.trim(); if (!text || !mailAtTile) return;
  const r = await act("post", {...mailAtTile, text});
  if (r && r.ok) { $("letter").value = ""; toast(r.result.owner ? `Letter posted for ${r.result.owner}.` : "Letter posted."); }
}
async function takeLetters() {
  if (!mailAtTile) return;
  const r = await act("open_mail", {...mailAtTile}); if (!r || !r.ok) return;
  const {owner, letters} = r.result;
  $("mailtitle").textContent = owner ? `Mailbox of ${owner}` : "Mailbox";
  $("letters").innerHTML = letters.length ? letters.map((l) => `<div class="letter"><div class="from">from ${esc(l.from)}</div>${esc(l.text)}</div>`).join("")
    : `<span style="color:var(--ink2)">It's empty.</span>`;
}
let bannerTimer;
function banner(title, text) {
  $("bannert").textContent = title; $("bannerd").textContent = text; $("banner").style.display = "block";
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $("banner").style.display = "none", 7000);
}
let toastTimer;
function toast(msg, bad) {
  if (bad) sfx("buzz"); $("toastt").textContent = msg; const t = $("toast"); t.style.display = "block"; $("toastt").style.color = bad ? "var(--warn)" : "var(--ink)"; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.display = "none", 3200); }


const isOpen = (id) => $(id).style.display === "block";
