/**
 * Gera as trilhas de fundo (WAV) proceduralmente — zero problema de licença.
 * São pads/arpejos simples pensados como cama sonora; o time pode substituir
 * por MP3/WAV próprios em remotion/public/music/ mantendo os nomes.
 *
 *   node scripts/gen-music.js
 */
const fs = require('fs');
const path = require('path');

const SR = 22050; // mono 22.05kHz — suficiente para trilha de fundo
const DURATION = 40; // segundos (loop mais longo que o vídeo máximo)

function writeWav(filePath, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767 * 0.85), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

const note = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);

/** Envelope simples de ataque/decaimento. */
function env(t, dur, attack = 0.01, release = 0.2) {
  if (t < 0 || t > dur) return 0;
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

// ---- "energia": arpejo 124bpm com pulso grave (promo/oferta) ----
function genEnergia() {
  const out = new Float32Array(SR * DURATION);
  const bpm = 124;
  const beat = 60 / bpm;
  // progressão: Am — F — C — G (relativa a A4=0: A=-12? usamos offsets de A3)
  const chords = [
    [-12, -9, -5], // Am
    [-16, -12, -9], // F
    [-21, -17, -12], // C (subida)
    [-14, -10, -7], // G
  ];
  const totalBeats = Math.floor(DURATION / beat);
  for (let b = 0; b < totalBeats; b++) {
    const chord = chords[Math.floor(b / 4) % chords.length];
    // arpejo em colcheias
    for (let e = 0; e < 2; e++) {
      const tStart = (b + e * 0.5) * beat;
      const freq = note(chord[(b * 2 + e) % chord.length] + 12);
      const dur = beat * 0.48;
      const from = Math.floor(tStart * SR);
      for (let i = 0; i < dur * SR && from + i < out.length; i++) {
        const t = i / SR;
        const el = env(t, dur, 0.005, 0.12);
        out[from + i] +=
          0.22 * el * Math.sin(2 * Math.PI * freq * t) +
          0.08 * el * Math.sin(2 * Math.PI * freq * 2 * t);
      }
    }
    // pulso grave no tempo
    const kStart = Math.floor(b * beat * SR);
    const kDur = 0.12;
    for (let i = 0; i < kDur * SR && kStart + i < out.length; i++) {
      const t = i / SR;
      const f = 110 * Math.exp(-t * 22) + 45;
      out[kStart + i] += 0.5 * env(t, kDur, 0.002, 0.06) * Math.sin(2 * Math.PI * f * t);
    }
  }
  return out;
}

// ---- "calma": pads lentos (depoimento) ----
function genCalma() {
  const out = new Float32Array(SR * DURATION);
  const chords = [
    [-12, -8, -5, 0], // Am add
    [-17, -12, -8, -5], // Fmaj7
    [-21, -17, -12, -9], // Cmaj
    [-14, -10, -7, -2], // G
  ];
  const chordDur = 4; // segundos por acorde
  const total = Math.floor(DURATION / chordDur);
  for (let c = 0; c < total; c++) {
    const chord = chords[c % chords.length];
    const from = Math.floor(c * chordDur * SR);
    for (let i = 0; i < chordDur * SR && from + i < out.length; i++) {
      const t = i / SR;
      const el = env(t, chordDur, 0.8, 1.2);
      let v = 0;
      for (const semi of chord) {
        const f = note(semi);
        v += Math.sin(2 * Math.PI * f * t + 0.3 * Math.sin(2 * Math.PI * 0.15 * t));
      }
      out[from + i] += (0.10 * el * v) / chord.length + 0.02 * el * Math.sin(2 * Math.PI * note(chord[0] - 12) * t);
    }
  }
  return out;
}

const outDir = path.resolve(__dirname, '../remotion/public/music');
fs.mkdirSync(outDir, { recursive: true });
writeWav(path.join(outDir, 'energia.wav'), genEnergia());
writeWav(path.join(outDir, 'calma.wav'), genCalma());
console.log('trilhas geradas em', outDir);
