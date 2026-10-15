/* Patili Rota — ağ katmanı. Tek oyunculu modda oyun tarayıcıda, beraber modda sunucuda döner.
   İkisi de aynı arayüzü sunar: on('map'|'state'|...), send(mesaj). */
(function () {
  'use strict';
  const Core = window.PatiCore;

  class Emitter {
    constructor() { this.handlers = {}; }
    on(k, fn) { this.handlers[k] = fn; return this; }
    emit(k, ...args) { if (this.handlers[k]) this.handlers[k](...args); }
  }

  class SoloNet extends Emitter {
    constructor(slot, opts) {
      super();
      this.slot = slot;
      this.online = false;
      this.paused = false;
      this.game = new Core.Game({
        ai: slot === 0 ? [false, true] : [true, false],
        startFloor: (opts && opts.startFloor) || 0,
      });
      this.mv = -1;
    }
    start() {
      this.emitMap();
      this.emit('state', this.game.snapshot(), []);
      this.last = performance.now();
      this.timer = setInterval(() => this.pump(), Core.TICK_MS / 2);
    }
    pump() {
      const now = performance.now();
      if (this.paused) { this.last = now; return; }
      let steps = Math.floor((now - this.last) / Core.TICK_MS);
      if (steps <= 0) return;
      this.last += steps * Core.TICK_MS;
      if (steps > 4) { steps = 4; this.last = now; }
      let ev = [];
      for (let i = 0; i < steps; i++) {
        ev = ev.concat(this.game.step());
        if (this.game.mv !== this.mv) this.emitMap();
      }
      this.emit('state', this.game.snapshot(), ev);
    }
    emitMap() { this.mv = this.game.mv; this.emit('map', this.game.mapData()); }
    send(m) { this.game.input(this.slot, m); }
    stop() { clearInterval(this.timer); }
  }

  function serverUrl() {
    const c = (window.PATI_CONFIG || {}).server;
    if (c) return c;
    if (!/^https?:$/.test(location.protocol)) return null;
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  }

  class OnlineNet extends Emitter {
    constructor() {
      super();
      this.online = true;
      this.url = serverUrl();
      this.ws = null;
      this.slot = 0;
      this.code = null;
      this.token = null;
      this.cat = 'eda';
      this.closed = false;
      this.retries = 0;
      try {
        const saved = JSON.parse(sessionStorage.getItem('pati_room') || 'null');
        if (saved) { this.code = saved.code; this.token = saved.token; this.cat = saved.cat; }
      } catch (e) { /* yok say */ }
    }
    connect() {
      return new Promise((resolve, reject) => {
        if (!this.url) return reject(new Error('Sunucu adresi yok'));
        let ws;
        try { ws = new WebSocket(this.url); } catch (e) { return reject(e); }
        const to = setTimeout(() => { try { ws.close(); } catch (e) { /* */ } reject(new Error('Zaman aşımı')); }, 12000);
        ws.onopen = () => { clearTimeout(to); this.ws = ws; this.retries = 0; resolve(); };
        ws.onerror = () => { clearTimeout(to); reject(new Error('Bağlanılamadı')); };
        ws.onclose = () => { if (this.ws === ws) this.dropped(); };
        ws.onmessage = (e) => this.message(e.data);
      });
    }
    raw(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
    create(cat) { this.cat = cat; this.raw({ t: 'create', cat, v: Core.VERSION }); }
    join(code, cat) {
      this.cat = cat;
      const sameRoom = this.code && this.code === code;
      this.raw({ t: 'join', code, cat, token: sameRoom ? this.token : null, v: Core.VERSION });
    }
    begin() { this.raw({ t: 'start' }); }
    send(m) { this.raw({ t: 'in', m }); }
    message(data) {
      let m;
      try { m = JSON.parse(data); } catch (e) { return; }
      switch (m.t) {
        case 'welcome':
          this.slot = m.slot; this.code = m.code; this.token = m.token;
          try { sessionStorage.setItem('pati_room', JSON.stringify({ code: m.code, token: m.token, cat: this.cat })); } catch (e) { /* */ }
          this.emit('welcome', m);
          break;
        case 'lobby': this.emit('lobby', m); break;
        case 'map': this.emit('map', m.map); break;
        case 's': this.emit('state', m.s, m.ev || []); break;
        case 'err': this.emit('error', m.msg); break;
      }
    }
    dropped() {
      this.ws = null;
      if (this.closed) return;
      this.emit('disconnect');
      setTimeout(() => this.reconnect(), Math.min(5000, 700 * ++this.retries));
    }
    async reconnect() {
      if (this.closed) return;
      try {
        await this.connect();
        if (this.code) this.join(this.code, this.cat);
        this.emit('reconnect');
      } catch (e) { this.dropped(); }
    }
    stop() { this.closed = true; if (this.ws) this.ws.close(); }
  }

  window.PatiNet = { SoloNet, OnlineNet, serverUrl };
})();
