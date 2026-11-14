// Swimming: in shallow water without a boat (sim/movement.py). Every race and every outfit swims the same way, because
// the swimmer is the person's own sheet: head and shoulders above the water, the rest dimly seen under it.
// Around them: a ring of foam that breathes, a splash on alternate sides with each stroke, and a wake that spreads
// and fades along the way they came.
// A sprint in the water (Shift, as on land: twice as fast): the strokes come twice as often, each throws water up on
// both sides and behind, a wave of foam is pushed ahead, and the wake is another thing: marks twice as close, three
// flecks a side that spread nearly twice as wide and last longer, with a churned line of white down the middle.

const SWIM = {sink: 5, line: 27, stroke: 260, tread: 700, wakeEvery: 110, wakeLife: 1400, dashStroke: 130, dashEvery: 45, dashLife: 2100};   // art px; sheet row of the waterline; ms
function swimsAt(p, e) {
  if (e.sail) return false;
  const t = tile(Math.round(p.x), Math.round(p.y));
  return t ? wet(t[1]) && t[0] !== "V" : !!e.swim;
}
// The wake someone left: each mark two flecks of foam drifting apart and fading, in its own time. Drawn for a swimmer
// and for someone who has just come out (characters.js): the marks behind them were all gone at once at the shore.
function drawWake(p, now, sx, sy, z) {
  if (!p.wake || !p.wake.length) return;
  while (p.wake.length && now - p.wake[0].t > (p.wake[0].dash ? SWIM.dashLife : SWIM.wakeLife)) p.wake.shift();
  for (const w of p.wake) {
    const a = (now - w.t) / (w.dash ? SWIM.dashLife : SWIM.wakeLife), wx = Math.round(sx(w.x)) + 8 * z, wy = Math.round(sy(w.y, w.x)) + (13 - STAND) * z;
    const d = Math.round(w.dash ? 3 + a * 13 : 2 + a * 7) * z;
    ctx.globalAlpha = (1 - a) * .85;
    ctx.fillStyle = a < .35 ? "#ffffff" : "#d8f4ff";
    for (let k = 0; k < (w.dash ? 2 : 1); k++) {             // (a sprint's: a second, shorter fleck inside the first and a little behind it: two broken lines a side)
      const dk = d - k * 4 * z, len = (w.dash ? 4 - 2 * k : 2) * z, lag = k * 3 * z;
      if (dk < 2 * z) break;
      if (w.across) { ctx.fillRect(wx - dk - z, wy - w.fy * lag, z, len); ctx.fillRect(wx + dk, wy - w.fy * lag, z, len); }       // swimming up or down: foam to the left and right
      else { ctx.fillRect(wx - z - w.fx * lag, wy - dk, len, z); ctx.fillRect(wx - z - w.fx * lag, wy + dk, len, z); }             // sideways: above and below
    }
    if (a < .3) ctx.fillRect(wx, wy, z, z);                                                            // bubbles where they just were
    if (w.dash && a < .55) { ctx.fillStyle = "#ffffff"; const j = ((w.t / 45 | 0) % 3 - 1) * z; if (w.across) ctx.fillRect(wx + j - z, wy, 2 * z, 2 * z); else ctx.fillRect(wx - z, wy + j - z, 2 * z, 2 * z); }   // the churned line down the middle
  }
  ctx.globalAlpha = 1;
}
function drawSwimmer(p, e, sheet, x, y, z, now, sx, sy) {
  const moving = now - p.moved < 300 || Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > .05;
  const dash = SWIM_SPRINT && moving && (e.id === myId && e.kind === "agent" ? sprinting() : !!e.run);     // a sprint in the water
  const stroke = Math.floor((now + e.id * 97) / (dash ? SWIM.dashStroke : moving ? SWIM.stroke : SWIM.tread));
  const bob = (moving ? stroke % 2 : Math.round(Math.sin(now / 450 + e.id) * .5 + .5)) * z;      // one pixel, with each stroke
  p.running = dash;
  if (!p.swam) {                                             // going in: a splash
    p.swam = true; p.wake = p.wake || [];                   // (the marks of the last swim, if any are left, stay)
    burst(p.x, p.y + .3 - UP, "water", 10, {up: 2.6, spread: 3, g: 7, life: .5});
    sfx("water", Math.round(p.x), Math.round(p.y));          // one splash going in; after that only the strokes are heard
  }
  // the wake: a mark dropped every few steps of the way, each one two flecks of foam drifting apart and fading
  if (moving && (!p.wake.length || now - p.wake[p.wake.length - 1].t > (dash ? SWIM.dashEvery : SWIM.wakeEvery))) p.wake.push({x: p.x, y: p.y, t: now, across: !!p.fy, dash, fx: p.fx || 0, fy: p.fy || 0});
  drawWake(p, now, sx, sy, z);
  const deep = DEPTH_OF[gndAt(Math.round(p.x), Math.round(p.y))] || 1, shY = y + (15 + deep * 2) * z;   // their shadow on the bottom, further down the deeper it lies
  ctx.fillStyle = "rgba(24,40,72,.2)";
  ctx.fillRect(x + 3 * z, shY, 10 * z, 2 * z); ctx.fillRect(x + 5 * z, shY - z, 6 * z, 4 * z);
  if (moving && stroke !== p.lastStroke) {                   // a stroke: a splash beside them, a side each time
    const side = stroke % 2 ? .35 : -.35;
    burst(p.x + (p.fy ? side : -p.fx * .2), p.y + .35 - UP + (p.fx ? side * .4 : 0), "water", dash ? 5 : 3, {up: dash ? 2.2 : 1.4, spread: dash ? 2.4 : 1.6, g: 6, life: dash ? .45 : .35});
    if (dash) {                                              // a sprint: the other side too, and a tail of water thrown up behind
      burst(p.x + (p.fy ? -side : -p.fx * .2), p.y + .35 - UP + (p.fx ? -side * .4 : 0), "water", 3, {up: 1.8, spread: 2, g: 6, life: .4});
      burst(p.x - p.fx * .6, p.y - p.fy * .6 + .3 - UP, "water", 4, {up: 2.6, spread: 1.6, g: 7, life: .5});
    }
    if (stroke % 2) sfx("swim", Math.round(p.x), Math.round(p.y));      // a soft pull, every second stroke; treading water is silent
  }
  p.lastStroke = stroke;
  const row = DIR_ROW(p), col = Math.floor(now / (dash ? 70 : 140)) % 8, cellX = x - 16 * z, cellY = y - 18 * z + SWIM.sink * z + bob, wl = y + 14 * z;
  const back = [-p.fx, -p.fy], fi = row * 8 + col;
  wearFx("back", e, sheet, fi, cellX, cellY, z, now, moving, back);
  ctx.globalAlpha = .28;                                     // legs and feet, seen through the water
  ctx.drawImage(sheet, col * 48, row * 48 + SWIM.line, 48, 7, cellX, cellY + SWIM.line * z, 48 * z, 7 * z);
  ctx.globalAlpha = 1;
  ctx.drawImage(sheet, col * 48, row * 48, 48, SWIM.line, cellX, cellY, 48 * z, SWIM.line * z);          // head and shoulders
  wearFx("front", e, sheet, fi, cellX, cellY, z, now, moving, back);
  const wide = (7 + stroke % 2 + (dash ? 1 : 0)) * z, cx = x + 8 * z;         // the ring of foam at the waterline, breathing with the stroke
  if (dash) {                                                // the wave pushed ahead: a chevron of foam, its point the way they go
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
