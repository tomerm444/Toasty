/* טוסטי הגיבור — worlds, level building, enemies, bosses */
'use strict';
(() => {
const G = window.G, M = G.mesh, TAU = G.TAU, V3 = THREE.Vector3;
const CYL = (a, b, h, s = 32, hs = 1, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(a, b, h, s, hs, open, t0, tl);
const SPH = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);

/* ================= THE SIX FOOD WORLDS ================= */
G.THEMES = [
  { id: 'pizza', name: 'פיצה־לנד', blurb: 'פיצה ענקית מעל ים של רוטב עגבניות',
    sky: ['#8f9ff0', '#ffd9c4', '#fff2e6'], fog: '#ffe6d6', sun: '#fff0d2', hemi: ['#fff0e0', '#c48a6a'],
    sea: '#d8452d', seaRough: .2, top: '#ffd164', side: '#e6b06a', rim: '#d4893e', plats: [['#f0c063', '#c98a4f'], ['#ffd164', '#e6b06a']],
    item: 'pepperoni', itemName: 'פפרוני', friend: 'onion', friendName: 'בצלצל', enemies: ['olive', 'tomato', 'pineapple'],
    boss: 'mushroom', bossName: 'פטריית הענק', bossHint: 'היא מסתערת! קפצו הצידה, וכשהיא נתקעת בקיר ומסוחררת — קפצו עליה.',
    music: { bpm: 132, wave: 'triangle', mel: [523, 0, 659, 784, 659, 0, 523, 587, 659, 0, 587, 523, 440, 0, 494, 523], bass: [131, 131, 175, 175, 147, 147, 196, 196] } },
  { id: 'candy', name: 'ארץ הממתקים', blurb: 'עוגיות, מרשמלו ונהר של שוקולד',
    sky: ['#7fb6ff', '#ffd0ec', '#fff0f8'], fog: '#ffe0f2', sun: '#fff4f0', hemi: ['#fff0fa', '#c08aa8'],
    sea: '#6b3a22', seaRough: .12, top: '#ffe3f0', side: '#c98a5a', rim: '#ff7ab8', plats: [['#7a4a2a', '#5a321c'], ['#ffffff', '#ffd0ec']],
    item: 'candy', itemName: 'סוכריות', friend: 'cupcake', friendName: 'קאפקייקי', enemies: ['gummy', 'jellybean', 'candycorn'],
    boss: 'lollipop', bossName: 'מלך הסוכריות', bossHint: 'הוא קופץ ויוצר גלי הלם — קפצו מעליהם! כשהוא מסוחרר, תקפו.',
    music: { bpm: 140, wave: 'square', mel: [784, 659, 784, 880, 784, 0, 659, 587, 523, 587, 659, 784, 659, 0, 587, 0], bass: [196, 196, 165, 165, 175, 175, 147, 147] } },
  { id: 'kitchen', name: 'המטבח הגדול', blurb: 'קרשי חיתוך, מחבתות ומים עם קצף סבון',
    sky: ['#86c5ff', '#e6f3ff', '#ffffff'], fog: '#eaf4ff', sun: '#ffffff', hemi: ['#f4f8ff', '#9aa8b8'],
    sea: '#7fc4e8', seaRough: .1, top: '#d9a066', side: '#b07a45', rim: '#8a5a30', plats: [['#ffffff', '#dfe6ee'], ['#3a3f4a', '#2a2e36']],
    item: 'sugar', itemName: 'קוביות סוכר', friend: 'teacup', friendName: 'כוסונת', enemies: ['sponge', 'fork', 'whisk'],
    boss: 'kettle', bossName: 'הקומקום הרותח', bossHint: 'קפצו מעל קרן הקיטור! כשהמכסה עף — הוא מסוחרר.',
    music: { bpm: 126, wave: 'triangle', mel: [440, 523, 659, 523, 440, 0, 392, 440, 494, 0, 523, 494, 440, 392, 349, 0], bass: [110, 110, 147, 147, 131, 131, 98, 98] } },
  { id: 'breakfast', name: 'בוקר טוב', blurb: 'פנקייקים, וופלים וים של חלב עם דגני בוקר',
    sky: ['#6fb8ff', '#fff1c9', '#fffaf0'], fog: '#fff3d9', sun: '#fff6dc', hemi: ['#fffaf0', '#c8a070'],
    sea: '#fff8ee', seaRough: .12, top: '#f2b65e', side: '#e0a050', rim: '#c97a2a', plats: [['#e8b05a', '#c98a3f'], ['#ffffff', '#f2f2f2']],
    item: 'blueberry', itemName: 'אוכמניות', friend: 'strawberry', friendName: 'תותית', enemies: ['bacon', 'coffeebean', 'cornflake'],
    boss: 'pancakes', bossName: 'מגדל הפנקייקים', bossHint: 'קפצו מעל הפנקייקים המעופפים והתרחקו מהעיגולים האדומים.',
    music: { bpm: 120, wave: 'triangle', mel: [659, 0, 784, 0, 880, 784, 659, 0, 587, 659, 523, 0, 587, 0, 494, 0], bass: [165, 165, 131, 131, 147, 147, 123, 123] } },
  { id: 'icecream', name: 'הרי הגלידה', blurb: 'גבעות קרח חלקלקות וים של גלידת תות',
    sky: ['#7ec8ff', '#e0f4ff', '#ffffff'], fog: '#eaf6ff', sun: '#ffffff', hemi: ['#f0f8ff', '#a0b8d0'],
    sea: '#ffb3cf', seaRough: .15, top: '#fff6e8', side: '#e0a35a', rim: '#ff9cc6', plats: [['#c8eeff', '#9fd6f5'], ['#e8b97a', '#c98a4f']], slippery: true,
    item: 'cherry', itemName: 'דובדבנים', friend: 'scoop', friendName: 'גלידונת', enemies: ['popsicle', 'icecube', 'snowball'],
    boss: 'icecream', bossName: 'גביע הקרח', bossHint: 'הכדורים מתגלגלים — קפצו מעליהם! מסוחרר? הסתובבו לידו או נחתו בנחיתת רעם.',
    music: { bpm: 112, wave: 'sine', mel: [880, 0, 784, 659, 784, 0, 659, 587, 659, 0, 523, 0, 587, 659, 523, 0], bass: [220, 220, 175, 175, 196, 196, 165, 165] } },
  { id: 'spicy', name: 'הר הצ׳ילי', blurb: 'נאצ׳וס, טורטיות וים של סלסה רותחת',
    sky: ['#4a2a6a', '#ff9a6b', '#ffd2a0'], fog: '#ffb88a', sun: '#ffd0a0', hemi: ['#ffd8b0', '#8a3a3a'],
    sea: '#ff5a1e', seaRough: .3, seaGlow: .8, top: '#f2c46d', side: '#d9a04a', rim: '#b87a2a', plats: [['#ffcf5a', '#e0a030'], ['#7a3a1a', '#5a2a12']],
    item: 'corn', itemName: 'גרעיני תירס', friend: 'avocado', friendName: 'אבוקדון', enemies: ['chili', 'jalapeno', 'saucebottle'],
    boss: 'hotsauce', bossName: 'הרוטב הלוהט', bossHint: 'הבוס האחרון משלב הכול: הסתערות, גלי הלם, גשם אש וקרן להבה!',
    music: { bpm: 148, wave: 'square', mel: [587, 0, 587, 698, 0, 587, 523, 0, 466, 0, 523, 587, 698, 784, 698, 0], bass: [147, 147, 147, 117, 117, 131, 131, 110] } }
];
const ENEMY_KIND = { olive: 'walker', pineapple: 'roller', lemon: 'walker', gummy: 'walker', sponge: 'walker', bacon: 'walker', popsicle: 'walker', chili: 'walker',
  tomato: 'hopper', jellybean: 'hopper', fork: 'hopper', coffeebean: 'hopper', icecube: 'hopper', jalapeno: 'hopper',
  meatball: 'roller', snowball: 'roller', candycorn: 'flyer', whisk: 'flyer', cornflake: 'flyer', saucebottle: 'shooter' };
const BOSS_DEF = {
  mushroom: { hp: 3, cycles: [['charge'], ['charge', 'charge']], shot: 'meatball', mode: 'lob', speed: 15 },
  lollipop: { hp: 3, cycles: [['slam', 'slam', 'shoot'], ['slam', 'shoot', 'slam', 'shoot']], shot: 'candy', mode: 'lob', speed: 13 },
  kettle: { hp: 3, cycles: [['sweep', 'shoot'], ['shoot', 'sweep', 'shoot']], shot: 'drop', mode: 'lob', speed: 12 },
  pancakes: { hp: 4, cycles: [['shoot', 'rain'], ['shoot', 'rain', 'shoot']], shot: 'pancake', mode: 'flat', speed: 12 },
  icecream: { hp: 4, cycles: [['shoot', 'slam'], ['shoot', 'slam', 'shoot']], shot: 'scoop', mode: 'roll', speed: 12 },
  hotsauce: { hp: 5, cycles: [['charge', 'slam', 'rain'], ['sweep', 'charge', 'rain', 'slam']], shot: 'fire', mode: 'lob', speed: 16 }
};

let L = null;
G.ev = {};
const say = (k, ...a) => G.ev[k] && G.ev[k](...a);

/* ================= LEVEL BUILDING ================= */
function seaMaterial(T) {
  const m = new THREE.MeshStandardMaterial({ color: G.C(T.sea), roughness: T.seaRough, metalness: .05, envMapIntensity: 1 });
  if (T.seaGlow) { m.emissive = G.C(T.sea); m.emissiveIntensity = T.seaGlow; }
  m.onBeforeCompile = sh => { sh.uniforms.uTime = G.seaTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n transformed.z += sin(position.x*.07+uTime*.9)*.45 + cos(position.y*.09+uTime*1.2)*.35;'); };
  return m;
}
G.seaTime = { value: 0 };

function island(x, y, z, r, opt = {}) {
  const T = L.T, g = new THREE.Group(); g.position.set(x, y, z); L.stat.add(g);
  const topMat = G.mat(T.top, T.id === 'icecream' ? .15 : .45, { envMapIntensity: T.id === 'icecream' ? 1.2 : .8 });
  M(CYL(r, r, .5, 48), topMat, 0, -.25, 0, g);
  M(CYL(r * .98, r * .7, 2.2, 40), G.mat(T.side, .75), 0, -1.6, 0, g);
  M(new THREE.ConeGeometry(r * .7, 3.2, 32), G.mat(T.side, .8), 0, -4.3, 0, g).rotation.x = Math.PI;
  const rim = M(new THREE.TorusGeometry(r, .32, 10, 56), G.mat(T.rim, .5), 0, -.02, 0, g); rim.rotation.x = Math.PI / 2;
  decorate(g, r, opt);
  G.addCyl(x, z, r + .15, y - 6, y);
  return { x, y, z, r, g };
}
function decorate(g, r, opt) {
  const T = L.T, rnd = L.rnd, n = Math.round(r * 1.2) + 2;
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * (r - .9);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (opt.clear && Math.hypot(x - opt.clear[0], z - opt.clear[1]) < 3) continue;
    switch (T.id) {
      case 'pizza': if (i % 3 === 2) M(SPH(.3, 12, 6), G.gloss('#3f9a3a'), x, .03, z, g, false).scale.set(1, .1, .5);
        else if (i % 3 === 1) M(new THREE.TorusGeometry(.17, .08, 8, 18), G.gloss('#2b1c30'), x, .05, z, g, false).rotation.x = Math.PI / 2;
        else { const m = M(CYL(.4, .4, .08, 20, 1, false, 0, Math.PI), G.mat('#e8d2b0', .6), x, .04, z, g, false); m.rotation.y = a; } break;
      case 'candy': { const c = ['#ff5fa2', '#5ecbff', '#ffd23f', '#7be36a'][i % 4]; if (i % 2) M(SPH(.32, 14, 10, 0, TAU, 0, Math.PI / 2), G.gloss(c), x, 0, z, g, false).scale.set(1, .9, 1); else M(G.RB(.36, .08, .1, .04, 1), G.gloss(c), x, .04, z, g, false).rotation.y = a; break; }
      case 'kitchen': if (i % 2) M(CYL(.12, .08, .9, 10), G.gloss('#ff8a2b'), x, .1, z, g, false).rotation.z = Math.PI / 2; else M(new THREE.TorusGeometry(.25, .06, 6, 16), G.gloss('#f4f0e0'), x, .06, z, g, false).rotation.x = Math.PI / 2; break;
      case 'breakfast': if (i % 3 === 0) { M(CYL(.7, .7, .06, 24), G.mat('#ffffff', .3), x, .03, z, g, false); M(SPH(.3, 14, 10), G.gloss('#ffc21a'), x, .06, z, g, false).scale.set(1, .5, 1); } else M(G.RB(.4, .14, .4, .05, 1), G.gloss('#ffe26a'), x, .07, z, g, false); break;
      case 'icecream': M(SPH(.35, 12, 8), G.gloss(['#ff9cc6', '#a8e0ff', '#fff6e0'][i % 3]), x, .02, z, g, false).scale.set(1, .35, 1); break;
      case 'spicy': if (i % 2) M(SPH(.3, 10, 8), G.gloss('#5aa83a'), x, .05, z, g, false).scale.set(1.6, .4, 1); else M(CYL(.28, .28, .07, 3), G.mat('#ffcf5a', .5), x, .04, z, g, false); break;
    }
  }
}
function platform(x, y, z, r, opt = {}) {
  const T = L.T, [top, side] = T.plats[opt.style ?? (L.rnd() < .5 ? 0 : 1)];
  const g = new THREE.Group(); g.position.set(x, y, z); (opt.dynamic ? L.dyn : L.stat).add(g);
  let col;
  const tri = T.id === 'spicy' && opt.style === 0;
  if (opt.box) {
    G.outline(M(G.RB(r * 2, .6, r * 2, .14, 2), [G.mat(side, .6), G.mat(side, .6), G.mat(top, .5), G.mat(side, .6), G.mat(side, .6), G.mat(side, .6)], 0, -.3, 0, g), .02);
    col = G.addBox(x, z, r, r, y - .6, y);
  } else {
    const geo = new THREE.CylinderGeometry(r, r * .92, .6, tri ? 3 : 32);
    G.outline(M(geo, [G.mat(side, .6), G.mat(top, .45), G.mat(side, .6)], 0, -.3, 0, g), .02);
    col = G.addCyl(x, z, tri ? r * .7 : r, y - .6, y);
  }
  if (opt.bouncy) {
    const j = M(SPH(r * .75, 24, 12, 0, TAU, 0, Math.PI / 2), G.mat('#ff7ab8', .1, { envMapIntensity: 1.4, transparent: true, opacity: .85 }), 0, 0, 0, g); j.scale.y = .45;
    col.bouncy = true; col.jelly = j; col.y1 += .2;
  }
  if (opt.moving) L.movers.push({ col, g, base: new V3(x, y, z), axis: opt.moving.axis, amp: opt.moving.amp, speed: opt.moving.speed, ph: opt.moving.ph || 0, last: new V3(x, y, z) });
  if (opt.falling) { L.fallers.push({ col, g, baseY: y, state: 'idle', t: 0 }); col.faller = L.fallers[L.fallers.length - 1];
    M(new THREE.TorusGeometry(r * .7, .05, 6, 24), G.mat('#ff5a3a', .4), 0, .02, 0, g, false).rotation.x = Math.PI / 2; }
  return { x, y, z, r, g, col };
}
function addItem(x, y, z) { L.items.push({ p: new V3(x, y, z), alive: true }); }
function addEnemy(type, home, at) {
  const kind = ENEMY_KIND[type], mesh = G.enemyMesh[type]();
  L.dyn.add(mesh);
  const e = { type, kind, mesh, home, pos: at.clone(), t: L.rnd() * 3, dir: L.rnd() * TAU, alive: true, r: mesh.userData.r, h: mesh.userData.h, target: at.clone(), vy: 0, air: false };
  if (kind === 'flyer') e.pos.y = home.y + 2.4;
  mesh.position.copy(e.pos); L.enemies.push(e); return e;
}
function addFriend(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); L.dyn.add(g);
  const f = G.friendMesh[L.T.friend](); g.add(f);
  const bub = new THREE.Mesh(SPH(1.05, 32, 20), G.bubbleMat); g.add(bub);
  L.friends.push({ g, f, bub, p: new V3(x, y, z), saved: false, t: 0 });
}
function addChili(x, y, z) { const m = G.chiliMesh(); m.position.set(x, y, z); L.dyn.add(m); L.chilis.push({ m, p: new V3(x, y, z), alive: true }); }
function addToaster(x, y, z, yaw, isStart) {
  const m = G.toasterMesh(); m.position.set(x, y, z); m.rotation.y = yaw; L.stat.add(m);
  G.addBox(x, z, Math.abs(Math.cos(yaw)) * 1.25 + Math.abs(Math.sin(yaw)) * .68, Math.abs(Math.sin(yaw)) * 1.25 + Math.abs(Math.cos(yaw)) * .68, y, y + 1.55);
  const cp = { m, p: new V3(x, y, z), yaw, on: !!isStart, spawn: new V3(x, y, z) };
  L.cps.push(cp); if (isStart) L.cp = cp; return cp;
}
function addSpinner(isl) {
  const T = L.T, len = isl.r * 2 - 1.4, g = new THREE.Group(); g.position.set(isl.x, isl.y + .5, isl.z); L.dyn.add(g);
  const colr = { pizza: '#e8c48a', candy: '#ff4d6d', kitchen: '#c8ced8', breakfast: '#b8432f', icecream: '#e8c08a', spicy: '#ff6a2b' }[T.id];
  G.outline(M(G.RB(len, .45, .45, .2, 2), G.gloss(colr), 0, 0, 0, g), .03);
  M(CYL(.4, .4, .6, 20), G.mat('#3a2a2a', .4), 0, -.2, 0, g);
  [-1, 1].forEach(s => M(SPH(.32, 14, 10), G.gloss('#ffffff'), s * len / 2, 0, 0, g));
  L.spinners.push({ g, isl, len, y: isl.y, speed: (.9 + L.w * .12) * (L.rnd() < .5 ? -1 : 1) });
}
function farDecor() {
  const T = L.T, rnd = L.rnd, g = L.stat, cx = L.mid.x, cz = L.mid.z;
  const place = (fn, n, rad) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(), d = rad + rnd() * 30; fn(cx + Math.cos(a) * d, L.seaY, cz + Math.sin(a) * d, i); } };
  switch (T.id) {
    case 'pizza': place((x, y, z, i) => { const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.set(.15, rnd() * TAU, .2); g.add(s);
      const ch = G.mat('#e3e8ef', .15, { metalness: 1 }); M(G.RB(1.2, 22, .5, .2, 1), ch, 0, 9, 0, s, false);
      if (i % 2) for (let k = -1; k <= 1; k++) M(G.RB(.35, 6, .35, .15, 1), ch, k * .6, 22, 0, s, false); else M(G.RB(3, 7, .4, .3, 1), ch, .9, 23, 0, s, false); }, 6, 70); break;
    case 'candy': place((x, y, z, i) => { M(CYL(.5, .5, 26, 10), G.mat('#ffffff', .5), x, y + 13, z, g, false);
      const d = M(CYL(5, 5, 1.2, 32), G.gloss(['#ff5fa2', '#5ecbff', '#ffd23f', '#7be36a'][i % 4]), x, y + 27, z, g, false); d.rotation.x = Math.PI / 2; d.rotation.z = rnd(); }, 8, 70); break;
    case 'kitchen': place((x, y, z, i) => { for (let k = 0; k < 8; k++) M(CYL(5, 4.6, .6, 32), G.gloss(k % 2 ? '#ffffff' : '#e6eef6'), x, y + 1 + k * .7, z, g, false); }, 6, 75); break;
    case 'breakfast': place((x, y, z, i) => { const c = M(new THREE.TorusGeometry(2.2, 1, 12, 24), G.mat(['#ff9f43', '#ffd23f', '#c97b3a'][i % 3], .6), x, y + .2, z, g, false); c.rotation.x = Math.PI / 2 + rnd() * .4; }, 16, 45);
      place((x, y, z) => { M(CYL(6, 5.2, 18, 32), G.mat('#ffb33a', .1, { transparent: true, opacity: .85 }), x, y + 9, z, g, false); }, 2, 85); break;
    case 'icecream': place((x, y, z, i) => { M(new THREE.ConeGeometry(4, 16, 20), G.mat('#e0a35a', .7), x, y + 4, z, g, false).rotation.x = Math.PI;
      M(SPH(4.6, 20, 14), G.gloss(['#ffc4dc', '#fff6e0', '#a8e0ff', '#7a4a2a'][i % 4]), x, y + 13, z, g, false); }, 7, 75); break;
    case 'spicy': place((x, y, z, i) => { const v = new THREE.Group(); v.position.set(x, y, z); g.add(v);
      M(new THREE.ConeGeometry(16, 24, 24), G.mat('#6a2a24', .9), 0, 12, 0, v, false); M(CYL(4.5, 4.5, 1, 24), G.basic('#ff7a2b', 2.2), 0, 23.6, 0, v, false); }, 3, 90);
      place((x, y, z) => { const c = M(SPH(2, 14, 10), G.gloss('#e8262c'), x, y + 2, z, g, false); c.scale.set(1, 4, 1); }, 6, 55); break;
  }
}
function makeSea() {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 100, 100), seaMaterial(L.T));
  s.rotation.x = -Math.PI / 2; s.position.set(L.mid.x, L.seaY, L.mid.z); s.receiveShadow = false; L.root.add(s);
}

