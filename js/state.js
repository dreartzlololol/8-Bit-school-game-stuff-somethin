/* Game state and school map generation */
const keys = {};
let G = {
  scene: 'title',
  t: 0,
  shake: 0,
  wipe: 0,
  lock: false,
  msg: '',
  msgT: 0,
  grace: 0,
  intro: 0,
  chars: 0,
  dlg: null
};
let P, B, player, zs, items, used, map, mapCv;
let npcs = [];
let trail = [];
let deskHp = {};
let decoy = null;

const solidC = '#dthLPMG';
const free = (x, y) =>
  x >= 0 && y >= 0 && x < MW && y < MH && !solidC.includes(map[y][x]) && !npcs.some(n => n.x === x && n.y === y);

function buildMap() {
  map = [];
  for (let y = 0; y < MH; y++) {
    map.push([]);
    for (let x = 0; x < MW; x++) {
      map[y].push(x === 0 || y === 0 || x === MW - 1 || y === MH - 1 ? '#' : '.');
    }
  }
  const s = (x, y, c) => (map[y][x] = c);

  // Hallway walls and doors (West Campus x=1..31)
  for (let x = 1; x < 31; x++) {
    if (![5, 15, 25].includes(x)) {
      s(x, 6, '#');
      s(x, 13, '#');
    }
  }
  for (let y = 1; y < 6; y++) {
    s(10, y, y === 3 ? '.' : '#');
    s(21, y, y === 3 ? '.' : '#');
  }
  for (let y = 14; y < 19; y++) {
    if (y !== 16) s(21, y, '#');
  }

  // Classroom desks, stage, courtyard grass, trees, and spirit houses
  for (const y of [2, 4]) {
    [2, 3, 5, 6, 8].forEach(x => s(x, y, 'd'));
    [12, 13, 15, 16, 18].forEach(x => s(x, y, 'd'));
  }
  for (let y = 1; y < 6; y++) {
    for (let x = 22; x < 31; x++) s(x, y, 'S');
  }
  for (const y of [15, 17]) {
    [3, 4, 7, 8, 11, 12, 15, 16].forEach(x => s(x, y, 'd'));
  }
  for (let y = 14; y < 19; y++) {
    for (let x = 22; x < 31; x++) s(x, y, ',');
  }
  [[8, 8], [9, 8], [20, 11], [21, 11], [12, 9], [27, 9], [3, 11]].forEach(([x, y]) =>
    s(x, y, 'd')
  );
  [[23, 15], [29, 14], [25, 18], [30, 18], [22, 17]].forEach(([x, y]) =>
    s(x, y, 't')
  );
  s(28, 16, 'h');
  s(2, 9, 'h');
  s(19, 16, 'h');

  // Sports field zone (y=20..28) and South Boulevard (y=29..36)
  for (let x = 1; x < 31; x++) {
    if (x !== 10 && x !== 26) s(x, 19, '#');
  }
  for (let y = 20; y < 29; y++) {
    for (let x = 1; x < 31; x++) s(x, y, ',');
  }
  [3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 19].forEach(x => s(x, 22, 'd'));
  [[23, 21], [28, 22], [2, 27], [12, 27], [20, 26], [29, 27]].forEach(([x, y]) => s(x, y, 't'));
  s(28, 25, 'h');

  // South Gate Wall & Road (y=29..36, x=1..31)
  for (let x = 1; x < 31; x++) {
    if (x !== 15 && x !== 16) s(x, 29, '#');
  }
  for (let y = 30; y < MH - 1; y++) {
    for (let x = 1; x < 31; x++) {
      s(x, y, x >= 13 && x <= 18 ? '.' : ',');
    }
  }
  [[4, 32], [9, 34], [22, 32], [27, 34]].forEach(([x, y]) => s(x, y, 't'));
  s(11, 32, 'h');
  s(15, MH - 1, 'G');
  s(16, MH - 1, 'G');

  // Divider wall between West Campus and East Wing (x=31) with Master Gates ('M')
  for (let y = 1; y < MH - 1; y++) {
    s(31, y, y === 9 || y === 16 || y === 24 ? 'M' : '#');
  }

  // East Wing Zone 1: Music Room (y=1..6, x=32..46) & Science Lab (y=7..19, x=32..46)
  for (let y = 1; y < 6; y++) {
    for (let x = 32; x < MW - 1; x++) s(x, y, 'S');
  }
  for (let x = 32; x < MW - 1; x++) {
    if (x !== 36 && x !== 42) s(x, 6, '#');
  }
  [[34, 2], [38, 2], [44, 2], [34, 4], [44, 4]].forEach(([x, y]) => s(x, y, 'd'));

  for (let y = 7; y < 19; y++) {
    for (let x = 32; x < MW - 1; x++) s(x, y, 'c');
  }
  for (let x = 32; x < MW - 1; x++) {
    if (x !== 35 && x !== 42) s(x, 12, '#');
    if (x !== 39) s(x, 19, '#');
  }
  [[34, 8], [35, 8], [40, 8], [41, 8], [34, 15], [41, 15], [42, 15], [37, 17]].forEach(([x, y]) =>
    s(x, y, 'd')
  );
  s(45, 9, 'h');
  s(38, 12, 'P');

  // East Wing Zone 2: Southeast Banyan Shrine & Cursed Dragon Jar Crater (y=20..36, x=32..46)
  for (let y = 20; y < MH - 1; y++) {
    for (let x = 32; x < MW - 1; x++) {
      const dist = Math.hypot(x - 41, y - 31);
      s(x, y, dist < 4.5 ? 'F' : ',');
    }
  }
  [[33, 21], [45, 21], [34, 27], [45, 26], [33, 34], [45, 35], [37, 29]].forEach(([x, y]) =>
    s(x, y, 't')
  );
  s(34, 23, 'h');

  // Stage locks & PA boxes
  s(25, 6, 'L');
  s(21, 3, 'L');
  s(8, 6, 'P');
  s(16, 13, 'P');
  s(14, 19, 'P');

  // Pre-render static tiles to an offscreen canvas
  mapCv = document.createElement('canvas');
  mapCv.width = MW * T;
  mapCv.height = MH * T;
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      paintTile(x, y);
    }
  }
}

