/* Rendering and high-contrast crisp UI */
const rain = Array.from({ length: 70 }, () => ({
  x: rnd(0, VW),
  y: rnd(0, VH),
  s: rnd(3, 6)
}));

function drawRain(a = 0.35) {
  g.strokeStyle = `rgba(180,190,255,${a})`;
  g.lineWidth = 0.6;
  g.beginPath();
  for (const r of rain) {
    r.y += r.s;
    r.x -= r.s * 0.3;
    if (r.y > VH) {
      r.y = -5;
      r.x = rnd(0, VW + 40);
    }
    g.moveTo(r.x, r.y);
    g.lineTo(r.x - 1.5, r.y - 5);
  }
  g.stroke();
}

const FONT = "'Press Start 2P', 'Courier New', monospace";

// Renders crisp outlined text at native 960x540 resolution using 320x180 logical coords
function txt(s, x, y, c = '#fff', sz = 8, al = 'left') {
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  const px = Math.round(sz * 2.15);
  const sx = Math.round(x * SCALE);
  const sy = Math.round(y * SCALE);
  g.font = `bold ${px}px ${FONT}`;
  g.textAlign = al;
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, Math.round(px * 0.25));
  g.strokeStyle = '#08060f';
  g.strokeText(s, sx, sy);
  g.fillStyle = '#08060f';
  g.fillText(s, sx + 2, sy + 2);
  g.fillStyle = c;
  g.fillText(s, sx, sy);
  g.restore();
}

