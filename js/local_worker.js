// The demo's game server (GitHub Pages build): the real Python server under Pyodide, in a worker of its own, so the
// world ticks (and makes new land) on another core than the page that draws it. The page talks to it in messages
// (local.js): open / msg / close a socket, save. The world is saved in IndexedDB, so it's there after a reload.
// While it comes it says how far it is ({t: "progress", p}: 0 to 1, the bar at the foot of Wake up): the share of
// Python's files that has arrived (nine tenths of the wait on a phone's line), then Python started, then the world made.

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/", SAVES = "/saves";
const STDLIB = new URL("../python_stdlib.070a7ff67f.zip", self.location.href).href;                 // (the build's own, smaller python_stdlib: tools/build_stdlib.py; null: Pyodide's)
// what comes, in bytes once unpacked (a browser does not say how long a packed file is), and its share of the line
const PARTS = {"pyodide.asm.wasm": [9.6e6, 31], "python_stdlib": [1472901, 13], "py.zip": [1.3e5, 1]};
const socks = new Map(), came = {};
let game = null, sync = null, saving = false, told = 0, stage = 0;
const took = {}, t0 = performance.now(), at = (k) => { took[k] = Math.round(performance.now() - t0); };      // (ms to each step: `bootTook` on the page)

function progress() {
  let p = 0, all = 0;
  for (const k in PARTS) { all += PARTS[k][1]; p += PARTS[k][1] * Math.min(1, (came[k] || 0) / PARTS[k][0]); }
  p = Math.max(stage, .8 * p / all);
  if (p > told) postMessage({t: "progress", p: told = p});
}
// Every file the worker asks for is counted as it arrives, on a copy of the answer: the answer itself goes on as it
// came (the browser keeps the compiled wasm for an answer that is the network's own, not for one made here).
const plainFetch = self.fetch.bind(self);
self.fetch = async (...a) => {
  const r = await plainFetch(...a), url = String((a[0] && a[0].url) || a[0]), k = Object.keys(PARTS).find((n) => url.includes(n));
  if (k && r.ok && r.body) {
    const read = r.clone().body.getReader(); let last = 0;
    (async () => { for (;;) { const {done, value} = await read.read(); if (done) break; came[k] = (came[k] || 0) + value.length;
      if (performance.now() - last > 100) { last = performance.now(); progress(); } } came[k] = PARTS[k][0]; progress(); })().catch(() => {});
  }
  return r;
};

async function boot() {
  postMessage({t: "say", text: "loading Python…"});
  const code = fetch("../py.zip?v=952ebd2f0a").then((r) => r.arrayBuffer());     // (asked for at once, with Python: it waited for it)
  const {loadPyodide} = await import(PYODIDE + "pyodide.mjs");      // (a module worker: local.js)
  at("loader");
  const py = await loadPyodide(STDLIB ? {indexURL: PYODIDE, stdLibURL: STDLIB} : {indexURL: PYODIDE});
  stage = .86; progress(); at("python");
  postMessage({t: "say", text: "loading the world…"});
  py.unpackArchive(await code, "zip", {extractDir: "/lib/game"});
  py.FS.mkdirTree(SAVES);
  py.FS.mount(py.FS.filesystems.IDBFS, {}, SAVES);
  sync = (load) => new Promise((ok) => py.FS.syncfs(load, ok));
  await sync(true);
  at("saves");
  py.runPython("import sys; sys.path.insert(0, '/lib/game')");
  game = py.pyimport("megastructure.browser");
  stage = .93; progress(); at("game");
  game.start(SAVES);
  stage = 1; progress(); at("world");
  setInterval(save, 15000);
  postMessage({t: "ready", took});
}
async function save(id) {
  if (!saving) { saving = true; game.save(); await sync(false); saving = false; }
  if (id !== undefined) postMessage({t: "saved", id});
}
onmessage = (e) => {
  const m = e.data, s = socks.get(m.id);
  if (m.t === "open") socks.set(m.id, game.connect(m.path, (raw) => postMessage({t: "msg", id: m.id, raw}), () => { socks.delete(m.id); postMessage({t: "closed", id: m.id}); }));
  else if (m.t === "msg") { if (s) s.push(m.raw); }
  else if (m.t === "close") { if (s) s.shut(); }
  else if (m.t === "save") save(m.id);
  else if (m.t === "modules") postMessage({t: "modules", id: m.id, names: game.modules().toJs()});      // (which of Python's own files the game has used: tools/build_stdlib.py)
};
boot().catch((e) => postMessage({t: "error", message: String((e && e.message) || e)}));
