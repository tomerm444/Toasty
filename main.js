/* טוסטי הגיבור — the game: hero controls, game flow, menus and HUD */
'use strict';
(() => {
const G = window.G, V3 = THREE.Vector3, $ = id => document.getElementById(id);
const stage = $('stage');
function fail(msg) { const e = $('err'); e.textContent = msg; e.hidden = false; $('loading').hidden = true; }
if (!window.THREE || !G || !G.initRenderer) { fail('לא הצלחתי לטעון את ספריית התלת־ממד. נסו לרענן את הדף.'); return; }
try { G.initRenderer(stage); }
catch (e) { fail('הדפדפן הזה לא מאפשר גרפיקה תלת־ממדית (WebGL). נסו בכרום או בספארי מעודכנים, או הפעילו "האצת חומרה" בהגדרות הדפדפן.'); return; }
stage.insertBefore(G.renderer.domElement, stage.firstChild);
G.popLayer = $('pops');
G.initParticles();

/* ---------- saved progress ---------- */
const coarse = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
let prog = { unlocked: 1, best: [], diff: 'normal', quality: coarse ? 'medium' : 'high', muted: false };
try { const s = JSON.parse(localStorage.getItem('toasty3d-v1')); if (s && s.unlocked) prog = Object.assign(prog, s); } catch (e) {}
const save = () => { try { localStorage.setItem('toasty3d-v1', JSON.stringify(prog)); } catch (e) {} };
G.setQuality(prog.quality); G.setMuted(prog.muted);
if (coarse) document.body.classList.add('touch');

/* ---------- hero ---------- */
const hero = G.makeHero(); G.scene.add(hero); const blob = hero.userData.blob; G.scene.add(blob);
const P = G.P = { pos: new V3(), vel: new V3(), r: .6, h: 2.1, yaw: 0, ground: null, prevY: 0, coyote: 0, jumpBuf: 0, spinT: 0, spinCD: 0, airSpin: false,
  pounding: false, poundHang: 0, inv: 0, chiliT: 0, hearts: 3, maxHearts: 3, squash: 0, flip: 0, mode: 'play', modeT: 0, items: 0, friends: 0, time: 0, glide: false };
const DIFF = { easy: { hearts: 5 }, normal: { hearts: 3 }, hard: { hearts: 2 } };
let state = 'menu', W = 0, L = null, t = 0, last = performance.now(), menuW = 0;
const ITEM_COLORS = { pepperoni: '#c2362b', olive: '#7d9a2c', candy: '#ff4fa0', sugar: '#ffffff', blueberry: '#3b4fa8', cherry: '#d4142a', corn: '#ffcf2e' };

/* ---------- HUD helpers ---------- */
let tipTimer = 0;
function tip(text, secs = 5) { const e = $('tip'); e.textContent = text; e.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(() => e.classList.remove('on'), secs * 1000); }
let bannerTimer = 0;
function banner(text, small = '', secs = 1.8) { const e = $('banner'); e.innerHTML = ''; e.textContent = text; if (small) { const s = document.createElement('small'); s.textContent = small; e.appendChild(s); } e.classList.add('on'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => e.classList.remove('on'), secs * 1000); }
function hud() {
  const h = $('hearts'); h.innerHTML = '';
  for (let i = 0; i < P.maxHearts; i++) h.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="${i < P.hearts ? '#ff4f5a' : 'rgba(255,244,226,.25)'}"/></svg>`);
  $('items').textContent = P.items; $('itemtot').textContent = '/' + (L ? L.totalItems : 0); $('friends').textContent = P.friends;
}
function show(id) { ['scr-title', 'scr-help', 'scr-pause', 'scr-done'].forEach(s => $(s).hidden = s !== id); }

/* ---------- events from the world ---------- */
G.ev.collect = (pos) => {
  P.items++; G.sfx.collect(); G.emit(pos.x, pos.y, pos.z, { n: 8, color: '#fff2b0', glow: true, speed: 3, up: 2, size: .35, life: .5 });
  if (P.items % 30 === 0 && P.hearts < P.maxHearts) { P.hearts++; G.popup('+לב', pos, '#ff8f9a', true); G.sfx.big(); }
  hud();
};
G.ev.rescue = (pos) => {
  P.friends++; G.sfx.rescue(); G.popup(`הצלת את ${L.T.friendName}!`, pos.clone().setY(pos.y + 1.5), '#bfefff', true);
  for (const c of ['#ff5fa2', '#ffd23f', '#5ecbff', '#7be36a']) G.emit(pos.x, pos.y, pos.z, { n: 8, color: c, glow: true, speed: 6, up: 5, size: .45, life: 1, grav: 6 });
  hud();
};
G.ev.chili = (pos) => { P.chiliT = 8; G.sfx.chili(); banner('חריף!', 'ריצה מהירה וכל נגיעה שורפת', 1.6); };
G.ev.checkpoint = (pos) => { G.sfx.ding(); G.popup('נקודת בדיקה!', pos.clone().setY(pos.y + 2.5), '#ffd95a'); };
const KILL_WORD = { stomp: ['פלאק!', '#ffffff'], spin: ['וווש!', '#7ff6ff'], pound: ['בום!', '#ffd95a'], chili: ['צ׳ססס!', '#ff8a3c'] };
G.ev.enemyKilled = (how, pos) => { const [w, c] = KILL_WORD[how] || ['!', '#fff']; G.popup(w, pos, c); G.emit(pos.x, pos.y, pos.z, { n: 10, color: c, glow: how !== 'stomp', speed: 4, up: 3, size: .45 }); };
G.ev.stomped = () => { P.vel.y = G.input.jumpHeld ? 14 : 10; P.squash = .7; P.pounding = false; };
G.ev.bossStomp = () => { P.vel.y = 15; P.squash = .8; };
G.ev.hurt = (from) => {
  if (P.inv > 0 || P.chiliT > 0 || P.mode !== 'play') return;
  P.hearts--; P.inv = 1.6; P.pounding = false;
  const d = new V3(P.pos.x - from.x, 0, P.pos.z - from.z); if (d.lengthSq() < .01) d.set(0, 0, 1); d.normalize();
  P.vel.set(d.x * 7, 8, d.z * 7); G.sfx.hurt(); G.cam.shake = .35;
  G.popup('אאוץ׳!', P.pos.clone().setY(P.pos.y + 2.4), '#ff8f9a');
  G.emit(P.pos.x, P.pos.y + 1, P.pos.z, { n: 12, color: '#ff4f5a', glow: true, speed: 4, up: 3, size: .4 });
  hud(); if (P.hearts <= 0) respawn('אופס! עוד פעם');
};
G.ev.bossStart = (name, B) => { $('bossbar').hidden = false; $('bossname').textContent = name; $('bossfill').style.width = (B.hp / B.maxHp * 100) + '%'; banner(name, 'בוס!', 2.2); G.sfx.bossIntro(); tip(L.T.bossHint, 8); };
G.ev.bossHit = (hp, max) => { $('bossfill').style.width = Math.max(0, hp / max * 100) + '%'; G.popup('פגיעה!', L.boss.pos.clone().setY(L.boss.pos.y + L.boss.h + 1), '#ffd95a', true); };
G.ev.bossDefeated = () => { $('bossbar').hidden = true; banner('ניצחון!', L.T.bossName + ' הובס', 2.4); G.sfx.win(); setTimeout(() => tip('הצלחת! עלו לצלחת המעופפת שנחתה באמצע הזירה', 6), 2300); };
G.ev.bossReset = () => { $('bossbar').hidden = true; };
G.ev.goal = () => { P.mode = 'beam'; P.modeT = 0; P.vel.set(0, 0, 0); G.sfx.win(); };

/* ---------- respawn from a toaster ---------- */
function enterToaster(cp, first) {
  P.mode = 'toaster'; P.modeT = first ? -0.6 : 0; P.cp = cp; P.vel.set(0, 0, 0); P.flip = 0; P.pounding = false; P.chiliT = 0; P.spinT = 0;
  P.pos.set(cp.p.x, cp.p.y - .42, cp.p.z); P.yaw = cp.yaw; P.lastGroundY = cp.p.y;
  G.cam.yaw = cp.yaw + Math.PI; G.cam.pitch = .38; G.cam.target.set(cp.p.x, cp.p.y + 1.5, cp.p.z);
}
function respawn(msg) {
  if (P.hearts <= 0) P.hearts = P.maxHearts;
  banner(msg, '', 1.4); G.resetBossForRespawn(); hud(); enterToaster(L.cp, false);
}

/* ---------- hero controls ---------- */
const RUN = 7, JUMP = 12, GRAV = 32;
function stepHero(dt) {
  const I = G.input;
  if (P.mode === 'toaster') {
    P.modeT += dt; const cp = P.cp; cp.m.userData.heat = Math.max(cp.m.userData.heat, G.clamp(P.modeT / 1.1, 0, 1));
    if (Math.random() < .3) G.emit(cp.p.x + (Math.random() - .5) * 1.6, cp.p.y + 1.7, cp.p.z, { n: 1, color: '#ffffff', speed: .3, up: 1.2, size: .8, life: .9, grav: -1 });
    if (P.modeT > 1.1) { P.mode = 'pop'; G.sfx.ding(); G.popup('דינג!', cp.p.clone().setY(cp.p.y + 2.8), '#ffd95a', true);
      P.vel.set(Math.sin(cp.yaw) * 2.8, 10.5, Math.cos(cp.yaw) * 2.8); }
    return;
  }
  if (P.mode === 'pop') {
    P.vel.y -= 30 * dt; P.pos.addScaledVector(P.vel, dt); P.flip = Math.min(1, P.flip + dt / 1.0);
    if (P.vel.y < 0 && P.pos.y < P.cp.p.y + 1.7) { P.mode = 'play'; P.flip = 0; }
    return;
  }
  if (P.mode === 'beam') {
    const s = L.saucer.m.position; P.modeT += dt; P.pos.x += (s.x - P.pos.x) * dt * 2; P.pos.z += (s.z - P.pos.z) * dt * 2; P.pos.y += dt * 2.5; P.yaw += dt * 6;
    hero.scale.setScalar(Math.max(.05, 1 - P.modeT * .35));
    if (P.modeT > 2.4 && state === 'play') finishWorld();
    return;
  }
  G.readKeys(dt);
  const T = L.T, yaw = G.cam.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const speed = RUN * (P.chiliT > 0 ? 1.45 : 1);
  const wx = (rx * I.mx + fx * I.my) * speed, wz = (rz * I.mx + fz * I.my) * speed;
  const grounded = !!P.ground;
  const acc = grounded ? (T.slippery ? 3.2 : 14) : 5;
  if (!P.pounding) { P.vel.x += (wx - P.vel.x) * Math.min(1, acc * dt); P.vel.z += (wz - P.vel.z) * Math.min(1, acc * dt); }
  else { P.vel.x = P.vel.z = 0; }
  const wl = Math.hypot(wx, wz);
  if (wl > .5 && !P.pounding) P.yaw = G.angLerp(P.yaw, Math.atan2(wx, wz), Math.min(1, dt * 12));
  // jump, glide, spin, ground pound
  if (I.jumpPressed) P.jumpBuf = .15;
  P.jumpBuf -= dt; P.coyote = grounded ? .12 : P.coyote - dt;
  if (grounded) { P.airSpin = false; }
  if (P.jumpBuf > 0 && P.coyote > 0 && !P.pounding) {
    P.vel.y = JUMP; P.jumpBuf = 0; P.coyote = 0; P.ground = null; G.sfx.jump(); P.squash = 0;
    G.emit(P.pos.x, P.pos.y + .1, P.pos.z, { n: 6, color: '#ffffff', speed: 2.5, up: .6, size: .5, life: .4 });
  }
  if (I.spinPressed && P.spinCD <= 0) { P.spinT = .42; P.spinCD = .55; G.sfx.spin(); if (!grounded && !P.airSpin) { P.vel.y = Math.max(P.vel.y, 5); P.airSpin = true; }
    G.emit(P.pos.x, P.pos.y + 1, P.pos.z, { n: 12, color: '#ff6b6b', glow: true, speed: 6, up: .3, size: .35, life: .3, ring: true, grav: 0 }); }
  if (I.poundPressed && !P.ground && !P.pounding && P.mode === 'play') { P.pounding = true; P.poundHang = .2; P.vel.set(0, 0, 0); G.sfx.spin(); }
  let g = GRAV; if (P.vel.y > 0 && !I.jumpHeld && !P.pounding) g *= 2.1;
  P.glide = false;
  if (P.pounding) { if (P.poundHang > 0) { P.poundHang -= dt; P.vel.y = 0; } else P.vel.y = -32; }
  else if (!P.ground && I.jumpHeld && P.vel.y < 0) { P.vel.y = Math.max(P.vel.y - g * dt * .25, -2.6); P.glide = true; }
  else P.vel.y = Math.max(P.vel.y - g * dt, -30);
  // move + collide (two sub-steps)
  const wasGround = !!P.ground, startY = P.pos.y, fallSpeed = P.vel.y;
  G.collide(P, dt / 2); G.collide(P, dt / 2);
  P.prevY = startY;
  if (P.ground && P.ground.bouncy) { P.vel.y = 17; P.ground.wob = 1; P.ground = null; G.sfx.boing(); P.squash = 1; P.pounding = false; P.airSpin = false;
    G.emit(P.pos.x, P.pos.y + .2, P.pos.z, { n: 10, color: '#ff9cc6', speed: 4, up: 2, size: .5, life: .5 }); }
  else if (P.ground && !wasGround) {
    if (P.pounding) { P.pounding = false; P.squash = 1; G.sfx.pound(); G.cam.shake = .6; G.poundAt(P.pos);
      G.emit(P.pos.x, P.pos.y + .2, P.pos.z, { n: 26, color: '#fff2c8', speed: 9, up: .6, size: .9, life: .55, ring: true, grav: 0 });
      G.popup('בום!', P.pos.clone().setY(P.pos.y + 2.6), '#ffd95a', true); }
    else { P.squash = Math.min(1, -fallSpeed / 18); if (fallSpeed < -8) { G.sfx.land(); G.emit(P.pos.x, P.pos.y + .1, P.pos.z, { n: 8, color: '#ffffff', speed: 3, up: .5, size: .55, life: .45 }); } }
  }
  if (P.ground) P.lastGroundY = P.pos.y;
  if (P.pos.y < L.killY || P.pos.y < (P.lastGroundY ?? 0) - 16) { if (L.diff !== 'easy') P.hearts--; G.sfx.hurt(); respawn('נפלת! חוזרים לטוסטר'); return; }
  // timers
  P.spinT = Math.max(0, P.spinT - dt); P.spinCD -= dt; P.inv = Math.max(0, P.inv - dt); P.squash = Math.max(0, P.squash - dt * 3.2);
  if (P.chiliT > 0) { P.chiliT -= dt; if (Math.random() < .6) G.emit(P.pos.x, P.pos.y + .6, P.pos.z, { n: 1, color: '#ff7a2b', glow: true, speed: .5, up: 1.5, size: .6, life: .4, grav: -2 }); if (P.chiliT <= 0) tip('החריף נגמר', 2); }
  if (P.ground && Math.hypot(P.vel.x, P.vel.z) > 5 && Math.random() < dt * 8) G.emit(P.pos.x, P.pos.y + .1, P.pos.z, { n: 1, color: '#d79a4a', speed: 1, up: 1.5, size: .25, life: .5, grav: 8 });
  P.time += dt;
}
function heroVisual(dt) {
  hero.position.copy(P.pos); hero.rotation.y = P.yaw;
  const sp = Math.min(1, Math.hypot(P.vel.x, P.vel.z) / RUN);
  G.animateHero(hero, {
    squash: P.squash, stretch: (!P.ground && P.mode === 'play') ? Math.min(.22, Math.abs(P.vel.y) * .012) : 0,
    flip: P.mode === 'pop' ? P.flip : (P.pounding && P.poundHang > 0 ? 1 - P.poundHang / .2 : 0),
    lean: P.ground ? sp * .14 : 0, spin: P.spinT > 0 ? 1 - P.spinT / .42 : 0,
    armUp: P.mode === 'toaster' ? 1 : (!P.ground ? .8 : 0), air: !P.ground || P.mode !== 'play', glide: P.glide,
    speed: P.ground ? sp : 0, surprised: P.mode === 'pop' || P.mode === 'beam' || P.inv > 1.2, angry: P.pounding,
    hideLegs: P.mode === 'toaster', chili: P.chiliT > 0
  }, t, dt);
  hero.visible = !(P.inv > 0 && Math.sin(t * 40) > .3) || P.mode !== 'play';
  const gr = P.mode === 'play' ? G.groundAt(P.pos.x, P.pos.z, P.pos.y + .2) : { y: -Infinity };
  if (gr.y > -1e8) { blob.visible = true; blob.position.set(P.pos.x, gr.y + .03, P.pos.z); const hgt = P.pos.y - gr.y; blob.scale.setScalar(Math.max(.35, 1 - hgt * .08)); blob.material.opacity = Math.max(.15, .42 - hgt * .03); }
  else blob.visible = false;
}

/* ---------- game flow ---------- */
const TIPS_DESKTOP = ['הליכה: חיצים או WASD. סיבוב המצלמה: גרירה עם העכבר, או Q ו־E', 'קפיצה: רווח. ממשיכים להחזיק רווח באוויר וטוסטי גולש עם הגלימה!', 'X מסובב את הגלימה ומנצח אויבים. C באוויר עושה נחיתת רעם', 'אספו פפרוני, הצילו 3 חברים בבועות, ונצחו את הבוס בסוף העולם!'];
const TIPS_TOUCH = ['גררו אצבע בצד שמאל כדי ללכת, ובצד ימין כדי לסובב את המצלמה', 'קפיצה: הכפתור האדום. ממשיכים ללחוץ באוויר כדי לגלוש עם הגלימה!', '"סיבוב" מנצח אויבים קרובים. "נחיתה" באוויר עושה נחיתת רעם', 'אספו פפרוני, הצילו 3 חברים בבועות, ונצחו את הבוס בסוף העולם!'];
let tutorial = [];
function startWorld(w) {
  G.audioInit(); W = w; state = 'play'; G.playing = true; show(null);
  L = G.buildLevel(w, prog.diff);
  P.maxHearts = P.hearts = DIFF[prog.diff].hearts; P.items = 0; P.friends = 0; P.time = 0; P.inv = 0; P.chiliT = 0; hero.scale.setScalar(1); hero.visible = true;
  $('hud').hidden = false; $('bossbar').hidden = true; $('touch').hidden = !coarse;
  $('worldchip').textContent = `${w + 1} · ${L.T.name}`; $('itemico').style.background = ITEM_COLORS[L.T.item];
  enterToaster(L.cp, true); hud();
  banner(L.T.name, `עולם ${w + 1}`, 2.2);
  G.playMusic(L.T.music);
  tutorial = w === 0 ? (coarse ? TIPS_TOUCH : TIPS_DESKTOP).slice() : [];
  if (w > 0) setTimeout(() => state === 'play' && tip(`אספו ${L.T.itemName} והצילו את החברים. הבוס מחכה בסוף!`, 5), 2400);
  tutT = 2.5;
}
let tutT = 0;
function finishWorld() {
  state = 'done'; G.playing = false; G.stopMusic();
  const T = L.T, last = W === G.THEMES.length - 1;
  const b = prog.best[W] || { friends: 0, items: 0 }; prog.best[W] = { friends: Math.max(b.friends, P.friends), items: Math.max(b.items, P.items) };
  prog.unlocked = Math.max(prog.unlocked, Math.min(G.THEMES.length, W + 2)); save();
  $('done-title').textContent = last ? 'ניצחתם את כל הבוסים!' : `${T.name} הושלם!`;
  $('d-friends').textContent = `${P.friends}/${L.totalFriends}`; $('d-items').textContent = `${P.items}/${L.totalItems}`; $('d-itemname').textContent = T.itemName;
  const s = Math.round(P.time); $('d-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('d-msg').textContent = last ? 'טוסטי הציל את כל המזווה. אתם אלופים!' : P.friends === L.totalFriends ? 'כל החברים ניצלו. טוסטי גאה בכם!' : (L.totalFriends - P.friends === 1 ? 'עוד חבר אחד מחכה בעולם הזה. אולי בפעם הבאה?' : `עוד ${L.totalFriends - P.friends} חברים מחכים בעולם הזה. אולי בפעם הבאה?`);
  $('btn-next').hidden = last; $('hud').hidden = true; $('touch').hidden = true; show('scr-done');
}
function toMenu() {
  state = 'menu'; G.playing = false; G.stopMusic(); $('hud').hidden = true; $('bossbar').hidden = true; $('touch').hidden = true;
  hero.visible = false; blob.visible = false; buildMenu(); show('scr-title');
  menuW = Math.min(prog.unlocked - 1, G.THEMES.length - 1); L = G.buildLevel(menuW, prog.diff);
}
function pause() { if (state !== 'play') return; state = 'pause'; G.playing = false; show('scr-pause'); syncSeg('seg-q2', G.quality); }
function resume() { if (state !== 'pause') return; state = 'play'; G.playing = true; show(null); G.clearPresses(); last = performance.now(); }

/* ---------- menus ---------- */
function syncSeg(id, v) { document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
let hoverT = 0;
function buildMenu() {
  const box = $('worlds'); box.innerHTML = '';
  G.THEMES.forEach((T, i) => {
    const b = document.createElement('button'); b.className = 'world'; b.id = 'world-' + i; const locked = i >= prog.unlocked; b.disabled = locked;
    const best = prog.best[i];
    b.innerHTML = `<div class="art" style="background:linear-gradient(180deg,${T.sky[0]},${T.sky[1]} 60%,${T.sea} 61%)"><span>${i + 1}</span></div>
      <div class="info"><span class="t"></span><span class="d"></span><span class="s"></span></div>`;
    b.querySelector('.t').textContent = T.name; b.querySelector('.d').textContent = T.blurb;
    b.querySelector('.s').textContent = locked ? 'נעול. נצחו את הבוס הקודם' : best ? `חברים ${best.friends}/3 · ${T.itemName} ${best.items}` : `בוס: ${T.bossName}`;
    b.onclick = () => startWorld(i);
    b.onmouseenter = b.onfocus = () => { clearTimeout(hoverT); hoverT = setTimeout(() => { if (!locked && menuW !== i && state === 'menu') { menuW = i; L = G.buildLevel(i, prog.diff); } }, 350); };
    box.appendChild(b);
  });
  syncSeg('seg-diff', prog.diff); syncSeg('seg-q', G.quality);
  const wl = $('wlist'); wl.innerHTML = '';
  G.THEMES.forEach((T, i) => { const d = document.createElement('div'); const bb = document.createElement('b'); bb.textContent = `${i + 1}. ${T.name}`; d.appendChild(bb);
    d.appendChild(document.createTextNode(`${T.blurb}. אוספים ${T.itemName}, מצילים את ${T.friendName}, והבוס: ${T.bossName}.`)); wl.appendChild(d); });
}
document.querySelectorAll('#seg-diff button').forEach(b => b.onclick = () => { prog.diff = b.dataset.v; save(); syncSeg('seg-diff', prog.diff); });
const setQ = v => { prog.quality = v; save(); G.setQuality(v); syncSeg('seg-q', v); syncSeg('seg-q2', v); };
document.querySelectorAll('#seg-q button, #seg-q2 button').forEach(b => b.onclick = () => setQ(b.dataset.v));
let helpFrom = 'scr-title';
$('btn-help').onclick = () => { helpFrom = 'scr-title'; show('scr-help'); $('scr-help').scrollTop = 0; };
$('btn-help2').onclick = () => { helpFrom = 'scr-pause'; show('scr-help'); $('scr-help').scrollTop = 0; };
$('btn-help-back').onclick = () => show(helpFrom);
$('btn-pause').onclick = () => state === 'pause' ? resume() : pause();
$('btn-resume').onclick = resume;
$('btn-restart').onclick = () => startWorld(W);
$('btn-menu').onclick = toMenu; $('btn-menu2').onclick = toMenu;
$('btn-again').onclick = () => startWorld(W);
$('btn-next').onclick = () => startWorld(W + 1);
$('btn-mute').onclick = () => { prog.muted = !G.muted; G.setMuted(prog.muted); save(); $('wave').style.display = prog.muted ? 'none' : ''; };
if (prog.muted) $('wave').style.display = 'none';
addEventListener('keydown', e => {
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') resume(); else if (!$('scr-help').hidden) show(helpFrom); }
});
addEventListener('blur', () => pause());
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
G.bindPointer(stage, $('joy'), $('knob'));
G.bindButtons($('tbtns'));

/* ---------- performance watchdog: step the graphics down if frames get slow ---------- */
let perfAcc = 0, perfN = 0, perfWarm = 0;
function perf(dt) {
  if (state !== 'play') { perfWarm = 0; return; }
  perfWarm += dt; if (perfWarm < 3) return;
  perfAcc += dt; perfN++;
  if (perfAcc > 3) { const avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
    if (avg > 1 / 38 && G.quality !== 'low') { setQ(G.quality === 'high' ? 'medium' : 'low'); tip('עברתי לגרפיקה מהירה יותר כדי שהמשחק ירוץ חלק', 4); perfWarm = 0; } }
}

/* ---------- main loop ---------- */
const farP = { pos: new V3(0, -9999, 0), vel: new V3(), h: 2, inv: 1, spinT: 0, chiliT: 0, prevY: -9999, ground: null };
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (state === 'play') {
    t += dt;
    G.updatePlatforms(dt, t, P);
    stepHero(dt);
    G.updateLevel(dt, t, P);
    heroVisual(dt);
    const bossF = L.boss ? new V3(L.boss.pos.x, L.boss.pos.y + L.boss.h * .5, L.boss.pos.z) : (L.saucer && P.mode !== 'beam' ? L.saucer.m.position.clone().setY(L.arena.y + 2) : null);
    const moving = P.mode === 'play' ? Math.hypot(G.input.mx, G.input.my) * (G.input.my > -.3 ? .7 : 0) : 0;
    G.updateCamera(dt, { pos: P.pos, yaw: P.yaw, moving }, bossF);
    G.clearPresses();
    if (tutorial.length && P.mode === 'play') { tutT -= dt; if (tutT <= 0) { tip(tutorial.shift(), 6); tutT = 6.5; } }
  } else if (state === 'menu' && L) {
    t += dt; G.updatePlatforms(dt, t, farP); G.updateLevel(dt, t, farP);
    const a = t * .12; G.camera.position.set(Math.sin(a) * 17, 9, -5 + Math.cos(a) * 17); G.camera.lookAt(0, 0, -6);
    G.sun.position.set(12, 22, 9); G.sun.target.position.set(0, 0, -4);
  }
  G.updateParticles(dt); G.updatePopups(dt);
  G.render();
  perf(dt);
  requestAnimationFrame(frame);
}
toMenu();
$('loading').hidden = true;
requestAnimationFrame(frame);
G.debug = { startWorld, finishWorld, state: () => state, P, L: () => L,
  sim(sec, inp = {}) { const I = G.input; I.joy = inp.mx !== undefined || inp.my !== undefined ? {} : null; I.mx = inp.mx || 0; I.my = inp.my || 0;
    const n = Math.round(sec * 60);
    for (let i = 0; i < n; i++) { if (inp.jumpAt !== undefined && i === Math.round(inp.jumpAt * 60)) { I.jumpPressed = true; I.jumpHeld = true; }
      if (inp.jumpHold !== undefined && i === Math.round(inp.jumpHold * 60)) I.jumpHeld = false;
      if (inp.spinAt !== undefined && i === Math.round(inp.spinAt * 60)) I.spinPressed = true;
      if (inp.poundAt !== undefined && i === Math.round(inp.poundAt * 60)) I.poundPressed = true;
      if (state !== 'play') break; const dt = 1 / 60; t += dt; G.updatePlatforms(dt, t, P); stepHero(dt); G.updateLevel(dt, t, P); heroVisual(dt);
      G.updateCamera(dt, { pos: P.pos, yaw: P.yaw, moving: 0 }, null); G.clearPresses(); G.updateParticles(dt); }
    I.joy = null; I.mx = I.my = 0; I.jumpHeld = false;
    return { mode: P.mode, pos: P.pos.toArray().map(v => +v.toFixed(2)), hearts: P.hearts, items: P.items, friends: P.friends, ground: !!P.ground, state }; } };
})();
