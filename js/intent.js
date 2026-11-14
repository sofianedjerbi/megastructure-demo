// What a click or key would do on a tile (intent) and doing it (perform).

const DIRV = {N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0]};
function myPos() { const p = ents.get("agent" + myId); return p ? {x: p.tx, y: p.ty} : meObs ? meObs.self : null; }
function dirTo(p) { const s = myPos(); if (!s) return null; for (const [d, [dx, dy]] of Object.entries(DIRV)) if (s.x + dx === p.x && s.y + dy === p.y) return d; return null; }
function plainWalk(x, y) {
  const t = tile(x, y); if (!t) return false;
  if (wet(t[1])) return t[0] === "V" || !SOLID.has(t[0]);   // water, whatever its depth: you swim on it (swim.js), or sail
  return WALKABLE_GROUND.has(t[1]) && !SOLID.has(t[0]);
}
function walkable(x, y, fx, fy) {               // (fx, fy): where you come from: a layer up or down at most
  return plainWalk(x, y) && (fx === undefined || canStep(fx, fy, x, y));
}
// ---- what a click does, decided per tile (also shown as the cursor hint) ----------------
const FILLS = {dirt: {o: ",", u: ",", "~": ",", "(": "~", "=": "(", ")": "="}, path: {".": "_", ",": "_", "'": "_"}, plank: {"~": ":", ".": "n", ",": "n", "'": "n"}};
const FILL_TEXT = {",": "Fill with dirt", "~": "Raise the bottom", "(": "Raise the bottom", "=": "Raise the bottom", _: "Lay cobblestone path", ":": "Build bridge", n: "Lay wooden floor"};
const FILL_HELP = {dirt: "Dirt fills holes and shallow water", path: "Paths go on grass or dirt", plank: "Planks: bridge over water, floor on land"};
const PLACEABLE_BLOCK = {mailbox: "X", boat: "V", wood_wall: "W", flower: "f", bed: "B", chair: "h", table: "L", plant: "p", clock: "K", rug: "r", gate: "g", fence: "#", stone_wall: "%", door: "+", campfire: "^", workbench: "&", sign: "?", flag: "!", chest: "C", well: "Y", coop: "J", picnic_blanket: "m", basket: "q", trough: "e", hay: "y"};
const HARVEST = {t: "Dig up the stump", U: "Chop tree (the fruit grows back if you wait)", v: "Cut the bush (fiber)", e: "Take down the trough (and what's in it)", y: "Pick up the hay bale", Y: "Take down the well", J: "Take down the coop", m: "Roll up the blanket", q: "Take the basket", X: "Take down mailbox", V: "Pick up the boat", W: "Take down wall", f: "Pick flower", B: "Take down bed", h: "Take down chair", L: "Take down table", p: "Take the plant",
  K: "Take down clock", r: "Roll up rug", g: "Take down gate", F: "Pick fruit", ";": "Uproot sprout", T: "Chop tree", b: "Pick berries", M: "Mine rock", R: "Mine rock wall", "*": "Mine ore", H: "Cut thicket", Q: "Pick mushroom",
  w: "Harvest wheat", "\"": "Uproot young wheat", "#": "Take down fence", "%": "Take down wall", "+": "Take down door",
  "^": "Take down campfire", "&": "Take down workbench", "?": "Take down sign", "!": "Take down flag", C: "Break chest open", x: "Fire!"};
// which tool speeds up digging each block (tiles.py Block.tool); ore can only be mined with a pickaxe in hand
const TOOL_FOR = {t: "axe", U: "axe", T: "axe", M: "pickaxe", "*": "pickaxe", H: "axe", "#": "axe", "%": "pickaxe", "+": "axe", "&": "axe", C: "axe", B: "axe", h: "axe",
  L: "axe", K: "axe", g: "axe", W: "axe", V: "axe", X: "axe", Y: "pickaxe", J: "axe", e: "axe"};
