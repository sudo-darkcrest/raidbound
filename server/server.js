// Raidbound online co-op relay.
// Every browser runs the same game engine with the same seed. This server only
// keeps lobbies, orders the players' commands, and replays them to anyone who
// reconnects. It never runs game rules itself.
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const rooms = new Map(); // code -> room
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do { c = Array.from({ length: 5 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join(''); } while (rooms.has(c)); return c; };
const newId = () => Math.random().toString(36).slice(2, 10);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end(`Raidbound lobby server is awake. Rooms open: ${rooms.size}\n`);
});
const wss = new WebSocketServer({ server });

function send(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function lobbyState(room) {
  return { t: 'lobby', code: room.code, host: room.host, started: !!room.start, raid: room.raid, diff: room.diff,
    players: room.players.map(p => ({ id: p.id, name: p.name, hero: p.hero, deckMode: p.deckMode, ready: !!p.deck, online: !!p.bot || !!(p.ws && p.ws.readyState === 1), ai: !!p.ai, bot: !!p.bot })) };
}
function broadcast(room, msg) { for (const p of room.players) send(p.ws, msg); }
function pushCmd(room, c, from) {
  const m = { t: 'cmd', seq: room.cmds.length, c, from };
  room.cmds.push(m);
  broadcast(room, m);
}

wss.on('connection', ws => {
  let room = null, me = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'ping') return send(ws, { t: 'pong' });
    if (m.t === 'create') {
      const code = newCode();
      room = { code, host: null, players: [], raid: 'crypt', diff: 'normal', start: null, cmds: [], touched: Date.now() };
      rooms.set(code, room);
      me = { id: newId(), name: (m.name || 'Hero').slice(0, 24), hero: m.hero || 'aldric', deckMode: 'starter', deck: null, ws };
      room.host = me.id; room.players.push(me);
      send(ws, { t: 'welcome', id: me.id, code });
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'join') {
      const r = rooms.get(String(m.code || '').toUpperCase().trim());
      if (!r) return send(ws, { t: 'error', why: 'No raid with that code. Check the letters and try again.' });
      // rejoin with a known id
      const known = m.id && r.players.find(p => p.id === m.id);
      if (known) {
        const wasAi = known.ai;
        room = r; me = known; me.ws = ws; me.ai = false;
        send(ws, { t: 'welcome', id: me.id, code: r.code, rejoin: true });
        broadcast(r, lobbyState(r));
        if (r.start) {
          send(ws, r.start); for (const c of r.cmds) send(ws, c); send(ws, { t: 'caughtup', seq: r.cmds.length });
          if (wasAi) pushCmd(r, { t: 'human', seat: r.players.indexOf(me) }, 'server');
        }
        return;
      }
      if (r.start) return send(ws, { t: 'error', why: 'That raid has already started.' });
      if (r.players.length >= 4) return send(ws, { t: 'error', why: 'That raid is full (4 heroes).' });
      room = r;
      me = { id: newId(), name: (m.name || 'Hero').slice(0, 24), hero: m.hero || 'aldric', deckMode: 'starter', deck: null, ws };
      r.players.push(me);
      send(ws, { t: 'welcome', id: me.id, code: r.code });
      return broadcast(r, lobbyState(r));
    }
    if (!room || !me) return;
    room.touched = Date.now();
    if (m.t === 'seat') { // hero / deck choice in the lobby
      if (room.start) return;
      if (m.hero) me.hero = String(m.hero);
      if (m.deckMode) me.deckMode = String(m.deckMode);
      me.deck = Array.isArray(m.deck) ? m.deck.slice(0, 40) : null;
      me.pet = m.pet || null;
      if (m.name) me.name = String(m.name).slice(0, 24);
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'settings' && me.id === room.host && !room.start) {
      if (m.raid) room.raid = String(m.raid);
      if (m.diff) room.diff = String(m.diff);
      return broadcast(room, lobbyState(room));
    }
    // #35: the host can fill empty seats with AI heroes
    if (m.t === 'addbot' && me.id === room.host && !room.start) {
      if (room.players.length >= 4) return send(ws, { t: 'error', why: 'The raid is full (4 heroes).' });
      room.players.push({ id: 'bot-' + newId(), bot: true, ai: true, ws: null, name: String(m.name || 'AI hero').slice(0, 24), hero: String(m.hero || 'aldric'), deckMode: 'starter', deck: Array.isArray(m.deck) ? m.deck.slice(0, 40) : null });
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'botset' && me.id === room.host && !room.start) {
      const b = room.players.find(x => x.id === m.id && x.bot); if (!b) return;
      if (m.hero) b.hero = String(m.hero); if (m.name) b.name = String(m.name).slice(0, 24);
      if (Array.isArray(m.deck)) b.deck = m.deck.slice(0, 40);
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'kick' && me.id === room.host && !room.start) {
      const p = room.players.find(x => x.id === m.id); if (!p || p.id === room.host) return;
      send(p.ws, { t: 'error', why: 'The host removed you from the lobby.' });
      room.players = room.players.filter(x => x !== p);
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'start' && me.id === room.host && !room.start) {
      if (room.players.some(p => !p.deck)) return send(ws, { t: 'error', why: 'Someone is still choosing a deck.' });
      const seed = Math.floor(Math.random() * 1e9);
      const cfg = { raid: room.raid, difficulty: room.diff, seed, online: true,
        party: room.players.map((p, i) => ({ hero: p.hero, deck: p.deck, name: p.name, pet: p.bot ? null : p.pet || null, owner: p.bot ? null : p.id, auto: !!p.bot })) };
      room.start = { t: 'start', cfg };
      return broadcast(room, room.start);
    }
    if (m.t === 'cmd' && room.start) return pushCmd(room, m.c, me.id);
    if (m.t === 'chat') return broadcast(room, { t: 'chat', from: me.name, text: String(m.text || '').slice(0, 200) });
  });
  ws.on('close', () => {
    if (!room || !me) return;
    if (me.ws !== ws) return; // replaced by a newer connection
    me.ws = null;
    if (!room.start) {
      room.players = room.players.filter(p => p !== me);
      if (!room.players.some(p => !p.bot)) return rooms.delete(room.code);
      if (room.host === me.id) room.host = room.players.find(p => !p.bot).id;
      return broadcast(room, lobbyState(room));
    }
    // mid-raid: give the hero to the AI after a short grace period
    setTimeout(() => {
      if (me.ws || me.ai) return;
      me.ai = true;
      const seat = room.players.indexOf(me);
      pushCmd(room, { t: 'ai', seat }, 'server');
      broadcast(room, lobbyState(room));
    }, +process.env.GRACE_MS || 20000);
  });
});

// tidy up rooms nobody has touched for 3 hours
setInterval(() => { const now = Date.now(); for (const [k, r] of rooms) if (now - r.touched > 3 * 3600e3 && !r.players.some(p => p.ws && p.ws.readyState === 1)) rooms.delete(k); }, 600e3);
server.listen(PORT, () => console.log('Raidbound lobby listening on ' + PORT));
