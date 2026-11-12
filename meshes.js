/* טוסטי הגיבור — food models built from simple shapes */
'use strict';
(() => {
const G = window.G, M = G.mesh, TAU = G.TAU;
const SPH = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
const CYL = (a, b, h, s = 24, hs = 1, open = false) => new THREE.CylinderGeometry(a, b, h, s, hs, open);
const white = () => G.mat('#ffffff', .2);
const ink = () => G.mat('#2a1810', .45);

/* faces: every food has one */
G.face = (parent, o = {}) => {
  const s = o.s || 1, y = o.y || 0, z = o.z || 0, x = o.x || 0, mood = o.mood || 'angry';
  const eyes = [];
  [-1, 1].forEach(side => {
    const w = M(SPH(.13 * s, 16, 12), white(), x + side * .17 * s, y, z, parent, false); w.scale.set(1, 1.15, .5);
    const p = M(SPH(.065 * s, 12, 8), ink(), x + side * .17 * s, y - .01 * s, z + .055 * s, parent, false); p.scale.set(1, 1.1, .5);
    eyes.push(w, p);
    if (mood !== 'happy') {
      const b = M(G.RB(.17 * s, .045 * s, .04 * s, .015 * s, 1), ink(), x + side * .18 * s, y + .19 * s, z + .02 * s, parent, false);
      b.rotation.z = mood === 'angry' ? side * .45 : mood === 'worried' ? -side * .35 : side * .1;
    }
  });
  let mouth;
  if (mood === 'happy') { mouth = M(new THREE.TorusGeometry(.1 * s, .025 * s, 6, 14, Math.PI), ink(), x, y - .2 * s, z, parent, false); mouth.rotation.z = Math.PI; }
  else if (mood === 'angry') mouth = M(new THREE.TorusGeometry(.09 * s, .025 * s, 6, 14, Math.PI), ink(), x, y - .27 * s, z, parent, false);
  else mouth = M(new THREE.TorusGeometry(.05 * s, .022 * s, 6, 12), ink(), x, y - .22 * s, z, parent, false);
  if (o.cheeks !== false) [-1, 1].forEach(side => M(new THREE.CircleGeometry(.06 * s, 12), new THREE.MeshBasicMaterial({ color: G.C('#ff8f8f'), transparent: true, opacity: .55 }), x + side * .3 * s, y - .12 * s, z - .01, parent, false));
  return { eyes, mouth };
};
const wrap = (g, r, h) => { g.userData.r = r; g.userData.h = h; return g; };

/* ================= ENEMIES ================= */
const E = G.enemyMesh = {};
E.lemon = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .6; g.add(b);
  const m = G.gloss('#ffe14a'); G.outline(M(SPH(.55, 28, 20), m, 0, 0, 0, b), .04).scale.set(1.3, .95, .95);
  [-1, 1].forEach(s => { M(SPH(.13), m, s * .74, 0, 0, b).scale.set(1.3, .8, .8); M(SPH(.12), G.mat('#3b1a3f'), s * .28, -.55, .05, g); });
  G.face(b, { y: .08, z: .5, mood: 'sour' }); const l = M(SPH(.18, 12, 6), G.gloss('#4fae3a'), .1, .55, 0, b); l.scale.set(1, .15, .5);
  g.userData.bob = b; return wrap(g, .75, 1.2); };
E.meatball = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .62; g.add(b);
  const geo = new THREE.IcosahedronGeometry(.6, 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + .07 * Math.sin(v.x * 11) * Math.sin(v.y * 13) * Math.sin(v.z * 9)); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  G.outline(M(geo, G.mat('#7a3e22', .85), 0, 0, 0, b), .04);
  M(new THREE.SphereGeometry(.63, 24, 12, 0, TAU, 0, .95), G.gloss('#d23b25'), 0, 0, 0, b);
  M(SPH(.2, 12, 6), G.gloss('#3f9a3a'), 0, .62, 0, b).scale.set(1, .15, .5);
  G.face(b, { y: .1, z: .52, mood: 'angry' }); g.userData.bob = b; g.userData.roll = true; return wrap(g, .7, 1.25); };
E.tomato = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .55; g.add(b);
  G.outline(M(SPH(.58, 28, 20), G.gloss('#e8352a'), 0, 0, 0, b), .04).scale.set(1, .85, 1);
  for (let i = 0; i < 5; i++) { const l = M(SPH(.16, 10, 6), G.gloss('#3f9a3a'), Math.cos(i * TAU / 5) * .16, .5, Math.sin(i * TAU / 5) * .16, b); l.scale.set(1, .2, .45); l.rotation.y = -i * TAU / 5; }
  M(CYL(.04, .05, .2, 8), G.mat('#3f7a2a'), 0, .6, 0, b);
  G.face(b, { y: .05, z: .5, mood: 'angry' }); g.userData.bob = b; return wrap(g, .65, 1.1); };
