// What Tab shows while it is held (keyboard.js; a tap on the goals, on a phone): the day, and who is awake.
// Drawn as the recipe book is (craft.js: one pixel size, --q; a window, sunk cells, a sunk list, all of them shadows
// of a box; its pixel is a size under the book's, --w: it was the book's own, and too big): at the top the sun or
// the moon, the day and the hour, and under them the day as a bar in the sky's colours hour by hour (daylight.js:
// bands and checkers in big cells, not a gold part and a dark one), with a mark where the hour is. Then a line for each one awake: their picture (their own sheet, as they
// are dressed), their name, their level; you first, and lit. At the foot, where you are and how many are asleep.
// Nothing in it moves in: it is there the frame after the key.

const SKY = {   // 16 x 16: the sun by day, the moon by night
  sun: ["................", ".......o........", "..o....o....o...", "...o........o...", ".....oyyyyo.....", "....oyyyyyyo....", "....yywwyyyy....", ".oo.yywyyyyy.oo.",
        "....yyyyyyyy....", "....yyyyyyyy....", "....oyyyyyyo....", ".....oyyyyo.....", "...o........o...", "..o....o....o...", ".......o........", "................"],
  moon: ["................", "......mmmm......", "....mmllllm.....", "...mlllmm.......", "..mlllm.........", "..mllm......s...", "..mllm..........", "..mllm....s.....",
         "..mlllm.........", "...mlllm.....m..", "....mllllmmmm...", ".....mmllllm....", ".......mmmm.....", "................", "................", "................"],
  col: {y: "#f6c453", o: "#c98a2b", w: "#fff1b8", l: "#f4efd8", m: "#8d8fb8", s: "#f4efd8"},
};
const WHO_ROWS = 8;                                  // lines at most (fewer where the screen is short: a phone on its side), then "(3 more)"
function skyIcon(night) {
  const c = document.createElement("canvas"); c.width = c.height = 16; const g = c.getContext("2d");
  SKY[night ? "moon" : "sun"].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") { g.fillStyle = SKY.col[ch]; g.fillRect(x, y, 1, 1); } }));
  return c;
}
function portrait(a) {                               // head and shoulders, hat and all, from their own sheet's first frame
  const c = document.createElement("canvas"); c.width = c.height = 16; const g = c.getContext("2d");
  try { g.drawImage(wornSheet(agentTint(a.name), a.worn, a.race), 16, 12, 16, 16, 0, 0, 16, 16); } catch (e) { /* sheets still loading */ }
  return c;
}
// The hour and the mark on the day's bar: every tick while it shows
function whoTick() {
  const [, day, hour] = /day (\d+), (\d+:\d+)/.exec($("clock").textContent) || [0, "?", ""];
  $("whoday").textContent = "Day " + day; $("whohour").textContent = hour;
  $("whomark").style.left = `calc(${clock.phase} * (100% - 4 * var(--q)))`;
  const sky = $("whosky"), night = clock.night ? "1" : "0";
  if (sky.dataset.night !== night) { sky.dataset.night = night; sky.replaceChildren(skyIcon(clock.night)); }
}
function drawWho() {
  whoTick();
  if (!$("whoband").width || $("whoband").width === 300) skyBar($("whoband"), 68, 3);        // (once: the day's bar, in cells of two px)
  const up = agents.filter((a) => a.online).sort((a, b) => (b.name === me) - (a.name === me) || a.name.localeCompare(b.name));
  const asleep = agents.length - up.length, list = $("wholist"), q = parseFloat(getComputedStyle($("who")).getPropertyValue("--q")) || 2;
  const rows = Math.max(2, Math.min(WHO_ROWS, Math.floor((innerHeight - 76 - 66 * q) / (22 * q))));     // (what is round the list: 60 of its px, and a little air)
  list.replaceChildren(...up.slice(0, rows).map((a) => {
    const d = document.createElement("div"); d.className = "line" + (a.name === me ? " cur" : "");
    const cell = document.createElement("div"); cell.className = "cell"; cell.appendChild(portrait(a));
    d.appendChild(cell);
    d.insertAdjacentHTML("beforeend", `<span class="n">${esc(a.name)}</span>${a.name === me ? '<span class="tag">you</span>' : ""}<span class="lv">Lv ${levelOf(a.xp || 0)[0]}</span>`);
    return d;
  }));
  const s = meObs && meObs.self, more = up.length - rows;
  $("whoat").textContent = s ? `${s.x}, ${s.y}${s.sheltered ? " · sheltered" : ""}` : "";
  $("whocount").textContent = `${up.length} awake` + (more > 0 ? ` (${more} more)` : "") + (asleep ? ` · ${asleep} asleep` : "");
}
