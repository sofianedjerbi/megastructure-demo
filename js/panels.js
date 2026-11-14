// Side panels: who's awake, and the F3 debug overlay with server stats.

// =====================================================================================
//  Panels
// =====================================================================================
function drawAgents() {
  const el = $("agents"); el.innerHTML = "";
  const asleep = agents.filter((a) => !a.online).length;
  agents.filter((a) => a.online).sort((a, b) => (b.name === me) - (a.name === me) || a.name.localeCompare(b.name)).forEach((a) => {
    const d = document.createElement("div");
    d.className = "ag" + (a.name === follow ? " sel" : "") + (a.online ? "" : " off");
    d.innerHTML = `<span class="dot" style="background:${agentTint(a.name)}"></span><span class="n">${esc(a.name)}${a.name === me ? " (you)" : ""}</span>`;
    d.onclick = () => { if (me) return; follow = follow === a.name ? null : a.name; drawAgents(); };
    el.appendChild(d);
  });
  if (asleep) el.insertAdjacentHTML("beforeend", `<div class="ag off"><span class="n">+ ${asleep} asleep</span></div>`);
}
function drawStats() {
  const m = metrics;
  $("debug").textContent = `${m.agents_online} awake / ${m.agents_total} · ${m.tiles_changed} tiles changed · ${m.crafts} crafts · ${m.trades} gifts · ${m.deaths} deaths · ${m.tick_ms_p50} ms/tick`;
}
