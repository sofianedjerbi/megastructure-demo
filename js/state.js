// Canvas, camera and shared client state; the spectator socket; tick and event handling.

// =====================================================================================
//  Networking
// =====================================================================================
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
// The canvas is drawn with at most DPR_MAX device px a CSS px: pixel art gains nothing past 2, and a 3x phone
// screen is nine times the paint of a plain one. A machine that still can't keep up (slowFrame, below) draws at 1.
let DPR = 1, W = 0, H = 0, DPR_MAX = 2, frameMs = 16, paceFrom = 0;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, DPR_MAX); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + "px"; cv.style.height = H + "px";
}
addEventListener("resize", resize); resize();
// Called each frame with its length: when frames have been long for a good while on a dense screen, draw at 1 px a
// CSS px from then on (a quarter of the paint; the art is as sharp, only the lettering loses a little)
function slowFrame(dt, settled) {
  const now = performance.now();
  if (!settled || document.hidden || DPR <= 1) { paceFrom = now; return; }   // (loading, in the background: says nothing)
  frameMs += (Math.min(dt, .1) * 1000 - frameMs) * .02;
  if (frameMs < 30) paceFrom = now;
  else if (now - paceFrom > 4000) { DPR_MAX = 1; frameMs = 16; resize(); }
}
let zoom = 3;
const TS = () => P * zoom;
// Screen position of world tile (0, 0). The screen centre and the camera are rounded separately, so whatever sits at
// the camera (you) lands on the same pixel every frame; rounding them together made you wobble 1 px against the
// scrolling ground at odd window sizes, which read as stutter when sprinting.
function screenOrigin(S = TS()) {
  return [Math.round(W / 2 - S / 2) - Math.round(cam.x * S), Math.round(H / 2 - S / 2) - Math.round(cam.y * S)];
}
let cam = {x: 0, y: 0}, camT = {x: 0, y: 0};
let follow = null, me = null, myId = null, meObs = null, agents = [], metrics = {}, recipes = {}, clock = {night: false, phase: .3};
let selected = null, progress = null, foodValue = {};   // foodValue: food points each food gives (from the server)
// Health and food: how much is full, and the food it takes to sprint. The server says so when it greets (20, 20 and 6:
// half hearts and half pieces, as the sandbox classic has them); one from before that says nothing: 0 to 100.
let HP_MAX = 100, FOOD_MAX = 100, SPRINT_FOOD = -1, SWIM_SPRINT = false, SWIM_PACE = 1, EAT_PACE = 1;      // (SWIM_SPRINT: this server sprints in the water too; SWIM_PACE, EAT_PACE: how many times longer a tile takes there, and while eating)
const hearts = (hp) => Math.round(hp / (HP_MAX / 10) * 10) / 10;      // a blow on someone is said in hearts: "-1.5"
const ents = new Map();
let bubbles = [], floats = [];
const requested = new Map();
const wsBase = (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
// the demo build has no server: the game runs in the page (local.js) behind the same socket interface
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
    if (d.type === "hello") {                     // back after the server restarted with newer code: this page is stale (it would draw the new world wrong)
      if (webStamp && d.web && d.web !== webStamp) location.reload();
      webStamp = d.web || webStamp;
      if (d.hp_max) { HP_MAX = d.hp_max; FOOD_MAX = d.food_max; SPRINT_FOOD = d.sprint_food; }
      SWIM_SPRINT = !!d.swim_sprint; SWIM_PACE = d.swim_pace || 1; EAT_PACE = d.eat_pace || 1;
    } else if (d.type === "tick") onTick(d);
    else if (d.type === "event") onEvent(d.ev);
    else if (d.type === "resync") { for (const b of blocks.values()) b.at = -1e9; }   // we missed events (too many at once): ask for our land again
    else if (d.type === "reply") {
      if (d.rows) onRegion(d);
      else if (d.agents) { agents = d.agents; drawAgents(); if (document.body.classList.contains("tab")) drawWho(); }
      else if (d.recipes) { recipes = d.recipes; foodValue = d.food || {}; drawRecipes(); }
      else if (d.tick_ms_p50 !== undefined) { metrics = d; drawStats(); }
    }
  };
  spec.onclose = () => setTimeout(connectSpec, 1000);
}
const sendSpec = (o) => spec && spec.readyState === 1 && spec.send(JSON.stringify({...o, id: ++sid}));
function viewRect(margin) {
  const w = Math.ceil(W / TS()) + margin * 2, h = Math.ceil(H / TS()) + margin * 2;
  return [Math.floor(cam.x - w / 2), Math.floor(cam.y - h / 2), w, h];
}
setInterval(() => {
  if (!spec || spec.readyState !== 1) return;
  const [x, y, w, h0] = viewRect(6), h = h0 + 6;   // (+6 rows south: high ground there is drawn up into view, with what's on it)
  const key = [Math.round(x / 4), Math.round(y / 4), w, h].join();
  if (key !== lastWatch) { lastWatch = key; sendSpec({op: "watch", x, y, w, h}); }
  const now = performance.now();
  for (let by = Math.floor(y / B); by <= Math.floor((y + h) / B); by++)
    for (let bx = Math.floor(x / B); bx <= Math.floor((x + w) / B); bx++) {
      const k = bkey(bx, by), b = blocks.get(k);
      const stale = b && now - b.at > 30000;
      if ((!b || stale) && !(requested.get(k) > now - 3000)) { requested.set(k, now); if (b) b.at = now; sendSpec({op: "region", x: bx * B, y: by * B, w: B, h: B}); }
    }
  // land left well behind is forgotten, with its pictures (it comes again if you go back): a long walk kept it all
  const bx0 = Math.floor(x / B) - 1, bx1 = Math.floor((x + w) / B) + 1, by0 = Math.floor(y / B) - 1, by1 = Math.floor((y + h) / B) + 1;
  for (const [k, b] of blocks) if (b.bx < bx0 || b.bx > bx1 || b.by < by0 || b.by > by1) blocks.delete(k);
}, 100);
setInterval(() => { sendSpec({op: "agents"}); sendSpec({op: "metrics"}); }, 1500);