G.buildLevel = (w, diff) => {
  if (L) G.disposeLevel();
  const T = G.THEMES[w];
  L = G.L = { w, T, diff, rnd: G.rng(1000 + w * 77), root: new THREE.Group(), items: [], friends: [], chilis: [], cps: [], enemies: [], movers: [], fallers: [], spinners: [],
    shots: [], rings: [], rains: [], boss: null, bossDone: false, saucer: null, t: 0 };
  L.stat = new THREE.Group(); L.dyn = new THREE.Group(); L.root.add(L.stat, L.dyn); G.scene.add(L.root);
  G.colliders.length = 0;
  G.setSky(T.sky[0], T.sky[1], T.sky[2], T.fog, T.sun, T.hemi[0], T.hemi[1]);
  const rnd = L.rnd;
  let ang = 0, cur = island(0, 0, 0, 7, { clear: [0, 2.5] });
  addToaster(0, 0, 2.6, Math.PI, true);
  for (let i = 0; i < 4; i++) addItem(Math.sin(i * .9 - 1.3) * 3.5, 1.1, -1.5 - i * 1.0);
  const dir = () => new V3(Math.sin(ang), 0, -Math.cos(ang)), side = () => new V3(Math.cos(ang), 0, Math.sin(ang));
  const ahead = (from, dist, dy = 0) => { const d = dir(); return new V3(from.x + d.x * dist, from.y + dy, from.z + d.z * dist); };
  const segs = 7 + w, friendsAt = [1, Math.floor(segs / 2), segs - 2];
  const pool = ['steps', 'steps', 'moving', 'falling', 'bounce', 'elevator', 'arc'];
  let lastSeg = '';
  for (let i = 0; i < segs; i++) {
    ang = G.clamp(ang + (rnd() - .5) * .9, -.7, .7);
    let seg = pool[Math.floor(rnd() * Math.min(pool.length, 3 + w + i))];
    if (seg === lastSeg) seg = 'steps'; if (i === 0) seg = 'steps'; lastSeg = seg;
    let end = { x: cur.x, y: cur.y, z: cur.z, r: cur.r };
    if (seg === 'steps') {
      const n = 3 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) { const r = 1.3 + rnd() * .5, gap = 2.0 + rnd() * .9 + w * .08, dy = (rnd() - .35) * .9;
        const p = ahead(end, end.r + gap + r, dy); platform(p.x, p.y, p.z, r, { box: rnd() < .4 }); addItem(p.x, p.y + 1.1, p.z); end = { x: p.x, y: p.y, z: p.z, r }; }
    } else if (seg === 'arc') {
      const r = 1.8, p = ahead(end, end.r + 3.4 + r, .4); platform(p.x, p.y, p.z, r);
      for (let k = 1; k <= 3; k++) { const q = ahead(end, end.r + k * .9, 1.6 + Math.sin(k / 4 * Math.PI) * .8); addItem(q.x, q.y, q.z); }
      if (rnd() < .6) addEnemy(ENEMY_KIND[T.enemies[2]] === 'roller' ? T.enemies[0] : T.enemies[2], { x: p.x, y: p.y, z: p.z, r: r }, new V3(p.x, p.y, p.z));
      end = { x: p.x, y: p.y, z: p.z, r };
    } else if (seg === 'moving') {
      const r = 1.7, p = ahead(end, end.r + 2.3 + r + 2.2, 0), s = side();
      platform(p.x, p.y, p.z, r, { dynamic: true, moving: { axis: s, amp: 2.6 + w * .2, speed: .7 + w * .08 } }); addItem(p.x, p.y + 1.1, p.z);
      end = { x: p.x, y: p.y, z: p.z, r: r - 2.2 };
    } else if (seg === 'falling') {
      let q = { x: end.x, y: end.y, z: end.z, r: end.r };
      for (let k = 0; k < 4; k++) { const p = ahead(q, q.r + (k ? .7 : 1.8) + 1.1, 0); platform(p.x, p.y, p.z, 1.1, { box: true, dynamic: true, falling: true }); addItem(p.x, p.y + 1.1, p.z); q = { x: p.x, y: p.y, z: p.z, r: 1.1 }; }
      end = q;
    } else if (seg === 'bounce') {
      const p = ahead(end, end.r + 2.4 + 1.4, 0); platform(p.x, p.y, p.z, 1.4, { bouncy: true });
      const h = ahead(p, 1.4 + 2.8 + 2, 4.5); platform(h.x, h.y, h.z, 2, { box: true });
      for (let k = 0; k < 4; k++) addItem(h.x, h.y + 1.1 + k * .9, h.z);
      if (rnd() < .5) addChili(h.x, h.y + 5.2, h.z);
      end = { x: h.x, y: h.y, z: h.z, r: 2 };
    } else if (seg === 'elevator') {
      const r = 1.6, p = ahead(end, end.r + 2.2 + r, 0);
      platform(p.x, p.y + 2, p.z, r, { dynamic: true, moving: { axis: new V3(0, 1, 0), amp: 2, speed: .8 } });
      for (let k = 0; k < 3; k++) addItem(p.x, p.y + 2 + k * 1.2, p.z);
      end = { x: p.x, y: p.y + 3.4, z: p.z, r: r - .4 };
    }
    // the next island
    const r = 4.2 + rnd() * 2.2, gap = 2.0 + rnd() * .8, dy = seg === 'bounce' ? -1.5 : seg === 'elevator' ? 0 : (rnd() - .4) * 1.2;
    const c = ahead(end, end.r + gap + r, dy);
    if (seg === 'elevator') c.y = end.y;
    cur = island(c.x, c.y, c.z, r);
    // what lives on it
    const nE = Math.min(3, 1 + Math.floor(rnd() * (1.4 + w * .35 + i * .15)));
    for (let k = 0; k < nE; k++) { const a = rnd() * TAU, d = rnd() * (r - 1.6); const t = T.enemies[Math.floor(rnd() * T.enemies.length)];
      addEnemy(t, { x: c.x, y: c.y, z: c.z, r: r - 1 }, new V3(c.x + Math.cos(a) * d, c.y, c.z + Math.sin(a) * d)); }
    const ring = 5 + Math.floor(rnd() * 3); for (let k = 0; k < ring; k++) { const a = k / ring * TAU; addItem(c.x + Math.cos(a) * r * .6, c.y + 1.1, c.z + Math.sin(a) * r * .6); }
    if (i > 1 && rnd() < .35 && r > 5) addSpinner(cur);
    if (i === 2 || i === Math.floor(segs * .66)) { const d = dir(); addToaster(c.x - d.x * (r - 2.2), c.y, c.z - d.z * (r - 2.2), Math.PI - ang, false); }
    if (friendsAt.includes(i)) {
      const s = side().multiplyScalar(rnd() < .5 ? 1 : -1);
      const lp = new V3(c.x + s.x * (r + 2.6 + 1.3), c.y + 1.2, c.z + s.z * (r + 2.6 + 1.3));
      if (i === friendsAt[1]) { platform(c.x + s.x * (r + 2.2 + 1.2), c.y, c.z + s.z * (r + 2.2 + 1.2), 1.2, { bouncy: true }); const hp = new V3(c.x + s.x * (r + 8), c.y + 4.5, c.z + s.z * (r + 8)); platform(hp.x, hp.y, hp.z, 2.2, { box: true }); addFriend(hp.x, hp.y + 1.6, hp.z); }
      else { platform(lp.x, lp.y, lp.z, 1.6); addFriend(lp.x, lp.y + 1.6, lp.z); }
    }
    if (rnd() < .18 + w * .02) addChili(c.x, c.y + 1.4, c.z);
  }
  // bridge + arena
  ang *= .5;
  let end = { x: cur.x, y: cur.y, z: cur.z, r: cur.r };
  { const p = ahead(end, end.r + 2.3 + 1.5, .3); platform(p.x, p.y, p.z, 1.5); addItem(p.x, p.y + 1.1, p.z); end = { x: p.x, y: p.y, z: p.z, r: 1.5 }; }
  { const p = ahead(end, end.r + 2.3 + 3, .3); platform(p.x, p.y, p.z, 3, { box: true, style: 0 }); const d = dir();
    addToaster(p.x - d.x * 1.2, p.y, p.z - d.z * 1.2, Math.PI - ang, false); end = { x: p.x, y: p.y, z: p.z, r: 3 }; }
  const R = 13, ac = ahead(end, end.r + 2.4 + R, 0);
  const ar = island(ac.x, ac.y, ac.z, R);
  L.arena = { x: ac.x, y: ac.y, z: ac.z, r: R, entry: new V3(end.x, end.y, end.z) };
  // world bounds
  let minY = 0; G.colliders.forEach(c => minY = Math.min(minY, c.y1));
  L.killY = minY - 7; L.seaY = minY - 9;
  L.mid = new V3(ac.x / 2, 0, ac.z / 2);
  makeSea(); farDecor();
  // collectibles (instanced: one draw call per part)
  L.itemParts = G.itemParts(T.item).map(pt => { const im = new THREE.InstancedMesh(pt.geo, pt.mat, L.items.length); im.castShadow = true; L.dyn.add(im); return im; });
  L.totalItems = L.items.length; L.totalFriends = L.friends.length;
  mergeStatic(L.stat);
  L.stat.updateMatrixWorld(true);
  L.stat.traverse(o => { o.matrixAutoUpdate = false; });
  return L;
};
/* merge every static piece that shares a material into one mesh: far fewer draw calls */
function mergeStatic(group) {
  const U = THREE.BufferGeometryUtils; if (!U) return;
  group.updateMatrixWorld(true);
  const buckets = new Map(), drop = [];
  group.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || o.isInstancedMesh || o.userData.keep) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    if (!g.attributes.uv) return;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(o.matrixWorld);
    const key = o.material.uuid + (o.castShadow ? 's' : 'n');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, shadow: o.castShadow, geos: [] });
    buckets.get(key).geos.push(g); drop.push(o);
  });
  for (const o of drop) if (o.parent) o.parent.remove(o);
  for (const b of buckets.values()) {
    const merged = U.mergeBufferGeometries(b.geos, false); if (!merged) continue;
    const m = new THREE.Mesh(merged, b.mat); m.castShadow = b.shadow; m.receiveShadow = true; group.add(m);
  }
}
G.disposeLevel = () => {
  if (!L) return;
  G.scene.remove(L.root);
  L.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  if (L.boss) G.scene.remove(L.boss.mesh);
  L = G.L = null;
};

