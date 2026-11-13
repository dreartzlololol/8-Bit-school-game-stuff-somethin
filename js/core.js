/* Core helpers and canvas setup */
const cv = document.getElementById('c');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

if (document.fonts) {
  document.fonts.load("16px 'Press Start 2P'");
}

const VW = 320;
const VH = 180;
const SCALE = 3; // 960x540 output resolution
const T = 16;
const MW = 48;
const MH = 38;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const hash = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function anim(ms, fn) {
  return new Promise(res => {
    const t0 = performance.now();
    (function step() {
      const t = Math.min(1, (performance.now() - t0) / ms);
      fn(t);
      if (t < 1) requestAnimationFrame(step);
      else res();
    })();
  });
}