function paintTile(x, y) {
  const m = mapCv.getContext('2d');
  const R = (rx, ry, w, h, col) => {
    m.fillStyle = col;
    m.fillRect(rx, ry, w, h);
  };
  const c = map[y][x];
  const px = x * T;
  const py = y * T;
  const h = hash(x, y);

  if (c === '#' || c === 'P') {
    R(px, py, T, T, '#454b6e');
    for (let r = 0; r < 4; r++) {
      R(px, py + r * 4 + 3, T, 1, '#2f3450');
      const o = (r % 2) * 8;
      R(px + o, py + r * 4, 1, 4, '#2f3450');
      R(px + o + 8, py + r * 4, 1, 4, '#2f3450');
    }
    R(px, py, T, 2, '#6b73a0');
    if (c === 'P') {
      R(px + 3, py + 3, 10, 10, '#181c2b');
      R(px + 4, py + 4, 8, 8, '#394668');
      R(px + 6, py + 6, 4, 4, '#111');
      R(px + 10, py + 4, 2, 2, '#44ff66');
    }
    return;
  }

  if (c === ',' || c === 't') {
    R(px, py, T, T, h > 0.5 ? '#3b7a3a' : '#357034');
    for (let i = 0; i < 5; i++) {
      R(px + hash(x + i, y) * 14, py + hash(y, x + i) * 14, 1, 2, '#58a050');
    }
    if (y >= 20 && y % 4 === 0) R(px, py + 7, T, 1, '#ffffff66');
  } else if (c === 'S') {
    R(px, py, T, T, (x + y) % 2 ? '#6a3d7a' : '#5f3470');
    R(px, py + T - 1, T, 1, '#c9a13a');
    if (y === 1) R(px, py, T, 3, '#8a2a3a');
  } else if (c === 'c') {
    R(px, py, T, T, (x + y) % 2 ? '#6a90a8' : '#5d8299');
    R(px, py + T - 1, T, 1, '#3a5568');
    R(px + T - 1, py, 1, T, '#3a5568');
  } else if (c === 'F') {
    R(px, py, T, T, (x + y) % 2 ? '#4a2068' : '#3d1858');
    for (let i = 0; i < 3; i++) {
      R(px + hash(x + i, y) * 12, py + hash(y, x + i) * 12, 2, 2, '#9a44dd');
    }
  } else {
    const z =
      y > 13
        ? ['#a9ad9c', '#9a9e8e']
        : y < 6
        ? ['#9a7f58', '#8f7550']
        : ['#bfae8e', '#b3a283'];
    R(px, py, T, T, z[(x + y) % 2]);
    R(px, py + T - 1, T, 1, '#0002');
    R(px + T - 1, py, 1, T, '#0002');
    if (h > 0.8) R(px + 4, py + 5, 3, 1, '#0001');
  }

  if (c === 'd') {
    R(px + 2, py + 3, 12, 9, '#111');
    R(px + 3, py + 4, 10, 6, '#c4813f');
    R(px + 3, py + 9, 10, 2, '#8a5424');
    R(px + 4, py + 11, 2, 3, '#5a3a1a');
    R(px + 10, py + 11, 2, 3, '#5a3a1a');
    R(px + 5, py + 5, 4, 1, '#e0a060');
  }
  if (c === 't') {
    R(px + 6, py + 8, 4, 8, '#5a3a1a');
    for (const [ox, oy, r, col] of [
      [8, 5, 7, '#1f5a2a'],
      [5, 7, 5, '#2a7a38'],
      [11, 7, 5, '#2a7a38'],
      [8, 3, 5, '#3a9a48']
    ]) {
      m.fillStyle = col;
      m.beginPath();
      m.arc(px + ox, py + oy, r, 0, 7);
      m.fill();
    }
  }
  if (c === 'h') {
    R(px + 4, py + 10, 8, 5, '#777');
    R(px + 5, py + 5, 6, 6, '#d9a62e');
    R(px + 6, py + 7, 4, 4, '#3a2a10');
    R(px + 2, py + 3, 12, 3, '#b3262f');
    R(px + 4, py + 1, 8, 2, '#d03a40');
    R(px + 7, py + 12, 2, 2, '#f33');
  }
}

