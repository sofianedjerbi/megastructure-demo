// The light of the day. It is not day, then night: the hours have their colours, and the world is lit by them.
// DAYLIGHT is the day as a row of moments: when (0 to 1 of a day: the night is its last quarter, sim/core.py), the
// sky's colour then (the day's bar on what Tab shows: who.js), the light's (what the whole picture is multiplied by:
// white is plain day, the night's is blue) and a wash (a colour laid thinly over all of it: r, g, b and how much).
// Between two moments all are mixed: sunrise comes out of the night rose, then peach, the morning clears, the
// afternoon turns gold, the sunset orange and rose, dusk violet, and the night is blue, deepest in its middle.
// (It was plain day until a twentieth of a day before night, then one blue. And the warm hours were first made by
// multiplying alone, then by a wash of a sixth: grass and orange are mud. The wash is a tenth at most, and the twilights are
// mostly the night's blue coming or going: the green stays green.)
// At night the fires and the people carry light. It is worked out small, a px of it an art px of the land, and put
// on the picture enlarged: a light is rings of whole pixels, each a step brighter (small steps at its rim), with a
// checkered edge between two steps that stays on the land's own pixels as you walk. (They were smooth round glows
// added over the picture.)

const DAYLIGHT = [
  [0, "#ec8f7c", [196, 202, 232], [255, 170, 120, .08]], [.035, "#f4b56b", [232, 234, 244], [255, 190, 120, .1]], [.09, "#f8d877", [250, 250, 250], [255, 214, 150, .05]],
  [.16, "#fbe7a1", [255, 255, 255], [255, 214, 150, 0]], [.5, "#fbe7a1", [255, 255, 255], [255, 205, 110, 0]], [.6, "#f7cf6e", [255, 255, 255], [255, 205, 110, .07]],
  [.68, "#f0a05c", [250, 244, 238], [255, 170, 90, .12]], [.72, "#dc7389", [228, 218, 232], [250, 150, 120, .09]], [.755, "#8f6bb2", [184, 180, 224], [200, 130, 160, .04]],
  [.8, "#474a86", [140, 156, 214], [200, 130, 160, 0]], [.9, "#32356b", [128, 146, 210], [255, 170, 150, 0]], [.965, "#5a4f93", [150, 156, 218], [255, 170, 150, .03]],
  [1, "#ec8f7c", [196, 202, 232], [255, 170, 120, .08]],
];
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// Where a moment of the day lies in the row: [the moment before, the one after, how far between them (0 to 1)]
function dayAt(phase) {
  const p = ((phase % 1) + 1) % 1, i = Math.max(0, DAYLIGHT.findIndex((m) => m[0] > p) - 1);
  return [DAYLIGHT[i], DAYLIGHT[i + 1], (p - DAYLIGHT[i][0]) / (DAYLIGHT[i + 1][0] - DAYLIGHT[i][0])];
}
const mix = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f));
const lightAt = (phase) => { const [a, b, f] = dayAt(phase); return mix(a[2], b[2], f); };
const washAt = (phase) => { const [a, b, f] = dayAt(phase); return [...mix(a[3].slice(0, 3), b[3].slice(0, 3), f), a[3][3] + (b[3][3] - a[3][3]) * f]; };
// The day as a bar of w x h cells (who.js: 68 x 3, each cell two px of the window's): the sky's colours from one
// midnight to the next as flat bands, one moment's colour then the next's, with one step between them, and where two
// meet a checker of the two. Few colours and cells big enough to count: it is a pixel picture, not a smooth fade.
// (It was 136 x 6 with four steps and a finer dither: at that size it read as a smooth gradient.)
const BAYER2 = [0, 2, 3, 1];                         // 2 x 2, in quarters
function skyBar(cv, w, h) {
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d"), im = g.createImageData(w, h);
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const [a, b, f] = dayAt((x + .5) / w), step = Math.min(2, Math.floor(f * 2 + (BAYER2[(y % 2) * 2 + x % 2] + .5) / 4)) / 2;
    im.data.set([...mix(rgbOf(a[1]), rgbOf(b[1]), step), 255], (y * w + x) * 4);
  }
  g.putImageData(im, 0, 0);
}

