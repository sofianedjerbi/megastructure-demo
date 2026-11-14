// Sound effects: samples rendered by music/sfx.py, built into audio/ by tools/build_audio.py, played through WebAudio.
//
// How to change things:
//   a sound itself            edit its generator in music/sfx.py, then `uv run python tools/build_audio.py`
//   what an object sounds like when placed    edit music/sfx_map.json, then rebuild
//   how loud a family is, how far sounds carry, how often one may repeat    edit SOUND below
//   the music                 music/pieces.py writes it, music/master.py mixes it, the build cuts it up; which piece plays
//                             when is TRACKS in tools/build_audio.py; how loud and how often is SOUND below
//   when a sound plays        the call sites: sfx(name, x, y) for something in the world, sfx(name) for the player or the interface
// A name that the build does not know is reported once in the console and stays silent (tests/test_audio.py catches it earlier).

const SOUND = {
  master: .8,
  music: .64,         // the music's volume (0 to turn it off). The files are at -20 LUFS: this keeps it where the old theme sat
  bossMusic: 1.4,     // the boss fight's loop, as a multiple of `music`
  firstMoment: [8, 20],   // seconds after the sound starts before the first piece
  gap: [50, 140],     // seconds of silence between two pieces (a random time in this range)
  afterFight: [20, 40],   // seconds after a fight before a piece may play again
  passes: {day: 6, night: 4},   // how many times a piece loops before it ends: about 3:30 by day, 3:50 at night
                      // ("feel free to make it loop for 3-4 min"); the loop joins are exact, nothing is heard there
  arrive: {day: 10, night: 14, boss: 2.5},   // seconds a piece takes to come in: from quiet and muffled (as if from far) to full.
                      // Long on purpose: "make the transition long enough to not be noticed by the player"
  ending: 12,         // seconds over which a piece recedes at its end (quieter and more muffled), and the boss's after a fight
  turn: [6, 12],      // seconds of silence when the hour turned during a piece (dusk, dawn): it closes on its chord, then the new hour's
  giveWay: 4,         // seconds a day or night piece takes to recede when a fight starts (the boss's piece comes in over it)
  wind: .5,           // the wind of a fall at its fastest (fallWind)
  mix: {Footsteps: .9, Work: 1, Breaking: 1, Building: 1, Items: .9, Progress: 1, Fights: 1, Animals: .9, World: .9, People: .8, Interface: .8, Boss: 1},
  hearing: 12,        // tiles: a sound in the world further than this is not heard
  quietest: .15,      // volume at the edge of hearing (it fades linearly from 1)
  panWidth: 9,        // tiles to the side at which a sound is fully left or right
  panAmount: .8,
  pitch: .04,         // random pitch spread on physical sounds, so repeats never sound stamped (tuned sounds keep their pitch)
  minGap: {default: 45, pick: 60, step: 110, tock: 110, click: 110, wade: 130, swim: 450, water: 300, orb: 30, crackle: 400, grow: 800, say: 150, rustle: 90},   // ms between plays of one sound
  maxVoices: 20,      // sounds playing at once; beyond this new ones are dropped
  loaders: 4,         // parallel downloads while warming the cache after the first gesture
};

let audio = null, soundOut = null, muted = localStorage.getItem("megastructure-muted") === "1";
const sounds = {manifest: null, loading: null, buffers: new Map(), lastVariant: {}, lastAt: {}, voices: 0, warned: new Set()};

function ac() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    soundOut = audio.createGain();
    soundOut.gain.value = SOUND.master;
    const limiter = audio.createDynamicsCompressor();      // a safety net when many sounds land together
    limiter.threshold.value = -6; limiter.ratio.value = 12; limiter.attack.value = .002; limiter.release.value = .15;
    soundOut.connect(limiter).connect(audio.destination);
  }
  return audio;
}
// start audio on the first gesture, not inside the first frame that plays a sound (creating it stalls ~100 ms)
for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, () => { if (!muted) { ac(); loadSounds(); } }, {once: true, capture: true});

