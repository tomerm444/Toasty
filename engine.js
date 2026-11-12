/* טוסטי הגיבור — engine: rendering, particles, sound, input, physics, hero, camera */
'use strict';
(() => {
const G = window.G = {};
const V3 = THREE.Vector3;
G.TAU = Math.PI * 2;

/* ---------- small helpers ---------- */
G.C = h => new THREE.Color(h).convertSRGBToLinear();
const matCache = new Map();
G.mat = (hex, rough = .6, o = {}) => {
  const key = hex + '|' + rough + '|' + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const p = Object.assign({ color: G.C(hex), roughness: rough, envMapIntensity: .55 }, o);
  if (typeof p.emissive === 'string') p.emissive = G.C(p.emissive);
  const m = new THREE.MeshStandardMaterial(p);
  matCache.set(key, m); return m;
};
G.gloss = (hex, o = {}) => G.mat(hex, .22, Object.assign({ envMapIntensity: .85 }, o));
G.basic = (hex, mult = 1) => { const m = new THREE.MeshBasicMaterial({ color: G.C(hex).multiplyScalar(mult), toneMapped: mult <= 1 }); return m; };
G.RB = (w, h, d, r, seg = 3) => THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)) : new THREE.BoxGeometry(w, h, d);
G.mesh = (geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
};
const outlineMat = new THREE.MeshBasicMaterial({ color: G.C('#3a2416'), side: THREE.BackSide });
G.outline = (m, k = .05) => { const o = new THREE.Mesh(m.geometry, outlineMat); o.scale.setScalar(1 + k); o.castShadow = false; m.add(o); return m; };
G.rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
G.lerp = (a, b, k) => a + (b - a) * k;
G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
G.angLerp = (a, b, k) => { let d = (b - a) % G.TAU; if (d > Math.PI) d -= G.TAU; if (d < -Math.PI) d += G.TAU; return a + d * k; };

function softTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
G.SOFT = softTex();

