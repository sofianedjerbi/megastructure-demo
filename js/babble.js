// Talking, the way the animals of a certain village do: a line is not one sound but a quick run of syllables, about
// one for every two letters, while the line is written out in its bubble (render.js: a letter every BABBLE.letter s).
// A syllable is the start of one of the "say" recordings (audio.js: recorded voices, nothing made up here), played
// higher or lower by the letter it stands for (each vowel has its note) and by who speaks: everyone has a voice of
// their own, from their name. A space or a comma is a breath, a question rises at its end. A shout (SHOUT) is a
// yell: higher, each syllable held longer and falling as it goes, pushed until it breaks up a little (a strained
// voice), with more of its bite, and an echo off the land after it. All of a line is put on the audio clock at once, so it keeps time whatever the frames do.
// (It was one "say" sound a line, and none for what you said yourself.)

const BABBLE = {letter: .045, every: 2, piece: .085, most: 2.7, vowel: {a: 0, e: 2, i: 4, o: -2, u: -3, y: 3}};   // s a letter; letters a syllable; s of a recording; s of talk at most; semitones
// A shout: semitones up; a syllable's length; how far it falls in pitch as it is held (semitones); how hard it is pushed
// into the breaking curve; the bite's frequency and gain (dB); its level beside talk; the echo's delay (s) and its level.
const SHOUT = {up: 5, piece: .15, fall: 3, push: 2.2, bite: [2400, 5], level: 1, echo: [.21, .25]};      // ("a bit less loud": it was 1.5, pushed at 3.2)
// What is typed in capitals is shouted: three letters or more, none of them small ("OK" and "I" are only talk).
const shouted = (line) => (line.match(/\p{L}/gu) || []).length >= 3 && line === line.toUpperCase() && line !== line.toLowerCase();
let strain = null;                                           // (the breaking curve: a soft clip)
function voiceOf(name) { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 9 - 4; }   // semitones from the recording: a third down to a third up
function babble(name, text, x, y, shout) {
  if (muted) return 0;
  const m = sounds.manifest;
  if (!m) { loadSounds(); return 0; }
  const s = m.sounds.say, me = myPos();
  if (!s) return 0;
  let vol = 1, pan = 0;
  if (x !== undefined && me) {                               // (as any sound in the world: quieter with distance, to the side it comes from)
    const dx = x - me.x, d = Math.hypot(dx, y - me.y), far = shout ? 30 : SOUND.hearing;
    if (d > far) return 0;
    vol = Math.max(SOUND.quietest, 1 - d / far); pan = Math.max(-1, Math.min(1, dx / SOUND.panWidth)) * SOUND.panAmount;
  }
  const bufs = s.files.map((f) => sounds.buffers.get(f)).filter((b) => b instanceof AudioBuffer);
  if (!bufs.length) { s.files.forEach(loadSoundFile); return 0; }      // still downloading: silent this once
  let made = 0;
  try {
    const a = ac(), t0 = a.currentTime + .02, base = voiceOf(name) + (shout ? SHOUT.up : 0), letters = [...String(text).toLowerCase()];
    const out = a.createGain(), p = a.createStereoPanner(), asks = /\?\s*$/.test(text);
    out.gain.value = vol * (SOUND.mix[s.category] ?? 1) * (shout ? SHOUT.level : .85); p.pan.value = pan; p.connect(soundOut);
    if (shout) {                                             // pushed through the curve, its bite brought up, and an echo after it
      if (!strain) { strain = new Float32Array(1024); for (let i = 0; i < 1024; i++) strain[i] = Math.tanh((i / 511.5 - 1) * SHOUT.push) / Math.tanh(SHOUT.push); }
      const hard = a.createWaveShaper(), bite = a.createBiquadFilter(), late = a.createDelay(1), back = a.createGain();
      hard.curve = strain; bite.type = "peaking"; bite.frequency.value = SHOUT.bite[0]; bite.gain.value = SHOUT.bite[1]; bite.Q.value = .9;
      late.delayTime.value = SHOUT.echo[0]; back.gain.value = SHOUT.echo[1];
      out.connect(hard).connect(bite).connect(p); bite.connect(late).connect(back).connect(p); back.connect(late);
    } else out.connect(p);
    let run = 0;
    letters.forEach((ch, i) => {
      const at = i * BABBLE.letter;
      if (at > BABBLE.most) return;
      if (!/[a-z0-9ß-ɏ]/.test(ch)) { run = 0; return; }       // a space, a comma: a breath
      if (run++ % BABBLE.every) return;
      const code = ch.charCodeAt(0), buf = bufs[code % bufs.length], last = letters.length - 1 - i;
      const semis = base + (BABBLE.vowel[ch] ?? code % 5 - 2) + (asks && last < 8 ? (8 - last) * .5 : 0);
      const rate = 2 ** (semis / 12), len = Math.min(shout ? SHOUT.piece : BABBLE.piece, buf.duration / rate - .02);
      const src = a.createBufferSource(), g = a.createGain();
      src.buffer = buf; src.playbackRate.value = rate;
      if (shout) { src.playbackRate.setValueAtTime(rate * 2 ** (1 / 12), t0 + at); src.playbackRate.exponentialRampToValueAtTime(rate * 2 ** (-SHOUT.fall / 12), t0 + at + len); }   // (a yell: up, then falling)
      g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(1, t0 + at + .006);
      g.gain.setValueAtTime(1, t0 + at + len - .025); g.gain.linearRampToValueAtTime(0, t0 + at + len);
      src.connect(g).connect(out);
      src.start(t0 + at, 0, len * rate + .01); made++;
    });
  } catch (e) { /* audio not available yet (needs a user gesture) */ }
  return made;
}
// How much of a bubble's line is written yet (s since it was said)
const written = (text, since) => text.slice(0, Math.max(0, Math.floor(since / BABBLE.letter) + 1));