const LIGHT = {cv: document.createElement("canvas"), pats: new Map(), steps: [.25, .2, .16, .12, .08, .05], edge: 2};   // steps: how much each ring adds, from the middle out
function checker(color) {                            // a pattern of one px in two, in a light's colour
  if (!LIGHT.pats.has(color)) {
    const c = document.createElement("canvas"); c.width = c.height = 2; const g = c.getContext("2d");
    g.fillStyle = color; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
    LIGHT.pats.set(color, c);
  }
  return LIGHT.pats.get(color);
}
// One light on the small picture: discs of whole px, one inside the other, each adding its step of the colour (times
// a); outside each, an edge two px wide of the same, one px in two
function lamp(g, cx, cy, r, color, a, shift) {
  cx = Math.round(cx); cy = Math.round(cy);
  const pat = g.createPattern(checker(color), "repeat"); pat.setTransform(new DOMMatrix([1, 0, 0, 1, shift[0], shift[1]]));
  const n = LIGHT.steps.length;
  for (let k = n; k >= 1; k--) {
    const rk = Math.round(r * k / n), ro = rk + LIGHT.edge;
    g.globalAlpha = Math.min(1, a * LIGHT.steps[k - 1]);
    for (let dy = -ro; dy <= ro; dy++) {
      const ho = Math.floor(Math.sqrt(ro * ro - dy * dy)), hi = Math.abs(dy) <= rk ? Math.floor(Math.sqrt(rk * rk - dy * dy)) : -1;
      g.fillStyle = pat;
      if (hi < 0) g.fillRect(cx - ho, cy + dy, 2 * ho + 1, 1);
      else { g.fillRect(cx - ho, cy + dy, ho - hi, 1); g.fillRect(cx + hi + 1, cy + dy, ho - hi, 1); g.fillStyle = color; g.fillRect(cx - hi, cy + dy, 2 * hi + 1, 1); }
    }
  }
  g.globalAlpha = 1;
}
// The hour's light over the picture, and at night the lights in it (render.js, after the world is drawn)
function drawNight(vis, sx, sy, S, t) {
  const tint = lightAt(clock.phase || 0), wash = washAt(clock.phase || 0), dark = Math.min(1, (1 - (.3 * tint[0] + .59 * tint[1] + .11 * tint[2]) / 255) / .36);
  if (wash[3] > .004) { ctx.globalAlpha = wash[3]; ctx.fillStyle = `rgb(${wash.slice(0, 3).join()})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // the hour's colour, thinly
  if (dark <= .01) return;                                   // plain day
  const z = zoom, x0 = ((sx(0) % z) + z) % z - z, y0 = ((sy(0) % z) + z) % z - z, w = Math.ceil((W - x0) / z), h = Math.ceil((H - y0) / z);
  const cv = LIGHT.cv, g = cv.getContext("2d");
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  g.globalCompositeOperation = "source-over"; g.fillStyle = `rgb(${tint.join()})`; g.fillRect(0, 0, w, h);
  if (dark > .2) {                                           // the lights: only once it is getting dark
    g.globalCompositeOperation = "lighter";
    const at = (px, py) => [(px - x0) / z, (py - y0) / z], shift = [Math.round((sx(0) - x0) / z) & 1, Math.round((sy(0) - y0) / z) & 1], k = (dark - .2) / .8;
    for (const p of ents.values()) if (p.e && p.e.kind === "agent") lamp(g, ...at(sx(p.x) + S / 2, bodyY(p, sy) + S / 2), 42, "rgb(255,222,170)", .45 * k, shift);
    const lights = [...fireAt];
    for (const b of vis) for (const [i, c] of b.objs) if (c === "^" || c === "x") lights.push({x: b.bx * B + i % B, y: b.by * B + (i / B | 0)});
    for (const {x, y} of lights) lamp(g, ...at(sx(x) + S / 2, sy(y, x) + S / 2), 64 + Math.round(3 * Math.sin(t * 9 + x * 7)), "rgb(255,176,96)", 1.15 * k, shift);
  }
  ctx.save();
  ctx.globalCompositeOperation = "multiply"; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, x0, y0, w * z, h * z);
  ctx.restore();
}
