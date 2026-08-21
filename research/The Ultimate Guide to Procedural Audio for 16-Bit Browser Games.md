# The Ultimate Guide to Procedural Audio for 16-Bit Browser Games

*Third in a trilogy. Guide 1 covered procedural canvas ART; Guide 2 covered GAME DESIGN specs for AI-assisted development. This guide covers the AUDIO layer: fully asset-free sound — no .wav or .mp3 files — with every effect synthesized via the Web Audio API and all music generated procedurally or from tiny tracker-style data, in the style of 16-bit arcade and console games.*

---

## TL;DR

- **You can ship a complete 16-bit game soundscape with zero audio files.** The Web Audio API gives every browser a full synthesizer (oscillators, noise buffers, filters, envelopes, waveshapers, a compressor), and the size-coding scene (ZzFX, ZzFXM, sfxr/jsfxr, Sonant-X, SoundBox) has already proven that hundreds of bytes of parameter data produce arcade-grade SFX and multi-minute chiptunes. Adopt a ZzFX-style parameter synth for SFX and a lookahead-scheduled tracker for music.
- **Chip character is a recipe, not magic.** Genesis/Mega Drive = 4-operator FM (oscillator-modulates-oscillator-frequency) plus SN76489 square/noise PSG; SNES = sample playback softened by a Gaussian low-pass and an 8-tap echo FIR; NES = two pulses + triangle bass + LFSR noise. Each maps to a small Web Audio node graph plus a bitcrusher/echo for authenticity.
- **The AI-audio problem is real and solvable.** A coding agent cannot hear its output, so you close the loop with *measurement*: render offline (OfflineAudioContext), pull `getChannelData()`, compute RMS/peak/spectral-centroid or export a spectrogram PNG the agent can view, and describe sounds in parameter terms, not adjectives. A `sound-guide.md` plus an offline-render-and-analyze harness is the audio equivalent of your screenshot feedback loop.

---

## Key Findings

