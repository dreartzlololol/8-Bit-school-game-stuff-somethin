/* Turn-based battle logic */
function floater(x, y, t, c) {
  B.fl.push({ x, y, t: String(t), c, l: 1 });
}

function burst(x, y, c, n = 14) {
  for (let i = 0; i < n; i++) {
    B.parts.push({ x, y, vx: rnd(-2.5, 2.5), vy: rnd(-3, 1), l: 1, c });
  }
}

function hurtP(d, why) {
  P.hp = Math.max(0, P.hp - d);
  B.pFlash = 14;
  G.shake = 7;
  sfx.hurt();
  floater(80, 68, '-' + d, '#ff5555');
  burst(80, 95, '#c22');
  if (why) B.text = why;
}

function runTimingBar() {
  return new Promise(res => {
    B.aim = { pos: 0, hit: false, mult: 1, label: '' };
    const t0 = performance.now();
    const dur = 580;
    (function step() {
      const t = Math.min(1, (performance.now() - t0) / dur);
      if (!B.aim.hit) B.aim.pos = t;
      if (B.aim.hit || t >= 1) {
        const p = B.aim.pos;
        if (B.aim.hit && p >= 0.41 && p <= 0.59) {
          B.aim.mult = 1.6;
          B.aim.label = 'PERFECT CRIT! ';
          tone(880, 0.1, 'triangle', 0.07);
          setTimeout(() => tone(1320, 0.15, 'triangle', 0.07), 60);
        } else if (B.aim.hit && p >= 0.27 && p <= 0.73) {
          B.aim.mult = 1.25;
          B.aim.label = 'NICE HIT! ';
          tone(740, 0.1, 'triangle', 0.05);
        }
        const out = { ...B.aim };
        setTimeout(() => {
          B.aim = null;
          res(out);
        }, 140);
        return;
      }
      requestAnimationFrame(step);
    })();
  });
}

