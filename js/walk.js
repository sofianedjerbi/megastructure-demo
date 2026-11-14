// Your own walk. Your screen walks you itself: at the stride's exact speed, a tile at a time, looking at the land as
// the server does (intent.js: walkable), and never waits for an answer, which may come late (a phone, a slow line:
// waiting made you stop at every tile). The server is told the way and makes it after you: `walk` says the direction
// (it keeps going, as you do) and `from`, the tile you turned at; `stop` says `at`, the tile you stopped on. It makes
// those tiles first, in order, at the same stride (sim/movement.py: follow), so it ends where you are. Each has a
// number, and the server says the last it reached (`vn` on your entity): `trail` is the ones it still has to make.
// Getting far ahead of it (LEAD tiles along the way) you slow down, then wait: you're never more than a few tiles
// from where the world has you. Where it couldn't follow, you go back to where it has you.

let walking = null;          // {dir, run, lane, at}: lane: the row (column) you walk along; at: the tile you turn at, until you're on it
const trail = [];            // {x, y, n}: tiles you turned or stopped at that the server hasn't made yet
let trailN = 0, srv = null;  // srv: the server's last step for you {x0, y0, x, y, t, ms} (from, to, when, how long its steps take)
const LEAD = [2, 4];         // tiles ahead of the server: from the first you slow down, at the second you wait for it

function mark(x, y) { const n = ++trailN; trail.push({x, y, n}); return [x, y, n]; }

// Held keys (or the stick): one message when the direction or sprint changes, one when you let go.
function syncWalk() {
  const k = [...keys].reverse().find((k) => KEYDIR[k]);
  const want = k && me ? {dir: KEYDIR[k], run: sprinting()} : null;
  if (want && walking && want.dir === walking.dir && want.run === walking.run) return;
  if (!want && !walking) return;
  const prev = walking, p = ents.get("agent" + myId), now = performance.now();
  walking = want;
  if (!want) {                                   // let go: you finish the tile you're entering, and the server comes to it
    const args = {};
    if (p && p.walking) {
      p.walking = false;
      pred = {x: p.tx, y: p.ty, until: now + 2000};
      args.at = mark(p.tx, p.ty); if (prev.run) args.run = true;
    }
    rpc("act", {tool: "stop", args});
    return;
  }
  const [dx, dy] = DIRV[want.dir], args = want.run ? {dir: want.dir, run: true} : {dir: want.dir};
  if (p) {
    const [ox, oy] = prev && p.walking ? DIRV[prev.dir] : [0, 0];
    const line = (ox || oy) && !(ox * dy - oy * dx), back = line && (ox !== dx || oy !== dy);
    // the same line (faster, slower, back the way you came): from where you are. (Back up a drop you were falling
    // down: no, that step is made.)
    if (line && !(back && !prev.at && !walkable(p.tx - ox, p.ty - oy, p.tx, p.ty))) { want.lane = prev.lane; want.at = prev.at; }
    else {                                       // a turn: at the tile you're entering, which you finish first (as the server will)
      want.lane = dx ? p.ty : p.tx; want.at = {x: p.tx, y: p.ty};
      if (ox || oy) args.from = mark(p.tx, p.ty);
      // ...but let go and straight back the way you came: that tile isn't made after all, by you or the server
      // (`cut`), when it is on this same line (not still round a corner)
      const bx = Math.sign(p.x - p.tx), by = Math.sign(p.y - p.ty);
      if (pred && bx === dx && by === dy && trail.length === 1 && srv && (dx ? srv.y : srv.x) === want.lane) { want.at = null; args.cut = true; trail.length = 0; }
    }
    p.fx = dx; p.fy = dy; p.walking = true; p.running = want.run; p.moved = now;
  }
  myAction = null; pred = null;
  const mine = want;
  rpc("act", {tool: "walk", args}).then((r) => {
    if (walking !== mine) return;              // replaced by a newer walk / stop
    walking = null; if (p) p.walking = false;    // it ended (a wall, a fall that hurt): the next tick says where you are
    if (r.ok && r.result.stopped === "blocked") { const q = ents.get("agent" + myId); if (q) { q.fx = dx; q.fy = dy; } }
  });
}

