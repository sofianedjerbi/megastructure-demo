// The demo build (GitHub Pages): no server to connect to, so the real Python server runs in this tab, in a worker of
// its own (local_worker.js: the page only draws), and the two sockets are messages to it. The world is saved in
// IndexedDB, so it's still there after a reload.
// Only the Pages build loads this file (tools/build_pages.py); with a real server, openSocket() uses WebSockets.

let booted = null, worker = null, localId = 0;
const localSocks = new Map(), localSaves = new Map();

function bootLocal() {
  if (booted) return booted;
  booted = new Promise((ok, fail) => {
    worker = new Worker("js/local_worker.js", {type: "module"});
    worker.onerror = (e) => fail(new Error(e.message || "the world couldn't start"));
    worker.onmessage = (e) => {
      const m = e.data, s = localSocks.get(m.id);
      if (m.t === "say") { const c = document.getElementById("clock"); if (c) c.textContent = m.text; }
      else if (m.t === "ready") ok();
      else if (m.t === "error") fail(new Error(m.message));
      else if (m.t === "msg") { if (s && s.onmessage) s.onmessage({data: m.raw}); }
      else if (m.t === "closed") { if (s) s.closed(); }
      else if (m.t === "saved") { const done = localSaves.get(m.id); localSaves.delete(m.id); if (done) done(); }
    };
  });
  booted.then(() => {
    const save = () => new Promise((ok) => { const id = ++localId; localSaves.set(id, ok); worker.postMessage({t: "save", id}); });
    window.saveWorld = save;                         // (the worker also saves every 15 s)
    addEventListener("pagehide", save);
    addEventListener("visibilitychange", () => document.visibilityState === "hidden" && save());
  }, () => {});
  return booted;
}

// Looks enough like a WebSocket for state.js and agent.js: readyState, onopen/onmessage/onclose, send, close.
class LocalSocket {
  constructor(path) {
    this.readyState = 0; this.id = ++localId;
    bootLocal().then(() => {
      localSocks.set(this.id, this);
      worker.postMessage({t: "open", id: this.id, path});
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, (e) => { console.error(e); const c = document.getElementById("clock"); if (c) c.textContent = "couldn't start: " + e.message; });
  }
  send(raw) { if (this.readyState === 1) worker.postMessage({t: "msg", id: this.id, raw}); }
  close() { if (this.readyState === 1) worker.postMessage({t: "close", id: this.id}); }
  closed() {
    if (this.readyState === 3) return;
    this.readyState = 3; localSocks.delete(this.id);
    if (this.onclose) this.onclose();
  }
}
