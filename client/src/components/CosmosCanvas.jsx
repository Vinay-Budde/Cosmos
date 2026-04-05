import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MAP, ROOMS, T } from '../utils/mapLayout';
import { keys } from '../hooks/useMovement';

const SPEED = 4;
const PROX_RADIUS = 4 * TILE_SIZE;
const EMIT_INTERVAL = 60;     // ms between position emits
const NEARBY_INTERVAL = 200;  // ms between proximity state updates (avoid 60fps React re-renders)

// ─── Colour palette ──────────────────────────────────────────────
const C = {
  beigeA:  0xf5e6c8, beigeB:  0xeddcaa,
  brownA:  0x9a6b3a, brownB:  0x8a5c2e,
  greenA:  0x62b35a, greenB:  0x52a34a,
  darkA:   0x3b2518, darkB:   0x2e1a10,
  recepA:  0xe8d090, recepB:  0xd8c078,
  corrA:   0xc8aa60, corrB:   0xb89840,
  wall:    0x2a1a0a, door: 0xbba060,
  grass:   0x3a7a26, leafA: 0x2d7a2d, leafB: 0x1a6a1a, trunk: 0x6b3c14,
  deskTop: 0xd4922a, deskSide: 0x8b5a1e,
  mon:     0x1a1a2e, monScr: 0x4f8fe0,
  chairB:  0x2a4a9a, chairS: 0x3a5ab0,
  plantG:  0x2a8c2a, plantP: 0xc47a35,
  couchA:  0x7b3a9b, couchB: 0x5a2a7a,
  wb:      0xeeeeee, wbFrame: 0x888888,
  tbl:     0xc48c20, recDsk: 0x9b6b2a, recTop: 0xe0a040,
  arcade:  0x111122, arcScr: 0x00ffcc,
  prox:    0x22c55e,
};

