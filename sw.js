// The demo's service worker: the next visit starts from this browser's own copy (the first screen at once, the world
// with no line at all). tools/build_pages.py writes the three lines below; the page asks for this file once its world
// has come (js/local.js), so what is kept here is taken from the browser's store, not fetched a second time.
//
// A new build has another BUILD: its worker installs beside the old one, keeps the new files, takes over at once
// (skipWaiting, claim) and drops the old build's. So a build is never mixed with another, and a reload after a publish
// is the new build as soon as this file has been seen (a page still at its first screen reloads by itself: local.js).
// Python is kept apart, by its own version: a new build of the game does not fetch it again. The sounds too, by theirs.
const BUILD = "89bd88b-952ebd2f0a";
const FILES = ['./', 'js/game.6bebdecc2f.js?v=952ebd2f0a', 'assets/pack.99c53f157c.bin', 'js/local_worker.js?v=952ebd2f0a', 'py.zip?v=952ebd2f0a'];                    // the build's own files: "./" (the page), its script, its pictures, the game's Python
const PYTHON = ['https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs', 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.asm.mjs', 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.asm.wasm', 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide-lock.json', 'python_stdlib.070a7ff67f.zip'];                   // Pyodide's files (another site's, or ours)

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const here = (u) => new URL(u, self.registration.scope).href;
const OURS = "nexel-" + BUILD, PY = "nexel-python-" + hash(PYTHON.join()), SOUND = "nexel-sound", PY_FILES = PYTHON.map(here);

self.addEventListener("install", (e) => e.waitUntil((async () => {
  const py = await caches.open(PY), ours = await caches.open(OURS);
  await Promise.all(PY_FILES.map(async (u) => (await py.match(u)) || py.add(new Request(u, {mode: "cors"}))));
  await ours.addAll(FILES.map((u) => new Request(here(u), {cache: u === "./" ? "no-cache" : "default"})));     // (the page: asked of the site, never an old copy)
  await self.skipWaiting();
})()));

self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith("nexel-") && ![OURS, PY, SOUND].includes(name)) await caches.delete(name);
  await self.clients.claim();
})()));

// A sound: this browser's copy if it has one; the list of them (sfx.json) from the site when there is a line, and when
// it names another version the old version's sounds are dropped.
async function sound(req) {
  const box = await caches.open(SOUND), list = new URL(req.url).pathname.endsWith("sfx.json");
  if (!list) {
    const hit = await box.match(req.url);
    if (hit) return hit;
  }
  try {
    const r = await fetch(req);
    if (r.ok && r.status === 200) {
      box.put(req.url, r.clone());
      if (list) r.clone().json().then(async (m) => { for (const k of await box.keys()) if (!k.url.endsWith("sfx.json") && !k.url.endsWith("v=" + m.version)) box.delete(k); }).catch(() => {});
    }
    return r;
  } catch (err) {
    const hit = await box.match(req.url);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url), scope = new URL(self.registration.scope);
  if (req.method !== "GET" || req.headers.has("range")) return;
  if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname + "audio/")) return e.respondWith(sound(req));
  const page = req.mode === "navigate" && (url.pathname === scope.pathname || url.pathname === scope.pathname + "index.html");
  const key = page ? here("./") : req.url;
  if (!page && !PY_FILES.includes(req.url) && !FILES.some((u) => here(u) === req.url)) return;       // (not ours to keep: the browser's own way)
  e.respondWith((async () => (await caches.match(key)) || fetch(req))());
});
