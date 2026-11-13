/* Keyboard controls and story intro text */
addEventListener('keydown', e => {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  }
  const k = e.key.toLowerCase();
  keys[k] = 1;

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) {
    e.preventDefault();
  }
  if (k === 'm') mute = !mute;
  if (k === 'tab' && G.scene === 'map') P.mapOn = !P.mapOn;

  const go = k === 'enter' || k === ' ';
  if (G.scene === 'title' && go) {
    G.scene = 'intro';
    G.intro = 0;
    G.chars = 0;
    sfx.menu();
  } else if (G.scene === 'intro' && go) {
    const L = introText[G.intro];
    if (G.chars < L.length) {
      G.chars = L.length;
    } else {
      G.intro++;
      G.chars = 0;
      if (G.intro >= introText.length) {
        newGame();
        G.scene = 'map';
      }
    }
  } else if (G.scene === 'end' && go) {
    G.scene = 'title';
  } else if (G.scene === 'map' && G.dlg && go) {
    advanceDlg();
  } else if (G.scene === 'map' && go && !G.lock) {
    interact();
  } else if (G.scene === 'map' && k === 'f' && !G.lock && !G.dlg) {
    drinkFanta();
  } else if (G.scene === 'map' && k === 'e' && !G.lock && !G.dlg) {
    toggleStance();
  } else if (G.scene === 'map' && k === 'b' && !G.lock && !G.dlg) {
    useDesk();
  } else if (G.scene === 'battle' && B.aim && (go || k === '1' || k === '2')) {
    B.aim.hit = true;
  } else if (G.scene === 'battle' && !B.busy) {
    if (k === 'e') {
      toggleStance();
      return;
    }
    if (k === 'arrowleft' || k === 'arrowright') {
      B.sel ^= 1;
      sfx.menu();
    }
    if (k === 'arrowup' || k === 'arrowdown') {
      B.sel ^= 2;
      sfx.menu();
    }
    if (go) act(B.sel);
    if ('1234'.includes(k) && k.length === 1) {
      B.sel = k - 1;
      act(k - 1);
    }
  }
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = 0;
});

const introText = [
  'SPORTS DAY - PHOTHAWATTANASENEE SCHOOL, PHOTHARAM.',
  'A purple fog rolled in from the Mae Klong River. The iced drinks at the front gate were tainted. Half the school is not human anymore.',
  'The infection signal blasts from the PA speakers on the main stage. Stay quiet, watch your infection meter, and shut it down!',
  'CONTROLS: [WASD/Arrows] Move | [SPACE] Talk/Pray/PA | [E] Stance | [B] Desk Barricade | [F] Fanta'
];