// The manifest (what exists, which file, which family), then every file in the background.
function loadSounds() {
  if (!sounds.loading) sounds.loading = fetch("audio/sfx.json", {cache: "no-cache"})
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((m) => { sounds.manifest = m; startMusic(); return warmSounds(); })      // (the music's first piece with the effects, not after them)
    .catch(() => { console.info("no sound effects: run `uv run python tools/build_audio.py`"); setTimeout(() => sounds.loading = null, 15000); });
  return sounds.loading;
}
function loadSoundFile(file) {
  let entry = sounds.buffers.get(file);
  if (!entry) {
    entry = fetch(`audio/${file}?v=${sounds.manifest.version}`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((raw) => ac().decodeAudioData(raw))
      .then((buf) => { sounds.buffers.set(file, buf); return buf; })
      .catch(() => { sounds.buffers.delete(file); return null; });      // try again the next time it is wanted
    sounds.buffers.set(file, entry);
  }
  return entry;
}
async function warmSounds() {
  const files = Object.values(sounds.manifest.sounds).flatMap((s) => s.files);
  const worker = async () => { while (files.length) await loadSoundFile(files.shift()); };
  await Promise.all(Array.from({length: SOUND.loaders}, worker));
}

// The music. By day and by night a piece plays now and then, with silence between (a moment): one of the pieces the
// manifest lists for the hour (`play.day`, `play.night`), never the one before, played through `passes` times, fading
// on its last chord. While a fight is on, the boss's piece loops instead, and a moment in progress gives way.
// A piece is streamed: the build cuts it into parts of a few seconds, lossless (tools/build_audio.py), played one after
// the other to the sample, each fetched a little before its turn and let go once played. A part carries a little of its
// neighbours at both ends (`pad`): the browser resamples each part on its own, so the join is made inside sound that
// both have. Each kind is on its own gain (the effects' limiter never pumps it) and its own low-pass filter: a piece
// never starts or stops dead ("they just spawn out of nowhere"), it arrives and recedes (swell).
const music = {key: null, gain: null, on: false, at: 0, run: 0, nodes: new Map(), left: 0};       // the moment playing, if one is
const bossTrack = {key: null, gain: null, on: false, at: 0, run: 0, nodes: new Map(), left: Infinity};
const moment = {next: Infinity, last: {}};                 // next: when a piece may start (performance.now ms)
let fight = false;
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const between = ([lo, hi]) => (lo + Math.random() * (hi - lo)) * 1000;
const piece = (file) => fetch(`audio/${file}?v=${sounds.manifest.version}`)
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
  .then((raw) => ac().decodeAudioData(raw)).catch(() => null);
async function stream(tr, done) {
  const m = sounds.manifest.tracks[tr.key], a = ac(), rate = a.sampleRate, run = ++tr.run;
  for (const src of tr.nodes.keys()) src.stop();           // (what was left of it fading out)
  tr.on = true; tr.at = 0;
  if (!tr.gain) {
    tr.gain = a.createGain(); tr.gain.gain.value = 0;
    tr.far = a.createBiquadFilter(); tr.far.type = "lowpass"; tr.far.frequency.value = FAR; tr.far.Q.value = .5;
    tr.gain.connect(tr.far).connect(a.destination);
  }
  let next = 0;                                            // where the next part starts, in the context's own samples
  while (tr.on && tr.run === run) {
    const i = tr.at, buf = await piece(m.files[i]);
    if (!tr.on || tr.run !== run) return;
    if (!buf) { await pause(3000); continue; }             // (no network just now: again in a moment)
    const end = i === m.files.length - 1, len = Math.floor((end ? m.last : m.seg) * rate + 1e-6);
    if (next < (a.currentTime + .05) * rate) next = Math.ceil((a.currentTime + .15) * rate);   // the first; or late (a slow line, a sleeping tab): a gap, then on
    const src = a.createBufferSource(), starts = next / rate;
    src.buffer = buf; src.connect(tr.gain); src.start(starts, m.pad, len / rate);
    tr.nodes.set(src, {i, starts}); src.onended = () => { tr.nodes.delete(src); src.disconnect(); };
    next += len; tr.at = (i + 1) % m.files.length;
    if (end && --tr.left <= 0) {                           // its last part: fade on the last chord, then it is over
      const ends = next / rate;
      swell(tr, 0, SOUND.ending, ends - SOUND.ending);
      await pause((ends - a.currentTime) * 1000);
      if (tr.run === run) { tr.on = false; done && done(); }
      return;
    }
    while (tr.on && tr.run === run && a.currentTime < starts - 1) await pause(400);   // the one after is fetched as this one is about to play
  }
}
// A piece comes in (level > 0) or goes out (0) over `secs`, from `at` (now by default): its volume, and how muffled it
// is. Far away a sound is quiet and has lost its top; near, it is full.
const FAR = 350, NEAR = 18000;
function swell(tr, level, secs, at) {
  if (!tr.gain) return;
  const t = Math.max(at ?? 0, audio.currentTime), g = tr.gain.gain, f = tr.far.frequency;
  g.cancelScheduledValues(t); f.cancelScheduledValues(t);
  g.setTargetAtTime(level, t, secs / 3);
  f.setValueAtTime(level ? Math.min(f.value, NEAR / 2) : Math.max(f.value, FAR * 2), t);      // (from where it is, if it was already moving)
  f.exponentialRampToValueAtTime(level ? NEAR : FAR, t + secs);
}
function halt(tr, after) {                                 // stop it, `after` seconds from now (its gain fades meanwhile)
  if (!tr.on) return;
  tr.on = false; tr.run++;
  for (const src of tr.nodes.keys()) src.stop(audio.currentTime + after);
}
// A moment: is it time for a piece, and which. (Called every second, and whenever something changes.)
function moments() {
  const m = sounds.manifest;
  const hour = typeof clock !== "undefined" && clock.night ? "night" : "day";
  // Night falls (or day breaks) on a piece of the other hour: it is not cut, it plays this pass to its end and closes
  // there on its last chord, receding; after a short silence the new hour's piece comes in from far.
  if (music.on && music.hour && music.hour !== hour && !music.turned) { music.turned = true; music.left = Math.min(music.left, 1); }
  if (!audio || muted || fight || !m || !m.tracks || !SOUND.music || music.on || performance.now() < moment.next) return;
  const all = m.play[hour] || [];
  const list = all.length > 1 ? all.filter((k) => k !== moment.last[hour]) : all;
  if (!list.length) return;
  music.key = moment.last[hour] = list[Math.floor(Math.random() * list.length)];
  music.left = SOUND.passes[hour] || 1; music.hour = hour; music.turned = false;
  moment.next = Infinity;
  stream(music, () => { moment.next = performance.now() + between(music.turned ? SOUND.turn : SOUND.gap); });
  swell(music, SOUND.music, SOUND.arrive[hour]);
}
setInterval(moments, 1000);
// What should be heard now: nothing (muted: nothing is fetched either), the boss's loop (a fight is on), or the
// moments. tc: how fast the change is heard (seconds).
function tune(tc) {
  const m = sounds.manifest;
  if (!audio || !m || !m.tracks || !SOUND.music) return;
  const boss = !muted && fight && !!m.tracks[m.play.boss];
  bossTrack.key = m.play.boss;
  if (boss && !bossTrack.on) { bossTrack.left = Infinity; stream(bossTrack); swell(bossTrack, SOUND.music * SOUND.bossMusic, SOUND.arrive.boss); }
  else if (!boss && bossTrack.on) {                        // the fight is over (or sound is off): it recedes
    const out = muted ? 3 * tc : SOUND.ending;
    swell(bossTrack, 0, out); halt(bossTrack, out + 1);
  }
  if (music.on && (muted || fight)) {                      // a moment gives way: to silence, or to the fight (they cross)
    const out = muted ? 3 * tc : SOUND.giveWay;
    swell(music, 0, out); halt(music, out + .5);
  }
  if (moment.next === Infinity && !music.on) moment.next = performance.now() + (muted ? Infinity : between(fight ? SOUND.afterFight : [2, 5]));
}
const startMusic = () => { moment.next = performance.now() + between(SOUND.firstMoment); };
function bossMusic(on) {
  if (on === fight) return;
  fight = on; tune(on ? .3 : 1.3);
  if (!on && !music.on) moment.next = performance.now() + between(SOUND.afterFight);
}
// M: everything off or on. A piece that was playing fades out; sound back on, the next one comes after a few seconds.
function setMuted(on) {
  muted = on;
  localStorage.setItem("megastructure-muted", on ? "1" : "0");
  if (on) tune(.3); else { ac(); (sounds.loading || loadSounds()).then(() => tune(.3)); }
}

// Play a sound. With x, y it is in the world: quieter with distance, panned to its side, silent beyond SOUND.hearing
// (or beyond `reach` tiles when given). Without, it is the player's own or the interface's.
function sfx(name, x, y, reach) {
  if (muted) return;
  const m = sounds.manifest;
  if (!m) { loadSounds(); return; }
  const s = m.sounds[name];
  if (!s) { if (!sounds.warned.has(name)) { sounds.warned.add(name); console.warn(`sfx: unknown sound "${name}"`); } return; }
  let vol = 1, pan = 0;
  if (x !== undefined) {
    const me = myPos();
    if (!me) return;
    const dx = x - me.x, d = Math.hypot(dx, y - me.y), far = reach || SOUND.hearing;
    if (d > far) return;
    vol = Math.max(SOUND.quietest, 1 - d / far);
    pan = Math.max(-1, Math.min(1, dx / SOUND.panWidth)) * SOUND.panAmount;
  }
  const now = performance.now(), gap = SOUND.minGap[name] ?? SOUND.minGap.default;
  if (now - (sounds.lastAt[name] || -1e9) < gap || sounds.voices >= SOUND.maxVoices) return;
  let k = Math.floor(Math.random() * s.files.length);
  if (s.files.length > 1 && k === sounds.lastVariant[name]) k = (k + 1) % s.files.length;       // never the same variant twice running
  const buf = sounds.buffers.get(s.files[k]);
  if (!(buf instanceof AudioBuffer)) { loadSoundFile(s.files[k]); return; }                    // still downloading: skip this once
  sounds.lastVariant[name] = k;
  sounds.lastAt[name] = now;
  try {
    const a = ac(), src = a.createBufferSource(), g = a.createGain(), p = a.createStereoPanner();
    src.buffer = buf;
    if (s.pitch) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * SOUND.pitch;
    g.gain.value = vol * (SOUND.mix[s.category] ?? 1);
    p.pan.value = pan;
    src.connect(g).connect(p).connect(soundOut);
    sounds.voices++;
    src.onended = () => { sounds.voices--; };
    src.start();
  } catch (e) { /* audio not available yet (needs a user gesture) */ }
}

// The wind in your ears as you fall. Not a sample: it has to follow the fall and stop where you land. Noise through a
// band that rises and swells with your speed (k: 0 to 1; under 0: you are down, it dies away).
let wind = null;
function fallWind(k) {
  if (!audio || (muted && !wind)) return;
  const t = audio.currentTime;
  if (k < 0 || muted) { if (wind) { wind.gain.gain.setTargetAtTime(0, t, .03); wind.src.stop(t + .25); wind = null; } return; }
  if (!wind) {
    const buf = audio.createBuffer(1, audio.sampleRate, audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = audio.createBufferSource(), band = audio.createBiquadFilter(), gain = audio.createGain();
    src.buffer = buf; src.loop = true; band.type = "bandpass"; band.Q.value = .9; gain.gain.value = 0;
    src.connect(band).connect(gain).connect(soundOut); src.start();
    wind = {src, band, gain};
  }
  wind.band.frequency.setTargetAtTime(350 + 1500 * k, t, .04);
  wind.gain.gain.setTargetAtTime(SOUND.wind * k * k, t, .04);
}

// Something was put down: each kind of block or ground has its own sound (music/sfx_map.json).
function sfxPlaced(block, ground, x, y) {
  const m = sounds.manifest;
  if (!m) { loadSounds(); return; }
  sfx(m.place[block] || m.ground[ground] || "place", x, y);
}

// The material a tile char is made of: picks the strike and break sounds.
const WOOD_CHARS = "TUtH#+&CBhLKgWVXJeqy?!rmFpz", STONE_CHARS = "M*%Y^Z", PLANT_CHARS = "bvfQ;\"wo";
function material(c) {
  return WOOD_CHARS.includes(c) ? "wood" : STONE_CHARS.includes(c) ? "stone" : PLANT_CHARS.includes(c) ? "plant" : "soil";
}
const STRIKE = {wood: "chop", stone: "mine", plant: "rustle", soil: "dig"};      // a tool hits it
const BREAK = {wood: "snap", stone: "crumble", plant: "rustle", soil: "dig"};    // it gives way
const STEP = {n: "tock", ":": "tock", _: "click", "~": "wade", "(": "wade", "=": "wade", ")": "wade"};                  // ground char under the feet -> footstep (default: step)
const VOICE = {cow: "moo", calf: "moo", chicken: "cluck", chick: "chirp"};       // an animal's ordinary voice
const animalVoice = (kind) => VOICE[kind] || "cluck";
