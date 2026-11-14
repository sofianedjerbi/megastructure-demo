// The inventory (I), drawn as the recipe book is (craft.js: its pixel and paper, sunk cells, a window that is one
// size whatever is in it). Everything has its place and keeps it:
//   at the top, what you wear: five cells, a faint picture in an empty one of what goes there;
//   the pack: three rows of ten cells (more than that: a second page, PageDown);
//   your bar: the ten cells you play with, each with its key, the same ten as at the foot of the screen;
//   and nothing else but a label that hangs on the cell the cursor is on (the thing's name, how many, and its line
//   from blurbs.js: the funny one, not what it is for), and under the cells one line of keys, each said in a word
//   for the thing you are on ("eat", "wear", "take off"), dim when it does nothing there. A key's word can be clicked.
//   (There was a strip under the cells with the thing's picture, three lines about it and a row of buttons: too
//   much to read and too much room. Of five mockups the user took "only the cells".)
// A thing stays in its cell until you move it (ui.js: slots, kept from one day to the next); an empty cell stays
// empty. (It was a strip of pictures without names that wrapped and changed size and order as you picked things up.)
// All of it without a mouse: the arrows (or W A S D) move the cursor a cell at a time, on a grid; Enter takes the
// thing in hand and closes (from the pack it comes onto the bar, in place of what you held); E eats it, puts it on,
// or takes it off; X picks it up to move it, and X again puts it down where the cursor is (the two change places);
// a number sends it to that cell of the bar; Esc closes. With a mouse: a click moves the cursor, a double click
// takes in hand, the buttons do as they say, and a thing is dragged from one cell to another.

const BAG = {cols: 10, rows: 3, wear: ["head", "top", "pants", "shoes", "effect"],
  ghost: {head: "straw_hat", top: "linen_shirt", pants: "linen_shorts", shoes: "leather_boots", effect: "sparkle_charm"}};
const PACK = BAG.cols * BAG.rows;
let bagAt = {zone: "bar", i: 0}, bagMove = null, bagPage = 0;      // the cursor; the slot of the thing being moved; the pack's page

