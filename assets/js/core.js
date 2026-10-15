/* Patili Rota — oyun çekirdeği.
   Aynı kod hem tarayıcıda (tek oyunculu) hem Node sunucusunda (beraber mod) çalışır.
   Oyun 20 tick/sn ilerler; tüm kararlar burada verilir, istemci sadece çizer.

   Harita karakterleri:
   '#' duvar · '.' zemin · 'd' dekor · 'c' çatlak duvar (gizli geçit) · 'P' fotoğraf çerçeveli duvar
   'm' anı odası zemini · 'f' komiklik odası zemini · 'h' anı odası dekoru · 'j' komiklik odası dekoru */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PatiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = 2;
  const TICK_MS = 50;
  const REVIVE_TICKS = 36;
  const START_HP = 10;
  const MAX_HP = 16;
  const KISS_HEAL = 5;
  const KISS_CD = 360;
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const DIR_NAMES = Object.keys(DIRS);
  const WALLS = '#cP';
  const isWall = (ch) => WALLS.includes(ch);

  // 8 bölüm: her durak iki kat. part 0 = sayfanın ilk yarısı, part 1 = ikinci yarısı
  const FLOORS = [
    { key: 'kahvalti', stop: 0, part: 0, name: 'Kahvaltı Sarayı', w: 34, h: 26, rooms: 7, items: 6, traps: 0,
      enemies: { egg: 4, teapot: 2 } },
    { key: 'kahvalti', stop: 0, part: 1, name: 'Kahvaltı Sarayı', w: 36, h: 28, rooms: 8, items: 7, traps: 1,
      enemies: { egg: 5, teapot: 3, monkey: 1 } },
    { key: 'kahve', stop: 1, part: 0, name: 'Kahve Dükkânı', w: 38, h: 28, rooms: 8, items: 7, traps: 2,
      enemies: { ghost: 3, bean: 3, monkey: 1 } },
    { key: 'kahve', stop: 1, part: 1, name: 'Kahve Dükkânı', w: 40, h: 30, rooms: 9, items: 8, traps: 3,
      enemies: { ghost: 4, bean: 4, monkey: 2, teapot: 1 } },
    { key: 'yuruyus', stop: 2, part: 0, name: 'Gizemli Park', w: 40, h: 30, rooms: 9, items: 8, traps: 2,
      enemies: { pigeon: 4, ball: 3, monkey: 2 } },
    { key: 'yuruyus', stop: 2, part: 1, name: 'Gizemli Park', w: 42, h: 30, rooms: 9, items: 8, traps: 3,
      enemies: { pigeon: 5, ball: 3, monkey: 2, bean: 2 } },
    { key: 'aksam', stop: 3, part: 0, name: "Kral Maymun'un Sofrası", w: 42, h: 32, rooms: 9, items: 9, traps: 3,
      enemies: { monkey: 5, ghost: 2, bean: 2, pigeon: 2 } },
    { key: 'aksam', stop: 3, part: 1, name: "Kral Maymun'un Sofrası", w: 44, h: 32, rooms: 9, items: 9, traps: 3,
      enemies: { monkey: 4, ghost: 2, bean: 2, pigeon: 2 }, boss: true },
  ];

  // spd: kaç tickte bir hareket · windup: saldırmadan önce bekleme · dmg: [en az, en çok] hasar
  const ENEMY = {
    egg:    { hp: 1,  spd: 10, aggro: 6, ai: 'chase',   windup: 8,  dmg: [1, 2], name: 'Kaçak Yumurta' },
    teapot: { hp: 2,  spd: 16, aggro: 7, ai: 'shooter', windup: 9,  dmg: [2, 3], name: 'Fokur Çaydanlık' },
    ball:   { hp: 2,  spd: 4,  aggro: 0, ai: 'bounce',  windup: 0,  dmg: [2, 2], name: 'Kaçak Top' },
    ghost:  { hp: 2,  spd: 12, aggro: 8, ai: 'chase',   windup: 9,  dmg: [2, 2], name: 'Esneme Hayaleti', sleepy: true },
    bean:   { hp: 1,  spd: 6,  aggro: 7, ai: 'chase',   windup: 7,  dmg: [1, 2], name: 'Kafein Çekirdeği' },
    pigeon: { hp: 2,  spd: 5,  aggro: 7, ai: 'chase',   windup: 7,  dmg: [1, 2], name: 'Simit Avcısı Güvercin' },
    monkey: { hp: 3,  spd: 7,  aggro: 7, ai: 'thief',   windup: 7,  dmg: [2, 2], name: 'Kıllı Maymun', hairy: true },
    pagem:  { hp: 5,  spd: 8,  aggro: 8, ai: 'chase',   windup: 8,  dmg: [2, 3], name: 'Kıllı Sayfa Hırsızı', page: true, hairy: true },
    king:   { hp: 40, spd: 12, aggro: 6, ai: 'boss',    windup: 11, dmg: [3, 3], name: 'Kral Maymun', big: true, hairy: true },
  };
  const PROJ_DMG = { steam: 2, banana: 2, kil: 2 };

  const ITEMS = {
    simit:   { name: 'Simit', desc: '+2 can' },
    kahve:   { name: 'Kahve', desc: 'Hız!' },
    yumak:   { name: 'Yün Yumağı', desc: 'Pençe x2' },
    tantuni: { name: 'Tantuni', desc: 'İkinizin de canı dolar!' },
    balik:   { name: 'Balık', desc: '+2 maks. can' },
    kediotu: { name: 'Kedi Otu', desc: 'Dokunulmaz mod!' },
    mektup:  { name: 'Aşk Mektubu', desc: 'Maks. can +2, canın dolar' },
    page:    { name: 'Plan Sayfası', desc: '' },
  };
  const ITEM_WEIGHTS = { simit: 46, kahve: 18, yumak: 13, tantuni: 9, balik: 6, kediotu: 6 };

  const PERKS = {
    tirnak: { name: 'Keskin Tırnak', desc: 'Pençe hasarı +1' },
    kalp:   { name: 'Dokuzuncu Can', desc: 'Maks. can +2, canın dolar' },
    hiz:    { name: 'Fırtına Pati', desc: 'Daha hızlı yürürsün' },
    miyav:  { name: 'Gür Miyav', desc: 'Miyav daha geniş ve sık' },
    mirmir: { name: 'Mırmır', desc: 'Partnerinin dibindeyken can yenilenir' },
    sans:   { name: 'Kedi Şansı', desc: 'Düşmanlar daha çok eşya düşürür' },
    yastik: { name: 'Yumuşak Pati', desc: 'Her katta 1 darbeyi engelleyen kalkan' },
    ikili:  { name: 'Birlikte Güçlü', desc: 'Partnerine yakınken hasar +1' },
  };

  // ---------- yardımcılar ----------
  function makeRng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
      weighted(table) {
        let sum = 0;
        for (const k in table) sum += table[k];
        let r = next() * sum;
        for (const k in table) { r -= table[k]; if (r < 0) return k; }
        return Object.keys(table)[0];
      },
    };
  }
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const manh = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  function newPlayer(slot) {
    return {
      slot, x: 0, y: 0, f: 1, hp: START_HP, mh: START_HP, down: false, rv: 0, inv: 0, mcd: 0,
      held: null, q: null, wantMeow: false, wantKiss: false, meowCd: 0, kissCd: 0, purr: 0, shield: 0,
      eff: { coffee: 0, yarn: 0, nip: 0, sleepy: 0 }, perks: {}, ai: false, kills: 0,
    };
  }

  // ---------- kat üretimi ----------
  function generateFloor(rng, fi, secretKind) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const g = tryGenerate(rng, fi, secretKind);
      if (g) return g;
    }
    return tryGenerate(rng, fi, null);
  }

  function tryGenerate(rng, fi, secretKind) {
    const F = FLOORS[fi];
    const W = F.w + (secretKind ? 10 : 0), H = F.h + (secretKind ? 4 : 0);
    const t = Array.from({ length: H }, () => new Array(W).fill('#'));
    const inb = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1;
    const carve = (x, y) => { if (inb(x, y)) t[y][x] = '.'; };
    const mkRoom = (x, y, w, h, boss) => ({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1), boss: !!boss });
    const rooms = [];
    const overlaps = (r) => rooms.some((o) => !(r.x + r.w + 2 <= o.x || o.x + o.w + 2 <= r.x || r.y + r.h + 2 <= o.y || o.y + o.h + 2 <= r.y));

    if (F.boss) rooms.push(mkRoom(rng.int(2, F.w - 16), rng.int(2, F.h - 13), 13, 10, true));
    for (let i = 0; i < 600 && rooms.length < F.rooms; i++) {
      const w = rng.int(6, 10), h = rng.int(5, 8);
      const r = mkRoom(rng.int(1, F.w - w - 1), rng.int(2, F.h - h - 1), w, h);
      if (!overlaps(r)) rooms.push(r);
    }
    for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);

    // Odaları en kısa ağaçla bağla (Prim), sonra birkaç döngü ekle
    const inTree = [0];
    const outTree = rooms.map((_, i) => i).slice(1);
    const edges = [];
    while (outTree.length) {
      let best = null;
      for (const a of inTree) for (const b of outTree) {
        const d = Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy);
        if (!best || d < best.d) best = { a, b, d };
      }
      edges.push(best);
      inTree.push(best.b);
      outTree.splice(outTree.indexOf(best.b), 1);
    }
    for (let k = 0; k < 2 && rooms.length > 3; k++) {
      const a = rng.int(0, rooms.length - 1), b = rng.int(0, rooms.length - 1);
      if (a !== b) edges.push({ a, b });
    }
    const hall = (x1, x2, y) => { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2) + 1; x++) { carve(x, y); carve(x, y + 1); } };
    const vall = (y1, y2, x) => { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2) + 1; y++) { carve(x, y); carve(x + 1, y); } };
    for (const { a, b } of edges) {
      const A = rooms[a], B = rooms[b];
      if (rng.chance(0.5)) { hall(A.cx, B.cx, A.cy); vall(A.cy, B.cy, B.cx); }
      else { vall(A.cy, B.cy, A.cx); hall(A.cx, B.cx, B.cy); }
    }

    const bfs = (sx, sy) => {
      const d = new Int16Array(W * H).fill(-1);
      const q = [sy * W + sx];
      d[q[0]] = 0;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of Object.values(DIRS)) {
          const nx = x + dx, ny = y + dy, j = ny * W + nx;
          if (t[ny] && t[ny][nx] === '.' && d[j] < 0) { d[j] = d[i] + 1; q.push(j); }
        }
      }
      return d;
    };
    let start, exit;
    if (F.boss) {
      exit = rooms[0];
      const d = bfs(exit.cx, exit.cy);
      start = rooms.slice(1).reduce((m, r) => (d[r.cy * W + r.cx] > d[m.cy * W + m.cx] ? r : m), rooms[1]);
    } else {
      start = rng.pick(rooms);
      const d = bfs(start.cx, start.cy);
      exit = rooms.reduce((m, r) => (d[r.cy * W + r.cx] > d[m.cy * W + m.cx] ? r : m), rooms[0]);
    }

    const reserved = new Set();
    const reserve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) reserved.add(y * W + x); };
    reserve(start.cx - 1, start.cy - 1, start.cx + 2, start.cy + 1);
    reserve(exit.cx - 2, exit.cy - 2, exit.cx + 2, exit.cy + 2);

    // Dost karakter (NPC): başlangıç odasında, etrafı boş bir hücre
    let npc = null;
    const npcCands = [];
    for (let y = start.y + 1; y < start.y + start.h - 1; y++) for (let x = start.x + 1; x < start.x + start.w - 1; x++) {
      if (reserved.has(y * W + x)) continue;
      let ok = true;
      for (let yy = y - 1; yy <= y + 1 && ok; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (t[yy][xx] !== '.') { ok = false; break; }
      if (ok) npcCands.push([x, y, Math.abs(x - start.cx) + Math.abs(y - (start.cy - 2))]);
    }
    if (npcCands.length) {
      npcCands.sort((a, b) => a[2] - b[2]);
      npc = [npcCands[0][0], npcCands[0][1]];
      reserve(npc[0] - 1, npc[1] - 1, npc[0] + 1, npc[1] + 1);
    }

    // Gizli oda: çatlak bir duvarın arkasında, düz bir tünelle bağlı
    let secret = null;
    if (secretKind) {
      secret = placeSecret(rng, t, W, H, secretKind);
      if (!secret) return null;
    }

    // Dekor: etrafı tamamen boş tekil engeller, yollar asla kapanmaz
    for (const r of rooms) {
      const n = r.boss ? 2 : Math.floor((r.w * r.h) / 14);
      for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
        const x = rng.int(r.x + 1, r.x + r.w - 2), y = rng.int(r.y + 1, r.y + r.h - 2);
        if (reserved.has(y * W + x)) continue;
        let ok = true;
        for (let yy = y - 1; yy <= y + 1 && ok; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (t[yy][xx] !== '.') { ok = false; break; }
        if (!ok) continue;
        t[y][x] = 'd';
        k++;
      }
    }

    const cellCache = new Map();
    const used = new Set(reserved);
    const take = (r) => {
      if (!cellCache.has(r)) {
        const cs = [];
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (t[y][x] === '.') cs.push([x, y]);
        cellCache.set(r, rng.shuffle(cs));
      }
      for (const [x, y] of cellCache.get(r)) {
        const k = y * W + x;
        if (!used.has(k)) { used.add(k); return [x, y]; }
      }
      return null;
    };
    const others = rooms.filter((r) => r !== start && !r.boss);
    const spawns = { enemies: [], items: [], traps: [] };
    for (const [type, count] of Object.entries(F.enemies)) {
      for (let i = 0; i < count; i++) {
        const pos = take(rng.pick(others));
        if (pos) spawns.enemies.push({ type, x: pos[0], y: pos[1] });
      }
    }
    if (F.boss) spawns.enemies.push({ type: 'king', x: exit.cx - 1, y: exit.cy - 1 });
    else spawns.enemies.push({ type: 'pagem', x: exit.cx, y: exit.cy + 1 });
    for (let i = 0; i < F.items; i++) {
      const pos = take(rng.pick(rooms.filter((r) => !r.boss)));
      if (pos) spawns.items.push({ type: rng.weighted(ITEM_WEIGHTS), x: pos[0], y: pos[1] });
    }
    for (let i = 0; i < F.traps; i++) {
      const pos = take(rng.pick(others));
      if (pos) spawns.traps.push({ x: pos[0], y: pos[1] });
    }
    if (secret) {
      const gifts = secret.kind === 'memory' ? ['mektup', 'simit'] : ['kediotu', 'yumak'];
      gifts.forEach((type, i) => { const [x, y] = secret.gifts[i]; spawns.items.push({ type, x, y }); });
    }

    return {
      W, H, tiles: t, start: [start.cx, start.cy], stairs: F.boss ? null : [exit.cx, exit.cy],
      npc, secret: secret ? { kind: secret.kind, crack: secret.crack } : null, spawns,
    };
  }

  function placeSecret(rng, t, W, H, kind) {
    const rw = 9, rh = 5;
    const zone = kind === 'memory' ? 'm' : 'f';
    const deco = kind === 'memory' ? 'h' : 'j';
    const wallAt = (x, y) => y >= 0 && x >= 0 && y < H && x < W && t[y][x] === '#';
    for (let tries = 0; tries < 600; tries++) {
      const x = rng.int(2, W - rw - 2), y = rng.int(3, H - rh - 2);
      let clear = true;
      for (let yy = y - 2; yy <= y + rh + 1 && clear; yy++) for (let xx = x - 2; xx <= x + rw + 1; xx++) if (!wallAt(xx, yy)) { clear = false; break; }
      if (!clear) continue;
      // Odadan dışarı (sol, sağ, alt) düz tünel: mevcut zemine en kısa yol
      const origins = [];
      for (let yy = y + 1; yy <= y + rh - 2; yy++) { origins.push([x, yy, -1, 0]); origins.push([x + rw - 1, yy, 1, 0]); }
      for (let xx = x + 1; xx <= x + rw - 2; xx++) origins.push([xx, y + rh - 1, 0, 1]);
      let best = null;
      for (const [ox, oy, dx, dy] of origins) {
        const path = [];
        for (let k = 1; k <= 10; k++) {
          const cx = ox + dx * k, cy = oy + dy * k;
          if (cy < 1 || cx < 1 || cy >= H - 1 || cx >= W - 1) break;
          const ch = t[cy][cx];
          if (ch === '.') {
            if (path.length >= 2 && (!best || path.length < best.path.length)) best = { path };
            break;
          }
          if (ch !== '#') break;
          // tünel başka zeminlere sürtünmesin
          if (dx ? !wallAt(cx, cy - 1) || !wallAt(cx, cy + 1) : !wallAt(cx - 1, cy) || !wallAt(cx + 1, cy)) break;
          path.push([cx, cy]);
        }
      }
      if (!best) continue;
      for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) t[yy][xx] = zone;
      best.path.forEach(([px, py], i) => { t[py][px] = i === best.path.length - 1 ? 'c' : zone; });
      for (const fx of [x + 1, x + 4, x + 7]) t[y - 1][fx] = 'P';
      // köşelere süs, ortada hediyeler
      for (const [dx, dy] of [[1, 1], [rw - 2, 1], [1, rh - 2], [rw - 2, rh - 2]]) {
        if (rng.chance(0.75)) t[y + dy][x + dx] = deco;
      }
      const crack = best.path[best.path.length - 1];
      return { kind, crack, gifts: [[x + 3, y + 2], [x + 5, y + 2]] };
    }
    return null;
  }

  // ---------- oyun ----------
  class Game {
    constructor(opts = {}) {
      this.seed = (opts.seed >>> 0) || ((Math.random() * 4294967296) >>> 0);
      this.rng = makeRng(this.seed);
      this.now = 0;
      this.players = [newPlayer(0), newPlayer(1)];
      const ai = opts.ai || [false, false];
      this.players.forEach((p, i) => { p.ai = !!ai[i]; });
      this.floor = Math.max(0, Math.min(FLOORS.length - 1, opts.startFloor | 0));
      this.lives = 9;
      this.pages = [];
      for (let i = 0; i < this.floor; i++) this.pages.push(i);
      this.phase = 'play';
      this.pd = null;
      this.stats = { kills: 0, meows: 0, tantuni: 0, steals: 0, wipes: 0, hits: 0, ticks: 0, kisses: 0, secrets: 0 };
      this.ev = [];
      this.uid = 1;
      this.mv = 0;
      this.pickSecretFloors(opts.secretFloors);
      this.buildFloor();
    }

    // Anı ve komiklik odaları her koşuda farklı katlarda (ilk ve son kat hariç)
    pickSecretFloors(force) {
      if (force) { this.secretFloors = force; return; }
      const cands = this.rng.shuffle([1, 2, 3, 4, 5, 6]);
      this.secretFloors = { memory: cands[0], funny: cands[1] };
    }

    emit(k, data) { this.ev.push(Object.assign({ k }, data)); }

    buildFloor() {
      const sf = this.secretFloors;
      const secretKind = sf.memory === this.floor ? 'memory' : sf.funny === this.floor ? 'funny' : null;
      const g = generateFloor(this.rng, this.floor, secretKind);
      this.W = g.W; this.H = g.H; this.tiles = g.tiles;
      this.secret = g.secret;
      this.enemies = []; this.items = []; this.proj = []; this.traps = [];
      this.npcs = g.npc ? [{ id: this.uid++, k: FLOORS[this.floor].stop, x: g.npc[0], y: g.npc[1] }] : [];
      this.stairs = g.stairs ? { x: g.stairs[0], y: g.stairs[1], open: false } : null;
      this.pdist = null;
      this.floorTick = 0;
      this.slamShown = false;
      this.mv++;
      const [sx, sy] = g.start;
      this.players.forEach((p, i) => {
        p.x = sx + i; p.y = sy;
        if (p.down) { p.down = false; p.hp = 3; }
        p.rv = 0; p.inv = 30; p.held = null; p.q = null; p.mcd = 0; p.wantMeow = false; p.wantKiss = false; p.meowCd = 0;
        p.shield = p.perks.yastik || 0;
        p.eff = { coffee: 0, yarn: 0, nip: 0, sleepy: 0 };
      });
      for (const s of g.spawns.enemies) this.addEnemy(s.type, s.x, s.y);
      for (const s of g.spawns.items) this.addItem(s.type, s.x, s.y);
      for (const s of g.spawns.traps) this.traps.push({ id: this.uid++, x: s.x, y: s.y, off: this.rng.int(0, 95) });
      this.emit('floor', { n: this.floor });
    }

    addEnemy(type, x, y, extra) {
      const d = ENEMY[type];
      let hp = d.hp;
      if (type === 'pagem') hp = d.hp + this.floor;
      else if (!d.big) hp += Math.floor(this.floor / 3);
      const e = {
        id: this.uid++, type, x, y, hp, mh: hp, cd: this.rng.int(0, d.spd), stun: 0,
        windup: 0, wdx: 0, wdy: 0, flash: 0, aggro: false, f: 1, stolen: null, flee: 0,
        dx: 0, dy: 0, tcd: 40, scd: 140, shootCd: this.rng.int(10, 40), dead: false, throws: 0,
      };
      if (type === 'ball') {
        const [dx, dy] = this.rng.pick(Object.values(DIRS));
        e.dx = dx; e.dy = dy;
      }
      Object.assign(e, extra);
      this.enemies.push(e);
      return e;
    }

    addItem(t, x, y, extra) {
      const it = Object.assign({ id: this.uid++, t, x, y }, extra);
      this.items.push(it);
      return it;
    }

    // ----- harita sorguları -----
    tile(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H ? this.tiles[y][x] : '#'; }
    walkable(x, y) { const ch = this.tile(x, y); return ch === '.' || ch === 'm' || ch === 'f'; }
    setTile(x, y, ch) { this.tiles[y][x] = ch; this.emit('tile', { x, y, ch }); }
    npcAt(x, y) { return this.npcs.find((n) => n.x === x && n.y === y) || null; }
    occupies(e, x, y) { return ENEMY[e.type].big ? x >= e.x && x <= e.x + 1 && y >= e.y && y <= e.y + 1 : e.x === x && e.y === y; }
    enemyAt(x, y, except) { return this.enemies.find((e) => e !== except && !e.dead && this.occupies(e, x, y)) || null; }
    playerAt(x, y, aliveOnly) { return this.players.find((p) => p.x === x && p.y === y && !(aliveOnly && p.down)) || null; }
    distToEnemy(p, e) {
      if (!ENEMY[e.type].big) return cheb(p, e);
      const dx = p.x < e.x ? e.x - p.x : p.x > e.x + 1 ? p.x - e.x - 1 : 0;
      const dy = p.y < e.y ? e.y - p.y : p.y > e.y + 1 ? p.y - e.y - 1 : 0;
      return Math.max(dx, dy);
    }

    bfsFrom(x, y) {
      const key = y * this.W + x;
      if (this.bfsCache.has(key)) return this.bfsCache.get(key);
      const d = this.floodFrom([[x, y]]);
      this.bfsCache.set(key, d);
      return d;
    }

    floodFrom(points) {
      const W = this.W, N = W * this.H;
      const d = new Int16Array(N).fill(32767);
      const q = new Int32Array(N);
      let qh = 0, qt = 0;
      for (const [x, y] of points) {
        const i = y * W + x;
        if (d[i] !== 0) { d[i] = 0; q[qt++] = i; }
      }
      while (qh < qt) {
        const i = q[qh++], x = i % W, y = (i / W) | 0, nd = d[i] + 1;
        for (const [dx, dy] of Object.values(DIRS)) {
          const nx = x + dx, ny = y + dy;
          if (!this.walkable(nx, ny)) continue;
          const j = ny * W + nx;
          if (d[j] > nd) { d[j] = nd; q[qt++] = j; }
        }
      }
      return d;
    }

    // ----- ana döngü -----
    step() {
      this.ev = [];
      this.now++;
      this.bfsCache = new Map();
      if (this.phase === 'play') {
        this.floorTick++;
        this.stats.ticks++;
        for (const p of this.players) if (p.ai) this.aiThink(p);
        for (const p of this.players) this.updatePlayer(p);
        this.pdist = this.floodFrom(this.players.filter((p) => !p.down).map((p) => [p.x, p.y]));
        for (const e of this.enemies.slice()) if (!e.dead) this.updateEnemy(e);
        this.updateProjectiles();
        this.updateTraps();
        if (this.phase === 'play' && this.players.every((p) => p.down)) this.wipe();
      } else if (this.phase === 'perk') {
        this.players.forEach((p, i) => {
          if (p.ai && this.pd && !this.pd.picked[i]) this.pickPerk(i, this.rng.pick(this.pd.opts[i]));
        });
      }
      return this.ev;
    }

    setPhase(name, data) {
      this.phase = name;
      this.pd = data || null;
      for (const p of this.players) { p.held = null; p.q = null; p.wantMeow = false; p.wantKiss = false; }
      this.emit('phase', { p: name });
    }

    input(slot, m) {
      const p = this.players[slot];
      if (!p || !m || typeof m !== 'object') return;
      switch (m.t) {
        case 'dir':
          if (m.d === null || Object.prototype.hasOwnProperty.call(DIRS, m.d)) {
            p.held = m.d;
            if (m.d && m.q) p.q = m.d;
          }
          break;
        case 'meow': if (this.phase === 'play') p.wantMeow = true; break;
        case 'kiss': if (this.phase === 'play') p.wantKiss = true; break;
        case 'cont': this.cont(slot); break;
        case 'perk': this.pickPerk(slot, m.id); break;
      }
    }

    setAI(slot, on) {
      const p = this.players[slot];
      if (!p) return;
      p.ai = !!on;
      p.held = null; p.q = null;
    }

    // ----- oyuncular -----
    moveDelay(p) {
      let d = 165 * Math.pow(0.85, p.perks.hiz || 0);
      if (p.eff.coffee) d *= 0.65;
      if (p.eff.sleepy) d *= 1.6;
      return Math.max(70, d);
    }

    updatePlayer(p) {
      const o = this.players[1 - p.slot];
      if (p.inv > 0) p.inv--;
      for (const k in p.eff) if (p.eff[k] > 0) p.eff[k]--;
      if (p.meowCd > 0) p.meowCd--;
      if (p.kissCd > 0) p.kissCd--;
      if (p.down) {
        if (!o.down && cheb(p, o) <= 1) {
          p.rv++;
          if (p.rv >= REVIVE_TICKS) this.revive(p, false);
        } else if (p.rv > 0) p.rv--;
        p.q = null; p.wantMeow = false; p.wantKiss = false;
        return;
      }
      if (p.perks.mirmir && !o.down && cheb(p, o) <= 1 && p.hp < p.mh) {
        if (++p.purr >= Math.round(110 / p.perks.mirmir)) {
          p.purr = 0; p.hp++;
          this.emit('heal', { s: p.slot, x: p.x, y: p.y });
        }
      }
      if (p.wantMeow) { p.wantMeow = false; this.doMeow(p); }
      if (p.wantKiss) { p.wantKiss = false; this.doKiss(p); }

      p.mcd = Math.max(p.mcd - TICK_MS, -TICK_MS);
      const dir = p.q || p.held;
      if (!dir || p.mcd > 0) return;
      p.q = null;
      const [dx, dy] = DIRS[dir];
      if (dx) p.f = dx;
      const nx = p.x + dx, ny = p.y + dy;
      const e = this.enemyAt(nx, ny);
      if (e) {
        this.playerAttack(p, e, nx, ny);
        p.mcd += this.moveDelay(p) + 50;
        return;
      }
      if (this.bump(p, nx, ny)) { p.mcd += this.moveDelay(p) + 120; return; }
      if (!this.walkable(nx, ny)) return;
      p.x = nx; p.y = ny;
      p.mcd += this.moveDelay(p);
      this.onEnter(p);
    }

    // Yürünemeyen ama tepki veren şeyler: dostlar, çatlak duvar, çerçeveler, gizli oda süsleri
    bump(p, x, y) {
      const npc = this.npcAt(x, y);
      if (npc) { if (!p.ai) this.emit('talk', { n: npc.k, id: npc.id }); return true; }
      if (p.ai) return false;
      const ch = this.tile(x, y);
      if (ch === 'c' && this.secret) {
        const zone = this.secret.kind === 'memory' ? 'm' : 'f';
        this.setTile(x, y, zone);
        this.stats.secrets++;
        this.emit('secret', { kind: this.secret.kind, x, y });
        return true;
      }
      if (ch === 'P' && this.secret) {
        const frames = [];
        for (let yy = 0; yy < this.H; yy++) for (let xx = 0; xx < this.W; xx++) if (this.tiles[yy][xx] === 'P') frames.push(yy * this.W + xx);
        this.emit('photo', { kind: this.secret.kind, i: Math.max(0, frames.indexOf(y * this.W + x)) });
        return true;
      }
      if (ch === 'h' || ch === 'j') { this.emit(ch === 'h' ? 'aww' : 'joke', { x, y }); return true; }
      return false;
    }

    onEnter(p) {
      for (const it of this.items.filter((i) => i.x === p.x && i.y === p.y)) {
        this.items.splice(this.items.indexOf(it), 1);
        this.applyItem(p, it);
        if (this.phase !== 'play') return;
      }
      const s = this.stairs;
      if (s && s.open && !p.ai && p.x === s.x && p.y === s.y) this.enterStairs(p);
    }

    applyItem(p, it) {
      this.emit('pick', { s: p.slot, t: it.t, x: it.x, y: it.y });
      switch (it.t) {
        case 'simit': p.hp = Math.min(p.mh, p.hp + 2); break;
        case 'kahve': p.eff.coffee = 170; break;
        case 'yumak': p.eff.yarn = 220; break;
        case 'kediotu': p.eff.nip = 150; break;
        case 'balik': p.mh = Math.min(MAX_HP, p.mh + 2); p.hp = Math.min(p.mh, p.hp + 2); break;
        case 'mektup': p.mh = Math.min(MAX_HP, p.mh + 2); p.hp = p.mh; break;
        case 'tantuni':
          this.stats.tantuni++;
          for (const q of this.players) { if (q.down) this.revive(q, true); q.hp = q.mh; }
          break;
        case 'page': {
          if (!this.pages.includes(it.n)) this.pages.push(it.n);
          const F = FLOORS[it.n];
          this.setPhase('page', { n: it.n, stop: F.stop, part: F.part, by: p.slot });
          break;
        }
      }
    }

    playerAttack(p, e, tx, ty) {
      const o = this.players[1 - p.slot];
      let dmg = 1 + (p.perks.tirnak || 0);
      if (p.perks.ikili && !o.down && cheb(p, o) <= 3) dmg += p.perks.ikili;
      if (p.eff.yarn) dmg *= 2;
      this.stats.hits++;
      this.emit('scratch', { s: p.slot, x: tx, y: ty });
      this.damageEnemy(e, dmg, p);
    }

    doMeow(p) {
      if (p.meowCd > 0) return;
      const lvl = p.perks.miyav || 0;
      const r = 2 + lvl;
      p.meowCd = Math.round(120 * Math.pow(0.8, lvl));
      this.stats.meows++;
      this.emit('meow', { s: p.slot, x: p.x, y: p.y, r });
      for (const e of this.enemies.slice()) {
        if (e.dead || this.distToEnemy(p, e) > r) continue;
        e.stun = Math.max(e.stun, ENEMY[e.type].big ? 14 : 40);
        e.windup = 0;
        this.damageEnemy(e, 1, p);
      }
      this.proj = this.proj.filter((pr) => cheb(pr, p) > r);
    }

    // Öpücük: partnerin dibindeyken can doldurur, bayılmışsa uyandırır. İyileştirmesi 18 sn'de bir.
    doKiss(p) {
      const o = this.players[1 - p.slot];
      const mx = (p.x + o.x) / 2, my = (p.y + o.y) / 2;
      if (cheb(p, o) > 1) { this.emit('kissfar', { s: p.slot, x: p.x, y: p.y }); return; }
      if (o.x !== p.x) p.f = Math.sign(o.x - p.x);
      const needs = o.down || p.hp < p.mh;
      if (needs && p.kissCd <= 0) {
        if (o.down) this.revive(o, false);
        else { p.hp = Math.min(p.mh, p.hp + KISS_HEAL); o.hp = Math.min(o.mh, o.hp + 1); }
        p.kissCd = KISS_CD;
        p.inv = Math.max(p.inv, 16);
        this.stats.kisses++;
        this.emit('kiss', { s: p.slot, x: mx, y: my, heal: true });
      } else {
        this.emit('kiss', { s: p.slot, x: mx, y: my, heal: false, wait: needs ? Math.ceil(p.kissCd / 20) : 0 });
      }
    }

    hurtPlayer(p, dmg, kind) {
      if (p.down || p.inv > 0 || p.eff.nip > 0) return false;
      if (p.shield > 0) {
        p.shield--; p.inv = 20;
        this.emit('block', { s: p.slot, x: p.x, y: p.y });
        return false;
      }
      p.hp -= dmg;
      p.inv = 26;
      this.emit('hurt', { s: p.slot, x: p.x, y: p.y, k: kind, d: dmg });
      if (p.hp <= 0) {
        p.hp = 0; p.down = true; p.rv = 0;
        p.eff = { coffee: 0, yarn: 0, nip: 0, sleepy: 0 };
        this.emit('down', { s: p.slot, x: p.x, y: p.y });
      }
      return true;
    }

    revive(p, full) {
      p.down = false; p.rv = 0;
      p.hp = full ? p.mh : Math.max(3, Math.ceil(p.mh / 2));
      p.inv = 40;
      this.emit('revive', { s: p.slot, x: p.x, y: p.y });
    }

    // ----- yapay zekâ partner -----
    aiThink(p) {
      if (p.down || p.mcd > 0) return;
      const o = this.players[1 - p.slot];
      p.held = null;
      const near = this.enemies.filter((e) => !e.dead && this.distToEnemy(p, e) <= 2);
      if (p.meowCd <= 0 && (near.length >= 2 || near.some((e) => ENEMY[e.type].big))) p.wantMeow = true;
      if (o.down) {
        if (cheb(p, o) > 1) p.q = this.stepToward(p, o.x, o.y);
        return;
      }
      for (const name of DIR_NAMES) {
        const [dx, dy] = DIRS[name];
        if (this.enemyAt(p.x + dx, p.y + dy)) { p.q = name; return; }
      }
      // Partnerin canı azaldıysa ve öpücüğü hazırsa yanına koş
      if (!o.ai && o.hp <= o.mh / 2 && o.kissCd <= 0) {
        if (cheb(p, o) > 1) p.q = this.stepToward(p, o.x, o.y);
        return;
      }
      let target = null, best = 99;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = this.distToEnemy(p, e);
        if (d <= 4 && this.distToEnemy(o, e) <= 6 && d < best) { best = d; target = e; }
      }
      if (target) { p.q = this.stepToward(p, target.x, target.y); return; }
      if (manh(p, o) > 2) p.q = this.stepToward(p, o.x, o.y);
    }

    stepToward(p, tx, ty) {
      const d = this.bfsFrom(tx, ty);
      let best = null, bd = d[p.y * this.W + p.x];
      for (const name of DIR_NAMES) {
        const [dx, dy] = DIRS[name];
        const nx = p.x + dx, ny = p.y + dy;
        if (!this.walkable(nx, ny) || this.npcAt(nx, ny)) continue;
        const v = d[ny * this.W + nx];
        if (v < bd) { bd = v; best = name; }
      }
      return best;
    }

    // ----- düşmanlar -----
    rollDmg(r) { return this.rng.int(r[0], r[1]); }

    damageEnemy(e, dmg, p) {
      const d = ENEMY[e.type];
      e.hp -= dmg;
      e.flash = 4;
      e.aggro = true;
      if (!d.big) { e.stun = Math.max(e.stun, 5); e.windup = 0; }
      if ((e.type === 'monkey' || e.type === 'pagem') && e.hp > 0 && this.rng.chance(0.3)) e.flee = 22;
      this.emit('hit', { x: e.x, y: e.y, d: dmg, big: !!d.big, hairy: !!d.hairy });
      if (e.hp <= 0) this.killEnemy(e, p);
    }

    freeDropCell(x, y) {
      const cands = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]];
      for (const [cx, cy] of cands) {
        if (this.walkable(cx, cy) && !this.npcAt(cx, cy) && !this.items.some((i) => i.x === cx && i.y === cy)) return [cx, cy];
      }
      return [x, y];
    }

    killEnemy(e, p) {
      const d = ENEMY[e.type];
      e.dead = true;
      this.enemies.splice(this.enemies.indexOf(e), 1);
      this.stats.kills++;
      if (p) p.kills++;
      const cx = d.big ? e.x + 1 : e.x, cy = d.big ? e.y + 1 : e.y;
      this.emit('kill', { x: e.x, y: e.y, t: e.type, big: !!d.big, hairy: !!d.hairy });
      if (d.page || d.big) {
        const [px, py] = this.freeDropCell(cx, cy);
        this.addItem('page', px, py, { n: this.floor });
      }
      if (d.big) {
        // Kral düşünce maymunlar dağılır
        for (const o of this.enemies.slice()) { o.dead = true; this.emit('kill', { x: o.x, y: o.y, t: o.type, poof: true }); }
        this.enemies = [];
        this.proj = [];
        const [tx, ty] = this.freeDropCell(cx - 1, cy);
        this.addItem('tantuni', tx, ty);
        return;
      }
      if (e.stolen) {
        const [sx, sy] = this.freeDropCell(cx, cy);
        this.addItem(e.stolen, sx, sy);
      } else if (this.rng.chance(0.12 + 0.08 * ((p && p.perks.sans) || 0))) {
        const [sx, sy] = this.freeDropCell(cx, cy);
        this.addItem(this.rng.weighted(ITEM_WEIGHTS), sx, sy);
      }
    }

    adjacentPlayer(x, y) {
      return this.players.find((p) => !p.down && Math.abs(p.x - x) + Math.abs(p.y - y) === 1) || null;
    }

    cellFree(x, y, e) {
      return this.walkable(x, y) && !this.npcAt(x, y) && !this.enemyAt(x, y, e) && !this.playerAt(x, y);
    }

    stepEnemy(e, dirName) {
      if (!dirName) return false;
      const [dx, dy] = DIRS[dirName];
      const nx = e.x + dx, ny = e.y + dy;
      if (!this.cellFree(nx, ny, e)) return false;
      e.x = nx; e.y = ny;
      if (dx) e.f = dx;
      if (e.type === 'monkey' && !e.stolen) {
        const it = this.items.find((i) => i.x === nx && i.y === ny && i.t !== 'page');
        if (it) {
          this.items.splice(this.items.indexOf(it), 1);
          e.stolen = it.t; e.flee = 60;
          this.stats.steals++;
          this.emit('steal', { x: nx, y: ny, t: it.t });
        }
      }
      return true;
    }

    chaseDir(e) {
      const W = this.W, cur = this.pdist[e.y * W + e.x];
      let best = [], bd = cur;
      for (const name of DIR_NAMES) {
        const [dx, dy] = DIRS[name];
        const nx = e.x + dx, ny = e.y + dy;
        if (!this.cellFree(nx, ny, e)) continue;
        const v = this.pdist[ny * W + nx];
        if (v < bd) { bd = v; best = [name]; } else if (v === bd && v < cur) best.push(name);
      }
      return best.length ? this.rng.pick(best) : null;
    }

    fleeDir(e) {
      const W = this.W, cur = this.pdist[e.y * W + e.x];
      let best = null, bd = cur;
      for (const name of DIR_NAMES) {
        const [dx, dy] = DIRS[name];
        const nx = e.x + dx, ny = e.y + dy;
        if (!this.cellFree(nx, ny, e)) continue;
        const v = this.pdist[ny * W + nx];
        if (v > bd && v < 32767) { bd = v; best = name; }
      }
      return best;
    }

    updateEnemy(e) {
      const d = ENEMY[e.type];
      if (e.flash > 0) e.flash--;
      if (e.shootCd > 0) e.shootCd--;
      if (e.stun > 0) { e.stun--; return; }
      if (e.cd > 0) e.cd--;
      if (d.ai === 'boss') return this.bossAI(e, d);
      if (d.ai === 'bounce') return this.bounceAI(e, d);

      if (e.windup > 0) {
        if (--e.windup === 0) this.enemyStrike(e, d);
        return;
      }
      const here = this.pdist[e.y * this.W + e.x];
      if (!e.aggro && here <= d.aggro) { e.aggro = true; this.emit('alert', { x: e.x, y: e.y }); }
      else if (e.aggro && here > d.aggro * 3) e.aggro = false;

      if (e.flee > 0) {
        e.flee--;
        if (e.cd <= 0) { this.stepEnemy(e, this.fleeDir(e)); e.cd = Math.max(3, d.spd - 2); }
        return;
      }
      const adj = this.adjacentPlayer(e.x, e.y);
      if (adj && e.aggro && e.cd <= 0) {
        e.windup = d.windup; e.wdx = adj.x - e.x; e.wdy = adj.y - e.y;
        if (e.wdx) e.f = e.wdx;
        return;
      }
      if (e.cd > 0) return;
      e.cd = d.spd + this.rng.int(0, 2);
      if (d.ai === 'shooter') {
        if (!this.tryShoot(e) && this.rng.chance(0.5)) this.stepEnemy(e, this.rng.pick(DIR_NAMES));
        return;
      }
      if (d.ai === 'thief' && !e.stolen && this.thiefSeek(e)) return;
      if (e.aggro) this.stepEnemy(e, this.chaseDir(e));
      else if (this.rng.chance(0.35)) this.stepEnemy(e, this.rng.pick(DIR_NAMES));
    }

    enemyStrike(e, d) {
      const p = this.playerAt(e.x + e.wdx, e.y + e.wdy, true);
      e.cd = d.spd + 4;
      if (!p) return;
      if (!this.hurtPlayer(p, this.rollDmg(d.dmg), e.type)) return;
      if (d.sleepy) {
        p.eff.sleepy = 90;
        this.emit('text', { x: p.x, y: p.y, s: 'Esnemek yasak!' });
      }
      if (e.type === 'monkey' && !e.stolen) {
        e.stolen = 'simit'; e.flee = 70;
        this.stats.steals++;
        this.emit('steal', { x: e.x, y: e.y, t: 'simit' });
      }
    }

    tryShoot(e) {
      if (e.shootCd > 0) return false;
      for (const p of this.players) {
        if (p.down) continue;
        if (p.x !== e.x && p.y !== e.y) continue;
        if (manh(p, e) > 6) continue;
        const dx = Math.sign(p.x - e.x), dy = Math.sign(p.y - e.y);
        let x = e.x + dx, y = e.y + dy, clear = true;
        while (x !== p.x || y !== p.y) {
          if (!this.walkable(x, y) || this.npcAt(x, y)) { clear = false; break; }
          x += dx; y += dy;
        }
        if (!clear) continue;
        if (dx) e.f = dx;
        this.addProj('steam', e.x + dx, e.y + dy, dx, dy);
        e.shootCd = 55;
        this.emit('shoot', { x: e.x, y: e.y });
        return true;
      }
      return false;
    }

    thiefSeek(e) {
      let best = null, bd = 8;
      for (const it of this.items) {
        if (it.t === 'page') continue;
        const d = manh(it, e);
        if (d < bd) { bd = d; best = it; }
      }
      if (!best) return false;
      const sx = Math.sign(best.x - e.x), sy = Math.sign(best.y - e.y);
      const prefs = Math.abs(best.x - e.x) >= Math.abs(best.y - e.y)
        ? [sx > 0 ? 'right' : sx < 0 ? 'left' : null, sy > 0 ? 'down' : sy < 0 ? 'up' : null]
        : [sy > 0 ? 'down' : sy < 0 ? 'up' : null, sx > 0 ? 'right' : sx < 0 ? 'left' : null];
      for (const dn of prefs) if (dn && this.stepEnemy(e, dn)) return true;
      return false;
    }

    bounceAI(e, d) {
      if (e.cd > 0) return;
      e.cd = d.spd;
      if (this.rng.chance(0.06)) {
        const turn = e.dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
        const [tx, ty] = this.rng.pick(turn);
        if (this.walkable(e.x + tx, e.y + ty)) { e.dx = tx; e.dy = ty; }
      }
      const nx = e.x + e.dx, ny = e.y + e.dy;
      const p = this.playerAt(nx, ny, true);
      if (p) {
        this.hurtPlayer(p, this.rollDmg(d.dmg), 'ball');
        e.dx = -e.dx; e.dy = -e.dy;
        this.emit('clack', { x: nx, y: ny });
        return;
      }
      if (!this.walkable(nx, ny) || this.npcAt(nx, ny) || this.enemyAt(nx, ny, e)) {
        e.dx = -e.dx; e.dy = -e.dy;
        if (this.rng.chance(0.4)) { const t = e.dx; e.dx = e.dy; e.dy = t; }
        return;
      }
      e.x = nx; e.y = ny;
      if (e.dx) e.f = e.dx;
    }

    bigFree(e, nx, ny) {
      for (let y = ny; y <= ny + 1; y++) for (let x = nx; x <= nx + 1; x++) {
        if (!this.walkable(x, y) || this.npcAt(x, y) || this.enemyAt(x, y, e) || this.playerAt(x, y, true)) return false;
      }
      return true;
    }

    bigAdjacent(e, p) {
      return ((p.x === e.x || p.x === e.x + 1) && (p.y === e.y - 1 || p.y === e.y + 2)) ||
        ((p.y === e.y || p.y === e.y + 1) && (p.x === e.x - 1 || p.x === e.x + 2));
    }

    bossAI(e, d) {
      const alive = this.players.filter((p) => !p.down);
      if (!e.aggro) {
        if (!alive.some((p) => this.distToEnemy(p, e) <= d.aggro)) return;
        e.aggro = true; e.tcd = 34; e.scd = 120;
        this.emit('boss', { x: e.x, y: e.y });
      }
      e.tcd--; e.scd--;
      const angry = e.hp < e.mh / 2;
      if (e.windup > 0) {
        if (--e.windup === 0) {
          for (const p of alive) if (this.bigAdjacent(e, p)) this.hurtPlayer(p, this.rollDmg(d.dmg), 'king');
          this.emit('stomp', { x: e.x + 1, y: e.y + 1 });
          e.cd = 14;
        }
        return;
      }
      if (e.tcd <= 0) {
        // Muz ve kıl yumağı sırayla
        e.tcd = angry ? 40 : 60;
        const kind = e.throws++ % 2 ? 'kil' : 'banana';
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        if (angry) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        for (const [dx, dy] of dirs) {
          const sx = dx > 0 ? e.x + 2 : dx < 0 ? e.x - 1 : e.x + this.rng.int(0, 1);
          const sy = dy > 0 ? e.y + 2 : dy < 0 ? e.y - 1 : e.y + this.rng.int(0, 1);
          if (this.walkable(sx, sy)) this.addProj(kind, sx, sy, dx, dy);
        }
        this.emit('throw', { x: e.x, y: e.y, t: kind });
      }
      if (e.scd <= 0) {
        e.scd = 230;
        if (this.enemies.filter((o) => o.type === 'monkey').length < 3) {
          let n = 0;
          for (const [ox, oy] of [[-1, 0], [2, 1], [0, -1], [1, 2], [-1, 1], [2, 0]]) {
            const x = e.x + ox, y = e.y + oy;
            if (n < 2 && this.cellFree(x, y)) {
              this.addEnemy('monkey', x, y, { aggro: true, stun: 6 });
              n++;
            }
          }
          if (n) this.emit('summon', { x: e.x, y: e.y });
        }
      }
      if (alive.some((p) => this.bigAdjacent(e, p)) && e.cd <= 0) { e.windup = d.windup; return; }
      if (e.cd > 0 || !alive.length) return;
      e.cd = angry ? 9 : d.spd;
      const tgt = alive.reduce((m, p) => (manh(p, e) < manh(m, e) ? p : m), alive[0]);
      const ddx = tgt.x - (e.x + 0.5), ddy = tgt.y - (e.y + 0.5);
      const hx = [Math.sign(ddx), 0], vy = [0, Math.sign(ddy)];
      const prefs = Math.abs(ddx) >= Math.abs(ddy) ? [hx, vy] : [vy, hx];
      for (const [dx, dy] of prefs) {
        if ((dx || dy) && this.bigFree(e, e.x + dx, e.y + dy)) {
          e.x += dx; e.y += dy;
          if (dx) e.f = dx;
          break;
        }
      }
    }

    // ----- mermiler ve tuzaklar -----
    addProj(t, x, y, dx, dy) {
      this.proj.push({ id: this.uid++, t, x, y, dx, dy, cd: t === 'steam' ? 2 : 3, ttl: 24 });
    }

    projHit(p, pr) {
      if (!this.hurtPlayer(p, PROJ_DMG[pr.t] || 2, pr.t)) return;
      if (pr.t === 'kil') {
        p.eff.sleepy = Math.max(p.eff.sleepy, 40);
        this.emit('text', { x: p.x, y: p.y, s: 'Öhö öhö! Kıl yuttum!' });
      }
    }

    updateProjectiles() {
      for (const pr of this.proj.slice()) {
        const kill = () => { const i = this.proj.indexOf(pr); if (i >= 0) this.proj.splice(i, 1); };
        let hit = this.playerAt(pr.x, pr.y, true);
        if (hit) { this.projHit(hit, pr); kill(); continue; }
        if (--pr.cd > 0) continue;
        pr.cd = pr.t === 'steam' ? 2 : 3;
        const nx = pr.x + pr.dx, ny = pr.y + pr.dy;
        if (--pr.ttl <= 0 || !this.walkable(nx, ny) || this.npcAt(nx, ny)) { kill(); this.emit('splat', { x: pr.x, y: pr.y, t: pr.t }); continue; }
        pr.x = nx; pr.y = ny;
        hit = this.playerAt(nx, ny, true);
        if (hit) { this.projHit(hit, pr); kill(); }
      }
    }

    trapState(tr) {
      const t = (this.now + tr.off) % 96;
      return t < 62 ? 0 : t < 82 ? 1 : 2;
    }

    updateTraps() {
      for (const tr of this.traps) {
        if ((this.now + tr.off) % 96 !== 82) continue;
        let hitAny = false;
        for (const p of this.players) if (p.x === tr.x && p.y === tr.y && this.hurtPlayer(p, 2, 'door')) hitAny = true;
        const near = this.players.some((p) => cheb(p, tr) <= 7);
        if (near) this.emit('slam', { x: tr.x, y: tr.y });
        if (near && (hitAny || !this.slamShown)) {
          this.slamShown = true;
          this.emit('text', { x: tr.x, y: tr.y, s: 'Kapıyı vurmak yasak!' });
        }
      }
    }

    // ----- aşamalar -----
    wipe() {
      this.lives--;
      this.stats.wipes++;
      this.setPhase(this.lives > 0 ? 'wipe' : 'gameover', { lives: this.lives });
    }

    cont() {
      if (this.phase === 'page') {
        if (this.floor >= FLOORS.length - 1) {
          this.setPhase('final', { stats: Object.assign({}, this.stats), lives: this.lives });
        } else {
          if (this.stairs) this.stairs.open = true;
          this.setPhase('play');
          if (this.stairs) this.emit('stairs', { x: this.stairs.x, y: this.stairs.y });
        }
      } else if (this.phase === 'wipe') {
        for (const p of this.players) { p.down = false; p.hp = p.mh; }
        this.buildFloor();
        this.setPhase('play');
      } else if (this.phase === 'gameover') {
        this.floor = 0; this.lives = 9; this.pages = [];
        this.players.forEach((p, i) => {
          const fresh = newPlayer(i);
          fresh.ai = p.ai;
          this.players[i] = fresh;
        });
        this.pickSecretFloors();
        this.buildFloor();
        this.setPhase('play');
      }
    }

    enterStairs() {
      const keys = Object.keys(PERKS);
      const opts = this.players.map(() => this.rng.shuffle(keys.slice()).slice(0, 3));
      this.emit('descend', {});
      this.setPhase('perk', { opts, picked: [null, null] });
    }

    pickPerk(slot, id) {
      if (this.phase !== 'perk' || !this.pd) return;
      const pd = this.pd;
      if (pd.picked[slot] || !pd.opts[slot] || !pd.opts[slot].includes(id)) return;
      pd.picked[slot] = id;
      const p = this.players[slot];
      p.perks[id] = (p.perks[id] || 0) + 1;
      if (id === 'kalp') { p.mh = Math.min(MAX_HP, p.mh + 2); p.hp = p.mh; }
      this.emit('perk', { s: slot, id });
      if (pd.picked.every(Boolean)) {
        this.floor++;
        for (const q of this.players) { if (!q.down) q.hp = Math.min(q.mh, q.hp + 3); }
        this.buildFloor();
        this.setPhase('play');
      }
    }

    // ----- ağ için durum -----
    mapData() {
      const F = FLOORS[this.floor];
      return {
        mv: this.mv, floor: this.floor, key: F.key, stop: F.stop, part: F.part, w: this.W, h: this.H,
        rows: this.tiles.map((r) => r.join('')), secret: this.secret ? this.secret.kind : null,
      };
    }

    snapshot() {
      return {
        now: this.now, phase: this.phase, pd: this.pd, floor: this.floor, lives: this.lives,
        pages: this.pages.slice(), mv: this.mv, ft: this.floorTick,
        pl: this.players.map((p) => ({
          x: p.x, y: p.y, f: p.f, hp: p.hp, mh: p.mh, dn: p.down, rv: p.rv, inv: p.inv > 0,
          co: p.eff.coffee > 0, ya: p.eff.yarn > 0, ni: p.eff.nip > 0, sl: p.eff.sleepy > 0,
          mc: p.meowCd, kc: p.kissCd, sh: p.shield, ai: p.ai, pk: p.perks, k: p.kills,
        })),
        en: this.enemies.map((e) => ({
          id: e.id, t: e.type, x: e.x, y: e.y, hp: e.hp, mh: e.mh, f: e.f,
          st: e.stun > 0, w: e.windup > 0, fl: e.flash > 0, ag: e.aggro, so: e.stolen,
        })),
        it: this.items.map((i) => ({ id: i.id, t: i.t, x: i.x, y: i.y, n: i.n })),
        pr: this.proj.map((p) => ({ id: p.id, t: p.t, x: p.x, y: p.y, dx: p.dx, dy: p.dy })),
        tr: this.traps.map((t) => ({ id: t.id, x: t.x, y: t.y, s: this.trapState(t) })),
        np: this.npcs.map((n) => ({ id: n.id, k: n.k, x: n.x, y: n.y })),
        st: this.stairs,
        stats: this.stats,
      };
    }
  }

  return { VERSION, TICK_MS, REVIVE_TICKS, KISS_CD, KISS_HEAL, FLOORS, ENEMY, ITEMS, PERKS, DIRS, isWall, Game };
});