E.gummy = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const m = G.mat('#ff4d6d', .15, { envMapIntensity: 1.3 });
  G.outline(M(SPH(.42, 20, 14), m, 0, .55, 0, b), .05).scale.set(1, 1.15, .9);
  G.outline(M(SPH(.36, 20, 14), m, 0, 1.25, 0, b), .05);
  [-1, 1].forEach(s => { M(SPH(.13, 12, 8), m, s * .27, 1.55, 0, b); M(SPH(.13, 12, 8), m, s * .45, .75, .1, b); M(SPH(.15, 12, 8), m, s * .22, .14, .05, b); });
  M(SPH(.14, 12, 8), G.mat('#ff8fa3', .2), 0, 1.17, .3, b).scale.set(1, .8, .7);
  G.face(b, { y: 1.3, z: .3, s: .8, mood: 'angry', cheeks: false }); g.userData.bob = b; return wrap(g, .55, 1.7); };
E.jellybean = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .5; g.add(b);
  G.outline(M(SPH(.45, 24, 16), G.gloss('#9b5cff'), 0, 0, 0, b), .05).scale.set(1.35, .9, .9);
  M(SPH(.12, 10, 8), G.mat('#ffffff', .1), -.25, .25, .25, b, false).scale.set(1.6, .5, .5);
  G.face(b, { y: .05, z: .38, s: .85, mood: 'angry' }); g.userData.bob = b; return wrap(g, .6, 1); };
E.candycorn = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .2; g.add(b);
  G.outline(M(CYL(.3, .44, .42, 20), G.gloss('#ffd23f'), 0, .21, 0, b), .04);
  G.outline(M(CYL(.17, .3, .42, 20), G.gloss('#ff8a1e'), 0, .63, 0, b), .04);
  G.outline(M(new THREE.ConeGeometry(.17, .36, 20), G.gloss('#fff6e6'), 0, 1.02, 0, b), .05);
  const wings = [-1, 1].map(s => { const w = M(SPH(.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .75, roughness: .2 }), s * .5, .7, -.1, b, false); w.scale.set(1, .15, .55); return w; });
  G.face(b, { y: .5, z: .33, s: .8, mood: 'angry', cheeks: false }); g.userData.bob = b; g.userData.wings = wings; return wrap(g, .55, 1.4); };
E.sponge = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  G.outline(M(G.RB(1.1, .75, .7, .12, 3), G.mat('#ffdd55', .9), 0, .45, 0, b), .03);
  M(G.RB(1.12, .22, .72, .08, 2), G.mat('#3fae5a', .9), 0, .92, 0, b);
  [[-.35, .35], [.3, .55], [.1, .25], [-.15, .6], [.38, .2]].forEach(([x, y]) => M(new THREE.CircleGeometry(.06, 10), G.mat('#d4a531', .9), x, y, .36, b, false));
  G.face(b, { y: .55, z: .36, mood: 'angry' }); g.userData.bob = b; return wrap(g, .65, 1.05); };
E.fork = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const ch = G.mat('#e3e8ef', .15, { metalness: 1, envMapIntensity: 1.4 });
  [-.18, -.06, .06, .18].forEach(x => M(G.RB(.07, .5, .07, .03, 1), ch, x, .25, 0, b));
  G.outline(M(G.RB(.56, .3, .1, .05, 2), ch, 0, .62, 0, b), .04); M(G.RB(.18, .4, .09, .04, 1), ch, 0, .95, 0, b);
  G.outline(M(G.RB(.26, 1.05, .11, .06, 2), ch, 0, 1.6, 0, b), .03);
  G.face(b, { y: 1.75, z: .08, s: .55, mood: 'angry', cheeks: false }); g.userData.bob = b; return wrap(g, .45, 2.1); };
E.whisk = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .9; g.add(b); const ch = G.mat('#e3e8ef', .15, { metalness: 1, envMapIntensity: 1.4 });
  for (let i = 0; i < 4; i++) { const t = M(new THREE.TorusGeometry(.38, .025, 6, 20), ch, 0, 0, 0, b); t.scale.set(1, 1.5, 1); t.rotation.y = i * Math.PI / 4; }
  G.outline(M(CYL(.09, .11, .8, 12), G.gloss('#ff6b6b'), 0, .9, 0, b), .05);
  G.face(b, { y: .95, z: .1, s: .5, mood: 'angry', cheeks: false }); g.userData.bob = b; g.userData.spinBody = true; return wrap(g, .45, 1.7); };
E.bacon = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const segs = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Group(); s.position.set(0, .3, -.6 + i * .24); b.add(s);
    M(G.RB(.7, .1, .26, .04, 1), G.mat('#b8432f', .6), 0, 0, 0, s); M(G.RB(.71, .11, .07, .03, 1), G.mat('#ffe2cf', .6), 0, 0, .02, s); segs.push(s); }
  const head = new THREE.Group(); head.position.set(0, .55, .55); b.add(head); M(SPH(.22, 12, 8), G.mat('#b8432f', .6), 0, 0, 0, head).scale.set(1.5, 1, .6);
  G.face(head, { y: .02, z: .14, s: .7, mood: 'angry', cheeks: false }); g.userData.bob = b; g.userData.segs = segs; return wrap(g, .6, 1); };