/* ================= PER-FRAME: platforms (before the hero moves) ================= */
G.updatePlatforms = (dt, t, P) => {
  for (const m of L.movers) {
    const off = Math.sin(t * m.speed * 1.4 + m.ph) * m.amp;
    const nx = m.base.x + m.axis.x * off, ny = m.base.y + m.axis.y * off, nz = m.base.z + m.axis.z * off;
    m.col.dx = nx - m.col.cx; m.col.dy = ny - m.col.y1; m.col.dz = nz - m.col.cz;
    m.col.cx = nx; m.col.cz = nz; const h = m.col.y1 - m.col.y0; m.col.y1 = ny; m.col.y0 = ny - h;
    m.g.position.set(nx, ny, nz);
    if (P.ground === m.col) { P.pos.x += m.col.dx; P.pos.y = m.col.y1; P.pos.z += m.col.dz; }
  }
  for (const f of L.fallers) {
    if (f.state === 'idle' && P.ground === f.col) { f.state = 'shake'; f.t = 0; }
    if (f.state === 'shake') { f.t += dt; f.g.position.x = f.col.cx + Math.sin(t * 60) * .06; if (f.t > .65) { f.state = 'fall'; f.v = 0; } }
    else if (f.state === 'fall') { f.v += 25 * dt; const d = f.v * dt; f.col.y1 -= d; f.col.y0 -= d; f.g.position.y = f.col.y1; if (P.ground === f.col) P.pos.y = f.col.y1;
      if (f.col.y1 < L.killY - 5) { f.state = 'gone'; f.col.on = false; f.g.visible = false; f.t = 0; } }
    else if (f.state === 'gone') { f.t += dt; if (f.t > 3) { f.state = 'idle'; f.col.on = true; f.col.y1 = f.baseY; f.col.y0 = f.baseY - .6; f.g.position.set(f.col.cx, f.baseY, f.col.cz); f.g.visible = true; } }
  }
};