/* ---------- renderer, scene, quality ---------- */
G.initRenderer = (host) => {
  const r = G.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .9;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(r.domElement);
  const scene = G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(55, 1, .1, 500);
  G.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, .42); scene.add(G.hemi);
  const sun = G.sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.castShadow = true; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
  scene.add(sun); scene.add(sun.target);
  G.skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(12, 22, 9).normalize() }, sunCol: { value: new THREE.Color(1, 1, 1) }, cloudCol: { value: new THREE.Color(1, 1, 1) },
      time: { value: 0 }, cloudOn: { value: 1 } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform vec3 cloudCol; uniform float time; uniform float cloudOn;
      varying vec3 vP;
      float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1.,0.,0.)),f.x),mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),
                   mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec3 d=normalize(vP); float h=d.y;
        vec3 c=h>0.? mix(mid,top,pow(h,.75)) : mix(mid,bot,min(1.,-h*2.5));
        float s=max(dot(d,sunDir),0.);
        c+=sunCol*(pow(s,600.)*4.+pow(s,24.)*.18);
        c+=sunCol*pow(1.-abs(h),10.)*.06;
        if(cloudOn>.5 && h>-.02){
          float n=fbm(d*vec3(3.,9.,3.)+vec3(time*.012,0.,time*.006));
          float band=smoothstep(-.02,.07,h)*(1.-smoothstep(.3,.7,h));
          float cl=smoothstep(.5,.68,n)*band;
          c=mix(c,mix(cloudCol*.84,cloudCol,smoothstep(.55,.8,n)),cl*.92);
        }
        gl_FragColor=linearToOutputTexel(vec4(c,1.)); }`
  });
  G.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), G.skyMat); G.sky.frustumCulled = false; scene.add(G.sky);
  scene.fog = new THREE.Fog(0xffffff, 60, 190);
  G.pmrem = new THREE.PMREMGenerator(r);
  G.resize();
  addEventListener('resize', G.resize);
};

G.setSky = (top, mid, bot, fog, sunColor, hemiSky, hemiGround, cloud = '#ffffff') => {
  G.skyMat.uniforms.cloudCol.value.copy(G.C(cloud)); G.skyMat.uniforms.sunCol.value.copy(G.C(sunColor));
  G.skyMat.uniforms.top.value.copy(G.C(top)); G.skyMat.uniforms.mid.value.copy(G.C(mid)); G.skyMat.uniforms.bot.value.copy(G.C(bot));
  G.scene.fog.color.copy(G.C(fog));
  G.sun.color.copy(G.C(sunColor)); G.hemi.color.copy(G.C(hemiSky)); G.hemi.groundColor.copy(G.C(hemiGround));
  // reflections: render a tiny sky scene with a few soft "studio lights"
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), G.skyMat));
  const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.2, 3) });
  [[20, 30, 10, 18], [-25, 20, -15, 10], [0, 40, -25, 12]].forEach(([x, y, z, s]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s), panel); p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p); });
  if (G.envRT) G.envRT.dispose();
  G.envRT = G.pmrem.fromScene(env, .03);
  G.scene.environment = G.envRT.texture;
};

const QUALITY = {
  high: { pr: 2, shadows: true, map: 2048, bloom: true },
  medium: { pr: 1.5, shadows: true, map: 1024, bloom: false },
  low: { pr: 1, shadows: false, map: 512, bloom: false }
};
G.quality = 'medium';
G.setQuality = (q) => {
  G.quality = q; const Q = QUALITY[q], r = G.renderer;
  G.skyMat.uniforms.cloudOn.value = q === 'low' ? 0 : 1;
  r.setPixelRatio(Math.min(Q.pr, devicePixelRatio || 1));
  r.shadowMap.enabled = Q.shadows; G.sun.castShadow = Q.shadows;
  if (G.sun.shadow.map) { G.sun.shadow.map.dispose(); G.sun.shadow.map = null; }
  G.sun.shadow.mapSize.set(Q.map, Q.map);
  G.scene.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.needsUpdate = true); } });
  G.composer = null; r.toneMapping = THREE.ACESFilmicToneMapping;
  if (Q.bloom && THREE.EffectComposer && THREE.UnrealBloomPass && THREE.ShaderPass) {
    try {
      const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat };
      let rt;
      if (r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) { rt = new THREE.WebGLMultisampleRenderTarget(4, 4, opts); rt.samples = 4; }
      else rt = new THREE.WebGLRenderTarget(4, 4, opts);
      const c = new THREE.EffectComposer(r, rt);
      c.addPass(new THREE.RenderPass(G.scene, G.camera));
      c.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), .2, .35, 2.2));
      c.addPass(new THREE.ShaderPass({
        uniforms: { tDiffuse: { value: null }, exposure: { value: .9 / .6 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
          vec3 fit(vec3 v){ vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081; return a/b; }
          void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb*exposure;
            mat3 mI=mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);
            mat3 mO=mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);
            c=clamp(mO*fit(mI*c),0.,1.);
            float lum=dot(c,vec3(.2126,.7152,.0722)); c=clamp(mix(vec3(lum),c,1.12),0.,1.);
            float d=distance(vUv,vec2(.5)); c*=1.-smoothstep(.55,1.,d)*.25;
            c=mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));
            gl_FragColor=vec4(c,1.); }`
      }));
      G.composer = c; r.toneMapping = THREE.NoToneMapping;
    } catch (e) { G.composer = null; r.toneMapping = THREE.ACESFilmicToneMapping; }
  }
  G.resize();
};
G.resize = () => {
  if (!G.renderer) return;
  const el = G.renderer.domElement.parentElement; if (!el) return;
  const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
  G.renderer.setSize(w, h, false); G.camera.aspect = w / h; G.camera.updateProjectionMatrix();
  if (G.composer) { G.composer.setPixelRatio(G.renderer.getPixelRatio()); G.composer.setSize(w, h); }
  if (G.particles) G.particles.forEach(p => p.material.uniforms.scale.value = h * G.renderer.getPixelRatio() * .5);
};
G.render = () => { G.sky.position.copy(G.camera.position); if (G.composer) G.composer.render(); else G.renderer.render(G.scene, G.camera); };