E.coffeebean = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .5; g.add(b);
  G.outline(M(SPH(.5, 24, 16), G.gloss('#5a3420'), 0, 0, 0, b), .05).scale.set(.8, 1, .65);
  M(G.RB(.06, .8, .06, .03, 1), G.mat('#2a1810'), 0, 0, -.31, b, false);
  G.face(b, { y: .05, z: .32, s: .8, mood: 'angry', cheeks: false }); g.userData.bob = b; return wrap(g, .5, 1); };
E.cornflake = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .6; g.add(b);
  const geo = new THREE.CircleGeometry(.6, 9); const p = geo.attributes.position; for (let i = 1; i < p.count; i++) { const k = .8 + ((i * 37) % 10) / 25; p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); }
  const f = G.outline(M(geo, new THREE.MeshStandardMaterial({ color: G.C('#f2a541'), roughness: .5, side: THREE.DoubleSide }), 0, 0, 0, b), .05);
  G.face(b, { y: .05, z: .03, s: .75, mood: 'angry', cheeks: false }); g.userData.bob = b; g.userData.flap = f; return wrap(g, .6, 1.2); };
E.popsicle = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  M(G.RB(.18, .7, .06, .04, 1), G.mat('#e7c08a', .8), 0, .35, 0, b);
  G.outline(M(G.RB(.7, 1.1, .4, .2, 3), G.gloss('#ff6b9a'), 0, 1.15, 0, b), .04);
  M(G.RB(.72, .3, .42, .14, 2), G.gloss('#ffd1e3'), 0, 1.55, 0, b);
  G.face(b, { y: 1.15, z: .21, s: .8, mood: 'angry' }); g.userData.bob = b; return wrap(g, .5, 1.75); };
E.icecube = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .5; g.add(b);
  G.outline(M(G.RB(.9, .9, .9, .16, 3), G.mat('#bfe9ff', .06, { envMapIntensity: 1.5 }), 0, 0, 0, b), .04);
  M(G.RB(.6, .6, .6, .12, 2), G.mat('#e9f8ff', .1, { transparent: true, opacity: .55 }), .04, .04, .13, b, false);
  const hl = M(G.RB(.1, .32, .02, .01, 1), G.basic('#ffffff'), -.3, .2, .46, b, false); hl.rotation.z = .5;
  G.face(b, { y: 0, z: .46, s: .9, mood: 'angry', cheeks: false }); g.userData.bob = b; return wrap(g, .6, 1); };
E.snowball = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .65; g.add(b);
  G.outline(M(SPH(.65, 24, 16), G.mat('#ffffff', .9), 0, 0, 0, b), .04);
  G.face(b, { y: .1, z: .6, mood: 'angry' }); g.userData.bob = b; g.userData.roll = true; return wrap(g, .7, 1.3); };
E.chili = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const m = G.gloss('#e8262c');
  for (let i = 0; i < 7; i++) { const t = i / 6; M(SPH(.36 * (1 - t * .6) + .05, 16, 12), m, Math.sin(t * 2.4) * .2, 1.25 - t * 1.1, 0, b); }
  M(CYL(.06, .1, .35, 8), G.gloss('#3f9a3a'), 0, 1.65, 0, b);
  G.outline(M(SPH(.42, 16, 12), m, 0, 1.25, 0, b), .05);
  G.face(b, { y: 1.25, z: .38, s: .8, mood: 'angry' }); g.userData.bob = b; return wrap(g, .5, 1.8); };
E.jalapeno = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .5; g.add(b);
  G.outline(M(SPH(.42, 20, 14), G.gloss('#3e9a2e'), 0, 0, 0, b), .05).scale.set(1.5, .85, .85);
  M(CYL(.05, .08, .3, 8), G.mat('#2f6a22'), -.62, .1, 0, b).rotation.z = 1.2;
  G.face(b, { y: .05, z: .34, s: .8, mood: 'angry' }); g.userData.bob = b; return wrap(g, .6, 1); };
E.saucebottle = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(t < .7 ? .42 : .42 - (t - .7) * 1.0, t * 1.4)); }
  G.outline(M(new THREE.LatheGeometry(pts, 20), G.gloss('#d42a1e'), 0, 0, 0, b), .04);
  M(CYL(.14, .14, .25, 12), G.gloss('#2a8a3a'), 0, 1.5, 0, b);
  M(CYL(.43, .43, .45, 20), G.mat('#fff4e0', .6), 0, .55, 0, b);
  G.face(b, { y: .58, z: .44, s: .75, mood: 'angry', cheeks: false }); g.userData.bob = b; return wrap(g, .5, 1.6); };

E.olive = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .62; g.add(b);
  G.outline(M(SPH(.5, 26, 18), G.gloss('#7d9a2c'), 0, 0, 0, b), .045).scale.set(.9, 1.15, .9);
  const p = M(SPH(.2, 16, 10), G.gloss('#e8392e'), 0, .55, 0, b); p.scale.set(1, .55, 1);
  [-1, 1].forEach(s => M(SPH(.13, 10, 8), G.mat('#3b4a1a', .5), s * .22, .07, .08, g).scale.set(1, .6, 1.3));
  G.face(b, { y: .05, z: .44, s: .9, mood: 'sour' }); g.userData.bob = b; return wrap(g, .55, 1.25); };
function pineTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f2b632'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#a8701a'; x.lineWidth = 5;
  for (let i = -128; i < 256; i += 26) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); }
  x.fillStyle = '#7a4a12'; for (let i = 0; i < 128; i += 26) for (let j = 0; j < 128; j += 26) { x.beginPath(); x.arc(i + 13, j, 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; }
let PINE = null;
E.pineapple = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = .7; g.add(b);
  PINE = PINE || new THREE.MeshStandardMaterial({ map: pineTex(), roughness: .55, envMapIntensity: .6 });
  G.outline(M(SPH(.62, 26, 18), PINE, 0, 0, 0, b), .04).scale.set(1, 1.1, 1);
  const spike = G.mat('#c98a1a', .5);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = ((i * 37) % 9) / 9 * 1.0 - .5, r = Math.sqrt(1 - y * y * 1.2) * .62;
    const s = M(new THREE.ConeGeometry(.08, .26, 6), spike, Math.cos(a) * r, y * .68, Math.sin(a) * r, b, false);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a) * r, y * .68, Math.sin(a) * r).normalize()); s.position.multiplyScalar(1.12); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, l = M(new THREE.ConeGeometry(.12, .7, 6), G.gloss('#3f9a3a'), Math.cos(a) * .12, .95, Math.sin(a) * .12, b); l.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); }
  G.face(b, { y: .05, z: .6, s: .9, mood: 'angry' }); g.userData.bob = b; g.userData.roll = true; return wrap(g, .75, 1.6); };

/* ================= FRIENDS (in bubbles) ================= */
const F = G.friendMesh = {};
F.egg = () => { const g = new THREE.Group(); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = -.62 * Math.cos(Math.PI * t); pts.push(new THREE.Vector2(Math.max(.001, .44 * Math.sin(Math.PI * t) * (1 - .16 * y / .62)), y)); }
  G.outline(M(new THREE.LatheGeometry(pts, 28), G.gloss('#fff4e2'), 0, 0, 0, g), .05); G.face(g, { y: .08, z: .4, mood: 'worried' }); return g; };
F.onion = () => { const g = new THREE.Group(); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = -.55 * Math.cos(Math.PI * t); pts.push(new THREE.Vector2(Math.max(.001, .5 * Math.pow(Math.sin(Math.PI * t), .8) * (1 - .25 * Math.max(0, y) / .55)), y)); }
  pts.push(new THREE.Vector2(.001, .75));
  G.outline(M(new THREE.LatheGeometry(pts, 28), G.gloss('#e8b45a'), 0, 0, 0, g), .05);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; const s = M(new THREE.TorusGeometry(.42, .012, 4, 24, Math.PI), G.mat('#c98a3a', .5), 0, 0, 0, g, false); s.rotation.set(0, a, Math.PI / 2); s.scale.set(1.25, 1, 1); }
  [[-.1, .4], [.1, -.4], [0, 0]].forEach(([x, rz], i) => { const l = M(CYL(.014, .045, .5 + (i === 2 ? .14 : 0), 6), G.gloss('#5ab84a'), x, .96 + (i === 2 ? .07 : 0), 0, g); l.rotation.z = rz; });
  for (let i = 0; i < 4; i++) M(CYL(.012, .012, .2, 4), G.mat('#e8d2b0', .6), (i - 1.5) * .06, -.62, 0, g, false);
  G.face(g, { y: .05, z: .47, s: .85, mood: 'worried' }); return g; };
F.cupcake = () => { const g = new THREE.Group();
  G.outline(M(CYL(.42, .3, .5, 16), G.mat('#ff9fc8', .5), 0, -.3, 0, g), .04);
  [[0, .1, .45], [0, .38, .34], [0, .6, .22]].forEach(([x, y, r]) => M(SPH(r, 20, 14), G.gloss('#fff0f6'), x, y, 0, g).scale.set(1, .7, 1));
  M(SPH(.1, 12, 8), G.gloss('#e8263a'), 0, .78, 0, g); G.face(g, { y: -.28, z: .38, s: .8, mood: 'worried' }); return g; };
F.teacup = () => { const g = new THREE.Group();
  G.outline(M(CYL(.48, .35, .6, 24), G.gloss('#ffffff'), 0, 0, 0, g), .04); M(CYL(.44, .44, .02, 24), G.mat('#a4652f', .3), 0, .28, 0, g);
  M(new THREE.TorusGeometry(.18, .05, 8, 16), G.gloss('#ffffff'), .5, 0, 0, g); M(CYL(.7, .6, .06, 24), G.gloss('#bfe3ff'), 0, -.32, 0, g);
  G.face(g, { y: 0, z: .45, s: .8, mood: 'worried' }); return g; };
