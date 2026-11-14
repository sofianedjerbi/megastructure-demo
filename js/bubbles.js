// What people say, over their heads. A bubble is drawn in the pixel of its text (the 18 px font's is 2 px): stepped
// corners, a dark edge, a shade along its foot, a stepped tail. A long line is wrapped (seven rows hold all a chat line can be: 200 letters). Someone who says
// several things keeps them in a pile: the oldest lowest, by the head, with the tail; newer ones above it. When
// one goes the ones above come down onto its place. Two people's piles never cover each other: the later one is
// raised over the other. While someone speaks their name is not written over their head (characters.js): the tail
// points at the head itself and the name is a small dark tab on the top of the pile, as the label of a speech box.
// state.js adds to `bubbles`; render.js calls drawBubbles last, over everything.

const BUBBLE = {q: 2, life: 7, after: 3.5, most: 3, wide: 400, lines: 7, pitch: 20, padX: 8, padY: 6, gap: 2, fall: 12, fade: .25,
  ink: "#5b3f36", paper: "#fff6e2", shout: "#ffe3a3", foot: "#ecd7b0", footShout: "#f2c877", shade: "rgba(60,40,30,.25)"};

// The line as the rows it is written in (at most BUBBLE.lines, the last ending in … if there was more), and its size.
function bubbleShape(b) {
  if (b.rows) return b;
  const words = b.text.trim().split(/\s+/), rows = [""];
  const fits = (s) => ctx.measureText(s).width <= BUBBLE.wide;
  for (let w of words) {
    while (!fits(w)) {                                       // a word wider than a bubble: broken where it fills the row
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
  b.rows = rows; b.w = Math.max(even(Math.max(...rows.map((r) => ctx.measureText(r).width))) + 2 * BUBBLE.padX, even(ctx.measureText(b.name).width) + 12 * q);   // (no narrower than the name's tab on it)
  b.h = rows.length * BUBBLE.pitch + 2 * BUBBLE.padY - 4;
  b.life = Math.max(BUBBLE.life, b.text.length * BABBLE.letter + BUBBLE.after);     // (long enough to be written, then read)
  return b;
}
// One bubble: its box at (x, y), its tail's middle at tx if it has one.
function bubbleBox(b, x, y, tx) {
  const q = BUBBLE.q, {w, h} = b, r = (c, X, Y, W_, H_) => { ctx.fillStyle = c; ctx.fillRect(X, Y, W_, H_); };
  const paper = b.shout ? BUBBLE.shout : BUBBLE.paper;
  r(BUBBLE.shade, x + q, y + h, w - 2 * q, q);
  r(BUBBLE.ink, x + q, y, w - 2 * q, h); r(BUBBLE.ink, x, y + q, w, h - 2 * q);
  r(paper, x + 2 * q, y + q, w - 4 * q, h - 2 * q); r(paper, x + q, y + 2 * q, w - 2 * q, h - 4 * q);
  r(b.shout ? BUBBLE.footShout : BUBBLE.foot, x + 2 * q, y + h - 2 * q, w - 4 * q, q);
  if (tx != null) {                                          // the tail: three steps down to a point
    r(paper, tx - 3 * q, y + h - q, 6 * q, q);
    r(BUBBLE.ink, tx - 3 * q, y + h, 6 * q, q); r(paper, tx - 2 * q, y + h, 4 * q, q);
    r(BUBBLE.ink, tx - 2 * q, y + h + q, 4 * q, q); r(paper, tx - q, y + h + q, 2 * q, q);
    r(BUBBLE.ink, tx - q, y + h + 2 * q, 2 * q, q);
  }
}
// The speaker's name: a dark tab standing on the top left of the pile's highest bubble.
function bubbleTab(name, x, y, mine) {
  const q = BUBBLE.q, w = Math.ceil(ctx.measureText(name).width / q) * q + 6 * q, h = 11 * q;
  ctx.fillStyle = BUBBLE.ink; ctx.fillRect(x + 3 * q, y - h, w, h); ctx.fillRect(x + 2 * q, y - h + q, w + 2 * q, h - q);
  ctx.fillStyle = mine ? "#fff1a8" : BUBBLE.paper; ctx.fillText(name, x + 6 * q, y - 2 * q);
}
const speaking = (name) => bubbles.some((b) => b.name === name && b.at);     // (their name is on their bubbles)
let bubbleT = 0;
function drawBubbles(sx, sy, S, t) {
  const dt = Math.min(.1, Math.max(0, t - bubbleT)), q = BUBBLE.q, snap = (v) => Math.round(v / q) * q; bubbleT = t;
  ctx.font = "18px SproutPixel"; ctx.textAlign = "left";
  bubbles = bubbles.filter((b) => t - b.t < bubbleShape(b).life);
  const by = new Map();                                      // each speaker's, oldest first
  for (const b of bubbles) { if (!by.has(b.name)) by.set(b.name, []); by.get(b.name).push(b); }
  const piles = [];
  for (const [name, mine] of by) {
    while (mine.length > BUBBLE.most) bubbles.splice(bubbles.indexOf(mine.shift()), 1);      // a fourth line: the oldest goes at once
    const p = [...ents.values()].find((e) => e.e && e.e.kind === "agent" && e.e.name === name); if (!p) continue;
    let up = 0;
    for (const b of mine) {                                  // where each rests, as px above the lowest's foot; it comes down to it
      b.up = b.up === undefined || b.up < up ? up : Math.max(up, b.up - Math.max(q, (b.up - up) * dt * BUBBLE.fall));
      up += b.h + BUBBLE.gap;
    }
    const tx = snap(sx(p.x) + S / 2), foot = snap(bodyY(p, sy) - fallOver(p) - (p.e.hp < HP_MAX ? 9 * zoom + 4 : 4 * zoom)) - 3 * q,     // (the tail's point: over the head, or over the health bar)
      w = Math.max(...mine.map((b) => b.w));
    const top = foot - Math.max(...mine.map((b) => b.up + b.h)) - 11 * q;     // (with the name's tab)
    if (tx < -w || tx > W + w || foot < -20 || top > H) continue;
    piles.push({mine, tx, foot, w, top, y: p.y, name});
  }
  piles.sort((a, b) => b.y - a.y);                           // the nearest to the bottom of the screen keep their place
  const placed = [];
  for (const pile of piles) {
    const x0 = (b) => Math.max(4, Math.min(W - 4 - b.w, snap(pile.tx - b.w / 2)));
    for (let n = 0; n < 8; n++) {                            // raised over any pile it would cover
      const l = Math.min(...pile.mine.map(x0)), hit = placed.find((o) => l < o.r + 4 && l + pile.w > o.l - 4 && pile.top < o.b + 4 && pile.foot + 3 * q > o.t - 4);
      if (!hit) break;
      const lift = pile.foot + 3 * q - (hit.t - 4); pile.foot -= lift; pile.top -= lift;
    }
    placed.push({l: Math.min(...pile.mine.map(x0)), r: Math.min(...pile.mine.map(x0)) + pile.w, t: pile.top, b: pile.foot + 3 * q});
    pile.mine.forEach((b, n) => {
      const since = t - b.t, jolt = b.shout && since < .5 ? (Math.floor(since * 30) % 2 ? q : -q) : 0;      // (a shout: its bubble shakes as it lands)
      const x = x0(b) + jolt, y = pile.foot - snap(b.up) - b.h;
      ctx.globalAlpha = Math.max(0, Math.min(1, (b.life - since) / BUBBLE.fade));
      bubbleBox(b, x, y, n ? null : Math.max(x + 5 * q, Math.min(x + b.w - 5 * q, pile.tx)));
      ctx.fillStyle = BUBBLE.ink;
      let left = written(b.text, since).length;              // written out as it is said (babble.js), row after row
      b.rows.forEach((row, i) => { if (left > 0) ctx.fillText(row.slice(0, left), x + BUBBLE.padX, y + BUBBLE.padY + 12 + i * BUBBLE.pitch); left -= row.length + 1; });
      b.at = [x, y];                                          // (where it was drawn: for the tests)
      if (n === pile.mine.length - 1) { ctx.globalAlpha = pile.mine.length > 1 ? 1 : ctx.globalAlpha; bubbleTab(pile.name, x, y, me && pile.name === me); }
    });
  }
  ctx.globalAlpha = 1; ctx.textAlign = "start";
}
