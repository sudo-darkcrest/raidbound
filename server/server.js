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
// #65 dungeon runs: up to 3 heroes; difficulty sets the dungeon's starting level and who goes first
const DMODES = { novice: [1, false], experienced: [1, true], heroic: [2, true], legendary: [3, true] };
const cap = room => room.mode === 'dungeon' ? 3 : 4;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end(`Raidbound lobby server is awake. Rooms open: ${rooms.size}\n`);
});
const wss = new WebSocketServer({ server });

function send(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function lobbyState(room) {
  return { t: 'lobby', code: room.code, host: room.host, started: !!room.start, mode: room.mode, raid: room.raid, diff: room.diff, max: cap(room),
    players: room.players.map(p => ({ id: p.id, name: p.name, hero: p.hero, deckMode: p.deckMode, ready: !!p.deck, online: !!p.bot || !!(p.ws && p.ws.readyState === 1), ai: !!p.ai, bot: !!p.bot })) };
}
function broadcast(room, msg) { for (const p of room.players) send(p.ws, msg); }
// Chat: plain text only, kept apart from the game's command list so it can never knock players out of step.
// The last 50 lines are kept so someone who drops and rejoins sees what they missed.
const CHAT_KEEP = 50, CHAT_LEN = 200, CHAT_BURST = 6, CHAT_WINDOW = 8000;
const cleanChat = t => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_LEN);
const chatLog = room => ({ t: 'chatlog', log: room.chat });
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
      room = { code, host: null, players: [], mode: 'raid', raid: 'crypt', diff: 'normal', start: null, cmds: [], chat: [], chatN: 0, touched: Date.now() };
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
        send(ws, chatLog(r));
        broadcast(r, lobbyState(r));
        if (r.start) {
          send(ws, r.start); for (const c of r.cmds) send(ws, c); send(ws, { t: 'caughtup', seq: r.cmds.length });
          if (wasAi) pushCmd(r, { t: 'human', seat: r.players.indexOf(me) }, 'server');
        }
        return;
      }
      if (r.start) return send(ws, { t: 'error', why: 'That raid has already started.' });
      if (r.players.length >= cap(r)) return send(ws, { t: 'error', why: `That ${r.mode === 'dungeon' ? 'dungeon run' : 'raid'} is full (${cap(r)} heroes).` });
      room = r;
      me = { id: newId(), name: (m.name || 'Hero').slice(0, 24), hero: m.hero || 'aldric', deckMode: 'starter', deck: null, ws };
      r.players.push(me);
      send(ws, { t: 'welcome', id: me.id, code: r.code });
      send(ws, chatLog(r));
      return broadcast(r, lobbyState(r));
    }
    if (!room || !me) return;
    room.touched = Date.now();
    if (m.t === 'seat') { // hero / deck choice in the lobby
      if (room.start) return;
      if (m.hero) me.hero = String(m.hero);
      if (m.deckMode) me.deckMode = String(m.deckMode);
      me.deck = Array.isArray(m.deck) ? m.deck.slice(0, 40) : null;
      me.lands = Array.isArray(m.lands) ? m.lands.slice(0, 10).map(String) : null; // #125: the hero's ten lands (the game checks them)
      me.pet = m.pet || null;
      if (m.name) me.name = String(m.name).slice(0, 24);
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'settings' && me.id === room.host && !room.start) {
      if (m.mode === 'dungeon' || m.mode === 'raid') {
        if (m.mode === 'dungeon' && room.players.length > 3) return send(ws, { t: 'error', why: 'Dungeons take up to 3 heroes. Remove a hero first.' });
        room.mode = m.mode;
      }
      if (m.raid) room.raid = String(m.raid);
      if (m.diff) room.diff = String(m.diff);
      return broadcast(room, lobbyState(room));
    }
    // #35: the host can fill empty seats with AI heroes
    if (m.t === 'addbot' && me.id === room.host && !room.start) {
      if (room.players.length >= cap(room)) return send(ws, { t: 'error', why: `The party is full (${cap(room)} heroes).` });
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
      if (room.players.length > cap(room)) return send(ws, { t: 'error', why: `Too many heroes (up to ${cap(room)}).` });
      const seed = Math.floor(Math.random() * 1e9);
      const sp = +m.speed;
      const cfg = { raid: room.raid, difficulty: room.diff, seed, online: true, speed: sp > 0 && sp <= 1 ? sp : 0.55,
        party: room.players.map((p, i) => ({ hero: p.hero, deck: p.deck, lands: p.bot ? null : p.lands || null, name: p.name, pet: p.bot ? null : p.pet || null, owner: p.bot ? null : p.id, auto: !!p.bot })) };
      if (room.mode === 'dungeon') { const dm = DMODES[room.diff] || DMODES.novice; Object.assign(cfg, { dungeon: true, dungeonLevel: dm[0], dungeonFirst: dm[1] }); }
      room.start = { t: 'start', cfg };
      broadcast(room, room.start);
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'cmd' && room.start) return pushCmd(room, m.c, me.id);
    // after a run ends the host opens the same lobby again for the next one
    if (m.t === 'reopen' && me.id === room.host && room.start) {
      room.start = null; room.cmds = [];
      room.players = room.players.filter(p => p.bot || (p.ws && p.ws.readyState === 1));
      room.players.forEach(p => { if (!p.bot) p.ai = false; });
      return broadcast(room, lobbyState(room));
    }
    if (m.t === 'chat') {
      const text = cleanChat(m.text); if (!text) return;
      const now = Date.now();
      me.chatT = (me.chatT || []).filter(x => now - x < CHAT_WINDOW);
      if (me.chatT.length >= CHAT_BURST) return send(ws, { t: 'chatslow' }); // spam guard: 6 lines in 8 seconds
      me.chatT.push(now);
      const line = { t: 'chat', n: ++room.chatN, id: me.id, from: me.name, text, q: !!m.q };
      room.chat.push(line); if (room.chat.length > CHAT_KEEP) room.chat.shift();
      return broadcast(room, line);
    }
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
