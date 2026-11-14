// Tile vocabulary shared with tiles.py: chars, solidity, labels, multi-tile footprints.

"use strict";
// =====================================================================================
//  Vocabulary (must match tiles.py)
// =====================================================================================
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
// structures bigger than a tile (tiles.py FOOTPRINT): stored on the bottom-left tile, the rest is Z/z
const FOOT = {Y: [2, 2], J: [2, 2], m: [3, 2]};
function footprint(c, x, y, px, py) {     // placing at (x, y) from (px, py): the anchor and every covered tile
  const [w, h] = FOOT[c];                 // same rule as tiles.py footprint: extend away from the placer
  let x0 = x - ((w - 1) >> 1);
  if (px === x - 1 && py === y) x0 = x; else if (px === x + 1 && py === y) x0 = x - w + 1;
  const ay = px === x && py === y - 1 ? y + h - 1 : y;
  return {ax: x0, ay, tiles: footOf(c, x0, ay)};
}
function footOf(c, ax, ay) { const [w, h] = FOOT[c], tiles = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) tiles.push({x: ax + i, y: ay - j}); return tiles; }
function structAt(x, y) {                 // the anchor of the structure a Z/z tile belongs to
  for (const [c, [w, h]] of Object.entries(FOOT)) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++)
    if (combAt(x - i, y + j) === c) return {x: x - i, y: y + j, c};
  return null;
}
const CHAR = Object.fromEntries(Object.entries(CH).map(([c, n]) => [n, c]));
const GROUND = new Set("~:.,o_'=un-()");
const DEPTH_OF = {"~": 1, "(": 2, "=": 3, ")": 4};           // water: how many layers down its bottom lies (tiles.py DEPTH)
const wet = (g) => g in DEPTH_OF;
const SOLID = new Set("TFbM*H#%^&CBhLpKWXYJqZeyUvtR");
const WALKABLE_GROUND = new Set(":.,o_'un-");
const LABEL = {wood_wall: "wooden wall", wet_tilled: "watered soil", watering_can: "watering can", fruit_tree: "fruit tree", berry_bush: "berry bush", stone_wall: "stone wall", ripe_crop: "ripe wheat", crop: "young wheat",
  cooked_meat: "cooked meat", deep_water: "deep water", mid_water: "deeper water", abyss: "the deep", picnic_blanket: "picnic blanket", hay_bale: "hay bale"};
const label = (n) => LABEL[n] || String(n).replace("_", " ");