F.strawberry = () => { const g = new THREE.Group(), R = t => .5 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 1.6))), .8), Y = t => t - .55, rnd = G.rng(3);
  const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new THREE.Vector2(Math.max(.001, R(t)), Y(t))); }
  G.outline(M(new THREE.LatheGeometry(pts, 24), G.gloss('#e8263a'), 0, 0, 0, g), .05);
  for (let i = 0; i < 30; i++) { const t = .15 + rnd() * .68, a = rnd() * TAU; if (Math.abs(a - Math.PI / 2) < .7 && t > .45) continue;
    const sd = M(SPH(.03, 6, 4), G.mat('#ffe27a', .4), Math.cos(a) * R(t), Y(t), Math.sin(a) * R(t), g, false); sd.scale.set(1, 1.5, 1); }
  for (let i = 0; i < 6; i++) { const l = M(SPH(.16, 10, 6), G.gloss('#3f9a3a'), Math.cos(i * TAU / 6) * .17, .38, Math.sin(i * TAU / 6) * .17, g); l.scale.set(1, .22, .5); l.rotation.y = -i * TAU / 6; }
  M(CYL(.03, .03, .16, 6), G.mat('#3f7a2a', .6), 0, .48, 0, g);
  G.face(g, { y: .1, z: .47, s: .8, mood: 'worried' }); return g; };
F.scoop = () => { const g = new THREE.Group();
  G.outline(M(new THREE.ConeGeometry(.32, .7, 16), G.mat('#e0a35a', .7), 0, -.45, 0, g), .04).rotation.x = Math.PI;
  G.outline(M(SPH(.42, 20, 14), G.gloss('#ffc4dc'), 0, .05, 0, g), .04); G.face(g, { y: .08, z: .4, s: .8, mood: 'worried' }); return g; };
F.avocado = () => { const g = new THREE.Group(); const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18, y = -.6 * Math.cos(Math.PI * t); pts.push(new THREE.Vector2(Math.max(.001, .46 * Math.sin(Math.PI * t) * (1 - .28 * y / .6)), y)); }
  const body = G.outline(M(new THREE.LatheGeometry(pts, 24), G.gloss('#3f7a26'), 0, 0, 0, g), .05); body.scale.z = .7;
  const flesh = M(SPH(.4, 24, 16), G.mat('#dff08e', .5), 0, -.06, .2, g, false); flesh.scale.set(.92, 1.22, .42);
  M(SPH(.17, 16, 12), G.gloss('#8a5326'), 0, -.2, .33, g, false);
  G.face(g, { y: .22, z: .36, s: .62, mood: 'worried', cheeks: false }); return g; };

/* bubble around rescued friends */
G.bubbleMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
  fragmentShader: 'uniform float t; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),2.2); vec3 a=vec3(.62,.92,1.), b=vec3(1.,.72,.95), c=vec3(.75,1.,.78); float k=sin(f*7.+t*1.5)*.5+.5; vec3 col=mix(mix(a,b,k),c,sin(f*4.-t)*.25+.25); float spec=pow(max(dot(reflect(-vV,vN),normalize(vec3(.4,.8,.5))),0.),40.); gl_FragColor=linearToOutputTexel(vec4(pow(col,vec3(2.2))+spec*2.,f*.9+.05+spec)); }' });

/* ================= COLLECTIBLES: parts for instancing ================= */
G.itemParts = (kind) => {
  const T = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) => { geo.scale(sx, sy, sz); if (rx) geo.rotateX(rx); geo.translate(x, y, z); return geo; };
  switch (kind) {
    case 'pepperoni': {
      const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), rnd = G.rng(5);
      const gr = x.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, '#cc4a2e'); gr.addColorStop(.75, '#b53622'); gr.addColorStop(1, '#8a2014'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
      const dots = (n, col, r0, r1) => { x.fillStyle = col; for (let i = 0; i < n; i++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * 56; x.beginPath(); x.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r0 + rnd() * (r1 - r0), (r0 + rnd() * (r1 - r0)) * .75, rnd() * 3, 0, 7); x.fill(); } };
      dots(7, 'rgba(255,150,80,.3)', 7, 12); dots(55, 'rgba(255,218,196,.9)', 1.6, 4.2); dots(40, 'rgba(96,22,14,.55)', 1, 2.4);
      const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
      const face = new THREE.MeshStandardMaterial({ map: tx, roughness: .32, envMapIntensity: .9 }), edge = G.gloss('#8f2417');
      return [{ geo: CYL(.44, .44, .07, 32).rotateX(Math.PI / 2), mat: [edge, face, face] }, { geo: new THREE.TorusGeometry(.44, .05, 8, 32), mat: edge }]; }
    case 'olive': return [{ geo: T(SPH(.3, 20, 14), 0, 0, 0, 1, 1.25, 1), mat: G.gloss('#7d9a2c') }, { geo: T(SPH(.12, 12, 8), 0, .34, 0, 1, .5, 1), mat: G.gloss('#e8392e') }];
    case 'candy': return [{ geo: T(SPH(.28, 20, 14), 0, 0, 0, 1.25, .9, .9), mat: G.gloss('#ff4fa0') }, { geo: new THREE.ConeGeometry(.2, .3, 10).scale(1, 1, .5).rotateZ(Math.PI / 2).translate(.42, 0, 0), mat: G.gloss('#ffd23f') }, { geo: new THREE.ConeGeometry(.2, .3, 10).scale(1, 1, .5).rotateZ(-Math.PI / 2).translate(-.42, 0, 0), mat: G.gloss('#ffd23f') }];
    case 'sugar': { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), rnd = G.rng(9);
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 260; i++) { x.fillStyle = rnd() < .5 ? 'rgba(170,190,215,.5)' : 'rgba(215,225,240,.8)'; x.fillRect(rnd() * 64, rnd() * 64, 1.5 + rnd() * 2, 1.5 + rnd() * 2); }
      const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
      return [{ geo: G.RB(.56, .56, .56, .07, 2), mat: new THREE.MeshStandardMaterial({ map: tx, roughness: .6, envMapIntensity: .8 }) }]; }
    case 'blueberry': return [{ geo: SPH(.3, 20, 14), mat: G.gloss('#3b4fa8') }, { geo: T(CYL(.1, .12, .06, 5), 0, .3, 0), mat: G.mat('#1c254f', .6) }];
    case 'cherry': return [{ geo: SPH(.3, 20, 14), mat: G.gloss('#d4142a') }, { geo: T(CYL(.025, .025, .5, 6), .08, .4, 0), mat: G.mat('#3f7a2a', .6) }];
    case 'corn': { const k = SPH(.3, 18, 12), p = k.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i) * (1.05 + y * 1.3), y * 1.2 - Math.max(0, y - .18) * .5, p.getZ(i) * (.55 + y * .5)); }
      k.computeVertexNormals();
      return [{ geo: k, mat: G.gloss('#ffc21a') }, { geo: T(SPH(.11, 10, 8), 0, -.33, 0, 1, 1.1, .7), mat: G.mat('#fff3cf', .5) }, { geo: T(SPH(.07, 8, 6), -.12, .14, .19, 1.6, .8, .4), mat: G.basic('#fff6c0') }]; }
  }
};
G.chiliMesh = () => { const g = new THREE.Group(); const m = G.mat('#e8262c', .15, { emissive: '#ff3a00', emissiveIntensity: .4 });
  for (let i = 0; i < 8; i++) { const t = i / 7; M(SPH(.2 * (1 - t * .78) + .03, 14, 10), m, (t - .45) * 1.1, Math.sin(t * Math.PI) * .22 - t * .2, 0, g, false); }
  M(CYL(.06, .09, .25, 8), G.gloss('#3f9a3a'), -.58, .08, 0, g, false).rotation.z = 1.1; return g; };

