/* Extra content: enemy types, weapons, NPCs, dialogue, pickups, gates */
const WL = ['Canteen Tray', 'Bass Mallet', 'PVC Cannon'];
const WQ = ['Wood Ruler', 'Spear', 'Rattan Sword'];

// Enemy type table (spd = map speed, bite = bite chance in battle)
const TY = {
  norm: {
    name: 'INFECTED STUDENT', spd: 0.045, hp: 14, bite: 0.4,
    atk: 'The infected student claws at you!',
    intro: 'An infected student lunges out of the shadows!',
    look: { skin: ZK, hair: '#222', shirt: '#c8c8b0', pants: '#334' }
  },
  runner: {
    name: 'HALLWAY RUNNER', spd: 0.085, hp: 10, bite: 0.55,
    atk: 'The runner vaults over a desk and bites!',
    intro: 'A Hallway Runner sprints straight at you!',
    look: { skin: '#8fcf6e', hair: '#111', shirt: '#e04040', pants: '#222' }
  },
  armor: {
    name: 'ROR.DOR. ZOMBIE', spd: 0.04, hp: 24, bite: 0.35, armor: 1,
    atk: 'The armored zombie headbutts you!',
    intro: 'An armored Ror.Dor. zombie! Quiet jabs barely hurt it.',
    look: { skin: ZK, hair: '#3a4a2a', shirt: '#4d6b3a', pants: '#2a3a22' }
  },
  cheer: {
    name: 'CHEER SCREAMER', spd: 0.05, hp: 12, bite: 0.35, scream: 1,
    atk: 'The cheerleader shakes her pom-poms!',
    intro: 'A Kila Si cheerleader zombie takes a deep breath...',
    look: { skin: ZK, hair: '#ff66aa', shirt: '#ff66aa', pants: '#ffd23a' }
  },
  pe: {
    name: 'P.E. TEACHER', spd: 0.035, hp: 40, bite: 0.3, mini: 1, parry: 1, s: 1.3, bs: 5,
    atk: 'The P.E. Teacher slashes with rattan swords!',
    intro: 'The Krabi-Krabong P.E. Teacher guards the keyring! He parries quiet jabs.',
    look: { skin: '#6fa86a', hair: '#111', shirt: '#2a5a9a', pants: '#111' }
  },
  dancer: {
    name: 'MUSIC ROOM DANCER', spd: 0.04, hp: 46, bite: 0.35, mini: 1, scream: 1, s: 1.25, bs: 4.8,
    atk: 'The Classical Dancer strikes with golden finger-blades!',
    intro: 'The weeping Music Room Dancer rises from the Ranat Ek!',
    look: { skin: '#b8e0d8', hair: '#ffd23a', shirt: '#d4386c', pants: '#8a1c4a' }
  },
  jar: {
    name: 'DRAGON JAR FIEND', spd: 0, hp: 85, bite: 0.45, jar: 1,
    atk: 'The Dragon Jar belches purple Mae Klong miasma!',
    intro: 'THE SOURCE! A cursed Ratchaburi Dragon Jar overflows with purple fog!'
  },
  boss: { name: 'PRINCIPAL' }
};

const NPC_DEF = {
  auntie: { name: 'AUNTIE CANTEEN', look: { skin: SK, hair: '#999', shirt: '#e8845a', pants: '#553' } },
  shop: { name: 'SAHAKORN CO-OP', look: { skin: SK, hair: '#332211', shirt: '#ffdd55', pants: '#223344' } },
  rd: { name: 'ROR.DOR. CADET', look: { skin: SK, hair: '#111', shirt: '#4d6b3a', pants: '#33452a' } },
  occult: { name: 'OCCULT KID', look: { skin: SK, hair: '#aa2222', shirt: '#dddddd', pants: '#1c2a5a' } },
  nerd: { name: 'SCIENCE NERD', look: { skin: SK, hair: '#111', shirt: '#55c8ff', pants: '#223355' } },
  dog: { name: 'SCHOOL DOG' }
};

