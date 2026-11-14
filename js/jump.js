// Up or down a layer (or several, down): a hop, for a person or a creature alike (sim/bodies.py: one way to stand on
// the land). Between two tiles a body is placed on the straight line between their heights (relief.js liftOf: the
// camera and the name over a head follow that line, smoothly). The hop is one arc over that line, from the middle
// of a tile to the middle of the next, as a thrown thing goes: high enough to clear the edge it goes over. Its
// shadow stays on the ground under it (the ground it leaves, until it is over the edge), it holds the pose it took
// off in (no walking on air), and there is dust where it leaves the ground and where it lands.
// It is quick: a hop takes the time of a step (walk.js: your screen doesn't slow down for it). Seen frame by frame,
// what looked wrong before was the hang: a step and a half long, the body near the top of its arc for most of it.

const JUMP = {over: 2, off: 1};      // art px the arc clears the edge by: going up, coming down

// -> null on the level, or {body, ground: art px over the straight line (its feet, its shadow)}
function jumpOf(p) {
  const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y);
  if (ax === bx && ay === by) return null;
  const la = standAt(ax, ay), lb = standAt(bx, by);
  if (la === lb) return null;
  const f = ax === bx ? p.y - ay : p.x - ax, d = (lb - la) * RELIEF_STEP;        // how far across; px from the first to the second
  const up = (ax === bx ? p.ty - p.y || p.fy : p.tx - p.x || p.fx) >= 0 === d > 0;   // going to the higher one?
  return {body: (Math.abs(d) / 2 + (up ? JUMP.over : JUMP.off)) * 4 * f * (1 - f), ground: (f < .5 ? 0 : d) - d * f};
}

// A drop of FALL.from layers or more is a fall, not a hop. You walk to the edge on the ground you leave; from the edge
// you come down by your own weight (FALL.g), however long that takes: the step is usually over before you land. Your
// shadow waits on the ground below and grows as you near it, your legs go (two frames of the run, turn about), the
// camera comes down with you (render.js) and the wind rises in your ears (audio.js: fallWind). Where you land: dust
// thrown out to both sides and a thump, heavier the further you fell. A fall that hurt (the server says so: its
// `fall` event, more than 3 layers) lands with the tree's thud, the ground shakes, you flash, bounce, and lose
// what it cost you there, not when you stepped off. (A fall was a hop: one arc at the pace of a step, twelve layers
// in a fifth of a second, the screen jumping with it, and nothing to say it had hurt.)
const FALL = {from: 3, g: 1000, flail: 70, heavy: 4, shake: [3.5, .32], bounce: [3, .17]};   // layers; art px/s2; ms a frame; layers from which it lands heavily; px and s of the shake, of the bounce
let fallQuake = null;                 // {t0, amp}: the ground shaking under you (render.js: fallShake)