/* ================= TOASTER (start + checkpoints) ================= */
G.toasterMesh = () => {
  const g = new THREE.Group(); const chrome = G.mat('#e9eef4', .13, { metalness: 1, envMapIntensity: 1.5 });
  G.outline(M(G.RB(2.5, 1.45, 1.35, .32, 4), chrome, 0, .88, 0, g), .035);
  M(G.RB(2.56, .22, 1.41, .1, 2), G.gloss('#ff6b6b'), 0, .45, 0, g);
  M(G.RB(2.0, .1, .52, .05, 2), G.mat('#2a1d24', .6), 0, 1.58, 0, g, false);
  const glow = M(new THREE.PlaneGeometry(1.85, .4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), 0, 1.6, 0, g, false); glow.rotation.x = -Math.PI / 2;
  const lever = M(G.RB(.18, .18, .4, .06, 1), G.mat('#2a1d24', .4), 1.33, 1.25, 0, g); lever.userData.keep = true;
  M(CYL(.13, .13, .08, 16), G.mat('#2a1d24', .4), .8, .95, .7, g).rotation.x = Math.PI / 2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => M(CYL(.09, .11, .16, 8), G.mat('#2a1d24'), a, .08, b * .5, g));
  g.userData = { glow, lever, heat: 0, on: false };
  return g;
};

/* ================= FLYING SAUCER (goal) ================= */
G.saucerMesh = () => {
  const g = new THREE.Group(); const chrome = G.mat('#e9eef4', .13, { metalness: 1, envMapIntensity: 1.5 });
  const pts = [[0, 0], [1.1, 0], [1.4, .08], [2.0, .22], [2.12, .27], [2.02, .31], [1.35, .18], [0, .16]].map(([x, y]) => new THREE.Vector2(x, y));
  G.outline(M(new THREE.LatheGeometry(pts, 48), G.gloss('#ffffff'), 0, 0, 0, g), .015);
  M(new THREE.TorusGeometry(1.97, .03, 6, 48), G.gloss('#4d7cff'), 0, .27, 0, g).rotation.x = Math.PI / 2;
  M(new THREE.SphereGeometry(1.1, 32, 16, 0, TAU, 0, Math.PI / 2), chrome, 0, .2, 0, g);
  M(SPH(.15, 12, 8), chrome, 0, 1.36, 0, g);
  const lights = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; lights.push(M(SPH(.08, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false }), Math.cos(a) * 1.72, .29, Math.sin(a) * 1.72, g, false)); }
  const beam = new THREE.Mesh(CYL(.9, 1.8, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: G.C('#fff0a8'), transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = -3; g.add(beam);
  g.userData = { lights, beam }; return g;
};

/* ================= BOSSES ================= */
const B = G.bossMesh = {};
B.mushroom = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(1.25 - t * .25 + Math.sin(t * Math.PI) * .12, t * 2.6)); }
  G.outline(M(new THREE.LatheGeometry(pts, 36), G.mat('#fff1dc', .7), 0, 0, 0, b), .025);
  M(CYL(1.3, 1.3, .15, 36), G.mat('#e8d2b0', .7), 0, .05, 0, b);
  const cap = G.outline(M(new THREE.SphereGeometry(2.7, 40, 24, 0, TAU, 0, Math.PI / 2), G.gloss('#b9773f'), 0, 2.45, 0, b), .02); cap.scale.set(1, .72, 1);
  M(CYL(2.68, 2.4, .25, 40), G.mat('#7a4a2a', .8), 0, 2.4, 0, b);
  [[.8, 4.1, .9, .45], [-1.2, 3.75, 1.3, .35], [1.6, 3.4, -.9, .4], [-.4, 4.3, -.6, .3], [-1.7, 3.3, -1.2, .38]].forEach(([x, y, z, r]) => M(SPH(r, 14, 10), G.mat('#f2dcbc', .6), x, y, z, b).scale.set(1, .35, 1));
  [-1, 1].forEach(s => M(SPH(.32, 14, 10), G.mat('#e8d2b0', .6), s * .55, .12, .7, b).scale.set(1, .5, 1.4));
  G.face(b, { y: 1.35, z: 1.2, s: 2.2, mood: 'angry' }); return bossWrap(g, 2.1, 4.4, b); };
