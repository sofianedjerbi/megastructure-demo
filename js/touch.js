// Touch: the game on a phone. Only on touch screens (body.touch); the keyboard and mouse play stays as it was.
//   Left thumb: a joystick wherever it lands on the left of the screen (pushed far, you sprint).
//   Right thumb: the main button (Space: act on what you face, held it keeps going) and the other one (X), each
//   labelled with what it will do right now; eat and pick up show up when you can. Items (the inventory), craft and talk at the top.
//   Two fingers on the world pinch to zoom; a tap on a tile is a click (as with a mouse).

const TOUCH = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || new URLSearchParams(location.search).has("touch");
const STICK_DEAD = 12, STICK_RUN = 64;       // CSS px from where the thumb landed: below this nothing, beyond it sprint
let stick = null;                             // {id, x, y, dir}

function touchUI() {
  const el = (tag, id, html, parent = document.body) => { const e = document.createElement(tag); e.id = id; e.innerHTML = html; parent.appendChild(e); return e; };
  el("div", "pad", '<div id="stickbase"></div><div id="stickknob"></div>');
  const btns = el("div", "tbtns", "");
  for (const [id, label] of [["tA", "A"], ["tB", "B"]]) el("div", id, `<span class="cap"></span><span class="lbl">${label}</span>`, btns);
  const ctx_ = el("div", "tctx", "");
  el("div", "tEat", "Eat", ctx_); el("div", "tPick", "Pick up", ctx_);
  const top = el("div", "ttop", "");
  el("div", "tBag", "Items", top); el("div", "tCraft", "Craft", top); el("div", "tTalk", "Talk", top);
  return {btns, ctx_};
}

function setDir(dir, run) {
  for (const k of ["arrowup", "arrowdown", "arrowleft", "arrowright"]) keys.delete(k);
  if (dir) keys.add({N: "arrowup", S: "arrowdown", W: "arrowleft", E: "arrowright"}[dir]);
  runKey = !!run;
  syncWalk();
}

function holdButton(e, fn) {                  // a press acts at once; held, it acts again once done (chopping on)
  let t = null;
  e.addEventListener("pointerdown", (ev) => {
    ev.preventDefault(); e.setPointerCapture(ev.pointerId); e.classList.add("down");
    inputMode = "keys"; fn(); clearInterval(t);
    t = setInterval(() => { if (!myAction && !pendingAct) fn(); }, 220);   // (never cutting short work in progress)
  });
  const up = () => { clearInterval(t); t = null; e.classList.remove("down"); };
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) e.addEventListener(ev, up);
}
function tapButton(e, fn) {
  e.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); e.classList.add("down"); fn(); });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) e.addEventListener(ev, () => e.classList.remove("down"));
}

if (TOUCH) {
  document.body.classList.add("touch"); hudTall = .26;       // (the HUD: a quarter of the height at most, ui.js)
  if (Math.min(innerWidth, innerHeight) < 520 && !new URLSearchParams(location.search).get("zoom")) zoom = 2;
  const {btns} = touchUI(), pad = $("pad"), base = $("stickbase"), knob = $("stickknob");

  pad.addEventListener("pointerdown", (e) => {
    if (!me || stick) return;
    e.preventDefault(); pad.setPointerCapture(e.pointerId);
    stick = {id: e.pointerId, x: e.clientX, y: e.clientY, dir: null};
    base.style.left = knob.style.left = e.clientX + "px"; base.style.top = knob.style.top = e.clientY + "px";
    pad.classList.add("on"); inputMode = "keys";
  });
  pad.addEventListener("pointermove", (e) => {
    if (!stick || e.pointerId !== stick.id) return;
    let dx = e.clientX - stick.x, dy = e.clientY - stick.y;
    const d = Math.hypot(dx, dy), max = STICK_RUN + 10;
    if (d > max) { dx *= max / d; dy *= max / d; }
    knob.style.left = stick.x + dx + "px"; knob.style.top = stick.y + dy + "px";
    // four ways: the bigger axis wins, with a little stickiness so a thumb on the diagonal doesn't flicker
    let dir = null;
    if (d > STICK_DEAD) {
      const h = Math.abs(dx) > Math.abs(dy) * (stick.dir === "N" || stick.dir === "S" ? 1.3 : 1 / 1.3);
      dir = h ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N");
    }
    const run = d > (runKey ? STICK_RUN - 14 : STICK_RUN);     // (sticky: a thumb resting on the line doesn't flick between the two)
    if (dir !== stick.dir || run !== runKey) { stick.dir = dir; setDir(dir, run); }
  });
  const release = (e) => {
    if (!stick || e.pointerId !== stick.id) return;
    stick = null; pad.classList.remove("on"); setDir(null, false);
  };
  for (const ev of ["pointerup", "pointercancel"]) pad.addEventListener(ev, release);

  holdButton($("tA"), () => { if (me) useFacing(false); });
  holdButton($("tB"), () => { if (me) useFacing(true); });
  tapButton($("tEat"), () => useSelected());
  tapButton($("tPick"), () => act("pick_up", {}));
  tapButton($("tBag"), () => toggleBag());
  tapButton($("tCraft"), () => toggleCraft());
  tapButton($("tTalk"), () => openChat());

  // pinch to zoom, two fingers on the world
  const fingers = new Map(); let pinch = null;
  cv.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") fingers.set(e.pointerId, e); });
  cv.addEventListener("pointermove", (e) => {
    if (!fingers.has(e.pointerId)) return;
    fingers.set(e.pointerId, e);
    if (fingers.size !== 2) { pinch = null; return; }
    const [a, b] = [...fingers.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch) pinch = d;
    else if (d / pinch > 1.35 || d / pinch < 1 / 1.35) { zoomBy(d > pinch ? 1 : -1); pinch = d; }
  });
  for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, (e) => { fingers.delete(e.pointerId); pinch = null; });

  // The buttons say what they'll do, and the HUD fits the screen (the controls go above it when it's narrow)
  let sig = "";
  setInterval(() => {
    if (!me) return;
    const rows = availableActions(), get = (k) => rows.find((r) => r[0] === k);
    const a = get("Space"), b = get("X"), s = [a && a[1], a && a[2], b && b[1], !!get("E"), !!get("F")].join("|");
    if (s !== sig) {
      sig = s;
      $("tA").querySelector(".cap").textContent = a ? a[1] : "";
      $("tA").classList.toggle("bad", !!(a && a[2])); $("tA").classList.toggle("idle", !a);
      $("tB").querySelector(".cap").textContent = b ? b[1] : "";
      $("tB").classList.toggle("idle", !b);
      $("tEat").style.display = get("E") ? "block" : "none";
      $("tPick").style.display = get("F") ? "block" : "none";
    }
    if (hudFit()) return;                                      // (the bar's pixel changed: measured at the next turn)
    const hud = $("hud"), w = Math.max(hud.scrollWidth, $("vitals").scrollWidth), h = hud.offsetHeight;
    const k = Math.min(1, (innerWidth - 16) / (w || 1));       // (the vitals alone too wide: a very narrow screen)
    hud.style.transform = k < 1 ? `translateX(${(innerWidth - w * k) / 2}px) scale(${k})` : "";   // (wider than the screen, it starts at its left)
    const narrow = innerWidth - w * k < 2 * 190;               // no room for the thumbs beside the hotbar
    document.body.style.setProperty("--tbot", (narrow ? h * k + 18 : 12) + "px");
  }, 200);
}
