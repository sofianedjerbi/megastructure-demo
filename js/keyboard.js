// Keyboard: the whole game is playable without a mouse.
//   WASD / arrows walk (Shift sprints), Alt+direction turns on the spot, Space does the main action on the tile
//   you face and X the alternative one (milk, take down, till). 1-9 / Q pick what's in your hand, 0 empties it.
//   C crafting and I inventory are navigated with the arrows, Enter uses, Esc closes. 1-9 and 0: the ten slots of
//   your bar (an empty one: empty hands), ` empty hands.
//   While the recipe book is open the keys are its own (craft.js): none of them acts on the world behind it (X took
//   down what you faced, a number changed what you hold), but for the ones in BOOK_KEYS. One of the book and the
//   inventory is open at a time. What a key does there is written on it (a cap on the button, `kbd`) while you
//   play by keys (body.bykeys), and put away when the mouse moves.

const KEYDIR = {w: "N", arrowup: "N", s: "S", arrowdown: "S", a: "W", arrowleft: "W", d: "E", arrowright: "E"};
const CODEDIR = {KeyW: "N", ArrowUp: "N", KeyS: "S", ArrowDown: "S", KeyA: "W", ArrowLeft: "W", KeyD: "E", ArrowRight: "E"};
const keys = new Set();
let runKey = false;
const sprinting = () => runKey && !(meObs && meObs.self.hunger <= SPRINT_FOOD);   // (three pieces of food or fewer: no sprinting, as the server has it)
let inputMode = "mouse";     // "keys" once you play with the keyboard: hints then follow the tile you face