/* ================= PER-FRAME: everything that lives in the level ================= */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V3(), _e = new THREE.Euler(), _p = new V3();
function killEnemy(e, how, from) {
  if (!e.alive) return; e.alive = false; e.how = how; e.dt = 0; e.dv = new V3();
  const away = e.pos.clone().sub(from || e.pos); away.y = 0; if (away.lengthSq() < .01) away.set(1, 0, 0); away.normalize();
  if (how === 'spin') e.dv.set(away.x * 12, 9, away.z * 12);
  if (how === 'pound') e.dv.set(away.x * 3, 14, away.z * 3);
  G.sfx.stomp(); say('enemyKilled', how, e.pos.clone().setY(e.pos.y + e.h));
}
function hitPlayer(P, from) { say('hurt', from); }
G.enemyFlyY = 2.4;

G.updateLevel = (dt, t, P) => {
  L.t = t; G.seaTime.value = t; G.bubbleMat.uniforms.t.value = t;
  const pc = new V3(P.pos.x, P.pos.y + 1, P.pos.z);
  // collectibles
  let k = 0;
  for (const it of L.items) {
    if (it.alive && it.p.distanceToSquared(pc) < 1.25) { it.alive = false; it.pop = 0; say('collect', it.p); }
    if (!it.alive) it.pop = (it.pop || 0) + dt;
    const sc = it.alive ? 1 : Math.max(0, 1 - it.pop * 4);
    _e.set(0, t * 2.4 + k * .5, Math.sin(t * 2 + k) * .15); _q.setFromEuler(_e); _s.set(sc, sc, sc);
    _p.copy(it.p); _p.y += Math.sin(t * 2.4 + k) * .12 + (it.alive ? 0 : it.pop * 3);
    _m.compose(_p, _q, _s); for (const im of L.itemParts) im.setMatrixAt(k, _m); k++;
  }
  for (const im of L.itemParts) im.instanceMatrix.needsUpdate = true;
  // friends
  for (const f of L.friends) {
    if (!f.saved) { f.g.position.y = f.p.y + Math.sin(t * 1.6 + f.p.x) * .2; f.f.rotation.y = Math.sin(t * .8) * .5;
      if (f.g.position.distanceToSquared(pc) < 3.2) { f.saved = true; f.t = 0; f.bub.visible = false; say('rescue', f.p.clone()); } }
    else if (f.g.visible) { f.t += dt; f.g.position.y = f.p.y + f.t * 3 + Math.abs(Math.sin(f.t * 8)) * .5; f.f.rotation.y += dt * 8; if (f.t > 1.6) f.g.visible = false; }
  }
  // chili power-up
  for (const c of L.chilis) { if (!c.alive) continue; c.m.rotation.y = t * 2; c.m.position.y = c.p.y + Math.sin(t * 2.5) * .2;
    if (c.m.position.distanceToSquared(pc) < 2.2) { c.alive = false; c.m.visible = false; say('chili', c.p.clone()); } }
  // toasters (checkpoints)
  for (const cp of L.cps) {
    const u = cp.m.userData; u.heat = Math.max(0, u.heat - dt * .7);
    const h = (cp.on ? .35 + Math.sin(t * 3) * .1 : 0) + u.heat;
    u.glow.material.color.setRGB(3.2 * h, 1.1 * h, .25 * h);
    u.lever.position.y += ((cp.on ? .75 : 1.25) - u.lever.position.y) * Math.min(1, dt * 10);
    if (!cp.on && Math.hypot(P.pos.x - cp.p.x, P.pos.z - cp.p.z) < 2.4 && Math.abs(P.pos.y - cp.p.y) < 2) { L.cps.forEach(o => o.on = false); cp.on = true; L.cp = cp; u.heat = 1; say('checkpoint', cp.p.clone()); }
  }
  // spinning hazards
  for (const s of L.spinners) {
    s.g.rotation.y += s.speed * dt;
    if (P.inv > 0 || P.pos.y > s.y + .75 || P.pos.y + P.h < s.y) continue;
    const a = s.g.rotation.y, ux = Math.cos(a), uz = -Math.sin(a), dx = P.pos.x - s.isl.x, dz = P.pos.z - s.isl.z;
    const along = G.clamp(dx * ux + dz * uz, -s.len / 2, s.len / 2), px = dx - ux * along, pz = dz - uz * along;
    if (px * px + pz * pz < .7 * .7) hitPlayer(P, new V3(s.isl.x + ux * along, s.y, s.isl.z + uz * along));
  }
  // bouncy jelly wobble
  for (const c of G.colliders) if (c.jelly) { c.wob = Math.max(0, (c.wob || 0) - dt * 2.5); c.jelly.scale.set(1 + c.wob * .25, .45 - c.wob * .25 + Math.sin(t * 20) * c.wob * .1, 1 + c.wob * .25); }
  updateEnemies(dt, t, P);
  updateShots(dt, t, P);
  updateBoss(dt, t, P);
  updateSaucer(dt, t, P);
};