function pickItem(o) {
  sfx.pick();
  if (o.k === 'ya') { P.ya++; msg('Ya Dom Inhaler! (-30% Infection)'); }
  else if (o.k === 'moo') { P.moo++; msg('Moo Ping Skewer! (+15 HP)'); }
  else if (o.k === 'fanta') { P.fanta++; msg('Red Fanta! Press F to drink (Noise 0, +10 HP)'); }
  else if (o.k === 'vac') {
    P.vials++;
    msg(`Lab Vaccine Vial (${P.vials}/3)! Bring 3 to the Science Nerd!`);
  }
  else if (o.k === 'wl') {
    if (P.wp.loud < 2) { P.wp.loud++; msg('New loud weapon: ' + WL[P.wp.loud] + '!'); }
    else msg('Spare loud weapon... (already maxed)');
  } else {
    if (P.wp.quiet < 2) { P.wp.quiet++; msg('New quiet weapon: ' + WQ[P.wp.quiet] + '!'); }
    else msg('Spare quiet weapon... (already maxed)');
  }
}

function drinkFanta() {
  if (P.fanta <= 0) { msg('No Red Fanta left.'); return; }
  P.fanta--;
  P.noise = 0;
  P.hp = Math.min(P.max, P.hp + 10);
  sfx.heal();
  msg('Glug! Red Fanta: Noise reset, +10 HP.');
}

function unlockGates() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (map[y][x] === 'L') map[y][x] = '.';
  sfx.heal();
  msg('The keyring opens the gates to the stage!', 220);
}

function onPrincipalDefeated() {
  P.postBoss = true;
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (map[y][x] === 'M') {
        map[y][x] = '.';
        paintTile(x, y);
      }
    }
  }
  sfx.heal();
  G.dlg = {
    name: 'CAMPUS INTERCOM (ACT 2)',
    lines: [
      'The PA tower is down and the Master Key is yours!',
      'The East Science Wing & South Escape Gate are now UNLOCKED!',
      'CHOICE: Escape out the South Gate NOW... or enter the East Wing, brew the Cure with the Science Nerd, and destroy the Cursed Dragon Jar!'
    ],
    i: 0
  };
}

function tryEscapeGate() {
  if (!P.postBoss) {
    msg('Chained shut! Defeat the Principal on stage for the Master Key.');
    return;
  }
  G.ending = P.cured ? 'CURE' : 'ESCAPE';
  endGame(true);
}

function toggleStance() {
  P.rebel = !P.rebel;
  sfx.menu();
  const text = P.rebel
    ? 'RULE-BREAKER STANCE! (+45% DMG & Speed, +25% DMG Taken)'
    : 'REGULATION STANCE! (-20% DMG Taken, Stealthier)';
  if (G.scene === 'battle' && B) B.text = text;
  else msg(text, 160);
}

let mapFl = [];

function useDesk() {
  const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  const [dx, dy] = dirs[player.dir] || [0, 1];
  const fx = player.x + dx;
  const fy = player.y + dy;
  // 1) If facing a desk (or adjacent to a desk), pick it up
  if (map[fy]?.[fx] === 'd') {
    if (P.desks >= 6) {
      msg('Carrying max desks (6)! Press B to drop a Spiked Barricade.');
      return;
    }
    map[fy][fx] = fy >= 20 ? ',' : '.';
    delete deskHp[fx + ',' + fy];
    paintTile(fx, fy);
    P.desks++;
    sfx.pick();
    msg(`Picked up Desk! (Carrying: ${P.desks})`);
    return;
  }
  // 2) Otherwise, drop a Spiked Barricade BEHIND you (if running) or IN FRONT of you
  if (P.desks <= 0) {
    msg('No desks! Face any classroom desk and press B to pick it up.');
    return;
  }
  const bx = player.x - dx;
  const by = player.y - dy;
  const canPlace = (x, y) =>
    x > 0 &&
    y > 0 &&
    x < MW - 1 &&
    y < MH - 1 &&
    ['.', ',', 'c', 'S', 'F'].includes(map[y][x]) &&
    free(x, y) &&
    !zs.some(z => Math.round(z.px) === x && Math.round(z.py) === y);

  let px = -1;
  let py = -1;
  if (canPlace(bx, by)) {
    px = bx;
    py = by;
  } else if (canPlace(fx, fy)) {
    px = fx;
    py = fy;
  }
  if (px < 0) {
    msg('No room here! Face a desk to pick up or open hallway to barricade [B].');
    return;
  }
  P.desks--;
  map[py][px] = 'd';
  deskHp[px + ',' + py] = 4;
  paintTile(px, py);
  sfx.hit();
  G.shake = 4;
  msg(`Dropped Spiked Barricade! Zombies bashing it take 5 DMG! (${P.desks} left)`);
}

