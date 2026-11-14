// The death screen: the world drains to grey under a dark red edge, and a panel drops in with the skull, how it
// happened, what you left behind (where you fell) and where you'll wake. A bar fills as you come to; any key or
// click closes it (once the bar has filled: a key held from before doesn't skip it).

const DEATH_MS = 1200;                     // the bar fills, then it waits for you: any key or a click
let deathReadyAt = Infinity;
let deathTimer = null;
function showDeath(e) {
  const v = $("deathveil"), p = $("death");
  const skull = $("deathskull").getContext("2d"), [c, r] = EMOTE.skull;
  skull.imageSmoothingEnabled = false; skull.clearRect(0, 0, 32, 32); skull.drawImage(IMG.emoji, c * 32, r * 32, 32, 32, 0, 0, 32, 32);
  const cause = String(e.cause || "you fell").replace(/^./, (m) => m.toUpperCase());
  $("deathcause").textContent = cause + ".";
  const loot = $("deathloot"); loot.innerHTML = "";
  const items = Object.entries(e.dropped || {}).filter(([, n]) => n > 0);
  for (const [name, n] of items.slice(0, 8)) {
    const s = document.createElement("div"); s.className = "dslot";
    const ic = slotIcon(name); ic.className = "dicon"; s.appendChild(ic);
    const k = document.createElement("span"); k.textContent = n > 1 ? "×" + n : ""; s.appendChild(k);
    s.title = label(name); loot.appendChild(s);
  }
  $("deathleft").textContent = items.length ? `What you carried lies where you fell, at ${e.x}, ${e.y}.` : "You carried nothing.";
  $("deathwake").textContent = meObs && meObs.self.spawn ? "You'll wake by your bed." : "You'll wake somewhere else. Sleep in a bed to choose where.";
  for (const el of [v, p]) { el.style.display = "block"; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); }
  const bar = $("deathbar"); bar.style.transition = "none"; bar.style.width = "0"; void bar.offsetWidth;
  bar.style.transition = `width ${DEATH_MS}ms linear`; bar.style.width = "100%";
  clearTimeout(deathTimer); deathReadyAt = performance.now() + DEATH_MS;
  const hint = document.querySelector("#death .dhint");
  hint.style.visibility = "hidden"; hint.textContent = TOUCH ? "tap to get up" : "any key to get up";
  deathTimer = setTimeout(() => { hint.style.visibility = "visible"; }, DEATH_MS);
}
function hideDeath() {
  clearTimeout(deathTimer);
  for (const id of ["deathveil", "death"]) { const el = $(id); if (el.style.display === "block") { el.classList.remove("on"); el.classList.add("off"); setTimeout(() => { el.style.display = "none"; el.classList.remove("off"); }, 450); } }
}
const deathOpen = () => $("death") && $("death").classList.contains("on");
addEventListener("keydown", (e) => { if (deathOpen() && performance.now() >= deathReadyAt && !e.repeat) hideDeath(); }, true);
addEventListener("pointerdown", () => { if (deathOpen() && performance.now() >= deathReadyAt) hideDeath(); }, true);