function updateEnemies(dt, t, P) {
  const spd = { easy: .7, normal: 1, hard: 1.35 }[L.diff];
  for (const e of L.enemies) {
    const m = e.mesh;
    if (!e.alive) {
      e.dt += dt;
      if (e.how === 'stomp') { m.scale.set(1 + e.dt * 1.5, Math.max(.05, .25 - e.dt * .2), 1 + e.dt * 1.5); }
      else if (e.how === 'spin' || e.how === 'pound') { e.dv.y -= 20 * dt; m.position.addScaledVector(e.dv, dt); m.rotation.x += dt * 14; m.rotation.z += dt * 9; }
      else if (e.how === 'chili') { m.scale.multiplyScalar(Math.max(0, 1 - dt * 2.2)); if (Math.random() < .5) G.emit(m.position.x, m.position.y + .5, m.position.z, { n: 1, color: '#555555', up: 2, speed: .5, size: .6, life: .8, grav: -1 }); }
      if (e.dt > 1.2 && m.visible) { m.visible = false; G.emit(m.position.x, m.position.y + .4, m.position.z, { n: 10, color: '#ffffff', speed: 3, up: 2, size: .5, life: .5 }); }
      continue;
    }
    const dxp = P.pos.x - e.pos.x, dzp = P.pos.z - e.pos.z, dp = Math.hypot(dxp, dzp);
    if (dp > 45) continue;
    const home = e.home, bob = m.userData.bob;
    e.t += dt;
    const near = dp < 7 && Math.abs(P.pos.y - home.y) < 2.5;
    let moving = 0;
    if (e.kind === 'walker' || e.kind === 'roller') {
      if (near) e.target.set(P.pos.x, home.y, P.pos.z);
      else if (e.pos.distanceTo(e.target) < .3 || e.t > 4) { const a = L.rnd() * TAU, d = L.rnd() * home.r; e.target.set(home.x + Math.cos(a) * d, home.y, home.z + Math.sin(a) * d); e.t = 0; }
      const tx = e.target.x - e.pos.x, tz = e.target.z - e.pos.z, td = Math.hypot(tx, tz);
      const v = (e.kind === 'roller' ? (near ? 2.6 : 1.4) : (near ? 2.2 : 1.3)) * spd;
      if (td > .2) { e.pos.x += tx / td * v * dt; e.pos.z += tz / td * v * dt; e.dir = Math.atan2(tx, tz); moving = 1; }
      const hx = e.pos.x - home.x, hz = e.pos.z - home.z, hd = Math.hypot(hx, hz); if (hd > home.r) { e.pos.x = home.x + hx / hd * home.r; e.pos.z = home.z + hz / hd * home.r; }
      e.pos.y = home.y;
      if (bob) { if (m.userData.roll) bob.rotation.x += v * dt * moving * 1.6; else { bob.rotation.z = Math.sin(t * 9 + e.t) * .12 * moving; bob.position.y = (bob.userData.y0 ?? (bob.userData.y0 = bob.position.y)) + Math.abs(Math.sin(t * 9)) * .08 * moving; } }
      if (m.userData.segs) m.userData.segs.forEach((s, i) => s.position.y = .3 + Math.sin(t * 8 - i * .9) * .12);
    } else if (e.kind === 'hopper') {
      if (!e.air) { e.hop = (e.hop || 0) + dt * spd; m.scale.set(1 + Math.min(.25, e.hop * .2), 1 - Math.min(.25, e.hop * .2), 1 + Math.min(.25, e.hop * .2));
        if (e.hop > 1.1) { e.hop = 0; e.air = true; e.vy = 7.5; let a = near ? Math.atan2(dxp, dzp) : L.rnd() * TAU; e.dir = a; e.hv = new V3(Math.sin(a) * 2.6, 0, Math.cos(a) * 2.6); m.scale.set(.85, 1.2, .85); } }
      else { e.vy -= 22 * dt; e.pos.y += e.vy * dt; e.pos.x += e.hv.x * dt; e.pos.z += e.hv.z * dt;
        const hx = e.pos.x - home.x, hz = e.pos.z - home.z, hd = Math.hypot(hx, hz); if (hd > home.r) { e.pos.x = home.x + hx / hd * home.r; e.pos.z = home.z + hz / hd * home.r; }
        m.scale.lerp(_s.set(1, 1, 1), dt * 6);
        if (e.pos.y <= home.y) { e.pos.y = home.y; e.air = false; G.emit(e.pos.x, e.pos.y + .1, e.pos.z, { n: 4, color: '#ffffff', speed: 2, up: .5, size: .4, life: .4 }); } }
    } else if (e.kind === 'flyer') {
      const a = t * .6 * spd + e.dir; e.pos.set(home.x + Math.cos(a) * home.r * .6, home.y + G.enemyFlyY + Math.sin(t * 2 + e.dir) * .4, home.z + Math.sin(a) * home.r * .6);
      e.dirFace = a + Math.PI / 2;
      if (m.userData.wings) m.userData.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 25) * .6);
      if (m.userData.flap) m.userData.flap.rotation.x = Math.sin(t * 6) * .4;
      if (m.userData.spinBody && bob) bob.rotation.y += dt * 4;
    } else if (e.kind === 'shooter') {
      e.pos.y = home.y; e.cool = (e.cool ?? 2) - dt * spd;
      if (dp < 15 && e.cool <= 0) { e.cool = 2.8; const s = G.shotMesh('fire'); L.dyn.add(s); const from = new V3(e.pos.x, e.pos.y + 1.6, e.pos.z);
        const T = .9, v = new V3(dxp / T, (P.pos.y + .8 - from.y) / T + 12 * T / 2, dzp / T);
        L.shots.push({ m: s, p: from, v, mode: 'lob', r: .45, life: 4, grav: 12 }); G.sfx.shoot(); m.scale.set(1.2, .8, 1.2); }
      m.scale.lerp(_s.set(1, 1, 1), dt * 5);
      if (dp < 15) e.dir = Math.atan2(dxp, dzp);
    }
    m.position.copy(e.pos);
    m.rotation.y = G.angLerp(m.rotation.y, e.kind === 'flyer' ? e.dirFace : e.dir, Math.min(1, dt * 8));
    // touching the hero
    const top = e.pos.y + e.h;
    if (P.spinT > 0 && dp < e.r + 1.3 && P.pos.y < top + .5 && P.pos.y + P.h > e.pos.y - .3) { killEnemy(e, 'spin', P.pos); continue; }
    if (dp < e.r + .45 && P.pos.y < top && P.pos.y + P.h > e.pos.y) {
      if (P.chiliT > 0) { killEnemy(e, 'chili', P.pos); continue; }
      if (P.vel.y < -.5 && P.prevY >= top - .7 && e.type !== 'fork' && e.type !== 'pineapple') { killEnemy(e, 'stomp', P.pos); say('stomped'); continue; }
      if (P.pounding && P.vel.y < 0) { killEnemy(e, 'pound', P.pos); continue; }
      hitPlayer(P, e.pos);
    }
  }
}
G.poundAt = (pos) => {
  for (const e of L.enemies) if (e.alive && Math.hypot(e.pos.x - pos.x, e.pos.z - pos.z) < 3.4 && Math.abs(e.pos.y - pos.y) < 1.6) killEnemy(e, 'pound', pos);
  const B = L.boss; if (B && B.state === 'dizzy' && Math.hypot(B.pos.x - pos.x, B.pos.z - pos.z) < B.r + 3) bossHit();
};