function triggerPaBox(x, y) {
  decoy = { x, y, t: 450 };
  P.noise = 0;
  [660, 550, 440, 330].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'square', 0.06), i * 90));
  msg('PA DECOY ACTIVE! Zombies lured to speaker for 8s!', 200);
}

function drawDecoyAndBarricades() {
  for (const k in deskHp) {
    const hp = deskHp[k];
    const [x, y] = k.split(',').map(Number);
    if (map[y]?.[x] !== 'd') continue;
    const px = x * T;
    const py = y * T;
    g.strokeStyle = hp >= 3 ? '#ffee55' : hp === 2 ? '#ff9933' : '#ff3333';
    g.lineWidth = 1;
    g.strokeRect(px + 2.5, py + 3.5, 11, 8);
    g.fillStyle = '#ddd';
    for (const sx of [3, 7, 11]) {
      g.fillRect(px + sx, py + 1, 2, 2);
      g.fillRect(px + sx, py + 12, 2, 2);
    }
  }
  if (decoy && decoy.t > 0) {
    const px = decoy.x * T + 8;
    const py = decoy.y * T + 8;
    for (let i = 0; i < 3; i++) {
      const r = ((G.t * 1.4 + i * 18) % 54) + 4;
      g.strokeStyle = `rgba(80, 255, 220, ${1 - r / 58})`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(px, py, r, 0, 7);
      g.stroke();
    }
  }
}

function drawMapAlerts(cx, cy) {
  for (const z of zs) {
    if (z.alert > 0 && !z.boss && !TY[z.type].jar) {
      const sx = z.px * T + 8 - Math.round(cx);
      const sy = z.py * T - 6 - Math.round(cy);
      if (sx > 6 && sx < VW - 6 && sy > 6 && sy < VH - 6) {
        txt('!', sx, sy, '#ff3344', 7, 'center');
      }
    }
  }
  for (const f of mapFl) {
    f.y -= 0.35;
    f.l -= 0.025;
    const sx = f.x - Math.round(cx);
    const sy = f.y - Math.round(cy);
    g.globalAlpha = Math.max(0, f.l);
    txt(f.t, sx, sy, f.c, 6.5, 'center');
  }
  g.globalAlpha = 1;
  mapFl = mapFl.filter(f => f.l > 0);
}

function talk(n) {
  let lines;
  if (n.id === 'auntie') {
    if (!n.met) {
      n.met = 1; P.hp = P.max;
      lines = ['Aiyo! Still alive, child? Come, eat something!', '*You are fully healed.*',
        'Bring me 2 Moo Ping skewers and I will cook Photharam Black Tofu for you.'];
    } else if (!n.done && P.moo >= 2) {
      n.done = 1; P.moo -= 2; P.max += 10; P.hp = P.max;
      lines = ['Moo Ping! Wonderful. Cooking Black Tofu...', '*Max HP +10 and fully healed!*'];
    } else lines = [n.done ? 'Be careful. The Principal is up on the stage.' : 'Two Moo Ping skewers, remember?'];
  } else if (n.id === 'rd') {
    if (!n.met) {
      n.met = 1; P.rd = true;
      lines = ['Ror.Dor. cadet reporting! I will watch your back.', '*The cadet joins you: takes 30% of damage.*'];
      npcs = npcs.filter(o => o !== n);
    }
  } else if (n.id === 'occult') {
    if (!n.met) {
      n.met = 1; P.amulet = true; P.fanta += 2;
      lines = ['Psst... take this Phra Khrueang amulet. It blocks the first bite each fight.',
        '*Amulet equipped. +2 Red Fanta.*'];
    } else lines = ['The spirits are angry tonight... The P.E. Teacher has the gate keys.'];
  } else if (n.id === 'nerd') {
    if (!n.met) {
      n.met = 1;
      lines = [
        'Thank goodness! I locked myself in the Science Wing when the fog hit.',
        'If you bring me 3 glowing Cyan Vaccine Vials from the East Wing, I can synthesize a permanent Cure!'
      ];
    } else if (!n.done && P.vials >= 3) {
      n.done = 1;
      P.cured = true;
      P.inf = 0;
      P.hp = P.max;
      sfx.heal();
      lines = [
        'You found all 3 Vaccine Vials! Synthesizing the Mae Klong Antidote...',
        '*CURE COMPLETE! Infection permanently locked at 0%! Now destroy the Dragon Jar in the SE Shrine or escape out the South Gate!*'
      ];
    } else {
      lines = [
        n.done
          ? 'The Cure works! Smash the Dragon Jar in the Southeast Shrine to save the whole town!'
          : `I still need ${3 - P.vials} more Cyan Vaccine Vials from the East Wing!`
      ];
    }
  } else if (n.id === 'shop') {
    n.met = 1;
    if (P.bht >= 25) {
      P.bht -= 25;
      P.moo++;
      P.ya++;
      P.fanta++;
      P.desks = Math.min(5, P.desks + 1);
      sfx.heal();
      lines = [
        'Welcome to Sahakorn Co-op! Here is a 25 BHT Survival Bundle!',
        '*Received +1 Moo Ping, +1 Ya Dom, +1 Red Fanta, and +1 Desk!*',
        `You have ${P.bht} BHT left. Come back anytime with 25 BHT!`
      ];
    } else {
      lines = [
        `Sahakorn Co-op! Survival Bundle costs 25 BHT (You have ${P.bht} BHT).`,
        'Defeat zombies around campus to collect Baht coins!'
      ];
    }
  } else if (n.id === 'dog') {
    if (P.moo >= 2) {
      P.moo -= 2; P.dog = true;
      lines = ['WOOF! (He devours the Moo Ping.)', '*The school dog joins you and bites enemies for 3 dmg each turn!*'];
      npcs = npcs.filter(o => o !== n);
    } else lines = ['Woof? (He sniffs the air. Maybe 2 Moo Ping skewers would help...)'];
  }
  G.dlg = { name: NPC_DEF[n.id].name, lines, i: 0 };
}

