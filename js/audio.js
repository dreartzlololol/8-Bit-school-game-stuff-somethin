/* Chiptune audio synthesizer and SFX */
let ac = null;
let mute = false;
let mstep = 0;

function tone(f, d, type = 'square', v = 0.04, slide = 0) {
  if (!ac || mute) return;
  const o = ac.createOscillator();
  const n = ac.createGain();
  const t = ac.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) {
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  }
  n.gain.setValueAtTime(v, t);
  n.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(n).connect(ac.destination);
  o.start();
  o.stop(t + d);
}

const sfx = {
  hit: () => {
    tone(180, 0.15, 'sawtooth', 0.07, -120);
    tone(90, 0.2, 'square', 0.06, -50);
  },
  hurt: () => tone(300, 0.3, 'sawtooth', 0.07, -250),
  pick: () => {
    tone(660, 0.08);
    setTimeout(() => tone(990, 0.12), 70);
  },
  heal: () => {
    [520, 660, 780, 1040].forEach((f, i) =>
      setTimeout(() => tone(f, 0.12, 'triangle', 0.06), i * 70)
    );
  },
  step: () => tone(60 + Math.random() * 20, 0.05, 'triangle', 0.03),
  alert: () => {
    tone(200, 0.1);
    setTimeout(() => tone(150, 0.2), 100);
  },
  menu: () => tone(880, 0.04, 'square', 0.03)
};

const bass = [110, 110, 131, 110, 98, 98, 123, 98];
const lead = [440, 494, 587, 659, 587, 494, 392, 440];

setInterval(() => {
  if (!ac || mute || G.scene === 'title') return;
  const b = G.scene === 'battle';
  mstep++;
  tone(bass[mstep % 8], 0.14, 'triangle', 0.07);
  if (b) {
    tone(lead[mstep % 8] * (mstep % 16 < 8 ? 1 : 1.5), 0.1, 'square', 0.025);
    if (mstep % 2) tone(55, 0.05, 'square', 0.04);
  } else if (mstep % 3 === 0) {
    tone(lead[(Math.random() * 8) | 0], 0.35, 'triangle', 0.035);
  }
}, 150);
