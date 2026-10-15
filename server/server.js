/* Patili Rota — beraber mod sunucusu.
   Siteyi sunar ve her oda için oyunu (assets/js/core.js) sunucuda çalıştırır.
   Çalıştır: npm install && npm start  →  http://localhost:8080 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Core = require('../assets/js/core.js');

const PORT = Number(process.env.PORT) || 8080;
const ROOT = path.resolve(__dirname, '..');
const MAX_ROOMS = 200;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
// Sunulmayacaklar: sunucu kodu, paketler, firebase ayarları, gizli dosyalar
const BLOCKED = /^(server|node_modules|firebase|tests)(\/|$)|^package(-lock)?\.json$|^firebase\.json$|(^|\/)\./;

// ---------- statik dosyalar ----------
const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch (e) { res.writeHead(400); return res.end(); }
  if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  let rel;
  try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, ''); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || BLOCKED.test(rel)) { res.writeHead(404); return res.end('bulunamadı'); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) { res.writeHead(301, { location: url.pathname + '/' }); return res.end(); }
    if (err) { res.writeHead(404); return res.end('bulunamadı'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': MIME[ext] || MIME[ext.toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
});

// ---------- odalar ----------
const rooms = new Map();
const LETTERS = 'ABCDEFGHJKLMNPRSTUVYZ';

function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += LETTERS[crypto.randomInt(LETTERS.length)];
    if (!rooms.has(c)) return c;
  }
}

function send(ws, o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function broadcast(room, o) {
  const s = JSON.stringify(o);
  for (const c of room.clients) if (c && c.readyState === 1) c.send(s);
}
function lobbyInfo(room) { return { t: 'lobby', code: room.code, connected: room.clients.map(Boolean), started: !!room.game }; }

function seat(room, ws, slot, token) {
  const old = room.clients[slot];
  if (old && old !== ws) { old.room = null; try { old.terminate(); } catch (e) { /* zaten kapalı */ } }
  room.clients[slot] = ws;
  room.tokens[slot] = token || crypto.randomBytes(9).toString('base64url');
  ws.room = room;
  ws.slot = slot;
  send(ws, { t: 'welcome', code: room.code, slot, token: room.tokens[slot] });
  if (room.game) {
    room.game.setAI(slot, false);
    send(ws, { t: 'map', map: room.game.mapData() });
  }
  broadcast(room, lobbyInfo(room));
}

// Zamanlayıcı kaysa da oyun saniyede tam 20 tick ilerlesin
function tickRoom(room) {
  const now = Date.now();
  let steps = Math.floor((now - room.last) / Core.TICK_MS);
  if (steps <= 0) return;
  room.last += steps * Core.TICK_MS;
  if (steps > 4) { steps = 4; room.last = now; }
  if (!room.clients.some(Boolean)) return;
  const g = room.game;
  let ev = [];
  for (let i = 0; i < steps; i++) {
    ev = ev.concat(g.step());
    if (g.mv !== room.mv) {
      room.mv = g.mv;
      broadcast(room, { t: 'map', map: g.mapData() });
    }
  }
  broadcast(room, { t: 's', s: g.snapshot(), ev });
}

function startRoom(room) {
  if (room.game) return;
  room.game = new Core.Game({ ai: room.clients.map((c) => !c) });
  room.mv = room.game.mv;
  room.last = Date.now();
  broadcast(room, { t: 'map', map: room.game.mapData() });
  room.timer = setInterval(() => tickRoom(room), Core.TICK_MS / 2);
  broadcast(room, lobbyInfo(room));
  console.log(`[oda ${room.code}] oyun başladı`);
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    let m;
    try { m = JSON.parse(data); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.v !== undefined && m.v !== Core.VERSION) { send(ws, { t: 'err', msg: 'Oyun güncellenmiş, sayfayı yenile 🔄' }); return; }
    const cat = m.cat === 'sarman' ? 1 : 0;
    switch (m.t) {
      case 'create': {
        if (ws.room) return;
        if (rooms.size >= MAX_ROOMS) { send(ws, { t: 'err', msg: 'Sunucu dolu, birazdan dene' }); return; }
        const room = { code: newCode(), clients: [null, null], tokens: [null, null], game: null, timer: null, empty: 0, mv: 0 };
        rooms.set(room.code, room);
        seat(room, ws, cat);
        console.log(`[oda ${room.code}] kuruldu`);
        break;
      }
      case 'join': {
        if (ws.room) return;
        const room = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!room) { send(ws, { t: 'err', msg: 'Oda bulunamadı. Kodu kontrol et 🐾' }); return; }
        const back = typeof m.token === 'string' ? room.tokens.indexOf(m.token) : -1;
        if (back >= 0) { seat(room, ws, back, m.token); break; }
        const slot = !room.clients[cat] ? cat : !room.clients[1 - cat] ? 1 - cat : -1;
        if (slot < 0) { send(ws, { t: 'err', msg: 'Oda dolu' }); return; }
        seat(room, ws, slot);
        break;
      }
      case 'start':
        if (ws.room) startRoom(ws.room);
        break;
      case 'in':
        if (ws.room && ws.room.game) ws.room.game.input(ws.slot, m.m);
        break;
    }
  });
  ws.on('close', () => {
    const room = ws.room;
    if (!room || room.clients[ws.slot] !== ws) return;
    room.clients[ws.slot] = null;
    if (room.game) room.game.setAI(ws.slot, true);
    broadcast(room, lobbyInfo(room));
  });
});

// Kopan bağlantıları ayıkla, 10 dk boş kalan odaları sil
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
  for (const room of rooms.values()) {
    if (room.clients.some(Boolean)) { room.empty = 0; continue; }
    if (++room.empty > 20) {
      clearInterval(room.timer);
      rooms.delete(room.code);
      console.log(`[oda ${room.code}] kapandı`);
    }
  }
}, 30000);

server.listen(PORT, () => console.log(`Patili Rota hazır → http://localhost:${PORT}`));
