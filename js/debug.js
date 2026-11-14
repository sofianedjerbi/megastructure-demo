// Debugging aids, typed in the chat line (Enter, or /):
//   /coords   where you are (X, Y and the height Z you stand at) and the tile you aim at, top right
//   /grid     every tile outlined where it is drawn (lifted with its ground), its height written in it; the borders
//             of the blocks the land comes in (32 tiles) in orange
//   /perf     what the last second cost, top right: frames a second and the longest wait between two; the script's
//             work a frame (and the part of it that built land coming in); the world's ticks reaching the screen, and
//             what a tick costs the world; the canvas, the blocks and bodies in view
// Each is on until typed again, and kept between visits. Any other /word is an action sent to the server, as before
// (/dig dir=N). The chat line lists them all as you type (complete.js).

const DEBUG = {coords: localStorage.getItem("megastructure-coords") === "1", grid: localStorage.getItem("megastructure-grid") === "1",
               perf: localStorage.getItem("megastructure-perf") === "1"};
const COMMANDS = {
  coords: () => flip("coords", "Coordinates"),
  grid: () => flip("grid", "Grid"),
  perf: () => flip("perf", "Performance"),
};
function flip(what, name) {
  DEBUG[what] = !DEBUG[what];
  localStorage.setItem("megastructure-" + what, DEBUG[what] ? "1" : "0");
  toast(`${name} ${DEBUG[what] ? "on" : "off"} (/${what})`);
}
// A /word typed in the chat line that is one of ours: done here. -> was it?
function localCommand(word) {
  const run = COMMANDS[String(word || "").toLowerCase()];
  if (run) run();
  return !!run;
}

// Where you are, top right (caves.js keeps your tile and height: myAt), and the tile you aim at with its height
let xyzText = "";
function showXYZ() {
  let t = "";
  if (DEBUG.coords && myAt) {
    const aim = me && aimedTile();
    t = `X ${myAt.x}  Y ${myAt.y}  Z ${myAt.z}` + (aim ? `   ·   aim ${aim.p.x}, ${aim.p.y}  z ${topAt(aim.p.x, aim.p.y)}` : "");
  }
  if (DEBUG.perf && PERF.text) t += (t ? "\n" : "") + PERF.text;
  if (t !== xyzText) { xyzText = t; $("xyz").textContent = t; }
}
// Called at the end of each frame (render.js) with when it began, what the script did in it and how much of that was
// building land: summed up every second
const PERF = {text: "", since: 0, last: 0, n: 0, gap: 0, js: 0, worst: 0, land: 0, clock: null, ticks: 0, tickAt: 0, tickGap: 0};
function perfFrame(now, js, land) {
  const q = PERF;
  if (!DEBUG.perf) { q.text = ""; q.since = q.last = q.tickAt = 0; return; }
  if (clock !== q.clock) { q.clock = clock; q.ticks++; if (q.tickAt) q.tickGap = Math.max(q.tickGap, now - q.tickAt); q.tickAt = now; }
  if (q.last) q.gap = Math.max(q.gap, now - q.last);
  q.last = now; q.n++; q.js += js; q.worst = Math.max(q.worst, js); q.land += land;
  if (!q.since) q.since = now;
  const s = (now - q.since) / 1000;
  if (s < 1) return;
  q.text = `${Math.round(q.n / s)} fps · longest wait ${Math.round(q.gap)} ms\n`
    + `script ${(q.js / q.n).toFixed(1)} ms a frame, worst ${q.worst.toFixed(1)} · land ${(q.land / q.n).toFixed(1)}\n`
    + `ticks ${(q.ticks / s).toFixed(1)}/s, longest wait ${Math.round(q.tickGap)} ms\n`
    + `world ${metrics.tick_ms_p50 ?? "?"} ms a tick, worst ${metrics.tick_ms_max ?? "?"}\n`
    + `canvas ${cv.width}x${cv.height} (x${DPR}) · ${blocks.size} blocks · ${ents.size} bodies`;
  q.since = now; q.n = 0; q.gap = 0; q.js = 0; q.worst = 0; q.land = 0; q.ticks = 0; q.tickGap = 0;
}

function drawGrid(sx, sy, S) {
  if (!DEBUG.grid) return;
  const [vx, vy, vw, vh] = viewRect(1), write = S >= 32;
  ctx.save();
  ctx.font = `${Math.max(9, Math.round(S / 3.4))}px SproutPixel`; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.lineWidth = 1;
  for (let y = vy; y <= vy + vh + 6; y++) for (let x = vx; x <= vx + vw; x++) {   // (+6 rows south: high ground there is drawn up into view)
    if (!tile(x, y)) continue;
    const lv = standAt(x, y), X = Math.round(sx(x)), Y = Math.round(sy(y, x));
    ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.strokeRect(X + .5, Y + .5, S, S);
    ctx.fillStyle = "rgba(255,140,80,.85)";
    if (x % B === 0) ctx.fillRect(X, Y, 2, S);
    if (y % B === 0) ctx.fillRect(X, Y, S, 2);
    if (write && lv) { ctx.fillStyle = "rgba(40,28,36,.75)"; ctx.fillText(lv, X + 4, Y + 3); ctx.fillStyle = "#fff6e0"; ctx.fillText(lv, X + 3, Y + 2); }
  }
  ctx.restore();
}