/* ================= SHOTS, SHOCKWAVES, RAIN ================= */
function updateShots(dt, t, P) {
  const pc = new V3(P.pos.x, P.pos.y + 1, P.pos.z);
  L.shots = L.shots.filter(s => {
    s.life -= dt;
    if (s.mode === 'roll') { s.p.addScaledVector(s.v, dt); s.m.rotation.x += s.v.length() * dt / s.r; s.p.y = s.y0; }
    else { s.v.y -= (s.grav ?? 0) * dt; s.p.addScaledVector(s.v, dt); if (s.mode === 'flat') s.m.rotation.y += dt * 12; }
    s.m.position.copy(s.p);
    if (s.mode === 'lob' && s.floor !== undefined && s.p.y < s.floor) { G.emit(s.p.x, s.floor + .2, s.p.z, { n: 8, color: '#ffffff', speed: 3, up: 2, size: .5, life: .4 }); s.life = 0; }
    if (s.p.y < L.killY) s.life = 0;
    if (s.life > 0 && s.p.distanceTo(pc) < s.r + .6) {
      if (P.spinT > 0 || P.chiliT > 0) { s.life = 0; G.emit(s.p.x, s.p.y, s.p.z, { n: 10, color: '#ffe26a', glow: true, speed: 4, size: .4 }); }
      else { hitPlayer(P, s.p); s.life = 0; }
    }
    if (s.life <= 0) { L.dyn.remove(s.m); return false; }
    return true;
  });
  L.rings = L.rings.filter(r => {
    r.r += r.speed * dt; r.m.scale.set(r.r, r.r, 1); r.m.material.opacity = Math.max(0, .9 - r.r / (L.arena.r + 2));
    const d = Math.hypot(P.pos.x - r.x, P.pos.z - r.z);
    if (!r.hit && Math.abs(d - r.r) < .7 && P.pos.y - r.y < .5) { r.hit = true; hitPlayer(P, new V3(r.x, r.y, r.z)); }
    if (r.r > L.arena.r + 1) { L.dyn.remove(r.m); return false; } return true;
  });
  L.rains = L.rains.filter(r => {
    r.t += dt; r.warn.material.opacity = .35 + Math.sin(r.t * 20) * .2;
    if (r.t > 1.1 && !r.obj) { r.obj = G.shotMesh(L.bossDef.shot === 'pancake' ? 'drop' : L.bossDef.shot); r.obj.position.set(r.x, r.y + 14, r.z); L.dyn.add(r.obj); }
    if (r.obj) { r.obj.position.y -= 30 * dt;
      if (r.obj.position.y <= r.y + .3) { G.emit(r.x, r.y + .3, r.z, { n: 12, color: L.bossDef.shot === 'fire' ? '#ff8a2b' : '#ffffff', glow: L.bossDef.shot === 'fire', speed: 4, up: 3, size: .5 });
        if (Math.hypot(P.pos.x - r.x, P.pos.z - r.z) < 1.4 && P.pos.y - r.y < 1.5) hitPlayer(P, new V3(r.x, r.y, r.z));
        L.dyn.remove(r.obj); L.dyn.remove(r.warn); return false; } }
    return true;
  });
}
function ring(x, y, z) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 48), new THREE.MeshBasicMaterial({ color: G.C('#ffffff').multiplyScalar(1.4), transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y + .12, z); L.dyn.add(m);
  L.rings.push({ m, x, y, z, r: .5, speed: 9 * { easy: .8, normal: 1, hard: 1.2 }[L.diff] });
}

