const OPT_DEFAULT = {
master: 100, music: 100, steps: 100, work: 100, fights: 100, animals: 100, world: 100, voices: 100, ui: 100,
often: "normal",
sharp: "auto",
above: "cut",
night: 0,
particles: "all",
shake: true,
glide: true,
shimmer: true,
curve: "far",
floats: true,
clearwater: true,
depth: true,
shadows: 100, shadowlen: 100,
bubbles: true, names: true, chat: 10, hints: true, tips: true,
sprint: "hold",
keys: {},
};
const OPT = {v: {...OPT_DEFAULT}};
try { Object.assign(OPT.v, JSON.parse(localStorage.getItem("megastructure-options") || "{}")); } catch (e) {  }
for (const k of Object.keys(OPT.v)) if (!(k in OPT_DEFAULT) || typeof OPT.v[k] !== typeof OPT_DEFAULT[k]) { if (k in OPT_DEFAULT) OPT.v[k] = OPT_DEFAULT[k]; else delete OPT.v[k]; }
const opt = (k) => OPT.v[k];
function setOpt(k, v) {
OPT.v[k] = v;
const changed = Object.fromEntries(Object.entries(OPT.v).filter(([key, val]) => JSON.stringify(val) !== JSON.stringify(OPT_DEFAULT[key])));
localStorage.setItem("megastructure-options", JSON.stringify(changed));
optApply(k);
}
function optApply(k) {
if (typeof soundLevels === "function") soundLevels();
if (k === "sharp" && typeof resize === "function") resize();
document.body.classList.toggle("nohints", !opt("hints"));
document.body.classList.toggle("notips", !opt("tips"));
}
addEventListener("DOMContentLoaded", () => optApply());
const VIEWS = [{key: "cut", name: "Cut away"}, {key: "faded", name: "Faded"}];
function nextView() {
const i = VIEWS.findIndex((v) => v.key === opt("above")), v = VIEWS[(i + 1) % VIEWS.length];
setOpt("above", v.key);
toast(`What is built over you: **${v.name}** \`V\``);
}
const SOUND_OPT = {Footsteps: "steps", Work: "work", Breaking: "work", Building: "work", Fights: "fights", Boss: "fights", Animals: "animals",
World: "world", Items: "world", Progress: "world", People: "voices", Interface: "ui"};
const soundShare = (family) => (SOUND_OPT[family] ? opt(SOUND_OPT[family]) / 100 : 1);
const particles = (n) => (opt("particles") === "none" ? 0 : opt("particles") === "fewer" ? Math.ceil(n / 3) : n);
const KEY_ACTIONS = {use: [" ", "Use what you face"], alt: ["x", "Other use"], jump: ["j", "Jump"], pick: ["f", "Pick up"], eat: ["e", "Eat or wear"], next: ["q", "Next thing in hand"],
hands: ["`", "Empty your hands"], craft: ["c", "Craft"], bag: ["i", "Inventory"], build: ["z", "Build mode"], up: ["r", "Dig up"], talk: ["t", "Talk"], mute: ["m", "Sound on or off"]};
const KEY_FIXED = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "tab", "enter", "escape", "control", "alt", "meta", "capslock",
"h", "?", "g", "v", "f3", "/", "+", "=", "-", "_", ..."0123456789"]);
const keyOf = (action) => opt("keys")[action] || KEY_ACTIONS[action][0];
function usualKey(k) {
for (const a of Object.keys(KEY_ACTIONS)) if (keyOf(a) === k) return KEY_ACTIONS[a][0];
return Object.values(KEY_ACTIONS).some(([d]) => d === k) ? "" : k;
}
function bindKey(action, k) {
if (KEY_FIXED.has(k) || k.length > 1 && !/^f\d+$/.test(k)) return false;
const keys = {...opt("keys")}, other = Object.keys(KEY_ACTIONS).find((a) => a !== action && keyOf(a) === k);
if (other) keys[other] = keyOf(action);
keys[action] = k;
for (const a of Object.keys(keys)) if (keys[a] === KEY_ACTIONS[a][0]) delete keys[a];
setOpt("keys", keys);
return true;
}
const keyCap = (k) => (k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k[0].toUpperCase() + k.slice(1));
const capOf = (action) => keyCap(keyOf(action));
;
"use strict";
const CH = {
"~": "water", ":": "bridge", ".": "grass", ",": "dirt", "o": "tilled", "_": "cobble", "'": "ash", "=": "deep_water",
"T": "tree", "b": "berry_bush", "M": "rock", "*": "ore", "H": "thicket", "Q": "mushroom", "#": "fence",
"%": "stone_wall", "+": "door", "^": "campfire", "&": "workbench", "?": "sign", "!": "flag", "x": "fire",
"\"": "crop", "w": "ripe_crop", "t": "stump", "C": "chest", "F": "fruit_tree", ";": "sprout",
"u": "wet_tilled", "n": "floor", "f": "flower", "B": "bed", "h": "chair", "L": "table", "p": "plant", "K": "clock",
"r": "rug", "g": "gate", "W": "wood_wall", "V": "boat", "X": "mailbox",
"Y": "well", "J": "coop", "m": "picnic_blanket", "q": "basket", "Z": "part", "z": "flat_part", "e": "trough", "y": "hay_bale", "U": "bare_fruit_tree", "v": "bare_bush",
"-": "cave_floor", "R": "cave_wall", "O": "hole", "l": "ladder", "(": "mid_water", ")": "abyss",
};
const FOOT = {Y: [2, 2], J: [2, 2], m: [3, 2]};
function footprint(c, x, y, px, py) {
const [w, h] = FOOT[c];
let x0 = x - ((w - 1) >> 1);
if (px === x - 1 && py === y) x0 = x; else if (px === x + 1 && py === y) x0 = x - w + 1;
const ay = px === x && py === y - 1 ? y + h - 1 : y;
return {ax: x0, ay, tiles: footOf(c, x0, ay)};
}
function footOf(c, ax, ay) { const [w, h] = FOOT[c], tiles = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) tiles.push({x: ax + i, y: ay - j}); return tiles; }
function structAt(x, y) {
for (const [c, [w, h]] of Object.entries(FOOT)) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++)
if (combAt(x - i, y + j) === c) return {x: x - i, y: y + j, c};
return null;
}
const CHAR = Object.fromEntries(Object.entries(CH).map(([c, n]) => [n, c]));
const GROUND = new Set("~:.,o_'=un-()");
const DEPTH_OF = {"~": 1, "(": 2, "=": 3, ")": 4};
const wet = (g) => g in DEPTH_OF;
const SOLID = new Set("TFbM*H#%^&CBhLpKWXYJqZeyUvtR");
const WALKABLE_GROUND = new Set(":.,o_'un-");
const LABEL = {name_tag: "name tag", wood_wall: "wooden wall", wet_tilled: "watered soil", watering_can: "watering can", fruit_tree: "fruit tree", berry_bush: "berry bush", stone_wall: "stone wall", ripe_crop: "ripe wheat", crop: "young wheat",
cooked_meat: "cooked meat", deep_water: "deep water", mid_water: "deeper water", abyss: "the deep", picnic_blanket: "picnic blanket", hay_bale: "hay bale"};
LABEL.stone_block = "stone block";
const LAND_BLOCKS = new Set(["dirt", "stone_block"]);
const label = (n) => LABEL[n] || String(n).replace("_", " ");
;
const ToolArt = (() => {
const CELL = 48, AXE_ROW = 16, KINDS = ["pickaxe", "sword", "spear"];
const HEAD = new Set(["129,129,129", "183,183,183"]), HANDLE = new Set(["170,121,89", "144,98,93"]);
const C = {wood: [170, 121, 89], dark: [144, 98, 93], iron: [129, 129, 129], steel: [183, 183, 183], edge: [158, 170, 182], blade: [226, 232, 236], gold: [222, 178, 86]};
const pad = document.createElement("canvas"); pad.width = pad.height = CELL * 8;
function redraw(d, kind) {
const key = (i) => d[i * 4 + 3] ? d[i * 4] + "," + d[i * 4 + 1] + "," + d[i * 4 + 2] : null;
const head = [], handle = [];
for (let i = 0; i < CELL * CELL; i++) { const k = key(i); if (HEAD.has(k)) head.push(i); else if (HANDLE.has(k)) handle.push(i); }
if (!head.length) return;
const xy = (i) => [i % CELL, Math.floor(i / CELL)], mean = (list) => { let x = 0, y = 0; for (const i of list) { x += i % CELL; y += Math.floor(i / CELL); } return [x / list.length, y / list.length]; };
const ch = mean(head), cn = handle.length ? mean(handle) : null;
let ux, uy;
if (cn && Math.hypot(ch[0] - cn[0], ch[1] - cn[1]) > .8) { ux = ch[0] - cn[0]; uy = ch[1] - cn[1]; }
else { let bx = 0, by = 0, n = 0;
for (let i = 0; i < CELL * CELL; i++) if (d[i * 4 + 3] && !HEAD.has(key(i)) && !HANDLE.has(key(i))) { bx += i % CELL; by += Math.floor(i / CELL); n++; }
ux = ch[0] - bx / n; uy = ch[1] - by / n; }
const len = Math.hypot(ux, uy) || 1; ux /= len; uy /= len;
const vx = -uy, vy = ux, along = (i) => (i % CELL) * ux + Math.floor(i / CELL) * uy;
const all = handle.concat(head), first = all.reduce((a, b) => along(a) <= along(b) ? a : b), last = all.reduce((a, b) => along(a) >= along(b) ? a : b);
const grip = handle.length ? xy(handle.reduce((a, b) => along(a) <= along(b) ? a : b)) : xy(first);
const reach = along(last) - (grip[0] * ux + grip[1] * uy);
const was = new Uint8Array(CELL * CELL);
for (const i of all) was[i] = 1;
const UP = 8, big = pad.getContext("2d", {willReadFrequently: true});
big.setTransform(1, 0, 0, 1, 0, 0); big.clearRect(0, 0, CELL * UP, CELL * UP);
big.setTransform(UP * ux, UP * uy, UP * vx, UP * vy, UP * (grip[0] + .5 - ux * .5), UP * (grip[1] + .5 - uy * .5));
const box = (x0, x1, y0, y1, c) => { big.fillStyle = `rgb(${c})`; big.fillRect(x0, y0, x1 - x0, y1 - y0); };
const shape = (pts, c) => { big.fillStyle = `rgb(${c})`; big.beginPath(); pts.forEach(([x, y], i) => i ? big.lineTo(x, y) : big.moveTo(x, y)); big.closePath(); big.fill(); };
if (kind === "pickaxe") {
for (const i of head) d[i * 4 + 3] = 0;
const k = Math.max(reach - 1, 3.5);
shape([[k - 2.2, -4.8], [k - .1, -2.7], [k + 1.1, -1], [k + 1.1, 1], [k - .1, 2.7], [k - 2.2, 4.8], [k - 2.9, 3.5], [k - 1.6, 1.7], [k - 1.1, 0], [k - 1.6, -1.7], [k - 2.9, -3.5]], C.iron);
shape([[k - 2.2, -4.8], [k - 1, -3.5], [k - 2, -2.7], [k - 2.9, -3.5]], C.steel);
shape([[k - 2.2, 4.8], [k - 1, 3.5], [k - 2, 2.7], [k - 2.9, 3.5]], C.steel);
} else if (kind === "sword") {
for (const i of all) d[i * 4 + 3] = 0;
const tip = Math.max(reach + 2.5, 9);
box(0, 2, -.6, .6, C.dark);
shape([[2.9, -1], [tip - 1.6, -1], [tip, 0], [tip - 1.6, 1], [2.9, 1]], C.blade);
shape([[2.9, .1], [tip - 1.6, .1], [tip - .8, .5], [tip - 1.6, 1], [2.9, 1]], C.edge);
box(1.9, 2.9, -2.2, 2.2, C.gold);
} else {
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
const i = y * CELL + x; if (d[i * 4 + 3] && !was[i]) continue;
const c = PAL[votes.indexOf(Math.max(...votes))];
d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; was[i] = 2;
}
for (let pass = 0; pass < 2; pass++) for (const i of all) {
if (was[i] === 2 || d[i * 4 + 3]) continue;
const x = i % CELL, y = Math.floor(i / CELL), seen = {}; let n = 0, best = null;
for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * CELL + x + dx;
if ((dx || dy) && x + dx >= 0 && x + dx < CELL && y + dy >= 0 && y + dy < CELL && d[j * 4 + 3] && was[j] !== 2) { n++; const k = key(j); seen[k] = (seen[k] || 0) + 1; if (!best || seen[k] > seen[best]) best = k; } }
if (n >= 5) { const c = best.split(",").map(Number); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
}
}
function extend(img) {
const W = img.width, H = img.height, c = document.createElement("canvas");
c.width = W; c.height = H + KINDS.length * 4 * CELL;
const g = c.getContext("2d"); g.drawImage(img, 0, 0);
const axe = document.createElement("canvas"); axe.width = W; axe.height = 4 * CELL;
const ag = axe.getContext("2d", {willReadFrequently: true}); ag.drawImage(img, 0, AXE_ROW * CELL, W, 4 * CELL, 0, 0, W, 4 * CELL);
const src = ag.getImageData(0, 0, W, 4 * CELL).data;
KINDS.forEach((kind, n) => {
for (let r = 0; r < 4; r++) for (let col = 0; col < W / CELL; col++) {
const f = new ImageData(CELL, CELL);
for (let y = 0; y < CELL; y++) f.data.set(src.subarray(((r * CELL + y) * W + col * CELL) * 4, ((r * CELL + y) * W + (col + 1) * CELL) * 4), y * CELL * 4);
redraw(f.data, kind);
g.putImageData(f, col * CELL, H + (n * 4 + r) * CELL);
}
});
c.complete = true; c.src = img.src;
return c;
}
return {extend, KINDS, redraw};
})();
;
const IMG = {};
const ANIMAL_SHEETS = ["chicken_brown", "chicken_red", "chicken_blue", "chicken_green", "cow_light", "cow_pink", "cow_purple", "cow_green",
"chick", "chick_brown", "chick_red", "chick_blue", "chick_green", "calf", "calf_light", "calf_pink", "calf_purple", "calf_green"];
const ASSETS = [...ANIMAL_SHEETS, "thin_fall", "stump_thin", "fruit_bare", "barn", "well", "coop", "blanket", "basket", "mailbox", "boats", "deep_mask", "house_walls", "house_roof", "gates", "bridge", "furniture", "tilled_wet", "tree_apple", "tree_pear", "tree_peach", "tree_orange", "water_objects", "emoji", "hearts", "sliders", "hill1", "hill2", "hill3", "tree_anim", "tree_fall", "water", "water_deep", "soil", "grass", "tilled", "ash", "stone", "hedge", "cobble", "planks", "fences", "chest",
"door", "trees", "nature", "workbench", "signs", "crops", "items", "character", "chicken", "cow", "gen", "tusker", "pincer", "strawman", "wisp", "wyrm", "mossback", "sporeling"];
let GEN = {};
const SHEET_PACK = window.ASSET_PACK ? ASSET_PACK.blob : Promise.resolve(null);
const fromPack = (name, type) => SHEET_PACK.then((b) => { const at = b && ASSET_PACK.files[name]; return at ? b.slice(at[0], at[0] + at[1], type) : null; });
function loadImg(n) {
return new Promise((res, rej) => { const i = new Image(); i.onload = () => i.decode().catch(() => {}).then(() => { if (n === "character") IMG[n] = ToolArt.extend(i); res(i); }); i.onerror = rej;
if (window.ASSET_PACK) fromPack(n + ".png", "image/png").then((b) => { i.src = b ? URL.createObjectURL(b) : `assets/${n}.png`; }); else i.src = `assets/${n}.png`;
if (n !== "character") IMG[n] = i; });
}
const ready = Promise.all([...ASSETS.map(loadImg),
fromPack("gen.txt", "text/plain").then((b) => b ? b.text() : fetch("assets/gen.txt").then((r) => r.text())).then((t) => t.trim().split("\n").forEach((n, i) => GEN[n] = i)),
document.fonts.load("18px SproutPixel")]);
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
if (!hit) {
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
;
const SwingArt = (() => {
const CELL = 48, SS = 4, CX = 23.5, CY = 26;
const C = {wood: [170, 121, 89], dark: [144, 98, 93], iron: [129, 129, 129], steel: [183, 183, 183], edge: [158, 170, 182],
blade: [226, 232, 236], gold: [222, 178, 86], streak: [243, 244, 231]};
const FACE = [90, -90, 0];
const SLASH = {at: [-120, -75, 20, 85, 100, 100, 70, 40], streak: [null, null, [-115, 20, 2.6], [-70, 85, 2.6], [5, 100, 1.3], null, null, null]};
const SIDE = {at: [-125, -95, -20, 28, 36, 36, 22, 10], streak: [null, null, [-120, -20, 2.6], [-90, 28, 2.6], [-30, 36, 1.3], null, null, null]};
const THRUST = {out: [-3, -5, 2, 6, 6, 5, 2, 0], streak: [0, 0, 6, 9, 4, 0, 0, 0]};
const STEP = {sword: [-1, -1, 1, 2, 2, 2, 1, 0], spear: [-1, -1, 1, 3, 3, 2, 1, 0]};
const REACH = 6, SWORD = 11.5;
const rad = (a) => a * Math.PI / 180;
const inside = (pts, x, y) => {
let sign = 0;
for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
if (c) { if (sign && Math.sign(c) !== sign) return false; sign = Math.sign(c); } }
return true;
};
const box = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
function frame(kind, row, f, hand) {
const d = new Uint8ClampedArray(CELL * CELL * 4), flip = row === 3, phi = FACE[flip ? 2 : row];
let gx, gy, ang, shapes, streak = () => false;
if (kind === "sword") {
const S = row >= 2 ? SIDE : SLASH, turn = row >= 2 ? 1 : -1, a = rad(phi + turn * S.at[f]);
ang = a; gx = CX + Math.cos(a) * REACH; gy = CY + Math.sin(a) * REACH;
const tip = SWORD;
shapes = [[box(1.9, 3.1, -2.6, 2.6), C.gold], [[[3.1, .3], [tip - 2, .3], [tip - 1, .7], [tip - 2, 1.4], [3.1, 1.4]], C.edge],
[[[3.1, -1.4], [tip - 2, -1.4], [tip, 0], [tip - 2, 1.4], [3.1, 1.4]], C.blade], [box(-1, 2, -.7, .7), C.dark]];
const s = S.streak[f];
if (s) streak = (x, y) => {
const r = Math.hypot(x - CX, y - CY); let t = (Math.atan2(y - CY, x - CX) * 180 / Math.PI - phi) * turn;
t = ((t + 180) % 360 + 360) % 360 - 180;
if (f < 4 && t > 60 && s[0] < -100) t -= 360;
const k = (t - s[0]) / (s[1] - s[0]); if (k < 0 || k > 1) return false;
const out = REACH + SWORD - .5; return r <= out && r >= out - s[2] * Math.pow(k, .75);
};
} else {
const a = rad(phi), side = row >= 2 ? [0, 1.5] : row === 0 ? [-7, 0] : [7, 0], near = row >= 2 ? 3 : 1, out = THRUST.out[f];
ang = a; gx = CX + side[0] + Math.cos(a) * (near + out); gy = CY + side[1] + Math.sin(a) * (near + out);
const tip = 14, n = THRUST.streak[f];
shapes = [[[[tip - 6, 0], [tip - 4.2, -2.5], [tip, 0]], C.steel], [[[tip - 6, 0], [tip, 0], [tip - 4.2, 2.5]], C.iron]];
if (n) shapes.push([[[tip - 5.5, -1.6], [tip - 5.5, 1.6], [tip - 5.5 - n, 0]], C.streak]);
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
const hx = Math.round(gx - 2), hy = Math.round(gy - 2);
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
const rim = x % 3 === 0 || y % 3 === 0; if (rim && x % 3 === 0 && y % 3 === 0) continue;
const c = rim ? hand[0] : x === 1 ? hand[1] : hand[2], X = hx + x, i = ((flip ? CELL - 1 - X : X) + (hy + y) * CELL) * 4;
d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
}
return d;
}
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
;
const B = 32, P = 16;
const smooth = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const blocks = new Map();
const bkey = (bx, by) => bx + "," + by;
let hitB = null, hitX = NaN, hitY = NaN;
for (const m of ["set", "delete", "clear"]) { const o = blocks[m].bind(blocks); blocks[m] = (...a) => { hitX = NaN; return o(...a); }; }
function blockOf(x, y) {
const bx = Math.floor(x / B), by = Math.floor(y / B);
if (bx !== hitX || by !== hitY) { hitX = bx; hitY = by; hitB = blocks.get(bkey(bx, by)) || null; }
return hitB;
}
function tile(x, y) {
const b = blockOf(x, y);
if (!b) return null;
const i = (y - b.by * B) * B + (x - b.bx * B);
return [b.comb[i], b.gnd[i]];
}
const combAt = (x, y) => { const t = tile(x, y); return t ? t[0] : null; };
const gndAt = (x, y) => { const t = tile(x, y); return t ? t[1] : null; };
const dirtyTiles = [];
function touch(x, y) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) dirtyTiles.push(x + dx, y + dy); }
const PICK = {F: "U", b: "v"};
function setTile(x, y, comb, gnd, who = null, col = null, mat = null) {
const bx = Math.floor(x / B), by = Math.floor(y / B), b = blocks.get(bkey(bx, by));
if (!b) return;
b.edits = (b.edits || 0) + 1;
const i = (y - by * B) * B + (x - bx * B);
const relief = col !== null && !colSame(col, colAt(x, y));
if (mat !== null) { if (mat) (b.mat || (b.mat = {}))[i] = mat; else if (b.mat) delete b.mat[i]; }
if (b.comb[i] === comb && b.gnd[i] === gnd && !relief) return;
if (relief) {
b.lv[i] = String.fromCharCode(SEA + colFloor(col));
if (col.length > 1) (b.col || (b.col = {}))[i] = col; else if (b.col) delete b.col[i];
for (let d = -2; d <= 2; d++) touch(x + d, y);
}
const old = b.comb[i], now = performance.now();
if (PICK[old] === comb) picked(x, y, old, who, now);
else if (old === "T" && comb !== "T") felled(x, y, who, now);
else if (old !== comb && isObject(comb) && comb !== "x" && PICK[old] !== comb) pops.set(x + "," + y, now);
const spr = old !== comb && old !== "T" && PICK[old] !== comb && isObject(old) && !isObject(comb) ? objectSprite(old, x, y, now / 1000) : null;
if (spr && PLUCKED.includes(old)) plucked(x, y, spr, who, now);
else if (spr) {
shatter(x, y, spr);
if ("M*%Y^".includes(old)) smoke(x, y + .25, 3, .3);
} else if (old !== comb && !GROUND.has(old) && old !== "Z" && old !== "z") burst(x, y, old, 10);
if (gnd === "o" && b.gnd[i] !== "o") debris(x, y, null, 6, {kind: "o", dust: true});
b.comb[i] = comb; b.gnd[i] = gnd;
b.objs.delete(i); if (isObject(comb)) b.objs.set(i, comb);
touch(x, y);
}
function onRegion(d) {
if (d.w !== B || d.h !== B || d.x % B || d.y % B) return;
const bx = d.x / B, by = d.y / B, k = bkey(bx, by);
const comb = [], gnd = [], lv = [], col = d.cols || null;
for (const i in col) col[i] = colIn(col[i]);
const from = d.sea || 64;
for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) { comb.push(d.rows[j][i]); gnd.push(d.ground[j][i]); lv.push(String.fromCharCode(d.levels ? d.levels[j].charCodeAt(i) - from + SEA : SEA)); }
requested.delete(k);
const old = blocks.get(k);
if (old && old.drawn) {
for (let i = 0; i < B * B; i++) {
const c = col && col[i] !== undefined ? col[i] : colSolid(lv[i].charCodeAt(0) - SEA);
if (old.comb[i] === comb[i] && old.gnd[i] === gnd[i] && colSame(c, colAt(bx * B + i % B, by * B + (i / B | 0)))) continue;
setTile(bx * B + i % B, by * B + (i / B | 0), comb[i], gnd[i], null, c, (d.mats && d.mats[i]) || "");
}
Floors.load(old, d);
old.at = performance.now(); return;
}
const b = {bx, by, comb, gnd, lv, col, mat: d.mats || null, objs: new Map(), drawn: false, canvas: null, at: performance.now()};
Floors.load(b, d);
comb.forEach((c, i) => { if (isObject(c)) b.objs.set(i, c); });
blocks.set(k, b);
for (let i = 0; i < B; i++) { dirtyTiles.push(bx * B - 1, by * B + i, bx * B + B, by * B + i, bx * B + i, by * B - 1, bx * B + i, by * B + B); }
}
const isLand = (g) => g !== null && !wet(g) && g !== ":";
const isObject = (c) => "TFbM*#%+^&?!x\"wtCQ;fBhLpKrgWVXYJmqeyUvl".includes(c) && !GROUND.has(c);
const AROUND = [0, -1, N_, 1, 0, E_, 0, 1, S_, -1, 0, W_, 1, -1, NE, 1, 1, SE, -1, 1, SW, -1, -1, NW];
function maskOf(x, y, pred) {
let m = 0;
for (let k = 0; k < 24; k += 3) {
const nx = x + AROUND[k], ny = y + AROUND[k + 1], b = blockOf(nx, ny), i = b ? (ny - b.by * B) * B + (nx - b.bx * B) : 0;
if (!b || pred(b.comb[i], b.gnd[i], nx, ny)) m |= AROUND[k + 2];
}
return m;
}
function hash(x, y, s = 0) {
let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s, 2246822519)) >>> 0;
h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function drawBlobLayer(g, sheet, x, y, pred, ox, oy, decor) {
const m = maskOf(x, y, pred), [cx, cy] = blobCell(m);
let sx = cx * 16, sy = cy * 16;
if (decor && reduce(m) === 255 && hash(x, y, 3) < decor) {
sx = Math.floor((decor > .3 && sheet !== IMG.grass ? hash(x, y, 4) ** 3 : hash(x, y, 4)) * (sheet === IMG.grass ? 6 : 5)) * 16; sy = (5 + (hash(x, y, 5) < .5 ? 0 : 1)) * 16;
}
g.drawImage(sheet, sx, sy, 16, 16, ox, oy, 16, 16);
}
const BW = B * 16, sheetPx = new Map();
function sheetData(sheet) {
let m = sheetPx.get(sheet);
if (!m) {
const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(sheet, 0, 0);
m = {px: new Uint32Array(g.getImageData(0, 0, c.width, c.height).data.buffer), w: c.width, solid: new Map()}; sheetPx.set(sheet, m);
}
return m;
}
function cellSolid(sheet, sx, sy) {
const m = sheetData(sheet), key = sy * 4096 + sx; let v = m.solid.get(key);
if (v === undefined) {
v = true;
for (let j = 0; j < 16 && v; j++) for (let i = 0; i < 16; i++) if (m.px[(sy + j) * m.w + sx + i] >>> 24 !== 255) { v = false; break; }
m.solid.set(key, v);
}
return v;
}
function pxOver(s, d) {
const sa = (s >>> 24) / 255, da = (d >>> 24) / 255 * (1 - sa), a = sa + da;
const ch = (k) => Math.round(((s >>> k & 255) * sa + (d >>> k & 255) * da) / a);
return (Math.round(a * 255) << 24 | ch(16) << 16 | ch(8) << 8 | ch(0)) >>> 0;
}
function layCell(to, o, W, sheet, sx, sy, solid) {
const m = sheetData(sheet);
for (let j = 0, s = sy * m.w + sx; j < 16; j++, s += m.w, o += W) {
if (solid) { to.set(m.px.subarray(s, s + 16), o); continue; }
for (let i = 0; i < 16; i++) { const v = m.px[s + i], a = v >>> 24; if (a === 255) to[o + i] = v; else if (a) to[o + i] = pxOver(v, to[o + i]); }
}
}
const LAID = {n: 0, img: [], at: [], drawImage(img, sx, sy) { this.img[this.n] = img; this.at[this.n++] = sy * 4096 + sx; }};
let landVer = 0;
function drawTile(x, y, to = null) {
const b = blockOf(x, y);
if (!b || !(to || b.px)) return;
if (!to) { b.ver = (b.ver || 0) + 1; landVer++; return; }
const lx = x - b.bx * B, ly = y - b.by * B, i = ly * B + lx, ox = to.ox, oy = to.oy;
const c = b.comb[i], gr = b.gnd[i], g = LAID, lv = levelAt(x, y), up = (cc, gg, tx, ty) => maskOf.plain || levelAt(tx, ty) >= k,       dug = lv < 0 && !wet(gr);
let k = lv;
g.n = 0;
for (; k >= 1; k--) { drawBlobLayer(g, hillSheet(k), x, y, up, ox, oy, k < 3 ? .25 : k < 5 ? .1 : .45); if (cellSolid(g.img[g.n - 1], g.at[g.n - 1] % 4096, g.at[g.n - 1] >> 12)) break; }
const hills = g.n, covered = k >= 1;
if (!covered) {
if (gr === ":") Bridge.lay(g, x, y, ox, oy);
if (isLand(gr)) {
drawBlobLayer(g, dug ? dugSheet("soil", -lv) : IMG.soil, x, y, (_, gg, tx, ty) => isLand(gg) || Bridge.rests(x, y, tx, ty), ox, oy, .15);
if (!dug && (gr === "." || gr === "_" || gr === "n")) drawBlobLayer(g, IMG.grass, x, y, (_, gg, tx, ty) => gg === "." || gg === "_" || gg === "n" || Bridge.rests(x, y, tx, ty), ox, oy, gr === "." ? .3 : 0);
groundMarks(g, x, y, gr, ox, oy);
}
let low = lv;
for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) low = Math.min(low, levelAt(x + dx, y + dy));
k = 0;
if (lv >= 0 && low < 0) drawBlobLayer(g, edgeSheet("hill1"), x, y, up, ox, oy, 0);
}
const base = g.n;
if (lv && isLand(gr)) groundMarks(g, x, y, gr, ox, oy, lv > 0);
if (c === "H") drawBlobLayer(g, IMG.hedge, x, y, (cc) => cc === "H", ox, oy, 0);
const hd = hash(x, y, 41);
if (gr === "~" && hd < .09) {
const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isLand(gndAt(x + dx, y + dy)));
if (shore || hd < .015) {
const pick = Math.floor(hash(x, y, 42) * 7), col = [8, 9, 10, 11, 6, 7, 0][pick];
g.drawImage(IMG.water_objects, col * 16, 0, 16, 16, ox, oy, 16, 16);
}
}
const order = [];
for (let j = hills; j < base; j++) order.push(j);
for (let j = hills - 1; j >= 0; j--) order.push(j);
for (let j = base; j < g.n; j++) order.push(j);
let first = order.length - 1;
while (first >= 0 && !cellSolid(g.img[order[first]], g.at[order[first]] % 4096, g.at[order[first]] >> 12)) first--;
const at = (q) => [g.img[order[q]], g.at[order[q]] % 4096, g.at[order[q]] >> 12];
if (to && to.g) { for (let q = Math.max(0, first); q < order.length; q++) { const [img, sx, sy] = at(q); to.g.drawImage(img, sx, sy, 16, 16, ox, oy, 16, 16); } return; }
const px = to.px, W = to.w, o = to.o;
if (first < 0) for (let j = 0; j < 16; j++) px.fill(0, o + j * W, o + j * W + 16);
for (let q = Math.max(0, first); q < order.length; q++) layCell(px, o, W, ...at(q), q === first);
dugFoot(px, o, W, x, y, lv);
}
function groundMarks(g, x, y, gr, ox, oy, high = false) {
if (gr === "o" || gr === "u") { if (high) drawBlobLayer(g, IMG.tilled, x, y, (_, gg) => gg === "o" || gg === "u", ox, oy, 0); else g.drawImage(...Furrows.cell(x, y), 16, 16, ox, oy, 16, 16); }
if (gr === "u") drawBlobLayer(g, IMG.tilled_wet, x, y, (_, gg) => gg === "u", ox, oy, 0);
if (gr === "n") g.drawImage(IMG.house_walls, 16, 16, 16, 16, ox, oy, 16, 16);
if (gr === "'") drawBlobLayer(g, IMG.ash, x, y, (_, gg) => gg === "'", ox, oy, 0);
if (gr === "_") g.drawImage(...Pave.cell(x, y), 16, 16, ox, oy, 16, 16);
}
const dugSheets = {}, EARTH = [[0xc8, 0x98, 0x6e], [0xb0, 0x7e, 0x5a], [0x8b, 0x5a, 0x40]];
function dugSheet(name, d) {
d = Math.min(d, 8);
if (dugSheets[name + d]) return dugSheets[name + d];
const img = IMG[name], c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
const g = c.getContext("2d"); g.drawImage(img, 0, 0);
const im = g.getImageData(0, 0, c.width, c.height), px = im.data, wall = name !== "soil";
const f = wall ? [Math.max(.45, 1 - .075 * d), Math.max(.38, 1 - .09 * d), Math.max(.3, 1 - .11 * d)] : [Math.max(.62, 1 - .0475 * d), Math.max(.57, 1 - .054 * d), Math.max(.5, 1 - .0625 * d)];
for (let i = 0; i < px.length; i += 4) {
if (!px[i + 3]) continue;
if (px[i + 1] > px[i] + 8) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; [px[i], px[i + 1], px[i + 2]] = EARTH[l > 170 && !wall ? 0 : l > 130 || wall && l > 100 ? 1 : 2]; }
for (let j = 0; j < 3; j++) px[i + j] *= f[j];
}
g.putImageData(im, 0, 0); c.dug = wall ? d + 1 : 0;
return (dugSheets[name + d] = c);
}
function dugFoot(px, o, W, x, y, lv) {
if (lv < 0 || maskOf.plain) return;
let a = null, v = 0;
for (const [dx, dy, at] of [[0, 1, (q, r) => [q, 15 - r]], [1, 0, (q, r) => [15 - r, q]], [-1, 0, (q, r) => [r, q]], [1, 1, (q, r) => [15 - (q & 7), 15 - r]], [-1, 1, (q, r) => [q & 7, 15 - r]]]) {
if (levelAt(x + dx, y + dy) >= 0 || wet(gndAt(x + dx, y + dy) || "~")) continue;
if (!a) { const c = colsOf(hillSheet(0)).bands[1]; a = cellAlpha(hillSheet(0), ...blobCell(maskOf(x, y, (cc, gg, tx, ty) => levelAt(tx, ty) >= 0))); v = (255 << 24 | c[2] << 16 | c[1] << 8 | c[0]) >>> 0; }
for (let q = 0; q < (dx && dy ? 8 : 16); q++) {
for (let r = 0; r < 16 && !a[at(q, r)[1] * 16 + at(q, r)[0]]; r++) { const [i, j] = at(q, r); px[o + j * W + i] = v; }
}
}
}
const hillSheets = {}, ROCK_TONE = {step: .025, wall: [.79, .81, .87]};
function hillSheet(k) {
if (k <= 0) return dugSheet("hill1", -k);
const rock = k === "rock"; if (!rock) k = Math.min(k, 12);
if (hillSheets[k]) return hillSheets[k];
const img = IMG[k <= 2 ? "hill1" : k <= 4 ? "hill2" : "hill3"], f = k <= 4 ? [1.015, 1.03, 1.04, 1.06][k - 1] : rock ? 0 : 1 - ROCK_TONE.step * (12 - k);
if (f === 1) return hillSheets[k] = img;
const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
const g = c.getContext("2d"); g.drawImage(img, 0, 0);
const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
for (let i = 0; i < px.length; i += 4) for (let j = 0; j < 3; j++) px[i + j] = Math.min(255, px[i + j] * (rock ? ROCK_TONE.wall[j] : j === 2 && f < 1 ? f ** .85 : f));
g.putImageData(d, 0, 0);
return hillSheets[k] = c;
}
const EDGE_TOP = {hill1: [192, 212, 112], hill3: [193, 200, 185], rock: [193, 200, 185]}, edgeSheets = {};
function edgeSheet(name) {
if (edgeSheets[name]) return edgeSheets[name];
const img = IMG[name === "rock" ? "hill3" : name], c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
const g = c.getContext("2d"); g.drawImage(img, 0, 0);
const d = g.getImageData(0, 0, c.width, c.height), px = d.data, [r, gg, b] = EDGE_TOP[name];
for (let i = 0; i < px.length; i += 4) {
if (Math.abs(px[i] - r) + Math.abs(px[i + 1] - gg) + Math.abs(px[i + 2] - b) < 30) px[i + 3] = 0;
else if (name === "rock") { px[i] *= .52; px[i + 1] *= .5; px[i + 2] *= .5; }
}
g.putImageData(d, 0, 0);
return edgeSheets[name] = c;
}
const NOPX = new Uint32Array(0);
function arriveBlock(b) { b.px = NOPX; b.drawn = true; b.ver = (b.ver || 0) + 1; landVer++; }
;
const Pave = (() => {
const N = 4, SLOT = 8, T = 16, SPAN = N * T;
let sheet = null, seed = 20;
const dice = (n) => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0, Math.floor(seed / 65536) % n);
function stones() {
const out = [];
for (let r = 0; r < SPAN / SLOT; r++) for (let c = 0; c < SPAN / SLOT; c++) {
const w = [5, 6, 6, 7, 7][dice(5)], h = [5, 6, 6][dice(3)];
out.push([c * SLOT + (r & 1 ? SLOT / 2 : 0) + dice(SLOT - w), r * SLOT + dice(SLOT - h), w, h]);
}
return out;
}
function stone(g, x, y, w, h, light, dark) {
g.fillStyle = light; g.fillRect(x + 1, y, w - 2, 1); g.fillRect(x, y + 1, w, h - 3); g.fillRect(x + 1, y + h - 2, w - 2, 1);
g.fillStyle = dark; g.fillRect(x, y + h - 2, 1, 1); g.fillRect(x + w - 1, y + h - 2, 1, 1); g.fillRect(x + 1, y + h - 1, w - 2, 1);
}
function make() {
const c = document.createElement("canvas"); c.width = SPAN * 4; c.height = SPAN;
const g = c.getContext("2d"), px = sheetData(IMG.cobble), css = (v) => `rgb(${v & 255},${v >> 8 & 255},${v >> 16 & 255})`;
const light = css(px.px[6 * px.w + 3]), dark = css(px.px[9 * px.w + 3]), all = stones(), per = SPAN / SLOT;
for (let m = 0; m < 4; m++) for (let ty = 0; ty < N; ty++) for (let tx = 0; tx < N; tx++) {
const at = (r, k) => { const [x, y, w, h] = all[r * per + (tx * 2 + k + per) % per]; return [(x - tx * T + SPAN + T) % SPAN - T, y - ty * T, w, h]; };
const laid = [at(ty * 2, 0), at(ty * 2, 1)], [a, b, c2] = [-1, 0, 1].map((k) => at(ty * 2 + 1, k));
if (m & 1) laid.push(a);
if (m & 2) laid.push(b, c2);
else {
const cx = T - c2[2], bx = Math.min(b[0], cx - 1 - b[2]);
if (bx >= (m & 1 ? a[0] + a[2] + 1 : 0)) laid.push([bx, b[1], b[2], b[3]], [cx, c2[1], c2[2], c2[3]]); else laid.push(b);
}
g.save(); g.beginPath(); g.rect((m * N + tx) * T, ty * T, T, T); g.clip();
for (const [lx, ly, w, h] of laid) stone(g, (m * N + tx) * T + lx, ty * T + ly, w, h, light, dark);
g.restore();
}
return c;
}
function cell(x, y) {
const lv = levelAt(x, y), joins = (dx) => gndAt(x + dx, y) === "_" && levelAt(x + dx, y) === lv;
return [sheet || (sheet = make()), (((joins(-1) ? 1 : 0) + (joins(1) ? 2 : 0)) * N + (x & N - 1)) * T, (y & N - 1) * T];
}
return {cell};
})();
;
const Furrows = (() => {
const N = 4, T = 16, SPAN = N * T;
let sheet = null, seed = 11;
const dice = (n) => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0, Math.floor(seed / 65536) % n);
function make() {
const c = document.createElement("canvas"); c.width = c.height = SPAN;
const g = c.getContext("2d"), m = sheetData(IMG.tilled), tans = new Set();
for (const v of m.px) if (v >>> 24 === 255 && (v & 255) > 200) tans.add(v & 0xffffff);
const tone = [...tans].sort((a, b) => (a & 255) - (b & 255)).map((v) => `rgb(${v & 255},${v >> 8 & 255},${v >> 16 & 255})`);
const line = (y, colour, on, off) => {
g.fillStyle = colour;
for (let x = dice(on); x < SPAN;) { const w = on + dice(on); g.fillRect(x, y, Math.min(w, SPAN - x), 1); x += w + off + dice(off); }
};
for (let y = 0; y < SPAN; y += 4) { line(y + 3, tone[0], 5, 1); line(y, tone[tone.length - 1], 3, 3); }
return c;
}
return {cell: (x, y) => [sheet || (sheet = make()), (x & N - 1) * T, (y & N - 1) * T]};
})();
;
const Bridge = {
ew(x, y) { return [-1, 1].some((d) => { const q = gndAt(x + d, y); return q === ":" || isLand(q); }); },
rests(x, y, tx, ty) { return gndAt(tx, ty) === ":" && (ty === y ? tx !== x && Bridge.ew(tx, ty) : tx === x && !Bridge.ew(tx, ty)); },
lay(g, x, y, ox, oy) {
const ew = Bridge.ew(x, y), at = (k) => (ew ? gndAt(x + k, y) : gndAt(x, y + k)), back = at(-1) === ":", on = at(1) === ":";
const dry = isLand(at(back ? 1 : -1));
if (back === on || dry) g.drawImage(IMG.bridge, ew ? 0 : 32, 32, 16, 16, ox, oy, 16, 16);
if (back !== on) g.drawImage(IMG.bridge, ew ? (back ? 16 : 0) : (dry ? 32 : 48), ew ? (dry ? 0 : 16) : (back ? 16 : 0), 16, 16, ox, oy, 16, 16);
},
};
;
const Models = (() => {
const SIDE = 128, kinds = [];
let cv = null, g = null, nx = 0, ny = 0, tall = 0;
function sheet() {
if (cv) return cv;
cv = document.createElement("canvas"); cv.width = cv.height = SIDE; g = cv.getContext("2d");
for (const k of kinds) k.start();
return cv;
}
function room(w, h, draw) {
if (nx + w > SIDE) { nx = 0; ny += tall; tall = 0; }
const at = [nx, ny]; draw(g, nx, ny); nx += w; tall = Math.max(tall, h);
return at;
}
const rows = (list, pal) => room(list[0].length, list.length, (q, u, v) => list.forEach((row, j) => [...row].forEach((ch, i) => { if (pal[ch]) { q.fillStyle = pal[ch]; q.fillRect(u + i, v + j, 1, 1); } })));
function at(x, y) {
sheet();
let out = null;
for (const k of kinds) { const l = k.at(x, y); if (l) out = out ? out.concat(l) : l; }
return out;
}
const up = (x, y) => { let n = 0; for (const k of kinds) n = Math.max(n, k.up(x, y)); return n; };
return {add: (k) => kinds.push(k), room, rows, at, up, sheet};
})();
;
const BridgeModel = (() => {
const UP = 4, THICK = 2, RISE = 2;
let P = null;
function start() {
const c = document.createElement("canvas"); c.width = IMG.bridge.width; c.height = IMG.bridge.height;
const q = c.getContext("2d", {willReadFrequently: true}); q.drawImage(IMG.bridge, 0, 0);
const col = (x, y) => { const d = q.getImageData(x, y, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
const pal = {A: col(1, 34), B: col(1, 45), D: col(1, 35), E: col(0, 36), K: col(48, 26)};
const cut = (sx, sy, w, h) => Models.room(w, h, (g, u, v) => g.drawImage(IMG.bridge, sx, sy, w, h, u, v, w, h));
P = {
ewTop: cut(0, 34, 4, 11), ewFront: Models.rows(["ABBB", "AAAA"], pal),
nsTop: cut(33, 32, 14, 4), nsFront: Models.rows(["ABBBBBBBBBBBBA", "AAAAAAAAAAAAAA"], pal),
postTop: Models.rows([".AA.", "ABBA", "ABBA"], pal),
post: Models.rows(["ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "EDDE"], pal),
pile: Models.rows(["ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "ADDA", "KDDK"], pal), foam: Models.rows([".KK."], pal),
slimTop: Models.rows([".A.", "ABA", "ABA"], pal), slim: Models.rows(["ADA", "ADA", "ADA", "ADA", "ADA", "ADA", "ADA", "KDK"], pal), slimFoam: Models.rows([".K."], pal),
ewFill: Models.rows(["EDDD", "EDDD", "EDDD", "EDDD", "EDDD"], pal), nsFill: Models.rows(["ADDDDDDDDDDDDA", "ADDDDDDDDDDDDA", "ADDDDDDDDDDDDA"], pal),
sideTop: [Models.rows(["AA", "AB", "AB"], pal), Models.rows(["AA", "BA", "BA"], pal)], side: [Models.rows(["AD", "AD", "AD", "AD", "AD", "AD", "AD", "KD"], pal), Models.rows(["DA", "DA", "DA", "DA", "DA", "DA", "DA", "DK"], pal)],
plank: Models.rows(["D"], pal),
shade: Models.room(1, 1, (g, u, v) => { g.fillStyle = "rgba(80,64,134,.25)"; g.fillRect(u, v, 1, 1); }),
};
}
const is = (x, y) => gndAt(x, y) === ":";
function past(x, y, ew, k) {
const tx = ew ? x + k : x, ty = ew ? y : y + k, q = gndAt(tx, ty);
return q === ":" ? (Bridge.ew(tx, ty) === ew ? "bridge" : "cross") : !isLand(q) ? "water" : topAt(tx, ty) === topAt(x, y) ? "bank" : "wall";
}
function planks(x, y, ew) {
const a = past(x, y, ew, -1) === "bank", b = past(x, y, ew, 1) === "bank";
return [0, 1, 2, 3].map((i) => Math.min(UP, a ? 1 + i : UP, b ? 4 - i : UP));
}
const up = (x, y) => { if (!is(x, y)) return 0; const h = planks(x, y, Bridge.ew(x, y)); return Math.max(h[1], h[2]); };
function post(out, x, y, z, h, wet, slim) {
const f = slim ? P.slim : wet ? P.pile : P.post, w = slim ? 3 : 4;
out.push({x, y, z, w, d: 3, h, top: slim ? P.slimTop : P.postTop, front: [f[0], f[1] + 8 - h]});
if (wet) out.push({x, y: y + 3, z, w, d: 1, h: 0, top: slim ? P.slimFoam : P.foam});
if (wet) for (let k = 8; k <= pileDeep * RELIEF_STEP; k += 8) out.push({x, y, z: z - k, w, d: 3, h: 8, front: f});
}
let pileDeep = 0;
function at(x, y) {
if (!is(x, y)) return null;
pileDeep = WaterBed.depth(x, y);
const ew = Bridge.ew(x, y), hs = planks(x, y, ew), out = [], base = topAt(x, y) * RELIEF_STEP;
const beside = (k) => ew && is(x, y + k) && Bridge.ew(x, y + k), wide = beside(1);
hs.forEach((z, i) => {
const h = Math.min(THICK, z), gap = z - h;
if (ew) out.push({x: i * 4, y: 3, z: base + gap, w: 4, d: 11, h, top: P.ewTop, front: P.ewFront});
else out.push({x: 1, y: i * 4, z: base + gap, w: 14, d: 4, h, top: P.nsTop, front: P.nsFront});
if (wide) out.push({x: i * 4, y: 14, z: base + z, w: 4, d: 5, h: 0, top: P.ewFill});
else if (gap && ew) out.push({x: i * 4, y: 14 - gap, z: base, w: 4, d: 2 * gap, h: 0, top: [...P.shade, 1]});
if (gap && !ew && i === 3 && past(x, y, ew, 1) === "water") out.push({x: 1, y: 16 - gap, z: base, w: 14, d: 2 * gap, h: 0, top: [...P.shade, 1]});
});
if (!ew) for (const k of [-1, 1]) if (past(x, y, ew, k) === "cross") out.push({x: 1, y: k < 0 ? -2 : 16, z: base + UP, w: 14, d: k < 0 ? 2 : 3, h: 0, top: P.nsFill});
const pair = (k, z, h, wet) => { for (const s of [0, 1]) if (!beside(s ? 1 : -1)) ew ? post(out, k, s ? 14 : 0, z, h, wet) : post(out, s ? 12 : 0, k, z, h, wet); };
for (const k of [-1, 1]) {
const e = past(x, y, ew, k);
if (e === "bank") pair(k < 0 ? (ew ? -4 : -3) : 16, base, 4, false);
if (e === "water") pair(k < 0 ? (ew ? -4 : -3) : 16, base, UP + RISE, true);
if (e === "wall") { const z = hs[k < 0 ? 0 : 3], h = Math.min(THICK, z), at = k < 0 ? -2 : 16;
out.push(ew ? {x: at, y: 3, z: base + z - h, w: 2, d: 11, h, top: [...P.plank, 1], front: [P.ewFront[0] + 1, P.ewFront[1]]} : {x: 1, y: at, z: base + z - h, w: 14, d: 2, h, top: [...P.plank, 1], front: P.nsFront}); }
}
if (past(x, y, ew, -1) === "bridge") { for (const s of [0, 1]) if (!beside(s ? 1 : -1)) ew ? post(out, -2, s ? 14 : 0, base, UP + 1, true, true) : out.push({x: s ? 15 : -1, y: -2, z: base, w: 2, d: 3, h: UP + 1, top: P.sideTop[s], front: [P.side[s][0], P.side[s][1] + 7 - UP]}); }
return out;
}
Models.add({start, at, up});
return {UP, up, planks};
})();
;
const SEA = 1024, LOW = -512, HIGH = 512, PLAIN = new Map();
const APART = 24;
function tileIdx(x, y) { const b = blockOf(x, y); return b ? [b, (y - b.by * B) * B + (x - b.bx * B)] : null; }
const colSolid = (lv) => PLAIN.get(lv) || PLAIN.set(lv, [lv]).get(lv);
const colTop = (c) => c[c.length - 1];
const colFloor = (c) => c[0];
const colSame = (a, b) => a === b || (a.length === b.length && a.every((v, i) => v === b[i]));
function colHas(c, z) { for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return i === 0 || z > c[i - 1]; return false; }
function colIn(v) {
if (typeof v !== "number") return v.length === 1 ? colSolid(v[0]) : v;
const out = [];
for (let i = 0; i < 32; i++) if ((v >>> i & 1) !== (i < 31 ? v >>> (i + 1) & 1 : 0)) out.push(i - 16);
return out.length === 1 ? colSolid(out[0]) : out;
}
const floorAt = (x, y) => { const b = blockOf(x, y); return b ? b.lv[(y - b.by * B) * B + (x - b.bx * B)].charCodeAt(0) - SEA : 0; };
function colAt(x, y) {
const b = blockOf(x, y); if (!b) return colSolid(0);
const i = (y - b.by * B) * B + (x - b.bx * B), c = b.col ? b.col[i] : undefined;
return c === undefined ? colSolid(b.lv[i].charCodeAt(0) - SEA) : c;
}
const topAt = (x, y) => colTop(colAt(x, y));
const roofAt = (x, y) => { const b = blockOf(x, y), i = b ? (y - b.by * B) * B + (x - b.bx * B) : 0; return b && b.col && b.col[i] !== undefined ? colTop(b.col[i]) - (b.lv[i].charCodeAt(0) - SEA) : 0; };
const landSolid = (x, y, z) => z < LOW || colHas(colAt(x, y), z);
const solidAt = (x, y, z) => landSolid(x, y, z) || Floors.built(x, y, z);
function surfacesAt(x, y) {
const c = colAt(x, y), over = Floors.cells(x, y), out = [];
for (let i = 0; i < c.length; i += 2) if (!over || !over.has(c[i] + 1)) out.push(c[i]);
if (over) { for (const z of over.keys()) if (!over.has(z + 1) && !colHas(c, z + 1)) out.push(z); out.sort((p, q) => p - q); }
return out;
}
function settleAt(x, y, z) { const s = surfacesAt(x, y), under = s.filter((v) => v <= z); return under.length ? under[under.length - 1] : s[0]; }
function landAt(h, x, y, fx, fy, jump = true) {
let z = h;
const stair = (sx, sy, sz) => { const c = FLOORS && sx !== undefined ? Floors.get(sx, sy, sz) : null; return !!c && c[0] === "stairs"; };
jump = jump || stair(x, y, h + 1) || stair(fx, fy, h);
if (solidAt(x, y, h + 1)) z = !jump || solidAt(x, y, h + 2) || (fx !== undefined && solidAt(fx, fy, h + 2)) ? null : h + 1;
else while (!solidAt(x, y, z)) z--;
if (fx !== undefined && FLOORS && Floors.thingAt(fx, fy, h) === "l" && (z === null || !Climb.openAt(x, y, z))) {
const up = Climb.climb(h, fx, fy, x, y);
if (up !== null) return up;
}
return z;
}
let peek = null;
const hollow = (x, y) => roofAt(x, y) > 0;
const levelAt = (x, y) => { const v = peek ? peek.get(x + "," + y) : undefined; return v === undefined ? topAt(x, y) : v; };
const standAt = (x, y) => topAt(x, y);
const groundAt = floorAt;
const matAt = (x, y) => { const b = blockOf(x, y); return (b && b.mat && b.mat[(y - b.by * B) * B + (x - b.bx * B)]) || ""; };
let myAt = null, myWas = null;
const myZ = (x, y) => (myAt && myAt.x === x && myAt.y === y ? myAt.z : myAt && Math.abs(myAt.x - x) + Math.abs(myAt.y - y) <= 2 ? settleNear(x, y, myAt.z) : topAt(x, y));
function settleNear(x, y, z) { return surfacesAt(x, y).reduce((a, v) => (Math.abs(v - z) < Math.abs(a - z) ? v : a)); }
function rimAt(x, y) {
const lv = floorAt(x, y);
for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && floorAt(x + dx, y + dy) < lv) return true;
return false;
}
const canStep = (x0, y0, x1, y1) => landAt(myZ(x0, y0), x1, y1, x0, y0) !== null;
;
const AGENT_TINTS = ["#f4b6b6", "#a9cdf2", "#b8e0a0", "#f2d58f", "#d3b6ef", "#9fdcd0", "#f3b7d6", "#e8c9a4", "#c9d0f5", "#f6c79a"];
const agentTint = (name) => AGENT_TINTS[[...name].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, 7) % AGENT_TINTS.length];
const tinted = new Map();
function characterSheet(tint, src = IMG.character) {
const key = tint + (src === IMG.character ? "" : ":" + src.src);
if (tinted.has(key)) return tinted.get(key);
const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(src, 0, 0);
const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
const tr = parseInt(tint.slice(1, 3), 16), tg = parseInt(tint.slice(3, 5), 16), tb = parseInt(tint.slice(5, 7), 16);
for (let i = 0; i < px.length; i += 4) {
const r = px[i], gg = px[i + 1], bb = px[i + 2];
if (px[i + 3] && r > 200 && gg > 190 && bb > 150 && r - bb < 90) {
const k = (r + gg + bb) / (243 + 242 + 192);
px[i] = Math.min(255, tr * k); px[i + 1] = Math.min(255, tg * k); px[i + 2] = Math.min(255, tb * k);
}
}
g.putImageData(d, 0, 0); tinted.set(key, c); return c;
}
const ANIM = {idle: 0, walk: 4, run: 8, hoe: 12, axe: 16, water: 20, pickaxe: 24, sword: 28, spear: 32};
const DIR_ROW = (p) => (p.fy < 0 ? 1 : p.fx > 0 ? 2 : p.fx < 0 ? 3 : 0);
let troughFullC = null;
function troughFull() {
if (troughFullC) return troughFullC;
const c = troughFullC = document.createElement("canvas"); c.width = 16; c.height = 18; const g = c.getContext("2d");
g.drawImage(IMG.barn, 0, 0, 16, 16, 0, 2, 16, 16); g.drawImage(IMG.barn, 2, 51, 11, 10, 2, 1, 11, 10);
return c;
}
function genCell(name) { return [GEN[name] * 16, 0]; }
const BRINK = new Set("TFUtbvM*Qf");
function brink(x, y) {
const l = standAt(x, y), low = (dx, dy) => { const q = tile(x + dx, y + dy); return !!q && (standAt(x + dx, y + dy) < l || !(isLand(q[1]) || Bridge.rests(x, y, x + dx, y + dy))); };
const s = low(0, 1), w = low(-1, 0), e = low(1, 0), sw = !s && !w && low(-1, 1), se = !s && !e && low(1, 1);
return [(w ? 4 : sw ? 3 : 0) - (e ? 4 : se ? 3 : 0), s ? -8 : sw || se ? -4 : 0];
}
function objectSprite(c, x, y, t) {
const s = spriteOf(c, x, y, t);
if (!s || !BRINK.has(c)) return s;
const [dx, dy] = brink(x, y);
return dx || dy ? [s[0], s[1], s[2], s[3], s[4], s[5] + dx, s[6] + dy] : s;
}
function spriteOf(c, x, y, t) {
const h = hash(x, y, 21);
switch (c) {
case "T": {
if (h < .7) {
const hit = shakes.get(x + "," + y), k = hit ? (performance.now() - hit) / 1000 : 9;
if (k < .32) return [IMG.tree_anim, 48 * Math.min(3, Math.floor(k * 12.5)), 48, 48, 48, -16, -28];
const f = Math.floor(t * 6 + h * 60) % 12;
return [IMG.tree_anim, 48 * f, 144, 48, 48, -16, -28];
}
return [IMG.trees, 0, 0, 16, 32, 0, -13];
}
case "F": {
const img = fruitSheet(x, y), hit = shakes.get(x + "," + y), k = hit ? (performance.now() - hit) / 1000 : 9;
if (k < .32) return [img, 48 * Math.min(3, Math.floor(k * 12.5)), 48, 48, 48, -16, -28];
return [img, 48 * (Math.floor(t * 5 + h * 30) % 6), 96, 48, 48, -16, -28];
}
case "b": return [IMG.trees, BERRY_BUSH[Math.floor(h * 3)], 48, 16, 16, 0, -3];
case "v": return [IMG.trees, 16, 48, 16, 16, 0, -3];
case "U": {
return [IMG.fruit_bare, fruitKind(x, y) * 48, 0, 48, 48, -16, -28];
}
case "*": return [IMG.gen, ...genCell("ore"), 16, 16, 0, -3];
case "M": return [IMG.gen, ...genCell("boulder"), 16, 16, 0, -3];
case "%": return [IMG.gen, ...genCell("stone_wall"), 16, 16, 0, -4];
case "Q": return [IMG.nature, [0, 16, 48][Math.floor(h * 3)], 0, 16, 16, 0, 0];
case "#": return fenceSprite(x, y);
case "X": return mailAt.has(x + "," + y)
? [IMG.mailbox, 64, 60 + (Math.floor(t * 2) % 2 ? 0 : -1), 16, 36, 0, -20] : [IMG.mailbox, 0, 16, 16, 32, 0, -16];
case "V": return [IMG.boats, (Math.floor(t * 1.5 + h * 9) % 2) * 48, 32, 48, 32, -16, -10];
case "W": return [IMG.house_walls, 48, 16, 16, 16, 0, 0];
case "l": return [IMG.gen, ...genCell("ladder"), 16, 16, 0, -2];
case "+": return [IMG.door, 80, 0, 16, 16, 0, 0];
case "^": return [IMG.gen, ...genCell(Math.floor(t * 6 + x) % 2 ? "campfire1" : "campfire0"), 16, 16, 0, -2];
case "x": return [IMG.gen, ...genCell(Math.floor(t * 8 + x + y) % 2 ? "fire1" : "fire0"), 16, 16, 0, -3];
case "&": return [IMG.gen, ...genCell("workbench"), 16, 16, 0, -3];
case "?": return [IMG.signs, 0, 0, 16, 16, 0, -2];
case "!": return [IMG.gen, ...genCell("flag"), 16, 16, 0, -6];
case ";": return [IMG.crops, 0, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -2];
case "\"": return [IMG.crops, 32, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -3];
case "w": return [IMG.crops, 48, CROP_ROW[cropSpecies(x, y)] * 16, 16, 16, 0, -4];
case "f": {
if (h < .06) return [IMG.nature, 48, 48, 16, 32, 0, -16];
const [fx, fy] = FLOWERS[Math.floor(hash(x, y, 44) * FLOWERS.length)];
return [IMG.nature, fx * 16, fy * 16, 16, 16, 0, -1];
}
case "B": return [IMG.furniture, Math.floor(h * 3) * 16, 16, 16, 32, 0, -16];
case "h": return [IMG.furniture, CHAIR[chairFaces(x, y)], 32, 16, 16, 0, -3];
case "L": return [IMG.furniture, 48, 48, 16, 16, 0, -3];
case "p": return [IMG.furniture, 48 + Math.floor(h * 3) * 16, 0, 16, 32, 0, -16];
case "K": return [IMG.furniture, 96, 48, 16, 16, 0, -3];
case "r": return [IMG.furniture, Math.floor(h * 3) * 16, 80, 16, 16, 0, 0];
case "g": {
const key = x + "," + y, near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => occupied.has((x + dx) + "," + (y + dy)));
const was = doors.get(key) || 0, o = Math.max(0, Math.min(1, was + (near ? .12 : -.08)));
if (!was && o) sfx("gate", x, y);
if (was >= 1 && o < 1) sfx("door_close", x, y);
doors.set(key, o);
const f = Math.round(o * 4) * 32;
return gateSide(x, y) ? [IMG.gates, f, 16, 32, 32, 0, -13] : [IMG.gates, f, 0, 16, 16, 0, -3];
}
case "t": {
const now = performance.now();
if (falls.some((f) => f.x === x && f.y === y && now - f.t0 < (f.thin ? 3 : 9) / 14 * 1000)) return null;
return h < .7 ? [IMG.tree_fall, 12 * 64 + 32, 28, 16, 16, 0, 0] : [IMG.stump_thin, 0, 0, 16, 16, 0, 0];
}
case "Y": return [IMG.well, 0, 0, 32, 32, 0, -16];
case "J": { const k = Math.floor(h * 6); return [IMG.coop, 160 + (k % 3) * 32, 80 + Math.floor(k / 3) * 48, 32, 44, 0, -28]; }
case "m": return [IMG.blanket, 0, 8, 48, 32, 0, -16];
case "q": return [IMG.basket, 0, 0, 16, 16, 0, -3];
case "e": return troughAt.has(x + "," + y) ? [troughFull(), 0, 0, 16, 18, 0, -5] : [IMG.barn, 0, 0, 16, 16, 0, -3];
case "y": return [IMG.barn, 0, 16, 16, 16, 0, -2];
case "Z": case "z": return null;
case "C": {
const o = chestOpen.get(x + "," + y), k = o ? (performance.now() - o) / 1000 : 9;
const f = k < .2 ? Math.floor(k / .2 * 4) : k < 1.2 ? 4 : k < 1.4 ? 4 - Math.floor((k - 1.2) / .2 * 4) : 0;
return [IMG.chest, f * 48 + 16, 16, 16, 16, 0, -2];
}
}
return null;
}
let boundsIds = 0;
const boundsCache = new Map(), boundsCv = document.createElement("canvas");
function spriteBounds(img, a, b, w, h) {
if (!img.bid) img.bid = ++boundsIds;
const key = `${img.bid}|${a},${b},${w},${h}`;
if (boundsCache.has(key)) return boundsCache.get(key);
boundsCv.width = w; boundsCv.height = h;
const g = boundsCv.getContext("2d", {willReadFrequently: true});
g.clearRect(0, 0, w, h); g.drawImage(img, a, b, w, h, 0, 0, w, h);
const d = g.getImageData(0, 0, w, h).data;
const cols = new Array(w).fill(0), rows = new Array(h).fill(0);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= 120) { cols[x]++; rows[y]++; }
let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
while (x0 <= x1 && cols[x0] < 2) x0++;
while (x1 >= x0 && cols[x1] < 2) x1--;
while (y0 <= y1 && rows[y0] < 2) y0++;
while (y1 >= y0 && rows[y1] < 2) y1--;
const r = x1 < x0 || y1 < y0 ? null : [x0, y0, x1 + 1, y1 + 1];
if (!(img instanceof HTMLImageElement) || (img.complete && img.naturalWidth)) boundsCache.set(key, r);
return r;
}
;
const SOUND = {
master: .8,
music: .64,
bossMusic: 1.4,
firstMoment: [8, 20],
gap: [50, 140],
afterFight: [20, 40],
passes: {day: 6, night: 4},
arrive: {day: 10, night: 14, boss: 2.5, menu: 6},
ending: 12,
turn: [6, 12],
giveWay: 4,
menuOut: 5,
wind: .5,
mix: {Footsteps: .9, Work: 1, Breaking: 1, Building: 1, Items: .9, Progress: 1, Fights: 1, Animals: .9, World: .9, People: .8, Interface: .8, Boss: 1},
scene: {People: .5, rest: .25},
hearing: 12,
quietest: .15,
panWidth: 9,
panAmount: .8,
pitch: .04,
minGap: {default: 45, pick: 60, step: 110, tock: 110, click: 110, wade: 130, swim: 450, water: 300, orb: 30, crackle: 400, grow: 800, say: 150, rustle: 90},
maxVoices: 20,
loaders: 4,
};
let audio = null, soundOut = null, musicOut = null, muted = localStorage.getItem("megastructure-muted") === "1";
const sounds = {manifest: null, loading: null, buffers: new Map(), lastVariant: {}, lastAt: {}, voices: 0, warned: new Set()};
const awake = () => !!audio && audio.state === "running";
function ac() {
if (!audio) {
audio = new (window.AudioContext || window.webkitAudioContext)();
soundOut = audio.createGain();
soundOut.gain.value = SOUND.master;
const limiter = audio.createDynamicsCompressor();
limiter.threshold.value = -6; limiter.ratio.value = 12; limiter.attack.value = .002; limiter.release.value = .15;
soundOut.connect(limiter).connect(audio.destination);
musicOut = audio.createGain(); musicOut.connect(audio.destination);
soundLevels();
}
return audio;
}
function soundLevels() {
if (!audio) return;
soundOut.gain.value = SOUND.master * opt("master") / 100; musicOut.gain.value = opt("master") / 100 * opt("music") / 100;
}
for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, () => { if (!muted) { ac().resume(); loadSounds(); } }, {once: true, capture: true});
function loadSounds() {
if (!sounds.loading) sounds.loading = (window.bootWait || Promise.resolve()).then(() => fetch("audio/sfx.json", {cache: "no-cache"}))
.then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
.then((m) => { sounds.manifest = m; startMusic(); return warmSounds(); })
.catch(() => { console.info("no sound effects: run `uv run python tools/build_audio.py`"); setTimeout(() => sounds.loading = null, 15000); });
return sounds.loading;
}
function loadSoundFile(file) {
let entry = sounds.buffers.get(file);
if (!entry) {
entry = fetch(`audio/${file}?v=${sounds.manifest.version}`)
.then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
.then((raw) => ac().decodeAudioData(raw))
.then((buf) => { sounds.buffers.set(file, buf); return buf; })
.catch(() => { sounds.buffers.delete(file); return null; });
sounds.buffers.set(file, entry);
}
return entry;
}
async function warmSounds() {
const files = Object.values(sounds.manifest.sounds).flatMap((s) => s.files);
const worker = async () => { while (files.length) await loadSoundFile(files.shift()); };
await Promise.all(Array.from({length: SOUND.loaders}, worker));
}
const music = {key: null, gain: null, on: false, at: 0, run: 0, nodes: new Map(), left: 0};
const bossTrack = {key: null, gain: null, on: false, at: 0, run: 0, nodes: new Map(), left: Infinity};
const menuTrack = {key: null, gain: null, on: false, at: 0, run: 0, nodes: new Map(), left: Infinity};
const moment = {next: Infinity, last: {}};
let fight = false, home = false;
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const between = ([lo, hi]) => (lo + Math.random() * (hi - lo)) * 1000;
const piece = (file) => fetch(`audio/${file}?v=${sounds.manifest.version}`)
.then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
.then((raw) => ac().decodeAudioData(raw)).catch(() => null);
async function stream(tr, done) {
const m = sounds.manifest.tracks[tr.key], a = ac(), rate = a.sampleRate, run = ++tr.run;
for (const src of tr.nodes.keys()) src.stop();
tr.on = true; tr.at = 0;
if (!tr.gain) {
tr.gain = a.createGain(); tr.gain.gain.value = 0;
tr.far = a.createBiquadFilter(); tr.far.type = "lowpass"; tr.far.frequency.value = FAR; tr.far.Q.value = .5;
tr.gain.connect(tr.far).connect(musicOut);
}
let next = 0;
while (tr.on && tr.run === run) {
if (!awake()) { await pause(300); continue; }
const i = tr.at, buf = await piece(m.files[i]);
if (!tr.on || tr.run !== run) return;
if (!buf) { await pause(3000); continue; }
const end = i === m.files.length - 1, len = Math.floor((end ? m.last : m.seg) * rate + 1e-6);
if (next < (a.currentTime + .05) * rate) next = Math.ceil((a.currentTime + .15) * rate);
const src = a.createBufferSource(), starts = next / rate;
src.buffer = buf; src.connect(tr.gain); src.start(starts, m.pad, len / rate);
tr.nodes.set(src, {i, starts}); src.onended = () => { tr.nodes.delete(src); src.disconnect(); };
next += len; tr.at = (i + 1) % m.files.length;
if (end && --tr.left <= 0) {
const ends = next / rate;
swell(tr, 0, SOUND.ending, ends - SOUND.ending);
await pause((ends - a.currentTime) * 1000);
if (tr.run === run) { tr.on = false; done && done(); }
return;
}
while (tr.on && tr.run === run && a.currentTime < starts - 1) await pause(400);
}
}
const FAR = 350, NEAR = 18000;
function swell(tr, level, secs, at) {
if (!tr.gain) return;
const t = Math.max(at ?? 0, audio.currentTime), g = tr.gain.gain, f = tr.far.frequency;
g.cancelScheduledValues(t); f.cancelScheduledValues(t);
g.setTargetAtTime(level, t, secs / 3);
f.setValueAtTime(level ? Math.min(f.value, NEAR / 2) : Math.max(f.value, FAR * 2), t);
f.exponentialRampToValueAtTime(level ? NEAR : FAR, t + secs);
}
function halt(tr, after) {
if (!tr.on) return;
tr.on = false; tr.run++;
for (const src of tr.nodes.keys()) src.stop(audio.currentTime + after);
}
function moments() {
const m = sounds.manifest;
const hour = typeof clock !== "undefined" && clock.night ? "night" : "day";
if (music.on && music.hour && music.hour !== hour && !music.turned) { music.turned = true; music.left = Math.min(music.left, 1); }
if (!audio || muted || fight || home || !m || !m.tracks || !SOUND.music || music.on || performance.now() < moment.next) return;
const all = m.play[hour] || [];
const list = all.length > 1 ? all.filter((k) => k !== moment.last[hour]) : all;
if (!list.length) return;
music.key = moment.last[hour] = list[Math.floor(Math.random() * list.length)];
music.left = SOUND.passes[hour] || 1; music.hour = hour; music.turned = false;
moment.next = Infinity;
stream(music, () => { moment.next = performance.now() + (music.turned ? between(SOUND.turn) : between(SOUND.gap) * ({often: .35, rarely: 2.5}[opt("often")] || 1)); });
swell(music, SOUND.music, SOUND.arrive[hour]);
}
setInterval(moments, 1000);
function tune(tc) {
const m = sounds.manifest;
if (!audio || !m || !m.tracks || !SOUND.music) return;
const boss = !muted && fight && !!m.tracks[m.play.boss];
bossTrack.key = m.play.boss;
if (boss && !bossTrack.on) { bossTrack.left = Infinity; stream(bossTrack); swell(bossTrack, SOUND.music * SOUND.bossMusic, SOUND.arrive.boss); }
else if (!boss && bossTrack.on) {
const out = muted ? 3 * tc : SOUND.ending;
swell(bossTrack, 0, out); halt(bossTrack, out + 1);
}
const menu = !muted && home && !!m.tracks[m.play.menu];
menuTrack.key = m.play.menu;
if (menu && !menuTrack.on) { menuTrack.left = Infinity; stream(menuTrack); swell(menuTrack, SOUND.music, SOUND.arrive.menu); }
else if (!menu && menuTrack.on) { const out = muted ? 3 * tc : SOUND.menuOut; swell(menuTrack, 0, out); halt(menuTrack, out + 1); }
if (music.on && (muted || fight || home)) {
const out = muted ? 3 * tc : SOUND.giveWay;
swell(music, 0, out); halt(music, out + .5);
}
if (moment.next === Infinity && !music.on) moment.next = performance.now() + (muted ? Infinity : between(fight ? SOUND.afterFight : [2, 5]));
}
const startMusic = () => { moment.next = performance.now() + between(SOUND.firstMoment); };
setInterval(() => {
const on = typeof titleOpen === "function" && titleOpen();
if (on !== home || (on && !menuTrack.on && !muted)) { home = on; tune(1); }
}, 500);
function bossMusic(on) {
if (on === fight) return;
fight = on; tune(on ? .3 : 1.3);
if (!on && !music.on) moment.next = performance.now() + between(SOUND.afterFight);
}
function setMuted(on) {
muted = on;
localStorage.setItem("megastructure-muted", on ? "1" : "0");
if (on) tune(.3); else { ac(); (sounds.loading || loadSounds()).then(() => tune(.3)); }
}
let ears = null;
function heard(x, y, far, kind) {
const me = myPos(), at = me || (ears && ears());
if (!at) return null;
const dx = x - at.x, d = Math.hypot(dx, y - at.y);
if (d > far) return null;
return {vol: Math.max(SOUND.quietest, 1 - d / far) * (me ? 1 : SOUND.scene[kind] ?? SOUND.scene.rest), pan: Math.max(-1, Math.min(1, dx / SOUND.panWidth)) * SOUND.panAmount};
}
function sfx(name, x, y, reach) {
if (muted) return;
const m = sounds.manifest;
if (!m) { if (audio) loadSounds(); return; }
const s = m.sounds[name];
if (!s) { if (!sounds.warned.has(name)) { sounds.warned.add(name); console.warn(`sfx: unknown sound "${name}"`); } return; }
let vol = 1, pan = 0;
if (x !== undefined) {
const h = heard(x, y, reach || SOUND.hearing, s.category);
if (!h) return;
({vol, pan} = h);
}
const now = performance.now(), gap = SOUND.minGap[name] ?? SOUND.minGap.default;
if (now - (sounds.lastAt[name] || -1e9) < gap || sounds.voices >= SOUND.maxVoices || !awake()) return;
let k = Math.floor(Math.random() * s.files.length);
if (s.files.length > 1 && k === sounds.lastVariant[name]) k = (k + 1) % s.files.length;
const buf = sounds.buffers.get(s.files[k]);
if (!(buf instanceof AudioBuffer)) { loadSoundFile(s.files[k]); return; }
sounds.lastVariant[name] = k;
sounds.lastAt[name] = now;
try {
const a = ac(), src = a.createBufferSource(), g = a.createGain(), p = a.createStereoPanner();
src.buffer = buf;
if (s.pitch) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * SOUND.pitch;
g.gain.value = vol * (SOUND.mix[s.category] ?? 1) * soundShare(s.category);
p.pan.value = pan;
src.connect(g).connect(p).connect(soundOut);
sounds.voices++;
src.onended = () => { sounds.voices--; };
src.start();
} catch (e) {  }
}
let wind = null;
function fallWind(k) {
if (!audio || (muted && !wind)) return;
const t = audio.currentTime;
if (k < 0 || muted) { if (wind) { wind.gain.gain.setTargetAtTime(0, t, .03); wind.src.stop(t + .25); wind = null; } return; }
if (!wind) {
const buf = audio.createBuffer(1, audio.sampleRate, audio.sampleRate), d = buf.getChannelData(0);
for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
const src = audio.createBufferSource(), band = audio.createBiquadFilter(), gain = audio.createGain();
src.buffer = buf; src.loop = true; band.type = "bandpass"; band.Q.value = .9; gain.gain.value = 0;
src.connect(band).connect(gain).connect(soundOut); src.start();
wind = {src, band, gain};
}
wind.band.frequency.setTargetAtTime(350 + 1500 * k, t, .04);
wind.gain.gain.setTargetAtTime(SOUND.wind * k * k, t, .04);
}
function sfxPlaced(block, ground, x, y) {
const m = sounds.manifest;
if (!m) { if (audio) loadSounds(); return; }
sfx(m.place[block] || m.ground[ground] || "place", x, y);
}
const WOOD_CHARS = "TUtH#+&CBhLKgWVXJeqy?!rmFpz", STONE_CHARS = "M*%Y^Z", PLANT_CHARS = "bvfQ;\"wo";
function material(c) {
return WOOD_CHARS.includes(c) ? "wood" : STONE_CHARS.includes(c) ? "stone" : PLANT_CHARS.includes(c) ? "plant" : "soil";
}
const STRIKE = {wood: "chop", stone: "mine", plant: "rustle", soil: "dig"};
const BREAK = {wood: "snap", stone: "crumble", plant: "rustle", soil: "dig"};
const STEP = {n: "tock", ":": "tock", _: "click", "~": "wade", "(": "wade", "=": "wade", ")": "wade"};
const VOICE = {cow: "moo", calf: "moo", chicken: "cluck", chick: "chirp"};
const animalVoice = (kind) => VOICE[kind] || "cluck";
;
const BABBLE = {letter: .045, every: 2, piece: .085, most: 2.7, vowel: {a: 0, e: 2, i: 4, o: -2, u: -3, y: 3}};
const SHOUT = {up: 5, piece: .15, fall: 3, push: 2.2, bite: [2400, 5], level: 1, echo: [.21, .25]};
const shouted = (line) => (line.match(/\p{L}/gu) || []).length >= 3 && line === line.toUpperCase() && line !== line.toLowerCase();
let strain = null;
function voiceOf(name) { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 9 - 4; }
function babble(name, text, x, y, shout) {
if (muted) return 0;
const m = sounds.manifest;
if (!m) { if (audio) loadSounds(); return 0; }
const s = m.sounds.say;
if (!s) return 0;
let vol = 1, pan = 0;
if (x !== undefined && (myPos() || ears)) {
const h = heard(x, y, shout ? 30 : SOUND.hearing, "People");
if (!h) return 0;
({vol, pan} = h);
}
const bufs = s.files.map((f) => sounds.buffers.get(f)).filter((b) => b instanceof AudioBuffer);
if (!bufs.length) { s.files.forEach(loadSoundFile); return 0; }
let made = 0;
if (!awake()) return 0;
try {
const a = ac(), t0 = a.currentTime + .02, base = voiceOf(name) + (shout ? SHOUT.up : 0), letters = [...String(text).toLowerCase()];
const out = a.createGain(), p = a.createStereoPanner(), asks = /\?\s*$/.test(text);
out.gain.value = vol * (SOUND.mix[s.category] ?? 1) * soundShare(s.category) * (shout ? SHOUT.level : .85); p.pan.value = pan; p.connect(soundOut);
if (shout) {
if (!strain) { strain = new Float32Array(1024); for (let i = 0; i < 1024; i++) strain[i] = Math.tanh((i / 511.5 - 1) * SHOUT.push) / Math.tanh(SHOUT.push); }
const hard = a.createWaveShaper(), bite = a.createBiquadFilter(), late = a.createDelay(1), back = a.createGain();
hard.curve = strain; bite.type = "peaking"; bite.frequency.value = SHOUT.bite[0]; bite.gain.value = SHOUT.bite[1]; bite.Q.value = .9;
late.delayTime.value = SHOUT.echo[0]; back.gain.value = SHOUT.echo[1];
out.connect(hard).connect(bite).connect(p); bite.connect(late).connect(back).connect(p); back.connect(late);
} else out.connect(p);
let run = 0;
letters.forEach((ch, i) => {
const at = i * BABBLE.letter;
if (at > BABBLE.most) return;
if (!/[a-z0-9ß-ɏ]/.test(ch)) { run = 0; return; }
if (run++ % BABBLE.every) return;
const code = ch.charCodeAt(0), buf = bufs[code % bufs.length], last = letters.length - 1 - i;
const semis = base + (BABBLE.vowel[ch] ?? code % 5 - 2) + (asks && last < 8 ? (8 - last) * .5 : 0);
const rate = 2 ** (semis / 12), len = Math.min(shout ? SHOUT.piece : BABBLE.piece, buf.duration / rate - .02);
const src = a.createBufferSource(), g = a.createGain();
src.buffer = buf; src.playbackRate.value = rate;
if (shout) { src.playbackRate.setValueAtTime(rate * 2 ** (1 / 12), t0 + at); src.playbackRate.exponentialRampToValueAtTime(rate * 2 ** (-SHOUT.fall / 12), t0 + at + len); }
g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(1, t0 + at + .006);
g.gain.setValueAtTime(1, t0 + at + len - .025); g.gain.linearRampToValueAtTime(0, t0 + at + len);
src.connect(g).connect(out);
src.start(t0 + at, 0, len * rate + .01); made++;
});
} catch (e) {  }
return made;
}
const written = (text, since) => text.slice(0, Math.max(0, Math.floor(since / BABBLE.letter) + 1));
;
const parts = [], shakes = new Map(), pops = new Map(), falls = [], flashes = new Map();
const sprCols = new Map();
function spriteColors(spr) {
const [img, sx0, sy0, w, h] = spr, key = (img.src || "c") + sx0 + "," + sy0;
if (sprCols.has(key)) return sprCols.get(key);
const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
g.drawImage(img, sx0, sy0, w, h, 0, 0, w, h);
const d = g.getImageData(0, 0, w, h).data, n = new Map();
for (let i = 0; i < d.length; i += 4) {
if (d[i + 3] < 200 || d[i] + d[i + 1] + d[i + 2] < 180) continue;
const k = "#" + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
n.set(k, (n.get(k) || 0) + 1);
}
const cols = [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
sprCols.set(key, cols.length ? cols : PCOL.dust); return sprCols.get(key);
}
const PCOL = {T: ["#6b4b35", "#8f6a45", "#7fb069", "#5e8c4f"], H: ["#5e8c4f", "#7fb069"], b: ["#c0504a", "#7fb069", "#8a5aa0"],
M: ["#8a8f8c", "#b6bab1", "#5d6260"], "*": ["#8a8f8c", "#f5d77a", "#b6bab1"], Q: ["#c0504a", "#f4f0e6"],
w: ["#e0c35a", "#7fb069"], "\"": ["#7fb069"], "#": ["#a8775a", "#6b4a3a"], "%": ["#8a8f8c", "#b6bab1"], o: ["#b48b5c", "#8c6a44"],
C: ["#a8775a", "#c8a45c"], "&": ["#a8775a", "#6b4a3a"], dust: ["#e9d9b4", "#d8c59c"], water: ["#bfe9f7", "#8fd3f4", "#ffffff"], spark: ["#fff1a8", "#ffd36a", "#ffffff"],
hit: ["#ffffff", "#ffd0cc"], rage: ["#f0503f", "#ffb347", "#fff1a8", "#f0503f"], food: ["#c0504a", "#e0c35a", "#fff1a8"], blood: ["#d9473a", "#ffffff"]};
function debris(x, y, spr, n, opts = {}) {
const cols = spr ? spriteColors(spr) : PCOL[opts.kind] || PCOL.dust;
n = particles(n);
for (let i = 0; i < n; i++) parts.push({
x: x + .5 + (Math.random() - .5) * .5, y: y + .45 + (opts.dy || 0) + (Math.random() - .5) * .2,
vx: (Math.random() - .5) * 2.4, vy: -1.2 - Math.random() * 1.6, g: 11,
floor: y + .62 + Math.random() * .3, life: .9 + Math.random() * .5, age: 0, c: cols[i % cols.length], s: 1});
if (opts.dust) for (let i = 0; i < particles(3); i++) parts.push({
x: x + .3 + Math.random() * .4, y: y + .6, vx: (Math.random() - .5) * .6, vy: -.5 - Math.random() * .4, g: -.2,
life: .5 + Math.random() * .3, age: 0, c: "rgba(236,226,206,.7)", s: 2});
}
function burst(x, y, kind, n, opts = {}) {
const cols = PCOL[kind] || PCOL.dust;
n = particles(n);
for (let i = 0; i < n; i++) parts.push({
x: x + .5 + (Math.random() - .5) * .5, y: y + .5 + (opts.dy || 0) + (Math.random() - .5) * .4,
vx: (Math.random() - .5) * (opts.spread || 3), vy: -Math.random() * (opts.up || 3) - .5,
g: opts.g ?? 9, life: opts.life || (.4 + Math.random() * .4), age: 0, c: cols[i % cols.length], s: opts.size || (Math.random() < .3 ? 2 : 1)});
}
const KICK = {".": ["#7fb069", "#5e8c4f"], ",": ["#7fb069", "#5e8c4f"], "'": ["#7fb069", "#5e8c4f"], o: ["#e0cf9a", "#cdb97f"], ":": ["#8a8f8c", "#b6bab1"], n: ["#8a8f8c", "#b6bab1"], _: ["#a8775a", "#8c6a44"]};
function kickDust(p) {
if (opt("particles") !== "all") return;
const fx = p.fx || 0, fy = p.fy || 0, x = p.x + .5 - fx * .3, y = p.y + .88 - UP - fy * .25, r = Math.random;
for (let i = 0; i < 5; i++) parts.push({x: x + (r() - .5) * .3, y: y + (r() - .5) * .12, vx: -fx * (1 + r() * 1.4) + (r() - .5) * .7,
vy: -fy * (.8 + r()) - .25 - r() * .5, g: -.6, life: i < 2 ? .28 + r() * .1 : .45 + r() * .3, age: 0, c: i % 2 ? "rgba(233,217,180,.8)" : "rgba(246,238,216,.8)", s: i < 2 ? 3 : i < 4 ? 2 : 1});
const bits = KICK[gndAt(Math.round(p.x), Math.round(p.y))] || PCOL.dust;
for (let i = 0; i < 3; i++) parts.push({x: x + (r() - .5) * .3, y, vx: -fx * (1.2 + r() * 1.6) + (r() - .5) * 1.2, vy: -1.6 - r() * 1.4 - fy * .6, g: 12,
floor: y + .04 + r() * .12 - fy * .3, life: .45 + r() * .25, age: 0, c: bits[i % bits.length], s: 1});
}
const EMOTE = {happy: [0, 2], laugh: [1, 2], love: [0, 9], star: [0, 10], bang: [5, 8], what: [6, 8], music: [7, 8],
sleep: [9, 8], skull: [7, 0], ok: [0, 8], no: [2, 8]};
const emotes = new Map();
function emote(name, kind) { if (name && EMOTE[kind]) emotes.set(name, {kind, t0: performance.now()}); }
function emoteFor(text) {
const t = text.toLowerCase();
if (/<3|love|thank|merci/.test(t)) return "love";
if (/haha|lol|:\)|:d|\^\^/.test(t)) return "laugh";
if (/\?$/.test(t)) return "what";
if (/!$/.test(t)) return "bang";
if (/♪|la la|sing/.test(t)) return "music";
if (/\b(no|nope|non)\b/.test(t)) return "no";
if (/\b(ok|yes|sure|oui|deal)\b/.test(t)) return "ok";
return null;
}
function drawEmote(p, sx, sy, S) {
const key = p.e.name || p.e.kind + p.e.id, em = emotes.get(key); if (!em) return;
const k = (performance.now() - em.t0) / 1000; if (k > 1.8) { emotes.delete(key); return; }
const [c, rr] = EMOTE[em.kind], pop = k < .15 ? .6 + k / .15 * .5 : k < .25 ? 1.1 - (k - .15) : 1;
const size = Math.round(16 * zoom * .75 * pop), o = overBody(p, S), x = Math.round(sx(p.x) + S / 2 - size / 2 + o[0]);
const head = p.e.kind === "agent" ? 9 * zoom + 18 : ANIMALS[p.e.kind] && ANIMALS[p.e.kind].fw === 32 ? 12 * zoom : 2 * zoom;
const y = Math.round(bodyY(p, sy) + o[1] - head - size);
ctx.globalAlpha = k > 1.5 ? (1.8 - k) / .3 : 1;
ctx.drawImage(IMG.emoji, c * 32, rr * 32, 32, 32, x, y, size, size);
ctx.globalAlpha = 1;
}
function floatText(x, y, text, color) { floats.push({x, y, text, color, t: performance.now() / 1000}); }
function felled(x, y, who, now) {
const spr = objectSprite("T", x, y, now / 1000), thin = !!spr && spr[0] === IMG.trees;
const c = who && [...ents.values()].find((q) => q.e && q.e.name === who), side = c && c.x > x ? -1 : 1;
sfx("creak", x, y);
setTimeout(() => { sfx("fallthud", x, y); sfx("rustle", x, y); }, 5 / 14 * 1000);
falls.push({x, y, t0: now, side, thin});
}
const flyers = [];
const FRUIT_G = 30, BOUNCE_MS = 150, REST_MS = 160;
const FLY_MS = 420;
function picked(x, y, old, by, now) {
const key = x + "," + y, tree = old === "F";
shakes.set(key, now);
const [ix, iy] = tree ? FRUIT_ICON[fruitKind(x, y)] : BERRY_ICON[Math.floor(hash(x, y, 21) * 3)];
if (!tree) {
[[.2, .1], [.75, .2]].forEach(([dx, dy], i) => flyers.push({x: x + dx, y: y + dy, ix, iy, by, t0: now + 80 + i * 90}));
return;
}
[[-.1, -1.3, .55], [1.05, -1.1, .6]].forEach(([dx, top, ground], i) => {
const start = now + 60 + i * 110, fall = Math.sqrt(2 * (ground - top) / FRUIT_G) * 1000;
flyers.push({x: x + dx, y: y + ground, ix, iy, by, drop: {top: y + top, t0: start, fall}, t0: start + fall + BOUNCE_MS + REST_MS});
});
}
function drawFlyers(sx, sy, S, now) {
const z = zoom;
for (let i = flyers.length - 1; i >= 0; i--) {
const f = flyers[i], k = (now - f.t0) / FLY_MS;
if (k >= 1) { flyers.splice(i, 1); continue; }
const who = f.by && [...ents.values()].find((q) => q.e && q.e.name === f.by);
let x = f.x, y = f.y, gone = false;
if (k < 0 && !f.drop) continue;
if (k < 0) {
const tf = (now - f.drop.t0) / 1000;
if (tf < 0) continue;
if (tf * 1000 < f.drop.fall) y = f.drop.top + .5 * FRUIT_G * tf * tf;
else { const b = (tf * 1000 - f.drop.fall) / BOUNCE_MS; if (b < 1) y = f.y - Math.sin(b * Math.PI) * .14; }
if (tf * 1000 - f.drop.fall > 0 && !f.landed) { f.landed = true; sfx("plant", f.x, f.y); }
} else if (who) {
const tx = who.x + .5, ty = who.y + .1 - UP, e = k * k * (3 - 2 * k);
x = f.x + (tx - f.x) * e; y = f.y + (ty - f.y) * e - Math.sin(k * Math.PI) * 1.1;
} else { y -= k * .8; gone = true; }
ctx.globalAlpha = gone ? 1 - k : k > .7 ? (1 - k) / .3 : 1;
ctx.drawImage(IMG.trees, f.ix, f.iy, 16, 16, Math.round(sx(x) - 8 * z), Math.round(sy(y, x) - 8 * z), 16 * z, 16 * z);
}
ctx.globalAlpha = 1;
}
const clumpCache = new Map();
function clumpsOf(spr) {
const [img, a, b, w, h] = spr, key = (img.src || "c") + a + "," + b;
if (clumpCache.has(key)) return clumpCache.get(key);
const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
g.drawImage(img, a, b, w, h, 0, 0, w, h);
const d = g.getImageData(0, 0, w, h).data, out = [];
for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
const i = (y * w + x) * 4;
if (d[i + 3] > 200) out.push({x, y, c: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`});
}
clumpCache.set(key, out); return out;
}
function shatter(x, y, spr) {
const [, , , w, h, dx, dy] = spr, cx = (dx + w / 2) / 16, cy = (dy + h / 2) / 16;
for (const q of clumpsOf(spr)) {
const px = (dx + q.x + 1) / 16, py = (dy + q.y + 1) / 16, ox = px - cx, oy = py - cy;
parts.push({x: x + px, y: y + py, vx: ox * 2.2 + (Math.random() - .5) * .5, vy: -.4 - Math.random() * .7, g: 9,
floor: y + .62 + Math.random() * .3, life: .45 + Math.random() * .35, age: 0, c: q.c, s: 2});
}
}
const PLUCKED = "Qf;\"w";
const plucks = [];
const TUG_MS = 140, PLUCK_MS = 420;
function plucked(x, y, spr, who, now) {
plucks.push({x, y, spr, by: who, t0: now});
debris(x, y, null, 4, {kind: "o"});
}
function drawPlucks(sx, sy, S, now) {
const z = zoom;
for (let i = plucks.length - 1; i >= 0; i--) {
const f = plucks[i], ms = now - f.t0;
if (ms > TUG_MS + PLUCK_MS) { plucks.splice(i, 1); continue; }
const [img, a, b, w, h, dx, dy] = f.spr;
let ox = 0, oy = 0, sc = 1, stretch = 1, alpha = 1;
if (ms < TUG_MS) { const k = ms / TUG_MS; oy = -Math.sin(k * Math.PI / 2) * .25; stretch = 1 + Math.sin(k * Math.PI) * .18; }
else {
const k = (ms - TUG_MS) / PLUCK_MS, e = k * k * (3 - 2 * k);
const who = f.by && [...ents.values()].find((q) => q.e && q.e.name === f.by);
if (who) { ox = (who.x - f.x) * e; oy = -.25 + (who.y - .3 - f.y + .25) * e - Math.sin(k * Math.PI) * .8; sc = 1 - k * .55; }
else { oy = -.25 - k * .6; alpha = 1 - k; }
if (k > .8) alpha = Math.min(alpha, (1 - k) / .2);
}
const ww = w * z * sc, hh = h * z * sc * stretch;
const cx = sx(f.x + ox) + (dx + w / 2) * z, by = sy(f.y + oy, f.x + ox) + (dy + h) * z;
ctx.globalAlpha = alpha;
ctx.drawImage(img, a, b, w, h, Math.round(cx - ww / 2), Math.round(by - hh), Math.round(ww), Math.round(hh));
}
ctx.globalAlpha = 1;
}
const dying = [], puffs = [];
const DIE_MS = 480;
function dyingPoof(p, now) {
dying.push({p: {...p, e: {...p.e, love: false, doing: null}, moved: 0}, y0: p.y, t0: now});
smoke(p.x, p.y, 8);
}
function smoke(x, y, n, size = 1) {
n = particles(n);
for (let i = 0; i < n; i++) puffs.push({x: x + .5 + (Math.random() - .5) * .7, y: y + .35 + (Math.random() - .5) * .35,
vx: (Math.random() - .5) * .7, vy: -.35 - Math.random() * .45, r: (1.5 + Math.random() * 1.5) * size, grow: (4 + Math.random() * 4) * size,
life: .65 + Math.random() * .45, age: -i * .025});
}
function drawDying(sx, sy, S, t, now) {
for (let i = dying.length - 1; i >= 0; i--) {
const d = dying[i], k = (now - d.t0) / DIE_MS;
if (k >= 1) { dying.splice(i, 1); continue; }
d.p.y = d.y0 - k * .35;
ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.filter = k < .3 ? "brightness(2.4) saturate(.4)" : "brightness(1.4)";
drawEntity(d.p, sx, sy, S, t, now);
ctx.restore();
}
}
function pixelOval(gx, gy, rx, ry, mx = 0, my = mx, ring = false) {
const z = zoom, half = (a, b, j) => { const t = (j + .5 - my) / b; return b > 0 && t * t < 1 ? a * Math.sqrt(1 - t * t) : -1; };
gx = Math.round(gx); gy = Math.round(gy);
for (let j = Math.floor(my - ry); j < Math.ceil(my + ry); j++) {
const d = half(rx, ry, j), i0 = Math.ceil(mx - d - .5), i1 = Math.floor(mx + d - .5);
if (d < 0 || i1 < i0) continue;
const e = ring ? half(rx - 1, ry - 1, j) : -1, a0 = Math.ceil(mx - e - .5), a1 = Math.floor(mx + e - .5);
if (!ring || e < 0 || a1 < a0) { ctx.fillRect(gx + i0 * z, gy + j * z, (i1 - i0 + 1) * z, z); continue; }
if (a0 > i0) ctx.fillRect(gx + i0 * z, gy + j * z, (a0 - i0) * z, z);
if (i1 > a1) ctx.fillRect(gx + (a1 + 1) * z, gy + j * z, (i1 - a1) * z, z);
}
}
function drawPuffs(sx, sy, dt) {
const z = zoom;
for (let i = puffs.length - 1; i >= 0; i--) {
const p = puffs[i]; p.age += dt;
if (p.age > p.life) { puffs.splice(i, 1); continue; }
if (p.age < 0) continue;
const k = p.age / p.life, r = p.r + p.grow * k;
p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97;
const cx = sx(p.x), cy = syUp(sy, p.y, liftFrom(p)), a = (1 - k) * .85;
ctx.fillStyle = `rgba(246,240,228,${a})`; pixelOval(cx, cy, r, r);
if (r >= 2) { ctx.fillStyle = `rgba(150,128,116,${a * .6})`; pixelOval(cx, cy, r, r, 0, 0, true); }
}
}
function drawEffects(sx, sy, S, dt) {
const z = zoom;
for (let i = parts.length - 1; i >= 0; i--) {
const p = parts[i]; p.age += dt;
if (p.age > p.life) { parts.splice(i, 1); continue; }
p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
if (p.floor !== undefined && p.y > p.floor) {
p.y = p.floor; p.vx *= .5;
p.vy = Math.abs(p.vy) > 1.2 ? -p.vy * .3 : 0;
if (!p.vy) { p.g = 0; p.vx *= .6; }
}
ctx.globalAlpha = Math.min(1, 3.3 * (1 - p.age / p.life));
ctx.fillStyle = p.c;
ctx.fillRect(Math.round(sx(p.x)), Math.round(syUp(sy, p.y, liftFrom(p))), p.s * z, p.s * z);
}
ctx.globalAlpha = 1;
const now = performance.now();
drawFlyers(sx, sy, S, now);
for (let i = falls.length - 1; i >= 0; i--) {
const f = falls[i], k = (now - f.t0) / 1000, fr = Math.floor(k * 14);
if (fr >= 12) { falls.splice(i, 1); continue; }
ctx.globalAlpha = fr >= 9 ? 1 - (fr - 9) / 3 : 1;
const [bx, by] = brink(f.x, f.y), x0 = sx(f.x) + bx * z;
if (f.side > 0) { ctx.save(); ctx.translate(x0 + 8 * z, 0); ctx.scale(-1, 1); ctx.translate(-(x0 + 8 * z), 0); }
ctx.drawImage(f.thin ? IMG.thin_fall : IMG.tree_fall, fr * 64, 0, 64, 48, x0 - 32 * z, sy(f.y, f.x) + (by - 28) * z, 64 * z, 48 * z);
if (f.side > 0) ctx.restore();
ctx.globalAlpha = 1;
}
}
;
const loot = [];
const LOOT_G = 26;
const PILE_AT = [[[0, 0]], [[-3, 0], [3, 1]], [[-4, -1], [4, -1], [0, 1]]];
const pileAt = (i, n) => PILE_AT[Math.min(3, n) - 1][i];
const ghosts = new Map(), smalls11 = new Map(), DROP = 11, DROP_AT = [0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 16];
const smallCanvas = (name) => {
const cv = document.createElement("canvas"), px = smallPx(name); cv.width = cv.height = DROP;
cv.getContext("2d").putImageData(px, (DROP - px.width) >> 1, (DROP - px.height) >> 1); return cv;
};
const ghostIcon = (n) => ghosts.get(n) || (ghosts.set(n, smallCanvas(n)), ghosts.get(n));
function smallPx(name) {
if (smalls11.has(name)) return smalls11.get(name);
const ic = ICONS[name];
if (ic && ic[0] !== "gen" && (ic[3] > 16 || ic[4] > 16)) {
smalls11.set(name, smallArt(IMG[ic[0]], ic[1], ic[2], ic[3], ic[4], DROP)); return smalls11.get(name);
}
const d = iconCanvas(name).getContext("2d").getImageData(0, 0, 16, 16).data;
const solid = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && d[(y * 16 + x) * 4 + 3] >= 128;
const rim = (x, y, o) => solid(x, y) && Math.min(d[o], d[o + 1], d[o + 2]) > 225 && [-1, 0, 1].some((a) => [-1, 0, 1].some((b) => !solid(x + a, y + b)));
let white = 0, round = 0;
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
const [dx, dy] = pileAt(i, all.length);
const flight = .42 + Math.random() * .08;
loot.push({x, y, name, dx, dy, t0: now + 90 + i * 70, flight, vy: -LOOT_G * flight / 2});
});
}
const lootAt = (x, y) => loot.some((l) => l.x === x && l.y === y);
const LOOT_HOPS = [.16, .08];
const lootRests = (l, now) => (now - l.t0) / 1000 >= l.flight + LOOT_HOPS[0] + LOOT_HOPS[1];
function drawLoot(sx, sy, S, now, list) {
const z = zoom;
for (let i = loot.length - 1; i >= 0; i--) {
const l = loot[i];
if (!lootRests(l, now) || loot.some((m) => m.x === l.x && m.y === l.y && !lootRests(m, now))) continue;
if (!l.landed) sfx("loot", l.x, l.y);
loot.splice(i, 1);
}
loot.forEach((l, i) => {
const s = (now - l.t0) / 1000;
if (s < 0) return;
let h = 0, dxk = 1, since = 1;
if (s < l.flight) { h = -(l.vy * s + LOOT_G * s * s / 2); dxk = s / l.flight; }
else {
if (!l.landed) { l.landed = true; sfx("loot", l.x, l.y); }
let t = s - l.flight, n = 0;
while (n < LOOT_HOPS.length && t > LOOT_HOPS[n]) t -= LOOT_HOPS[n++];
if (n < LOOT_HOPS.length) { h = LOOT_G * LOOT_HOPS[n] / 2 * t - LOOT_G * t * t / 2; since = t; }
}
const cx = sx(l.x) + S / 2 + Math.round(l.dx * dxk) * z, ground = sy(l.y, l.x) + S / 2 + Math.round(l.dy * dxk) * z;
const dip = s > l.flight && since < .05 ? 1 : 0;
list.push({y: l.y - .01 + i * 1e-4, x: l.x, fx: () => {
ctx.fillStyle = "rgba(60,40,30,.25)";
pixelOval(cx, ground + 5 * z, Math.max(1, 4 - h * 4), 1.5, 0, .5);
ctx.drawImage(ghostIcon(l.name), 0, 0, DROP, DROP - dip, Math.round(cx - DROP * z / 2), Math.round(ground - DROP * z / 2 - h * S) + dip * z, DROP * z, (DROP - dip) * z);
}});
});
}
;
const orbs = [], magnets = [];
let xpKnown = null, xpLevelShown = null;
function levelOf(xp) {
let level = 0, need = 7;
while (xp >= need) { xp -= need; level++; need = 7 + 3 * level; }
return [level, xp, need];
}
function spawnOrbs(e) {
if (e.name === me && xpKnown !== null) xpKnown += e.n;
const k = Math.min(e.n, 7);
for (let i = 0; i < k; i++) {
const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 1.6;
orbs.push({x: e.x + .5, y: e.y + .5, h: .2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .6, vh: 3 + Math.random() * 2.5,
who: e.name, value: e.n / k, age: -i * .04, homing: .35 + Math.random() * .25, big: e.n / k >= 2, seed: Math.random() * 9,
lift: liftAt(e.x, e.y)});
}
}
function magnetItems(e) {
groundItems = groundItems.filter(([x, y]) => x !== e.x || y !== e.y);
Object.keys(e.items || {}).slice(0, 3).forEach((name, i) =>
magnets.push({x: e.x + .5 + (i - 1) * .2, y: e.y + .5, name, who: e.name, age: -i * .05, lift: liftAt(e.x, e.y)}));
}
const playerNamed = (name) => [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === name);
function drawOrbs(sx, sy, S, dt, list) {
const z = zoom;
for (let i = orbs.length - 1; i >= 0; i--) {
const o = orbs[i]; o.age += dt;
if (o.age < 0) continue;
const p = playerNamed(o.who);
if (!p || o.age > 4) { orbs.splice(i, 1); continue; }
if (o.age < o.homing) {
o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= .9; o.vy *= .9;
o.vh -= 22 * dt; o.h = Math.max(0, o.h + o.vh * dt);
if (o.h === 0) o.vh = Math.abs(o.vh) * .4;
} else {
const tx = p.x + .5, ty = p.y + .35 - UP, dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
const sp = Math.min(14, 3 + (o.age - o.homing) * 18);
if (d < .25) { orbs.splice(i, 1); orbLanded(o); continue; }
o.x += dx / d * Math.min(d, sp * dt); o.y += dy / d * Math.min(d, sp * dt); o.h *= .85;
o.lift += (liftOf(p) - o.lift) * Math.min(1, dt * 12);
}
const cx = Math.round(sx(o.x) / z) * z, cy = Math.round((syUp(sy, o.y, o.lift) - o.h * S * .5) / z) * z;
const shape = o.big ? ORB_BIG : ORB, flick = Math.sin(o.age * 14 + o.seed) > 0;
list.push({y: o.y - .45, x: o.x, fx: () => drawOrb(cx, cy, shape, flick)});
}
for (let i = magnets.length - 1; i >= 0; i--) {
const m = magnets[i]; m.age += dt;
if (m.age < 0) continue;
const p = playerNamed(m.who);
const k = Math.min(1, m.age / .28);
if (!p || k >= 1) { magnets.splice(i, 1); if (p) sfx("collect", p.tx, p.ty); continue; }
const e = k * k, x = m.x + (p.x + .5 - m.x) * e, y = m.y + (p.y + .3 - UP - m.y) * e - Math.sin(k * Math.PI) * .35;
const sz = DROP * z, lift = m.lift + (liftOf(p) - m.lift) * e, a = k > .7 ? (1 - k) / .3 : 1;
list.push({y: y - .45, x, fx: () => { ctx.globalAlpha = a; ctx.drawImage(ghostIcon(m.name), Math.round(sx(x) - sz / 2), Math.round(syUp(sy, y, lift) - sz / 2), sz, sz); ctx.globalAlpha = 1; }});
}
}
const ORB = [".ooo.", "owyyo", "oyyyo", "oyyyo", ".ooo."];
const ORB_BIG = ["..ooo..", ".owwyo.", "owyyyyo", "oyyyyyo", "oyyyyyo", ".oyyyo.", "..ooo.."];
function drawOrb(cx, cy, shape, flick) {
const z = zoom, n = shape.length, x0 = cx - Math.floor(n / 2) * z, y0 = cy - Math.floor(n / 2) * z;
ctx.fillStyle = "rgba(220,255,140,.25)"; pixelOval(cx, cy, n / 2 + 2, n / 2 + 2, .5);
const col = {o: "#4f8a2a", y: flick ? "#b9e45a" : "#dcf27a", w: "#fffbd8"};
shape.forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") { ctx.fillStyle = col[c]; ctx.fillRect(x0 + i * z, y0 + j * z, z, z); } }));
}
function orbLanded(o) {
const p = playerNamed(o.who);
if (p) { sfx("orb", p.tx, p.ty); burst(p.x, p.y, "spark", 2, {dy: -.4, g: 3}); }
}
function drawXp() {
if (!meObs) return;
const flying = orbs.filter((o) => o.who === me).reduce((n, o) => n + o.value, 0);
if (xpKnown === null || !flying) xpKnown = meObs.self.xp || 0;
const [level, into, need] = levelOf(Math.max(0, Math.floor(xpKnown - flying + 1e-6)));
if (xpLevelShown !== null && level > xpLevelShown) {
sfx("levelup");
const p = ents.get("agent" + myId);
if (p) { burst(p.x, p.y, "spark", 18, {dy: -.6, g: 2, spread: 1.4}); floats.push({x: p.tx, y: p.ty - .4, text: `Level ${level}!`, color: "#d8f070", t: performance.now() / 1000}); }
}
xpLevelShown = level;
drawXpBar(into / need, level);
}
const TRACK = [36, 36, 40, 7], XP_K = 2;
function drawXpBar(k, level) {
const cv = $("xpbar"), dpr = window.devicePixelRatio || 1, thumbs = document.body.classList.contains("touch");
const bar = hudSide ? 99 * Math.max(1, Math.round(hudK * dpr)) / dpr : Math.max((BAR * 32 - 2) * hudU, 198 * Math.max(1, Math.round(hudK * dpr)) / dpr + (thumbs ? 18 : 8));
const SC0 = Math.max(1, Math.round(XP_K * dpr)), w = Math.max(40, Math.floor(bar * dpr / SC0 + 1e-6)), h = TRACK[3];
const lv = level ? String(level) : "";
if ($("xplevel").textContent !== lv) $("xplevel").textContent = lv;
const sig = [w, Math.round(k * w), dpr].join();
if (cv.dataset.sig === sig) return;
cv.dataset.sig = sig;
const [g, SC] = pixelCanvas(cv, w, h, XP_K);
const [tx, ty, tw, th] = TRACK, cap = 4;
const part = (sx, sw, dx, dw) => g.drawImage(IMG.sliders, sx, ty, sw, th, dx * SC, 0, dw * SC, th * SC);
part(tx, cap, 0, cap); part(tx + cap, tw - 2 * cap, cap, w - 2 * cap); part(tx + tw - cap, cap, w - cap, cap);
const fill = Math.round(k * (w - 4));
if (fill > 0) {
g.fillStyle = "#86bb3a"; g.fillRect(2 * SC, 2 * SC, fill * SC, 3 * SC);
g.fillStyle = "#c8ea5a"; g.fillRect(2 * SC, 2 * SC, fill * SC, SC);
}
}
;
const CROPS = ["wheat", "pumpkin", "cauliflower", "lettuce", "eggplant", "carrot"];
const CROP_ROW = {wheat: 8, pumpkin: 9, cauliflower: 3, lettuce: 7, eggplant: 5, carrot: 2};
const cropSpecies = (x, y) => CROPS[((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % CROPS.length];
const FLOWERS = [[0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [8, 3], [9, 3], [10, 3], [11, 3],
[0, 4], [1, 4], [4, 4], [5, 4], [6, 4], [8, 4], [9, 4], [10, 4], [11, 4]];
const ANIMALS = {
chicken: {fw: 16, idle: [0, 4, 220], walk: [2, 8, 90], alt: [0, 4, 260], sleep: [8, 4, 400], love: [26, 7, 140], hearts: [25, 7]},
chick: {fw: 16, idle: [0, 4, 220], walk: [2, 8, 80], alt: [0, 4, 260], sleep: [8, 4, 400], love: [14, 7, 140], hearts: [13, 7]},
cow: {fw: 32, idle: [0, 3, 260], walk: [1, 8, 90], alt: [6, 4, 220], sleep: [4, 4, 400], love: [7, 6, 160]},
calf: {fw: 32, idle: [0, 2, 300], walk: [6, 8, 90], alt: [7, 4, 220], sleep: [4, 4, 400], love: [8, 6, 160]},
};
const WILD = {
tusker: {cw: 32, ch: 32, idle: [0, 8, 260], walk: [8, 8, 90], warn: [16, 4, 170], run: [20, 8, 55]},
pincer: {cw: 24, ch: 16, idle: [0, 8, [800, 300, 300, 600, 140, 500, 140, 600]], walk: [8, 8, 80], act: [16, 5, [140, 420, 80, 220, 220]]},
strawman: {cw: 32, ch: 32, idle: [0, 4, [900, 900, 500, 180]], walk: [4, 8, 110], act: [12, 4, [520, 90, 260, 300]]},
wisp: {cw: 32, ch: 32, idle: [0, 8, 140], walk: [8, 8, 90], act: [16, 6, [220, 300, 90, 160, 160, 160]]},
wyrm: {cw: 48, ch: 32, idle: [0, 8, 150], walk: [8, 8, 95], act: [16, 4, [480, 90, 240, 280]]},
mossback: {cw: 80, ch: 64, hp: 60, sleep: [0, 8, 320], idle: [8, 8, 240], walk: [16, 8, 120], stomp: [24, 7, [160, 300, 220, 80, 180, 220, 200]], snap: [31, 7, [180, 200, 200, 70, 260, 140, 180]], shake: [38, 11, [180, 150, 150, 90, 90, 90, 90, 100, 110, 180, 200]], once: ["stomp", "snap", "shake"]},
sporeling: {cw: 24, ch: 24, idle: [0, 8, 240], walk: [8, 8, 75], land: [16, 6, [80, 80, 160, 120, 90, 140]], puff: [22, 6, [150, 150, 90, 130, 150, 140]], once: ["land", "puff"]},
};
function wildFrame([col, n, ms], t, loop) {
if (!Array.isArray(ms)) return col + (loop ? Math.floor(t / ms) % n : Math.min(n - 1, Math.floor(t / ms)));
const all = ms.reduce((a, b) => a + b, 0);
t = loop ? t % all : Math.min(t, all - 1);
let i = 0;
while (t >= ms[i]) t -= ms[i++];
return col + i;
}
const TUSK_FX = {paw: 170, tear: 40, snort: 520};
function tuskerFx(p, e, now) {
const [fx, fy] = e.dir || [p.fx || 0, p.fy || 1], r = Math.random, bits = KICK[gndAt(Math.round(p.x), Math.round(p.y))] || PCOL.dust;
const due = (k) => now - (p[k] || 0) > TUSK_FX[k] && (p[k] = now);
if (e.act === "windup" && due("paw")) {
const x = p.x + .5 + fx * .3, y = p.y + .9 - UP + fy * .2;
for (let i = 0; i < 3; i++) parts.push({x: x + (r() - .5) * .3, y, vx: -fx * (1.5 + r() * 1.5) + (r() - .5) * .8, vy: -fy * (1 + r()) - .5 - r() * .8, g: -.4,
life: .3 + r() * .25, age: 0, c: "rgba(236,222,190,.85)", s: i ? 2 : 3});
parts.push({x, y, vx: -fx * (2 + r() * 2) + (r() - .5), vy: -2 - r() * 1.5 - fy, g: 12, floor: y + .05 + r() * .1 - fy * .4, life: .5, age: 0, c: bits[0], s: 1});
}
if (e.act === "charge" && due("tear")) {
const x = p.x + .5 - fx * .6, y = p.y + .9 - UP - fy * .45;
for (let i = 0; i < 3; i++) parts.push({x: x + (r() - .5) * .5, y: y + (r() - .5) * .2, vx: -fx * (.6 + r() * 1.6) + (r() - .5) * 1.4, vy: -fy * (.5 + r()) - .3 - r() * .9, g: -.8,
life: .4 + r() * .45, age: 0, c: i % 2 ? "rgba(233,217,180,.85)" : "rgba(246,238,216,.85)", s: i === 0 ? 4 : i === 1 ? 3 : 2});
for (let i = 0; i < 2; i++) parts.push({x: x + (r() - .5) * .5, y, vx: -fx * (1 + r() * 2) + (r() - .5) * 2.2, vy: -2 - r() * 2.2 - fy * .5, g: 13,
floor: y + .05 + r() * .15 - fy * .4, life: .55 + r() * .3, age: 0, c: bits[i % bits.length], s: r() < .3 ? 2 : 1});
}
if (e.angry && due("snort")) {
const x = p.x + .5 + fx * .7, y = p.y + .45 - UP + fy * .35, side = fx ? [0, 1] : [1, 0];
for (const s of [-1, 1]) for (let i = 0; i < 3; i++) parts.push({x, y, vx: fx * (.8 + r() * .8) + side[0] * s * (.9 + i * .5), vy: fy * .6 + side[1] * s * (.5 + i * .3) - .7 - r() * .4, g: -1.6,
life: .35 + i * .12, age: 0, c: i ? "rgba(255,255,255,.8)" : "rgba(255,238,230,.9)", s: i === 2 ? 1 : 2});
if (r() < .6) parts.push({x: p.x + .5 + (r() - .5) * .6, y: p.y + .1 - UP, vx: (r() - .5) * 2, vy: -2.5 - r() * 1.5, g: 6, life: .45, age: 0, c: r() < .5 ? "#f0503f" : "#ffb347", s: 1});
}
}
const ANGER = [".r...r.", "rr...rr", ".......", "rr...rr", ".r...r."];
function drawWild(p, x, y, now) {
const e = p.e, A = WILD[e.kind], z = zoom;
const moving = now - p.moved < 350 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
if (A.once ? e.act !== p.act && A.once.includes(e.act) : e.act === "windup" && p.act !== "windup") {
p.windAt = now; p.anim = e.act; p.animDir = e.dir;
}
p.act = e.act;
if (e.kind === "tusker") tuskerFx(p, e, now);
const since = now - (p.windAt || -1e9), once = A.once ? A[p.anim] : A.act, acting = once && since < once[2].reduce((a, b) => a + b, 0);
const [fx, fy] = acting && p.animDir ? p.animDir : e.act && e.dir ? e.dir : [p.fx, p.fy], row = fy > 0 ? 0 : fy < 0 ? 1 : fx < 0 ? 2 : 3;
const calm = () => wildFrame(e.act === "sleep" ? A.sleep : moving ? A.walk : A.idle, now + e.id * 137, true);
let col, shake = 0;
if (A.warn) {
col = e.act === "windup" ? wildFrame(A.warn, since, true) : e.act === "charge" ? wildFrame(A.run, now, true) : calm();
if (e.act === "stun") shake = Math.round(Math.sin(now / 45)) * z;
} else col = acting ? wildFrame(once, since, false) : calm();
const blit = () => ctx.drawImage(IMG[e.kind], col * A.cw, row * A.ch, A.cw, A.ch, x - (A.cw - 16) / 2 * z + shake, y - (A.ch - 16) * z, A.cw * z, A.ch * z);
blit();
const fl = flashes.get(e.kind + e.id);
if (fl && now - fl < 120) { ctx.globalCompositeOperation = "lighter"; blit(); ctx.globalCompositeOperation = "source-over"; }
if (e.angry) {
const mx = x + 13 * z, my = y - (A.ch - 16) * z + 3 * z - (Math.floor(now / 170) % 2) * z;
ANGER.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "r") { ctx.fillStyle = "#6e1d1d"; ctx.fillRect(mx + i * z, my + (j + 1) * z, z, z); } }));
ANGER.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "r") { ctx.fillStyle = "#f0503f"; ctx.fillRect(mx + i * z, my + j * z, z, z); } }));
}
if (A.hp && e.act !== "sleep" && e.hp < A.hp) {
const w = 40 * z, bx = Math.round(x + 8 * z - w / 2), by = y - (A.ch - 12) * z;
ctx.fillStyle = "#5b3f36"; ctx.fillRect(bx - z, by - z, w + 2 * z, 4 * z);
ctx.fillStyle = e.hp * 2 > A.hp ? "#6aa66f" : "#d9473a"; ctx.fillRect(bx, by, Math.max(0, w * e.hp / A.hp), 2 * z);
}
}
const VARIANTS = {chicken: ["chicken", "chicken", "chicken_brown", "chicken_red", "chicken_blue", "chicken_green"],
cow: ["cow", "cow", "cow_light", "cow_pink", "cow_purple", "cow_green"],
chick: ["chick", "chick", "chick_brown", "chick_red", "chick_blue", "chick_green"],
calf: ["calf", "calf", "calf_light", "calf_pink", "calf_purple", "calf_green"]};
const animalSheet = (kind, id) => IMG[VARIANTS[kind][Math.floor(hash(id, 3, 91) * VARIANTS[kind].length)]];
const FRUITS = ["tree_apple", "tree_pear", "tree_peach", "tree_orange"];
const fruitKind = (x, y) => Math.floor(hash(x, y, 33) * 4);
const fruitSheet = (x, y) => IMG[FRUITS[fruitKind(x, y)]];
const FRUIT_ICON = [[16, 32], [80, 32], [112, 32], [48, 32]];
const BERRY_BUSH = [32, 48, 64];
const BERRY_ICON = [[16, 64], [48, 64], [64, 64]];
const chestOpen = new Map(), doors = new Map(), doorShut = new Map();
let occupied = new Set();
const CHAIR = {E: 64, W: 80, S: 96, N: 112};
function chairFaces(x, y) {
for (const far of [1, 2]) for (const [way, dx, dy] of [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]])
if ("L^".includes(combAt(x + dx * far, y + dy * far) || "-")) return way;
return "E";
}
function gateSide(x, y) {
const f = (dx, dy) => "#gW%".includes(combAt(x + dx, y + dy) || "-");
return (f(0, -1) || f(0, 1)) && !f(-1, 0) && !f(1, 0);
}
function fenceSprite(x, y) {
const f = (dx, dy) => { const c = combAt(x + dx, y + dy); return c === "#" || c === "+" || (c === "g" && !dy && !gateSide(x + dx, y)); };
const n = f(0, -1), s = f(0, 1), e = f(1, 0), w = f(-1, 0);
const col = e && w ? 2 : e ? 1 : w ? 3 : 0, row = n && s ? 1 : s ? 0 : n ? 2 : 3;
return [IMG.fences, col * 16, row * 16, 16, 16, 0, -4];
}
;
const Structures = (() => {
const WALLS = "W%+", LIFT = 22, INK = "#754c60", CAP = "#c49a6c", STONE = ["#6f7471", "#b6bab1"];
const wall = (x, y, z) => WALLS.includes((z === undefined ? combAt(x, y) : Floors.thingAt(x, y, z)) || "-");
const sideDoor = (x, y, z) => (z === undefined ? combAt(x, y) : Floors.thingAt(x, y, z)) === "+" && !wall(x - 1, y, z) && !wall(x + 1, y, z) && (wall(x, y - 1, z) || wall(x, y + 1, z));
function doorFrame(x, y, z) {
const by = (p) => Math.abs(Math.round(p.x) - x) + Math.abs(Math.round(p.y) - y) <= 1 && Floors.standOf(p, Math.round(p.x), Math.round(p.y)) === z;
const key = x + "," + y + (z === undefined ? "" : "," + z);
const near = z === undefined ? [[0, 0], [0, -1], [0, 1], [1, 0], [-1, 0]].some(([dx, dy]) => occupied.has((x + dx) + "," + (y + dy))) : [...ents.values()].some((p) => p.e && p.e.kind === "agent" && by(p));
const was = doors.get(key) || 0, o = Math.max(0, Math.min(1, was + (near ? .15 : -.1))), now = performance.now();
const lately = now - (doorShut.get(key) || -1e9) < 700;
if (!was && o && !lately) sfx("gate", x, y);
if (was >= 1 && o < 1 && !lately) { sfx("door_close", x, y); doorShut.set(key, now); }
doors.set(key, o);
return 5 - Math.round(o * 5);
}
const UP = 4, L = 5, R = 11;
function drawWall(c, x, y, sx, sy, S, now, a = 1, at) {
const z = zoom, px = sx(x), py = sy(y, x) - UP * z, n = wall(x, y - 1, at), s = wall(x, y + 1, at), w = wall(x - 1, y, at), e = wall(x + 1, y, at), stone = c === "%";
const ink = stone ? STONE[0] : INK, top = stone ? STONE[1] : CAP, x0 = w ? 0 : L, x1 = e ? 16 : R;
const r = (col, X, Y, W_, H_) => { ctx.fillStyle = col; ctx.fillRect(px + X * z, py + Y * z, W_ * z, H_ * z); };
const planks = (X, W_) => {
if (W_ <= 0) return;
if (stone) { const [gx, gy] = genCell("stone_wall"); ctx.drawImage(IMG.gen, gx + X, gy + 2, W_, 12, px + X * z, py + 4 * z, W_ * z, 12 * z); }
else ctx.drawImage(IMG.house_walls, 56 + X, 4, W_, 12, px + X * z, py + 4 * z, W_ * z, 12 * z);
};
const cap = (X0, X1) => { r(top, X0, 1, X1 - X0, 3); r(ink, X0, 0, X1 - X0, 1); };
ctx.globalAlpha = a;
if (sideDoor(x, y, at)) {
[.3, .2, .1].forEach((al, k) => r(`rgba(30,20,28,${al})`, 3 - k, 4, 10 + 2 * k, 8));
for (const Y of [0, 12]) { r(ink, L, Y, 6, 4); r(top, L + 1, Y + (Y ? 0 : 1), 4, 3); }
if ((a >= 1 ? doorFrame(x, y, at) : 5) >= 3) { r(INK, 6, 4, 4, 8); r("#90625d", 7, 4, 2, 8); r("#e8cfa6", 7, 9, 1, 1); }
else { r(INK, R, 3, 5, 4); r("#90625d", R, 4, 4, 2); }
} else if (c === "+") {
r("#4a3530", 3, 1, 10, 14);
ctx.drawImage(IMG.door, (a >= 1 ? doorFrame(x, y, at) : 5) * 16, 0, 16, 16, px, py, S, S);
} else if (!s) {
planks(x0, x1 - x0); cap(x0, x1);
if (!w) r(ink, x0, 0, 1, 16);
if (!e) r(ink, x1 - 1, 0, 1, 16);
if (n) r(top, L + 1, 0, R - L - 2, 1);
} else {
if (w) planks(0, L);
if (e) planks(R, 16 - R);
r(ink, L, 0, 1, 16); r(ink, R - 1, 0, 1, 16); r(top, L + 1, 0, R - L - 2, 16);
if (w) { cap(0, L + 1); r(top, L, 1, 1, 3); }
if (e) { cap(R - 1, 16); r(top, R - 1, 1, 1, 3); }
if (!n) r(ink, L, 0, R - L, 1);
}
ctx.globalAlpha = 1;
}
function drawRoof(px, top, S, up, down, w, e) {
const z = zoom, row = up + down >= 2 && up === Math.floor((up + down) / 2) ? 2 : up % 2 ? 3 : 1;
const piece = (r, y0, h, at) => {
ctx.drawImage(IMG.house_roof, 16, r * 16 + y0, 16, h, px, at, S, h * z);
if (!w) ctx.drawImage(IMG.house_roof, 0, r * 16 + y0, 16, h, px - 11 * z, at, S, h * z);
if (!e) ctx.drawImage(IMG.house_roof, 32, r * 16 + y0, 16, h, px + 11 * z, at, S, h * z);
};
piece(row, 0, 16, top);
if (!up) piece(0, 9, 7, top - 7 * z);
if (!down) piece(4, 0, 7, top + 16 * z);
}
return {WALLS, INK, drawWall, drawRoof, sideDoor, doorFrame};
})();
;
let FLOORS = false;
const Floors = (() => {
const STOREY = 3, K = .03, THIN = .12, FAINT = .3;
let ver = 0, over = {key: "-", z: 99, tiles: new Set()};
const colOf = (x, y) => { const b = blockOf(x, y); return b && b.built ? b.built.get((y - b.by * B) * B + (x - b.bx * B)) : undefined; };
const get = (x, y, z) => { const c = colOf(x, y); return c ? c.get(z) : undefined; };
function put(b, i, z, kind, ch) { let c = b.built.get(i); if (!c) b.built.set(i, c = new Map()); c.set(z, [kind, ch === " " ? "" : ch || ""]); }
function set(x, y, z, kind, ch) {
const t = tileIdx(x, y); if (!t) return;
if (!t[0].built) t[0].built = new Map();
const c = t[0].built.get(t[1]);
if (kind) put(t[0], t[1], z, kind, ch); else if (c) { c.delete(z); if (!c.size) t[0].built.delete(t[1]); }
ver++;
}
function load(b, d) {
const had = !!(b.built && b.built.size); b.built = new Map();
for (const [i, z, kind, ch] of d.floors || []) put(b, i, z, kind, ch);
for (const i of d.roofs || []) put(b, i, b.lv[i].charCodeAt(0) - SEA + STOREY, "roof", "");
if (had || b.built.size) ver++;
}
const cells = (x, y) => (FLOORS && colOf(x, y)) || null, built = (x, y, z) => { const c = FLOORS && colOf(x, y); return !!c && c.has(z); };
const thingAt = (x, y, z) => { const c = get(x, y, z); return c ? c[1] : z === groundAt(x, y) ? combAt(x, y) || "" : ""; };
function fits(x, y, z, planned = () => false) {
if (solidAt(x, y, z)) return "A block is there";
const under = Math.max(...surfacesAt(x, y).filter((s) => s < z)), on = thingAt(x, y, under), t = tile(x, y);
if (under === z - 1) return on && !GROUND.has(on) ? "Something is in the way" : !get(x, y, under) && t && wet(t[1]) ? "Not on water: a bridge first" : null;
if (z - under < STOREY) return "Too low over the floor";
if (z - under === STOREY && Structures.WALLS.includes(on || "-")) return null;
return Object.values(DIRV).some(([dx, dy]) => solidAt(x + dx, y + dy, z) || planned(x + dx, y + dy, z)) ? null : "Needs a wall under it";
}
function standOf(p, x, y) {
if (!p.e || !(FLOORS && colOf(x, y) || hollow(x, y))) return standAt(x, y);
const mine = p.e.kind === "agent" && p.e.id === myId, at = mine ? myAt : p.zAt, was = mine ? myWas : p.zWas;
if (at && at.x === x && at.y === y) return at.z;
if (was && was.x === x && was.y === y) return was.z;
const z = at && Math.abs(at.x - x) + Math.abs(at.y - y) === 1 ? landAt(at.z, x, y, at.x, at.y) : null;
return z !== null ? z : at ? settleNear(x, y, at.z) : standAt(x, y);
}
const rise = (p) => { const x = Math.round(p.x), y = Math.round(p.y); return FLOORS && colOf(x, y) ? standOf(p, x, y) - standAt(x, y) : 0; };
function mine() {
const s = myAt, key = s ? [s.x, s.y, s.z, ver].join() : "";
if (key === over.key) return over;
const zs = (x, y) => { const c = colOf(x, y); return c ? [...c.keys()] : []; }, tiles = new Set();
let z = 99;
if (s && zs(s.x, s.y).some((v) => v > s.z)) for (const [dx, dy] of [[0, 0], ...Object.values(DIRV)]) for (const v of zs(s.x + dx, s.y + dy)) if (v > s.z && v < z) z = v;
const line = z < 99 ? [[s.x, s.y]] : [];
if (line.length) tiles.add(s.x + "," + s.y);
for (let i = 0; i < line.length && i < 900; i++) for (const [dx, dy] of Object.values(DIRV)) {
const x = line[i][0] + dx, y = line[i][1] + dy, k = x + "," + y;
if (!tiles.has(k) && zs(x, y).some((v) => v >= z)) { tiles.add(k); line.push([x, y]); }
}
return (over = {key, z, tiles});
}
const hides = (x, y, z) => (mine().tiles.has(x + "," + y) && z >= over.z ? THIN : Build.on && z > Build.level() ? FAINT : 0);
const alpha = (x, y, z) => { const h = hides(x, y, z); return !h ? 1 : opt("above") === "faded" || opt("above") === "circle" ? h : 0; };
function cell(kind, x, y, z, sx, sy, S, a) {
const q = zoom, px = sx(x), top = syUp(sy, y, shOf(z) * q), same = (dx, dy) => { const c = get(x + dx, y + dy, z); return !!c && c[0] === kind; };
const r = (col, X, Y, W_, H_) => { ctx.fillStyle = col; ctx.fillRect(px + X * q, top + Y * q, W_ * q, H_ * q); };
ctx.globalAlpha = a;
if (kind === "stairs") { ctx.globalAlpha = 1; return Climb.drawStep(x, y, z, px, top, a); }
if (kind === "roof") {
let up = 0, down = 0;
while (up < 14 && same(0, -up - 1)) up++;
while (down < 14 && same(0, down + 1)) down++;
Structures.drawRoof(px, top, S, up, down, same(-1, 0), same(1, 0));
} else {
const ink = Structures.INK;
if (!get(x, y, z + 1)) {
ctx.drawImage(IMG.house_walls, 16, 16, 16, 16, px, top, S, S);
if (!get(x, y - 1, z)) r(ink, 0, 0, 16, 1);
if (!get(x - 1, y, z)) r(ink, 0, 0, 1, 16);
if (!get(x + 1, y, z)) r(ink, 15, 0, 1, 16);
}
if (!get(x, y + 1, z)) {
const n = RELIEF_STEP; for (let j = 0; j < n - 1; j += 7) { const h = Math.min(7, n - 1 - j); ctx.drawImage(IMG.house_walls, 56, 9, 16, h, px, top + (16 + j) * q, S, h * q); }
r(ink, 0, 15 + n, 16, 1); r(ink, 0, 16, 16, 1);
if (!get(x - 1, y, z)) r(ink, 0, 16, 1, n);
if (!get(x + 1, y, z)) r(ink, 15, 16, 1, n);
}
}
ctx.globalAlpha = 1;
}
const UP = new Set("W%+#ghLBpKrl");
function intent(p, shift) {
const s = myPos(), it = selected && !shift ? selected : null, isMe = s.x === p.x && s.y === p.y;
const z = settleNear(p.x, p.y, myZ(s.x, s.y)), c = FLOORS ? get(p.x, p.y, z) : null, on = c ? c[1] : "", zArg = (zz) => (FLOORS ? {z: zz} : {});
const place = (zz, text) => ({text, ghost: it, ok: true, near: 1, z: zz, run: (d) => act("place", {dir: d, item: it, ...zArg(zz)})});
const t = tile(p.x, p.y);
if (LAND_BLOCKS.has(it) && FLOORS && t && ".,'".includes(t[1]) && (GROUND.has(t[0]) || t[0] === "f") && !isMe && !c && z === topAt(p.x, p.y) && colAt(p.x, p.y) === colSolid(z) && !colOf(p.x, p.y))
return entityAt(p) ? {text: "Someone is standing there", ghost: it, ok: false} : {text: "Raise the ground", ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})};
const h = myZ(s.x, s.y);
if (it === "plank" && FLOORS && get(s.x, s.y, h) && !isMe && !solidAt(p.x, p.y, h) && !fits(p.x, p.y, h)) return place(h, "Lay planks");
if (it === "roof" || (it === "plank" && c && !isMe)) {
const zz = z + (it === "roof" ? STOREY : 1), why = fits(p.x, p.y, zz);
return why ? {text: why, ghost: it, ok: false, z: zz} : place(zz, it === "roof" ? "Lay roof" : "Put planks on top");
}
if (!c || isMe) return null;
if (it && PLACEABLE_BLOCK[it] && c[0] === "stairs") return {text: "Not on a step", ghost: it, ok: false, z};
if (it && PLACEABLE_BLOCK[it]) return on ? {text: "Something is there", ghost: it, ok: false, z} : UP.has(PLACEABLE_BLOCK[it]) ? place(z, `Place ${label(it)}`) : {text: "It needs the ground", ghost: it, ok: false, z};
if (on === "B" && !shift) return {text: "Sleep", near: 1, z, run: (d) => act("sleep", {dir: d})};
if (on) { const tool = TOOL_FOR[on], w = inHand(); return {text: (HARVEST[on] || "Take down " + label(CH[on])) + (tool && w !== tool ? " (slow)" : ""), near: 1, z, run: (d) => act("dig", {dir: d, z, ...(w ? {with: w} : {})})}; }
if (shift) return {text: c[0] === "roof" ? "Take the roof block" : c[0] === "stairs" ? "Take up the step" : "Take up the planks", near: 1, z, run: (d) => act("dig", {dir: d, z})};
return {text: "Walk here", walk: true, run: () => act("move_to", {x: p.x, y: p.y, z})};
}
return {STOREY, K, UP, any: (x, y) => !!colOf(x, y), get, set, load, cells, built, thingAt, fits, standOf, rise, alpha, cell, intent, get ver() { return ver; }};
})();
;
const Climb = (() => {
const CLIMB = 12, RISE = [2, 7], WAYS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const RAIL = "#90625d", RUNG = "#c49a6c", LIGHT = "#e8cfa6";
const ladderAt = (x, y, z) => FLOORS && Floors.thingAt(x, y, z) === "l";
function openAt(x, y, z) {
if (!surfacesAt(x, y).includes(z) || solidAt(x, y, z + 2)) return false;
const c = Floors.get(x, y, z);
return c ? !SOLID.has(c[1]) : z !== floorAt(x, y) || plainWalk(x, y);
}
function climb(h, x0, y0, x, y) {
for (const s of surfacesAt(x, y)) {
if (s <= h || s > h + CLIMB) continue;
for (let c = h + 1; c <= s + 2; c++) if (solidAt(x0, y0, c)) return null;
if (openAt(x, y, s)) return s;
}
return null;
}
function lean(x, y, z) {
for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const s = climb(z, x, y, x + dx, y + dy); if (s !== null && s >= z + 2) return {dx, dy, top: s}; }
return null;
}
const onLadder = (x0, y0, h0, x, y, h) => ladderAt(x0, y0, h0) || ladderAt(x, y, h);
const CLIMB_S = .15;
function pace(fx, fy, h, x, y) {
const z = landAt(h, x, y, fx, fy);
return z !== null && Math.abs(z - h) > 1 && onLadder(fx, fy, h, x, y, z) ? 1 / (Math.abs(z - h) * CLIMB_S) : 0;
}
function paceOf(p) {
let ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
if (ax === bx && ay === by) { bx = p.tx; by = p.ty; if (Math.abs(bx - ax) + Math.abs(by - ay) !== 1) return 0; }
const la = Floors.standOf(p, ax, ay), lb = Floors.standOf(p, bx, by);
return Math.abs(la - lb) > 1 && onLadder(ax, ay, la, bx, by, lb) ? 1 / (Math.abs(la - lb) * CLIMB_S) : 0;
}
const OVER = .8;
function climbOf(p) {
const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
if ((ax === bx && ay === by) || !FLOORS) return null;
const la = Floors.standOf(p, ax, ay), lb = Floors.standOf(p, bx, by);
if (Math.abs(la - lb) < 2 || !onLadder(ax, ay, la, bx, by, lb)) return null;
const footA = la < lb, u = footA ? (ax === bx ? p.y - ay : p.x - ax) : (ax === bx ? by - p.y : bx - p.x);
const lo = Math.min(la, lb), hi = Math.max(la, lb), on = u <= OVER;
const pos = on ? 0 : (u - OVER) / (1 - OVER), h = on ? lo + (hi - lo) * u / OVER : hi;
const fx = footA ? bx - ax : ax - bx, fy = footA ? by - ay : ay - by, foot = footA ? [ax, ay] : [bx, by], top = [foot[0] + fx, foot[1] + fy];
const y = on ? foot[1] + (lo - standAt(...foot)) * Floors.K + .02 : top[1] + (hi - standAt(...top)) * Floors.K + .02;
return {dx: fx * (pos - u), dy: fy * (pos - u), lift: (h - lo - (hi - lo) * u) * RELIEF_STEP, h, on, u, fx, fy, y};
}
function flight(x, y) {
const s = myPos(); if (!s) return {why: ""};
const base = settleNear(x, y, myZ(s.x, s.y));
let why = null;
for (const [dx, dy] of WAYS) {
const top = surfacesAt(x + dx, y + dy).find((t) => t >= base + RISE[0] && t <= base + RISE[1] && openAt(x + dx, y + dy, t));
if (top === undefined) continue;
for (const [wx, wy] of [[-dx, -dy], [dy, dx], [-dy, -dx]]) {
const steps = down(x, y, wx, wy, top);
if (Array.isArray(steps)) return steps;
why = why || steps;
}
}
return {why: why || "Stairs go up to something higher beside them"};
}
function down(x, y, dx, dy, top) {
const out = [];
for (let t = top - 1; ; t--, x += dx, y += dy) {
const under = surfacesAt(x, y).filter((v) => v < t), g = under.length ? Math.max(...under) : null;
if (g === null || t <= g) return out.length ? out : "The ground there is as high";
for (let c = g + 1; c <= t + 2; c++) if (solidAt(x, y, c)) return "No room: leave the floor open over them";
const cell = Floors.get(x, y, g), what = cell ? cell[1] : g === floorAt(x, y) ? combAt(x, y) : "";
const me_ = myPos();
if ((what && !GROUND.has(what) && what !== "f") || (!cell && !plainWalk(x, y)) || entityAt({x, y}) || (me_ && me_.x === x && me_.y === y)) return "Something is in the way";
out.push([x, y, g, t]);
if (t - g <= 1) return out;
if (out.length >= RISE[1]) return "Too far down";
}
}
function drawLadder(x, y, z, sx, sy, S, a = 1) {
const q = zoom, L = lean(x, y, z), top = L ? L.top : z + 2, shift = L ? L.dx * 3 : 0;
const edge = !L ? -shOf(top) : L.dy < 0 ? -shOf(top) - 2 : L.dy > 0 ? 16 - shOf(top) - 6 : -shOf(top) + 2;
const X = sx(x) + (4 + shift) * q, y0 = syUp(sy, y, shOf(z) * q) + 14 * q, y1 = syUp(sy, y, shOf(top) * q) + (edge + shOf(top)) * q;
ctx.globalAlpha = a;
for (let yy = y0 - 3 * q; yy > y1 + q; yy -= 4 * q) { ctx.fillStyle = RAIL; ctx.fillRect(X + 2 * q, yy, 4 * q, q); ctx.fillStyle = RUNG; ctx.fillRect(X + 2 * q, yy - q, 4 * q, q); }
for (const rx of [0, 6]) {
ctx.fillStyle = Structures.INK; ctx.fillRect(X + rx * q, y1, 2 * q, y0 - y1);
ctx.fillStyle = RAIL; ctx.fillRect(X + (rx + 1) * q, y1 + q, q, y0 - y1 - 2 * q);
ctx.fillStyle = LIGHT; ctx.fillRect(X + (rx + 1) * q, y1 + q, q, q);
}
ctx.globalAlpha = 1;
}
const TREAD = "#c49a6c", RISER = "#8a5f52", STRINGER = "#6e4a4f";
function drawStep(x, y, z, px, top, a) {
const q = zoom, ink = Structures.INK, up = WAYS.find(([dx, dy]) => solidAt(x + dx, y + dy, z + 1) && !solidAt(x + dx, y + dy, z + 2)) || [0, -1];
const r = (col, X, Y, W_, H_) => { ctx.fillStyle = col; ctx.fillRect(px + X * q, top + Y * q, W_ * q, H_ * q); };
const covered = solidAt(x, y, z + 1), front = !solidAt(x, y + 1, z), [dx, dy] = up;
ctx.globalAlpha = a;
if (dy < 0) {
const rows = (covered ? 0 : 16) + (front ? RELIEF_STEP : 0), y0 = covered ? 16 : 0;
for (let k = 0; k < rows; k += 8) {
r(RISER, 2, y0 + k, 12, 3); r(ink, 2, y0 + k, 12, 1);
r(TREAD, 2, y0 + k + 3, 12, 5); r(LIGHT, 2, y0 + k + 7, 12, 1);
}
if (rows) for (const X of [0, 14]) { r(ink, X, y0, 2, rows); r(STRINGER, X + (X ? 0 : 1), y0, 1, rows); }
} else if (dy > 0) {
if (!covered) {
r(TREAD, 2, 0, 12, 8); r(LIGHT, 2, 0, 12, 1); r(RISER, 2, 6, 12, 2);
r(TREAD, 2, 8, 12, 8); r(LIGHT, 2, 8, 12, 1);
for (const X of [0, 14]) { r(ink, X, 0, 2, 16); r(STRINGER, X + (X ? 0 : 1), 0, 1, 16); }
}
if (front) { r(STRINGER, 0, 16, 16, RELIEF_STEP); r(ink, 0, 15 + RELIEF_STEP, 16, 1); }
} else {
const hi = dx > 0 ? 8 : 0, lo = 8 - hi;
for (const [X, d] of [[hi, 0], [lo, 4]]) {
if (!covered) {
r(TREAD, X, d + 2, 8, 12); r(dx > 0 ? LIGHT : RISER, X, d + 2, 1, 12); r(dx > 0 ? RISER : LIGHT, X + 7, d + 2, 1, 12);
r(ink, X, d, 8, 1); r(STRINGER, X, d + 1, 8, 1); r(STRINGER, X, d + 14, 8, 1); r(ink, X, d + 15, 8, 1);
}
if (front) { const f0 = covered ? 16 : d + 16, f1 = 16 + RELIEF_STEP; r(STRINGER, X, f0, 8, f1 - f0); if (!covered) r(LIGHT, X, f0, 8, 1); r(ink, X, f1 - 1, 8, 1); }
}
}
ctx.globalAlpha = 1;
}
function own(p, s) {
const h = myZ(s.x, s.y);
if (Build.on || Math.abs(p.x - s.x) + Math.abs(p.y - s.y) !== 1 || !solidAt(p.x, p.y, h + 1)) return null;
const top = climb(h, s.x, s.y, p.x, p.y);
return top !== null && top >= h + 2 ? h : null;
}
function intent(p, shift) {
const it = selected && !shift ? selected : null, s = myPos();
if (!s || (it !== "stairs" && it !== "ladder") || (p.x === s.x && p.y === s.y)) return null;
if (it === "stairs") {
const f = flight(p.x, p.y), have = meObs ? meObs.self.inventory.stairs || 0 : 0;
if (!Array.isArray(f)) return {text: f.why, ghost: it, ok: false};
const ok = have >= f.length;
return {text: ok ? `Build stairs (${f.length} step${f.length > 1 ? "s" : ""})` : `The flight takes ${f.length} stairs`, ghost: it, ok, near: 1, steps: f,
draw: (sx, sy, S) => ghostFlight(f, sx, sy, S, ok), run: (d) => act("place", {dir: d, item: it})};
}
const h = own(p, s);
if (h !== null) {
const b = FLOORS ? Floors.get(s.x, s.y, h) : null, was = b ? b[1] : h === groundAt(s.x, s.y) && !wet(gndAt(s.x, s.y)) ? combAt(s.x, s.y) : "-", ok = !was || GROUND.has(was) || was === "f";
if (was === "l") return {text: "", info: true, none: true, own: {x: s.x, y: s.y}};
return {text: ok ? "Place ladder" : "Something is in the way", ghost: it, ok, near: 1, z: h, flat: true, own: {x: s.x, y: s.y},
draw: (sx, sy, S) => drawLadder(s.x, s.y, h, sx, sy, S, .6), run: () => act("place", {dir: dirTo(p), item: it})};
}
const z = settleNear(p.x, p.y, myZ(s.x, s.y)), c = FLOORS ? Floors.get(p.x, p.y, z) : null, on = c ? c[1] : z === groundAt(p.x, p.y) ? combAt(p.x, p.y) : "";
if ((on && !GROUND.has(on) && on !== "f") || !openAt(p.x, p.y, z)) return {text: "Something is in the way", ghost: it, ok: false, z};
if (!FLOORS || !lean(p.x, p.y, z)) return {text: "Needs something taller behind", ghost: it, ok: false, z};
return {text: "Place ladder", ghost: it, ok: true, near: 1, z, draw: (sx, sy, S) => drawLadder(p.x, p.y, z, sx, sy, S, .6), run: (d) => act("place", {dir: d, item: it, z})};
}
function ghostFlight(f, sx, sy, S, ok) {
for (const [x, y, g, t] of f) for (let z = g + 1; z <= t; z++) Floors.cell("stairs", x, y, z, sx, sy, S, .55);
for (const [x, y, , t] of f) { ctx.fillStyle = ok ? "rgba(120,220,120,.25)" : "rgba(230,80,70,.3)"; ctx.fillRect(sx(x), syUp(sy, y, shOf(t) * zoom), S, S); }
}
return {openAt, climb, lean, onLadder, pace, paceOf, climbOf, flight, drawLadder, drawStep, intent, ghostFlight};
})();
;
const RELIEF_STEP = 16;
const shOf = (L) => RELIEF_STEP * L;
const eyeRise = (pitch) => Math.tan(pitch * Math.PI / 180) * 16 / RELIEF_STEP;
const STAND = 3, UP = STAND / 16;
const syUp = (sy, y, lift) => (sy.up ? sy.up(y, lift) : sy(y) - lift);
const bodyY = (p, sy) => syUp(sy, p.y, liftOf(p)) - STAND * zoom;
function liftFrom(o) { if (o.lift === undefined) o.lift = liftOf({x: o.x, y: o.y}); return o.lift; }
const liftAt = (x, y) => (shOf(standAt(x, y)) + Models.up(x, y)) * zoom;
function liftOf(p) {
const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
const f = ax === bx ? p.y - ay : p.x - ax, a = (shOf(Floors.standOf(p, ax, ay)) + Models.up(ax, ay)) * zoom, b = (shOf(Floors.standOf(p, bx, by)) + Models.up(bx, by)) * zoom;
return a + (b - a) * f;
}
const sheetCols = new Map();
function colsOf(sheet) {
if (sheetCols.has(sheet)) return sheetCols.get(sheet);
const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
const g = c.getContext("2d"); g.drawImage(sheet, 0, 0);
const data = g.getImageData(0, 0, c.width, c.height).data, at = (x, y) => Array.from(data.slice((y * c.width + x) * 4, (y * c.width + x) * 4 + 4));
const [ex, ey] = blobCell(N_ | E_ | W_ | NE | NW), [wx, wy] = blobCell(N_ | S_ | E_ | NE | SE), [ix, iy] = blobCell(255);
let ink = 15; while (ink > 0 && at(ex * 16 + 8, ey * 16 + ink)[3] === 0) ink--;
const l = at(ex * 16 + 8, ey * 16 + ink - 1), d = at(ex * 16 + 8, ey * 16 + ink - 2);
let w0 = 0; while (w0 < 15 && at(wx * 16 + w0, wy * 16 + 8)[3] < 128) w0++;
const side = [0, 1, 2, 3].map((i) => at(wx * 16 + w0 + i, wy * 16 + 8));
const [nx, ny] = blobCell(S_ | E_ | W_ | SE | SW);
let n0 = 0; while (n0 < 15 && at(nx * 16 + 8, ny * 16 + n0)[3] < 128) n0++;
const dd = Math.min(8, (sheet.dug || 1) - 1) / 8, seam = sheet.dug ? [1 + .1 * dd, .86 - .24 * dd] : [1, 1], out = {bands: [l.map((v, q) => (q < 3 ? Math.min(255, v * seam[0]) : v)), [(d[0] + l[0]) / 2, (d[1] + l[1]) / 2, (d[2] + l[2]) / 2], d.map((v, q) => (q < 3 ? v * seam[1] : v))], side, top: at(ix * 16 + 8, iy * 16 + 8),
foot: ink + 1, inset: w0, north: n0};
sheetCols.set(sheet, out); return out;
}
const cellAlphas = new Map();
function cellAlpha(sheet, cx, cy) {
let m = cellAlphas.get(sheet);
if (!m) {
const c = document.createElement("canvas"); c.width = sheet.width; c.height = sheet.height;
const g = c.getContext("2d"); g.drawImage(sheet, 0, 0);
m = {data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, cells: new Map()}; cellAlphas.set(sheet, m);
}
const key = cx * 100 + cy;
if (!m.cells.has(key)) {
const a = new Uint8Array(256);
for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) a[j * 16 + i] = m.data[((cy * 16 + j) * m.w + cx * 16 + i) * 4 + 3] > 128 ? 1 : 0;
m.cells.set(key, a);
}
return m.cells.get(key);
}
;
function trackMe() {
const me = ents.get("agent" + myId);
if (me) {
const x = Math.round(me.x), y = Math.round(me.y);
if (!myAt || myAt.x !== x || myAt.y !== y) {
let z = myAt && Math.abs(myAt.x - x) + Math.abs(myAt.y - y) === 1 ? landAt(myAt.z, x, y, myAt.x, myAt.y) : null;
const told = me.e && me.e.z !== undefined ? me.e.z : meObs && meObs.self.z !== undefined ? meObs.self.z : 99;
if (z === null) z = settleAt(x, y, told);
myWas = myAt; myAt = {x, y, z};
} else myAt.z = settleAt(x, y, myAt.z);
if (me.e && me.e.z !== undefined && me.e.x === x && me.e.y === y && Math.abs(me.x - x) < .001 && Math.abs(me.y - y) < .001 && !pred) myAt.z = settleAt(x, y, me.e.z);
}
}
;
const DEATH_MS = 1200;
let deathReadyAt = Infinity;
let deathTimer = null;
function showDeath(e) {
const v = $("deathveil"), p = $("death");
const skull = $("deathskull").getContext("2d"), [c, r] = EMOTE.skull;
skull.imageSmoothingEnabled = false; skull.clearRect(0, 0, 32, 32); skull.drawImage(IMG.emoji, c * 32, r * 32, 32, 32, 0, 0, 32, 32);
const cause = String(e.cause || "you fell").replace(/^./, (m) => m.toUpperCase());
$("deathcause").textContent = cause + ".";
const loot = $("deathloot"); loot.innerHTML = "";
const items = Object.entries(e.dropped || {}).filter(([, n]) => n > 0);
for (const [name, n] of items.slice(0, 8)) {
const s = document.createElement("div"); s.className = "dslot";
const ic = slotIcon(name); ic.className = "dicon"; s.appendChild(ic);
const k = document.createElement("span"); k.textContent = n > 1 ? "×" + n : ""; s.appendChild(k);
s.title = label(name); loot.appendChild(s);
}
$("deathleft").textContent = items.length ? `What you carried lies where you fell, at ${e.x}, ${e.y}.` : "You carried nothing.";
$("deathwake").textContent = meObs && meObs.self.spawn ? "You'll wake by your bed." : "You'll wake somewhere else. Sleep in a bed to choose where.";
for (const el of [v, p]) { el.style.display = "block"; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); }
const bar = $("deathbar"); bar.style.transition = "none"; bar.style.width = "0"; void bar.offsetWidth;
bar.style.transition = `width ${DEATH_MS}ms linear`; bar.style.width = "100%";
clearTimeout(deathTimer); deathReadyAt = performance.now() + DEATH_MS;
const hint = document.querySelector("#death .dhint");
hint.style.visibility = "hidden"; hint.textContent = TOUCH ? "tap to get up" : "any key to get up";
deathTimer = setTimeout(() => { hint.style.visibility = "visible"; }, DEATH_MS);
}
function hideDeath() {
clearTimeout(deathTimer);
for (const id of ["deathveil", "death"]) { const el = $(id); if (el.style.display === "block") { el.classList.remove("on"); el.classList.add("off"); setTimeout(() => { el.style.display = "none"; el.classList.remove("off"); }, 450); } }
}
const deathOpen = () => $("death") && $("death").classList.contains("on");
addEventListener("keydown", (e) => { if (deathOpen() && performance.now() >= deathReadyAt && !e.repeat) hideDeath(); }, true);
addEventListener("pointerdown", () => { if (deathOpen() && performance.now() >= deathReadyAt) hideDeath(); }, true);
;
const cv = document.getElementById("c");
let ctx = cv.getContext("2d");
let DPR = 1, W = 0, H = 0, DPR_MAX = 2, frameMs = 16, paceFrom = 0;
function resize() {
DPR = Math.min(window.devicePixelRatio || 1, opt("sharp") === "light" ? 1 : opt("sharp") === "full" ? 2 : DPR_MAX); W = innerWidth; H = innerHeight;
cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + "px"; cv.style.height = H + "px";
}
addEventListener("resize", resize); resize();
function slowFrame(dt, settled) {
const now = performance.now();
if (!settled || document.hidden || DPR <= 1 || opt("sharp") !== "auto") { paceFrom = now; return; }
frameMs += (Math.min(dt, .1) * 1000 - frameMs) * .02;
if (frameMs < 30) paceFrom = now;
else if (now - paceFrom > 4000) { DPR_MAX = 1; frameMs = 16; resize(); }
}
let zoom = 3;
const TS = () => P * zoom;
function screenOrigin(S = TS()) {
return [Math.round(W / 2 - S / 2) - Math.round(cam.x * S), Math.round(H / 2 - S / 2) - Math.round(cam.y * S)];
}
let cam = {x: 0, y: 0}, camT = {x: 0, y: 0};
let follow = null, me = null, myId = null, meObs = null, agents = [], metrics = {}, recipes = {}, clock = {night: false, phase: .3};
let selected = null, progress = null, foodValue = {};
let HP_MAX = 100, FOOD_MAX = 100, SPRINT_FOOD = -1, SWIM_SPRINT = false, SWIM_PACE = 1, EAT_PACE = 1;
const hearts = (hp) => Math.round(hp / (HP_MAX / 10) * 10) / 10;
const ents = new Map();
let bubbles = [], floats = [];
const requested = new Map();
const wsBase = (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
const openSocket = (path) => typeof LocalSocket !== "undefined" ? new LocalSocket(path) : new WebSocket(wsBase + path);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[c]));
const fmt = (o) => Object.entries(o || {}).map(([k, v]) => `${v} ${label(k)}`).join(", ");
let spec, sid = 0, lastWatch = "", webStamp = 0;
function connectSpec() {
spec = openSocket("/spectate");
spec.onopen = () => { lastWatch = ""; requested.clear(); sendSpec({op: "recipes"}); sendSpec({op: "agents"}); };
spec.onmessage = (m) => {
const d = JSON.parse(m.data);
if (d.type === "hello") {
if (webStamp && d.web && d.web !== webStamp) location.reload();
webStamp = d.web || webStamp;
if (d.hp_max) { HP_MAX = d.hp_max; FOOD_MAX = d.food_max; SPRINT_FOOD = d.sprint_food; }
FLOORS = !!d.floors;
SWIM_SPRINT = !!d.swim_sprint; SWIM_PACE = d.swim_pace || 1; EAT_PACE = d.eat_pace || 1;
} else if (d.type === "tick") { if (typeof TitleScene === "undefined" || !TitleScene.on) onTick(d); }
else if (d.type === "event") onEvent(d.ev);
else if (d.type === "resync") { for (const b of blocks.values()) b.at = -1e9; }
else if (d.type === "reply") {
if (d.rows) onRegion(d);
else if (d.agents) { agents = d.agents; drawAgents(); if (document.body.classList.contains("tab")) drawWho(); }
else if (d.recipes) { recipes = d.recipes; foodValue = d.food || {}; drawRecipes(); }
else if (d.tick_ms_p50 !== undefined) { metrics = d; }
else if (d.who) accountNamed(d.name);
}
};
spec.onclose = () => setTimeout(connectSpec, 1000);
}
const sendSpec = (o) => spec && spec.readyState === 1 && spec.send(JSON.stringify({...o, id: ++sid}));
const away = {on: false, a: 0, y: 0, shift: 0, sky: false, high: false, t: -1e9};
function viewRect(margin) {
const more = typeof Curve === "undefined" ? 0 : Math.min(40, Math.ceil(Curve.over() / TS()));
const w = Math.ceil(W / TS()) + margin * 2, h = Math.ceil(H / TS()) + margin * 2 + more, x = Math.floor(cam.x - w / 2), y = Math.floor(cam.y - (h - more) / 2) - more;
if (!me || performance.now() - away.t > 250) return [x, y, w, h];
const near = Math.floor(cam.y + away.shift - (h - more) / 2) - more, far = Math.floor(away.y - (h - more) / 2) - more, top = Math.min(near, far);
return away.a >= 1 ? [x, far, w, h] : [x, top, w, Math.max(near, far) + h - top];
}
setInterval(() => {
if (!spec || spec.readyState !== 1 || (typeof TitleScene !== "undefined" && TitleScene.on)) return;
const [x, y, w, h0] = viewRect(6), h = h0 + 6;
const key = [Math.round(x / 4), Math.round(y / 4), w, h].join();
if (key !== lastWatch) { lastWatch = key; sendSpec({op: "watch", x, y, w, h}); }
const now = performance.now();
for (let by = Math.floor(y / B); by <= Math.floor((y + h) / B); by++)
for (let bx = Math.floor(x / B); bx <= Math.floor((x + w) / B); bx++) {
const k = bkey(bx, by), b = blocks.get(k);
const stale = b && now - b.at > 30000;
if ((!b || stale) && !(requested.get(k) > now - 3000)) { requested.set(k, now); if (b) b.at = now; sendSpec({op: "region", x: bx * B, y: by * B, w: B, h: B}); }
}
const bx0 = Math.floor(x / B) - 1, bx1 = Math.floor((x + w) / B) + 1, by0 = Math.floor(y / B) - 1, by1 = Math.floor((y + h) / B) + 1;
for (const [k, b] of blocks) if (b.bx < bx0 || b.bx > bx1 || b.by < by0 || b.by > by1) blocks.delete(k);
}, 100);
setInterval(() => { sendSpec({op: "agents"}); sendSpec({op: "metrics"}); }, 1500);
let pred = null;
const recentlyGone = new Map();
let groundItems = [], mailAt = new Set(), fireAt = [], troughAt = new Set();
function onTick(d) {
clock = d;
groundItems = d.items || [];
mailAt = new Set((d.mail || []).map(([x, y]) => x + "," + y));
troughAt = new Set((d.troughs || []).map(([x, y]) => x + "," + y));
fireAt = (d.fires || []).map(([x, y]) => ({x, y}));
$("clock").textContent = d.time.replace("(night)", "· night");
if (document.body.classList.contains("tab")) whoTick();
const seen = new Set(), now = performance.now();
for (const e of d.entities) {
const key = e.kind + e.id; seen.add(key);
let p = ents.get(key);
if (!p) { p = {x: e.x, y: e.y, tx: e.x, ty: e.y, fx: 0, fy: 1, moved: 0}; ents.set(key, p); }
if (!p.zAt || p.zAt.x !== e.x || p.zAt.y !== e.y || p.zAt.z !== e.z) { p.zWas = p.zAt; p.zAt = {x: e.x, y: e.y, z: e.z}; }
p.e = e;
if (e.kind === "agent" && e.id === myId && myTick(p, e, now)) continue;
if (p.tx !== e.x || p.ty !== e.y) {
const dx = Math.sign(e.x - p.tx), dy = Math.sign(e.y - p.ty);
if (ANIMALS[e.kind]) { if (dx) p.fx = dx; } else if (dx || dy) { p.fx = dx; p.fy = dy; }
const gap = (now - p.moved) / 1000;
p.pace = e.run ? 10 : gap < 1 ? Math.min(10, Math.hypot(e.x - p.tx, e.y - p.ty) / Math.max(gap, .05)) : 0;
p.moved = now; p.tx = e.x; p.ty = e.y;
if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > 4) { p.x = e.x; p.y = e.y; }
}
}
for (const [k, p] of ents) if (!seen.has(k)) {
if (k === "agent" + myId) { refresh(); continue; }
recentlyGone.set(k, {p, t: now}); ents.delete(k);
}
for (const [k, g] of recentlyGone) if (now - g.t > 2000) recentlyGone.delete(k);
}
function tileSound(old, now, e) {
if (old === now) return;
const {x, y, cause} = e, oldBlock = !GROUND.has(old);
if (cause === "pick") return sfx("rustle", x, y);
if (cause === "dig") {
if (old === "T" || old === "U") return;
return sfx(oldBlock ? BREAK[material(old)] : "dig", x, y);
}
if (cause === "place") return sfxPlaced(e.block, e.ground, x, y);
if (cause === "burnt") return sfx("crackle", x, y);
if (cause === "flood") return sfx("flood", x, y);
if (cause === "grew") return sfx("grow", x, y, 5);
}
function onEvent(e) {
const t = performance.now() / 1000;
if (e.type === "tile") {
const g = CHAR[e.ground], blk = e.block === "none" ? g : CHAR[e.block], old = combAt(e.x, e.y);
if (g && blk) setTile(e.x, e.y, blk, g, e.by, e.col === undefined ? null : colIn(e.col), e.mat === undefined ? null : e.mat);
if (old && blk) tileSound(old, blk, e);
return;
}
if (e.type === "floor") {
Floors.set(e.x, e.y, e.z, e.kind, e.thing);
if (e.cause === "dig") sfx("snap", e.x, e.y); else sfxPlaced(CH[e.thing] || "", "floor", e.x, e.y);
return;
}
if (e.type === "roof") { Floors.set(e.x, e.y, floorAt(e.x, e.y) + Floors.STOREY, e.on ? "roof" : null); sfx(e.on ? "plant" : "rustle", e.x, e.y); return; }
if (e.type === "say" || e.type === "shout") { const em = emoteFor(e.text); if (em) setTimeout(() => emote(e.from, em), 2500); }
if (e.type === "give") { emote(e.to, "love"); emote(e.from, "happy"); }
if (e.type === "craft") emote(e.name, "star");
if (e.type === "attack") emote(e.target, "bang");
if (e.type === "death") emote(e.name, "skull");
if (e.type === "say" || e.type === "shout") {
bubbles.push({name: e.from, text: e.text, t, shout: e.type === "shout"});
}
if (e.type === "attack") {
noteFight(e);
const who = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === e.attacker);
if (who && e.attacker !== me) who.swing = {t0: performance.now(), with: e.weapon !== "fists" ? e.weapon : null};
const tgt = [...ents.values()].find((q) => q.e && (q.e.name === e.target || `${q.e.kind}#${q.e.id}` === e.target));
const tx = tgt ? tgt.x : e.x, ty = tgt ? tgt.y : e.y;
if (tgt) flashes.set(tgt.e.kind === "agent" ? "agent" + tgt.e.id : tgt.e.kind + tgt.e.id, performance.now());
if (tgt && ANIMALS[tgt.e.kind]) {
emote(tgt.e.kind + tgt.e.id, "bang");
const fw = ANIMALS[tgt.e.kind].fw;
debris(tgt.x, tgt.y - .2, [animalSheet(tgt.e.kind, tgt.e.id), 0, 0, fw, fw], 6, {});
sfx(tgt.e.kind === "chicken" || tgt.e.kind === "chick" ? "squawk" : animalVoice(tgt.e.kind), tx, ty);
}
if (WILD[String(e.attacker).slice(2)]) sfx("punch", e.x, e.y);
burst(tx, ty, "hit", 6, {dy: -.4}); sfx("hit", tx, ty); if (e.target === me) sfx("hurt"); floats.push({x: tx, y: ty, text: "-" + hearts(e.damage), heart: true, color: "#ff8a7a", t});
}
if (e.type === "jump" && e.name !== me) {
const q = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === e.name);
if (q) q.hop = performance.now();
}
if (e.type === "fall") {
const q = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === e.name);
if (q) { q.fallHurt = e.damage; setTimeout(() => fallHurts(q, performance.now(), e.name === me), 700); }
}
if (e.type === "death" && e.name === me) {
sfx("die");
showDeath(e);
}
if (e.type === "creature_died" || e.type === "fade") {
const key = e.kind + e.id, p = ents.get(key) || (recentlyGone.get(key) || {}).p;
if (p && p.e) dyingPoof(p, performance.now()); else smoke(e.x, e.y, 8);
if (e.drops) dropLoot(e.x, e.y, e.drops, performance.now());
ents.delete(key);
sfx("poof", e.x, e.y);
}
if (e.type === "death") { smoke(e.x, e.y, 10); sfx("poof", e.x, e.y); dropLoot(e.x, e.y, e.dropped, performance.now()); }
const warn = e.type === "windup" && {tusker: "rustle", pincer: "click", strawman: "creak", wisp: "gloom", wyrm: "water", mossback: "boss_groan"}[e.kind];
if (warn) sfx(warn, e.x, e.y);
if (e.type === "boss") bossEvent(e);
if (e.type === "wear") sfx("rustle", e.x, e.y);
if (e.type === "enrage") { burst(e.x, e.y, "dust", 8, {up: 1.3, spread: 2.6, g: 3}); burst(e.x, e.y, "rage", 12, {up: 4.5, spread: 4.5, g: 9, life: .6, dy: -.3}); sfx("thud", e.x, e.y); flashes.set(e.kind + e.id, performance.now()); }
if (e.type === "bonk") { burst(e.x, e.y, "dust", 8, {up: 1, spread: 2, g: 3}); sfx("thud", e.x, e.y); }
if (e.type === "xp") spawnOrbs(e);
if (e.type === "pick_up" && e.magnet) magnetItems(e);
else if (e.type === "pick_up") { burst(e.x, e.y, "spark", 6, {dy: -.5, g: 3}); sfx("collect", e.x, e.y); }
if (e.type === "chest") { chestOpen.set(e.x + "," + e.y, performance.now()); sfx("chest", e.x, e.y); }
if (e.type === "milk") { burst(e.x, e.y, "spark", 4, {dy: -.2, g: 5}); emote(e.name, "happy"); sfx("milk", e.x, e.y); }
if (e.type === "love") { emote(e.by, "love"); sfx(animalVoice(e.kind), e.x, e.y); sfx("love", e.x, e.y); }
if (e.type === "lay") { burst(e.x, e.y, "dust", 5, {up: 1, spread: 1.5, g: 3}); sfx("lay", e.x, e.y); }
if (e.type === "ignite") { sfx("whoosh", e.x, e.y); sfx("crackle", e.x, e.y); }
if (e.type === "fill") { burst(e.x, e.y, "water", 8, {up: 1.5, spread: 1.5}); sfx("fill", e.x, e.y); }
if (e.type === "trough") { burst(e.x, e.y, "food", 3, {dy: -.4, g: 3}); sfx(animalVoice(e.kind), e.x, e.y); }
if (e.type === "picnic") { emote(e.name, "love"); burst(e.x, e.y, "food", 6, {dy: -.6, g: 3}); }
if (e.type === "mail" && e.to === me && e.from !== me) sfx("mail");
if (e.type === "shout" && e.from !== me) sfx("shout", e.x, e.y, 30);
if (e.type === "say" || e.type === "shout") babble(e.from, e.text, e.x, e.y, e.type === "shout");
if (e.type === "give" && e.to === me) sfx("give");
if ((e.type === "join" || e.type === "leave") && e.name !== me) sfx(e.type);
if (e.type === "sign") sfx("write", e.x, e.y);
if (e.type === "mail" && e.to === me && e.from !== me) toast(`**${e.from}** left you a letter\nin the mailbox at ${e.x}, ${e.y}`);
if (e.type === "mail_opened" && e.owner === me && e.by !== me) toast(`**${e.by}** opened your mailbox\nand took ${e.n} letter${e.n > 1 ? "s" : ""}`, true);
if (e.type === "board" || e.type === "moor") { burst(e.x, e.y, "water", 8, {up: 1.5, spread: 2}); sfx("water", e.x, e.y); }
if (e.type === "hatch") { burst(e.x, e.y, "spark", 8, {dy: -.3, g: 4}); sfx("hatch", e.x, e.y); }
if (e.type === "born") { burst(e.x, e.y, "food", 8, {dy: -.5, g: 3}); sfx("love", e.x, e.y); }
if (e.type === "craft") { burst(e.x, e.y, "spark", 10, {dy: -.6, g: 4}); sfx("craft", e.x, e.y); }
if (["xp", "pick_up", "drop", "chest", "milk", "love", "lay", "fill", "picnic", "trough"].includes(e.type)) return;
if (e.type === "attack") return;
let text;
switch (e.type) {
case "say": text = e.text; break;
case "shout": text = e.text; break;
case "death": text = `**${e.name}** died (${e.cause})`; break;
case "give": if (e.from !== me && e.to !== me) return; text = `**${e.from}** gave **${e.to}** ${fmt(e.items)}`; break;
case "join": text = `**${e.name}** ${e.new ? "washed ashore" : "woke up"}`; break;
case "leave": text = `**${e.name}** fell asleep`; break;
case "named": text = `**${e.by}** named a ${e.kind} **${e.name}**`; break;
default: return;
}
chatLine(text, e.type === "say" ? "" : e.type === "shout" ? "shout" : e.type === "death" ? "bad" : "sys",
e.type === "say" || e.type === "shout" ? e.from : null);
}
;
const ZOOM = {min: 2, max: 6, ms: 140, to: zoom, busy: false, acc: 0, at: 0, stepped: 0, hide: 0, el: null};
const zoomLeast = () => (me ? ZOOM.min : 1);
{ const z = +localStorage.getItem("megastructure-zoom"); if (z >= 1 && z <= ZOOM.max && z === Math.round(z)) zoom = z; }
function zoomBy(d) {
if (!ZOOM.busy) ZOOM.to = zoom;
const to = Math.max(Math.min(zoomLeast(), ZOOM.to), Math.min(ZOOM.max, ZOOM.to + d));
zoomSign(to, to === ZOOM.to);
if (to === ZOOM.to) return;
ZOOM.to = to;
localStorage.setItem("megastructure-zoom", to);
if (!ZOOM.busy) zoomLeg();
}
function zoomLeg() {
if (ZOOM.to === zoom) { ZOOM.busy = false; return; }
ZOOM.busy = true;
const next = zoom + Math.sign(ZOOM.to - zoom);
if (!cv.animate || !opt("glide") || matchMedia("(prefers-reduced-motion: reduce)").matches) { zoom = next; return zoomLeg(); }
const glide = (a, b, done) => {
const an = cv.animate([{transform: `scale(${a})`}, {transform: `scale(${b})`}], {duration: ZOOM.ms, easing: "cubic-bezier(.3, .6, .4, 1)", fill: "forwards"});
const fx = (HdLook.live && HdView.el ? [HdView.el] : []).map((c) => c.animate([{transform: `scale(${a})`}, {transform: `scale(${b})`}], {duration: ZOOM.ms, easing: "cubic-bezier(.3, .6, .4, 1)", fill: "forwards"}));
an.onfinish = () => { done(); an.cancel(); fx.forEach((f) => f.cancel()); };
};
if (next > zoom) glide(1, next / zoom, () => { Curve.rezoom(next / zoom); zoom = next; zoomLeg(); });
else { const from = zoom / next; zoom = next; Curve.rezoom(1 / from); glide(from, 1, zoomLeg); }
}
cv.addEventListener("wheel", (e) => {
e.preventDefault();
const now = performance.now(), px = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 300 : 1) * (e.ctrlKey ? 6 : 1);
if (now - ZOOM.at > 220 || Math.sign(px) !== Math.sign(ZOOM.acc)) ZOOM.acc = 0;
ZOOM.at = now; ZOOM.acc += px;
const notch = Math.abs(px) >= 50;
if (Math.abs(ZOOM.acc) < (notch ? 50 : 90) || now - ZOOM.stepped < (notch ? 60 : 200)) return;
zoomBy(ZOOM.acc < 0 ? 1 : -1);
ZOOM.acc = 0; ZOOM.stepped = now;
}, {passive: false});
addEventListener("keydown", (e) => {
const el = document.activeElement;
if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || (el && /^(INPUT|TEXTAREA)$/.test(el.tagName))) return;
const d = e.key === "+" || e.key === "=" ? 1 : e.key === "-" || e.key === "_" ? -1 : {Equal: 1, NumpadAdd: 1, Minus: -1, NumpadSubtract: -1}[e.code] || 0;
if (d) { e.preventDefault(); zoomBy(d); }
});
function zoomSign(level, stuck) {
if (!ZOOM.el) {
ZOOM.el = document.createElement("div"); ZOOM.el.id = "zoomer";
ZOOM.el.innerHTML = "<b data-d='-1'>−</b><span></span><b data-d='1'>+</b>";
document.body.appendChild(ZOOM.el);
ZOOM.el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (e.target.dataset.d) zoomBy(+e.target.dataset.d); });
}
const lo = Math.min(zoomLeast(), level), el = ZOOM.el;
el.querySelector("span").innerHTML = Array.from({length: ZOOM.max - lo + 1}, (_, i) => `<i class="${lo + i <= level ? "on" : ""}"></i>`).join("");
el.querySelector("[data-d='-1']").classList.toggle("end", level <= lo);
el.querySelector("[data-d='1']").classList.toggle("end", level >= ZOOM.max);
const hud = $("vitals").getBoundingClientRect();
el.style.bottom = (hud.height ? innerHeight - hud.top + 10 : 16) + "px";
el.classList.add("show");
if (stuck) { el.classList.remove("nod"); void el.offsetWidth; el.classList.add("nod"); }
clearTimeout(ZOOM.hide);
ZOOM.hide = setTimeout(() => el.classList.remove("show"), 1800);
}
;
const BOSS_SOUND = {wake: "boss_wake", stomp: "boss_stomp", snap: "boss_snap", shake: "boss_shake", land: "sporeling_land", puff: "spore_puff"};
function bossEvent(e) {
if (BOSS_SOUND[e.what]) sfx(BOSS_SOUND[e.what], e.x, e.y, e.what === "land" || e.what === "puff" ? 0 : 20);
if (e.what === "stomp") for (const dx of [-3, -2, 2, 3]) burst(e.x + dx, e.y, "dust", 7, {up: 1.5, spread: 3, g: 3});
if (e.what === "wake") for (const dx of [-1, 0, 1]) burst(e.x + dx, e.y, "dust", 6, {up: 1, spread: 2, g: 3});
if (e.what === "shake") burst(e.x, e.y - 2, "H", 14, {up: 2, spread: 5, g: 4, life: .9});
if (e.what === "puff") burst(e.x, e.y, "dust", 8, {up: 1, spread: 3, g: 1, life: .7});
}
setInterval(() => bossMusic([...ents.values()].some((q) => q.e && q.e.kind === "mossback" && q.e.act !== "sleep")), 500);
;
const JUMP = {over: 2, off: 1};
const HOP = {ms: 320, px: 6};
function jumpOf(p) {
const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
if (ax === bx && ay === by) return null;
const la = Floors.standOf(p, ax, ay), lb = Floors.standOf(p, bx, by);
if (la === lb || Climb.onLadder(ax, ay, la, bx, by, lb)) return null;
const f = ax === bx ? p.y - ay : p.x - ax, d = (lb - la) * RELIEF_STEP;
const up = (ax === bx ? p.ty - p.y || p.fy : p.tx - p.x || p.fx) >= 0 === d > 0;
return {body: (Math.abs(d) / 2 + (up ? JUMP.over : JUMP.off)) * 4 * f * (1 - f), ground: (f < .5 ? 0 : d) - d * f};
}
const FALL = {from: 3, g: 1000, flail: 70, heavy: 4, shake: [3.5, .32], bounce: [3, .17]};
let fallQuake = null;
function falling(p, now) {
if (p.fallAt !== now) { p.fallAt = now; p.fallNow = fallOf(p, now); }
return p.fallNow;
}
function fallOf(p, now) {
const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y), ramp = liftOf(p) / zoom;
const la = Floors.standOf(p, ax, ay), lb = Floors.standOf(p, bx, by), between = (ax !== bx || ay !== by) && la !== lb;
const fwd = (ax === bx ? p.ty - p.y || p.fy : p.tx - p.x || p.fx) >= 0, down = between && fwd === la > lb;
const f = ax === bx ? p.y - ay : p.x - ax, u = la > lb ? f : 1 - f;
let F = p.fall;
if (!F) {
if (!down || Math.abs(la - lb) < FALL.from || Climb.onLadder(ax, ay, la, bx, by, lb)) return null;
F = p.fall = {top: Math.max(la, lb) * RELIEF_STEP, land: Math.min(la, lb) * RELIEF_STEP, t0: 0};
}
if (F.done) {
if (!between) { p.fall = null; return null; }
return {body: F.land - ramp, ground: F.land - ramp, air: false};
}
if (!F.t0) {
if (!down) { p.fall = null; return null; }
if (u < .5) return {body: F.top - ramp, ground: F.top - ramp, air: false};
F.t0 = now;
}
const t = (now - F.t0) / 1000, h = F.top - .5 * FALL.g * t * t, mine = p.e && p.e.kind === "agent" && p.e.id === myId;
if (h <= F.land || t > 3) {
landed(p, (F.top - F.land) / RELIEF_STEP, now, mine);
p.fall = between ? {...F, done: true} : null;
return p.fall ? {body: F.land - ramp, ground: F.land - ramp, air: false} : null;
}
if (mine) fallWind(Math.min(1, FALL.g * t / 600));
return {body: h - ramp, ground: F.land - ramp, air: true};
}
function overBody(p, S) {
const cl = Climb.climbOf(p), j = p.fall && p.fallNow ? p.fallNow : jumpOf(p);
return [cl ? cl.dx * S : 0, (cl ? cl.dy * S - cl.lift * zoom : 0) - (j ? j.body * zoom : 0)];
}
function landed(p, layers, now, mine) {
const tx = Math.round(p.x), ty = Math.round(p.y), heavy = layers >= FALL.heavy, hurt = p.fallHurt;
if (mine) fallWind(-1);
for (const side of [-1, 1]) for (let i = 0; i < 3 + Math.min(6, layers); i++)
parts.push({x: p.x + .5 + side * .2, y: p.y + .85 - UP, vx: side * (1.5 + Math.random() * (2 + layers * .25)), vy: -.4 - Math.random() * 1.2,
g: 5, life: .35 + Math.random() * .3, age: 0, c: PCOL.dust[i % PCOL.dust.length], s: Math.random() < .4 ? 2 : 1});
smoke(p.x, p.y + .35 - UP, heavy ? 7 : 4, heavy ? .6 : .4);
sfx(heavy ? "fallthud" : "thud", tx, ty);
p.jpose = undefined;
if (heavy || hurt) p.bounce = now;
if (hurt) fallHurts(p, now, mine);
}
function fallHurts(p, now, mine) {
const n = p.fallHurt; if (!n) return;
p.fallHurt = 0;
flashes.set(p.e.kind + p.e.id, now);
floats.push({x: Math.round(p.x), y: Math.round(p.y), text: "-" + hearts(n), heart: true, color: "#ff8a7a", t: now / 1000});
if (mine) { sfx("hurt"); fallQuake = {t0: now, amp: FALL.shake[0] + Math.min(3, hearts(n))}; }
}
function fallShake(now) {
if (!opt("shake")) fallQuake = null;
if (!fallQuake) return 0;
const k = (now - fallQuake.t0) / 1000 / FALL.shake[1];
if (k >= 1) { fallQuake = null; return 0; }
return Math.round(Math.sin(k * 34) * fallQuake.amp * (1 - k) * (1 - k));
}
function jumping(p, now = performance.now()) {
const fall = falling(p, now);
if (fall) return fall;
if (now - p.bounce < FALL.bounce[1] * 1000 && !jumpOf(p)) {
const k = (now - p.bounce) / 1000 / FALL.bounce[1];
return {body: Math.sin(k * Math.PI) * FALL.bounce[0], ground: 0, air: false};
}
if (now - p.hop < HOP.ms && !jumpOf(p)) {
const k = (now - p.hop) / HOP.ms;
return {body: Math.round(Math.sin(k * Math.PI) * HOP.px), ground: 0, air: false};
}
const j = jumpOf(p), tx = Math.round(p.x), ty = Math.round(p.y);
if (j && p.jfrom === undefined) { p.jfrom = Floors.standOf(p, tx, ty); burst(p.x, p.y + .35 - UP, "dust", 3, {up: .8, spread: 1.6, g: 3, life: .3}); }
if (!j && p.jfrom !== undefined) {
const down = Floors.standOf(p, tx, ty) < p.jfrom;
smoke(p.x, p.y + .35 - UP, down ? 4 : 3, down ? .4 : .3); sfx(down ? "thud" : "step", tx, ty);
p.jfrom = p.jpose = undefined;
}
return j;
}
function jumpShadow(j, x, y, S, z, wide = 5) {
ctx.fillStyle = "rgba(40,30,50,.2)";
pixelOval(x + S / 2, y - Math.round(j.ground * z) + S - 2 * z, Math.max(wide * .6, wide - (j.body - j.ground) / 6), 2, 0, .5);
}
;
const BITES = 3, EAT_S = .9;
function eatPose(k) {
const t = k * BITES / EAT_S, n = Math.min(BITES - 1, Math.floor(t)), ph = Math.min(1, t - n);
const lift = ph < .4 ? ph / .4 : ph < .7 ? 1 : 1 - (ph - .7) / .3;
return {n, lift: lift * lift * (3 - 2 * lift), biting: ph >= .4 && ph < .7, bites: n + (ph >= .55 ? 1 : 0)};
}
const biteIcons = new Map();
const BITE_AT = [[6, 1, 2.6], [3, 0, 3.2], [4, 4, 9]];
function biteIcon(name, bites) {
const key = name + bites;
if (biteIcons.has(key)) return biteIcons.get(key);
const big = fullIcon(name).getContext("2d").getImageData(0, 0, 16, 16).data;
const c = document.createElement("canvas"); c.width = c.height = 8; const g = c.getContext("2d"), img = g.createImageData(8, 8);
let left = 0;
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
let best = -1;
for (const [dx, dy] of [[1, 1], [0, 0], [1, 0], [0, 1]]) { const i = ((y * 2 + dy) * 16 + x * 2 + dx) * 4; if (big[i + 3] > 128) { best = i; break; } }
if (best < 0 || BITE_AT.slice(0, bites).some(([bx, by, r]) => (x - bx) ** 2 + (y - by) ** 2 < r * r)) continue;
img.data.set(big.slice(best, best + 4), (y * 8 + x) * 4); left++;
}
g.putImageData(img, 0, 0);
biteIcons.set(key, left ? c : null); return left ? c : null;
}
const SWING_ROW = {axe: "axe", sword: "sword", spear: "spear", pickaxe: "pickaxe", hoe: "hoe", watering_can: "water"};
function drawEntity(p, sx, sy, S, t, now) {
const a = parts.length, b = puffs.length;
drawBody(p, sx, sy, S, t, now);
if (parts.length > a || puffs.length > b) { const up = liftOf(p); for (let i = a; i < parts.length; i++) parts[i].lift = up; for (let i = b; i < puffs.length; i++) puffs[i].lift = up; }
}
function drawBody(p, sx, sy, S, t, now) {
const e = p.e, z = zoom;
let x = Math.round(sx(p.x));
let y = Math.round(bodyY(p, sy));
if (x < -S * 2 || x > W + S * 2 || y < -S * 2 || y > H + S * 2) return;
const moving = now - p.moved < 300;
const j = jumping(p, now);
const cl = Climb.climbOf(p);
if (cl) { x += Math.round(cl.dx * S); y += Math.round(cl.dy * S - cl.lift * z); }
if (j && e.kind !== "agent") { jumpShadow(j, x, y, S, z, ANIMALS[e.kind] && ANIMALS[e.kind].fw === 32 ? 8 : 5); y -= Math.round(j.body * z); }
if (e.kind === "agent") {
const mine = me && e.id === myId;
if (e.eats && !p.eatSince) p.eatSince = now;
if (!e.eats) p.eatSince = 0;
let action = mine && (myAside || myAction) ? myAside || myAction
: !mine && e.eats ? {tool: "eat", item: e.eats, t0: p.eatSince}
: e.doing ? {tool: e.doing, dir: e.dir, at: e.at, tid: e.tid, with: e.with, item: e.item, t0: p.doingSince || now} : null;
if ((!action || action.tool === "walk" || action.tool === "move_to") && p.swing && now - p.swing.t0 < 320)
action = {tool: "attack", t0: p.swing.t0, with: p.swing.with};
if (e.doing && !p.doingSince) p.doingSince = now;
if (!e.doing) p.doingSince = 0;
if (!mine) p.running = !!e.run;
if (action && action.dir && DIRV[action.dir]) { [p.fx, p.fy] = DIRV[action.dir]; }
if (action && action.tid != null) { const q = [...ents.values()].find((q) => q.e && q.e.id == action.tid); if (q) { p.fx = Math.sign(q.x - p.x); p.fy = p.fx ? 0 : Math.sign(q.y - p.y); } }
const sheetImg = wornReady(agentTint(e.name), e.worn, e.race, e.bot); if (!sheetImg) return;
let bob = j ? Math.round(j.body * z) : 0, anim = "idle", frame, lunge = 0, blow = null;
const tool = action && action.tool, k = action ? (now - action.t0) / 1000 : 0;
if ((mine || e.name === follow) && !(cl && cl.on) && !(opt("depth") && opt("shadows") > 0)) {
ctx.fillStyle = mine ? "rgba(255,248,232,.55)" : "rgba(255,200,120,.55)";
pixelOval(x + S / 2, y - (j ? Math.round(j.ground * z) : 0) + S - 2 * z, 6, 2.5, 0, .5);
}
if (j) jumpShadow(j, x, y, S, z);
if (tool === "dig" || tool === "attack" || tool === "craft") {
const [tx, ty] = action.at || [Math.round(p.tx) + p.fx, Math.round(p.ty) + p.fy], target = combAt(tx, ty);
const held = action.with && SWING_ROW[action.with];
anim = held || "idle";
const fps = tool === "attack" ? 20 : 13, n = Math.floor(k * fps);
frame = n % 8;
if (!held) lunge = Math.round(Math.sin(Math.min(1, frame / 6) * Math.PI) * 3) * z;
if (tool === "attack" && SwingArt.KINDS.includes(action.with)) { blow = [action.with, frame]; anim = "idle"; lunge = SwingArt.STEP[action.with][frame] * z; }
const swing = Math.floor(n / 8);
if (frame >= 4 && p.lastSwing !== swing) {
p.lastSwing = swing;
if (tool === "dig" && target) {
const spr = GROUND.has(target) ? null : objectSprite(target, tx, ty, now / 1000);
debris(tx, ty, spr, GROUND.has(target) ? 5 : 4, {kind: "o", dy: "TFU".includes(target) ? -.5 : 0, dust: "M*%Y".includes(target) || GROUND.has(target)});
shakes.set(tx + "," + ty, now);
const mat = GROUND.has(target) ? "soil" : material(target);
sfx(!held && (mat === "wood" || mat === "stone") ? "punch" : STRIKE[mat], tx, ty);
} else if (tool === "craft") burst(Math.round(p.tx), Math.round(p.ty), "spark", 5, {dy: -.6, g: 4});
}
if (blow) frame = 0;
} else if (tool === "water") {
anim = "water"; const n = Math.floor(k * 10); frame = n % 8;
if (frame >= 3 && frame <= 6 && p.lastDrop !== n) { p.lastDrop = n; const [tx, ty] = action.at || [Math.round(p.tx) + p.fx, Math.round(p.ty) + p.fy];
parts.push({x: tx + .3 + Math.random() * .4, y: ty - .1, vx: (Math.random() - .5) * .6, vy: 1.5, g: 9, life: .35, age: 0, c: "#8fd3f4", s: 1});
if (n % 3 === 0) sfx("pour", tx, ty); }
} else if (tool === "milk" || tool === "feed" || tool === "sleep") {
bob = tool === "sleep" ? 0 : Math.round(Math.abs(Math.sin(k * 8)) * 2) * z;
if (tool === "sleep" && !emotes.has(e.name)) emote(e.name, "sleep");
} else if (tool === "eat") {
const pose = eatPose(k);
if (k < .05) p.lastBite = -1;
bob += pose.biting ? z : 0;
if (pose.biting && p.lastBite !== pose.n) {
p.lastBite = pose.n; sfx("eat", p.x, p.y);
const mx = p.x + .5 + (p.fx || 0) * .28, cols = spriteColors([fullIcon(action.item), 0, 0, 16, 16]);
for (let i = 0; i < 4; i++) parts.push({x: mx + (Math.random() - .5) * .25, y: p.y + .35 - UP, vx: (Math.random() - .5) * .8,
vy: -.3 - Math.random() * .6, g: 9, floor: p.y + .85 - UP + Math.random() * .1, life: .5 + Math.random() * .3, age: 0, c: cols[i % cols.length], s: 1});
}
} else if (tool === "place" || tool === "pick_up" || tool === "give" || tool === "store" || tool === "take" || tool === "drop") {
bob = Math.round(Math.sin(Math.min(1, k * 5) * Math.PI) * 3) * z;
}
if (frame === undefined && cl && cl.on) {
p.fx = cl.fx; p.fy = cl.fy; anim = "walk"; frame = Math.floor(cl.u * 24) % 8;
if (mine && frame % 4 === 0 && p.lastStep !== Math.floor(cl.u * 6)) { p.lastStep = Math.floor(cl.u * 6); sfx("tock"); }
}
if (frame === undefined) {
const moving = p.walking || (e.doing === "walk" && !mine) || now - p.moved < 220 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
const running = moving && (p.running || (mine && sprinting()));
if (moving) {
anim = running ? "run" : "walk";
const ms = running ? 60 : 85;
frame = Math.floor(now / ms) % 8;
if (frame % 4 === 0 && p.lastStep !== Math.floor(now / ms) && !swimsAt(p, e) && !j) {
p.lastStep = Math.floor(now / ms);
if (running) kickDust(p); else burst(p.x, p.y + .35 - UP, "dust", 2, {up: .6, spread: 1.2, g: 2, life: .35});
if (mine) sfx(Floors.rise(p) ? "tock" : STEP[gndAt(Math.round(p.x), Math.round(p.y))] || "step");
}
} else frame = Math.floor(now / 140 + e.id * 3) % 8;
}
if (j && ANIM[anim] <= ANIM.run) [anim, frame] = p.jpose || (p.jpose = [anim, frame]);
if (j && j.air && ANIM[anim] <= ANIM.run) { anim = "run"; frame = Math.floor(now / FALL.flail) % 2 ? 2 : 6; }
if (tool === "sleep" && action.dir && DIRV[action.dir]) {
const bx = Math.round(p.tx) + DIRV[action.dir][0], by = Math.round(p.ty) + DIRV[action.dir][1];
if (combAt(bx, by) === "B") {
const bed = objectSprite("B", bx, by, t), px0 = sx(bx), py0 = sy(by, bx);
ctx.drawImage(sheetImg, (Math.floor(now / 400) % 2) * 48, 0, 48, 48, px0 - 16 * z, py0 - 26 * z, 48 * z, 48 * z);
ctx.drawImage(bed[0], bed[1], bed[2] + 14, 16, 18, px0, py0 + (bed[6] + 14) * z, 16 * z, 18 * z);
return;
}
}
if (swimsAt(p, e) && !(j && j.air)) { drawSwimmer(p, e, sheetImg, x, y, z, now, sx, sy); return; }
p.swam = false;
drawWake(p, now, sx, sy, z);
if (e.sail) {
y += STAND * z;
const movingB = now - p.moved < 300 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
const bf = movingB ? Math.floor(now / 140) % 3 : Math.floor(now / 600) % 2, brow = movingB ? 64 : 32;
ctx.save();
if (p.fx < 0) { ctx.translate(x + S / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + S / 2), 0); }
ctx.drawImage(IMG.boats, bf * 48, brow, 48, 32, x - 16 * z, y - 10 * z, 48 * z, 32 * z);
ctx.restore();
ctx.drawImage(sheetImg, (Math.floor(now / 500) % 2) * 48, DIR_ROW(p) * 48, 48, 28, x - 16 * z, y - 22 * z, 48 * z, 28 * z);
return;
}
const sxx = frame * 48, syy = (ANIM[anim] + DIR_ROW(p)) * 48;
const fl = flashes.get("agent" + e.id), hitK = fl ? (now - fl) / 1000 : 9;
const kb = hitK < .15 ? Math.round((1 - hitK / .15) * 2) * z : 0;
const cellX = x - 16 * z - p.fx * (kb - lunge), cellY = y - 18 * z - bob - p.fy * (kb - lunge), fi = syy / 48 * 8 + frame;
wearFx("back", e, sheetImg, fi, cellX, cellY, z, now, moving, [-p.fx, -p.fy]);
const arm = () => blow && ctx.drawImage(SwingArt.sheetFor(blow[0], sheetImg), blow[1] * 48, DIR_ROW(p) * 48, 48, 48, cellX, cellY, 48 * z, 48 * z);
if (p.fy < 0) arm();
ctx.drawImage(sheetImg, sxx, syy, 48, 48, cellX, cellY, 48 * z, 48 * z);
wearFx("front", e, sheetImg, fi, cellX, cellY, z, now, moving, [-p.fx, -p.fy]);
if (p.fy >= 0) arm();
if (tool === "eat" && action.item && p.fy >= 0) {
const pose = eatPose(k), food = biteIcon(action.item, pose.bites);
if (food) {
const mx = Math.round(x + S / 2 + (p.fx || 0) * 4 * z), my = Math.round(y + 5 * z);
const fx = mx - 4 * z + (p.fx || 0) * z * Math.round(2 * (1 - pose.lift)), fy = my - 3 * z + z * Math.round(5 * (1 - pose.lift));
ctx.drawImage(food, fx, fy - bob, 8 * z, 8 * z);
}
}
if (hitK < .12) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .7; ctx.drawImage(sheetImg, sxx, syy, 48, 48, x - 16 * z, y - 18 * z, 48 * z, 48 * z); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }
} else if (ANIMALS[e.kind]) {
const A = ANIMALS[e.kind], img = animalSheet(e.kind, e.id), fw = A.fw, big = fw === 32;
const moving = now - p.moved < 350 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
let st;
if (moving) st = A.walk;
else if (e.love) st = A.love;
else if (clock.night) st = A.sleep;
else st = hash(e.id, Math.floor((now / 1000 + e.id) / 4), 7) < .45 ? A.idle : A.alt;
const [row, n, ms] = st, f = Math.floor(now / (e.scared ? ms / 2 : ms) + e.id) % n;
const fl = flashes.get(e.kind + e.id), white = fl && now - fl < 120;
const w = fw * z, dx = big ? x - S / 2 : x, dy = big ? y - S : y;
ctx.save();
const blit = (ox) => { ctx.drawImage(img, f * fw, row * fw, fw, fw, ox, dy, w, w); if (white) { ctx.globalCompositeOperation = "lighter"; ctx.drawImage(img, f * fw, row * fw, fw, fw, ox, dy, w, w); } };
if (p.fx < 0) { ctx.translate(dx + w, 0); ctx.scale(-1, 1); blit(0); } else blit(dx);
ctx.restore();
if (e.love && A.hearts) ctx.drawImage(img, (Math.floor(now / 140) % A.hearts[1]) * 16, A.hearts[0] * 16, 16, 16, x, y - S + 2 * z, S, S);
} else if (WILD[e.kind]) {
drawWild(p, x, y, now);
}
}
function drawNameplate(p, sx, sy, S) {
const e = p.e, o = overBody(p, S), x = Math.round(sx(p.x) + S / 2 + o[0]); let y = Math.round(bodyY(p, sy) + o[1] - 9 * zoom);
{ const r = e.kind === "agent" && e.id === myId && typeof HdLook !== "undefined" && HdLook.live && !Build.on && HdLook.aim, nw = e.name.length * 6; if (r && x - nw < r.x + r.w && r.x < x + nw && y - 18 < r.y + r.h && r.y < y + 6) y = Math.round(r.y - 8); }
if (e.kind === "agent" && e.id === myId && ctx !== HdView.sink()) { const nw = opt("names") ? e.name.length * 5.5 + 2 : 0, top = y + 9 * zoom - Math.max(0, 12 - 3 * zoom);
Prompts.keep = [{x: x - S / 2, y: top, w: S, h: S + Math.max(0, 12 - 3 * zoom) + 2 * zoom}, {x: x - nw, y: y - 18, w: 2 * nw, h: 24}]; }
if (!opt("names")) return;
if (x < -S || x > W + S || y < -S || y > H + S || (typeof TitleScene !== "undefined" && TitleScene.hides(x - e.name.length * 6, y - 18, e.name.length * 12, 24))) return;
if (e.kind === "agent" && e.id === myId && Target.over(x - e.name.length * 6, y - 18, e.name.length * 12, 24)) return;
ctx.font = "18px SproutPixel"; ctx.textAlign = "center";
if (!(e.kind === "agent" && speaking(e.name))) outlined(e.name, x, y, me && e.name === me ? "#fff1a8" : "#fff8e8");
if (e.kind === "agent" && e.hp < HP_MAX) { ctx.fillStyle = "#5b3f36"; ctx.fillRect(x - 16, y + 4, 32, 5); ctx.fillStyle = e.hp > .4 * HP_MAX ? "#6aa66f" : "#d9473a"; ctx.fillRect(x - 15, y + 5, 30 * e.hp / HP_MAX, 3); }
ctx.textAlign = "start";
}
const AMBLE = {chicken: 1.6, chick: 1.4, cow: 1.2, calf: 1.3, tusker: 1.2, pincer: 4, strawman: 1.2, wisp: 3.3, wyrm: 2.5, mossback: .9, sporeling: 2.2};
const FLEE_STRIDE = .3;
function drawProgress(sx, sy, S) {
if (!progress || !me) return;
const p = ents.get("agent" + myId); if (!p) return;
const k = Math.min(1, (performance.now() - progress.t0) / progress.ms);
if (k >= 1) { progress = null; return; }
const o = overBody(p, S), x = Math.round(sx(p.x) + S / 2 - 18 + o[0]), y = Math.round(bodyY(p, sy) + o[1] + S + 2);
ctx.fillStyle = "#5b3f36"; ctx.fillRect(x - 2, y - 2, 40, 9);
ctx.fillStyle = "#e9cfa2"; ctx.fillRect(x, y, 36, 5);
ctx.fillStyle = "#6aa66f"; ctx.fillRect(x, y, Math.round(36 * k), 5);
}
;
const BUBBLE = {q: 2, life: 7, after: 3.5, most: 3, wide: 400, lines: 7, pitch: 20, padX: 8, padY: 6, gap: 2, fall: 12, fade: .25,
ink: "#5b3f36", paper: "#fff6e2", shout: "#ffe3a3", foot: "#ecd7b0", footShout: "#f2c877", shade: "rgba(60,40,30,.25)"};
function bubbleShape(b) {
if (b.rows) return b;
const words = b.text.trim().split(/\s+/), rows = [""];
const fits = (s) => ctx.measureText(s).width <= BUBBLE.wide;
for (let w of words) {
while (!fits(w)) {
let n = w.length; while (n > 1 && !fits(w.slice(0, n))) n--;
if (rows[rows.length - 1]) rows.push(""); rows[rows.length - 1] = w.slice(0, n); w = w.slice(n);
}
const last = rows[rows.length - 1], more = last ? last + " " + w : w;
if (fits(more)) rows[rows.length - 1] = more; else rows.push(w);
}
if (rows.length > BUBBLE.lines) {
rows.length = BUBBLE.lines; let s = rows[BUBBLE.lines - 1];
while (s && !fits(s + "…")) s = s.slice(0, -1);
rows[BUBBLE.lines - 1] = s.trimEnd() + "…";
}
const q = BUBBLE.q, even = (v) => Math.ceil(v / q) * q;
b.rows = rows; b.w = Math.max(even(Math.max(...rows.map((r) => ctx.measureText(r).width))) + 2 * BUBBLE.padX, even(ctx.measureText(b.name).width) + 12 * q);
b.h = rows.length * BUBBLE.pitch + 2 * BUBBLE.padY - 4;
b.life = Math.max(BUBBLE.life, b.text.length * BABBLE.letter + BUBBLE.after);
return b;
}
function bubbleBox(b, x, y, tx) {
const q = BUBBLE.q, {w, h} = b, r = (c, X, Y, W_, H_) => { ctx.fillStyle = c; ctx.fillRect(X, Y, W_, H_); };
const paper = b.shout ? BUBBLE.shout : BUBBLE.paper;
r(BUBBLE.shade, x + q, y + h, w - 2 * q, q);
r(BUBBLE.ink, x + q, y, w - 2 * q, h); r(BUBBLE.ink, x, y + q, w, h - 2 * q);
r(paper, x + 2 * q, y + q, w - 4 * q, h - 2 * q); r(paper, x + q, y + 2 * q, w - 2 * q, h - 4 * q);
r(b.shout ? BUBBLE.footShout : BUBBLE.foot, x + 2 * q, y + h - 2 * q, w - 4 * q, q);
if (tx != null) {
r(paper, tx - 3 * q, y + h - 2 * q, 6 * q, 2 * q);
r(BUBBLE.ink, tx - 3 * q, y + h, 6 * q, q); r(paper, tx - 2 * q, y + h, 4 * q, q);
r(BUBBLE.ink, tx - 2 * q, y + h + q, 4 * q, q); r(b.shout ? BUBBLE.footShout : BUBBLE.foot, tx - q, y + h + q, 2 * q, q);
r(BUBBLE.ink, tx - q, y + h + 2 * q, 2 * q, q);
}
}
function bubbleTab(name, x, y, mine) {
const q = BUBBLE.q, w = Math.ceil(ctx.measureText(name).width / q) * q + 6 * q, h = 11 * q;
ctx.fillStyle = BUBBLE.ink; ctx.fillRect(x + 3 * q, y - h, w, h); ctx.fillRect(x + 2 * q, y - h + q, w + 2 * q, h - q);
ctx.fillStyle = mine ? "#fff1a8" : BUBBLE.paper; ctx.fillText(name, x + 6 * q, y - 2 * q);
}
const speaking = (name) => bubbles.some((b) => b.name === name && b.at);
let bubbleT = 0;
function drawBubbles(sx, sy, S, t) {
if (!opt("bubbles")) { bubbles = []; bubbleT = t; return; }
const dt = Math.min(.1, Math.max(0, t - bubbleT)), q = BUBBLE.q, snap = (v) => Math.round(v / q) * q; bubbleT = t;
ctx.font = "18px SproutPixel"; ctx.textAlign = "left";
bubbles = bubbles.filter((b) => t - b.t < bubbleShape(b).life);
const by = new Map();
for (const b of bubbles) { if (!by.has(b.name)) by.set(b.name, []); by.get(b.name).push(b); }
const piles = [];
for (const [name, mine] of by) {
while (mine.length > BUBBLE.most) bubbles.splice(bubbles.indexOf(mine.shift()), 1);
const p = [...ents.values()].find((e) => e.e && e.e.kind === "agent" && e.e.name === name); if (!p) continue;
let up = 0;
for (const b of mine) {
b.up = b.up === undefined || b.up < up ? up : Math.max(up, b.up - Math.max(q, (b.up - up) * dt * BUBBLE.fall));
up += b.h + BUBBLE.gap;
}
const o = overBody(p, S), tx = snap(sx(p.x) + S / 2 + o[0]), foot = snap(bodyY(p, sy) + o[1] - (p.e.hp < HP_MAX ? 9 * zoom + 4 : 4 * zoom)) - 3 * q,
w = Math.max(...mine.map((b) => b.w));
const top = foot - Math.max(...mine.map((b) => b.up + b.h)) - 11 * q;
if (tx < -w || tx > W + w || foot < -20 || top > H) continue;
piles.push({mine, tx, foot, w, top, y: p.y, name});
}
piles.sort((a, b) => b.y - a.y);
const placed = [];
for (const pile of piles) {
const x0 = (b) => Math.max(4, Math.min(W - 4 - b.w, snap(pile.tx - b.w / 2)));
for (let n = 0; n < 8; n++) {
const l = Math.min(...pile.mine.map(x0)), hit = placed.find((o) => l < o.r + 4 && l + pile.w > o.l - 4 && pile.top < o.b + 4 && pile.foot + 3 * q > o.t - 4);
if (!hit) break;
const lift = pile.foot + 3 * q - (hit.t - 4); pile.foot -= lift; pile.top -= lift;
}
if (typeof TitleScene !== "undefined" && TitleScene.hides(Math.min(...pile.mine.map(x0)), pile.top, pile.w, pile.foot + 3 * q - pile.top)) { for (const b of pile.mine) b.at = b.up = undefined; continue; }
placed.push({l: Math.min(...pile.mine.map(x0)), r: Math.min(...pile.mine.map(x0)) + pile.w, t: pile.top, b: pile.foot + 3 * q});
pile.mine.forEach((b, n) => {
const since = t - b.t, jolt = b.shout && since < .5 ? (Math.floor(since * 30) % 2 ? q : -q) : 0;
const x = x0(b) + jolt, y = pile.foot - snap(b.up) - b.h;
ctx.globalAlpha = Math.max(0, Math.min(1, (b.life - since) / BUBBLE.fade));
bubbleBox(b, x, y, n ? null : Math.max(x + 5 * q, Math.min(x + b.w - 5 * q, pile.tx)));
ctx.fillStyle = BUBBLE.ink;
let left = written(b.text, since).length;
b.rows.forEach((row, i) => { if (left > 0) ctx.fillText(row.slice(0, left), x + BUBBLE.padX, y + BUBBLE.padY + 14 + i * BUBBLE.pitch); left -= row.length + 1; });
b.at = [x, y];
if (n === pile.mine.length - 1) { ctx.globalAlpha = pile.mine.length > 1 ? 1 : ctx.globalAlpha; bubbleTab(pile.name, x, y, me && pile.name === me); }
});
}
ctx.globalAlpha = 1; ctx.textAlign = "start";
}
;
const SunLand = (() => {
const SHADE = {alpha: .3, night: 0, reach: 1.5, fall: .45, fire: 6};
function hour() {
const phase = (((clock.phase || 0) % 1) + 1) % 1, day = phase < .75;
const a = day ? phase / .75 : (phase - .75) / .25;
const tint = lightAt(phase), dark = Math.min(1, (1 - (.3 * tint[0] + .59 * tint[1] + .11 * tint[2]) / 255) / .36);
const much = opt("shadows") / 100, long = opt("shadowlen") / 100;
return {dark, much, long, alpha: Math.min(.9, (SHADE.alpha + (SHADE.night - SHADE.alpha) * dark) * much), kx: (2 * a - 1) * SHADE.reach * long, ky: SHADE.fall * long};
}
return {hour, SHADE};
})();
;
const GpuTime = (() => {
const all = [], got = [], recent = [];
let ok = false, want = false, at = -1;
const make = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (kind, ...a) {
const gl = make.call(this, kind, ...a);
if (gl && kind === "webgl2" && !all.some((c) => c.gl === gl)) all.push({gl, ext: undefined, open: null, wait: [], spare: [], res: []});
return gl;
};
function each(c) {
const gl = c.gl;
if (c.ext === undefined) { c.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") || null; ok = ok || !!c.ext; }
if (!c.ext || gl.isContextLost()) return false;
if (c.open) { gl.endQuery(c.ext.TIME_ELAPSED_EXT); c.wait.push(c.open); c.open = null; }
const jumped = gl.getParameter(c.ext.GPU_DISJOINT_EXT);
while (c.wait.length && gl.getQueryParameter(c.wait[0], gl.QUERY_RESULT_AVAILABLE)) {
const q = c.wait.shift(); c.res.push(jumped ? NaN : gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); c.spare.push(q);
}
if (want && c.wait.length < 6) { c.open = c.spare.pop() || gl.createQuery(); gl.beginQuery(c.ext.TIME_ELAPSED_EXT, c.open); }
return true;
}
function frame(now) {
if (now === at) return;
at = now; want = true;
const live = all.filter(each);
while (live.length && live.every((c) => c.res.length)) {
const ms = live.reduce((s, c) => s + c.res.shift(), 0);
if (ms !== ms) continue;
got.push(ms); recent.push([now, ms]);
}
while (recent.length && now - recent[0][0] > 500) recent.shift();
if (got.length > 3000) got.splice(0, got.length - 3000);
}
function stop() { want = false; for (const c of all) if (c.open && c.ext && !c.gl.isContextLost()) { c.gl.endQuery(c.ext.TIME_ELAPSED_EXT); c.wait.push(c.open); c.open = null; } }
return {frame, stop, take: () => got.splice(0, got.length), get ok() { return ok; }, get contexts() { return all.length; },
get ms() { return recent.length ? recent.reduce((s, r) => s + r[1], 0) / recent.length : null; }};
})();
;
const VoxGL = (() => {
let el = null, gl = null, bad = false;
function start() {
if (gl || bad) return gl;
el = document.createElement("canvas");
try { gl = el.getContext("webgl2", {alpha: false, antialias: false, depth: true, stencil: true}); } catch (e) { gl = null; }
if (!gl) { bad = true; el = null; return null; }
el.addEventListener("webglcontextlost", (e) => { e.preventDefault(); bad = true; gl = null; });
return gl;
}
function program(vs, fs) {
const pr = gl.createProgram();
for (const [type, text] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s);
if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
gl.attachShader(pr, s);
}
gl.linkProgram(pr);
if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
const u = {};
for (let i = 0; i < gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS); i++) { const n = gl.getActiveUniform(pr, i).name; u[n] = gl.getUniformLocation(pr, n); }
return {pr, u, at: (n) => gl.getAttribLocation(pr, n)};
}
function texture(src, t = null) {
t = t || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
if (src.px) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, src.w, src.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(src.px.buffer, src.px.byteOffset, src.w * src.h * 4));
else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
return t;
}
function fit(w, h) { if (el && (el.width !== w || el.height !== h)) { el.width = w; el.height = h; } }
return {start, program, texture, fit, get gl() { return gl; }, get el() { return el; }, get ok() { return !bad; }};
})();
;
const VoxCurve = (() => {
const span = (c) => { const q = c.floor || 0, D = c.y0 - c.yh; return [D, 2 * D * (1 - q), q]; };
function core(c, s, up) {
const d = c.y0 - s + c.lean * up;
if (d <= 0) return s - up;
const [D, d1, q] = span(c), e = d - d1;
return s - up + (e > 0 ? D * (1 - q) * (1 - q) + (1 + q) * e + e * e / (4 * D) : d * d / (4 * D));
}
const y = (c, f, h = 0) => { if (!c) return f - h; const up = Math.max(0, h - c.ref); return core(c, f - h + up, up); };
const snap = (c, f, h, o, k) => { const v = y(c, f, h); return v === f - h ? v : Math.floor((v - o) / k + .5) * k + o; };
const rows = (i, n, cell) => Math.floor((i + .5) * cell / n + .01);
function inv(c, s) {
if (!c || s >= c.y0) return s;
const [D, d1] = span(c);
return c.y0 - Math.min(d1, 2 * D * (1 - Math.sqrt(Math.max(0, 1 - (c.y0 - s) / D))));
}
const edge = (c) => c.y0 - span(c)[1];
const past = (c, f, h = 0) => { if (!c) return 0; const up = Math.max(0, h - c.ref); return Math.max(0, c.y0 - (f - h + up) + c.lean * up - span(c)[1]); };
const line = (c, h = 0) => c.yh + (c.y0 - c.yh) * (c.floor || 0) ** 2 - Math.max(0, h - c.ref) * (1 - c.lean);
const squeeze = (c, s) => { if (!c) return 1; const [D, , q] = span(c); return Math.max(q, Math.min(1, 1 - (c.y0 - s) / (2 * D))); };
const GLSL = `uniform vec4 uCurve; uniform float uFloor;
float curveY(float f, float h, out float past) {
  float D = uCurve.x - uCurve.y, up = max(0., h - uCurve.z), d = uCurve.x - (f - h + up) + uCurve.w * up; past = 0.;
  if (D <= 0. || d <= 0.) return f - h;
  past = max(0., d - 2. * D * (1. - uFloor));
  return f - h + (past > 0. ? D * (1. - uFloor) * (1. - uFloor) + (1. + uFloor) * past + past * past / (4. * D) : d * d / (4. * D));
}`;
const VS = GLSL + `
float rollY(float f, float h, out float past) { float y = curveY(f, h, past); return y == f - h ? y : floor((y - uO.y) / uK + .5) * uK + uO.y; }`;
const FS = `float rollRow(float v, float y, float o, float k) { float c = (floor((y - o) / k) + .5) * k + o, dy = dFdy(y); return abs(dy) > 0. ? v + (c - y) * dFdy(v) / dy + .003 : v; }
float rollPick(float i, float n, float cell) { return floor((i + .5) * cell / n + .01); }`;
return {y, snap, rows, inv, past, edge, line, squeeze, GLSL, VS, FS, warp: (c, s) => (c ? core(c, s, 0) : s)};
})();
;
const VoxSky = (() => {
const VS = `#version 300 es\nin vec2 p; void main() { gl_Position = vec4(p, .9998, 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uPx, uK, uLine, uT, uShift, uStars, uAudit; uniform vec3 uTop, uLow, uCloud, uFar, uNear, uOrb, uAt; out vec4 o;
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) { vec2 i = floor(q), f = fract(q); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float ridge(float x, float seed, float f) { return noise(vec2(x * f + seed, seed)) * .6 + noise(vec2(x * f * 2.7 + seed, 3.)) * .28 + noise(vec2(x * f * 6.1, seed)) * .12; }
void main() {
  vec2 a = floor(vec2(gl_FragCoord.x, uRes.y * uPx - gl_FragCoord.y) / uPx / uK);      // this px of the paint, from the picture's top left
  float line = floor(uLine / uK), up = line - a.y, band = max(line, 8.), ax = a.x + floor(uShift);
  // (the far hills, the further ones and the clouds slide past as you go, each slower than the one before it, by whole px;
  // under the line, where no land is known: the nearer hills' own colour, not a pale band)
  float ax1 = a.x + floor(uShift * .6), axc = a.x + floor(uShift * .3);
  if (up <= 0.) { o = vec4(uAudit > .5 && up < 0. ? vec3(1., 0., 1.) : mix(uNear, uLow, .18), 1.); return; }      // (the first px under the line is the hills' still: the land's last row is on the land's own px, up to half a px off the line)
  // the sky's colour: seven flat bands, the top of each checkered into the next
  float g = pow(clamp(up / band, 0., 1.), .7) * 6., i = mod(a.x, 2.) + mod(a.y, 2.) * 2., dither = i < .5 ? 0. : i < 1.5 ? .5 : i < 2.5 ? .75 : .25;
  vec3 c = mix(uLow, uTop, min(6., floor(g + dither * .5)) / 6.);
  c += step(.9975, hash(a)) * uStars * (.6 + .4 * sin(uT * 3. + a.x));
  // the sun, or the moon: a disc and two rings of its light
  vec2 orb = vec2(floor(uRes.x / uK * uAt.x), line - floor(band * uAt.y));
  float disc = length(a + .5 - orb), r = uAt.z;
  c += uOrb * (step(disc, r + 3.) * .1 + step(disc, r + 8.) * .06);
  // clouds: a body and a darker edge round it; the sun (the moon) is in front of them, the hills in front of it
  vec2 q = vec2(axc * .03 + uT * .012, up * .085);            // (the same clouds whatever the sky's height: from a tower it is the whole picture)
  float cl = noise(q) * .55 + noise(q * 2.3 + 4.1) * .3 + noise(q * 5.1 + 9.) * .15;
  if (cl > .6) c = mix(c, uCloud, .92); else if (cl > .56) c = mix(c, uCloud * .86, .7);
  if (disc < r) c = uOrb;
  // far hills in two rows, the far one with snow on its heights
  float far = min(band, 36.), h1 = ridge(ax1, 11., .03), m1 = 2. + floor(far * .62 * h1), m2 = 1. + floor(far * .3 * ridge(ax, 47., .055));      // (as tall from a mountain, where the sky is wide, as from the plain)
  if (up < m1) c = mix(uFar, uLow, up < m1 * .45 ? .4 : .16);
  if (up < m1 && up > m1 - 3. && h1 > .56) c = mix(c, uCloud, .6);
  if (up < m2) c = mix(uNear, uLow, .18);
  o = vec4(c, 1.);
}`;
let prog = null, quad = null, bad = false;
function draw(sky, w, h, pw, k) {
const gl = VoxGL.gl;
if (bad || !gl) return;
if (!prog) {
try { prog = VoxGL.program(VS, FS); } catch (e) { bad = true; console.error(e); return; }
quad = {vao: gl.createVertexArray(), buf: gl.createBuffer()};
gl.bindVertexArray(quad.vao); gl.bindBuffer(gl.ARRAY_BUFFER, quad.buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(prog.at("p")); gl.vertexAttribPointer(prog.at("p"), 2, gl.FLOAT, false, 0, 0);
}
const u = prog.u;
gl.useProgram(prog.pr); gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uPx, pw / w); gl.uniform1f(u.uK, k); gl.uniform1f(u.uLine, sky.line); gl.uniform1f(u.uT, sky.t % 3600); gl.uniform1f(u.uShift, sky.shift || 0);
gl.uniform1f(u.uStars, sky.stars || 0); gl.uniform1f(u.uAudit, sky.audit ? 1 : 0);
for (const [name, v] of [["uTop", sky.top], ["uLow", sky.low], ["uCloud", sky.cloud], ["uFar", sky.far], ["uNear", sky.near], ["uOrb", sky.orb], ["uAt", sky.at]]) gl.uniform3f(u[name], v[0], v[1], v[2]);
gl.bindVertexArray(quad.vao); gl.drawArrays(gl.TRIANGLES, 0, 6);
gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
}
return {draw};
})();
;
const VoxMesh = (() => {
const has = (c, z) => { for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return i === 0 || z > c[i - 1]; return false; };
const rock = (cfg, top, z, on = true) => { const r = cfg.rock; return !r || (top < r.from && on !== 2) ? z : !on ? Math.min(z, r.from - 1) : z < r.from && z >= r.lo ? r.from + (z - r.lo) % r.n : z; };
const topOf = (c, z) => { if (c) for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return c[i]; return z; };
const pick = (x, y, z, n) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 5 & (n - 1);
return {has, pick, rock, topOf};
})();
;
const VoxStyleGLSL = (() => {
const AW = 1024, H = 1, LV = 16, LVC = `const float H = ${H.toFixed(1)}, LV = ${LV.toFixed(1)}, LV0 = ${(16 - LV).toFixed(1)};`;
const SINK = "float sink(float dn) { float k = floor(dn / 4.); return dn < 4. ? dn * dn : 16. * (k * k + (2. * k + 1.) * (dn / 4. - k)); }", sink = (dn) => { const k = Math.floor(dn / 4); return dn < 4 ? dn * dn : 16 * (k * k + (2 * k + 1) * (dn / 4 - k)); };
const VS = `#version 300 es
  in vec3 p; in vec2 uv; in vec4 a; in float e; uniform mat4 m; uniform vec3 ctr, go; uniform float bend; uniform sampler2D gw; out vec2 vu; out vec4 va, vs; out float ve; out vec3 wp; out highp float vw;
  ${SINK}
  void main() { vec3 q = p; float dn = max(0., ctr.z - 1. - q.z); q.y -= bend * sink(dn); gl_Position = m * vec4(q, 1.); vw = gl_Position.w; vu = uv; va = a; ve = e; wp = p; vs = vec4(0.);
    if (a.z > .5 && a.z < 1.5) { vec2 tl = floor(p.xz - step(8., mod(uv, 16.)) + .5) - go.xy; if (tl.x >= 0. && tl.y >= 0. && tl.x < go.z && tl.y < go.z) vs = texelFetch(gw, ivec2(tl), 0); } }`;
const FS = `#version 300 es
  precision mediump float; in vec2 vu; in vec4 va, vs; in float ve; in highp vec3 wp; in highp float vw; uniform sampler2D t, wt, mk; uniform vec3 lamp, eye, fogc, mc;
  uniform vec4 cl, wv, wtn[5]; uniform float wa, dep, lr, day, amb, fn, ff, rim, rd, sun, shp, cd, xr; uniform vec3 sc, bd[4]; uniform vec4 sp; uniform float rf, rz, ho, cp, bh; uniform vec3 em; out vec4 o;
  ${LVC}
  // STRATA: a wall of your hole by its level under the land round it (rz): each level one flat tone, a step darker than the one over it (to .3), every second one a little darker still: levels can be counted, deep is dark
  float strat(float lv) { return max(.3, .92 - .08 * max(0., rz - lv)) * (mod(floor(lv + .5) + 1024., 2.) < .5 ? 1. : .9); }
  float bit(float v, float k) { return mod(floor(v / k), 2.); }
  vec3 cold(vec3 c) { return mix(vec3(dot(c, vec3(.3, .59, .11))), c, .3) * vec3(.74, .82, .96); }   // (not reachable from here: grey-blue)
  // WHOLE ART PX ON A SIDE: a level's LV rows of paint seen in fewer rows of the picture (r: rows of paint a row of the picture, > 1) show as many rows as the picture has, each one whole:
  // its first rows from its top (the lit edge), then the seam's two at its foot; the middle ones left out; a level under 2 px (a tall face seen edge on): its body's row alone (it was its lit row and its seam in turn, a px each: noise). It was the nearest row: a joint or the seam kept on one level and lost on the next
  // (a level 6.5 px tall), the paint's 1-px columns kept: "1-px vertical streaks", stone a blur of bricks
  float whole(float t, float r) { if (r < 1.05) return floor(t); if (r > 4.) return 3.; float p = floor(t / r + .001), q = floor((LV - t) / r + .001); return q < .5 ? LV - 1. : q < 1.5 && p > .5 ? LV - 2. : min(p, LV - 3.); }
  // ...and its columns seen at a slant (a wall that faces west or east, a far one): one px of paint in each block of k (k: 2, 4, 8, 16: as many px across as the picture has), never a px between
  float pick(float t, float r) { if (r < 1.5) return floor(t); float k = r > 3. ? 16. : exp2(ceil(log2(r))); return min(15., floor(t / k) * k + floor(k * .5)); }   // (past 3 px of paint a px: one column a tile, the face in its courses' bands: it was noise, a tile's 16 columns in 3 px)
  void main() {
    vec2 gx = dFdx(vu), gy = dFdy(vu); highp vec3 wx = dFdx(wp), wy = dFdy(wp);   // (before anything is left out: a px's neighbours must still be there to say how fast its paint runs)
    float kind = va.z, ck = mod(floor(gl_FragCoord.x / 2.) + floor(gl_FragCoord.y / 2.), 2.); vec2 lu = mod(vu, 16.);
    if (!(abs(kind - 7.) < .5) && !(kind > 2.5 && kind < 3.5 && ve > 8.5) && !(kind > 8.5 && kind < 9.5) && (wp.x < cl.x + .001 || wp.x > cl.y - .001 || wp.z < cl.z + .001 || wp.z > cl.w + .001)) discard;   // (cl: the columns and rows of the land asked for: the lists are whole chunks of 8 x 8 tiles (vox_style_land.js), what is outside is left out here; not the far patches, not a ghost)
    float wn = 0., sj = 0., vl = 0.; highp float di = 0.;   // (the window: wn 0 this px is the land's as ever, 2 a floor over your head, 3 the section (sj: its row, counted up from the window's top edge), 11 its top line; sj -1: a px seen through the window, -2: the lip along its near edge, -3: a px beside its west or east edge)
    if (xr > 0. && !(kind > 8.5 && kind < 9.5)) { ivec2 P = ivec2(gl_FragCoord.xy), M = textureSize(mk, 0) - 1; vec4 k4 = texelFetch(mk, P, 0); highp float dz = k4.b * 255. + k4.a * 255. / 256.;
      di = k4.r * 255. + k4.g * 255. / 256.; float bay = ck * .5 + mod(floor(gl_FragCoord.x / 2.), 2.) * .25 + .125, up = mod(va.w + 1280. - vs.g * 255., 256.); bool thing = kind > 7.5 && kind < 8.5, ob = false; { vec3 tl = vec3(floor(wp.x - lu.x / 16. + .5), floor(wp.z - lu.y / 16. + .5), va.w); for (int n = 0; n < 4; n++) if (bd[n] == tl) ob = true; }   // (ob: somebody stands on this top, over your window: the ground under their feet stays as veil: they are up there, not in your room)
      if (dz > 0. && vw > dz && ((abs(kind - 7.) < .5) || (kind > 2.5 && kind < 3.5 && ve > 8.5))) discard;   // (the far land and sea past the box: under the ground from here, the rock between has no faces: it showed through the rim as sky-blue px)
      // (a wall's face that lies in a box's own side, the back of your south wall: with what is in front; a top the eye's line only grazes at a box's edge, a floor, the water of a gorge: left)
      if (di > 0. && vw < di + (kind < .5 ? .06 : -.02)) { if (kind > .5 && kind < 1.5 && va.y < .5 && vs.r > 0. && up > .5 && up < 8.5) wn = 2.;
        else if (ob && kind > .5 && kind < 1.5 && va.y > .5) { if (ck > .5) vl = 1.; else if (xr > bay) discard; }   // (ob: the ground under somebody standing on the land over your window stays, one px in two: they are up there, not in your room)
        else if (xr * (thing ? .5 : 1.) > bay) discard; }
      else if (dz > 0. && vw < dz - .05 && !thing && xr > bay - .5 * ck) {
        int j = 0; if (di == 0.) for (int n = 1; n <= 48; n++) if (j == 0 && texelFetch(mk, max(P - ivec2(0, n), ivec2(0)), 0).rg != vec2(0.)) j = n;
        if (j > 0) wn = texelFetch(mk, min(P + ivec2(0, 1), M), 0).ba == vec2(0.) ? 11. : 3.; sj = float(j);
        if (j == 0) { wn = .25; if (di == 0. && (texelFetch(mk, min(P + ivec2(0, 1), M), 0).rg != vec2(0.) || texelFetch(mk, min(P + ivec2(0, 2), M), 0).rg != vec2(0.))) sj = -2.; else if (di == 0. && (texelFetch(mk, min(P + ivec2(1, 0), M), 0).rg != vec2(0.) || texelFetch(mk, max(P - ivec2(1, 0), ivec2(0)), 0).rg != vec2(0.))) sj = -3.; } }
      if (di > 0. && vw >= di - .02) sj = -1.; }   // (sj -1: a px seen through the window: of your space)
    if (bh > 0. && kind < 1.5 && ck < 1. && wp.z >= lamp.z + .3 && wp.y > lamp.y - .3 && gl_FragCoord.y > mc.y + 1. && distance(gl_FragCoord.xy, mc.xy + vec2(0., 8.)) < (mc.z + 2.) * bh) discard;   // (BEHIND LAND taller than you (bh: the host's, eased): the same disc as in a roof or a tree: the land in front of you keeps one px in two there, you and the ground at your feet show in the others. You were a faint checker on a cliff's face and saw nothing round you. Not under your feet's line: there the land in front has nothing behind it but its own inside)
    bool cov = kind > 7.5 && kind < 8.5 && wp.z >= lamp.z + .3 && wp.y >= lamp.y - .55 && distance(gl_FragCoord.xy, mc.xy + vec2(0., 8.)) < mc.z + 2.;   // (a model's face south of you and over your feet, in the disc round your body)
    if (rd > .5 ? !cov || ck < 1. : cov) discard;   // (what covers you has a hole round you: you and what is behind it are drawn whole there, then (rd) one px in two of it again, 2x2: a checker disc on a roof, a wall, as on a tree (SF). It was the checker laid over you alone: you read as standing on the roof)
    vec2 tu = vu; if (kind < .5) { vec2 b0 = floor(vu / 16.) * 16., l0 = vu - b0; tu = max(length(gx), length(gy)) > 4. ? b0 + vec2(8.5, 15.5) : b0 + vec2(pick(l0.x, length(vec2(gx.x, gy.x))), LV0 + whole(l0.y - LV0, abs(gy.y))) + .5; }   // (a wall: its paint in whole art px; seen edge on (over 4 px of paint a px, its tiles and levels a px or less each): its seam's one dark tone, a side seen thin, as the pack draws one. It was a px of a different tile's paint each px: grey noise down a gorge's side)
    vec4 c = texture(t, tu / ${AW}.); if (kind > 7.5 && (c.a < .5 || (kind > 8.5 && kind < 9.5 && ck < 1.))) discard; if (kind > 9.5) { float sa = c.a * 255., rm = sa < 200. && sa > 150. ? 1. : 0., fx = sa > 240. || sa < 176. ? 1. : sun; if (rm != shp || fx < .03 || (sj < -.5 && sj > -1.5 && fx < 1.)) discard; o = vec4(.2, .15, .3, .3 * fx * (1. - .45 * rm)); return; } bool raw = false; if (c.a < .5) { c = vec4(em, 1.); raw = kind < 1.5; }   // (raw: a paint that is not there (it cannot be now: vox_style.js slot): the land's mean colour, flat, never one earth brown; its px are marked (alpha) and counted: HdLook.raw, a test holds it at 0)   // (8: a model's face, host.models: a bridge's planks; its see-through px are holes; 9: a ghost of one, view.ghosts: one px in two; 10: a shadow on the ground, box.shade: a flat shade laid over the land; its paint's alpha says which: 255 a shade that is always there, 224 the sun's (as dark as sun), 192 the sun's soft rim, 160 a rim that is always there; shp: which are drawn now, 0 the full ones, 1 the rims)
    float d = distance(wp, lamp) / lr, lan = clamp(1.15 - d * d, 0., 1.), ls = floor(lan * 3. + .5) / 3.;
    float kx = floor(va.x * 20. + .05) / 20.;   // (a face's light and the shade of its corners: in whole steps; it ran smooth from corner to corner: a blurred halo on the ground round every block)
    float l = max(va.y * day, amb + (1. - amb) * lan) * kx;
    vec3 col = c.rgb * l * mix(vec3(1.), vec3(1.1, .97, .8), lan * (1. - va.y));
    // under the land's top (a face the sky does not reach: a cave's wall, a shaft's): the day's light at the land's top, level by level down to your lantern's at your floor; never dark
    float up = clamp((va.w - (lamp.y - .6) / H) / 14., 0., 1.); vec3 pit = mix(vec3(1.14, 1., .82), vec3(max(day * .95, amb)), max(up, 1. - clamp(dep, 0., 1.)));   // (dep: levels of land over you. Under the open sky, a gorge's floor, no lantern: a wall is the block's own material in the day's light. It was warm there too: grey stone cut brown, an earth wall in a stone mountain)
    if (wn > .5) { if (wn > 1.5 && wn < 2.5) { if (ck < 1.) discard; col = cold(c.rgb) * 1.12; if (lu.x < 1. || lu.y < 1. || lu.x > 15. || lu.y > 15.) col = vec3(.84, .9, 1.); }   // a floor over your head: cold, one px in two, its tiles edged pale: you are under it
      else if (wn > 10.5) col = c.rgb * max(day * va.y, amb) * .8;
      else { ivec2 P = ivec2(gl_FragCoord.xy), M = textureSize(mk, 0) - 1; int jt = 0; for (int n = 1; n <= 48; n++) if (jt == 0 && texelFetch(mk, min(P + ivec2(0, n), M), 0).ba == vec2(0.)) jt = n; if (jt == 0) jt = 48;   // (jt: rows down from the surface's line: cp of them a level)
        col = texelFetch(t, ivec2(va.w >= rf ? sp.zw : sp.xy) + ivec2(int(mod(floor(wp.x * 16.), 16.)), int(mod(floor(float(jt) * LV / cp), LV) + LV0)), 0).rgb * strat(rz - floor((float(jt) - 1.) / cp)); } o = vec4(col, 1.); return; }   // the section: the ground's own wall paint in strata, from the surface's line down to your ceiling: one wall with the one under it; the land's own top px (grass, snow) as its first line
    float sw = kind > .5 && kind < 1.5 && abs(mod(va.w + 1024., 256.) - vs.g * 255.) < .5 ? vs.r : 0.; bool snk = va.y > .5 && sw > 0. && bit(ve, 131072.) > .5;   // (snk: a sunk top under the sky that is of your space: a trench's floor, a dug stair's tread)
    if (kind < .5 && va.y < .5) col = bit(ve, 16.) > .5 ? mix(c.rgb, vec3(.8, .62, .43), .6) * (.95 + .15 * ls) : c.rgb * pit * kx + vec3(.03, .02, .01);   // a wall; the riser of a step you can take: the tread's tone, a wall is rock
    else if (kind < 1.5 && kind > .5 && (va.y < .5 || snk)) {   // a floor under the land, open now. Of YOUR space (vs: how much, 0..1, eased by the painter: a floor that joins your space warms over 300 ms, one that leaves it cools): lit warm, one rule for a room's and a stair's, a lit lip at a step down, shade at a wall's foot.
      // One you cannot walk to from here (a stair's treads over a dead end, a passage past a wall): as it is, at its own height, but cold: grey-blue, no warm light; its lips pale: never the warm lit floor of your space
      float w = sw, nk = va.y < .5 ? 1. : 0., dl = clamp(va.w - (lamp.y - .6) / H + .5, -4., 6.);
      float ue = nk < .5 ? 9. : min(min(mix(9., lu.y, bit(ve, 512.)), mix(9., 15. - lu.x, bit(ve, 1024.))), min(mix(9., 15. - lu.y + 4., bit(ve, 2048.)), mix(9., lu.x, bit(ve, 4096.))));
      bool lip = (bit(ve, 1.) > .5 && lu.y < 1.) || (bit(ve, 2.) > .5 && lu.x > 15.) || (bit(ve, 4.) > .5 && lu.y > 15.) || (bit(ve, 8.) > .5 && lu.x < 1.);
      float de = nk < .5 ? 9. : min(mix(9., lu.y, bit(ve, 64.)), min(mix(9., 15. - lu.x, bit(ve, 128.)), mix(9., lu.x, bit(ve, 256.)))), rs = min(mix(9., lu.y, bit(ve, 8192.)), min(mix(9., 15. - lu.x, bit(ve, 16384.)), mix(9., lu.x, bit(ve, 65536.))));   // (its edge over a drop of two or more)
      vec3 cc = cold(c.rgb) * (1.15 - .5 * cd); if (ue < 3.) cc *= ue < 2. ? .45 : .7; if (lip) cc = mix(cc, vec3(.8, .88, 1.), .45);
      vec3 wc = c.rgb * vec3(1., .9, .7) * (.8 + .1 * (step(.3, lan) + step(.75, lan))) * (1. - .025 * clamp(rz - va.w, 0., 6.)) * (1. + .02 * clamp(dl, -2., 2.)) * (1. - .22 * vs.b);   // (the floor's own paint under the warm light, in three calm steps with distance from you: 5 tiles, 7, the rest; never over the paint's own tones: it was lit up to 1.3 times: a pale floor, stone, sand, was one flat yellow, its texture gone; a floor is darker each level under the land round your hole, six steps of it: down a stair the top treads are light, the bottom ones dark: "down" is read; and a little by its level against yours; vs.b: one you can only drop to: dimmer)
      if (ue < 4.) wc *= ue < 2. ? .42 : .72; if (lip) wc = mix(wc, vec3(1., .93, .75), .5); if (rs < 2.) wc *= .5;   // (the foot of a wall you cannot climb: a dark rim 2 px wide, then its shade 2 px out on your floor (it was 3 and 4: in a passage one tile wide the two walls' feet left two lit rows of sixteen: a thin cream line under a slab of wall); a step up you can take: a dark line at its foot (rs); a step down: the light lip)
      col = mix(snk ? col : cc, wc, w); if (de < 2.) col *= .42;
    } else if (kind < 1.5 && kind > .5 && rim > 0.) {            // a top at a drop: its lip catches the light
      if (bit(ve, 4.) > .5 && lu.y > 15.) col = mix(col, vec3(1., .94, .78), rim * .7);
      if (bit(ve, 1.) > .5 && lu.y < 1.) col *= 1. - rim * .5;
      float dn = min(mix(9., lu.y, bit(ve, 64.)), mix(9., 15. - lu.y, bit(ve, 2048.))), dr = min(dn, min(mix(9., 15. - lu.x, bit(ve, 128.)), mix(9., lu.x, bit(ve, 256.))));
      if (dr < 2.) col = c.rgb * l * (dr < 1. || dn < 2. ? .5 : .68);   // (a north or south edge: its two px one tone: the eye looks along them, the two are one px of the picture or little more, and which of the two tones it took hung on a fraction of a level of the eye's height: the rim flickered as the eye rose) (the edge over a drop that hurts, three levels or more: a dark rim two px wide all along it, no light lip: a step down has the lip, a cliff has the rim. A fall of 12 looked like the next terrace)
    } else if (kind < .5 && va.y > .5) col *= 1. - .1 * (bit(ve, 64.) + 2. * bit(ve, 128.));   // (and the cliff's face darker every two levels down)
    if (kind > .5 && kind < 1.5 && va.y > .5 && bit(ve, 262144.) > .5 && distance(wp.xz, lamp.xz) > 1.5) col *= .78;   // (a floor in a hole under the sky (vox_style_land.js 262144: a pit's, a trench's, a shaft's): its walls take some of the sky from it, a step darker than the ground round it, by day and by night; your lantern's pool as it is. Its pale dug earth was lighter than the grass: at night the holes glowed lavender)
    if (kind > 2.5 && kind < 3.5) {                              // water: the game's own picture of it over a tint (the picture is the clear water, its bed showing: only a little of it over the sea tint)
      vec2 w = (vec2(wp.x, wp.z) * 16. - wv.xy) / wv.zw; vec4 wc = wv.z > 0. ? texture(wt, w) : vec4(0.);
      vec3 sea = vec3(.36, .64, .8) * max(l, .6);
      col = mix(sea, wc.rgb, wc.a * .3);
      if (wtn[4].a > .5) { vec4 tn = wtn[int(clamp(ve, 0., 4.))]; col = mix(tn.rgb * max(l, .6), wc.rgb, wc.a * .45); o = vec4(mix(col, fogc, smoothstep(fn, ff, distance(wp, eye)) * .4), max(tn.a, wc.a * .45)); return; }   // (light.wtint: clear water: a tint and how much of it for water 0..4 levels deep (ve), the bed showing through; the game's picture of the water, its waves and glints, over it)
      o = vec4(mix(col, fogc, smoothstep(fn, ff, distance(wp, eye)) * .4), wa); return;   // (the far sea stays blue to the horizon)
    }
    if (abs(kind - 7.) < .5) { highp vec2 b = floor((vu + .5) / 16.) * 16., w16 = floor(wp.xz * 16. + .001), m = mod(w16, 8.), lp; ivec2 ti = ivec2(floor(w16 / 16.)); uint hh = uint(ti.x) * 2654435761u ^ uint(ti.y) * 2246822519u; hh ^= hh >> 15u;
      if ((hh & 1u) != 0u) m.x = 7. - m.x; if ((hh & 2u) != 0u) m.y = 7. - m.y; lp = vec2(float((hh >> 2u) & 1u), float((hh >> 3u) & 1u)) * 8. + m;
      if (ve < 8.5) lp = mod(w16, 16.); if (ve > 9.5) { float s = pick(mod(ve < 10.5 ? wp.x * 16. : wp.z * 16., 16.), 16. * (ve < 10.5 ? length(vec2(wx.x, wy.x)) : length(vec2(wx.z, wy.z)))); lp = vec2((hh & 1u) != 0u ? 15. - s : s, LV0 + whole(mod(-wp.y * 16. + .001, LV), 16. * abs(wy.y))); }   // (a skirt: whole art px as a wall's)
      col = texture(t, (b + lp + .5) / ${AW}.).rgb * kx * max(day, .35); }   // (THE LAND PAST THE BOX, a px the land's own px (vox_style_land.js patches): a top a quarter of its paint, which one and which way round by its tile (one tile's paint over and over was a wallpaper of its flowers); a skirt its rock's front.
    // Its test is abs(kind - 7.): "kind > 6.5 && kind < 7.5" was false for these px on the GPU (Metal) though each half was true: the far land never had this paint, it took the generic path: its paint's corner px, flat)
    if (sj < -1.5) { float mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b)); bool pale = mx - mn < .15 || dot(col, vec3(.3, .59, .11)) > .82;   // (the near edge of the window: the land's lip, lit. On ground with no colour of its own or too pale for a light to show on it (grey stone, the mountains' pale top, bare dirt, ash) the lip is the ground's own px darker, two rows, and one px of it down the hole's sides (sj -3): there the hole was read only by what was in it)
      col = pale ? col * (sj < -2.5 ? .78 : .62) : sj < -2.5 ? col : mix(col, vec3(1., .94, .78), .4); }
    // what is seen through the window, by how deep it lies under the land round the hole (D, levels): a floor in the shade of the north and west edges (two tones, n px long, 7 at most: under half a tile, a passage one tile wide keeps a lit half), and dimmer past 2.5 and 4.5 tiles from you; a wall darker every two levels, a line every four
    if (sj < -.5 && sj > -1.5) { float D = clamp(rz - wp.y / H, 0., 16.);   // (a floor: one under the land, or sunk in it. The plain ground before a tunnel's mouth is neither: seen through the window's first box under the sky it took the hole's shade, counted from the hill's top: a dark line on the grass beside the hill, at the ceiling's height)
      if (kind > .5 && kind < 1.5 && D > .5 && (va.y < .5 || snk)) { ivec2 P = ivec2(gl_FragCoord.xy), M = textureSize(mk, 0) - 1; int n = int(min(7., 2. + D * .5));
        bool o1 = texelFetch(mk, min(P + ivec2(0, n), M), 0).rg == vec2(0.) || texelFetch(mk, max(P - ivec2(n / 2, 0), ivec2(0)), 0).rg == vec2(0.), o2 = texelFetch(mk, min(P + ivec2(0, n / 2), M), 0).rg == vec2(0.) || texelFetch(mk, max(P - ivec2(n / 4, 0), ivec2(0)), 0).rg == vec2(0.);
        col *= o2 ? .7 : o1 ? .85 : 1.;
        float pd = distance(wp.xz, lamp.xz); col *= 1. - .25 * clamp((D - 3.) / 9., 0., 1.) * (pd < 2.5 ? 0. : pd < 4.5 ? .5 : 1.); }
      else if (kind < .5) col = c.rgb * strat(ceil(wp.y / H - .01)); }
    else if (ho > 0. && kind < .5 && va.y > .5 && wp.y / H < rz + .01 && distance(wp.xz, lamp.xz) < 6.) { float lv = ceil(wp.y / H - .01), t = max(0., rz - lv + 1.), S = max(0., rz - floor((lamp.y - .6) / H + .5));
      col = mix(col, c.rgb * l * strat(lv) * max(.04, 1. - (.08 + .04 * S) * t) * (fract(wp.y / H + .001) < .3 ? .6 : 1.), ho); }   // (the walls of an open hole you stand in, a shaft, a pit: the same strata, as the eye tips over it; and DARKER THE DEEPER THE HOLE (S: its depth under its rim, t: this level's): you stand at its rim's line and hide its inside, so its walls tell it: 2 deep a light brown, 6 near black from its third level down, 12 black under its first; a thin dark line at the foot of each level: the strata counted)
    if (vl > .5) col = c.rgb * max(day * va.y, amb);
    o = vec4(mix(col, fogc, .55 * smoothstep(fn, ff, distance(wp, eye))), raw ? .97 : 1.);   // (the haze tints the far land, never more than half: it took it whole to the haze's one colour, the far land's px gone: pale flat slabs)
  }`;
const SV = `#version 300 es
  in vec3 p; in vec2 uv, k; in float s; out vec2 vu, vk; out float sil; void main() { gl_Position = vec4(p, 1.); vu = uv; sil = s; vk = k; }`;
const SF = `#version 300 es
  precision mediump float; in vec2 vu, vk; in float sil; uniform sampler2D t, mk; uniform vec3 mc; uniform float xr, hid; uniform vec2 nf; out vec4 o; void main() { vec4 c = texture(t, vu); if (c.a < .5) discard;
    if (hid > .5) { if (hid > 1.5 && texelFetch(mk, ivec2(gl_FragCoord.xy), 0).rg != vec2(0.)) { o = c; return; } if (mod(floor(gl_FragCoord.x / 2.) + floor(gl_FragCoord.y / 2.), 2.) > .5) discard; o = vec4(c.rgb * .82, c.a); return; }   // (hid: the part of you land hides (vox_style.js): one px in two, 2x2, dimmer: you are BEHIND it; 2: the window is open: inside it you are whole, over its veil)
    { float cx = mod(floor(gl_FragCoord.x / 2.), 2.), cy = mod(floor(gl_FragCoord.y / 2.), 2.); if (vk.y < mod(cx + cy, 2.) * .5 + cx * .25 + .125) discard; }   // (vk.y: how much of it is there: what the window takes away or gives back goes and comes in four steps of a 2x2 dither; vk.x: as dim as the floor it stands on)
    if (xr > 0.) { vec4 k4 = texelFetch(mk, ivec2(gl_FragCoord.xy), 0); highp float di = k4.r * 255. + k4.g * 255. / 256., z = gl_FragCoord.z * 2. - 1., w = 2. * nf.x * nf.y / (nf.x + nf.y - z * (nf.y - nf.x)); if (di > 0. && w < di + .06 && mod(floor(gl_FragCoord.x / 2.) + floor(gl_FragCoord.y / 2.), 2.) < 1.) discard; }   // (WIN: what stands between the eye and your space: one px in two)
    float dm = distance(gl_FragCoord.xy, mc.xy + vec2(0., 8.)); if (sil > 1.5 && dm < mc.z + 2. && mod(floor(gl_FragCoord.x / 2.) + floor(gl_FragCoord.y / 2.), 2.) < 1.) discard; o = sil > .5 && sil < 1.5 ? vec4(.95, .8, .55, .4) : sil > 2.5 ? vec4(mix(c.rgb, vec3(1., .97, .8), .45), 1.) : vec4(c.rgb * vk.x, c.a); }`;
return {AW, H, LV, SINK, sink, VS, FS, SV, SF};
})();
;
const VoxStyleWin = (() => {
const H = VoxStyleGLSL.H, FAR = "255.9";
const MV = `#version 300 es
  in vec3 p; uniform mat4 m; uniform vec3 ctr; uniform float bend; out highp float vw;
  ${VoxStyleGLSL.SINK}
  void main() { vec3 q = p; float dn = max(0., ctr.z - 1. - q.z); q.y -= bend * sink(dn); gl_Position = m * vec4(q, 1.); vw = gl_Position.w; }`;
const MF = `#version 300 es
  precision highp float; in highp float vw; out vec4 o;
  void main() { float f = clamp(vw, 0., ${FAR}) * 256., hi = floor(f / 256.), lo = floor(f - hi * 256.); o = vec4(hi / 255., lo / 255., hi / 255., lo / 255.); }`;
const BV = `#version 300 es
  in vec3 p; void main() { gl_Position = vec4(p.xy, .9999, 1.); }`;
const BF = `#version 300 es
  precision mediump float; uniform sampler2D mk; uniform vec3 bc; out vec4 o;
  void main() { vec4 k = texelFetch(mk, ivec2(gl_FragCoord.xy), 0); if (k.b + k.a == 0.) discard; o = vec4(bc, 1.); }`;
function create(gl) {
const prog = (vs, fs) => { const p = gl.createProgram(); for (const [ty, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(ty); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); } gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p; };
const mp = prog(MV, MF), bp = prog(BV, BF), U = {}, u = (p, n) => U[n] || (U[n] = gl.getUniformLocation(p, n));
const buf = gl.createBuffer(), vao = gl.createVertexArray(), fb = gl.createFramebuffer(), tx = gl.createTexture(), rb = gl.createRenderbuffer();
gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); gl.bindVertexArray(null);
let w = 0, h = 0, n = 0, tiles = [], ver = 0;
function box(d, o, x, y, lo, hi, g, sky, gs) {
const x0 = x - (sky ? 0 : gs), x1 = x + 1 + (sky ? 0 : gs), y0 = y - (sky ? 0 : g), y1 = y + 1 + gs, a = lo * H, b = hi * H, q = (...c) => { for (const i of [0, 1, 2, 0, 2, 3]) { d[o++] = c[i][0]; d[o++] = c[i][1]; d[o++] = c[i][2]; } };
q([x0, b, y0], [x1, b, y0], [x1, b, y1], [x0, b, y1]); q([x0, b, y1], [x1, b, y1], [x1, a, y1], [x0, a, y1]); q([x0, b, y0], [x1, b, y0], [x1, a, y0], [x0, a, y0]);
q([x0, b, y0], [x0, b, y1], [x0, a, y1], [x0, a, y0]); q([x1, b, y0], [x1, b, y1], [x1, a, y1], [x1, a, y0]); return o;
}
function set(list, per) {
tiles = list; n = list.length * 30; ver++; const d = new Float32Array(18 + n * 6); let o = 0;
for (const i of [0, 1, 2, 0, 2, 3]) { d[o++] = [-1, 1, 1, -1][i]; d[o++] = [1, 1, -1, -1][i]; d[o++] = 0; }
for (const g of [0, 1]) for (const t of list) o = box(d, o, t[0], t[1], t[2], t[3], g ? per(t) : 0, t[4], g ? .25 : 0);
gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW);
}
function pass(m, ctr, bend, W, Hh) {
gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, tx); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
if (W !== w || Hh !== h) { w = W; h = Hh; gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); for (const a of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, a, gl.NEAREST);
gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); }
gl.viewport(0, 0, w, h); gl.disable(gl.BLEND); gl.disable(gl.STENCIL_TEST); gl.disable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.colorMask(true, true, true, true);
gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(mp); gl.uniformMatrix4fv(u(mp, "m"), false, m); gl.uniform3fv(u(mp, "ctr"), ctr); gl.uniform1f(u(mp, "bend"), bend); gl.bindVertexArray(vao);
gl.colorMask(true, true, false, false); gl.drawArrays(gl.TRIANGLES, 6, n);
gl.clear(gl.DEPTH_BUFFER_BIT); gl.colorMask(false, false, true, true); gl.drawArrays(gl.TRIANGLES, 6 + n, n);
gl.colorMask(true, true, true, true); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE0);
}
function back(rgb) { gl.useProgram(bp); gl.uniform1i(u(bp, "mk"), 4); gl.uniform3fv(u(bp, "bc"), rgb); gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 6); }
return {set, pass, back, get n() { return tiles.length; }, get ver() { return ver; }, get tiles() { return tiles; }};
}
return {create};
})();
;
const VoxStyleLand = (() => {
const H = VoxStyleGLSL.H, C = 16, N = 10, CH = 8, KINDS = ["main", "model", "shade", "water"];
const gp = (x, y, z) => [x, z * H, y];
const FACES = [
{n: [0, 0, 1], k: 1, q: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]},
{n: [0, 0, -1], k: .45, q: [[0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]]},
{n: [0, 1, 0], k: .9, q: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]},
{n: [0, -1, 0], k: .62, q: [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]]},
{n: [1, 0, 0], k: .78, q: [[1, 1, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0]]},
{n: [-1, 0, 0], k: .7, q: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]},
];
const cat = (l) => { let n = 0; for (const a of l) n += a.length; const d = new Float32Array(n); n = 0; for (const a of l) { d.set(a, n); n += a.length; } return d; };
const solidC = (c, z) => { if (!c) return false; for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return i === 0 || z > c[i - 1]; return false; };
function create(host, cfg, P) {
const SL = P.SL, store = new Map(), tops = new Map(), late = new Set(), farOf = new Map(), farDirty = []; let msh = null, making = false, stamp = 0, farN = 0, into = null, wantK = null, fars = 0;
const slot = (k, paint) => { const s = P.slot(k, paint); if (into && P.mk) into.push(s); return s; };
const lim = (z) => Math.max(cfg.levels[0], Math.min(cfg.levels[1], z)), ck = (x, y) => Math.floor(x / CH) + "," + Math.floor(y / CH);
const sheet = () => { if (!msh) { const q = host.modelSheet(); msh = q.px ? q : {px: new Uint32Array(q.getContext("2d").getImageData(0, 0, q.width, q.height).data.buffer), w: q.width}; } return msh; };
const model = (x, y, b, dst) => { const X = x + b.x / C, Y = y + b.y / C, X1 = X + b.w / C, Y1 = Y + b.d / C, Z0 = b.z / cfg.up, Z1 = (b.z + b.h) / cfg.up, Zn = Z1 + (b.tilt ? b.tilt[0] / cfg.up : 0), Zs = Z1 + (b.tilt ? b.tilt[1] / cfg.up : 0);
const face = (uv, w, h, q, k) => { if (!uv) return; w = Math.min(C, w); h = Math.min(C, h); const win = b.win || [0, 0], ins = b.shade ? .02 : 0, pw = b.win ? C : w, ph = b.win ? C : h, sl = slot("m" + (b.sheet ? b.sheet.id : "") + uv + "," + pw + "," + ph, (px, at, st) => { const m = b.sheet || sheet(); for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) px[at + j * st + i] = m.px[(uv[2] ? uv[1] : uv[1] + j) * m.w + (uv[2] ? uv[0] : uv[0] + i)]; });
const v = q.map((g3, n) => [...gp(...g3), (sl % SL) * C + win[0] + [ins, w - ins, w - ins, ins][n], (sl / SL | 0) * C + win[1] + [ins, ins, h - ins, h - ins][n], k, 1, b.shade ? 10 : b.ghost ? 9 : 8, Z1, 0]); for (const n of [0, 1, 2, 0, 2, 3]) dst.push(...v[n]); };
face(b.top, b.w, b.d, [[X, Y, Zn], [X1, Y, Zn], [X1, Y1, Zs], [X, Y1, Zs]], b.k || 1); const fh = b.fh || b.h; if (b.h) { face(b.front, b.w, fh, [[X, Y1, Zs], [X1, Y1, Zs], [X1, Y1, Z0], [X, Y1, Z0]], .85);
face(b.west, b.d, fh, [[X, Y, Zn], [X, Y1, Zs], [X, Y1, Z0], [X, Y, Z0]], .68); face(b.east, b.d, fh, [[X1, Y1, Zs], [X1, Y, Zn], [X1, Y, Z0], [X1, Y1, Z0]], .74); } };
const tones = new Map(), tmp = new Uint32Array(C * C);
const tone = (lv) => { let v = tones.get(lv); if (v === undefined) { host.paintFront(lv, 0, tmp, 0, C); const n = new Map(); for (let i = 0; i < C * cfg.up; i++) n.set(tmp[i], (n.get(tmp[i]) || 0) + 1); v = [...n].sort((a, b) => b[1] - a[1])[0][0]; tones.set(lv, v); } return v; };
function topPaint(x, y, z, px, at, st) { host.paintTop(x, y, z, px, at, st); if (!host.paintFront) return; let v = 0;
for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) if ((px[at + j * st + i] >>> 24) < 128) px[at + j * st + i] = v || (v = tone(lim(VoxMesh.rock(cfg, z, z, !host.rock || host.rock(x, y))))); }
const topSlot = (x, y, z, paint) => { const k = x + "," + y + "," + z; return slot(k, (px, at, st) => { const t = x + "," + y; let l = tops.get(t); if (!l) tops.set(t, l = []); if (!l.includes(k)) l.push(k); paint(px, at, st); }); };
function touch(x, y) {
for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = (x + dx) + "," + (y + dy), l = tops.get(t); if (l) { for (const k of l) P.unslot(k); tops.delete(t); } }
for (let dy = -6; dy <= 6; dy += 6) for (let dx = -6; dx <= 6; dx += 6) { const k = ck(x + dx, y + dy); store.delete(k); if (making) late.add(k); }
stamp++; farDirty.push([x, y, x, y]);
}
function touchBox(x0, y0, x1, y1) {
for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { const t = x + "," + y, l = tops.get(t); if (l) { for (const k of l) P.unslot(k); tops.delete(t); } }
for (let by = Math.floor((y0 - 6) / CH); by <= Math.floor((y1 + 6) / CH); by++) for (let bx = Math.floor((x0 - 6) / CH); bx <= Math.floor((x1 + 6) / CH); bx++) { const k = bx + "," + by; store.delete(k); if (making) late.add(k); }
stamp++; farDirty.push([x0, y0, x1, y1]);
}
const farForget = () => { for (const [x0, y0, x1, y1] of farDirty) for (let by = Math.floor((y0 - 16) / CH); by <= Math.floor((y1 + 7) / CH); by++) for (let bx = Math.floor((x0 - 16) / CH); bx <= Math.floor((x1 + 7) / CH); bx++) { const m = farOf.get(bx + "," + by); if (m) { farN -= m.size; farOf.delete(bx + "," + by); } } farDirty.length = 0; };
const farClear = () => { farOf.clear(); farDirty.length = 0; farN = 0; };
const AOV = FACES.map((F) => F.q.map((q) => { const ax = F.n.map((a) => (a ? 0 : 1)), d = [q[0] * 2 - 1, q[1] * 2 - 1, q[2] * 2 - 1].map((v, j) => v * ax[j]);
const t = [0, 1, 2].filter((j) => ax[j]), a = [0, 0, 0], b = [0, 0, 0]; a[t[0]] = d[t[0]]; b[t[1]] = d[t[1]]; return [a, b, [a[0] + b[0], a[1] + b[1], a[2] + b[2]]]; })), AOK = [1, .84, .72, .62], TRI = [0, 1, 2, 0, 2, 3], vq = new Float64Array(40);
function quad(out, x, y, z, F, k, sky, kind, lv, e, s, solid, isTop) {
const u0 = (s % SL) * C, v0 = (s / SL | 0) * C, top = isTop ? 0 : C - cfg.up, I = .01, A = AOV[FACES.indexOf(F)], ox = x + F.n[0], oy = y + F.n[1], oz = z + 1 + F.n[2];
for (let i = 0; i < 4; i++) {
const q = F.q[i], o = i * 10; let ao = 1;
if (solid) { const [a, b, c] = A[i], s1 = +solid(ox + a[0], oy + a[1], oz + a[2]), s2 = +solid(ox + b[0], oy + b[1], oz + b[2]), cc = +solid(ox + c[0], oy + c[1], oz + c[2]); ao = AOK[s1 && s2 ? 3 : s1 + s2 + cc]; }
vq[o] = x + q[0]; vq[o + 1] = (z + q[2]) * H; vq[o + 2] = y + q[1]; vq[o + 3] = u0 + (i === 0 || i === 3 ? I : C - I); vq[o + 4] = v0 + (i < 2 ? top + I : C - I); vq[o + 5] = k * ao; vq[o + 6] = sky; vq[o + 7] = kind; vq[o + 8] = lv; vq[o + 9] = e;
}
if (!sky) { const m = (vq[5] + vq[15] + vq[25] + vq[35]) / 4; vq[5] = vq[15] = vq[25] = vq[35] = m; }
for (const i of TRI) for (let j = i * 10; j < i * 10 + 10; j++) out.push(vq[j]);
}
function* steps(cx, cy, L, o) {
const cols = new Map(), r = o.r, deep = o.deep, pt = o.win || null, fresh = new Map(); let made = 0;
const col = (x, y) => { const k = x * 1048576 + y; let c = cols.get(k); if (c === undefined) { c = host.column(x, y); cols.set(k, c); } return c; };
const inBox = (x, y) => Math.abs(x - cx) <= r && Math.abs(y - cy) <= r;
const D = 2 * r + 1, NO = -32768, BIG = 32767, DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]], at = (x, y) => (inBox(x, y) ? (y - cy + r) * D + x - cx + r : -1);
const reachA = new Int16Array(D * D).fill(NO), farA = new Uint8Array(D * D), nearA = new Uint8Array(D * D), clsA = new Uint8Array(D * D), lowA = new Int16Array(D * D).fill(BIG), reached = [], win = [];
const topOf = (x, y) => { const c = col(x, y); return c && c.length ? c[c.length - 1] : NO; };
const hop = (x0, y0, x1, y1, h) => { const a = col(x0, y0), b = col(x1, y1); return !!a && !!b && solidC(a, h) && !solidC(a, h + 1) && !solidC(a, h + 2) && solidC(b, h + 1) && !solidC(b, h + 2); };
const floorOf = (x0, y0, x, y, f0) => { const c = col(x, y); if (!c || !c.length) return null; if (host.water && host.water(x, y) && host.waterTop) { const w = host.waterTop(x, y); if (w >= c[c.length - 1]) return Math.abs(w - f0) <= 1 ? w : null; }
if (solidC(c, f0 + 1)) return hop(x0, y0, x, y, f0) || (host.water && host.water(x0, y0) && !solidC(c, f0 + 2)) ? f0 + 1 : null; for (let dz = 0; dz <= 8; dz++) if (solidC(c, f0 - dz)) return f0 - dz + (dz > 1 ? .5 : 0); return null; };
const upsOf = (x0, y0, x, y, f0) => { const c = col(x, y), l = []; if (c) for (let j = 0; j < c.length; j += 2) { const f = c[j]; if (f > f0 && f <= f0 + 8) { const g = floorOf(x, y, x0, y0, f); if (g !== null && Math.floor(g) === f0) l.push(f); } } return l; };
if (pt) { let L0 = L; const c0 = col(cx, cy); if (c0 && !(host.water && host.water(cx, cy))) for (let n = 0; n < 8 && !solidC(c0, L0); n++) L0--;
const i0 = at(cx, cy), lim = pt.reach, nodes = [[cx, cy, L0, 0]], seenN = new Set([i0 * 2048 + L0 + 1024]); reachA[i0] = L0; clsA[i0] = 1; nearA[i0] = 1; reached.push(i0);
for (const pass of pt.walk ? [1, 2] : [1, 2, 3]) { let fr = nodes.slice();
for (let d = 1; d <= lim && fr.length; d++) { const nx = []; for (const [x, y, f0, o] of fr) { if (o > 4) continue; for (const [dx, dy] of DIR) { const X = x + dx, Y = y + dy, i = at(X, Y); if (i < 0) continue; const f1 = floorOf(x, y, X, Y, f0), l = pass > 2 ? upsOf(x, y, X, Y, f0) : [];
if (f1 !== null && (pass > 1 || f1 % 1 === 0)) l.push(Math.floor(f1));
for (const f of l) { const k = i * 2048 + f + 1024; if (seenN.has(k)) continue; seenN.add(k); nx.push([X, Y, f, topOf(X, Y) <= f ? o + 1 : 0]);
if (reachA[i] === NO) { reachA[i] = f; clsA[i] = pass; reached.push(i); if (d > 2 || pass > 1) farA[i] = 1; if ((d <= 4 && pass === 1) || (pt.walk && Math.abs(X - cx) + Math.abs(Y - cy) <= 4)) nearA[i] = 1; } else if (farA[i] && topOf(X, Y) <= reachA[i] && topOf(X, Y) > f) { reachA[i] = f; clsA[i] = pass; } } } } for (const q of nx) nodes.push(q); fr = nx; } }
for (const [x, y, f] of nodes) { const i = at(x, y); if (f < lowA[i] && reachA[i] - f <= 4) lowA[i] = f; } }
if (pt) yield "flood";
for (const i of reached) { const x = cx - r + i % D, y = cy - r + (i / D | 0), f = reachA[i], tp = topOf(x, y), c = col(x, y);
if (pt.walk && (Math.abs(x - cx) + Math.abs(y - cy) > 2 || f < L - 3)) continue;
if (tp > f) { let z = f; while (z < f + 6 && !solidC(c, z + 1)) z++; win.push([x, y, Math.min(f, lowA[i]), Math.max(z, f + 1)]); }
else if (nearA[i]) { let h = f + 1, n = 0; for (const [dx, dy] of DIR) { const t = topOf(x + dx, y + dy); if (t >= f + 2) n++; h = Math.max(h, Math.min(f + 40, t)); } const hid = !!host.sunk && host.sunk(x, y, f); if (hid || (!farA[i] && !pt.walk)) win.push([x, y, f, n > 2 ? h : f + 2, 1]); } }
if (pt && !pt.walk) { const own = new Set(win.map((t) => t[0] + "," + t[1])); let fr = win.slice();
for (let d = 0; d < 3 && fr.length; d++) { const nx = []; for (const [x, y, lo, hi] of fr) for (const [dx, dy] of DIR) { const X = x + dx, Y = y + dy, k = X + "," + Y, c = own.has(k) || !inBox(X, Y) ? null : col(X, Y); if (!c) continue;
for (let j = 0; j + 2 < c.length; j += 2) if (c[j] >= lo - 4 && c[j] <= hi + 6) { own.add(k); const t = [X, Y, c[j], Math.min(c[j] + 6, c[j + 1])]; win.push(t); nx.push(t); break; } } fr = nx; } }
const solidIn = (x, y, z) => { const c = col(x, y); if (!inBox(x, y)) return solidC(c, z); if (z <= L - deep) return true; return solidC(c, z); };
const front = (x, y, z, top, two) => { const lv = lim(VoxMesh.rock(cfg, top, z, !host.rock || host.rock(x, y))), v = VoxMesh.pick(x, y, z, cfg.variants), b = host.built && host.built(x, y) ? 1 : 0; return slot((two ? "F" : "f") + lv + "," + v + (b ? "b" : ""), (px, at, st) => { host.paintFront(lv, v, px, at + (C - cfg.up) * st, st, b); if (two) host.paintFront(lv, v, px, at, st, b); }); };
const rx = Math.min(r, o.rx || r), X0 = cx - rx, X1 = cx + rx, Y0 = cy - r, Y1 = cy + Math.min(r, o.rs || r);
const good = (ch, bx, by) => !!ch && ch.mk === (host.chunkKey ? host.chunkKey(bx * CH, by * CH, CH) : "") && (ch.low ? ch.L === L : ch.lo - 1 > L - deep);
function* chunk(bx, by) {
const out = {main: [], model: [], shade: [], water: []}; let lo = 1e9, low = false, wet = 0;
const faces = (x, y, z, dst) => {
const c = col(x, y), open = c[c.length - 1], top = VoxMesh.topOf(c, z);
for (let f = 0; f < 6; f++) {
const F = FACES[f], nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
if (f === 1 || solidIn(nx, ny, nz)) continue;
const nc = col(nx, ny); let sky = (f === 0 ? z >= open : !nc || z > nc[nc.length - 1]) ? 1 : 0, s, kind = f === 0 ? 1 : 0, e = 0;
if (f === 0) {
s = topSlot(x, y, z, (px, at, st) => topPaint(x, y, z, px, at, st));
{ [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]].forEach(([dx, dy, b]) => { if (!solidIn(x + dx, y + dy, z) && (sky || solidIn(x + dx, y + dy, z - 1))) e |= b; });
if (sky) [[0, -1, 64], [1, 0, 128], [-1, 0, 256], [0, 1, 2048]].forEach(([dx, dy, b]) => { if (!solidIn(x + dx, y + dy, z) && !solidIn(x + dx, y + dy, z - 1) && !solidIn(x + dx, y + dy, z - 2)) e |= b; });
if (!sky) [[0, -1, 64], [1, 0, 128], [-1, 0, 256]].forEach(([dx, dy, b]) => { if (!solidIn(x + dx, y + dy, z) && !solidIn(x + dx, y + dy, z - 1)) e |= b; });
if (!sky) [[0, -1, 512], [1, 0, 1024], [0, 1, 2048], [-1, 0, 4096]].forEach(([dx, dy, b]) => { if (solidIn(x + dx, y + dy, z + 1) && !hop(x, y, x + dx, y + dy, z)) e |= b; });
{ const wl = DIR.map(([dx, dy]) => +solidIn(x + dx, y + dy, z + 1)), sunk = sky && ((wl[0] && wl[1]) || (wl[2] && wl[3]) || wl[0] + wl[1] + wl[2] + wl[3] >= 3); if (sunk) e |= 131072;
if (!sky || sunk) [[0, -1, 8192], [1, 0, 16384], [-1, 0, 65536]].forEach(([dx, dy, b]) => { if (hop(x, y, x + dx, y + dy, z)) e |= b; });
if (sky && DIR.filter(([dx, dy]) => { for (let d = 1; d <= 2; d++) if (topOf(x + dx * d, y + dy * d) > z) return true; return false; }).length >= 2) e |= 262144; }
}
} else { s = front(x, y, z, top); if (!sky && !solidC(c, z + 1) && hop(nx, ny, x, y, z - 1)) e |= 16; else if (sky && nc && top - nc[nc.length - 1] >= 3) e |= 64 * Math.min(3, (top - z) >> 1); }
quad(dst, x, y, z - 1, F, F.k, sky, kind, z, e, s, solidIn, f === 0);
}
};
const lowOf = (x, y) => { const c = col(x, y); return c && c.length ? c[0] : -1e9; };
for (let y = by * CH; y < by * CH + CH; y++) for (let x = bx * CH; x < bx * CH + CH; x++) {
const c = col(x, y); if (!c) continue; yield; const cz = c[c.length - 1]; { const ms = host.models && host.models(x, y, cz); if (ms) for (const b of ms) model(x, y, b, b.shade ? out.shade : out.model); }
const wt = host.water && host.water(x, y), wz = wt ? (host.waterTop ? host.waterTop(x, y) : 0) : null;
const z0 = Math.min(lowOf(x, y), lowOf(x - 1, y), lowOf(x + 1, y), lowOf(x, y - 1), lowOf(x, y + 1)); if (z0 < lo) lo = z0; if (z0 - 1 <= L - deep) low = true;
for (let z = Math.max(L - deep + 1, z0); z <= Math.max(cz, wt ? wz + 1 : -1e9); z++) {
if (!solidIn(x, y, z)) { if (wt && z === wz + 1) { quad(out.water, x, y, z - 2, FACES[0], 1, 1, 3, z, Math.max(0, wz - c[c.length - 1]), 0, null, true); wet++; } continue; }
faces(x, y, z, out.main);
}
}
const ch = {mk: host.chunkKey ? host.chunkKey(bx * CH, by * CH, CH) : "", lo, low, L, wet}; for (const k of KINDS) ch[k] = new Float32Array(out[k]); return ch;
}
function* patches() { const fl = [], fs = []; if (o.sea === undefined) return [new Float32Array(0), new Float32Array(0)]; const seg = []; for (let s = -r; s <= r; s += 4) seg.push([s, Math.min(4, r + 1 - s), 1]); for (let k = 0; k < 4; k++) seg.push([r + 1 + 4 * k, 4, 0], [-r - 4 - 4 * k, 4, 0]); for (let k = 0; k < 3; k++) seg.push([r + 17 + 8 * k, 8, 0], [-r - 24 - 8 * k, 8, 0]);
const rows = seg.filter(([j]) => j < r + 1 || j > r + 4).concat([1, 2, 3, 4].map((k) => [r + k, 1, 0])), one = seg.filter(([i]) => i < -r || i > r);
for (let s = -r; s <= r; s++) one.push([s, 1, 1]);
const tz = (x, y) => { const c = host.column(x, y); return c && c.length ? c[c.length - 1] : null; }, flat = (x, y, z) => tz(x - 1, y) === z && tz(x + 1, y) === z && tz(x, y - 1) === z && tz(x, y + 1) === z;
for (const [j, h, mj] of rows) { yield "far"; if (farDirty.length) farForget(); for (const [i, w, mi] of h === 1 ? one : seg) { if (mi && mj) continue; const x = cx + i, y = cy + j, bk = Math.floor(x / CH) + "," + Math.floor(y / CH), fk = x + "," + y + "," + w + "," + h; let m = farOf.get(bk); const had = m && m.get(fk);
if (had) { P.use(had[2]); if (had[0].length) fl.push(had[0]); if (had[1].length) fs.push(had[1]); continue; } const a = [], b = []; into = []; fars++; patch(x, y, w, h, a, b); const f = [new Float32Array(a), new Float32Array(b), into]; into = null; if (!m) farOf.set(bk, m = new Map()); m.set(fk, f); farN++; if (a.length) fl.push(f[0]); if (b.length) fs.push(f[1]); if (farN % 6 === 0) yield "far"; }
if (farN > 12000) farClear(); }
return [cat(fl), cat(fs)];
function patch(x, y, w, h, fl, fs) { let mx = x + (w >> 1), my = y + (h >> 1); const c = host.column(mx, my), land = c && c.length && !(host.water && host.water(mx, my));
const Q = [[1, 1], [3, 1], [1, 3], [3, 3]].map(([a, b]) => [x + (w * a >> 2), y + (h * b >> 2)]).filter(([qx, qy]) => tz(qx, qy) !== null && !(host.water && host.water(qx, qy)));
let z = land ? c[c.length - 1] : o.sea; if (land) for (const [qx, qy] of Q) z = Math.min(z, tz(qx, qy));
if (land && !(tz(mx, my) === z && flat(mx, my, z))) { const q = Q.find(([qx, qy]) => tz(qx, qy) === z && flat(qx, qy, z)) || Q.find(([qx, qy]) => tz(qx, qy) === z); if (q) [mx, my] = q; }
const sl = land ? topSlot(mx, my, z, (px, at, st) => topPaint(mx, my, z, px, at, st)) : 0, fr = land && host.paintFront ? front(mx, my, z, z) : sl;
const put = (q, k, s, e) => { const u0 = land ? (s % SL) * C : 0, v0 = land ? (s / SL | 0) * C : 0, v = q.map(([a, b, d]) => [...gp(a, b, d), u0, v0, k, 1, land ? 7 : 3, z, e]); for (const n of [0, 1, 2, 0, 2, 3]) (land ? fl : fs).push(...v[n]); };
put([[x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z]], 1, sl, w * h === 1 && tz(x, y) === z ? 8 : 9);
if (land) { const lo = (t) => Math.min(z - 10, t === null ? o.sea : t), s = lo(tz(mx, y + h)), wz = lo(tz(x - 1, my)), ez = lo(tz(x + w, my));
put([[x, y + h, z], [x + w, y + h, z], [x + w, y + h, s], [x, y + h, s]], .8, fr, 10); put([[x, y, z], [x, y + h, z], [x, y + h, wz], [x, y, wz]], .7, fr, 11); put([[x + w, y + h, z], [x + w, y, z], [x + w, y, ez], [x + w, y + h, ez]], .78, fr, 11); } } }
const want = []; for (let by = Math.floor(Y0 / CH); by <= Math.floor(Y1 / CH); by++) for (let bx = Math.floor(X0 / CH); bx <= Math.floor(X1 / CH); bx++) want.push([bx, by]);
if (P.start(!!o.again)) { store.clear(); farClear(); }
making = true; late.clear();
try {
const need = want.filter(([bx, by]) => !good(store.get(bx + "," + by), bx, by)); wantK = new Set(want.map(([bx, by]) => bx + "," + by)); yield "scan";
for (const [bx, by] of want) { const ch = store.get(bx + "," + by); if (ch && !need.some((q) => q[0] === bx && q[1] === by)) P.use(ch.slots); }
for (const [bx, by] of need) { into = []; const ch = yield* chunk(bx, by); ch.slots = into; into = null; fresh.set(bx + "," + by, ch); made++; }
const [fl, fs] = yield* patches();
if (P.spill() && !o.again) { making = false; return yield* steps(cx, cy, L, Object.assign({}, o, {again: true})); }
const list = want.map(([bx, by]) => fresh.get(bx + "," + by) || store.get(bx + "," + by)).filter(Boolean), parts = {far: fl, sea: fs}; let wet = 0;
const near = list.slice().reverse();
for (const k of KINDS) { const l = k === "main" ? near : list; let n = 0; for (const ch of l) n += ch[k].length; const d = new Float32Array(n); n = 0; for (const ch of l) { d.set(ch[k], n); n += ch[k].length; } parts[k] = d; }
for (const ch of list) wet += ch.wet;
for (const [k, ch] of fresh) if (!late.has(k)) store.set(k, ch);
if (store.size > 400) { const keep = new Set(want.map(([bx, by]) => bx + "," + by)); for (const k of store.keys()) if (!keep.has(k)) store.delete(k); }
return {parts, clip: [X0, X1 + 1, Y0, Y1 + 1], wet, made, space: pt ? {x: cx - r, y: cy - r, D, lvl: reachA, cls: clsA} : null, win};
} finally { making = false; }
}
return {steps, touch, touchBox, model, clear() { store.clear(); farClear(); }, evicted() { for (const k of [...store.keys()]) if (!wantK || !wantK.has(k)) store.delete(k); farClear(); },
get stamp() { return stamp; }, get fars() { return fars; }};
}
return {create, N, CH};
})();
;
const VoxStyle = (() => {
const H = VoxStyleGLSL.H, SL = 64, C = 16, AW = SL * C, N = VoxStyleLand.N, SW = 1024, SV6 = 8, SECT = [[.17, .12, .13], [.5, .35, .26], [.43, .41, .42], [.21, .17, .18]];
const {VS, FS, SV, SF} = VoxStyleGLSL;
function mul(a, b) { const r = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; }
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function look(e, c) { const z = norm(sub(e, c)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]); }
const gp = (x, y, z) => [x, z * H, y], same = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
function create(host, cfg) {
let el = null, lastM = null, lastB = [0, 0], gl = null, pr = null, sp = null, tex = null, wtx = null, htx = null, ltx = null, atx = null, stx = null, sver = 0, sorg = [0, 0, 1], sAt = 0, sBusy = false, sWay = null, cdv = 0, cdAt = 0, sKey = "", space = null, W_ = null, wxr = 0, wAt = 0, wKey = "", sectAt = [0, 0, 0, 0], winL = [], winN = 0, winJ = "", stale = true, cost = 0, spill = false, wipe = false, mk = false, lost = false, wat = null, fresh = true, calls = 0, why = "";
let wmap = new Map(), wrim = 0, over = false, mean = [.6, .66, .38], clip = [-1e9, 1e9, -1e9, 1e9], wet = 0, far = new Float32Array(0), made = 0, again = true, lastU = null, lastS = null, lastG = null, lastD = null, hk = "", lk = "";
const dirty = [], row = new Uint32Array(AW * C), glow = new Map(), U = {}, units = {}, cnt = {main: 0, model: 0, far: 0, ghost: 0, shade: 0, shade2: 0, water: 0}, bufs = {};
let wipes = 0, A = {slots: new Map(), px: new Uint32Array(AW * AW), n: 0, free: []}, B = null, spare = new Uint32Array(AW * AW), fromNone = false, used = new Set();
function evict() { for (const [k, v] of B.slots) if (!used.has(v)) B.slots.delete(k); B.free = []; for (let i = SL * SL - 1; i >= 0; i--) if (!used.has(i)) B.free.push(i); B.full = true; land.evicted(); }
function slot(key, paint) {
if (mk && !B) { const s0 = fromNone ? undefined : A.slots.get(key); if (s0 !== undefined) { used.add(s0); return s0; }
if (fromNone) { spare.fill(0); B = {slots: new Map(), px: spare, add: [], full: true, n: 0, free: []}; } else { spare.set(A.px); B = {slots: new Map(A.slots), px: spare, add: [], full: false, n: A.n, free: A.free.slice()}; } }
const S = mk ? B : A; let s = S.slots.get(key); if (s !== undefined) { if (mk) used.add(s); return s; }
if (S.n >= SL * SL && !mk && S.free.length) { s = S.free.pop(); const at = (s / SL | 0) * C * AW + (s % SL) * C; for (let j = 0; j < C; j++) S.px.fill(0, at + j * AW, at + j * AW + C); }
else if (S.n >= SL * SL && !mk) { s = SL * SL - 1; for (const [k0, v0] of S.slots) if (v0 === s) { S.slots.delete(k0); break; } if (!over) over = lost = true; }
else { if (S.n >= SL * SL && !S.free.length) evict();
if (S.n < SL * SL) s = S.n++; else if (S.free.length) { s = S.free.pop(); const at = (s / SL | 0) * C * AW + (s % SL) * C; for (let j = 0; j < C; j++) S.px.fill(0, at + j * AW, at + j * AW + C); }
else { S.slots.clear(); S.px.fill(0); S.n = 0; spill = true; B.full = true; s = S.n++; } used.add(s); }
S.slots.set(key, s); const at = (s / SL | 0) * C * AW + (s % SL) * C; paint(S.px, at, AW); { const q = S.px[at + 7 * AW + 7]; if ((q >>> 24) > 127) for (let i = 0; i < 3; i++) mean[i] += ((q >> 8 * i & 255) / 255 - mean[i]) * .03; } if (!mk) dirty.push(s); else B.add.push(s); return s;
}
const land = VoxStyleLand.create(host, cfg, {SL, C, slot, unslot(k) { A.slots.delete(k); if (B) B.slots.delete(k); }, use(l) { for (const v of l) used.add(v); }, get mk() { return mk; }, start(ag) { fromNone = wipe || ag; wipe = false; if (fromNone) wipes++; B = null; spill = false; used = new Set(); return fromNone; }, spill: () => spill});
function start() {
if (gl) return true;
el = document.createElement("canvas"); gl = el.getContext("webgl2", {antialias: false, depth: true, stencil: true, preserveDrawingBuffer: true}); if (!gl) return false;
const prog = (vs, fs, names) => { const p = gl.createProgram(); for (const [ty, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(ty); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); } names.forEach((n, i) => gl.bindAttribLocation(p, i, n)); gl.linkProgram(p); return p; };
pr = prog(VS, FS, ["p", "uv", "a", "e"]); sp = prog(SV, SF, ["p", "uv", "s", "k"]); W_ = VoxStyleWin.create(gl); [tex, wtx, htx, ltx, atx, stx] = [0, 0, 0, 0, 0, 0].map(() => gl.createTexture());
for (const k of ["land", "shade", "water", "spr"]) { const b = bufs[k] = {buf: gl.createBuffer(), vao: gl.createVertexArray(), n: 0, cap: 0, stat: new Float32Array(0)}; gl.bindVertexArray(b.vao); gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
(k === "spr" ? [[3, 0], [2, 12], [1, 20], [2, 24]] : [[3, 0], [2, 12], [4, 20], [1, 36]]).forEach(([sz, off], i) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, sz, gl.FLOAT, false, (k === "spr" ? SV6 : N) * 4, off); }); }
gl.bindVertexArray(null); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SW, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); near(); gl.activeTexture(gl.TEXTURE0);
return true;
}
const near = () => { for (const [a, b] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, a, b); };
function fill(b, stat, tail) {
gl.bindBuffer(gl.ARRAY_BUFFER, b.buf); if (stat) b.stat = stat; b.n = b.stat.length;
if (stat || b.n + tail.length > b.cap) { b.cap = b.n + tail.length + 8192; gl.bufferData(gl.ARRAY_BUFFER, b.cap * 4, gl.DYNAMIC_DRAW); gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.stat); }
if (tail.length) gl.bufferSubData(gl.ARRAY_BUFFER, b.n * 4, tail);
}
const cat = (...l) => { let n = 0; for (const a of l) n += a.length; const d = new Float32Array(n); n = 0; for (const a of l) { d.set(a, n); n += a.length; } return d; };
function build(...a) { for (const _ of steps(...a)); }
function* steps(...a) {
const t0 = performance.now(), g = land.steps(...a); let r;
for (let u0 = t0, what = "first";;) { mk = true; try { r = g.next(); } finally { mk = false; } const u1 = performance.now(); units[what] = Math.max(units[what] || 0, u1 - u0); if (r.done) break; yield; u0 = performance.now(); what = r.value || "tile"; }
const tS = performance.now(), R = r.value, q = R.parts; space = R.space; { const wj = R.win.join(); if (wj !== winJ) { winJ = wj; winL = R.win; winN++; } } sBusy = true; clip = R.clip; wet = R.wet; far = q.far; made = R.made;
if (start()) { fill(bufs.land, cat(q.main, q.model), far); fill(bufs.shade, q.shade, new Float32Array(0)); fill(bufs.water, cat(q.water, q.sea), new Float32Array(0)); }
Object.assign(cnt, {main: q.main.length / N, model: q.model.length / N, far: far.length / N, shade: q.shade.length / N, water: (q.water.length + q.sea.length) / N});
if (B) { spare = A.px; if (B.full || B.add.length > 500) stale = true; else dirty.push(...B.add); A = {slots: B.slots, px: B.px, n: B.n, free: B.free}; B = null; over = false; }
again = true; lastG = lastD = null; cost = performance.now() - t0; units.send = Math.max(units.send || 0, performance.now() - tS);
}
function matrix(v) {
const c = v.cam, at = gp(...v.at), RW = v.w, RH = v.h;
if (c.kind === "obl") return {m: new Float32Array([32 / RW, 0, 0, 0, 0, 32 / RH, -1 / 60, 0, 0, -32 / RH, -1 / 60, 0, -32 / RW * at[0], 32 / RH * (at[2] - at[1]), (at[2] + at[1]) / 60, 1]), eye: [at[0], at[1] + 40, at[2] + 40]};
const yaw = (c.yaw || 0) * Math.PI / 180, p = c.pitch * Math.PI / 180, dir = [Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p)];
if (c.kind === "iso") {
const eye = at.map((a, i) => a + dir[i] * 60), hw = RW / 32, hh = RH / 32;
return {m: mul(new Float32Array([1 / hw, 0, 0, 0, 0, 1 / hh, 0, 0, 0, 0, -2 / 119, 0, 0, 0, -121 / 119, 1]), look(eye, at)), eye};
}
const t = Math.tan(c.fov * Math.PI / 360), d = RH / (32 * t), eye = at.map((a, i) => a + dir[i] * d), n = .5, f = 200;
const P = new Float32Array(16); P[0] = 1 / t / (RW / RH); P[5] = 1 / t; P[10] = (f + n) / (n - f); P[11] = -1; P[14] = 2 * f * n / (n - f);
return {m: mul(P, look(eye, at)), eye};
}
const project = (m, x, y, z) => { const dn = Math.max(0, lastB[1] - 1 - y), p = gp(x, y, z - lastB[0] * VoxStyleGLSL.sink(dn) / H),
w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; return [(m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w, (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w, (m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]) / w]; };
const shelf = {x: 0, y: 0, h: 0, ep: 1};
function place(c) {
let a = c._a; if (a && a.ep === shelf.ep && a.w === c.width && a.h === c.height) return a;
if (shelf.x + c.width + 1 > SW) { shelf.x = 0; shelf.y += shelf.h + 1; shelf.h = 0; }
if (shelf.y + c.height + 1 > SW) return null;
a = c._a = {x: shelf.x, y: shelf.y, w: c.width, h: c.height, ep: shelf.ep, v: -1}; shelf.x += c.width + 1; shelf.h = Math.max(shelf.h, c.height); return a;
}
function dimOf(s, v) { if (!wmap.size) return 1; const b = wmap.get(s.tx === undefined ? Math.floor(s.x) + "," + Math.floor(s.y) : s.tx + "," + s.ty); if (!b || s.z < b[0] - 1 || s.z > b[1]) return 1; const D = Math.max(0, Math.min(16, wrim - s.z)), pd = Math.hypot(s.x - v.at[0], s.y - v.at[1]); return Math.max(.7, (1 - .025 * Math.min(6, D)) * (1 - .25 * Math.max(0, Math.min(1, (D - 3) / 9)) * (pd < 2.5 ? 0 : pd < 4.5 ? .5 : 1))); }
function sprites(v, m, L, mp) {
const RW = v.w, RH = v.h, me = (v.sprites || []).find((s) => s.top), late = (s) => !!me && (s.ty !== undefined && !s.flat ? s.ty > Math.floor(me.y) : s.y > me.y), PX = (f) => [(f[0] * .5 + .5) * RW, (.5 - f[1] * .5) * RH];
const order = [[], [], [], []]; for (const s of v.sprites || []) order[s.lie ? 3 : s.top ? 1 : late(s) ? 2 : 0].push(s);
const d = new Float32Array((order[0].length + order[1].length + order[2].length + order[3].length + 1) * 6 * SV6), runs = [[], [], [], []], ups = []; let n = 0;
for (let g = 0; g < 4; g++) for (const s of order[g]) {
const a = place(s.canvas); if (!a) return null; const dm = s.top ? 1 : dimOf(s, v), ver = s.canvas._v !== undefined ? s.canvas._v : s.still ? 0 : NaN; if (a.v !== ver) { ups.push(s.canvas); a.v = ver; }
const f = project(m, s.x, s.y, s.z), fx = Math.round((f[0] * .5 + .5) * RW), fy = Math.round((.5 - f[1] * .5) * RH), w = s.canvas.width, h = s.canvas.height;
const x0 = fx - s.fx, y0 = fy - s.fy, X = (px) => px / RW * 2 - 1, Y = (py) => 1 - py / RH * 2, z = s.d ? f[2] - .0004 : project(m, s.x, s.y + .4, (s.zh ?? s.z) + 2)[2];
let q = [[X(x0), Y(y0), z], [X(x0 + w), Y(y0), z], [X(x0 + w), Y(y0 + h), z], [X(x0), Y(y0 + h), z]], box = [x0, y0, x0 + w, y0 + h];
if (s.flat) { q = [[-s.fx, s.fy], [w - s.fx, s.fy], [w - s.fx, s.fy - h], [-s.fx, s.fy - h]].map(([i, j]) => project(m, s.x + i / C, s.y, s.z + j / cfg.up)); const p0 = PX(q[0]), p1 = PX(q[2]); box = [p0[0], p0[1], p1[0], p1[1]]; q.forEach((c) => { c[2] -= .0004; }); }
if (s.lie) { q = [[-s.fx, -s.fy], [w - s.fx, -s.fy], [w - s.fx, h - s.fy], [-s.fx, h - s.fy]].map(([i, j]) => project(m, s.x + i / C, s.y + j / C, s.z)); const p0 = PX(q[0]), p1 = PX(q[2]); box = [p0[0], p0[1], p1[0], p1[1]]; q.forEach((c) => { c[2] -= .0002; }); }
const over = mp && s !== me && !s.lie && late(s) && box[0] < mp[0] + 6 && box[2] > mp[0] - 6 && box[1] < mp[1] - 2 && box[3] > mp[1] - 15, how = s.top ? 1 : 0;
const r = runs[g], lr = r[r.length - 1]; if (lr && lr[2] === how) lr[1] += 6; else r.push([n / SV6, 6, how]);
for (const i of [0, 1, 2, 0, 2, 3]) { d[n++] = q[i][0]; d[n++] = q[i][1]; d[n++] = q[i][2]; d[n++] = (a.x + [0, 1, 1, 0][i] * a.w) / SW; d[n++] = (a.y + [0, 0, 1, 1][i] * a.h) / SW; d[n++] = s.ghost ? 3 : over ? 2 : 0; d[n++] = dm; d[n++] = s.fade === undefined ? 1 : s.fade; }
}
const quad = n / SV6; for (const i of [0, 1, 2, 0, 2, 3]) { d[n++] = [-1, 1, 1, -1][i]; d[n++] = [1, 1, -1, -1][i]; d[n++] = 0; d[n++] = [0, 1, 1, 0][i]; d[n++] = [0, 0, 1, 1][i]; d[n++] = 0; d[n++] = 1; d[n++] = 1; }
return {d, runs, ups, quad, me};
}
function light(now, way) {
{ const tg = way ? way.dim || 0 : 0, d = Math.min(.1, Math.max(0, now - cdAt)) / .3; cdAt = now; cdv += Math.max(-d, Math.min(d, tg - cdv)); } if ((way && way.key) !== sWay) { sWay = way && way.key; sBusy = true; }
if (!sBusy) return; const k = Math.min(.1, Math.max(0, now - sAt)) / .3, sp = space, first = !glow.size, D = sp ? sp.D : sorg[2]; sAt = now; sBusy = false; if (sp) sorg = [sp.x, sp.y, D];
const cls = (i, j, lv) => { if (!sp || i < 0 || j < 0 || i >= D || j >= D) return 0; const c = sp.cls[j * D + i]; return (c === 1 || c === 2) && sp.lvl[j * D + i] === lv ? c : 0; };
if (sp) for (let i = 0; i < D * D; i++) { const lv = sp.lvl[i], c = cls(i % D, i / D | 0, lv); if (!c) continue; const key = (sp.x + i % D) + "," + (sp.y + (i / D | 0)), g = glow.get(key); if (!g || g[0] !== lv) glow.set(key, [lv, first ? 1 : 0, first && c === 2 ? 1 : 0]); }
if (way) for (const [key, lv] of way.on) { const g = glow.get(key), [x, y] = key.split(",").map(Number); if (!g || (g[0] !== lv && !cls(x - sorg[0], y - sorg[1], g[0]))) glow.set(key, [lv, 0, 0]); }
const px = new Uint8Array(D * D * 4); let h = "";
for (const [key, g] of glow) { const [x, y] = key.split(",").map(Number), i = x - sorg[0], j = y - sorg[1], on = cls(i, j, g[0]) || (way && way.on.get(key) === g[0] ? 1 : 0), w = on ? 1 : 0, d = on === 2 ? 1 : 0;
g[1] += Math.max(-k, Math.min(k, w - g[1])); g[2] += Math.max(-k, Math.min(k, d - g[2])); if (g[1] !== w || g[2] !== d) sBusy = true; if (!on && g[1] <= 0) { glow.delete(key); continue; }
if (i >= 0 && j >= 0 && i < D && j < D) { const o = (j * D + i) * 4; px[o] = Math.round(g[1] * 6) * 42.5; px[o + 1] = (g[0] + 1024) % 256; px[o + 2] = Math.round(g[2] * 6) * 42.5; h += o + ":" + px[o] + "," + px[o + 1] + "," + px[o + 2] + ";"; } }
h += sorg; if (h === sKey) return; sKey = h; sver++;
gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, stx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, D, D, 0, gl.RGBA, gl.UNSIGNED_BYTE, px); near(); gl.activeTexture(gl.TEXTURE0);
}
function draw(v) {
if (!start()) return null; light(v.t || 0, v.way || null);
const t0 = performance.now(), L = v.light, RW = v.w, RH = v.h, W = v.water, hr = v.hour, sized = el.width !== RW || el.height !== RH;
if (sized) { el.width = RW; el.height = RH; }
const {m, eye} = matrix(v); lastM = m; lastB = [v.bend || 0, v.at[1]]; const lamp = gp(...v.at);
const gh = [], sd = []; for (const [x, y, b] of v.ghosts || []) land.model(x, y, b, b.shade ? sd : gh);
const mef = (v.sprites || []).find((s) => s.top), mf = mef && project(m, mef.x, mef.y, mef.z), mp = mf && [(mf[0] * .5 + .5) * RW, (.5 - mf[1] * .5) * RH], disc = mp ? [mp[0], RH - mp[1] + 1, 12] : [0, 0, 0];
const wup = !!(W && W.canvas && W.canvas.width && wet && (!wat || (W.ver !== undefined ? W.ver !== wat[5] : Math.abs((v.t || 0) - wat[4]) > .1 || !v.t)));
const wv = W && W.canvas && W.canvas.width && wet ? (wup ? [W.x, W.y, W.canvas.width, W.canvas.height] : wat.slice(0, 4)) : [0, 0, 0, 0];
const own = (v.own || []).filter((b) => !b[4] && !winL.some((t) => t[0] === b[0] && t[1] === b[1] && t[2] <= b[2] && t[3] > b[2])), winA = (own.length ? winL.concat(own) : winL).filter((t) => !t[4]);
const rimz = v.rim === undefined ? v.at[2] - .5 : v.rim, cpx = cfg.up * Math.cos(v.cam.pitch * Math.PI / 180), sn = 16 * Math.sin(v.cam.pitch * Math.PI / 180), per = (t) => Math.max(1, Math.min(48, (rimz - t[3]) * cpx)) / sn, gn = rimz + "," + cpx;
const wk = winN + "|" + (v.way ? v.way.key : "") + "|" + own.join() + "|" + gn, now = v.t || 0; if (wk !== wKey && (winA.length || wxr <= 0)) { wKey = wk; wmap = new Map(winA.map((t) => [t[0] + "," + t[1], [t[2], t[3]]])); const roofed = (x, y, lv) => { const c = host.column(x, y); return !!c && c.length > 0 && c[c.length - 1] > lv; }; W_.set(v.way && winA.length ? winA.concat([...v.way.on].map(([k, lv]) => { const [x, y] = k.split(",").map(Number); return [x, y, lv, lv + 2]; }).filter((b) => roofed(b[0], b[1], b[2]))) : winA, per); }
{ const d = Math.min(.1, Math.max(0, now - wAt)) / .1; wAt = now; wxr = W_.n ? Math.max(0, Math.min(1, wxr + (v.win && winA.length ? d : -d))) : 0; if (v.win && own.length && v.dep > 0) wxr = Math.max(wxr, .5); }
wrim = rimz; let S = sprites(v, m, L, mp); if (!S) { shelf.x = shelf.y = shelf.h = 0; shelf.ep++; S = sprites(v, m, L, mp); if (!S) return el; }
{ const fr = cfg.rock ? cfg.rock.from : cfg.levels[1], top = Math.round(v.at[2] - .5 + (v.dep || 0)), cl = (z) => Math.max(cfg.levels[0], Math.min(cfg.levels[1], z)), ws = (lv) => slot("f" + lv + ",0", (px, at, st) => host.paintFront(lv, 0, px, at + (C - cfg.up) * st, st));
const e = host.paintFront ? ws(cl(Math.min(top, fr - 1))) : 0, r = host.paintFront ? ws(cl(Math.max(top, fr))) : 0; sectAt = [(e % SL) * C, (e / SL | 0) * C, (r % SL) * C, (r / SL | 0) * C]; }
const bd = new Float32Array(12).fill(-9999);
const un = new Float32Array([RW, RH, ...bd, ...m, ...eye, ...lamp, v.bend || 0, ...L.fogc, L.lr, L.day, L.amb, L.fog[0], L.fog[1], L.rim, L.wa ?? .62, v.dep || 0, L.sun ?? 1,
...(L.wtint || new Float32Array(20)), ...wv, ...disc, ...clip, ...L.clear, L.ca ?? 1, sver, ...sorg, wxr, W_.ver, ...sectAt, rimz, v.hole || 0, cpx, v.behind || 0, ...(hr ? [1, ...hr.wash, ...(hr.tint || [-1, -1, -1]), hr.lit ? (hr.lit._v === undefined ? NaN : hr.lit._v) : -1] : [0])]);
const gA = new Float32Array(gh), dA = new Float32Array(sd), gSame = same(gA, lastG), dSame = same(dA, lastD);
why = again ? "land" : sized ? "size" : stale || dirty.length ? "paints" : S.ups.length ? "pictures" : wup ? "water" : !gSame ? "ghosts" : !dSame ? "shadows" : !same(S.d, lastS) ? "sprites" : !same(un, lastU) ? "view " + un.findIndex((x, i) => !lastU || x !== lastU[i]) : "";
if (!why) { fresh = false; cost = performance.now() - t0; return el; }
again = false; fresh = true; lastU = un; lastS = S.d; calls = 0;
if (!gSame) { fill(bufs.land, null, cat(far, gA)); lastG = gA; cnt.ghost = gA.length / N; } if (!dSame) { fill(bufs.shade, null, dA); lastD = dA; cnt.shade2 = dA.length / N; }
if (wxr > 0) W_.pass(m, lamp, v.bend || 0, RW, RH);
gl.viewport(0, 0, RW, RH); gl.clearColor(...L.clear, L.ca ?? 1); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true); if (wxr > 0) W_.back((v.sect || SECT)[3] || [.1, .08, .1]);
gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
if (stale) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, AW, AW, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(A.px.buffer)); near(); stale = false; dirty.length = 0; }
if (dirty.length) { const rows = new Map(); for (const sl of dirty) { const j = sl / SL | 0, i = sl % SL, r = rows.get(j); if (r) { r[0] = Math.min(r[0], i); r[1] = Math.max(r[1], i); } else rows.set(j, [i, i]); }
for (const [j, [i0, i1]] of rows) { const w = (i1 - i0 + 1) * C; for (let k = 0; k < C; k++) row.set(A.px.subarray((j * C + k) * AW + i0 * C, (j * C + k) * AW + i0 * C + w), k * w); gl.texSubImage2D(gl.TEXTURE_2D, 0, i0 * C, j * C, w, C, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(row.buffer, 0, w * C * 4)); } dirty.length = 0; }
if (wup) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, wtx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, W.canvas); near(); wat = [W.x, W.y, W.canvas.width, W.canvas.height, v.t || 0, W.ver]; }
gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, stx); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, wtx); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atx);
for (const c of S.ups) gl.texSubImage2D(gl.TEXTURE_2D, 0, c._a.x, c._a.y, gl.RGBA, gl.UNSIGNED_BYTE, c);
gl.activeTexture(gl.TEXTURE0);
gl.useProgram(pr); const u = (n) => U[n] || (U[n] = gl.getUniformLocation(pr, n)), us = (n) => U["s" + n] || (U["s" + n] = gl.getUniformLocation(sp, n));
gl.uniformMatrix4fv(u("m"), false, m); gl.uniform1i(u("t"), 0); gl.uniform1i(u("wt"), 2); gl.uniform1i(u("gw"), 3); gl.uniform1i(u("mk"), 4); gl.uniform1f(u("xr"), wxr); gl.uniform3fv(u("sc"), (v.sect || SECT)[0]); gl.uniform4fv(u("sp"), sectAt); gl.uniform1f(u("rf"), cfg.rock ? cfg.rock.from : 1e9); gl.uniform3fv(u("go"), sorg); gl.uniform3fv(u("lamp"), [lamp[0], lamp[1] + .6, lamp[2]]); gl.uniform3fv(u("eye"), eye);
gl.uniform3fv(u("em"), mean); gl.uniform3fv(u("ctr"), lamp); gl.uniform1f(u("bend"), v.bend || 0); gl.uniform3fv(u("fogc"), L.fogc); gl.uniform4fv(u("cl"), clip);
for (const [n, x] of [["lr", L.lr], ["day", L.day], ["amb", L.amb], ["fn", L.fog[0]], ["ff", L.fog[1]], ["rim", L.rim], ["wa", L.wa ?? .62], ["dep", v.dep || 0], ["rd", 0], ["sun", L.sun ?? 1], ["shp", 0], ["cd", cdv], ["rz", rimz], ["ho", v.hole || 0], ["cp", cpx], ["bh", v.behind || 0]]) gl.uniform1f(u(n), x);
gl.uniform4fv(u("wtn[0]"), L.wtint || new Float32Array(20)); gl.uniform4fv(u("wv"), wv); gl.uniform3fv(u("mc"), disc); gl.uniform3fv(u("bd[0]"), bd);
gl.useProgram(sp); gl.uniform1i(us("t"), 1); gl.uniform1i(us("mk"), 4); gl.uniform2f(us("nf"), .5, 200); gl.uniform3fv(us("mc"), disc); gl.useProgram(pr);
const go = (b, from, n) => { if (n > 0) { gl.bindVertexArray(b.vao); gl.drawArrays(gl.TRIANGLES, from, n); calls++; } };
go(bufs.land, 0, cnt.main + cnt.model + cnt.far + cnt.ghost);
gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.NOTEQUAL, 1, 1); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
for (const rimp of [0, 1]) { gl.uniform1f(u("shp"), rimp); go(bufs.shade, 0, cnt.shade + cnt.shade2); } gl.disable(gl.STENCIL_TEST);
gl.depthMask(true); gl.disable(gl.BLEND);
gl.bindBuffer(gl.ARRAY_BUFFER, bufs.spr.buf); gl.bufferData(gl.ARRAY_BUFFER, S.d, gl.STREAM_DRAW);
const run = (g) => { if (!S.runs[g].length) return; gl.useProgram(sp); gl.uniform1f(us("xr"), g === 1 ? 0 : wxr); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atx);
for (const [from, n, how] of S.runs[g]) {
if (how === 1 && v.hid !== 0) { gl.depthMask(false); gl.depthFunc(gl.GREATER); gl.uniform1f(us("hid"), wxr > 0 ? 2 : v.behind > 0 ? 0 : 1); go(bufs.spr, from, n); gl.uniform1f(us("hid"), 0); gl.depthFunc(gl.LEQUAL); }
go(bufs.spr, from, n); gl.depthMask(true); }
gl.activeTexture(gl.TEXTURE0); gl.useProgram(pr); };
run(0);
gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
go(bufs.water, 0, cnt.water); gl.depthMask(true); gl.disable(gl.BLEND); run(3);
if (S.me) { run(1); if (cnt.model) { gl.uniform1f(u("rd"), 1); go(bufs.land, cnt.main, cnt.model); gl.uniform1f(u("rd"), 0); } } run(2);
if (hr) {
const a = hr.wash[3], quad = (t, sf, df) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.blendFuncSeparate(sf, df, gl.ZERO, gl.ONE); go(bufs.spr, S.quad, 6); }, one = (t, c, k) => { if (k !== t._k) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([c[0], c[1], c[2], 255])); near(); t._k = k; } };
gl.useProgram(sp); gl.uniform1f(us("xr"), 0); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.activeTexture(gl.TEXTURE1);
if (a > .004) { one(htx, [hr.wash[0] * a, hr.wash[1] * a, hr.wash[2] * a], hr.wash.join()); gl.blendColor(0, 0, 0, a); quad(htx, gl.DST_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); }
if (hr.lit) { const k = "c" + hr.lit._v; if (hr.lit._v === undefined || ltx._k !== k) { gl.bindTexture(gl.TEXTURE_2D, ltx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hr.lit); near(); ltx._k = k; } quad(ltx, gl.DST_COLOR, gl.ZERO); }
else if (hr.tint) { one(ltx, hr.tint, hr.tint.join()); quad(ltx, gl.DST_COLOR, gl.ZERO); }
gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.activeTexture(gl.TEXTURE0); gl.useProgram(pr);
}
gl.bindVertexArray(null); cost = performance.now() - t0;
return el;
}
return {build, steps, touch: land.touch, touchBox: land.touchBox, get water() { return cnt.water; }, draw, forget() { wipe = true; land.clear(); }, get lost() { const l = lost; lost = false; return l; }, get cost() { return cost; }, get win() { return {n: W_ ? W_.n : 0, a: wxr, tiles: W_ ? W_.tiles : []}; },
spaceAt(x, y) { const sp = space, i = sp ? x - sp.x : -1, j = sp ? y - sp.y : -1; return sp && i >= 0 && j >= 0 && i < sp.D && j < sp.D && sp.cls[j * sp.D + i] && sp.lvl[j * sp.D + i] !== -32768 ? [sp.lvl[j * sp.D + i], sp.cls[j * sp.D + i]] : null; },
get stamp() { return land.stamp; }, get work() { return {wipes, fars: land.fars}; },
get made() { return made; }, get fresh() { return fresh; }, get calls() { return calls; }, get why() { return why; }, units,
bare(y0) { const w = el ? el.width : 0, h = el ? el.height - y0 : 0; if (!gl || w <= 0 || h <= 0) return 0; const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); let n = 0; for (let i = 3; i < b.length; i += 4) if (!b[i]) n++; return n; },
raw() { const w = el ? el.width : 0, h = el ? el.height : 0; if (!gl || w <= 0 || h <= 0) return 0; const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); let n = 0; for (let i = 3; i < b.length; i += 4) if (b[i] > 235 && b[i] < 255) n++; return n; }, blank() { A.px.fill(0); stale = true; },
at(x, y, z) { if (!lastM) return null; const f = project(lastM, x, y, z); return [(f[0] * .5 + .5) * el.width, (.5 - f[1] * .5) * el.height]; }, get faces() { return (cnt.main + cnt.model) / 6; }, get models() { return cnt.model / 6; }};
}
return {create};
})();
;
const VoxPaint = (() => {
const rgb = (c) => (255 << 24 | (c[2] | 0) << 16 | (c[1] | 0) << 8 | (c[0] | 0)) >>> 0;
const EARTH = 2, STONE = "rock", wallOf = (z) => (z > 4 ? STONE : z > 0 ? EARTH : z), bands = (z) => colsOf(hillSheet(wallOf(z))).bands, sheetOf = (z) => hillSheet(z < 0 ? z : Math.max(1, z));
const browns = (sheet) => { const d = sheetData(sheet), [cx, cy] = blobCell(N_ | E_ | W_ | NE | NW), set = new Set(); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const v = d.px[(cy * 16 + j) * d.w + cx * 16 + i]; if (v >>> 24 === 255 && (v & 255) > (v >>> 8 & 255)) set.add(v); }
return [...set].sort((a, b) => (a & 255) - (b & 255)); };
const earths = new Map(), earth = (z) => { if (!(z > EARTH && z < 5)) return null; let m = earths.get(z); if (!m) { const to = browns(hillSheet(EARTH)); m = new Map(browns(hillSheet(z)).map((v, i) => [v, to[Math.min(i, to.length - 1)]])); earths.set(z, m); } return m; };
let seen = -1; const mass = new Map(), cores = new Map(), REACH = 3;
function core(x, y) {
const k = x + "," + y; let r = cores.get(k); if (r !== undefined) return r;
r = false; for (let oy = -2; oy <= 0 && !r; oy++) for (let ox = -2; ox <= 0 && !r; ox++) { r = true; for (let j = 0; j < 3 && r; j++) for (let i = 0; i < 3 && r; i++) r = topAt(x + ox + i, y + oy + j) > 4; }
cores.set(k, r); return r;
}
const cut = (x, y) => { const s = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => { for (let d = 1; d <= 4; d++) if (topAt(x + dx * d, y + dy * d) > 4) return rocky(x + dx * d, y + dy * d) ? d : 9; return 9; });
return s[0] + s[2] <= 4 || s[1] + s[3] <= 4 || Math.max(...s) <= 4; };
function rocky(x, y) {
const m = matAt(x, y); if (m) return m === "s" ? 2 : false;
if (seen !== landVer) { mass.clear(); cores.clear(); seen = landVer; }
const k = x + "," + y; let r = mass.get(k); if (r !== undefined) return r;
if (topAt(x, y) < 5) { r = cut(x, y) ? 2 : false; mass.set(k, r); return r; }
r = core(x, y);
for (let at = [x, y], d = 0, met = new Set([k]); !r && d < REACH; d++) { const next = [];
for (let i = 0; i < at.length && !r; i += 2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = at[i] + dx, ny = at[i + 1] + dy, nk = nx + "," + ny; if (met.has(nk) || topAt(nx, ny) < 5) continue; met.add(nk); if (core(nx, ny)) { r = true; break; } next.push(nx, ny); }
at = next; }
mass.set(k, r); return r;
}
const level = (x, y, z) => (z < 5 && rocky(x, y) === 2 ? 5 + (z + 512) % 4 : z > 4 && !rocky(x, y) ? 4 : z);
const ids = new Map(), cells = [null];
const QUARTER = [[N_, W_, NW, NE, SW], [N_, E_, NE, NW, SE], [S_, W_, SW, SE, NW], [S_, E_, SE, SW, NE]];
const SLIM = {x: [0, 1, 3, 4, 5, 8, 8, 8], n: [0, 1, 2, 3, 6, 6, 6, 6], s: [6, 9, 10, 11, 12, 13, 14, 15], q: [6, 6, 6, 6, 9, 10, 14, 15]};
function quarters(m, step) {
const r = reduce(m & 255), one = blobCell(r);
if (r & 240) return [one, one, one, one];
const q = QUARTER.map(([a, b, ab, pa, pb]) => ({k: r & a ? (r & b ? "c" : "b") : r & b ? "a" : step && a === S_ ? "q" : "o", A: blobCell(255 & ~(a | ab | pa)), B: blobCell(255 & ~(b | ab | pb))}));
q.slim = true; return q;
}
function cellAt(q, i, j) {
const c = q[(j >> 3) * 2 + (i >> 3)];
if (!q.slim) return [c[0], c[1], i, j];
const si = i < 8 ? SLIM.x[i] : 15 - SLIM.x[15 - i], sj = j < 8 ? SLIM.n[j] : SLIM[c.k === "q" ? "q" : "s"][j - 8], ni = i < 8 ? i : 15 - i, nj = j < 8 ? j : 15 - j;
let a = c.k === "a";
if (c.k === "c") a = ni * (j < 8 ? 4 : 7) < nj * 5;
else if (c.k !== "b" && !a) { const di = ni - 2, dj = j < 8 ? j - 1 : nj - 2;
if (c.k === "o" && di + dj < 2) return null; a = j < 8 ? dj < di : dj <= di; }
return a ? [c.A[0], c.A[1], i, sj] : [c.B[0], c.B[1], si, j];
}
const cellPx = (d, q, i, j) => { const c = cellAt(q, i, j); return c ? d.px[(c[1] * 16 + c[3]) * d.w + c[0] * 16 + c[2]] : 0; };
function cap(sheet, m) {
const q = quarters(m, m & 256);
if (!q.slim) return [cellAlpha(sheet, q[0][0], q[0][1]), q];
const a = new Uint8Array(256); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const c = cellAt(q, i, j); a[j * 16 + i] = c ? cellAlpha(sheet, c[0], c[1])[c[3] * 16 + c[2]] : 0; }
return [a, q];
}
function shape(x, y, z) {
if (z < 0) return 0;
let m = 0;
for (let k = 0; k < 24; k += 3) {
const nx = x + AROUND[k], ny = y + AROUND[k + 1];
if (!blockOf(nx, ny) || (z <= 0 && wet(gndAt(nx, ny) || ".")) || (colHas(colAt(nx, ny), z) && !(z > 0 && topAt(nx, ny) === z && wet(gndAt(nx, ny) || ".")))) m |= AROUND[k + 2];
}
if (reduce(m) === 255) return 0;
if (!(reduce(m) & 240) && m & N_ && !(m & S_) && topAt(x, y - 1) === z + 1 && topAt(x, y + 1) === z - 1) m |= 256;
const zz = level(x, y, z), sheet = sheetOf(zz), [cx, cy] = blobCell(m & 255), q = quarters(m, m & 256), key = (zz <= 2 ? 0 : zz <= 4 ? 1 : 2) * 4096 + (q.slim ? 2048 + reduce(m & 255) + (m & 256) : cy * 64 + cx);
if (!ids.has(key)) { if (cells.length > 255) return 0; ids.set(key, cells.length); cells.push([cap(sheet, m)[0], sheet, q]); }
return ids.get(key);
}
function profile(id) {
const out = new Uint8Array(16), a = id ? cells[id][0] : null;
if (a) for (let i = 0; i < 16; i++) { let j = 15; while (j >= 0 && !a[j * 16 + i]) j--; out[i] = 15 - j; }
return out;
}
function crown(id) {
const a = id ? cells[id][0] : null, out = [0, 0]; if (!a) return out;
for (const k of [0, 1]) for (let n = 0; n < 16; n++) { const i = k ? 15 - n : n; let j = 0; while (j < 16 && !a[j * 16 + i]) j++; if (j < 16) { out[k] = j; break; } }
return out;
}
const lips = new Map();
function lip(id) {
const out = new Uint8Array(16); if (!id) return out;
const [a, sheet, q] = cells[id], d = sheetData(sheet), [ix, iy] = blobCell(255), plain = new Set();
for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) plain.add(d.px[(iy * 16 + j) * d.w + ix * 16 + i]);
for (let i = 0; i < 16; i++) { let j = 15; while (j >= 0 && (!a[j * 16 + i] || !plain.has(cellPx(d, q, i, j)))) j--; out[i] = j < 0 ? 0 : 15 - j; }
return out;
}
function rim(x, y, z, px, at, stride) {
const id = shape(x, y, z); if (!id) return;
const zz = level(x, y, z), a = cells[id][0], q = cells[id][2], d = sheetData(sheetOf(zz)), [ix, iy] = blobCell(255), [L, M, D] = bands(zz).map(rgb), map = earth(zz), own = (v) => (map && map.get(v)) || v;
const ref = map || wallOf(zz) === zz ? null : sheetData(hillSheet(wallOf(zz))), lp = ref ? lips.get(id) || lips.set(id, lip(id)).get(id) : null;
const drop = q.slim || colHas(colAt(x, y - 1), z) ? 0 : z - topAt(x, y - 1), north = Math.min(2, drop - 1);
const deep = !colHas(colAt(x, y - 1), z) && z - topAt(x, y - 1) >= 4, line = drop > 0 && zz > 4;
for (let i = 0; i < 16; i++) {
let last = 15; while (last >= 0 && !a[last * 16 + i]) last--;
for (let j = 0, top = -1; j < 16; j++) {
const o = at + j * stride + i;
if (a[j * 16 + i]) {
const v = lp && j > 15 - lp[i] ? cellPx(ref, q, i, j) : own(cellPx(d, q, i, j));
if (top < 0) top = j;
if (j === top && line && j < 8) px[o] = D;
else if (j > top && j <= top + north && j < 8) px[o] = deep ? D : own(cellPx(d, q, i, top));
else if (v !== d.px[(iy * 16 + j) * d.w + ix * 16 + i]) px[o] = v;
} else px[o] = last < 0 || j < last ? 0 : j === last + 1 ? L : M;
}
}
}
const mots = new Map(), lum = (v) => (v & 255) * .3 + (v >>> 8 & 255) * .59 + (v >>> 16 & 255) * .11;
function mottle(z) {
const sheet = hillSheet(wallOf(z)); let m = mots.get(sheet); if (m) return m;
const d = sheetData(sheet), [cx, cy] = blobCell(N_ | E_ | W_ | NE | NW), f = colsOf(sheet).foot, rows = [], seen = new Set();
for (const j of [f - 3, f - 2]) { const r = new Uint32Array(16); for (let i = 0; i < 16; i++) { r[i] = d.px[(cy * 16 + j) * d.w + cx * 16 + i]; if (r[i] >>> 24 === 255) seen.add(r[i]); else r[i] = 0; } rows.push(r); }
const cols = [...seen].sort((a, b) => lum(b) - lum(a)), M0 = rgb(bands(z)[1]);
for (const r of rows) for (let i = 0; i < 16; i++) if (!r[i]) r[i] = cols[1] || M0;
m = {rows, light: cols[0] || M0, dark: cols[cols.length - 1] || M0}; mots.set(sheet, m); return m;
}
const dim = (v, k) => (255 << 24 | ((v >>> 16 & 255) * k) << 16 | ((v >>> 8 & 255) * k) << 8 | (v & 255) * k) >>> 0;
function cliff(z, v, put, get, h, m, n) {
const J = dim(m.dark, .82), U = dim(m.dark, .72), ins = (c) => dim(c, .88), fx = [], k = 1 + (h(0, 9, 80) < .6 ? 1 : 0);
for (let f = 0; f < k; f++) { let x = ((f * 8 + 2 + h(f, 9, 81) * 6) | 0) & 15; const j0 = h(f, 9, 82) < .2 ? 1 + ((h(f, 9, 83) * 3) | 0) : 0, col = []; for (let j = 0; j < n; j++) { if (j > j0 && h(f, j, 84) < .25) x += h(f, j, 85) < .5 ? -1 : 1; col.push(j >= j0 ? x : -9); } fx.push(col); }
for (let j = 0; j < n; j++) for (let i = 0; i < 16; i++) { let face = 0; for (const c of fx) if (c[j] >= 0 && i > c[j]) face++; const c = get(i, j); put(i, j, (face + v + z) & 1 ? ins(c) : c); }
if (h(5, 9, 86) < .6) { const a = (h(6, 9, 87) * 12) | 0, w = 3 + ((h(7, 9, 88) * 3) | 0); for (let i = a; i < a + w; i++) put(i, 0, m.light); }
for (const c of fx) for (let j = 0; j < n; j++) if (c[j] >= 0) { put(c[j], j, J); put(c[j] + 1, j, m.light); if (h(c[j], j, 89) < .4) put(c[j] - 1, j, ins(ins(get(c[j] - 1, j)))); }
const nl = h(8, 9, 90) < .25 ? 0 : h(8, 9, 91) < .6 ? 1 : 2;
for (let l = 0; l < nl; l++) { const a = (h(l, 10, 92) * 14) | 0, w = nl > 1 ? 2 : 2 + (h(l, 10, 93) < .5), r = 5 + ((h(l, 10, 94) * Math.max(3, n - 8)) | 0); for (let i = a; i < a + w; i++) { put(i, r - 1, m.light); put(i, r, U); } }
if (h(1, 9, 95) < .5) { let i = (h(2, 9, 96) * 14) | 0, j = 2 + ((h(3, 9, 97) * 2) | 0); const dx = h(4, 9, 98) < .5 ? 1 : -1; for (let s = 0; s < 3; s++) { put(i, j, J); i += dx; j++; } }
}
function front(z, v, px, at, stride, built) {
const [L, M, D] = bands(z).map(rgb), n = RELIEF_STEP, h = (i, j, s) => hash(i + v * 16, j + z * 8, s), m = mottle(z), stone = wallOf(z) === STONE, put = (i, j, c) => { if (i >= 0 && i < 16 && j >= 0 && j < n) px[at + j * stride + i] = c; };
const sh = Array.from({length: n >> 1}, (_, k) => (h(k, 0, 64) * 16) | 0), row = (i, j) => m.rows[(j >> 1) & 1][(i + sh[(j >> 1) % sh.length]) & 15];
for (let j = 0; j < n; j++) for (let i = 0; i < 16; i++) {
let c = row(i, j);
if (j === n - 1) c = D; else if (j === n - 2 && h(i >> 1, 0, 61) < .3) c = D;
else if (j === 0 && !stone && h(i >> 1, 0, 62) < .85) c = L;
px[at + j * stride + i] = c;
}
if (stone && !built) cliff(z, v, put, row, h, m, n);
else if (stone) {
const J = dim(m.dark, .82);
for (let c0 = 0; c0 < n; c0 += 8) { const x0 = (v * 5 + ((z * 2 + (c0 >> 3)) & 1) * 4 + 3) % 8, c1 = Math.min(n, c0 + 8); for (let i = 0; i < 16; i++) put(i, c1 - 1, J);
for (let i = 0; i < 16; i++) { if (h(i, c0, 70) < .8) put(i, c0, m.light); if ((i - x0 + 16) % 8 === 0) for (let j = c0; j < c1 - 1; j++) { put(i, j, J); put(i + 1, j, m.light); } } }
for (let k = 0; k < 2; k++) if (h(k, 1, 71) < .45) { let i = (h(k, 2, 72) * 16) | 0, j = 2; while (j < n - 2) { put(i, j, J); i += h(i, j, 73) < .5 ? 1 : 0; j++; } }
} else {
for (let k = 0; k < n; k += 8) if (h(k, 1, 65) < .6) { const st = k + 2 + ((h(k, 2, 66) * 3) | 0); for (let i = 0; i < 16; i++) if (h(i >> 2, 3 + k, 67) < .85) put(i, st + (h(i >> 2, 4 + k, 68) < .35 ? 1 : 0), m.dark); }
for (let j = 1; j < n - 3; j++) for (let i = 0; i < 15; i += 2) if (h(i, j, 69) < .07) { put(i + (j & 1), j, L); put(i + (j & 1) + 1, j, L); put(i + (j & 1), j + 1, D); put(i + (j & 1) + 1, j + 1, m.dark); }
}
}
let ink = null;
function shadow() {
if (ink) return ink;
const d = sheetData(IMG.hill1), [ex, ey] = blobCell(N_ | E_ | W_ | NE | NW);
for (let j = 15; j >= 0 && !ink; j--) { const v = d.px[(ey * 16 + j) * d.w + ex * 16 + 8], a = v >>> 24; if (a && a < 255) ink = [v & 255, v >>> 8 & 255, v >>> 16 & 255, a / 255]; }
return ink || (ink = [80, 64, 134, .25]);
}
const side = (z) => { const b = bands(z), s = shadow(); return {band: b[0], body: b[1], foot: b[2], shadow: z > 4 || z <= 0 ? [s[0], s[1], s[2], 0] : s}; };
return {shape, profile, crown, lip, rim, front, side, shadow, cap, rocky, level};
})();
;
const CURVE = {near: {from: .55, horizon: .8, floor: .5}, far: {from: .55, horizon: .86, floor: .5}, lean: .3, foot: 13 / 16, fade: .5, depth: 1.5, tuft: 2, short: 6};
const CURVE_SKY = {
top: [[.33, .6, .93], [.27, .3, .58], [.05, .07, .19]], low: [[.78, .9, .98], [.99, .68, .42], [.17, .21, .44]],
cloud: [[1, 1, 1], [1, .82, .72], [.3, .34, .56]], far: [[.5, .62, .78], [.52, .36, .5], [.1, .13, .3]], near: [[.4, .6, .5], [.5, .36, .34], [.08, .13, .22]],
sun: [1, .95, .7], moon: [.92, .94, 1],
};
const Curve = (() => {
let force = {0: "off", near: "near", far: "far"}[new URLSearchParams(location.search).get("curve")] ?? null;
let c = null, audit = false, zs = 1;
function frame(ox, oy, S, now) {
const m = CURVE[force === null ? opt("curve") : force];
if (!m || (typeof TitleScene !== "undefined" && TitleScene.on && !HdLook.live)) { c = null; return; }
const z = zoom, snap = (v) => Math.round(v / z) * z, mid = H / 2;
if (!ZOOM.busy) zs = Math.abs(zs - 1) < .004 ? 1 : zs + (1 - zs) * .14;
const line = snap(mid + (H * (1 - m.horizon) - mid) * zs), y0 = snap(mid + (H * (1 - m.from) - mid) * zs), q = m.floor || 0;
c = {y0, yh: y0 - (y0 - line) / (1 - q * q), ref: (cam.lift || 0) * z, lean: CURVE.lean, floor: q, line};
}
function sy(oy, S, flat = false) {
const k = flat ? null : c, A = CURVE.foot, a = S / P, row = (y, lift = 0) => VoxCurve.snap(k, oy + y * S, lift, oy, a);
const lost = (y) => { if (!k) return 0; const q = 1 - (k.y0 - (oy + (y + A) * S - k.ref)) / (2 * (k.y0 - k.yh)); return q >= CURVE.fade ? 0 : Math.min(1, 1 - Math.max(k.floor, q) / CURVE.fade) ** 2 * CURVE.depth * S; };
const at = (y, lift) => { const flat = oy + y * S - lift; if (!k) return flat; const v = VoxCurve.y(k, oy + (y + A) * S, lift) - A * S; return Math.abs(v - flat) < 1e-9 ? flat : oy + Math.round((v + lost(y) - oy) / a) * a; };
const f = (y, x) => at(y, x === undefined ? 0 : liftOf({x, y}));
f.base = oy; f.bent = !!k; f.row = row; f.up = at; f.lost = lost;
const top = k ? k.line : 0, edge = k ? VoxCurve.edge(k) : 0;
f.inv = (py) => ((k && py < top ? edge - (top - py) : VoxCurve.inv(k, py)) - oy) / S;
f.out = (u) => { const F = oy + u * S; return k && F < edge ? top - (edge - F) : VoxCurve.warp(k, F); };
f.tall = (y, lift = 0) => (k ? row(y + 1, lift) - row(y, lift) : S);
f.far = (y, lift = 0) => VoxCurve.past(k, oy + (y + A) * S, lift) > 0;
f.cut = (lift) => (k ? VoxCurve.line(k, lift) : -1e4);
f.clip = (y, lift = 0) => { if (!k) return undefined; const p = f.far(y, lift), l = lost(y); return p || l > 0 ? Math.min(p ? f.cut(lift) + CURVE.tuft * a : 1e9, Math.round(VoxCurve.y(k, oy + (y + A) * S, lift)) + 3 * zoom) : undefined; };
f.gone = (y, lift = 0) => !!k && (f.far(y, lift) || lost(y) > S * .75);
return f;
}
function sky(t) {
const p = (((clock.phase || 0) % 1) + 1) % 1, day = p < .75, way = day ? p / .75 : (p - .75) / .25;
const night = p < .5 ? 1 - smooth((p + .035) / .07) : Math.min(smooth((p - .72) / .08), 1 - smooth((p - .965) / .07));
const dusk = p < .3 ? 1 - smooth((p - .035) / .125) : smooth((p - .56) / .14);
const lift = opt("night") / 100 * .6, tint = lightAt(p).map((v) => (v + (255 - v) * lift) / 255);
const col = (q) => q.map((v, i) => Math.min(1, v / tint[i])), pick = (q) => col(q[0].map((v, i) => { const d = v + (q[1][i] - v) * dusk; return d + (q[2][i] - d) * night; }));
const line = c.line, band = Math.max(8, line / zoom);
return {line, t, shift: cam.x * P * .12, top: pick(CURVE_SKY.top), low: pick(CURVE_SKY.low), cloud: pick(CURVE_SKY.cloud), far: pick(CURVE_SKY.far), near: pick(CURVE_SKY.near),
orb: col(day ? CURVE_SKY.sun : CURVE_SKY.moon), at: [.88 - .76 * way, -.14 + .92 * Math.sin(way * Math.PI), Math.min(day ? 5.5 : 4.5, band * .2)], stars: night, audit};
}
return {frame, sy, sky, get on() { return !!c; }, get c() { return c; }, get line() { return c ? c.line : 0; },
y: (f, h = 0) => VoxCurve.y(c, f, h), inv: (s) => VoxCurve.inv(c, s),
over: () => (c ? Math.max(0, Math.ceil(-VoxCurve.edge(c))) + 2 : 0),
rezoom: (k) => { zs *= k; },
set audit(v) { audit = v; }, set force(v) { force = v; }};
})();
;
const WaterBed = (() => {
const REACH = 2, FAR = 4, SMALL = 12, LOOK = 6, cfg = {clear: false, dark: 4};
const TINT = [[176, 236, 226, .08], [104, 204, 208, .52], [70, 174, 204, .66], [44, 132, 188, .8]], BAND = .93;
let tint = null, pad = null, legs = null, floats = null;
const grids = new Map(), gk = (bx, by) => bx * 4194304 + by, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let hx = NaN, hy = NaN, hg = null, gi = 0;
function G(x, y) {
const bx = Math.floor(x / B), by = Math.floor(y / B);
if (bx !== hx || by !== hy) { hx = bx; hy = by; hg = grids.get(gk(bx, by)); if (!hg) grids.set(gk(bx, by), hg = {d: new Int8Array(B * B).fill(-1), r: new Int8Array(B * B).fill(-1), s: new Int8Array(B * B).fill(-1), sh: new Int8Array(B * B).fill(-1), w: new Int8Array(B * B).fill(-1), col: new Array(B * B)}); }
gi = (y - by * B) * B + (x - bx * B); return hg;
}
const pending = [];
const isWater = (x, y) => { const g = gndAt(x, y); return !!g && (wet(g) || g === ":"); };
function stands(x, y) {
if (!gndAt(x, y) || isWater(x, y)) return false;
let g = G(x, y), s = g.s[gi];
if (s < 0) {
const q = [x, y], seen = new Set([(x + 32768) * 65536 + y + 32768]);
for (let i = 0; i < q.length && q.length <= SMALL * 2; i += 2) for (const [dx, dy] of N4) { const a = q[i] + dx, b = q[i + 1] + dy, k = (a + 32768) * 65536 + b + 32768; if (!seen.has(k) && !isWater(a, b)) { seen.add(k); q.push(a, b); } }
s = q.length <= SMALL * 2 ? 1 : 0; for (let i = 0; i < q.length; i += 2) { g = G(q[i], q[i + 1]); g.s[gi] = s; }
}
return s === 1;
}
function bank(x, y, R) {
const land = (a, b) => !isWater(a, b) && !stands(a, b);
for (let r = 1; r < R; r++) for (let k = -r; k < r; k++) if (land(x + k, y - r) || land(x + r, y + k) || land(x - k, y + r) || land(x - r, y - k)) return r;
return R;
}
function raised(x, y, k) {
if (!k) return false;
let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && (DEPTH_OF[gndAt(x + dx, y + dy)] || 0) > k) n++;
return n >= 5;
}
function rawOf(x, y, kind) {
const k = DEPTH_OF[kind] || 0;
if (raised(x, y, k)) return k;
let own = k || Math.max(1, ...N4.map(([dx, dy]) => DEPTH_OF[gndAt(x + dx, y + dy)] || 0));
if (own > 2 && bank(x, y, FAR) < FAR) own = 2;
return Math.max(bank(x, y, REACH), own);
}
function raw(x, y) {
const g = G(x, y), i = gi; let d = g.r[i];
if (d < 0) g.r[i] = d = rawOf(x, y, gndAt(x, y));
return d;
}
function work(x, y, kind) {
const own = kind === undefined; if (own) kind = gndAt(x, y);
let d = own ? raw(x, y) : rawOf(x, y, kind);
if (!raised(x, y, DEPTH_OF[kind] || 0) && bank(x, y, REACH) > 1) {
const n = [0, 0, 0, 0, 0]; let other = 0;
for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isWater(x + dx, y + dy)) { const r = raw(x + dx, y + dy); n[r]++; if (r !== d) other++; }
if (other >= 6) d = n.indexOf(Math.max(...n));
const block = (v) => [[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([ox, oy]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => isWater(x + ox + dx, y + oy + dy) && raw(x + ox + dx, y + oy + dy) >= v));
while (d > 2 && !block(d)) d--;
}
return d;
}
function bed(x, y) {
let g = G(x, y), i = gi, c = g.col[i];
if (!c || g.d[i] < 0) { const d = work(x, y); g = G(x, y); g.d[i] = d; g.col[i] = c = [topAt(x, y) - d]; }
return c;
}
const depth = (x, y) => (cfg.clear && isWater(x, y) ? topAt(x, y) - bed(x, y)[0] : 0);
const would = (x, y, kind) => (cfg.clear && wet(kind) ? work(x, y, kind) : 0);
function column(x, y) {
if (!cfg.clear) return colAt(x, y);
const g = G(x, y); let w = g.w[gi]; if (w < 0) w = g.w[gi] = isWater(x, y) ? 1 : 0;
return w ? bed(x, y) : colAt(x, y);
}
function paintBed(x, y, z, px, at, stride) {
if (!pad) { const c = document.createElement("canvas"); c.width = c.height = 16; pad = c.getContext("2d", {willReadFrequently: true}); }
const d = topAt(x, y) - z; G(x, y).sh[gi] = d;
bedTile(pad, x, y, Math.max(1, Math.min(4, d)), 0, 0, () => 0, () => false);
const img = pad.getImageData(0, 0, 16, 16).data, data = new Uint32Array(img.buffer), hd = hash(x, y, 41);
if (gndAt(x, y) === "~" && hd < .09 && (hd < .015 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isLand(gndAt(x + dx, y + dy))))) {
const on = floats ? floats[Math.floor(hash(x, y, 42) * 7)] : null;
if (on) for (let j = 0; j < 16; j++) for (let i = 0; i < 15; i++) if (on[j * 16 + i]) { const q = (j * 16 + i + 1) * 4; img[q] *= .74; img[q + 1] *= .8; img[q + 2] *= .86; }
}
for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) px[at + j * stride + i] = data[j * 16 + i] | 0xff000000;
}
const changed = (x, y) => { if (!cfg.clear) return; pending.push(x, y); forget(x, y, x, y, 0, "s"); forget(x, y, x, y, 0, "d"); };
const MS = 2, AGAIN = [[0, 0], [0, -1], [0, 1], [0, 2], [-1, 0], [1, 0], [-1, 1], [1, 1], [-1, -1], [1, -1]], check = [];
function forget(x0, y0, x1, y1, R, what) {
for (let y = y0 - R; y <= y1 + R; y++) for (let x = x0 - R; x <= x1 + R;) {
const bx = Math.floor(x / B), g = grids.get(gk(bx, Math.floor(y / B))), end = Math.min(x1 + R, bx * B + B - 1);
if (g) { const row = (y - Math.floor(y / B) * B) * B - bx * B;
for (let i = x; i <= end; i++) { const k = row + i; if (what === "s") g.s[k] = -1; else { g.r[k] = -1; g.w[k] = -1; if (g.d[k] >= 0) { g.d[k] = -1; if (g.sh[k] >= 0) check.push(i, y); } } } }
x = end + 1;
}
}
function flush(touch) {
if (pending.length) {
const box = new Map();
for (let i = 0; i < pending.length; i += 2) { const x = pending[i], y = pending[i + 1], k = gk(Math.floor(x / B), Math.floor(y / B)), b = box.get(k);
if (!b) box.set(k, [x, y, x, y]); else { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; } }
pending.length = 0;
for (const [x0, y0, x1, y1] of box.values()) { forget(x0, y0, x1, y1, SMALL, "s"); forget(x0, y0, x1, y1, LOOK, "d"); }
if (grids.size > 400) for (const k of [...grids.keys()]) { const bx = Math.round(k / 4194304), by = k - bx * 4194304; if (!blocks.has(bkey(bx, by))) grids.delete(k); }
hx = NaN;
}
const t0 = performance.now(), again = new Set();
while (check.length && performance.now() - t0 < MS) {
const y = check.pop(), x = check.pop(), g = G(x, y), i = gi, was = g.sh[i];
if (was < 0) continue;
if (isWater(x, y) && depth(x, y) === was) continue;
if (!isWater(x, y)) G(x, y).sh[i] = -1;
for (const [ax, ay] of AGAIN) again.add((x + ax + 32768) * 65536 + y + ay + 32768);
}
for (const k of again) touch(Math.floor(k / 65536) - 32768, (k % 65536) - 32768);
}
function view(engine, t) {
const on = !!opt("clearwater");
if (on !== cfg.clear) { cfg.clear = on; grids.clear(); hx = NaN; pending.length = 0; check.length = 0; engine.forget(() => false); }
if (!on) return null;
if (!floats && IMG.water_objects && IMG.water_objects.complete && IMG.water_objects.naturalWidth) {
const c = document.createElement("canvas"); c.width = 16 * 12; c.height = 16; const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(IMG.water_objects, 0, 0, 16 * 12, 16, 0, 0, 16 * 12, 16);
const d = g.getImageData(0, 0, 16 * 12, 16).data; floats = [8, 9, 10, 11, 6, 7, 0].map((n) => Uint8Array.from({length: 256}, (_, k) => (d[((k >> 4) * 16 * 12 + n * 16 + (k & 15)) * 4 + 3] > 127 ? 1 : 0)));
}
if (!tint) { const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), deepest = WATER.tint[4], sand = hex(WATER.sand[4]);
tint = new Float32Array([...TINT.map(([r, g, b, a]) => [r / 255, g / 255, b / 255, a]),
[...deepest.slice(0, 3).map((v, i) => (v * deepest[3] + sand[i] * (1 - deepest[3])) / 255), 1], [...hex(WATER.sand[0]).map((v) => v / 255), BAND],
...WATER.sand.map((h) => [...hex(h).map((v) => v / 255), 1])].flat()); }
const l = lightAt((((clock.phase || 0) % 1) + 1) % 1), night = Math.max(0, Math.min(1, (1 - (.3 * l[0] + .59 * l[1] + .11 * l[2]) / 255) / .36));
return {t, tint, bend: opt("shimmer") ? 1.4 : 0, light: opt("shimmer") ? 1 : 0, far: [5, 16, .8], night, dark: [.38, .58, .54], foam: .55, foamAt: 1, shade: [.7, .8, .92], shadow: .16};
}
function under(sheet, a, b, w, h, x, y, z, tx, ty) {
const d = Math.max(1, Math.min(4, depth(tx, ty))), [r, g, bl, al] = tint ? tint.subarray(d * 4, d * 4 + 4) : [.5, .8, .8, .3];
if (!legs) { const c = document.createElement("canvas"); c.width = 48; c.height = 16; legs = c.getContext("2d"); }
legs.globalCompositeOperation = "source-over"; legs.clearRect(0, 0, 48, 16); legs.drawImage(sheet, a, b, w, h, 0, 0, w, h);
legs.globalCompositeOperation = "source-atop"; legs.fillStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(bl * 255)},${Math.min(.85, al + .25)})`; legs.fillRect(0, 0, w, h);
ctx.globalAlpha = Math.max(.25, .8 - .18 * d); ctx.drawImage(legs.canvas, 0, 0, w, h, x, y, w * z, h * z); ctx.globalAlpha = 1;
}
return {cfg, column, paintBed, changed, flush, view, under, depth, would, get on() { return cfg.clear; }};
})();
;
const Voxels = (() => {
const one = new Map();
let off = null;
const host = {
column: (x, y) => (blockOf(x, y) ? WaterBed.column(x, y) : null),
waterTop: (x, y) => topAt(x, y),
water: (x, y) => { const g = gndAt(x, y) || "."; return wet(g) || g === ":"; },
models: Models.at, modelSheet: Models.sheet,
paintTop(x, y, z, px, at, stride) {
const g0 = gndAt(x, y) || ".", sea = wet(g0) || g0 === ":"; if (sea && WaterBed.on && z < topAt(x, y)) return WaterBed.paintBed(x, y, z, px, at, stride);
const was = peek; maskOf.plain = true; peek = one; one.set(x + "," + y, sea ? 0 : VoxPaint.level(x, y, z));
try { drawTile0(x, y, {px, o: at, w: stride}); } finally { maskOf.plain = false; peek = was; one.clear(); }
if (!wet(gndAt(x, y) || ".")) VoxPaint.rim(x, y, z, px, at, stride);
},
built: (x, y) => matAt(x, y) === "s",
rock: VoxPaint.rocky,
paintFront: VoxPaint.front, shape: VoxPaint.shape, profile: VoxPaint.profile, crown: VoxPaint.crown, lip: VoxPaint.lip, side: VoxPaint.side,
};
const engine = {ready: () => !!VoxGL.start(), forget() {}, touch() {}};
const made = (b) => !!b.px && !!b.water;
const drawTile0 = drawTile;
drawTile = function (x, y, to = null) { drawTile0(x, y, to); if (!to) WaterBed.changed(x, y); };
{ const a0 = arriveBlock; arriveBlock = function (b) { a0(b); WaterBed.changed(b.bx * B, b.by * B); WaterBed.changed(b.bx * B + B - 1, b.by * B + B - 1); }; }
function work(coming, until) {
if (dirtyTiles.length || !engine.ready()) return;
WaterBed.flush(engine.touch);
for (const b of coming) if (b.px && b.seaAt !== b.ver) { for (const _ of waterSteps(b)); b.seaAt = b.ver; if (performance.now() >= until) return; }
}
let wAt = 0;
function still(vis, ox, oy, t) {
if (!engine.ready()) return;
const now = performance.now(); if (now - wAt < 100 && api.wver) return; wAt = now;
const keep = ctx; off = off || document.createElement("canvas").getContext("2d");
ctx = off; try { drawWater(vis.filter(made), ox, oy, t); } finally { ctx = keep; } api.wver++;
}
const api = {made, work, still, engine, host, wver: 0};
return api;
})();
;
let lastT = performance.now(), arrivingNow = true;
const LAND_MS = 3 * (window.__pace || 1), HOLD_MS = 2500;
let goodAt = 0;
const WATCH = {x: 0, y: 0, z: 0, free: true};
function frame(now) {
requestAnimationFrame(frame);
const began = performance.now();
const dt = Math.max(0, Math.min(.1, (now - lastT) / 1000)); lastT = now;
const t = now / 1000;
for (const p of ents.values()) {
if (p.e && p.e.kind === "agent" && p.e.id === myId && walking && p.walking) { walkOn(p, dt, now); continue; }
const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
const amble = p.e && AMBLE[p.e.kind] ? Math.max(p.e.scared ? 1 / FLEE_STRIDE : AMBLE[p.e.kind], p.pace || 0, p.e.kind === "tusker" && p.e.act ? 8 : 0) : 0;
const pace = Climb.paceOf(p) || (p.running || (p.e && p.e.run) ? 10 : amble || 5);
const step = (d > 1.5 ? d * 8 : pace * 1.05) * dt;
if (d <= step) { p.x = p.tx; p.y = p.ty; }
else if (d > 1.5) { p.x += dx / d * step; p.y += dy / d * step; }
else if (Math.abs(dx) > 1e-3 && Math.abs(dy) > 1e-3) {
if (Math.abs(dx) < Math.abs(dy)) p.x += Math.sign(dx) * Math.min(step, Math.abs(dx)); else p.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
} else { p.x += dx / d * step; p.y += dy / d * step; }
}
cam.lift = 0;
if (me && myId !== null) {
if (HdLook.eye && HdLook.eye.watch) HdLook.eye = null;
const p = ents.get("agent" + myId);
if (p) {
const fall = falling(p, now);
const pan = Build.pan(dt);
const cl = Climb.climbOf(p);
cam.x = camT.x = p.x + pan.x + (cl ? cl.dx : 0); cam.lift = liftOf(p) / zoom + (cl ? cl.lift : 0) + (fall ? fall.body : 0) + fallShake(now); cam.y = camT.y = p.y + pan.y + (cl ? cl.dy : 0) - cam.lift / P;
const z = liftOf(p) / zoom / RELIEF_STEP, tx = Math.round(p.x), ty = Math.round(p.y), lt = RELIEF_STEP / 16, r = ty - z * lt;
let found = null, high = topAt(tx, ty), low = 1e9;
for (const dx of [0, -1, 1, -2, 2]) for (let y2 = ty - APART * lt, last = null; y2 <= ty + APART * lt && found === null; y2++) { const top = topAt(tx + dx, y2), r2 = y2 - top * lt; if (Math.abs(r2 - r) <= 1 || (last !== null && last < r && r < r2)) found = top; last = r2; }
for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const top = topAt(tx + dx, ty + dy); high = Math.max(high, top); low = Math.min(low, top); }
away.on = found === null; away.y = p.y + pan.y; away.shift = found !== null && Math.abs(found) > APART / 2 ? found * lt : 0; away.sky = high - z <= APART; away.high = z - low > APART; away.z = z; away.t = now;
}
else if (meObs) { cam.x = camT.x = meObs.self.x; cam.y = camT.y = meObs.self.y; away.on = away.high = false; away.y = cam.y; away.shift = 0; }
away.a = Math.abs(cam.y - away.y) > 40 || Math.abs(+away.on - away.a) < .02 ? +away.on : away.a + (+away.on - away.a) * (1 - Math.exp(-dt / .12));
} else {
away.on = away.high = false; away.a = 0; away.shift = 0; away.y = cam.y;
if (follow) {
const a = [...ents.values()].find((p) => p.e && p.e.kind === "agent" && p.e.name === follow);
const b = a || agents.find((q) => q.name === follow);
if (b) { camT.x = b.x; camT.y = b.y; if (!a) { cam.x = b.x; cam.y = b.y; } }
}
const k = 1 - Math.pow(.002, dt); cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k;
if (!HdLook.eye && $("joinbox").style.display === "none") HdLook.eye = Object.assign(() => Object.assign(WATCH, {x: cam.x, y: cam.y, z: topAt(Math.round(cam.x), Math.round(cam.y))}), {watch: true});
}
const [vx, vy, vw, vh0] = viewRect(2), vh = vh0 + 6;
const inRect = (x, y, w, h) => { const out = []; for (let by = Math.floor(y / B); by <= Math.floor((y + h) / B); by++) for (let bx = Math.floor(x / B); bx <= Math.floor((x + w) / B); bx++) { const b = blocks.get(bkey(bx, by)); if (b) out.push(b); } return out; };
const vis = inRect(vx, vy, vw, vh);
trackMe();
const [qx, qy, qw, qh] = viewRect(0), onScreen = (b) => b.bx * B < qx + qw && (b.bx + 1) * B > qx && b.by * B < qy + qh + 6 && (b.by + 1) * B > qy;
const [ax, ay, aw, ah] = viewRect(6), rank = (b) => (onScreen(b) ? 0 : vis.includes(b) ? 1 : 2);
const coming = inRect(ax, ay, aw, ah + 6).sort((a, b) => rank(a) - rank(b));
const landFrom = performance.now(), landUntil = landFrom + (arrivingNow ? LAND_MS * 4 : coming.some((b) => !Voxels.made(b) && onScreen(b)) ? LAND_MS * 2.5 : LAND_MS);
for (const b of coming) if (!b.drawn) arriveBlock(b);
for (let n = 0; dirtyTiles.length && (n++ & 15 || performance.now() < landUntil);) { const yy = dirtyTiles.pop(), xx = dirtyTiles.pop(); drawTile(xx, yy); }
Voxels.work(coming, landUntil);
const landMs = performance.now() - landFrom;
const S = TS();
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
ctx.imageSmoothingEnabled = false;
const [ox, oy] = screenOrigin(S);
Curve.frame(ox, oy, S, now);
const sx = (x) => ox + x * S, sy = Curve.sy(oy, S);
const hereBlock = blocks.get(bkey(Math.floor(cam.x / B), Math.floor((away.a >= 1 ? away.y : cam.y + away.shift) / B)));
const allShown = vis.every((b) => !onScreen(b) || Voxels.made(b));
arrivingNow = (arrivingNow || !hereBlock || !Voxels.made(hereBlock)) && !allShown;
const worldReady = !arrivingNow;
const lacking = !!me && (!hereBlock || !worldReady), late = lacking && goodAt > 0 && now - goodAt >= HOLD_MS && (now - goodAt >= 4 * HOLD_MS || vis.some((b) => onScreen(b) && Voxels.made(b)));
if (!lacking) goodAt = now; else if (!late && goodAt > 0) { slowFrame(dt, false); return; }
if (!HdLook.live && me) { ctx.fillStyle = "#2b2420"; ctx.fillRect(0, 0, W, H); }
slowFrame(dt, worldReady);
occupied = new Set([...ents.values()].filter((p) => p.e && p.e.kind === "agent" && !Floors.rise(p)).map((p) => Math.round(p.x) + "," + Math.round(p.y)));
Voxels.still(vis, ox, oy, t);
const none = [];
drawLoot(sx, sy, S, now, none); drawOrbs(sx, sy, S, dt, none);
drawDying(sx, sy, S, t, now); drawEffects(sx, sy, S, dt); drawPuffs(sx, sy, dt); drawPlucks(sx, sy, S, now);
drawXp();
foodPreview();
swingDoors(t);
updateActions();
Build.tick();
floats = opt("floats") ? floats.filter((f) => t - f.t < 1.4) : [];
perfFrame(now, performance.now() - began, landMs);
}
function outlined(text, x, y, color) {
ctx.fillStyle = "#5b3f36";
for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(text, x + a, y + b);
ctx.fillStyle = color; ctx.fillText(text, x, y);
}
let doorList = [], doorScan = -1e9;
function swingDoors(t) {
const s = me && myPos(), now = performance.now(); if (!s) return;
if (now - doorScan > 500) { doorScan = now; doorList = []; for (let y = s.y - 12; y <= s.y + 12; y++) for (let x = s.x - 16; x <= s.x + 16; x++) { const c = combAt(x, y); if (c === "+" || c === "g") doorList.push([x, y, c]); } }
for (const [x, y, c] of doorList) if (combAt(x, y) === c) { if (c === "+") Structures.doorFrame(x, y); else objectSprite("g", x, y, t); }
}
;
const DAYLIGHT = [
[0, "#ec8f7c", [196, 202, 232], [255, 170, 120, .08]], [.035, "#f4b56b", [232, 234, 244], [255, 190, 120, .1]], [.09, "#f8d877", [250, 250, 250], [255, 214, 150, .05]],
[.16, "#fbe7a1", [255, 255, 255], [255, 214, 150, 0]], [.5, "#fbe7a1", [255, 255, 255], [255, 205, 110, 0]], [.6, "#f7cf6e", [255, 255, 255], [255, 205, 110, .07]],
[.68, "#f0a05c", [250, 244, 238], [255, 170, 90, .12]], [.72, "#dc7389", [228, 218, 232], [250, 150, 120, .09]], [.755, "#8f6bb2", [184, 180, 224], [200, 130, 160, .04]],
[.8, "#474a86", [140, 156, 214], [200, 130, 160, 0]], [.9, "#32356b", [128, 146, 210], [255, 170, 150, 0]], [.965, "#5a4f93", [150, 156, 218], [255, 170, 150, .03]],
[1, "#ec8f7c", [196, 202, 232], [255, 170, 120, .08]],
];
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function dayAt(phase) {
const p = ((phase % 1) + 1) % 1, i = Math.max(0, DAYLIGHT.findIndex((m) => m[0] > p) - 1);
return [DAYLIGHT[i], DAYLIGHT[i + 1], (p - DAYLIGHT[i][0]) / (DAYLIGHT[i + 1][0] - DAYLIGHT[i][0])];
}
const mix = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f));
const lightAt = (phase) => { const [a, b, f] = dayAt(phase); return mix(a[2], b[2], f); };
const washAt = (phase) => { const [a, b, f] = dayAt(phase); return [...mix(a[3].slice(0, 3), b[3].slice(0, 3), f), a[3][3] + (b[3][3] - a[3][3]) * f]; };
const BAYER2 = [0, 2, 3, 1];
function skyBar(cv, w, h) {
cv.width = w; cv.height = h;
const g = cv.getContext("2d"), im = g.createImageData(w, h);
for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
const [a, b, f] = dayAt((x + .5) / w), step = Math.min(2, Math.floor(f * 2 + (BAYER2[(y % 2) * 2 + x % 2] + .5) / 4)) / 2;
im.data.set([...mix(rgbOf(a[1]), rgbOf(b[1]), step), 255], (y * w + x) * 4);
}
g.putImageData(im, 0, 0);
}
const LIGHT = {cv: document.createElement("canvas"), cv2: document.createElement("canvas"), pats: new Map(), steps: [.25, .2, .16, .12, .08, .05], edge: 2};
function checker(color) {
if (!LIGHT.pats.has(color)) {
const c = document.createElement("canvas"); c.width = c.height = 2; const g = c.getContext("2d");
g.fillStyle = color; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
LIGHT.pats.set(color, c);
}
return LIGHT.pats.get(color);
}
function lamp(g, cx, cy, r, color, a, shift) {
cx = Math.round(cx); cy = Math.round(cy);
const pat = g.createPattern(checker(color), "repeat"); pat.setTransform(new DOMMatrix([1, 0, 0, 1, shift[0], shift[1]]));
const n = LIGHT.steps.length;
for (let k = n; k >= 1; k--) {
const rk = Math.round(r * k / n), ro = rk + LIGHT.edge;
g.globalAlpha = Math.min(1, a * LIGHT.steps[k - 1]);
for (let dy = -ro; dy <= ro; dy++) {
const ho = Math.floor(Math.sqrt(ro * ro - dy * dy)), hi = Math.abs(dy) <= rk ? Math.floor(Math.sqrt(rk * rk - dy * dy)) : -1;
g.fillStyle = pat;
if (hi < 0) g.fillRect(cx - ho, cy + dy, 2 * ho + 1, 1);
else { g.fillRect(cx - ho, cy + dy, ho - hi, 1); g.fillRect(cx + hi + 1, cy + dy, ho - hi, 1); g.fillStyle = color; g.fillRect(cx - hi, cy + dy, 2 * hi + 1, 1); }
}
}
g.globalAlpha = 1;
}
;
const F3 = (() => {
const q = new URLSearchParams(location.search), was = (k) => localStorage.getItem("megastructure-" + k) === "1";
const RANK = {you: 0, server: 1, frames: 0, look: 1, machine: 2};
const parts = [], S = {gaps: [], js: [], land: 0, n: 0, last: 0, at: 0, cost: 0, now: -1};
let on = q.get("perf") === "1" || q.get("debug") === "1" || was("f3") || was("perf") || was("coords"), el = null, painted = 0;
function add(name, fn, side = "game") { const i = parts.findIndex((p) => p.name === name); if (i >= 0) parts.splice(i, 1); parts.push({name, fn, side}); }
function set(v) {
on = !!v; localStorage.setItem("megastructure-f3", on ? "1" : "0");
for (const k of ["perf", "coords"]) localStorage.removeItem("megastructure-" + k);
if (!on) GpuTime.stop();
document.body.classList.toggle("f3", on); if (el) el.style.display = on ? "" : "none"; S.gaps = []; S.js = []; S.last = S.at = 0; painted = 0;
}
function sample(now, ms, land = 0) {
if (!on) return;
if (now === S.now) { S.js[S.js.length - 1] = Math.max(S.js[S.js.length - 1], ms); }
else { if (S.last) S.gaps.push(now - S.last); S.last = S.now = now; S.js.push(ms); S.land += land; S.n++; }
GpuTime.frame(now);
if (now - painted >= 250) { painted = now; paint(now); }
}
function lines(side) {
const out = [];
const mine = parts.filter((p) => p.side === side).sort((a, b) => (RANK[a.name] ?? 9) - (RANK[b.name] ?? 9));
for (const p of mine) { let l = []; try { l = p.fn() || []; } catch (e) { l = [p.name + ": " + e.message]; } l = l.filter((x) => x !== null && x !== undefined); if (l.length && out.length) out.push(""); out.push(...l); }
return out;
}
function make() {
el = document.createElement("div"); el.id = "f3";
el.innerHTML = '<div class="f3c f3game"></div><div class="f3c f3perf"></div>';
el.addEventListener("click", () => set(false));
document.body.appendChild(el);
}
function write(col, ls) {
while (col.children.length > ls.length) col.lastChild.remove();
ls.forEach((t, i) => { let d = col.children[i]; if (!d) { d = document.createElement("div"); col.appendChild(d); } if (d.textContent !== (t || " ")) d.textContent = t || " "; d.style.visibility = t ? "" : "hidden"; });
}
function paint(now) {
const t0 = performance.now();
if (!el) make();
el.style.display = ""; document.body.classList.add("f3");
write(el.children[0], lines("game")); write(el.children[1], lines("perf"));
S.cost = performance.now() - t0; S.at = now;
}
let hold = 0, held = false;
addEventListener("pointerdown", (e) => { if (!e.target.closest || !e.target.closest("#goalhint, #goals")) return; clearTimeout(hold); held = false; hold = setTimeout(() => { held = true; set(!on); if (on) paint(performance.now()); }, 500); }, true);
for (const k of ["pointerup", "pointercancel", "pointerleave"]) addEventListener(k, () => clearTimeout(hold), true);
addEventListener("click", (e) => { if (held && e.target.closest && e.target.closest("#goalhint, #goals")) { held = false; e.stopPropagation(); e.preventDefault(); } }, true);
const at = (l, k) => { if (!l.length) return 0; const s = l.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * k))]; };
add("frames", () => {
const g = S.gaps, n = S.js.length, secs = g.reduce((a, b) => a + b, 0) / 1000;
const r = [`${secs ? Math.round(g.length / secs) : "-"} fps  frame ${at(g, .5).toFixed(1)} / ${at(g, .95).toFixed(1)} ms (median / p95)`,
`script ${at(S.js, .5).toFixed(1)} / ${at(S.js, .95).toFixed(1)} ms  land ${(n ? S.land / n : 0).toFixed(1)} ms`,
GpuTime.ms === null ? `GPU n/a${GpuTime.ok ? " (waiting)" : "  (no timer on this GPU)"}` : `GPU ${GpuTime.ms.toFixed(1)} ms a frame (mean, ${GpuTime.contexts} canvases)`];
S.gaps = []; S.js = []; S.land = 0; S.n = 0;
return r;
}, "perf");
return {add, set, sample, toggle: () => set(!on), get on() { return on; }, get el() { return el; }, lines, get cost() { return S.cost; }};
})();
;
function drawAgents() {
const el = $("agents"); el.innerHTML = "";
const asleep = agents.filter((a) => !a.online).length;
agents.filter((a) => a.online).sort((a, b) => (b.name === me) - (a.name === me) || a.name.localeCompare(b.name)).forEach((a) => {
const d = document.createElement("div");
d.className = "ag" + (a.name === follow ? " sel" : "") + (a.online ? "" : " off");
d.innerHTML = `<span class="dot" style="background:${agentTint(a.name)}"></span><span class="n">${esc(a.name)}${a.name === me ? " (you)" : ""}</span>`;
d.onclick = () => { if (me) return; follow = follow === a.name ? null : a.name; drawAgents(); };
el.appendChild(d);
});
if (asleep) el.insertAdjacentHTML("beforeend", `<div class="ag off"><span class="n">+ ${asleep} asleep</span></div>`);
}
F3.add("server", () => {
const m = metrics; if (m.tick_ms_p50 === undefined) return ["Server -"];
return [`Server ${m.agents_online} awake / ${m.agents_total}  ${m.tick_ms_p50} ms/tick`, `${m.tiles_changed} tiles changed  ${m.crafts} crafts  ${m.trades} gifts  ${m.deaths} deaths`];
});
;
const mouse = {x: 0, y: 0, in: false};
let drag = null;
function aimLift(x, y) {
if (Build.on && (Build.S.plane !== null || Build.S.deep !== null)) return shOf(Build.S.plane !== null ? Build.S.plane : Build.S.deep) * zoom;
return FLOORS && myAt && Floors.any(x, y) ? shOf(settleNear(x, y, myAt.z)) * zoom : liftAt(x, y);
}
function tileAtScreen(mx, my) {
if (HdLook.on) { const q = HdLook.pick(mx, my, Build.on ? (x, y) => Build.level({x, y}) : null); if (q) return q; }
const S = TS(), [ox, oy] = screenOrigin(S), x = Math.floor((mx - ox) / S), at = (y, up) => Curve.y(oy + y * S, up), row = (f) => Math.floor((f - oy) / S);
const reach = (APART * RELIEF_STEP / 16 + 1) * S, eye = Curve.c ? Math.abs(Curve.c.ref) : 0;
if (Curve.on && !Build.on) {
const sy = Curve.sy(oy, S); let who = null;
for (const p of ents.values()) if (p.e && !(p.e.kind === "agent" && p.e.id === myId)) {
const bx = ox + p.x * S, lift = liftOf(p), by = bodyY(p, sy);
if (mx >= bx && mx < bx + S && my >= by && my < by + S && Math.abs(by - (oy + p.y * S - lift - STAND * zoom)) > 1 && !sy.gone(p.y, lift) && (!who || p.y > who.y)) who = p;
}
if (who) return {x: Math.round(who.x), y: Math.round(who.y), fy: .5};
}
for (let y = row(Curve.inv(my + reach) + reach + eye), end = row(Curve.inv(my) - reach - eye) - 1; y >= end; y--) {
const up = aimLift(x, y), top = at(y, up), foot = at(y + 1, up);
if (my >= top && my < foot) return {x, y, fy: (my - top) / (foot - top)};
if (my >= foot && my < at(y + 1, aimLift(x, y + 1))) return {x, y, fy: .999, face: true, down: Math.max(0, Math.floor((my - foot) / (RELIEF_STEP * zoom)))};
}
const y = row(Curve.inv(my)), top = at(y, 0);
return {x, y, fy: Math.max(0, Math.min(.999, (my - top) / Math.max(1, at(y + 1, 0) - top)))};
}
cv.addEventListener("mousemove", (e) => {
if (Math.abs(e.clientX - mouse.x) + Math.abs(e.clientY - mouse.y) > 4) inputMode = "mouse";
mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true;
if (drag) {
const dx = (e.clientX - drag.x) / TS(), dy = (e.clientY - drag.y) / TS();
if (Math.abs(dx) + Math.abs(dy) > .3) drag.moved = true;
if (drag.moved && me && Build.on) { const q = tileAtScreen(e.clientX, e.clientY); if (!drag.at || drag.at.x !== q.x || drag.at.y !== q.y) { drag.at = q; Build.click(q, e.shiftKey); } }
if (drag.moved && !me) { follow = null; camT.x = cam.x = drag.cx - dx; camT.y = cam.y = drag.cy - dy; }
}
const p = tileAtScreen(e.clientX, e.clientY), t = tile(p.x, p.y), tip = $("hover");
if (!t) { tip.style.display = "none"; return; }
let text;
if (me && Build.on) Build.point(p);
if (me) { const it = Build.on ? Build.hint(p) : intent(aimAt(p, e.shiftKey), e.shiftKey); text = it ? it.text : ""; tip.className = it && it.ok === false ? "bad" : ""; cv.classList.toggle("act", !!(it && !it.walk && !it.info && it.ok !== false)); }
else {
const here = entityAt(p);
text = here ? (here.e.name || here.e.kind) : GROUND.has(t[0]) ? label(CH[t[1]]) : label(CH[t[0]]);
}
if (!text || (me && text === "Walk here")) { tip.style.display = "none"; return; }
tip.textContent = text;
tip.style.display = "block"; tip.style.left = e.clientX + 16 + "px"; tip.style.top = e.clientY + 14 + "px";
});
cv.addEventListener("mouseleave", () => { mouse.in = false; $("hover").style.display = "none"; });
cv.addEventListener("mousedown", (e) => { if (e.button === 0) drag = {x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false}; });
cv.addEventListener("mouseup", (e) => { if (e.button === 0 && drag && !drag.moved && me) { const q = tileAtScreen(e.clientX, e.clientY); if (Build.on) Build.click(q, e.shiftKey); else clickTile(q, e.shiftKey); } drag = null; });
cv.addEventListener("contextmenu", (e) => { e.preventDefault(); if (!me) return; const q = tileAtScreen(e.clientX, e.clientY); if (Build.on) Build.click(q, true); else clickTile(q, false); });
;
let agentWs = null, aid = 0, pending = {}, busy = false;
function joinGame(name) {
if (agentWs && agentWs.readyState <= 1) return;
const key = "megastructure-token-" + name;
let token = localStorage.getItem(key); if (!token) { token = crypto.randomUUID(); localStorage.setItem(key, token); }
agentWs = openSocket("/agent");
agentWs.onopen = async () => {
const ticket = ACCOUNT.url ? await accountTicket() : null;
if (ACCOUNT.url && !ticket) { agentWs.close(); return; }
const r = await rpc("hello", {name, token, persona: "human", race: myRace, ...(ticket ? {ticket} : {})});
if (r.error === "bad_ticket") accountDrop();
if (!r.ok) { toast(r.error === "bad_token" ? `“${name}” is already someone else. Pick another name.` : (r.detail || r.error), true); agentWs.close(); return; }
me = r.agent.name; myId = r.agent.id; follow = null; localStorage.setItem("megastructure-name", me);
camT.x = cam.x = r.agent.x; camT.y = cam.y = r.agent.y;
$("joinbox").style.display = "none"; $("hud").style.display = "flex"; document.body.classList.add("playing");
$("help").style.display = localStorage.getItem("megastructure-help") === "on" ? "block" : "none";
$("mode").textContent = "playing as " + me;
toast(TOUCH ? `**Welcome, ${me}.**\nYou wake up in a meadow.`
: `**Welcome, ${me}.**\nYou wake up in a meadow.\n\`W\` \`A\` \`S\` \`D\` walk · \`Space\` use\n\`Enter\` talk · \`G\` goals · \`H\` help`, false, 16000, true);
refresh();
};
agentWs.onmessage = (m) => {
const d = JSON.parse(m.data);
if (d.type === "progress") {
if (pendingAside && pendingAside.tool === d.tool) myAside = {...pendingAside, t0: performance.now()};
else if (pendingAct && pendingAct.tool === d.tool) myAction = {...pendingAct, t0: performance.now()};
if (d.ticks / d.tick_hz >= .35) progress = {t0: performance.now(), ms: d.ticks / d.tick_hz * 1000, tool: d.tool};
return;
}
const f = pending[d.id]; if (f) { delete pending[d.id]; f(d); }
};
agentWs.onclose = () => { if (me) toast("Disconnected", true); me = null; myId = null; meObs = null; $("mode").textContent = "watching"; ["hud", "craft", "help", "goals", "bag"].forEach((id) => $(id).style.display = "none"); $("joinbox").style.display = "block"; document.body.classList.remove("playing", "tab"); };
}
function rpc(op, extra) {
return new Promise((res) => {
if (!agentWs || agentWs.readyState !== 1) return res({ok: false, error: "offline"});
const id = ++aid; pending[id] = res; agentWs.send(JSON.stringify({id, op, ...extra}));
});
}
let refreshing = false;
async function refresh() {
if (!me || refreshing) return;
refreshing = true;
const r = await rpc("observe", {});
refreshing = false;
if (!r.ok) return;
meObs = r.obs; const s = meObs.self;
const p = ents.get("agent" + myId);
if (p && !pred && !(walking && p.walking) && Math.abs(p.tx - s.x) + Math.abs(p.ty - s.y) > 4) {
p.x = p.tx = s.x; p.y = p.ty = s.y; cam.x = camT.x = s.x; cam.y = camT.y = s.y;
}
$("mode").textContent = `${s.name} · ${s.x}, ${s.y}${s.sheltered ? " · sheltered" : ""}`;
drawVitals(s);
drawHotbar(s.inventory); drawGoals();
if ($("craft").style.display === "block") drawRecipes();
}
setInterval(refresh, 700);
let myAction = null, pendingAct = null;
const ASIDE = ["eat"];
let myAside = null, pendingAside = null;
const MEANWHILE = ["walk", "stop", "step", "move_to", "say", "shout", "jump"];
const eating = () => !!(pendingAside || myAside);
let actTarget = null;
function facingTo(p) {
const s = myPos(); if (!s) return null;
const dx = p.x - s.x, dy = p.y - s.y;
return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "E" : dx < 0 ? "W" : null) : dy > 0 ? "S" : "N";
}
async function act(tool, args, quiet) {
if (!me || (eating() && !MEANWHILE.includes(tool))) return null;
while (pred && performance.now() < pred.until) await new Promise((ok) => setTimeout(ok, 16));
if (actTarget && "dir" in args) { args = {...args, x: actTarget.x, y: actTarget.y}; delete args.dir; }
const look = actTarget ? facingTo(actTarget) : args.dir;
const s0 = myPos(), dv = args.dir && DIRV[args.dir];
const at = "x" in args && "y" in args && tool !== "move_to" ? [args.x, args.y] : dv && s0 ? [s0.x + dv[0], s0.y + dv[1]] : null;
actTarget = null;
const aside = ASIDE.includes(tool);
if (aside) pendingAside = {tool, item: args.item};
else { busy = true; pendingAct = {tool, dir: look, at, tid: args.target, with: args.with, item: args.item}; }
const r = await rpc("act", {tool, args});
if (aside) { pendingAside = myAside = null; if (progress && progress.tool === tool) progress = null; }
else {
pendingAct = null; myAction = null;
busy = false; progress = null;
if (walking === null && [...keys].some((k) => KEYDIR[k])) syncWalk();
}
if (!r.ok && !["interrupted", "offline", "too_soon"].includes(r.error) && !quiet) toast(`${label(tool)}: ${r.detail || r.error}`, true);
if (r.ok) {
const c = r.result.changed || {};
const gained = Object.fromEntries(Object.entries(c.inventory || {}).filter(([, v]) => v > 0));
const p = ents.get("agent" + myId);
if (Object.keys(gained).length) sfx("collect");
if (Object.keys(gained).length && p) floats.push({x: p.tx, y: p.ty, text: "+" + fmt(gained), color: "#fff1a8", t: performance.now() / 1000});
if (tool === "place") markGoal({workbench: "placedBench", seed: "planted", campfire: "placedFire", mailbox: "placedMail"}[args.item] || "placed");
if (tool === "water") markGoal("watered");
if (tool === "dig_down") sfx("crumble");
if (tool === "milk") markGoal("milked");
if (r.result.text !== undefined) toast(`The sign reads\n**“${r.result.text}”**`);
if (r.result.named) toast(`Its name is **${r.result.named}**.`);
if (r.result.took) { if (!Object.keys(r.result.took).length) toast("It's empty."); }
else if (r.result.chest) toast(`Chest: ${fmt(r.result.chest) || "empty"}`);
if (r.result.rows_near_to_far) toast(`You look into the distance: ${r.result.agents.length ? "someone is out there." : "nobody."}`);
}
if (tool !== "step" || (r.ok && r.result.changed && r.result.changed.inventory)) refresh();
return r;
}
;
const DIRV = {N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0]};
function myPos() { const p = ents.get("agent" + myId); return p ? {x: p.tx, y: p.ty} : meObs ? meObs.self : null; }
function dirTo(p) { const s = myPos(); if (!s) return null; for (const [d, [dx, dy]] of Object.entries(DIRV)) if (s.x + dx === p.x && s.y + dy === p.y) return d; return null; }
function plainWalk(x, y) {
const t = tile(x, y); if (!t) return false;
if (wet(t[1])) return t[0] === "V" || !SOLID.has(t[0]);
return WALKABLE_GROUND.has(t[1]) && !SOLID.has(t[0]);
}
function walkable(x, y, fx, fy) {
if (fx === undefined) return plainWalk(x, y);
const z = landAt(myZ(fx, fy), x, y, fx, fy, springs(x, y)), c = z === null ? null : Floors.get(x, y, z);
return z !== null && (c && FLOORS ? !SOLID.has(c[1]) : plainWalk(x, y));
}
const FILLS = {dirt: {o: ",", u: ",", "~": ",", "(": "~", "=": "(", ")": "="}, path: {".": "_", ",": "_", "'": "_"}, plank: {"~": ":", ".": "n", ",": "n", "'": "n"}};
const FILL_TEXT = {",": "Fill with dirt", "~": "Raise the bottom", "(": "Raise the bottom", "=": "Raise the bottom", _: "Lay path", ":": "Build bridge", n: "Lay floor"};
const FILL_HELP = {dirt: "Dirt fills holes and shallow water", path: "Paths go on grass or dirt", plank: "Planks: bridge over water, floor on land"};
const PLACEABLE_BLOCK = {mailbox: "X", boat: "V", wood_wall: "W", flower: "f", bed: "B", chair: "h", table: "L", plant: "p", clock: "K", rug: "r", gate: "g", fence: "#", stone_wall: "%", door: "+", campfire: "^", workbench: "&", sign: "?", flag: "!", chest: "C", well: "Y", coop: "J", picnic_blanket: "m", basket: "q", trough: "e", hay: "y"};
PLACEABLE_BLOCK.roof = "roof"; PLACEABLE_BLOCK.stairs = "stairs"; PLACEABLE_BLOCK.ladder = "l";
const HARVEST = {t: "Dig up stump", U: "Chop tree", v: "Cut bush", e: "Take down trough", y: "Take hay bale", Y: "Take down well", J: "Take down coop", m: "Roll up blanket", q: "Take basket", X: "Take down mailbox", V: "Take boat", W: "Take down wall", l: "Take ladder", f: "Pick flower", B: "Take down bed", h: "Take down chair", L: "Take down table", p: "Take plant",
K: "Take down clock", r: "Roll up rug", g: "Take down gate", F: "Pick fruit", ";": "Uproot sprout", T: "Chop tree", b: "Pick berries", M: "Mine rock", R: "Mine rock wall", "*": "Mine ore", H: "Cut thicket", Q: "Pick mushroom",
w: "Harvest wheat", "\"": "Uproot young wheat", "#": "Take down fence", "%": "Take down wall", "+": "Take down door",
"^": "Take down campfire", "&": "Take down workbench", "?": "Take down sign", "!": "Take down flag", C: "Break chest open", x: "Fire!"};
const TOOL_FOR = {t: "axe", U: "axe", T: "axe", M: "pickaxe", "*": "pickaxe", H: "axe", "#": "axe", "%": "pickaxe", "+": "axe", "&": "axe", C: "axe", B: "axe", h: "axe",
L: "axe", K: "axe", g: "axe", W: "axe", V: "axe", X: "axe", Y: "pickaxe", J: "axe", e: "axe", l: "axe"};
const WEAPON_DMG = {sword: 6, spear: 4, axe: 3, pickaxe: 2};
const inHand = () => (selected && meObs && meObs.self.inventory[selected] ? selected : null);
function entityAt(p) {
const s = myPos(), h = s ? myZ(s.x, s.y) : null, others = [...ents.values()].filter((q) => q.e && !(q.e.kind === "agent" && q.e.id === myId) && (h === null || Math.abs(standsAt(q) - h) <= 4));
return others.find((q) => q.tx === p.x && q.ty === p.y) || others.find((q) => Math.round(q.x) === p.x && Math.round(q.y) === p.y);
}
const reachOf = (weapon) => (weapon === "spear" ? 3 : 2);
const TALL = "TFU";
function aimAt(p, shift) {
if (!GROUND.has(combAt(p.x, p.y)) || entityAt(p)) return p;
if (p.fy > 1 - (4 + STAND) / 16 && entityAt({x: p.x, y: p.y + 1})) return {x: p.x, y: p.y + 1};
const forGround = selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || ["seed", "hoe", "watering_can"].includes(selected));
if (forGround) return p;
for (const dy of [1, 2]) {
const c = combAt(p.x, p.y + dy);
if (!c || !TALL.includes(c)) continue;
const spr = objectSprite(c, p.x, p.y + dy, 0), above = spr ? -spr[6] : 0;
if (above > (dy - 1) * 16 + 3) return {x: p.x, y: p.y + dy};
}
return p;
}
function intent(p, shift) {
let t = tile(p.x, p.y), s = myPos(), foot = null;
if (!t || !s) return null;
if (t[0] === "Z" || t[0] === "z") {
const st = structAt(p.x, p.y);
if (st && !(t[0] === "z" && selected && !shift && !FOODS.includes(selected))) {
foot = footOf(st.c, st.x, st.y); t = [st.c, t[1]];
}
}
const [c, g] = t, flower = c === "f", ent = entityAt(p);
const res = intent0(p, shift, t, c, g, flower, ent, s);
if (res && foot && !res.foot && !res.walk && !res.here) res.foot = foot;
if (res && !res.ent && res.z === undefined && !res.walk && !res.here) res.at = floorAt(p.x, p.y);
return res;
}
const CAN_SIZE = 12;
function intent0(p, shift, t, c, g, flower, ent, s) {
const placing = selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed");
const hasBlock = !GROUND.has(c) && !(flower && placing);
const isMe = p.x === s.x && p.y === s.y;
if (ent) {
const who = ent.e.name || ent.e.kind, w = inHand(), weapon = w && WEAPON_DMG[w] ? w : null;
if (ent.e.kind !== "agent" && selected === "name_tag" && !shift)
return {ent, text: ent.e.name ? `Rename ${ent.e.name}` : `Name the ${label(ent.e.kind)}`, near: USE_R, diag: true, run: () => nameAnimal(ent.e)};
if (ANIMALS[ent.e.kind] && selected && FEEDS.includes(selected) && !shift)
return {ent, text: `Feed ${label(ent.e.kind)}`, near: USE_R, diag: true, run: () => act("feed", {target: ent.e.id, item: selected})};
if (ent.e.kind === "agent" && selected && !weapon && !shift)
return {ent, text: `Give to ${ent.e.name}`, near: 2, run: (d) => act("give", {target: ent.e.id, item: selected, n: 1})};
if (shift) {
if (ent.e.kind === "cow") return {ent, text: "Milk cow", near: USE_R, diag: true, run: () => act("milk", {target: ent.e.id})};
if (ent.e.kind === "agent") return {ent, text: `${ent.e.name}: hold a thing to give it`, info: true};
return {ent, text: {chicken: "Chicken: feed it for eggs", chick: "A chick", calf: "A calf",
tusker: "A tusker: it charges, step aside", pincer: "A pincer: it snaps up close",
strawman: "A strawman: it fears firelight", wisp: "A wisp",
wyrm: "A wyrm: stay out of its line",
mossback: "Old Mossback: hit the neck", sporeling: "A sporeling: one hit"}[ent.e.kind] || who, info: true};
}
return {ent, text: weapon ? `Attack ${who}` : `Punch ${who}`, near: reachOf(weapon), diag: true, attack: true,
run: () => act("attack", weapon ? {target: ent.e.id, with: weapon} : {target: ent.e.id})};
}
const up = Climb.intent(p, shift) || Floors.intent(p, shift);
if (up) return up;
const underfoot = isMe && hasBlock && !SOLID.has(c);
if (isMe && !underfoot && !(selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed")))
return {text: "Pick up", run: () => act("pick_up", {}), here: true};
if (selected && !shift) {
const it = selected, block = PLACEABLE_BLOCK[it];
if ((block || FILLS[it] || it === "seed") && rimAt(p.x, p.y)) return {text: "Nothing stays on the edge of a hill", ghost: it, ok: false};
if (c === "e" && it !== "torch") return FEEDS.includes(it) ? {text: "Fill trough", near: 1, run: (d) => act("store", {dir: d, item: it, n: meObs.self.inventory[it] || 1})}
: {text: "Troughs take hay, grain or greens", ok: false};
if ((c === "C" || c === "q") && it !== "torch") return {text: `Store in ${c === "q" ? "basket" : "chest"}`, near: 1, run: (d) => act("store", {dir: d, item: it, n: meObs.self.inventory[it] || 1})};
const free = !hasBlock && WALKABLE_GROUND.has(g);
if (FOOT[block]) {
const f = footprint(block, p.x, p.y, s.x, s.y);
const bad = f.tiles.filter((q) => { const tq = tile(q.x, q.y);
return !tq || !(GROUND.has(tq[0]) || tq[0] === "f") || !WALKABLE_GROUND.has(tq[1]) || tq[1] === ":"
|| (q.x === s.x && q.y === s.y) || (SOLID.has(block) && entityAt(q)) || rimAt(q.x, q.y) || floorAt(q.x, q.y) !== floorAt(p.x, p.y); });
const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({x: p.x + dx, y: p.y + dy}))
.filter((q) => !f.tiles.some((r) => r.x === q.x && r.y === q.y));
return {text: bad.length ? (bad.some((q) => q.x === s.x && q.y === s.y) ? "Step aside first" : bad.some((q) => entityAt(q)) ? "Something is in the way" : `Needs a clear ${FOOT[block].join("×")} spot`) : `Place ${label(it)}`,
ghost: it, ok: !bad.length, bad, foot: f.tiles, anchor: {x: f.ax, y: f.ay}, from: near, near: 1, run: (d) => act("place", {dir: d, item: it})};
}
if (block === "V") return !hasBlock && wet(g) ? {text: "Launch boat", ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})}
: {text: "Boats go on shallow water", ghost: it, ok: false};
if (block) return free ? {text: `Place ${label(it === "hay" ? "hay_bale" : it)}`, ghost: it, ok: true, near: 1,
run: (d) => (it === "sign" || it === "flag" ? placeWritten(d, it) : act("place", {dir: d, item: it}))}
: {text: `Can't place ${label(it)} here`, ghost: it, ok: false};
if (it === "seed") {
if (!hasBlock && (g === "o" || g === "u")) return {text: "Plant seed", ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})};
return {text: "Seeds need tilled soil", ghost: it, ok: false};
}
if (FILLS[it]) {
const res = !hasBlock && FILLS[it][g];
return res ? {text: FILL_TEXT[res], ghost: it, ghostGround: res, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})}
: {text: FILL_HELP[it], ghost: it, ghostGround: Object.values(FILLS[it])[0], ok: false};
}
if (it === "torch") {
const burnable = (!GROUND.has(c) && "TFbH#+&?!\";wCBhLrgWVXJmqeyUv".includes(c)) || (GROUND.has(c) && g === ".");
return burnable ? {text: "Set on fire", ok: true, near: 1, run: (d) => act("ignite", {dir: d, with: "torch"})}
: {text: "That won't burn", ok: false};
}
if (it === "hoe" && !hasBlock && (g === "." || g === ","))
return {text: "Till soil", near: 1, run: (d) => act("dig", {dir: d, with: "hoe"})};
if (it === "watering_can" && (c === "Y" || (wet(g) && GROUND.has(c))))
return {text: `Fill can (${meObs ? meObs.self.can ?? CAN_SIZE : "?"}/${CAN_SIZE})`, near: 1, run: (d) => act("water", {dir: d, with: "watering_can"})};
if (it === "watering_can" && (c === ";" || c === '"') && meObs && meObs.self.can === 0) return {text: "The can is empty", ok: false};
if (it === "watering_can" && (c === ";" || c === '"')) return g === "u" ? {text: "Already watered", ok: false}
: {text: "Water crop", near: 1, run: (d) => act("water", {dir: d, with: "watering_can"})};
}
const sailing = !!(meObs && meObs.self.sailing);
if (c === "V" && !shift && !sailing) return {text: "Board the boat", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
if (sailing && !hasBlock && wet(g)) return {text: "Sail here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
if (!hasBlock && wet(g) && selected === "pickaxe" && !shift && g !== ")") return {text: "Dig deeper", near: 1, run: (d) => act("dig", {dir: d, with: "pickaxe"})};
if (!sailing && !hasBlock && wet(g) && !placingItem()) return {text: "Swim here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
if (sailing && !hasBlock && WALKABLE_GROUND.has(g)) return {text: "Go ashore", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
if (hasBlock) {
if ((c === "C" || c === "q") && !shift) return {text: c === "q" ? "Open basket" : "Open chest", near: 1, run: (d) => act("take", {dir: d})};
if (c === "e" && !shift) return {text: troughAt.has(p.x + "," + p.y) ? "Trough: feeds animals nearby" : "Empty trough: fill it with hay",
near: 1, run: (d) => act("take", {dir: d})};
if (c === "Y" && !shift) return {text: "Well: fills watering cans", info: true};
if (c === "J" && !shift) return {text: "Coop: hens lay here", info: true};
if (c === "m" && !shift) return {text: "Picnic blanket: food fills you more", info: true};
if ((c === "?" || c === "!") && !shift) return {text: "Read", near: 1, run: (d) => act("read_sign", {dir: d})};
if (c === "X" && !shift) return {text: mailAt.has(p.x + "," + p.y) ? "Read mail" : "Mailbox", near: 1, run: () => openMailPanel(actTarget)};
if (c === "B" && !shift) return {text: "Sleep", near: 1, run: (d) => act("sleep", {dir: d})};
if ((c === "&" || c === "^") && !shift) return {text: c === "&" ? "Craft" : "Cook", near: 2, run: () => openCraft()};
const crop = cropSpecies(p.x, p.y);
const text = c === "w" ? `Harvest ${crop}` : c === '"' ? `Uproot ${crop}` : c === ";" ? `Uproot ${crop} sprout` : HARVEST[c] || label(CH[c]);
const tool = TOOL_FOR[c], w = inHand();
if (c === "*" && w !== "pickaxe")
return {text: meObs && meObs.self.inventory.pickaxe ? "Ore: hold your pickaxe" : "Ore: needs a pickaxe", ok: false};
const how = tool && w !== tool ? " (slow)" : "";
return {text: text + how, near: 1, run: (d) => act("dig", w ? {dir: d, with: w} : {dir: d})};
}
if (wet(g)) return {text: label(CH[g]), info: true};
if (shift) {
const takeUp = {_: "Take up the path", n: "Take up the floor", ":": "Take up the bridge"}[g];
if (takeUp) return {text: takeUp, near: 1, run: (d) => act("dig", {dir: d})};
if (g !== "." && g !== ",") return {text: label(CH[g]), info: true};
return inHand() === "hoe" ? {text: "Till soil", near: 1, run: (d) => act("dig", {dir: d, with: "hoe"})}
: {text: "Needs a hoe", ok: false};
}
return {text: "Walk here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
}
const USE_R = 2;
const SWING_MS = 420;
let lastSwing = 0;
const LAYER = .5;
function reaches(x, y, r, z, flat) {
const s = myPos(); if (!s) return false;
const h = myZ(s.x, s.y), dz = flat ? 0 : ((z === undefined ? settleNear(x, y, h) : z) - h) * LAYER;
return (x - s.x) ** 2 + (y - s.y) ** 2 + dz * dz <= (r + .5) ** 2;
}
function landBetween(s, p, z) {
const h = myZ(s.x, s.y);
if (z > h) { for (let c = h + 2; c <= z + 1; c++) if (solidAt(s.x, s.y, c)) return true; return false; }
if (p.x === s.x && p.y === s.y) return false;
for (let c = z + 1; c <= h + 1; c++) if (solidAt(p.x, p.y, c)) return true;
return false;
}
const standsAt = (o) => (o.e && o.e.z !== undefined ? o.e.z : floorAt(o.tx, o.ty));
function inReach(p, it, flat = it.flat) {
const s = myPos(); if (!s) return false;
const tiles = it.foot && !it.from ? it.foot : [p];
const reach = it.attack ? it.near : USE_R, z = it.ent ? standsAt(it.ent) : it.z !== undefined ? it.z : it.at;
if (!flat && !it.ent && it.z === undefined && it.at !== undefined && !it.ghost && landBetween(s, p, it.at)) return false;
return tiles.some((q) => reaches(q.x, q.y, reach, z, flat))
&& !(it.foot && it.from && it.foot.some((q) => q.x === s.x && q.y === s.y));
}
const TOO_HIGH = "Out of reach: too high up, or too far down.";
async function perform(p, it) {
if (!it || it.info || !it.run || (eating() && !it.walk)) return;
if (it.ok === false) return toast(it.text, true);
if (it.walk || it.here) return it.run();
if (!inReach(p, it)) return toast(inReach(p, it, true) ? TOO_HIGH : "Too far: get closer.", true);
if (it.attack) {
const now = performance.now(), me_ = ents.get("agent" + myId);
if (now - lastSwing < SWING_MS) return;
lastSwing = now; if (me_) me_.swing = {t0: now, with: inHand()};
}
if (it.foot && !it.from) {
const s = myPos();
p = it.foot.slice().sort((a, b) => Math.max(Math.abs(a.x - s.x), Math.abs(a.y - s.y)) - Math.max(Math.abs(b.x - s.x), Math.abs(b.y - s.y)))[0];
}
actTarget = p;
return it.run(dirTo(p));
}
function clickTile(p, shift) {
p = aimAt(p, shift);
const it = intent(p, shift);
perform((it && it.own) || p, it);
}
;
const fulls = new Map();
const fullIcon = (n) => fulls.get(n) || (fulls.set(n, iconCanvas(n)), fulls.get(n));
const slotIcon = (n) => smallCanvas(n);
function openCraft() { $("craft").style.display = "block"; craftOpened(); }
const ICONS = {
wood: ["items", 32, 48], plank: ["items", 32, 64], stone: ["items", 32, 80], ingot: ["items", 48, 64], fiber: ["gen", "fiber"],
ore: ["gen", "ore"], path: ["cobble", 16, 16], dirt: ["hill1", 16, 32, 14, 14], stone_block: ["hill3", 16, 32, 14, 14], seed: ["items", 0, 128],
axe: ["items", 32, 0], pickaxe: ["gen", "pickaxe"], hoe: ["items", 48, 0], watering_can: ["items", 32, 16], spear: ["gen", "spear"], sword: ["gen", "sword"],
torch: ["gen", "torch"], rope: ["gen", "rope"], name_tag: ["gen", "name_tag"], ladder: ["gen", "ladder"], stairs: ["gen", "stairs"],
berries: ["items", 32, 160], fruit: ["items", 32, 96], mushroom: ["nature", 16, 0], egg: ["items", 48, 176], milk: ["items", 64, 0],
meat: ["gen", "meat"], cooked_meat: ["gen", "cooked_meat"], bread: ["gen", "bread"],
wheat: ["items", 16, 128], pumpkin: ["items", 16, 144], cauliflower: ["items", 16, 48], lettuce: ["items", 16, 112],
eggplant: ["items", 16, 80], carrot: ["items", 16, 32],
flower: ["nature", 16, 48], workbench: ["gen", "workbench"], campfire: ["gen", "campfire0"], chest: ["chest", 16, 16],
boat: ["boats", 8, 36, 32, 24], mailbox: ["mailbox", 0, 16, 16, 32], fence: ["fences", 0, 48], gate: ["gates", 0, 0], wood_wall: ["house_walls", 16, 32], roof: ["house_roof", 16, 16], stone_wall: ["gen", "stone_wall"], door: ["door", 80, 0],
sign: ["signs", 0, 0], flag: ["gen", "flag"], bed: ["furniture", 0, 16, 16, 32], chair: ["furniture", 64, 32],
table: ["furniture", 48, 48], plant: ["furniture", 48, 0, 16, 32], clock: ["furniture", 96, 48], rug: ["furniture", 0, 80], well: ["well", 0, 0, 32, 32], coop: ["coop", 160, 80, 32, 44], picnic_blanket: ["blanket", 2, 8, 44, 32], basket: ["basket", 0, 0], trough: ["barn", 0, 0], hay: ["barn", 0, 16],
};
FILLS.stone_block = FILLS.dirt; FILL_HELP.stone_block = "Stone fills holes and shallow water";
const smalls = new Map();
function smallArt(img, x, y, w, h, size = 16) {
const src = document.createElement("canvas"); src.width = w; src.height = h;
const sg = src.getContext("2d", {willReadFrequently: true}); sg.drawImage(img, x, y, w, h, 0, 0, w, h);
const d = sg.getImageData(0, 0, w, h).data, at = (i, j) => (j * w + i) * 4;
let x0 = w, y0 = h, x1 = -1, y1 = -1;
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
if (!ic && WEAR[name]) return wearIcon(name);
if (!ic) { g.fillStyle = "#8a6a55"; g.fillRect(4, 4, 8, 8); return c; }
if (ic[0] === "gen") { g.drawImage(IMG.gen, GEN[ic[1]] * 16, 0, 16, 16, 0, 0, 16, 16); return BARE.has(name) ? bare(c) : c; }
const [img, x, y, w = 16, h = 16] = ic;
if (w <= 16 && h <= 16) { g.drawImage(IMG[img], x, y, w, h, (16 - w) >> 1, (16 - h) >> 1, w, h); return BARE.has(name) ? bare(c) : c; }
if (!smalls.has(name)) smalls.set(name, smallArt(IMG[img], x, y, w, h));
const small = smalls.get(name);
g.putImageData(small, (16 - small.width) >> 1, (16 - small.height) >> 1);
return c;
}
const BAR = 10;
let hudU = 2, hudTall = 1, hudK = 2.5, hudSig = "", hudSide = false, hudEdge = null;
function hudFit() {
const d = window.devicePixelRatio || 1, st = document.documentElement.style, was = hudU, touch = document.body.classList.contains("touch");
let n = Math.max(1, Math.round(2 * d));
const low = touch && innerHeight < 520 && innerWidth > innerHeight, tall = low ? Math.min(hudTall, .2) : hudTall;
let side = false;
if (low) {
if (!hudEdge) { hudEdge = document.createElement("div"); hudEdge.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;width:calc(env(safe-area-inset-left) + env(safe-area-inset-right));height:env(safe-area-inset-bottom)"; document.body.appendChild(hudEdge); }
const u3 = Math.max(1, Math.round(3 * d)) / d, room = innerWidth - hudEdge.offsetWidth - 56 * u3 - 12, vit = 99 * Math.max(1, Math.round(4 / 3 * d)) / d + 8;
const fits = (m) => 30 * m / d + 4 <= innerHeight * .14 && vit + (BAR * 32 - 2) * m / d <= room;
let m = n; while (m > 1 && !fits(m)) m--;
if (30 * m / d >= 40 && fits(m)) { side = true; n = m; }
}
if (side !== hudSide) { hudSide = side; document.body.classList.toggle("hudside", side); }
const h = $("hud").offsetHeight;
while (!side && n > 1 && ((BAR * 32 - 2) * n / d > innerWidth - 16 || (h && h + 30 * (n / d - was) > innerHeight * tall))) n--;
hudU = n / d; hudK = side ? Math.max(1, Math.round(4 / 3 * d)) / d : Math.min(low ? 5 / 3 : 2.5, Math.max(1, Math.floor((innerWidth - 34) * d / 198)) / d);
const small = document.body.classList.contains("touch") && Math.min(innerWidth, innerHeight) < 520, land = small ? 2 : 3;
const item = Math.max(1, Math.min(Math.round(land * d), Math.floor(1.6 * n)));
const book = bookPx();
const up = small && innerHeight > innerWidth, [bw, bh] = up ? [116, 299] : small ? [270, 150] : [224, 162];
let bag = up ? Math.round(3.4 * d) : book; while (bag > 1 && (bw * bag / d > innerWidth - 12 || bh * bag / d > innerHeight - 12)) bag--;
if (hudSig === (hudSig = [n, d, item, book, bag, up, side].join())) return false;
let cq = Math.round(2.4 * d); while (cq > 1 && (162 * cq / d > innerWidth - 12 || 326 * cq / d > innerHeight - 12)) cq--;
st.setProperty("--cq", cq / d + "px"); document.body.classList.toggle("upright", up); st.setProperty("--p2", Math.max(1, Math.round(2 * d)) / d + "px");
st.setProperty("--u", hudU + "px"); st.setProperty("--i", item / d + "px"); st.setProperty("--u3", Math.max(1, Math.round(3 * d)) / d + "px"); st.setProperty("--q", book / d + "px"); st.setProperty("--w", Math.max(1, Math.round(book * .7)) / d + "px");
st.setProperty("--b", bag / d + "px");
return hudU !== was;
}
hudFit(); addEventListener("resize", hudFit);
new ResizeObserver(() => document.documentElement.style.setProperty("--hudh", $("hud").offsetHeight + "px")).observe($("hud"));
let slots = JSON.parse(localStorage.getItem("megastructure-slots") || "[]");
function slotOrder(inv) {
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
: (PLACEABLE_BLOCK[name] || FILLS[name] || name === "seed") ? " · select, click the ground to place" : name === "name_tag" ? " · select, use it on an animal to name it" : "";
d.insertAdjacentHTML("beforeend", `<span class="c">${inv[name]}</span><span class="tip">${esc(label(name) + how)}</span>`);
if (name === "watering_can") d.insertAdjacentHTML("beforeend", `<span class="lvl"><i style="width:${Math.round(can / CAN_SIZE * 100)}%"></i></span>`);
d.onclick = () => { selected = selected === name ? null : name; el.dataset.sig = ""; drawHotbar(meObs.self.inventory); };
d.ondblclick = () => useSelected(name);
}
d.insertAdjacentHTML("beforeend", `<span class="k">${(i + 1) % 10}</span>`);
el.appendChild(d);
});
drawBag();
}
const HEART = [4, 84, 9, 8];
const APPLE = ["....sg...", "...sgg...", ".aa.s.aa.", "abbabbbba", "abcbbbbba", "abbbbbbba", "abbbbbbda", ".abbbbda.", "..aaaaa.."];
const APPLE_COL = {a: "#664165", b: "#c87c86", c: "#e8b5ac", d: "#a8606e", s: "#7a5236", g: "#7fae5a"};
function pixelCanvas(cv, w, h, k = hudK) {
const SC = Math.max(1, Math.round(k * (window.devicePixelRatio || 1)));
if (cv.width !== w * SC || cv.height !== h * SC) {
cv.width = w * SC; cv.height = h * SC;
cv.style.width = w * SC / (window.devicePixelRatio || 1) + "px"; cv.style.height = h * SC / (window.devicePixelRatio || 1) + "px";
}
const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
return [g, SC];
}
function drawIcons(cv, icon, value, gain = 0) {
const N = 10, hearts = icon === "heart", iw = hearts ? HEART[2] : APPLE[0].length, ih = hearts ? HEART[3] : APPLE.length;
const one = (hearts ? HP_MAX : FOOD_MAX) / N;
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
function foodPreview() {
if (!meObs) return;
const h = meObs.self.hunger, gain = selected && foodValue[selected] && h < FOOD_MAX ? foodValue[selected] : 0;
drawIcons($("foods"), "food", h, gain && Math.floor(performance.now() / 450) % 2 === 0 ? gain : 0);
}
function drawVitals(s) {
drawIcons($("hearts"), "heart", s.hp);
foodPreview();
const status = s.hunger <= 0 || (SPRINT_FOOD < 0 && s.hunger < 25) ? "Starving: eat something (E)" : s.hunger <= SPRINT_FOOD ? "Too hungry to sprint: eat something (E)" : "";
if (walking && walking.run !== sprinting()) syncWalk();
$("status").textContent = status; $("status").style.display = status ? "block" : "none";
}
const FEEDS = ["pumpkin", "cauliflower", "lettuce", "eggplant", "carrot", "fruit", "berries", "mushroom", "wheat", "bread", "hay"];
const FOODS = ["pumpkin", "cauliflower", "lettuce", "eggplant", "carrot", "fruit", "berries", "mushroom", "egg", "milk", "meat", "cooked_meat", "wheat", "bread"];
function useSelected(name = selected) {
if (!name) return toast("Nothing selected.", true);
if (FOODS.includes(name)) return act("eat", {item: name});
if (WEAR[name]) return act("wear", {item: name});
toast(TOUCH ? `Face a tile and tap the big button to use the ${label(name)}.` : `Face a tile and press ${capOf("use")} (or click it) to use the ${label(name)}.`);
}
let mailAtTile = null;
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
const NOTE_MS = 6000;
function toast(msg, bad, stay = NOTE_MS, chat = !msg.includes("`")) {
if (me && chat && typeof chatLine === "function") { chatLine(msg, bad ? "note bad" : "note sys"); $("chatlog").lastElementChild.dataset.t = Date.now() - (chatKeep() * 1000 - Math.min(stay, chatSmall() ? chatKeep() * 1000 : stay)); }
if (bad) sfx("buzz"); $("toastt").textContent = typeof plain === "function" ? plain(msg) : msg; const t = $("toast"); t.style.display = "block"; $("toastt").style.color = bad ? "var(--warn)" : "var(--ink)"; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.display = "none", 3200); }
const isOpen = (id) => $(id).style.display === "block";
;
const BLURB = {
workbench: "A table with ambitions. Tools are made on it.",
campfire: "Warm, bright, and it cooks. Do not hug it.",
torch: "A stick that is afraid of the dark for you.",
rope: "Three plants holding hands very tightly.",
name_tag: "A word on a string. The cow keeps it.",
plank: "A log that went to finishing school.",
path: "Stones laid flat so your feet feel important.",
boat: "Like walking on water, but drier.",
mailbox: "Holds letters. Has never read one. Probably.",
axe: "Trees hate this one simple trick.",
pickaxe: "Asks the rock politely. Several times. Hard.",
hoe: "Tickles the ground until it grows food.",
watering_can: "Rain, but you decide where.",
spear: "A pointy way to keep your distance.",
sword: "For arguments you intend to win.",
wood_wall: "Keeps the outside outside.",
roof: "A block a storey up. Keeps the sky off.",
ladder: "Lean it on something tall. Up you go.",
stairs: "By a higher floor, the flight builds itself.",
door: "A wall that changes its mind.",
fence: "Tells cows where the world ends.",
gate: "A fence with manners.",
stone_wall: "A wood wall that went to the gym.",
sign: "Shouting, but written down.",
flag: "Says \"mine\" without saying a word.",
chest: "Pockets, for when your pockets are full.",
bed: "Where you wake up after a very bad day.",
chair: "A small table for sitting on.",
table: "Holds things up. Asks for nothing.",
plant: "A friend that never interrupts.",
clock: "Tells you it is later than you thought.",
rug: "Ties the room together. Once you have a room.",
well: "A hole with water and a roof. Fancy.",
coop: "A tiny house. The rent is paid in eggs.",
trough: "A dinner table for those without hands.",
hay: "Dry grass, tied up. Cows call it lunch.",
picnic_blanket: "Food tastes better on it. Nobody knows why.",
basket: "A bowl that grew up in the countryside.",
cooked_meat: "Meat that met the fire and feels better.",
bread: "Wheat's proudest moment.",
ingot: "A rock, melted down to its good part.",
straw_hat: "Shade you can wear. Smells like summer.",
sporecap_hat: "A mushroom on your head. On purpose.",
wizard_hat: "Pointy. Adds wisdom, or at least height.",
wool_beanie: "A hug for your ears.",
flower_crown: "Royalty, but it wilts.",
bandana: "Makes anyone look like they have a plan.",
sprout: "A little leaf on your head. You are a plant now.",
linen_shirt: "Plain, honest, slightly wrinkled.",
red_scarf: "Flaps heroically in any wind.",
wool_sweater: "Itchy at first. Then you never take it off.",
overalls: "Trousers that did not know when to stop.",
wizard_robe: "A dress for people who know secrets.",
linen_shorts: "Knees out. Confidence up.",
denim: "Blue, tough, and goes with everything.",
red_trousers: "Loud trousers for quiet people.",
robe_skirt: "Swishes when you walk. Very satisfying.",
red_sneakers: "Make you feel faster. You are not.",
rain_boots: "Puddles fear you now.",
blue_slippers: "Outdoor adventure, indoor comfort.",
gold_crown: "Heavy is the head. Shiny, though.",
iron_helmet: "A pot for your head. A good pot.",
mossback_helm: "A tortoise's hat, borrowed for good.",
leather_vest: "No pockets. Plenty of attitude.",
iron_chestplate: "Like wearing a door.",
gold_chestplate: "Protects you. Blinds everyone else.",
mossback_plate: "Old shell, new owner. Still mossy.",
leather_chaps: "For legs with places to be.",
iron_greaves: "Your shins send their thanks.",
gold_greaves: "Legs worth robbing.",
moss_kilt: "Green, breezy, oddly tough.",
leather_boots: "Made for walking. And for kicking.",
iron_boots: "Every step is an announcement.",
gold_boots: "You could just walk. But in gold.",
moss_slippers: "Soft as a forest floor. They are one.",
sparkle_charm: "Does nothing. Sparkles while doing it.",
firefly_charm: "Tiny lights follow you. They like you.",
leaf_charm: "Autumn, on demand.",
heart_charm: "Love is in the air. Mostly around you.",
flame_charm: "A warm glow. Trees give you looks.",
frost_charm: "Snowflakes in any weather. Bring a scarf.",
halo_charm: "Looks innocent. Proves nothing.",
spore_charm: "Mushroom dust drifts around you. Achoo.",
flower_charm: "Petals follow you like fans.",
wood: "Formerly a tree. It had plans.",
stone: "Heavy and grey. Proud of both.",
fiber: "Grass with ambitions.",
ore: "A rock with a secret inside.",
dirt: "The ground, now portable.",
stone_block: "A piece of the mountain. Break it for stones.",
seed: "A plant, some assembly required.",
berries: "Small, sweet, gone in a second.",
fruit: "Fell from a tree. Regrets nothing.",
mushroom: "Probably the good kind.",
egg: "Breakfast, or a chicken. Your call.",
milk: "The cow was not consulted.",
meat: "Raw. Brave of you.",
wheat: "Bread, before its big break.",
pumpkin: "Big, orange, hard to argue with.",
cauliflower: "A cloud that chose the ground.",
lettuce: "Mostly water. Crunchy water.",
eggplant: "Purple, shiny, no relation to eggs.",
carrot: "Orange, crunchy, underground until now.",
flower: "Does nothing. Does it beautifully.",
shell_plate: "A piece of Old Mossback. Still warm.",
};
;
const RECIPE_GROUPS = [
["Basics", "workbench", ["workbench", "campfire", "torch", "rope", "plank", "stone", "path", "boat", "mailbox"]],
["Tools", "pickaxe", ["axe", "pickaxe", "hoe", "watering_can", "spear", "sword"]],
["Build", "wood_wall", ["wood_wall", "door", "roof", "stairs", "ladder", "fence", "gate", "stone_wall", "sign", "flag", "chest"]],
["Home", "bed", ["bed", "chair", "table", "plant", "clock", "rug", "well", "coop", "trough", "hay", "name_tag", "picnic_blanket", "basket", "cooked_meat", "bread", "ingot"]],
["Wear", "straw_hat", []],
];
const CRAFT_ROWS = 5, NEED_ROWS = 4, NEED_COLS = 3;
let craftFocus = null, craftTab = "Basics", craftOnly = false, craftPage = 0, craftFind = "";
function craftGroups() {
const listed = new Set(RECIPE_GROUPS.flatMap(([, , n]) => n));
const other = Object.keys(recipes).filter((n) => !listed.has(n));
return [...RECIPE_GROUPS, ...(other.length ? [["Other", "chest", other]] : [])].map(([t, ic, n]) => [t, ic, n.filter((r) => recipes[r])]);
}
function craftState(name) {
const rc = recipes[name], inv = meObs ? meObs.self.inventory : {};
const st = rc.station, near = !st || (meObs && meObs.grid.some((row, j) => [...row].some((ch, i) => Math.abs(i - 10) <= 2 && Math.abs(j - 10) <= 2 && CH[ch] === st)));
const n = Math.min(...Object.entries(rc.inputs).map(([k, v]) => Math.floor((inv[k] || 0) / v)));
return {have: n >= 1, near, n, inv};
}
function craftWhy(name) {
const s = craftState(name), st = recipes[name].station;
return !s.have ? "Missing materials" : s.near ? "Enter or the button to make it" : `Go within 2 tiles of a ${label(st)} to make it`;
}
const craftOk = (name) => { const s = craftState(name); return s.have && s.near; };
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function craftCell(name, n, cls = "") {
const d = document.createElement("div"); d.className = "cell " + cls; d.title = capital(label(name)); d.appendChild(iconCanvas(name));
if (n != null) d.insertAdjacentHTML("beforeend", `<span>${n}</span>`);
return d;
}
function craftView() {
const groups = craftGroups(), g = groups.find(([t]) => t === craftTab) || groups[0]; craftTab = g[0];
const all = (craftFind ? craftFound(groups) : g[2]).filter((n) => !craftOnly || craftOk(n)), pages = Math.max(1, Math.ceil(all.length / CRAFT_ROWS));
craftPage = Math.max(0, Math.min(pages - 1, craftPage));
const shown = all.slice(craftPage * CRAFT_ROWS, (craftPage + 1) * CRAFT_ROWS);
if (!shown.includes(craftFocus)) craftFocus = shown[0] || null;
return {groups, all, shown, pages};
}
function craftFound(groups) {
const q = craftFind.toLowerCase(), all = [...new Set(groups.flatMap(([, , n]) => n))], has = (n) => label(n).toLowerCase().includes(q) || n.includes(q);
const named = all.filter(has);
return [...named, ...all.filter((n) => !named.includes(n) && Object.keys(recipes[n].inputs).some(has))];
}
function craftOpened() { $("recipes").dataset.sig = ""; drawRecipes(); }
function drawRecipes() {
const el = $("recipes"); if (!el || !Object.keys(recipes).length) return;
const v = craftView(), sig = JSON.stringify(meObs ? meObs.self.inventory : {}) + (meObs ? meObs.grid.join("") : "") + [craftTab, craftOnly, craftPage, craftFind].join();
if (el.dataset.sig === sig) return; el.dataset.sig = sig;
const tabs = $("crafttabs"); tabs.innerHTML = "";
for (const [title, ic] of v.groups) {
const b = document.createElement("div"); b.className = "ctab" + (title === craftTab && !craftFind ? " on" : ""); b.dataset.kind = b.title = title;
b.appendChild(iconCanvas(ic)); b.onclick = () => craftTurn({tab: title});
tabs.appendChild(b);
}
tabs.insertAdjacentHTML("beforeend", `<div class="ckeys"><kbd>Q</kbd><kbd>E</kbd></div>`);
$("craftonly").className = "b " + (craftOnly ? "on" : "paper");
el.innerHTML = v.shown.length ? "" : `<div class="cnone">${craftFind ? "Nothing called “" + esc(craftFind) + "”" + (craftOnly ? " that you can make." : ".") : craftOnly ? "Nothing in " + esc(craftTab) + " can be made yet." : "Nothing here."}</div>`;
for (const name of v.shown) {
const d = document.createElement("div"); d.className = "line rcard" + (craftOk(name) ? "" : " no") + (name === craftFocus ? " cur" : "");
d.dataset.name = name; d.title = craftWhy(name);
d.appendChild(craftCell(name)); d.insertAdjacentHTML("beforeend", `<span>${esc(capital(label(name)))}</span>`);
d.onmousemove = () => focusRecipe(name);
d.onclick = () => focusRecipe(name); d.ondblclick = () => craftMake(name);
el.appendChild(d);
}
$("craftmore").textContent = `${craftFind ? "Search" : craftTab} · ${craftPage + 1} of ${v.pages}`;
drawCraftDetail();
}
function focusRecipe(name) {
if (craftFocus === name) return;
craftFocus = name; sfx("pick");
for (const c of $("recipes").querySelectorAll(".rcard")) c.classList.toggle("cur", c.dataset.name === name);
drawCraftDetail();
}
function craftTurn({tab, page, only, last}) {
if (tab !== undefined) { craftTab = tab; craftPage = 0; craftFind = $("craftfind").value = ""; }
if (only !== undefined) { craftOnly = only; craftPage = 0; }
if (page !== undefined) craftPage = page;
craftFocus = null; $("recipes").dataset.sig = ""; sfx("ui"); drawRecipes();
if (last) { const c = [...$("recipes").querySelectorAll(".rcard")].pop(); if (c) focusRecipe(c.dataset.name); }
}
function craftMake(name, five) {
if (!name) return;
const s = craftState(name);
if (s.have && s.near) act("craft", five && s.n >= 5 ? {recipe: name, n: 5} : {recipe: name}); else toast(craftWhy(name), true);
}
function drawCraftDetail() {
const el = $("craftdetail"), name = craftFocus; if (!el) return;
el.innerHTML = ""; if (!name || !recipes[name]) return;
const rc = recipes[name], s = craftState(name), ok = s.have && s.near, out = Object.values(rc.output)[0];
const head = document.createElement("div"); head.className = "chead"; head.appendChild(craftCell(name, null, "res"));
head.insertAdjacentHTML("beforeend", `<div class="cname">${esc(capital(label(name)))}${out > 1 ? ` <i>x${out}</i>` : ""}</div>`);
const needs = document.createElement("div"); needs.className = "well cneeds";
const need = (item, text, miss) => {
const row = document.createElement("div"); row.className = "cneed" + (miss ? " miss" : ""); row.title = capital(label(item)) + " " + text; row.appendChild(craftCell(item));
row.insertAdjacentHTML("beforeend", `<span>${esc(capital(label(item)))}</span><b>${text}</b>`); needs.appendChild(row);
};
let list = Object.entries(rc.inputs).map(([k, v]) => [k, `${s.inv[k] || 0}/${v}`, (s.inv[k] || 0) < v]);
if (rc.station) list.push([rc.station, s.near ? "here" : "far", !s.near]);
const cols = Math.min(NEED_COLS, Math.ceil(list.length / NEED_ROWS)), room = cols * NEED_ROWS, over = list.length - room;
if (cols > 1) needs.classList.add("c" + cols);
if (over > 0) list = [...list.filter((n) => n[2]), ...list.filter((n) => !n[2])];
for (const n of over > 0 ? list.slice(0, room - 1) : list) need(...n);
if (over > 0) needs.insertAdjacentHTML("beforeend", `<div class="cneed more" title="${esc(list.slice(room - 1).map((n) => capital(label(n[0])) + " " + n[1]).join(", "))}">+${over + 1} more</div>`);
const btns = document.createElement("div"); btns.className = "cbtns";
const b = document.createElement("div"); b.className = "b cbtn" + (ok ? "" : " off");
b.textContent = ok ? "Craft" : !s.have ? "Missing materials" : `Go to a ${label(rc.station)}`;
if (ok) { b.onclick = () => craftMake(name); b.insertAdjacentHTML("beforeend", "<kbd>Enter</kbd>"); }
btns.appendChild(b);
if (ok && s.n >= 5) { const b5 = document.createElement("div"); b5.className = "b paper x5"; b5.innerHTML = "x5<kbd>Shift</kbd>"; b5.title = "five at once (Shift+Enter)"; b5.onclick = () => craftMake(name, true); btns.appendChild(b5); }
el.append(head); el.insertAdjacentHTML("beforeend", `<div class="cblurb">${esc(BLURB[name] || "")}</div>`); el.append(needs, btns);
}
function craftKey(k, e) {
const v = craftView(), kinds = v.groups.map(([t]) => t), ki = kinds.indexOf(craftTab), i = v.shown.indexOf(craftFocus);
const dir = KEYDIR[k];
if (k === "tab" || k === "q" || k === "e" || dir === "W" || dir === "E") {
const back = k === "q" || dir === "W" || (k === "tab" && e.shiftKey);
craftTurn({tab: kinds[(ki + (back ? kinds.length - 1 : 1)) % kinds.length]});
} else if (dir === "S") { if (i < v.shown.length - 1) focusRecipe(v.shown[i + 1]); else if (craftPage < v.pages - 1) craftTurn({page: craftPage + 1}); }
else if (dir === "N") { if (i > 0) focusRecipe(v.shown[i - 1]); else if (craftPage > 0) craftTurn({page: craftPage - 1, last: true}); }
else if (k === "pagedown" || k === "pageup") craftTurn({page: craftPage + (k === "pagedown" ? 1 : -1)});
else if (k === "home") craftTurn({page: 0});
else if (k === "end") craftTurn({page: v.pages - 1, last: true});
else if (k === "enter" || k === " ") { if (!e.repeat) craftMake(craftFocus, e.shiftKey); }
else if (k === "f") { if (!e.repeat) craftTurn({only: !craftOnly}); }
else if (k === "/") { $("craftfind").focus(); $("craftfind").select(); }
else return false;
return true;
}
$("craftfind").addEventListener("input", (e) => { craftFind = e.target.value.trim(); craftPage = 0; craftFocus = null; $("recipes").dataset.sig = ""; drawRecipes(); });
$("craftfind").addEventListener("keydown", (e) => {
e.stopPropagation();
const k = e.key.toLowerCase();
if (k === "arrowdown" || k === "arrowup" || k === "pagedown" || k === "pageup") { e.preventDefault(); craftKey(k, e); }
else if (k === "enter") { e.preventDefault(); if (!e.repeat) craftMake(craftFocus, e.shiftKey); }
else if (k === "escape" || k === "tab") {
e.preventDefault();
if (k === "escape" && e.target.value) { e.target.value = ""; e.target.dispatchEvent(new Event("input")); } else e.target.blur();
}
});
$("craftonly").onclick = () => craftTurn({only: !craftOnly});
$("craftprev").onclick = () => craftTurn({page: craftPage - 1});
$("craftnext").onclick = () => craftTurn({page: craftPage + 1});
$("craft").addEventListener("wheel", (e) => { e.preventDefault(); const p = craftPage; craftPage += Math.sign(e.deltaY); craftView(); if (craftPage !== p) craftTurn({page: craftPage}); }, {passive: false});
;
const Races = (() => {
const rgb0 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RGB = new Map(), rgb = (h) => { let v = RGB.get(h); if (!v) RGB.set(h, v = rgb0(h)); return v; };
const BASE = {a: "#5c4e92", b: "#f3f2c0", c: "#e8b5ac", d: "#ddd5de", e: "#f3d8c5", f: "#766daa", g: "#eae178"};
const CLASS = Object.fromEntries(Object.entries(BASE).map(([k, h]) => [rgb(h).join(), k]));
const CELL = 48, DIRS = ["down", "up", "right", "left"];
const classes = (d) => { const o = new Array(CELL * CELL); for (let i = 0; i < CELL * CELL; i++) o[i] = d[i * 4 + 3] ? CLASS[d[i * 4] + "," + d[i * 4 + 1] + "," + d[i * 4 + 2]] || "?" : null; return o; };
const RACES = [
{key: "cat", name: "Cat", col: {},
text: "The player as it is today: pointed ears with pink inside, whiskers, a collar with a bell.", head() {}},
{key: "bunny", name: "Bunny", col: {a: "#8a6f8f", b: "#fbf3ee", d: "#e6d9dc", c: "#f2a9b4", e: "#f6cfd0"},
text: "Two long, straight ears with rounded tips, pink inside, the same width down to the head and joined to it with no line across the foot. Side on, the far ear shows as a shaded edge behind the near one. From behind, a white tuft of a tail. It keeps the whiskers.",
head(H, A) {
H.round();
const SHAPE = [".aa.", "abba", "abca", "abca", "abca", "abca", "abca", "abca", "abba"];
const ear = (x0, out, fill = "b", pink = true, dy = 0) => SHAPE.forEach((row, i) => {
[...(out > 0 ? row : [...row].reverse().join(""))].forEach((ch, j) => {
if (ch !== "." && A.sy - 9 + i + 1 + dy <= A.sy) H.put(x0 + j, A.sy - 9 + i + 1 + dy, ch === "c" ? (pink ? "c" : fill) : ch === "b" ? fill : "a"); });
});
if (A.side) {
const back = A.facing === "right" ? -1 : 1;
ear(A.cx - 2 + back, back, "d", false, 1); ear(A.cx - 2, -back, "b", true);
H.put(A.cx - 1, A.sy, "b"); H.put(A.cx, A.sy, "b");
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
const bump = (x0, ex) => {
H.put(x0 + 1, A.sy - 2, "a"); H.put(x0 + 2, A.sy - 2, "a"); H.put(x0, A.sy - 1, "a"); H.put(x0 + 3, A.sy - 1, "a");
for (const j of [1, 2]) { H.put(x0 + j, A.sy - 1, "b"); H.put(x0 + j, A.sy, "b"); }
if (A.facing !== "up") { H.put(x0 + ex, A.sy - 1, "n"); H.put(x0 + ex, A.sy, "n"); }
};
if (!A.side) {
bump(A.hmin + 1, 2); bump(A.hmax - 4, 1);
if (A.facing === "down") {
for (let x = A.hmin + 4; x <= A.hmax - 4; x++) H.put(x, A.sy + 5, "d", "b");
H.put(A.hmin + 2, A.sy + 4, "p", "b"); H.put(A.hmax - 2, A.sy + 4, "p", "b");
} else for (const [x, y] of [[-3, 3], [-2, 3], [1, 5], [2, 5], [-1, 7], [3, 2]]) H.put(A.cx + x, A.sy + y, "d", "b");
} else {
const right = A.facing === "right", f = right ? A.hmax - 1 : A.hmin + 1, s = right ? -1 : 1;
bump(right ? A.hmax - 5 : A.hmin + 2, right ? 2 : 1);
for (let x = 0; x < 3; x++) H.put(f + s * x, A.sy + 5, "d", "b");
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
if (A.facing === "down") for (let x = -2; x <= 1; x++) { H.put(A.cx + x, A.sy + 6, "o"); H.put(A.cx + x, A.sy + 7, x === -2 || x === 1 ? "B" : "O"); }
} else {
const right = A.facing === "right", f = right ? A.hmax : A.hmin, out = right ? 1 : -1;
curl(A.cx - 1 - out);
for (let j = 0; j <= 2; j++) H.put(f + out * j, A.sy + 6, "o");
for (let j = 0; j <= 1; j++) H.put(f + out * j, A.sy + 7, "O");
H.put(f + out * 3, A.sy + 6, "B"); H.put(f + out * 2, A.sy + 7, "B");
for (let j = 1; j <= 2; j++) H.put(f + out * j, A.sy + 5, "B"); H.put(f + out, A.sy + 8, "B");
}
H.feet();
}},
];
const LIGHT = {cat: "#6fe9ff", bunny: "#ff8fd6", bear: "#ffb44a", frog: "#8cff7a", duck: "#ffe75a"};
const robot = (race) => ({...race, mix: {b: .18, d: .15},
col: {a: "#39414f", b: "#d5dbe3", d: "#a2acb9", e: "#a2acb9", c: LIGHT[race.key], f: "#566070", g: LIGHT[race.key],
w: "#eef2f6", m: "#b7c0cb", n: race.key === "frog" ? LIGHT.frog : "#39414f", y: "#c3cbd5", p: "#a2acb9"}});
const EXTRA = {w: "#fffdf4", m: "#f1dfbd", n: "#3a2a30", y: "#f4f3c4", p: "#f2a9b4", o: "#f59a4a", O: "#e07f38", B: "#a85a2a"};
function analyse(d, row, col) {
const px = classes(d), raw = (x, y) => (x >= 0 && y >= 0 && x < CELL && y < CELL ? px[y * CELL + x] : null);
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
for (let y = top; y < k && sy === null; y++) {
let run = 0, best = 0, runs = 0;
for (let x = 0; x < CELL; x++) { if (at(x, y)) { run++; best = Math.max(best, run); if (run === 1) runs++; } else run = 0; }
if (runs === 1 && best >= 6) sy = y;
}
if (sy === null) sy = top + 1;
let hmin = CELL, hmax = 0;
for (let x = 0; x < CELL; x++) if (at(x, sy + 3)) { hmin = Math.min(hmin, x); hmax = Math.max(hmax, x); }
const facing = DIRS[row % 4], side = facing === "left" || facing === "right";
if (side) {
let mid = 0, nf = 0; for (let x = 0; x < CELL; x++) if (at(x, k) === "f") { mid += x; nf++; }
mid = nf ? Math.round(mid / nf) : Math.round((hmin + hmax) / 2);
let lo = -1, hi = CELL;
for (const y of [k - 3, k - 1]) { if (!at(mid, y)) continue;
let a = mid, b = mid; while (at(a - 1, y)) a--; while (at(b + 1, y)) b++; lo = Math.max(lo, a); hi = Math.min(hi, b); }
if (lo >= 0) { hmin = lo; hmax = hi; }
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
function remake(d, A, race) {
const g = [], other = [];
for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { g.push(A.at(x, y)); other.push(A.at(x, y) ? null : A.raw(x, y)); }
const get = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL ? g[y * CELL + x] : null;
const span = (y) => { let a = CELL, b = -1; for (let x = 0; x < CELL; x++) if (get(x, y)) { a = Math.min(a, x); b = x; } return [a, b]; };
const H = {
get,
put(x, y, c, over) { if (x < 0 || y < 0 || x >= CELL || y >= CELL) return; if (!over || (get(x, y) && over.includes(get(x, y)))) g[y * CELL + x] = c; },
round() {
for (let y = A.top; y < A.sy; y++) for (let x = 0; x < CELL; x++) g[y * CELL + x] = null;
if (A.side) {
for (let i = 0; i < 3; i++) {
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
eyes() { for (let y = A.sy + 3; y < A.k - 1; y++) for (let x = 0; x < CELL; x++)
if (get(x, y) === "a" && get(x - 1, y) && get(x + 1, y) && get(x, y - 1) && get(x, y + 1) && get(x - 1, y) !== "a" && get(x + 1, y) !== "a") g[y * CELL + x] = "b"; },
plain() { for (let y = A.sy; y < A.k; y++) for (let x = 0; x < CELL; x++) if (get(x, y) === "d") g[y * CELL + x] = "b"; },
feet() { for (let y = A.bottom - 1; y <= A.bottom; y++) for (let x = 0; x < CELL; x++) if ("bd".includes(get(x, y) || "?")) g[y * CELL + x] = "o"; },
belly() { if (A.facing !== "up") for (let y = A.k + 2; y < A.bottom - 1; y++) for (let x = 0; x < CELL; x++) if (get(x, y) === "b") g[y * CELL + x] = "y"; },
};
race.head(H, A);
if (A.facing !== "down") for (let y = 0; y <= A.sy; y++) for (let x = 0; x < CELL; x++) {
const was = A.at(x, y); if (!was || g[y * CELL + x]) continue;
let near = false;
for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (other[(y + dy) * CELL + x + dx] === "?") { near = true; break; }
if (near) g[y * CELL + x] = was === "c" ? "b" : was;
}
for (let i = 0; i < g.length; i++) if (other[i]) g[i] = other[i];
for (let i = 0; i < g.length; i++) {
const c = g[i], hex = c && (race.col[c] || EXTRA[c] || BASE[c]);
if (!hex) { if (!c) d[i * 4 + 3] = 0; continue; }
const v = rgb(hex); d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = 255;
}
return g;
}
const sheets = new Map(), jobs = new Map();
let baseData = null, analysis = null, measuring = null;
const blend = (h, tint, k) => "#" + rgb(h).map((v, i) => Math.round(v * (1 - k) + rgb(tint)[i] * k).toString(16).padStart(2, "0")).join("");
function made(key, tint, bot, now = true) {
const found = RACES.find((r) => r.key === key), race = found && bot ? robot(found) : found, id = (bot ? "bot:" : "") + key + tint;
if (!race || (key === "cat" && !bot)) return characterSheet(tint);
if (sheets.has(id)) return sheets.get(id);
let job = jobs.get(id); if (!job) jobs.set(id, job = steps(race, tint, id));
if (!now) return null; while (!job.next().done); return sheets.get(id);
}
function* steps(race, tint, id) {
const W = IMG.character.width, H = IMG.character.height, cols = W / CELL, rows = H / CELL;
const frame = (r, c) => { const d = new Uint8ClampedArray(CELL * CELL * 4);
for (let y = 0; y < CELL; y++) d.set(baseData.subarray(((r * CELL + y) * W + c * CELL) * 4, ((r * CELL + y) * W + c * CELL + CELL) * 4), y * CELL * 4);
return d; };
if (!baseData) {
const b = document.createElement("canvas"); b.width = W; b.height = H;
const g = b.getContext("2d"); g.drawImage(IMG.character, 0, 0);
baseData = g.getImageData(0, 0, W, H).data;
}
if (!analysis) {
measuring = measuring || (function* () { const a = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { a.push(analyse(frame(r, c), r, c)); if (a.length % 8 === 0) yield; } analysis = a; })();
while (!analysis && !measuring.next().done) yield;
}
const mix = race.mix || {b: .35, d: .3};
const mine = {...race, col: {...race.col, ...Object.fromEntries(Object.entries(mix).map(([k, m]) => [k, blend(race.col[k] || BASE[k], tint, m)]))}};
for (const k of ["c", "e"]) if (race.col[k] === race.col.b) mine.col[k] = mine.col.b;
const out = document.createElement("canvas"); out.width = W; out.height = H;
const img = new ImageData(W, H);
out.grids = []; out.an = analysis;
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
const d = frame(r, c);
out.grids.push(remake(d, analysis[r * cols + c], mine));
for (let y = 0; y < CELL; y++) img.data.set(d.subarray(y * CELL * 4, (y + 1) * CELL * 4), ((r * CELL + y) * W + c * CELL) * 4);
if (out.grids.length % 8 === 0) yield;
}
out.getContext("2d", {willReadFrequently: true}).putImageData(img, 0, 0);
sheets.set(id, out); jobs.delete(id);
}
function work(until) { for (const [id, job] of jobs) { while (performance.now() < until) if (job.next().done) { jobs.delete(id); break; } if (performance.now() >= until) break; } return jobs.size > 0; }
return {RACES, raceSheet: (key, tint, bot) => made(key, tint, bot), made, work};
})();
const raceSheet = Races.raceSheet;
let myRace = localStorage.getItem("megastructure-race") || "cat", racePickSeen = false;
function drawRacePick() {
const row = $("racepick");
if (!IMG.character || !IMG.character.complete || !IMG.character.width) return setTimeout(drawRacePick, 150);
row.innerHTML = "";
const later = !racePickSeen; racePickSeen = true;
for (const [i, r] of Races.RACES.entries()) {
const b = document.createElement("button");
b.type = "button"; b.dataset.race = r.key; b.title = r.name; b.className = r.key === myRace ? "on" : "";
const c = document.createElement("canvas"); c.width = c.height = 24;
const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
const paint = () => { const s = typeof wornReady === "function" && wornReady("#f3f2c0", null, r.key, false); if (s) g.drawImage(s, 12, 10, 24, 24, 0, 0, 24, 24); else setTimeout(paint, 60); };
if (later && r.key !== myRace) setTimeout(paint, 40 * i); else paint();
b.appendChild(c);
b.onclick = () => pickRace(r.key);
row.appendChild(b);
}
}
function pickRace(key) { myRace = key; localStorage.setItem("megastructure-race", myRace); drawRacePick(); }
(() => { const row = document.createElement("div"); row.id = "racepick"; $("raceslot").appendChild(row); drawRacePick(); })();
;
const WEAR = {
straw_hat: ["head", "straw"], sporecap_hat: ["head", "sporecap"], wizard_hat: ["head", "wizard"], gold_crown: ["head", "crown"], iron_helmet: ["head", "iron"], mossback_helm: ["head", "shell"], wool_beanie: ["head", "beanie"], flower_crown: ["head", "flowers"], bandana: ["head", "bandana"], sprout: ["head", "sprout"],
linen_shirt: ["top", "linen"], red_scarf: ["top", "scarf"], wool_sweater: ["top", "wool"], overalls: ["top", "overalls"], leather_vest: ["top", "leather"], wizard_robe: ["top", "robe"], iron_chestplate: ["top", "iron"], gold_chestplate: ["top", "gold"], mossback_plate: ["top", "moss"],
linen_shorts: ["pants", "linen"], denim: ["pants", "denim"], red_trousers: ["pants", "red"], leather_chaps: ["pants", "leather"], robe_skirt: ["pants", "robe"], iron_greaves: ["pants", "iron"], gold_greaves: ["pants", "gold"], moss_kilt: ["pants", "moss"],
leather_boots: ["shoes", "leather"], red_sneakers: ["shoes", "red"], rain_boots: ["shoes", "rain"], blue_slippers: ["shoes", "blue"], iron_boots: ["shoes", "iron"], gold_boots: ["shoes", "gold"], moss_slippers: ["shoes", "moss"],
sparkle_charm: ["effect", "sparkle"], firefly_charm: ["effect", "fireflies"], leaf_charm: ["effect", "leaves"], heart_charm: ["effect", "hearts"], flame_charm: ["effect", "flame"], frost_charm: ["effect", "frost"], halo_charm: ["effect", "halo"], spore_charm: ["effect", "spores"], flower_charm: ["effect", "flowers"],
};
const WearParts = (() => {
const rgb0 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RGB = new Map(), rgb = (h) => { let v = RGB.get(h); if (!v) RGB.set(h, v = rgb0(h)); return v; };
const BASE = {a: "#5c4e92", b: "#f3f2c0", c: "#e8b5ac", d: "#ddd5de", e: "#f3d8c5", f: "#766daa", g: "#eae178"};
const CLASS = Object.fromEntries(Object.entries(BASE).map(([k, h]) => [rgb(h).join(), k]));
const CELL = 48, DIRS = ["down", "up", "right", "left"];
const classes = (d) => { const o = new Array(CELL * CELL); for (let i = 0; i < CELL * CELL; i++) o[i] = d[i * 4 + 3] ? CLASS[d[i * 4] + "," + d[i * 4 + 1] + "," + d[i * 4 + 2]] || "?" : null; return o; };
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
for (let y = -3; y <= -1; y++) P.put(A.cx - (A.side ? -2 : 0), A.sy + y, "#e0635a"), P.put(A.cx - 1 - (A.side ? -2 : 0), A.sy + y, "#e0635a");
}, line: "#a8434f"},
{id: "shell", name: "Mossback helm", line: "#5a4048", draw(P, A) {
const rx = A.side ? 6 : 8;
dome(P, A, rx, 4, 1, (x, y) => y === 1 ? "#a97c55" : y < -1 ? ((x * 7 + y * 13 + 99) % 5 ? "#6fbb62" : "#9ada7c") : (x + 40) % 5 ? "#d3a970" : "#a97c55");
}},
{id: "beanie", name: "Wool beanie", recolour: {rows: 3, b: "#d9675c", c: "#d9675c", d: "#f4efe2", e: "#d9675c", a: "#a8434f"}, line: "#c9bda3", draw(P, A) {
for (const [x, y] of [[-1, -2], [0, -2], [-1, -3], [0, -3]]) P.put(A.cx + x, A.top + 1 + y, "#f4efe2");
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
function analyse(d, row) {
const px = classes(d), at = (x, y) => (x >= 0 && y >= 0 && x < CELL && y < CELL ? px[y * CELL + x] : null);
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
for (let y = top; y < k && sy === null; y++) {
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
function dress(d, A, o, grid, tall) {
const set = (x, y, hex) => { if (x < 0 || y < 0 || x >= CELL || y >= CELL) return; const c = rgb(hex), i = (y * CELL + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
const cls = [];
for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) cls.push(grid ? grid[y * CELL + x] : A.at(x, y));
const BODY = {y: "b", o: "b", O: "d"};
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
if (!layer.has(n) && !(head.recolour && cls[n])) layer.set(n, null);
for (const [key, c] of layer) set(key % CELL, Math.floor(key / CELL), c || head.line);
}
}
const sheets = new Map(), jobs = new Map();
let analysis = null, measuring = null, pumping = false;
function made(tint, worn, race = "cat", bot = false, now = true) {
if (!worn) { const plain = Races.made(race, tint, bot, now); if (!plain && !pumping) pump(); return plain; }
const o = {head: "none", top: "none", pants: "none", shoes: "none"};
for (const [slot, item] of Object.entries(worn)) if (WEAR[item] && slot in o) o[slot] = WEAR[item][1];
const key = tint + race + (bot ? "bot" : "") + Object.values(o).join();
if (sheets.has(key)) return sheets.get(key);
let job = jobs.get(key); if (!job) { jobs.set(key, job = steps(tint, o, race, bot, key)); if (!pumping) pump(); }
if (!now) return null; while (!job.next().done); return sheets.get(key);
}
function* steps(tint, o, race, bot, key) {
let plain; while (!(plain = Races.made(race, tint, bot, false))) { Races.work(performance.now() + 2); yield; }
const W = plain.width, H = plain.height, cols = W / CELL, rows = H / CELL;
const frame = (data, r, c) => { const d = new Uint8ClampedArray(CELL * CELL * 4);
for (let y = 0; y < CELL; y++) d.set(data.subarray(((r * CELL + y) * W + c * CELL) * 4, ((r * CELL + y) * W + c * CELL + CELL) * 4), y * CELL * 4);
return d; };
if (!analysis && !plain.an) {
measuring = measuring || (function* () { const b = document.createElement("canvas"); b.width = W; b.height = H;
const bg = b.getContext("2d"); bg.drawImage(IMG.character, 0, 0);
const data = bg.getImageData(0, 0, W, H).data, a = [];
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { a.push(analyse(frame(data, r, c), r)); if (a.length % 8 === 0) yield; } analysis = a; })();
while (!analysis && !measuring.next().done) yield;
}
const out = document.createElement("canvas"); out.width = W; out.height = H;
const g = out.getContext("2d", {willReadFrequently: true}); g.drawImage(plain, 0, 0);
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
if (i % 8 === 7) yield;
}
g.putImageData(img, 0, 0);
sheets.set(key, out); jobs.delete(key);
}
function pump(dl) {
pumping = true; const until = performance.now() + (dl && !dl.didTimeout ? Math.max(1, Math.min(8, dl.timeRemaining())) : 8);
if (dl !== undefined) { for (const [k, job] of jobs) { while (performance.now() < until) if (job.next().done) { jobs.delete(k); break; } if (performance.now() >= until) break; } Races.work(until); }
if (jobs.size || Races.work(0)) { if (window.requestIdleCallback) requestIdleCallback(pump, {timeout: 100}); else setTimeout(() => pump(null), 16); } else pumping = false;
}
return {TOPS, PANTS, SHOES, HEADS, rgb, wornSheet: (tint, worn, race, bot) => made(tint, worn, race, bot), ready: (tint, worn, race, bot) => made(tint, worn, race, bot, false)};
})();
const wornSheet = WearParts.wornSheet, wornReady = WearParts.ready;
;
const WearItems = (() => {
const {TOPS, PANTS, SHOES, HEADS, rgb} = WearParts;
const beside = (a, r) => (Math.cos(a) < 0 ? -1 : 1) * (9 + Math.abs(Math.cos(a)) * r);
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
function itemIcon(part, o) {
if (o.id === "none") return null;
const raw = [], put = (x, y, c) => { const i = raw.findIndex((p) => p[0] === x && p[1] === y); if (i >= 0) raw.splice(i, 1); if (c) raw.push([x, y, c]); };
const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
let line;
if (part === "head") {
line = o.line || (o.recolour && o.recolour.a) || "#4c7a52";
if (o.icon) o.icon(put);
else {
if (o.recolour) { line = o.recolour.a;
for (let y = -5; y <= 0; y++) for (let x = -6; x < 6; x++) if (((x + .5) / 6) ** 2 + ((y - .5) / 5.6) ** 2 <= 1)
put(x, y, y === 0 ? o.recolour.c : x < -1 && y < -2 && x > -5 ? o.recolour.d : o.recolour.b); }
o.draw({put: (x, y, c) => put(Math.round(x), Math.round(y), c)}, {cx: 0, sy: o.recolour ? -4 : 0, top: -6, hmin: -6, hmax: 6, facing: "down", side: true});
}
} else if (part === "top") {
const body = o.b || o.f, shade = o.d || mix(o.f, .2);
line = o.a || mix(body, .5);
if (!o.b) {
box(3, 4, 12, 7, o.f); box(6, 5, 9, 6, null); box(9, 8, 11, 12, o.f); box(9, 12, 11, 12, o.g); box(3, 7, 8, 7, mix(o.f, .2));
} else if (ARMOR.includes(o.id)) {
box(4, 4, 11, 13, body); box(2, 3, 4, 5, o.f); box(11, 3, 13, 5, o.f); box(4, 3, 11, 4, o.f); box(7, 3, 8, 4, null);
box(4, 12, 11, 13, shade); box(11, 6, 11, 13, shade); box(5, 6, 6, 7, o.g); box(7, 9, 8, 9, shade);
} else {
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
} else {
const c = GEM[o.id]; line = mix(c, .5);
for (let y = 5; y <= 13; y++) for (let x = 3; x <= 12; x++) if (Math.abs(x - 7.5) + Math.abs(y - 9) <= 4.5) put(x, y, x + y < 15 ? mix(c, .35, [255, 255, 255]) : x + y > 18 ? mix(c, .22) : c);
for (const [x, y] of [[6, 1], [7, 0], [8, 0], [9, 1], [6, 2], [9, 2], [7, 3], [8, 3]]) put(x, y, "#c9a27a");
}
const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
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
function icon(name) {
if (!icons.has(name)) icons.set(name, itemIcon(WEAR[name][0], look(name)));
const c = document.createElement("canvas"); c.width = c.height = 16;
const g = c.getContext("2d");
for (const [key, col] of icons.get(name)) { g.fillStyle = col; g.fillRect(key % 16, Math.floor(key / 16), 1, 1); }
return c;
}
const STAGE = 64, OX = 8, OY = 14, stage = document.createElement("canvas");
stage.width = stage.height = STAGE;
function fx(phase, e, sheet, idx, x0, y0, z, now, walking, back) {
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
const wearOf = (slots, pick = () => true) => Object.keys(WEAR).filter((n) => slots.includes(WEAR[n][0]) && pick(n));
const isArmor = (n) => /^(iron|gold|leather|moss)/.test(n);
RECIPE_GROUPS.find(([t]) => t === "Wear")[2].push(...wearOf(["head", "top", "pants", "shoes"], (n) => !isArmor(n)), ...wearOf(["head", "top", "pants", "shoes"], isArmor), ...wearOf(["effect"]));
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
;
const SWIM = {sink: 5, line: 27, stroke: 260, tread: 700, wakeEvery: 110, wakeLife: 1400, dashStroke: 130, dashEvery: 45, dashLife: 2100};
function swimsAt(p, e) {
if (e.sail) return false;
const t = tile(Math.round(p.x), Math.round(p.y));
return t ? wet(t[1]) && t[0] !== "V" : !!e.swim;
}
const WAKE_FADE = {from: .45, line: .3, bubble: .2};
const wakeLeft = (a, from) => Math.max(0, Math.min(1, (1 - a) / (1 - from)));
const WAKE_2X2 = [.125, .625, .875, .375];
function wakePx(x, y, w, h, left, z, seed) {
if (left >= 1) { ctx.fillRect(x, y, w * z, h * z); return; }
for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (left > WAKE_2X2[((i + seed) & 1) + ((j + (seed >> 1)) & 1) * 2]) ctx.fillRect(x + i * z, y + j * z, z, z);
}
function drawWake(p, now, sx, sy, z) {
if (!p.wake || !p.wake.length || sy.apart) return;
while (p.wake.length && now - p.wake[0].t > (p.wake[0].dash ? SWIM.dashLife : SWIM.wakeLife)) p.wake.shift();
for (const w of p.wake) {
const a = Math.min(1, (now - w.t) / (w.dash ? SWIM.dashLife : SWIM.wakeLife)), left = wakeLeft(a, WAKE_FADE.from); if (left <= 0) continue;
const wx = Math.round(sx(w.x)) + 8 * z, wy = Math.round(sy(w.y, w.x)) + (13 - STAND) * z;
const d = Math.round(w.dash ? 3 + a * 13 : 2 + a * 7), seed = (w.t / 45) | 0;
ctx.fillStyle = a < .35 ? "#ffffff" : "#d8f4ff";
for (let k = 0; k < (w.dash ? 2 : 1); k++) {
const dk = d - k * 4, len = Math.max(1, Math.round((w.dash ? 4 - 2 * k : 2) * Math.min(1, left * 1.5))), lag = k * 3;
if (dk < 2) break;
if (w.across) { wakePx(wx - (dk + 1) * z, wy - w.fy * lag * z, 1, len, left, z, seed); wakePx(wx + dk * z, wy - w.fy * lag * z, 1, len, left, z, seed + 1); }
else { wakePx(wx - (1 + w.fx * lag) * z, wy - dk * z, len, 1, left, z, seed); wakePx(wx - (1 + w.fx * lag) * z, wy + dk * z, len, 1, left, z, seed + 1); }
}
const bub = wakeLeft(a / .3, WAKE_FADE.bubble); if (bub > 0) wakePx(wx, wy, 1, 1, bub, z, seed);
const line = wakeLeft(a / .55, WAKE_FADE.line);
if (w.dash && line > 0) { ctx.fillStyle = "#ffffff"; const j = ((w.t / 45 | 0) % 3 - 1) * z; if (w.across) wakePx(wx + j - z, wy, 2, 2, line, z, seed); else wakePx(wx - z, wy + j - z, 2, 2, line, z, seed); }
}
}
const wakePics = new WeakMap();
function wakePicture(p, now) {
if (!p.wake || !p.wake.length) return null;
let l = 0, r = 0, t = 0, b = 0;
for (const w of p.wake) { l = Math.min(l, w.x - p.x); r = Math.max(r, w.x - p.x); t = Math.min(t, w.y - p.y); b = Math.max(b, w.y - p.y); }
const q = (v) => Math.ceil((v * 16 + 28) / 16) * 16, L = q(-l), R = q(r), T = q(-t), B = q(b);
let c = wakePics.get(p); if (!c) { c = document.createElement("canvas"); wakePics.set(p, c); }
if (c.width !== L + R || c.height !== T + B) { c.width = L + R; c.height = T + B; }
const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
const keep = ctx, kz = zoom, sx = (x) => L - 8 + (x - p.x) * 16, sy = (y) => T - 8 + (y - p.y) * 16;
ctx = g; zoom = 1; try { drawWake(p, now, sx, sy, 1); } finally { ctx = keep; zoom = kz; }
c._v = (c._v || 0) + 1;
return {canvas: c, fx: L, fy: T};
}
function drawSwimmer(p, e, sheet, x, y, z, now, sx, sy) {
const moving = now - p.moved < 300 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
const dash = SWIM_SPRINT && moving && (e.id === myId && e.kind === "agent" ? sprinting() : !!e.run);
const stroke = Math.floor((now + e.id * 97) / (dash ? SWIM.dashStroke : moving ? SWIM.stroke : SWIM.tread));
const bob = (moving ? stroke % 2 : Math.round(Math.sin(now / 450 + e.id) * .5 + .5)) * z;
p.running = dash;
if (!p.swam) {
p.swam = true; p.wake = p.wake || [];
burst(p.x, p.y + .3 - UP, "water", 10, {up: 2.6, spread: 3, g: 7, life: .5});
sfx("water", Math.round(p.x), Math.round(p.y));
}
if (moving && (!p.wake.length || now - p.wake[p.wake.length - 1].t > (dash ? SWIM.dashEvery : SWIM.wakeEvery))) p.wake.push({x: p.x, y: p.y, t: now, across: !!p.fy, dash, fx: p.fx || 0, fy: p.fy || 0});
drawWake(p, now, sx, sy, z);
const deep = DEPTH_OF[gndAt(Math.round(p.x), Math.round(p.y))] || 1, shY = y + (15 + deep * 2) * z;
ctx.fillStyle = "rgba(24,40,72,.2)";
ctx.fillRect(x + 3 * z, shY, 10 * z, 2 * z); ctx.fillRect(x + 5 * z, shY - z, 6 * z, 4 * z);
if (moving && stroke !== p.lastStroke) {
const side = stroke % 2 ? .35 : -.35;
burst(p.x + (p.fy ? side : -p.fx * .2), p.y + .35 - UP + (p.fx ? side * .4 : 0), "water", dash ? 5 : 3, {up: dash ? 2.2 : 1.4, spread: dash ? 2.4 : 1.6, g: 6, life: dash ? .45 : .35});
if (dash) {
burst(p.x + (p.fy ? -side : -p.fx * .2), p.y + .35 - UP + (p.fx ? -side * .4 : 0), "water", 3, {up: 1.8, spread: 2, g: 6, life: .4});
burst(p.x - p.fx * .6, p.y - p.fy * .6 + .3 - UP, "water", 4, {up: 2.6, spread: 1.6, g: 7, life: .5});
}
if (stroke % 2) sfx("swim", Math.round(p.x), Math.round(p.y));
}
p.lastStroke = stroke;
const row = DIR_ROW(p), col = Math.floor(now / (dash ? 70 : 140)) % 8, cellX = x - 16 * z, cellY = y - 18 * z + SWIM.sink * z + bob, wl = y + 14 * z;
const back = [-p.fx, -p.fy], fi = row * 8 + col;
wearFx("back", e, sheet, fi, cellX, cellY, z, now, moving, back);
if (WaterBed.on) WaterBed.under(sheet, col * 48, row * 48 + SWIM.line, 48, 12, cellX, cellY + SWIM.line * z, z, Math.round(p.x), Math.round(p.y));
else { ctx.globalAlpha = .28; ctx.drawImage(sheet, col * 48, row * 48 + SWIM.line, 48, 7, cellX, cellY + SWIM.line * z, 48 * z, 7 * z); ctx.globalAlpha = 1; }
ctx.drawImage(sheet, col * 48, row * 48, 48, SWIM.line, cellX, cellY, 48 * z, SWIM.line * z);
wearFx("front", e, sheet, fi, cellX, cellY, z, now, moving, back);
const wide = (7 + stroke % 2 + (dash ? 1 : 0)) * z, cx = x + 8 * z;
if (dash) {
const fx = p.fx || 0, fy = p.fx ? 0 : (p.fy || 1), bx = cx + fx * 10 * z, by = wl - z + fy * 5 * z;
ctx.fillStyle = "rgba(255,255,255,.9)";
for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
const qx = bx - fx * k * z + (fx ? 0 : s * (k + 1) * 2 * z), qy = by - fy * k * z + (fx ? s * (k + 1) * z : 0);
ctx.fillRect(Math.round(qx) - z, Math.round(qy), (fx ? 1 : 2) * z, z);
}
}
ctx.fillStyle = "rgba(255,255,255,.85)";
ctx.fillRect(cx - wide, wl - z, 3 * z, z); ctx.fillRect(cx + wide - 3 * z, wl - z, 3 * z, z);
ctx.fillStyle = "rgba(216,244,255,.7)";
ctx.fillRect(cx - wide + 2 * z, wl, 2 * wide - 4 * z, z);
ctx.fillRect(cx - wide - z, wl - 2 * z, z, z); ctx.fillRect(cx + wide, wl - 2 * z, z, z);
}
;
const SKY = {
sun: ["................", ".......o........", "..o....o....o...", "...o........o...", ".....oyyyyo.....", "....oyyyyyyo....", "....yywwyyyy....", ".oo.yywyyyyy.oo.",
"....yyyyyyyy....", "....yyyyyyyy....", "....oyyyyyyo....", ".....oyyyyo.....", "...o........o...", "..o....o....o...", ".......o........", "................"],
moon: ["................", "......mmmm......", "....mmllllm.....", "...mlllmm.......", "..mlllm.........", "..mllm......s...", "..mllm..........", "..mllm....s.....",
"..mlllm.........", "...mlllm.....m..", "....mllllmmmm...", ".....mmllllm....", ".......mmmm.....", "................", "................", "................"],
col: {y: "#f6c453", o: "#c98a2b", w: "#fff1b8", l: "#f4efd8", m: "#8d8fb8", s: "#f4efd8"},
};
const WHO_ROWS = 8;
function skyIcon(night) {
const c = document.createElement("canvas"); c.width = c.height = 16; const g = c.getContext("2d");
SKY[night ? "moon" : "sun"].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") { g.fillStyle = SKY.col[ch]; g.fillRect(x, y, 1, 1); } }));
return c;
}
function portrait(a) {
const c = document.createElement("canvas"); c.width = c.height = 16; const g = c.getContext("2d");
try { g.drawImage(wornSheet(agentTint(a.name), a.worn, a.race, a.bot), 16, 12, 16, 16, 0, 0, 16, 16); } catch (e) {  }
return c;
}
function whoTick() {
const [, day, hour] = /day (\d+), (\d+:\d+)/.exec($("clock").textContent) || [0, "?", ""];
$("whoday").textContent = "Day " + day; $("whohour").textContent = hour;
$("whomark").style.left = `calc(${clock.phase} * (100% - 4 * var(--q)))`;
const sky = $("whosky"), night = clock.night ? "1" : "0";
if (sky.dataset.night !== night) { sky.dataset.night = night; sky.replaceChildren(skyIcon(clock.night)); }
}
function drawWho() {
whoTick();
if (!$("whoband").width || $("whoband").width === 300) skyBar($("whoband"), 68, 3);
const up = agents.filter((a) => a.online).sort((a, b) => (b.name === me) - (a.name === me) || a.name.localeCompare(b.name));
const asleep = agents.length - up.length, list = $("wholist"), q = parseFloat(getComputedStyle($("who")).getPropertyValue("--q")) || 2;
const rows = Math.max(2, Math.min(WHO_ROWS, Math.floor((innerHeight - 76 - 66 * q) / (22 * q))));
list.replaceChildren(...up.slice(0, rows).map((a) => {
const d = document.createElement("div"); d.className = "line" + (a.name === me ? " cur" : "");
const cell = document.createElement("div"); cell.className = "cell"; cell.appendChild(portrait(a));
d.appendChild(cell);
d.insertAdjacentHTML("beforeend", `<span class="n">${esc(a.name)}</span>${a.name === me ? '<span class="tag">you</span>' : ""}<span class="lv">Lv ${levelOf(a.xp || 0)[0]}</span>`);
return d;
}));
const s = meObs && meObs.self, more = up.length - rows;
$("whoat").textContent = s ? `${s.x}, ${s.y}${s.sheltered ? " · sheltered" : ""}` : "";
$("whocount").textContent = `${up.length} awake` + (more > 0 ? ` (${more} more)` : "") + (asleep ? ` · ${asleep} asleep` : "");
}
;
const BAG = {cols: 10, rows: 3, wear: ["head", "top", "pants", "shoes", "effect"],
ghost: {head: "straw_hat", top: "linen_shirt", pants: "linen_shorts", shoes: "leather_boots", effect: "sparkle_charm"}};
const PACK = BAG.cols * BAG.rows;
let bagAt = {zone: "bar", i: 0}, bagMove = null, bagPage = 0;
const bagIndex = (at) => at.zone === "bar" ? at.i : BAR + bagPage * PACK + at.i;
const bagWorn = () => (meObs && meObs.self.wearing) || {};
const bagItem = (at) => at.zone === "wear" ? bagWorn()[BAG.wear[at.i]] || null : slots[bagIndex(at)] || null;
const bagPages = () => Math.max(1, Math.ceil((slots.reduce((m, n, i) => n ? i + 1 : m, 0) - BAR) / PACK));
function toggleBag() {
const b = $("bag"), on = b.style.display !== "block"; sfx(on ? "open" : "close"); b.style.display = on ? "block" : "none";
bagMove = null;
if (on) {
const held = selected ? slots.indexOf(selected) : -1;
if (held >= 0 && held < BAR) bagAt = {zone: "bar", i: held};
bagDraw(true);
}
}
function bagSwap(a, b) {
while (slots.length <= Math.max(a, b)) slots.push(null);
[slots[a], slots[b]] = [slots[b], slots[a]];
localStorage.setItem("megastructure-slots", JSON.stringify(slots)); sfx("ui");
$("hotbar").dataset.sig = ""; drawHotbar(meObs.self.inventory);
}
function bagHold() {
const name = bagItem(bagAt); if (!name) return;
if (bagAt.zone === "wear") return void act("unwear", {slot: BAG.wear[bagAt.i]});
const from = bagIndex(bagAt);
if (from >= BAR) {
const held = selected ? slots.indexOf(selected) : -1, free = slots.slice(0, BAR).indexOf(null);
bagSwap(from, held >= 0 && held < BAR ? held : free >= 0 ? free : BAR - 1);
}
selectItem(name); toggleBag();
}
const bagUses = (name, worn) => worn ? "Take off" : FOODS.includes(name) ? "Eat" : WEAR[name] ? "Wear" : "";
function bagUse() {
const name = bagItem(bagAt); if (!name) return;
if (bagAt.zone === "wear") act("unwear", {slot: BAG.wear[bagAt.i]});
else if (FOODS.includes(name)) act("eat", {item: name});
else if (WEAR[name]) act("wear", {item: name});
}
function bagCarry() {
if (bagAt.zone === "wear") return;
if (bagMove == null) { if (bagItem(bagAt)) { bagMove = bagIndex(bagAt); sfx("ui"); } }
else { const to = bagIndex(bagAt); if (to !== bagMove) bagSwap(bagMove, to); bagMove = null; }
bagDraw(true);
}
function bagCell(at, name, n) {
const d = name ? craftCell(name, n > 1 ? n : null) : Object.assign(document.createElement("div"), {className: "cell"});
const idx = at.zone === "wear" ? -1 : bagIndex(at);
if (!name && at.zone === "wear") { d.appendChild(iconCanvas(BAG.ghost[BAG.wear[at.i]])); d.classList.add("ghost"); d.title = "Nothing worn here"; }
if (at.zone === bagAt.zone && at.i === bagAt.i) d.classList.add("cur");
if (name && name === selected && at.zone !== "wear") d.classList.add("held");
if (bagMove != null && idx === bagMove) d.classList.add("moving");
if (at.zone === "bar") d.insertAdjacentHTML("beforeend", `<i class="k">${(at.i + 1) % 10}</i>`);
d.dataset.zone = at.zone; d.dataset.i = at.i;
d.onclick = () => { bagAt = at; if (bagMove != null) bagCarry(); else bagDraw(true); };
d.ondblclick = () => { bagAt = at; bagHold(); };
if (at.zone !== "wear") {
d.draggable = !!name;
d.ondragstart = (e) => { e.dataTransfer.setData("text/plain", String(idx)); };
d.ondragover = (e) => e.preventDefault();
d.ondrop = (e) => { e.preventDefault(); const from = +e.dataTransfer.getData("text/plain"); bagAt = at; bagMove = null; if (from !== idx) bagSwap(from, idx); else bagDraw(true); };
}
return d;
}
function drawBag() { bagDraw(false); }
function bagDraw(now) {
const el = $("bag"); if (!meObs || el.style.display !== "block") return;
const inv = meObs.self.inventory, worn = bagWorn(), pages = bagPages(); bagPage = Math.min(bagPage, pages - 1);
const sig = JSON.stringify([inv, worn, slots, selected, bagAt, bagMove, bagPage, meObs.self.can]);
if (!now && el.dataset.sig === sig) return; el.dataset.sig = sig;
$("bagwear").replaceChildren(...BAG.wear.map((slot, i) => bagCell({zone: "wear", i}, worn[slot] || null, 1)));
$("bagpack").replaceChildren(...[...Array(PACK)].map((_, i) => { const n = slots[BAR + bagPage * PACK + i] || null; return bagCell({zone: "pack", i}, n, inv[n]); }));
$("bagbar").replaceChildren(...[...Array(BAR)].map((_, i) => bagCell({zone: "bar", i}, slots[i] || null, inv[slots[i]])));
$("bagpage").textContent = pages > 1 ? `Pack · ${bagPage + 1} of ${pages}` : "Pack";
const name = bagItem(bagAt), isWorn = bagAt.zone === "wear", cur = el.querySelector(".cell.cur");
const note = $("bagnote"), upright = document.body.classList.contains("upright");
note.innerHTML = upright && name ? `${esc(capital(label(name)))}${!isWorn && inv[name] > 1 ? " x" + inv[name] : ""}<i>${esc(BLURB[name] || "")}</i>` : "";
if (name && cur && !upright) {
const n = isWorn ? 1 : inv[name] || 0;
cur.insertAdjacentHTML("beforeend", `<div class="btip${isWorn ? " down" : ""}">${esc(capital(label(name)))}${n > 1 ? " x" + n : ""}<i>${esc(BLURB[name] || "")}</i></div>`);
const tip = cur.lastChild, t = tip.getBoundingClientRect(), w = el.getBoundingClientRect(), q = parseFloat(getComputedStyle(el).getPropertyValue("--q")) || 3, pad = 4 * q;
const dx = t.left < w.left + pad ? w.left + pad - t.left : t.right > w.right - pad ? w.right - pad - t.right : 0;
if (dx) tip.style.transform = `translateX(calc(-50% + ${Math.round(dx / q) * q}px))`;
}
const keys = $("bagkeys"), use = name ? bagUses(name, isWorn) : ""; keys.innerHTML = "";
const key = (cap, word, fn, off) => { const k = document.createElement("span"); k.className = "bkey" + (off ? " off" : "") + (fn ? "" : " konly"); k.innerHTML = `<kbd>${cap}</kbd>${word}`; if (fn && !off) k.onclick = fn; keys.appendChild(k); };
if (bagMove != null) { key("X", "put down", bagCarry); key("Esc", "let go", () => { bagMove = null; bagDraw(true); }); }
else {
key("Enter", isWorn ? "take off" : "hold", bagHold, !name);
key("E", isWorn || !use ? "use" : use.toLowerCase(), bagUse, !use || isWorn);
key("X", "move", bagCarry, !name || isWorn);
key("1-0", "to bar", null, !name || isWorn);
key("Esc", "close", toggleBag);
}
}
function bagKey(k, e) {
const dir = KEYDIR[k];
if (dir) {
const c = bagAt.zone === "wear" ? bagAt.i + BAG.cols - BAG.wear.length : bagAt.i % BAG.cols, r = bagAt.zone === "wear" ? -1 : bagAt.zone === "pack" ? Math.floor(bagAt.i / BAG.cols) : BAG.rows;
const nr = Math.max(-1, Math.min(BAG.rows, r + (dir === "S") - (dir === "N"))), nc = Math.max(nr < 0 ? BAG.cols - BAG.wear.length : 0, Math.min(BAG.cols - 1, c + (dir === "E") - (dir === "W")));
bagAt = nr < 0 ? {zone: "wear", i: nc - (BAG.cols - BAG.wear.length)} : nr === BAG.rows ? {zone: "bar", i: nc} : {zone: "pack", i: nr * BAG.cols + nc};
sfx("ui");
} else if (k === "enter" || k === " ") { if (e.repeat) return true; if (bagMove != null) return bagCarry(), true; bagHold(); return true; }
else if (k === "e") { if (!e.repeat) bagUse(); return true; }
else if (k === "x") { if (!e.repeat) bagCarry(); return true; }
else if (/^[0-9]$/.test(k)) { if (bagAt.zone !== "wear" && bagItem(bagAt)) { const to = (+k + 9) % 10; if (to !== bagIndex(bagAt)) bagSwap(bagIndex(bagAt), to); bagMove = null; } }
else if (k === "pagedown" || k === "pageup") bagPage = Math.max(0, Math.min(bagPages() - 1, bagPage + (k === "pagedown" ? 1 : -1)));
else if (k === "escape" && bagMove != null) bagMove = null;
else return false;
bagDraw(true);
return true;
}
$("bagclose").onclick = () => toggleBag();
;
const WATER = {
sand: ["#ecdcae", "#ecdcae", "#dfcfa1", "#cdbf98", "#b9ae90"],
tint: [[176, 236, 226, .08], [136, 224, 214, .22], [78, 188, 208, .4], [44, 136, 190, .56], [24, 90, 152, .7]],
caustics: [.22, .13], waves: [.5, .3], wobble: 1.3, strip: 4, foam: "#ffffff",
};
const depthAt = (x, y) => DEPTH_OF[gndAt(x, y)] || 0;
let causticPat = null, wavePat = null;
function causticPattern() {
const n = 64, c = document.createElement("canvas"); c.width = c.height = n;
const g = c.getContext("2d"), img = g.createImageData(n, n), k = 2 * Math.PI / n;
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
const v = Math.sin(k * (2 * x + 3 * Math.sin(k * 2 * y))) + Math.sin(k * (3 * y + 2 * Math.sin(k * 3 * x))) + Math.sin(k * (x + y) * 2);
const a = Math.max(0, 1 - Math.abs(v) / .3);
img.data.set([255, 255, 255, Math.round(255 * a * a)], (y * n + x) * 4);
}
g.putImageData(img, 0, 0);
return ctx.createPattern(c, "repeat");
}
function wavePattern() {
const n = 64, c = document.createElement("canvas"); c.width = c.height = n;
const g = c.getContext("2d");
for (let i = 0; i < 16; i++) {
const x = Math.floor(hash(i, 3, 41) * n), y = Math.floor(i * 4 + hash(i, 5, 42) * 3), len = 3 + Math.floor(hash(i, 7, 43) * 4);
for (const o of [0, -n]) {
g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(x + o, y, len, 1);
g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x + o - 1, y, 1, 1); g.fillRect(x + o + len, y, 1, 1);
g.fillStyle = "rgba(18,64,112,.22)"; g.fillRect(x + o + 1, y + 1, len, 1);
}
}
return ctx.createPattern(c, "repeat");
}
function bedTile(g, x, y, u, ox, oy, under, land) {
const d = Math.abs(u), h = (k) => hash(x, y, k);
g.fillStyle = WATER.sand[u < 0 ? 0 : d];
g.fillRect(ox, oy, 16, 16);
for (let k = 0; k < 5; k++) {
g.fillStyle = h(60 + k) < .5 ? "rgba(255,255,255,.25)" : "rgba(96,78,60,.22)";
g.fillRect(ox + Math.floor(h(70 + k) * 15), oy + Math.floor(h(80 + k) * 15), 1, 1);
}
if (h(50) < .45) {
const rx = ox + 1 + Math.floor(h(51) * 6), ry = oy + 2 + Math.floor(h(52) * 11), len = 5 + Math.floor(h(53) * 5);
g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(rx, ry, len, 1); g.fillRect(rx + len, ry + 1, 2, 1);
g.fillStyle = "rgba(110,88,64,.22)"; g.fillRect(rx + 1, ry + 1, len - 1, 1);
}
const r = h(54), px = ox + 2 + Math.floor(h(55) * 10), py = oy + 3 + Math.floor(h(56) * 9);
if (r < .16) {
g.fillStyle = "#8f8a86"; g.fillRect(px, py, 3, 2);
g.fillStyle = "#c9c5bd"; g.fillRect(px, py, 2, 1);
g.fillStyle = "rgba(60,50,60,.3)"; g.fillRect(px, py + 2, 3, 1);
} else if (r < .22 && d >= 2) {
g.fillStyle = "#6f6c74"; g.fillRect(px - 1, py, 6, 4); g.fillRect(px, py - 1, 4, 1);
g.fillStyle = "#a3a0a6"; g.fillRect(px, py, 3, 1); g.fillRect(px - 1, py + 1, 1, 1);
g.fillStyle = "rgba(50,44,60,.35)"; g.fillRect(px - 1, py + 4, 6, 1);
} else if (r < .32 && d >= 2) {
for (const [wx, wy, wh] of [[0, 2, 5], [2, 0, 7], [4, 3, 4]]) {
g.fillStyle = "#3f8a5c"; g.fillRect(px + wx, py + wy - 2, 1, wh);
g.fillStyle = "#6fb878"; g.fillRect(px + wx, py + wy - 2, 1, 1);
}
} else if (r < .35 && d === 1) {
g.fillStyle = "#f2a48c"; g.fillRect(px, py, 2, 2);
g.fillStyle = "#fbd9c8"; g.fillRect(px, py, 1, 1);
} else if (r < .37 && d <= 2) {
g.fillStyle = "#e8825a"; g.fillRect(px, py + 1, 3, 1); g.fillRect(px + 1, py, 1, 3);
}
if (u < 0) return;
const up = (dx, dy) => { const o = under(x + dx, y + dy); return o && Math.abs(o) < d; };
const shade = (a, ...rect) => { g.fillStyle = `rgba(44,40,64,${a})`; g.fillRect(...rect); };
if (up(0, -1)) { shade(.34, ox, oy, 16, 2); shade(.2, ox, oy + 2, 16, 2); shade(.09, ox, oy + 4, 16, 2); }
if (up(-1, 0)) { shade(.26, ox, oy, 1, 16); shade(.12, ox + 1, oy, 2, 16); }
if (up(1, 0)) { shade(.26, ox + 15, oy, 1, 16); shade(.12, ox + 13, oy, 2, 16); }
if (up(0, 1)) { g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(ox, oy + 15, 16, 1); }
if (land(x, y - 1)) { shade(.26, ox, oy, 16, 3); shade(.12, ox, oy + 3, 16, 3); }
if (land(x - 1, y)) shade(.14, ox, oy, 3, 16);
}
function waterStuff(b) {
const m = B + 6, n = B + 4, x0 = b.bx * B - 3, y0 = b.by * B - 3, dep = new Int8Array(m * m), isL = new Uint8Array(m * m);
for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { const g = gndAt(x0 + i, y0 + j); dep[j * m + i] = DEPTH_OF[g] || (g === ":" ? 1 : 0); isL[j * m + i] = isLand(g) ? 1 : 0; }
const un = new Int8Array(n * n), land = new Uint8Array(n * n);
for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
const q = (j + 1) * m + i + 1; let u = dep[q];
for (let d = 0; d < 9 && !u; d++) if (dep[q + ((d / 3 | 0) - 1) * m + d % 3 - 1]) u = -1;
un[j * n + i] = u; land[j * n + i] = isL[q];
}
return {un, land};
}
function* waterSteps(b) {
const {un, land} = waterStuff(b), old = b.water, same = (p, q) => p.every((v, i) => v === q[i]);
if (old && same(old.un, un) && same(old.land, land)) return;
const n = B * 16, m = B + 4, x0 = b.bx * B, y0 = b.by * B, foam = [], glints = [], rows = new Array(B).fill(false);
const box = [B, B, -1, -1];
const under = (x, y) => un[(y - y0 + 2) * m + x - x0 + 2], isL = (x, y) => land[(y - y0 + 2) * m + x - x0 + 2] === 1;
let any = false;
for (let ly = 0; ly < B && !any; ly++) for (let lx = 0; lx < B; lx++) if (under(x0 + lx, y0 + ly)) { any = true; break; }
if (!any) { b.water = {un, land, any, foam, glints, rows, box: [0, 0, 0, 0]}; return; }
const c = document.createElement("canvas"), bed = document.createElement("canvas");
c.width = c.height = n; bed.width = bed.height = n + 32;
const g = c.getContext("2d"), bg = bed.getContext("2d");
for (let ly = -1; ly <= B; ly++) {
for (let lx = -1; lx <= B; lx++) {
const x = x0 + lx, y = y0 + ly, u = under(x, y);
if (!u) continue;
bedTile(bg, x, y, u, (lx + 1) * 16, (ly + 1) * 16, under, isL);
if (lx < 0 || ly < 0 || lx >= B || ly >= B) continue;
rows[ly] = true;
box[0] = Math.min(box[0], lx); box[1] = Math.min(box[1], ly); box[2] = Math.max(box[2], lx); box[3] = Math.max(box[3], ly);
if (u < 0) continue;
for (const [dx, dy, side] of [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]]) if (isL(x + dx, y + dy)) foam.push([lx, ly, side, hash(x, y, 30 + side)]);
if (hash(x, y, 20) < .4) glints.push([lx * 16 + Math.floor(hash(x, y, 21) * 14), ly * 16 + 1 + Math.floor(hash(x, y, 22) * 13), hash(x, y, 23)]);
}
if ((ly & 3) === 3) yield;
}
const s = document.createElement("canvas"); s.width = s.height = B + 2;
const sg = s.getContext("2d"), img = sg.createImageData(B + 2, B + 2);
for (let j = 0; j < B + 2; j++) for (let i = 0; i < B + 2; i++) {
const u = under(x0 + i - 1, y0 + j - 1), [r, gg, bb, a] = WATER.tint[u < 0 ? 0 : u];
img.data.set([r, gg, bb, Math.round(255 * a)], (j * (B + 2) + i) * 4);
}
sg.putImageData(img, 0, 0);
g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
g.drawImage(s, .5, .5, B + 1, B + 1, -8, -8, n + 16, n + 16);
b.water = {un, land, canvas: c, bed, any, foam, glints, rows, box: box.map((v, i) => (v + (i > 1)) * 16)};
}
let waterCv = null, waterView = null;
function drawWater(vis, ox, oy, t) {
waterView = null;
if (!causticPat) { causticPat = causticPattern(); wavePat = wavePattern(); }
const more = Math.ceil(Curve.over() / zoom);
const vx = Math.floor(-ox / zoom) - 1, vy = Math.floor(-oy / zoom) - 1 - more, vw = Math.ceil(W / zoom) + 3, vh = Math.ceil(H / zoom) + 3 + more;
let g = null, ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9;
const drift = (pat, dx, dy, alpha, x, y, w, h) => {
if (!opt("shimmer")) return;
const mx = ((Math.round(dx) % 64) + 64) % 64, my = ((Math.round(dy) % 64) + 64) % 64;
g.globalAlpha = alpha;
g.save(); g.translate(mx, my); g.fillStyle = pat; g.fillRect(x - mx, y - my, w, h); g.restore();
};
for (const b of vis) {
const w = b.water, n = B * 16, X = b.bx * n, Y = b.by * n, st = WATER.strip;
if (!w || !w.any) continue;
const x0 = Math.max(X + w.box[0], vx), y0 = Math.max(Y + w.box[1], vy), x1 = Math.min(X + w.box[2], vx + vw), y1 = Math.min(Y + w.box[3], vy + vh);
if (x1 <= x0 || y1 <= y0) continue;
if (!g) {
if (!waterCv) waterCv = document.createElement("canvas");
if (waterCv.width !== vw || waterCv.height !== vh) { waterCv.width = vw; waterCv.height = vh; }
g = waterCv.getContext("2d");
g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, vw, vh);
g.translate(-vx, -vy); g.imageSmoothingEnabled = false;
}
ux0 = Math.min(ux0, x0); uy0 = Math.min(uy0, y0); ux1 = Math.max(ux1, x1); uy1 = Math.max(uy1, y1);
const bw = x1 - x0, bh = y1 - y0;
g.save(); g.beginPath(); g.rect(x0, y0, bw, bh); g.clip();
const clear = WaterBed.on;
if (!clear) for (let ly = Math.floor((y0 - Y) / 16); ly * 16 < y1 - Y; ly++) if (w.rows[ly]) for (let k = 0; k < 16; k += st) {
const py = ly * 16 + k, dx = Math.round(Math.sin(t * 1.5 + (Y + py) * .09) * WATER.wobble);
g.drawImage(w.bed, 16 + x0 - X + dx, 16 + py, bw, st, x0, Y + py, bw, st);
}
g.globalCompositeOperation = "lighter";
if (!clear) { drift(causticPat, t * 5, t * 3, WATER.caustics[0], x0, y0, bw, bh); drift(causticPat, -t * 4, t * 6, WATER.caustics[1], x0, y0, bw, bh); }
g.globalCompositeOperation = "source-over";
g.globalAlpha = 1;
if (!clear) g.drawImage(w.canvas, x0 - X, y0 - Y, bw, bh, x0, y0, bw, bh);
drift(wavePat, t * 4, Math.sin(t * .6) * 2, WATER.waves[0], x0, y0, bw, bh);
drift(wavePat, 32 - t * 2.5, 21 + Math.cos(t * .5) * 2, WATER.waves[1], x0, y0, bw, bh);
g.fillStyle = WATER.foam;
for (const [gx, gy, h] of w.glints) {
const s = Math.sin(t * 2.2 + h * 40);
if (s < .86) continue;
g.globalAlpha = .95;
g.fillRect(X + gx, Y + gy, 2, 1);
if (s > .95) { g.fillRect(X + gx, Y + gy - 1, 1, 3); g.globalAlpha = .5; g.fillRect(X + gx - 1, Y + gy, 4, 1); }
}
if (!clear) for (const [lx, ly, side, h] of w.foam) {
const wave = Math.sin(t * 1.4 + h * 6.28), inset = wave > .2 ? 2 : 1, px = X + lx * 16, py = Y + ly * 16;
const a = 2 + Math.floor(h * 5), len = 16 - a - Math.floor(h * 3);
for (const [off, alpha] of [[0, .5 + .35 * wave], [1, .22 + .15 * wave]]) {
g.globalAlpha = alpha;
const i = inset + off * 2;
if (side === 0) g.fillRect(px + a + off, py + i - 1, len - off * 2, 1);
else if (side === 2) g.fillRect(px + a + off, py + 16 - i, len - off * 2, 1);
else if (side === 3) g.fillRect(px + i - 1, py + a + off, 1, len - off * 2);
else g.fillRect(px + 16 - i, py + a + off, 1, len - off * 2);
}
}
g.restore();
}
if (!g) return;
waterView = {x: vx, y: vy};
ctx.imageSmoothingEnabled = false;
ctx.drawImage(waterCv, ux0 - vx, uy0 - vy, ux1 - ux0, uy1 - uy0, ox + ux0 * zoom, oy + uy0 * zoom, (ux1 - ux0) * zoom, (uy1 - uy0) * zoom);
}
;
const GOALS = [
["Chop 4 wood", "wood", (inv, d) => (inv.wood || 0) >= 4 || d.workbench],
["Place a workbench", "workbench", (inv, d) => d.placedBench],
["Pick berries", "berries", (inv) => (inv.berries || 0) > 0],
["Plant a seed", "seed", (inv, d) => d.planted],
["Mine 3 stone", "stone", (inv) => (inv.stone || 0) >= 3],
["Craft an axe", "axe", (inv) => inv.axe],
["Light a campfire", "campfire", (inv, d) => d.placedFire],
["Water a crop", "watering_can", (inv, d) => d.watered],
["Get an egg or milk", "egg", (inv, d) => inv.egg || inv.milk || d.milked],
["Build a house", "door", (inv, d) => d.sheltered],
["Go sailing", "boat", (inv, d) => d.sailed],
["Put up a mailbox", "mailbox", (inv, d) => d.placedMail],
];
function markGoal(key) { if (!me) return; const d = goalState(); d[key] = true; localStorage.setItem("megastructure-goals-" + me, JSON.stringify(d)); }
function goalState() { return JSON.parse(localStorage.getItem("megastructure-goals-" + me) || "{}"); }
const EARLY = 4;
let goalsShown = [], goalsDoneAt = {}, goalsOff = localStorage.getItem("megastructure-goals-off") !== "0";
function toggleGoals() {
if (!me) return;
goalsOff = !goalsOff; localStorage.setItem("megastructure-goals-off", goalsOff ? "1" : "0");
sfx(goalsOff ? "close" : "open");
drawGoals();
}
function drawGoals() {
if (!meObs) return;
const inv = meObs.self.inventory, d = goalState(), now = performance.now();
if (inv.workbench) d.workbench = true;
if (meObs.self.sheltered) d.sheltered = true;
if (meObs.self.sailing) d.sailed = true;
GOALS.forEach(([, , f], i) => {
if (f(inv, d) && !d["g" + i]) { d["g" + i] = true; if (goalsShown.includes(i)) { goalsDoneAt[i] = now; sfx("chime"); if (goalsOff) toast("Goal done: **" + GOALS[i][0] + "**"); } }
});
localStorage.setItem("megastructure-goals-" + me, JSON.stringify(d));
const lingering = goalsShown.filter((i) => goalsDoneAt[i] && now - goalsDoneAt[i] < 1600);
const open = GOALS.map((_, i) => i).filter((i) => !d["g" + i] && !lingering.includes(i));
goalsShown = [...lingering, ...open].slice(0, 3).sort((a, b) => a - b);
const el = $("goals"), done = GOALS.filter((_, i) => d["g" + i]).length;
const book = $("craft").style.display === "block";
el.style.display = goalsOff || book ? "none" : "block";
$("goalhint").style.display = goalsOff && !book && (done < EARLY || document.body.classList.contains("touch")) && done < GOALS.length ? "flex" : "none";
$("goalhintn").textContent = `${done}/${GOALS.length}`;
const sig = goalsShown.map((i) => i + (goalsDoneAt[i] ? "d" : "")).join() + "|" + done;
if (el.dataset.sig === sig) return;
el.dataset.sig = sig;
$("goalcount").textContent = `${done}/${GOALS.length}`;
const list = $("goallist"), first = !list.children.length;
const old = new Map([...list.children].map((r) => [+r.dataset.i, r])), tops = new Map([...old].map(([i, r]) => [i, r.offsetTop]));
for (const [i, r] of old) if (!goalsShown.includes(i)) r.remove();
goalsShown.forEach((i, k) => {
let row = old.get(i);
if (!row) {
row = document.createElement("div"); row.dataset.i = i; row.className = "goal" + (first ? "" : " in");
const icon = slotIcon(GOALS[i][1]), cell = document.createElement("span"); icon.className = "gi"; cell.className = "gc"; cell.append(icon);
row.append(cell);
row.insertAdjacentHTML("beforeend", `<span class="gt">${esc(GOALS[i][0])}</span><span class="tick"></span>`);
}
row.classList.toggle("done", !!goalsDoneAt[i]);
if (list.children[k] !== row) list.insertBefore(row, list.children[k] || null);
});
for (const [i, top] of tops) {
const row = old.get(i), dy = row.isConnected ? top - row.offsetTop : 0;
if (dy && row.animate) row.animate([{transform: `translateY(${dy}px)`}, {transform: "none"}], {duration: 260, easing: "cubic-bezier(.2, .7, .3, 1)"});
}
}
;
const KEYDIR = {w: "N", arrowup: "N", s: "S", arrowdown: "S", a: "W", arrowleft: "W", d: "E", arrowright: "E"};
const CODEDIR = {KeyW: "N", ArrowUp: "N", KeyS: "S", ArrowDown: "S", KeyA: "W", ArrowLeft: "W", KeyD: "E", ArrowRight: "E"};
const keys = new Set();
let runKey = false;
const sprinting = () => runKey && !(meObs && meObs.self.hunger <= SPRINT_FOOD);
let inputMode = "mouse";
function facingTile() {
const p = ents.get("agent" + myId), s = myPos(); if (!p || !s) return null;
return {x: s.x + (p.fx || 0), y: s.y + (p.fy || (p.fx ? 0 : 1))};
}
const INSTANT_DIG = "bFQf;\"w?!rmqyp";
function isQuick(f) {
if (f.it.attack || f.it.here) return true;
const c = combAt(f.p.x, f.p.y);
return !placingItem() && !!c && INSTANT_DIG.includes(c);
}
const useful = (it) => it && !it.walk && !it.info && it.ok !== false;
let foe = null;
const FOE_MS = 8000;
function entKey(name) {
const m = /^(\w+)#(\d+)$/.exec(name || "");
if (m) return m[1] + m[2];
const a = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === name);
return a ? "agent" + a.e.id : null;
}
function noteFight(e) {
if (e.attacker === me) foe = {key: entKey(e.target), until: performance.now() + FOE_MS};
else if (e.target === me) foe = {key: entKey(e.attacker), until: performance.now() + FOE_MS};
}
const placingItem = () => selected && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed");
const FACED = [{}, {}];
function facingIntent(alt) {
const m = FACED[alt ? 1 : 0], p = ents.get("agent" + myId), s = myPos(), hot = !!foe && performance.now() < foe.until;
if (p && s && m.clock === clock && m.obs === meObs && m.land === landVer && m.built === Floors.ver && m.sel === selected && m.x === s.x && m.y === s.y && m.fx === p.fx && m.fy === p.fy && m.foe === foe && m.hot === hot) return m.out;
const out = facingNow(alt);
Object.assign(m, {clock, obs: meObs, land: landVer, built: Floors.ver, sel: selected, x: s && s.x, y: s && s.y, fx: p && p.fx, fy: p && p.fy, foe, hot, out});
return out;
}
function facingNow(alt) {
const q = facingTile(), s = myPos(); if (!q || !s) return null;
if (!alt && placingItem()) {
const it = intent(q, false);
if (it && it.own) return it.none ? null : {p: it.own, it};
if (entityAt(q)) return {p: q, it: {text: "Something is in the way", ok: false, ghost: selected}};
return it ? {p: q, it: it.ok === false || inReach(q, it) ? it : {...it, ok: false, text: TOO_HIGH}} : null;
}
const reach = reachOf(inHand()), dist = (o) => Math.abs(o.tx - s.x) + Math.abs(o.ty - s.y);
const near = alt ? [] : [...ents.values()]
.filter((o) => o.e && !(o.e.kind === "agent" && o.e.id === myId) && reaches(o.tx, o.ty, reach, standsAt(o)))
.sort((a, b) => dist(a) - dist(b));
const hit = (o) => { const p = {x: o.tx, y: o.ty}, it = intent(p, false); return useful(it) && it.attack ? {p, it} : null; };
if (foe && performance.now() < foe.until) {
const o = ents.get(foe.key), r = o && near.includes(o) && hit(o);
if (r) return r;
}
for (const o of near) if (WILD[o.e.kind] && o.e.kind !== "wisp") { const r = hit(o); if (r) return r; }
const here = {x: s.x, y: s.y}, under = combAt(s.x, s.y);
if (!alt && under && !GROUND.has(under) && !SOLID.has(under)) { const it = intent(here, false); if (useful(it)) return {p: here, it}; }
const faced = intent(q, alt);
const hs = myZ(s.x, s.y), level = (t, it) => it.flat || it.ent || it.z !== undefined || it.at !== undefined || Math.abs(settleNear(t.x, t.y, hs) - hs) <= 2;
if (useful(faced) && inReach(q, faced) && level(q, faced)) return {p: q, it: faced};
if (!alt && inHand() === "pickaxe" && landSolid(q.x, q.y, hs + 1) && (GROUND.has(combAt(q.x, q.y)) || floorAt(q.x, q.y) !== hs + 1))
return {p: q, it: {text: topAt(s.x, s.y) > hs ? "Dig on" : inHole(s, q, hs) ? "Dig into the wall" : "Dig into the hill", flat: true, cell: hs + 1,
run: () => act("dig", {dir: dirTo(q), with: "pickaxe"})}};
if (alt && inHand() !== "hoe") { const d = digAhead(q, hs); if (d) return d; }
for (const o of near) { const p = {x: o.tx, y: o.ty}, it = intent(p, false); if (useful(it) && inReach(p, it)) return {p, it}; }
const p0 = ents.get("agent" + myId), ring = [];
for (let dy = -USE_R; dy <= USE_R; dy++) for (let dx = -USE_R; dx <= USE_R; dx++) {
if ((!dx && !dy) || !reaches(s.x + dx, s.y + dy, USE_R)) continue;
ring.push({x: s.x + dx, y: s.y + dy, d: Math.max(Math.abs(dx), Math.abs(dy)) + Math.abs(dx) * .01 + Math.abs(dy) * .01 - (dx * p0.fx + dy * p0.fy) * .1});
}
ring.sort((a, b) => a.d - b.d);
for (const q of ring) { const p = {x: q.x, y: q.y}, it = intent(p, alt); if (useful(it) && level(p, it) && inReach(p, it)) return {p, it}; }
return faced && !faced.walk && !useful(faced) && inReach(q, faced) ? {p: q, it: faced} : null;
}
function digAhead(q, hs) {
const wall = landSolid(q.x, q.y, hs + 1), z = wall ? hs + 1 : settleNear(q.x, q.y, hs), top = z === topAt(q.x, q.y), g = combAt(q.x, q.y);
if (z < hs - 2 || entityAt(q) || (top && !(g && GROUND.has(g) && !":n".includes(g) && !wet(g)))) return null;
const pick = inHand() === "pickaxe";
return {p: q, it: {text: wall ? "Dig the wall" : "Dig down", flat: true, near: 1, cell: z, run: () => act("dig", {dir: dirTo(q), z, ...(pick ? {with: "pickaxe"} : {})})}};
}
function inHole(s, q, h) {
const dx = q.x - s.x, dy = q.y - s.y, wall = (x, y) => landSolid(s.x + x, s.y + y, h + 1);
return wall(-dx, -dy) || (wall(dy, dx) && wall(-dy, -dx));
}
function aimedTile() {
if (!me) return null;
if (Build.on) return Build.aim();
if (byKeys()) { const a = facingIntent(false); return a && wayHides(WayShow.offer(), a, "use") ? null : a; }
if (!mouse.in) return null;
const p = aimAt(tileAtScreen(mouse.x, mouse.y), keys.has("shift")), it = intent(p, keys.has("shift"));
return {p: (it && it.own) || p, it};
}
const byKeys = () => inputMode === "keys" || !mouse.in;
const wayHides = (way, f, key) => !!way && !(way.key !== key && f.it.ok !== false && /ladder|stairs/i.test(f.it.text));
let actionsHtml = "", faceRows = [];
function availableActions() {
if (!me || !meObs) return [];
if (Build.on) return Build.rows();
const s = myPos(), rows = [];
const way = WayShow.offer(), m0 = facingIntent(false), a0 = facingIntent(true), main = m0 && wayHides(way, m0, "use") ? null : m0, alt = a0 && wayHides(way, a0, "alt") ? null : a0;
if (way && way.key) rows.push([capOf(way.key), way.text, "way", true, true]);
if (main && !main.it.info && main.it.ok !== false) rows.push([capOf("use"), main.it.text, "", true]);
else if (main && placingItem()) rows.push([capOf("use"), main.it.text, "bad", true]);
if (alt && !alt.it.info && alt.it.ok !== false && (!main || alt.it.text !== main.it.text)) rows.push([capOf("alt"), alt.it.text, "", true]);
const up = way && way.key === "up" ? null : DigUp.aim();
if (up) rows.push([capOf("up"), up.text, "", true]);
if (!(way && way.key === "jump") && stepAhead()) rows.push([capOf("jump"), "Jump"]);
if (selected && FOODS.includes(selected)) rows.push([capOf("eat"), `Eat ${label(selected)}`]);
if (selected && WEAR[selected]) rows.push([capOf("eat"), `Wear ${label(selected)}`]);
if (s && groundItems.some(([x, y]) => x === s.x && y === s.y)) rows.push([capOf("pick"), "Pick up"]);
if (way) return rows;
if (Build.waiting()) rows.push([capOf("build"), `Build: ${Build.waiting()} plans wait`]);
else if (placingItem() && !FOOT[PLACEABLE_BLOCK[selected]]) rows.push([capOf("build"), "Build mode: plan a lot"]);
return rows;
}
function updateActions() {
const all = availableActions(), keys = byKeys(), aim = keys && !Build.on ? facingIntent(false) : null;
const beside = !!aim && !aim.it.info && !aim.it.walk;
faceRows = Build.on || !keys || !beside ? [] : all.filter((r) => r[3] && !r[4]);
const corner = Build.on ? all.filter(([k]) => k === capOf("build") || k === "Esc") : keys && beside ? all.filter((r) => !r[3] || r[4]) : all;
const html = corner.map(([k, t, cls]) => `<div class="${cls || ""}"><span class="key">${esc(k)}</span>${esc(t)}</div>`).join("");
if (html === actionsHtml) return;
actionsHtml = html;
const el = $("actions"); el.innerHTML = html; el.style.display = html ? "block" : "none";
}
function useFacing(alt) {
if (DigUp.route(alt ? "alt" : "use")) return;
WayShow.mine();
const f = facingNow(alt);
if (!f) return;
if (f.it.info) return toast(f.it.text);
if (f.it.ok === false) return toast(f.it.text, true);
if (walking && !isQuick(f)) return;
perform(f.p, f.it);
}
function turn(dir) {
const p = ents.get("agent" + myId); if (!p) return;
[p.fx, p.fy] = DIRV[dir];
}
function selectItem(name) {
if (name !== selected) sfx("pick");
selected = name; $("hotbar").dataset.sig = "";
if (meObs) drawHotbar(meObs.self.inventory);
}
function cycleHand(step) {
if (!meObs) return;
const order = slotOrder(meObs.self.inventory).slice(0, BAR), have = order.filter(Boolean);
if (!have.length) return;
const i = have.indexOf(selected), j = i + step;
selectItem(j < 0 ? have[have.length - 1] : j >= have.length ? null : have[j]);
if (selected) toast(`In hand: **${label(selected)}**`);
}
const BOOK_KEYS = new Set(["c", "i", "m", "h", "?", "g", "f3", "t", "/", "+", "=", "-"]);
let capAt = null;
addEventListener("mousemove", (e) => {
if (capAt && Math.abs(e.clientX - capAt.x) + Math.abs(e.clientY - capAt.y) > 4) document.body.classList.remove("bykeys");
capAt = {x: e.clientX, y: e.clientY};
});
function closePanels() {
for (const id of ["bag", "mail", "craft"]) $(id).style.display = "none";
drawGoals();
}
const SHORTCUTS = {
" ": () => useFacing(false),
x: () => useFacing(true),
r: () => DigUp.run(),
j: () => jumpKey(),
f: () => act("pick_up", {}),
e: () => useSelected(),
q: () => cycleHand(1),
"`": () => { selectItem(null); },
c: () => { $("bag").style.display = "none"; toggleCraft(); },
i: () => { if (isOpen("craft")) toggleCraft(); toggleBag(); },
m: () => { setMuted(!muted); toast(`Sound **${muted ? "off" : "on"}** \`${capOf("mute")}\``); },
h: () => $("helpbtn").click(), "?": () => $("helpbtn").click(),
g: () => toggleGoals(),
z: () => Build.toggle(),
b: () => Build.toggle(),
v: () => nextView(),
f3: () => F3.toggle(),
t: () => openChat(),
enter: () => openChat(),
"/": () => openChat("/"),
};
addEventListener("keydown", (e) => {
if (document.activeElement === $("name")) { if (e.key === "Enter") $("join").click(); return; }
if (document.activeElement === $("say") || document.activeElement === $("letter") || !me) return;
const k = e.key.toLowerCase();
if (k === "shift") { keys.add("shift"); if (Build.on) return; if (opt("sprint") === "hold") runKey = true; else if (!e.repeat) runKey = !runKey; syncWalk(); return; }
inputMode = "keys"; document.body.classList.add("bykeys");
if (k === "escape" && Build.on && !isOpen("craft") && !isOpen("bag") && !isOpen("mail")) { Build.onKey(k, e); return; }
if (k === "escape") { if (isOpen("bag") && bagKey(k, e)) return; if (isOpen("craft") || isOpen("bag") || isOpen("mail")) closePanels(); else if (!isOpen("ask")) openMenu(); return; }
const u = usualKey(k);
if (isOpen("craft") && (craftKey(k, e) || !BOOK_KEYS.has(u))) { e.preventDefault(); return; }
if (isOpen("bag") && (bagKey(k, e) || !BOOK_KEYS.has(u))) { e.preventDefault(); return; }
if (Build.onKey(k, e)) { e.preventDefault(); return; }
if (e.altKey && CODEDIR[e.code]) { e.preventDefault(); turn(CODEDIR[e.code]); return; }
if (KEYDIR[k]) {
e.preventDefault();
if (!e.repeat) { keys.delete(k); keys.add(k); syncWalk(); }
return;
}
if (/^[0-9]$/.test(k) && meObs) {
const n = slots[(+k + 9) % 10]; selectItem(n && selected !== n ? n : null); return;
}
if (k === "tab") { e.preventDefault(); if (!e.repeat) { drawWho(); document.body.classList.add("tab"); } return; }
const fn = SHORTCUTS[u];
if (fn) { e.preventDefault(); if (!(e.repeat && u !== " " && u !== "x" && u !== "r")) fn(); }
});
addEventListener("keyup", (e) => {
const k = e.key.toLowerCase();
keys.delete(k);
if (k === "shift") { keys.delete("shift"); if (opt("sprint") === "hold") runKey = false; }
if (k === "tab") document.body.classList.remove("tab");
syncWalk();
});
addEventListener("blur", () => { runKey = false; keys.clear(); document.body.classList.remove("tab"); syncWalk(); });
$("goalhide").onclick = $("goalhint").onclick = () => toggleGoals();
$("goals").onclick = (e) => { if (me && !e.target.closest(".gf")) { drawWho(); document.body.classList.toggle("tab"); } };
;
const DigUp = (() => {
function aim() {
const s = typeof myPos === "function" ? myPos() : null, q = s && facingTile(), w = s && WayShow.offer(), way = !!w;
if (w && w.key === "up") { const n = WayShow.cur.now; return {x: n.x, y: n.y, z: n.z, text: w.text, way}; }
if (!q || !meObs || Build.on || inHand() !== "pickaxe") return null;
const h = myZ(s.x, s.y), roof = solidAt(s.x, s.y, h + 2), wall = solidAt(q.x, q.y, h + 2);
if (!landSolid(q.x, q.y, h + 1) || (!roof && !wall)) return null;
if (!(topAt(s.x, s.y) > h || inHole(s, q, h))) return null;
if (roof) return landSolid(s.x, s.y, h + 2) ? {x: s.x, y: s.y, z: h + 2, text: "Dig up", way} : null;
return landSolid(q.x, q.y, h + 2) ? {x: q.x, y: q.y, z: h + 2, text: "Dig a step", way} : null;
}
let going = false;
const send = (tool, args) => { going = true; act(tool, args).finally(() => { going = false; }); };
function route(key) {
const c = WayShow.cur, n = c && c.now;
if (!n || n.key !== key || Build.on || !meObs) return false;
if (walking || myAction || pendingAct || going) return true;
const tool = meObs.self.inventory.pickaxe ? {with: "pickaxe"} : {};
if (n.d) turn(n.d);
send(key === "alt" ? "dig_down" : "dig", key === "alt" ? tool : {x: n.x, y: n.y, z: n.z, ...tool});
return true;
}
function run() {
if (route("up")) return;
const c = aim();
if (!c || walking || myAction || pendingAct || going) return;
WayShow.mine(); send("dig", {x: c.x, y: c.y, z: c.z, with: "pickaxe"});
}
return {aim, run, route};
})();
;
const BuildGhost = (() => {
const paints = new Map(), RED = [232, 85, 74], MOST = 9;
const cell = (p, z, planned) => { let n = z; while (n - z < MOST && planned(p.x, p.y, n)) n++; return n; };
function paintOf(item) {
if (paints.has(item)) return paints.get(item);
let px = null;
try {
const stone = item === "stone_block", lv = stone ? 5 : 1, d = sheetData(stone ? hillSheet(lv) : dugSheet("soil", 0)), [bx, by] = blobCell(255), ox = stone ? bx * 16 : 0, oy = stone ? by * 16 : 80;
px = new Uint32Array(16 * (16 + RELIEF_STEP));
for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) px[j * 16 + i] = d.px[(oy + j) * d.w + ox + i];
VoxPaint.front(lv, 0, px, 256, 16, 1);
} catch (e) { px = null; }
paints.set(item, px); return px;
}
const quads = (at, x, y, z0, z1) => { const T = [at(x, y, z1), at(x + 1, y, z1), at(x + 1, y + 1, z1), at(x, y + 1, z1)], B = [at(x, y + 1, z0), at(x + 1, y + 1, z0)]; return [...T, ...B].every((v) => v) ? {T, F: [T[3], T[2], B[1], B[0]]} : null; };
function block(g, at, u, x, y, z, item, a, red, behind) {
const px = paintOf(item), q = px && quads(at, x, y, z - 1, z); if (!q) return false;
const R = (v) => Math.round(v / u) * u;
const face = (c, rows, row0) => { const y0 = R(c[0][1]), y1 = R(c[3][1]);
for (let Y = y0; Y < y1; Y += u) { const k = (Y - y0) / (y1 - y0), hid = !!behind && (row0 ? behind(x + .5, y + .999, z - k) : behind(x + .5, y + k, z)), l = R(c[0][0] + (c[3][0] - c[0][0]) * k), r = R(c[1][0] + (c[2][0] - c[1][0]) * k), j = row0 + Math.min(rows - 1, Math.floor(k * rows));
g.globalAlpha = hid ? a * .6 : a;
for (let X = l; X < r; X += u) { if (hid && ((Math.round(X / u) >> 1) + (Math.round(Y / u) >> 1)) % 2) continue; const v = px[j * 16 + Math.min(15, Math.floor((X - l) / (r - l) * 16))], c3 = [v & 255, (v >> 8) & 255, (v >> 16) & 255].map((w, i) => (red ? (w + RED[i]) >> 1 : w));
g.fillStyle = `rgb(${c3.join()})`; g.fillRect(X, Y, u, u); } } };
face(q.T, 16, 0); face(q.F, RELIEF_STEP, 16); g.globalAlpha = 1;
return true;
}
const api = {cell, paintOf, block, drew: null};
api.paint = () => {
api.drew = null;
const p = Build.on && meObs ? Build.S.at : null, art = HdLook.on ? HdLook.art() : null, at = p && art && art.at, a0 = at && at(p.x, p.y, Build.level()), a1 = a0 && at(p.x + 1, p.y, Build.level());
if (!a1 || a1[0] === a0[0]) return;
const u = art ? art.u : zoom, bh = art && art.behind, t = performance.now() / 1000, land = (j) => !j.take && j.up && LAND_BLOCKS.has(j.item);
for (const j of [...Build.S.plans.values()].filter(land).sort((a, b) => a.y - b.y || a.z - b.z)) block(ctx, at, u, j.x, j.y, j.z, j.item, j.state === "doing" ? .75 : .5, j.state === "bad", bh);
const it = Build.hint(p), hit = Build.taking(p); api.drew = {};
if (hit && !hit.plan && !hit.shut) api.drew.take = [p.x, p.y, hit.dig || hit.up ? hit.z : hit.z + 1];
if (LAND_BLOCKS.has(it.ghost) && it.z !== undefined && block(ctx, at, u, p.x, p.y, it.z, it.ghost, .6, it.ok === false, bh)) Object.assign(api.drew, {x: p.x, y: p.y, z: it.z, ok: it.ok !== false, at: at(p.x + .5, p.y + .5, it.z), u, hid: !!bh && bh(p.x + .5, p.y + .5, it.z)});
};
return api;
})();
;
const Target = (() => {
const INK = "#5b3f36", CREAM = "#fff8e8", TAKE = "#ff9d3c", RED = "#e8554a";
const api = {drew: [], opts: {}};
function cells() {
const s = typeof me !== "undefined" && me && meObs ? myPos() : null, out = [];
if (!s) return out;
const add = (key, kind, x, y, z, more) => { if (!out.some((c) => c.x === x && c.y === y && c.z === z && c.kind === "break")) out.push({key, kind, x, y, z, h: 1, ok: true, ...more}); };
if (Build.on) {
const p = Build.S.at, it = Build.hint(p), hit = Build.taking(p), L = Build.level();
if (hit && !hit.plan && !hit.shut) add("alt", "break", p.x, p.y, hit.dig || hit.up ? hit.z : hit.z + 1, hit.dig || hit.up ? {} : {h: 1, thing: true});
if (it.ghost && it.z !== undefined && !it.steps && it.ghost !== "ladder") add("use", solidAt(p.x, p.y, it.z) ? "use" : "place", p.x, p.y, it.z, {ok: it.ok !== false, item: LAND_BLOCKS.has(it.ghost) ? it.ghost : null, drawn: LAND_BLOCKS.has(it.ghost)});
else add("use", solidAt(p.x, p.y, L) ? "use" : "place", p.x, p.y, L, {ok: it.ok !== false, flat: !!it.ghost && solidAt(p.x, p.y, L)});
return out;
}
const keys = byKeys(), h = myZ(s.x, s.y), way = keys ? WayShow.offer() : null, wc = WayShow.cur, nx = wc && wc.next, now = wc && wc.now;
const ways = (x, y, z) => !!nx && nx.x === x && nx.y === y && nx.z === z;
const a = keys ? facingIntent(false) : aimedTile(), it = a && a.it, p = a && a.p, alt = keys ? facingIntent(true) : null, up = keys ? DigUp.aim() : null;
if (way && way.key === "alt") add("alt", "break", s.x, s.y, h, {mine: true});
if (up) add("up", "break", up.x, up.y, up.z, {way: ways(up.x, up.y, up.z)});
if (way && way.key === "use" && now) add("use", "break", now.x, now.y, now.z, {way: ways(now.x, now.y, now.z)});
else if (it && p && tile(p.x, p.y) && !it.info && !it.walk) {
const wetFill = !!it.ghostGround && wet(gndAt(p.x, p.y) || "");
if (it.cell !== undefined) add("use", "break", p.x, p.y, it.cell);
else if (wetFill) add("use", "use", p.x, p.y, topAt(p.x, p.y) - WaterBed.would(p.x, p.y, it.ghostGround), {ok: it.ok !== false, flat: true});
else if (LAND_BLOCKS.has(it.ghost)) add("use", "place", p.x, p.y, it.z !== undefined ? it.z : topAt(p.x, p.y) + 1, {ok: it.ok !== false, item: it.ghost});
else if (!api.opts.thing && !it.ent && !it.steps) add("use", "use", p.x, p.y, it.z !== undefined ? it.z : api.opts.shown ? api.opts.shown(p.x, p.y) : settleNear(p.x, p.y, h), {ok: it.ok !== false, flat: true});
}
if (!(way && way.key === "alt") && alt && alt.it.cell !== undefined) add("alt", "break", alt.p.x, alt.p.y, alt.it.cell);
return out;
}
api.cells = cells;
api.target = (key = "use") => { const c = cells().find((q) => q.key === key); return c ? {x: c.x, y: c.y, z: c.z, kind: c.kind, ok: c.ok} : null; };
const R = (P, v) => Math.round(v / P.u) * P.u;
function line(P, a, b, col, hid, c, drop) {
const A = P.at(...a), B = P.at(...b); if (!A || !B) return;
const g = P.g, u = P.u, n = Math.max(1, Math.round(Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])) / u)), ph = Math.round((A[0] + A[1]) / u), e = .02;
const at = (k) => !!(c && P.behind && P.behind(Math.max(c.x + e, Math.min(c.x + 1 - e, a[0] + (b[0] - a[0]) * k)), Math.max(c.y + e, Math.min(c.y + 1 - e, a[1] + (b[1] - a[1]) * k)), a[2] + (b[2] - a[2]) * k));
const hs = hid && !drop ? null : [0, .25, .5, .75, 1].map(at), on = [], off = [];
for (let i = 0; i <= n; i++) { const k = i / n, bh = !!hs && hs[Math.round(k * 4)], h = hid || bh; if (drop && bh) continue; if (h && (i + ph) % 2) continue; (h ? off : on).push(R(P, A[0] + (B[0] - A[0]) * k), R(P, A[1] + (B[1] - A[1]) * k)); }
const put = (l, dy, cl, al) => { if (!l.length) return; g.globalAlpha = al; g.fillStyle = cl; for (let i = 0; i < l.length; i += 2) g.fillRect(l[i], l[i + 1] + dy, u, u); };
put(on, u, INK, .7); put(on, 0, col, 1); put(off, 0, col, .6);
g.globalAlpha = 1;
}
function face(P, pts, col, a, pat) {
const q = pts.map((p) => P.at(...p)); if (q.some((v) => !v)) return;
const g = P.g, u = P.u, y0 = R(P, Math.min(...q.map((v) => v[1]))), y1 = R(P, Math.max(...q.map((v) => v[1]))), x0 = R(P, q[0][0]);
g.globalAlpha = a; g.fillStyle = col;
for (let Y = y0; Y < y1; Y += u) {
const yc = Y + u / 2; let l = 1e9, r = -1e9;
for (let i = 0; i < q.length; i++) { const A = q[i], B = q[(i + 1) % q.length]; if ((A[1] <= yc) === (B[1] <= yc)) continue; const xi = A[0] + (B[0] - A[0]) * (yc - A[1]) / (B[1] - A[1]); l = Math.min(l, xi); r = Math.max(r, xi); }
l = R(P, l); r = R(P, r); if (!(r > l)) continue;
if (!pat) g.fillRect(l, Y, r - l, u); else for (let X = l; X < r; X += u) if (pat(Math.round((X - x0) / u), Math.round((Y - y0) / u))) g.fillRect(X, Y, u, u);
}
g.globalAlpha = 1;
}
const HATCH = (i, j) => (((i + j) % 4) + 4) % 4 === 0, CHECK = (i, j) => ((i + j) & 1) === 0;
const FACES = {T: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1], 0, 0, 1], B: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], 0, 0, -1], S: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0], 0, 1, 0],
N: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0], 0, -1, 0], W: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0], -1, 0, 0], E: [[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0], 1, 0, 0]};
const EDGES = [[[0, 0, 1], [1, 0, 1], "TN"], [[1, 0, 1], [1, 1, 1], "TE"], [[0, 1, 1], [1, 1, 1], "TS"], [[0, 0, 1], [0, 1, 1], "TW"], [[0, 0, 1], [0, 0, 0], "NW"], [[1, 0, 1], [1, 0, 0], "NE"],
[[0, 1, 1], [0, 1, 0], "SW"], [[1, 1, 1], [1, 1, 0], "SE"], [[0, 0, 0], [1, 0, 0], "BN"], [[1, 0, 0], [1, 1, 0], "BE"], [[0, 1, 0], [1, 1, 0], "BS"], [[0, 0, 0], [0, 1, 0], "BW"]];
function box(P, c) {
const {x, y, z} = c, h = c.h || 1, z0 = z - h, at = ([i, j, k]) => [x + i, y + j, z0 + k * h], col = c.ok === false ? RED : c.kind === "break" ? TAKE : CREAM;
const full = (dx, dy, dz) => { for (let k = dz > 0 ? z + 1 : dz < 0 ? z0 : z0 + 1; k <= (dz > 0 ? z + 1 : dz < 0 ? z0 : z); k++) if (!solidAt(x + dx, y + dy, k)) return false; return true; };
const seen = {}; for (const f of "TBSNWE") { const F = FACES[f]; seen[f] = (f === "T" || f === "S" || (f === "W" && x > P.ex) || (f === "E" && x + 1 < P.ex)) && !full(F[4], F[5], F[6]); }
const near = x > P.ex ? "W" : x + 1 < P.ex ? "E" : "S", held = c.kind === "place" && c.ok !== false ? (full(0, 0, -1) ? "B" : "WENS".split("").find((f) => full(FACES[f][4], FACES[f][5], 0)) || (full(0, 0, 1) ? "T" : "")) : "";
if (c.flat) { for (const [a, b, fs] of EDGES) if (fs[0] === "T") line(P, at(a), at(b), col, !seen.T, c); face(P, FACES.T.slice(0, 4).map(at), col, .22); return {x, y, z, kind: c.kind, held: "", seen}; }
if (held && held !== "B" && held !== "T") face(P, FACES[held].slice(0, 4).map(at), CREAM, .75, CHECK);
if (c.kind === "break" && !c.thing && !c.mine) for (const f of "TSWE") if (seen[f] || f === near) { face(P, FACES[f].slice(0, 4).map(at), INK, .28); face(P, FACES[f].slice(0, 4).map(at), TAKE, .9, HATCH); }
if (c.kind !== "break") { const bh = P.behind && P.behind(x + .5, y + .5, z) ? CHECK : null; face(P, FACES.T.slice(0, 4).map(at), CREAM, c.drawn ? .25 : .4, bh); if (seen.S) face(P, FACES.S.slice(0, 4).map(at), INK, .18, bh); }
if (held === "B") face(P, FACES.B.slice(0, 4).map(at), CREAM, .5, CHECK);
const drop = c.kind === "break" && seen.T;
for (const [a, b, fs] of EDGES) if (!c.mine || !fs.includes("T") || fs === "TS") line(P, at(a), at(b), col, !(seen[fs[0]] || seen[fs[1]] || (held && held !== "T" && fs.includes(held))), c.kind === "break" && fs.includes(near) && !drop ? null : c, drop);
if (!full(0, 0, -1)) { const g0 = settleAt(x, y, z0); if (g0 < z0) { line(P, [x + .5, y + .5, z0], [x + .5, y + .5, g0], col, true, c); face(P, [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => [x + i, y + j, g0]), INK, .5, CHECK); } }
return {x, y, z, kind: c.kind, held, seen};
}
const DOWN = ["..###..", "..#o#..", "..#o#..", "###o###", "#ooooo#", ".#ooo#.", "..#o#..", "...#..."];
function feet(P, c) {
const g = P.g, u = P.u, T = [[0, .45], [1, .45], [1, 1], [0, 1]].map(([i, j]) => [c.x + i, c.y + j, c.z]), pe = ents.get("agent" + myId), ft = pe && P.at(pe.x + .5, pe.y + .5, c.z), west = !!pe && pe.fx > 0, E = P.at(c.x + (west ? 0 : 1), c.y + .7, c.z);
g.save(); if (ft) { g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); g.rect(R(P, ft[0]) - 7 * u, R(P, ft[1]) - 22 * u, 14 * u, 25 * u); g.clip("evenodd"); }
face(P, T, TAKE, .9, HATCH); for (let i = 0; i < 4; i++) line(P, T[i], T[(i + 1) % 4], TAKE, false, null);
g.restore();
if (E) DOWN.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { g.fillStyle = ch === "#" ? INK : TAKE; g.fillRect(R(P, E[0]) + (west ? i - 9 : i + 2) * u, R(P, E[1]) + (j - 5) * u, u, u); } }));
}
api.over = (x, y, w, h) => [...api.drew.map((d) => d.r), typeof WayShow !== "undefined" && WayShow.block].some((r) => r && x < r.x + r.w && r.x < x + w && y < r.y + r.h && r.y < y + h);
api.paint = (g, art, opts = {}) => {
api.opts = opts; api.drew = [];
if (!art || api.off) return;
const s = myPos(), open = HdLook.win && HdLook.win.n && HdLook.win.a > 0, P = {g, u: art.u, at: art.at, behind: open ? null : art.behind, ex: s ? s.x + .5 : 0}, B = art.body;
const inB = (r) => (B && r ? Math.max(0, Math.min(r.x + r.w, B.x + B.w) - Math.max(r.x, B.x)) * Math.max(0, Math.min(r.y + r.h, B.y + B.h) - Math.max(r.y, B.y)) / Math.max(1e-6, Math.min(r.w * r.h, B.w * B.h)) : 0);
g.save(); if (B) { g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); g.rect(B.x, B.y, B.w, B.h); g.clip("evenodd"); }
for (const c of cells().sort((a, b) => a.y - b.y || (a.kind === "break") - (b.kind === "break") || a.z - b.z)) {
const W = art.wall && art.wall(c.x, c.y, c.z), Q = W ? {...P, at: W, behind: null} : P, px = Q.at(c.x, c.y, c.z);
const q = [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k) => Q.at(c.x + i, c.y + j, c.z - k)))).filter((v) => v), xs = q.map((v) => v[0]), ys = q.map((v) => v[1]);
const r = q.length ? {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)} : null;
if (c.mine) { api.drew.push({x: c.x, y: c.y, z: c.z, kind: c.kind, key: c.key, mine: true, px, u: P.u}); continue; }
if (c.way) { api.drew.push({x: c.x, y: c.y, z: c.z, kind: c.kind, key: c.key, way: true, px, u: P.u}); continue; }
if (!Build.on && inB(r) > .4) { api.drew.push({x: c.x, y: c.y, z: c.z, kind: c.kind, key: c.key, under: true, px, u: P.u}); continue; }
if (c.kind === "place" && c.item && !c.drawn) BuildGhost.block(g, Q.at, Q.u, c.x, c.y, c.z, c.item, .6, c.ok === false, Q.behind);
api.drew.push({...box(Q, c), key: c.key, px, u: P.u, r});
}
g.restore();
};
return api;
})();
;
const Build = (() => {
const REACH = 10, FIRST_MS = 230, STEP_MS = 75, BAD_MS = 2600;
const SWAP = {door: "W%", gate: "#"};
const S = {on: false, at: null, plane: null, deep: null, plans: new Map(), hold: null, working: false, dir: null, timer: 0, pan: {x: 0, y: 0}};
const now = () => performance.now(), UPMOST = 9, DEEPEST = 12, LOWEST = LOW;
const ride = (p) => { const s = myPos(); return settleNear(p.x, p.y, s ? myZ(s.x, s.y) : topAt(p.x, p.y)); };
const under = (p, t) => (solidAt(p.x, p.y, t) ? t : settleAt(p.x, p.y, t));
const level = (p = S.at) => (S.plane !== null ? S.plane : !p ? 0 : S.deep !== null ? under(p, S.deep) : ride(p));
const buried = (p, L) => landSolid(p.x, p.y, L) && landSolid(p.x, p.y, L + 1);
const digs = (x, y, z) => { const j = S.plans.get(x + "," + y + "," + z); return !!j && !!j.dig && j.state !== "bad"; }, open = (x, y, z, soon) => landSolid(x, y, z) && [[0, 0, 1], [0, 0, -1], ...Object.values(DIRV).map(([dx, dy]) => [dx, dy, 0])].some(([dx, dy, dz]) => !solidAt(x + dx, y + dy, z + dz) || (soon && digs(x + dx, y + dy, z + dz)));
const onIt = (p, L) => solidAt(p.x, p.y, L) && !solidAt(p.x, p.y, L + 1);
const key = (p, z = level(p)) => p.x + "," + p.y + "," + z;
const BLOCK = (it) => it === "roof" || it === "plank";
const planned = (x, y, z) => { const j = S.plans.get(x + "," + y + "," + z); return !!j && !j.take && j.up && (BLOCK(j.item) || LAND_BLOCKS.has(j.item)) && j.state !== "bad"; };
const landFits = (x, y, z, soon = planned) => { const s = myPos(); return solidAt(x, y, z) ? "Something is there" : s && s.x === x && s.y === y && z > myZ(x, y) && z <= myZ(x, y) + 2 ? "You stand there"
: [[0, 0, -1], [0, 0, 1], ...Object.values(DIRV).map(([dx, dy]) => [dx, dy, 0])].some(([i, j, k]) => solidAt(x + i, y + j, z + k) || soon(x + i, y + j, z + k)) ? "" : "Nothing holds it"; };
const piece = () => (selected && meObs && meObs.self.inventory[selected] && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed") ? selected : null);
const todo = () => [...S.plans.values()].filter((j) => j.state !== "bad");
function hint(p) {
const it = piece();
if (!it) return {text: selected ? "Pick a block to place" : "Pick a piece", key: "1-9", ok: selected ? undefined : false};
if (FOOT[PLACEABLE_BLOCK[it]]) return {text: "Put by hand: leave with B", ok: false, ghost: it};
const have = meObs.self.inventory[it], used = todo().filter((j) => j.item === it).length, t = tile(p.x, p.y);
const L = level(p), on = onIt(p, L), c = FLOORS ? Floors.get(p.x, p.y, L) : null, what = Floors.thingAt(p.x, p.y, L);
if (used >= have) return {text: `All ${have} are planned`, ok: false, ghost: it};
if (it === "stairs" || it === "ladder") {
if (S.plans.has(key(p, L))) return {text: "Planned", ok: false, ghost: it};
const say = Climb.intent(p, false) || {text: "Nothing can go there", ok: false};
return {...say, z: L};
}
if (LAND_BLOCKS.has(it) && FLOORS) {
const z = S.hold === " " && S.row !== undefined ? S.row : BuildGhost.cell(p, on ? L + 1 : L, planned), why = landFits(p.x, p.y, z);
return why ? {text: why, ok: false, ghost: it, z} : {text: `Place ${label(it)}`, ok: true, ghost: it, z};
}
if (BLOCK(it) && (FLOORS || it === "roof") && !(it === "plank" && on && !c && t && FILLS.plank[t[1]] && GROUND.has(t[0]))) {
const z = !on ? L : it === "roof" ? L + Floors.STOREY : L + 1, why = S.plans.has(key(p, z)) ? "Planned" : Floors.fits(p.x, p.y, z, planned);
return why ? {text: why, ok: false, ghost: it, z} : {text: `Place ${label(it)}${on && it === "plank" ? " on top" : ""}`, ok: true, ghost: it, z};
}
if (S.plans.has(key(p, L))) return {text: "Planned", ok: false, ghost: it};
if (!on) return {text: solidAt(p.x, p.y, L) ? "Nothing can go there" : "No floor there: lay one", ok: false, ghost: it, z: L};
if (SWAP[it] && SWAP[it].includes(what)) return {text: `Place ${label(it)} in its place`, ok: true, ghost: it, swap: true, ...(c ? {z: L} : {})};
if (c) return what ? {text: "Something is there", ok: false, ghost: it, z: L} : Floors.UP.has(PLACEABLE_BLOCK[it]) ? {text: `Place ${label(it)}`, ok: true, ghost: it, z: L} : {text: "It needs the ground", ok: false, ghost: it, z: L};
const say = intent(p, false) || {text: "Nothing can go there", ok: false};
return {...say, text: say.ok === false ? say.text.replace(/^Can't place .* here$/, "Can't go there") : say.text};
}
function taking(p) {
const t = tile(p.x, p.y), L = level(p), on = onIt(p, L), h = piece() ? hint(p) : {};
const zs = [...new Set([selected === "roof" && on ? L + Floors.STOREY : undefined, h.z !== undefined && planned(p.x, p.y, h.z - 1) ? h.z - 1 : undefined, h.z, L].filter((z) => z !== undefined))];
for (const z of zs) { const j = S.plans.get(key(p, z)); if (j) return j.state === "doing" ? null : {z, what: "plan", plan: j}; }
if (!t) return null;
if (buried(p, L)) return {z: L, what: "ground", dig: true, tunnel: true, shut: !open(p.x, p.y, L, true)};
const built = (z) => { const c = FLOORS || z !== L ? Floors.get(p.x, p.y, z) : null; return c ? {z, what: c[1] ? label(CH[c[1]]) : c[0] === "roof" ? "roof" : c[0] === "stairs" ? "the step" : "planks", up: true} : null; };
for (const z of zs) if (built(z)) return built(z);
if (on && L === groundAt(p.x, p.y)) {
if (!GROUND.has(t[0])) { const c = "Zz".includes(t[0]) ? (structAt(p.x, p.y) || {c: t[0]}).c : t[0]; return {z: L, what: label(CH[c]), verb: Object.values(PLACEABLE_BLOCK).includes(c) ? "" : (HARVEST[c] || "").replace(/ \(.*$/, "")}; }
if ("_n:".includes(t[1])) return {z: L, what: label(CH[t[1]])};
if (!wet(t[1]) && L > LOW) return {z: L, what: "ground", dig: true};
}
if (on && landSolid(p.x, p.y, L) && L > LOW) return {z: L, what: "ground", dig: true};
for (let z = L + 1; S.plane === null && z <= L + 3 * Floors.STOREY; z++) if (built(z)) return built(z);
return null;
}
function plan(p) {
const it = hint(p), z = it.z !== undefined ? it.z : level(p);
if (!it.ghost || it.ok === false) return S.hold ? null : toast(it.text, true);
if (BLOCK(selected) && S.hold && S.row !== undefined && S.row !== z) return;
S.row = z; S.plans.set(key(p, z), {x: p.x, y: p.y, z, item: selected, up: it.z !== undefined && !it.draw, ground: it.ghostGround || null, swap: !!it.swap, steps: it.steps || null, state: "todo"});
sfx("pick"); work();
}
function take(p) {
const hit = taking(p);
if (!hit) return S.hold ? null : toast("Nothing built there", true);
if (hit.plan) { S.plans.delete(key(p, hit.z)); return; }
if (hit.shut) return S.hold ? null : toast("No air beside it: plan the step before it first", true);
S.plans.set(key(p, hit.z), {x: p.x, y: p.y, z: hit.z, take: true, up: !!hit.up, dig: !!hit.dig, tunnel: !!hit.tunnel, state: "todo"});
sfx("pick"); work();
}
async function work() {
if (S.working) return; S.working = true;
try {
for (let j; me && S.on && (j = nearest());) {
j.state = "doing";
const why = await build(j);
if (!why) S.plans.delete(key(j, j.z));
else if (!S.on) j.state = "todo";
else if (!j.tried) { j.tried = true; j.state = "todo"; }
else { j.state = "bad"; j.why = why; j.t = now(); toast(why, true); }
}
} finally { S.working = false; }
}
function nearest() {
const s = myPos(); if (!s) return null;
const wait = (j) => (j.dig ? S.plans.has(j.x + "," + j.y + "," + (j.z + 1)) || (j.tunnel && !open(j.x, j.y, j.z)) : !j.take && j.up && (LAND_BLOCKS.has(j.item) ? !!landFits(j.x, j.y, j.z, () => false) : BLOCK(j.item) ? !!Floors.fits(j.x, j.y, j.z) : !Floors.get(j.x, j.y, j.z)));
const far = (j) => (j.tried ? 1000 : 0) + (wait(j) ? 5000 : 0) + (solid(j) ? 500 : 0) + Math.abs(j.x - s.x) + Math.abs(j.y - s.y) + Math.abs(j.z - myZ(s.x, s.y));
return [...S.plans.values()].filter((j) => j.state === "todo").sort((a, b) => far(a) - far(b))[0];
}
const solid = (j) => !j.take && !j.up && SOLID.has(PLACEABLE_BLOCK[j.item] || ".");
function wayOut(q, j) {
const flat = (c) => c.x + "," + c.y, shut = new Set([...S.plans.values()].filter(solid).map(flat)), seen = new Set([flat(q)]), line = [q];
for (let i = 0; i < line.length && i < 400; i++) {
const c = line[i];
if (Math.max(Math.abs(c.x - j.x), Math.abs(c.y - j.y)) >= 10) return true;
for (const [dx, dy] of Object.values(DIRV)) { const n = {x: c.x + dx, y: c.y + dy}, k = flat(n); if (!seen.has(k) && !shut.has(k) && plainWalk(n.x, n.y)) { seen.add(k); line.push(n); } }
}
return false;
}
const stands = (q, h) => { const c = FLOORS ? Floors.get(q.x, q.y, h) : null; return c ? !SOLID.has(c[1]) : h === groundAt(q.x, q.y) ? plainWalk(q.x, q.y) : surfacesAt(q.x, q.y).includes(h); };
async function build(j) {
if (!j.take && !(meObs.self.inventory[j.item] > 0)) return `No ${label(j.item)} left`;
const at = myPos(); if (j.dig && !j.up && at && at.x === j.x && at.y === j.y && myZ(at.x, at.y) === j.z) { const r = await act("dig_down", meObs.self.inventory.pickaxe ? {with: "pickaxe"} : {}, true); return r && r.ok ? null : (r && (r.detail || r.error)) || "It could not be done"; }
for (let i = 0; j.tunnel && !j.tried && i < 24 && !open(j.x, j.y, j.z); i++) await new Promise((done) => setTimeout(done, 25));
if (j.tunnel && !open(j.x, j.y, j.z)) return "No air beside it: the step before it was not dug";
const here = () => { const s = myPos(); return {...s, z: myZ(s.x, s.y)}; };
const ok = (q, h) => (q.x - j.x) ** 2 + (q.y - j.y) ** 2 + ((j.z - h) * LAYER) ** 2 <= (USE_R + .5) ** 2
&& !(q.x === j.x && q.y === j.y && (j.up ? j.z - h >= 0 && j.z - h <= 2 : true))
&& !(j.steps || []).some(([x, y]) => x === q.x && y === q.y)
&& (!j.tunnel || (Math.abs(q.x - j.x) + Math.abs(q.y - j.y) === 1 && j.z >= h && j.z <= h + 2));
if (!ok(here(), here().z) || (solid(j) && !wayOut(here(), j))) {
const s = here(), spots = [];
for (let dy = -USE_R; dy <= USE_R; dy++) for (let dx = -USE_R; dx <= USE_R; dx++) for (const h of surfacesAt(j.x + dx, j.y + dy)) {
const q = {x: j.x + dx, y: j.y + dy, z: h, far: Math.abs(dx) + Math.abs(dy) > 1 ? 3 : 0};
if (stands(q, h) && ok(q, h) && !entityAt(q)) spots.push(q);
}
const cost = (q) => (solid(j) && !wayOut(q, j) ? 200 : 0) + ([...S.plans.values()].some((o) => o.x === q.x && o.y === q.y) ? 60 : 0) + q.far + Math.abs(q.z - s.z) * 2 + Math.abs(q.x - s.x) + Math.abs(q.y - s.y);
spots.sort((a, b) => cost(a) - cost(b));
let there = false;
for (const q of spots.slice(0, 6)) {
const r = await act("move_to", {x: q.x, y: q.y, ...(FLOORS ? {z: q.z} : {})}, true);
for (let i = 0; r && r.ok && i < 40 && !(myPos().x === q.x && myPos().y === q.y); i++) await new Promise((done) => setTimeout(done, 25));
if (r && r.ok && ok(here(), here().z)) { there = true; break; }
if (!S.plans.has(key(j, j.z))) return null;
}
if (!there) return "No way to get near it";
}
if (!S.plans.has(key(j, j.z))) return null;
const was = Floors.thingAt(j.x, j.y, j.z), inv = meObs.self.inventory;
const tool = j.dig ? (inv.pickaxe ? "pickaxe" : null) : (j.take || j.swap) && TOOL_FOR[was] && inv[TOOL_FOR[was]] ? TOOL_FOR[was] : null;
const went = (r) => (r && r.ok ? null : (r && (r.detail || r.error)) || "It could not be done");
const z = FLOORS || j.dig ? {z: j.z} : {}, dig = () => { actTarget = {x: j.x, y: j.y}; return act(FLOORS || !j.up ? "dig" : "unroof", {dir: "N", ...z, ...(tool ? {with: tool} : {})}, true); };
if (j.swap && SWAP[j.item].includes(was)) {
const why = went(await dig());
if (why) return why;
}
if (j.take) return went(await dig());
actTarget = {x: j.x, y: j.y};
return went(await act("place", {dir: "N", item: j.item, ...z}, true));
}
function toggle(on = !S.on) {
if (on === S.on || (on && !me)) return;
S.on = on; S.hold = null; S.plane = null; S.deep = null; held(null); document.body.classList.toggle("building", on);
if (on) { S.at = facingTile() || myPos(); const s = myPos(), z = s ? myZ(s.x, s.y) : 0, c = s ? [z + 2, z + 1].find((t) => landSolid(S.at.x, S.at.y, t)) : undefined, r = ride(S.at); if (c < r) S.deep = c; else if (c > r) S.plane = c; work(); }
else { S.pan = {x: 0, y: 0}; if (todo().length && !TOUCH) toast(`${todo().length} plans wait: ${capOf("build")} to go on building`); }
}
function drop() { const n = todo().length; for (const [k, j] of S.plans) if (j.state !== "doing") S.plans.delete(k); toast(`${n} plans dropped`); }
function move(dir) {
const s = myPos(), [dx, dy] = DIRV[dir], x = S.at.x + dx, y = S.at.y + dy;
if (!s || !tile(x, y) || Math.max(Math.abs(x - s.x), Math.abs(y - s.y)) > REACH) { sfx("buzz"); return false; }
S.at = {x, y};
if (S.hold === " ") plan(S.at); else if (S.hold === "x") take(S.at);
return true;
}
function held(dir) {
clearTimeout(S.timer); S.dir = dir;
if (!dir) return;
move(dir);
const again = () => { if (S.on && S.dir === dir && move(dir)) S.timer = setTimeout(again, STEP_MS); };
S.timer = setTimeout(again, FIRST_MS);
}
function stops(p) {
const s = myPos(), me = myZ(s.x, s.y), r = ride(p), out = [];
for (let t = Math.max(LOWEST, me - DEEPEST); t < r; t++) { const z = under(p, t); if (z < r && out[out.length - 1] !== z) out.push(z); }
out.push(r);
const one = LAND_BLOCKS.has(piece());
for (let z = r + 1; z <= me + UPMOST; z++) if (landSolid(p.x, p.y, z) || (FLOORS && (one ? z > r + 1 : (z - r) % Floors.STOREY === 0) && !landSolid(p.x, p.y, z + 1))) out.push(z);
return out;
}
function lift(d) {
if (!myPos()) return sfx("buzz");
const L = level(), all = stops(S.at), to = d < 0 ? all.filter((z) => z < L).pop() : all.find((z) => z > L), r = ride(S.at);
if (to === undefined) return d > 0 && !FLOORS ? toast("Floors come when this world's server is restarted", true) : sfx("buzz");
S.plane = to > r ? to : null; S.deep = to < r ? to : null;
sfx("pick");
}
function onKey(k, e) {
if (!S.on) return false;
if (k === "b" || k === keyOf("build")) { if (!e.repeat) toggle(false); return true; }
if (k === "escape") { if (!e.repeat) { if (todo().length) drop(); else toggle(false); } return true; }
if (KEYDIR[k]) { if (!e.repeat) held(KEYDIR[k]); return true; }
if (k === " " || k === "x") { if (!e.repeat) { S.hold = k; S.row = undefined; if (k === " ") plan(S.at); else take(S.at); } return true; }
if (k === "e" || k === "q" || k === "pageup" || k === "pagedown") { if (!e.repeat) lift(k === "e" || k === "pageup" ? 1 : -1); return true; }
return false;
}
addEventListener("keyup", (e) => { const k = e.key.toLowerCase(); if (k === S.hold) S.hold = null; if (KEYDIR[k] === S.dir) held(null); });
addEventListener("blur", () => { S.hold = null; held(null); });
function point(p) { if (S.on && tile(p.x, p.y)) S.at = {x: p.x, y: p.y}; }
function click(p, alt) { point(p); S.row = undefined; if (alt) take(S.at); else plan(S.at); }
function tick() {
for (const [k, j] of S.plans) if (j.state === "bad" && now() - j.t > BAD_MS) S.plans.delete(k);
if (S.on && !me) { S.plans.clear(); toggle(false); }
}
function pan(dt) {
const s = myPos(), to = S.on && S.at && s ? {x: (S.at.x - s.x) / 2, y: (S.at.y - s.y) / 2} : {x: 0, y: 0}, k = Math.min(1, dt * 6);
S.pan.x += (to.x - S.pan.x) * k; S.pan.y += (to.y - S.pan.y) * k;
return S.pan;
}
function rows() {
const it = hint(S.at), n = todo().length, hit = taking(S.at), s = myPos(), up = s ? Keyhole.rel(level() - myZ(s.x, s.y)) : 0, sign = (v) => (v > 0 ? "+" : "") + v;
const out = [[capOf("build"), up ? `BUILD · ${sign(up)} · leave` : "BUILD MODE · leave", "head"]];
out.push([it.key || "Space", it.text, it.ok === false && !it.key ? "bad" : ""]);
out.push(["Q E", "A layer down, up"]);
if (hit) out.push(["X", hit.plan ? "Take the plan back" : hit.shut ? "Plan the step before it first" : hit.dig ? "Break" : hit.verb || `Break ${hit.what}`, ...(hit.shut ? ["bad"] : [])]);
if (n) out.push(["Esc", `Drop the ${n} plan${n > 1 ? "s" : ""}`]);
return out;
}
const waiting = () => (!S.on && todo().length ? todo().length : 0);
return {S, toggle, onKey, ways: () => { const L = level(), all = S.at && myPos() ? stops(S.at) : []; return {up: all.some((z) => z > L), down: all.some((z) => z < L)}; }, click, point, tick, pan, rows, hint, taking, waiting, level, get on() { return S.on; }, aim: () => { const it = hint(S.at); return {p: S.at, it: it.ghost || it.z !== undefined ? it : {...it, z: level()}}; }};
})();
;
const Keyhole = (() => {
let marks = null;
function tag(x, y, S, n, right) {
const text = (n > 0 ? "+" : "") + n;
ctx.font = "18px SproutPixel"; ctx.textAlign = "left";
const w = Math.ceil(ctx.measureText(text).width) + 10, X = Math.round(right ? x + TS() + 3 * zoom + 2 : x - 3 * zoom - w - 2), Y = Math.round(y + S / 2 - 10);
ctx.fillStyle = "#5b3f36"; ctx.fillRect(X - 2, Y - 2, w + 4, 24);
ctx.fillStyle = "#7a5646"; ctx.fillRect(X, Y, w, 20);
ctx.fillStyle = "#fff6e2"; ctx.fillText(text, X + 5, Y + 16);
}
const rel = (n) => (n > 0 ? Math.max(0, n - 2) : n);
function mark(x, y, h, n, cube, sx, sy, right) {
if (rel(n)) tag(x, y, h, rel(n), right);
const p = ents.get("agent" + myId), z = zoom;
marks = null;
if (!p || n > 4 || n < (cube ? -1 : 1)) return;
const X = Math.round(sx(p.x)), Y = Math.round(bodyY(p, sy)) + (16 - RELIEF_STEP * n) * z, H = RELIEF_STEP * z;
marks = {n, x: X - 3 * z, y: Y, h: H, drawn: false};
}
return {tag, rel, mark, get marks() { return marks; }};
})();
;
const Prompts = (() => {
const el = document.getElementById("prompts"), part = {};
let html = "";
const row = ([k, t, cls]) => `<div class="${cls || ""}"><span class="key">${esc(k)}</span>${esc(t)}</div>`;
let keep = null, size = {};
const hit = (a, b) => Array.isArray(b) ? b.some((c) => hit(a, c)) : !!a && !!b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function show(rect, side = [], up = null, down = null) {
const h = rect && (side.length || up || down) ? `<div class="side">${side.map(row).join("")}</div><div class="up">${up ? row(up) : ""}</div><div class="down">${down ? row(down) : ""}</div>` : "";
if (h !== html) { html = h; el.innerHTML = h; for (const k of ["side", "up", "down"]) { part[k] = el.querySelector("." + k); size[k] = part[k] ? [part[k].offsetWidth, part[k].offsetHeight] : [0, 0]; } }
if (!h) return;
const R = Math.round, mid = R(rect.y + rect.h / 2), [sw, sh] = size.side, box = (k, x, y) => size[k][0] ? {x, y, w: size[k][0], h: size[k][1]} : null;
const lx = (k, right) => right ? R(rect.x + rect.w + 10) : R(rect.x - 10) - size[k][0];
const ud = (r) => [box("up", lx("up", r), mid - 14 - size.up[1]), box("down", lx("down", r), mid + 14)], bad = (q) => hit(q[0], keep) || hit(q[1], keep);
let onRight = !!rect.right, [U, D] = ud(onRight);
if (bad([U, D])) { const o = ud(!onRight); if (!bad(o)) [U, D] = o; else for (const b of [U, D]) for (const k of keep || []) if (hit(b, k)) b.x = onRight ? R(k.x + k.w + 6) : R(k.x - 6) - b.w; }
const ux = R(rect.x - 4), lx2 = R(rect.x + rect.w + 4) - sw, clear = (x, y) => { let v = R(y); const b = {x, y: v, w: sw, h: sh}; if (hit(b, D)) v = D.y + D.h + 4; return v; };
const high = (x) => { let v = R(rect.y - 12) - sh; if (hit({x, y: v, w: sw, h: sh}, U)) v = U.y - 4 - sh; return v; };
const at = {right: [R(rect.x + rect.w + 10), mid - R(sh / 2)], under: [ux, clear(ux, rect.y + rect.h + 12)], left: [R(rect.x - 10) - sw, mid - R(sh / 2)], over: [ux, high(ux)], underL: [lx2, clear(lx2, rect.y + rect.h + 12)], overL: [lx2, high(lx2)]};
let S = null;
for (const k of rect.under ? ["under", "right", "left", "over", "underL", "overL"] : ["right", "under", "left", "over", "underL", "overL"]) { const b = {x: at[k][0], y: at[k][1], w: sw, h: sh}; if (!S) S = b; if (!hit(b, keep) && !hit(b, U) && !hit(b, D)) { S = b; break; } }
part.side.style.transform = `translate(${S.x}px, ${S.y}px)`;
if (U) part.up.style.transform = `translate(${U.x}px, ${U.y}px)`;
if (D) part.down.style.transform = `translate(${D.x}px, ${D.y}px)`;
}
function build() {
const r = Build.S.rect, ways = Build.ways();
BuildGhost.paint();
show(r, Build.rows().filter(([k]) => ![capOf("build"), "B", "Esc", "Q E"].includes(k)), ways.up ? ["E", "Up"] : null, ways.down ? ["Q", "Down"] : null);
}
return {show, build, set keep(v) { keep = v; }, get keep() { return keep; }};
})();
;
const COMMANDS = {
coords: () => debugScreen("coords"),
perf: () => debugScreen("perf"),
};
function debugScreen(word) { F3.toggle(); toast(`Debug screen ${F3.on ? "on" : "off"} (F3 or /${word})`); }
function localCommand(word) {
const run = COMMANDS[String(word || "").toLowerCase()];
if (run) run();
return !!run;
}
const FACING = {"0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east"};
F3.add("you", () => {
const p = myId !== null ? ents.get("agent" + myId) : null; if (!myAt || !p) return ["Nexel Worlds  web " + webStamp, "(not in the world)"];
const x = myAt.x, y = myAt.y, g = gndAt(x, y), top = topAt(x, y), aim = me && aimedTile();
const h = ((clock.phase || 0) * 24 + 6) % 24, near = {people: 0, creatures: 0};
for (const q of ents.values()) if (q !== p && q.e && Math.abs(q.x - p.x) <= 16 && Math.abs(q.y - p.y) <= 16) near[q.e.kind === "agent" ? "people" : "creatures"]++;
return ["Nexel Worlds  web " + webStamp,
`XYZ ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${myAt.z}`,
`Facing ${FACING[(p.fx || 0) + "," + (p.fy || 0)] || "-"}` + (aim ? `  aim ${aim.p.x}, ${aim.p.y} z ${topAt(aim.p.x, aim.p.y)}` : ""),
`Tile ${x}, ${y}  ${g === null ? "not loaded" : label(CH[g] || g)}`,
`Land top ${top}` + (top > myAt.z ? `  you are ${top - myAt.z} under it` : ""),
`Chunk ${Math.floor(x / B)}, ${Math.floor(y / B)}  (${B} tiles)`,
`Time ${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}  ${clock.night ? "night" : "day"}`,
`Near ${near.people} people, ${near.creatures} creatures`];
});
const TICKS = {clock: null, n: 0, at: 0, gap: 0, since: 0};
F3.add("machine", () => {
const now = performance.now(), s = TICKS.since ? (now - TICKS.since) / 1000 : 0, m = performance.memory;
const r = [`ticks ${s ? (TICKS.n / s).toFixed(1) : "-"}/s  longest wait ${Math.round(TICKS.gap)} ms`,
`world ${metrics.tick_ms_p50 ?? "?"} ms a tick, worst ${metrics.tick_ms_max ?? "?"}`,
`canvas ${cv.width}x${cv.height} (x${DPR})  ${blocks.size} blocks  ${ents.size} bodies`,
m ? `heap ${Math.round(m.usedJSHeapSize / 1048576)} / ${Math.round(m.jsHeapSizeLimit / 1048576)} MB` : null,
`this screen ${F3.cost.toFixed(2)} ms`];
TICKS.n = 0; TICKS.gap = 0; TICKS.since = now;
return r;
}, "perf");
function perfFrame(now, js, land) {
if (!F3.on) return;
if (clock !== TICKS.clock) { TICKS.clock = clock; TICKS.n++; if (TICKS.at) TICKS.gap = Math.max(TICKS.gap, now - TICKS.at); TICKS.at = now; }
F3.sample(now, js, land);
}
;
let walking = null;
const trail = [];
let trailN = 0, srv = null;
const LEAD = [2, 4];
function mark(x, y) { const n = ++trailN; trail.push({x, y, n}); return [x, y, n]; }
const spring = new Map();
const springs = (x, y) => performance.now() < (spring.get(x + "," + y) || 0);
function stepAhead() {
const p = ents.get("agent" + myId); if (!p || !me || !meObs || Build.on) return null;
const w = WayShow.offer(), wd = !walking && w && w.key === "jump" ? WayShow.cur.path[1].d : null;
const d = walking ? walking.dir : wd || Object.keys(DIRV).find((k) => DIRV[k][0] === p.fx && DIRV[k][1] === p.fy);
if (!d) return null;
const x = p.tx + DIRV[d][0], y = p.ty + DIRV[d][1], h = myZ(p.tx, p.ty);
return solidAt(x, y, h + 1) && landAt(h, x, y, p.tx, p.ty) === h + 1 ? {x, y, d, way: !!wd} : null;
}
function jumpKey() {
const p = ents.get("agent" + myId); if (!p || !me || !meObs || Build.on) return;
const s = stepAhead(), now = performance.now();
if (jumpGoing) return;
if (!s) { p.hop = now; rpc("act", {tool: "jump", args: {}}); return; }
for (const [k, t] of spring) if (t < now) spring.delete(k);
spring.set(s.x + "," + s.y, now + 3000);
if (s.way) turn(s.d);
jumpGoing = !walking;
rpc("act", {tool: "jump", args: walking ? {at: [s.x, s.y]} : {dir: s.d, at: [s.x, s.y]}}).then(() => { jumpGoing = false; if (walking === null && [...keys].some((k) => KEYDIR[k])) syncWalk(); });
}
let jumpGoing = false;
function syncWalk() {
const k = [...keys].reverse().find((k) => KEYDIR[k]);
const want = k && me ? {dir: KEYDIR[k], run: sprinting()} : null;
if (want && walking && want.dir === walking.dir && want.run === walking.run) return;
if (!want && !walking) return;
const prev = walking, p = ents.get("agent" + myId), now = performance.now();
walking = want;
if (!want) {
const args = {};
if (p && p.walking) {
p.walking = false;
pred = {x: p.tx, y: p.ty, until: now + 2000};
args.at = mark(p.tx, p.ty); if (prev.run) args.run = true;
}
rpc("act", {tool: "stop", args});
return;
}
const [dx, dy] = DIRV[want.dir], args = want.run ? {dir: want.dir, run: true, push: true} : {dir: want.dir, push: true};
if (p) {
const [ox, oy] = prev && p.walking ? DIRV[prev.dir] : [0, 0];
const line = (ox || oy) && !(ox * dy - oy * dx), back = line && (ox !== dx || oy !== dy);
if (line && !(back && !prev.at && !walkable(p.tx - ox, p.ty - oy, p.tx, p.ty))) { want.lane = prev.lane; want.at = prev.at; }
else {
want.lane = dx ? p.ty : p.tx; want.at = {x: p.tx, y: p.ty};
if (ox || oy) args.from = mark(p.tx, p.ty);
const bx = Math.sign(p.x - p.tx), by = Math.sign(p.y - p.ty);
if (pred && bx === dx && by === dy && trail.length === 1 && srv && (dx ? srv.y : srv.x) === want.lane) { want.at = null; args.cut = true; trail.length = 0; }
}
p.fx = dx; p.fy = dy; p.walking = true; p.running = want.run; p.moved = now;
}
myAction = null; pred = null;
const mine = want, from = p ? p.tx + "," + p.ty : "";
rpc("act", {tool: "walk", args}).then((r) => {
if (walking !== mine) return;
walking = null; if (p) p.walking = false;
if (r.ok && r.result.stopped === "blocked") { const q = ents.get("agent" + myId); if (q) { q.fx = dx; q.fy = dy; if (q.tx + "," + q.ty === from) WayShow.mine(); } }
});
}
function srvAt(now) {
const k = Math.min(1, (now - srv.t) / srv.ms);
return {x: srv.x0 + (srv.x - srv.x0) * k, y: srv.y0 + (srv.y - srv.y0) * k};
}
function leadOf(p, now) {
if (!srv) return 0;
const [wx, wy] = DIRV[walking.dir], at = walking.at;
let q = srvAt(now), d = 0;
for (const c of trail) {
if (at && c.x === at.x && c.y === at.y) break;
d += Math.abs(c.x - q.x) + Math.abs(c.y - q.y); q = c;
}
const ax = p.x - q.x, ay = p.y - q.y;
if (at) return d + Math.abs(ax) + Math.abs(ay);
const al = ax * wx + ay * wy, off = Math.abs(ax * wy) + Math.abs(ay * wx);
return d || off > .01 ? d + Math.abs(al) + off : al;
}
const speedAt = (x, y, p) => { const t = tile(x, y); return (walking.run && !onWater(x, y, p) ? 10 : 5) / (t && wet(t[1]) && !(p.e && p.e.sail) ? SWIM_PACE : 1) / (eating() ? EAT_PACE : 1); };
const onWater = (x, y, p) => { const t = tile(x, y); return (!SWIM_SPRINT && !!t && wet(t[1])) || !!(p.e && p.e.sail); };
function walkOn(p, dt, now) {
const [wx, wy] = DIRV[walking.dir], s = wx || wy, side = wx ? "y" : "x", along = wx ? "x" : "y", lead = leadOf(p, now);
let t = dt * (lead < -1 ? 1.25 : lead <= LEAD[0] ? 1 : Math.max(0, (LEAD[1] - lead) / (LEAD[1] - LEAD[0])));
for (let i = 0; i < 4 && t > 1e-5; i++) {
const off = walking.lane - p[side];
if (Math.abs(off) > 1e-3) {
const v = speedAt(Math.round(p.x), Math.round(p.y), p), go = Math.min(Math.abs(off), v * t);
p[side] += Math.sign(off) * go; t -= go / v; p.moved = now;
continue;
}
p[side] = walking.lane; walking.at = null;
const a0 = s > 0 ? Math.floor(p[along] + 1e-6) : Math.ceil(p[along] - 1e-6);
const fx = wx ? a0 : walking.lane, fy = wx ? walking.lane : a0, nx = fx + wx, ny = fy + wy;
if (!walkable(nx, ny, fx, fy)) { p[along] -= s * Math.min((p[along] - a0) * s, 10 * t); p.tx = fx; p.ty = fy; break; }
const v = Climb.pace(fx, fy, myZ(fx, fy), nx, ny) || speedAt(fx, fy, p);
const go = Math.min((a0 + s - p[along]) * s, v * t);
p[along] += s * go; t -= go / v; p.tx = nx; p.ty = ny; p.moved = now;
}
}
function myTick(p, e, now) {
if (!srv || srv.x !== e.x || srv.y !== e.y) {
const step = srv && Math.abs(e.x - srv.x) + Math.abs(e.y - srv.y) === 1;
srv = {x0: step ? srv.x : e.x, y0: step ? srv.y : e.y, x: e.x, y: e.y, t: now, ms: step && now - srv.t < 350 ? Math.max(100, now - srv.t) : 150};
}
while (trail.length && trail[0].n <= (e.vn || 0)) trail.shift();
if (pred && (!trail.length || now > pred.until)) { pred = null; trail.length = 0; }
if (!walking || !p.walking) return !!pred;
const lane = DIRV[walking.dir][0] ? e.y : e.x;
if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > LEAD[1] + 2) {
p.x = p.tx = e.x; p.y = p.ty = e.y; walking.lane = lane; walking.at = null; trail.length = 0;
} else if (!trail.length && !walking.at && lane !== walking.lane) walking.lane = lane;
return true;
}
;
const WayOut = (() => {
const WAYS = [[1, 0, "E"], [-1, 0, "W"], [0, -1, "N"], [0, 1, "S"]], TURN = .01,
DIG = 30, FALL = 3, HURT = 100, R = 28;
const key = (x, y, z) => ((x + 32768) * 65536 + (y + 32768)) * 2048 + (z + 1024);
function out(W, x, y, z) {
if (W.top(x, y) > z) return false;
let n = 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (W.top(x + i, y + j) > z + 1 && ++n > 12) return false;
n = 0; for (let j = -9; j <= 9; j += 3) for (let i = -9; i <= 9; i += 3) if (W.top(x + i, y + j) > z + 3 && ++n > 24) return false;
return true;
}
const stepOf = (W) => W.step || ((h, x, y, fx, fy) => { if (W.solid(x, y, h + 1)) return W.solid(x, y, h + 2) || W.solid(fx, fy, h + 2) ? null : h + 1; let z = h; while (!W.solid(x, y, z)) z--; return z; });
function heap() {
const a = [];
return {get size() { return a.length; },
push(c, v) { let i = a.length; a.push([c, v]); while (i) { const p = (i - 1) >> 1; if (a[p][0] <= c) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
pop() { const t = a[0], l = a.pop(); if (a.length) { a[0] = l; let i = 0; for (;;) { let m = i; const q = 2 * i + 1; if (q < a.length && a[q][0] < a[m][0]) m = q; if (q + 1 < a.length && a[q + 1][0] < a[m][0]) m = q + 1; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return t; }};
}
function* run(W, s, dig, cap, pull, zt, d0) {
const step = stepOf(W), enter = W.enter || (() => true), best = new Map(), q = heap(), h = (z) => (pull ? pull * Math.max(0, zt - z) : 0);
const s0 = {x: s.x, y: s.y, z: s.z, c: 0, from: null, digs: null, d: d0 || null, nd: 0}; best.set(key(s.x, s.y, s.z), s0); q.push(h(s.z), s0);
let n = 0, sky = 0, edge = false;
const relax = (x, y, z, c, from, d, digs) => { const k = key(x, y, z), b = best.get(k); if (b && b.c <= c) return;
if (from.nd) for (let a = from; a; a = a.from) if (a.digs && a.digs.some((e) => e.x === x && e.y === y && e.z === z)) return;
const v = {x, y, z, c, from, d, digs, nd: from.nd + (digs ? 1 : 0)}; best.set(k, v); q.push(c + h(z), v); };
const fall = (a, b) => (a - b > FALL ? HURT * (a - b - FALL) : 0), drop = (x, y, z) => { while (!W.solid(x, y, z)) z--; return z; };
while (q.size) {
const v = q.pop()[1], {x, y, z} = v; if (best.get(key(x, y, z)) !== v) continue;
if (out(W, x, y, z)) return {goal: v, sky, n, edge, capped: false};
if (++n > cap) return {goal: null, sky, n, edge, capped: true};
if (n % 24 === 0) yield;
if (W.top(x, y) <= z) sky++;
for (const [dx, dy, d] of WAYS) {
const qx = x + dx, qy = y + dy; if (Math.abs(qx - s.x) > R || Math.abs(qy - s.y) > R) { if (!dig && !edge) { const e = step(z, qx, qy, x, y); edge = e !== null && enter(qx, qy, e); } continue; }
const z2 = step(z, qx, qy, x, y), c = v.c + (v.d && v.d !== d ? TURN : 0);
if (z2 !== null) { if (enter(qx, qy, z2)) relax(qx, qy, z2, c + 1 + (z2 < z - 1 && W.ladder && W.ladder(x, y, z, qx, qy, z2) ? 0 : fall(z, z2)), v, d, null); }
else if (dig && W.solid(qx, qy, z + 1) && (!W.can || W.can(x, y, z, dx, dy)) && enter(qx, qy, z + 1)) {
const cells = []; let ok = true;
for (const [cx, cy] of [[x, y], [qx, qy]]) if (W.solid(cx, cy, z + 2)) { ok = ok && W.land(cx, cy, z + 2); cells.push({x: cx, y: cy, z: z + 2, key: "up", d}); }
if (ok && cells.length) relax(qx, qy, z + 1, c + 1 + DIG * cells.length, v, d, cells);
}
if (dig && W.land(qx, qy, z + 1) && (!W.on || W.on(x, y, z, qx, qy))) { const z3 = drop(qx, qy, z); if (enter(qx, qy, z3)) relax(qx, qy, z3, c + 1 + DIG + fall(z, z3), v, d, [{x: qx, y: qy, z: z + 1, key: "use", d}]); }
}
if (dig && W.land(x, y, z) && W.down && W.down(x, y, z)) { const z3 = drop(x, y, z - 1); if (z3 > s.z - 6) relax(x, y, z3, v.c + DIG + fall(z, z3), v, v.d, [{x, y, z, key: "alt", d: null}]); }
}
return {goal: null, sky, n, edge, capped: false};
}
function pathOf(v) { const p = []; for (; v; v = v.from) p.unshift({x: v.x, y: v.y, z: v.z, d: v.from ? v.d : null, digs: v.digs || [], down: !!(v.from && v.from.x === v.x && v.from.y === v.y)}); return p; }
function* find(W, s, o = {}) {
if (out(W, s.x, s.y, s.z)) return {out: true, trapped: false, path: null, blocks: 0, n: 0};
const a = yield* run(W, s, false, o.walk || 3000, 0, 0, o.d);
let g = a.goal, n = a.n; const trapped = !g && !a.capped && !a.edge;
if (!g && (trapped || !o.sky)) { const b = yield* run(W, s, true, o.dig || 6000, 0, 0, o.d); g = b.goal; n += b.n;
if (!g && b.capped) { const tops = []; for (let j = -9; j <= 9; j += 3) for (let i = -9; i <= 9; i += 3) tops.push(W.top(s.x + i, s.y + j));
const zt = tops.sort((p, q) => q - p)[24] - 3;
const c = yield* run(W, s, true, o.far || 12000, 2 * DIG, zt, o.d); g = c.goal; n += c.n; } }
const path = g ? pathOf(g) : null;
return {out: false, trapped, path, n, blocks: path ? path.reduce((t, p) => t + p.digs.length, 0) : 0, sky: path ? path.findIndex((p) => W.top(p.x, p.y) <= p.z) : -1};
}
function holds(W, path) {
const step = stepOf(W), enter = W.enter || (() => true), drop = (x, y, z) => { while (!W.solid(x, y, z)) z--; return z; }, end = path[path.length - 1];
for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], left = b.digs.filter((c) => W.solid(c.x, c.y, c.z));
if (left.some((c) => !W.land(c.x, c.y, c.z)) || !enter(b.x, b.y, b.z)) return false;
if (!left.length) { if (b.down || step(a.z, b.x, b.y, a.x, a.y) !== b.z) return false; }
else if (b.down ? b.z !== drop(b.x, b.y, a.z - 1) : left[0].key === "up" ? b.z !== a.z + 1 || !W.solid(b.x, b.y, b.z) : b.z !== drop(b.x, b.y, a.z)) return false; }
return path.length > 1 && out(W, end.x, end.y, end.z);
}
function now(W, s, o) { const g = find(W, s, o); for (;;) { const r = g.next(); if (r.done) return r.value; } }
const moves = (path) => (path || []).flatMap((p) => [...p.digs.map((c) => ({t: "dig", ...c, d: c.d})), ...(p.d && !p.down ? [{t: "step", d: p.d, x: p.x, y: p.y, z: p.z}] : [])]);
return {find, now, moves, out, holds, DIG};
})();
if (typeof module !== "undefined") module.exports = WayOut;
;
const WayShow = (() => {
const OUT = ["....##....", "...#oo#...", "..#oooo#..", ".#oooooo#.", "#oooooooo#", "####oo####", "...#oo#...", "...#oo#...", "...####..."];
const STILL = 2000, SLICE = 1.5, INK = "#5b3f36", DX = {N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0]};
let gen = null, genKey = "", res = null, posKey = "", stoodAt = 0, cur = null, cap = null, capKey = "", capAt = 0, capSize = [0, 0], capSide = "", fno = 0, landOf = null, landKey = "", lit = null, heading = null, led = false, follow = false, off = false;
const api = {ms: 0, n: 0, runs: 0, get res() { return res; }, get cur() { return fresh(); }, get busy() { return !!gen; }, get led() { return led; }};
const W = {solid: (x, y, z) => solidAt(x, y, z), top: (x, y) => topAt(x, y), land: (x, y, z) => z > LOW + 2 && landSolid(x, y, z) && !Floors.built(x, y, z),
step: (h, x, y, fx, fy) => landAt(h, x, y, fx, fy), ladder: (x, y, z, qx, qy, z2) => Climb.onLadder(x, y, z, qx, qy, z2),
enter: (x, y, z) => { const c = Floors.get(x, y, z); return c && FLOORS ? !SOLID.has(c[1]) : z !== floorAt(x, y) || plainWalk(x, y); },
can: (x, y, h, dx, dy) => topAt(x, y) > h || inHole({x, y}, {x: x + dx, y: y + dy}, h),
on: (x, y, z, qx, qy) => GROUND.has(combAt(qx, qy)) || floorAt(qx, qy) !== z + 1,
down: (x, y) => { const c = combAt(x, y); return !!c && GROUND.has(c) && !":n".includes(c); }};
function clear() { heading = null; gen = null; genKey = ""; res = null; cur = null; }
function tick(now) {
fno++;
const s = me && myId !== null && meObs && !Build.on ? myPos() : null;
if (!s) { led = follow = false; clear(); return hide(now); }
const h = myZ(s.x, s.y), roof = topAt(s.x, s.y) > h, under = roof || !WayOut.out(W, s.x, s.y, h), pk
= s.x + "," + s.y + "," + h;
if (pk !== posKey || walking) { if (pk !== posKey) off = false; posKey = pk; stoodAt = now; }
if (!under) {
const d = (led || follow) && heading && DX[heading], q = d && {x: s.x + d[0], y: s.y + d[1]}, hd = heading, on = !!q && topAt(q.x, q.y) === h + 1 && landAt(h, q.x, q.y, s.x, s.y) === h + 1;
if (!on) led = follow = false; clear();
if (on) { heading = hd; cur = {path: [{x: s.x, y: s.y, z: h, d: null, digs: []}, {x: q.x, y: q.y, z: h + 1, d: hd, digs: []}], digs: [], next: null, now: null, sky: 1, trapped: false}; }
return hide(now);
}
const k = pk + "," + landVer + "," + Floors.ver;
if (k !== genKey) { genKey = k; const i = res && res.path ? res.path.findIndex((p) => p.x === s.x && p.y === s.y && p.z === h) : -1, rest = i >= 0 ? res.path.slice(i) : null;
if (rest && WayOut.holds(W, rest)) { res = {...res, path: rest, sky: res.sky - i}; gen = null; }
else { gen = WayOut.find(W, {x: s.x, y: s.y, z: h}, {d: heading, sky: !roof}); api.runs++; } }
if (gen) { const t0 = performance.now(); let r; do r = gen.next(); while (!r.done && performance.now() - t0 < SLICE); api.ms = performance.now() - t0; if (r.done) { gen = null; res = r.value; api.n = res.n; } }
cur = null;
if (res && res.path && res.trapped) led = true;
if (res && res.path && (led || follow || (!off && now - stoodAt > STILL && roof))) { follow = !led;
cur = from(s, h); if (cur) heading = cur.path[1].d || heading;
}
hide(now);
}
function from(s, h) {
const i = res.path.findIndex((p) => p.x === s.x && p.y === s.y && p.z === h); if (i < 0 || i >= res.path.length - 1) return null;
const path = res.path.slice(i), solid = (c) => solidAt(c.x, c.y, c.z), digs = path.flatMap((p) => p.digs).filter(solid), first = path[1].digs.filter(solid)[0] || null;
return {path, digs, next: digs[0] || null, now: first, sky: res.sky - i, trapped: res.trapped};
}
function fresh() {
if (!cur) return cur; const s = myPos(), h = s && myZ(s.x, s.y), p = cur.path[0];
if (s && p.x === s.x && p.y === s.y && p.z === h) return cur;
return (cur = s && res && res.path ? from(s, h) : null);
}
api.offer = () => { const n = fresh() && cur.now, s = myPos(), moved = !!s && s.x + "," + s.y + "," + myZ(s.x, s.y) !== posKey;
return n ? {key: n.key, text: n.key === "use" ? "Dig on" : n.key === "alt" ? "Dig down" : n.x === s.x && n.y === s.y ? "Dig up" : "Dig a step"} : cur && hops() ? {key: "jump", text: "Jump"} : cur || ((led || follow) && (gen || moved)) ? {} : null; };
const hops = () => !!cur && !cur.now && cur.path.length > 1 && !cur.path[1].down && cur.path[1].z === cur.path[0].z + 1;
api.mine = () => { if (cur && !led) { off = true; follow = false; } };
api.rows = (rows) => rows;
api.land = () => {
if (!cur) return null; const k = genKey + "|" + cur.path.length + "|" + cur.digs.length; if (k === landKey) return landOf; landKey = k;
let from = 0; cur.path.forEach((p, i) => { if (p.digs.some((c) => solidAt(c.x, c.y, c.z))) from = i; });
const on = new Map(); for (const p of cur.path.slice(from)) if (!p.digs.some((c) => solidAt(c.x, c.y, c.z))) on.set(p.x + "," + p.y, p.z);
return (landOf = {on, dim: cur.trapped ? 1 : 0, key: k});
};
const touching = () => document.body.classList.contains("touch");
function hide(now) {
if (cap && capKey && (!cur || fno - capAt > 2)) { cap.style.display = "none"; capKey = ""; }
const b = !touching() || !cur ? null : cur.now ? {up: "tDig", use: "tA", alt: "tB"}[cur.now.key] : hops() ? "tJump" : null;
if (b !== lit) { for (const id of [lit, b]) { const e = id && document.getElementById(id); if (e) e.classList.toggle("way", id === b); } lit = b; }
}
function pin(r, html, pref, not, u) {
if (!cap) { cap = document.createElement("div"); cap.id = "waycap"; document.body.appendChild(cap); }
if (html !== capKey) { capKey = html; cap.innerHTML = html; cap.style.display = "block"; capSize = [cap.offsetWidth, cap.offsetHeight]; capSide = ""; }
const S = (v) => Math.round(v / u) * u, rx = S(r.x), ry = S(r.y), [w, h] = capSize, G = 6, you = [...(Prompts.keep || []), ...(not ? [not] : [])], keys = Target.drew.map((d) => d.r).filter((v) => v);
const my = ry + Math.round(r.h / 2 - h / 2), mx = rx + Math.round(r.w / 2 - w / 2), at = {right: [rx + Math.round(r.w) + G, my], left: [rx - G - w, my], over: [mx, ry - G - h], under: [mx, ry + Math.round(r.h) + G]};
const on = (l) => ([x, y]) => l.some((k) => x < k.x + k.w && k.x < x + w && y < k.y + k.h && k.y < y + h), off = ([x, y]) => x < 4 || y < 4 || x + w > innerWidth - 4 || y + h > innerHeight - 4, onYou = on(you), onKey = on(keys);
const side = pref.includes(capSide) && !off(at[capSide]) && !onYou(at[capSide]) ? capSide : pref.find((k) => !off(at[k]) && !onYou(at[k]) && !onKey(at[k])) || pref.find((k) => !off(at[k]) && !onYou(at[k])) || pref[0];
const p = at[capSide = side];
cap.style.transform = `translate(${Math.round(p[0])}px, ${Math.round(p[1])}px)`; capAt = fno;
}
const bound = (q, css) => { const xs = q.map((v) => v[0] * css), ys = q.map((v) => v[1] * css), x = Math.min(...xs), y = Math.min(...ys); return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y}; };
function hider() {
const H = typeof HdLook !== "undefined" && HdLook.on ? HdLook : null; if (!H || !H.cam) return () => false;
const k = Math.tan(H.cam.pitch * Math.PI / 180) * 2, open = H.win && H.win.a > 0, top = (x, y) => { const w = open && H.winAt(x, y); return w ? Math.min(w[0], topAt(x, y)) : topAt(x, y); };
return (x, y, z, own = true) => { const x0 = Math.floor(x), y0 = Math.floor(y), w = open && H.winAt(x0, y0); if (w && z >= w[0] - 1 && z <= w[1]) return false;
for (let d = own ? 0 : 1; d <= 8; d++) if (top(x0, y0 + d) > z + Math.max(0, y0 + d - y) * k) return true; return false; };
}
function paint(g, at, u, now, css, wall) {
api.block = null; api.hidden = 0; if (!cur) return; const t = now / 1000, me0 = myPos(), R = (v) => Math.round(v / u) * u, beat = Math.floor(t * 3) % 2, solid = (c) => solidAt(c.x, c.y, c.z);
const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(R(x), R(y), w * u, h * u); };
const line = (a, b, col, dash, ph) => { const n = Math.max(1, Math.round(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / u)); for (let i = 0; i <= n; i++) { g.fillStyle = !dash || (((i + ph) % 4) + 4) % 4 < 2 ? col : INK; g.fillRect(R(a[0] + (b[0] - a[0]) * i / n), R(a[1] + (b[1] - a[1]) * i / n), u, u); } };
const fill = (q0, col) => { const q = q0[3][1] < q0[0][1] ? [q0[3], q0[2], q0[1], q0[0]] : q0; g.fillStyle = col; for (let y = R(q[0][1]); y < q[3][1]; y += u) { const k = (y - q[0][1]) / ((q[3][1] - q[0][1]) || 1), l = R(q[0][0] + (q[3][0] - q[0][0]) * k), r = R(q[1][0] + (q[2][0] - q[1][0]) * k); g.fillRect(l, y, r - l, u); } };
const inq = (q, a, b) => { const l = [q[0][0] + (q[3][0] - q[0][0]) * b, q[0][1] + (q[3][1] - q[0][1]) * b], r = [q[1][0] + (q[2][0] - q[1][0]) * b, q[1][1] + (q[2][1] - q[1][1]) * b]; return [l[0] + (r[0] - l[0]) * a, l[1] + (r[1] - l[1]) * a]; };
const pe = ents.get("agent" + myId), ft = pe && at(pe.x + .5, pe.y + .5, myZ(me0.x, me0.y)), hid = hider(); let nh = 0;
g.save(); if (ft) { g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); g.rect(R(ft[0]) - 8 * u, R(ft[1]) - 21 * u, 16 * u, 23 * u); g.clip("evenodd"); }
const P = cur.path, pts = [], k0 = P.findIndex((p, i) => i && p.digs.some(solid)), far = k0 > 1 ? k0 : 1e9;
for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], top = Math.max(a.z, b.z);
const pips = b.digs.filter((c) => solid(c) && c !== cur.next).length;
const put = (x, y, z, o) => pts.push({p: at(x, y, z), i, h: hid(x, y, z), ...o});
if ((a.x !== b.x || a.y !== b.y) && !pips) put((a.x + b.x) / 2 + .5, (a.y + b.y) / 2 + .5, top);
for (let z = top - 1; z > b.z; z--) put(b.x + .5, b.y + .5, z);
put(b.x + .5, b.y + .5, b.z, {pips}); }
const wave = Math.floor(t * 9) % (pts.length + 5);
pts.forEach(({p, i, pips, h}, j) => { if (!p) return; const on = j === wave || j === wave - 1, o = j % 2 ? 0 : (j % 4 ? u : -u), v = P[i].d, ox = v === "N" || v === "S" ? o : 0, oy = ox ? 0 : o;
if (h) { nh++; g.globalAlpha = .6; rect(p[0] - u + ox, p[1] - u + oy, 1, 1, pips ? "#ff9d3c" : "#ffe08a"); rect(p[0] + ox, p[1] + oy, 1, 1, pips ? "#ff9d3c" : "#ffe08a"); g.globalAlpha = 1; }
else if (pips) { rect(p[0] - 3 * u, p[1] - 3 * u, 6, 6, INK); rect(p[0] - 2 * u, p[1] - 2 * u, 4, 4, on ? "#ffe08a" : "#ff9d3c"); rect(p[0] - u, p[1] - u, 2, 2, INK); }
else if (i > far) { rect(p[0] - u + ox, p[1] - u + oy, 3, 3, INK); rect(p[0] + ox, p[1] + oy, 1, 1, on ? "#ffffff" : "#ffe08a"); }
else if (on) { rect(p[0] - 3 * u + ox, p[1] - 3 * u + oy, 6, 6, INK); rect(p[0] - 2 * u + ox, p[1] - 2 * u + oy, 4, 4, "#ffffff"); }
else { rect(p[0] - 2 * u + ox, p[1] - 2 * u + oy, 4, 4, INK); rect(p[0] - u + ox, p[1] - u + oy, 2, 2, "#ffe08a"); } });
const end = P[P.length - 1], sk = at(end.x + .5, end.y + .5, end.z); let edge = null; api.out = null;
if (sk) { const tch = touching(), m = 16, sx = sk[0] * css, sy = (sk[1] - 9 * u) * css, cl = (v, a, b) => Math.max(a, Math.min(b, v)); let x = cl(sx, m, innerWidth - m), y = cl(sy, m + (tch ? 44 : 0), innerHeight - (tch ? 150 : 100));
if (tch && x === sx && y === sy) for (const e of document.querySelectorAll("#tctx div, #tbtns div, #ttop div")) { const r = e.getBoundingClientRect(); if (r.width && sx > r.left - 8 && sx < r.right + 8 && sy > r.top - 30 && sy < r.bottom + 8) x = r.left - m; }
if (x !== sx || y !== sy) edge = [x / css, y / css, Math.abs(sx - x) >= Math.abs(sy - y) ? [Math.sign(sx - x), 0] : [0, Math.sign(sy - y)]]; }
if (sk && !edge) { const x = sk[0], y = sk[1], top = y - (beat ? 14 : 13) * u; api.out = [x * css, y * css]; if (hid(end.x + .5, end.y + .5, end.z)) { nh++; g.globalAlpha = .45; }
rect(x - 4 * u, y - 4 * u, 8, 8, INK); rect(x - 3 * u, y - 3 * u, 6, 6, "#ffe08a"); rect(x - 2 * u, y - 2 * u, 4, 4, "#ff9d3c"); rect(x - u, y - u, 2, 2, "#fff8e8");
OUT.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") rect(x + (i - 5) * u, top + j * u, 1, 1, ch === "#" ? INK : beat ? "#ffffff" : "#ffe08a"); })); g.globalAlpha = 1; }
let box = null; const c = cur.next, W = c && wall && wall(c.x, c.y, c.z), A = W || at, T = c && [A(c.x, c.y, c.z), A(c.x + 1, c.y, c.z), A(c.x + 1, c.y + 1, c.z), A(c.x, c.y + 1, c.z)], B = c && [A(c.x, c.y + 1, c.z - 1), A(c.x + 1, c.y + 1, c.z - 1)];
if (c && T.every((v) => v) && B.every((v) => v)) { if (!W && hid(c.x + .5, c.y + .5, c.z, false)) { nh++; g.globalAlpha = .5; }
const F = [T[3], T[2], B[1], B[0]], col = beat ? "#ffffff" : "#fff1a8", ph = -Math.floor(t * 8), dug = progress && (myAction || pendingAct) && /^dig/.test(progress.tool) ? Math.min(1, (performance.now() - progress.t0) / progress.ms) : 0;
fill(T, beat ? "rgba(255,190,70,.5)" : "rgba(255,150,40,.38)"); fill(F, `rgba(230,110,30,${(.46 + .3 * dug).toFixed(2)})`);
const cr = (q, l) => l.map(([a, b]) => inq(q, a, b)), cracks = [cr(T, [[.18, .3], [.42, .48], [.36, .7], [.62, .62], [.82, .86]]), cr(F, [[.62, 0], [.55, .4], [.68, .7], [.6, 1]]), cr(T, [[.42, .48], [.7, .2], [.9, .34]]), cr(F, [[.55, .4], [.3, .55], [.2, 1]]), cr(T, [[.36, .7], [.12, .8]]), cr(F, [[.68, .7], [.9, .8]])];
cracks.slice(0, 2 + Math.round(dug * 4)).forEach((l) => { for (let i = 1; i < l.length; i++) line(l[i - 1], l[i], "rgba(60,36,30,.85)"); });
const E = [[T[0], T[1]], [T[1], T[2]], [T[3], T[2]], [T[0], T[3]], [T[3], B[0]], [T[2], B[1]], [B[0], B[1]]];
for (const [a, b] of E) { line(a, b, col, true, ph); line([a[0], a[1] - u], [b[0], b[1] - u], col, true, ph); }
g.globalAlpha = 1;
box = api.block = bound([...T, ...B], css); const word = touching() ? (c.key === "up" ? "" : c.key === "use" ? "A" : "B") : capOf(c.key), turn = c.x === me0.x && c.y !== me0.y ? `<i class="${c.y < me0.y ? "N" : "S"}${word ? "" : " go"}"></i>` : "";
if (c === cur.now && (word || turn)) pin(box, turn + esc(word), ft && (T[0][0] + T[1][0]) / 2 < ft[0] - u ? ["left", "over", "right", "under"] : ["right", "over", "left", "under"], null, u * css);
}
if (!cur.now && P[1].d && pe) { const b = P[1], [dx, dy] = DX[b.d], lv = typeof HdLook !== "undefined" && HdLook.level[2] !== null ? HdLook.level[2] : myZ(me0.x, me0.y), ex = pe.x + dx, ey = pe.y + dy;
const q = [at(ex, ey, lv), at(ex + 1, ey, lv), at(ex + 1, ey + 1, lv), at(ex, ey + 1, lv)];
if (q.every((v) => v)) pin(bound(q, css), `<i class="${b.d}${hops() && !touching() ? "" : " go"}"></i>` + (hops() && !touching() ? esc(capOf("jump")) : ""), b.d === "E" || b.d === "W" ? ["over", "under", b.d === "E" ? "right" : "left"] : ["right", "left", "over", "under"], box, u * css); }
g.restore(); api.hidden = nh; api.dots = pts.length;
if (edge) { const [x, y, d] = edge, tri = (n, back, col) => { for (let i = 0; i < n; i++) rect(x - (i + back) * u * d[0] - (d[0] ? 0 : i * u), y - (i + back) * u * d[1] - (d[1] ? 0 : i * u), d[0] ? 1 : 2 * i + 1, d[1] ? 1 : 2 * i + 1, col); };
tri(7, -1, INK); tri(5, 1, beat ? "#ffffff" : "#fff1a8"); }
}
api.paint = paint; api.tick = tick;
{ const f0 = frame; frame = function (now) { try { tick(performance.now()); } catch (e) { clear(); } f0(now); }; }
return api;
})();
;
const HdSun = (() => {
const UP = RELIEF_STEP, bms = new Map(), sils = new Map(), poses = new Map(), SUN = [0xe0000000, 0xc0000000], LAMP = [0xff000000, 0xa0000000];
let H = {on: false, night: false, kx: 0, ky: 0, sun: 0}, sid = "";
function hour() {
const h = SunLand.hour(), want = !!opt("shadows") && !!opt("depth");
H = {on: want && h.alpha > .02, night: want && h.dark > .35, kx: Math.round(h.kx * 8) / 8, ky: Math.round(h.ky / .6 * 8) / 8, sun: Math.min(1, h.alpha / SunLand.SHADE.alpha)};
return H;
}
const key = () => { hour(); return H.on ? H.kx + "," + H.ky : H.night ? "n" + fireAt.length : "-"; };
function lamp(x, y) {
let best = null, bd = SunLand.SHADE.fire;
const see = (fx, fy) => { const d = Math.hypot(x - fx, y - fy); if (d < bd && d > .2) { bd = d; best = [fx, fy]; } };
for (const f of fireAt) see(f.x + .5, f.y + .5);
for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const c = combAt(Math.floor(x) + i, Math.floor(y) + j); if (c === "^" || c === "x") see(Math.floor(x) + i + .5, Math.floor(y) + j + .5); }
if (!best) return null; const k = Math.min(1.5, .5 + bd * .2) / bd;
return [Math.round((x - best[0]) * k * 4) / 4, Math.round((y - best[1]) * k * 4) / 4];
}
const way = (x, y) => (H.on ? [H.kx, H.ky, SUN] : H.night ? ((v) => v && [v[0], v[1], LAMP])(lamp(x, y)) : null);
function picture(k, ox, oy, v, each) {
if (sid !== HdThings.sheet.id) { bms.clear(); sid = HdThings.sheet.id; }
const kk = [k, ox & 15, oy & 15, v[0], v[1], v[2][0]].join(); let bm = bms.get(kk); if (bm) return bm;
const on = new Set(), P = (x, y) => (x + 2048) * 4096 + y + 2048; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
each((gx, gy, h0, h1) => { for (let t = h0; t <= h1; t += .5) { const x = Math.round((ox & 15) + gx + v[0] * t), y = Math.round((oy & 15) + gy + v[1] * t); on.add(P(x, y)); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } });
if (x1 < x0) { bm = null; bms.set(kk, bm); return bm; }
const X = Math.floor(x0 / 16) * 16, Y = Math.floor(y0 / 16) * 16, w = Math.ceil((x1 + 1 - X) / 16) * 16, h = Math.ceil((y1 + 1 - Y) / 16) * 16, has = (x, y) => on.has(P(x, y)), rooms = new Map();
const px = (x, y) => (!has(x, y) ? 0 : has(x - 1, y) && has(x + 1, y) && has(x, y - 1) && has(x, y + 1) ? v[2][0] : v[2][1]);
bm = {x: X, y: Y, w, h, chunk(i, j) { const c = i + "," + j; if (!rooms.has(c)) { let any = false; for (let b = 0; b < 16 && !any; b++) for (let a = 0; a < 16; a++) if (has(X + i * 16 + a, Y + j * 16 + b)) { any = true; break; }
rooms.set(c, any ? HdThings.room("sun" + kk + "#" + c, 16, 16, (put) => { for (let b = 0; b < 16; b++) for (let a = 0; a < 16; a++) put(a, b, px(X + i * 16 + a, Y + j * 16 + b)); }) : null); } return rooms.get(c); }};
bms.set(kk, bm); return bm;
}
function surface(X, Y, L) {
const c = Voxels.host.column(X, Y); if (!c || !c.length || Voxels.host.water(X, Y)) return null;
let t = c[c.length - 1], roof = null; const cells = Floors.any(X, Y) && Floors.cells(X, Y);
if (cells && cells.size) { let top = -1e9, kind = ""; for (const [z, [k]] of cells) if (z > top) { top = z; kind = k; }
if (kind === "stairs" || Floors.alpha(X, Y, top) < 1) return null; if (L === undefined || top - L <= 1) { t = top; if (kind === "roof") roof = HdThings.pitch(X, Y, top); } }
return L !== undefined && (t - L > 1 || t - L < -4) ? null : {z: t, roof};
}
function piece(out, s, ox, oy, a0, a1, b0, b1, ch, wx, wy, at) {
const R = s.roof, cutY = R && R.split && b0 < 8 && b1 > 8 ? [[b0, 8], [8, b1]] : [[b0, b1]];
for (const [c0, c1] of cutY) { const b = {x: ox + a0, y: oy + c0, z: s.z * UP + .5, w: a1 - a0, d: c1 - c0, h: 0, top: ch, win: [wx, wy + c0 - b0], shade: true, sheet: HdThings.sheet};
if (R) b.tilt = [R.hat(R.up + c0 / 16), R.hat(R.up + c1 / 16)]; out.push(at ? [at[0], at[1], b] : b); }
}
function lay(out, x, y, L, bm, px, py, wrap) {
for (let ty = Math.floor(py / 16); ty * 16 < py + bm.h; ty++) for (let tx = Math.floor(px / 16); tx * 16 < px + bm.w; tx++) {
const s = surface(x + tx, y + ty, L); if (!s) continue;
const x0 = Math.max(px, tx * 16), x1 = Math.min(px + bm.w, tx * 16 + 16), y0 = Math.max(py, ty * 16), y1 = Math.min(py + bm.h, ty * 16 + 16);
for (let cj = (y0 - py) >> 4; cj * 16 < y1 - py; cj++) for (let ci = (x0 - px) >> 4; ci * 16 < x1 - px; ci++) {
const ch = bm.chunk(ci, cj); if (!ch) continue;
const a0 = Math.max(x0, px + ci * 16), a1 = Math.min(x1, px + ci * 16 + 16), b0 = Math.max(y0, py + cj * 16), b1 = Math.min(y1, py + cj * 16 + 16);
piece(out, s, tx * 16, ty * 16, a0 - tx * 16, a1 - tx * 16, b0 - ty * 16, b1 - ty * 16, ch, a0 - px - ci * 16, b0 - py - cj * 16, wrap && [x, y]);
}
}
}
const lands = new Map(), tops = new Map(); let lkey = null;
const topOf = (x, y) => { const k = x + "," + y; let t = tops.get(k); if (t === undefined) { const c = Voxels.host.column(x, y); t = c && c.length ? c[c.length - 1] : null; tops.set(k, t); } return t; };
function land(out, x, y) {
if (!H.on) return; const lk = lkey; if (!lk || lk[0] !== landVer || lk[1] !== Floors.ver || lk[2] !== H.kx || lk[3] !== H.ky || lk[4] !== HdThings.sheet.id || lands.size > 8000) { lands.clear(); tops.clear(); lkey = [landVer, Floors.ver, H.kx, H.ky, HdThings.sheet.id]; }
const s = surface(x, y); if (!s) return; const k = x + "," + y + "," + s.z; let ch = lands.get(k);
if (ch === undefined) { ch = null; const src = [], sg = H.kx < 0 ? 1 : -1, nx = Math.ceil(96 * Math.abs(H.kx) / 16), ny = Math.ceil(96 * H.ky / 16);
for (let j = -1; j <= ny + 1; j++) for (let i = -1; i <= nx + 1; i++) { if (!i && !j) continue; const T = topOf(x + sg * i, y - j); if (T !== null && (T - s.z) * UP >= 16) src.push([sg * i * 16, -j * 16, Math.min(96, (T - s.z) * UP)]); }
if (src.length) { const kx = H.kx, ky = H.ky, ns = src.length, sx = new Float32Array(ns), sy = new Float32Array(ns), sh = new Float32Array(ns); src.forEach((q, i) => { sx[i] = q[0]; sy[i] = q[1]; sh[i] = q[2]; });
const dark = (gx, gy) => { gx += .5; gy += .5; for (let i = 0; i < ns; i++) { let p0, p1, q0, q1;
if (kx) { const a = (gx - sx[i] - 16) / kx, b = (gx - sx[i]) / kx; p0 = a < b ? a : b; p1 = a < b ? b : a; } else if (gx >= sx[i] && gx < sx[i] + 16) { p0 = 0; p1 = 1e9; } else continue;
if (ky) { const a = (gy - sy[i] - 16) / ky, b = (gy - sy[i]) / ky; q0 = a < b ? a : b; q1 = a < b ? b : a; } else if (gy >= sy[i] && gy < sy[i] + 16) { q0 = 0; q1 = 1e9; } else continue;
if (Math.max(p0, q0, 0) < Math.min(p1, q1, sh[i])) return true; } return false; };
const m = new Uint8Array(18 * 18); let any = false, str = ""; for (let b = -1; b <= 16; b++) for (let a = -1; a <= 16; a++) if (dark(a, b)) m[(b + 1) * 18 + a + 1] = 1;
const v = (a, b) => (!m[(b + 1) * 18 + a + 1] ? 0 : m[(b + 1) * 18 + a] && m[(b + 1) * 18 + a + 2] && m[b * 18 + a + 1] && m[(b + 2) * 18 + a + 1] ? 1 : 2);
for (let b = 0; b < 16; b++) for (let a = 0; a < 16; a++) { const q = v(a, b); str += q; if (q) any = true; }
if (any) ch = HdThings.room("ls" + str, 16, 16, (put) => { for (let b = 0; b < 16; b++) for (let a = 0; a < 16; a++) { const q = v(a, b); put(a, b, q ? SUN[q - 1] : 0); } }); }
lands.set(k, ch); }
if (ch) piece(out, s, 0, 0, 0, 16, 0, 16, ch, 0, 0);
}
const landAt = (x, y) => { hour(); const o = []; land(o, x, y); return o.length > 0; };
const open = (x, y, L, roofed) => { const c = Voxels.host.column(x, y); if (!c || !c.length || c[c.length - 1] > L) return false; const cells = !roofed && Floors.any(x, y) && Floors.cells(x, y); if (cells) for (const z of cells.keys()) if (z > L) return false; return true; };
function thing(out, x, y, L, P, dx, dy, r2) {
if (!open(x, y, L)) return; const v = way(x + .5, y + (dy + r2) / 16); if (!v) return;
const bm = picture("t" + P.key + "," + r2, dx, dy + r2, v, (put) => { for (let j = 0; j < Math.min(P.h, r2); j++) for (let i = 0; i < P.w; i++) if ((P.px[j * P.w + i] >>> 24) >= 128) put(i, 0, r2 - 1 - j, r2 - j); });
if (bm) lay(out, x, y, L, bm, bm.x + ((dx >> 4) << 4), bm.y + (((dy + r2) >> 4) << 4));
}
function box(out, x, y, L, r, h0, h1, built) {
if (!built && !open(x, y, L, true)) return; const v = way(x + .5, y + .5); if (!v) return;
const bm = picture("b" + [r[2] - r[0], r[3] - r[1], Math.round(h0), Math.round(h1)], r[0], r[1], v, (put) => { for (let j = 0; j < r[3] - r[1]; j++) for (let i = 0; i < r[2] - r[0]; i++) put(i, j, Math.round(h0), Math.round(h1)); });
if (bm) lay(out, x, y, L, bm, bm.x + ((r[0] >> 4) << 4), bm.y + ((r[1] >> 4) << 4));
}
function body(out, s) {
const kind = s.q.e ? s.q.e.kind || "agent" : "agent", X = Math.floor(s.x), Y = Math.floor(s.y + .42), Z = s.zh ?? s.z; if (!open(X, Y, Z)) return; const v = way(s.x, s.y); if (!v) return;
const c = s.canvas, pk = c._h === undefined ? undefined : kind + c._h; let sk = pk === undefined ? undefined : poses.get(pk), S = sk ? sils.get(sk) : null;
if (sk === undefined || (sk && !S)) { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let hsh = 0, n = 0;
for (let i = 3, k = 0; i < d.length; i += 4, k++) if (d[i] >= 128) { hsh = (Math.imul(hsh, 31) + k) | 0; n++; }
sk = n ? kind + hsh + "," + n : null; if (pk !== undefined) { if (poses.size > 600) poses.clear(); poses.set(pk, sk); } S = sk ? sils.get(sk) : null;
if (sk && !S) { const px = []; let low = 0; for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] >= 128) { px.push([i - s.fx, j]); low = Math.max(low, j); }
if (sils.size > 300) sils.clear(); S = px.map(([i, j]) => [i, low - j]); sils.set(sk, S); } }
if (!sk) return;
if (bms.size > 1500) bms.clear();
const bm = picture("e" + sk, 0, 0, v, (put) => { for (const [i, h] of S) put(i, 0, h, h + 1); });
if (bm) lay(out, X, Y, Z, bm, bm.x + Math.round((s.x - X) * 16), bm.y + Math.round((s.y + .42 - Y) * 16), true);
}
return {key, thing, box, body, way, land, landAt, surface, get sun() { return H.on ? H.sun : 1; }, get hour() { return H; }};
})();
;
const HdThings = (() => {
const SW = 1024, SH = 1024, sheet = {px: new Uint32Array(SW * SH), w: SW, id: "hd"}, rooms = new Map(), pixs = new Map(), UP = RELIEF_STEP, LEAN = 0, PITCH = 4, plans = new Set(), FH = 16 + UP;
let nx = 0, ny = 0, tall = 0, ids = 0, scratch = null;
const KF = () => Math.cos((HdLook.cam.base || HdLook.cam.pitch) * Math.PI / 180);
function room(key, w, h, fill) {
let p = rooms.get(key); if (p) return p;
if (nx + w > SW) { nx = 0; ny += tall; tall = 0; }
if (ny + h > SH) { rooms.clear(); sheet.px.fill(0); nx = ny = tall = 0; sheet.id = "hd" + (++ids); }
p = [nx, ny]; const ox = nx, oy = ny; fill((i, j, v) => { if (i >= 0 && j >= 0 && i < w && j < h) sheet.px[(oy + j) * SW + ox + i] = v; });
nx += w; tall = Math.max(tall, h); rooms.set(key, p); return p;
}
function pix(img, sx, sy, w, h) {
if (!img._hd) img._hd = ++ids; const key = img._hd + "|" + sx + "," + sy + "," + w + "," + h; let p = pixs.get(key); if (p) return p;
scratch = scratch || document.createElement("canvas"); scratch.width = w; scratch.height = h; const g = scratch.getContext("2d", {willReadFrequently: true});
g.clearRect(0, 0, w, h); g.drawImage(img, sx, sy, w, h, 0, 0, w, h); p = {px: new Uint32Array(g.getImageData(0, 0, w, h).data.buffer.slice(0)), w, h, key}; pixs.set(key, p); return p;
}
function painted(w, h, fn) {
const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
const keep = ctx, kz = zoom; ctx = g; zoom = 1; try { fn(g); } catch (e) {  } finally { ctx = keep; zoom = kz; }
return c;
}
const shotOf = (key, w, h, fn) => { let p = pixs.get(key); if (!p) { p = pix(painted(w, h, fn), 0, 0, w, h); p.key = key; pixs.set(key, p); } return p; };
const solid = (v) => (v >>> 24) >= 128;
const cut = (P, c0, c1, r0, r1, rep) => room(P.key + "c" + [c0, c1, r0, r1, rep], c1 - c0, rep || r1 - r0, (put) => { for (let j = 0; j < (rep || r1 - r0); j++) for (let i = c0; i < c1; i++) put(i - c0, j, P.px[(rep ? r0 : r0 + j) * P.w + i]); });
const side = (P, c0, c1, r0, r1, w, east) => room(P.key + "s" + [c0, c1, r0, r1, w, east], w, r1 - r0, (put) => { for (let j = r0; j < r1; j++) { let v = 0, n = 0;
for (let i = east ? c1 - 1 : c0; i >= c0 && i < c1 && n < 2; i += east ? -1 : 1) if (solid(P.px[j * P.w + i])) { v = P.px[j * P.w + i]; n++; }
for (let i = 0; i < w; i++) put(i, j - r0, v); } });
function push(out, b) {
for (let i = 0; i < b.w; i += 16) for (let j = 0; j < b.d; j += 16) for (let k = 0; k < (b.fh ? 1 : Math.max(1, b.h)); k += 16) {
const w = Math.min(16, b.w - i), d = Math.min(16, b.d - j), h = b.fh ? b.h : Math.min(16, b.h - k), o = (p, a, c) => (p ? [p[0] + a, p[1] + c] : null);
out.push({x: b.x + i, y: b.y + j, z: b.z + b.h - k - h, w, d, h, fh: b.fh, shade: b.shade, tilt: b.tilt, k: b.k, sheet, top: k === 0 ? o(b.top, i, j) : null, front: j + 16 >= b.d ? o(b.front, i, k) : null, west: i === 0 ? o(b.west, j, k) : null, east: i + 16 >= b.w ? o(b.east, j, k) : null});
}
}
const CARD = {B: [10, 28, 32], C: [3, 8, 14], L: [1, 12, 15], "&": [2, 7, 13], e: [1, 8, 15], y: [1, 7, 15], q: [1, 7, 14]}, PLAIN = {J: 42}, cards = new Map();
const span = (P, r0, r1) => { let c0 = P.w, c1 = 0; for (let j = Math.max(0, r0); j < Math.min(P.h, r1); j++) for (let i = 0; i < P.w; i++) if (solid(P.px[j * P.w + i])) { c0 = Math.min(c0, i); c1 = Math.max(c1, i + 1); } return c1 > c0 ? [c0, c1] : [0, P.w]; };
function card(c, x, y, spr, X = 0) {
const S = CARD[c]; if (!S || !spr || !spr[0] || !spr[0].width) return null;
const [img, sx, sy, sw, sh, dx, dy] = spr, P = pix(img, sx, sy, sw, sh), [r0, rS, r2] = S, n = rS - r0, k = Math.max(-8, Math.min(8, Math.round(X * LEAN * n))), key = P.key + "|" + k;
let cd = cards.get(key); if (cd) return cd;
const a = Math.abs(k), off = k > 0 ? a : 0, W2 = sw + a, cv2 = document.createElement("canvas"); cv2.width = W2; cv2.height = sh;
const g = cv2.getContext("2d"), im = g.createImageData(W2, sh), o = new Uint32Array(im.data.buffer), [c0, c1] = span(P, rS, r2), lean = (j) => (j >= rS ? 0 : -Math.sign(k) * Math.round(a * (rS - j) / n));
for (let t = 1; t <= a; t++) { const jt = rS - Math.round(t / a * n), X0 = (k > 0 ? c0 - t : c1 - 1 + t) + off;
for (let i = 0; i < r2 - rS; i++) { let v = 0, m = 0; for (let q = k > 0 ? c0 : c1 - 1; q >= c0 && q < c1 && m < 2; q += k > 0 ? 1 : -1) if (solid(P.px[(rS + i) * sw + q])) { v = P.px[(rS + i) * sw + q]; m++; } if (v && jt + i >= 0) o[(jt + i) * W2 + X0] = v; } }
for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) { const v = P.px[j * sw + i]; if (solid(v)) o[j * W2 + i + off + lean(j)] = v; }
const b = [W2, sh, 0, 0]; for (let j = 0; j < sh; j++) for (let i = 0; i < W2; i++) if (o[j * W2 + i]) { b[0] = Math.min(b[0], i); b[1] = Math.min(b[1], j); b[2] = Math.max(b[2], i + 1); b[3] = Math.max(b[3], j + 1); }
g.putImageData(im, 0, 0); cd = {canvas: cv2, fx: 8 - dx + off, fy: r2, y: (dy + r2) / 16, lean: k, b, still: true, d: true}; cards.set(key, cd); return cd;
}
const oval = (w, d) => room("o" + [w, d], w, d, (put) => { for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) { const u = (i + .5) / w * 2 - 1, v = (j + .5) / d * 2 - 1; if (u * u + v * v <= 1) put(i, j, 0xff000000); } });
const shaded = (c) => isObject(c) && !is(c) && !"f;\"wgVl".includes(c);
function foot(c, spr) { if (CARD[c]) return CARD[c][2]; if (PLAIN[c] !== undefined) return PLAIN[c]; const P = pix(spr[0], spr[1], spr[2], spr[3], spr[4]), has = (j) => { for (let i = 0; i < P.w; i++) if (solid(P.px[j * P.w + i])) return true; return false; }; let r = P.h; while (r > 1 && !has(r - 1)) r--; return r; }
function shade(out, c, x, y, base, L) {
const spr = objectSprite(c, x, y, 0); if (!spr || !spr[0] || !spr[0].width) return;
const P = pix(spr[0], spr[1], spr[2], spr[3], spr[4]), r2 = foot(c, spr);
const [c0, c1] = span(P, r2 - 4, r2), tall = P.h >= 40 && !CARD[c] && PLAIN[c] === undefined, w = tall ? 22 : c1 - c0 + 4, d = CARD[c] ? 11 : tall ? 9 : 8, mid = (c0 + c1) / 2;
push(out, {x: Math.round(spr[5] + mid - w / 2), y: spr[6] + r2 - d + 4, z: base + .5, w, d, h: 0, top: oval(w, d), shade: true});
if (L !== undefined && c !== "^" && c !== "x") HdSun.thing(out, x, y, L, P, spr[5], spr[6], r2);
}
const cast = (out, x, y, zl, r, h0, h1, built) => { if (!ghosting && (built || zl === floorAt(x, y))) HdSun.box(out, x, y, built ? floorAt(x, y) : zl, r, h0, h1, built); };
function shadow(w, d, z) { const l = []; push(l, {x: -Math.round(w / 2), y: -Math.round(d / 2), z, w, d, h: 0, top: oval(w, d), shade: true}); return l; }
function decal(out, c, x, y, base) { const spr = objectSprite(c, x, y, 0); if (!spr || !spr[0] || !spr[0].width) return; push(out, {x: spr[5] - 1, y: spr[6] - 1, z: base + .5, w: spr[3] + 2, d: spr[4] + 2, h: 0, top: flat(0xff000000, spr[3] + 2, spr[4] + 2, 0xff000000), shade: true}); push(out, {x: spr[5], y: spr[6], z: base + 1, w: spr[3], d: spr[4], h: 0, top: cut(pix(spr[0], spr[1], spr[2], spr[3], spr[4]), 0, spr[3], 0, spr[4])}); }
const tints = new Map(), L0 = 5, R0 = 11;
function tint(c, x, y, at) {
let t = tints.get(c); if (t) return t;
const P = pix(painted(16, 16, () => Structures.drawWall(c === "+" ? "W" : c, x, y, () => 0, () => 4, 16, 0, 1, at)), 0, 0, 16, 16), cap = P.px[2 * 16 + 8], ink = [P.px[8], P.px[2 * 16 + 5], P.px[2 * 16]].find((v) => solid(v) && v !== cap);
if (!solid(cap) || !ink) return {ink: 0xff604c75, cap: 0xff6c9ac4}; t = {ink, cap}; tints.set(c, t); return t;
}
const flat = (v, w, h, inkv, edges = "") => room("f" + [v, w, h, inkv, edges], w, h, (put) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(i, j, (edges.includes("n") && !j) || (edges.includes("s") && j === h - 1) || (edges.includes("w") && !i) || (edges.includes("e") && i === w - 1) ? inkv : v); });
function planks(c, X, w, h) {
const stone = c === "%", g = stone ? genCell("stone_wall") : null, P = stone ? pix(IMG.gen, g[0], g[1] + 2, 16, 12) : pix(IMG.house_walls, 56, 4, 16, 12);
return room("p" + [stone, X, w, h], w, h, (put) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = P.px[((j + 12 - (h % 12)) % 12) * 16 + X + i]; put(i, j, solid(v) ? v : P.px[5 * 16 + 1]); } });
}
let ghosting = false; const isWall = (x, y, z) => Structures.WALLS.includes(Floors.thingAt(x, y, z) || "-") || (ghosting && plans.has(x + "," + y + "," + z));
const doorsAt = new Map(), doorOpen = (x, y) => doorsAt.set(x + "," + y, [x, y]) && [[0, 0], [0, -1], [0, 1], [1, 0], [-1, 0]].some(([dx, dy]) => occupied.has((x + dx) + "," + (y + dy)));
function wall(out, c, x, y, zl, h) {
const n = isWall(x, y - 1, zl), s = isWall(x, y + 1, zl), w = isWall(x - 1, y, zl), e = isWall(x + 1, y, zl), T = tint(c, x, y, zl), z = zl * UP;
const rows = (hh) => Math.max(1, Math.round(hh * KF()));
const part = (x0, x1, y0, y1, hh, ed, front, pc = c) => { cast(out, x, y, zl, [x0 - 1, y0 - 1, x1 + 1, y1 + 1], 0, hh); push(out, {x: x0, y: y0, z, w: x1 - x0, d: y1 - y0, h: hh, fh: rows(hh), top: flat(T.cap, x1 - x0, y1 - y0, T.ink, ed), front: front ? planks(pc, x0, x1 - x0, rows(hh)) : null,
west: x0 === 0 ? null : flat(planksTone(pc), Math.min(16, y1 - y0), rows(hh), T.ink, "n"), east: x1 === 16 ? null : flat(planksTone(pc), Math.min(16, y1 - y0), rows(hh), T.ink, "n")}); };
if (c === "+" && Structures.sideDoor(x, y, zl)) {
part(L0, R0, 0, 4, h, "we", true); part(L0, R0, 12, 16, h, "wes", true);
if (!doorOpen(x, y)) { const D = pix(IMG.door, 80, 0, 16, 16), lv = D.px[8 * 16 + 6]; push(out, {x: 6, y: 4, z, w: 4, d: 8, h: h * .9, fh: rows(h * .9), top: flat(lv, 4, 8, T.ink, "we"), west: flat(lv, 8, rows(h * .9), T.ink, "n"), east: flat(lv, 8, rows(h * .9), T.ink, "n")}); }
return;
}
if (c === "+") {
const D = pix(IMG.door, (doorOpen(x, y) ? 0 : 5) * 16, 0, 16, 16), hh = Math.min(h, UP), fh = Math.min(16, rows(hh)), up = h - hh > .5 ? h - hh : 0, fu = rows(up);
cast(out, x, y, zl, [-1, L0 - 1, 17, R0 + 1], 0, h); push(out, {x: 0, y: L0, z, w: 16, d: 6, h: hh, fh, top: up ? null : flat(T.cap, 16, 6, T.ink, "ns"), front: cut(D, 0, 16, 16 - fh, 16), west: flat(T.ink, 6, fh, T.ink), east: flat(T.ink, 6, fh, T.ink)});
if (up) push(out, {x: 0, y: L0, z: z + hh, w: 16, d: 6, h: up, fh: fu, top: flat(T.cap, 16, 6, T.ink, "ns"), front: planks(c, 0, 16, fu), west: flat(T.ink, 6, fu, T.ink), east: flat(T.ink, 6, fu, T.ink)});
return;
}
const x0 = w ? 0 : L0, x1 = e ? 16 : R0;
part(x0, x1, L0, R0, h, (n ? "" : "n") + (s ? "" : "s") + (w ? "" : "w") + (e ? "" : "e"), true);
if (n) part(L0, R0, 0, L0, h, "we", false);
if (s) part(L0, R0, R0, 16, h, "we", true);
}
const tones = new Map(), planksTone = (c) => { let v = tones.get(c); if (v === undefined) { const u = planks(c, 0, 16, 12); v = sheet.px[(u[1] + 5) * SW + u[0] + 7]; tones.set(c, v); } return v; };
function fence(out, x, y, base) {
const spr = fenceSprite(x, y), P = pix(spr[0], spr[1], spr[2], 16, 16), dy = spr[6], f = (dx, ddy) => "#+g".includes(combAt(x + dx, y + ddy) || "-");
const rail = P.px[8 * 16 + 7] || P.px[6 * 16 + 7], dark = P.px[12 * 16 + 5] || rail, Y1 = 12;
const run = f(0, -1) && f(0, 1) && !f(-1, 0) && !f(1, 0) && combAt(x, y) === "#", post = !run || !(y & 1), L = base / UP, sun = (r, h0, h1) => cast(out, x, y, L, r, h0, h1), FK = UP / 12;
if (post) { sun([4, Y1 - 5, 12, Y1 + 1], 0, UP); push(out, {x: 5, y: Y1 - 4, z: base, w: 6, d: 4, h: UP, fh: 12, top: cut(P, 5, 11, 2, 6), front: cut(P, 5, 11, 2, 14), west: side(P, 5, 11, 2, 14, 4, 0), east: side(P, 5, 11, 2, 14, 4, 1)}); }
for (const [on, c0, c1] of [[f(-1, 0), 0, 5], [f(1, 0), 11, 16]]) if (on) { for (const rz of [3, 8]) sun([c0, Y1 - 3, c1, Y1 - 1], rz * FK, (rz + 2) * FK); push(out, {x: c0, y: Y1 - 3, z: base, w: c1 - c0, d: 2, h: UP, fh: 12, top: null, front: cut(P, c0, c1, 2, 14)}); }
for (const [on, y0, y1] of post ? [[f(0, -1), 0, Y1 - 4], [f(0, 1), Y1, 16]] : [[true, 0, 16]]) if (on) for (const rz of [3, 8]) { sun([6, y0, 10, y1], rz * FK, (rz + 2) * FK);
push(out, {x: 6, y: y0, z: base + rz * FK, w: 3, d: y1 - y0, h: 2 * FK, fh: 2, top: flat(rail, 3, y1 - y0, dark, "we"), west: flat(dark, Math.min(16, y1 - y0), 2, dark), east: flat(dark, Math.min(16, y1 - y0), 2, dark)}); }
}
function sideGate(out, x, y, base) {
if (doorOpen(x, y)) return; const P = pix(IMG.gates, 0, 0, 16, 16), lum = (v) => (v & 255) + (v >> 8 & 255) + (v >> 16 & 255); let wood = 0, dark = 0;
for (let i = 0; i < 256; i++) { const v = P.px[i]; if (!solid(v)) continue; if (!wood || lum(v) > lum(wood)) wood = v; if (!dark || lum(v) < lum(dark)) dark = v; }
push(out, {x: 6, y: -4, z: base + 2 * UP / 12, w: 4, d: 24, h: 9 * UP / 12, fh: 9, top: flat(wood, 4, 24, dark, "wens"), front: flat(wood, 4, 9, dark, "wens"), west: flat(wood, 24, 9, dark, "ns"), east: flat(wood, 24, 9, dark, "ns")});
}
let roomK = "", room0 = null, roomZ = 0, roomS = 0;
function roomNow() { const p = myPos(); if (!p) return null; const L = myZ(p.x, p.y), k = [p.x, p.y, L, Floors.ver, landVer].join(); if (k === roomK) return room0; roomK = k; room0 = null; roomZ = L; roomS = -1e9;
const over = (x, y) => { const c = Floors.cells(x, y); if (c) for (const z of c.keys()) if (z > L) return true; return false; }; if (!over(p.x, p.y)) return null;
const seen = new Set([p.x + "," + p.y]), q = [[p.x, p.y, 0]];
for (let n = 0; n < q.length && q.length < 120; n++) { const [x, y, d] = q[n]; if (d < 10) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k2 = X + "," + Y; if (seen.has(k2) || !over(X, Y) || [0, 1, 2, 3].some((dz) => Structures.WALLS.includes(Floors.thingAt(X, Y, L - dz) || "-"))) continue; seen.add(k2); q.push([X, Y, d + 1]); } }
room0 = new Map(); for (const [x, y] of q) { roomS = Math.max(roomS, y); for (let dx = -1; dx <= 1; dx++) room0.set(x + dx, Math.min(room0.has(x + dx) ? room0.get(x + dx) : 1e9, y)); } return room0; }
const hid = (x, y, z) => { if (Build.on) return Floors.alpha(x, y, z) < 1; const r = roomNow(); if (!r || z <= roomZ) return false; const n = r.get(x); return n !== undefined && y >= n && y - n <= 14; };
function pitch(x, y, z) { const same = (dy) => { const c = Floors.get(x, y + dy, z); return !!c && c[0] === "roof" && !hid(x, y + dy, z); }; let up = 0, down = 0; while (up < 14 && same(-up - 1)) up++; while (down < 14 && same(down + 1)) down++;
const n = up + down + 1, yr = Math.floor((n - 1) / 2) + .5, pk = PITCH * n / 2; return {up, down, yr, split: up === Math.floor(yr), hat: (v) => Math.round(v <= yr ? pk * v / yr : pk * (n - v) / (n - yr))}; }
function block(out, kind, x, y, z) {
const g = (dx, dy, dz = 0) => { const c = Floors.get(x + dx, y + dy, z + dz); return c && !hid(x + dx, y + dy, z + dz) ? c[0] : ""; }, same = (dx, dy) => g(dx, dy) === kind;
if (kind === "roof") {
const {up, down, yr, hat} = pitch(x, y, z), w = same(-1, 0), e = same(1, 0);
const rz = (z - 1) * UP + 7; cast(out, x, y, 0, [-1, -1, 17, 17], 0, rz - floorAt(x, y) * UP + hat(up + .5), true);
const P = shotOf("roof" + [up, down, w, e], 16, 30, () => Structures.drawRoof(0, 7, 16, up, down, w, e)), E = pix(IMG.house_roof, 16, 64, 16, 7);
const eave = room("eave", 16, 7, (put) => { for (let j = 0; j < 7; j++) for (let i = 0; i < 16; i++) put(i, j, E.px[j * 16 + i]); }), S = {px: sheet.px, w: SW, key: "eaveS"};
for (const [y0, y1] of up === Math.floor(yr) ? [[0, 8], [8, 16]] : [[0, 16]]) { const d = y1 - y0, last = y1 === 16;
push(out, {x: 0, y: y0, z: rz - 7, w: 16, d, h: 7, tilt: [hat(up + y0 / 16), hat(up + y1 / 16)], k: up + y0 / 16 < yr ? .7 : 1, top: cut(P, 0, 16, 7 + y0, 7 + y1), front: last && !down ? eave : null,
west: w ? null : side(S, eave[0], eave[0] + 16, eave[1], eave[1] + 7, d, 0), east: e ? null : side(S, eave[0], eave[0] + 16, eave[1], eave[1] + 7, d, 1)}); }
if (!up) push(out, {x: 0, y: -7, z: rz - 2, w: 16, d: 7, h: 2, top: cut(P, 0, 16, 0, 7)});
return;
}
const bits = [g(0, -1), g(-1, 0), g(1, 0), g(0, 1), g(0, 0, 1)].map((v) => (v ? 1 : 0)).join(""), stairs = kind === "stairs";
if (stairs && !g(0, 0, 1)) {
const P = shotOf("st" + [x, y, z, Floors.ver, landVer], 16, FH, () => Floors.cell(kind, x, y, z, () => 0, () => shOf(z), 16, 1)), tone = P.px[(16 + UP / 2) * 16 + 7] || P.px[8 * 16 + 7] || 0xff5d6290;
const [ux, uy] = [[0, -1], [1, 0], [-1, 0], [0, 1]].find(([dx, dy]) => solidAt(x + dx, y + dy, z + 1) && !solidAt(x + dx, y + dy, z + 2)) || [0, -1];
for (const hi of [0, 1]) { const x0 = ux && (ux > 0) === !!hi ? 8 : 0, y0 = uy && (uy > 0) === !!hi ? 8 : 0, w = ux ? 8 : 16, d = uy ? 8 : 16, h = hi ? UP : UP / 2;
push(out, {x: x0, y: y0, z: (z - 1) * UP, w, d, h, top: cut(P, x0, x0 + w, y0, y0 + d), front: cut(P, x0, x0 + w, FH - h, FH), west: flat(tone, d, h, tone), east: flat(tone, d, h, tone)}); }
return;
}
cast(out, x, y, 0, [-1, -1, 17, 17], 0, (z - floorAt(x, y)) * UP, true);
const P = shotOf(stairs ? "st" + [x, y, z, Floors.ver, landVer] : "cell" + kind + bits, 16, FH, () => Floors.cell(kind, x, y, z, () => 0, () => shOf(z), 16, 1));
const tone = P.px[(16 + UP / 2) * 16 + 7] || P.px[8 * 16 + 7] || 0xff5d6290;
push(out, {x: 0, y: 0, z: (z - 1) * UP, w: 16, d: 16, h: UP, top: g(0, 0, 1) ? null : cut(P, 0, 16, 0, 16), front: g(0, 1) ? null : cut(P, 0, 16, 16, FH), west: g(-1, 0) ? null : flat(tone, 16, UP, tone), east: g(1, 0) ? null : flat(tone, 16, UP, tone)});
}
const is = (c, x, y) => "W%+#rm".includes(c) || (c === "g" && x !== undefined && gateSide(x, y));
function stand(out, c, x, y, zl) {
if (!c) return;
if (Structures.WALLS.includes(c)) {
const cells = Floors.cells(x, y); let over = 0, cutLow = false;
if (cells) for (const zc of cells.keys()) if (zc > zl && zc <= zl + Floors.STOREY && (!over || zc < over)) { over = zc; cutLow = hid(x, y, zc); }
const p = myPos();
const full = over ? (over - 1 - zl) * UP : UP; wall(out, c, x, y, zl, cutLow && (Build.on ? p && y > p.y : y > roomS) ? 4 : full);
} else if (c === "#") fence(out, x, y, zl * UP); else if (c === "g") sideGate(out, x, y, zl * UP);
else decal(out, c, x, y, zl * UP);
}
const at = (x, y) => { const id = sheet.id, out = pieces(x, y); return sheet.id === id ? out : pieces(x, y); };
function pieces(x, y) {
const out = [], c = combAt(x, y), cells = Floors.cells(x, y);
if (c && is(c, x, y)) stand(out, c, x, y, floorAt(x, y)); else if (c && shaded(c)) shade(out, c, x, y, floorAt(x, y) * UP, floorAt(x, y));
if (cells) for (const [z, [kind, ch]] of cells) { if (hid(x, y, z)) continue; block(out, kind, x, y, z); if (ch && is(ch)) stand(out, ch, x, y, z); else if (ch && shaded(ch)) shade(out, ch, x, y, z * UP, z); }
if (!ghosting) HdSun.land(out, x, y);
return out.length ? out : null;
}
const pieced = (item, steps, z) => !!steps || ((item === "roof" || item === "plank") && z !== undefined) || is(PLACEABLE_BLOCK[item] || "-");
function ghost(item, x, y, z, steps) {
if (!pieced(item, steps, z)) return null;
const out = [], run = (tx, ty, fn) => { const l = []; ghosting = true; try { fn(l); } finally { ghosting = false; } for (const b of l) out.push([tx, ty, Object.assign(b, {ghost: true})]); };
if (steps) for (const [tx, ty, g, t] of steps) for (let zz = g + 1; zz <= t; zz++) run(tx, ty, (l) => block(l, "stairs", tx, ty, zz));
else if (item === "roof" || item === "plank") run(x, y, (l) => block(l, item, x, y, z));
else run(x, y, (l) => stand(l, PLACEABLE_BLOCK[item], x, y, z === undefined ? floorAt(x, y) : z));
return out;
}
function loose(x, y) { const cells = Floors.cells(x, y), out = []; if (cells) for (const [z, [, ch]] of cells) if (ch && !is(ch) && !hid(x, y, z)) out.push([ch, z]); return out; }
function key(near = true) { const s = near && myAt; let d = ""; if (doorsAt.size > 300) doorsAt.clear(); for (const [x, y] of doorsAt.values()) if ("+g".includes(combAt(x, y) || "-") && doorOpen(x, y)) d += x + "," + y + ";"; return [Floors.ver, s ? [s.x, s.y, s.z] : "", Build.on ? Build.level() : "", sheet.id, d, HdSun.key(), HdLook.cam.pitch].join("|"); }
return {at, is, loose, key, painted, ghost, pieced, card, shadow, foot, plans, CARD, sheet, room, pix, pitch};
})();
;
const HdView = (() => {
let el = null, g = null, sk = null, skyKey = "", skyVer = 0, one = null, lastKey = "", wordsKey = null, wordsAt = 0, tmp = null;
const Z = () => zoom * DPR, PAINT = new Set(["fillRect", "clearRect", "strokeRect", "fillText", "strokeText", "drawImage", "fill", "stroke", "putImageData"]), ids = new WeakMap(), strs = new Map(); let nid = 0;
const sink = () => one || (one = document.createElement("canvas").getContext("2d"));
function recorder(real, dry) {
const ops = [], fns = {}; let h = 0;
const mix = (v) => { h = Math.imul(h ^ v, 16777619) | 0; }, str = (s) => { let n = strs.get(s); if (n === undefined) { if (strs.size > 4000) strs.clear(); n = 0; for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619) | 0; strs.set(s, n); } mix(n); };
const val = (a) => { if (typeof a === "number") mix((a * 64) | 0); else if (typeof a === "string") str(a); else if (a && typeof a === "object") { let id = ids.get(a); if (!id) ids.set(a, id = ++nid); mix(id); mix(a._v || a.naturalWidth || a.width || 0); } else mix(a ? 1 : 2); };
const proxy = new Proxy(real, {
get(t, k) { const v = t[k]; if (typeof v !== "function") return v; return fns[k] || (fns[k] = (...a) => { str(k); for (const x of a) val(x); if (dry) ops.push(k, a); if (!dry || !PAINT.has(k)) return t[k].apply(t, a); }); },
set(t, k, v) { str(k); val(v); if (dry) ops.push("=" + k, v); if (k !== "font" || t[k] !== v) t[k] = v; return true; }});
return {proxy, reset() { ops.length = 0; h = 0; }, get hash() { return h; }, get ops() { return ops; }, play() { for (let i = 0; i < ops.length; i += 2) { const k = ops[i]; if (k[0] === "=") real[k.slice(1)] = ops[i + 1]; else real[k].apply(real, ops[i + 1]); } }};
}
let rec = null;
function words(fn, now) {
const real = ctx; rec = rec || recorder(real, true); rec.reset();
ctx = rec.proxy; try { real.setTransform(DPR, 0, 0, DPR, 0, 0); fn(); } finally { ctx = real; }
const k = rec.hash + "|" + cv.width + "x" + cv.height; if (k === wordsKey && now - wordsAt < 250) return false;
wordsKey = k; wordsAt = now; real.setTransform(1, 0, 0, 1, 0, 0); real.globalAlpha = 1; real.clearRect(0, 0, cv.width, cv.height); real.setTransform(DPR, 0, 0, DPR, 0, 0); real.imageSmoothingEnabled = false; rec.play(); return true;
}
let recM = null;
function marks(fn) {
if (!g) return 0; recM = recM || recorder(g, true); recM.reset(); const keep = ctx; g.setTransform(1 / zoom, 0, 0, 1 / zoom, 0, 0);
ctx = recM.proxy; try { fn(); } finally { ctx = keep; g.setTransform(1, 0, 0, 1, 0, 0); } return recM.hash;
}
function fit(w, h) {
if (!el) { el = document.createElement("canvas"); el.id = "hd"; cv.before(el); g = el.getContext("2d"); }
if (el.width !== w || el.height !== h) { el.width = w; el.height = h; lastKey = ""; }
const sw = w * zoom + "px", sh = h * zoom + "px"; if (el.style.width !== sw || el.style.height !== sh) { el.style.width = sw; el.style.height = sh; el.style.transformOrigin = W / 2 + "px " + H / 2 + "px"; }
if (el.style.display !== "block") { el.style.display = "block"; lastKey = ""; wordsKey = null; }
}
function hide() { if (el && el.style.display !== "none") { el.style.display = "none"; wordsKey = null; } }
function skyOf(w, h, line, sky) {
const ph = clock.phase || 0, ws = washAt(ph), lf = opt("night") / 100 * .6, light = lightAt(ph).map((v) => Math.round(v + (255 - v) * lf)), step = sky.stars > 0 ? .1 : .5, tq = Math.floor(sky.t / step);
const c8 = (q) => q.map((v) => Math.round(v * 255)), k = [w, h, line, W, zoom, tq, Math.floor(sky.shift), Math.floor(sky.shift * .6), Math.floor(sky.shift * .3), c8(sky.top), c8(sky.low), c8(sky.cloud), c8(sky.far), c8(sky.near), c8(sky.orb), sky.at.map((v) => Math.round(v * 500)), Math.round(sky.stars * 50), ws.map((v) => Math.round(v * 100) / 100), light].join();
if (k === skyKey) return; const gl = VoxGL.gl; if (!gl) return; skyKey = k; skyVer++;
sk = sk || document.createElement("canvas").getContext("2d"); if (sk.canvas.width !== w || sk.canvas.height !== h) { sk.canvas.width = w; sk.canvas.height = h; }
VoxGL.fit(w, h); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.disable(gl.BLEND);
VoxSky.draw(Object.assign({}, sky, {line, t: tq * step}), W / zoom, h, W / zoom, 1);
sk.globalAlpha = 1; sk.globalCompositeOperation = "source-over"; sk.imageSmoothingEnabled = false; sk.drawImage(VoxGL.el, 0, 0);
sk.globalAlpha = ws[3]; sk.fillStyle = `rgb(${ws.slice(0, 3).join()})`; sk.fillRect(0, 0, w, h); sk.globalAlpha = 1; sk.globalCompositeOperation = "multiply"; sk.fillStyle = `rgb(${light.join()})`; sk.fillRect(0, 0, w, h); sk.globalCompositeOperation = "source-over";
}
let chk = null, chkOf = "", chkPat = null, bk = null, pic = null;
function checker(col) { if (col === chkOf) return chkPat; chk = chk || document.createElement("canvas").getContext("2d"); chk.canvas.width = chk.canvas.height = 4; chk.fillStyle = col; chk.fillRect(0, 0, 2, 2); chk.fillRect(2, 2, 2, 2); chkOf = col; return chkPat = g.createPattern(chk.canvas, "repeat"); }
function show(o) {
const {w, h} = o, line = o.sky ? Math.round(o.sky.line / zoom) : 0, low = o.sky ? o.sky.low : [.62, .78, .86]; fit(w, h);
if (line > 0) skyOf(w, h, line, o.sky);
const key = [line > 0 ? skyVer : 0, line, low.map((v) => Math.round(v * 255)), o.runs, o.marks, zoom].join("|");
if (!o.fresh && key === lastKey) return false; lastKey = key;
const tint = (c, a) => `rgb(${low.map((v, i) => Math.round((v * (1 - a) + c[i] * a) * 255)).join()})`; bk = [[.8, .84, .8, .45], [.36, .64, .8, .65]].map((c) => low.map((v, i) => Math.round((v * (1 - c[3]) + c[i] * c[3]) * 255)));
g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.imageSmoothingEnabled = false; g.fillStyle = tint([.8, .84, .8], .45); g.fillRect(0, 0, w, h);
if (line > 0 && sk) g.drawImage(sk.canvas, 0, 0);
g.fillStyle = tint([.36, .64, .8], .65); for (const [run, px] of o.runs) { g.fillRect(run, line, px - run, h - line); for (const ex of [run - 8, px]) { g.save(); g.translate(ex, 0); g.fillStyle = checker(g.fillStyle); g.fillRect(0, line, 8, h - line); g.restore(); } }
g.drawImage(o.pic, 0, 0); pic = o.pic;
if (recM && o.marks) { g.setTransform(1 / zoom, 0, 0, 1 / zoom, 0, 0); recM.play(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; }
return true;
}
function read(x, y, w, h) {
tmp = tmp || document.createElement("canvas").getContext("2d", {willReadFrequently: true}); if (tmp.canvas.width !== cv.width || tmp.canvas.height !== cv.height) { tmp.canvas.width = cv.width; tmp.canvas.height = cv.height; }
tmp.imageSmoothingEnabled = false; tmp.clearRect(0, 0, cv.width, cv.height); if (el && el.style.display === "block") tmp.drawImage(el, 0, 0, el.width * Z(), el.height * Z()); tmp.drawImage(cv, 0, 0);
return tmp.getImageData(x, y, w, h);
}
const PF = {n: 0, drawn: 0, calls: 0, slice: 0, words: 0, ms: 0};
function perf(now, js, drawn, calls, slice, wrote) {
if (!F3.on) return;
PF.n++; if (drawn) { PF.drawn++; PF.calls = calls; } if (wrote) PF.words++; PF.slice = Math.max(PF.slice, slice); PF.ms += HdLook.ms || 0;
F3.sample(now, js);
}
F3.add("look", () => {
if (!HdLook.live) return [];
const n = PF.n || 1, r = [`HD look ${(PF.ms / n).toFixed(1)} ms  land ${PF.slice.toFixed(1)} ms  made ${HdLook.made || 0} chunks`,
`${PF.calls} draws  ${HdLook.faces || 0} faces  drawn ${PF.drawn}/${PF.n}  words ${PF.words}/${PF.n}`, `picture ${el ? el.width + "x" + el.height : "-"} x${zoom}`];
PF.n = PF.drawn = PF.slice = PF.words = PF.ms = 0;
return r;
}, "perf");
return {sink, recorder, words, marks, dump: () => (rec ? rec.ops.map((v) => (Array.isArray(v) ? v.map((x) => (typeof x === "object" ? "#" : x)).join() : String(v))).join(" ") : ""), show, hide, read, perf, get el() { return el; }, get backdrop() { return bk; }, get pic() { return pic; }};
})();
;
const HdLevel = (() => {
const col = (x, y) => Voxels.host.column(x, y), topAt = (x, y) => { const c = col(x, y); return c && c.length ? c[c.length - 1] : 0; };
const solid = (c, z) => { if (!c) return false; for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return i === 0 || z > c[i - 1]; return false; };
let trail = [];
function of(p, now) {
const H0 = Voxels.host, rx = Math.round(p.x), ry = Math.round(p.y), near = typeof myAt !== "undefined" && myAt && Math.abs(myAt.x - rx) + Math.abs(myAt.y - ry) <= 2;
const at = (x, y) => { const t = topAt(x, y), s = near ? Floors.standOf(p, x, y) : t; return s >= t && H0.water && H0.water(x, y) && H0.waterTop ? Math.max(s, H0.waterTop(x, y)) : s; };
const cl = Climb.climbOf(p); if (cl) return [Math.floor(cl.h), cl.h];
const L = at(rx, ry), ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y); if ((ax === bx && ay === by) || falling(p, now)) return [L, L];
const la = at(ax, ay), lb = at(bx, by), f = ax === bx ? p.y - ay : p.x - ax; return [L, Math.abs(la - lb) >= FALL.from ? L : la + (lb - la) * f];
}
function over(x, y, L, k, n = 20) { let m = 0; for (let d = 1; d <= n; d++) { const c = col(x, y + d), e = L + (d - .5) * k; if (!c || !c.length || matAt(x, y + d)) continue; for (let i = 0; i < c.length; i += 2) if (c[i] > e && (i ? c[i - 1] : -1e9) < e + k) m = Math.max(m, i && c[i - 1] > e ? 99 : c[i] - e); } return m > 0 && topAt(x, y) > L ? 99 : m; }
const under = (x, y, L) => topAt(x, y) > L;
function clear(tx, ty, L, n) { let m = 0; for (let d = 1; d <= n; d++) { const t = topAt(tx, ty + d) - L, w = Math.max(0, Math.min(1, t - 1)); if (w > 0 && !matAt(tx, ty + d)) m = Math.max(m, w * (t + .4) / (d - .5)); } return m ? Math.atan(m * RELIEF_STEP / 16) * 180 / Math.PI : 0; }
let sk = "", sv = 0;
const RAYS = Array.from({length: 16}, (_, a) => Array.from({length: 6}, (__, d) => [Math.round(Math.cos(a * Math.PI / 8) * (d + 1)), Math.round(Math.sin(a * Math.PI / 8) * (d + 1))]));
function steep(tx, ty, L, ver) {
const key = [tx, ty, L, ver].join(); if (key !== sk) { sk = key; sv = 0; for (const r of RAYS) if (r.some(([i, j]) => !matAt(tx + i, ty + j) && topAt(tx + i, ty + j) >= L + 1)) sv++; }
return sv >= 10;
}
function own(tx, ty, L, cov) {
if (!cov) { trail = []; return trail; }
const c = col(tx, ty), roof = topAt(tx, ty) > L; let hi = L + 1; if (roof) while (hi < L + 6 && !solid(c, hi + 1)) hi++;
const b = roof ? [tx, ty, L, hi] : [tx, ty, L, L + 1, 1], l = trail[trail.length - 1]; if (l && l[0] === tx && l[1] === ty && l[2] === L) return trail;
trail = trail.filter((t) => t.length < 5 && (t[0] !== tx || t[1] !== ty) && Math.abs(t[0] - tx) + Math.abs(t[1] - ty) <= 3).slice(-3).concat([b]); return trail;
}
const rim = (tx, ty, L) => Math.max(L, topAt(tx, ty), topAt(tx + 1, ty), topAt(tx - 1, ty), topAt(tx, ty - 1), topAt(tx, ty + 1));
const lift = (tx, ty, L, pitch, px = 0) => { const o = over(tx, ty, L, eyeRise(pitch), 1); return Math.min(Math.max(0, rim(tx, ty, L) - L), o > 0 ? o + px / (RELIEF_STEP * Math.cos(pitch * Math.PI / 180)) : 0); };
function shut(tx, ty, L, k) { const d = rim(tx, ty, L) - L; if (d <= 0 || under(tx, ty, L)) return false; let w = 1; for (const s of [-1, 1]) for (let j = 1; j <= 12 && topAt(tx, ty + s * j) < L + 1; j++) w++; return w * k < d; }
const raise = (z, s) => (!s || !(s.lift > 0) ? z : z + s.lift * Math.max(0, Math.min(1, (s.rim - z) / Math.max(.001, s.rim - s.L))));
function wall(x, y, z, s) {
if (!s || !(s.lift > 0 || s.top) || y <= s.ty) return null;
if (z > s.L) { for (let j = s.ty + 1; j <= y; j++) { const T = topAt(x, j); if (T >= z) return {y: j, T, B: s.L}; } return null; }
for (let j = y + 1; j <= y + 3; j++) { const T = topAt(x, j); if (T > z && T - z > (j - y - 1) * (s.ks || 2.5)) return {y: j, T, B: z - 1}; }
return null;
}
const wallAt = (x, y, z, s, f) => { const d = Math.max(1, f.T - f.B); return [x, f.y - Math.max(0, Math.min(d, z - f.B)) * Math.min(.4, 1 / d), f.T]; };
const runs = new WeakMap();
function runsOf(c) {
if (!c || !c.width) return null; let r = runs.get(c); if (r && r.v === c._v) return r;
const w = c.width, d = c.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, w, c.height).data, l = [], b = [1e9, 1e9, -1, -1];
for (let j = 0; j < c.height; j++) { let i0 = -1; for (let i = 0; i <= w; i++) { const on = i < w && d[(j * w + i) * 4 + 3] >= 128; if (on && i0 < 0) i0 = i; else if (!on && i0 >= 0) { l.push(i0, j, i - i0); b[0] = Math.min(b[0], i0); b[1] = Math.min(b[1], j); b[2] = Math.max(b[2], i); b[3] = Math.max(b[3], j + 1); i0 = -1; } } }
runs.set(c, r = {v: c._v, l, b: b[2] >= 0 ? b : null}); return r;
}
function cut(g, me, a, zs) {
const r = me && a && runsOf(me.canvas); if (!r) return;
const x0 = Math.round(a[0] / zs) - me.fx, y0 = Math.round(a[1] / zs) - me.fy; g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); for (let i = 0; i < r.l.length; i += 3) g.rect((x0 + r.l[i]) * zs, (y0 + r.l[i + 1]) * zs, r.l[i + 2] * zs, zs); g.clip("evenodd");
}
const body = (me, a, zs) => { const r = me && a && runsOf(me.canvas); if (!r || !r.b) return null; const x0 = Math.round(a[0] / zs) - me.fx, y0 = Math.round(a[1] / zs) - me.fy; return {x: (x0 + r.b[0]) * zs, y: (y0 + r.b[1]) * zs, w: (r.b[2] - r.b[0]) * zs, h: (r.b[3] - r.b[1]) * zs}; };
return {of, steep, own, rim, over, under, clear, lift, shut, raise, wall, wallAt, cut, body, get shows() { return sv; }};
})();
;
const HdEase = (() => {
const T = 120, part = new Map(); let was = new Set(), cur = new Set(), last = 0, dt = 0;
function frame(now) { was = cur; cur = new Set(); dt = Math.max(0, Math.min(100, now - last)) / T; last = now; if (part.size > 600) part.clear(); }
function of(key, on) {
let a = part.get(key);
if (a === undefined) { if (on) { cur.add(key); return 1; } a = was.has(key) ? 1 : 0; }
a = Math.max(0, Math.min(1, a + (on ? dt : -dt)));
if (a >= 1) { part.delete(key); cur.add(key); return 1; }
part.set(key, a); return a;
}
return {frame, of, T};
})();
;
const HdFx = (() => {
const cvs = new Map(), last = {parts: 0, puffs: 0, loot: 0, orbs: 0, fire: 0, falls: 0, floats: []};
const made = (k, w, h, paint) => { let c = cvs.get(k); if (!c) { c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; paint(g); cvs.set(k, c); } return c; };
const opaque = (c) => { const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(String(c).replace(/\s/g, "")); return m ? [`rgb(${m[1]},${m[2]},${m[3]})`, +m[4]] : [c, 1]; };
const top = (x, y) => { const c = Voxels.host.column(Math.floor(x), Math.floor(y)); return c && c.length ? c[c.length - 1] : 0; };
const ground = (x, y) => floorAt(Math.floor(x), Math.floor(y));
const dot = (c, s) => { const [cl] = opaque(c); return made("d" + cl + s, s, s, (g) => { g.fillStyle = cl; g.fillRect(0, 0, s, s); }); };
const puff = (r) => made("p" + r, 2 * r + 1, 2 * r + 1, (g) => { for (let j = 0; j <= 2 * r; j++) for (let i = 0; i <= 2 * r; i++) { const d = Math.hypot(i - r, j - r); if (d > r + .3) continue; g.fillStyle = r >= 2 && d > r - .7 ? "rgb(150,128,116)" : "rgb(246,240,228)"; g.fillRect(i, j, 1, 1); } });
const orb = (big, flick) => made("o" + big + flick, big ? 7 : 5, big ? 7 : 5, (g) => { const col = {o: "#4f8a2a", y: flick ? "#b9e45a" : "#dcf27a", w: "#fffbd8"}; (big ? ORB_BIG : ORB).forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") { g.fillStyle = col[c]; g.fillRect(i, j, 1, 1); } })); });
const cell = (img, sx, sy, w, h, flip = false) => made([img.src || img.id || "", sx, sy, w, h, flip].join(), w, h, (g) => { if (flip) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(img, sx, sy, w, h, 0, 0, w, h); });
const ok = (img) => img && img.complete !== false && (img.naturalWidth || img.width);
function add(list, p, now, dt) {
const t = now / 1000, near = (x, y) => Math.abs(x - p.x) < 26 && y > p.y - 26 && y < p.y + 26, put = (s) => { if (near(s.x, s.y)) list.push(Object.assign({d: true, still: true}, s)); };
let n = 0;
for (const q of parts) { if (q.age < 0 || q.age > q.life) continue; const base = q.floor !== undefined ? q.floor : (q.by === undefined ? (q.by = q.y + .45) : q.by), [, a] = opaque(q.c);
put({canvas: dot(q.c, q.s), fx: 0, fy: q.s + Math.round(Math.max(0, base - q.y) * 16), x: q.x, y: base, z: ground(q.x, base), fade: Math.min(1, 3.3 * (1 - q.age / q.life)) * a}); n++; }
last.parts = n; n = 0;
for (const q of puffs) { if (q.age < 0 || q.age > q.life) continue; const k = q.age / q.life, r = Math.max(1, Math.round(q.r + q.grow * k)), base = q.by === undefined ? (q.by = q.y + .3) : q.by;
put({canvas: puff(r), fx: r, fy: r + Math.round(Math.max(0, base - q.y) * 16), x: q.x, y: base, z: ground(q.x, base), fade: (1 - k) * .85}); n++; }
last.puffs = n; n = 0;
for (const f of falls) { const k = (now - f.t0) / 1000, fr = Math.floor(k * 14), img = f.thin ? IMG.thin_fall : IMG.tree_fall; if (fr < 0 || fr >= 12 || !ok(img)) continue; const [bx, by] = brink(f.x, f.y);
put({canvas: cell(img, fr * 64, 0, 64, 48, f.side > 0), fx: f.side > 0 ? 24 - bx : 40 - bx, fy: 44 - by, x: f.x + .5, y: f.y + 1, z: Math.max(top(f.x, f.y), ground(f.x, f.y)), fade: fr >= 9 ? 1 - (fr - 9) / 3 : 1}); n++; }
last.falls = n; n = 0;
for (const f of flyers) { const k = (now - f.t0) / FLY_MS; if (k >= 1 || (k < 0 && !f.drop) || !ok(IMG.trees)) continue; let y = f.y, x = f.x, a = 1;
if (k < 0) { const tf = (now - f.drop.t0) / 1000; if (tf < 0) continue; if (tf * 1000 < f.drop.fall) y = f.drop.top + .5 * FRUIT_G * tf * tf; }
else { const who = f.by && [...ents.values()].find((q) => q.e && q.e.name === f.by), e = k * k * (3 - 2 * k); if (who) { x = f.x + (who.x + .5 - f.x) * e; y = f.y + (who.y + .1 - UP - f.y) * e - Math.sin(k * Math.PI) * 1.1; } else { y -= k * .8; a = 1 - k; } if (k > .7) a = Math.min(a, (1 - k) / .3); }
put({canvas: cell(IMG.trees, f.ix, f.iy, 16, 16), fx: 8, fy: 8 + Math.round(Math.max(0, f.y - y) * 16), x, y: f.y, z: ground(x, f.y), fade: a}); }
for (const f of plucks) { const ms = now - f.t0, [img, a0, b0, w, h, dx, dy] = f.spr; if (ms > TUG_MS + PLUCK_MS || !ok(img)) continue; let ox = 0, oy = 0, a = 1;
if (ms < TUG_MS) oy = -Math.sin(ms / TUG_MS * Math.PI / 2) * .25; else { const k = (ms - TUG_MS) / PLUCK_MS, e = k * k * (3 - 2 * k), who = f.by && [...ents.values()].find((q) => q.e && q.e.name === f.by); if (who) { ox = (who.x - f.x) * e; oy = -.25 + (who.y - .3 - f.y + .25) * e - Math.sin(k * Math.PI) * .8; } else { oy = -.25 - k * .6; a = 1 - k; } if (k > .8) a = Math.min(a, (1 - k) / .2); }
put({canvas: cell(img, a0, b0, w, h), fx: 8 - dx, fy: 16 - dy + Math.round(Math.max(0, -oy) * 16), x: f.x + ox + .5, y: f.y + 1, z: ground(f.x + ox, f.y), fade: a}); }
for (const l of loot) { const s = (now - l.t0) / 1000; if (s < 0) continue; let h = 0, dk = 1, since = 1;
if (s < l.flight) { h = -(l.vy * s + LOOT_G * s * s / 2); dk = s / l.flight; } else { let u = s - l.flight, m = 0; while (m < LOOT_HOPS.length && u > LOOT_HOPS[m]) u -= LOOT_HOPS[m++]; if (m < LOOT_HOPS.length) { h = LOOT_G * LOOT_HOPS[m] / 2 * u - LOOT_G * u * u / 2; since = u; } }
const dip = s > l.flight && since < .05 ? 1 : 0;
put({canvas: ghostIcon(l.name), fx: 5, fy: 11 - Math.round(l.dy * dk) + Math.max(0, Math.round(h * 16)) - dip, x: l.x + .5 + Math.round(l.dx * dk) / 16, y: l.y + .7, z: ground(l.x, l.y), pile: true}); n++; }
last.loot = n; n = 0;
for (const o of orbs) { if (o.age < 0) continue; const w = Math.max(0, Math.min(1, (o.age - o.homing) / .2)), by = o.y + (UP + .15) * w;
put({canvas: orb(o.big, Math.sin(o.age * 14 + o.seed) > 0), fx: o.big ? 3 : 2, fy: (o.big ? 4 : 3) + Math.round(o.h * 8 + Math.max(0, by - o.y) * 16), x: o.x, y: by, z: ground(o.x, by)}); n++; }
for (const m of magnets) { const pl = playerNamed(m.who); if (m.age < 0 || !pl) continue; const k = Math.min(1, m.age / .28), e = k * k, x = m.x + (pl.x + .5 - m.x) * e, gy = m.y + (pl.y + .5 - m.y) * e, lift = (gy - (m.y + (pl.y + .3 - UP - m.y) * e)) + Math.sin(k * Math.PI) * .35;
put({canvas: ghostIcon(m.name), fx: 5, fy: 6 + Math.round(lift * 16), x, y: gy, z: ground(x, gy), fade: k > .7 ? (1 - k) / .3 : 1}); n++; }
last.orbs = n; n = 0;
for (const f of fireAt) { if (!near(f.x, f.y) || !ok(IMG.gen)) continue; const tall = "TF".includes(combAt(f.x, f.y) || ""), z = Math.max(top(f.x, f.y), ground(f.x, f.y));
const fl = (tt, dx, up, ax, ay) => put({canvas: cell(IMG.gen, ...genCell(Math.floor(tt * 8 + ax * 3 + ay) % 2 ? "fire1" : "fire0"), 16, 16), fx: 8, fy: 19 + up, x: f.x + .5 + dx, y: f.y + 1, z, lamp: up ? 0 : 2, d: false});
fl(t, 0, 0, f.x, f.y); if (tall) { fl(t + 1, -.3, 14, f.x + 7, f.y); fl(t + 2, .3, 22, f.x, f.y + 5); }
if (Math.random() < dt * 6) parts.push({x: f.x + .2 + Math.random() * .6, y: f.y - (tall ? 1.6 : .3), vx: (Math.random() - .5) * .4, vy: -1.2, g: -.5, life: 1.2, age: 0, c: Math.random() < .5 ? "#6b6f73" : "#ffb454", s: 1, by: f.y + .9}); n++; }
last.fire = n;
}
const HEART = [".oo.oo.", "owrorro", "orrrrro", ".orrro.", "..oro..", "...o..."];
function words(seen, at) {
const c = ctx;
last.floats = []; if (!seen || !floats.length) return; const t = performance.now() / 1000, u = zoom, S = TS();
c.textAlign = "center"; c.font = "18px SproutPixel";
for (const f of floats) { const k = t - f.t; if (k < 0 || k >= 1.4) continue;
const s = seen.list.find((v) => v.q && v.q.tx === f.x && v.q.ty === f.y), a = s ? at(s.x, s.y, s.z) : at(f.x + .5, f.y + .5, ground(f.x, f.y)); if (!a) continue;
const x = Math.round(a[0] / u) * u - (f.heart ? 9 : 0), y = Math.round((a[1] - 22 * u - (s && s.q.e && s.q.e.kind === "agent" ? 22 : 0) - k * S * .7) / u) * u;
c.globalAlpha = 1 - k / 1.4; outlined(f.text, x, y, f.color); last.floats.push([f.text, x, y]);
if (f.heart) { const hx = x + Math.ceil(c.measureText(f.text).width / 2) + 4, hy = y - 13; HEART.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { c.fillStyle = ch === "o" ? "#5b3f36" : ch === "w" ? "#ffd9d0" : "#e8554a"; c.fillRect(hx + i * 2, hy + j * 2, 2, 2); } })); } }
c.globalAlpha = 1; c.textAlign = "start";
}
return {add, words, last};
})();
;
const HdLook = (() => {
const GROW = .25, EASE = .4, HOLD = 300, CAP = 20, R = 24;
const cfg = {levels: [-9, 12], variants: 4, up: RELIEF_STEP, rock: {from: 5, lo: -512, n: 4}};
const cam = {kind: "persp", pitch: 36, fov: 26};
const api = {eye: null, get on() { return !!this.eye || (!!me && myId !== null); }, u: 0, ms: 0, build: 0, slice: 0, live: false, drew: false, get busy() { return !!gen; }, get win() { return eng ? eng.win : {n: 0, a: 0, tiles: []}; }, steep: 78.6, nowin: false, force: null, cam, bend: .03, faces: 0, builds: 0, n: 0};
let camL = null, clr = null, pitN = null, stage = 0, tilt = 0, flip = 0, covAt = -1e9, grow = 0, wantG = 0, genG = 0, shownG = 0, south = 8, gen = null, seen = null, eng = null, key = "", ver = -1, last = performance.now(), lit = null, hl = 0, hy = 0, since = 0, hurry = false, cand = null, candKey = "", noGL = false, wrote = false, keyNear = "", keyFar = "", slice1 = 0, camV = 0, genAt = null, landAt = null, held = false, heldAt = 0;
const sprs = new Map(), lads = new Map(), things = new Map(), piles = new Map(), built = new Map(), stoodOf = new Map();
const Z = () => zoom * DPR;
const mix = (a, b, k) => Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k;
function ent(p, now, z) {
const T = P, j = jumping(p, now), fl = j && falling(p, now), off = fl ? liftOf(p) / zoom - z * RELIEF_STEP : 0, up = j ? Math.max(0, Math.ceil((j.body + off) * (fl ? Math.cos(cam.pitch * Math.PI / 180) : 1))) : 0, fo = fl ? Math.round(j.body) - up : 0, w = T * 4, h = Math.ceil((T * 5 + up) / 32) * 32, base = h - T * 1.5 + fo;
let pc = sprs.get(p) || document.createElement("canvas"); sprs.set(p, pc); if (pc.width !== w || pc.height !== h) { pc.width = w; pc.height = h; }
const g = pc.getContext("2d", {willReadFrequently: true}); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.imageSmoothingEnabled = false;
const keep = ctx, kz = zoom, sx = (x) => w / 2 - T / 2 + (x - p.x) * T, sy = Object.assign((y) => base + (y - p.y) * T, {up: (y) => base + (y - p.y) * T, apart: true});
const rc = pc._r || (pc._r = HdView.recorder(g, false)); rc.reset();
ctx = rc.proxy; zoom = 1; p._hd = api.n; try { drawEntity(p, sx, sy, T, now / 1000, now); } catch (e) {  } finally { ctx = keep; zoom = kz; }
if (rc.hash !== pc._h) { pc._h = rc.hash; pc._v = (pc._v || 0) + 1; }
return {canvas: pc, fx: w / 2, fy: Math.round(h - T), fo};
}
function thing(spr) {
const [img, sx, sy, sw, sh, dx, dy] = spr, k = (img.src || img.id || "") + "|" + sx + "," + sy + "," + sw + "," + sh;
let c = things.get(k);
if (!c) { c = document.createElement("canvas"); c.width = sw; c.height = sh; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); things.set(k, c); }
return {canvas: c, fx: 8 - dx, fy: 16 - dy, still: true, d: true};
}
const topAt = (x, y) => { const c = Voxels.host.column(x, y); return c && c.length ? c[c.length - 1] : 0; };
const come = (x, y) => { for (let j = y - 12; j <= y + 6; j += 9) for (let i = x - 10; i <= x + 10; i += 10) if (!blockOf(i, j)) return false; return true; };
const standAt = (c, x, y) => ("TFUtbvHf;\"w".includes(c) ? Math.max(topAt(x, y), floorAt(x, y)) : floorAt(x, y));
const solidAt = (c, z) => { for (let i = 0; i < c.length; i += 2) if (z <= c[i]) return i === 0 || z > c[i - 1]; return false; };
function under(x, y, z, px, at, st) {
const g0 = gndAt(x, y), put = topAt(x, y) === z && matAt(x, y) === "d"; if (!put && (topAt(x, y) <= z || (g0 !== "." && g0 !== ","))) return false;
const lv = VoxPaint.level(x, y, z), d = sheetData(lv >= 5 ? hillSheet(lv) : dugSheet("soil", Math.max(0, Math.min(3, -lv)))), [bx, by] = blobCell(255), pl = hash(x, y, 3) >= .8;
const sx = pl ? bx * 16 : Math.floor(hash(x, y, 4) ** 2 * 5) * 16, sy = pl ? by * 16 : (5 + (hash(x, y, 5) < .5 ? 0 : 1)) * 16;
for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) px[at + j * st + i] = d.px[(sy + j) * d.w + sx + i];
if (!put) VoxPaint.rim(x, y, z, px, at, st); return true;
}
function shore(x, y, z, px, at, st) {
const H0 = Voxels.host; if (under(x, y, z, px, at, st)) return; H0.paintTop(x, y, z, px, at, st); if (H0.water(x, y)) return;
const white = (v) => (v >>> 24) > 127 && (v & 255) > 214 && (v >> 8 & 255) > 214 && (v >> 16 & 255) > 205;
for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (H0.water(x + dx, y + dy)) for (let n = 0; n < 16; n++) for (let k = 0; k < 4; k++) {
const q = (m) => at + (dx ? n : dy > 0 ? 15 - m : m) * st + (dy ? n : dx > 0 ? 15 - m : m); if (!white(px[q(k)])) continue;
let m = k + 1; while (m < 8 && white(px[q(m)])) m++; px[q(k)] = px[q(m)]; }
for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) if (H0.water(x + dx, y + dy)) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
const q = (a, b) => at + (dy > 0 ? 15 - b : b) * st + (dx > 0 ? 15 - a : a); if (white(px[q(i, j)])) px[q(i, j)] = px[q(5, 5)]; }
}
let runsKey = "", runsOf = [];
function seaRuns(w, tx, ty, cam2) {
const k = [w, tx, ty, eng.stamp, cam2].join(); if (k === runsKey) return runsOf; runsKey = k; runsOf = []; const H0 = Voxels.host; let run = null;
for (let x = tx - R; x <= tx + R + 2; x += 2) { let n = 0; for (let y = ty - 20; y <= ty - 12; y += 2) if (!H0.column(x, y) || H0.water(x, y)) n++;
const sea = x <= tx + R && n >= 3, a = eng.at(x, ty - 14, 0), px = x <= tx - R ? 0 : x > tx + R ? w : Math.round(a[0]);
if (sea && run === null) run = px; if (!sea && run !== null) { runsOf.push([run, px]); run = null; } }
return runsOf;
}
function hour(w, h, list, el) {
const ph = clock.phase || 0, tint = lightAt(ph).map((v) => v + (255 - v) * el), wash = washAt(ph), dark = Math.min(1, (1 - (.3 * tint[0] + .59 * tint[1] + .11 * tint[2]) / 255) / .36);
if (wash[3] * (1 - el) <= .004 && dark <= .01) return null;
const lift = opt("night") / 100 * .6; if (dark <= .2) return {wash: [wash[0], wash[1], wash[2], wash[3] * (1 - el)], tint: tint.map((v) => Math.round(v + (255 - v) * lift))};
lit = lit || document.createElement("canvas"); if (lit.width !== w || lit.height !== h) { lit.width = w; lit.height = h; lit._k = ""; }
const base = tint.map((v) => Math.round(v + (255 - v) * lift)), lamps = []; for (const s of list) if (s.lamp) { const a = eng.at(s.x, s.y, s.z); if (a) lamps.push(Math.round(a[0] * 4), Math.round(a[1] * 4), s.lamp); }
const lk = [base, dark.toFixed(3), lamps, api.builds].join(), out = {wash: [wash[0], wash[1], wash[2], wash[3] * (1 - el)], lit}; if (lk === lit._k) return out; lit._k = lk; lit._v = (lit._v || 0) + 1;
const q = lit.getContext("2d"); q.globalAlpha = 1; q.globalCompositeOperation = "source-over"; q.fillStyle = `rgb(${tint.map((v) => Math.round(v + (255 - v) * lift)).join()})`; q.fillRect(0, 0, w, h);
if (dark > .2) { q.globalCompositeOperation = "lighter"; const k = (dark - .2) / .8;
for (const s of list) if (s.lamp) { const a = eng.at(s.x, s.y, s.z), cl = topAt(Math.floor(s.x), Math.floor(s.y)) > s.z; if (!a) continue; if (cl) { q.save(); winPath(q, Math.floor(s.x), Math.floor(s.y)); q.clip(); }
lamp(q, a[0], a[1] - 8, s.lamp > 1 ? 64 : 42, s.lamp > 1 ? "rgb(255,176,96)" : "rgb(255,222,170)", (s.lamp > 1 ? 1.15 : .45) * k, [0, 0]); if (cl) q.restore(); } }
q.globalAlpha = 1; return out;
}
function winPath(q, tx, ty) {
q.beginPath(); const quad = (l) => { const a = l.map((v) => eng.at(...v)); let ar = 0; for (let i = 0; i < 4; i++) ar += a[i][0] * a[(i + 1) % 4][1] - a[(i + 1) % 4][0] * a[i][1]; if (ar < 0) a.reverse(); q.moveTo(...a[0]); for (let i = 1; i < 4; i++) q.lineTo(...a[i]); q.closePath(); };
for (const [x, y, lo, hi] of eng.win.tiles) if (Math.abs(x - tx) <= 9 && Math.abs(y - ty) <= 9) { quad([[x, y, lo], [x + 1, y, lo], [x + 1, y + 1, lo], [x, y + 1, lo]]);
for (const e of [[[x, y], [x + 1, y]], [[x, y], [x, y + 1]], [[x + 1, y], [x + 1, y + 1]]]) quad([[...e[0], lo], [...e[1], lo], [...e[1], hi], [...e[0], hi]]); }
}
function written(p, now, words) {
if (p.free && !words) return;
const S = TS(), art = (a) => a && [Math.round(a[0] / zoom) * zoom, Math.round(a[1] / zoom) * zoom], F = art(api.screenOf(seen.at[0], seen.at[1], seen.at[2] + seen.lift)), who = (v, ax) => { for (const s of seen.list) if (s.q && s.q[ax] === v) { const a = s === seen.me ? F : art(api.screenOf(s.x, s.y, s.z)); return a && s.fo && ax === "y" ? [a[0], a[1] + s.fo * zoom] : a; } return null; };
const sx = (x) => { const a = who(x, "x"); return a ? a[0] - S / 2 : F[0] - S / 2 + (x - p.x) * S; }, fy = (y) => { const a = who(y, "y"); return a ? a[1] - S / 2 : F[1] - S / 2 + (y - p.y) * S; }, sy = Object.assign(fy, {up: fy, out: fy});
const px = zoom / seen.k, t = now / 1000, snap = (v) => Math.round(v / px) * px, quad = (x, y, z) => [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => api.markOf(x + a, y + b, z));
const corners = (c, col) => { for (const [cl, o] of [["#5b3f36", px], [col, 0]]) { ctx.fillStyle = cl; c.forEach((a, i) => { for (const b of [c[(i + 1) % 4], c[(i + 3) % 4]]) { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * .3 / px)); for (let j = 0; j <= n; j++) ctx.fillRect(snap(a[0] + (b[0] - a[0]) * j / n * .3), snap(a[1] + (b[1] - a[1]) * j / n * .3) + o, px, px); } }); } };
const fill = (c, col) => { ctx.fillStyle = col; const at = (a, b, y) => a[0] + (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) || 1); for (let y = snap(c[0][1]); y < c[3][1]; y += px) { const l = snap(at(c[0], c[3], y)), r = snap(at(c[1], c[2], y)); ctx.fillRect(l, y, r - l, px); } };
const rectOf = (spr, x, y, z = shown(x, y)) => { const f = api.screenOf(x + .5, y + 1, z), k = px; return [snap(f[0] - (8 - spr[5]) * k), snap(f[1] - (16 - spr[6]) * k), spr[3] * k, spr[4] * k]; };
const edge = (a, b, col, dot) => { if (!a || !b) return; const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / px)); for (const [cl, o] of [["#5b3f36", px], [col, 0]]) { ctx.fillStyle = cl; for (let i = 0; i <= n; i++) if (!dot || (i >> 1) % 2 === 0) ctx.fillRect(snap(a[0] + (b[0] - a[0]) * i / n), snap(a[1] + (b[1] - a[1]) * i / n) + o, px, px); } };
const ghost = (ch, x, y, a) => { const spr = ch && objectSprite(ch, x, y, t); if (!spr || !spr[0] || !spr[0].width) return; const r = rectOf(spr, x, y); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr[0], spr[1], spr[2], spr[3], spr[4], ...r); ctx.globalAlpha = 1; };
const box = (r) => [[r[0], r[1]], [r[0] + r[2] - px, r[1]], [r[0] + r[2] - px, r[1] + r[3] - px], [r[0], r[1] + r[3] - px]], bound = (c) => { const xs = c.map((v) => v[0]), ys = c.map((v) => v[1]); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; };
if (!words) { ctx.save(); const m = seen.me; if (m) HdLevel.cut(ctx, m, api.screenOf(m.x, m.y, m.z), zoom / seen.k); }
if (words) { const at = Build.on && Build.S.at, s = at && myPos(), r = at && Build.S.rect; if (s && r) { const L1 = Build.level(); Keyhole.mark(r.x, r.y, r.h, L1 - myZ(s.x, s.y), landSolid(at.x, at.y, L1) && landSolid(at.x, at.y, L1 + 1), sx, sy, r.right); } }
else if (Build.on) {
for (const j of Build.S.plans.values()) { const c = quad(j.x, j.y, j.z); if (c.some((v) => !v)) continue;
if (j.item !== "ladder" && !j.take && !j.dig && !HdThings.pieced(j.item, j.steps, j.up ? j.z : undefined)) ghost(PLACEABLE_BLOCK[j.item], j.x, j.y, j.state === "doing" ? .75 : .5);
fill(c, j.state === "bad" ? "rgba(230,80,70,.4)" : j.take ? "rgba(255,150,60,.3)" : j.state === "doing" ? "rgba(255,241,168,.35)" : "rgba(140,190,255,.28)"); if (j.dig) fill(c.map((v, i) => [v[0] + (c[(i + 2) % 4][0] - v[0]) * .2, v[1] + (c[(i + 2) % 4][1] - v[1]) * .2]), "rgba(60,36,30,.5)"); }
const at = Build.S.at; if (at) { const c = quad(at.x, at.y, Build.level()), it = Build.aim().it, mx = (myPos() || at).x; if (it && it.ghost && it.ghost !== "ladder" && it.ok !== false && !HdThings.pieced(it.ghost, it.steps, it.draw ? undefined : it.z)) ghost(PLACEABLE_BLOCK[it.ghost], at.x, at.y, .7);
Build.S.rect = Object.assign(bound(c), {under: mx !== at.x, right: mx < at.x}); Prompts.build(); Target.paint(ctx, api.art());
}
} else {
const aim = aimedTile(), it = aim && aim.it, a = aim && aim.p, on = a && tile(a.x, a.y) && it && !it.info && !it.walk; let r = null, thing = false;
if (on && it.ghost && it.ghost !== "ladder" && !HdThings.pieced(it.ghost, it.steps, it.draw ? undefined : it.z)) ghost(PLACEABLE_BLOCK[it.ghost], a.x, a.y, .7);
if (on) { const e = it.ent && seen.list.find((s) => s.q && s.q.e === it.ent || s.q === it.ent), c0 = combAt(a.x, a.y), spr = !e && c0 && isObject(c0) && objectSprite(c0, a.x, a.y, t), f = e && api.screenOf(e.x, e.y, e.z);
const cs = !e && seen.list.find((s) => s.card && s.tx === a.x && s.ty === a.y), cf = cs && api.screenOf(cs.x, cs.y, cs.z), pb = !e && !cs && c0 && HdThings.is(c0, a.x, a.y) ? boxed(a.x, a.y, seen.L * RELIEF_STEP) || boxed(a.x, a.y) : null;
const c = e ? box([snap(f[0] - 8 * px), snap(f[1] - 12 * px), 16 * px, 16 * px]) : cs && cf ? box([snap(cf[0] - (cs.fx - cs.card.b[0]) * px), snap(cf[1] - (cs.fy - cs.card.b[1]) * px), (cs.card.b[2] - cs.card.b[0]) * px, (cs.card.b[3] - cs.card.b[1]) * px])
: pb ? box([snap(pb.x), snap(pb.y), snap(pb.w) + px, snap(pb.h) + px]) : spr && spr[0] ? box(rectOf(spr, a.x, a.y, standAt(c0, a.x, a.y) > floorAt(a.x, a.y) ? standAt(c0, a.x, a.y) : undefined)) : null; thing = !!c;
if (c) corners(c, it.ok === false ? "#e8554a" : "#fff8e8"); r = bound(c || quad(a.x, a.y, it.cell !== undefined ? it.cell : shown(a.x, a.y))); }
Target.paint(ctx, api.art(), {thing, shown});
WayShow.paint(ctx, api.markOf, px, now, 1, api.art().wall); Prompts.show(r, WayShow.rows(faceRows)); api.aim = r;
}
if (!words) { ctx.restore(); return; }
const ny = (y) => fy(y) - Math.max(0, 12 - 3 * zoom), nsy = Object.assign(ny, {up: ny, out: ny});
for (const s of seen.list) if (s.q && s.q.e && (s.q.e.kind === "agent" || s.q.e.name)) drawNameplate(s.q, sx, nsy, S);
for (const s of seen.list) if (s.q && s.q.e && (ANIMALS[s.q.e.kind] || !bubbles.some((b) => b.name === s.q.e.name))) drawEmote(s.q, sx, sy, S);
drawProgress(sx, sy, S); HdFx.words(seen, api.screenOf); drawBubbles(sx, sy, S, t); ctx.textAlign = "start";
}
function pieces(list) {
const out = [], big = (k) => (k === "mossback" ? [30, 8] : ANIMALS[k] && ANIMALS[k].fw === 32 ? [16, 5] : [9, 4]), add = (item, x, y, z, steps) => { const l = HdThings.ghost(item, x, y, z, steps); if (l) out.push(...l); };
for (const s of list) if (s.q || s.pile) { const [w, d] = s.pile ? [8, 3] : big(s.q.e && s.q.e.kind); for (const b of HdThings.shadow(w, d, (s.zs === undefined ? s.z : s.zs) * RELIEF_STEP + .5)) out.push([s.x, s.y + (s.pile ? .08 : .42), b]); if (s.q) HdSun.body(out, s); }
HdThings.plans.clear(); if (Build.on) for (const j of Build.S.plans.values()) if (!j.take && !j.dig && j.state !== "bad" && "W%+".includes(PLACEABLE_BLOCK[j.item] || "-")) HdThings.plans.add(j.x + "," + j.y + "," + (j.up ? j.z : floorAt(j.x, j.y)));
if (Build.on) for (const j of Build.S.plans.values()) if (!j.take && !j.dig && j.state !== "bad") add(j.item, j.x, j.y, j.up ? j.z : undefined, j.steps);
const a = Build.on ? Build.aim() : aimedTile(), it = a && a.it; if (a && a.p && it && it.ghost && it.ok !== false && !it.info && !it.walk) add(it.ghost, a.p.x, a.p.y, it.z !== undefined && !it.draw ? it.z : undefined, it.steps);
return out;
}
api.sky = (t) => { const s = Curve.sky(t); return api.on && hl ? Object.assign({}, s, {line: Math.round(hl) * zoom}) : s; };
let hKey = "", hRaw = 1e9;
function horizon(tx, ty, L) { const hk = [tx, ty, L, cam.pitch.toFixed(1), Math.round(camL * 8), eng.stamp, api.builds, !!gen].join(); let y = hRaw; if (hk !== hKey) { hKey = hk; y = -1e9; for (let dx = -18; dx <= 18; dx += 9) { let m = 1e9; for (let dn = 6; dn <= 22; dn += 2) { const c = Voxels.host.column(tx + dx, ty - dn), a = eng.at(tx + dx + .5, ty - dn, c && c.length ? c[c.length - 1] : L); if (a) m = Math.min(m, a[1]); } if (m < 1e8) y = Math.max(y, m); } if (y < -1e8) y = 1e9; hRaw = y; } hy = y < 1e8 ? y : -1e9; }
let eKey = "", eY = 0;
function eyeLine(at, w, h) { const k = [cam.pitch.toFixed(2), cam.fov, api.bend, w, h].join(); if (k !== eKey) { let m = 1e9; for (let dn = 1; dn <= 120; dn++) { const a = eng.at(at[0], at[1] - dn, at[2] - .5); if (a && isFinite(a[1])) m = Math.min(m, a[1]); } eKey = k; eY = m < 1e8 ? m : 0; } return eY; }
function after() {
const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now; api.n++;
const p = api.eye ? api.eye() : ents.get("agent" + myId); if (!p) return;
const H0 = Voxels.host, wet = (x, y) => H0.water && H0.water(x, y) && H0.waterTop ? H0.waterTop(x, y) : -1e9;
const t0 = performance.now(), [L, Lf] = p.free ? [p.z, p.z] : HdLevel.of(p, now), tx = Math.round(p.x), ty = Math.round(p.y);
const w = Math.ceil(cv.width / Z()), h = Math.ceil(cv.height / Z());
const b0 = 36 + 16 * Math.max(0, Math.min(1, h / w - 1)); south = Math.min(R, Math.ceil(h / 32 / Math.sin(b0 * Math.PI / 180)) + 3 + Math.ceil(Math.max(0, topAt(tx, ty) - L) * .9));
const fy = p.y - Math.floor(p.y), cy = Math.floor(p.y), need = p.free ? b0 : HdLevel.under(tx, ty, L) || HdLevel.steep(tx, ty, L, landVer) ? clr ?? b0 : Math.max(b0, Math.min(api.steep, HdLevel.clear(tx, cy, L, south) * (1 - fy) + HdLevel.clear(tx, cy + 1, L, south) * fy)); clr = clr === null || Math.abs(need - clr) < .05 ? need : clr + (need - clr) * (1 - Math.exp(-dt / .06)); const base = clr;
const sw = p.free ? 0 : +HdLevel.steep(tx, ty, L, landVer);
if (sw === stage) flip = now; else if (sw || now - flip > HOLD) { stage = sw; flip = now; }
const want = base + (api.steep - base) * stage; tilt = pitN === null ? stage : Math.max(0, Math.min(1, tilt + (stage ? 1 : -1) * Math.min(dt, .034) / EASE)); pitN = base + (api.steep - base) * tilt * tilt * (3 - 2 * tilt); cam.pitch = pitN; cam.base = base; cam.want = want;
const kS = eyeRise(want), cov0 = p.free ? false : api.force !== null ? api.force > 0 : HdLevel.under(tx, ty, L), cov = cov0 || (api.force === null && now - covAt < HOLD), dep = p.free ? 0 : Math.max(0, topAt(tx, ty) - L);
const holeK = tilt * HdEase.of("lift", !p.free && !cov0 && !!sw);
const lift = p.free || cov0 ? 0 : HdLevel.lift(tx, ty, L, cam.pitch, p.e && swimsAt(p, p.e) ? SWIM.sink : 0) * holeK, liftD = p.free || cov0 ? 0 : HdLevel.lift(tx, ty, L, cam.pitch) * holeK;
const own = HdLevel.own(tx, ty, L, cov0);
if (cov0) covAt = now;
grow = cov ? Math.min(CAP, grow + dt / GROW * CAP) : Math.max(0, grow - dt / GROW * CAP); api.u = grow / CAP; const st = cov ? CAP : 0;
eng = eng || VoxStyle.create(Object.assign({}, Voxels.host, {paintTop: shore, models: (x, y, cz) => { const a = Models.at(x, y), b = floorAt(x, y) > cz ? null : HdThings.at(x, y); return a && b ? a.concat(b) : a || b; },
chunkKey: (x0, y0, n) => { let c = built.get(x0 + "," + y0); if (!c || c[0] !== Floors.ver) { let f = ""; for (let y = y0; y < y0 + n && !f; y++) for (let x = x0; x < x0 + n; x++) if (Floors.any(x, y)) { f = "f"; break; } if (built.size > 2000) built.clear(); built.set(x0 + "," + y0, c = [Floors.ver, f]); } const fl = c[1];
return (fl ? keyNear : keyFar) + fl + [[0, 0], [-1, 0], [n, 0], [0, -1], [0, n]].map(([i, j]) => (blockOf(x0 + i, y0 + j) ? 1 : 0)).join(""); }}), cfg);
if (eng.lost) { eng.forget(); key = ""; }
keyNear = HdThings.key(); keyFar = HdThings.key(false); const rx = Math.min(R, Math.ceil(w / 32 * 1.4) + 3), k = [tx, ty, L, st, keyNear, eng.stamp, rx, south].join();
const wg = cov ? CAP : 0; if (wg !== wantG) { wantG = wg; since = now; }
if (k !== key && !gen) { gen = eng.steps(tx, ty, L, {r: R, rx, rs: south + 1, deep: 20, sea: 1, win: st ? {reach: 24} : {reach: 7, walk: true}}); key = k; genG = st; hurry = st !== shownG; api.build = 0; api.builds++; genAt = come(tx, ty) ? [tx, ty] : null; }
if (gen) { const b0 = performance.now(); while (performance.now() - b0 < (p.rush || held ? 12 : hurry || st ? 5 : 2.5)) if (gen.next().done) { gen = null; break; } api.build = Math.max(api.build, performance.now() - b0); slice1 = performance.now() - b0; api.slice = Math.max(api.slice, slice1); api.water = eng.water;
if (!gen) { shownG = genG; landAt = genAt; if (genG === wantG && since) { api.lag = performance.now() - since; since = 0; } } }
held = !p.free && (!landAt || Math.abs(landAt[0] - tx) > 8 || Math.abs(landAt[1] - ty) > 8); if (!held) heldAt = 0; else if (!heldAt) heldAt = now; if (held && now - heldAt > 2500) held = false;
{ const fl = falling(p, now), air = fl && fl.air, far = camL !== null && Math.abs(Lf - camL); if (air) camV = 0;
if (camL === null || far > 40) { camL = Lf; camV = 0; } else if (air) camL = Math.max(Math.min(camL, L + 9), camL - 40 * dt); else if (far > 3 || camV) { const e = camL - Lf, a = camV + 12 * e, q = Math.exp(-12 * dt); camL = Lf + (e + a * dt) * q; camV = (camV - 12 * a * dt) * q; if (Math.abs(Lf - camL) < .07 && Math.abs(camV) < 1) { camL = Lf; camV = 0; } }
else camL = far < .07 ? Lf : camL + (Lf - camL) * (1 - Math.exp(-dt / .1)); }
const list = [];
const stood = (c, x, y, z, gh, m) => {
if (c === "l") { const k = [x, y, z, landVer, Floors.ver].join(), ln = Climb.lean(x, y, z); let lc = lads.get(k); if (!lc) { if (lads.size > 60) lads.clear(); const LH = Math.ceil((shOf(ln ? ln.top - z : 2) + 48) / 16) * 16, R0 = LH - 32, a = HdThings.painted(48, LH, () => Climb.drawLadder(x, y, z, (X) => 16 + (X - x) * 16, (Y) => R0 + (Y - y) * 16 + shOf(z), 16, 1)); lc = document.createElement("canvas"); lc.width = 48; lc.height = LH;
const q = lc.getContext("2d"); q.drawImage(a, 0, 0, 48, R0 - 10, 0, 12, 48, R0 - 10); q.drawImage(a, 0, R0 + 2, 48, LH - R0 - 2, 0, R0 + 2, 48, LH - R0 - 2); lads.set(k, lc); }
list.push({canvas: lc, fx: 24, fy: lc.height - 16, x: x + .5, y: y + (ln && ln.dy < 0 ? .12 : ln && ln.dy > 0 ? .9 : .5), z, flat: true, still: true, d: true, tx: x, ty: y, ghost: gh}); return; }
const s = objectSprite(c, x, y, now / 1000); if (!s || !s[0] || !s[0].width) return;
const o = m || {}; if (o.it && o.img === s[0] && o.sx === s[1] && o.sy === s[2] && o.sw === s[3] && o.sh === s[4] && o.dx === s[5] && o.dy === s[6]) { o.it.fade = undefined; list.push(o.it); return; }
const cd = HdThings.card(c, x, y, s);
const r2 = cd || c === "g" ? 0 : HdThings.foot(c, s), plain = cd || c === "g" ? null : {fy: r2, card: {b: spriteBounds(s[0], s[1], s[2], s[3], s[4]) || [0, 0, s[3], s[4]]}};
const it = Object.assign(cd ? {} : thing(s), cd, {x: x + .5, y: y + (cd ? cd.y : plain ? (s[6] + r2) / 16 : 1), z, lamp: c === "^" || c === "x" ? 2 : 0, flat: c === "g", tx: x, ty: y, card: cd}, plain);
Object.assign(o, {img: s[0], sx: s[1], sy: s[2], sw: s[3], sh: s[4], dx: s[5], dy: s[6], it}); list.push(it);
};
const memo = (c, x, y, z) => { const k = c + "," + x + "," + y + "," + z; let o = stoodOf.get(k); if (!o) { if (stoodOf.size > 6000) stoodOf.clear(); stoodOf.set(k, o = {}); } return o; };
const ck = [tx, ty, L, landVer, Floors.ver, api.builds, !!gen, Math.floor(now / 250)].join();
if (ck !== candKey) { candKey = ck; cand = []; for (let y = ty - R; y <= ty + south; y++) for (let x = tx - R; x <= tx + R; x++) {
const c = combAt(x, y), up = Floors.any(x, y) ? HdThings.loose(x, y) : null; if (up) for (const [ch, z] of up) cand.push([ch, x, y, z, memo(ch, x, y, z)]);
if (c && isObject(c) && !HdThings.is(c, x, y)) { const z = standAt(c, x, y); cand.push([c, x, y, z, memo(c, x, y, z)]); }
} }
{ const wmp = winMap(); HdEase.frame(now); for (const [c, x, y, z, m] of cand) { const n0 = list.length, a = z > floorAt(x, y) ? HdEase.of(x + "," + y, !wmp.has(x + "," + y)) : 1; if (a > 0) stood(c, x, y, z, false, m); if (a < 1) for (let i = n0; i < list.length; i++) list[i].fade = a; } }
{ const a = Build.on ? Build.aim() : aimedTile(), it = a && a.it, q = it && (it.own || a.p); if (q && it.ghost === "ladder" && it.z !== undefined && it.ok !== false && !it.info) stood("l", q.x, q.y, it.z, true);
if (Build.on) for (const j of Build.S.plans.values()) if (j.item === "ladder" && !j.take && j.state !== "bad") stood("l", j.x, j.y, j.z, true); }
for (const [ix, iy, pile] of groundItems) if (Math.abs(ix - tx) <= R && iy >= ty - R && iy <= ty + south && !lootAt(ix, iy)) {
const names = Object.keys(pile).slice(0, 3), k = names.join(); let c = piles.get(k);
if (!c) { c = document.createElement("canvas"); c.width = 24; c.height = 16; const g = c.getContext("2d"); names.forEach((n, i) => { const [dx, dy] = pileAt(i, names.length); g.drawImage(ghostIcon(n), 7 + dx, 3 + dy); }); piles.set(k, c); }
list.push({canvas: c, fx: 12, fy: 14 + Math.round(Math.sin(now / 1000 * 2.4 + ix * 1.3 + iy) + 1), still: true, d: true, pile: true, x: ix + .5, y: iy + .7, z: floorAt(ix, iy)});
}
const wmB = winMap(), wr = wmB.size ? winRect() : null;
for (const q of ents.values()) if (q.x !== undefined && Math.abs(q.x - p.x) < 16 && Math.abs(q.y - p.y) < 12) {
const qx = Math.round(q.x), qy = Math.round(q.y), z = q === p ? Lf + lift : FLOORS && Floors.any(qx, qy) ? Floors.standOf(q, qx, qy) : q.e && typeof q.e.z === "number" && !H0.water(qx, qy) ? q.e.z : Math.max(topAt(qx, qy), wet(qx, qy));
if (q !== p && z < topAt(qx, qy)) { const c = H0.column(qx, qy), b = winMap().get(qx + "," + qy); let over = false; for (let zz = z + 1; zz <= topAt(qx, qy) && !over; zz++) over = solidAt(c, zz); if (over && !(b && z >= b[0] - 1 && z <= b[1])) continue; }
if (q !== p && wmB.size) { const b = wmB.get(qx + "," + qy), a = !b && eng.at(q.x + .5, q.y + .5, z); if (!(b ? z >= b[0] - 1 && z <= b[1] : Math.abs(z - L) <= 1) && (b || (a && wr && a[0] + 6 > wr[0] && a[0] - 6 < wr[2] && a[1] > wr[1] && a[1] - 14 < wr[3]))) continue; }
const s = ent(q, now, z);
list.push({canvas: s.canvas, fx: s.fx, fy: s.fy, fo: s.fo, x: q.x + .5, y: q.y + .5, z, zh: q === p ? Lf + liftD : undefined, zs: q === p ? L : z, d: q !== p, top: q === p, on: true, q, lamp: q.e && q.e.kind === "agent" ? (q === p && dep > 0 ? 2 : 1) : 0});
const wk = q.wake && q.wake.length && wakePicture(q, now);
if (wk) list.push({canvas: wk.canvas, fx: wk.fx, fy: wk.fy, x: q.x + .5, y: q.y + .5, z, lie: true});
}
HdFx.add(list, p, now, dt);
list.sort((a, b) => a.y - b.y);
const snap = (v) => Math.round(v * 16) / 16;
const sky = typeof Curve !== "undefined" && Curve.on ? api.sky(now / 1000) : null, low = sky ? sky.low : [.62, .78, .86];
const wl = WaterBed.view(Voxels.engine, now / 1000), day = 1, ed = h / (32 * Math.tan(cam.fov * Math.PI / 360));
const light = {amb: .8, lr: 8, day, fog: [ed + 4, ed + 22], fogc: low, clear: [0, 0, 0], ca: 0, sun: HdSun.sun, rim: .25, wa: .92, wtint: wl && wl.tint ? wl.tint.subarray(0, 20) : null};
let pic = eng.draw({w, h, cam, at: [snap(p.x + .5), snap(p.y + .5), Math.round(camL * 8) / 8 + .5], bend: api.bend, t: now / 1000, light,
water: typeof waterCv !== "undefined" && waterView ? {canvas: waterCv, x: waterView.x, y: waterView.y, ver: Voxels.wver} : null, dep, own, rim: HdLevel.rim(tx, ty, L), hole: tilt * HdEase.of("shut", !p.free && HdLevel.shut(tx, ty, L, kS)), hid: lift > 0 ? 0 : 1, behind: p.free || cov0 || lift > 0 ? 0 : HdEase.of("behind", HdLevel.over(tx, ty, L, kS) >= 1), win: api.nowin ? 0 : 1, sprites: list, way: WayShow.land(), ghosts: pieces(list), hour: hour(w, h, list, 0)});
if (!pic) { noGL = true; return; }
seen = {tx, ty, L, lift, rim: HdLevel.rim(tx, ty, L), top: tilt > .5 && !cov0, ks: eyeRise(cam.pitch), k: 1, me: list.find((q) => q.top), list, at: [snap(p.x + .5), snap(p.y + .5), Lf]}; horizon(tx, ty, L + dep); hl = Math.max(8, eyeLine([snap(p.x + .5), snap(p.y + .5), Math.round(camL * 8) / 8 + .5], w, h) + 2);
api.faces = eng.faces; api.models = eng.models;
api.held = held; if (held) { api.ms = performance.now() - t0; return; }
api.drew = HdView.show({w, h, pic, marks: HdView.marks(() => written(p, now, false)), fresh: eng.fresh, sky, runs: seaRuns(w, tx, ty, [snap(p.x), snap(p.y), L, h, cam.pitch].join())});
wrote = HdView.words(() => written(p, now, true), now);
api.ms = performance.now() - t0;
}
function boxed(x, y, lo) {
let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
for (const b of HdThings.at(x, y) || []) if (!b.shade && (lo === undefined || (b.z < lo + 20 && b.z + b.h > lo - 2))) for (let n = 0; n < 8; n++) { const p = api.screenOf(x + (b.x + (n & 1) * b.w) / 16, y + (b.y + (n >> 1 & 1) * b.d) / 16, (b.z + (n >> 2) * b.h) / RELIEF_STEP); if (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } }
return x1 > x0 ? {x: x0, y: y0, w: x1 - x0, h: y1 - y0} : null;
}
Object.defineProperty(api, "level", {get: () => [seen ? seen.L : null, camL, seen ? seen.at[2] : null, seen ? seen.lift : 0, seen ? seen.rim : null]});
api.forget = () => { if (eng) { eng.forget(); key = ""; } };
api.spaceAt = (x, y) => (eng ? eng.spaceAt(x, y) : null); api.winAt = (x, y) => winMap().get(x + "," + y) || null;
let wmV = -1, wm = new Map(); const winMap = () => { const w = eng ? eng.win : null; if (!w || !w.n || w.a <= 0) { if (wm.size) wm = new Map(); wmV = -1; return wm; } if (w.tiles !== wmV) { wmV = w.tiles; wm = new Map(); for (const [x, y, lo, hi] of w.tiles) { const k = x + "," + y, o = wm.get(k); wm.set(k, o ? [Math.min(o[0], lo), Math.max(o[1], hi)] : [lo, hi]); } } return wm; };
const winRect = () => { let r = null; for (const [x, y, lo, hi] of eng.win.tiles) for (const z of [lo, hi + 1]) for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) { const s = eng.at(a, b, z); if (s) r = r ? [Math.min(r[0], s[0]), Math.min(r[1], s[1]), Math.max(r[2], s[0]), Math.max(r[3], s[1])] : [s[0], s[1], s[0], s[1]]; } return r; };
const shown = (x, y) => { const t = topAt(x, y), m = winMap(), b = m.get(x + "," + y); if (b) return Math.min(t, b[0]); for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const n = m.get((x + dx) + "," + (y + dy)); if (n && n[1] < t) return n[1]; } return t; };
api.markOf = (x, y, z) => api.screenOf(x, y, HdLevel.raise(z, seen));
api.art = () => (seen ? {u: zoom / seen.k, at: api.markOf, behind: (x, y, Z0) => { const z = HdLevel.raise(Z0, seen), k = eyeRise(cam.pitch), y0 = Math.floor(y); for (let d = 1; d <= 8; d++) if (topAt(Math.floor(x), y0 + d) > z + (y0 + d - y) * k) return true; return false; }, wall: (x, y, z) => { const f = HdLevel.wall(x, y, z, seen); return f ? (X, Y, Z) => api.screenOf(...HdLevel.wallAt(X, Y, Z, seen, f)) : null; },
body: seen.me ? HdLevel.body(seen.me, api.screenOf(seen.me.x, seen.me.y, seen.me.z), zoom / seen.k) : null} : null);
api.screenOf = (x, y, z) => { if (!eng || !seen) return null; const a = eng.at(x, y, z); return a && [a[0] * zoom / seen.k, a[1] * zoom / seen.k]; };
api.pick = (mx, my, zf) => {
if (!eng || !seen) return null;
const inq = (P, q) => { let s = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], c = (b[0] - a[0]) * (P[1] - a[1]) - (b[1] - a[1]) * (P[0] - a[0]); if (c && s && Math.sign(c) !== s) return false; if (c) s = Math.sign(c); } return true; };
const wmp = winMap(), flr = (x, y) => { const b = wmp.get(x + "," + y), t = topAt(x, y); return b ? Math.min(t, b[0]) : t; }, zo = (x, y) => (zf ? zf(x, y) : Models.up(x, y) ? liftAt(x, y) / zoom / RELIEF_STEP : flr(x, y)), part = (q) => Math.max(0, Math.min(.999, (my - Math.min(q[0][1], q[1][1])) / Math.max(1, Math.max(q[2][1], q[3][1]) - Math.min(q[0][1], q[1][1]))));
if (!zf && wmp.size) for (const [x, y, lo, hi] of eng.win.tiles.slice().sort((a, b) => b[1] - a[1])) { const q = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([a, b]) => api.screenOf(a, b, lo)); if (q.every((v) => v) && inq([mx, my], q)) return {x, y, fy: part(q)};
if (!wmp.has(x + "," + (y - 1)) && topAt(x, y - 1) > lo) { const f = [[x, y, Math.min(hi, topAt(x, y - 1))], [x + 1, y, Math.min(hi, topAt(x, y - 1))], [x + 1, y, lo], [x, y, lo]].map((v) => api.screenOf(...v)); if (f.every((v) => v) && inq([mx, my], f)) return {x, y: y - 1, fy: .999, face: true, down: Math.floor(part(f) * (Math.min(hi, topAt(x, y - 1)) - lo))}; } }
for (let y = seen.ty + south; y >= seen.ty - R; y--) for (let x = seen.tx - R; x <= seen.tx + R; x++) {
if (!zf) { const c0 = combAt(x, y), pb = c0 && "W%+#g".includes(c0) && HdThings.is(c0, x, y) ? boxed(x, y) : null; if (pb && mx >= pb.x && mx <= pb.x + pb.w && my >= pb.y && my <= pb.y + pb.h) return {x, y, fy: .5}; }
const z = zo(x, y), zs = zf ? z : zo(x, y + 1);
if (zs < z) { const q = [[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, zs], [x, y + 1, zs]].map((v) => api.screenOf(...v)); if (q.every((v) => v) && inq([mx, my], q)) return {x, y, fy: .999, face: true, down: Math.floor(part(q) * (z - zs))}; }
const q = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([a, b]) => api.screenOf(a, b, z));
if (q.every((v) => v) && inq([mx, my], q)) return {x, y, fy: part(q)};
}
return null;
};
api.catSeen = (box) => {
const s = seen && seen.me; if (!s || !eng) return 0; const a = eng.at(s.x, s.y, s.z); if (!a) return 0;
const sg = s.canvas.getContext("2d").getImageData(0, 0, s.canvas.width, s.canvas.height).data, g = HdView.read(0, 0, cv.width, cv.height).data;
let n = 0, ok = 0, out = 0; const B = box && box.map((v) => v * cv.width / innerWidth);
for (let j = 0; j < s.canvas.height; j++) for (let i = 0; i < s.canvas.width; i++) { const o = (j * s.canvas.width + i) * 4; if (sg[o + 3] < 128) continue; n++;
const X = Math.floor((Math.round(a[0]) - s.fx + i + .5) * Z()), Y = Math.floor((Math.round(a[1]) - s.fy + j + .5) * Z()), p = (Y * cv.width + X) * 4;
if (X >= 0 && Y >= 0 && X < cv.width && Y < cv.height && Math.abs(g[p] - sg[o]) + Math.abs(g[p + 1] - sg[o + 1]) + Math.abs(g[p + 2] - sg[o + 2]) < 60) { ok++; if (B && (X < B[0] || X > B[2] || Y < B[1] || Y > B[3])) out++; } }
return box ? [n ? ok / n : 0, out] : n ? ok / n : 0;
};
api.stands = () => (seen ? seen.list.filter((s) => s.tx !== undefined && !s.q).map((s) => [s.tx, s.ty, s.z]) : []);
api.read = (...a) => HdView.read(...a); api.bodies = () => (seen ? seen.list.filter((s) => s.q && !s.top).map((s) => [s.q.e.kind, s.z]) : []); api.bare = () => (eng && seen ? eng.bare(Math.max(0, Math.ceil(hy) + 2)) : 0); api.raw = () => (eng ? eng.raw() : 0); api.fades = () => (seen ? seen.list.filter((s) => s.fade !== undefined).map((s) => [s.tx, s.ty, s.fade]) : []); api.blank = () => eng && eng.blank(); Object.defineProperty(api, "units", {get: () => eng && eng.units}); Object.defineProperty(api, "why", {get: () => eng && eng.why}); Object.defineProperty(api, "wrote", {get: () => wrote}); Object.defineProperty(api, "made", {get: () => (eng ? eng.made : 0)}); Object.defineProperty(api, "work", {get: () => (eng ? eng.work : null)});
{ const f0 = frame; frame = function (now) {
const t0 = performance.now(), keep = ctx; api.live = api.on && !noGL && Voxels.engine.ready() && !!(api.eye || ents.get("agent" + myId)); api.drew = wrote = false; slice1 = 0;
if (api.live) ctx = HdView.sink(); try { f0(now); } finally { ctx = keep; }
if (api.live) after(); else HdView.hide();
HdView.perf(now, performance.now() - t0, api.drew, eng ? eng.calls : 0, slice1, wrote);
};
const d0 = drawTile; drawTile = function (x, y, to = null) { d0(x, y, to); if (!to && eng) eng.touch(x, y); };
const a0 = arriveBlock; arriveBlock = function (b) { a0(b); if (eng) eng.touchBox(b.bx * B, b.by * B, b.bx * B + B - 1, b.by * B + B - 1); }; }
return api;
})();
;
const TOUCH = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || new URLSearchParams(location.search).has("touch");
const STICK_DEAD = 12, STICK_RUN = 64;
let stick = null;
function touchUI() {
const el = (tag, id, html, parent = document.body) => { const e = document.createElement(tag); e.id = id; e.innerHTML = html; parent.appendChild(e); return e; };
el("div", "pad", '<div id="stickbase"></div><div id="stickknob"></div>');
const btns = el("div", "tbtns", "");
for (const [id, label] of [["tA", "A"], ["tB", "B"]]) el("div", id, `<span class="cap"></span><span class="lbl">${label}</span>`, btns);
const ctx_ = el("div", "tctx", "");
el("div", "tUp", "Up", ctx_); el("div", "tDown", "Down", ctx_); el("div", "tBuild", "Build", ctx_);
el("div", "tJump", "Jump", ctx_); el("div", "tDig", "Dig up", ctx_); el("div", "tEat", "Eat", ctx_); el("div", "tPick", "Pick up", ctx_);
const top = el("div", "ttop", "");
el("div", "tBag", "Items", top); el("div", "tCraft", "Craft", top); el("div", "tTalk", "Talk", top); el("div", "tMenu", "Menu", top);
return {btns, ctx_};
}
function padDisc(n, face, ring) {
const c = document.createElement("canvas"), g = c.getContext("2d"), lip = ring ? 0 : 2, r = n / 2, R = r - lip / 2; c.width = n; c.height = n;
const far = (x, y, cy) => Math.hypot(x + .5 - r, y + .5 - cy);
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
const d = far(x, y, R), core = d <= R - 1;
if (d > R && far(x, y, R + lip) > R) continue;
g.fillStyle = ring ? (core ? "rgba(40,28,24,.22)" : "rgba(255,248,232,.6)") : !core ? "#5b3f36" : d > R - 2 && x + y < n - lip ? "#fff8e6" : face;
g.fillRect(x, y, 1, 1);
}
return `url(${c.toDataURL()})`;
}
const PAD_KEY = {N: "arrowup", S: "arrowdown", W: "arrowleft", E: "arrowright"};
let padDir = null;
function setDir(dir, run) {
if (Build.on || padDir) {
const to = Build.on ? dir : null;
if (to !== padDir) { if (padDir) dispatchEvent(new KeyboardEvent("keyup", {key: PAD_KEY[padDir]})); padDir = to; if (to) Build.onKey(PAD_KEY[to], {}); }
if (Build.on) return;
}
for (const k of ["arrowup", "arrowdown", "arrowleft", "arrowright"]) keys.delete(k);
if (dir) keys.add({N: "arrowup", S: "arrowdown", W: "arrowleft", E: "arrowright"}[dir]);
runKey = !!run;
syncWalk();
}
let tapEat = null;
addEventListener("pointerup", (e) => { if (tapEat && e.pointerId === tapEat.id) tapEat.until = performance.now() + 120; }, true);
addEventListener("pointercancel", (e) => { if (tapEat && e.pointerId === tapEat.id) tapEat = null; }, true);
addEventListener("click", (e) => { const t = tapEat; if (!t || !t.until) return; tapEat = null; if (performance.now() < t.until) { e.stopPropagation(); e.preventDefault(); } }, true);
function holdButton(e, fn) {
let t = null;
e.addEventListener("pointerdown", (ev) => {
ev.preventDefault(); e.setPointerCapture(ev.pointerId); e.classList.add("down"); tapEat = {id: ev.pointerId, until: 0};
inputMode = "keys"; fn(false); clearInterval(t);
t = setInterval(() => { if (!myAction && !pendingAct) fn(true); }, 220);
});
const up = () => { clearInterval(t); t = null; e.classList.remove("down"); };
for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) e.addEventListener(ev, up);
}
function tapButton(e, fn) {
e.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); e.classList.add("down"); tapEat = {id: ev.pointerId, until: 0}; fn(); });
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) e.addEventListener(ev, () => e.classList.remove("down"));
}
if (TOUCH) {
document.body.classList.add("touch"); hudTall = .26;
if (Math.min(innerWidth, innerHeight) < 520 && !new URLSearchParams(location.search).get("zoom") && !localStorage.getItem("megastructure-zoom")) zoom = 2;
const {btns} = touchUI(), pad = $("pad"), base = $("stickbase"), knob = $("stickknob");
const fingers = new Map(), PINCH_MS = 300; let pinch = null, worldAt = -1e9;
const pinched = (e) => {
if (!fingers.has(e.pointerId)) return;
fingers.set(e.pointerId, e);
if (fingers.size !== 2) { pinch = null; return; }
const [a, b] = [...fingers.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
if (!pinch) pinch = d;
else if (d / pinch > 1.35 || d / pinch < 1 / 1.35) { zoomBy(d > pinch ? 1 : -1); pinch = d; }
};
pad.addEventListener("pointerdown", (e) => {
if (!me || stick) return;
e.preventDefault(); pad.setPointerCapture(e.pointerId);
stick = {id: e.pointerId, x: e.clientX, y: e.clientY, dir: null, t: performance.now(), pinch: fingers.size === 1 && performance.now() - worldAt < PINCH_MS};
if (stick.pinch) { fingers.set(e.pointerId, e); return; }
base.style.left = knob.style.left = e.clientX + "px"; base.style.top = knob.style.top = e.clientY + "px";
pad.classList.add("on"); inputMode = "keys";
});
pad.addEventListener("pointermove", (e) => {
if (!stick || e.pointerId !== stick.id) return;
if (stick.pinch) return pinched(e);
let dx = e.clientX - stick.x, dy = e.clientY - stick.y;
const d = Math.hypot(dx, dy), max = STICK_RUN + 10;
if (d > max) { dx *= max / d; dy *= max / d; }
knob.style.left = stick.x + dx + "px"; knob.style.top = stick.y + dy + "px";
let dir = null;
if (d > STICK_DEAD) {
const h = Math.abs(dx) > Math.abs(dy) * (stick.dir === "N" || stick.dir === "S" ? 1.3 : 1 / 1.3);
dir = h ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N");
}
const run = d > (runKey ? STICK_RUN - 14 : STICK_RUN);
if (dir) stick.went = true;
if (dir !== stick.dir || run !== runKey) { stick.dir = dir; setDir(dir, run); }
});
const release = (e) => {
if (!stick || e.pointerId !== stick.id) return;
const s = stick; stick = null; pad.classList.remove("on"); setDir(null, false); fingers.delete(e.pointerId); pinch = null;
if (me && e.type === "pointerup" && !s.pinch && !s.went && performance.now() - s.t < 350) { const q = tileAtScreen(s.x, s.y); if (Build.on) Build.click(q, false); else clickTile(q, false); }
};
for (const ev of ["pointerup", "pointercancel"]) pad.addEventListener(ev, release);
holdButton($("tA"), (again) => { if (!me) return; if (!Build.on) useFacing(false); else if (!again) { Build.click(Build.S.at, false); Build.S.hold = " "; } });
for (const ev of ["pointerup", "pointercancel"]) $("tA").addEventListener(ev, () => { if (Build.S.hold === " ") Build.S.hold = null; });
holdButton($("tB"), () => { if (!me) return; if (Build.on) Build.click(Build.S.at, true); else useFacing(true); });
tapButton($("tBuild"), () => Build.toggle()); tapButton($("tUp"), () => Build.onKey("e", {})); tapButton($("tDown"), () => Build.onKey("q", {}));
$("tA").style.backgroundImage = padDisc(28, "#f7e7c6"); $("tB").style.backgroundImage = padDisc(22, "#e3d3b8"); knob.style.backgroundImage = padDisc(20, "#f7e7c6"); base.style.backgroundImage = padDisc(50, "", true);
$("craftfind").placeholder = "Search"; $("say").placeholder = "Say something…";
for (const ev of ["gesturestart", "dblclick"]) document.addEventListener(ev, (e) => e.preventDefault(), {passive: false});
document.addEventListener("contextmenu", (e) => { if (!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); });
tapButton($("tEat"), () => useSelected()); holdButton($("tDig"), () => DigUp.run());
tapButton($("tPick"), () => act("pick_up", {}));
tapButton($("tJump"), () => jumpKey());
tapButton($("tBag"), () => toggleBag());
const beside = () => { const r = Math.round($("goalhint").getBoundingClientRect().right); if (r > 0) document.body.style.setProperty("--goalsr", r + "px"); };
new ResizeObserver(beside).observe($("goalhint"));
tapButton($("tCraft"), () => toggleCraft());
tapButton($("tTalk"), () => openChat());
tapButton($("tMenu"), () => openMenu());
cv.addEventListener("pointerdown", (e) => {
if (e.pointerType !== "touch") return;
fingers.set(e.pointerId, e); worldAt = performance.now();
if (stick && !stick.pinch && !stick.dir && worldAt - stick.t < PINCH_MS) { stick.pinch = true; pad.classList.remove("on"); fingers.set(stick.id, {clientX: stick.x, clientY: stick.y}); }
});
cv.addEventListener("pointermove", pinched);
for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, (e) => { fingers.delete(e.pointerId); pinch = null; });
let sig = "";
setInterval(() => {
if (!me) return;
const rows = availableActions(), get = (k) => rows.find((r) => r[0] === k);
const a = Build.on ? rows[1] : get("Space"), b = get("X"), up = !Build.on && rows.find((r) => r[0] === capOf("up") && r[3]), bd = true, s = [a && a[1], a && a[2], b && b[1], up && up[1], !!get("E"), !!get("F"), Build.on, !!bd, !!get(capOf("jump"))].join("|");
if (s !== sig) {
sig = s;
$("tA").querySelector(".cap").textContent = a ? a[1] : "";
$("tA").classList.toggle("bad", !!(a && a[2])); $("tA").classList.toggle("idle", !a);
$("tB").querySelector(".cap").textContent = b ? b[1] : "";
$("tB").classList.toggle("idle", !b);
$("tEat").style.display = get("E") ? "flex" : "none"; $("tDig").style.display = up ? "flex" : "none"; $("tDig").textContent = up ? up[1] : "Dig up";
$("tPick").style.display = get("F") ? "flex" : "none"; $("tJump").style.display = get(capOf("jump")) ? "flex" : "none";
$("tBuild").style.display = bd ? "flex" : "none"; $("tBuild").textContent = Build.on ? "Done" : "Build"; $("tUp").style.display = $("tDown").style.display = Build.on ? "flex" : "none";
}
if (hudFit()) return;
const hud = $("hud"), w = Math.max(hud.scrollWidth, $("vitals").scrollWidth), h = hud.offsetHeight;
const k = Math.min(1, (innerWidth - 16) / (w || 1));
hud.style.transform = k < 1 ? `translateX(${(innerWidth - w * k) / 2}px) scale(${k})` : "";
const narrow = !hudSide && innerWidth - w * k < 2 * 190;
document.body.style.setProperty("--tbot", (narrow ? h * k + 18 : 12) + "px");
}, 200);
}
;
let tools = null;
const LOCAL = {coords: "the debug screen (F3): where you are", perf: "the debug screen (F3): what a frame costs"};
const comp = {items: [], note: "", at: 0, from: 0, to: 0};
function askTools() {
if (tools || !me) return;
rpc("tools", {}).then((r) => { if (r.ok && r.tools) { tools = r.tools; if ($("chatbox").classList.contains("open") && $("say").value.startsWith("/")) suggest(); } });
}
function matching(list, typed) {
const t = typed.toLowerCase(), has = list.filter((it) => it.put.toLowerCase().includes(t)), starts = has.filter((it) => it.put.toLowerCase().startsWith(t));
if (t) starts.sort((a, b) => a.put.length - b.put.length);
return [...starts, ...has.filter((it) => !starts.includes(it))];
}
function nearby(pick) {
const s = myPos(); if (!s) return [];
return [...ents.values()].filter((p) => p.e && !(p.e.kind === "agent" && p.e.id === myId) && pick(p.e))
.map((p) => [p.e, Math.round(Math.hypot(p.x - s.x, p.y - s.y))]).sort((a, b) => a[1] - b[1]);
}
function valuesOf(cmd, key, what) {
const inv = meObs ? meObs.self.inventory : {};
const alts = /^\w+(\|\w+)+(?=$|,)/.exec(what);
if (alts) return alts[0].split("|").map((v) => ({put: v, hint: {N: "north", E: "east", S: "south", W: "west"}[v] || ""}));
if (what.startsWith("bool")) return [{put: "true", hint: ""}];
if (key === "recipe") return Object.keys(recipes).map((r) => ({put: r, hint: fmt(recipes[r].inputs)}));
if ((key === "item" && cmd !== "take") || key === "with")
return Object.keys(inv).filter((n) => inv[n] > 0 && (cmd !== "eat" || n in foodValue)).map((n) => ({put: n, hint: "×" + inv[n]}));
if (key === "target") {
const pick = what.startsWith("agent") ? (e) => e.kind === "agent" : what.startsWith("cow") ? (e) => e.kind === "cow" : what.startsWith("animal") ? (e) => e.kind !== "agent" : () => true;
return nearby(pick).slice(0, 12).map(([e, d]) => ({put: String(e.id), hint: `${e.name || e.kind}, ${d} ${d === 1 ? "tile" : "tiles"} away`}));
}
return [];
}
function completions(text, caret, asked) {
const head = text.slice(0, caret), word = /(\S*)$/.exec(head)[1], from = caret - word.length;
if (!head.startsWith("/")) {
if (!asked || !/^[\w-]+$/.test(word)) return null;
const names = [...new Set([...nearby((e) => e.kind === "agent").map(([e]) => e.name), ...agents.filter((a) => a.online && a.name !== me).map((a) => a.name)])];
return {from, items: names.filter((n) => n.toLowerCase().startsWith(word.toLowerCase())).map((n) => ({put: n + " ", show: n, hint: ""}))};
}
if ((head.match(/"/g) || []).length % 2) return null;
if (from === 0) {
const typed = word.slice(1).toLowerCase();
const all = [...Object.entries(tools || {}).filter(([n]) => n === typed).map(([n, t]) => [n, t.desc, Object.keys(t.args).length]), ...Object.entries(LOCAL).map(([n, d]) => [n, d, 0])];
return {from: 1, items: matching(all.map(([n, hint, args]) => ({put: n + (args ? " " : ""), show: n, hint})), word.slice(1))};
}
const cmd = head.slice(1).split(/\s+/)[0].toLowerCase(), spec = tools && tools[cmd], eq = word.indexOf("=");
if (!spec) return null;
if (eq < 0) {
const given = new Set((text.match(/(?:^|\s)([\w]+)=/g) || []).map((g) => g.trim().slice(0, -1)));
return {from, items: matching(Object.entries(spec.args).filter(([k]) => !given.has(k)).map(([k, what]) => ({put: k + "=", hint: what})), word)};
}
const key = word.slice(0, eq), what = spec.args[key];
if (!what) return null;
const items = matching(valuesOf(cmd, key, what).map((v) => ({...v, show: v.put, put: v.put + " "})), word.slice(eq + 1));
return {from: from + eq + 1, items, note: items.length ? "" : `${key}: ${what}`};
}
function suggest(asked = false) {
const i = $("say"), open = $("chatbox").classList.contains("open"), c = open ? completions(i.value, i.selectionStart, asked) : null;
comp.items = c ? c.items : []; comp.note = c ? c.note || "" : ""; comp.at = 0;
if (c) { comp.from = c.from; comp.to = i.selectionStart + /^\S*/.exec(i.value.slice(i.selectionStart))[0].length; }
drawSuggest();
}
function drawSuggest() {
const el = $("sayhelp");
el.innerHTML = comp.items.map((it, k) => `<div class="${k === comp.at ? "on" : ""}" data-k="${k}"><b>${esc(it.show || it.put)}</b><span>${esc(it.hint || "")}</span></div>`).join("")
|| (comp.note ? `<div class="note"><span>${esc(comp.note)}</span></div>` : "");
el.style.display = el.innerHTML ? "block" : "none";
const on = el.querySelector(".on"); if (on) on.scrollIntoView({block: "nearest"});
}
function takeSuggestion(k = comp.at) {
const it = comp.items[k], i = $("say"); if (!it) return;
const tail = i.value.slice(comp.to), put = it.put.endsWith(" ") && tail.startsWith(" ") ? it.put.slice(0, -1) : it.put;
i.value = (i.value.slice(0, comp.from) + put + tail).slice(0, i.maxLength);
const at = Math.min(i.value.length, comp.from + it.put.length); i.setSelectionRange(at, at);
suggest();
}
function completeKey(e) {
if (e.key === "Tab") {
e.preventDefault();
if (!comp.items.length) { suggest(true); if (comp.items.length !== 1) return true; }
takeSuggestion(); return true;
}
if ((e.key === "ArrowDown" || e.key === "ArrowUp") && comp.items.length > 1) {
e.preventDefault(); comp.at = (comp.at + (e.key === "ArrowDown" ? 1 : comp.items.length - 1)) % comp.items.length; drawSuggest(); return true;
}
return false;
}
$("say").addEventListener("input", () => suggest());
$("say").addEventListener("click", () => suggest());
$("sayhelp").addEventListener("mousedown", (e) => e.preventDefault());
$("sayhelp").addEventListener("click", (e) => { const d = e.target.closest("[data-k]"); if (d) takeSuggestion(+d.dataset.k); });
;
let askDone = null;
function askText({title, hint = "", value = "", max = 60, ok = "OK"}) {
return new Promise((done) => {
if (askDone) askDone(null);
askDone = (v) => { askDone = null; $("ask").style.display = "none"; $("asktext").blur(); done(v); };
const i = $("asktext");
$("asktitle").textContent = title; i.placeholder = hint; i.value = value; i.maxLength = max; $("askok").textContent = ok;
$("ask").style.display = "block";
setTimeout(() => { i.focus(); i.select(); }, 30);
});
}
$("asktext").addEventListener("keydown", (e) => {
e.stopPropagation();
if (e.key === "Enter" && askDone) askDone($("asktext").value.trim());
if (e.key === "Escape" && askDone) askDone(null);
});
$("askok").onclick = () => askDone && askDone($("asktext").value.trim());
$("askclose").onclick = () => askDone && askDone(null);
function placeWritten(d, item) {
return askText({title: item === "sign" ? "What does the sign say?" : "What does the flag say?", hint: item === "sign" ? "Write on it" : "claimed by " + me, max: 80, ok: "Put up"})
.then((t) => (t === null ? null : act("place", {dir: d, item, ...(t ? {text: t} : {})})));
}
function nameAnimal(e) {
return askText({title: e.name ? `A new name for ${e.name}` : `Name the ${label(e.kind)}`, hint: "Its name", value: e.name || "", max: 16, ok: "Name"})
.then((t) => (t ? act("name", {target: e.id, text: t}) : null));
}
;
const CHAT_SHOW_MS = 10000, CHAT_KEEP = 100;
const rich = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<kbd>$1</kbd>").replace(/\n/g, "<br>");
const plain = (text) => String(text).replace(/\*\*|`/g, "").replace(/\n/g, " ");
function chatLine(text, cls = "", who = null) {
const log = $("chatlog"), last = log.lastElementChild;
if (last && last.dataset.text === text + (who || "")) {
last.dataset.n = +(last.dataset.n || 1) + 1; last.querySelector(".n").textContent = ` ×${last.dataset.n}`;
last.dataset.t = Date.now(); last.classList.remove("old"); return;
}
const d = document.createElement("div"); d.className = cls; d.dataset.text = text + (who || ""); d.dataset.t = Date.now();
d.innerHTML = (who ? `<span class="who">${esc(who)}</span> ` : "") + (who ? esc(text) : rich(text)) + `<span class="n"></span>`;
log.appendChild(d); while (log.childElementCount > CHAT_KEEP) log.firstElementChild.remove();
log.scrollTop = log.scrollHeight;
}
const chatSmall = () => document.body.classList.contains("touch") && (innerWidth <= 600 || innerHeight <= 520), chatKeep = () => (chatSmall() ? Math.min(opt("chat"), 6) : opt("chat"));
$("chatlog").addEventListener("click", () => { const b = $("chatbox"); if (chatSmall() && !b.classList.contains("open")) { b.classList.toggle("peek"); $("chatlog").scrollTop = 1e9; } });
addEventListener("pointerdown", (e) => { const b = $("chatbox"); if (e.target.closest("#chatbox, #tTalk") || !chatSmall()) return; b.classList.remove("peek"); if (b.classList.contains("open")) closeChat(); }, true);
setInterval(() => { for (const d of $("chatlog").children) d.classList.toggle("old", Date.now() - d.dataset.t > chatKeep() * 1000); }, 500);
const SAID_KEEP = 50;
let said = JSON.parse(localStorage.getItem("megastructure-said") || "[]"), saidAt = null, saidDraft = "";
function saidKey(e) {
if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return false;
const i = $("say"), up = e.key === "ArrowUp";
if (saidAt === null) {
if (!up || (comp.items.length > 1 && i.value !== "" && i.value !== "/")) return false;
saidDraft = i.value;
}
const list = saidDraft.startsWith("/") ? said.filter((l) => l.startsWith("/")) : said;
e.preventDefault();
if (!list.length) return true;
const at = Math.max(0, (saidAt === null ? list.length : saidAt) + (up ? -1 : 1));
if (at >= list.length) { saidAt = null; i.value = saidDraft; } else { saidAt = at; i.value = list[at]; }
i.setSelectionRange(i.value.length, i.value.length);
suggest();
return true;
}
function saidAdd(line) {
said = [...said.filter((l) => l !== line), line].slice(-SAID_KEEP);
localStorage.setItem("megastructure-said", JSON.stringify(said));
}
$("say").addEventListener("input", () => { saidAt = null; });
function openChat(prefix = "") { saidAt = null; $("chatbox").classList.remove("peek"); $("chatbox").classList.add("open"); const i = $("say"); i.value = prefix; i.focus(); $("chatlog").scrollTop = 1e9; askTools(); suggest(); }
function closeChat() { $("chatbox").classList.remove("open"); $("say").blur(); suggest(); }
$("say").addEventListener("keydown", (e) => {
e.stopPropagation();
if (e.key === "Escape") closeChat();
if (saidKey(e) || completeKey(e) || e.key !== "Enter") return;
const line = e.target.value.trim(); closeChat(); e.target.value = "";
if (!line) return;
saidAdd(line);
if (line.startsWith("/")) {
const parts = line.slice(1).match(/(?:[^\s"]+|"[^"]*")+/g) || [], tool = parts.shift(), args = {};
for (const p of parts) { const [k, ...v] = p.split("="); const val = v.join("=").replace(/^"|"$/g, ""); args[k] = /^-?\d+$/.test(val) ? +val : val === "true" ? true : val === "false" ? false : val; }
if (!localCommand(tool)) act(tool, args);
} else if (line.startsWith("!")) act("shout", {text: line.slice(1).trim()});
else if (shouted(line)) act("shout", {text: line});
else act("say", {text: line});
});
$("postbtn").onclick = postLetter; $("openbtn").onclick = takeLetters;
$("mailclose").onclick = () => { $("mail").style.display = "none"; };
$("letter").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") postLetter(); if (e.key === "Escape") $("mail").style.display = "none"; });
$("craftclose").onclick = () => { sfx("close"); $("craft").style.display = "none"; drawGoals(); };
$("say").addEventListener("blur", closeChat);
function toggleCraft() { const c = $("craft"), open = c.style.display !== "block"; sfx(open ? "open" : "close"); c.style.display = open ? "block" : "none"; if (open) craftOpened(); drawGoals(); }
$("helpbtn").onclick = () => { const h = $("help"); const on = h.style.display !== "block"; h.style.display = on ? "block" : "none"; localStorage.setItem("megastructure-help", on ? "on" : "off"); };
$("goalhelp").onclick = () => $("helpbtn").click();
$("join").onclick = () => { const n = $("name").value.trim(); if (n) joinGame(n); };
$("brand").onclick = () => { if (!me) $("joinbox").style.display = "block"; };
$("name").value = localStorage.getItem("megastructure-name") || "";
const qs = new URLSearchParams(location.search);
if (qs.get("follow")) { follow = qs.get("follow"); $("joinbox").style.display = "none"; }
if (qs.get("zoom")) zoom = +qs.get("zoom");
ready.then(() => {
buildBlob();
connectSpec(); requestAnimationFrame(frame);
});
;
const HELP = [
["Move", [[["W", "A", "S", "D"], "Walk"], [["Shift"], "Sprint: hold it"], [["J"], "Jump: up a step"], [["Alt"], "Turn without walking"], [["G"], "Goals: show or hide"]]],
["See", [[["+", "−"], "Zoom (or the wheel)"], [["V"], "What is built over you"]]],
["Do", [[["Space"], "Use what you face"], [["X"], "Other use: milk, till"], [["F"], "Pick up"], [["E"], "Eat"],
[["Click"], "Space there. Shift: X"]]],
["Carry", [[["1-9", "Q"], "Take in hand"], [["`"], "Empty your hands"], [["Space"], "Place what you hold"],
[["I"], "Inventory"], [["C"], "Craft"]]],
["Build", [[["B"], "Build mode: in and out"], [["←", "→"], "Move the cursor, not you"], [["Space"], "Plan a piece. Held: row"], [["X"], "Break, take down, dig"],
[["Q", "E"], "Cursor a layer down, up"]]],
["Talk", [[["Enter"], "Talk"], [["ABC"], "Shout: IN CAPITALS"], [["Tab"], "Hold: who is awake"],
[["M"], "Sound on or off"], [["Esc"], "Menu and settings"]]],
];
const HELP_ACT = {Space: "use", X: "alt", J: "jump", F: "pick", E: "eat", Q: "next", "`": "hands", I: "bag", C: "craft", B: "build", M: "mute"};
let helpPage = 0;
const helpOpen = () => $("help").style.display === "block";
function drawHelp() {
const mine = HELP[helpPage][0] !== "Build";
const keys = (ks) => ks.map((k) => `<kbd>${mine && HELP_ACT[k] ? capOf(HELP_ACT[k]) : k}</kbd>`).join("");
$("help").innerHTML = `<div class="hh"><b>Help</b><span><kbd>H</kbd>close</span></div>`
+ `<div class="tabs">${HELP.map(([name], i) => `<div class="tab${i === helpPage ? " on" : ""}" data-i="${i}">${name}</div>`).join("")}</div>`
+ `<div class="well">${HELP[helpPage][1].map(([ks, what]) => `<div class="row"><div class="keys">${keys(ks)}</div><div class="what">${what}</div></div>`).join("")}</div>`
+ `<div class="hf"><kbd>←</kbd><kbd>→</kbd>turn the page</div>`;
}
function turnHelp(to) { helpPage = (to + HELP.length) % HELP.length; drawHelp(); sfx("pick"); }
function toggleHelp() { const on = !helpOpen(); if (on) drawHelp(); $("help").style.display = on ? "block" : "none"; sfx(on ? "open" : "close"); }
$("helpbtn").onclick = toggleHelp;
$("help").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) turnHelp(+t.dataset.i); else if (e.target.closest(".hh span")) toggleHelp(); });
window.addEventListener("keydown", (e) => {
if (!helpOpen() || document.activeElement === $("say")) return;
const d = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1}[e.key];
if (d) turnHelp(helpPage + d); else if (e.key === "Escape") toggleHelp(); else return;
e.preventDefault(); e.stopImmediatePropagation();
}, true);
localStorage.removeItem("megastructure-help");
;
const MENU = {open: false, view: "main", page: 0, at: 0, grab: null, drag: null, said: ""};
const menuOpen = () => MENU.open;
const kept = (key) => ({get: () => opt(key), set: (v) => setOpt(key, v), def: OPT_DEFAULT[key]});
const slider = (name, key, more = {}) => ({name, kind: "slider", min: 0, max: 100, step: 10, unit: "%", hear: key, ...(typeof key === "string" ? kept(key) : {}), ...more});
const toggle = (name, key, more = {}) => ({name, kind: "toggle", ...(typeof key === "string" ? kept(key) : key), ...more});
const choice = (name, key, list) => ({name, kind: "choice", list, ...kept(key)});
const f3Row = () => toggle("Debug screen (F3)", {get: () => F3.on, set: (v) => F3.set(v), def: false});
const lo = (r) => (typeof r.min === "function" ? r.min() : r.min);
const pageRows = (i) => { const rows = MENU_PAGES[i][1]; return typeof rows === "function" ? rows() : rows; };
const HEAR = {master: "pick", steps: "step", work: "chop", fights: "hit", animals: "cluck", world: "water", ui: "pick"};
const MENU_PAGES = [
["Sound", [
toggle("Sound", {get: () => !muted, set: (v) => setMuted(!v), def: true}),
slider("Everything", "master"), slider("Music", "music"),
choice("Music plays", "often", [["often", "Often"], ["normal", "Now and then"], ["rarely", "Rarely"]]),
slider("Footsteps", "steps"), slider("Tools and building", "work"), slider("Fights", "fights"), slider("Animals", "animals"),
slider("The world", "world"), slider("Voices", "voices"), slider("Menus and clicks", "ui")]],
["Picture", [
slider("Zoom", null, {get: () => (ZOOM.busy ? ZOOM.to : zoom), set: (v) => zoomBy(v - (ZOOM.busy ? ZOOM.to : zoom)), min: () => zoomLeast(), max: ZOOM.max, step: 1, unit: "", def: 3, hear: null}),
choice("Sharpness", "sharp", [["auto", "Auto"], ["full", "Full"], ["light", "Light"]]),
slider("Light at night", "night", {hear: null}),
choice("Particles", "particles", [["all", "All"], ["fewer", "Fewer"], ["none", "None"]]),
choice("Curved world", "curve", [["off", "Off"], ["near", "Near"], ["far", "Far"]]), toggle("Depth", "depth"), toggle("Clear water", "clearwater"), toggle("Water shimmer", "shimmer"), toggle("Shake on a hard fall", "shake"), toggle("Smooth zoom", "glide"), toggle("Hearts and gains over heads", "floats"),
...[["Shadows", "shadows"], ["Shadow length", "shadowlen"]].map(([name, key]) => slider(name, key, {max: 200, step: 20, hear: null})),
choice("What is built over you", "above", VIEWS.map((v) => [v.key, v.name]))]],
["Screen", [
toggle("Speech bubbles", "bubbles"), toggle("Names over heads", "names"),
choice("A chat line stays", "chat", [[5, "5 seconds"], [10, "10 seconds"], [30, "30 seconds"], [600, "10 minutes"]]),
toggle("Key hints", "hints"), toggle("Mouse tips", "tips"),
toggle("Goals card", {get: () => !goalsOff, set: (v) => { goalsOff = !v; localStorage.setItem("megastructure-goals-off", v ? "0" : "1"); drawGoals(); }, def: false}),
f3Row()]],
["Keys", [
choice("Sprint", "sprint", [["hold", "Hold Shift"], ["toggle", "Shift once"]]),
...Object.entries(KEY_ACTIONS).map(([action, [, name]]) => ({name, kind: "key", action, get: () => keyOf(action), set: () => {}, def: KEY_ACTIONS[action][0]}))]],
];
const MENU_MAIN = [
["Back to the game", "Esc", () => closeMenu()],
["Settings", "", () => menuShow("opts")],
["Help", "H", () => { closeMenu(); toggleHelp(); }],
["Leave the world", "", () => location.reload()],
];
const menuRows = () => (MENU.view === "main" ? MENU_MAIN : pageRows(MENU.page));
function drawMenu() {
const el = $("menu"), well = el.querySelector(".well"), top = well ? well.scrollTop : 0;
if (MENU.view === "main") {
el.innerHTML = `<div class="win small"><div class="hh"><b>Menu</b><span data-go="close"><kbd>Esc</kbd>back</span></div><div class="well">`
+ MENU_MAIN.map(([name, key], i) => `<div class="row big${i === MENU.at ? " on" : ""}${name === "Help" ? " konly" : ""}" data-i="${i}"><div class="name">${name}</div>${key ? `<kbd>${key}</kbd>` : ""}</div>`).join("")
+ `</div><div class="hf">The world does not stop</div></div>`;
return;
}
const ctl = (r) => {
const v = r.get();
if (r.kind === "slider") return `<div class="bar"><i style="width:${(v - lo(r)) / (r.max - lo(r)) * 100}%"></i></div><div class="val">${v}${r.unit}</div>`;
if (r.kind === "toggle") return `<div class="sw${v ? " yes" : ""}">${v ? "On" : "Off"}</div>`;
if (r.kind === "choice") return `<div class="pick"><b data-d="-1">&lt;</b><span>${(r.list.find(([k]) => k === v) || r.list[0])[1]}</span><b data-d="1">&gt;</b></div>`;
return MENU.grab === r.action ? `<div class="pick"><span>press a key</span></div>` : `<kbd>${keyCap(v)}</kbd>`;
};
el.innerHTML = `<div class="win"><div class="hh"><b>Settings</b><span data-go="back"><kbd>Esc</kbd>back</span></div>`
+ `<div class="tabs">${MENU_PAGES.map(([name], i) => `<div class="tab${i === MENU.page ? " on" : ""}${name === "Keys" ? " konly" : ""}" data-page="${i}">${name}</div>`).join("")}</div>`
+ `<div class="well">${menuRows().map((r, i) => `<div class="row${i === MENU.at ? " on" : ""}${JSON.stringify(r.get()) !== JSON.stringify(r.def) ? " own" : ""}" data-i="${i}"><div class="name">${r.name}</div><div class="ctl">${ctl(r)}</div></div>`).join("")}</div>`
+ `<div class="hf">${MENU.said || `<kbd>←</kbd><kbd>→</kbd><i class="konly">change</i><kbd>Tab</kbd><i class="konly">next page</i><span data-go="reset"><kbd>R</kbd>as it came</span>`}</div></div>`;
const now = el.querySelector(".well"), on = now.querySelector(".row.on");
now.scrollTop = top;
if (on) { const a = on.offsetTop - now.offsetTop, b = a + on.offsetHeight; if (a < now.scrollTop) now.scrollTop = a - 4; else if (b > now.scrollTop + now.clientHeight) now.scrollTop = b - now.clientHeight + 4; }
}
function menuShow(view, page = MENU.page) { MENU.view = view; MENU.page = page; MENU.at = 0; MENU.grab = null; MENU.said = ""; drawMenu(); const w = $("menu").querySelector(".well"); if (w) w.scrollTop = 0; sfx("pick"); }
function openMenu(view = "main") {
if (MENU.open) return;
MENU.open = true; MENU.back = view;
if (typeof keys !== "undefined") { keys.clear(); runKey = false; if (me) syncWalk(); }
$("menu").style.display = "flex"; sfx("open");
menuShow(view);
}
function closeMenu() { if (!MENU.open) return; MENU.open = false; MENU.grab = null; $("menu").style.display = "none"; sfx("close"); if (typeof titleDraw === "function") titleDraw(); }
function menuBack() { if (MENU.view === "opts" && MENU.back === "main") menuShow("main"); else closeMenu(); }
function menuChange(i, d, to) {
const r = menuRows()[i]; if (!r) return;
MENU.at = i; MENU.said = "";
if (MENU.view === "main") { if (d === 0) r[2](); else drawMenu(); return; }
const v = r.get();
if (r.kind === "slider") {
const next = Math.max(lo(r), Math.min(r.max, to !== undefined ? Math.round(to / r.step) * r.step : v + (d || 1) * r.step));
if (next !== v) { r.set(next); if (r.hear) sfx(HEAR[r.hear] || "pick"); }
} else if (r.kind === "toggle") { if (d === 0 || (d > 0) !== v) { r.set(!v); sfx("pick"); } }
else if (r.kind === "choice") { const n = r.list.length, at = Math.max(0, r.list.findIndex(([k]) => k === v)); r.set(r.list[(at + (d || 1) + n) % n][0]); sfx("pick"); }
else if (d === 0) MENU.grab = r.action;
drawMenu();
}
function menuReset() {
for (const r of pageRows(MENU.page)) if (r.kind !== "key" && JSON.stringify(r.get()) !== JSON.stringify(r.def)) r.set(r.def);
if (MENU_PAGES[MENU.page][0] === "Keys") setOpt("keys", {});
MENU.said = ""; sfx("pick"); drawMenu();
}
window.addEventListener("keydown", (e) => {
if (!MENU.open) return;
e.stopImmediatePropagation();
if (e.metaKey || e.ctrlKey) return;
e.preventDefault();
const k = e.key.toLowerCase(), n = menuRows().length;
if (MENU.grab) {
if (["shift", "control", "alt", "meta"].includes(k)) return;
const action = MENU.grab; MENU.grab = null;
if (k !== "escape") MENU.said = bindKey(action, k) ? "" : `${keyCap(k)} is a key of the game's own: another one`;
sfx(MENU.said ? "close" : "pick");
return drawMenu();
}
if (k === "escape") return menuBack();
if (k === "arrowup" || k === "arrowdown") { MENU.at = (MENU.at + (k === "arrowup" ? -1 : 1) + n) % n; MENU.said = ""; sfx("pick"); return drawMenu(); }
if (k === "enter" || k === " ") return menuChange(MENU.at, 0);
if (MENU.view !== "opts") return;
if (k === "arrowleft" || k === "arrowright") return menuChange(MENU.at, k === "arrowleft" ? -1 : 1);
if (k === "tab") return menuShow("opts", (MENU.page + (e.shiftKey ? -1 : 1) + MENU_PAGES.length) % MENU_PAGES.length);
if (k === "r") menuReset();
}, true);
window.addEventListener("keyup", (e) => { if (MENU.open) e.stopImmediatePropagation(); }, true);
const menuBarAt = (e, bar) => { const b = bar.getBoundingClientRect(), r = menuRows()[MENU.drag]; return lo(r) + Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * (r.max - lo(r)); };
$("menu").addEventListener("pointerdown", (e) => {
if (e.pointerType !== "touch" || !e.target.closest(".well")) return menuTap(e);
const bar = e.target.closest(".bar"); MENU.tap = true; MENU.slid = false; MENU.x = e.clientX; MENU.drag = bar ? +bar.closest(".row").dataset.i : null;
});
$("menu").addEventListener("click", (e) => { if (!MENU.tap) return; MENU.tap = false; if (!MENU.slid && e.target.closest(".win")) menuTap(e); MENU.drag = null; });
function menuTap(e) {
const row = e.target.closest(".row"), go = e.target.closest("[data-go]"), tab = e.target.closest(".tab");
if (!e.target.closest(".win") || (go && go.dataset.go === "close")) return closeMenu();
if (go) return go.dataset.go === "back" ? menuBack() : menuReset();
if (tab) return menuShow("opts", +tab.dataset.page);
if (!row) return;
const i = +row.dataset.i, bar = e.target.closest(".bar"), side = e.target.closest("[data-d]");
if (bar) { MENU.drag = i; menuChange(i, 0, menuBarAt(e, bar)); }
else menuChange(i, side ? +side.dataset.d : 0);
}
addEventListener("pointermove", (e) => { if (!MENU.open || MENU.drag === null) return; if (MENU.tap && !MENU.slid && !(MENU.slid = Math.abs(e.clientX - MENU.x) > 6)) return; const bar = $("menu").querySelector(`.row[data-i="${MENU.drag}"] .bar`); if (bar) menuChange(MENU.drag, 0, menuBarAt(e, bar)); });
addEventListener("pointerup", () => { if (!MENU.tap) MENU.drag = null; }); addEventListener("pointercancel", () => { MENU.drag = null; MENU.tap = false; });
$("menubtn").onclick = () => openMenu();
addEventListener("keydown", (e) => {
if (e.key === "Escape" && !me && !titleOpen() && !helpOpen() && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) openMenu();
});
;
const ACCOUNT = {url: document.body.dataset.accounts || "", session: localStorage.getItem("megastructure-session") || "",
email: localStorage.getItem("megastructure-email") || "", named: null, busy: false};
const ACCOUNT_SAYS = {bad_email: "That does not look like an email.", too_many: "Too many tries. Wait a little, then ask again.",
mail_down: "The mail could not be sent. Try again in a moment.", bad_code: "That is not the code. Look at the mail again, or start over.",
offline: "The account service does not answer.", no_session: "You were logged out. Log in again."};
async function accountAsk(path, body) {
try { return await (await fetch(ACCOUNT.url + path, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)})).json(); }
catch (e) { return {ok: false, error: "offline"}; }
}
function accountStep() { return !ACCOUNT.url || ACCOUNT.session ? "me" : ACCOUNT.sent ? "code" : "mail"; }
function accountNeed(id, why) { $(id).classList.add("need"); $(id).focus(); if (why) toast(ACCOUNT_SAYS[why] || why, true); }
async function accountCode() {
const email = $("email").value.trim();
if (!/^\S+@\S+\.\S+$/.test(email)) return accountNeed("email", email ? "bad_email" : "");
if (ACCOUNT.busy) return; ACCOUNT.busy = true;
const r = await accountAsk("/code", {email}); ACCOUNT.busy = false;
if (!r.ok) return accountNeed("email", r.error);
ACCOUNT.email = email; ACCOUNT.sent = true; $("code").value = ""; titleStep();
toast("A code is on its way to " + email + ".");
}
async function accountLogin() {
const code = $("code").value.replace(/\D/g, "");
if (code.length !== 6) return accountNeed("code", "");
if (ACCOUNT.busy) return; ACCOUNT.busy = true;
const r = await accountAsk("/login", {email: ACCOUNT.email, code}); ACCOUNT.busy = false;
if (!r.ok) { $("code").value = ""; return accountNeed("code", r.error); }
ACCOUNT.session = r.session; ACCOUNT.sent = false;
localStorage.setItem("megastructure-session", r.session); localStorage.setItem("megastructure-email", ACCOUNT.email);
titleStep(); accountWho();
}
function accountOver() { ACCOUNT.sent = false; titleStep(); }
function accountDrop() {
ACCOUNT.session = ""; ACCOUNT.sent = false; ACCOUNT.named = null; localStorage.removeItem("megastructure-session");
$("name").readOnly = false; titleStep();
}
function accountOut() { accountAsk("/logout", {session: ACCOUNT.session}); accountDrop(); }
async function accountTicket() {
const r = await accountAsk("/ticket", {session: ACCOUNT.session, world: location.host});
if (r.ok) return r.ticket;
if (r.error === "no_session") accountDrop();
toast(ACCOUNT_SAYS[r.error] || r.error, true);
return null;
}
async function accountWho() {
if (!ACCOUNT.url || !ACCOUNT.session) return;
const ticket = await accountTicket();
if (!ticket) return;
const ask = () => spec && spec.readyState === 1 ? sendSpec({op: "who", ticket}) : setTimeout(ask, 200);
ask();
}
function accountNamed(name) {
ACCOUNT.named = name;
if (name) { $("name").value = name; $("name").classList.remove("need"); }
$("name").readOnly = !!name;
}
;
const TITLE = {at: 1, step: "me", first: {me: "join", mail: "sendcode", code: "login"}, field: {me: "name", mail: "email", code: "code"},
steps: {me: ["racepick", "join", "titlehelp", "titlesound", "titleopts", "logout"], mail: ["sendcode", "titlehelp", "titlesound", "titleopts"],
code: ["login", "startover", "titlehelp", "titlesound", "titleopts"]},
get rows() { return this.steps[this.step].filter((id) => id !== "logout" || ACCOUNT.session); }};
const titleOpen = () => $("joinbox").style.display !== "none" && !me;
function titleDraw() {
const rows = TITLE.rows;
document.querySelectorAll("#racepick, #joinbox .item").forEach((e) => e.classList.toggle("on", e.id === rows[TITLE.at]));
$("titlesoundv").textContent = muted ? "off" : "on";
$("logoutv").textContent = ACCOUNT.email;
$("join").firstElementChild.textContent = document.body.classList.contains("booting") && agentWs && agentWs.readyState === 0 ? "Waking the world…" : "Wake up";
document.body.classList.toggle("title", titleOpen());
}
function titleStep() {
const step = accountStep(), moved = step !== TITLE.step || !TITLE.begun;
TITLE.step = $("joinbox").dataset.step = step; TITLE.begun = true;
if (moved) {
TITLE.at = TITLE.rows.indexOf(TITLE.first[step]);
if (step === "mail") $("email").value = ACCOUNT.email;
if (!document.body.classList.contains("touch")) $(TITLE.field[step]).focus();
}
titleDraw();
}
function titleMe(now) {
const c = $("titleme");
if (titleOpen() && TITLE.step === "me" && IMG.character && IMG.character.complete && IMG.character.width) {
const g = c.getContext("2d"), s = wornReady(agentTint($("name").value.trim() || "you"), null, myRace); g.imageSmoothingEnabled = false;
if (s) { g.clearRect(0, 0, 24, 26); try { g.drawImage(s, (Math.floor(now / 140) % 8) * 48 + 12, 9, 24, 26, 0, 0, 24, 26); } catch (e) {  } }
}
requestAnimationFrame(titleMe);
}
const TITLE_GO = {
racepick() { TITLE.at = TITLE.rows.indexOf("join"); titleGo(TITLE.at); },
join() { const n = $("name").value.trim(); if (n) { joinGame(n); titleDraw(); } else { $("name").classList.add("need"); $("name").focus(); } },
titlehelp() { $("helpbtn").click(); },
titlesound() { setMuted(!muted); titleDraw(); },
titleopts() { openMenu("opts"); },
sendcode: accountCode, login: accountLogin, startover: accountOver, logout: accountOut,
};
function titleGo(i) {
TITLE.at = i; titleDraw();
TITLE_GO[TITLE.rows[i]]();
}
function titleRace(d) { const keys = Races.RACES.map((r) => r.key); pickRace(keys[(keys.indexOf(myRace) + d + keys.length) % keys.length]); sfx("pick"); }
Object.keys(TITLE_GO).forEach((id) => {
if (id !== "racepick") $(id).onclick = () => titleGo(TITLE.rows.indexOf(id));
$(id).addEventListener("mouseenter", () => { TITLE.at = TITLE.rows.indexOf(id); titleDraw(); });
});
["name", "email", "code"].forEach((id) => $(id).addEventListener("input", () => $(id).classList.remove("need")));
$("code").addEventListener("input", () => { if ($("code").value.replace(/\D/g, "").length === 6) accountLogin(); });
window.addEventListener("keydown", (e) => {
if (!titleOpen() || $("help").style.display === "block") return;
const rows = TITLE.rows, d = {ArrowUp: -1, ArrowDown: 1}[e.key], side = {ArrowLeft: -1, ArrowRight: 1}[e.key];
if (d) { TITLE.at = (TITLE.at + d + rows.length) % rows.length; titleDraw(); sfx("pick"); }
else if (side && rows[TITLE.at] === "racepick") titleRace(side);
else if (e.key === "Enter") titleGo(TITLE.at);
else return;
e.preventDefault(); e.stopImmediatePropagation();
}, true);
new MutationObserver(titleDraw).observe($("joinbox"), {attributes: true, attributeFilter: ["style"]});
titleStep(); requestAnimationFrame(titleMe); accountWho();
;
const TITLE_MAP = {"w":96,"h":64,"blocks":[{"x":0,"y":0,"w":32,"h":32,"rows":["================================","================================","================================","================================","================================","================================","================================","================================","===============================(","=============================(((","===========================(((((","========================((((((((","=======================(((((((((","======================((((((((~~","=====================((((((~~~~~","===================(((((((~~~~~~","=================((((((((~~~~..f","================((((((((~~~~....","================((((((~~~~~.....","===============(((((~~~~~~......","===============((((~~~~~..T....T","==============(((((~~~..........","=============(((((~~~.....ff....","=============(((((~~~......!....","============(((((~~~f..fM......M","===========(((((~~~~...M....T...","===========(((((~~~.............","===========((((~~~..............","===========(((~~~~..............","===========(((~~~....M..Q.*Q....","===========(((~~...T.....T..T...","===========(((~~................"],"ground":["================================","================================","================================","================================","================================","================================","================================","================================","===============================(","=============================(((","===========================(((((","========================((((((((","=======================(((((((((","======================((((((((~~","=====================((((((~~~~~","===================(((((((~~~~~~","=================((((((((~~~~...","================((((((((~~~~....","================((((((~~~~~.....","===============(((((~~~~~~......","===============((((~~~~~........","==============(((((~~~..........","=============(((((~~~...........","=============(((((~~~...........","============(((((~~~............","===========(((((~~~~............","===========(((((~~~.............","===========((((~~~..............","===========(((~~~~..............","===========(((~~~...............","===========(((~~................","===========(((~~................"],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@AAAA@","@@@@@@@@@@@@@@@@@@@@@@@@@@AAAAAA","@@@@@@@@@@@@@@@@@@@@@@@@ABBBBBAA","@@@@@@@@@@@@@@@@@@@@@@ABBBBBBBBB","@@@@@@@@@@@@@@@@@@@@@ABBBCCCCCBB","@@@@@@@@@@@@@@@@@@@@@ABBBCCCCCBB","@@@@@@@@@@@@@@@@@@@@AABBCCCCCCCB","@@@@@@@@@@@@@@@@@@@@AABBBCCCCCBB","@@@@@@@@@@@@@@@@@@@AAABBBCCCCCBB","@@@@@@@@@@@@@@@@@@@@AAABBBBBBBBB","@@@@@@@@@@@@@@@@@@@@@AAAABBBBBAA","@@@@@@@@@@@@@@@@@@@@@@AAAAAAAAAA","@@@@@@@@@@@@@@@@@@@@@@@@AAAAAAA@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]},{"x":32,"y":0,"w":32,"h":32,"rows":["================================","================================","================================","================================","================================","================================","================================","=(((((((((((((=((((((((((((=====","((((((((((((((((((((((((((((((==","((((((((((((((((((((((((((((((((","((((~~~~~~~(((((((~~~~~~((((((((","((~~~~~~~~~~~~~~~~~~~~~~~~~(((((","~~~~~~...~~~~~~~~~~~..~~~~~~~~~~","~~~~T.......~~~~.f.T..ff.~~~~~~~","~~.f.....T..TfT.........T.....T.","..f....T....................T...","T......f......T.T....T...T......","............................T...",".......T............T...........","f....f......T.T...........T.....",".T......T.......T..fFF....F.....",".........................f......","......WWWWWWW..........F........","......WBnnnnW..f..f......f......","......WnnnLhW.f.;w;w;w..........","......WCnnnnW...\"\"\"\"\"\"..........",".....fWnnnnnW...w;w;w;.ZZ.......","...M..WWW+WWW...\"\"\"\"\"\".YZ.......","........._.X....................","........._...........f.....b....",".M......._......................",".........______________........."],"ground":["================================","================================","================================","================================","================================","================================","================================","=(((((((((((((=((((((((((((=====","((((((((((((((((((((((((((((((==","((((((((((((((((((((((((((((((((","((((~~~~~~~(((((((~~~~~~((((((((","((~~~~~~~~~~~~~~~~~~~~~~~~~(((((","~~~~~~...~~~~~~~~~~~..~~~~~~~~~~","~~~~........~~~~.........~~~~~~~","~~..............................","................................","................................","................................","................................","................................","................................","................................","......nnnnnnn...................","......nnnnnnn...................","......nnnnnnn...uoouoo..........","......nnnnnnn...oouoou..........","......nnnnnnn...ouoouo..........","......nnnnnnn...uoouoo..........","........._......................","........._......................","........._......................",".........______________........."],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","A@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","AA@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","AAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","BAAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@","BAAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@","BAAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@","BAAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@","BAAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@","AAA@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","AA@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","A@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"],"roofs":[742,838,744,871,840,775,746,842,748,777,875,844,779,873,710,808,743,806,712,839,745,714,812,747,810,716,841,843,711,774,807,870,776,872,809,778,713,811,874,780,715,876]},{"x":64,"y":0,"w":32,"h":32,"rows":["================================","================================","================================","================================","================================","================================","================================","================================","================================","(((((===========================","(((((((=========================","((((((((========================","~~((((((========================","~~~~((((((======================","~~~~~((((((((===================","..~~~((((((((((=================","...~~~~(((((((((================",".T.~~~~~~~(((((((===============","H....~~~~~~~((((((==============","H.......~~~~~((((((=============",".....TH.H.~~~~((((((============","..f........~~~~((((((===========","............~~~~(((((===========",".........f...~~~~((((===========","..............~~~~(((===========","............f..~~~(((===========","................~~(((===========",".......f........~~(((===========","...............~~~(((===========","...............~~~(((===========","...............~~((((===========","...............~~((((==========="],"ground":["================================","================================","================================","================================","================================","================================","================================","================================","================================","(((((===========================","(((((((=========================","((((((((========================","~~((((((========================","~~~~((((((======================","~~~~~((((((((===================","..~~~((((((((((=================","...~~~~(((((((((================","...~~~~~~~(((((((===============",".....~~~~~~~((((((==============","........~~~~~((((((=============","..........~~~~((((((============","...........~~~~((((((===========","............~~~~(((((===========",".............~~~~((((===========","..............~~~~(((===========","...............~~~(((===========","................~~(((===========","................~~(((===========","...............~~~(((===========","...............~~~(((===========","...............~~((((===========","...............~~((((==========="],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]},{"x":0,"y":32,"w":32,"h":32,"rows":["===========(((~~....T........*..","===========(((~~...............b","===========(((~~~..T..........##","===========(((~~~~....T....T..#Z","===========((((~~~~.....T.Q...#J","===========(((((~~~~..........#.","===========((((((~~~.......T..#.","============((((((~~~........Q#.","=============(((((~~~.T.ff....##","==============(((((~~~.....f....","===============((((~~~~T..Q.....","===============(((((~~~~........","================(((((~~~~.......","================((((((~~~~..Tf..","=================((((((~~~......","==================((((((~~~.....","===================(((((~~~~~...","====================(((((~~~~~~~","=====================((((((~~~~~","=====================((((((((((~","======================((((((((((","========================((((((((","============================((((","===============================(","================================","================================","================================","================================","================================","================================","================================","================================"],"ground":["===========(((~~................","===========(((~~................","===========(((~~~...............","===========(((~~~~..............","===========((((~~~~.............","===========(((((~~~~............","===========((((((~~~............","============((((((~~~...........","=============(((((~~~...........","==============(((((~~~..........","===============((((~~~~.........","===============(((((~~~~........","================(((((~~~~.......","================((((((~~~~......","=================((((((~~~......","==================((((((~~~.....","===================(((((~~~~~...","====================(((((~~~~~~~","=====================((((((~~~~~","=====================((((((((((~","======================((((((((((","========================((((((((","============================((((","===============================(","================================","================================","================================","================================","================================","================================","================================","================================"],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]},{"x":32,"y":32,"w":32,"h":32,"rows":["..............._.......f.~~~~~~~",".f.....h.^.h..._.......~~(((((((","######......zzz_......~~((((((((","Z....#......mzz_......~~((((((((","Z....#........._......~~((((((((",".....g........._.......~~(((((((",".....#...b....._...f.....~~~~~~~","...e.#........._f...........~~..","######........._............~~..","..........b...._............~~..","..............._............~~..","...............____________::::_",".......T......f..?...f......~~..","...........T................~~.T",".........T....f.....f..T....~~.f","...................f..b.....~~.T",".b....f..............T......~~..","~........T.TfT..............~~T.","~~~~..f....................~~~~~","~~~~~~........f..........~~~~~~~","((~~~~~~~~~~~~~........~~~~~~(((","((((~~~~~~~~~~~~~~~~~~~~~~~(((((","(((((((((((((~~~~~~~~~~~~(((((((","((((((((((((((((((((((((((((((((","=(((((((((((((((((((((((((((((==","==========((((((((((((((((((====","================================","================================","================================","================================","================================","================================"],"ground":["..............._.........~~~~~~~","..............._.......~~(((((((","..............._......~~((((((((","..............._......~~((((((((","..............._......~~((((((((","..............._.......~~(((((((","..............._.........~~~~~~~","..............._............~~..","..............._............~~..","..............._............~~..","..............._............~~..","...............____________::::_","............................~~..","............................~~..","............................~~..","............................~~..","............................~~..","~...........................~~..","~~~~.......................~~~~~","~~~~~~...................~~~~~~~","((~~~~~~~~~~~~~........~~~~~~(((","((((~~~~~~~~~~~~~~~~~~~~~~~(((((","(((((((((((((~~~~~~~~~~~~(((((((","((((((((((((((((((((((((((((((((","=(((((((((((((((((((((((((((((==","==========((((((((((((((((((====","================================","================================","================================","================================","================================","================================"],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]},{"x":64,"y":32,"w":32,"h":32,"rows":["..........f....~~((((===========","~~.............~~(((============","(~~............~~(((============","(~~............~~(((============","(~~............~~(((============","~~............~~~(((============","..b.....f....~~~~(((============","............~~~~((((============","............~~~(((((============","...........~~~((((((============","...........~~~(((((=============","_________:::::((((==============","..........~~~((((===============","....T..T~~~~~((((===============","..T..~~~~~~~((((================","....~~~~~~((((((================","..T~~~~(((((((((================","T~~~~~(((((((((=================","~~~~~((((((((===================","~~~(((((((======================","(((((((((=======================","((((((((========================","((((((==========================","================================","================================","================================","================================","================================","================================","================================","================================","================================"],"ground":["...............~~((((===========","~~.............~~(((============","(~~............~~(((============","(~~............~~(((============","(~~............~~(((============","~~............~~~(((============",".............~~~~(((============","............~~~~((((============","............~~~(((((============","...........~~~((((((============","...........~~~(((((=============","_________:::::((((==============","..........~~~((((===============","........~~~~~((((===============",".....~~~~~~~((((================","....~~~~~~((((((================","...~~~~(((((((((================",".~~~~~(((((((((=================","~~~~~((((((((===================","~~~(((((((======================","(((((((((=======================","((((((((========================","((((((==========================","================================","================================","================================","================================","================================","================================","================================","================================","================================"],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]}],"sea":{"rows":["================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================"],"ground":["================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================","================================"],"levels":["@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@","@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"]},"cast":{"centre":[47,31],"view":[26,18,70,46],"door":[41,28],"field":[48,24,53,27],"pen":[31,35,36,39],"meadow":[61,23,70,29],"pond":[[56,34],[56,35],[56,36],[57,33],[57,34],[57,35],[57,36],[57,37],[58,33],[58,34],[58,35],[58,36],[58,37],[59,33],[59,34],[59,35],[59,36],[59,37],[60,33],[60,34],[60,35],[60,36],[60,37],[61,33],[61,34],[61,35],[61,36],[61,37],[62,33],[62,34],[62,35],[62,36],[62,37],[63,33],[63,34],[63,35],[63,36],[63,37],[64,34],[64,35],[64,36]],"ring":[[84,43],[83,43],[83,44],[82,44],[82,45],[82,46],[81,46],[81,47],[80,47],[80,48],[79,48],[78,48],[78,49],[78,50],[77,50],[76,50],[76,51],[75,51],[75,52],[74,52],[73,52],[73,53],[72,53],[71,53],[71,54],[70,54],[69,54],[69,55],[68,55],[67,55],[67,56],[66,56],[65,56],[64,56],[64,57],[63,57],[62,57],[61,57],[60,57],[60,58],[59,58],[58,58],[57,58],[56,58],[55,58],[55,59],[54,59],[53,59],[52,59],[51,59],[50,59],[49,59],[48,59],[47,59],[46,59],[45,59],[44,59],[43,59],[42,59],[41,59],[40,59],[40,58],[39,58],[38,58],[37,58],[36,58],[35,58],[35,57],[34,57],[33,57],[32,57],[31,57],[31,56],[30,56],[29,56],[29,55],[28,55],[27,55],[26,55],[26,54],[25,54],[24,54],[24,53],[23,53],[22,53],[22,52],[21,52],[20,52],[20,51],[19,51],[19,50],[18,50],[18,49],[17,49],[17,48],[16,48],[16,47],[15,47],[15,46],[14,46],[14,45],[13,45],[13,44],[12,44],[12,43],[12,42],[11,42],[11,41],[11,40],[10,40],[10,39],[10,38],[10,37],[9,37],[9,36],[9,35],[9,34],[9,33],[9,32],[9,31],[9,30],[9,29],[9,28],[10,28],[10,27],[10,26],[10,25],[11,25],[11,24],[11,23],[12,23],[12,22],[12,21],[13,21],[13,20],[14,20],[14,19],[14,18],[15,18],[15,17],[16,17],[16,16],[17,16],[18,16],[18,15],[18,14],[19,14],[20,14],[20,13],[21,13],[21,12],[22,12],[23,12],[23,11],[24,11],[25,11],[25,10],[26,10],[27,10],[27,9],[28,9],[29,9],[29,8],[30,8],[31,8],[32,8],[32,7],[33,7],[34,7],[35,7],[36,7],[36,6],[37,6],[38,6],[39,6],[40,6],[41,6],[41,5],[42,5],[43,5],[44,5],[45,5],[46,5],[47,5],[48,5],[49,5],[50,5],[51,5],[52,5],[53,5],[54,5],[55,5],[56,5],[56,6],[57,6],[58,6],[59,6],[60,6],[61,6],[61,7],[62,7],[63,7],[64,7],[65,7],[65,8],[66,8],[67,8],[68,8],[68,9],[69,9],[70,9],[70,10],[71,10],[72,10],[72,11],[73,11],[74,11],[74,12],[75,12],[76,12],[76,13],[77,13],[77,14],[78,14],[78,15],[79,15],[79,16],[80,16],[80,17],[81,17],[81,18],[82,18],[82,19],[83,19],[83,20],[84,20],[84,21],[84,22],[85,22],[85,23],[85,24],[86,24],[86,25],[86,26],[86,27],[87,27],[87,28],[87,29],[87,30],[87,31],[87,32],[87,33],[87,34],[87,35],[87,36],[86,36],[86,37],[86,38],[86,39],[85,39],[85,40],[85,41],[84,41],[84,42]],"moor":[[78,43],[79,43],[80,43],[81,43],[82,43],[83,43]],"pier":[77,43],"places":{"fire":[[40,33,"E",41,33],[42,33,"W",41,33],[41,35,"N",41,33],[41,32,"S",41,33]],"well":[[55,28,"N",55,27]],"mail":[[44,28,"W",43,28]],"trough":[[35,38,"S",35,39]],"coop":[[33,36,"W",32,36]],"sign":[[50,44,"W",49,44]],"picnic":[[45,35,"S",45,35],[46,34,"W",46,34],[44,34,"E",44,34]],"views":[[77,43,"E",78,43],[60,43,"S",60,44],[61,43,"N",61,42],[27,24,"S",27,25],[58,39,"E",59,39],[66,40,"N",66,39],[39,37,"W",37,37],[52,29,"N",52,27]],"trees":[[48,21,"N",48,20],[46,20,"N",46,19],[28,31,"N",28,30],[44,20,"N",44,19],[46,17,"N",46,16],[48,17,"N",48,16],[40,21,"N",40,20],[25,31,"N",25,30],[52,19,"N",52,18],[43,46,"N",43,45],[27,36,"N",27,35],[46,15,"N",46,14]],"rocks":[[34,30,"W",33,30],[36,27,"W",35,27],[32,24,"W",31,24],[22,29,"W",21,29],[24,25,"W",23,25],[30,32,"W",29,32],[25,29,"E",26,29]],"bushes":[[60,29,"W",59,29],[42,38,"W",41,38],[32,33,"W",31,33],[43,41,"W",42,41],[67,38,"W",66,38],[53,47,"E",54,47],[34,48,"W",33,48]],"fruit":[[52,21,"N",52,20],[55,23,"N",55,22],[53,21,"N",53,20],[58,21,"N",58,20]],"flowers":[[54,29,"W",53,29],[56,32,"W",55,32],[47,24,"W",46,24],[48,23,"W",47,23],[49,39,"W",48,39],[52,38,"W",51,38],[51,23,"W",50,23],[34,33,"W",33,33],[36,26,"E",37,26],[50,20,"E",51,20],[47,44,"W",46,44],[58,23,"W",57,23],[47,46,"W",46,46],[56,21,"E",57,21],[54,44,"W",53,44],[45,15,"N",45,14],[53,46,"W",52,46],[38,19,"W",37,19]]}}};
;
const TITLE_TALK = {
meet: [
["The hens are loud today.", "They heard about breakfast."],
["Did you water the wheat?", "Twice. It still looks thirsty."],
["Pip says a storm is coming.", "Pip says that every day."],
["I found a shiny rock!", "Is it ore, or just wet?"],
["Race you to the flag.", "Only if I win."],
["Who moved my chair?", "The wind. Definitely the wind."],
["The well tastes like spring.", "It tastes like bucket."],
["Lou stole my sandwich.", "Ducks pay no rent either."],
["Need any wood?", "A bigger table. For more soup."],
["I counted every flower.", "You missed one. Behind you."],
["Nice hat!", "It keeps the ideas in."],
["Soup tonight?", "Soup every night."],
["The boat creaks.", "So do I."],
["Is that cow smiling?", "She knows something."],
["I planted a tree once.", "I chopped it. Sorry."],
["What's past the sea?", "More sea. Then lunch."],
["You look busy.", "I'm resting very hard."],
["Have you seen my axe?", "It's in your hand."],
["The bread came out round!", "Bread is allowed to be round."],
["Any letters today?", "One. It was from me."],
["The bridge feels wobbly.", "That's your knees."],
["I named a chicken Soup.", "That's a bit mean."],
["Do fish sleep?", "Ask Lou. He never does."],
["Lovely day for it.", "For what?"],
["The mushrooms moved again.", "They do that. Leave them be."],
["Carrots or pumpkins?", "Yes."],
],
fire: [
["Look at all those stars.", "I can see a spoon."],
["Tell the one about the wyrm.", "Not before bed."],
["This fire is perfect.", "I built it."],
["Sing something!", "La la la ♪"],
["Who's on dishes?", "The duck."],
["I could sit here forever.", "You said that yesterday. You did."],
["Was that an owl?", "That was my stomach."],
["Same time tomorrow?", "Same fire, too."],
],
shout: [
["Tobi", "WHO TOOK MY AXE?!", "Nell", "IT'S IN YOUR HAND!"],
["Tobi", "HELLOOO!", "Nell", "HELLO YOURSELF!"],
["Tobi", "IS IT SOUP AGAIN?!", "Mira", "IT'S ALWAYS SOUP!"],
["Tobi", "TREE COMING DOWN!", "Mira", "NOT ON THE WHEAT!"],
["Mira", "DINNER AT SUNDOWN!", "Tobi", "IS IT SOUP?!"],
["Mira", "WHO LEFT THE GATE OPEN?!", "Nell", "NOT ME!"],
["Mira", "LOU! OUT OF MY WHEAT!", "Lou", "QUACK!"],
["Mira", "HAS ANYONE SEEN CLOVER?!", "Tobi", "SHE'S BEHIND YOU!"],
["Nell", "I FOUND A BUG!", "Mira", "PUT IT BACK!"],
["Nell", "ECHO!", "Tobi", "ECHO!"],
["Nell", "RACE YOU TO THE FLAG!", "Tobi", "I'M HOLDING AN AXE!"],
["Nell", "THE DUCK WINKED AT ME!", "Lou", "QUACK."],
["Pip", "LAND HO!", "Tobi", "IT'S THE SAME LAND, PIP!"],
["Pip", "I CAN SEE MY HOUSE!", "Mira", "THAT'S MY HOUSE!"],
["Pip", "MAN OVERBOARD!", "Nell", "YOU'RE THE ONLY ONE ABOARD!"],
["Lou", "QUACK!", "Nell", "HE SAID QUACK!"],
],
solo: {
chop: ["Timber!", "Mind your toes!", "One more for the pile."],
mine: ["Clink.", "Stubborn rock.", "Ooh, sparkly."],
harvest: ["Ripe!", "Bread, soon.", "Look at that wheat!"],
water: ["Drink up.", "Grow, grow, grow."],
view: ["What a view.", "Hello, sea.", "I can see my house!", "Smells like rain."],
eggs: ["Still warm.", "Thank you, ladies."],
feed: ["Breakfast!", "Don't push."],
mail: ["A letter!", "It's for me!"],
post: ["Off you go.", "Special delivery."],
milk: ["Good girl.", "Thank you, Clover."],
sign: ["'Pier this way.'", "Who writes these?"],
sea: ["Ahoy!", "Fair wind today.", "Land ho! Again."],
fire: ["Mmm, warm.", "La la la ♪", "Pass the bread?", "Ahh."],
flower: ["For the table.", "Pretty one."],
eat: ["Mmm.", "Sweet!"],
},
};
;
const TitleCast = (() => {
let I = null, spoke = 0, loud = 0, last = null;
const WAYS = {N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0]}, taken = new Map();
const lv = (x, y) => levelAt(I.ox + x, I.oy + y) || 0, one = (list) => list[I.pick(list.length)];
const bare = (x, y) => { const t = I.at(x, y); return !!t && WALKABLE_GROUND.has(t[1]) && !SOLID.has(t[0]); };
const afloat = (x, y) => { const t = I.at(x, y); return !!t && wet(t[1]) && GROUND.has(t[0]); };
const far = (a, b) => Math.abs(a.x - b[0]) + Math.abs(a.y - b[1]);
const someone = (x, y, but) => I.people.some((o) => o !== but && o.x === x && o.y === y);
const toward = (a, b) => Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? (b.x > a.x ? "E" : "W") : (b.y > a.y ? "S" : "N");
const mutter = (p, kind) => { if (I.tick - spoke > 60 && !I.pick(3)) { spoke = I.tick; I.say(p, one(TITLE_TALK.solo[kind])); } };
const HARD = {".": 3, o: 6, u: 6};
function route(p, tx, ty, ok = bare) {
const w = I.w, k0 = p.y * w + p.x, from = new Map([[k0, -1]]), cost = new Map([[k0, 0]]), due = [[k0]];
for (let c = 0; c < due.length; c++) for (const k of due[c] || []) {
if (cost.get(k) !== c) continue;
const x = k % w, y = (k - x) / w;
if (x === tx && y === ty) { const way = []; for (let q = k; q !== k0; q = from.get(q)) way.unshift([q % w, Math.floor(q / w)]); return way; }
for (const [dx, dy] of Object.values(WAYS)) {
const nx = x + dx, ny = y + dy, n = ny * w + nx;
if (nx < 0 || ny < 0 || nx >= w || ny >= I.h || !ok(nx, ny) || Math.abs(lv(nx, ny) - lv(x, y)) > 1) continue;
if ((nx !== tx || ny !== ty) && I.people.some((o) => o !== p && o.still && o.x === nx && o.y === ny)) continue;
const to = c + (HARD[I.at(nx, ny)[1]] || 2);
if (cost.has(n) && cost.get(n) <= to) continue;
cost.set(n, to); from.set(n, k); (due[to] || (due[to] = [])).push(n);
}
}
return null;
}
function* go(p, x, y, how = {}) {
const way = route(p, x, y, how.ok);
if (!way) return false;
p.run = !!how.run;
for (const [nx, ny] of way) {
const pace = (how.pace || (how.run ? 1 : 2)) + (lv(nx, ny) > lv(p.x, p.y) ? 1 : 0);
p.x = nx; p.y = ny; p.doing = "walk";
for (let i = pace; i > 0; i--) yield;
}
p.doing = null; p.run = false; yield;
return true;
}
function* work(p, what, ticks) {
Object.assign(p, {doing: what.doing || (what.dir ? "look" : null), with: what.with || null, item: what.item || null, dir: what.dir || null, aim: what.at || null, still: true});
while (ticks-- > 0) yield;
Object.assign(p, {doing: null, with: null, item: null, aim: null, still: false});
}
const rest = (p, ticks, dir) => work(p, {dir}, ticks);
function place(p, kind, ok) {
const s = one(I.C.places[kind].filter((q) => !taken.has(q) && q !== p.was && (!ok || ok(I.at(q[3], q[4])[0]))).sort((a, b) => far(p, a) - far(p, b)).slice(0, 4));
if (s) { taken.set(s, p); p.spot = s; }
return s;
}
function* visit(p, kind, ok, how) { const s = place(p, kind, ok); return s && (yield* go(p, s[0], s[1], how)) ? s : null; }
function beside(p, tx, ty) {
const cost = (s) => far(p, s) + (s[2] === "N" ? 4 : 0);
const out = (x, y) => { const t = I.at(x, y); return t[0] !== "+" && t[1] !== "n"; };
return Object.entries(WAYS).map(([d, [dx, dy]]) => [tx - dx, ty - dy, d, tx, ty]).filter(([x, y]) => bare(x, y) && out(x, y) && !someone(x, y, p)).sort((a, b) => cost(a) - cost(b))[0] || null;
}
const field = (want) => { const [x0, y0, x1, y1] = I.C.field, out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = I.at(x, y); if (t && want(t[0], t[1])) out.push([x, y]); } return out; };
const crop = (p, want) => one(field(want).map(([x, y]) => beside(p, x, y)).filter(Boolean).sort((a, b) => far(p, a) - far(p, b)).slice(0, 2));
const ripe = (c) => c === "w", dry = (c, g) => g === "o";
function* talk(p, q, lines) {
if (!q) return;
const [a, b] = one(lines);
q.hold = 72; q.face = toward(q, p); p.talks = I.tick + 72;
I.say(p, a); yield* rest(p, 32, toward(p, q));
I.say(q, b); yield* rest(p, 34, toward(p, q));
}
function* gather(p, kind, full, picked, food) {
const s = yield* visit(p, kind, (c) => c === CHAR[full]);
if (!s) return;
yield* work(p, {doing: "pick_up", dir: s[2]}, 5);
I.put(s[3], s[4], {block: picked}, "pick", p.name);
I.later(500 + I.pick(400), () => I.put(s[3], s[4], {block: full}, "grew"));
yield* work(p, {doing: "eat", item: food, dir: "S"}, 24); mutter(p, "eat");
}
const DO = {
*water(p) {
for (let n = 2 + I.pick(3); n > 0; n--) {
const s = crop(p, dry);
if (!s || !(yield* go(p, s[0], s[1]))) return;
yield* work(p, {doing: "water", with: "watering_can", dir: s[2], at: [s[3], s[4]]}, 16 + I.pick(8));
I.put(s[3], s[4], {ground: "wet_tilled"});
}
mutter(p, "water");
},
*harvest(p) {
for (let n = 2 + I.pick(3); n > 0; n--) {
const s = crop(p, ripe);
if (!s || !(yield* go(p, s[0], s[1]))) return;
yield* work(p, {doing: "pick_up", dir: s[2]}, 5);
I.put(s[3], s[4], {block: "none"}, "pick", p.name);
yield* rest(p, 5, s[2]);
yield* work(p, {doing: "place", dir: s[2]}, 5);
I.put(s[3], s[4], {block: "sprout"}, "place", p.name);
if (n === 1) emote(p.name, "star");
}
mutter(p, "harvest");
},
*chop(p) {
const s = yield* visit(p, "trees", (c) => c === "T");
if (!s) return;
yield* work(p, {doing: "dig", with: "axe", dir: s[2], at: [s[3], s[4]]}, 34 + I.pick(16));
I.put(s[3], s[4], {block: "stump"}, "dig", p.name); mutter(p, "chop");
I.later(700 + I.pick(500), () => I.put(s[3], s[4], {block: "tree"}, "grew"));
yield* rest(p, 12, s[2]);
},
*mine(p) {
const s = yield* visit(p, "rocks");
if (!s) return;
yield* work(p, {doing: "dig", with: "pickaxe", dir: s[2], at: [s[3], s[4]]}, 28 + I.pick(16));
if (!I.pick(3)) emote(p.name, "star");
mutter(p, "mine"); yield* rest(p, 8, s[2]);
},
berries: (p) => gather(p, "bushes", "berry_bush", "bare_bush", "berries"),
fruit: (p) => gather(p, "fruit", "fruit_tree", "bare_fruit_tree", "fruit"),
*flower(p) {
const s = yield* visit(p, "flowers", (c) => c === "f");
if (!s) return;
yield* work(p, {doing: "pick_up", dir: s[2]}, 5);
I.put(s[3], s[4], {block: "none"}, "pick", p.name); emote(p.name, "love"); mutter(p, "flower");
I.later(500 + I.pick(500), () => I.put(s[3], s[4], {block: "flower"}, "grew"));
yield* rest(p, 10, "S");
},
*view(p) {
const s = yield* visit(p, "views", null, {run: p.name === "Nell" && !I.pick(2)});
if (!s) return;
mutter(p, "view"); yield* rest(p, 30 + I.pick(40), s[2]);
if (!I.pick(3)) emote(p.name, "music");
},
*well(p) { const s = yield* visit(p, "well"); if (s) { yield* work(p, {doing: "take", dir: s[2]}, 6); yield* rest(p, 10, s[2]); } },
*sign(p) { const s = yield* visit(p, "sign"); if (s) { yield* rest(p, 16, s[2]); mutter(p, "sign"); yield* rest(p, 10, s[2]); } },
*feed(p) {
const s = yield* visit(p, "trough");
if (!s) return;
yield* work(p, {doing: "place", dir: s[2]}, 6);
I.trough = I.tick + 450; mutter(p, "feed");
for (const a of I.herd) if (a.kind !== "cow") a.loved = I.tick + 30 + I.pick(30);
yield* rest(p, 14, s[2]);
},
*eggs(p) { const s = yield* visit(p, "coop"); if (s) { yield* work(p, {doing: "take", dir: s[2]}, 6); emote(p.name, "happy"); mutter(p, "eggs"); yield* rest(p, 8, s[2]); } },
*milk(p) {
const cow = one(I.herd.filter((a) => a.kind === "cow")), s = cow && beside(p, cow.x, cow.y);
if (!s) return;
cow.wait = 300;
if (yield* go(p, s[0], s[1])) {
yield* work(p, {doing: "milk", dir: s[2]}, 18);
burst(I.ox + cow.x, I.oy + cow.y, "spark", 4, {dy: -.2, g: 5}); emote(p.name, "happy"); cow.loved = I.tick + 30; mutter(p, "milk");
}
cow.wait = 20;
},
*mail(p) { const s = yield* visit(p, "mail"); if (s) { yield* work(p, {doing: "take", dir: s[2]}, 6); I.mail = false; emote(p.name, "love"); mutter(p, "mail"); yield* rest(p, 12, "S"); } },
*post(p) { const s = yield* visit(p, "mail"); if (s) { yield* work(p, {doing: "place", dir: s[2]}, 6); I.mail = true; mutter(p, "post"); yield* rest(p, 6, s[2]); } },
*picnic(p) {
const s = yield* visit(p, "picnic");
if (!s) return;
yield* work(p, {doing: "eat", item: one(["bread", "fruit", "carrot", "pumpkin", "berries"]), dir: "S"}, 26);
burst(I.ox + p.x, I.oy + p.y, "food", 6, {dy: -.6, g: 3}); emote(p.name, "love"); yield* rest(p, 10, "S");
},
*stroll(p) {
for (let n = 12; n > 0; n--) {
const x = p.x + I.pick(21) - 10, y = p.y + I.pick(15) - 7, t = I.at(x, y);
if (!t || t[0] !== "." || someone(x, y, p)) continue;
if (yield* go(p, x, y, {run: !I.pick(3)})) yield* rest(p, 8 + I.pick(20));
return;
}
},
*chat(p) {
const q = one(I.people.filter((o) => o !== p && !o.sail && !o.swim && !o.hold && far(p, [o.x, o.y]) < 26));
const s = q && beside(p, q.x, q.y), way = s && route(p, s[0], s[1]);
if (!way || way.length > 30) return;
q.hold = way.length + 14; q.face = toward(q, p);
if ((yield* go(p, s[0], s[1], {run: true})) && far(p, [q.x, q.y]) === 1) yield* talk(p, q, TITLE_TALK.meet);
},
*fire(p) {
const s = yield* visit(p, "fire");
if (!s) return;
for (let n = 2 + I.pick(3); n > 0 && I.evening(); n--) {
yield* rest(p, 14 + I.pick(30), s[2]);
const k = I.pick(5), round = I.people.filter((o) => o !== p && o.still && !o.hold && I.C.places.fire.includes(o.spot));
if (k === 0) yield* work(p, {doing: "eat", item: one(["bread", "cooked_meat", "mushroom"]), dir: s[2] === "N" ? "S" : s[2]}, 24);
else if (k === 1) emote(p.name, one(["music", "happy", "laugh"]));
else if (k === 2) mutter(p, "fire");
else yield* talk(p, one(round), TITLE_TALK.fire);
}
},
*swim(p) {
const [x, y] = one(I.C.pond);
yield* go(p, x, y, {ok: afloat, pace: 4});
yield* rest(p, 10 + I.pick(40));
if (!I.pick(4)) emote(p.name, "music");
},
*sail(p) {
const ring = I.C.ring, moor = I.C.moor, [px, py] = I.C.pier, [mx, my] = moor[0];
const splash = () => { burst(I.ox + mx, I.oy + my, "water", 8, {up: 1.5, spread: 2}); sfx("water", I.ox + mx, I.oy + my); };
const to = function* ([x, y]) { p.x = x; p.y = y; p.doing = "walk"; yield; yield; };
if (!p.sail) {
if (!(yield* go(p, px, py))) return;
yield* rest(p, 6, "E");
I.put(mx, my, {block: "none"}, "board"); p.sail = true; splash();
for (const t of [...moor, ring[0]]) yield* to(t);
p.on = 0; p.turn = I.pick(2) ? 1 : -1;
}
let stops = 1 + I.pick(2);
do {
p.on = (p.on + p.turn + ring.length) % ring.length; yield* to(ring[p.on]);
if (stops && !I.pick(90)) { stops--; mutter(p, "sea"); yield* rest(p, 30 + I.pick(40)); if (!I.pick(2)) emote(p.name, "music"); }
} while (p.on);
for (const t of [...moor].reverse()) yield* to(t);
p.sail = false; p.x = px; p.y = py; p.ashore = 0;
I.put(mx, my, {block: "boat"}, "moor"); splash();
yield* rest(p, 8, "W");
},
};
const LIKES = {
Mira: {harvest: 6, water: 4, feed: 2, eggs: 1.5, milk: 2, well: 1, mail: 3, picnic: 1, chat: 2.5, flower: 1, view: .5},
Tobi: {chop: 4, mine: 3, berries: 1.5, fruit: 1, picnic: 1, view: 1, sign: .5, well: .5, chat: 2.5, stroll: .5},
Nell: {view: 3, flower: 2.5, stroll: 2, berries: 1.5, fruit: 1.5, chat: 3, picnic: 1, milk: 1, sign: .5},
Pip: {sail: 5, post: 2.5, view: 2, chat: 3, picnic: 1.5, fruit: 1, stroll: 1},
Lou: {swim: 1},
};
const DAY = ["harvest", "water", "chop", "mine", "sail", "milk", "feed"], CAN = {harvest: () => field(ripe).length > 0, water: () => field(dry).length > 0, mail: () => I.mail, post: () => !I.mail, feed: () => I.trough < I.tick, sail: (p) => p.ashore >= 2};
function choose(p) {
if (p.sail) return DO.sail(p);
if (I.evening() && !p.swim && p.last !== "fire" && I.C.places.fire.some((s) => !taken.has(s))) { p.last = "fire"; return DO.fire(p); }
let likes = Object.entries(LIKES[p.name]).filter(([k]) => k !== p.last && (!CAN[k] || CAN[k](p)) && !(I.evening() && DAY.includes(k)));
if (!likes.length) likes = Object.entries(LIKES[p.name]);
let r = I.rnd() * likes.reduce((sum, [, w]) => sum + w, 0);
const [kind] = likes.find(([, w]) => (r -= w) < 0) || likes[0];
p.last = kind; p.ashore = (p.ashore || 0) + 1;
return DO[kind](p);
}
function live(p) {
if (p.hold > 0) { p.hold--; return; }
if (p.job && !p.job.next().done) return;
if (p.spot) { taken.delete(p.spot); p.was = p.spot; p.spot = null; }
Object.assign(p, {doing: null, with: null, item: null, aim: null, still: false, run: false});
p.job = choose(p);
}
function hail() {
if (I.tick < loud || !I.eye) return;
const who = (n) => I.people.find((p) => p.name === n), seen = (p) => !!p && Math.abs(p.x - I.eye.x) <= 11 && Math.abs(p.y - I.eye.y) <= 6;
const free = (p) => seen(p) && !p.hold && !(p.talks > I.tick);
const s = one(TITLE_TALK.shout.filter((q) => q !== last && free(who(q[0]))));
if (!s) { loud = I.tick + 20; return; }
last = s; loud = I.tick + 220 + I.pick(200);
I.say(who(s[0]), s[1], true);
I.later(32, () => {
I.say(who(s[2]), s[3], true);
const by = one(I.people.filter((p) => seen(p) && p.name !== s[0] && p.name !== s[2]));
if (by) I.later(14, () => emote(by.name, "laugh"));
});
}
function wake(island) {
I = island; taken.clear(); spoke = 0; last = null; loud = 40 + I.pick(30);
const C = I.C, on = 1 + I.pick(C.ring.length - 1), at = ([x, y]) => ({x, y});
const P = (id, name, race, worn, more) => ({id, kind: "agent", name, race, worn, doing: null, dir: null, hold: 0, ...more});
return [P(9001, "Mira", "bunny", {head: "straw_hat"}, at(C.door)), P(9002, "Tobi", "bear", null, at(one(C.places.trees))),
P(9003, "Pip", "frog", {head: "bandana"}, {...at(C.ring[on]), sail: true, on, turn: I.pick(2) ? 1 : -1}),
P(9004, "Lou", "duck", null, {...at(one(C.pond)), swim: true}), P(9005, "Nell", "cat", null, at(one(C.places.views)))];
}
return {wake, live, hail};
})();
;
const TitleScene = (() => {
const OX = -8000, OY = -8000, M = typeof TITLE_MAP === "undefined" ? null : TITLE_MAP, DAY = 2000, DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const S = {on: false, tick: 0, phase: .3, timer: 0, seed: 1, people: [], herd: [], due: [], mail: false, trough: 0, eye: null, till: 0, ox: OX, oy: OY, C: M && M.cast, w: M && M.w, h: M && M.h};
S.rnd = () => (S.seed = (Math.imul(S.seed, 1103515245) + 12345) >>> 0) / 4294967296;
S.pick = (n) => Math.floor(S.rnd() * n);
S.at = (x, y) => tile(OX + x, OY + y);
S.evening = () => S.phase >= .7 && S.phase < .98;
S.later = (ticks, fn) => S.due.push([S.tick + ticks, fn]);
S.put = (x, y, now, cause, by) => {
const t = S.at(x, y);
if (t) onEvent({type: "tile", x: OX + x, y: OY + y, ground: now.ground || CH[t[1]], block: now.block || (GROUND.has(t[0]) ? "none" : CH[t[0]]), cause, by});
};
S.say = (p, text, shout = false) => {
bubbles.push({name: p.name, text, t: performance.now() / 1000, shout});
babble(p.name, text, OX + p.x, OY + p.y, shout);
const em = emoteFor(text); if (em) setTimeout(() => S.on && emote(p.name, em), 2500);
};
const free = (x, y, but) => { const t = S.at(x, y); return !!t && t[0] === "." && ![...S.herd, ...S.people].some((o) => o !== but && o.x === x && o.y === y); };
function herd(kind, n, id0, box, every) {
const out = [];
for (let i = 0; i < n; i++) {
const a = {id: id0 + i, kind, box, every, wait: S.pick(every), loved: 0, x: box[0], y: box[1]};
for (let k = 0; k < 40; k++) { a.x = box[0] + S.pick(box[2] - box[0] + 1); a.y = box[1] + S.pick(box[3] - box[1] + 1); if (free(a.x, a.y, a) && !out.some((o) => o.x === a.x && o.y === a.y)) break; }
out.push(a);
}
return out;
}
function graze(a) {
if (--a.wait > 0 || S.phase >= .75) return;
a.wait = a.every + S.pick(a.every);
const [dx, dy] = DIRS[S.pick(4)], x = a.x + dx, y = a.y + dy;
if (x >= a.box[0] && x <= a.box[2] && y >= a.box[1] && y <= a.box[3] && free(x, y, a)) { a.x = x; a.y = y; }
}
function grow() {
const [x0, y0, x1, y1] = S.C.field, x = x0 + S.pick(x1 - x0 + 1), y = y0 + S.pick(y1 - y0 + 1), t = S.at(x, y), next = {";": "crop", "\"": "ripe_crop"}[t[0]];
if (t[1] === "u") S.put(x, y, {ground: "tilled", ...(next ? {block: next} : {})});
else if (next && !S.pick(6)) S.put(x, y, {block: next});
}
const z = (a) => levelAt(OX + a.x, OY + a.y) || 0;
const said = (a) => a.kind === "agent"
? {kind: "agent", name: a.name, id: a.id, x: OX + a.x, y: OY + a.y, hp: HP_MAX, doing: a.hold ? "look" : a.doing, weapon: null, dir: a.hold ? a.face : a.doing && a.doing !== "walk" ? a.dir : null, tid: null,
at: a.aim ? [OX + a.aim[0], OY + a.aim[1]] : null, with: a.with || null, item: a.item || null, run: !!a.run, sail: !!a.sail, z: z(a), race: a.race, ...(a.worn ? {worn: a.worn} : {}), ...(a.swim ? {swim: true} : {})}
: {kind: a.kind, id: a.id, x: OX + a.x, y: OY + a.y, z: z(a), hp: 10, love: a.loved > S.tick, scared: false};
function sea() {
const [vx, vy, vw, vh] = viewRect(8), far = HdLook.eye ? 30 : 0, x = Math.min(vx, cam.x - far), y = Math.min(vy, cam.y - far), w = Math.max(vx + vw, cam.x + far) - x, h = Math.max(vy + vh, cam.y + far) - y;
for (let by = Math.floor(y / B); by <= Math.floor((y + h) / B); by++) for (let bx = Math.floor(x / B); bx <= Math.floor((x + w) / B); bx++)
if (!blocks.has(bkey(bx, by))) onRegion({x: bx * B, y: by * B, w: B, h: B, ...M.sea});
}
function step() {
S.tick++; S.phase = (.3 + S.tick / DAY) % 1;
if (!S.shown && (S.tick > 150 || (S.tick > 1 && !arrivingNow && (!HdLook.live || (HdLook.builds && !HdLook.busy))))) { S.shown = S.tick; requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("scene"))); }
const now = S.due.filter(([at]) => at <= S.tick); S.due = S.due.filter(([at]) => at > S.tick);
for (const [, fn] of now) fn();
if (S.tick % 8 === 0) grow();
for (const p of S.people) TitleCast.live(p);
TitleCast.hail();
for (const a of S.herd) graze(a);
const hm = Math.floor(S.phase * 1440), two = (n) => String(n).padStart(2, "0"), night = S.phase >= .75, where = (s) => [[OX + s[3], OY + s[4]]];
onTick({type: "tick", tick: S.tick, time: `day 1, ${two(Math.floor(hm / 60))}:${two(hm % 60)}${night ? " (night)" : ""}`, night, phase: S.phase, entities: [...S.people, ...S.herd].map(said), items: [],
mail: S.mail ? where(S.C.places.mail[0]) : [], troughs: S.trough > S.tick ? where(S.C.places.trough[0]) : [], fires: []});
look(); sea();
}
function look() {
if (!S.eye || S.eye.sail || S.tick >= S.till) {
const who = S.people.filter((p) => !p.sail && !p.swim && p !== S.eye), fire = who.filter((p) => p.last === "fire");
S.eye = (fire.length ? fire : who)[S.pick((fire.length ? fire : who).length)] || S.eye; S.till = S.tick + 140 + S.pick(120);
}
const [x0, y0, x1, y1] = S.C.view, x = Math.max(x0, Math.min(x1, S.eye.x)), y = Math.max(y0, Math.min(y1, S.eye.y));
if (S.shown && S.tick > S.shown + 8) { camT.x += (OX + x - camT.x) * .035; camT.y += (OY + y - camT.y) * .035; }
}
function start(seed) {
if (S.on || !M || me) return;
Object.assign(S, {on: true, tick: 0, phase: .3, seed: (seed || Date.now()) >>> 0 || 1, due: [], mail: false, trough: 0, people: [], herd: [], eye: null, till: 0, shown: 0});
for (const b of M.blocks) onRegion({...b, x: b.x + OX, y: b.y + OY});
cam.x = camT.x = OX + S.C.centre[0]; cam.y = camT.y = OY + S.C.centre[1] + TITLE_DY;
arrivingNow = true;
const eye = {x: 0, y: 0, z: levelAt(cam.x, Math.round(OY + S.C.centre[1])) || 0, free: true}; HdLook.eye = () => { eye.x = cam.x; eye.y = cam.y; eye.rush = !S.shown; return eye; };
ears = () => ({x: cam.x, y: cam.y});
S.herd = [...herd("chicken", 3, 9101, S.C.pen, 14), ...herd("chick", 1, 9111, S.C.pen, 9), ...herd("cow", 2, 9121, S.C.meadow, 26)];
S.people = TitleCast.wake(S);
sea(); step();
S.timer = setInterval(step, 100);
}
function stop() {
if (!S.on) return;
S.on = false; clearInterval(S.timer); ears = null; HdLook.eye = null;
ents.clear(); blocks.clear(); dirtyTiles.length = 0; requested.clear(); lastWatch = ""; arrivingNow = true; fireAt = [];
bubbles.length = 0; emotes.clear(); mailAt = new Set(); troughAt = new Set();
if (!me) { cam.x = camT.x = 0; cam.y = camT.y = 0; }
}
let boxes = [], boxesAt = -1e9;
function hides(x, y, w, h) {
if (!S.on) return false;
if (performance.now() - boxesAt > 300) { boxesAt = performance.now(); boxes = [".logo", "#splash", ".menu"].map((q) => { const e = $("joinbox").querySelector(q), r = document.createRange(); if (!e) return null; r.selectNodeContents(e);
const a = q === ".menu" ? e.getBoundingClientRect() : r.getBoundingClientRect(); return a.width ? {x: a.left - 8, y: a.top - 8, w: a.width + 16, h: a.height + 16} : null; }).filter(Boolean); }
return boxes.some((b) => x < b.x + b.w && b.x < x + w && y < b.y + b.h && b.y < y + h);
}
return {start, stop, step, hides, get boxes() { return boxes; }, get on() { return S.on; }, S};
})();
ready.then(() => { if ($("joinbox").style.display !== "none" && !new URLSearchParams(location.search).get("follow")) TitleScene.start(); if (!TitleScene.on) document.body.classList.add("scene"); });
new MutationObserver(() => { if ($("joinbox").style.display === "none") TitleScene.stop(); }).observe($("joinbox"), {attributes: true, attributeFilter: ["style"]});