function spiralTex(a, b) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = a; x.fillRect(0, 0, 256, 256); x.strokeStyle = b; x.lineWidth = 22; x.beginPath();
  for (let i = 0; i < 400; i++) { const t = i / 400 * 5 * TAU, r = i / 400 * 125; x.lineTo(128 + Math.cos(t) * r, 128 + Math.sin(t) * r); } x.stroke();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
function labelTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#fff4e0'; x.fillRect(0, 0, 512, 256); x.translate(512, 0); x.scale(-1, 1); x.fillStyle = '#d42a1e'; x.font = '64px "Secular One", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('לוהט!', 128, 140); x.fillText('לוהט!', 384, 140);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
function waffleTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#e3a55a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#b8782f'; x.lineWidth = 6;
  for (let i = -128; i < 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; }
const bossWrap = (g, r, h, body) => { g.userData.r = r; g.userData.h = h; g.userData.body = body; return g; };
B.meatball = () => { const g = new THREE.Group(), b = new THREE.Group(); b.position.y = 2.2; g.add(b);
  const geo = new THREE.IcosahedronGeometry(2.2, 4); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + .05 * Math.sin(v.x * 3.1) * Math.sin(v.y * 3.7) * Math.sin(v.z * 2.9)); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); G.outline(M(geo, G.mat('#7a3e22', .85), 0, 0, 0, b), .025);
  M(new THREE.SphereGeometry(2.28, 32, 16, 0, TAU, 0, .9), G.gloss('#d23b25'), 0, 0, 0, b);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; M(SPH(.25, 10, 8), G.gloss('#d23b25'), Math.cos(a) * 1.75, 1.15, Math.sin(a) * 1.75, b).scale.set(1, 2, 1); }
  M(SPH(.6, 14, 8), G.gloss('#3f9a3a'), .2, 2.2, 0, b).scale.set(1, .15, .5);
  G.face(b, { y: .3, z: 2.05, s: 3, mood: 'angry' }); return bossWrap(g, 2.2, 4.4, b); };
B.lollipop = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  M(CYL(.28, .28, 3, 12), G.mat('#ffffff', .5), 0, 1.5, 0, b);
  const disc = G.outline(M(CYL(2, 2, .55, 40), [new THREE.MeshStandardMaterial({ color: G.C('#ff9cc6'), roughness: .25 }), new THREE.MeshStandardMaterial({ map: spiralTex('#ffffff', '#ff3d8a'), roughness: .2 }), new THREE.MeshStandardMaterial({ map: spiralTex('#ffffff', '#ff3d8a'), roughness: .2 })], 0, 4.3, 0, b), .03);
  disc.rotation.x = Math.PI / 2;
  const crown = new THREE.Group(); crown.position.y = 6.3; b.add(crown);
  M(CYL(.9, .9, .5, 20, 1, true), G.mat('#ffd23f', .2, { metalness: .8, side: THREE.DoubleSide }), 0, 0, 0, crown);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; M(new THREE.ConeGeometry(.2, .5, 8), G.mat('#ffd23f', .2, { metalness: .8 }), Math.cos(a) * .85, .45, Math.sin(a) * .85, crown); M(SPH(.1, 8, 6), G.gloss('#4dd2ff'), Math.cos(a) * .9, .1, Math.sin(a) * .9, crown); }
  [-1, 1].forEach(s => M(SPH(.45, 16, 10), G.gloss('#ff3d8a'), s * .5, .25, .2, b).scale.set(1, .6, 1.4));
  G.face(b, { y: 4.4, z: .32, s: 2.6, mood: 'angry' }); return bossWrap(g, 2, 6.3, b); };