const WEAPON_DMG = {sword: 30, spear: 18, axe: 12, pickaxe: 10};
const inHand = () => (selected && meObs && meObs.self.inventory[selected] ? selected : null);   // what's in your hand
// The creature or person at a tile: where it stands, or where it is drawn right now (moving animals stay clickable).
function entityAt(p) {
  const others = [...ents.values()].filter((q) => q.e && !(q.e.kind === "agent" && q.e.id === myId));
  return others.find((q) => q.tx === p.x && q.ty === p.y) || others.find((q) => Math.round(q.x) === p.x && Math.round(q.y) === p.y);
}
const reachOf = (weapon) => (weapon === "spear" ? 3 : 2);   // tiles.py REACH, less the tile the server allows for your lead (reaches, below: a circle, height counted)
// What the pointer means at a tile. A tree's crown hangs over the tiles above its trunk (a round tree's almost two
// tiles, a thin one's one): pointing there means the tree, unless you hold something meant for that ground tile.
const TALL = "TFU";
function aimAt(p, shift) {
  if (!GROUND.has(combAt(p.x, p.y)) || entityAt(p)) return p;
  // someone's head and shoulders are drawn over the lower half of the tile above theirs: pointing there means them
  if (p.fy > 1 - (4 + STAND) / 16 && entityAt({x: p.x, y: p.y + 1})) return {x: p.x, y: p.y + 1};
  const forGround = selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || ["seed", "hoe", "watering_can"].includes(selected));
  if (forGround) return p;
  for (const dy of [1, 2]) {
    const c = combAt(p.x, p.y + dy);
    if (!c || !TALL.includes(c)) continue;
    const spr = objectSprite(c, p.x, p.y + dy, 0), above = spr ? -spr[6] : 0;   // how far the sprite reaches up (px)
    if (above > (dy - 1) * 16 + 3) return {x: p.x, y: p.y + dy};
  }
  return p;
}
function intent(p, shift) {
  let t = tile(p.x, p.y), s = myPos(), foot = null;
  if (!t || !s) return null;
  if (t[0] === "Z" || t[0] === "z") {          // part of a bigger structure: it means the whole thing
    const st = structAt(p.x, p.y);
    if (st && !(t[0] === "z" && selected && !shift && !FOODS.includes(selected))) {
      foot = footOf(st.c, st.x, st.y); t = [st.c, t[1]];
    }
  }
  const [c, g] = t, flower = c === "f", ent = entityAt(p);
  const res = intent0(p, shift, t, c, g, flower, ent, s);
  if (res && foot && !res.foot && !res.walk && !res.here) res.foot = foot;
  return res;
}
const CAN_SIZE = 12;
function intent0(p, shift, t, c, g, flower, ent, s) {
  const placing = selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed");
  const hasBlock = !GROUND.has(c) && !(flower && placing);   // building over a flower picks it
  const isMe = p.x === s.x && p.y === s.y;
  if (ent) {
    const who = ent.e.name || ent.e.kind, w = inHand(), weapon = w && WEAPON_DMG[w] ? w : null;
    if (ANIMALS[ent.e.kind] && selected && FEEDS.includes(selected) && !shift)
      return {ent, text: `Feed ${label(selected)} to the ${ent.e.kind}`, near: USE_R, diag: true, run: () => act("feed", {target: ent.e.id, item: selected})};
    if (ent.e.kind === "agent" && selected && !weapon && !shift)
      return {ent, text: `Give ${label(selected)} to ${ent.e.name}`, near: 2, run: (d) => act("give", {target: ent.e.id, item: selected, n: 1})};
    if (shift) {                                       // shift: the peaceful thing
      if (ent.e.kind === "cow") return {ent, text: "Milk cow", near: USE_R, diag: true, run: () => act("milk", {target: ent.e.id})};
      if (ent.e.kind === "agent") return {ent, text: `${ent.e.name} · select an item and click to give it`, info: true};
      return {ent, text: {chicken: "Chicken: feed it (select food) for eggs", chick: "A chick: it grows into a chicken", calf: "A calf: it grows into a cow",
        tusker: "A tusker: it charges in a straight line, step aside", pincer: "A pincer: it snaps if you stand next to it",
        strawman: "A strawman: it walks at night, and fears firelight", wisp: "A wisp: a light that leads you on at night",
        wyrm: "A wyrm: it lunges along its line, stay out of it",
        mossback: "Old Mossback: back off when it rises, step aside when its head pulls in, hit the neck", sporeling: "A sporeling: one hit"}[ent.e.kind] || who, info: true};
    }
    const tail = ent.e.kind === "cow" ? " · shift: milk" : ent.e.kind === "agent" ? " · shift: talk" : "";
    return {ent, text: weapon ? `Attack ${who} with ${label(weapon)}${tail}` : `Punch ${who}${tail}`, near: reachOf(weapon), diag: true, attack: true,
      run: () => act("attack", weapon ? {target: ent.e.id, with: weapon} : {target: ent.e.id})};
  }
  // your own tile: something growing under your feet (a flower, a mushroom, a crop) is picked; otherwise pick up items
  const underfoot = isMe && hasBlock && !SOLID.has(c);
  if (isMe && !underfoot && !(selected && !shift && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed")))
    return {text: "Pick up", run: () => act("pick_up", {}), here: true};
  // placing the selected item
  if (selected && !shift) {
    const it = selected, block = PLACEABLE_BLOCK[it];
    if ((block || FILLS[it] || it === "seed") && rimAt(p.x, p.y)) return {text: "Nothing stays on the edge of a hill", ghost: it, ok: false};
    // containers first: clicking a chest, basket or trough with anything selected puts it in
    if (c === "e" && it !== "torch") return FEEDS.includes(it) ? {text: `Put ${label(it)} in the trough`, near: 1, run: (d) => act("store", {dir: d, item: it, n: meObs.self.inventory[it] || 1})}
                                                     : {text: "Troughs take hay, grain or greens (not eggs, meat or milk)", ok: false};
    if ((c === "C" || c === "q") && it !== "torch") return {text: `Store ${label(it)} in ${c === "q" ? "basket" : "chest"}`, near: 1, run: (d) => act("store", {dir: d, item: it, n: meObs.self.inventory[it] || 1})};
    const free = !hasBlock && WALKABLE_GROUND.has(g);
    if (FOOT[block]) {
      const f = footprint(block, p.x, p.y, s.x, s.y);
      const bad = f.tiles.filter((q) => { const tq = tile(q.x, q.y);
        return !tq || !(GROUND.has(tq[0]) || tq[0] === "f") || !WALKABLE_GROUND.has(tq[1]) || tq[1] === ":"
          || (q.x === s.x && q.y === s.y) || (SOLID.has(block) && entityAt(q)) || rimAt(q.x, q.y) || floorAt(q.x, q.y) !== floorAt(p.x, p.y); });
      const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({x: p.x + dx, y: p.y + dy}))
        .filter((q) => !f.tiles.some((r) => r.x === q.x && r.y === q.y));
      return {text: bad.length ? (bad.some((q) => q.x === s.x && q.y === s.y) ? `Step out of the way to place the ${label(it)}` : bad.some((q) => entityAt(q)) ? "Wait, something is standing there" : `The ${label(it)} needs a clear ${FOOT[block].join("×")} spot of dry land`) : `Place ${label(it)}`,
        ghost: it, ok: !bad.length, bad, foot: f.tiles, anchor: {x: f.ax, y: f.ay}, from: near, near: 1, run: (d) => act("place", {dir: d, item: it})};
    }
    if (block === "V") return !hasBlock && wet(g) ? {text: "Launch boat", ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})}
                                                     : {text: "Boats go on shallow water", ghost: it, ok: false};
    if (block) return free ? {text: `Place ${label(it === "hay" ? "hay_bale" : it)}`, ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})}
                           : {text: `Can't place ${label(it)} here`, ghost: it, ok: false};
    if (it === "seed") {
      if (!hasBlock && (g === "o" || g === "u")) return {text: "Plant seed", ghost: it, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})};
      return {text: "Seeds grow in tilled soil: till it with a hoe first", ghost: it, ok: false};
    }
    if (FILLS[it]) {
      const res = !hasBlock && FILLS[it][g];
      return res ? {text: FILL_TEXT[res], ghost: it, ghostGround: res, ok: true, near: 1, run: (d) => act("place", {dir: d, item: it})}
                 : {text: FILL_HELP[it], ghost: it, ghostGround: Object.values(FILLS[it])[0], ok: false};
    }
    if (it === "torch") {
      const burnable = (!GROUND.has(c) && "TFbH#+&?!\";wCBhLrgWVXJmqeyUv".includes(c)) || (GROUND.has(c) && g === ".");
      return burnable ? {text: "Set on fire (uses the torch)", ok: true, near: 1, run: (d) => act("ignite", {dir: d, with: "torch"})}
                      : {text: "That won't burn", ok: false};
    }
    if (it === "hoe" && !hasBlock && (g === "." || g === ","))                  // the hoe in hand: Space/click tills
      return {text: "Till soil", near: 1, run: (d) => act("dig", {dir: d, with: "hoe"})};
    if (it === "watering_can" && (c === "Y" || (wet(g) && GROUND.has(c))))
      return {text: `Fill the watering can (${meObs ? meObs.self.can ?? CAN_SIZE : "?"}/${CAN_SIZE})`, near: 1, run: (d) => act("water", {dir: d, with: "watering_can"})};
    if (it === "watering_can" && (c === ";" || c === '"') && meObs && meObs.self.can === 0) return {text: "The can is empty: fill it at a well or water", ok: false};
    if (it === "watering_can" && (c === ";" || c === '"')) return g === "u" ? {text: "Already watered", ok: false}
      : {text: "Water crop (grows 2x faster)", near: 1, run: (d) => act("water", {dir: d, with: "watering_can"})};
  }
  const sailing = !!(meObs && meObs.self.sailing);
  if (c === "V" && !shift && !sailing) return {text: "Board the boat", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
  if (sailing && !hasBlock && wet(g)) return {text: "Sail here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
  if (!hasBlock && wet(g) && selected === "pickaxe" && !shift && g !== ")") return {text: "Dig the bottom deeper", near: 1, run: (d) => act("dig", {dir: d, with: "pickaxe"})};
  if (!sailing && !hasBlock && wet(g) && !placingItem()) return {text: "Swim here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
  if (sailing && !hasBlock && WALKABLE_GROUND.has(g)) return {text: "Go ashore", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
  if (hasBlock) {
    if ((c === "C" || c === "q") && !shift) return {text: c === "q" ? "Open basket" : "Open chest", near: 1, run: (d) => act("take", {dir: d})};
    if (c === "e" && !shift) return {text: troughAt.has(p.x + "," + p.y) ? "Trough: animals within 5 tiles feed themselves · click to take out" : "Empty trough: select hay or food and click to fill it",
      near: 1, run: (d) => act("take", {dir: d})};
    if (c === "Y" && !shift) return {text: "Well (fills watering cans) · shift-click takes it down", info: true};
    if (c === "J" && !shift) return {text: "Chicken coop: hens nearby lay here, twice as often · shift: take down", info: true};
    if (c === "m" && !shift) return {text: "Picnic blanket: food eaten here fills you 50% more · shift: roll up", info: true};
    if ((c === "?" || c === "!") && !shift) return {text: "Read", near: 1, run: (d) => act("read_sign", {dir: d})};
    if (c === "X" && !shift) return {text: mailAt.has(p.x + "," + p.y) ? "Mailbox: there's mail!" : "Mailbox", near: 1, run: () => openMailPanel(actTarget)};
    if (c === "B" && !shift) return {text: "Sleep (wake up here after dying)", near: 1, run: (d) => act("sleep", {dir: d})};
    if ((c === "&" || c === "^") && !shift) return {text: c === "&" ? "Workbench: craft tools here" : "Campfire: cook here", near: 2, run: () => openCraft()};
    const crop = cropSpecies(p.x, p.y);
    const text = c === "w" ? `Harvest ${crop}` : c === '"' ? `Young ${crop} (uproot)` : c === ";" ? `${crop} sprout (uproot)` : HARVEST[c] || label(CH[c]);
    const tool = TOOL_FOR[c], w = inHand();
    if (c === "*" && w !== "pickaxe")
      return {text: meObs && meObs.self.inventory.pickaxe ? "Ore: hold your pickaxe (select it) to mine it" : "Ore: you need a pickaxe to mine it", ok: false};
    const how = tool ? (w === tool ? ` with ${tool}` : " by hand (slow)") : "";
    return {text: text + how, near: 1, run: (d) => act("dig", w ? {dir: d, with: w} : {dir: d})};
  }
  if (wet(g)) return {text: label(CH[g]), info: true};
  if (shift) {
    const takeUp = {_: "Take up the path", n: "Take up the floor", ":": "Take up the bridge"}[g];
    if (takeUp) return {text: takeUp, near: 1, run: (d) => act("dig", {dir: d})};
    if (g !== "." && g !== ",") return {text: label(CH[g]), info: true};
    return inHand() === "hoe" ? {text: "Till soil", near: 1, run: (d) => act("dig", {dir: d, with: "hoe"})}
                              : {text: "Tilling needs a hoe in hand", ok: false};
  }
  return {text: "Walk here", walk: true, run: () => act("move_to", {x: p.x, y: p.y})};
}
// walk next to the target (closest free side) if needed, then act facing it
// Do it, right here: no walking to the target (getting close is up to you). Tile actions reach USE_R tiles, fights
// the weapon's reach. The exact tile goes to the server, so it also works while you are walking or running.
const USE_R = 2;   // tiles.py USE_R
const SWING_MS = 420;
let lastSwing = 0;
// What you can reach: a circle round you, as the crow flies (r tiles, and the half tile to the far tile's edge), and
// height is distance too, a layer half a tile: up a cliff or down one is out of reach, however near on the map (the
// server's rule: sim/movement.py near). z: the height of what is there (someone's own; a tile's: its ground nearest
// your own height); flat: height left out.
const LAYER = .5;
function reaches(x, y, r, z, flat) {
  const s = myPos(); if (!s) return false;
  const h = myZ(s.x, s.y), dz = flat ? 0 : ((z === undefined ? settleNear(x, y, h) : z) - h) * LAYER;
  return (x - s.x) ** 2 + (y - s.y) ** 2 + dz * dz <= (r + .5) ** 2;
}
const standsAt = (o) => (o.e && o.e.z !== undefined ? o.e.z : floorAt(o.tx, o.ty));   // someone's height: a person's own; a creature's, the lowest ground under it
function inReach(p, it, flat = it.flat) {                       // (it.flat: a wall you dig into is at your own height, whatever is on top of it)
  const s = myPos(); if (!s) return false;
  const tiles = it.foot && !it.from ? it.foot : [p];            // a structure: any of its tiles will do
  const reach = it.attack ? it.near : USE_R, z = it.ent ? standsAt(it.ent) : undefined;
  return tiles.some((q) => reaches(q.x, q.y, reach, z, flat))
    && !(it.foot && it.from && it.foot.some((q) => q.x === s.x && q.y === s.y));   // not standing in a new structure's spot
}
const TOO_HIGH = "Out of reach: too high up, or too far down.";
async function perform(p, it) {
  if (!it || it.info || !it.run || (eating() && !it.walk)) return;   // (eating: no punch, no digging: agent.js)
  if (it.ok === false) return toast(it.text, true);
  if (it.walk || it.here) return it.run();
  if (!inReach(p, it)) return toast(inReach(p, it, true) ? TOO_HIGH : "Too far: get closer.", true);
  if (it.attack) {                                  // one swing per cooldown (sim ATTACK_COOLDOWN): no queued swings
    const now = performance.now(), me_ = ents.get("agent" + myId);
    if (now - lastSwing < SWING_MS) return;
    lastSwing = now; if (me_) me_.swing = {t0: now, with: inHand()};   // swing at once, the hit follows
  }
  if (it.foot && !it.from) {                       // a structure: aim at its nearest tile
    const s = myPos();
    p = it.foot.slice().sort((a, b) => Math.max(Math.abs(a.x - s.x), Math.abs(a.y - s.y)) - Math.max(Math.abs(b.x - s.x), Math.abs(b.y - s.y)))[0];
  }
  actTarget = p;
  return it.run(dirTo(p));
}
function clickTile(p, shift) {
  p = aimAt(p, shift);
  perform(p, intent(p, shift));
}