// ─── Draw one tile ───────────────────────────────────────────────
function drawTile(g, type, px, py, S) {
  const alt = ((px / S) + (py / S)) % 2 === 0;
  const floor = (col) => {
    g.beginFill(col).drawRect(px, py, S, S).endFill();
    g.lineStyle(0.4, 0x000000, 0.07);
    g.moveTo(px, py + S * 0.33).lineTo(px + S, py + S * 0.33);
    g.moveTo(px, py + S * 0.67).lineTo(px + S, py + S * 0.67);
    g.lineStyle(0);
  };

  switch (type) {
    case T.BEIGE:    floor(alt ? C.beigeA : C.beigeB); break;
    case T.BROWN:    floor(alt ? C.brownA : C.brownB); break;
    case T.GREEN:    floor(alt ? C.greenA : C.greenB); break;
    case T.DARK:     floor(alt ? C.darkA  : C.darkB);  break;
    case T.RECEP:    floor(alt ? C.recepA : C.recepB); break;
    case T.CORRIDOR: floor(alt ? C.corrA  : C.corrB);  break;

    case T.WALL:
      g.beginFill(C.wall).drawRect(px, py, S, S).endFill();
      g.beginFill(0xffffff, 0.06).drawRect(px, py, S, S * 0.18).endFill();
      g.beginFill(0x000000, 0.3) .drawRect(px, py + S * 0.75, S, S * 0.25).endFill();
      break;

    case T.DOOR:
      g.beginFill(C.door).drawRect(px, py, S, S).endFill();
      g.beginFill(0x000000, 0.18).drawRect(px, py, 3, S).endFill();
      g.beginFill(0x000000, 0.18).drawRect(px + S - 3, py, 3, S).endFill();
      break;

    case T.TREE:
      g.beginFill(C.grass).drawRect(px, py, S, S).endFill();
      g.beginFill(C.trunk).drawRect(px + S*0.38, py + S*0.55, S*0.24, S*0.45).endFill();
      g.beginFill(C.leafA).drawEllipse(px + S*0.5, py + S*0.42, S*0.44, S*0.38).endFill();
      g.beginFill(C.leafB).drawEllipse(px + S*0.5, py + S*0.28, S*0.32, S*0.27).endFill();
      g.beginFill(0xffffff, 0.12).drawEllipse(px + S*0.38, py + S*0.22, S*0.14, S*0.1).endFill();
      g.beginFill(0x000000, 0.15).drawEllipse(px + S*0.5, py + S*0.9, S*0.38, S*0.08).endFill();
      break;

    case T.DESK:
      g.beginFill(C.deskSide).drawRect(px+1, py+S*0.65, S-2, S*0.32).endFill();
      g.beginFill(C.deskTop) .drawRect(px+1, py+2,      S-2, S*0.65).endFill();
      g.beginFill(0x000000, 0.12).drawRect(px+1, py+S*0.85, S-2, S*0.1).endFill();
      break;

    case T.MONITOR:
      g.beginFill(0x444444).drawRect(px+S*0.38, py+S*0.68, S*0.24, S*0.2).endFill();
      g.beginFill(0x333333).drawRect(px+S*0.26, py+S*0.85, S*0.48, S*0.08).endFill();
      g.beginFill(C.mon)   .drawRect(px+S*0.06, py+S*0.07, S*0.88, S*0.64).endFill();
      g.beginFill(C.monScr).drawRect(px+S*0.10, py+S*0.11, S*0.80, S*0.57).endFill();
      g.beginFill(0xffffff, 0.28).drawRect(px+S*0.12, py+S*0.13, S*0.18, S*0.1).endFill();
      break;

    case T.CHAIR:
      g.beginFill(C.chairB).drawRect(px+S*0.14, py+S*0.08, S*0.72, S*0.26).endFill();
      g.beginFill(C.chairS).drawRect(px+S*0.14, py+S*0.32, S*0.72, S*0.44).endFill();
      g.beginFill(0x666666).drawRect(px+S*0.18, py+S*0.74, S*0.14, S*0.22).endFill();
      g.beginFill(0x666666).drawRect(px+S*0.68, py+S*0.74, S*0.14, S*0.22).endFill();
      break;

    case T.PLANT:
      g.beginFill(C.plantP).drawRect(px+S*0.3, py+S*0.6, S*0.4, S*0.36).endFill();
      g.beginFill(C.plantG).drawEllipse(px+S*0.5, py+S*0.4, S*0.36, S*0.32).endFill();
      g.beginFill(0x1a6b1a).drawEllipse(px+S*0.34, py+S*0.5, S*0.18, S*0.15).endFill();
      g.beginFill(0x1a6b1a).drawEllipse(px+S*0.66, py+S*0.48, S*0.18, S*0.15).endFill();
      break;

    case T.COUCH:
      g.beginFill(C.couchB).drawRect(px+S*0.04, py+S*0.1, S*0.92, S*0.24).endFill();
      g.beginFill(C.couchA).drawRect(px+S*0.04, py+S*0.3, S*0.92, S*0.52).endFill();
      g.beginFill(C.couchB).drawRect(px+S*0.04, py+S*0.24, S*0.13, S*0.42).endFill();
      g.beginFill(C.couchB).drawRect(px+S*0.83, py+S*0.24, S*0.13, S*0.42).endFill();
      g.lineStyle(1, 0x000000, 0.14);
      g.moveTo(px+S*0.5, py+S*0.3).lineTo(px+S*0.5, py+S*0.82);
      g.lineStyle(0);
      break;

    case T.WHITEBOARD:
      g.beginFill(C.wbFrame).drawRect(px+1, py+S*0.12, S-2, S*0.74).endFill();
      g.beginFill(C.wb)     .drawRect(px+3, py+S*0.17, S-6, S*0.65).endFill();
      g.lineStyle(1.2, 0x2244cc, 0.55);
      g.moveTo(px+5, py+S*0.3) .lineTo(px+S*0.72, py+S*0.3);
      g.moveTo(px+5, py+S*0.45).lineTo(px+S*0.58, py+S*0.45);
      g.moveTo(px+5, py+S*0.6) .lineTo(px+S*0.66, py+S*0.6);
      g.lineStyle(0);
      break;

    case T.ROUND_TABLE:
      g.beginFill(0x000000, 0.1).drawEllipse(px+S*0.5, py+S*0.82, S*0.42, S*0.1).endFill();
      g.beginFill(C.tbl).drawEllipse(px+S*0.5, py+S*0.5, S*0.42, S*0.38).endFill();
      g.beginFill(0xffffff, 0.14).drawEllipse(px+S*0.38, py+S*0.36, S*0.14, S*0.09).endFill();
      break;

    case T.RECEP_DESK:
      g.beginFill(C.recDsk).drawRect(px, py+S*0.5, S, S*0.46).endFill();
      g.beginFill(C.recTop).drawRect(px, py+S*0.05, S, S*0.48).endFill();
      break;

    case T.ARCADE:
      g.beginFill(C.arcade).drawRect(px+S*0.08, py+S*0.04, S*0.84, S*0.92).endFill();
      g.beginFill(C.arcScr).drawRect(px+S*0.16, py+S*0.09, S*0.68, S*0.4).endFill();
      g.beginFill(0xff4488).drawCircle(px+S*0.5, py+S*0.64, S*0.1).endFill();
      g.beginFill(0xffff00).drawCircle(px+S*0.3, py+S*0.72, S*0.07).endFill();
      g.beginFill(0xff4444).drawCircle(px+S*0.7, py+S*0.72, S*0.07).endFill();
      break;

    default: break;
  }
}