function advanceDlg() {
  sfx.menu();
  G.dlg.i++;
  if (G.dlg.i >= G.dlg.lines.length) G.dlg = null;
}

/* ---- drawing helpers ---- */
function drawItem(o, x, y) {
  const col = { ya: '#4f4', moo: '#fa4', fanta: '#f44', wl: '#ffd24a', wq: '#6cf', vac: '#44ffee' }[o.k];
  g.globalAlpha = 0.3; g.fillStyle = col;
  g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
  g.globalAlpha = 1;
  const R = (dx, dy, w, h, c) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  if (o.k === 'ya') { R(-2, -5, 5, 10, '#111'); R(-1, -4, 3, 8, '#3d3'); R(-1, -5, 3, 2, '#fff'); }
  else if (o.k === 'moo') { R(-1, -6, 2, 12, '#8a5a2a'); R(-3, -5, 6, 3, '#e56'); R(-3, -1, 6, 3, '#e56'); R(-3, 3, 6, 2, '#e56'); }
  else if (o.k === 'fanta') { R(-3, -5, 6, 10, '#111'); R(-2, -4, 4, 8, '#e22'); R(-2, -1, 4, 2, '#fff'); }
  else if (o.k === 'vac') { R(-3, -6, 6, 11, '#112'); R(-2, -4, 4, 8, '#33ffee'); R(-2, -6, 4, 2, '#ffffff'); }
  else if (o.k === 'wl') { R(-5, -1, 10, 3, '#999'); R(-1, -5, 3, 10, '#ccc'); R(-1, -1, 3, 3, '#ffd24a'); }
  else { R(-1, -7, 2, 14, '#c9a060'); R(-2, -7, 4, 3, '#6cf'); }
}

function drawDog(x, y, s, f) {
  const R = (dx, dy, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x + (f > 0 ? dx : -dx - w) * s), Math.round(y + dy * s), Math.ceil(w * s), Math.ceil(h * s));
  };
  g.globalAlpha = 0.35; R(-5, -1, 11, 2, '#000'); g.globalAlpha = 1;
  const wag = Math.sin(G.t * 0.4) > 0 ? 1 : 0;
  R(-4, -3, 2, 3, '#7a5028'); R(2, -3, 2, 3, '#7a5028');
  R(-5, -7, 10, 5, '#b8844a'); R(-7, -8 - wag, 2, 3, '#b8844a');
  R(3, -10, 5, 5, '#b8844a'); R(7, -8, 2, 2, '#7a5028'); R(4, -9, 1, 1, '#111'); R(3, -11, 2, 2, '#7a5028');
}

