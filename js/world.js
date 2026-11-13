/* Overworld movement, spirit house interaction, and zombie AI */
function interact() {
  if (G.dlg) return;
  const near = npcs.find(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) === 1);
  if (near) {
    talk(near);
    return;
  }
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    const x = player.x + dx;
    const y = player.y + dy;
    if (map[y]?.[x] === 'G') {
      tryEscapeGate();
      return;
    }
    if (map[y]?.[x] === 'P') {
      triggerPaBox(x, y);
      return;
    }
    if (map[y]?.[x] === 'h') {
      const id = x + ',' + y;
      if (used.has(id)) {
        msg('The spirit house is quiet.');
        return;
      }
      used.add(id);
      P.hp = Math.min(P.max, P.hp + 20);
      P.inf = Math.max(0, P.inf - 15);
      P.noise = 0;
      sfx.heal();
      msg('Offered Red Fanta at Spirit House! +20 HP, -15% INF');
      return;
    }
  }
}

function stepEnt(e, spd) {
  if (e.moving) {
    e.prog += spd;
    if (e.prog >= 1) {
      e.x = e.tx;
      e.y = e.ty;
      e.moving = false;
      e.prog = 0;
    }
  }
  e.px = e.moving ? e.x + (e.tx - e.x) * e.prog : e.x;
  e.py = e.moving ? e.y + (e.ty - e.y) * e.prog : e.y;
}

function updateMap() {
  G.t++;
  if (G.lock || G.dlg) return;
  const p = player;
  P.noise = Math.max(0, P.noise - 0.04);
  if (decoy && decoy.t > 0) decoy.t--;

  if (!p.moving) {
    let dx = 0;
    let dy = 0;
    if (keys.arrowleft || keys.a) dx = -1;
    else if (keys.arrowright || keys.d) dx = 1;
    else if (keys.arrowup || keys.w) dy = -1;
    else if (keys.arrowdown || keys.s) dy = 1;

    if (dx || dy) {
      p.dir = dx < 0 ? 2 : dx > 0 ? 3 : dy < 0 ? 1 : 0;
      if (map[p.y + dy]?.[p.x + dx] === 'L') {
        if (P.key) unlockGates();
        else if (G.msgT <= 0) msg('Locked gate! The P.E. Teacher has the keyring.');
      } else if (map[p.y + dy]?.[p.x + dx] === 'M') {
        if (G.msgT <= 0) msg('East Wing sealed! Defeat the Principal on stage for the Master Key.');
      } else if (map[p.y + dy]?.[p.x + dx] === 'G') {
        tryEscapeGate();
      } else if (free(p.x + dx, p.y + dy)) {
        p.tx = p.x + dx;
        p.ty = p.y + dy;
        p.moving = true;
        p.prog = 0;
        sfx.step();
      }
    }
  }

  if (p.moving) {
    p.walk += 0.45;
    if (P.rebel) P.noise = Math.min(100, P.noise + 0.05);
    trail.unshift({ x: p.px, y: p.py });
    if (trail.length > 40) trail.pop();
  }
  const was = p.moving;
  stepEnt(p, P.rebel ? 0.145 : 0.11);

  if (was && !p.moving) {
    const i = items.findIndex(o => o.x === p.x && o.y === p.y);
    if (i >= 0) {
      const o = items.splice(i, 1)[0];
      pickItem(o);
    }
  }

  if (G.grace > 0) G.grace--;

  for (const z of zs.slice()) {
    z.walk += z.moving ? 0.45 : 0.06;
    if (!z.boss && !TY[z.type].jar) {
      const dist = Math.hypot(z.x - p.x, z.y - p.y);
      const hasDecoy = decoy && decoy.t > 0;
      const sight = P.noise > 35 ? 17 : P.rebel ? 13 : 8;
      if (dist <= sight && !(P.inf >= 50 && !TY[z.type].mini && z.ign)) {
        z.alert = 240;
      } else if (z.alert > 0) {
        z.alert--;
      }

      const chasing = z.alert > 0 || hasDecoy;
      if (!z.moving) {
        z.cd = (z.cd || 0) - 1;
        if (z.cd <= 0) {
          z.cd = chasing ? 0 : rnd(14, 34);
          let moves = [];
          if (chasing) {
            const tx = hasDecoy ? decoy.x : p.x;
            const ty = hasDecoy ? decoy.y : p.y;
            const ax = tx - z.x;
            const ay = ty - z.y;
            const sx = Math.sign(ax);
            const sy = Math.sign(ay);
            if (Math.abs(ax) >= Math.abs(ay)) {
              if (sx) moves.push([sx, 0]);
              if (sy) moves.push([0, sy]);
            } else {
              if (sy) moves.push([0, sy]);
              if (sx) moves.push([sx, 0]);
            }
          } else {
            const r = (Math.random() * 4) | 0;
            moves.push([[1, 0], [-1, 0], [0, 1], [0, -1]][r]);
          }

          for (const [dx, dy] of moves) {
            z.dir = dx < 0 ? 2 : dx > 0 ? 3 : dy < 0 ? 1 : 0;
            const nx = z.x + dx;
            const ny = z.y + dy;
            const dk = nx + ',' + ny;
            if (map[ny]?.[nx] === 'd' && deskHp[dk]) {
              deskHp[dk]--;
              z.hp -= 5;
              z.cd = 22;
              sfx.hit();
              G.shake = 3;
              mapFl.push({ x: z.px * T + 8, y: z.py * T, t: '-5 SPIKE!', c: '#ffee55', l: 1 });
              if (deskHp[dk] <= 0) {
                delete deskHp[dk];
                map[ny][nx] = ny >= 20 ? ',' : '.';
                paintTile(nx, ny);
                msg('A zombie smashed through your spiked barricade!');
              }
              if (z.hp <= 0) {
                zs = zs.filter(o => o !== z);
                P.kills++;
                P.bht += 15;
                msg('Zombie impaled on your Spiked Barricade! (+15 BHT)');
              }
              break;
            }
            if (
              free(nx, ny) &&
              !zs.some(o => o !== z && o.tx === nx && o.ty === ny)
            ) {
              z.tx = nx;
              z.ty = ny;
              z.moving = true;
              z.prog = 0;
              break;
            }
          }
        }
      }
      stepEnt(z, TY[z.type].spd * (chasing ? 1.75 : 1));
    }

    const d = Math.hypot(z.px - p.px, z.py - p.py);
    const hitDist = z.boss || TY[z.type].jar ? 1.7 : TY[z.type].mini ? 0.95 : 0.7;
    if (d < hitDist && G.grace <= 0) {
      if (!z.boss && !TY[z.type].jar && !TY[z.type].mini && P.inf >= 50) {
        if (z.ign == null) z.ign = Math.random() < 0.65;
        if (z.ign) continue;
      }
      startBattle(z);
      break;
    }
  }
}

async function startBattle(z) {
  G.lock = true;
  sfx.alert();
  await anim(500, t => (G.wipe = t));
  const boss = z.boss;
  B = {
    e: z,
    sel: 0,
    busy: false,
    text: boss
      ? 'The Principal fused with the PA tower! "STAND AT ATTENTION!"'
      : TY[z.type].intro,
    pOff: 0,
    eOff: 0,
    pFlash: 0,
    eFlash: 0,
    eAlpha: 1,
    fl: [],
    parts: [],
    aim: null
  };
  G.scene = 'battle';
  await anim(500, t => (G.wipe = 1 - t));
}

function phaseOf(e) {
  return e.hp > 40 ? 0 : e.hp > 20 ? 1 : 2;
}