// ─── Pixel-art Avatar ────────────────────────────────────────────
function makeAvatar(name, color) {
  const ctr = new PIXI.Container();
  const g = new PIXI.Graphics();
  const c = parseInt(color.replace('#', ''), 16);
  const S = 28;

  g.beginFill(0x000000, 0.18).drawEllipse(S/2, S-2, S*0.34, S*0.09).endFill();
  g.beginFill(0x223355).drawRect(S*0.26, S*0.78, S*0.2, S*0.18).endFill();
  g.beginFill(0x223355).drawRect(S*0.54, S*0.78, S*0.2, S*0.18).endFill();
  g.beginFill(0x111111).drawRect(S*0.22, S*0.93, S*0.26, S*0.07).endFill();
  g.beginFill(0x111111).drawRect(S*0.52, S*0.93, S*0.26, S*0.07).endFill();
  g.beginFill(c).drawRect(S*0.22, S*0.44, S*0.56, S*0.36).endFill();
  g.beginFill(c, 0.8).drawRect(S*0.04, S*0.46, S*0.17, S*0.28).endFill();
  g.beginFill(c, 0.8).drawRect(S*0.79, S*0.46, S*0.17, S*0.28).endFill();
  g.beginFill(0xf5d090).drawEllipse(S*0.5, S*0.29, S*0.24, S*0.26).endFill();
  g.beginFill(0x4a2810).drawRect(S*0.27, S*0.06, S*0.46, S*0.15).endFill();
  g.beginFill(0x4a2810).drawEllipse(S*0.5, S*0.1, S*0.25, S*0.13).endFill();
  g.beginFill(0x111111).drawRect(S*0.36, S*0.26, S*0.08, S*0.08).endFill();
  g.beginFill(0x111111).drawRect(S*0.56, S*0.26, S*0.08, S*0.08).endFill();

  g.position.set(-S/2, -S);
  ctr.addChild(g);

  const txt = new PIXI.Text(name, {
    fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '900',
    fill: 0xffffff, stroke: 0x000000, strokeThickness: 3,
  });
  txt.anchor.set(0.5, 0);
  txt.position.set(0, 2);
  ctr.addChild(txt);

  ctr._targetX = null;
  ctr._targetY = null;
  return ctr;
}

// ─── Walkability helper ──────────────────────────────────────────
function isWalkable(wx, wy) {
  const tx = Math.floor(wx / TILE_SIZE);
  const ty = Math.floor(wy / TILE_SIZE);
  if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return false;
  const t = MAP[ty][tx];
  return t !== T.TREE && t !== T.WALL;
}