/* ---------- particles: two pooled point clouds (soft + glowing) ---------- */
function makeParticles(n, additive) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('pcolor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { map: { value: G.SOFT }, scale: { value: 300 } },
    vertexShader: 'attribute float size; attribute float alpha; attribute vec3 pcolor; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC=pcolor; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*scale/max(.1,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=linearToOutputTexel(vec4(vC,t.a*vA)); }'
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; G.scene.add(pts);
  pts.userData = { n, i: 0, life: new Float32Array(n), max: new Float32Array(n), vel: new Float32Array(n * 3), grav: new Float32Array(n), s0: new Float32Array(n), s1: new Float32Array(n), drag: new Float32Array(n), amax: new Float32Array(n) };
  return pts;
}
G.initParticles = () => { G.soft = makeParticles(500, false); G.glowP = makeParticles(400, true); G.particles = [G.soft, G.glowP]; G.resize(); };
const _c = new THREE.Color();
G.emit = (x, y, z, o = {}) => {
  const P = o.glow ? G.glowP : G.soft, D = P.userData, a = P.geometry.attributes;
  const n = o.n || 8; _c.copy(G.C(o.color || '#ffffff')).multiplyScalar(o.bright || 1);
  for (let k = 0; k < n; k++) {
    const i = D.i++ % D.n;
    const ang = Math.random() * G.TAU, sp = (o.speed ?? 3) * (.4 + Math.random() * .6), up = o.up ?? 2;
    const ring = o.ring ? 1 : Math.random();
    a.position.array[i * 3] = x + (o.spread || 0) * (Math.random() - .5); a.position.array[i * 3 + 1] = y + (o.spreadY || 0) * Math.random(); a.position.array[i * 3 + 2] = z + (o.spread || 0) * (Math.random() - .5);
    D.vel[i * 3] = Math.cos(ang) * sp * (o.ring ? 1 : ring + .3); D.vel[i * 3 + 1] = up * (.5 + Math.random() * .7) + (o.vy || 0); D.vel[i * 3 + 2] = Math.sin(ang) * sp * (o.ring ? 1 : ring + .3);
    D.life[i] = D.max[i] = (o.life || .7) * (.7 + Math.random() * .5); D.grav[i] = o.grav ?? 4; D.drag[i] = o.drag ?? 2;
    D.s0[i] = o.size || .5; D.s1[i] = o.size1 ?? (o.size || .5) * 1.8; D.amax[i] = o.alpha ?? 1;
    a.pcolor.array[i * 3] = _c.r; a.pcolor.array[i * 3 + 1] = _c.g; a.pcolor.array[i * 3 + 2] = _c.b;
  }
};
G.updateParticles = (dt) => {
  for (const P of G.particles) {
    const D = P.userData, a = P.geometry.attributes, pos = a.position.array;
    for (let i = 0; i < D.n; i++) {
      if (D.life[i] <= 0) { a.alpha.array[i] = 0; continue; }
      D.life[i] -= dt; const k = Math.max(0, D.life[i] / D.max[i]);
      const dr = Math.exp(-D.drag[i] * dt);
      D.vel[i * 3] *= dr; D.vel[i * 3 + 2] *= dr; D.vel[i * 3 + 1] = D.vel[i * 3 + 1] * dr - D.grav[i] * dt;
      pos[i * 3] += D.vel[i * 3] * dt; pos[i * 3 + 1] += D.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += D.vel[i * 3 + 2] * dt;
      a.alpha.array[i] = Math.min(1, k * 2.2, (1 - k) * 8 + .1) * D.amax[i]; a.size.array[i] = D.s1[i] + (D.s0[i] - D.s1[i]) * k;
    }
    a.position.needsUpdate = a.alpha.needsUpdate = a.size.needsUpdate = a.pcolor.needsUpdate = true;
  }
};

/* ---------- floating words ("בום!", "+1") ---------- */
G.popups = [];
G.popup = (text, pos, color = '#fff6e6', big = false) => {
  const el = document.createElement('div'); el.className = 'pop' + (big ? ' big' : ''); el.textContent = text; el.style.color = color;
  G.popLayer.appendChild(el); G.popups.push({ el, p: pos.clone(), t: 0 });
};
const _v = new V3();
G.updatePopups = (dt) => {
  const w = G.popLayer.clientWidth, h = G.popLayer.clientHeight;
  G.popups = G.popups.filter(o => {
    o.t += dt; o.p.y += dt * 1.2;
    _v.copy(o.p).project(G.camera);
    if (o.t > 1.1 || _v.z > 1) { o.el.remove(); return false; }
    o.el.style.transform = `translate(${(_v.x * .5 + .5) * w}px,${(-_v.y * .5 + .5) * h}px) translate(-50%,-50%) scale(${Math.min(1, o.t * 6)})`;
    o.el.style.opacity = String(Math.min(1, (1.1 - o.t) * 3));
    return true;
  });
};

