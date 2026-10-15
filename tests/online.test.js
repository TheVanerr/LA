/* Beraber mod testi: sunucuyu boş bir portta açar, iki oyuncu bağlar.
   Oda kurma, kodla katılma, oyun başlatma, hareket, kopup geri dönme, dolu oda, statik dosyalar.
   Çalıştır: npm test */
'use strict';
const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const Core = require('../assets/js/core.js');

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function client() {
  const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
  const c = { ws, last: null, welcome: null, lobby: null, err: null, maps: 0 };
  ws.on('message', (data) => {
    const m = JSON.parse(data);
    if (m.t === 's') c.last = m.s;
    else if (m.t === 'map') c.maps++;
    else if (m.t === 'welcome') c.welcome = m;
    else if (m.t === 'lobby') c.lobby = m;
    else if (m.t === 'err') c.err = m.msg;
  });
  c.open = new Promise((r) => ws.on('open', r));
  c.send = (o) => ws.send(JSON.stringify(o));
  return c;
}

async function main() {
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const clients = [];
  try {
    for (let i = 0; ; i++) {
      try { const r = await fetch(BASE + '/health'); if (r.ok) break; } catch (e) { /* açılıyor */ }
      if (i > 50) throw new Error('Sunucu açılmadı');
      await wait(100);
    }
    const status = async (p) => (await fetch(BASE + p, { redirect: 'manual' })).status;
    assert.strictEqual(await status('/'), 200, 'Ana sayfa açılmadı');
    assert.strictEqual(await status('/V1/'), 200, 'V1 açılmadı');
    assert.strictEqual(await status('/V2/'), 200, 'V2 açılmadı');
    for (const p of ['/server/server.js', '/package.json', '/.gitignore', '/firebase/firestore.rules', '/tests/core.test.js']) {
      assert.strictEqual(await status(p), 404, `${p} dışarıya açık olmamalı`);
    }

    const A = client(), B = client();
    clients.push(A, B);
    await A.open; await B.open;
    A.send({ t: 'create', cat: 'sarman', v: Core.VERSION });
    await wait(200);
    assert.ok(A.welcome && A.welcome.slot === 1, 'Oda kurulamadı');
    const code = A.welcome.code;

    B.send({ t: 'join', code: 'ZZZZ', cat: 'eda', v: Core.VERSION });
    await wait(150);
    assert.ok(B.err, 'Yanlış kod reddedilmedi');
    B.send({ t: 'join', code: code.toLowerCase(), cat: 'eda', v: Core.VERSION });
    await wait(200);
    assert.ok(B.welcome && B.welcome.slot === 0, 'Eda katılamadı');
    assert.deepStrictEqual(A.lobby.connected, [true, true], 'Lobi iki kişiyi görmüyor');

    A.send({ t: 'start' });
    await wait(400);
    assert.ok(A.maps === 1 && B.maps === 1 && A.last && B.last, 'Oyun iki tarafa da gelmedi');
    assert.deepStrictEqual(A.last.pl.map((p) => p.ai), [false, false], 'Oyuncular yapay zekâda kaldı');

    for (const d of ['right', 'down', 'left', 'up']) {
      B.send({ t: 'in', m: { t: 'dir', d, q: true } });
      await wait(120);
      B.send({ t: 'in', m: { t: 'dir', d: null } });
      await wait(120);
    }
    B.send({ t: 'in', m: { t: 'meow' } });
    await wait(250);
    assert.ok(A.last.pl[0].mc > 0, 'Miyav sunucuya ulaşmadı');

    const token = B.welcome.token;
    B.ws.close();
    await wait(300);
    assert.strictEqual(A.last.pl[0].ai, true, 'Kopan oyuncunun kedisi yapay zekâya geçmedi');
    const B2 = client();
    clients.push(B2);
    await B2.open;
    B2.send({ t: 'join', code, cat: 'sarman', token, v: Core.VERSION });
    await wait(300);
    assert.ok(B2.welcome && B2.welcome.slot === 0 && B2.maps === 1, 'Token ile geri dönülemedi');
    assert.strictEqual(A.last.pl[0].ai, false, 'Geri dönünce kedi oyuncuya geçmedi');

    const C = client();
    clients.push(C);
    await C.open;
    C.send({ t: 'join', code, cat: 'eda', v: Core.VERSION });
    await wait(200);
    assert.ok(C.err, 'Dolu odaya üçüncü kişi girebildi');

    const t0 = A.last.now;
    await wait(1000);
    const rate = A.last.now - t0;
    assert.ok(rate >= 17 && rate <= 23, `Tick hızı bozuk: ${rate}/sn`);
    console.log(`✔ beraber mod: oda, katılma, hareket, geri dönme, dolu oda (${rate} tick/sn)`);
  } finally {
    for (const c of clients) try { c.ws.close(); } catch (e) { /* */ }
    srv.kill();
  }
}

main().catch((e) => { console.error('✘', e.message); process.exit(1); });
