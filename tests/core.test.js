/* Oyun çekirdeği testleri: kat üretimi, uzun simülasyon, sayfa → merdiven → güç → final akışı.
   Çalıştır: npm test */
'use strict';
const assert = require('assert');
const Core = require('../assets/js/core.js');

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// Gizli oda çatlak kırılana kadar kapalıdır; kırıldığında haritanın tamamı ulaşılabilir olmalı
function allReachable(g) {
  let crack = null;
  if (g.secret) { crack = g.secret.crack; g.tiles[crack[1]][crack[0]] = '.'; }
  const d = g.floodFrom([[g.players[0].x, g.players[0].y]]);
  let ok = true;
  for (let y = 0; y < g.H && ok; y++) for (let x = 0; x < g.W; x++) {
    if (g.walkable(x, y) && d[y * g.W + x] === 32767) { ok = false; break; }
  }
  if (crack) g.tiles[crack[1]][crack[0]] = 'c';
  return ok;
}

// 1) Her kat: bağlantılı, başlangıç/merdiven/düşmanlar duvarda değil, sayfayı taşıyan biri var
for (let seed = 1; seed <= 80; seed++) {
  for (let f = 0; f < Core.FLOORS.length; f++) {
    const g = new Core.Game({ seed, ai: [true, true], startFloor: f });
    const where = `seed ${seed}, kat ${f + 1}`;
    ok(allReachable(g), `Ulaşılamayan bölge var (${where})`);
    for (const p of g.players) ok(g.walkable(p.x, p.y), `Başlangıç duvarda (${where})`);
    if (g.stairs) ok(g.walkable(g.stairs.x, g.stairs.y), `Merdiven duvarda (${where})`);
    ok(g.enemies.some((e) => e.type === 'pagem' || e.type === 'king'), `Sayfa taşıyan yok (${where})`);
    for (const e of g.enemies) {
      const cells = Core.ENEMY[e.type].big ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
      for (const [ox, oy] of cells) ok(g.walkable(e.x + ox, e.y + oy), `${e.type} duvarda (${where})`);
    }
    // 2) Uzun simülasyon: çökmemeli, aşamalar takılmamalı
    for (let i = 0; i < 600; i++) {
      g.step();
      if (g.phase === 'wipe' || g.phase === 'gameover' || g.phase === 'page') g.cont();
    }
    JSON.stringify(g.snapshot());
  }
}

// 3) Baştan sona akış
const g = new Core.Game({ seed: 42, ai: [false, true] });
for (let f = 0; f < Core.FLOORS.length; f++) {
  const holder = g.enemies.find((e) => e.type === 'pagem' || e.type === 'king');
  g.killEnemy(holder, g.players[0]);
  const page = g.items.find((i) => i.t === 'page');
  ok(page, `Sayfa düşmedi (kat ${f + 1})`);
  g.players[0].x = page.x; g.players[0].y = page.y;
  g.onEnter(g.players[0]);
  ok(g.phase === 'page', `Sayfa ekranı açılmadı (kat ${f + 1})`);
  g.cont();
  if (f === Core.FLOORS.length - 1) { ok(g.phase === 'final', 'Final açılmadı'); break; }
  ok(g.stairs.open, `Merdiven açılmadı (kat ${f + 1})`);
  g.players[0].x = g.stairs.x; g.players[0].y = g.stairs.y;
  g.onEnter(g.players[0]);
  ok(g.phase === 'perk', `Güç seçimi açılmadı (kat ${f + 1})`);
  g.step();
  ok(g.pd.picked[1], 'Yapay zekâ güç seçmedi');
  g.input(0, { t: 'perk', id: g.pd.opts[0][0] });
  ok(g.floor === f + 1 && g.phase === 'play', `Sonraki kata geçilmedi (kat ${f + 1})`);
}
ok(g.pages.length === Core.FLOORS.length, 'Tüm yarım sayfalar toplanmadı');

