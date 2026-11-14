// The demo's game server (GitHub Pages build): the real Python server under Pyodide, in a worker of its own, so the
// world ticks (and makes new land) on another core than the page that draws it. The page talks to it in messages
// (local.js): open / msg / close a socket, save. The world is saved in IndexedDB, so it's there after a reload.

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/", SAVES = "/saves";
const socks = new Map();
let game = null, sync = null, saving = false;

async function boot() {
  postMessage({t: "say", text: "loading Python…"});
  const {loadPyodide} = await import(PYODIDE + "pyodide.mjs");      // (a module worker: local.js)
  const py = await loadPyodide({indexURL: PYODIDE});
  postMessage({t: "say", text: "loading the world…"});
  const code = await fetch("../py.zip").then((r) => r.arrayBuffer());
  py.unpackArchive(code, "zip", {extractDir: "/lib/game"});
  py.FS.mkdirTree(SAVES);
  py.FS.mount(py.FS.filesystems.IDBFS, {}, SAVES);
  sync = (load) => new Promise((ok) => py.FS.syncfs(load, ok));
  await sync(true);
  py.runPython("import sys; sys.path.insert(0, '/lib/game')");
  game = py.pyimport("megastructure.browser");
  game.start(SAVES);
  setInterval(save, 15000);
  postMessage({t: "ready"});
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
};
boot().catch((e) => postMessage({t: "error", message: String((e && e.message) || e)}));
