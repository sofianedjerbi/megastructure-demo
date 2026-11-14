// Completion in the chat line (main.js). A "/" starts a command, and a list over the line says what can come next
// as you type: the commands (the server's actions, asked for once; the ones done here: debug.js), then the command's
// arguments (dir=), then what an argument can be (N E S W, what you carry, the recipes, who is near). Tab takes the
// one that is marked, the first or the one the arrows moved to; a click or a tap takes any. Enter sends the line as
// it is typed. In plain talk, Tab finishes the name of someone near (several: the list, then Tab).

let tools = null;                                    // the server's actions: name -> {args: {name: what it is}, desc}
const LOCAL = {coords: "where you are, top right", grid: "every tile outlined, with its height", perf: "what the last second cost, top right"};
const comp = {items: [], note: "", at: 0, from: 0, to: 0};

function askTools() {
  if (tools || !me) return;
  // (listed again when they come, if a command is being typed: not in plain talk, where a list of names asked for with Tab was wiped by it)
  rpc("tools", {}).then((r) => { if (r.ok && r.tools) { tools = r.tools; if ($("chatbox").classList.contains("open") && $("say").value.startsWith("/")) suggest(); } });
}
// The ones that start with what is typed (the shortest first: /di is dig before dig_down), then the ones that have
// it in them; nothing typed: all of them, in the order they come
function matching(list, typed) {
  const t = typed.toLowerCase(), has = list.filter((it) => it.put.toLowerCase().includes(t)), starts = has.filter((it) => it.put.toLowerCase().startsWith(t));
  if (t) starts.sort((a, b) => a.put.length - b.put.length);
  return [...starts, ...has.filter((it) => !starts.includes(it))];
}
// Who is near, nearest first: [entity, tiles away]
function nearby(pick) {
  const s = myPos(); if (!s) return [];
  return [...ents.values()].filter((p) => p.e && !(p.e.kind === "agent" && p.e.id === myId) && pick(p.e))
    .map((p) => [p.e, Math.round(Math.hypot(p.x - s.x, p.y - s.y))]).sort((a, b) => a[1] - b[1]);
}
// What an argument can be: [{put, hint}] (none: it is yours to write: a number, a text)
function valuesOf(cmd, key, what) {
  const inv = meObs ? meObs.self.inventory : {};
  if (/^\w+(\|\w+)+$/.test(what)) return what.split("|").map((v) => ({put: v, hint: {N: "north", E: "east", S: "south", W: "west"}[v] || ""}));
  if (what.startsWith("bool")) return [{put: "true", hint: ""}];
  if (key === "recipe") return Object.keys(recipes).map((r) => ({put: r, hint: fmt(recipes[r].inputs)}));
  if ((key === "item" && cmd !== "take") || key === "with")       // what you carry (to eat: what can be eaten)
    return Object.keys(inv).filter((n) => inv[n] > 0 && (cmd !== "eat" || n in foodValue)).map((n) => ({put: n, hint: "×" + inv[n]}));
  if (key === "target") {
    const pick = what.startsWith("agent") ? (e) => e.kind === "agent" : what.startsWith("cow") ? (e) => e.kind === "cow" : what.startsWith("animal") ? (e) => e.kind !== "agent" : () => true;
    return nearby(pick).slice(0, 12).map(([e, d]) => ({put: String(e.id), hint: `${e.name || e.kind}, ${d} ${d === 1 ? "tile" : "tiles"} away`}));
  }
  return [];
}
// What can come where the caret is: {from, items, note} (from: where what is being typed starts), or null
function completions(text, caret, asked) {
  const head = text.slice(0, caret), word = /(\S*)$/.exec(head)[1], from = caret - word.length;
  if (!head.startsWith("/")) {                        // plain talk: a name, when asked for (Tab)
    if (!asked || !/^[\w-]+$/.test(word)) return null;
    const names = [...new Set([...nearby((e) => e.kind === "agent").map(([e]) => e.name), ...agents.filter((a) => a.online && a.name !== me).map((a) => a.name)])];
    return {from, items: names.filter((n) => n.toLowerCase().startsWith(word.toLowerCase())).map((n) => ({put: n + " ", show: n, hint: ""}))};
  }
  if ((head.match(/"/g) || []).length % 2) return null;   // (in a quoted text: yours to write)
  if (from === 0) {                                   // the command itself
    const all = [...Object.entries(tools || {}).map(([n, t]) => [n, t.desc, Object.keys(t.args).length]), ...Object.entries(LOCAL).map(([n, d]) => [n, d, 0])];
    return {from: 1, items: matching(all.map(([n, hint, args]) => ({put: n + (args ? " " : ""), show: n, hint})), word.slice(1))};
  }
  const cmd = head.slice(1).split(/\s+/)[0].toLowerCase(), spec = tools && tools[cmd], eq = word.indexOf("=");
  if (!spec) return null;
  if (eq < 0) {                                       // one of its arguments, not given yet
    const given = new Set((text.match(/(?:^|\s)([\w]+)=/g) || []).map((g) => g.trim().slice(0, -1)));
    return {from, items: matching(Object.entries(spec.args).filter(([k]) => !given.has(k)).map(([k, what]) => ({put: k + "=", hint: what})), word)};
  }
  const key = word.slice(0, eq), what = spec.args[key];
  if (!what) return null;
  const items = matching(valuesOf(cmd, key, what).map((v) => ({...v, show: v.put, put: v.put + " "})), word.slice(eq + 1));
  return {from: from + eq + 1, items, note: items.length ? "" : `${key}: ${what}`};
}
// The list for the line as it is now (asked: Tab was pressed)
function suggest(asked = false) {
  const i = $("say"), open = $("chatbox").classList.contains("open"), c = open ? completions(i.value, i.selectionStart, asked) : null;
  comp.items = c ? c.items : []; comp.note = c ? c.note || "" : ""; comp.at = 0;
  if (c) { comp.from = c.from; comp.to = i.selectionStart + /^\S*/.exec(i.value.slice(i.selectionStart))[0].length; }
  drawSuggest();
}
function drawSuggest() {
  const el = $("sayhelp");
  el.innerHTML = comp.items.map((it, k) => `<div class="${k === comp.at ? "on" : ""}" data-k="${k}"><b>${esc(it.show || it.put)}</b><span>${esc(it.hint || "")}</span></div>`).join("")
    || (comp.note ? `<div class="note"><span>${esc(comp.note)}</span></div>` : "");
  el.style.display = el.innerHTML ? "block" : "none";
  const on = el.querySelector(".on"); if (on) on.scrollIntoView({block: "nearest"});
}
// One of the list goes into the line, in place of what was being typed; then what can come after it is listed
function takeSuggestion(k = comp.at) {
  const it = comp.items[k], i = $("say"); if (!it) return;
  const tail = i.value.slice(comp.to), put = it.put.endsWith(" ") && tail.startsWith(" ") ? it.put.slice(0, -1) : it.put;
  i.value = (i.value.slice(0, comp.from) + put + tail).slice(0, i.maxLength);
  const at = Math.min(i.value.length, comp.from + it.put.length); i.setSelectionRange(at, at);
  suggest();
}
// A key in the chat line: was it for the list? (Tab never leaves the line)
function completeKey(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    if (!comp.items.length) { suggest(true); if (comp.items.length !== 1) return true; }
    takeSuggestion(); return true;
  }
  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && comp.items.length > 1) {
    e.preventDefault(); comp.at = (comp.at + (e.key === "ArrowDown" ? 1 : comp.items.length - 1)) % comp.items.length; drawSuggest(); return true;
  }
  return false;
}
$("say").addEventListener("input", () => suggest());
$("say").addEventListener("click", () => suggest());
$("sayhelp").addEventListener("mousedown", (e) => e.preventDefault());     // (the line keeps the caret: losing it shuts the chat)
$("sayhelp").addEventListener("click", (e) => { const d = e.target.closest("[data-k]"); if (d) takeSuggestion(+d.dataset.k); });