B.kettle = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const enamel = G.gloss('#e8453c'), ch = G.mat('#e3e8ef', .15, { metalness: 1, envMapIntensity: 1.4 });
  G.outline(M(SPH(2, 32, 24), enamel, 0, 2.0, 0, b), .02).scale.set(1, .85, 1);
  M(CYL(1.6, 1.7, .3, 32), ch, 0, .4, 0, b);
  const lid = new THREE.Group(); lid.position.y = 3.65; b.add(lid); M(CYL(1.05, 1.15, .3, 28), enamel, 0, 0, 0, lid); M(SPH(.25, 14, 10), G.mat('#2a1d24', .4), 0, .3, 0, lid);
  const sp = M(CYL(.2, .38, 1.8, 16), enamel, 0, 2.1, 2.1, b); sp.rotation.x = 1.05;
  const h = M(new THREE.TorusGeometry(1.1, .14, 10, 24, Math.PI), G.mat('#2a1d24', .4), 0, 3.2, -1.4, b); h.rotation.y = Math.PI / 2; h.rotation.z = Math.PI / 2;
  G.face(b, { y: 2.2, z: 1.85, s: 2.4, mood: 'angry' });
  const beam = new THREE.Mesh(CYL(.45, 1.2, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: G.C('#ffffff').multiplyScalar(1.3), transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.rotation.x = Math.PI / 2; beam.position.set(0, .8, 8.6); beam.visible = false; b.add(beam);
  const g2 = bossWrap(g, 2, 3.9, b); g2.userData.lid = lid; g2.userData.beam = beam; return g2; };
B.pancakes = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  M(CYL(2.4, 2.3, .2, 32), G.gloss('#ffffff'), 0, .1, 0, b);
  for (let i = 0; i < 6; i++) G.outline(M(CYL(1.95 - (i % 2) * .08, 2.0, .5, 32), G.mat(i % 2 ? '#e8a45a' : '#dc9446', .55), 0, .45 + i * .5, 0, b), .015);
  M(G.RB(.9, .35, .9, .08, 2), G.gloss('#ffe26a'), 0, 3.35, 0, b);
  M(CYL(1.85, 1.85, .08, 32), G.mat('#b8661c', .1, { envMapIntensity: 1.4 }), 0, 3.22, 0, b);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; M(SPH(.18, 10, 8), G.mat('#b8661c', .1), Math.cos(a) * 1.92, 2.9, Math.sin(a) * 1.92, b).scale.set(1, 2.2, 1); }
  G.face(b, { y: 1.7, z: 2.0, s: 2.3, mood: 'angry' }); return bossWrap(g, 2, 3.5, b); };
B.icecream = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  G.outline(M(new THREE.ConeGeometry(1.4, 3, 28), new THREE.MeshStandardMaterial({ map: waffleTex(), roughness: .7 }), 0, 1.5, 0, b), .02).rotation.x = Math.PI;
  [['#ffc4dc', 1.45, 3.4], ['#fff6e0', 1.3, 4.9], ['#7a4a2a', 1.12, 6.2]].forEach(([c, r, y]) => G.outline(M(SPH(r, 28, 20), G.gloss(c), 0, y, 0, b), .02));
  M(SPH(.3, 14, 10), G.gloss('#d4142a'), 0, 7.4, 0, b);
  G.face(b, { y: 4.9, z: 1.25, s: 2.2, mood: 'angry' }); return bossWrap(g, 1.6, 7.6, b); };
B.hotsauce = () => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(t < .65 ? 1.5 : Math.max(.45, 1.5 - (t - .65) * 4), t * 5.2)); }
  G.outline(M(new THREE.LatheGeometry(pts, 32), G.gloss('#d42a1e'), 0, 0, 0, b), .02);
  M(CYL(1.52, 1.52, 1.6, 32, 1, true), new THREE.MeshStandardMaterial({ map: labelTex(), roughness: .6 }), 0, 1.6, 0, b).rotation.y = Math.PI;
  M(CYL(.5, .5, .7, 20), G.gloss('#2a8a3a'), 0, 5.5, 0, b);
  G.face(b, { y: 3.1, z: 1.52, s: 2, mood: 'angry' });
  const fl = M(SPH(1, 16, 12), new THREE.MeshBasicMaterial({ color: G.C('#ff8a2b').multiplyScalar(2), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, 6.3, 0, b, false); fl.scale.set(.8, 1.3, .8);
  const g2 = bossWrap(g, 1.6, 5.9, b); g2.userData.flame = fl; return g2; };

/* boss shots */
G.shotMesh = (kind) => {
  switch (kind) {
    case 'candy': return M(SPH(.4, 14, 10), G.gloss('#ff4fa0'));
    case 'drop': return M(SPH(.38, 14, 10), G.mat('#bfeaff', .05, { envMapIntensity: 1.6 }));
    case 'pancake': { const g = G.outline(M(CYL(.85, .9, .22, 20), G.mat('#e0a050', .55)), .04); return g; }
    case 'scoop': return G.outline(M(SPH(.65, 18, 12), G.gloss('#ffc4dc')), .04);
    case 'fire': return M(SPH(.42, 14, 10), new THREE.MeshBasicMaterial({ color: G.C('#ff7a2b').multiplyScalar(2.2), toneMapped: false }));
    case 'meatball': return G.outline(M(SPH(.45, 14, 10), G.mat('#7a3e22', .85)), .04);
    default: return M(SPH(.35, 12, 8), G.gloss('#ffd23f'));
  }
};
})();
