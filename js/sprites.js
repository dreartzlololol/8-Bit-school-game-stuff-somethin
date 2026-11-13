/* Pixel sprite rendering for students, zombies, and the Principal boss */
function person(x, y, o) {
  const s = o.s || 1;
  const d = o.dir || 0;
  const sw = Math.sin(o.w || 0) * (o.moving ? 1 : 0);
  const z = o.zombie;
  const F = o.flash;
  const C = c => F || c;
  const R = (dx, dy, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.ceil(w * s), Math.ceil(h * s));
  };

  const skin = C(o.skin);
  const by = -(o.moving ? Math.abs(sw) : 0) * 0.8;

  g.globalAlpha = 0.35 * (o.a ?? 1);
  R(-5, -1, 10, 2, '#000');
  g.globalAlpha = o.a ?? 1;

  const l = Math.max(0, sw) * 1.6;
  const r = Math.max(0, -sw) * 1.6;
  R(-3, -6 - l, 3, 6 + l - 1, C(o.pants));
  R(0, -6 - r, 3, 6 + r - 1, C(o.pants));
  R(-3, -1 - l, 3, 1, C('#222'));
  R(0, -1 - r, 3, 1, C('#222'));

  R(-4, -12 + by, 8, 7, '#111');
  R(-3, -11 + by, 6, 6, C(o.shirt));
  if (!z && d !== 1) R(-1, -11 + by, 2, 2, C('#fff'));
  if (z && d !== 1) {
    R(-3, -8 + by, 2, 1, C('#7a1a1a'));
    R(1, -10 + by, 1, 3, C('#7a1a1a'));
  }

  if (z) {
    if (d >= 2) {
      R(d === 3 ? 3 : -8, -10 + by, 5, 2, skin);
    } else {
      R(-6, -11 + by, 2, 6, skin);
      R(4, -11 + by, 2, 6, skin);
    }
  } else {
    const a = sw * 1.5;
    R(-5, -11 + by + a, 2, 5, skin);
    R(3, -11 + by - a, 2, 5, skin);
  }

  const hy = by - (z ? Math.sin((o.w || 0) * 0.5) * 0.5 : 0);
  R(-4, -19 + hy, 8, 8, '#111');
  R(-3, -18 + hy, 6, 6, skin);
  const eye = C(z ? '#f22' : '#111');

  if (d === 0) {
    R(-3, -18 + hy, 6, 2, C(o.hair));
    R(-2, -15 + hy, 1, 1, eye);
    R(1, -15 + hy, 1, 1, eye);
    if (z) R(-1, -13 + hy, 2, 1, '#400');
  } else if (d === 1) {
    R(-3, -18 + hy, 6, 5, C(o.hair));
  } else {
    R(-3, -18 + hy, 6, 2, C(o.hair));
    R(d === 3 ? -3 : 0, -18 + hy, 3, 4, C(o.hair));
    R(d === 3 ? 1 : -2, -15 + hy, 1, 1, eye);
  }
  if (o.rebel) {
    R(-3, -17 + hy, 6, 1, C('#ff2233'));
    R(d === 3 ? -5 : 3, -16 + hy, 2, 2, C('#ff2233'));
    R(-3, -6 + by, 6, 2, C(o.shirt));
  }
  g.globalAlpha = 1;
}

const SK = '#f0c090';
const ZK = '#79b36e';

function drawBoss(x, y, s, ph, flash, a = 1) {
  g.globalAlpha = a;
  const R = (dx, dy, w, h, c) => {
    g.fillStyle = flash ? '#fff' : c;
    g.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), w * s, h * s);
  };
  const pul = Math.sin(G.t * 0.2) * (ph === 2 ? 1.5 : 0.6);

  R(-12, -26, 24, 26, '#111');
  R(-11, -25, 22, 24, '#2a2a3a');
  for (const sx of [-6, 6]) {
    g.fillStyle = flash ? '#fff' : '#0a0a12';
    g.beginPath();
    g.arc(x + sx * s, y - 10 * s, (5 + pul) * s, 0, 7);
    g.fill();
    g.fillStyle = flash ? '#fff' : '#a33';
    g.beginPath();
    g.arc(x + sx * s, y - 10 * s, (2.5 + pul * 0.5) * s, 0, 7);
    g.fill();
  }
  R(-5, -40, 10, 10, '#111');
  R(-4, -39, 8, 8, ZK);
  R(-4, -39, 8, 2, '#bbb');
  R(-3, -36, 2, 1, '#f22');
  R(1, -36, 2, 1, '#f22');
  R(-3, -33, 6, 1, '#400');
  R(-1, -30, 2, 4, '#c22');

  if (ph === 1) {
    g.strokeStyle = '#ff8';
    g.globalAlpha = 0.4 * a;
    g.strokeRect(x - 18 * s, y - 44 * s, 36 * s, 44 * s);
  }
  g.globalAlpha = 1;
}

function drawJarBoss(x, y, s, flash, a = 1) {
  g.globalAlpha = a;
  const R = (dx, dy, w, h, c) => {
    g.fillStyle = flash ? '#fff' : c;
    g.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.ceil(w * s), Math.ceil(h * s));
  };
  const bob = Math.sin(G.t * 0.15) * 1.5;
  // Purple miasma aura
  g.fillStyle = flash ? '#fff' : `rgba(180, 50, 255, ${0.28 + Math.sin(G.t * 0.2) * 0.1})`;
  g.beginPath();
  g.arc(x, y - 18 * s, 18 * s, 0, 7);
  g.fill();
  // Ratchaburi Dragon Jar (Ong Mangkon) body
  R(-10, -24, 20, 24, '#1a0a12');
  R(-12, -20, 24, 16, '#7a2228');
  R(-9, -23, 18, 22, '#9e3036');
  R(-8, -26, 16, 4, '#d9a62e');
  // Golden dragon pattern on jar
  R(-7, -16, 14, 3, '#f0c440');
  R(-5, -13, 4, 5, '#f0c440');
  R(2, -19, 4, 5, '#f0c440');
  // Spectral skull & tentacles emerging from jar top
  R(-6, -37 + bob, 12, 11, '#2a0838');
  R(-5, -36 + bob, 10, 9, '#b866ff');
  R(-3, -33 + bob, 2, 2, '#ffee44');
  R(1, -33 + bob, 2, 2, '#ffee44');
  R(-3, -29 + bob, 6, 2, '#300');
  g.globalAlpha = 1;
}

const PL = () => ({
  skin: P.inf >= 50 ? '#9ccf9a' : SK,
  hair: '#222',
  shirt: P.rebel ? '#ffe0e0' : '#f2f2f2',
  pants: '#1c2a5a',
  rebel: P.rebel
});