/* ---------- sound: tiny synth + background tunes ---------- */
G.muted = false;
let AC = null, master = null, musicGain = null;
G.audioInit = () => {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = G.muted ? 0 : 1; master.connect(AC.destination);
    musicGain = AC.createGain(); musicGain.gain.value = .5; musicGain.connect(master); } catch (e) { AC = null; }
};
G.setMuted = m => { G.muted = m; if (master) master.gain.value = m ? 0 : 1; };
function tone(f1, f2, dur, type = 'square', vol = .07, delay = 0, dest = null) {
  if (!AC) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(dest || master); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .08, freq = 800) {
  if (!AC) return;
  const n = AC.sampleRate * dur, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f).connect(g).connect(master); s.start();
}
G.sfx = {
  jump: () => tone(380, 760, .14, 'square', .05),
  glide: () => tone(500, 420, .2, 'sine', .04),
  land: () => noise(.08, .05, 500),
  collect: () => { tone(988, 988, .05, 'triangle', .07); tone(1480, 1480, .1, 'triangle', .07, .05); },
  big: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, .1, 'triangle', .07, i * .06)),
  spin: () => tone(300, 900, .2, 'triangle', .06),
  pound: () => { noise(.35, .14, 300); tone(160, 40, .35, 'sawtooth', .08); },
  stomp: () => tone(280, 70, .18, 'square', .08),
  hurt: () => tone(340, 90, .3, 'sawtooth', .07),
  ding: () => { tone(1568, 1568, .5, 'sine', .09); tone(2093, 2093, .5, 'sine', .05, .02); },
  boing: () => tone(180, 900, .3, 'sine', .1),
  rescue: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .14, 'triangle', .08, i * .08)),
  check: () => [660, 880, 1320].forEach((f, i) => tone(f, f, .1, 'square', .05, i * .08)),
  bossHit: () => { tone(520, 120, .3, 'square', .1); noise(.2, .08, 1200); },
  bossIntro: () => [196, 185, 175, 147].forEach((f, i) => tone(f, f, .25, 'sawtooth', .06, i * .2)),
  whistle: () => tone(1800, 2400, .9, 'sine', .05),
  shoot: () => tone(700, 300, .12, 'square', .04),
  slam: () => { noise(.4, .16, 250); tone(120, 40, .4, 'sawtooth', .09); },
  win: () => [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, f, .16, 'triangle', .08, i * .11)),
  chili: () => [440, 660, 880, 1320].forEach((f, i) => tone(f, f * 1.05, .09, 'sawtooth', .05, i * .05))
};
let musicTimer = null, musicStep = 0, nextNoteT = 0, tune = null;
G.playMusic = (t) => {
  G.stopMusic(); if (!AC) return; tune = t; musicStep = 0; nextNoteT = AC.currentTime + .1;
  musicTimer = setInterval(() => {
    if (!AC || !tune) return;
    const spb = 60 / tune.bpm / 2;
    while (nextNoteT < AC.currentTime + .25) {
      const m = tune.mel[musicStep % tune.mel.length], b = tune.bass[Math.floor(musicStep / 2) % tune.bass.length];
      const delay = Math.max(0, nextNoteT - AC.currentTime);
      if (m) tone(m, m, spb * .9, tune.wave || 'triangle', .035, delay, musicGain);
      if (musicStep % 2 === 0 && b) tone(b, b, spb * 1.8, 'sine', .05, delay, musicGain);
      nextNoteT += spb; musicStep++;
    }
  }, 90);
};
G.stopMusic = () => { if (musicTimer) clearInterval(musicTimer); musicTimer = null; };

