/* Patili Rota — arayüz, çizim, efektler ve kontroller */
(function () {
  'use strict';
  const CFG = window.PATI_CONFIG;
  const Core = window.PatiCore;
  const SP = window.PatiSprites;
  const AU = window.PatiAudio;
  const NET = window.PatiNet;
  const T = 16;
  const CATS = ['eda', 'sarman'];
  const NAMES = [CFG.her, CFG.him];
  const CAT_COLORS = ['#ff9ec0', '#ffb36b'];
  const INK = '#2a1b2d';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const track = (o) => { try { if (window.LoveTrack) window.LoveTrack.track(o).catch(() => {}); } catch (e) { /* takip opsiyonel */ } };
  const params = new URLSearchParams(location.search);

  SP.build();
  const SPR = SP.cache;

  // ---------- görseller ----------
  function crop(src, x, y, w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
    return c;
  }
  const IMG = {};
  ['heart', 'heartEmpty', 'shield', 'paw', 'page'].forEach((k) => { IMG[k] = SP.dataURL(k, 2); });
  IMG.face_eda = SP.dataURL(crop(SPR.cat_eda.r[0], 0, 0, 16, 12), 3);
  IMG.face_sarman = SP.dataURL(crop(SPR.cat_sarman.r[0], 0, 0, 16, 12), 3);
  IMG.face_king = SP.dataURL(crop(SPR.king.r[0], 0, 0, 32, 24), 2);
  IMG.face_kingBald = SP.dataURL(crop(SPR.kingBald.r[0], 0, 0, 32, 24), 2);
  const FACE = { eda: crop(SPR.cat_eda.r[0], 0, 0, 16, 12), sarman: crop(SPR.cat_sarman.r[0], 0, 0, 16, 12) };
  IMG.cat_eda = SP.dataURL(SPR.cat_eda.r[0], 4);
  IMG.cat_sarman = SP.dataURL(SPR.cat_sarman.r[0], 4);
  const STOP_ICON = { kahvalti: SPR.decor.kahvalti[0], kahve: SPR.kahve, yuruyus: SPR.decor.yuruyus[0], aksam: SPR.decor.aksam[0] };
  IMG.stop = {};
  for (const k in STOP_ICON) IMG.stop[k] = SP.dataURL(STOP_ICON[k], 4);

  // Konuşan karakterler: diyalog kutusunda isim + yüz
  const SPEAKERS = {
    her: { name: CFG.her, face: IMG.face_eda },
    him: { name: CFG.him, face: IMG.face_sarman },
    king: { name: 'KRAL MAYMUN', face: IMG.face_king },
    kingBald: { name: 'KEL KRAL MAYMUN', face: IMG.face_kingBald },
    info: { name: 'İPUCU', emoji: '💡' },
  };
  (CFG.npcs || []).forEach((n, i) => {
    SPEAKERS['npc' + i] = { name: n.name, face: SP.dataURL(crop(SPR.npc[i].r[0], 0, 0, 16, 12), 3) };
  });

  const PERK_ICON = { tirnak: '🐾', kalp: '❤️', hiz: '💨', miyav: '📣', mirmir: '💞', sans: '🍀', yastik: '🛡️', ikili: '🤝' };
  const ITEM_TEXT = { simit: '+2 can', kahve: 'Kahve! Hız', yumak: 'Pençe x2!', tantuni: 'TANTUNİ!', balik: '+2 maks. can', kediotu: 'Kedi otu!', mektup: 'Aşk mektubu 💌' };
  const HAIR_JOKES = ['Kıl uçtu!', 'Kıl payı!', 'Tüy dökümü!', 'Kıl yumağı!', 'Şampuan lazım!'];
  const JOKE_TEXT = [['Vak vak! 🦆', 'honk'], ['PRRRT! 💨', 'fart'], ['Kayma! 🍌', 'laugh']];

  const THEMES = {
    kahvalti: { void: '#1d1428', fa: '#f6e2b8', fb: '#efd5a0', fl: '#dcb97f', top: '#5a3a2c', cap: '#7e5240', face: '#fbf1df', face2: '#dcc8a8', faceCap: '#c98d5a', pattern: 'check' },
    kahve:    { void: '#140d0a', fa: '#b48058', fb: '#a6744f', fl: '#7f5536', top: '#291c17', cap: '#45302a', face: '#a1533f', face2: '#7f3d2e', faceCap: '#4a2f25', pattern: 'plank' },
    yuruyus:  { void: '#0f1a12', fa: '#7cc46b', fb: '#72b862', fl: '#5ea150', top: '#24452a', cap: '#2f5d33', face: '#3f7a3a', face2: '#2f6230', faceCap: '#5a9a4b', pattern: 'grass', hedge: true },
    aksam:    { void: '#0b0816', fa: '#5c2a4d', fb: '#4f2343', fl: '#e8a33d', top: '#150f26', cap: '#2b1f47', face: '#3e2d62', face2: '#2c2049', faceCap: '#1f1735', pattern: 'carpet', dark: true },
  };
  const ZONES = {
    m: { fa: '#fbd0dc', fb: '#f7bccd', dot: '#ff7aa2', pattern: 'hearts', decor: 'memory' },
    f: { fa: '#ffe58a', fb: '#d7c6ff', dot: '#ff7aa2', pattern: 'circus', decor: 'funny' },
  };
  const isWall = Core.isWall;

  // Gizli oda fotoğrafları (çerçevelerde küçük hâlleri görünür)
  const PHOTOS = { memory: CFG.memoryPhotos || [], funny: CFG.funnyPhotos || [] };
  const photoImgs = { memory: [], funny: [] };
  for (const kind of ['memory', 'funny']) {
    PHOTOS[kind].forEach((p, i) => {
      const im = new Image();
      im.onload = () => { if (S.map && S.map.secret === kind) S.mapCanvas = prerenderMap(S.map); };
      im.src = p.src;
      photoImgs[kind][i] = im;
    });
  }

  // ---------- durum ----------
  const S = {
    screen: 'title', net: null, slot: 0, online: false,
    map: null, mapCanvas: null, theme: THEMES.kahvalti, snap: null, pdKey: '',
    seen: null, vis: null, visKey: '',
    rp: new Map(), frame: 0, time: 0,
    cam: { x: 0, y: 0, ok: false },
    parts: [], floaters: [], rings: [], fw: [],
    shake: 0, flash: 0, meowMax: 120,
    lastFloor: -1, lastMv: -1, dialog: null, pendingBanner: null, overlayKind: null,
    cat: 'eda', inviteCode: null, lobbyConn: [false, false], lobbyCode: null,
    finalStarted: false, introShown: false, dcShown: false, downHint: false,
    fireworks: 0, catsHappy: false, finalStats: null, chipKey: '',
    talked: new Set(), zone: null, zonesSeen: new Set(), kissHint: false, lastKissMsg: 0,
  };
  if (params.has('debug')) window.__pati = { S, Core };

  // ---------- ekranlar ----------
  function show(name) {
    S.screen = name;
    const ids = { title: 'scrTitle', lobby: 'scrLobby', game: 'scrGame', final: 'scrFinal' };
    for (const k in ids) $(ids[k]).classList.toggle('hidden', k !== name);
    $('bg').classList.toggle('hidden', name === 'game');
    if (name === 'game') requestAnimationFrame(resize);
  }

  function toast(msg, ms) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  function banner(a, b) {
    if (S.dialog) { S.pendingBanner = [a, b]; return; }
    const el = $('banner');
    el.innerHTML = `<div class="b1">${esc(a)}</div>${b ? `<div class="b2">${esc(b)}</div>` : ''}`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  function flushBanner() {
    if (!S.pendingBanner) return;
    const [a, b] = S.pendingBanner;
    S.pendingBanner = null;
    banner(a, b);
  }

  // ---------- arka plan sahnesi (başlık, lobi, final) ----------
  const bg = $('bg');
  const bgc = bg.getContext('2d');
  const BG = { w: 0, h: 0, stars: [], leaves: [], buildings: [] };
  function rng(seed) {
    let a = seed;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function resizeBg() {
    const s = Math.max(2, Math.round(innerHeight / 220));
    BG.w = Math.ceil(innerWidth / s);
    BG.h = Math.ceil(innerHeight / s);
    bg.width = BG.w; bg.height = BG.h;
    const r = rng(11);
    BG.stars = Array.from({ length: 70 }, () => ({ x: Math.floor(r() * BG.w), y: Math.floor(r() * BG.h * 0.62), p: r() * 6 }));
    BG.leaves = Array.from({ length: 26 }, () => ({ x: r() * BG.w, y: r() * BG.h, v: 6 + r() * 10, ph: r() * 6, c: ['#f39a4a', '#ffd166', '#e2557a', '#cf6a2a'][Math.floor(r() * 4)] }));
    BG.buildings = [];
    for (let x = -4; x < BG.w + 4;) {
      const w = 6 + Math.floor(r() * 12), h = 8 + Math.floor(r() * 22);
      BG.buildings.push({ x, w, h, seed: r() });
      x += w + Math.floor(r() * 3);
    }
  }

  const HEART = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'];
  function miniHeart(g, x, y, color, s) {
    s = s || 1;
    g.fillStyle = color;
    HEART.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === 'x') g.fillRect(x + i * s, y + j * s, s, s); });
  }

  function atakule(g, cx, ground, col, lit) {
    const top = ground - 66;
    g.fillStyle = col;
    g.fillRect(cx - 2, top + 12, 5, ground - top - 12);
    g.fillRect(cx - 4, ground - 8, 9, 8);
    g.fillRect(cx - 7, top + 4, 15, 7);
    g.fillRect(cx - 5, top + 1, 11, 13);
    g.fillRect(cx - 6, top + 11, 13, 2);
    g.fillRect(cx, top - 9, 1, 10);
    if (lit) {
      g.fillStyle = '#ffd166';
      for (let i = 0; i < 6; i++) g.fillRect(cx - 5 + i * 2, top + 7, 1, 1);
      g.fillStyle = '#ff5a6e';
      g.fillRect(cx, top - 10, 1, 1);
    }
  }
  function mosque(g, cx, ground, col) {
    g.fillStyle = col;
    for (let i = 0; i <= 10; i++) {
      const w = Math.round(Math.sqrt(Math.max(0, 100 - (10 - i) * (10 - i))));
      g.fillRect(cx - w, ground - 27 + i, w * 2, 1);
    }
    g.fillRect(cx - 14, ground - 17, 28, 17);
    for (const sx of [-13, 13]) for (let i = 0; i <= 5; i++) {
      const w = Math.round(Math.sqrt(Math.max(0, 25 - (5 - i) * (5 - i))));
      g.fillRect(cx + sx - w, ground - 22 + i, w * 2, 1);
    }
    g.fillRect(cx, ground - 31, 1, 4);
    for (const mx of [cx - 23, cx - 18, cx + 17, cx + 22]) {
      g.fillRect(mx, ground - 44, 2, 44);
      g.fillRect(mx - 1, ground - 34, 4, 1);
      g.fillRect(mx - 1, ground - 24, 4, 1);
      g.fillRect(mx, ground - 47, 1, 3);
      g.fillRect(mx + 1, ground - 46, 1, 2);
    }
  }
  function castle(g, cx, ground, col) {
    g.fillStyle = col;
    for (let dx = -44; dx <= 44; dx++) {
      const h = Math.max(0, Math.round(16 - (dx * dx) / 120));
      g.fillRect(cx + dx, ground - h, 1, h);
    }
    g.fillRect(cx - 18, ground - 30, 36, 16);
    for (let k = 0; k < 9; k++) g.fillRect(cx - 18 + k * 4, ground - 33, 2, 3);
    g.fillRect(cx - 5, ground - 42, 10, 12);
    for (let k = 0; k < 3; k++) g.fillRect(cx - 5 + k * 4, ground - 45, 2, 3);
    g.fillRect(cx, ground - 56, 1, 11);
    g.fillStyle = '#e03a3a';
    g.fillRect(cx + 1, ground - 56, 7, 5);
    g.fillStyle = '#fff';
    g.fillRect(cx + 3, ground - 55, 1, 3);
    g.fillRect(cx + 5, ground - 54, 1, 1);
  }

  function drawBg(dt) {
    const g = bgc, W = BG.w, H = BG.h, t = S.time, night = S.screen === 'final';
    const bands = night
      ? ['#0b0820', '#100b29', '#160f35', '#1d1342', '#26174f', '#2f1b58']
      : ['#2b1846', '#3f1d58', '#5e2567', '#8a3270', '#bb4a70', '#e8705f', '#ffa76b'];
    const groundY = H - Math.max(16, Math.floor(H * 0.15));
    const bh = Math.ceil(groundY / bands.length);
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, W, bh + 1); });
    for (let i = 1; i < bands.length; i++) {
      g.fillStyle = bands[i - 1];
      for (let x = i % 2; x < W; x += 2) g.fillRect(x, i * bh, 1, 1);
    }
    if (night) {
      for (const s of BG.stars) {
        const tw = Math.sin(t * 2 + s.p) > 0.4;
        g.fillStyle = tw ? '#fff4e3' : '#8f86c9';
        g.fillRect(s.x, s.y, 1, 1);
      }
      const mx = Math.floor(W * 0.8), my = Math.floor(H * 0.14);
      g.fillStyle = '#fff4d6';
      for (let i = -7; i <= 7; i++) { const w = Math.round(Math.sqrt(49 - i * i)); g.fillRect(mx - w, my + i, w * 2, 1); }
      g.fillStyle = bands[1];
      for (let i = -7; i <= 7; i++) { const w = Math.round(Math.sqrt(49 - i * i)); g.fillRect(mx - w + 4, my + i - 2, w * 2, 1); }
    } else {
      const sx = Math.floor(W * 0.5), sy = groundY - 6, R = Math.min(30, Math.floor(W * 0.18));
      for (let i = -R; i <= 0; i++) {
        if ((i + R) % 6 > 3 && i > -R * 0.6) continue;
        const w = Math.round(Math.sqrt(R * R - i * i));
        g.fillStyle = i < -R * 0.5 ? '#ffe08a' : '#ffc46b';
        g.fillRect(sx - w, sy + i, w * 2, 1);
      }
    }
    const far = night ? '#1b1440' : '#5a2a5e';
    const near = night ? '#120d2b' : '#3a1d45';
    for (const b of BG.buildings) {
      g.fillStyle = far;
      g.fillRect(b.x, groundY - b.h, b.w, b.h);
      if (night) {
        g.fillStyle = '#ffd166';
        for (let wy = groundY - b.h + 3; wy < groundY - 2; wy += 4) for (let wx = b.x + 2; wx < b.x + b.w - 1; wx += 3) {
          if (((wx * 7 + wy * 13 + Math.floor(b.seed * 100)) % 5) === 0) g.fillRect(wx, wy, 1, 2);
        }
      }
    }
    castle(g, Math.floor(W * 0.12), groundY, near);
    mosque(g, Math.floor(W * 0.38), groundY, near);
    atakule(g, Math.floor(W * 0.76), groundY, near, night);
    g.fillStyle = night ? '#1a1030' : '#2e1834';
    g.fillRect(0, groundY, W, H - groundY);
    g.fillStyle = night ? '#24163f' : '#45264a';
    for (let x = 0; x < W; x += 10) g.fillRect(x, groundY + 4, 5, 1);

    if (!night) {
      for (const l of BG.leaves) {
        l.y += l.v * dt;
        l.x += Math.sin(t * 1.5 + l.ph) * 6 * dt - 3 * dt;
        if (l.y > H) { l.y = -2; l.x = Math.random() * W; }
        if (l.x < -2) l.x = W;
        g.fillStyle = l.c;
        g.fillRect(Math.round(l.x), Math.round(l.y), 2, 1);
      }
    }

    // kediler
    if (night) {
      const cx = Math.floor(W / 2), y = groundY - 15;
      const hop = (o) => (S.catsHappy ? Math.round(Math.abs(Math.sin(t * 7 + o)) * 6) : 0);
      g.drawImage(SPR.cat_eda.r[Math.floor(t * 1.5) % 2], cx - 17, y - hop(0));
      g.drawImage(SPR.cat_sarman.l[Math.floor(t * 1.5 + 1) % 2], cx + 1, y - hop(1.2));
      miniHeart(g, cx - 5, Math.round(y - 14 + Math.sin(t * 3) * 2), '#ff7aa2', 2);
    } else {
      const span = W + 70;
      const x = ((t * 16) % span) - 40;
      const fr = Math.floor(t * 6) % 2;
      g.drawImage(SPR.cat_eda.r[fr], Math.round(x), groundY - 15);
      g.drawImage(SPR.cat_sarman.r[1 - fr], Math.round(x - 18), groundY - 15);
      if (Math.floor(t) % 4 === 0) miniHeart(g, Math.round(x - 4), groundY - 23 - Math.round((t * 6) % 5), '#ff7aa2', 1);
    }

    // havai fişek kalpler
    if (S.fireworks > 0) {
      S.fireworks -= dt;
      if (Math.random() < dt * 2.6) {
        const fx = W * (0.15 + Math.random() * 0.7), fy = H * (0.12 + Math.random() * 0.3);
        const col = ['#ff7aa2', '#ffd166', '#7ee0b5', '#c9b6f2', '#fff4e3'][Math.floor(Math.random() * 5)];
        for (let k = 0; k < 28; k++) {
          const a = (k / 28) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(a), 3);
          const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
          S.fw.push({ x: fx, y: fy, vx: hx * 1.6, vy: hy * 1.6, life: 1.4, col });
        }
        AU.sfx('pick');
      }
    }
    for (let i = S.fw.length - 1; i >= 0; i--) {
      const p = S.fw[i];
      p.life -= dt;
      if (p.life <= 0) { S.fw.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 14 * dt; p.vx *= 0.985; p.vy *= 0.985;
      g.fillStyle = p.col;
      g.globalAlpha = Math.min(1, p.life);
      g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      g.globalAlpha = 1;
    }
  }

  // ---------- harita çizimi ----------
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function drawFloor(g, th, px, py, x, y, wallAbove) {
    g.fillStyle = th.fa;
    g.fillRect(px, py, T, T);
    switch (th.pattern) {
      case 'check':
        g.fillStyle = th.fb;
        if ((x + y) % 2 === 0) { g.fillRect(px, py, 8, 8); g.fillRect(px + 8, py + 8, 8, 8); }
        else { g.fillRect(px + 8, py, 8, 8); g.fillRect(px, py + 8, 8, 8); }
        g.fillStyle = th.fl;
        g.fillRect(px, py + 15, 16, 1);
        g.fillRect(px + 15, py, 1, 16);
        break;
      case 'grass':
        for (let i = 0; i < 8; i++) {
          g.fillStyle = i % 2 ? th.fb : th.fl;
          const gx = px + Math.floor(hash(x, y, i) * 15), gy = py + Math.floor(hash(x, y, i + 9) * 14);
          g.fillRect(gx, gy, 1, 2);
        }
        if (hash(x, y, 31) < 0.18) {
          g.fillStyle = hash(x, y, 32) < 0.5 ? '#ffd166' : '#ff9ec0';
          const fx = px + 3 + Math.floor(hash(x, y, 33) * 9), fy = py + 3 + Math.floor(hash(x, y, 34) * 9);
          g.fillRect(fx, fy, 2, 2);
        }
        if (hash(x, y, 35) < 0.12) {
          g.fillStyle = hash(x, y, 36) < 0.5 ? '#e8a33d' : '#cf6a2a';
          g.fillRect(px + 2 + Math.floor(hash(x, y, 37) * 11), py + 2 + Math.floor(hash(x, y, 38) * 11), 2, 1);
        }
        break;
      case 'hearts':
        g.fillStyle = th.fb;
        if ((x + y) % 2 === 0) g.fillRect(px, py, T, T);
        if ((x + y) % 2 === 0) miniHeart(g, px + 5, py + 5, th.dot, 1);
        break;
      case 'circus':
        g.fillStyle = th.fb;
        if ((x + y) % 2 === 0) g.fillRect(px, py, T, T);
        for (let i = 0; i < 3; i++) {
          g.fillStyle = ['#ff7aa2', '#7ee0b5', '#62a0e8'][i];
          g.fillRect(px + Math.floor(hash(x, y, i + 40) * 14), py + Math.floor(hash(x, y, i + 50) * 14), 2, 1);
        }
        break;
      case 'plank':
        for (let r = 0; r < 4; r++) {
          g.fillStyle = (r + y) % 2 ? th.fb : th.fa;
          g.fillRect(px, py + r * 4, 16, 4);
          g.fillStyle = th.fl;
          g.fillRect(px, py + r * 4 + 3, 16, 1);
          g.fillRect(px + Math.floor(hash(x, y * 4 + r, 3) * 16), py + r * 4, 1, 3);
        }
        break;
      case 'carpet':
        g.fillStyle = th.fb;
        for (let i = 0; i < 8; i++) {
          g.fillRect(px + 8 + i, py + i, 1, 1); g.fillRect(px + 7 - i, py + i, 1, 1);
          g.fillRect(px + 8 + i, py + 15 - i, 1, 1); g.fillRect(px + 7 - i, py + 15 - i, 1, 1);
        }
        if ((x + y) % 2 === 0) { g.fillStyle = th.fl; g.fillRect(px + 7, py + 7, 2, 2); }
        break;
    }
    if (wallAbove) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(px, py, T, 3); }
  }

  function drawWallFace(g, th, px, py, x, y) {
    g.fillStyle = th.face;
    g.fillRect(px, py, T, T);
    g.fillStyle = th.face2;
    if (th.hedge) {
      // park çiti: yaprak benekleri
      for (let i = 0; i < 10; i++) g.fillRect(px + Math.floor(hash(x, y, i + 60) * 15), py + 4 + Math.floor(hash(x, y, i + 70) * 11), 2, 2);
      g.fillStyle = th.faceCap;
      for (let i = 0; i < 4; i++) g.fillRect(px + Math.floor(hash(x, y, i + 80) * 14), py + 5 + Math.floor(hash(x, y, i + 90) * 9), 1, 1);
      g.fillRect(px, py, T, 3);
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(px, py + T - 2, T, 2);
      return;
    }
    for (let r = 0; r < 3; r++) {
      const yy = py + 4 + r * 4;
      g.fillRect(px, yy + 3, T, 1);
      const off = ((r + x) % 2) * 4;
      g.fillRect(px + off, yy, 1, 3);
      g.fillRect(px + off + 8, yy, 1, 3);
    }
    g.fillStyle = th.faceCap;
    g.fillRect(px, py, T, 4);
    g.fillStyle = 'rgba(255,255,255,.14)';
    g.fillRect(px, py + 4, T, 1);
  }

  function prerenderMap(map) {
    const th = THEMES[map.key];
    const c = document.createElement('canvas');
    c.width = map.w * T; c.height = map.h * T;
    const g = c.getContext('2d');
    const tile = (x, y) => (y < 0 || y >= map.h || x < 0 || x >= map.w ? '#' : map.rows[y][x]);
    const wall = (x, y) => isWall(tile(x, y));
    const nearFloor = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!wall(x + dx, y + dy)) return true;
      return false;
    };
    let frameNo = 0;
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const ch = tile(x, y), px = x * T, py = y * T;
        if (isWall(ch)) {
          if (!nearFloor(x, y)) continue;
          if (!wall(x, y + 1)) {
            drawWallFace(g, th, px, py, x, y);
            if (ch === 'P') drawFrame(g, px, py, map.secret, frameNo++);
          } else {
            g.fillStyle = th.top;
            g.fillRect(px, py, T, T);
            g.fillStyle = th.cap;
            if (!wall(x - 1, y)) g.fillRect(px, py, 2, T);
            if (!wall(x + 1, y)) g.fillRect(px + T - 2, py, 2, T);
            if (!wall(x, y - 1)) g.fillRect(px, py, T, 2);
            if (wall(x, y + 1) && !wall(x, y + 2)) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, py + T - 1, T, 1); }
          }
          if (ch === 'c') drawCrack(g, px, py, map.secret);
        } else {
          const z = ZONES[ch] || (ch === 'h' ? ZONES.m : ch === 'j' ? ZONES.f : null);
          drawFloor(g, z || th, px, py, x, y, wall(x, y - 1));
          const arr = ch === 'd' ? SPR.decor[map.key] : ch === 'h' ? SPR.decor.memory : ch === 'j' ? SPR.decor.funny : null;
          if (arr) {
            const d = arr[Math.floor(hash(x, y, 7) * arr.length)];
            shadow(g, px + 8, py + 15, 6);
            g.drawImage(d, px, py);
          }
        }
      }
    }
    return c;
  }

  // Gizli geçit: çatlak duvar, üstünde odanın küçük bir işareti
  function drawCrack(g, px, py, kind) {
    g.fillStyle = 'rgba(20,10,20,.75)';
    const lines = [[7, 3], [8, 4], [8, 5], [7, 6], [6, 7], [7, 8], [9, 7], [10, 8], [5, 8], [4, 9], [8, 9], [8, 10], [9, 11], [7, 11], [6, 12]];
    for (const [lx, ly] of lines) g.fillRect(px + lx, py + ly, 1, 1);
    if (kind === 'memory') miniHeart(g, px + 10, py + 11, '#ff7aa2', 1);
    else { g.fillStyle = '#ffd166'; g.fillRect(px + 11, py + 11, 3, 1); g.fillRect(px + 12, py + 10, 1, 1); }
  }

  // Fotoğraf çerçevesi: varsa fotoğrafın küçüğü, yoksa kalp / gülen yüz
  function drawFrame(g, px, py, kind, i) {
    g.fillStyle = INK; g.fillRect(px + 1, py + 2, 14, 13);
    g.fillStyle = '#e8a33d'; g.fillRect(px + 2, py + 3, 12, 11);
    g.fillStyle = '#ffd166'; g.fillRect(px + 2, py + 3, 12, 1); g.fillRect(px + 2, py + 3, 1, 11);
    const list = photoImgs[kind] || [];
    const im = list.length ? list[i % list.length] : null;
    if (im && im.complete && im.naturalWidth) {
      g.imageSmoothingEnabled = true;
      g.drawImage(im, px + 4, py + 5, 8, 7);
      g.imageSmoothingEnabled = false;
    } else {
      g.fillStyle = kind === 'memory' ? '#fbd0dc' : '#fff1a8';
      g.fillRect(px + 4, py + 5, 8, 7);
      if (kind === 'memory') miniHeart(g, px + 6, py + 6, '#ff7aa2', 1);
      else { g.fillStyle = INK; g.fillRect(px + 6, py + 7, 1, 1); g.fillRect(px + 9, py + 7, 1, 1); g.fillRect(px + 6, py + 9, 4, 1); g.fillRect(px + 5, py + 8, 1, 1); g.fillRect(px + 10, py + 8, 1, 1); }
    }
  }

  function shadow(g, cx, cy, rx) {
    g.fillStyle = 'rgba(0,0,0,.26)';
    g.fillRect(cx - rx, cy - 1, rx * 2, 2);
    g.fillRect(cx - rx + 2, cy - 2, rx * 2 - 4, 4);
  }

  // ---------- görüş (sis) ----------
  function los(x0, y0, x1, y1) {
    const rows = S.map.rows;
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (x !== x1 || y !== y1) {
      if ((x !== x0 || y !== y0) && isWall(rows[y][x])) return false;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    return true;
  }

  function computeVis() {
    const m = S.map, snap = S.snap;
    const key = snap.pl.map((p) => p.x + ',' + p.y).join('|') + '|' + m.mv;
    if (key === S.visKey) return;
    S.visKey = key;
    const W = m.w, H = m.h, R = 6;
    S.vis.fill(0);
    for (const p of snap.pl) {
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy > R * R + 3) continue;
        const x = p.x + dx, y = p.y + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (los(p.x, p.y, x, y) || los(x, y, p.x, p.y)) S.vis[y * W + x] = 1;
      }
    }
    // görünen zeminin etrafındaki duvarlar da görünsün
    const extra = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!S.vis[i] || isWall(m.rows[y][x])) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && isWall(m.rows[yy][xx])) extra.push(yy * W + xx);
      }
    }
    for (const i of extra) S.vis[i] = 1;
    for (let i = 0; i < S.vis.length; i++) if (S.vis[i]) S.seen[i] = 1;
  }
  const isVis = (x, y) => S.map && x >= 0 && y >= 0 && x < S.map.w && y < S.map.h && S.vis[y * S.map.w + x] === 1;
  const isSeen = (x, y) => S.map && x >= 0 && y >= 0 && x < S.map.w && y < S.map.h && S.seen[y * S.map.w + x] === 1;

  // ---------- oyun ekranı ----------
  const world = $('world');
  const wctx = world.getContext('2d');
  const mini = $('mini');
  const mctx = mini.getContext('2d');

  function resize() {
    const vp = $('viewport').getBoundingClientRect();
    if (!vp.width || !vp.height) return;
    const s = Math.max(2, Math.floor(Math.min(vp.width / (12 * T), vp.height / (10 * T)) + 0.25));
    world.width = Math.ceil(vp.width / s);
    world.height = Math.ceil(vp.height / s);
    world.style.width = world.width * s + 'px';
    world.style.height = world.height * s + 'px';
    wctx.imageSmoothingEnabled = false;
    document.documentElement.style.setProperty('--pad-h', $('pad').offsetHeight + 'px');
  }

  function moveRP(key, x, y, dt, speed) {
    let r = S.rp.get(key);
    if (!r || Math.abs(r.x - x) + Math.abs(r.y - y) > 2.5) {
      r = { x, y, last: -1 };
      S.rp.set(key, r);
    }
    const dx = x - r.x, dy = y - r.y, dist = Math.hypot(dx, dy), step = speed * dt;
    if (dist > 0.001) {
      r.last = S.time;
      if (dist <= step) { r.x = x; r.y = y; } else { r.x += (dx / dist) * step; r.y += (dy / dist) * step; }
    }
    r.moving = S.time - r.last < 0.22;
    r.seen = S.frame;
    return r;
  }

  function pixText(g, text, x, y, color, size) {
    g.font = `${size || 8}px "Silkscreen"`;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = INK;
    g.fillText(text, x + 1, y); g.fillText(text, x - 1, y); g.fillText(text, x, y + 1); g.fillText(text, x, y - 1);
    g.fillStyle = color;
    g.fillText(text, x, y);
  }

  function renderGame(dt) {
    const g = wctx, W = world.width, H = world.height, snap = S.snap, map = S.map;
    g.fillStyle = S.theme.void;
    g.fillRect(0, 0, W, H);
    if (!snap || !map || !S.mapCanvas) return;
    S.frame++;
    computeVis();

    snap.pl.forEach((p, i) => moveRP('p' + i, p.x, p.y, dt, p.co ? 17 : 11));
    for (const e of snap.en) moveRP('e' + e.id, e.x, e.y, dt, e.t === 'ball' ? 14 : 9);
    for (const pr of snap.pr) moveRP('r' + pr.id, pr.x, pr.y, dt, pr.t === 'steam' ? 13 : 9);
    if (S.frame % 90 === 0) for (const [k, r] of S.rp) if (r.seen < S.frame - 30) S.rp.delete(k);

    const me = S.rp.get('p' + S.slot);
    const tx = me.x * T + T / 2 - W / 2, ty = me.y * T + T / 2 - H / 2;
    if (!S.cam.ok) { S.cam.x = tx; S.cam.y = ty; S.cam.ok = true; }
    const k = 1 - Math.exp(-dt * 7);
    S.cam.x += (tx - S.cam.x) * k;
    S.cam.y += (ty - S.cam.y) * k;
    let shx = 0, shy = 0;
    if (S.shake > 0) {
      shx = Math.round((Math.random() * 2 - 1) * S.shake);
      shy = Math.round((Math.random() * 2 - 1) * S.shake);
      S.shake = Math.max(0, S.shake - dt * 22);
    }
    const cx = Math.round(S.cam.x) + shx, cy = Math.round(S.cam.y) + shy;

    g.save();
    g.translate(-cx, -cy);
    g.drawImage(S.mapCanvas, 0, 0);

    // merdiven
    if (snap.st && isSeen(snap.st.x, snap.st.y)) {
      g.drawImage(snap.st.open ? SPR.stairs : SPR.hatch, snap.st.x * T, snap.st.y * T);
      if (snap.st.open && Math.random() < dt * 10) addPart(snap.st.x * T + 2 + Math.random() * 12, snap.st.y * T + 12, 0, -14, 0.7, '#ffd166', 1, 0);
    }
    // tuzaklar (araba kapısı)
    for (const tr of snap.tr) {
      if (!isSeen(tr.x, tr.y)) continue;
      const px = tr.x * T, py = tr.y * T;
      if (tr.s === 0) { g.globalAlpha = 0.75; g.drawImage(SPR.doorOpen, px, py); }
      else if (tr.s === 1) { g.globalAlpha = 0.6; g.drawImage(SPR.doorShut, px + (S.frame % 6 < 3 ? -1 : 1), py); }
      else g.drawImage(SPR.doorShut, px, py);
      g.globalAlpha = 1;
    }
    // eşyalar
    for (const it of snap.it) {
      if (!isVis(it.x, it.y)) continue;
      const bob = Math.round(Math.sin(S.time * 4 + it.id) * 1.5);
      shadow(g, it.x * T + 8, it.y * T + 14, 5);
      if (it.t === 'page') {
        g.fillStyle = `rgba(255,209,102,${0.25 + Math.sin(S.time * 6) * 0.15})`;
        g.fillRect(it.x * T - 2, it.y * T - 4 + bob, 20, 20);
      }
      g.drawImage(SPR[it.t], it.x * T, it.y * T - 2 + bob);
    }
    // canlılar, y sırasına göre
    const ents = [];
    snap.pl.forEach((p, i) => ents.push({ y: S.rp.get('p' + i).y, draw: () => drawPlayer(g, i, p, S.rp.get('p' + i), dt) }));
    for (const n of snap.np || []) {
      if (!isVis(n.x, n.y)) continue;
      ents.push({ y: n.y, draw: () => drawNpc(g, n) });
    }
    for (const e of snap.en) {
      const big = e.t === 'king';
      const vis = big ? isVis(e.x, e.y) || isVis(e.x + 1, e.y) || isVis(e.x, e.y + 1) || isVis(e.x + 1, e.y + 1) : isVis(e.x, e.y);
      if (!vis) continue;
      const r = S.rp.get('e' + e.id);
      ents.push({ y: r.y + (big ? 1 : 0), draw: () => drawEnemy(g, e, r) });
    }
    ents.sort((a, b) => a.y - b.y);
    for (const o of ents) o.draw();
    // mermiler
    for (const pr of snap.pr) {
      if (!isVis(pr.x, pr.y)) continue;
      const r = S.rp.get('r' + pr.id);
      const spin = Math.floor(S.time * 14) % 4;
      const img = pr.t === 'banana' ? SPR.bananaSpin[spin] : pr.t === 'kil' ? SPR.kilSpin[spin] : SPR.steam;
      g.drawImage(img, Math.round(r.x * T), Math.round(r.y * T) - 3);
    }

    drawFog(g, cx, cy, W, H);
    zoneAmbience(snap, dt);
    drawFx(g, dt);
    g.restore();

    if (S.theme.dark) {
      const grd = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7);
      grd.addColorStop(0, 'rgba(8,4,20,0)');
      grd.addColorStop(1, 'rgba(8,4,20,.6)');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
    }
    if (S.flash > 0) {
      g.fillStyle = `rgba(255,60,90,${S.flash})`;
      g.fillRect(0, 0, W, H);
      S.flash = Math.max(0, S.flash - dt * 1.4);
    }
    drawPointers(g, cx, cy, W, H);
    if (S.frame % 6 === 0) drawMini();
  }

  function drawPlayer(g, i, p, r, dt) {
    const C = SPR['cat_' + CATS[i]];
    const px = Math.round(r.x * T), py = Math.round(r.y * T);
    shadow(g, px + 8, py + 15, 6);
    if (p.dn) {
      g.drawImage(p.f < 0 ? C.sleep.l : C.sleep.r, px, py);
      if (Math.random() < dt * 1.4) floater(r.x + 0.3, r.y - 0.2, 'z', '#c9b6f2', 1.3);
      if (p.rv > 0) {
        g.fillStyle = INK; g.fillRect(px, py - 5, 16, 4);
        g.fillStyle = '#7ee0b5'; g.fillRect(px + 1, py - 4, Math.round((14 * p.rv) / Core.REVIVE_TICKS), 2);
      }
      return;
    }
    if (p.inv && Math.floor(S.time * 14) % 2 === 0) return;
    const fr = r.moving ? Math.floor(S.time * 9) % 2 : Math.floor(S.time * 1.6) % 2;
    const flip = p.f < 0;
    if (p.co && r.moving) {
      g.fillStyle = 'rgba(255,255,255,.7)';
      const bx = flip ? px + 15 : px - 3;
      g.fillRect(bx, py + 6, 3, 1); g.fillRect(bx - (flip ? -1 : 1), py + 10, 3, 1);
    }
    g.drawImage((flip ? C.l : C.r)[fr], px, py - 1);
    if (p.ni) {
      if (Math.floor(S.time * 10) % 2) { g.globalAlpha = 0.55; g.drawImage((flip ? C.whiteL : C.white)[fr], px, py - 1); g.globalAlpha = 1; }
      if (Math.random() < dt * 20) addPart(px + Math.random() * 16, py + 4 + Math.random() * 10, 0, -10, 0.5, `hsl(${Math.floor(S.time * 400) % 360},90%,70%)`, 1, 0);
    }
    if (p.ya && Math.random() < dt * 6) addPart(px + Math.random() * 16, py + Math.random() * 10, 0, -8, 0.6, '#ff7aa2', 1, 0);
    if (p.sl && Math.random() < dt * 1.2) floater(r.x + 0.4, r.y - 0.3, 'z', '#c9b6f2', 1.1);
    if (p.sh) {
      g.strokeStyle = `rgba(142,197,255,${0.35 + Math.sin(S.time * 4) * 0.15})`;
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(px + 8, py + 7, 10, 10, 0, 0, Math.PI * 2);
      g.stroke();
    }
    if (i === S.slot && S.snap.ft < 90) {
      const by = py - 10 + Math.round(Math.sin(S.time * 8) * 2);
      g.fillStyle = '#ffd166';
      g.fillRect(px + 5, by, 6, 2); g.fillRect(px + 6, by + 2, 4, 1); g.fillRect(px + 7, by + 3, 2, 1);
    }
  }

  function drawNpc(g, n) {
    const set = SPR.npc[n.k];
    const px = n.x * T, py = n.y * T;
    const me = S.snap.pl[S.slot];
    const flip = me.x < n.x;
    shadow(g, px + 8, py + 15, 6);
    g.drawImage((flip ? set.l : set.r)[Math.floor(S.time * 1.4) % 2], px, py - 1);
    // konuşulmadıysa baloncuk
    if (!S.talked.has(S.map.mv + ':' + n.id)) {
      const by = py - 12 + Math.round(Math.sin(S.time * 5) * 1.5);
      g.fillStyle = INK; g.fillRect(px + 3, by - 1, 10, 9); g.fillRect(px + 6, by + 8, 3, 2);
      g.fillStyle = '#fff4e3'; g.fillRect(px + 4, by, 8, 7); g.fillRect(px + 7, by + 7, 1, 1);
      g.fillStyle = '#e2557a'; g.fillRect(px + 7, by + 1, 2, 3); g.fillRect(px + 7, by + 5, 2, 1);
    }
  }

  // Gizli odaya girişte müzik + başlık, içerideyken kalpler / konfetiler
  function zoneAmbience(snap, dt) {
    const me = snap.pl[S.slot];
    const ch = S.map.rows[me.y][me.x];
    const zone = ch === 'm' ? 'memory' : ch === 'f' ? 'funny' : null;
    if (zone !== S.zone) {
      S.zone = zone;
      if (zone) {
        AU.music(zone);
        const key = S.map.mv + ':' + zone;
        if (!S.zonesSeen.has(key)) {
          S.zonesSeen.add(key);
          if (zone === 'memory') banner('💕 GİZLİ ANI ODASI 💕', 'Çerçevelere dokun');
          else { banner('😂 KOMİKLİK ODASI 😂', 'Çerçevelere dokun, süslere dokunma… ya da dokun'); AU.sfx('laugh'); }
          track({ secret_found: zone });
        }
      } else if (S.snap.phase === 'play') {
        AU.music(bossActive() ? 'boss' : Core.FLOORS[S.map.floor].key);
      }
    }
    if (zone === 'memory' && Math.random() < dt * 5) {
      addPart(me.x * T - 40 + Math.random() * 96, me.y * T + 40, (Math.random() - 0.5) * 10, -18 - Math.random() * 10, 2.2, Math.random() < 0.5 ? '#ff7aa2' : '#ffb3c8', 1, 0, true);
    }
    if (zone === 'funny' && Math.random() < dt * 6) {
      addPart(me.x * T - 40 + Math.random() * 96, me.y * T - 40, (Math.random() - 0.5) * 16, 20, 1.8, ['#ff7aa2', '#7ee0b5', '#62a0e8', '#ffd166'][Math.floor(Math.random() * 4)], 2, 8);
    }
  }
  const bossActive = () => S.snap && S.snap.en.some((e) => e.t === 'king' && e.ag);

  function drawEnemy(g, e, r) {
    const big = e.t === 'king';
    const set = SPR[e.t];
    const px = Math.round(r.x * T), py = Math.round(r.y * T);
    const fr = r.moving || e.w ? Math.floor(S.time * 8) % 2 : Math.floor(S.time * 2 + e.id) % 2;
    const flip = e.f < 0;
    const img = e.fl ? (flip ? set.whiteL : set.white)[fr] : (flip ? set.l : set.r)[fr];
    const ox = e.w ? (S.frame % 4 < 2 ? -1 : 1) : 0;
    const w = big ? 32 : 16;
    if (big) { shadow(g, px + 16, py + 31, 13); g.drawImage(img, px + ox, py - 3); }
    else { shadow(g, px + 8, py + 15, 6); g.drawImage(img, px + ox, py - 1); }
    const topY = big ? py - 8 : py - 3;
    if (e.w) {
      g.fillStyle = INK; g.fillRect(px + w / 2 - 2, topY - 9, 4, 9);
      g.fillStyle = '#ff5a6e'; g.fillRect(px + w / 2 - 1, topY - 8, 2, 4); g.fillRect(px + w / 2 - 1, topY - 3, 2, 2);
    }
    if (e.st) {
      const a = S.time * 9;
      g.fillStyle = '#ffd166';
      for (let s = 0; s < 3; s++) {
        const aa = a + (s * Math.PI * 2) / 3;
        g.fillRect(Math.round(px + w / 2 + Math.cos(aa) * (w / 3)), Math.round(topY + 2 + Math.sin(aa) * 2), 2, 2);
      }
    }
    if (e.so && SPR[e.so]) g.drawImage(SPR[e.so], px + 4, topY - 6, 8, 8);
    if (e.t === 'pagem' && e.hp < e.mh) {
      g.fillStyle = INK; g.fillRect(px, topY - 2, 16, 3);
      g.fillStyle = '#ff7aa2'; g.fillRect(px + 1, topY - 1, Math.round((14 * e.hp) / e.mh), 1);
    }
  }

  function drawFog(g, cx, cy, W, H) {
    const m = S.map;
    const x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
    const x1 = Math.min(m.w - 1, Math.floor((cx + W) / T)), y1 = Math.min(m.h - 1, Math.floor((cy + H) / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * m.w + x;
        if (!S.seen[i]) { g.fillStyle = S.theme.void; g.fillRect(x * T, y * T, T, T); }
        else if (!S.vis[i]) { g.fillStyle = 'rgba(8,5,16,.58)'; g.fillRect(x * T, y * T, T, T); }
      }
    }
  }

  // ---------- parçacıklar ----------
  function addPart(x, y, vx, vy, life, color, size, grav, heart) {
    S.parts.push({ x, y, vx, vy, life, max: life, color, size: size || 1, grav: grav || 0, heart });
  }
  function burst(tx, ty, colors, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (speed || 40) * (0.5 + Math.random());
      addPart(tx * T + 8, ty * T + 8, Math.cos(a) * s, Math.sin(a) * s - 12, 0.35 + Math.random() * 0.35, colors[i % colors.length], Math.random() < 0.3 ? 2 : 1, 70);
    }
  }
  function hearts(tx, ty, n) {
    for (let i = 0; i < n; i++) addPart(tx * T + 4 + Math.random() * 8, ty * T + 2, (Math.random() - 0.5) * 20, -20 - Math.random() * 16, 0.9, '#ff7aa2', 1, 0, true);
  }
  function floater(tx, ty, text, color, life) {
    S.floaters.push({ x: tx * T + 8, y: ty * T, text, color, life: life || 0.9, max: life || 0.9 });
  }
  function ring(tx, ty, r) { S.rings.push({ x: tx * T + 8, y: ty * T + 8, r: r * T + 8, t: 0 }); }

  function drawFx(g, dt) {
    for (let i = S.rings.length - 1; i >= 0; i--) {
      const o = S.rings[i];
      o.t += dt;
      const k = o.t / 0.35;
      if (k >= 1) { S.rings.splice(i, 1); continue; }
      g.strokeStyle = `rgba(255,244,227,${1 - k})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(o.x, o.y, o.r * k, 0, Math.PI * 2);
      g.stroke();
    }
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const p = S.parts[i];
      p.life -= dt;
      if (p.life <= 0) { S.parts.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
      if (p.heart) miniHeart(g, Math.round(p.x), Math.round(p.y), p.color, 1);
      else { g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
    }
    g.globalAlpha = 1;
    for (let i = S.floaters.length - 1; i >= 0; i--) {
      const f = S.floaters[i];
      f.life -= dt;
      if (f.life <= 0) { S.floaters.splice(i, 1); continue; }
      f.y -= dt * 16;
      g.globalAlpha = Math.min(1, (f.life / f.max) * 2);
      pixText(g, f.text, f.x, f.y, f.color, 8);
    }
    g.globalAlpha = 1;
  }

  // Ekran dışındaki hedefe ve partnere ok
  function objective(snap) {
    const pg = snap.it.find((i) => i.t === 'page');
    if (pg) return { x: pg.x, y: pg.y, icon: SPR.page };
    if (snap.st && snap.st.open) return { x: snap.st.x, y: snap.st.y, icon: SPR.stairs };
    const h = snap.en.find((e) => e.t === 'pagem' || e.t === 'king');
    if (h && snap.ft > 500) return { x: h.x + (h.t === 'king' ? 0.5 : 0), y: h.y + (h.t === 'king' ? 0.5 : 0), icon: SPR.page };
    return null;
  }
  function edgeArrow(g, wx, wy, cx, cy, W, H, color, icon) {
    const sx = wx - cx, sy = wy - cy, m = 14;
    if (sx > m && sx < W - m && sy > m && sy < H - m) return;
    const ox = W / 2, oy = H / 2, dx = sx - ox, dy = sy - oy;
    const s = Math.min((W / 2 - m) / Math.abs(dx || 1e-6), (H / 2 - m) / Math.abs(dy || 1e-6));
    const ax = Math.round(ox + dx * s), ay = Math.round(oy + dy * s);
    const a = Math.atan2(dy, dx), pulse = 1 + Math.sin(S.time * 7) * 0.12;
    g.save();
    g.translate(ax, ay);
    g.fillStyle = INK;
    g.beginPath(); g.arc(0, 0, 9 * pulse, 0, Math.PI * 2); g.fill();
    g.fillStyle = color;
    g.beginPath(); g.arc(0, 0, 7.5 * pulse, 0, Math.PI * 2); g.fill();
    g.rotate(a);
    g.fillStyle = INK;
    g.beginPath(); g.moveTo(14, 0); g.lineTo(8, -5); g.lineTo(8, 5); g.closePath(); g.fill();
    g.rotate(-a);
    if (icon) g.drawImage(icon, -6, -6, 12, 12);
    g.restore();
  }
  function drawPointers(g, cx, cy, W, H) {
    const snap = S.snap;
    if (snap.phase !== 'play') return;
    const ob = objective(snap);
    if (ob) edgeArrow(g, ob.x * T + 8, ob.y * T + 8, cx, cy, W, H, '#ffd166', ob.icon);
    const o = 1 - S.slot, r = S.rp.get('p' + o);
    if (r) edgeArrow(g, r.x * T + 8, r.y * T + 8, cx, cy, W, H, CAT_COLORS[o], FACE[CATS[o]]);
  }

  function drawMini() {
    const m = S.map;
    if (mini.width !== m.w * 2) { mini.width = m.w * 2; mini.height = m.h * 2; }
    const g = mctx;
    g.clearRect(0, 0, mini.width, mini.height);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const i = y * m.w + x;
      if (!S.seen[i]) continue;
      const ch = m.rows[y][x];
      g.fillStyle = isWall(ch) ? 'rgba(170,150,200,.5)'
        : ch === 'm' || ch === 'h' ? 'rgba(255,122,162,.8)'
          : ch === 'f' || ch === 'j' ? 'rgba(255,209,102,.8)'
            : S.vis[i] ? 'rgba(255,244,227,.6)' : 'rgba(255,244,227,.28)';
      g.fillRect(x * 2, y * 2, 2, 2);
    }
    const snap = S.snap;
    if (snap.st && snap.st.open && isSeen(snap.st.x, snap.st.y) && Math.floor(S.time * 4) % 2) { g.fillStyle = '#ffd166'; g.fillRect(snap.st.x * 2 - 1, snap.st.y * 2 - 1, 4, 4); }
    for (const it of snap.it) if (it.t === 'page' && isSeen(it.x, it.y)) { g.fillStyle = '#ff5a6e'; g.fillRect(it.x * 2 - 1, it.y * 2 - 1, 4, 4); }
    snap.pl.forEach((p, i) => { g.fillStyle = CAT_COLORS[i]; g.fillRect(p.x * 2 - 1, p.y * 2 - 1, 4, 4); });
  }

  // ---------- ağdan gelenler ----------
  function onMap(map) {
    const retry = S.map && map.floor === S.lastFloor && map.mv !== S.lastMv;
    S.map = map;
    S.lastMv = map.mv;
    S.theme = THEMES[map.key];
    S.mapCanvas = prerenderMap(map);
    S.seen = new Uint8Array(map.w * map.h);
    S.vis = new Uint8Array(map.w * map.h);
    S.visKey = '';
    S.rp.clear();
    S.cam.ok = false;
    S.parts = []; S.floaters = []; S.rings = [];
    S.zone = null;
    const F = Core.FLOORS[map.floor];
    const label = `BÖLÜM ${map.floor + 1} · ${F.name.toLocaleUpperCase('tr')}`;
    if (map.floor !== S.lastFloor) {
      S.lastFloor = map.floor;
      const sub = F.boss ? 'Kral Maymun burada… kılları diken diken! 👑'
        : F.part === 0 ? 'Yırtık sayfanın ilk yarısını bul! 📜' : 'Sayfanın diğer yarısı bu katta! 📜';
      banner(label, sub);
      AU.music(F.key);
      $('bossbar').classList.add('hidden');
      if (map.floor > 0) document.querySelector('.kbd-hint').classList.add('hidden');
      track({ floor_reached: map.floor + 1 });
    } else if (retry) {
      banner(label, 'Kat yeniden karıştı, tekrar! 🐾');
      AU.music(F.key);
    }
  }

  // Kırılan çatlak duvar gibi tek hücrelik değişiklikler
  function patchTile(x, y, ch) {
    const r = S.map.rows[y];
    S.map.rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
    S.mapCanvas = prerenderMap(S.map);
    S.visKey = '';
  }

  function npcTalk(k, id) {
    const npc = CFG.npcs && CFG.npcs[k];
    if (!npc || S.dialog) return;
    S.talked.add(S.map.mv + ':' + id);
    const part = Core.FLOORS[S.map.floor].part;
    const lines = (part === 0 ? npc.first : npc.second).slice();
    const H = CFG.secretHints || {};
    if (S.map.secret) lines.push(H[S.map.secret]);
    else if (S.snap.stats && S.snap.stats.secrets >= 2) lines.push(H.allFound);
    else lines.push(H.none);
    pauseFor(() => dialog(lines.filter(Boolean).map((text) => ({ who: 'npc' + k, text })), resumeGame));
  }

  // Tek oyunculu modda diyalog / galeri açıkken oyun durur
  function pauseFor(fn) {
    releaseAll();
    if (!S.online && S.net) S.net.paused = true;
    fn();
  }
  function resumeGame() {
    if (!S.online && S.net && S.overlayKind !== 'pause') S.net.paused = false;
  }

  function showPhoto(kind, i) {
    const list = PHOTOS[kind] || [];
    const title = kind === 'memory' ? '💕 ANI DUVARI' : '😂 KOMİKLİK DUVARI';
    pauseFor(() => {
      let idx = list.length ? i % list.length : 0;
      const render = () => {
        const p = list[idx];
        const body = p
          ? `<img class="photo" src="${esc(p.src)}" alt="${esc(p.caption || '')}"><p>${esc(p.caption || '')}</p>`
          : `<div class="photo-empty ${kind}">${kind === 'memory' ? '💕' : '😂'}</div><p>${esc((CFG.emptyFrame || {})[kind] || '')}</p>`;
        const nav = list.length > 1 ? `<div class="photo-nav"><button class="px-btn small" data-p="-1">◀</button><span>${idx + 1}/${list.length}</span><button class="px-btn small" data-p="1">▶</button></div>` : '';
        overlay(`<h3>${title}</h3>${body}${nav}<button class="px-btn primary" data-act="closephoto" data-focus>KAPAT</button>`, 'photo');
        $('ovBox').querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
          idx = (idx + Number(b.dataset.p) + list.length) % list.length;
          AU.sfx('select');
          render();
        }));
      };
      render();
      AU.sfx(kind === 'memory' ? 'sparkle' : 'laugh');
    });
  }

  function onState(snap, ev) {
    const prev = S.snap;
    S.snap = snap;
    const key = snap.phase + '|' + JSON.stringify(snap.pd);
    if (key !== S.pdKey) { S.pdKey = key; onPhase(prev ? prev.phase : null, snap); }
    if (ev && ev.length && S.map) for (const e of ev) fx(e, snap);
    hud(snap);
  }

  function near(x, y) {
    const me = S.snap && S.snap.pl[S.slot];
    return !me || (Math.abs(x - me.x) <= 10 && Math.abs(y - me.y) <= 9);
  }

  function fx(e, snap) {
    switch (e.k) {
      case 'scratch': AU.sfx('scratch'); burst(e.x, e.y, ['#ffffff', '#ffd166'], 5, 50); break;
      case 'hit':
        floater(e.x, e.y - 0.3, '-' + e.d, '#ffd166', 0.7);
        if (e.hairy) {
          burst(e.x + (e.big ? 0.5 : 0), e.y + (e.big ? 0.5 : 0), ['#9a6a43', '#6b4428'], e.big ? 12 : 6, 55);
          if (Math.random() < 0.25) floater(e.x, e.y - 1.1, HAIR_JOKES[Math.floor(Math.random() * HAIR_JOKES.length)], '#c99a66', 1.1);
        }
        break;
      case 'kill':
        if (near(e.x, e.y)) AU.sfx('poof');
        burst(e.x + (e.big ? 0.5 : 0), e.y + (e.big ? 0.5 : 0), e.hairy ? ['#9a6a43', '#6b4428', '#fff4e3'] : ['#fff4e3', '#c9b6f2', '#ffffff'], e.big ? 40 : 10, e.big ? 90 : 45);
        if (!e.poof) hearts(e.x, e.y, e.big ? 8 : 2);
        if (e.big) { S.shake = 8; AU.music('aksam'); $('bossbar').classList.add('hidden'); toast('Kral Maymun yenildi! Son sayfayı al 📜', 3500); }
        break;
      case 'pick':
        if (e.t === 'page') break;
        AU.sfx(e.t === 'tantuni' ? 'tantuni' : 'pick');
        burst(e.x, e.y, ['#ffd166', '#ffffff', '#ff7aa2'], 8, 40);
        floater(e.x, e.y - 0.4, ITEM_TEXT[e.t] || '', e.t === 'tantuni' ? '#ff7aa2' : '#7ee0b5', 1.2);
        if (e.t === 'tantuni') { hearts(snap.pl[0].x, snap.pl[0].y, 4); hearts(snap.pl[1].x, snap.pl[1].y, 4); }
        break;
      case 'hurt': {
        AU.sfx('hurt');
        const d = e.d || 1;
        floater(e.x, e.y - 0.3, '-' + d, d >= 3 ? '#ff2e4d' : '#ff5a6e', 0.9);
        if (e.s === S.slot) {
          S.shake = 3 + d * 1.5; S.flash = 0.18 + d * 0.06;
          if (navigator.vibrate) navigator.vibrate(30 + d * 15);
          const me = snap.pl[S.slot], o = snap.pl[1 - S.slot];
          if (!S.kissHint && !o.dn && me.hp > 0 && me.hp <= me.mh / 2 && me.kc <= 0) {
            S.kissHint = true;
            toast(`Canın azaldı! ${NAMES[1 - S.slot]}'in yanına git ve öp 💋`, 3600);
          }
        }
        break;
      }
      case 'kiss':
        hearts(e.x, e.y, e.heal ? 10 : 3);
        if (e.heal) {
          AU.sfx('kiss');
          ring(e.x, e.y, 1);
          floater(e.x, e.y - 0.9, 'MUCK! 💋', '#ff7aa2', 1.3);
          floater(e.x, e.y - 0.3, '+' + Core.KISS_HEAL, '#7ee0b5', 1.1);
        } else {
          AU.sfx('smooch');
          floater(e.x, e.y - 0.8, '💋', '#ff7aa2', 0.9);
          if (e.wait && S.time - S.lastKissMsg > 2) { S.lastKissMsg = S.time; floater(e.x, e.y - 1.4, `Öpücük ${e.wait} sn sonra iyileştirir`, '#ffb3c8', 1.4); }
        }
        break;
      case 'kissfar':
        if (e.s === S.slot && S.time - S.lastKissMsg > 1.5) { S.lastKissMsg = S.time; toast(`Öpücük için ${NAMES[1 - S.slot]}'in dibine git 💋`, 2000); }
        break;
      case 'talk': if (!S.online) npcTalk(e.n, e.id); break;
      case 'tile': patchTile(e.x, e.y, e.ch); break;
      case 'secret':
        AU.sfx('secret');
        S.shake = 4;
        burst(e.x, e.y, ['#c9b6f2', '#fff4e3', e.kind === 'memory' ? '#ff7aa2' : '#ffd166'], 24, 70);
        floater(e.x, e.y - 0.6, 'GİZLİ GEÇİT!', '#ffd166', 1.6);
        break;
      case 'photo': if (!S.online) showPhoto(e.kind, e.i); break;
      case 'aww': AU.sfx('heal'); hearts(e.x, e.y, 5); break;
      case 'joke': {
        const [txt, snd] = JOKE_TEXT[Math.floor(hash(e.x, e.y, 7) * JOKE_TEXT.length)];
        AU.sfx(snd);
        floater(e.x, e.y - 0.7, txt, '#ffd166', 1.2);
        break;
      }
      case 'down':
        AU.sfx('down');
        floater(e.x, e.y - 0.6, `${NAMES[e.s]} bayıldı!`, '#c9b6f2', 1.6);
        if (!S.downHint) { S.downHint = true; toast(`Yanında dur, ${NAMES[e.s]} uyansın! 💤`, 3200); }
        break;
      case 'revive': AU.sfx('revive'); hearts(e.x, e.y, 6); floater(e.x, e.y - 0.6, 'Uyandı!', '#7ee0b5', 1.2); break;
      case 'meow':
        AU.sfx(e.s === 0 ? 'meowHi' : 'meowLo');
        ring(e.x, e.y, e.r);
        floater(e.x, e.y - 0.8, 'MİYAV!', '#fff4e3', 0.9);
        if (e.s === S.slot) S.meowMax = Math.max(60, S.snap.pl[S.slot].mc || 120);
        break;
      case 'slam':
        if (near(e.x, e.y)) { AU.sfx('slam'); S.shake = Math.max(S.shake, 2); floater(e.x, e.y - 0.2, 'BAM!', '#ff5a6e', 0.7); }
        break;
      case 'text': floater(e.x, e.y - 0.9, e.s, '#ffd166', 1.7); break;
      case 'steal': AU.sfx('monkey'); floater(e.x, e.y - 0.6, 'Maymun kaptı!', '#ffb36b', 1.3); break;
      case 'shoot': if (near(e.x, e.y)) AU.sfx('steam'); break;
      case 'throw':
        AU.sfx('throw');
        if (e.t === 'kil' && Math.random() < 0.5) floater(e.x + 0.5, e.y - 1, 'KIL FIRTINASI!', '#c99a66', 1.2);
        break;
      case 'boss':
        AU.sfx('roar'); AU.music('boss'); S.shake = 6;
        banner('KRAL MAYMUN!', 'Son sayfa onda. Pençele, miyavla! 👑');
        break;
      case 'summon': AU.sfx('monkey'); floater(e.x + 0.5, e.y - 0.8, 'Maymunlarım!', '#ffb36b', 1.2); break;
      case 'stomp': AU.sfx('slam'); S.shake = 4; burst(e.x, e.y, ['#c99a66', '#6b4428'], 14, 60); break;
      case 'stairs': AU.sfx('sparkle'); toast('Merdiven açıldı! Bir sonraki durağa koş 🐾', 3200); break;
      case 'descend': AU.sfx('descend'); toast('Kemer çıkarıldı ✔ İniyoruz…', 2200); break;
      case 'alert': if (near(e.x, e.y)) { floater(e.x, e.y - 0.7, '!', '#ffd166', 0.6); AU.sfx('alert'); } break;
      case 'clack': if (near(e.x, e.y)) AU.sfx('clack'); break;
      case 'block': AU.sfx('block'); floater(e.x, e.y - 0.6, 'Kalkan!', '#8ec5ff', 1); break;
      case 'heal': AU.sfx('heal'); floater(e.x, e.y - 0.5, '+1', '#7ee0b5', 0.9); hearts(e.x, e.y, 1); break;
      case 'splat': if (near(e.x, e.y)) burst(e.x, e.y, e.t === 'banana' ? ['#ffd166', '#e8a33d'] : ['#ffffff', '#c8cbd6'], 5, 30); break;
      case 'perk': AU.sfx('select'); break;
    }
  }

  // ---------- HUD ----------
  function hud(snap) {
    snap.pl.forEach((p, i) => {
      const box = $('hudP' + i);
      const key = [p.hp, p.mh, p.dn, p.sh, p.co, p.ya, p.ni, p.sl, p.ai, S.slot, S.online].join();
      if (box.dataset.k === key) return;
      box.dataset.k = key;
      let hs = '';
      for (let h = 0; h < p.mh; h++) hs += `<img src="${h < p.hp ? IMG.heart : IMG.heartEmpty}" alt="">`;
      for (let h = 0; h < p.sh; h++) hs += `<img src="${IMG.shield}" alt="">`;
      const effects = [p.co && '☕', p.ya && '🧶', p.ni && '🌿', p.sl && '💤', p.dn && '😵'].filter(Boolean).join(' ');
      const tag = i === S.slot ? ' <b>(sen)</b>' : S.online && p.ai ? ' <i>🤖</i>' : '';
      box.classList.toggle('down', p.dn);
      const perRow = Math.max(5, Math.ceil((p.mh + p.sh) / 2));
      box.innerHTML = `<img class="portrait" src="${IMG['face_' + CATS[i]]}" alt=""><div><div class="nm">${esc(NAMES[i])}${tag}</div><div class="hearts" style="max-width:${perRow * 13}px" aria-label="${p.hp}/${p.mh} can">${hs}</div><div class="fx">${effects}</div></div>`;
    });
    const ck = snap.floor + '|' + snap.pages.join() + '|' + snap.lives;
    if (S.chipKey !== ck) {
      S.chipKey = ck;
      const pages = CFG.stops.map((s, n) => {
        const got = [2 * n, 2 * n + 1].filter((f) => snap.pages.includes(f)).length;
        return `<span class="pg ${got === 2 ? '' : got === 1 ? 'half' : 'off'}"><img src="${IMG.page}" alt="">${got === 1 ? '<i>½</i>' : ''}</span>`;
      }).join('');
      $('chip').innerHTML = `<div class="fl">BÖLÜM ${snap.floor + 1}/${Core.FLOORS.length}</div><div class="pages" aria-label="${snap.pages.length} yarım sayfa">${pages}</div><div class="lives"><img src="${IMG.paw}" alt="">×${snap.lives}</div>`;
    }
    const king = snap.en.find((e) => e.t === 'king');
    const bb = $('bossbar');
    if (king && king.ag) {
      bb.classList.remove('hidden');
      $('bossHp').style.width = Math.max(0, (king.hp / king.mh) * 100) + '%';
    } else if (!bb.classList.contains('hidden') && !king) bb.classList.add('hidden');
    const me = snap.pl[S.slot], o = snap.pl[1 - S.slot];
    $('meowCd').style.setProperty('--cd', Math.min(100, (me.mc / S.meowMax) * 100) + '%');
    $('kissCd').style.setProperty('--cd', Math.min(100, (me.kc / Core.KISS_CD) * 100) + '%');
    const close = Math.max(Math.abs(me.x - o.x), Math.abs(me.y - o.y)) <= 1;
    const ready = close && me.kc <= 0 && !me.dn && (o.dn || me.hp < me.mh);
    $('btnKiss').classList.toggle('ready', ready);
  }

  // ---------- aşama pencereleri ----------
  function overlay(html, kind) {
    $('ovBox').innerHTML = html;
    $('overlay').classList.remove('hidden');
    S.overlayKind = kind;
    const f = $('ovBox').querySelector('[data-focus]');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 50);
  }
  function closeOverlay() {
    $('overlay').classList.add('hidden');
    S.overlayKind = null;
  }

  $('ovBox').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !S.net) return;
    AU.unlock();
    AU.sfx('select');
    const act = b.dataset.act;
    if (act === 'cont') S.net.send({ t: 'cont' });
    else if (act === 'perk') S.net.send({ t: 'perk', id: b.dataset.id });
    else if (act === 'resume') togglePause(false);
    else if (act === 'closephoto') { closeOverlay(); resumeGame(); }
  });

  function onPhase(prevPhase, snap) {
    switch (snap.phase) {
      case 'play': if (S.overlayKind !== 'pause') closeOverlay(); break;
      case 'page': showPage(snap); break;
      case 'perk': showPerk(snap); break;
      case 'wipe': showWipe(snap); break;
      case 'gameover': showGameOver(); break;
      case 'final': startFinal(snap); break;
    }
  }

  // İlk yarım sayfa sadece ipucu verir, ikinci yarım durağı tamamen açar
  function showPage(snap) {
    const { n, stop, part } = snap.pd;
    const st = CFG.stops[stop];
    const last = n >= Core.FLOORS.length - 1;
    AU.sfx('page');
    hearts(snap.pl[0].x, snap.pl[0].y, 5);
    track({ pages_found: n + 1 });
    const wait = S.online ? '<p class="wait">İkinizden biri basınca devam eder</p>' : '';
    if (part === 0) {
      overlay(`
        <h3>📜 YIRTIK SAYFA! (½)</h3>
        <img class="big-ico mystery" src="${IMG.stop[st.icon]}" alt="">
        <div class="stop-title">DURAK ${stop + 1}: ???</div>
        <div class="stop-meta"><span>⏰ ${esc(st.time)}</span></div>
        <p>İpucu: ${esc(st.hint || '')}</p>
        <p class="wait">Diğer yarısı bir sonraki bölümde!</p>
        <button class="px-btn primary" data-act="cont" data-focus>MERDİVENE KOŞ ▶</button>${wait}`, 'page');
      return;
    }
    overlay(`
      <h3>📜 SAYFA TAMAMLANDI! (DURAK ${stop + 1}/${CFG.stops.length})</h3>
      <img class="big-ico" src="${IMG.stop[st.icon]}" alt="">
      <div class="stop-title">${st.emoji} ${esc(st.title)}</div>
      <div class="stop-meta"><span>📅 ${esc(CFG.dateShort)}</span><span>⏰ ${esc(st.time)}</span><span>📍 ${esc(st.place)}</span></div>
      <p>${esc(st.note)}</p>
      <button class="px-btn primary" data-act="cont" data-focus>${last ? 'PLANI TAMAMLA ▶' : 'MERDİVENE KOŞ ▶'}</button>${wait}`, 'page');
  }

  function showPerk(snap) {
    const pd = snap.pd, mine = pd.opts[S.slot], picked = pd.picked[S.slot];
    const me = snap.pl[S.slot];
    if (picked) {
      overlay(`<h3>${PERK_ICON[picked]} ${esc(Core.PERKS[picked].name)}</h3><p>Seçildi!</p><p class="wait">${esc(NAMES[1 - S.slot])} seçim yapıyor…</p>`, 'perk-wait');
      return;
    }
    const cards = mine.map((id, i) => `
      <button class="perk" data-act="perk" data-id="${id}" ${i === 0 ? 'data-focus' : ''}>
        <span class="pi">${PERK_ICON[id]}</span>
        <span><b>${esc(Core.PERKS[id].name)}</b><small>${esc(Core.PERKS[id].desc)}</small></span>
        ${me.pk[id] ? `<span class="lv">SV ${me.pk[id] + 1}</span>` : ''}
      </button>`).join('');
    overlay(`<h3>BÖLÜM ${snap.floor + 1} TAMAM! 🎉</h3><p>Aşağı inmeden bir güç seç:</p><div class="perks">${cards}</div>`, 'perk');
  }

  function showWipe(snap) {
    AU.sfx('down');
    track({ wipes: (snap.stats && snap.stats.wipes) || 1 });
    overlay(`
      <h3>İKİNİZ DE BAYILDINIZ 😿</h3>
      <img class="big-ico" src="${IMG.paw}" alt="">
      <p>Ama kediler 9 canlıdır!</p>
      <p><b>Kalan can: ${snap.pd.lives}</b></p>
      <button class="px-btn primary" data-act="cont" data-focus>TEKRAR DENE ▶</button>
      <p class="wait">Kat yeniden karışır, güçlerin sende kalır.</p>`, 'wipe');
  }

  function showGameOver() {
    AU.sfx('down');
    overlay(`
      <h3>9 CANIN HEPSİ GİTTİ 🙀</h3>
      <img class="big-ico" src="${IMG.face_king}" alt="">
      <p>Kral Maymun kahkaha atıyor… ama pes etmek yok!</p>
      <button class="px-btn primary" data-act="cont" data-focus>BAŞTAN BAŞLA ▶</button>`, 'gameover');
  }

  function togglePause(force) {
    if (S.online || !S.net || !S.snap || S.snap.phase !== 'play' || S.dialog) return;
    const p = force === undefined ? !S.net.paused : force;
    S.net.paused = p;
    if (p) overlay('<h3>DURAKLATILDI ⏸</h3><p>Kediler mama molasında.</p><button class="px-btn primary" data-act="resume" data-focus>DEVAM ▶</button>', 'pause');
    else closeOverlay();
  }

  // ---------- diyalog ----------
  function dialog(lines, done) {
    if (S.dialog) S.dialog.finish(true);
    const box = document.createElement('div');
    box.className = 'dialog';
    box.setAttribute('role', 'dialog');
    $('app').appendChild(box);
    let i = 0, typing = null, chars = [];
    const faceOf = (who) => {
      const sp = SPEAKERS[who] || SPEAKERS.info;
      return sp.face ? `<img class="face" src="${sp.face}" alt="">` : `<div class="face info">${sp.emoji}</div>`;
    };
    const nameOf = (who) => (SPEAKERS[who] || SPEAKERS.info).name;
    function render() {
      const L = lines[i];
      chars = Array.from(L.text);
      box.innerHTML = `${faceOf(L.who)}<div><div class="who">${esc(nameOf(L.who))}</div><div class="txt"></div></div><span class="next">▼</span><button class="px-btn small skip">ATLA ⏭</button>`;
      const txt = box.querySelector('.txt');
      let n = 0;
      clearInterval(typing);
      typing = setInterval(() => {
        n++;
        txt.textContent = chars.slice(0, n).join('');
        if (n % 2 === 0) AU.sfx('blip');
        if (n >= chars.length) { clearInterval(typing); typing = null; }
      }, 26);
      box.querySelector('.skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); });
      if (L.who === 'king') AU.sfx('monkey');
    }
    function advance() {
      AU.unlock();
      if (typing) {
        clearInterval(typing); typing = null;
        box.querySelector('.txt').textContent = chars.join('');
        return;
      }
      i++;
      if (i >= lines.length) finish(); else render();
    }
    function finish(silent) {
      clearInterval(typing);
      box.remove();
      S.dialog = null;
      if (!silent && done) done();
      flushBanner();
    }
    box.addEventListener('click', advance);
    S.dialog = { advance, finish };
    render();
  }

  // ---------- final ----------
  function startFinal(snap) {
    if (S.finalStarted) return;
    S.finalStarted = true;
    S.finalStats = (snap.pd && snap.pd.stats) || snap.stats;
    closeOverlay();
    if (!S.online && S.net) S.net.stop();
    track({ finished_at: new Date().toISOString(), stats: S.finalStats, lives_left: snap.lives });
    AU.music('final');
    show('final');
    $('scrFinal').innerHTML = '';
    dialog(CFG.outro, showEpilation);
  }

  function finalPanel(html) { $('scrFinal').innerHTML = `<div class="panel">${html}</div>`; }

  // Kral Maymun'u epilasyona götürüyoruz: üç ağda bandına dokun, çek, kel kalsın
  function showEpilation() {
    const E = CFG.epilation || {};
    finalPanel(`
      <h2>${esc(E.title || '')}</h2>
      <p class="sub">${esc(E.tip || '')}</p>
      <canvas id="epi" class="epi" width="160" height="128" aria-label="Kral Maymun epilasyonda"></canvas>
      <p class="cry" id="epiCry">&nbsp;</p>
      <button class="px-btn primary" id="btnRip">${esc(E.button || 'ÇEK!')}</button>`);
    const cv = $('epi'), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    // bantlar: kafa, sol omuz, sağ omuz (kral 3 kat büyük çizilir)
    const strips = [
      { x: 64, y: 30, w: 34, h: 9 },
      { x: 34, y: 74, w: 26, h: 9 },
      { x: 100, y: 74, w: 26, h: 9 },
    ];
    let ripped = 0, done = false, bald = false, shake = 0, raf = 0, t = 0, last = performance.now();
    const hairs = [];
    function rip() {
      if (done) return;
      const s = strips[ripped++];
      s.fly = { vx: (s.x < 64 ? -1 : s.x > 90 ? 1 : 0.3) * 90, vy: -140, rot: 0 };
      for (let i = 0; i < 26; i++) hairs.push({ x: s.x + Math.random() * s.w, y: s.y + Math.random() * s.h, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 80, life: 1.4 });
      shake = 7;
      AU.sfx('rip');
      setTimeout(() => AU.sfx('monkey'), 150);
      $('epiCry').textContent = (E.cries || [])[ripped - 1] || '';
      if (navigator.vibrate) navigator.vibrate(60);
      if (ripped === strips.length) {
        done = true;
        setTimeout(() => {
          bald = true;
          shake = 4;
          AU.sfx('sparkle');
          $('epiCry').textContent = E.done || '';
          const b = $('btnRip');
          b.textContent = 'DEVAM ▶';
          b.onclick = () => { cancelAnimationFrame(raf); $('scrFinal').innerHTML = ''; dialog(CFG.afterEpilation || [], showPlan); };
        }, 650);
      }
    }
    function frame(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now; t += dt;
      g.fillStyle = '#ffe7ef'; g.fillRect(0, 0, 160, 128);
      g.fillStyle = '#ffd3e0';
      for (let x = 0; x < 160; x += 16) g.fillRect(x, 0, 8, 96);
      g.fillStyle = '#c99a66'; g.fillRect(0, 96, 160, 32);
      g.fillStyle = '#b07f50'; for (let x = 0; x < 160; x += 20) g.fillRect(x, 96, 1, 32);
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * shake * 2) : 0;
      shake = Math.max(0, shake - dt * 18);
      const king = bald ? SPR.kingBald : SPR.king;
      g.drawImage(king.r[Math.floor(t * 2) % 2], 32 + sx, 12, 96, 102);
      for (const s of strips) {
        if (s.fly) {
          if (s.gone) continue;
          s.fly.vy += 300 * dt; s.x += s.fly.vx * dt; s.y += s.fly.vy * dt; s.fly.rot += dt * 8;
          if (s.y > 140) { s.gone = true; continue; }
        }
        g.save();
        g.translate(s.x + s.w / 2 + (s.fly ? 0 : sx), s.y + s.h / 2);
        g.rotate(s.fly ? s.fly.rot : -0.12);
        g.fillStyle = INK; g.fillRect(-s.w / 2 - 1, -s.h / 2 - 1, s.w + 2, s.h + 2);
        g.fillStyle = '#ffd166'; g.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        g.fillStyle = '#e8a33d'; g.fillRect(-s.w / 2, s.h / 2 - 2, s.w, 2);
        if (s.fly) { g.fillStyle = '#6b4428'; for (let i = 0; i < s.w; i += 3) g.fillRect(-s.w / 2 + i, s.h / 2 - 1, 1, 3); }
        g.restore();
      }
      for (let i = hairs.length - 1; i >= 0; i--) {
        const h = hairs[i];
        h.life -= dt; h.vy += 220 * dt; h.x += h.vx * dt; h.y += h.vy * dt;
        if (h.life <= 0 || h.y > 128) { hairs.splice(i, 1); continue; }
        g.fillStyle = i % 2 ? '#9a6a43' : '#6b4428';
        g.fillRect(Math.round(h.x), Math.round(h.y), 1, 3);
      }
      if (bald) {
        const tw = Math.floor(t * 6) % 2;
        g.fillStyle = '#ffffff';
        for (const [x, y] of [[56, 22], [104, 30], [80, 8]]) { g.fillRect(x, y - tw, 1, 3 + tw * 2); g.fillRect(x - 1 - tw, y + 1, 3 + tw * 2, 1); }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    cv.addEventListener('pointerdown', (e) => {
      if (done) return;
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 160, y = ((e.clientY - r.top) / r.height) * 128;
      const s = strips[ripped];
      if (s && x > s.x - 10 && x < s.x + s.w + 10 && y > s.y - 12 && y < s.y + s.h + 12) rip();
    });
    $('btnRip').onclick = rip;
  }

  function showPlan() {
    const rows = CFG.stops.map((s, i) => `
      <div class="plan-row" style="animation-delay:${0.3 + i * 0.5}s">
        <img src="${IMG.stop[s.icon]}" alt="">
        <div><b>${s.emoji} ${esc(s.title)}</b><small>${esc(s.time)} · ${esc(s.place)}</small></div>
        <span class="n">${i + 1}</span>
      </div>`).join('');
    finalPanel(`<h2>CUMARTESİ ROTASI</h2><p class="sub">${esc(CFG.dateLabel)}</p><div class="plan-list">${rows}</div><button class="px-btn primary" id="btnAsk">VE ASIL SORU… ▶</button>`);
    CFG.stops.forEach((s, i) => setTimeout(() => AU.sfx('pick'), 300 + i * 500));
    $('btnAsk').addEventListener('click', showQuestion);
  }

  function showQuestion() {
    AU.sfx('select');
    finalPanel(`
      <img src="${IMG.cat_eda}" alt="" style="width:64px;height:64px">
      <p class="question">${esc(CFG.question)}</p>
      <div class="yes-row"><button class="px-btn primary" id="btnYes">EVET! 😻</button><button class="px-btn" id="btnNo">HAYIR</button></div>
      <p class="hint" id="noMsg"></p>`);
    $('btnYes').addEventListener('click', sayYes);
    $('btnNo').addEventListener('click', () => {
      const b = $('btnNo');
      if (b.dataset.stolen) { sayYes(); return; }
      AU.sfx('monkey');
      b.dataset.stolen = '1';
      b.textContent = 'TABİİ Kİ EVET 💕';
      b.classList.add('gold');
      $('noMsg').textContent = CFG.noStolen;
      track({ tried_no: true });
    });
  }

  function sayYes() {
    AU.sfx('yes');
    track({ answer: 'evet', answered_at: new Date().toISOString() });
    S.fireworks = 8;
    S.catsHappy = true;
    finalPanel(`<h2>YAAAY! 💕</h2><p class="question">Cumartesi görüşürüz ${esc(CFG.her)}!</p>`);
    setTimeout(showTicket, 1800);
  }

  function drawTicket() {
    const W = 760, H = 420;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = INK; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff4e3'; g.fillRect(8, 8, W - 16, H - 16);
    g.fillStyle = '#ff7aa2'; g.fillRect(8, 8, 180, H - 16);
    g.fillStyle = INK;
    for (let y = 22; y < H - 22; y += 16) g.fillRect(188, y, 4, 8);
    g.beginPath(); g.arc(190, 8, 16, 0, Math.PI); g.fill();
    g.beginPath(); g.arc(190, H - 8, 16, Math.PI, 0); g.fill();

    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.font = '700 22px "Silkscreen"';
    g.fillText('2 KİŞİLİK', 98, 64);
    g.fillText('BİLET', 98, 92);
    miniHeart(g, 83, 128, '#fff4e3', 6);
    g.drawImage(SPR.cat_eda.r[0], 30, 190, 64, 64);
    g.drawImage(SPR.cat_sarman.l[0], 100, 190, 64, 64);
    g.font = '600 20px "Pixelify Sans"';
    g.fillText(`${CFG.her} & ${CFG.him}`, 98, 290);
    g.font = '15px "Pixelify Sans"';
    g.fillText('No: 1710-2026', 98, 372);

    g.textAlign = 'left';
    g.fillStyle = '#e2557a';
    g.font = '700 30px "Silkscreen"';
    g.fillText('PATİLİ ROTA', 222, 60);
    g.fillStyle = INK;
    g.font = '20px "Pixelify Sans"';
    g.fillText(CFG.dateLabel, 224, 92);
    CFG.stops.forEach((s, i) => {
      const y = 112 + i * 58;
      g.drawImage(STOP_ICON[s.icon], 222, y, 44, 44);
      g.fillStyle = INK;
      g.font = '600 22px "Pixelify Sans"';
      g.fillText(`${i + 1}. ${s.title}`, 278, y + 20);
      g.globalAlpha = 0.7;
      g.font = '16px "Pixelify Sans"';
      g.fillText(`${s.time} · ${s.place}`, 278, y + 40);
      g.globalAlpha = 1;
    });
    const st = S.finalStats || {};
    g.font = '15px "Pixelify Sans"';
    g.fillStyle = INK;
    g.fillText(`🐾 ${st.hits || 0} pençe · 💋 ${st.kisses || 0} öpücük · 🌯 ${st.tantuni || 0} tantuni · 🐒 1 kel maymun`, 222, H - 48);
    g.fillStyle = '#e2557a';
    g.fillText(CFG.ticketNote, 222, H - 24);

    g.save();
    g.translate(W - 112, 70);
    g.rotate(-0.22);
    g.strokeStyle = '#e2557a'; g.lineWidth = 4;
    g.strokeRect(-76, -24, 152, 48);
    g.fillStyle = '#e2557a';
    g.font = '700 18px "Silkscreen"';
    g.textAlign = 'center';
    g.fillText('ONAYLANDI', 0, 7);
    g.restore();
    return c;
  }

  function showTicket() {
    const c = drawTicket();
    const url = c.toDataURL('image/png');
    finalPanel(`
      <h2>BİLETİN HAZIR 🎟️</h2>
      <img class="ticket-img" src="${url}" alt="Patili Rota bileti">
      <div class="yes-row"><button class="px-btn primary" id="btnDl">BİLETİ KAYDET 📥</button><button class="px-btn small" id="btnAgain">TEKRAR OYNA</button></div>
      <p class="hint">${esc(CFG.ticketNote)}</p>`);
    $('btnDl').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patili-rota-bilet.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Telefonda açılmazsa bilete basılı tut → Kaydet 📸', 3500);
    });
    $('btnAgain').addEventListener('click', () => location.reload());
  }

  // ---------- oyuna giriş ----------
  function enterGame() {
    show('game');
    S.finalStarted = false;
    S.lastFloor = -1;
    S.pdKey = '';
    S.snap = null;
    S.map = null;
    S.chipKey = '';
    S.zone = null;
    S.talked.clear();
    $('hudP0').dataset.k = '';
    $('hudP1').dataset.k = '';
    closeOverlay();
    resize();
  }

  function startSolo() {
    AU.unlock();
    AU.sfx('select');
    const kat = parseInt(params.get('kat'), 10);
    const net = new NET.SoloNet(0, { startFloor: kat ? Math.max(0, Math.min(Core.FLOORS.length - 1, kat - 1)) : 0 });
    S.slot = 0;
    S.online = false;
    S.net = net;
    net.on('map', onMap).on('state', onState);
    enterGame();
    track({ mode: 'solo', started_at: new Date().toISOString() });
    net.paused = true;
    net.start();
    if (!S.introShown && !kat) {
      S.introShown = true;
      dialog(CFG.intro, () => { net.paused = false; toastControls(); });
    } else net.paused = false;
  }

  function toastControls() {
    const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
    toast(touch ? 'Sol: yürü · MİYAV · 💋 öpücük' : 'Ok tuşları: yürü · Boşluk: MİYAV · E: öpücük 💋', 3600);
  }

  // ---------- lobi ----------
  function selectCat(c) {
    S.cat = c;
    document.querySelectorAll('.cat-card').forEach((b) => b.classList.toggle('on', b.dataset.cat === c));
  }

  function openLobby(code) {
    show('lobby');
    $('lobbyErr').textContent = '';
    $('lobbyStart').classList.remove('hidden');
    $('lobbyRoom').classList.add('hidden');
    if (code) $('inCode').value = code;
    selectCat(code ? 'eda' : S.cat);
  }

  async function ensureOnline() {
    if (S.net && S.net.online && S.net.ws) return S.net;
    const net = new NET.OnlineNet();
    $('lobbyErr').textContent = 'Bağlanıyor…';
    try {
      await net.connect();
    } catch (e) {
      $('lobbyErr').textContent = NET.serverUrl()
        ? 'Sunucuya bağlanılamadı. Ücretsiz sunucular ilk açılışta 30-60 sn uyanır, birazdan tekrar dene.'
        : 'Beraber mod için sunucu lazım: config.js → server adresini yaz.';
      return null;
    }
    $('lobbyErr').textContent = '';
    net.on('welcome', (m) => {
      S.slot = m.slot;
      S.lobbyCode = m.code;
      $('lobbyStart').classList.add('hidden');
      $('lobbyRoom').classList.remove('hidden');
      $('roomCode').textContent = m.code;
      $('lobbyErr').textContent = '';
    });
    net.on('lobby', onLobby);
    net.on('map', (map) => {
      if (S.screen !== 'game') {
        enterGame();
        track({ mode: 'online', room: S.lobbyCode, cat: CATS[S.slot], started_at: new Date().toISOString() });
        if (!S.introShown) { S.introShown = true; dialog(CFG.intro, toastControls); }
      }
      onMap(map);
    });
    net.on('state', (s, ev) => { if (S.screen === 'game' || S.screen === 'final') onState(s, ev); });
    net.on('error', (msg) => { if (S.screen === 'lobby') $('lobbyErr').textContent = msg; else toast(msg); });
    net.on('disconnect', () => { if (!S.dcShown) { S.dcShown = true; toast('Bağlantı koptu, tekrar bağlanıyor…', 5000); } });
    net.on('reconnect', () => { S.dcShown = false; toast('Tekrar bağlandın 🐾'); });
    S.net = net;
    S.online = true;
    return net;
  }

  function onLobby(m) {
    const prev = S.lobbyConn;
    S.lobbyConn = m.connected;
    for (let i = 0; i < 2; i++) {
      const el = $('slot' + i);
      el.className = 'slot' + (m.connected[i] ? ' on' : '');
      el.innerHTML = `<img src="${IMG['face_' + CATS[i]]}" alt=""><b>${esc(NAMES[i])}</b><span>${m.connected[i] ? (i === S.slot ? 'sen ✓' : 'bağlı ✓') : 'bekleniyor…'}</span>`;
    }
    if (S.screen === 'game') {
      for (let i = 0; i < 2; i++) {
        if (i === S.slot || prev[i] === m.connected[i]) continue;
        toast(m.connected[i] ? `${NAMES[i]} oyuna katıldı! 💕` : `${NAMES[i]} ayrıldı, kedisini yapay zekâ oynatıyor`, 3200);
      }
    }
  }

  async function share() {
    const url = location.origin + location.pathname + '?oda=' + S.lobbyCode;
    const text = `${CFG.her}, Kral Maymun planımızı çaldı! Gel beraber geri alalım 🐾`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Patili Rota', text, url }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast('Link kopyalandı 📋'); }
    catch (e) { window.prompt('Linki kopyala:', url); }
  }

  // ---------- girdiler ----------
  const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const held = [];
  const canPlay = () => S.net && S.screen === 'game';
  function press(d) {
    const i = held.indexOf(d);
    if (i >= 0) held.splice(i, 1);
    held.push(d);
    if (canPlay()) S.net.send({ t: 'dir', d, q: true });
  }
  function release(d) {
    const i = held.indexOf(d);
    if (i < 0) return;
    held.splice(i, 1);
    if (canPlay()) S.net.send({ t: 'dir', d: held[held.length - 1] || null });
  }
  function releaseAll() {
    held.length = 0;
    if (canPlay()) S.net.send({ t: 'dir', d: null });
  }
  function meow() {
    if (canPlay() && S.snap && S.snap.phase === 'play') S.net.send({ t: 'meow' });
  }
  function kiss() {
    if (canPlay() && S.snap && S.snap.phase === 'play' && !S.dialog) S.net.send({ t: 'kiss' });
  }

  addEventListener('keydown', (e) => {
    AU.unlock();
    if (S.dialog) {
      if (['Enter', 'Space', 'KeyZ', 'KeyX'].includes(e.code)) { e.preventDefault(); S.dialog.advance(); }
      else if (e.code === 'Escape') S.dialog.finish();
      return;
    }
    if (!$('overlay').classList.contains('hidden')) {
      if (S.overlayKind === 'perk' && /^[1-3]$/.test(e.key)) {
        const b = $('ovBox').querySelectorAll('.perk')[Number(e.key) - 1];
        if (b) b.click();
      }
      if (S.overlayKind === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) togglePause(false);
      if (S.overlayKind === 'photo' && e.code === 'Escape') { closeOverlay(); resumeGame(); }
      if (S.overlayKind === 'photo' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        const b = $('ovBox').querySelector(`[data-p="${e.code === 'ArrowLeft' ? -1 : 1}"]`);
        if (b) b.click();
      }
      return;
    }
    if (S.screen !== 'game') return;
    const d = KEYS[e.code];
    if (d) { e.preventDefault(); if (!e.repeat) press(d); return; }
    if (['Space', 'KeyJ', 'KeyX'].includes(e.code)) { e.preventDefault(); if (!e.repeat) meow(); return; }
    if (['KeyE', 'KeyK', 'KeyQ'].includes(e.code)) { e.preventDefault(); if (!e.repeat) kiss(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });
  addEventListener('keyup', (e) => { const d = KEYS[e.code]; if (d) release(d); });
  addEventListener('blur', releaseAll);

  const dpad = $('dpad');
  let padId = null, padDir = null;
  function padUpdate(e) {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    let d = null;
    if (Math.hypot(dx, dy) > r.width * 0.12) d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (d === padDir) return;
    if (padDir) release(padDir);
    padDir = d;
    if (d) { press(d); if (navigator.vibrate) navigator.vibrate(6); }
    dpad.dataset.dir = d || '';
  }
  function padEnd(e) {
    if (e.pointerId !== padId) return;
    if (padDir) release(padDir);
    padDir = null; padId = null;
    dpad.dataset.dir = '';
  }
  dpad.addEventListener('pointerdown', (e) => { AU.unlock(); padId = e.pointerId; dpad.setPointerCapture(e.pointerId); padUpdate(e); e.preventDefault(); });
  dpad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padUpdate(e); });
  dpad.addEventListener('pointerup', padEnd);
  dpad.addEventListener('pointercancel', padEnd);
  const meowBtn = $('btnMeow');
  meowBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); AU.unlock(); meow(); meowBtn.classList.add('press'); if (navigator.vibrate) navigator.vibrate(15); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => meowBtn.addEventListener(ev, () => meowBtn.classList.remove('press')));
  const kissBtn = $('btnKiss');
  kissBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); AU.unlock(); kiss(); kissBtn.classList.add('press'); if (navigator.vibrate) navigator.vibrate(12); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => kissBtn.addEventListener(ev, () => kissBtn.classList.remove('press')));
  document.addEventListener('contextmenu', (e) => { if (S.screen === 'game') e.preventDefault(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { releaseAll(); if (S.screen === 'game' && !S.online) togglePause(true); }
  });

  // ---------- başlangıç ----------
  function syncSound() {
    const ic = AU.on ? '🔊' : '🔇';
    $('btnSound').textContent = ic;
    $('btnSound2').textContent = ic;
  }
  for (const id of ['btnSound', 'btnSound2']) {
    $(id).addEventListener('click', (e) => { e.stopPropagation(); AU.unlock(); AU.toggle(); syncSound(); });
  }
  syncSound();

  $('titlePre').textContent = `${CFG.her} için özel bir macera`;
  $('pickEda').src = IMG.cat_eda;
  $('pickSarman').src = IMG.cat_sarman;
  $('pickEdaName').textContent = CFG.her;
  $('pickSarmanName').textContent = CFG.him;
  const invite = (params.get('oda') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (!CFG.coop) $('btnCoop').classList.add('hidden');
  if (CFG.coop && invite.length === 4) {
    S.inviteCode = invite;
    $('inviteBox').innerHTML = `💌 Bir davetin var! Oda <b>${esc(invite)}</b>`;
    $('inviteBox').classList.remove('hidden');
    $('btnCoop').textContent = '♥ DAVETE KATIL';
  }
  $('btnSolo').addEventListener('click', startSolo);
  $('btnCoop').addEventListener('click', () => { AU.unlock(); AU.sfx('select'); openLobby(S.inviteCode); });
  $('btnBack').addEventListener('click', () => {
    AU.sfx('select');
    if (S.net && S.net.online) { S.net.stop(); S.net = null; S.online = false; }
    show('title');
  });
  document.querySelectorAll('.cat-card').forEach((b) => b.addEventListener('click', () => { AU.unlock(); AU.sfx('select'); selectCat(b.dataset.cat); }));
  $('btnCreate').addEventListener('click', async () => { AU.unlock(); const net = await ensureOnline(); if (net) net.create(S.cat); });
  $('btnJoin').addEventListener('click', async () => {
    AU.unlock();
    const code = $('inCode').value.trim().toUpperCase();
    if (code.length !== 4) { $('lobbyErr').textContent = '4 harfli oda kodunu yaz 🐾'; return; }
    const net = await ensureOnline();
    if (net) net.join(code, S.cat);
  });
  $('inCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btnJoin').click(); });
  $('btnBegin').addEventListener('click', () => { AU.unlock(); AU.sfx('select'); if (S.net) S.net.begin(); });
  $('btnShare').addEventListener('click', share);

  addEventListener('resize', () => { resizeBg(); if (S.screen === 'game') resize(); });
  resizeBg();
  AU.music('title');

  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    S.time += dt;
    requestAnimationFrame(frame);
    try {
      if (S.screen === 'game') renderGame(dt);
      else drawBg(dt);
    } catch (err) {
      if (!frame.warned) { frame.warned = true; console.error(err); }
    }
  }
  requestAnimationFrame(frame);
})();