function panel(x, y, w, h, border = '#6a6a9a', bg = 'rgba(12, 10, 24, 0.88)') {
  g.fillStyle = bg;
  g.fillRect(x, y, w, h);
  g.strokeStyle = border;
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function bar(x, y, w, v, m, c, lab, valText) {
  if (lab) txt(lab, x - 3, y + 5, '#e8e8ff', 5.5, 'right');
  g.fillStyle = '#090812';
  g.fillRect(x - 1, y - 1, w + 2, 7);
  g.fillStyle = '#252338';
  g.fillRect(x, y, w, 5);
  const pct = clamp(v / m, 0, 1);
  g.fillStyle = c;
  g.fillRect(x, y, w * pct, 5);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(x, y, w * pct, 1.5);
  if (valText) txt(valText, x + w / 2, y + 4.8, '#fff', 4.5, 'center');
}

function wrap(s, n) {
  const o = [];
  let l = '';
  for (const w of String(s).split(' ')) {
    if ((l + w).length > n) {
      o.push(l.trim());
      l = '';
    }
    l += w + ' ';
  }
  if (l.trim()) o.push(l.trim());
  return o;
}

function drawMap() {
  const p = player;
  const cx = clamp(p.px * T + 8 - VW / 2, 0, MW * T - VW);
  const cy = clamp(p.py * T + 8 - VH / 2, 0, MH * T - VH);

  g.save();
  if (G.shake > 0) g.translate(rnd(-G.shake, G.shake) | 0, 0);
  g.translate(-Math.round(cx), -Math.round(cy));
  g.drawImage(mapCv, 0, 0);

  drawGates();
  drawDecoyAndBarricades();
  items.forEach((o, i) => drawItem(o, o.x * T + 8, o.y * T + 8 + Math.sin(G.t * 0.1 + i) * 2));
  drawFollowers();

  const ents = [...zs.map(z => ({ z, y: z.py })), { p: 1, y: p.py }, ...npcs.map(n => ({ n, y: n.y }))].sort((a, b) => a.y - b.y);
  for (const e of ents) {
    if (e.n) {
      drawNpc(e.n);
      continue;
    }
    if (e.p) {
      if (P.rebel) {
        g.fillStyle = `rgba(255, 50, 60, ${0.22 + Math.sin(G.t * 0.25) * 0.08})`;
        g.beginPath();
        g.arc(p.px * T + 8, p.py * T + 7, 9, 0, 7);
        g.fill();
      }
      person(p.px * T + 8, p.py * T + 14, { ...PL(), dir: p.dir, w: p.walk, moving: p.moving });
    } else {
      const z = e.z;
      if (z.boss) drawBoss(z.px * T + 8, z.py * T + 16, 0.8, 0);
      else if (z.type === 'jar') drawJarBoss(z.px * T + 8, z.py * T + 16, 0.9, false);
      else
        person(z.px * T + 8, z.py * T + 14, {
          ...TY[z.type].look,
          s: TY[z.type].s || 1,
          dir: z.dir,
          w: z.walk,
          moving: z.moving,
          zombie: 1
        });
    }
  }

  // Objective arrow toward current quest target
  const b =
    zs.find(z => (!P.key && z.type === 'pe') || (P.key && !P.postBoss && z.boss) || (P.postBoss && z.type === 'jar')) ||
    zs.find(z => z.boss || z.type === 'jar');
  if (b) {
    const a = Math.atan2(b.py - p.py, b.px - p.px);
    const ax = p.px * T + 8 + Math.cos(a) * 26;
    const ay = p.py * T - 2 + Math.sin(a) * 26;
    g.fillStyle = '#ff6';
    g.beginPath();
    g.moveTo(ax + Math.cos(a) * 5, ay + Math.sin(a) * 5);
    g.lineTo(ax + Math.cos(a + 2.4) * 4, ay + Math.sin(a + 2.4) * 4);
    g.lineTo(ax + Math.cos(a - 2.4) * 4, ay + Math.sin(a - 2.4) * 4);
    g.fill();
  }
  g.restore();

  // Flashlight darkness & atmosphere
  const sx = p.px * T + 8 - cx;
  const sy = p.py * T + 4 - cy;
  const rg = g.createRadialGradient(sx, sy, 32, sx, sy, 175);
  rg.addColorStop(0, 'rgba(15,0,35,0)');
  rg.addColorStop(1, 'rgba(15,0,35,0.76)');
  g.fillStyle = rg;
  g.fillRect(0, 0, VW, VH);

  g.fillStyle = 'rgba(120,40,170,0.07)';
  g.fillRect(0, 0, VW, VH);
  if (P.noise > 70) {
    g.fillStyle = `rgba(255,0,0,${0.08 + Math.sin(G.t * 0.3) * 0.05})`;
    g.fillRect(0, 0, VW, VH);
  }
  drawRain(0.25);

  drawNpcMarks(cx, cy);
  drawMapAlerts(cx, cy);

  // Top-left Status HUD
  panel(3, 3, 128, 32);
  bar(38, 6, 86, P.hp, P.max, P.hp < P.max * 0.3 ? '#ff3b3b' : '#44dd55', 'HP', `${P.hp}/${P.max}`);
  bar(38, 15, 86, P.inf, 100, '#b555ff', 'INF', `${P.inf}%`);
  bar(38, 24, 86, P.noise, 100, P.noise >= 100 ? '#ff3333' : '#ffaa00', 'NOISE', `${Math.round(P.noise)}%`);

  // Top-right Inventory & Stance HUD
  panel(VW - 156, 3, 153, 32);
  txt(`LV${P.lv} YA:${P.ya} MOO:${P.moo} FAN:${P.fanta} [B]DSK:${P.desks}`, VW - 79.5, 10.5, '#99ff99', 4.5, 'center');
  txt(`${WL[P.wp.loud]} / ${WQ[P.wp.quiet]}`, VW - 79.5, 17.5, '#ffdd88', 4.4, 'center');
  txt(
    P.rebel ? '[E] STANCE: RULE-BREAKER (+DMG)' : '[E] STANCE: REGULATION (+DEF)',
    VW - 79.5,
    24.5,
    P.rebel ? '#ff6666' : '#88ddff',
    4.3,
    'center'
  );
  txt(
    `${P.bht}BHT ${P.key ? 'KEY ' : ''}${P.postBoss ? 'ACT2 ' : ''}${P.cured ? 'CURED ' : P.vials ? `V:${P.vials}/3 ` : ''}${P.dog ? 'DOG ' : ''}${P.rd ? 'CDT ' : ''}${P.amulet ? 'AMU' : ''}`,
    VW - 79.5,
    31.5,
    '#d8b8ff',
    4.1,
    'center'
  );

  drawMinimap();

  if (P.inf >= 50) {
    panel(70, 148, 180, 12, '#6a4a9a');
    txt('FEVER: ZOMBIES MAY IGNORE YOU', VW / 2, 156.5, '#b8ff99', 5.5, 'center');
  }

  if (G.msgT > 0) {
    G.msgT--;
    g.globalAlpha = Math.min(1, G.msgT / 20);
    panel(6, VH - 20, VW - 12, 16, '#ffd24a');
    txt(G.msg, VW / 2, VH - 9.5, '#ffee88', 6.2, 'center');
    g.globalAlpha = 1;
  }
  drawDialog();
  if (G.shake > 0) G.shake -= 0.5;
}

function drawBattle() {
  const e = B.e;
  const boss = e.boss;
  const ph = boss ? phaseOf(e) : 0;

  g.save();
  if (G.shake > 0) {
    g.translate(rnd(-G.shake, G.shake) | 0, rnd(-G.shake, G.shake) | 0);
    G.shake -= 0.5;
  }

  const gr = g.createLinearGradient(0, 0, 0, 120);
  gr.addColorStop(0, boss ? '#2a0a3a' : '#1c2340');
  gr.addColorStop(1, boss ? '#7a1a4a' : '#3a4a6a');
  g.fillStyle = gr;
  g.fillRect(-10, -10, 340, 130);

  if (!boss) {
    g.fillStyle = '#5a3a1a';
    g.fillRect(36, 28, 248, 48);
    g.fillStyle = '#1d3a2a';
    g.fillRect(39, 31, 242, 42);
    txt('CLASS 4/1 - STAY QUIET', 52, 46, '#c8ffee', 6.5);
    for (const x of [8, 288]) {
      g.fillStyle = '#202840';
      g.fillRect(x, 28, 22, 36);
      g.fillStyle = Math.random() < 0.02 ? '#fff' : '#41508a';
      g.fillRect(x + 2, 30, 18, 32);
    }
  } else {
    g.fillStyle = '#8a1a2a';
    g.fillRect(-5, 0, 40, 100);
    g.fillRect(285, 0, 40, 100);
    g.fillStyle = '#ffd';
    g.globalAlpha = 0.1 + (ph === 1 ? 0.12 : 0);
    g.beginPath();
    g.moveTo(160, 0);
    g.lineTo(100, 110);
    g.lineTo(220, 110);
    g.fill();
    g.globalAlpha = 1;
  }

  g.fillStyle = boss ? '#3a1a2a' : '#3a2f2a';
  g.fillRect(-10, 92, 340, 30);
  for (let x = 0; x < 320; x += 24) {
    g.fillStyle = '#0003';
    g.fillRect(x, 92, 1, 30);
  }
  drawRain(0.15);

  if (B.pFlash > 0) B.pFlash--;
  if (B.eFlash > 0) B.eFlash--;
  if (!(B.pFlash > 0 && B.pFlash % 4 < 2)) {
    if (P.rebel) {
      g.fillStyle = `rgba(255, 50, 60, ${0.24 + Math.sin(G.t * 0.25) * 0.08})`;
      g.beginPath();
      g.arc(78 + B.pOff, 82, 26, 0, 7);
      g.fill();
    }
    person(78 + B.pOff, 114, { ...PL(), s: 4, dir: 3, w: G.t * 0.1, moving: false });
  }
  if (P.dog) drawDog(22, 114, 3, 1);
  if (P.rd) person(46, 114, { ...NPC_DEF.rd.look, s: 3, dir: 3, w: 0, moving: false });
  const ey = 114 + Math.sin(G.t * 0.08) * 2;
  if (boss) {
    g.save();
    drawBoss(240 + B.eOff, ey, 2.2, ph, B.eFlash > 0, B.eAlpha);
    g.restore();
  } else if (e.type === 'jar') {
    g.save();
    drawJarBoss(240 + B.eOff, ey, 2.3, B.eFlash > 0, B.eAlpha);
    g.restore();
  } else {
    person(240 + B.eOff, ey + (1 - B.eAlpha) * 20, {
      ...TY[e.type].look,
      s: TY[e.type].bs || 4,
      dir: 2,
      w: G.t * 0.1,
      zombie: 1,
      flash: B.eFlash > 0,
      a: B.eAlpha
    });
  }

  for (const q of B.parts) {
    q.x += q.vx;
    q.y += q.vy;
    q.vy += 0.15;
    q.l -= 0.03;
    g.globalAlpha = Math.max(0, q.l);
    g.fillStyle = q.c;
    g.fillRect(q.x, q.y, 2, 2);
  }
  g.globalAlpha = 1;
  B.parts = B.parts.filter(q => q.l > 0);

  for (const f of B.fl) {
    f.y -= 0.45;
    f.l -= 0.016;
    g.globalAlpha = Math.max(0, f.l);
    txt(f.t, f.x, f.y, f.c, 9, 'center');
  }
  g.globalAlpha = 1;
  B.fl = B.fl.filter(f => f.l > 0);
  g.restore();

  // Top Battle HUD bar
  panel(0, 0, 320, 26, '#5a5a8a', 'rgba(8, 8, 18, 0.9)');
  txt(`YOU LV${P.lv}`, 6, 8.5, '#ffee77', 5.5);
  bar(28, 11, 78, P.hp, P.max, '#44dd55', 'HP', `${P.hp}/${P.max}`);
  bar(28, 19, 78, P.inf, 100, '#b555ff', 'INF', `${P.inf}%`);

  txt('NOISE', 156, 9, '#ffbb44', 5.5, 'center');
  bar(124, 13, 64, P.noise, 100, P.noise >= 100 ? '#ff3333' : '#ffaa00', '', `${Math.round(P.noise)}%`);

  const ename = boss
    ? ['PRINCIPAL: ASSEMBLY', 'ANTHEM: DO NOT ATTACK!', 'PRINCIPAL: STATIC'][ph]
    : TY[e.type].name;
  txt(ename, 314, 9, boss ? '#ff99ff' : '#aaffaa', 5.5, 'right');
  bar(204, 13, 110, e.hp, e.max, '#ee4444', '', `${e.hp}/${e.max}`);

  // Active Timing Bar for attacks
  if (B.aim) {
    const bx = 76;
    const by = 96;
    const bw = 168;
    panel(bx - 4, by - 12, bw + 8, 22, '#ffee55', 'rgba(10, 8, 22, 0.95)');
    txt('TIMED STRIKE - PRESS SPACE!', 160, by - 3.5, '#ffee66', 4.8, 'center');
    g.fillStyle = '#26243a';
    g.fillRect(bx, by, bw, 6);
    g.fillStyle = '#38a852';
    g.fillRect(bx + bw * 0.27, by, bw * 0.46, 6);
    g.fillStyle = '#ffd23a';
    g.fillRect(bx + bw * 0.41, by, bw * 0.18, 6);
    const cx = bx + B.aim.pos * bw;
    g.fillStyle = '#ffffff';
    g.fillRect(cx - 1.5, by - 2, 3, 10);
  }

  // Bottom Battle Command & Log Panel
  panel(0, 120, 320, 60, '#7a7ab8', '#0e0d1a');
  panel(4, 124, 160, 52, '#44446a', '#151428');
  wrap(B.text, 23).slice(0, 3).forEach((l, i) => txt(l, 9, 135 + i * 12, '#fff8cc', 5.8));
  txt(
    P.rebel ? '[E] STANCE: RULE-BREAKER (+45% DMG)' : '[E] STANCE: REGULATION (-20% HURT)',
    9,
    172,
    P.rebel ? '#ff7777' : '#88ddff',
    4.4
  );

  const opts = [
    ['1.SMASH', WL[P.wp.loud]],
    ['2.JAB', WQ[P.wp.quiet]],
    [`3.YA DOM (${P.ya})`, '-30% Infect'],
    [`4.MOO PING (${P.moo})`, '+15 HP']
  ];
  opts.forEach(([title, sub], i) => {
    const x = 168 + (i % 2) * 75;
    const y = 124 + ((i / 2) | 0) * 26;
    const sel = B.sel === i && !B.busy;
    panel(x, y, 72, 24, sel ? '#ffee55' : '#4a4a6a', sel ? '#2d2b58' : '#18172c');
    txt((sel ? '>' : '') + title, x + 4, y + 10.5, sel ? '#ffee55' : '#ffffff', 5.6);
    txt(sub, x + 5, y + 19.5, sel ? '#d8d8ff' : '#9999bb', 4.6);
  });
}

function drawTitle() {
  G.t++;
  const gr = g.createLinearGradient(0, 0, 0, VH);
  gr.addColorStop(0, '#14061f');
  gr.addColorStop(1, '#4a1840');
  g.fillStyle = gr;
  g.fillRect(0, 0, VW, VH);

  g.fillStyle = '#e8d8ff';
  g.beginPath();
  g.arc(255, 35, 16, 0, 7);
  g.fill();
  g.fillStyle = '#cdb8ee';
  g.beginPath();
  g.arc(250, 31, 3, 0, 7);
  g.fill();

  g.fillStyle = '#0a0412';
  g.fillRect(0, 125, 320, 55);
  g.fillRect(20, 95, 110, 40);
  g.fillRect(150, 85, 150, 50);
  g.fillRect(120, 70, 20, 30);

  for (let i = 0; i < 14; i++) {
    g.fillStyle = Math.sin(G.t * 0.02 + i) > -0.3 && hash(i, 3) > 0.4 ? '#ffcf60' : '#2a1a30';
    g.fillRect(28 + i * 7 + (i > 6 ? 30 : 0), 104 + (i % 2) * 14, 4, 6);
  }
  drawRain(0.3);

  for (let i = 0; i < 4; i++) {
    person(((G.t * 0.25 + i * 100) % 380) - 30, 172, {
      skin: ZK,
      hair: '#111',
      shirt: '#b0b0a0',
      pants: '#223',
      s: 2,
      dir: 3,
      w: G.t * 0.15 + i,
      moving: true,
      zombie: 1
    });
  }

  const sh = Math.sin(G.t * 0.08) * 1.5;
  txt('DEAD BELL', 160, 46 + sh, '#ff4444', 20, 'center');
  txt('AT PHOTHAWATTANASENEE SCHOOL', 160, 66, '#ffd255', 7.5, 'center');
  txt('8-BIT THAI SCHOOL ZOMBIE RPG', 160, 80, '#b8b8e8', 6, 'center');

  if (Math.floor(G.t / 30) % 2) {
    panel(92, 108, 136, 18, '#ffee66');
    txt('PRESS ENTER / SPACE', 160, 120, '#ffffff', 6.5, 'center');
  }
}

function drawIntro() {
  G.t++;
  g.fillStyle = '#07050c';
  g.fillRect(0, 0, VW, VH);
  drawRain(0.2);
  const L = introText[G.intro];
  if (!L) return;
  G.chars = Math.min(L.length, G.chars + 0.8);

  panel(18, 36, VW - 36, 108, '#7a6aa8');
  txt(`STORY (${G.intro + 1}/${introText.length})`, 28, 50, '#ffd255', 6.2);
  wrap(L.slice(0, G.chars | 0), 34).forEach((l, i) => txt(l, 28, 70 + i * 16, '#f0f0ff', 7));

  if (G.chars >= L.length && Math.floor(G.t / 25) % 2) {
    txt('PRESS ENTER / SPACE >', 292, 134, '#ffee66', 6.5, 'right');
  }
}

function drawEnd() {
  G.t++;
  const w = G.won;
  g.fillStyle = w ? '#0c2a1a' : '#2a0808';
  g.fillRect(0, 0, VW, VH);
  drawRain(0.2);

  panel(24, 34, VW - 48, 112, w ? '#66ff88' : '#ff5555');
  const endTitles = {
    'TRUE HERO': 'TRUE ENDING: SAVIOR OF PHOTHARAM!',
    'DRAGON SLAYER': 'SHRINE ENDING: CURSE SHATTERED!',
    CURE: 'CURE ENDING: ANTIDOTE ESCAPE!',
    ESCAPE: 'SURVIVOR ENDING: ESCAPED THE GATE!'
  };
  const endDescs = {
    'TRUE HERO': 'You brewed the Cure AND shattered the Dragon Jar! Phothawattanasenee is saved!',
    'DRAGON SLAYER': 'You destroyed the Cursed Dragon Jar at its source! Dawn breaks over Ratchaburi.',
    CURE: 'You escaped through the South Gate carrying the Science Club Antidote!',
    ESCAPE: 'You broke through the South Gate alive, though the purple fog lingers behind...'
  };
  txt(
    w ? endTitles[G.ending] || 'SIGNAL SILENCED!' : 'YOU BECAME ONE OF THEM',
    160,
    58,
    w ? '#66ff88' : '#ff5555',
    9.5,
    'center'
  );
  txt(
    w
      ? endDescs[G.ending] || 'The 8:00 AM anthem fades. Dawn breaks over Photharam.'
      : 'The school bell tolls for you. The purple fog remains.',
    160,
    80,
    '#f0f0ff',
    5.6,
    'center'
  );
  txt(
    `ZOMBIES DEFEATED: ${P.kills}   |   LEVEL: ${P.lv}   |   INFECTION: ${Math.min(100, P.inf)}%`,
    160,
    102,
    '#ffd266',
    5.8,
    'center'
  );

  if (Math.floor(G.t / 30) % 2) {
    txt('PRESS ENTER TO RETURN TO TITLE', 160, 132, '#ffffff', 6.8, 'center');
  }
}

function frame() {
  g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (G.scene === 'map') updateMap();
  else G.t++;

  g.fillStyle = '#000';
  g.fillRect(0, 0, VW, VH);
  ({
    title: drawTitle,
    intro: drawIntro,
    map: drawMap,
    battle: drawBattle,
    end: drawEnd
  })[G.scene]();

  if (G.wipe > 0) {
    for (let by = 0; by < 12; by++) {
      for (let bx = 0; bx < 20; bx++) {
        if (hash(bx, by) < G.wipe) {
          g.fillStyle = '#000';
          g.fillRect(bx * 16, by * 16, 16, 16);
        }
      }
    }
  }
  requestAnimationFrame(frame);
}
