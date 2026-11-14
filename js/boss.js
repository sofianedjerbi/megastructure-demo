// Old Mossback, the first boss (sim/boss.py): what its events sound and look like, and the fight's music.

const BOSS_SOUND = {wake: "boss_wake", stomp: "boss_stomp", snap: "boss_snap", shake: "boss_shake", land: "sporeling_land", puff: "spore_puff"};
function bossEvent(e) {
  if (BOSS_SOUND[e.what]) sfx(BOSS_SOUND[e.what], e.x, e.y, e.what === "land" || e.what === "puff" ? 0 : 20);     // the boss carries further
  if (e.what === "stomp") for (const dx of [-3, -2, 2, 3]) burst(e.x + dx, e.y, "dust", 7, {up: 1.5, spread: 3, g: 3});
  if (e.what === "wake") for (const dx of [-1, 0, 1]) burst(e.x + dx, e.y, "dust", 6, {up: 1, spread: 2, g: 3});
  if (e.what === "shake") burst(e.x, e.y - 2, "H", 14, {up: 2, spread: 5, g: 4, life: .9});
  if (e.what === "puff") burst(e.x, e.y, "dust", 8, {up: 1, spread: 3, g: 1, life: .7});
}
// The fight's loop plays while an Old Mossback in view is awake (audio.js bossMusic).
setInterval(() => bossMusic([...ents.values()].some((q) => q.e && q.e.kind === "mossback" && q.e.act !== "sleep")), 500);
