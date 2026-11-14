// Experience orbs, items drawn in by the magnet, and the experience bar.
// Orbs burst out of what was felled, mined, crafted or hunted, hop on the ground a moment, then home in on whoever
// earned them with a rising blip each; the bar fills as they arrive. Loot next to you slides up into your hands.

const orbs = [], magnets = [];
let xpKnown = null, xpLevelShown = null;   // your experience as last heard; the bar leaves out orbs still flying

// the level curve of sim/progress.py: level 0 needs 7, then 3 more for each level
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
  groundItems = groundItems.filter(([x, y]) => x !== e.x || y !== e.y);   // (off the ground now: not there and flying)
  Object.keys(e.items || {}).slice(0, 3).forEach((name, i) =>
    magnets.push({x: e.x + .5 + (i - 1) * .2, y: e.y + .5, name, who: e.name, age: -i * .05, lift: liftAt(e.x, e.y)}));
}
const playerNamed = (name) => [...ents.values()].find((q) => q.e && q.e.kind === "agent" && q.e.name === name);

// Moves the orbs and the loot flying to people, and queues their drawing into the frame's depth-sorted list (`list`),
// so a tree in front still hides them.
function drawOrbs(sx, sy, S, dt, list) {
  const z = zoom;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i]; o.age += dt;
    if (o.age < 0) continue;
    const p = playerNamed(o.who);
    if (!p || o.age > 4) { orbs.splice(i, 1); continue; }
    if (o.age < o.homing) {                                  // the burst: out and up, a hop on the grass
      o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= .9; o.vy *= .9;
      o.vh -= 22 * dt; o.h = Math.max(0, o.h + o.vh * dt);
      if (o.h === 0) o.vh = Math.abs(o.vh) * .4;
    } else {                                                 // then home in, faster and faster
      const tx = p.x + .5, ty = p.y + .35 - UP, dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
      const sp = Math.min(14, 3 + (o.age - o.homing) * 18);
      if (d < .25) { orbs.splice(i, 1); orbLanded(o); continue; }
      o.x += dx / d * Math.min(d, sp * dt); o.y += dy / d * Math.min(d, sp * dt); o.h *= .85;
      o.lift += (liftOf(p) - o.lift) * Math.min(1, dt * 12);   // (up or down to the height you're drawn at, smoothly)
    }
    const cx = Math.round(sx(o.x) / z) * z, cy = Math.round((sy(o.y) - o.lift - o.h * S * .5) / z) * z;
    const shape = o.big ? ORB_BIG : ORB, flick = Math.sin(o.age * 14 + o.seed) > 0;
    list.push({y: o.y - .45, x: o.x, fx: () => drawOrb(cx, cy, shape, flick)});
  }
  for (let i = magnets.length - 1; i >= 0; i--) {           // loot sliding up into someone's hands
    const m = magnets[i]; m.age += dt;
    if (m.age < 0) continue;
    const p = playerNamed(m.who);
    const k = Math.min(1, m.age / .28);
    if (!p || k >= 1) { magnets.splice(i, 1); if (p) sfx("collect", p.tx, p.ty); continue; }
    const e = k * k, x = m.x + (p.x + .5 - m.x) * e, y = m.y + (p.y + .3 - UP - m.y) * e - Math.sin(k * Math.PI) * .35;
    const sz = DROP * z, lift = m.lift + (liftOf(p) - m.lift) * e, a = k > .7 ? (1 - k) / .3 : 1;   // (as it lay, never smaller: it fades as it is caught)
    list.push({y: y - .45, x, fx: () => { ctx.globalAlpha = a; ctx.drawImage(ghostIcon(m.name), Math.round(sx(x) - sz / 2), Math.round(sy(y) - lift - sz / 2), sz, sz); ctx.globalAlpha = 1; }});
  }
}

// round pixel orbs: o outline, y body (it flickers), w the glint
const ORB = [".ooo.", "owyyo", "oyyyo", "oyyyo", ".ooo."];
const ORB_BIG = ["..ooo..", ".owwyo.", "owyyyyo", "oyyyyyo", "oyyyyyo", ".oyyyo.", "..ooo.."];
function drawOrb(cx, cy, shape, flick) {
  const z = zoom, n = shape.length, x0 = cx - Math.floor(n / 2) * z, y0 = cy - Math.floor(n / 2) * z;
  ctx.fillStyle = "rgba(220,255,140,.25)"; pixelOval(cx, cy, n / 2 + 2, n / 2 + 2, .5);   // its glow, on the orb's own pixels
  const col = {o: "#4f8a2a", y: flick ? "#b9e45a" : "#dcf27a", w: "#fffbd8"};
  shape.forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") { ctx.fillStyle = col[c]; ctx.fillRect(x0 + i * z, y0 + j * z, z, z); } }));
}
function orbLanded(o) {
  const p = playerNamed(o.who);
  if (p) { sfx("orb", p.tx, p.ty); burst(p.x, p.y, "spark", 2, {dy: -.4, g: 3}); }
}

// The bar under the hearts: the level in the middle, the fill trailing the orbs.
function drawXp() {
  if (!meObs) return;
  const flying = orbs.filter((o) => o.who === me).reduce((n, o) => n + o.value, 0);
  if (xpKnown === null || !flying) xpKnown = meObs.self.xp || 0;     // nothing in the air: the server's word
  const [level, into, need] = levelOf(Math.max(0, Math.floor(xpKnown - flying + 1e-6)));
  if (xpLevelShown !== null && level > xpLevelShown) {
    sfx("levelup");
    const p = ents.get("agent" + myId);
    if (p) { burst(p.x, p.y, "spark", 18, {dy: -.6, g: 2, spread: 1.4}); floats.push({x: p.tx, y: p.ty - .4, text: `Level ${level}!`, color: "#d8f070", t: performance.now() / 1000}); }
  }
  xpLevelShown = level;
  drawXpBar(into / need, level);
}

// The bar: the UI pack's wooden slider track with a green fill; the level sits on its middle in the game's font
// (#xplevel, only once you have one).
const TRACK = [36, 36, 40, 7], XP_K = 2;   // the track in sliders.png; CSS px an art pixel
function drawXpBar(k, level) {
  // as wide as the HUD: the bar's ten slots, or the hearts and the food where those are wider (a phone). Worked out,
  // not measured: measured, it kept the width of a bar that had since been made smaller to fit (hudFit, ui.js)
  const cv = $("xpbar"), dpr = window.devicePixelRatio || 1, thumbs = document.body.classList.contains("touch");
  const bar = Math.max((BAR * 32 - 2) * hudU, 198 * Math.max(1, Math.round(hudK * dpr)) / dpr + (thumbs ? 18 : 8));
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
