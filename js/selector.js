// The selector: four pixel corner brackets around what Space or a click would act on. It glides from one thing to the
// next (snapping only on long jumps), breathes by a pixel, fades in and out, and turns red when it can't be done.

let sel = null, selAt = 0;   // {x0, y0, x1, y1, bad, a}: the box being drawn, in tiles

// The box comes from what is actually drawn: while the aimed thing (a tree, a stump, a hen, a person) is being drawn,
// every sprite's opaque pixels are added up on screen, through any flip or bounce. Nothing is measured by hand.
let selKey = null, selRec = null, selDrawn = null;   // what to measure; the box being measured; the last box measured
const rawDrawImage = ctx.drawImage.bind(ctx);
ctx.drawImage = function (img, ...r) {
  rawDrawImage(img, ...r);
  if (!selRec || r.length !== 8 || ctx.globalAlpha < .3) return;
  const [a, b, w, h, dx, dy, dw, dh] = r, bb = spriteBounds(img, a, b, w, h);
  if (!bb) return;
  const m = ctx.getTransform();
  for (const [u, v] of [[bb[0], bb[1]], [bb[2], bb[3]]]) {
    const x = dx + u * dw / w, y = dy + v * dh / h;
    const X = (m.a * x + m.c * y + m.e) / DPR, Y = (m.b * x + m.d * y + m.f) / DPR;
    selRec[0] = Math.min(selRec[0], X); selRec[1] = Math.min(selRec[1], Y);
    selRec[2] = Math.max(selRec[2], X); selRec[3] = Math.max(selRec[3], Y);
  }
};
// called for each thing in the draw list: measure it if it's the one aimed at
function selMeasure(o) {
  if (selRec) { if (selRec[2] > selRec[0]) selDrawn = {key: selKey, rect: selRec}; selRec = null; }
  if (o && selKey && (o.p ? "e" + o.p.e.kind + o.p.e.id : o.spr ? o.x + "," + o.ty : null) === selKey) selRec = [Infinity, Infinity, -Infinity, -Infinity];
}
// the aimed thing's key for the next frame, and its measured box (in tiles) if this frame drew it
function selTarget(p, it, ox, oy, S) {
  const key = !it || it.info || it.walk ? null : it.ent ? "e" + it.ent.e.kind + it.ent.e.id
    : !it.ghost && !(it.foot && it.foot.length > 1) && combAt(p.x, p.y) ? p.x + "," + p.y : null;
  const got = key && selDrawn && selDrawn.key === key ? selDrawn.rect : null;
  selKey = key; selDrawn = null;
  const z = zoom;
  return got && {x0: (got[0] - ox - z) / S, y0: (got[1] - oy - z) / S, x1: (got[2] - ox + z) / S, y1: (got[3] - oy + z) / S};
}

function drawSelector(box, sx, sy, now) {
  const dt = Math.min(.1, (now - (selAt || now)) / 1000);
  selAt = now;
  if (box) {
    const far = !sel || sel.a < .05 || Math.abs(box.x0 - sel.x0) + Math.abs(box.y0 - sel.y0) > 4;
    if (far) sel = {...box, a: sel ? sel.a : 0};
    const k = 1 - Math.exp(-dt * 22);
    for (const f of ["x0", "y0", "x1", "y1"]) sel[f] += (box[f] - sel[f]) * k;
    sel.bad = box.bad;
    sel.a = Math.min(1, sel.a + dt * 8);
  } else if (sel) {
    sel.a -= dt * 6;
    if (sel.a <= 0) { sel = null; return; }
  }
  if (!sel) return;
  const z = zoom, grow = Math.sin(now / 1000 * 4.5) > .3 ? z : 0;   // a one-pixel breath
  const x0 = Math.round(sx(sel.x0) / z) * z - grow, y0 = Math.round(sy(sel.y0) / z) * z - grow;
  const x1 = Math.round(sx(sel.x1) / z) * z + grow, y1 = Math.round(sy(sel.y1) / z) * z + grow;
  const arm = Math.max(2, Math.min(5, Math.floor(Math.min(x1 - x0, y1 - y0) / z / 3))) * z;
  const corners = (dx, dy) => {
    for (const [cx, cy, sx2, sy2] of [[x0, y0, 1, 1], [x1 - z, y0, -1, 1], [x0, y1 - z, 1, -1], [x1 - z, y1 - z, -1, -1]]) {
      ctx.fillRect(cx + dx + (sx2 < 0 ? z - arm : 0), cy + dy, arm, z);
      ctx.fillRect(cx + dx, cy + dy + (sy2 < 0 ? z - arm : 0), z, arm);
    }
  };
  ctx.globalAlpha = sel.a;
  ctx.fillStyle = "rgba(60,40,30,.45)"; corners(0, z);                       // a soft shadow under each bracket
  ctx.fillStyle = sel.bad ? "#e8604f" : "#fff8e8"; corners(0, 0);
  ctx.globalAlpha = 1;
}