async function act(k) {
  if (B.busy) return;
  const e = B.e;
  const ph = e.boss ? phaseOf(e) : 0;
  const bonus = P.lv - 1;
  B.busy = true;

  if ((k === 2 && P.ya <= 0) || (k === 3 && P.moo <= 0)) {
    B.text = 'You are out of that item!';
    B.busy = false;
    return;
  }

  if (k < 2) {
    const loud = k === 0;
    B.text = 'PRESS [SPACE] IN THE GOLD ZONE FOR CRIT!';
    const timing = await runTimingBar();
    B.text =
      timing.label +
      (loud
        ? `You SMASH with ${WL[P.wp.loud]}!`
        : `You strike quietly with ${WQ[P.wp.quiet]}.`);
    await anim(280, t => (B.pOff = Math.sin(t * Math.PI) * 110));
    let d = Math.round(loud ? rnd(9, 14) + P.wp.loud * 3 : rnd(4, 8) + P.wp.quiet * 3) + bonus;
    d = Math.round(d * timing.mult * (P.rebel ? 1.45 : 1));
    const ty = TY[e.type];
    if (!loud && ty.armor) {
      d = Math.max(1, Math.round(d * 0.4));
      B.text = 'The armor absorbs your jab!';
    }
    if (!loud && ty.parry && timing.mult < 1.5) {
      d = Math.max(1, Math.round(d * 0.3));
      B.text = 'He parries your quiet jab! (Hit PERFECT to break parry!)';
    }
    e.hp = Math.max(0, e.hp - d);
    B.eFlash = 10;
    G.shake = timing.mult > 1.5 ? 12 : loud ? 9 : 3;
    sfx.hit();
    floater(240, 58, (timing.mult > 1.5 ? 'CRIT -' : '-') + d, timing.mult > 1.5 ? '#ffee44' : '#ffffff');
    burst(240, 90, timing.mult > 1.5 ? '#ffee44' : '#8f8', timing.mult > 1.5 ? 24 : 14);
    P.noise = Math.min(100, P.noise + (loud ? 22 : timing.mult > 1.5 ? 2 : 4));

    if (e.hp > 0 && e.boss && ph === 1) {
      await sleep(250);
      hurtP(6, 'You moved during the National Anthem! (-6 HP)');
    }
  }

  if (k === 2) {
    P.ya--;
    P.inf = Math.max(0, P.inf - 30);
    sfx.heal();
    B.text = 'You sniff Ya Dom inhaler! Infection drops by 30%.';
    floater(80, 68, '-30% INF', '#d896ff');
    await sleep(600);
  }

  if (k === 3) {
    P.moo--;
    P.hp = Math.min(P.max, P.hp + 15);
    P.inf = Math.max(0, P.inf - 5);
    sfx.heal();
    B.text = 'Ate warm Moo Ping! Restored +15 HP and -5% INF.';
    floater(80, 68, '+15 HP', '#66ff66');
    await sleep(600);
  }

  await sleep(300);

  if (P.dog && e.hp > 0) {
    e.hp = Math.max(0, e.hp - 3);
    floater(240, 70, '-3 DOG', '#ffcc88');
    B.text = 'The school dog bites the enemy!';
    sfx.hit();
    await sleep(400);
  }

  if (e.hp > 0 && P.hp > 0) {
    const p2 = e.boss ? phaseOf(e) : 0;
    B.text = e.boss
      ? [
          '"LINE UP FOR MORNING ASSEMBLY!"',
          '"ANTHEM PLAYING - DO NOT MOVE!"',
          '"STATIC OVERLOAD!!"'
        ][p2]
      : TY[e.type].atk;
    await anim(300, t => (B.eOff = -Math.sin(t * Math.PI) * 110));
    const t2 = TY[e.type];
    if (t2.scream && Math.random() < 0.5) {
      P.noise = Math.min(100, P.noise + 30);
      B.text = 'The cheerleader SCREAMS! Noise +30%!';
      floater(160, 60, 'NOISE +30', '#ffaa33');
      G.shake = 6;
      await sleep(300);
    } else {
      let d = Math.round(rnd(3, 7)) + p2 * 2 + (t2.mini ? 3 : 0) + (t2.armor ? 1 : 0);
      if (P.noise >= 100) d += 5;
      d = Math.max(1, Math.round(d * (P.rebel ? 1.25 : 0.8)));
      if (P.rd) d = Math.max(1, Math.round(d * 0.7));
      hurtP(d);
      if (p2 === 2) P.noise = Math.min(100, P.noise + 10);
      if (Math.random() < (e.boss ? 0.3 : t2.bite)) {
        if (P.cured) {
          floater(80, 48, 'CURED (IMMUNE)', '#66ffcc');
        } else if (P.amulet && !B.amuletUsed) {
          B.amuletUsed = true;
          B.text = 'Your amulet blocks the bite!';
          floater(80, 48, 'BLOCKED', '#ffee77');
        } else {
          P.inf = Math.min(100, P.inf + 12);
          floater(80, 48, 'BITTEN +12%', '#d896ff');
        }
        await sleep(300);
      }
    }    if (P.noise >= 100) {
      B.text = 'MAX NOISE! The horde powers up the enemy!';
    }
    await sleep(300);
  }

  if (P.hp <= 0 || P.inf >= 100) {
    B.text = P.inf >= 100 ? 'The zombie fever overtakes you...' : 'You collapse on the classroom floor...';
    await sleep(900);
    return endGame(false);
  }

  if (e.hp <= 0) {
    B.text = e.boss
      ? 'The PA tower explodes! Dropped the MASTER GATE KEY!'
      : e.type === 'jar'
      ? 'The Cursed Dragon Jar shatters! The purple fog clears!'
      : 'Enemy defeated!';
    await anim(600, t => (B.eAlpha = 1 - t));
    if (e.type === 'jar') {
      G.ending = P.cured ? 'TRUE HERO' : 'DRAGON SLAYER';
      await sleep(300);
      return endGame(true);
    }
    zs = zs.filter(z => z !== e);
    P.kills++;
    P.bht += 15;
    let m = 'Zombie defeated! (+15 BHT)';
    if (e.type === 'pe') P.key = true;
    if (P.kills % 2 === 0 || e.boss || e.type === 'dancer') {
      P.lv++;
      P.max += 6;
      P.hp = Math.min(P.max, P.hp + 12);
      m = 'LEVEL UP! You are now Lv ' + P.lv + '!';
    }
    if (Math.random() < 0.4) {
      P.moo++;
      m += ' Found Moo Ping!';
    }
    if (e.type === 'pe') m = 'GOT THE KEYRING! The stage gates can open.';
    if (e.type === 'dancer') m = 'MUSIC ROOM DANCER BANISHED! Level Up!';
    if (e.boss) m = 'ACT 2 UNLOCKED: East Science Wing & South Gate Open!';
    B.text = m;
    await sleep(900);
    await anim(500, t => (G.wipe = t));
    G.scene = 'map';
    G.lock = false;
    G.grace = 90;
    if (e.boss) onPrincipalDefeated();
    else msg(m);
    await anim(500, t => (G.wipe = 1 - t));
    return;
  }

  B.busy = false;
}

async function endGame(w) {
  await anim(600, t => (G.wipe = t));
  G.scene = 'end';
  G.won = w;
  G.t = 0;
  await anim(600, t => (G.wipe = 1 - t));
}