1. **Adopt the ZzFX lineage rather than reinventing it.** Frank Force's ZzFX (©2019, MIT) is a synth that is "Less than 1 kilobyte when compressed" with "20 controllable parameters," covering virtually every arcade SFX; Keith Clark's ZzFXM layers a MOD-style tracker on top whose song-generator function is **442 bytes gzipped**. This is the fastest asset-free path and it doubles as a clean, discrete parameter space an AI agent can emit and mutate.
2. **A pooled, named sound registry is the correct SFX architecture** for 60fps gameplay — pre-render each sound to an AudioBuffer, keep a small pool of voices per sound, cycle through them, and add micro playback-rate variation to avoid "machine-gun" repetition.
3. **Adaptive music is two techniques:** vertical re-orchestration (layer stems in/out — Banjo-Kazooie's model, ideal for restaurant lunch-rush intensity) and horizontal re-sequencing (swap sections — ideal for a police-chase escalation). Both need Chris Wilson's lookahead scheduler ("A Tale of Two Clocks") to stay tight against the audio clock.
4. **Chip authenticity comes from the artifacts, not just the waveforms** — the Gaussian muffling and echo of the SNES, the "ladder effect" crossover distortion of the YM2612, the LFSR periodicity of PSG noise. A `WaveShaperNode` + a downsampling bitcrusher (best as an `AudioWorklet`) + a feedback delay recreate most of the character.
5. **The critical AI workflow gap is verification, not generation.** Agents can already write Web Audio graphs; what they lack is ears. The closed loop is "state the target → generate → **measure** → decide again," implemented with OfflineAudioContext rendering plus a JS FFT or an audio-analysis MCP server.

---

## Details

### 1. Web Audio API synthesis fundamentals for game SFX

The whole API hangs off one object. Create it **once** and route everything through a master chain:

```js
const actx = new (window.AudioContext || window.webkitAudioContext)();
const master = actx.createGain();
const comp = actx.createDynamicsCompressor(); // glue + clip protection
master.connect(comp).connect(actx.destination);
master.gain.value = 0.7;
```

**Oscillators + gain envelopes (ADSR).** Every tonal SFX is an `OscillatorNode` whose amplitude is shaped by a `GainNode` using AudioParam automation. The canonical ADSR uses `setValueAtTime` → `linearRampToValueAtTime` (attack) → ramp to sustain → `exponentialRampToValueAtTime` toward (but never exactly) zero on release (exponential ramps can't target 0). MDN's "Advanced techniques" and the dobrian/Chris-Lowis envelope tutorials show the pattern. Keep attacks ≥ ~5 ms to avoid click transients (ZzFX hard-codes a tiny 9-sample attack floor for exactly this reason: `e = R*e + 9`).

**Frequency sweeps** are the arcade vocabulary for lasers/jumps/pickups: automate `oscillator.frequency` with a ramp. A rising 440→880 Hz over 100 ms reads as a jump; a falling saw 200→50 Hz over 80 ms reads as a hit; a coin is two short ascending tones (e.g., 660 then 880 Hz, ~50 ms each).

**Noise generation.** There is no noise oscillator; you fill an `AudioBuffer` with random samples and play it via an `AudioBufferSourceNode`:

```js
function noiseBuffer(seconds = 1) {
  const len = actx.sampleRate * seconds;
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; // white
  return buf;
}
```

White noise through a **downward-sweeping low-pass** `BiquadFilterNode` is an explosion; short and band-passed is a snare or a sizzle; looped and gently filtered is a crowd murmur or an engine hiss. Pink noise (−3 dB/octave) sounds warmer and is generated with a small IIR (the Paul Kellet filter) or by low-passing white noise.

**Distortion / waveshaping.** `WaveShaperNode` applies a non-linear transfer curve (a sigmoid/`tanh`-style curve is standard, per MDN — "Sigmoid functions are commonly used for distortion curves… their S-shape helps create a smoother sounding result") — good for grit, for fattening a bass, and (below) for emulating the YM2612's crossover distortion. **Bit-crushing** (sample-rate + bit-depth reduction) is the chiptune lo-fi effect; the cleanest implementation is an `AudioWorkletProcessor` (Google's web-audio-samples ships a canonical `bit-crusher` worklet) that holds each sample for N frames and quantizes to fewer levels.

**AudioContext management is non-negotiable on the web.** Autoplay policies start the context `suspended`; you must `resume()` inside a user-gesture handler (`touchstart`/`mousedown`/`keydown`). Boilerplate (after Matt Montag):

```js
function unlock() {
  if (actx.state === 'suspended') actx.resume();
  ['touchstart','touchend','mousedown','keydown']
    .forEach(e => document.body.removeEventListener(e, unlock));
}
['touchstart','touchend','mousedown','keydown']
  .forEach(e => document.body.addEventListener(e, unlock, false));
```

**Latency and 60fps scheduling.** Don't create-and-throw nodes carelessly, but oscillators/buffer sources are cheap and *must* be one-shot (you cannot restart a stopped source). For gameplay, **pre-render** each SFX to a buffer at load and **pool** buffer-source voices (see §9b). Never gate SFX on `requestAnimationFrame` timing; schedule with `actx.currentTime + offset` so audio stays sample-accurate even if a frame drops.

### 2. The ZzFX lineage and the size-coding audio ecosystem

**ZzFX** ("Zuper Zmall Zound Zynth," Frank Force, ©2019, MIT) is the anchor. Its own README states: "Compact: Less than 1 kilobyte when compressed! Versatile: 20 controllable parameters for diverse sound effects." It is a single function taking those ~20 positional numeric parameters — volume, randomness, frequency, attack, sustain, release, shape (sine/tri/saw/tan/noise), shape curve, slide, delta-slide, pitch jump, pitch-jump time, repeat time, noise, modulation, bit-crush, delay, sustain-volume, decay, tremolo — synthesizing a mono `AudioBuffer` on the fly and playing it. A sound is literally a line like `zzfx(...[,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17])` (a game-over jingle). The current micro build is v1.3.2. Because ZzFX renders into an AudioBuffer, you can *precache* every sound and play instantly.

**ZzFXM** (Keith Clark + Frank Force, 2020) turns ZzFX into instruments for a MOD-style music renderer. Song data is `[instruments, patterns, sequence, BPM]`. Clark split ZzFX into `zzfxG` (generate samples) and `zzfxP` (play), and switched from real-time note triggering to rendering the entire song to one stereo buffer for CPU efficiency; a clever trick packs note + attenuation into a single number (integer part = note index, decimal = volume scale). The renderer page reports the **"ZzFXM song generator function — 442 bytes (gzip),"** and that rendered songs, "Once gzipped they're tiny — typically, a few hundred bytes." You can author in MilkyTracker/Bassoon Tracker and convert MOD→ZzFXM, or generate patterns procedurally. Its stored format looks like:

```js
const songData = [ [/* zzfx instruments */], [/* patterns */], [/* sequence */], /* BPM */ ];
const buffer = zzfxM(...songData);   // render to stereo sample data
const node   = zzfxP(...buffer);     // returns an AudioBufferSourceNode you can stop/loop
```

**The sfxr heritage.** Dr. Petter (Tomas Pettersson) released **sfxr** on 2007-12-14 for Ludum Dare 48 #10 (©2007 Tomas Pettersson, MIT) — an "MS Paint for sound effects" with 4 oscillator types, ~22 parameters, and generator buttons: "Pickup/coin, laser/shoot, explosion, powerup, hit/hurt, jump and blip/select." Its parameter model (`p_env_attack`, `p_env_sustain`, `p_base_freq`, `p_freq_ramp`, `p_duty`, `p_lpf_freq`, arpeggio/`p_arp_mod`, vibrato, phaser) became a lingua franca. Lineage: sfxr → **as3sfxr** (Tom Vian, Flash) → **Bfxr** (increpare) → **jsfxr** (Eric Fredricksen; Markus Neubrand's ~2.5 KB js13k port; maintained by Chris McCormick at sfxr.me) and **jfxr**. jsfxr generates a data-URI WAV or an AudioBuffer from a JSON/array param set and exposes `pickupCoin`, `laserShoot`, `explosion`, `powerUp`, `hitHurt`, `jump`, `blipSelect` presets plus `params.mutate()`.

**Other tiny synths worth knowing:** **Sonant-X** (Nicolas Vanhoren's fork of Marcus Geelnard's js-sonant, itself a port of Jake Taylor's C "Sonant") — an 8-track synth where each track is an instrument (two oscillators, ADSR, filter, LFO, delay/pan) plus patterns; Vanhoren built it specifically to add *music* (not just SFX) to js13k games, and it's used in Underrun, Voidcall, Q1k3. **SoundBox** (Marcus Geelnard/Bits'n'Bites) — a browser tracker whose minimal `player-small.js` is zlib-licensed for embedding (4K/8K demos), with four note tracks per pattern for chords and an effects track. **TinyMusic** (Web Audio sequencer). The js13kGames `resources` repo is the canonical index of all of these.

**js13k postmortems** confirm the playbook: Frank Force's *Bounce Back* used ZzFX for all 16 SFX (re-triggering the coin at a higher pitch for flourish) and an early ZzFX-for-music experiment (kick/hi-hat/synth on a half-second step sequencer with randomness); *Cat Survivors* (2025) used ZZFX for SFX, tried and rejected ChatGPT/DeepSeek for music, then wrote a random A-major pattern melody generator with a drum machine — and floated "use ZZFX-generated samples as instruments for procedural music" as a future optimization; 7 Ton Shark's *Ashes of Ulthar* (2025) used SoundBox for music/trills but noted SoundBox struggles with ZzFX-style "jump/shoot" transients.

### 3. Recreating 16-bit sound-chip character in Web Audio

**Sega Genesis / Mega Drive — Yamaha YM2612 (FM) + TI SN76489 (PSG).** The YM2612 is a six-channel, four-operator FM synth; each channel's four operators (each = a sine phase generator + ADSR envelope) combine according to one of **eight algorithms** — from "four independent sines" (algorithm 7) to a single long modulator→carrier stack (algorithm 0). Operators can self-feedback. Its signature grit is the **"ladder effect,"** a crossover distortion in the DAC. As jsgroth's emulation series documents: "The YM2612's DAC introduces a form of crossover distortion into its output, commonly known as the 'ladder effect'… a large non-linear jump between -1 and 0… the output level gap between samples -1 and 0 is actually eight times what it would be if the DAC was completely linear." (The term was coined by SpritesMind user HardWareMan; the cleaner CMOS YM3438 lacks it.) Channel 6 can double as an 8-bit PCM channel.

*Web Audio approach:* FM is native — connect a **modulator** oscillator's output through a gain (the modulation index) into a **carrier** oscillator's `frequency` AudioParam:

```js
function fmVoice(carHz, ratio, index, dur) {
  const car = actx.createOscillator(), mod = actx.createOscillator();
  const modGain = actx.createGain(), amp = actx.createGain();
  car.frequency.value = carHz;
  mod.frequency.value = carHz * ratio;      // operator "multiple"
  modGain.gain.value = carHz * index;       // FM depth = brightness
  mod.connect(modGain).connect(car.frequency);
  car.connect(amp).connect(master);
  // ...ADSR on amp.gain and optionally on modGain (FM decay = tone darkens)
  car.start(); mod.start();
}
```

A ratio of 1–3 with an *envelope on the modulation index* gives the classic FM electric-bass/brass "pluck that darkens." For authenticity, add a light `WaveShaperNode` (mild odd-harmonic curve) to emulate the ladder distortion. For cycle-accurate emulation, **apollolux/ym2612-js** ports the Genesis Plus GX core to JS; jsgroth's multi-part "Emulating the YM2612" blog documents the phase/envelope generators register-by-register. The **SN76489** is three square channels + one LFSR noise channel; recreate with `type:'square'` oscillators and an LFSR-driven noise buffer. Note the PSG's practical noise character comes from its short 15-bit LFSR (periodic, "buzzy") vs. a true-random `Math.random()` buffer — for authenticity, generate the buffer with an actual LFSR (new bit = bit0 XOR bit3 in white-noise mode).

**SNES — S-SMP (SPC700 CPU + S-DSP).** Sample-based: eight voices, each reading **BRR-compressed** samples (an ADPCM form, 32:9 ratio — sixteen 16-bit PCM samples → a 9-byte block), pitched via **4-point Gaussian interpolation** (which *deliberately dulls high frequencies* and covers quantization noise), shaped by ADSR/GAIN, and summed to 32 kHz stereo through an **8-tap FIR echo** unit that uses part of the 64 KB ARAM as a feedback buffer. That muffled-but-lush signature = Gaussian low-pass + echo/reverb. (SNES composers often pre-emphasized treble before encoding to fight the Gaussian roll-off.)

*Web Audio approach:* you don't have BRR, but you can *evoke* the SNES: take any synthesized instrument, run it through a gentle `BiquadFilterNode` low-pass (~8–12 kHz, emulating Gaussian roll-off), optionally a mild bitcrusher (BRR is lossy 4-bit ADPCM), and a **feedback delay** (a `DelayNode` → `GainNode`(feedback <1) → back to delay, plus a low-pass in the loop to mimic the FIR coloration) for the characteristic echo. Add a pre-emphasis treble bump before the low-pass if you want the "bright sample" trick.

**NES — 2A03 (for comparison).** Two pulse channels (variable duty 12.5/25/50/75%, with a sweep unit), one 4-bit **triangle** channel (the bassline, no volume control), one **LFSR noise** channel, and DPCM. Recreate pulses with band-limited square/`PeriodicWave` oscillators (duty via `createPeriodicWave`), triangle with `type:'triangle'`, noise with the LFSR buffer. Matt Montag's Nintendo VST notes the practical detail that naive squares alias — his build sums band-limited saws or uses `PeriodicWave`/BLIP-style construction to stay clean.

**Libraries to study:** apollolux/ym2612-js, libymfm.wasm (VGM/chip playback via WASM) for reference timbres, and NES engines (e.g., bobbicodes' NES music engine) that faithfully model pulse/triangle/LFSR-noise.

### 4. Procedural chiptune music composition

**Channel allocation mirrors the hardware constraint** and is the single most important compositional discipline. Allocate roughly: **bass** (one channel, triangle/FM-bass), **lead melody** (one pulse/square/FM voice), **harmony/arpeggio** (one channel), **percussion** (noise channel). With only 3–4 voices you cannot hold chords, so chiptune uses **arpeggios as chord substitutes**: cycle a channel through chord tones at 1/32–1/64 speed so the ear fuses them into a chord ("chiptune chords" — MusicRadar's tutorial recommends 1/64-note arps synced to tempo). Early composers also faked echoes/polyphony with extra delayed notes ("MIDI delay").

**Tracker-style sequencing in JS.** Store music as compact arrays: instruments, patterns (rows of note+instrument+volume), a sequence of pattern indices, and a BPM — exactly the ZzFXM/MOD model. Rows are stepped by the scheduler; a note is a MIDI number (or index into a scale) mapped to frequency by `440 * 2**((n-69)/12)`.

**Generative / procedural approaches.** Three tiers of increasing structure:
- **Seeded RNG melodies over a fixed scale/chord loop** — the pragmatic js13k choice (Cat Survivors generated random patterns constrained to A-major). Use a small seeded PRNG (mulberry32) so a given seed reproduces a track; constrain note choices to the current chord's tones + passing tones.
- **Markov chains** — build a first-order transition matrix over scale degrees (optionally *blended* between a "general" matrix and a seed-song matrix, `P = (1−α)·P_general + α·P_seed`, as in academic melody-generation work), and constrain the per-beat note pool to the active chord so the melody always fits the harmony. A "one-note-max" repair (nudge ±1 semitone when stuck) keeps lines continuous.
- **Constraint-based** — generate rhythm and pitch separately; pick the number of notes per bar, then fill pitches from the chord/scale with weighting toward stepwise motion and resolution on section boundaries.

**Dynamic / adaptive music** (the payoff for all three of your games):
- **Vertical re-orchestration (layering):** compose all stems on the same grid; mute/unmute (crossfade gains) layers by game state. This is the Banjo-Kazooie model (Splice: "different layers of a piece of music weave in and out of the overall arrangement based on gameplay behavior"). *Restaurant sim lunch rush:* start with bass+drums; fade in a busy arpeggio and a countermelody as order-queue length rises; strip back as it clears. Because every layer shares the grid, transitions are seamless.
- **Horizontal re-sequencing:** swap which pattern the sequencer jumps to next, at bar boundaries, based on state (White Rose thesis: "stopping an existing track, and starting a new one," slicing music into segments with entry/exit points). *Driving game police chase:* "cruise" section → "chase" section (faster, minor, added noise-drum) when heat crosses a threshold, resolving on a shared cadence. Lower memory (one section at a time) but transitions are less fluid than layering.
- Combine both, as racing franchises like Forza do, to spin long non-repetitive scores from few elements.

**Timing: use the lookahead scheduler.** Chris Wilson's "A Tale of Two Clocks" (web.dev) is the required reading: JS timers (`setTimeout`) are jittery and throttle in background tabs, while `actx.currentTime` is sample-accurate. The pattern: a `setTimeout` "check" every ~25 ms looks ~100 ms into the future and schedules any notes falling in that window with precise `when` timestamps, so tempo stays rock-solid even under frame drops.

```js
let nextNoteTime = actx.currentTime, current = 0;
const lookahead = 0.1, tick = 0.025;
function scheduler() {
  while (nextNoteTime < actx.currentTime + lookahead) {
    scheduleNote(current, nextNoteTime);      // fire voices with when=nextNoteTime
    nextNoteTime += 60 / bpm / 4;             // 16th notes
    current = (current + 1) % patternLength;
  }
  setTimeout(scheduler, tick * 1000);
}
```

For pure loops, Joe Sullivan's "A Tale of No Clocks" alternative renders a loop once in an `OfflineAudioContext` and loops the buffer, eliminating ongoing UI-thread work — useful for a fixed ambient bed.

### 5. Sound-design vocabulary for the three game types

**Arcade driving game (APB-inspired).** *Engine loop:* one or two detuned saw/pulse oscillators whose frequency is mapped to speed/RPM (`freq = base + speed * k`), plus a filtered-noise layer for air/tire hiss, all summed and looped; modulate a low-pass cutoff with throttle. *Siren:* a slow triangle-LFO sweeping an oscillator between two pitches (or two alternating tones). *Skid:* band-passed noise with a resonant peak, pitch bending down as the car slows. *Crash:* white-noise burst → fast low-pass sweep + a low sine "thud," optionally waveshaped. *Backfire:* a very short noise+square impulse. Escalation: raise engine base pitch, add siren layer, and switch music to the "chase" section together for a coherent police-chase spike.

**Restaurant sim + arcade mini-games (Taco Shop 2000).** *Sizzle:* looped white/pink noise through a high-ish band-pass, gently modulated — layer more voices as the grill fills. *Chop:* short filtered-noise transient + a tiny pitched click. *Register ding / order-up bell:* two bright sine/FM partials with a fast attack and long decay (a "positive feedback" chime — reward the player's ear). *Crowd murmur:* very low-passed looped noise with slow amplitude wobble; raise its gain with occupancy. *UI feedback:* short blips (square, 20–40 ms) — ascending for confirm, descending for cancel/error. The mini-games reuse the arcade vocabulary (coin, powerup, hit) from ZzFX/sfxr presets directly.

**Narrative adventure.** *Ambient beds:* slow evolving pads (detuned triangles + long reverb/echo, low-passed) that shift with location — a horizontal-resequencing candidate. *Dialogue blips (Animal Crossing / Undertale / Banjo-Kazooie speech squeaks):* the classic technique is one short synth note played per character as text prints, its **pitch offset per character** to give each a "voice." Animal Crossing's "Animalese" strings together per-letter sounds and links pitch to species/body size (bigger = lower); Undertale blips are essentially "one note on a synthesizer" per glyph. In Web Audio: on each printed glyph, fire a tiny ZzFX/oscillator blip; vary base frequency per speaker, and optionally map the blip pitch to the letter for a pseudo-Animalese babble. Skip blips on spaces/punctuation. *Stingers:* short non-looping musical phrases fired on story beats (discovery, danger, item) that duck the ambient bed.

**How arcade games design feedback:** positive events get **ascending pitch and bright timbre** (coins, powerups); danger gets **descending pitch, noise, and dissonance**; escalating tension is signaled by rising tempo/pitch and added layers. Reserve the brightest, most consonant sounds for scoring so the mix teaches the player what's good.

### 6. AI-assisted audio workflow — directing an agent that cannot hear

This is the section with the least prior art, so it's worth stating the core problem precisely. As audio engineer Giovanni Cordova puts it, an AI agent "can act, and it can process. Here is what it cannot do: hear. A language model has no ears… That missing link is measurement. Give an agent a way to measure audio and report back in numbers it can reason over, and the loop closes: state the target, process, measure, decide again."

That is the audio analogue of your screenshot loop. Four practical layers:

**(a) Generate in a discrete parameter space.** Have the agent emit ZzFX arrays or jsfxr JSON, not raw sample math — the parameters (`p_base_freq`, `p_freq_ramp`, `p_env_attack`, `wave_type`, ZzFX shape/slide/noise) are self-documenting and mutatable, and there are CLI renderers (`sfxr-to-wav`) for offline analysis. This is what real Claude-Code audio skills already do (e.g., OpusGameLabs' "add-audio" skill writes procedural oscillator/gain SFX — "Everything is procedural oscillators and gain nodes") — but note those skills ship *without* a verification loop, which is exactly the gap to fill.

**(b) Render offline, then measure — the feedback loop.** Render the agent's graph headlessly with `OfflineAudioContext` (in Node, the `web-audio-api` npm polyfill runs `OfflineAudioContext` "without speakers," faster than real time), then pull `getChannelData()` and compute numbers the agent can read:
- **RMS** (loudness), **peak/true-peak** (clip check), **zero-crossing rate** (noisiness/pitch proxy), **spectral centroid** (brightness), **rolloff**, **bandwidth**, and per-band energy (sub-bass → brilliance).
- Crucially, do **not** rely on a live `AnalyserNode` for deterministic comparison — Chris Wilson (W3C, 2013) warned it's "a very bad way to get any kind of predictable testing results… OfflineAudioContext is probably best." The built-in FFT is only reachable via the live AnalyserNode (and doesn't run inside an OfflineAudioContext), so for offline buffers you run a **JS FFT** on the rendered samples. As Christoph Guttandin (Media Codings) documents: "There is an FFT implementation in every implementation of the Web Audio API, however you can't access it directly… It's meant to be used with live data. If you need to apply an FFT there is no other option but relying on a JavaScript implementation."

**(c) Give the agent eyes on the sound.** Two modalities exist in the wild:
- **Numeric text report** the model reads directly. Purpose-built MCP servers do exactly this: `audio-analyzer-rs` ("LLMs can see (vision) and read (text), but they can't hear… returns structured numerical data that Claude can reason about… No spectrograms, no images, no wasted tokens" — emitting centroid/bandwidth/rolloff/flatness/RMS/ZCR + 7-band energy + MFCCs); `zachswift615/audio-analysis-mcp` adds a **`compare` tool** that diffs two files → `{identical, max_diff, rms_diff, pct_change}`, ideal for target-vs-generated iteration; `sletz/faust-mcp` returns RMS/peak plus an **ASCII waveform** inline (`"waveform_ascii": "#######…"`).
- **Spectrogram / waveform PNG** the model views with vision. Export via `librosa.display.specshow` + `savefig` (Python side) or the MCP image tools; the CHI-2024 "Sound Designer–Generative AI Interactions" study (ACM) found designers used spectrograms as the shared visual language with generative audio ("I can read the spectrograms well enough to know that… spectrograms were helpful in kind of building out what the goal was"). Caveat: PNG export is comparatively slow (a documented librosa perf issue), so prefer numeric reports in tight loops and reserve spectrograms for milestones.

**(d) Describe in parameter terms, run human A/B for taste.** Cordova's split applies: numeric targets (loudness, peak, centroid, duration) the agent can own; subjective qualities ("more presence, less mud") stay human calls via A/B. Danielrosehill's Claude audio-production plugin literally implements "listen to 15s A/B variants… iterate based on your feedback ('more presence', 'less mud')… until you're happy, then save the winner." The InverSynth line of research (spectrogram→synth-parameter inversion) shows why parameter space is the right substrate for machine iteration.

**A `sound-guide.md`-driven prompt loop** (parallels your `style-guide.md`): the agent reads the guide → emits parameter arrays → your harness renders offline and prints a JSON metrics report (and optionally a spectrogram path) → the agent compares against the guide's target ranges and iterates → you do a final human A/B. Real first-person accounts of Claude Code writing Web Audio synthesis (e.g., Chris Raible's "Making music with Claude Code and the AudioContext web audio API": "Claude synthesized a sound effect for me in JavaScript, using the AudioContext interface") confirm the generation half already works well; adding (b)+(c) supplies the missing verification half.

### 7. Mixing and polish for browser games

- **Gain staging:** one `masterGain`, plus sub-buses `musicGain` and `sfxGain`, each feeding master. Expose all three to a settings UI (music/SFX/master sliders + mute).
- **Compression/limiting:** put a `DynamicsCompressorNode` as the last node before `destination` — web.dev's game-audio guide recommends this exactly, since "you don't know exactly what sounds will play and when"; per the spec it "lowers the volume of the loudest parts of the signal and raises the volume of the softest parts," preventing clipping when many SFX stack.
- **Ducking (music under SFX/dialogue):** the Web Audio `DynamicsCompressorNode` still lacks true sidechaining (a long-standing spec gap; `reduction` is read-only), so **fake it**: on an important SFX/stinger/dialogue event, ramp `musicGain.gain` down (e.g., to 0.3 over 80 ms) and back up over ~300 ms with `setTargetAtTime`. Trigger from the same code that fires the SFX.
- **Frequency slotting:** keep music's midrange clear so SFX cut through — e.g., high-pass your SFX bus lightly and avoid piling SFX energy in the bass where the music's bass lives; give UI blips a bright band nothing else occupies.
- **Volume/mute UX:** persist settings to `localStorage`; provide a global mute; start music at a modest default (0.5–0.7) since synthesized square/saw content is harsh at full scale.
- **Mobile / iOS quirks:** iOS honors the hardware mute switch for **Web Audio** (but not for `<audio>` elements), so a muted phone kills your game sound; the common fix (swevans/unmute, feross/unmute-ios-audio) plays a short silent `<audio>`/AudioContext clip on first interaction to route Web Audio onto the media channel. This behavior changed between iOS 12 and 13 (Jeremy Keith documented the flip-flops), so test on real devices; also resume on `visibilitychange`, and expect the context to start suspended until a gesture.

### 8. Case studies

- **Frank Force — *Bounce Back* (js13k) & LittleJS.** ZzFX for all 16 SFX (with a re-triggered higher-pitch coin for flourish) and an early ZzFX-driven music loop (kick/hi-hat/synth on a stepped sequencer with randomness). ZzFX originated as a JS1k demo and is built into Force's LittleJS engine, demonstrating the "SFX system as engine primitive" pattern. Force also noted "several other people used ZzFX in their js13k games with amazing results."
- **ZzFXM demo songs (Keith Clark).** MOD conversions (e.g., "Popcorn," "Sanxion") rendering 2–3 minutes of stereo music in a few hundred bytes gzipped, with a 442-byte generator — proof that tracker data + a tiny synth beats audio files on size by orders of magnitude.
- **Sonant-X in Underrun / Voidcall / Q1k3 (Phoboslab) and SoundBox 4K demos (Bits'n'Bites' *SWAY*).** Phoboslab's "Synthesizing Music from JSON" documents condensing the Sonant lineage across multiple 13K/high-impact games — the JSON-instrument + pattern model in production ("It gives you 8 tracks, where each track has its own 'instrument'… out comes the music").
- **Cat Survivors (js13k 2025)** and **Ashes of Ulthar (js13k 2025)** postmortems: candid accounts of ZZFX for SFX, the failure of LLM-generated *music* audio, hand-rolled constrained-random melody generation, and SoundBox's strengths (trills/beats) vs. weaknesses (transient SFX) — the honest state of the art for tiny procedural audio.

### 9. Practical appendix

**(a) `sound-guide.md` template** (parallels your art `style-guide.md`):

```md
# SOUND-GUIDE.md — asset-free audio contract
## Mandate
- NO audio files. All SFX via a ZzFX-style param synth; all music via tracker data + lookahead scheduler.
- Everything routes through master → compressor → destination. Sub-buses: musicGain, sfxGain.

## Channel / voice allocation (per the 3-4 channel constraint)
- BASS: triangle/FM-bass, one voice.   LEAD: pulse/FM, one voice.
- HARMONY/ARP: one voice (arpeggiate chords, never sustain them).
- PERC: LFSR-noise voice.

## Timbre definitions (by name → params)
- "coin":     ascending 2-tone square, 50ms each, bright.  ZzFX shape=0.
- "engine":   detuned saw x2, freq = 60 + speed*1.2, +filtered-noise hiss.
- "sizzle":   pink noise, bandpass 2-4kHz, loop, gain scales with grill load.
- "blip.npcA":short square 30ms, baseFreq 520Hz (per-speaker pitch offset).

## Envelope conventions
- Attack >= 5ms (no clicks). Release via exponentialRamp toward 0.001, never 0.
- Positive events: ascending pitch + consonance. Danger: descending + noise.

## Mix rules
- Master default 0.7; music 0.5; sfx 0.8. Ducking: music -> 0.3 on stinger, recover 300ms.
- SFX lightly high-passed; keep bass slot for music. Compressor last.

## Chip character targets
- Genesis feel: FM (mod->carrier.frequency) + mild waveshaper (ladder).
- SNES feel: lowpass ~10kHz (Gaussian) + feedback delay (8-tap echo) + light bitcrush.

## Cross-refs
- Event→cue map lives in GAME_DESIGN.md (§ Audio Cues). CLAUDE.md points here.
```

**(b) Minimal `sfx.js` architecture** (ZzFX-style synth + named, pooled registry — adapting Jack Rugile's "Arcade Audio for js13kGames" pooling pattern):

```js
// tiny param synth (adopt ZzFX's zzfxG/zzfxP or your own) renders a sound -> AudioBuffer
const registry = {}; // name -> { buffer, count, tick }
function defineSound(name, params, count = 4) {
  registry[name] = { buffer: renderToBuffer(params), count, tick: 0 };
}
function play(name, {rate = 1, gain = 1} = {}) {
  const s = registry[name]; if (!s) return;
  const src = actx.createBufferSource(), g = actx.createGain();
  src.buffer = s.buffer;
  src.playbackRate.value = rate * (0.95 + Math.random() * 0.1); // anti-repetition
  g.gain.value = gain;
  src.connect(g).connect(sfxGain);
  src.start();
  s.tick = (s.tick + 1) % s.count; // cycle voices to avoid cutting off in-flight sounds
}
```

**(c) Minimal `music.js` architecture** (lookahead scheduler + pattern data + adaptive layers):

```js
const song = { bpm: 132, patterns: [...], sequence: [...], layers: {bass:1, arp:0, lead:0, perc:1} };
let nextNoteTime = 0, step = 0, seqIndex = 0;
function setIntensity(x) { // 0..1 vertical re-orchestration
  layerGain.arp.gain.setTargetAtTime(x > .3 ? 1 : 0, actx.currentTime, .2);
  layerGain.lead.gain.setTargetAtTime(x > .6 ? 1 : 0, actx.currentTime, .2);
}
function scheduleStep(t) {
  const pat = song.patterns[song.sequence[seqIndex]];
  for (const ch of ['bass','arp','lead','perc']) {
    const note = pat[ch][step];
    if (note && song.layers[ch]) triggerVoice(ch, note, t); // routes via layerGain[ch]
  }
}
function scheduler() {
  while (nextNoteTime < actx.currentTime + 0.1) {
    scheduleStep(nextNoteTime);
    nextNoteTime += 60 / song.bpm / 4;
    if (++step >= 16) { step = 0; seqIndex = (seqIndex + 1) % song.sequence.length; }
  }
  setTimeout(scheduler, 25);
}
// horizontal re-sequencing: on state change, set the NEXT seqIndex to a different section at bar end.
```

**(d) Prompting patterns for Claude Code on audio** (the offline-render-and-analyze loop):

1. *Contract first:* "Read `sound-guide.md`. Emit only ZzFX parameter arrays / jsfxr JSON. Do not use audio files."
2. *Generate:* "Create `coin`, `hit`, `engine`, `sizzle`, `blip.npcA` per the timbre table. Output a JS object of param arrays."
3. *Render + measure (your harness, not the model):* run `node analyze.js` → renders each via OfflineAudioContext, prints per-sound `{rms, peak, centroidHz, zcr, durationMs}`, writes `spectrogram/<name>.png`.
4. *Iterate on numbers:* "Here are metrics vs targets. `coin` centroid is 1.8 kHz but the guide wants ≥3 kHz and ascending; raise `p_base_freq`/shape and re-emit." Use an `audio-analysis-mcp`-style `compare` for target-vs-generated `pct_change`.
5. *Human A/B for taste* on shortlisted variants; commit the winner's params to `sounds.js`.
6. *Rule of thumb:* keep the model in **parameter/number space** in the loop; only surface spectrogram PNGs at milestones (they're token-heavy and slow to render).

**(e) Cross-referencing.** `GAME_DESIGN.md` holds the **event→cue map** (e.g., `orderComplete → play('registerDing'); heat>0.7 → music.setSection('chase')`); `sound-guide.md` defines *how each named cue sounds*; `CLAUDE.md` instructs the agent to consult both and to run the render-and-analyze harness before claiming a sound is done. This mirrors how your art `style-guide.md` and screenshot loop already work — same discipline, ears replaced by measurement.

---

## Recommendations

**Stage 1 — Stand up the asset-free spine (day 1).** Drop in ZzFX (SFX) + ZzFXM (music) or Sonant-X; wire the master → sub-bus → compressor chain; implement the gesture-unlock and the iOS unmute shim. Benchmark: a coin, a hit, and a looping 30-second track all play from code, zero files, on desktop Chrome and iOS Safari. If iOS is silent with the mute switch on, add the silent-`<audio>` unmute trick before proceeding.

**Stage 2 — Build the registry + scheduler (days 2–3).** Implement `sfx.js` (pooled, named, playback-rate-varied) and `music.js` (lookahead scheduler + pattern data). Benchmark: 20 overlapping SFX at 60fps with no clicks or dropouts; music tempo stays tight while the game loop is under load. If you hear timing drift, you're scheduling off `requestAnimationFrame` instead of `actx.currentTime` — fix that first.

**Stage 3 — Layer in chip character + adaptivity (days 4–6).** Add the FM voice + waveshaper (Genesis), the low-pass+echo+bitcrush chain (SNES), and one adaptive system per game (restaurant vertical layering; driving horizontal re-sequencing). Benchmark: intensity ramps are audible and seamless; A/B the chip-character chain on/off and keep it only where it improves the feel.

**Stage 4 — Wire the AI feedback loop (ongoing).** Write `sound-guide.md`, add `analyze.js` (OfflineAudioContext render → JSON metrics + optional spectrogram), and adopt an audio-analysis MCP if you want the agent to self-check. Benchmark: Claude Code can iterate a sound to hit a target centroid/RMS/duration **without you listening** until the final A/B. This is the milestone that makes agent-authored audio trustworthy.

**Thresholds that change the plan:** if total audio code+data threatens your size budget, drop to ZzFX-only and generate music from ZzFX instruments (the Cat Survivors idea). If you need richer instruments than ZzFX, move to Sonant-X/SoundBox. If you need cycle-accurate Genesis timbres (not just "FM-ish"), pull in apollolux/ym2612-js or a libymfm.wasm build rather than hand-tuning operators.

## Caveats

- **Generative *music* from LLMs is still weak.** Multiple js13k postmortems report LLM-generated music sounded "awful"; constrained-random or Markov generators over a fixed scale/chord loop remain the reliable procedural route. Use AI to write the *generator and the synth params*, not to compose the melody wholesale.
- **"Chip character" in Web Audio is evocation, not emulation.** Oscillator-FM + waveshaper approximates the YM2612 but is not the ladder DAC; a low-pass + echo evokes the SNES but there's no real BRR/Gaussian path. For authenticity-critical work, use an actual chip emulator core (ym2612-js, libymfm.wasm).
- **Some tools here are new or marketing-flavored.** Several audio-analysis MCP servers and AI-audio tools are new, single-maintainer, or commercially positioned; treat the *techniques* (offline render → numeric metrics; spectrogram-as-vision) as sound and the *specific tools* as evaluate-before-you-depend.
- **AnalyserNode is the wrong tool for deterministic agent feedback** — it's for live visualization and doesn't function inside an OfflineAudioContext; use OfflineAudioContext + a JS FFT for reproducible measurements, per the W3C/Chris-Wilson guidance.
- **iOS Web Audio remains fiddly** across versions (mute-switch behavior changed between iOS 12/13); test on real devices, not just the simulator.
- **Timing budget:** the lookahead scheduler runs on the UI thread and pauses in backgrounded tabs; pause/resume music on `visibilitychange` and don't assume the scheduler kept running while the tab was hidden.