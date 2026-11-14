// Goals: the next three things to try, top left, ticked off as you do them: a small card in the inventory's pixel
// (css/windows.css). Over them the title, how many are done, and two keys: G puts the card away, H is the help.
// The card is not on the screen unless you ask for it (G: kept from one day to the next). Early in the game, while
// fewer than EARLY goals are done, a small tab in its place says so: "G goals 2/12" (on a phone it is always
// there: a tap on it is the key); and a goal done while the card is away is said in the line of news.

// [what to do, its icon, done?]
const GOALS = [
  ["Chop 4 wood", "wood", (inv, d) => (inv.wood || 0) >= 4 || d.workbench],
  ["Place a workbench", "workbench", (inv, d) => d.placedBench],
  ["Pick berries", "berries", (inv) => (inv.berries || 0) > 0],
  ["Plant a seed", "seed", (inv, d) => d.planted],
  ["Mine 3 stone", "stone", (inv) => (inv.stone || 0) >= 3],
  ["Craft an axe", "axe", (inv) => inv.axe],
  ["Light a campfire", "campfire", (inv, d) => d.placedFire],
  ["Water a crop", "watering_can", (inv, d) => d.watered],
  ["Get an egg or milk", "egg", (inv, d) => inv.egg || inv.milk || d.milked],
  ["Build a house", "door", (inv, d) => d.sheltered],
  ["Go sailing", "boat", (inv, d) => d.sailed],
  ["Put up a mailbox", "mailbox", (inv, d) => d.placedMail],
];
function markGoal(key) { if (!me) return; const d = goalState(); d[key] = true; localStorage.setItem("megastructure-goals-" + me, JSON.stringify(d)); }
function goalState() { return JSON.parse(localStorage.getItem("megastructure-goals-" + me) || "{}"); }
// The next three goals, each with its item's icon. One just done stays a moment, ticked, with a chime, then the
// next slides in; the header counts how many are done.
const EARLY = 4;
let goalsShown = [], goalsDoneAt = {}, goalsOff = localStorage.getItem("megastructure-goals-off") !== "0";      // (away, unless you asked for it)
function toggleGoals() {                             // G: the card, or away again
  if (!me) return;
  goalsOff = !goalsOff; localStorage.setItem("megastructure-goals-off", goalsOff ? "1" : "0");
  sfx(goalsOff ? "close" : "open");
  drawGoals();
}
function drawGoals() {
  if (!meObs) return;
  const inv = meObs.self.inventory, d = goalState(), now = performance.now();
  if (inv.workbench) d.workbench = true;
  if (meObs.self.sheltered) d.sheltered = true;
  if (meObs.self.sailing) d.sailed = true;
  GOALS.forEach(([, , f], i) => {
    if (f(inv, d) && !d["g" + i]) { d["g" + i] = true; if (goalsShown.includes(i)) { goalsDoneAt[i] = now; sfx("chime"); if (goalsOff) toast("Goal done: " + GOALS[i][0]); } }
  });
  localStorage.setItem("megastructure-goals-" + me, JSON.stringify(d));
  const lingering = goalsShown.filter((i) => goalsDoneAt[i] && now - goalsDoneAt[i] < 1600);
  const open = GOALS.map((_, i) => i).filter((i) => !d["g" + i] && !lingering.includes(i));
  goalsShown = [...lingering, ...open].slice(0, 3);
  const el = $("goals"), done = GOALS.filter((_, i) => d["g" + i]).length;
  const book = $("craft").style.display === "block";
  el.style.display = goalsOff || book ? "none" : "block";
  $("goalhint").style.display = goalsOff && !book && (done < EARLY || document.body.classList.contains("touch")) && done < GOALS.length ? "flex" : "none";
  $("goalhintn").textContent = `${done}/${GOALS.length}`;
  const sig = goalsShown.map((i) => i + (goalsDoneAt[i] ? "d" : "")).join() + "|" + done;
  if (el.dataset.sig === sig) return;
  el.dataset.sig = sig;
  $("goalcount").textContent = `${done}/${GOALS.length}`;
  const list = $("goallist");
  list.innerHTML = "";
  for (const i of goalsShown) {
    const row = document.createElement("div");
    row.className = "goal" + (goalsDoneAt[i] ? " done" : "");
    const icon = slotIcon(GOALS[i][1]), cell = document.createElement("span"); icon.className = "gi"; cell.className = "gc"; cell.append(icon);   // (its small picture, the bar's, at the card's pixel)
    row.append(cell);
    row.insertAdjacentHTML("beforeend", `<span class="gt">${esc(GOALS[i][0])}</span><span class="tick"></span>`);
    list.append(row);
  }
}