// ─── Component ───────────────────────────────────────────────────
export default function CosmosCanvas({ socket, playerInfo, otherUsers, setLocalRoom, setNearbyUsers, zoom }) {
  const canvasRef    = useRef(null);
  const meRef        = useRef({ x: 30 * TILE_SIZE, y: 30 * TILE_SIZE, lastEmit: 0, lastNearby: 0 });
  const nearbyRef    = useRef(new Set());
  const zoomRef      = useRef(zoom);
  const clickTarget  = useRef(null);
  const otherUsersRef = useRef(otherUsers); // live ref so ticker can read without re-mounting
  const stateRef     = useRef({ app: null, world: null, players: null, fx: null, others: {}, clickDot: null });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { otherUsersRef.current = otherUsers; }, [otherUsers]);

  // ── Build map (runs once) ─────────────────────────────────────
  const buildMap = () => {
    const g = new PIXI.Graphics();
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        drawTile(g, MAP[y][x], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);
      }
    }
    g.lineStyle(0);
    return g;
  };

  const buildLabels = () => {
    const ctr = new PIXI.Container();
    ROOMS.forEach(r => {
      const t = new PIXI.Text(r.id, {
        fontFamily: 'Inter, monospace', fontSize: 9, fontWeight: '900',
        fill: 0xffffff, stroke: 0x000000, strokeThickness: 3,
      });
      t.position.set(r.x1 * TILE_SIZE + 3, r.y1 * TILE_SIZE + 2);
      ctr.addChild(t);
    });
    return ctr;
  };

  // ── Main PIXI setup ───────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;

    const app = new PIXI.Application({
      width: el.clientWidth, height: el.clientHeight,
      backgroundColor: C.grass,
      resizeTo: el,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    el.appendChild(app.view);

    const world   = new PIXI.Container();
    const players = new PIXI.Container();
    const fx      = new PIXI.Graphics();
    const clickDot = new PIXI.Graphics();
    world.addChild(buildMap());
    world.addChild(buildLabels());
    world.addChild(clickDot);
    world.addChild(fx);
    world.addChild(players);  // players on top of fx
    app.stage.addChild(world);

    stateRef.current = { app, world, players, fx, others: {}, clickDot };

    // ── Click-to-move ────────────────────────────────────────────
    app.stage.eventMode = 'static';
    app.stage.hitArea   = app.screen;
    app.stage.on('pointerdown', (e) => {
      const z = zoomRef.current;
      // e.client.x / e.client.y are the PIXI v7 pointer position
      const clientX = e.clientX ?? e.data?.global?.x ?? 0;
      const clientY = e.clientY ?? e.data?.global?.y ?? 0;
      const wx = (clientX - world.x) / z;
      const wy = (clientY - world.y) / z;
      if (!isWalkable(wx, wy)) return;
      clickTarget.current = { x: wx, y: wy };
    });

    // Me avatar
    const me = makeAvatar(playerInfo.name, playerInfo.color);
    me.position.set(meRef.current.x, meRef.current.y);
    players.addChild(me);

    // ── Ticker ───────────────────────────────────────────────────
    app.ticker.add(() => {
      const pos = meRef.current;
      const now = Date.now();
      let dx = 0, dy = 0;

      // 1. Input — keyboard or click-to-move
      const anyKey = keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
                     keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];

      if (anyKey) {
        clickTarget.current = null;
        clickDot.clear();
        if (keys['w'] || keys['ArrowUp'])    dy -= SPEED;
        if (keys['s'] || keys['ArrowDown'])  dy += SPEED;
        if (keys['a'] || keys['ArrowLeft'])  dx -= SPEED;
        if (keys['d'] || keys['ArrowRight']) dx += SPEED;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

      } else if (clickTarget.current) {
        const tgt = clickTarget.current;
        const distX = tgt.x - pos.x;
        const distY = tgt.y - pos.y;
        const dist  = Math.hypot(distX, distY);

        if (dist < SPEED + 1) {
          clickTarget.current = null;
          clickDot.clear();
        } else {
          const ratio = SPEED / dist;
          dx = distX * ratio;
          dy = distY * ratio;
          // Pulsing target dot
          const pulse = 0.5 + 0.5 * Math.sin((now / 400) * Math.PI * 2);
          const r = 5 + pulse * 4;
          clickDot.clear();
          clickDot.beginFill(0x22c55e, 0.2 + pulse * 0.2).drawCircle(tgt.x, tgt.y, r + 5).endFill();
          clickDot.beginFill(0x22c55e, 0.85).drawCircle(tgt.x, tgt.y, r * 0.5).endFill();
          clickDot.beginFill(0xffffff, 0.95).drawCircle(tgt.x, tgt.y, r * 0.22).endFill();
        }
      }

      // 2. Apply movement with collision
      const nx = Math.max(TILE_SIZE, Math.min((MAP_WIDTH - 1)  * TILE_SIZE, pos.x + dx));
      const ny = Math.max(TILE_SIZE, Math.min((MAP_HEIGHT - 1) * TILE_SIZE, pos.y + dy));
      if (isWalkable(nx, pos.y)) pos.x = nx;
      if (isWalkable(pos.x, ny)) pos.y = ny;
      me.position.set(pos.x, pos.y);

      // 3. Camera
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const z  = zoomRef.current;
      const mw = MAP_WIDTH  * TILE_SIZE * z;
      const mh = MAP_HEIGHT * TILE_SIZE * z;
      world.scale.set(z);
      world.x = mw <= cw ? (cw - mw) / 2 : Math.min(0, Math.max(cw - mw, cw/2 - pos.x * z));
      world.y = mh <= ch ? (ch - mh) / 2 : Math.min(0, Math.max(ch - mh, ch/2 - pos.y * z));

      // 4. Emit position (throttled)
      if (now - pos.lastEmit > EMIT_INTERVAL && (dx || dy)) {
        const gx = Math.floor(pos.x / TILE_SIZE);
        const gy = Math.floor(pos.y / TILE_SIZE);
        const room = ROOMS.find(r => gx >= r.x1 && gx <= r.x2 && gy >= r.y1 && gy <= r.y2)?.id || 'Spatial';
        setLocalRoom(room);
        socket.emit('position_update', { x: pos.x, y: pos.y, room });
        pos.lastEmit = now;
      }

      // 5. Interpolate other users IN ticker (no lag)
      const users = otherUsersRef.current;
      users.forEach(u => {
        const spr = stateRef.current.others[u.socketId];
        if (spr && u.x != null && u.y != null) {
          spr.x += (u.x - spr.x) * 0.18;
          spr.y += (u.y - spr.y) * 0.18;
        }
      });

      // 6. Proximity detection (throttled to avoid 60fps React re-renders)
      if (now - pos.lastNearby > NEARBY_INTERVAL) {
        pos.lastNearby = now;
        const cur = new Set();
        Object.entries(stateRef.current.others).forEach(([sid, spr]) => {
          if (Math.hypot(pos.x - spr.x, pos.y - spr.y) < PROX_RADIUS) cur.add(sid);
        });
        // Only emit/update if changed
        const prevArr = Array.from(nearbyRef.current).sort().join(',');
        const curArr  = Array.from(cur).sort().join(',');
        if (prevArr !== curArr) {
          cur.forEach(id => { if (!nearbyRef.current.has(id)) socket.emit('proximity_connect', { targetSocketId: id }); });
          nearbyRef.current.forEach(id => { if (!cur.has(id)) socket.emit('proximity_disconnect', { targetSocketId: id }); });
          nearbyRef.current = cur;
          setNearbyUsers(Array.from(cur));
        }

        // Proximity visual
        fx.clear();
        fx.lineStyle(1.5 / z, C.prox, 0.25);
        fx.drawCircle(pos.x, pos.y, PROX_RADIUS);
        cur.forEach(id => {
          const p = stateRef.current.others[id];
          if (p) {
            fx.lineStyle(1.5 / z, C.prox, 0.45);
            fx.moveTo(pos.x, pos.y).lineTo(p.x, p.y);
          }
        });
      }
    });

    return () => app.destroy(true, true);
  }, [playerInfo, socket]);

  // ── Manage other users (create/remove sprites) ────────────────
  useEffect(() => {
    const { players, others } = stateRef.current;
    if (!players) return;

    // Add new users
    otherUsers.forEach(u => {
      if (!others[u.socketId]) {
        const spr = makeAvatar(u.username, u.color);
        if (u.x != null) spr.position.set(u.x, u.y);
        others[u.socketId] = spr;
        players.addChild(spr);
      }
    });

    // Remove disconnected
    const live = new Set(otherUsers.map(u => u.socketId));
    Object.keys(others).forEach(sid => {
      if (!live.has(sid)) {
        players.removeChild(others[sid]);
        delete others[sid];
      }
    });
  }, [otherUsers]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