function newGame() {
  buildMap();
  P = {
    hp: 40, max: 40, inf: 0, noise: 0, ya: 2, moo: 2, kills: 0, lv: 1,
    fanta: 0, wp: { loud: 0, quiet: 0 }, key: false, dog: false, rd: false, amulet: false,
    desks: 1, rebel: false, vials: 0, cured: false, postBoss: false, bht: 20, mapOn: true
  };
  G.ending = '';
  deskHp = {};
  decoy = null;
  npcs = [
    { id: 'auntie', x: 6, y: 16 },
    { id: 'shop', x: 12, y: 16 },
    { id: 'rd', x: 4, y: 3 },
    { id: 'occult', x: 14, y: 10 },
    { id: 'dog', x: 25, y: 16 },
    { id: 'nerd', x: 36, y: 15 }
  ];
  trail = [];
  G.dlg = null;
  used = new Set();
  player = { x: 2, y: 10, px: 2, py: 10, tx: 2, ty: 10, moving: false, prog: 0, dir: 3, walk: 0 };

  const fr = [];
  for (let y = 1; y < MH - 1; y++) {
    for (let x = 1; x < MW - 1; x++) {
      if (free(x, y)) fr.push([x, y]);
    }
  }
  const pick = f => {
    for (;;) {
      const c = fr[(Math.random() * fr.length) | 0];
      if (f(c)) return c;
    }
  };

  zs = [];
  const typeList = [
    'norm', 'norm', 'norm', 'norm', 'norm', 'norm', 'norm', 'norm',
    'runner', 'runner', 'runner', 'runner', 'runner',
    'armor', 'armor', 'armor', 'armor',
    'cheer', 'cheer', 'cheer'
  ];
  for (let i = 0; i < typeList.length; i++) {
    const [x, y] = pick(c => Math.abs(c[0] - 2) + Math.abs(c[1] - 10) > 9 && !(c[0] > 21 && c[1] < 6));
    zs.push({
      x,
      y,
      px: x,
      py: y,
      tx: x,
      ty: y,
      moving: false,
      prog: 0,
      cd: rnd(20, 90),
      hp: TY[typeList[i]].hp,
      boss: false,
      type: typeList[i],
      dir: 0,
      walk: 0,
      ign: null
    });
  }
  zs.push({ x: 27, y: 3, px: 27, py: 3, tx: 27, ty: 3, hp: 60, boss: true, type: 'boss', dir: 2, walk: 0, moving: false, prog: 0 });
  zs.push({ x: 18, y: 16, px: 18, py: 16, tx: 18, ty: 16, moving: false, prog: 0, cd: 60, hp: TY.pe.hp, boss: false, type: 'pe', dir: 2, walk: 0, ign: null });
  zs.push({ x: 41, y: 3, px: 41, py: 3, tx: 41, ty: 3, moving: false, prog: 0, cd: 50, hp: TY.dancer.hp, boss: false, type: 'dancer', dir: 0, walk: 0, ign: null });
  zs.push({ x: 41, y: 31, px: 41, py: 31, tx: 41, ty: 31, moving: false, prog: 0, cd: 999, hp: TY.jar.hp, boss: false, type: 'jar', dir: 0, walk: 0, ign: null });
  zs.forEach(z => (z.max = z.hp));

  items = [
    { x: 44, y: 3, k: 'vac' },
    { x: 44, y: 16, k: 'vac' },
    { x: 35, y: 28, k: 'vac' }
  ];
  const kinds = [
    'ya', 'ya', 'ya', 'ya', 'ya', 'ya',
    'moo', 'moo', 'moo', 'moo', 'moo', 'moo', 'moo', 'moo',
    'fanta', 'fanta', 'fanta', 'fanta', 'fanta',
    'wl', 'wl', 'wq', 'wq'
  ];
  for (const k of kinds) {
    const [x, y] = pick(c => !(c[0] > 21 && c[0] < 31 && c[1] < 6));
    items.push({ x, y, k });
  }

  msg('Find the keyring to open the stage gates!', 220);
  G.grace = 60;
  G.lock = false;
}

function msg(t, d = 160) {
  G.msg = t;
  G.msgT = d;
}