// 4) Öpücük: Fatih'in dibindeyken can doldurur, bekleme süresi var, bayılanı uyandırır
{
  const k = new Core.Game({ seed: 3, ai: [false, true] });
  const [eda, fatih] = k.players;
  fatih.x = eda.x + 1; fatih.y = eda.y;
  eda.hp = 3;
  k.input(0, { t: 'kiss' }); k.step();
  ok(eda.hp === 3 + Core.KISS_HEAL, `Öpücük iyileştirmedi (can ${eda.hp})`);
  ok(eda.kissCd > 0, 'Öpücük bekleme süresi başlamadı');
  eda.hp = 3;
  k.input(0, { t: 'kiss' }); k.step();
  ok(eda.hp === 3, 'Bekleme süresindeyken öpücük yine iyileştirdi');
  eda.kissCd = 0; fatih.down = true; fatih.hp = 0;
  k.input(0, { t: 'kiss' }); k.step();
  ok(!fatih.down && fatih.hp > 0, 'Öpücük bayılan Fatih’i uyandırmadı');
  eda.kissCd = 0; eda.hp = 3; fatih.x = eda.x + 3;
  k.input(0, { t: 'kiss' }); k.step();
  ok(eda.hp === 3, 'Uzaktan öpücük iyileştirmemeli');
}

// 5) Gizli oda: çatlak duvar kırılır, çerçeve fotoğraf açar, dost konuşur
for (const kind of ['memory', 'funny']) {
  const s = new Core.Game({ seed: 11, ai: [false, true], startFloor: 2, secretFloors: kind === 'memory' ? { memory: 2, funny: -1 } : { memory: -1, funny: 2 } });
  ok(s.secret && s.secret.kind === kind, `${kind} odası oluşmadı`);
  const [cx, cy] = s.secret.crack;
  const p = s.players[0];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (s.tile(cx + dx, cy + dy) === '.') { p.x = cx + dx; p.y = cy + dy; break; }
  const dir = cx > p.x ? 'right' : cx < p.x ? 'left' : cy > p.y ? 'down' : 'up';
  p.inv = 0; p.mcd = 0;
  s.input(0, { t: 'dir', d: dir, q: true });
  const ev = s.step();
  ok(ev.some((e) => e.k === 'secret') && s.walkable(cx, cy), `${kind}: çatlak duvar kırılmadı`);
  let fx = -1, fy = -1;
  for (let y = 0; y < s.H && fx < 0; y++) for (let x = 0; x < s.W; x++) if (s.tiles[y][x] === 'P') { fx = x; fy = y; break; }
  p.x = fx; p.y = fy + 1; p.mcd = 0;
  s.input(0, { t: 'dir', d: 'up', q: true });
  ok(s.step().some((e) => e.k === 'photo' && e.kind === kind), `${kind}: çerçeve fotoğraf açmadı`);
}
{
  const n = new Core.Game({ seed: 5, ai: [false, true] });
  const npc = n.npcs[0];
  ok(npc, 'Dost karakter yok');
  const p = n.players[0];
  p.x = npc.x - 1; p.y = npc.y; p.mcd = 0;
  if (!n.walkable(p.x, p.y)) { p.x = npc.x + 1; }
  n.input(0, { t: 'dir', d: p.x < npc.x ? 'right' : 'left', q: true });
  ok(n.step().some((e) => e.k === 'talk'), 'Dosta çarpınca konuşma başlamadı');
  ok(p.x !== npc.x || p.y !== npc.y, 'Oyuncu dostun üstüne yürüdü');
}

// 6) Hasar aralıkları: darbeler 1-3 arası
{
  const h = new Core.Game({ seed: 9, ai: [false, true] });
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const p = h.players[0];
    p.hp = 10; p.inv = 0; p.down = false; p.shield = 0;
    const e = h.addEnemy('pagem', p.x + 1, p.y);
    e.wdx = -1; e.wdy = 0;
    const before = p.hp;
    h.enemyStrike(e, Core.ENEMY.pagem);
    seen.add(before - p.hp);
    h.enemies.splice(h.enemies.indexOf(e), 1);
  }
  ok(seen.has(2) && seen.has(3) && !seen.has(1) && !seen.has(4), `Sayfa hırsızı hasarı 2-3 olmalı (${[...seen]})`);
  ok(h.players[0].mh === 10, 'Başlangıç canı 10 olmalı');
}

// 7) Bayılma → 9 can → oyun bitti → baştan
const w = new Core.Game({ seed: 7, ai: [false, true] });
for (let i = 0; i < 9; i++) {
  for (const p of w.players) { p.inv = 0; p.shield = 0; w.hurtPlayer(p, 99, 'test'); }
  w.step();
  ok(w.phase === (i < 8 ? 'wipe' : 'gameover'), `Beklenen aşama gelmedi (bayılma ${i + 1})`);
  w.cont();
}
ok(w.phase === 'play' && w.lives === 9 && w.floor === 0, 'Oyun baştan başlamadı');

console.log(`✔ çekirdek: ${checks} kontrol geçti`);
