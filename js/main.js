// Chat, panel buttons, URL options and start-up.

// Chat, like many sandbox games: recent lines show for a while then fade; Enter opens the history and the input.
const CHAT_SHOW_MS = 10000, CHAT_KEEP = 100;
function chatLine(text, cls = "", who = null) {
  const log = $("chatlog"), last = log.lastElementChild;
  if (last && last.dataset.text === text + (who || "")) {           // the same line again: count it
    last.dataset.n = +(last.dataset.n || 1) + 1; last.querySelector(".n").textContent = ` ×${last.dataset.n}`;
    last.dataset.t = Date.now(); last.classList.remove("old"); return;
  }
  const d = document.createElement("div"); d.className = cls; d.dataset.text = text + (who || ""); d.dataset.t = Date.now();
  d.innerHTML = (who ? `<span class="who">${esc(who)}</span> ` : "") + esc(text) + `<span class="n"></span>`;
  log.appendChild(d); while (log.childElementCount > CHAT_KEEP) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
}
setInterval(() => { for (const d of $("chatlog").children) d.classList.toggle("old", Date.now() - d.dataset.t > CHAT_SHOW_MS); }, 500);
function openChat(prefix = "") { $("chatbox").classList.add("open"); const i = $("say"); i.value = prefix; i.focus(); $("chatlog").scrollTop = 1e9; askTools(); suggest(); }   // (complete.js)
function closeChat() { $("chatbox").classList.remove("open"); $("say").blur(); suggest(); }
$("say").addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Escape") closeChat();
  if (completeKey(e) || e.key !== "Enter") return;         // (Tab, the arrows: the list over the line, complete.js)
  const line = e.target.value.trim(); closeChat(); e.target.value = "";
  if (!line) return;
  if (line.startsWith("/")) {
    const parts = line.slice(1).match(/(?:[^\s"]+|"[^"]*")+/g) || [], tool = parts.shift(), args = {};
    for (const p of parts) { const [k, ...v] = p.split("="); const val = v.join("=").replace(/^"|"$/g, ""); args[k] = /^-?\d+$/.test(val) ? +val : val === "true" ? true : val === "false" ? false : val; }
    if (!localCommand(tool)) act(tool, args);              // (/coords, /grid: debug.js; anything else is an action)
  } else if (line.startsWith("!")) act("shout", {text: line.slice(1).trim()});
  else if (shouted(line)) act("shout", {text: line});      // WRITTEN IN CAPITALS: a shout, as it reads
  else act("say", {text: line});
});
$("postbtn").onclick = postLetter; $("openbtn").onclick = takeLetters;
$("mailclose").onclick = () => { $("mail").style.display = "none"; };
$("letter").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") postLetter(); if (e.key === "Escape") $("mail").style.display = "none"; });
$("craftclose").onclick = () => { sfx("close"); $("craft").style.display = "none"; drawGoals(); };
$("say").addEventListener("blur", closeChat);
function toggleCraft() { const c = $("craft"), open = c.style.display !== "block"; sfx(open ? "open" : "close"); c.style.display = open ? "block" : "none"; if (open) craftOpened(); drawGoals(); }   // (C; on a phone, its button at the top)
$("helpbtn").onclick = () => { const h = $("help"); const on = h.style.display !== "block"; h.style.display = on ? "block" : "none"; localStorage.setItem("megastructure-help", on ? "on" : "off"); };
$("goalhelp").onclick = () => $("helpbtn").click();
$("join").onclick = () => { const n = $("name").value.trim(); if (n) joinGame(n); };
$("watch").onclick = () => { $("joinbox").style.display = "none"; };
$("brand").onclick = () => { if (!me) $("joinbox").style.display = "block"; };
$("name").value = localStorage.getItem("megastructure-name") || "";
const qs = new URLSearchParams(location.search);
if (qs.get("follow")) { follow = qs.get("follow"); $("joinbox").style.display = "none"; }
if (qs.get("zoom")) zoom = +qs.get("zoom");
ready.then(() => {
  buildBlob();
  connectSpec(); requestAnimationFrame(frame);
});
