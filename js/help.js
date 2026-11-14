// The help (H, or ?): a window in the recipe book's manner, a page at a time. It was one small panel of four long lines,
// every key of the game run together with dots between. Now: four pages (Move, Do, Carry, Talk), five rows at most
// on each, a row a key drawn as a key and a few words on one line. Left and Right (or a click on a tab) turn the page; H or
// Esc shuts it. Its looks are css/help.css.

const HELP = [
  ["Move", [[["W", "A", "S", "D"], "Walk"], [["Shift"], "Sprint: hold it"], [["Alt"], "Turn without walking"], [["+", "−"], "Zoom"], [["G"], "Goals: show or hide"]]],
  ["Do", [[["Space"], "Use what you face"], [["X"], "Other use: milk, till"], [["F"], "Pick up"], [["E"], "Eat"],
    [["Click"], "Space there. Shift: X"]]],
  ["Carry", [[["1-9", "Q"], "Take in hand"], [["`"], "Empty your hands"], [["Space"], "Place what you hold"],
    [["I"], "Inventory"], [["C"], "Craft"]]],
  ["Talk", [[["Enter"], "Talk"], [["ABC"], "Shout: IN CAPITALS"], [["/"], "Commands, Tab ends one"], [["Tab"], "Hold: who is awake"],
    [["M"], "Sound on or off"]]],
];
let helpPage = 0;
const helpOpen = () => $("help").style.display === "block";
function drawHelp() {
  const keys = (ks) => ks.map((k) => `<kbd>${k}</kbd>`).join("");
  $("help").innerHTML = `<div class="hh"><b>Help</b><span><kbd>H</kbd>close</span></div>`
    + `<div class="tabs">${HELP.map(([name], i) => `<div class="tab${i === helpPage ? " on" : ""}" data-i="${i}">${name}</div>`).join("")}</div>`
    + `<div class="well">${HELP[helpPage][1].map(([ks, what]) => `<div class="row"><div class="keys">${keys(ks)}</div><div class="what">${what}</div></div>`).join("")}</div>`
    + `<div class="hf"><kbd>←</kbd><kbd>→</kbd>turn the page</div>`;
}
function turnHelp(to) { helpPage = (to + HELP.length) % HELP.length; drawHelp(); sfx("pick"); }
function toggleHelp() { const on = !helpOpen(); if (on) drawHelp(); $("help").style.display = on ? "block" : "none"; sfx(on ? "open" : "close"); }
$("helpbtn").onclick = toggleHelp;                        // (the brand's link, the goals' key, H: keyboard.js)
$("help").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) turnHelp(+t.dataset.i); else if (e.target.closest(".hh span")) toggleHelp(); });
window.addEventListener("keydown", (e) => {               // (before the game's keys: the arrows turn pages, they do not walk you)
  if (!helpOpen() || document.activeElement === $("say")) return;
  const d = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1}[e.key];
  if (d) turnHelp(helpPage + d); else if (e.key === "Escape") toggleHelp(); else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
localStorage.removeItem("megastructure-help");            // (it used to open by itself at each join: a window in the middle does not)