const bagIndex = (at) => at.zone === "bar" ? at.i : BAR + bagPage * PACK + at.i;            // its place in `slots`
const bagWorn = () => (meObs && meObs.self.wearing) || {};
const bagItem = (at) => at.zone === "wear" ? bagWorn()[BAG.wear[at.i]] || null : slots[bagIndex(at)] || null;
const bagPages = () => Math.max(1, Math.ceil((slots.reduce((m, n, i) => n ? i + 1 : m, 0) - BAR) / PACK));
function toggleBag() {
  const b = $("bag"), on = b.style.display !== "block"; sfx(on ? "open" : "close"); b.style.display = on ? "block" : "none";
  bagMove = null;
  if (on) {                                          // it opens on what you hold, or where you left the cursor
    const held = selected ? slots.indexOf(selected) : -1;
    if (held >= 0 && held < BAR) bagAt = {zone: "bar", i: held};
    bagDraw(true);
  }
}
function bagSwap(a, b) {                             // two cells of the bar or the pack change places
  while (slots.length <= Math.max(a, b)) slots.push(null);
  [slots[a], slots[b]] = [slots[b], slots[a]];
  localStorage.setItem("megastructure-slots", JSON.stringify(slots)); sfx("ui");
  $("hotbar").dataset.sig = ""; drawHotbar(meObs.self.inventory);
}
function bagHold() {
  const name = bagItem(bagAt); if (!name) return;
  if (bagAt.zone === "wear") return void act("unwear", {slot: BAG.wear[bagAt.i]});
  const from = bagIndex(bagAt);
  if (from >= BAR) {                                 // from the pack: onto the bar, where what you hold is, or its first empty cell, or its last
    const held = selected ? slots.indexOf(selected) : -1, free = slots.slice(0, BAR).indexOf(null);
    bagSwap(from, held >= 0 && held < BAR ? held : free >= 0 ? free : BAR - 1);
  }
  selectItem(name); toggleBag();
}
const bagUses = (name, worn) => worn ? "Take off" : FOODS.includes(name) ? "Eat" : WEAR[name] ? "Wear" : "";
function bagUse() {
  const name = bagItem(bagAt); if (!name) return;
  if (bagAt.zone === "wear") act("unwear", {slot: BAG.wear[bagAt.i]});
  else if (FOODS.includes(name)) act("eat", {item: name});
  else if (WEAR[name]) act("wear", {item: name});
}
function bagCarry() {                                // X: pick up what the cursor is on, or put down what is carried
  if (bagAt.zone === "wear") return;
  if (bagMove == null) { if (bagItem(bagAt)) { bagMove = bagIndex(bagAt); sfx("ui"); } }
  else { const to = bagIndex(bagAt); if (to !== bagMove) bagSwap(bagMove, to); bagMove = null; }
  bagDraw(true);
}
function bagCell(at, name, n) {
  const d = name ? craftCell(name, n > 1 ? n : null) : Object.assign(document.createElement("div"), {className: "cell"});
  const idx = at.zone === "wear" ? -1 : bagIndex(at);
  if (!name && at.zone === "wear") { d.appendChild(iconCanvas(BAG.ghost[BAG.wear[at.i]])); d.classList.add("ghost"); d.title = "Nothing worn here"; }
  if (at.zone === bagAt.zone && at.i === bagAt.i) d.classList.add("cur");
  if (name && name === selected && at.zone !== "wear") d.classList.add("held");
  if (bagMove != null && idx === bagMove) d.classList.add("moving");
  if (at.zone === "bar") d.insertAdjacentHTML("beforeend", `<i class="k">${(at.i + 1) % 10}</i>`);
  d.dataset.zone = at.zone; d.dataset.i = at.i;
  d.onclick = () => { bagAt = at; if (bagMove != null) bagCarry(); else bagDraw(true); };
  d.ondblclick = () => { bagAt = at; bagHold(); };
  if (at.zone !== "wear") {                          // dragged from one cell to another: they change places
    d.draggable = !!name;
    d.ondragstart = (e) => { e.dataTransfer.setData("text/plain", String(idx)); };
    d.ondragover = (e) => e.preventDefault();
    d.ondrop = (e) => { e.preventDefault(); const from = +e.dataTransfer.getData("text/plain"); bagAt = at; bagMove = null; if (from !== idx) bagSwap(from, idx); else bagDraw(true); };
  }
  return d;
}
// The window, again: when it is open and what it shows has changed (ui.js draws the bar, then this)
function drawBag() { bagDraw(false); }
function bagDraw(now) {
  const el = $("bag"); if (!meObs || el.style.display !== "block") return;
  const inv = meObs.self.inventory, worn = bagWorn(), pages = bagPages(); bagPage = Math.min(bagPage, pages - 1);
  const sig = JSON.stringify([inv, worn, slots, selected, bagAt, bagMove, bagPage, meObs.self.can]);
  if (!now && el.dataset.sig === sig) return; el.dataset.sig = sig;
  $("bagwear").replaceChildren(...BAG.wear.map((slot, i) => bagCell({zone: "wear", i}, worn[slot] || null, 1)));
  $("bagpack").replaceChildren(...[...Array(PACK)].map((_, i) => { const n = slots[BAR + bagPage * PACK + i] || null; return bagCell({zone: "pack", i}, n, inv[n]); }));
  $("bagbar").replaceChildren(...[...Array(BAR)].map((_, i) => bagCell({zone: "bar", i}, slots[i] || null, inv[slots[i]])));
  $("bagpage").textContent = pages > 1 ? `Pack · ${bagPage + 1} of ${pages}` : "Pack";
  const name = bagItem(bagAt), isWorn = bagAt.zone === "wear", cur = el.querySelector(".cell.cur");
  if (name && cur) {                                 // the label on the cursor's cell: over it (under it, for what you wear), moved along to stay inside the window
    const n = isWorn ? 1 : inv[name] || 0;
    cur.insertAdjacentHTML("beforeend", `<div class="btip${isWorn ? " down" : ""}">${esc(capital(label(name)))}${n > 1 ? " x" + n : ""}<i>${esc(BLURB[name] || "")}</i></div>`);
    const tip = cur.lastChild, t = tip.getBoundingClientRect(), w = el.getBoundingClientRect(), q = parseFloat(getComputedStyle(el).getPropertyValue("--q")) || 3, pad = 4 * q;
    const dx = t.left < w.left + pad ? w.left + pad - t.left : t.right > w.right - pad ? w.right - pad - t.right : 0;
    if (dx) tip.style.transform = `translateX(calc(-50% + ${Math.round(dx / q) * q}px))`;
  }
  const keys = $("bagkeys"), use = name ? bagUses(name, isWorn) : ""; keys.innerHTML = "";
  const key = (cap, word, fn, off) => { const k = document.createElement("span"); k.className = "bkey" + (off ? " off" : ""); k.innerHTML = `<kbd>${cap}</kbd>${word}`; if (fn && !off) k.onclick = fn; keys.appendChild(k); };
  if (bagMove != null) { key("X", "put down", bagCarry); key("Esc", "let go", () => { bagMove = null; bagDraw(true); }); }
  else {
    key("Enter", isWorn ? "take off" : "hold", bagHold, !name);
    key("E", isWorn || !use ? "use" : use.toLowerCase(), bagUse, !use || isWorn);
    key("X", "move", bagCarry, !name || isWorn);
    key("1-0", "to bar", null, !name || isWorn);
    key("Esc", "close", toggleBag);
  }
}
// Keys while it is open
function bagKey(k, e) {
  const dir = KEYDIR[k];
  if (dir) {
    const c = bagAt.zone === "wear" ? bagAt.i + BAG.cols - BAG.wear.length : bagAt.i % BAG.cols, r = bagAt.zone === "wear" ? -1 : bagAt.zone === "pack" ? Math.floor(bagAt.i / BAG.cols) : BAG.rows;
    const nr = Math.max(-1, Math.min(BAG.rows, r + (dir === "S") - (dir === "N"))), nc = Math.max(nr < 0 ? BAG.cols - BAG.wear.length : 0, Math.min(BAG.cols - 1, c + (dir === "E") - (dir === "W")));
    bagAt = nr < 0 ? {zone: "wear", i: nc - (BAG.cols - BAG.wear.length)} : nr === BAG.rows ? {zone: "bar", i: nc} : {zone: "pack", i: nr * BAG.cols + nc};
    sfx("ui");
  } else if (k === "enter" || k === " ") { if (e.repeat) return true; if (bagMove != null) return bagCarry(), true; bagHold(); return true; }
  else if (k === "e") { if (!e.repeat) bagUse(); return true; }
  else if (k === "x") { if (!e.repeat) bagCarry(); return true; }
  else if (/^[0-9]$/.test(k)) { if (bagAt.zone !== "wear" && bagItem(bagAt)) { const to = (+k + 9) % 10; if (to !== bagIndex(bagAt)) bagSwap(bagIndex(bagAt), to); bagMove = null; } }
  else if (k === "pagedown" || k === "pageup") bagPage = Math.max(0, Math.min(bagPages() - 1, bagPage + (k === "pagedown" ? 1 : -1)));
  else if (k === "escape" && bagMove != null) bagMove = null;            // (the first Esc lets go of what is carried; the next closes)
  else return false;
  bagDraw(true);
  return true;
}
$("bagclose").onclick = () => toggleBag();