/* ---------- input: keyboard, mouse drag, touch joystick, buttons ---------- */
const I = G.input = { mx: 0, my: 0, jumpHeld: false, jumpPressed: false, spinPressed: false, poundPressed: false, camDX: 0, camDY: 0, lastCam: 0, touch: false };
const keys = {};
const KEYMAP = { jump: ['Space'], spin: ['KeyX', 'ShiftLeft', 'ShiftRight', 'KeyK'], pound: ['KeyC', 'ControlLeft', 'KeyL'] };
addEventListener('keydown', e => {
  if (!G.playing) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (keys[e.code]) return; keys[e.code] = true;
  if (KEYMAP.jump.includes(e.code)) { I.jumpPressed = true; I.jumpHeld = true; }
  if (KEYMAP.spin.includes(e.code)) I.spinPressed = true;
  if (KEYMAP.pound.includes(e.code)) I.poundPressed = true;
});
addEventListener('keyup', e => { keys[e.code] = false; if (KEYMAP.jump.includes(e.code)) I.jumpHeld = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; I.jumpHeld = false; });
G.readKeys = (dt) => {
  if (I.joy) return;
  let x = 0, y = 0;
  if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
  const l = Math.hypot(x, y) || 1; I.mx = x / l; I.my = y / l;
  if (keys.KeyQ) { I.camDX -= 2.2 * dt; I.lastCam = performance.now(); }
  if (keys.KeyE) { I.camDX += 2.2 * dt; I.lastCam = performance.now(); }
};
G.bindPointer = (stage, joyEl, knobEl) => {
  let camPtr = null, camLast = null;
  stage.addEventListener('pointerdown', e => {
    if (!G.playing || e.target.closest('button,.ui')) return;
    G.audioInit();
    const r = stage.getBoundingClientRect();
    if (e.pointerType !== 'mouse' && e.clientX - r.left < r.width * .45 && !I.joy) {
      I.joy = { id: e.pointerId, x: e.clientX, y: e.clientY };
      joyEl.style.left = (e.clientX - r.left) + 'px'; joyEl.style.top = (e.clientY - r.top) + 'px'; joyEl.hidden = false;
      knobEl.style.transform = 'translate(-50%,-50%)';
    } else if (camPtr === null) { camPtr = e.pointerId; camLast = { x: e.clientX, y: e.clientY }; }
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', e => {
    if (I.joy && e.pointerId === I.joy.id) {
      let dx = e.clientX - I.joy.x, dy = e.clientY - I.joy.y; const d = Math.hypot(dx, dy), R = 55;
      if (d > R) { dx *= R / d; dy *= R / d; }
      I.mx = dx / R; I.my = -dy / R;
      knobEl.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    } else if (e.pointerId === camPtr) {
      I.camDX -= (e.clientX - camLast.x) * .006; I.camDY += (e.clientY - camLast.y) * .004;
      camLast = { x: e.clientX, y: e.clientY }; I.lastCam = performance.now();
    }
  });
  const end = e => {
    if (I.joy && e.pointerId === I.joy.id) { I.joy = null; I.mx = I.my = 0; joyEl.hidden = true; }
    if (e.pointerId === camPtr) camPtr = null;
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
};
G.bindButtons = (root) => {
  root.querySelectorAll('[data-act]').forEach(b => {
    const act = b.dataset.act;
    const on = e => { e.preventDefault(); e.stopPropagation(); G.audioInit(); b.classList.add('on');
      if (act === 'jump') { I.jumpPressed = true; I.jumpHeld = true; } if (act === 'spin') I.spinPressed = true; if (act === 'pound') I.poundPressed = true; };
    const off = e => { b.classList.remove('on'); if (act === 'jump') I.jumpHeld = false; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
};
G.clearPresses = () => { I.jumpPressed = I.spinPressed = I.poundPressed = false; I.camDX = I.camDY = 0; };

/* ---------- physics: colliders the hero can stand on and bump into ---------- */
G.colliders = [];
G.addBox = (cx, cz, hx, hz, y0, y1, extra = {}) => { const c = Object.assign({ kind: 'box', cx, cz, hx, hz, y0, y1, dx: 0, dy: 0, dz: 0, on: true }, extra); G.colliders.push(c); return c; };
G.addCyl = (cx, cz, r, y0, y1, extra = {}) => { const c = Object.assign({ kind: 'cyl', cx, cz, r, y0, y1, dx: 0, dy: 0, dz: 0, on: true }, extra); G.colliders.push(c); return c; };
function footOver(c, x, z, m) {
  if (c.kind === 'box') return Math.abs(x - c.cx) <= c.hx + m && Math.abs(z - c.cz) <= c.hz + m;
  const dx = x - c.cx, dz = z - c.cz; return dx * dx + dz * dz <= (c.r + m) * (c.r + m);
}
G.groundAt = (x, z, yMax) => { let best = -Infinity, bc = null; for (const c of G.colliders) { if (!c.on || !footOver(c, x, z, .1)) continue; if (c.y1 <= yMax + .01 && c.y1 > best) { best = c.y1; bc = c; } } return { y: best, c: bc }; };
G.collide = (p, dt) => {
  const r = p.r;
  // vertical
  p.prevY = p.pos.y;
  p.pos.y += p.vel.y * dt;
  p.ground = null;
  for (const c of G.colliders) {
    if (!c.on || !footOver(c, p.pos.x, p.pos.z, r * .55)) continue;
    if (p.vel.y <= 0 && p.prevY >= c.y1 - .02 && p.pos.y <= c.y1) { p.pos.y = c.y1; p.vel.y = 0; p.ground = c; }
    else if (p.vel.y > 0 && p.prevY + p.h <= c.y0 + .02 && p.pos.y + p.h > c.y0 && c.solidTop !== false) { p.pos.y = c.y0 - p.h; p.vel.y = 0; }
  }
  // horizontal
  p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt;
  for (const c of G.colliders) {
    if (!c.on || c.thin) continue;
    if (p.pos.y >= c.y1 - .05 || p.pos.y + p.h <= c.y0 + .05) continue;
    if (c.kind === 'box') {
      const qx = G.clamp(p.pos.x, c.cx - c.hx, c.cx + c.hx), qz = G.clamp(p.pos.z, c.cz - c.hz, c.cz + c.hz);
      let dx = p.pos.x - qx, dz = p.pos.z - qz; const d = Math.hypot(dx, dz);
      if (d > 0 && d < r) { p.pos.x += dx / d * (r - d); p.pos.z += dz / d * (r - d); }
      else if (d === 0) {
        const px = c.hx + r - Math.abs(p.pos.x - c.cx), pz = c.hz + r - Math.abs(p.pos.z - c.cz);
        if (px < pz) p.pos.x += Math.sign(p.pos.x - c.cx || 1) * px; else p.pos.z += Math.sign(p.pos.z - c.cz || 1) * pz;
      }
    } else {
      const dx = p.pos.x - c.cx, dz = p.pos.z - c.cz, d = Math.hypot(dx, dz), m = c.r + r;
      if (d < m && d > 1e-4) { p.pos.x = c.cx + dx / d * m; p.pos.z = c.cz + dz / d * m; }
    }
  }
};

/* ---------- the hero: Toasty ---------- */
function crumbTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 120, 10, 128, 128, 150); r.addColorStop(0, '#fff0c4'); r.addColorStop(.55, '#f6d88f'); r.addColorStop(.85, '#e7ae5a'); r.addColorStop(1, '#c9823a');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const rnd = G.rng(7);
  for (let i = 0; i < 220; i++) { const x = rnd() * 256, y = rnd() * 256, w = 1 + rnd() * 3.5;
    g.fillStyle = `rgba(${170 + rnd() * 40 | 0},${110 + rnd() * 30 | 0},${50 + rnd() * 20 | 0},${.25 + rnd() * .35})`; g.beginPath(); g.ellipse(x, y, w, w * .7, rnd() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
G.makeHero = () => {
  const M = G.mesh, PH = (hex, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: G.C(hex), roughness: .3, clearcoat: 1, clearcoatRoughness: .15, envMapIntensity: 1 }, o));
  const shape = new THREE.Shape();
  shape.moveTo(-.55, 0); shape.lineTo(.55, 0); shape.quadraticCurveTo(.7, 0, .7, .15); shape.lineTo(.7, 1.0);
  shape.bezierCurveTo(.92, 1.05, .95, 1.55, .55, 1.68); shape.bezierCurveTo(.3, 1.78, -.3, 1.78, -.55, 1.68);
  shape.bezierCurveTo(-.95, 1.55, -.92, 1.05, -.7, 1.0); shape.lineTo(-.7, .15); shape.quadraticCurveTo(-.7, 0, -.55, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .28, bevelEnabled: true, bevelThickness: .08, bevelSize: .07, bevelSegments: 4, curveSegments: 22 });
  geo.translate(0, -.88, -.14);
  const crumb = crumbTexture(); crumb.repeat.set(1 / 1.9, 1 / 1.86); crumb.offset.set(.5, 0);
  const crumbMat = new THREE.MeshStandardMaterial({ map: crumb, roughness: .85, envMapIntensity: .6 });
  const crustMat = PH('#b8681f', { roughness: .55, clearcoat: .4, clearcoatRoughness: .4, envMapIntensity: .8 });
  const hero = new THREE.Group(), rig = new THREE.Group(); hero.add(rig);
  const body = new THREE.Group(); body.position.y = 1.28; rig.add(body);
  G.outline(M(geo, [crumbMat, crustMat], 0, 0, 0, body), .035);
  const butter = G.outline(M(G.RB(.56, .17, .42, .07, 3), PH('#ffe26a', { roughness: .25 }), .08, .92, 0, body), .06); butter.rotation.z = -.12;
  M(new THREE.SphereGeometry(.06, 10, 8), PH('#ffe26a'), .32, .82, .2, body);
  const fz = .23, white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .2, envMapIntensity: .6 }), pupil = PH('#20140e', { roughness: .1 });
  const eyes = [-.24, .24].map(x => { const g = new THREE.Group(); g.position.set(x, .32, fz); body.add(g);
    const w = G.outline(M(new THREE.SphereGeometry(.17, 24, 16), white, 0, 0, 0, g), .12); w.scale.set(1, 1.12, .45);
    const p = M(new THREE.SphereGeometry(.085, 16, 12), pupil, 0, -.01, .07, g); p.scale.set(1, 1.1, .5);
    M(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), -.03, .04, .11, g, false);
    return { g, p }; });
  const ink = G.mat('#3a2416', .5);
  const brows = [-1, 1].map(s => { const b = M(G.RB(.2, .045, .04, .02, 2), ink, s * .25, .56, fz + .02, body, false); b.rotation.z = s * -.15; return b; });
  const smile = M(new THREE.TorusGeometry(.15, .035, 8, 20, Math.PI), ink, 0, -.02, fz + .02, body, false); smile.rotation.z = Math.PI;
  const mouthO = M(new THREE.SphereGeometry(.1, 16, 10), G.mat('#5a1e1e', .5), 0, -.06, fz, body, false); mouthO.scale.set(1, 1.2, .3); mouthO.visible = false;
  [-1, 1].forEach(s => M(new THREE.CircleGeometry(.08, 16), new THREE.MeshBasicMaterial({ color: G.C('#ff8f8f'), transparent: true, opacity: .6 }), s * .42, .06, fz + .005, body, false));
  const capeGeo = new THREE.PlaneGeometry(1.25, 1.55, 8, 12); capeGeo.translate(0, -.775, 0);
  const capeBase = Float32Array.from(capeGeo.attributes.position.array);
  const capeMat = PH('#e8323c', { roughness: .45, clearcoat: .2, side: THREE.DoubleSide, envMapIntensity: .8 });
  M(capeGeo, capeMat, 0, .62, -.26, body);
  M(new THREE.CylinderGeometry(.07, .07, .9, 10), PH('#ffd23f', { metalness: .6, roughness: .25 }), 0, .63, -.22, body).rotation.z = Math.PI / 2;
  const limb = PH('#3a2416', { roughness: .4 }), glove = PH('#ffffff', { roughness: .3 });
  const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .74, .02, 0); body.add(a);
    M(new THREE.CylinderGeometry(.045, .045, .48, 8), limb, 0, -.24, 0, a);
    G.outline(M(new THREE.SphereGeometry(.12, 16, 12), glove, 0, -.5, 0, a), .12); return a; });
  const shoe = PH('#ff4f5a', { roughness: .35 }), sole = PH('#ffffff', { roughness: .5 });
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .24, .42, 0); rig.add(l);
    M(new THREE.CylinderGeometry(.05, .05, .36, 8), limb, 0, -.18, 0, l);
    const sh = G.outline(M(new THREE.SphereGeometry(.15, 16, 12), shoe, 0, -.36, .07, l), .1); sh.scale.set(1, .62, 1.5);
    const so = M(new THREE.CylinderGeometry(.15, .16, .05, 16), sole, 0, -.43, .07, l); so.scale.set(1, 1, 1.5);
    return l; });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.85, 24), new THREE.MeshBasicMaterial({ map: G.SOFT, color: 0x000000, transparent: true, opacity: .4, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.renderOrder = 2;
  const flame = G.mesh(new THREE.SphereGeometry(1.2, 20, 14), new THREE.MeshBasicMaterial({ color: G.C('#ff7a2b').multiplyScalar(1.5), transparent: true, opacity: .0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 0, 1.1, 0, hero, false);
  hero.userData = { rig, body, eyes, brows, smile, mouthO, capeGeo, capeBase, arms, legs, blob, flame, glide: 0, speed: 0 };
  hero.traverse(o => { if (o.isMesh && o !== flame) o.castShadow = true; });
  return hero;
};
G.animateHero = (hero, s, t, dt) => {
  const u = hero.userData;
  u.glide += ((s.glide ? 1 : 0) - u.glide) * Math.min(1, dt * 8);
  u.speed += (s.speed - u.speed) * Math.min(1, dt * 8);
  const sq = s.squash * .3 * Math.cos((1 - s.squash) * Math.PI * 1.5);
  const st = s.stretch || 0;
  u.rig.scale.set(1 + sq * .6 - st * .4, 1 - sq + st, 1 + sq * .6 - st * .4);
  u.rig.rotation.x = s.flip * G.TAU + s.lean;
  u.rig.rotation.y = s.spin * G.TAU * 2;
  const flipping = s.flip > 0;
  u.rig.position.y = flipping ? 1.0 : 0; u.body.position.y = flipping ? .28 : 1.28; u.legs.forEach(l => l.position.y = flipping ? -.58 : .42);
  const run = u.speed, air = s.air;
  u.arms.forEach((a, i) => { const sg = i ? 1 : -1;
    a.rotation.z = sg * (.25 + s.armUp * .9 + u.glide * .9);
    a.rotation.x = run * (air ? .3 : 1) * Math.sin(t * 14 + i * Math.PI) * .9; });
  u.legs.forEach((l, i) => { l.rotation.x = air ? (i ? .5 : -.3) : run * Math.sin(t * 14 + i * Math.PI) * .8; l.visible = !s.hideLegs; });
  u.mouthO.visible = !!s.surprised; u.smile.visible = !s.surprised;
  u.brows.forEach(b => b.position.y = .56 + (s.surprised ? .08 : 0) + (s.angry ? -.04 : 0));
  u.brows.forEach((b, i) => b.rotation.z = (i ? 1 : -1) * (s.angry ? .35 : -.15));
  const blink = (t % 3.4) < .12; u.eyes.forEach(e => { e.g.scale.y = blink ? .12 : 1; });
  const pos = u.capeGeo.attributes.position, flow = .2 + run * .55 + u.glide * 1.1, base = u.capeBase;
  for (let i = 0; i < pos.count; i++) {
    const x0 = base[i * 3], y0 = base[i * 3 + 1], d = -y0 / 1.55;
    const wave = Math.sin(t * 9 - d * 5 + x0 * 2.2) * .07 * d * (1 + run * 1.5 + u.glide * 2);
    pos.array[i * 3] = x0 * (1 + d * (.25 + u.glide * .9));
    pos.array[i * 3 + 1] = y0 * (1 - u.glide * .55) + Math.sin(t * 6 + x0 * 3) * .03 * u.glide;
    pos.array[i * 3 + 2] = -d * d * flow - wave - u.glide * d * .25;
  }
  pos.needsUpdate = true; u.capeGeo.computeVertexNormals();
  u.flame.material.opacity = s.chili ? .18 + Math.sin(t * 20) * .06 : 0;
};

/* ---------- camera ---------- */
G.cam = { yaw: 0, pitch: .4, dist: 13, target: new V3(), focus: new V3() };
G.updateCamera = (dt, follow, extraFocus) => {
  const c = G.cam, I_ = G.input;
  c.yaw += I_.camDX; c.pitch = G.clamp(c.pitch + I_.camDY, .1, 1.15); I_.camDX = I_.camDY = 0;
  // lazy follow: swing gently behind the hero while running, unless the player is steering the camera
  if (follow && follow.moving && performance.now() - I_.lastCam > 1400) c.yaw = G.angLerp(c.yaw, follow.yaw + Math.PI, Math.min(1, dt * .9 * follow.moving));
  c.focus.copy(follow.pos).y += 1.5;
  if (extraFocus) c.focus.lerp(extraFocus, .35);
  c.target.lerp(c.focus, Math.min(1, dt * 6));
  const d = c.dist + (extraFocus ? 4 : 0);
  G.camera.position.set(c.target.x + Math.sin(c.yaw) * Math.cos(c.pitch) * d, c.target.y + Math.sin(c.pitch) * d, c.target.z + Math.cos(c.yaw) * Math.cos(c.pitch) * d);
  G.camera.lookAt(c.target);
  if (c.shake > 0) { G.camera.position.x += (Math.random() - .5) * c.shake; G.camera.position.y += (Math.random() - .5) * c.shake; c.shake = Math.max(0, c.shake - dt * 2.5); }
  // shadows follow the hero
  G.sun.position.set(follow.pos.x + 12, follow.pos.y + 22, follow.pos.z + 9); G.sun.target.position.copy(follow.pos);
};
})();