function facingTile() {
  const p = ents.get("agent" + myId), s = myPos(); if (!p || !s) return null;
  return {x: s.x + (p.fx || 0), y: s.y + (p.fy || (p.fx ? 0 : 1))};
}
// Things done in passing, without stopping: hits, picking flowers, mushrooms, berries, fruit and crops, small
// decorations (the server makes these instant: no tool and hardness <= 3, or picking), picking up items.
const INSTANT_DIG = "bFQf;\"w?!rmqyp";
function isQuick(f) {
  if (f.it.attack || f.it.here) return true;
  const c = combAt(f.p.x, f.p.y);
  return !placingItem() && !!c && INSTANT_DIG.includes(c);
}
const useful = (it) => it && !it.walk && !it.info && it.ok !== false;
// Who you're fighting: set when you hit someone or someone hits you, so Space keeps hitting them, not the tree beside.
let foe = null;   // {key: entity key, until: ms}
const FOE_MS = 8000;
function entKey(name) {               // an attack event names agents by name and creatures as "kind#id"
  const m = /^(\w+)#(\d+)$/.exec(name || "");
  if (m) return m[1] + m[2];
  const a = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === name);
  return a ? "agent" + a.e.id : null;
}
function noteFight(e) {
  if (e.attacker === me) foe = {key: entKey(e.target), until: performance.now() + FOE_MS};
  else if (e.target === me) foe = {key: entKey(e.attacker), until: performance.now() + FOE_MS};
}
// What Space (alt = false) or X (alt = true) does, without having to turn first. Fighting comes first: the one
// you're fighting, then any wild enemy within reach; then the tile you face; then other creatures within reach; then
// anything next to you, preferring the direction you last walked. Falls back to a hint about the faced tile.
// Holding something to place (a block, path, planks, dirt, seeds): Space puts it on the tile in front of you, and
// only there (the ghost shows it, green or red). Walk to aim: a tap turns you and moves you a tile.
const placingItem = () => selected && (PLACEABLE_BLOCK[selected] || FILLS[selected] || selected === "seed");
function facingIntent(alt) {
  const q = facingTile(), s = myPos(); if (!q || !s) return null;
  if (!alt && placingItem()) {
    if (entityAt(q)) return {p: q, it: {text: `Can't place the ${label(selected)}: something is in the way`, ok: false, ghost: selected}};
    const it = intent(q, false);
    return it ? {p: q, it: it.ok === false || inReach(q, it) ? it : {...it, ok: false, text: TOO_HIGH}} : null;
  }
  const reach = reachOf(inHand()), dist = (o) => Math.abs(o.tx - s.x) + Math.abs(o.ty - s.y);
  const near = alt ? [] : [...ents.values()]                // (within reach: a circle, height counted: intent.js reaches)
    .filter((o) => o.e && !(o.e.kind === "agent" && o.e.id === myId) && reaches(o.tx, o.ty, reach, standsAt(o)))
    .sort((a, b) => dist(a) - dist(b));
  const hit = (o) => { const p = {x: o.tx, y: o.ty}, it = intent(p, false); return useful(it) && it.attack ? {p, it} : null; };
  if (foe && performance.now() < foe.until) {
    const o = ents.get(foe.key), r = o && near.includes(o) && hit(o);
    if (r) return r;
  }
  for (const o of near) if (WILD[o.e.kind] && o.e.kind !== "wisp") { const r = hit(o); if (r) return r; }
  const here = {x: s.x, y: s.y}, under = combAt(s.x, s.y);           // something growing under your feet
  if (!alt && under && !GROUND.has(under) && !SOLID.has(under)) { const it = intent(here, false); if (useful(it)) return {p: here, it}; }
  const faced = intent(q, alt);
  if (useful(faced) && inReach(q, faced)) return {p: q, it: faced};
  // a pickaxe in hand, facing higher ground with nothing on it: cut into it (it comes down a layer)
  if (inHand() === "pickaxe" && solidAt(q.x, q.y, myZ(s.x, s.y) + 1) && GROUND.has(combAt(q.x, q.y)))
    return {p: q, it: {text: "Dig into the hill", flat: true, run: () => act("dig", {dir: dirTo(q), with: "pickaxe"})}};
  // X with a pickaxe and nothing else to use it on: dig down where you stand
  if (alt && inHand() === "pickaxe" && under && GROUND.has(under) && !":n".includes(under))
    return {p: here, it: {text: "Dig down", here: true, run: () => act("dig_down", {with: "pickaxe"})}};
  for (const o of near) { const p = {x: o.tx, y: o.ty}, it = intent(p, false); if (useful(it) && inReach(p, it)) return {p, it}; }
  // then anything within reach (USE_R): nearest first, in front of you before behind
  const p0 = ents.get("agent" + myId), ring = [];
  for (let dy = -USE_R; dy <= USE_R; dy++) for (let dx = -USE_R; dx <= USE_R; dx++) {
    if ((!dx && !dy) || !reaches(s.x + dx, s.y + dy, USE_R)) continue;
    ring.push({x: s.x + dx, y: s.y + dy, d: Math.max(Math.abs(dx), Math.abs(dy)) + Math.abs(dx) * .01 + Math.abs(dy) * .01 - (dx * p0.fx + dy * p0.fy) * .1});
  }
  ring.sort((a, b) => a.d - b.d);
  for (const q of ring) { const p = {x: q.x, y: q.y}, it = intent(p, alt); if (useful(it)) return {p, it}; }
  return faced && !faced.walk ? {p: q, it: useful(faced) ? {...faced, ok: false, text: TOO_HIGH} : faced} : null;   // (in front of you, but up a cliff or down one)
}
// The tile hints are drawn for: where the mouse points, or the tile you face when playing by keyboard.
function aimedTile() {
  if (!me) return null;
  if (inputMode === "keys") return facingIntent(false);
  if (!mouse.in) return null;
  const p = aimAt(tileAtScreen(mouse.x, mouse.y), keys.has("shift"));
  return {p, it: intent(p, keys.has("shift"))};
}
// Bottom right: what you can do right now, each with its key. Rebuilt every frame, written only when it changes.
let actionsHtml = "";
function availableActions() {
  if (!me || !meObs) return [];
  const s = myPos(), rows = [];
  const main = facingIntent(false), alt = facingIntent(true);
  if (main && !main.it.info && main.it.ok !== false) rows.push(["Space", main.it.text]);
  else if (main && placingItem()) rows.push(["Space", main.it.text, "bad"]);           // why it can't go there
  if (alt && !alt.it.info && alt.it.ok !== false && (!main || alt.it.text !== main.it.text)) rows.push(["X", alt.it.text]);
  if (selected && FOODS.includes(selected)) rows.push(["E", `Eat ${label(selected)}`]);
  if (selected && WEAR[selected]) rows.push(["E", `Wear ${label(selected)}`]);
  if (s && groundItems.some(([x, y]) => x === s.x && y === s.y)) rows.push(["F", "Pick up"]);
  return rows;   // only what you can do right here, right now (all the other keys are in the help, H)
}
function updateActions() {
  const html = availableActions().map(([k, t, cls]) => `<div class="${cls || ""}"><span class="key">${esc(k)}</span>${esc(t)}</div>`).join("");
  if (html === actionsHtml) return;
  actionsHtml = html;
  const el = $("actions"); el.innerHTML = html; el.style.display = html ? "block" : "none";
}
function useFacing(alt) {
  const f = facingIntent(alt);
  if (!f || f.it.info) return toast(f ? f.it.text : "Nothing within reach.", !f);
  if (f.it.ok === false) return toast(f.it.text, true);
  if (walking && !isQuick(f)) return;             // Space never stops you: work that takes time waits until you stand
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
function cycleHand(step) {                       // Q: the next item of the hotbar in hand (then empty hands)
  if (!meObs) return;
  const order = slotOrder(meObs.self.inventory).slice(0, BAR), have = order.filter(Boolean);
  if (!have.length) return;
  const i = have.indexOf(selected), j = i + step;
  selectItem(j < 0 ? have[have.length - 1] : j >= have.length ? null : have[j]);
  toast(selected ? `In hand: ${label(selected)}` : "Empty hands");
}
const BOOK_KEYS = new Set(["c", "i", "m", "h", "?", "g", "f3", "t", "/", "+", "=", "-"]);   // what still does its usual thing with the recipe book open
let capAt = null;
addEventListener("mousemove", (e) => {
  if (capAt && Math.abs(e.clientX - capAt.x) + Math.abs(e.clientY - capAt.y) > 4) document.body.classList.remove("bykeys");
  capAt = {x: e.clientX, y: e.clientY};
});
function closePanels() {
  for (const id of ["bag", "mail", "craft"]) $(id).style.display = "none";
  drawGoals();
}
function zoomBy(d) { zoom = Math.max(1, Math.min(6, zoom + d)); }

const SHORTCUTS = {        // key -> what it does (when no panel takes the key)
  " ": () => useFacing(false),
  x: () => useFacing(true),
  f: () => act("pick_up", {}),
  e: () => useSelected(),
  q: () => cycleHand(1),
  "`": () => { selectItem(null); toast("Empty hands"); },
  c: () => { $("bag").style.display = "none"; toggleCraft(); },
  i: () => { if (isOpen("craft")) toggleCraft(); toggleBag(); },
  m: () => { setMuted(!muted); toast(muted ? "Sound off (M)" : "Sound on (M)"); },
  h: () => $("helpbtn").click(), "?": () => $("helpbtn").click(),
  g: () => toggleGoals(),                            // (goals.js: the goals' card, or away again)
  f3: () => { const d = $("debug"); d.style.display = d.style.display === "block" ? "none" : "block"; },
  t: () => openChat(),
  enter: () => openChat(),
  "/": () => openChat("/"),
  "+": () => zoomBy(1), "=": () => zoomBy(1), "-": () => zoomBy(-1),
};

addEventListener("keydown", (e) => {
  if (document.activeElement === $("name")) { if (e.key === "Enter") $("join").click(); return; }
  if (document.activeElement === $("say") || document.activeElement === $("letter") || !me) return;
  const k = e.key.toLowerCase();
  if (k === "shift") { keys.add("shift"); runKey = true; syncWalk(); return; }
  inputMode = "keys"; document.body.classList.add("bykeys");
  if (k === "escape") { if (isOpen("bag") && bagKey(k, e)) return; if (isOpen("craft") || isOpen("bag") || isOpen("mail")) closePanels(); else selectItem(null); return; }
  // an open panel takes the arrows, Enter and Space
  if (isOpen("craft") && (craftKey(k, e) || !BOOK_KEYS.has(k))) { e.preventDefault(); return; }
  if (isOpen("bag") && (bagKey(k, e) || !BOOK_KEYS.has(k))) { e.preventDefault(); return; }      // (the inventory's keys are its own too: bag.js)
  if (e.altKey && CODEDIR[e.code]) { e.preventDefault(); turn(CODEDIR[e.code]); return; }
  if (KEYDIR[k]) {   // only a real press counts: a held key's auto-repeat must not cancel a chop in progress
    e.preventDefault();
    if (!e.repeat) { keys.delete(k); keys.add(k); syncWalk(); }
    return;
  }
  if (/^[0-9]$/.test(k) && meObs) {                 // a slot of your bar (0: the tenth); an empty one, or the one in hand again: empty hands
    const n = slots[(+k + 9) % 10]; selectItem(n && selected !== n ? n : null); if (!selected) toast("Empty hands"); return;
  }
  if (k === "tab") { e.preventDefault(); if (!e.repeat) { drawWho(); document.body.classList.add("tab"); } return; }   // held: the day, you, who is awake (style.css)
  const fn = SHORTCUTS[k];
  if (fn) { e.preventDefault(); if (!(e.repeat && k !== " " && k !== "x")) fn(); }
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  keys.delete(k);
  if (k === "shift") { keys.delete("shift"); runKey = false; }
  if (k === "tab") document.body.classList.remove("tab");
  syncWalk();
});
addEventListener("blur", () => { runKey = false; keys.clear(); document.body.classList.remove("tab"); syncWalk(); });
$("goalhide").onclick = $("goalhint").onclick = () => toggleGoals();
$("goals").onclick = (e) => { if (me && !e.target.closest(".gf")) { drawWho(); document.body.classList.toggle("tab"); } };   // (a phone has no Tab: a tap on the goals; who.js)