/* ================= BOSS ================= */
function bossDiff() { return { easy: { hp: .67, sp: .8 }, normal: { hp: 1, sp: 1 }, hard: { hp: 1.5, sp: 1.2 } }[L.diff]; }
function startBoss() {
  const A = L.arena, key = L.T.boss, def = L.bossDef = BOSS_DEF[key], D = bossDiff();
  const mesh = G.bossMesh[key](); G.scene.add(mesh);
  const maxHp = Math.max(2, Math.round(def.hp * D.hp));
  const B = L.boss = { key, def, mesh, pos: new V3(A.x, A.y + 18, A.z), vel: new V3(), state: 'intro', t: 0, maxHp, hp: (L.diff === 'easy' && L.bossHpKeep) || maxHp,
    r: mesh.userData.r, h: mesh.userData.h, queue: [], face: 0 };
  if (!mesh.userData.beam) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.45, 1.1, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: G.C('#ff8a2b').multiplyScalar(1.6), transparent: true, opacity: .6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.rotation.x = Math.PI / 2; beam.position.set(0, .8, 6.5 + B.r); beam.visible = false; mesh.userData.body.add(beam); mesh.userData.beam = beam; }
  mesh.position.copy(B.pos);
  say('bossStart', L.T.bossName, B);
}
function nextAttack(B) {
  if (!B.queue.length) { const ph = B.hp > B.maxHp / 2 ? 0 : 1; B.queue = B.def.cycles[ph].slice(); B.queue.push('dizzy'); }
  B.state = B.queue.shift(); B.t = 0; B.n = 0;
  if (B.state === 'dizzy') { G.sfx.whistle(); if (B.mesh.userData.lid) B.mesh.userData.lid.userData.v = 7; }
}
function bossHit() {
  const B = L.boss; if (!B || B.state !== 'dizzy') return;
  B.hp--; B.state = 'hurt'; B.t = 0; G.sfx.bossHit(); G.cam.shake = .5;
  G.emit(B.pos.x, B.pos.y + B.h, B.pos.z, { n: 24, color: '#ffe26a', glow: true, speed: 7, up: 5, size: .6 });
  say('bossHit', B.hp, B.maxHp);
  if (B.hp <= 0) { B.state = 'dead'; B.t = 0; say('bossDefeated'); }
}
G.bossHitIfDizzy = () => bossHit();
function updateBoss(dt, t, P) {
  const A = L.arena; if (!A) return;
  const inArena = Math.hypot(P.pos.x - A.x, P.pos.z - A.z) < A.r - .5 && P.pos.y > A.y - 1;
  if (!L.boss && !L.bossDone && inArena) startBoss();
  const B = L.boss; if (!B) return;
  const D = bossDiff(), sp = D.sp * (B.hp <= B.maxHp / 2 ? 1.2 : 1), m = B.mesh, body = m.userData.body;
  B.t += dt;
  const toP = new V3(P.pos.x - B.pos.x, 0, P.pos.z - B.pos.z), dP = toP.length();
  const faceP = () => { B.face = G.angLerp(B.face, Math.atan2(toP.x, toP.z), Math.min(1, dt * 5)); };
  const ground = A.y;
  switch (B.state) {
    case 'intro': B.vel.y -= 30 * dt; B.pos.y += B.vel.y * dt; faceP();
      if (B.pos.y <= ground) { B.pos.y = ground; B.vel.set(0, 0, 0); if (!B.landed) { B.landed = true; G.sfx.slam(); G.cam.shake = .7; ring(B.pos.x, ground, B.pos.z); } if (B.t > 2.2) nextAttack(B); }
      break;
    case 'charge': {
      if (B.t < .9) { faceP(); body.position.x = Math.sin(t * 50) * .08; B.dir = new V3(Math.sin(B.face), 0, Math.cos(B.face)); if (B.t < dt * 1.5) G.sfx.bossIntro(); }
      else { body.position.x = 0; const v = B.def.speed * sp; B.pos.addScaledVector(B.dir, v * dt);
        if (L.rnd() < .5) G.emit(B.pos.x, ground + .3, B.pos.z, { n: 1, color: '#ffffff', speed: 1, up: 1, size: .9, life: .5 });
        if (B.key === 'meatball') body.rotation.x += v * dt / 2.2;
        if (B.key === 'mushroom') { body.rotation.x = .3; body.position.y = Math.abs(Math.sin(t * 14)) * .25; }
        const fromC = Math.hypot(B.pos.x - A.x, B.pos.z - A.z);
        if (fromC > A.r - B.r - .3) { const k = (A.r - B.r - .3) / fromC; B.pos.x = A.x + (B.pos.x - A.x) * k; B.pos.z = A.z + (B.pos.z - A.z) * k; G.sfx.slam(); G.cam.shake = .6;
          G.emit(B.pos.x, ground + 1, B.pos.z, { n: 16, color: '#ffffff', speed: 5, up: 3, size: .8 }); body.rotation.x = 0; body.position.y = 0; nextAttack(B); } }
      break; }
    case 'slam': {
      if (B.t < .45) { faceP(); m.scale.set(1.1, .85, 1.1); B.from = B.pos.clone(); B.to = new V3(P.pos.x, ground, P.pos.z);
        const k = Math.hypot(B.to.x - A.x, B.to.z - A.z); if (k > A.r - B.r - .5) { const f = (A.r - B.r - .5) / k; B.to.x = A.x + (B.to.x - A.x) * f; B.to.z = A.z + (B.to.z - A.z) * f; } }
      else { const k = Math.min(1, (B.t - .45) / (1.05 / sp)); m.scale.set(.95, 1.1, .95);
        B.pos.lerpVectors(B.from, B.to, k); B.pos.y = ground + Math.sin(k * Math.PI) * 8;
        if (k >= 1) { m.scale.set(1.2, .8, 1.2); G.sfx.slam(); G.cam.shake = .7; ring(B.pos.x, ground, B.pos.z); nextAttack(B); } }
      break; }
    case 'shoot': {
      faceP(); const every = .55 / sp;
      if (B.t > .4 + B.n * every && B.n < 3) { B.n++; G.sfx.shoot(); m.scale.set(1.12, .9, 1.12);
        const from = new V3(B.pos.x + Math.sin(B.face) * B.r, ground + (B.def.mode === 'roll' ? .65 : B.h * .55), B.pos.z + Math.cos(B.face) * B.r);
        const spread = B.def.mode === 'flat' ? [-.35, 0, .35] : [0];
        for (const s of spread) {
          const sm = G.shotMesh(B.def.shot); L.dyn.add(sm);
          if (B.def.mode === 'lob') { const T = 1.0 / sp, v = new V3((P.pos.x - from.x) / T, (P.pos.y + .5 - from.y) / T + 12 * T / 2, (P.pos.z - from.z) / T);
            L.shots.push({ m: sm, p: from.clone(), v, mode: 'lob', r: .45, life: 4, grav: 12, floor: ground }); }
          else if (B.def.mode === 'flat') { const a = Math.atan2(toP.x, toP.z) + s; from.y = ground + .7; L.shots.push({ m: sm, p: from.clone(), v: new V3(Math.sin(a) * 9 * sp, 0, Math.cos(a) * 9 * sp), mode: 'flat', r: .85, life: 4 }); }
          else { const a = Math.atan2(toP.x, toP.z); L.shots.push({ m: sm, p: from.clone(), v: new V3(Math.sin(a) * 7 * sp, 0, Math.cos(a) * 7 * sp), mode: 'roll', r: .65, life: 4, y0: ground + .65 }); }
        } }
      m.scale.lerp(_s.set(1, 1, 1), dt * 6);
      if (B.t > .4 + 3 * every + .6) nextAttack(B);
      break; }
    case 'sweep': {
      const beam = m.userData.beam;
      if (B.t < .9) { faceP(); beam.visible = B.t > .5 && Math.sin(t * 40) > 0; beam.scale.set(.3, .3, .3); }
      else { beam.visible = true; beam.scale.set(1, 1, 1); B.face += dt * (TAU / 3.2) * sp; beam.material.opacity = .45 + Math.sin(t * 30) * .1;
        if (L.rnd() < .7) { const bx = B.pos.x + Math.sin(B.face) * (B.r + 4 + L.rnd() * 7), bz = B.pos.z + Math.cos(B.face) * (B.r + 4 + L.rnd() * 7); G.emit(bx, ground + 1.3, bz, { n: 1, color: B.key === 'kettle' ? '#ffffff' : '#ff8a2b', glow: B.key !== 'kettle', speed: 1, up: 1, size: 1.2, life: .5, grav: -1 }); }
        // is the hero inside the beam?
        const ux = Math.sin(B.face), uz = Math.cos(B.face), along = toP.x * ux + toP.z * uz, perp = Math.abs(toP.x * uz - toP.z * ux);
        if (along > B.r && along < B.r + 13 && perp < 1.1 && P.pos.y - ground < 1.3) hitPlayer(P, B.pos);
        if (B.t > .9 + 3.2 / sp) { beam.visible = false; nextAttack(B); } }
      break; }
    case 'rain': {
      faceP();
      if (B.n === 0) { B.n = 1; G.sfx.shoot(); m.scale.set(1.1, .9, 1.1);
        const spots = [[P.pos.x, P.pos.z]]; for (let i = 0; i < 6; i++) { const a = L.rnd() * TAU, d = L.rnd() * (A.r - 2); spots.push([A.x + Math.cos(a) * d, A.z + Math.sin(a) * d]); }
        for (let i = 1; i < 3; i++) spots.push([P.pos.x + (L.rnd() - .5) * 5, P.pos.z + (L.rnd() - .5) * 5]);
        spots.forEach(([x, z], i) => { const w = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.4, 32), new THREE.MeshBasicMaterial({ color: G.C('#ff3a3a'), transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false }));
          w.rotation.x = -Math.PI / 2; w.position.set(x, ground + .1, z); L.dyn.add(w); L.rains.push({ warn: w, x, y: ground, z, t: -i * .08 }); }); }
      m.scale.lerp(_s.set(1, 1, 1), dt * 4);
      if (B.t > 2.4) nextAttack(B);
      break; }
    case 'dizzy': {
      body.rotation.z = Math.sin(t * 6) * .12; m.scale.y = G.lerp(m.scale.y, .8, dt * 4);
      if (L.rnd() < .25) G.emit(B.pos.x + Math.cos(t * 4) * 1.2, ground + B.h * .8 + 1, B.pos.z + Math.sin(t * 4) * 1.2, { n: 1, color: '#ffd23f', glow: true, speed: .2, up: .3, size: .6, life: .4, grav: 0 });
      const lid = m.userData.lid; if (lid) { lid.userData.v = (lid.userData.v || 0) - 20 * dt; lid.position.y = Math.max(3.65, lid.position.y + lid.userData.v * dt); lid.rotation.x += dt * 5; }
      if (B.t > 3.2 / Math.max(.8, sp)) { body.rotation.z = 0; m.scale.set(1, 1, 1); if (lid) { lid.position.y = 3.65; lid.rotation.x = 0; } nextAttack(B); }
      break; }
    case 'hurt': m.visible = Math.sin(t * 40) > 0; m.scale.set(1.15, .85, 1.15);
      if (B.t > .9) { m.visible = true; m.scale.set(1, 1, 1); body.rotation.z = 0; const lid = m.userData.lid; if (lid) { lid.position.y = 3.65; lid.rotation.x = 0; } B.queue = []; nextAttack(B); }
      break;
    case 'dead': m.rotation.z += dt * 2; m.scale.multiplyScalar(Math.max(0, 1 - dt * .9)); B.pos.y += dt * 2;
      if (L.rnd() < .6) G.emit(B.pos.x + (L.rnd() - .5) * 3, B.pos.y + L.rnd() * B.h, B.pos.z + (L.rnd() - .5) * 3, { n: 4, color: ['#ff5fa2', '#ffd23f', '#5ecbff', '#7be36a'][Math.floor(L.rnd() * 4)], glow: true, speed: 6, up: 4, size: .5 });
      if (B.t > 2.2) { G.scene.remove(m); L.boss = null; L.bossDone = true; spawnSaucer(); }
      break;
  }
  if (!L.boss) return;
  m.position.copy(B.pos); m.rotation.y = B.face;
  // contact
  if (B.state !== 'dead' && B.state !== 'intro' && B.state !== 'hurt') {
    const top = B.pos.y + B.h * m.scale.y;
    if (dP < B.r + .45 && P.pos.y < top && P.pos.y + P.h > B.pos.y) {
      if (B.state === 'dizzy' && P.vel.y < 0 && P.prevY >= top - .9) { bossHit(); say('bossStomp'); }
      else if (B.state === 'dizzy' && (P.spinT > 0 || P.chiliT > 0)) bossHit();
      else if (B.state !== 'dizzy') hitPlayer(P, B.pos);
      else { const push = toP.clone().normalize(); P.pos.x = B.pos.x + push.x * (B.r + .46); P.pos.z = B.pos.z + push.z * (B.r + .46); }
    } else if (B.state === 'dizzy' && P.spinT > 0 && dP < B.r + 1.4) bossHit();
  }
}
G.resetBossForRespawn = () => {
  if (!L || !L.boss) return;
  L.bossHpKeep = L.boss.hp; G.scene.remove(L.boss.mesh); L.boss = null;
  L.shots.forEach(s => L.dyn.remove(s.m)); L.shots = []; L.rings.forEach(r => L.dyn.remove(r.m)); L.rings = [];
  L.rains.forEach(r => { L.dyn.remove(r.warn); if (r.obj) L.dyn.remove(r.obj); }); L.rains = [];
  say('bossReset');
};

/* ================= THE GOAL: a flying saucer ================= */
function spawnSaucer() {
  const A = L.arena, s = G.saucerMesh(); s.position.set(A.x, A.y + 30, A.z); L.dyn.add(s); L.saucer = { m: s, t: 0, done: false };
}
function updateSaucer(dt, t, P) {
  const S = L.saucer; if (!S) return; const A = L.arena;
  S.t += dt; const k = Math.min(1, S.t / 2.5), e = 1 - Math.pow(1 - k, 3);
  S.m.position.y = A.y + 30 - (30 - 5.2) * e + Math.sin(t * 1.4) * .15; S.m.rotation.y = t * .5;
  S.m.userData.lights.forEach((l, i) => l.material.color.setHSL((i / 10 + t * .15) % 1, .9, .55).multiplyScalar(1 + ((Math.sin(t * 5 - i) + 1) / 2) * 2));
  S.m.userData.beam.material.opacity = k >= 1 ? .2 + Math.sin(t * 3) * .06 : 0;
  if (k >= 1 && !S.done && Math.hypot(P.pos.x - A.x, P.pos.z - A.z) < 2.6 && P.pos.y < A.y + 4) { S.done = true; say('goal'); }
}
})();