// -> null, or the fall of p now: {body, ground: art px over the straight line (relief.js liftOf), air}. (Asked once
// a frame by the camera and once by the drawing: worked out once.)
function falling(p, now) {
  if (p.fallAt !== now) { p.fallAt = now; p.fallNow = fallOf(p, now); }
  return p.fallNow;
}
function fallOf(p, now) {
  const ax = Math.floor(p.x), ay = Math.floor(p.y), bx = Math.ceil(p.x), by = Math.ceil(p.y), ramp = liftOf(p) / zoom;
  const la = standAt(ax, ay), lb = standAt(bx, by), between = (ax !== bx || ay !== by) && la !== lb;
  const fwd = (ax === bx ? p.ty - p.y || p.fy : p.tx - p.x || p.fx) >= 0, down = between && fwd === la > lb;   // going to the lower one?
  const f = ax === bx ? p.y - ay : p.x - ax, u = la > lb ? f : 1 - f;         // how far from the higher tile's middle to the lower one's
  let F = p.fall;
  if (!F) {
    if (!down || Math.abs(la - lb) < FALL.from) return null;
    F = p.fall = {top: Math.max(la, lb) * RELIEF_STEP, land: Math.min(la, lb) * RELIEF_STEP, t0: 0};
  }
  if (F.done) {                                           // down before the step was over: on the ground, to the end of it
    if (!between) { p.fall = null; return null; }
    return {body: F.land - ramp, ground: F.land - ramp, air: false};
  }
  if (!F.t0) {                                            // to the edge, on the ground it leaves
    if (!down) { p.fall = null; return null; }            // (turned back)
    if (u < .5) return {body: F.top - ramp, ground: F.top - ramp, air: false};
    F.t0 = now;
  }
  const t = (now - F.t0) / 1000, h = F.top - .5 * FALL.g * t * t, mine = p.e && p.e.kind === "agent" && p.e.id === myId;
  if (h <= F.land || t > 3) {
    landed(p, (F.top - F.land) / RELIEF_STEP, now, mine);
    p.fall = between ? {...F, done: true} : null;
    return p.fall ? {body: F.land - ramp, ground: F.land - ramp, air: false} : null;
  }
  if (mine) fallWind(Math.min(1, FALL.g * t / 600));       // (louder and higher with its speed)
  return {body: h - ramp, ground: F.land - ramp, air: true};
}
// What is drawn over a falling body (its name, what it says) falls with it: screen px to lift it by, over bodyY
const fallOver = (p) => (p.fall && p.fallNow ? p.fallNow.body * zoom : 0);
// It lands, `layers` further down
function landed(p, layers, now, mine) {
  const tx = Math.round(p.x), ty = Math.round(p.y), heavy = layers >= FALL.heavy, hurt = p.fallHurt;
  if (mine) fallWind(-1);
  for (const side of [-1, 1]) for (let i = 0; i < 3 + Math.min(6, layers); i++)       // dust, thrown out low to both sides
    parts.push({x: p.x + .5 + side * .2, y: p.y + .85 - UP, vx: side * (1.5 + Math.random() * (2 + layers * .25)), vy: -.4 - Math.random() * 1.2,
      g: 5, life: .35 + Math.random() * .3, age: 0, c: PCOL.dust[i % PCOL.dust.length], s: Math.random() < .4 ? 2 : 1});
  smoke(p.x, p.y + .35 - UP, heavy ? 7 : 4, heavy ? .6 : .4);
  sfx(heavy ? "fallthud" : "thud", tx, ty);
  p.jpose = undefined;
  if (heavy || hurt) p.bounce = now;
  if (hurt) fallHurts(p, now, mine);
}
// What a fall cost, shown where it lands (state.js keeps it from the server's `fall` event until then)
function fallHurts(p, now, mine) {
  const n = p.fallHurt; if (!n) return;
  p.fallHurt = 0;
  flashes.set(p.e.kind + p.e.id, now);
  floats.push({x: Math.round(p.x), y: Math.round(p.y), text: "-" + hearts(n), color: "#ff8a7a", t: now / 1000});
  if (mine) { sfx("hurt"); fallQuake = {t0: now, amp: FALL.shake[0] + Math.min(3, hearts(n))}; }
}
// The ground shaking under you after a fall that hurt: art px to move the camera by, dying away
function fallShake(now) {
  if (!fallQuake) return 0;
  const k = (now - fallQuake.t0) / 1000 / FALL.shake[1];
  if (k >= 1) { fallQuake = null; return 0; }
  return Math.round(Math.sin(k * 34) * fallQuake.amp * (1 - k) * (1 - k));
}

// Called as a body is drawn: dust as it leaves the ground, dust and a sound as it lands. -> its hop (or its fall), or null
function jumping(p, now = performance.now()) {
  const fall = falling(p, now);
  if (fall) return fall;
  if (now - p.bounce < FALL.bounce[1] * 1000 && !jumpOf(p)) {                 // a heavy landing: up a little off the ground, and down
    const k = (now - p.bounce) / 1000 / FALL.bounce[1];
    return {body: Math.sin(k * Math.PI) * FALL.bounce[0], ground: 0, air: false};
  }
  const j = jumpOf(p), tx = Math.round(p.x), ty = Math.round(p.y);
  if (j && p.jfrom === undefined) { p.jfrom = standAt(tx, ty); burst(p.x, p.y + .35 - UP, "dust", 3, {up: .8, spread: 1.6, g: 3, life: .3}); }
  if (!j && p.jfrom !== undefined) {
    const down = standAt(tx, ty) < p.jfrom;
    smoke(p.x, p.y + .35 - UP, down ? 4 : 3, down ? .4 : .3); sfx(down ? "thud" : "step", tx, ty);
    p.jfrom = p.jpose = undefined;
  }
  return j;
}
// Its shadow, on the ground under it (x, y: where the body is drawn standing; z: the zoom)
function jumpShadow(j, x, y, S, z, wide = 5) {
  ctx.fillStyle = "rgba(40,30,50,.2)";
  pixelOval(x + S / 2, y - Math.round(j.ground * z) + S - 2 * z, Math.max(wide * .6, wide - (j.body - j.ground) / 6), 2, 0, .5);
}