function drawFollowers() {
  const list = [];
  if (P.dog) list.push(['dog', 12]);
  if (P.rd) list.push(['rd', 26]);
  for (const [k, i] of list) {
    const t = trail[Math.min(i, trail.length - 1)] || { x: player.px, y: player.py };
    if (k === 'dog') drawDog(t.x * T + 8, t.y * T + 14, 1, player.dir === 2 ? -1 : 1);
    else person(t.x * T + 8, t.y * T + 14, { ...NPC_DEF.rd.look, dir: player.dir, w: player.walk - 0.5 * i, moving: player.moving });
  }
}

function drawNpc(n) {
  if (n.id === 'dog') drawDog(n.x * T + 8, n.y * T + 14, 1, 1);
  else person(n.x * T + 8, n.y * T + 14, { ...NPC_DEF[n.id].look, dir: 0 });
}

function drawNpcMarks(cx, cy) {
  for (const n of npcs) {
    const ready =
      !n.met ||
      (n.id === 'auntie' && !n.done && P.moo >= 2) ||
      (n.id === 'nerd' && !n.done && P.vials >= 3);
    if (!ready) continue;
    const sx = n.x * T + 8 - Math.round(cx);
    const sy = n.y * T - 6 - Math.round(cy) + Math.sin(G.t * 0.15) * 2;
    if (sx < 8 || sx > VW - 8 || sy < 8 || sy > VH - 8) continue;
    txt('!', sx, sy, '#ffee55', 9, 'center');
  }
}

function drawGates() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = map[y][x];
    if (c !== 'L' && c !== 'M' && c !== 'G') continue;
    const px = x * T, py = y * T;
    g.fillStyle = c === 'G' ? '#1a2a1a' : '#222';
    g.fillRect(px, py + 1, T, T - 2);
    g.fillStyle = c === 'M' ? '#b866ff' : c === 'G' ? '#66ff88' : '#8a8f9a';
    for (let i = 1; i < T; i += 4) g.fillRect(px + i, py + 2, 2, T - 4);
    g.fillStyle = c === 'M' ? '#8822cc' : c === 'G' ? '#22aa44' : '#c33';
    g.fillRect(px + 5, py + 5, 6, 6);
    g.fillStyle = '#ffd24a';
    g.fillRect(px + 7, py + 7, 2, 2);
  }
}

function drawDialog() {
  const d = G.dlg;
  if (!d) return;
  panel(4, 116, 312, 60, '#ffd24a', 'rgba(10,8,22,0.95)');
  txt(d.name, 12, 128, '#ffd24a', 6);
  wrap(d.lines[d.i], 50).slice(0, 3).forEach((l, i) => txt(l, 12, 142 + i * 11, '#ffffff', 6.2));
  if (Math.floor(G.t / 20) % 2) txt('SPACE >', 308, 171, '#ffee66', 5.5, 'right');
}

function drawMinimap() {
  if (!P.mapOn || G.dlg) return;
  const mx = VW - MW - 5;
  const my = VH - MH - 5;
  panel(mx - 2, my - 9, MW + 4, MH + 11, '#5a6a9a', 'rgba(8, 10, 20, 0.85)');
  txt('[TAB] MAP', mx + MW / 2, my - 2, '#aaccff', 4.2, 'center');
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const c = map[y][x];
      if (c === '#' || c === 'P') g.fillStyle = '#4a5278';
      else if (c === 'L' || c === 'M') g.fillStyle = '#ff55ff';
      else if (c === 'G') g.fillStyle = '#44ff88';
      else if (c === 'S') g.fillStyle = '#7a4499';
      else if (c === 'F') g.fillStyle = '#662299';
      else continue;
      g.fillRect(mx + x, my + y, 1, 1);
    }
  }
  for (const n of npcs) {
    g.fillStyle = '#ffee44';
    g.fillRect(mx + n.x, my + n.y, 2, 2);
  }
  for (const z of zs) {
    g.fillStyle = z.boss || z.type === 'jar' ? '#ff2244' : TY[z.type].mini ? '#ff8800' : '#44bb55';
    g.fillRect(mx + z.x, my + z.y, z.boss || z.type === 'jar' ? 2 : 1, z.boss || z.type === 'jar' ? 2 : 1);
  }
  if (Math.floor(G.t / 10) % 2 === 0) {
    g.fillStyle = '#ffffff';
    g.fillRect(mx + player.x - 1, my + player.y - 1, 3, 3);
  }
}