let pred = null;             // {x, y, until}: the tile you stopped on, until the server is there too (walk.js)
const recentlyGone = new Map();   // entities that just left the view (a death event may arrive after the tick)
let groundItems = [], mailAt = new Set(), fireAt = [], troughAt = new Set();
function onTick(d) {
  clock = d;
  groundItems = d.items || [];
  mailAt = new Set((d.mail || []).map(([x, y]) => x + "," + y));
  troughAt = new Set((d.troughs || []).map(([x, y]) => x + "," + y));
  fireAt = (d.fires || []).map(([x, y]) => ({x, y}));
  $("clock").textContent = d.time.replace("(night)", "· night");
  if (document.body.classList.contains("tab")) whoTick();      // (who.js: the hour, on what Tab shows)
  const seen = new Set(), now = performance.now();
  for (const e of d.entities) {
    const key = e.kind + e.id; seen.add(key);
    let p = ents.get(key);
    if (!p) { p = {x: e.x, y: e.y, tx: e.x, ty: e.y, fx: 0, fy: 1, moved: 0}; ents.set(key, p); }
    p.e = e;
    if (e.kind === "agent" && e.id === myId && myTick(p, e, now)) continue;   // (your own walk is yours: walk.js)
    if (p.tx !== e.x || p.ty !== e.y) {
      const dx = Math.sign(e.x - p.tx), dy = Math.sign(e.y - p.ty);
      // animal sheets only walk sideways: going up or down they keep facing the way they last went
      if (ANIMALS[e.kind]) { if (dx) p.fx = dx; } else if (dx || dy) { p.fx = dx; p.fy = dy; }
      p.moved = now; p.tx = e.x; p.ty = e.y;
      if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > 4) { p.x = e.x; p.y = e.y; }
    }
  }
  for (const [k, p] of ents) if (!seen.has(k)) {
    if (k === "agent" + myId) { refresh(); continue; }       // you're never out of your own view: you just moved far (a level)
    recentlyGone.set(k, {p, t: now}); ents.delete(k);
  }
  for (const [k, g] of recentlyGone) if (now - g.t > 2000) recentlyGone.delete(k);
}
// The sound of a tile changing: what broke, what was placed, what was picked.
function tileSound(old, now, e) {
  if (old === now) return;
  const {x, y, cause} = e, oldBlock = !GROUND.has(old);
  if (cause === "pick") return sfx("rustle", x, y);
  if (cause === "dig") {
    if (old === "T" || old === "U") return;                                   // felling has its own creak and thud
    return sfx(oldBlock ? BREAK[material(old)] : "dig", x, y);
  }
  if (cause === "place") return sfxPlaced(e.block, e.ground, x, y);        // each kind of thing has its own sound
  if (cause === "burnt") return sfx("crackle", x, y);
  if (cause === "flood") return sfx("flood", x, y);
  if (cause === "grew") return sfx("grow", x, y, 5);                        // only what grows right beside you
}
function onEvent(e) {
  const t = performance.now() / 1000;
  if (e.type === "tile") {
    const g = CHAR[e.ground], blk = e.block === "none" ? g : CHAR[e.block], old = combAt(e.x, e.y);
    if (g && blk) setTile(e.x, e.y, blk, g, e.by, e.col === undefined ? null : e.col);
    if (old && blk) tileSound(old, blk, e);
    return;
  }
  if (e.type === "say" || e.type === "shout") { const em = emoteFor(e.text); if (em) setTimeout(() => emote(e.from, em), 2500); }
  if (e.type === "give") { emote(e.to, "love"); emote(e.from, "happy"); }
  if (e.type === "craft") emote(e.name, "star");
  if (e.type === "attack") emote(e.target, "bang");
  if (e.type === "death") emote(e.name, "skull");
  if (e.type === "say" || e.type === "shout") {
    bubbles.push({name: e.from, text: e.text, t, shout: e.type === "shout"});      // (drawn, piled and let go by bubbles.js)
  }
  if (e.type === "attack") {
    noteFight(e);
    const who = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === e.attacker);
    if (who && e.attacker !== me) who.swing = {t0: performance.now(), with: e.weapon !== "fists" ? e.weapon : null};
    const tgt = [...ents.values()].find((q) => q.e && (q.e.name === e.target || `${q.e.kind}#${q.e.id}` === e.target));
    const tx = tgt ? tgt.x : e.x, ty = tgt ? tgt.y : e.y;
    if (tgt) flashes.set(tgt.e.kind === "agent" ? "agent" + tgt.e.id : tgt.e.kind + tgt.e.id, performance.now());
    if (tgt && ANIMALS[tgt.e.kind]) {             // a hit animal: a startled "!" and a few feathers or tufts of its own colour
      emote(tgt.e.kind + tgt.e.id, "bang");
      const fw = ANIMALS[tgt.e.kind].fw;
      debris(tgt.x, tgt.y - .2, [animalSheet(tgt.e.kind, tgt.e.id), 0, 0, fw, fw], 6, {});
      sfx(tgt.e.kind === "chicken" || tgt.e.kind === "chick" ? "squawk" : animalVoice(tgt.e.kind), tx, ty);
    }
    if (WILD[String(e.attacker).slice(2)]) sfx("punch", e.x, e.y);
    burst(tx, ty, "hit", 6, {dy: -.4}); sfx("hit", tx, ty); if (e.target === me) sfx("hurt"); floats.push({x: tx, y: ty, text: "-" + (tgt && tgt.e.kind === "agent" ? hearts(e.damage) : e.damage), color: "#ff8a7a", t});
  }
  if (e.type === "fall") {                            // a fall that hurt: shown as they land (jump.js), or now if they are not seen falling
    const q = [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === e.name);
    if (q) { q.fallHurt = e.damage; setTimeout(() => fallHurts(q, performance.now(), e.name === me), 700); }   // (if nothing landed by then)
  }
  if (e.type === "death" && e.name === me) {
    sfx("die");
    showDeath(e);                                     // (death.js)
  }
  if (e.type === "creature_died" || e.type === "fade") {   // it flashes, lifts and fades away in a puff of smoke
    const key = e.kind + e.id, p = ents.get(key) || (recentlyGone.get(key) || {}).p;
    if (p && p.e) dyingPoof(p, performance.now()); else smoke(e.x, e.y, 8);
    if (e.drops) dropLoot(e.x, e.y, e.drops, performance.now());
    ents.delete(key);
    sfx("poof", e.x, e.y);
  }
  if (e.type === "death") { smoke(e.x, e.y, 10); sfx("poof", e.x, e.y); dropLoot(e.x, e.y, e.dropped, performance.now()); }
  const warn = e.type === "windup" && {tusker: "rustle", pincer: "click", strawman: "creak", wisp: "gloom", wyrm: "water", mossback: "boss_groan"}[e.kind];
  if (warn) sfx(warn, e.x, e.y);                       // a wild creature warns (the wisp's call is a sigh)
  if (e.type === "boss") bossEvent(e);                 // (boss.js)
  if (e.type === "wear") sfx("rustle", e.x, e.y);      // someone puts something on, or takes it off
  if (e.type === "enrage") { burst(e.x, e.y, "dust", 8, {up: 1.3, spread: 2.6, g: 3}); burst(e.x, e.y, "rage", 12, {up: 4.5, spread: 4.5, g: 9, life: .6, dy: -.3}); sfx("thud", e.x, e.y); flashes.set(e.kind + e.id, performance.now()); }   // a tusker that was hit stamps: it is angry now
  if (e.type === "bonk") { burst(e.x, e.y, "dust", 8, {up: 1, spread: 2, g: 3}); sfx("thud", e.x, e.y); }          // a tusker rams something
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
  if (e.type === "say" || e.type === "shout") babble(e.from, e.text, e.x, e.y, e.type === "shout");      // (babble.js: a run of syllables, yours too)
  if (e.type === "give" && e.to === me) sfx("give");
  if ((e.type === "join" || e.type === "leave") && e.name !== me) sfx(e.type);
  if (e.type === "sign") sfx("write", e.x, e.y);
  if (e.type === "mail" && e.to === me && e.from !== me) toast(`${e.from} left you a letter (mailbox at ${e.x}, ${e.y}).`);
  if (e.type === "mail_opened" && e.owner === me && e.by !== me) toast(`${e.by} opened your mailbox and took ${e.n} letter${e.n > 1 ? "s" : ""}!`, true);
  if (e.type === "board" || e.type === "moor") { burst(e.x, e.y, "water", 8, {up: 1.5, spread: 2}); sfx("water", e.x, e.y); }
  if (e.type === "hatch") { burst(e.x, e.y, "spark", 8, {dy: -.3, g: 4}); sfx("hatch", e.x, e.y); }
  if (e.type === "born") { burst(e.x, e.y, "food", 8, {dy: -.5, g: 3}); sfx("love", e.x, e.y); }
  if (e.type === "craft") { burst(e.x, e.y, "spark", 10, {dy: -.6, g: 4}); sfx("craft", e.x, e.y); }
  if (["xp", "pick_up", "drop", "chest", "milk", "love", "lay", "fill", "picnic", "trough"].includes(e.type)) return;
  if (e.type === "attack") return;                     // hits show on screen; the chat only tells of deaths
  let text;
  switch (e.type) {
    case "say": text = e.text; break;
    case "shout": text = e.text; break;
    case "death": text = `${e.name} died (${e.cause})`; break;
    case "give": if (e.from !== me && e.to !== me) return; text = `${e.from} gave ${e.to} ${fmt(e.items)}`; break;
    case "join": text = `${e.name} ${e.new ? "washed ashore" : "woke up"}`; break;
    case "leave": text = `${e.name} fell asleep`; break;
    case "named": text = `${e.by} named a ${e.kind} ${e.name}`; break;

    default: return;
  }
  chatLine(text, e.type === "say" ? "" : e.type === "shout" ? "shout" : e.type === "death" ? "bad" : "sys",
    e.type === "say" || e.type === "shout" ? e.from : null);
}