// Where the server has you, between its ticks: it steps a tile at once, then waits a stride; you glide over that time.
function srvAt(now) {
  const k = Math.min(1, (now - srv.t) / srv.ms);
  return {x: srv.x0 + (srv.x - srv.x0) * k, y: srv.y0 + (srv.y - srv.y0) * k};
}
// How far ahead of it you are, along the way you came (it may still be round a corner). Under 0: it is ahead of you.
function leadOf(p, now) {
  if (!srv) return 0;
  const [wx, wy] = DIRV[walking.dir], at = walking.at;
  let q = srvAt(now), d = 0;
  for (const c of trail) {
    if (at && c.x === at.x && c.y === at.y) break;             // (the corner you're still on your way to)
    d += Math.abs(c.x - q.x) + Math.abs(c.y - q.y); q = c;
  }
  const ax = p.x - q.x, ay = p.y - q.y;
  if (at) return d + Math.abs(ax) + Math.abs(ay);
  const al = ax * wx + ay * wy, off = Math.abs(ax * wy) + Math.abs(ay * wx);
  return d || off > .01 ? d + Math.abs(al) + off : al;
}
// where nobody sprints: in a boat (and, on a server from before the sprint in the water, in the water)
// tiles a second from the tile (x, y): 5 walking, 10 at a sprint; in the water the server's SWIM_PACE times slower (half),
// and EAT_PACE times slower while you eat (half again: the two add up)
const speedAt = (x, y, p) => { const t = tile(x, y); return (walking.run && !onWater(x, y, p) ? 10 : 5) / (t && wet(t[1]) && !(p.e && p.e.sail) ? SWIM_PACE : 1) / (eating() ? EAT_PACE : 1); };
const onWater = (x, y, p) => { const t = tile(x, y); return (!SWIM_SPRINT && !!t && wet(t[1])) || !!(p.e && p.e.sail); };

// A frame of your walk (render.js). A turn first finishes the tile you were walking into, in a straight line, then
// turns: no diagonal slide. Each step as the server paces it, in its 0.1 s ticks: a stride of 1 tick (sprinting) or
// 2 (walking), twice that in the water. Up a layer the server takes a tick more (SLOPE_UP: hard going); you
// don't, on screen: a hop at the pace of a step (slowed for it, you hung in the air: jump.js). It catches up when
// you stop, and on a long climb you slow down smoothly, by how far ahead of it you are (LEAD).
function walkOn(p, dt, now) {
  const [wx, wy] = DIRV[walking.dir], s = wx || wy, side = wx ? "y" : "x", along = wx ? "x" : "y", lead = leadOf(p, now);
  let t = dt * (lead < -1 ? 1.25 : lead <= LEAD[0] ? 1 : Math.max(0, (LEAD[1] - lead) / (LEAD[1] - LEAD[0])));   // the time you walk in
  for (let i = 0; i < 4 && t > 1e-5; i++) {
    const off = walking.lane - p[side];
    if (Math.abs(off) > 1e-3) {
      const v = speedAt(Math.round(p.x), Math.round(p.y), p), go = Math.min(Math.abs(off), v * t);
      p[side] += Math.sign(off) * go; t -= go / v; p.moved = now;
      continue;
    }
    p[side] = walking.lane; walking.at = null;
    const a0 = s > 0 ? Math.floor(p[along] + 1e-6) : Math.ceil(p[along] - 1e-6);      // the tile you're leaving, and the next
    const fx = wx ? a0 : walking.lane, fy = wx ? walking.lane : a0, nx = fx + wx, ny = fy + wy;
    if (!walkable(nx, ny, fx, fy)) { p[along] -= s * Math.min((p[along] - a0) * s, 10 * t); p.tx = fx; p.ty = fy; break; }   // a wall: you stay
    const v = speedAt(fx, fy, p);
    const go = Math.min((a0 + s - p[along]) * s, v * t);
    p[along] += s * go; t -= go / v; p.tx = nx; p.ty = ny; p.moved = now;
  }
}

// A tick's word on where you are (state.js). -> true: you're on your own way, the server coming after you.
function myTick(p, e, now) {
  if (!srv || srv.x !== e.x || srv.y !== e.y) {
    const step = srv && Math.abs(e.x - srv.x) + Math.abs(e.y - srv.y) === 1;
    srv = {x0: step ? srv.x : e.x, y0: step ? srv.y : e.y, x: e.x, y: e.y, t: now, ms: step && now - srv.t < 350 ? Math.max(100, now - srv.t) : 150};
  }
  while (trail.length && trail[0].n <= (e.vn || 0)) trail.shift();
  if (pred && (!trail.length || now > pred.until)) { pred = null; trail.length = 0; }     // it's where you stopped (or never will be)
  if (!walking || !p.walking) return !!pred;
  const lane = DIRV[walking.dir][0] ? e.y : e.x;
  if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > LEAD[1] + 2) {                           // moved away (woken elsewhere), or it lost you: be where it has you
    p.x = p.tx = e.x; p.y = p.ty = e.y; walking.lane = lane; walking.at = null; trail.length = 0;
  } else if (!trail.length && !walking.at && lane !== walking.lane) walking.lane = lane;   // it couldn't follow you round the corner: walk where it does
  return true;
}
