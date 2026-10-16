import * as THREE from 'three';
import { WALLS, WINDOWS, DOORS, STAIR, STAIR_DIVIDER, SLABS, SITE, LEVELS, LOW_WALLS } from './plan.js';

const EYE = 1.62;
const RADIUS = 0.24;
const STEP_UP = 0.36;

const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];

// Furniture and fixtures you cannot walk through: [x0, z0, x1, z1, y0, y1]
const FURNITURE = [
  // ground floor
  [0.177, 5.66, 0.8, 8.281, 0, 1], [0.787, 7.655, 4.32, 8.281, 0, 1], [0.787, 5.66, 3.02, 6.5, 0, 1],
  [4.32, 5.97, 5.094, 8.281, 0, 2.4], [3.125, 1.05, 4.075, 3.95, 0, 0.9], [2.375, 1.05, 3.125, 1.9, 0, 0.9],
  [1.575, 2.3, 2.425, 3.6, 0, 0.5], [0.177, 1.4, 0.6, 3.6, 0, 1.8], [0.2, 0.202, 4.42, 0.62, 0, 0.5],
  [2.55, 9.75, 4.43, 11.8, 0, 0.7], [1.377, 9.3, 1.977, 11.8, 0, 2.5], [1.65, 8.483, 2.95, 8.94, 0, 0.8],
  [7.678, 10.0, 9.72, 11.5, 0, 0.7], [9.4, 8.483, 10.6, 9.1, 0, 0.8], [10.174, 9.5, 10.774, 11.6, 0, 2.3],
  [6.43, 9.43, 7.47, 9.701, 0, 2.2], [4.971, 10.25, 5.45, 11.1, 0, 0.9], [5.85, 11.05, 6.35, 11.8, 0, 1.2],
  [7.75, 7.6, 8.371, 8.1, 0, 0.5], [5.55, 4.506, 6.05, 4.86, 0, 0.9], [6.122, 5.6, 6.329, 5.97, -0.5, 3],
  // courtyard
  [6.55, 2.2, 8.95, 3.85, -0.1, 0.9], [6.95, 0.25, 8.95, 1.05, -0.1, 0.8], [9.03, 0.07, 9.13, 0.17, -0.1, 3], [9.03, 2.95, 9.13, 3.05, -0.1, 3],
  [SITE.sauna.x0, SITE.sauna.z0, SITE.sauna.x1, SITE.sauna.z1, -0.3, 2],
  // upper floor
  [4.675, 6.282, 6.871, 6.92, 3.25, 4.2], [1.377, 8.42, 1.8, 11.12, 3.25, 4.3], [2.0, 10.6, 3.85, 11.499, 3.25, 4.1],
  [9.86, 9.72, 10.871, 11.799, 3.25, 5.2], [9.1, 8.483, 10.871, 9.083, 3.25, 5.75], [8.15, 11.2, 9.75, 11.799, 3.25, 4.0],
  [7.577, 9.8, 7.98, 11.0, 3.25, 4.45], [7.62, 11.06, 8.34, 11.78, 3.25, 3.7],
  [4.675, 10.4, 5.15, 11.15, 3.25, 4.2], [5.78, 11.05, 6.32, 11.799, 3.25, 4.5], [6.475, 9.66, 7.325, 9.92, 3.25, 5.5],
  [3.3, 8.95, 4.1, 9.75, 3.25, 3.8], [2.05, 8.75, 2.85, 9.55, 3.25, 4.8],
];

export class Walker {
  constructor(camera, dom, { onExit, onMove } = {}) {
    this.camera = camera;
    this.dom = dom;
    this.onExit = onExit;
    this.onMove = onMove;
    this.enabled = false;
    this.pos = new THREE.Vector3(11.9, LEVELS.courtyard, 5.2);
    this.yaw = Math.PI / 2; // looking west
    this.pitch = -0.05;
    this.keys = new Set();
    this.joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
    this.look = { id: null, x: 0, y: 0 };
    this.vy = 0;
    // no-clip: walk through walls and furniture (floors and stairs still carry you)
    this.noclip = true;
    this.buildColliders();
    this.bind();
  }

  buildColliders() {
    const c = [];
    for (const r of WALLS.ground) c.push([...r, -0.5, LEVELS.upper]);
    for (const r of WALLS.upper) c.push([...r, LEVELS.upper, LEVELS.roof]);
    c.push([...STAIR_DIVIDER, 0, LEVELS.upper + 1.05]);
    for (const w of LOW_WALLS.ground) c.push([...w.slice(0, 4), -0.5, w[4] - 0.05]);
    for (const w of WINDOWS) {
      const lv = w.floor === 'ground' ? 0 : LEVELS.upper;
      if (w.open) {
        // only the closed half of an opened slider blocks
        const r = w.rect;
        c.push([r[0], r[1], r[2], (r[1] + r[3]) / 2 + 0.05, lv - 0.5, lv + 3]);
      } else c.push([...w.rect, lv - 0.5, lv + 3]);
    }
    for (const d of DOORS) if (d.kind === 'double') c.push([...d.rect, -0.5, 2.5]);
    // terrace/roof parapets are not reachable; fences around the lot
    const L = SITE.lot;
    c.push([L.x0 - 1, L.z0 - 1.2, SITE.path.x1 + 1, L.z0 - 0.25, -1, 3]);
    c.push([L.x0 - 1, L.z1 + 0.25, SITE.path.x1 + 1, L.z1 + 1.2, -1, 3]);
    c.push([SITE.path.x1 + 0.25, L.z0 - 1, SITE.path.x1 + 1.2, L.z1 + 1, -1, 3]);
    c.push([L.x0 - 1.2, L.z0 - 1, -0.03, L.z1 + 1, -1, 3]);
    for (const f of FURNITURE) c.push(f);
    this.colliders = c;
  }

  // Candidate walking surfaces at (x, z); pick the highest reachable one.
  floorAt(x, z, y) {
    const cands = [];
    // outside
    let out = LEVELS.lawn;
    const C = SITE.courtyard;
    if (inRect([5.672, C.z0, C.x1, C.z1], x, z)) out = LEVELS.courtyard;
    else if (inRect([C.x1, 4.4, SITE.path.x0, 6.08], x, z)) out = LEVELS.courtyard - 0.01;
    else if (inRect([SITE.path.x0, SITE.path.z0, SITE.path.x1, SITE.path.z1], x, z)) out = LEVELS.courtyard - 0.02;
    else if (inRect([10.227, 6.08, 11.08, 8.179], x, z)) out = LEVELS.courtyard - 0.015;
    else if (inRect([0.177, -0.65, 5.672, 0], x, z) || inRect([1.174, 12.0, 11.08, 12.35], x, z) || inRect([0.177, 8.483, 1.174, 12.35], x, z)) out = LEVELS.outside;
    cands.push(out);
    if (SLABS.ground.some((r) => inRect(r, x, z))) cands.push(0);
    // stairs
    const S = STAIR;
    const r = S.rise;
    const f1 = S.flight1, f2 = S.flight2, L = S.landing;
    if (inRect([f1.x0, f1.z0, f1.x1, f1.z1], x, z)) {
      const d = (f1.x1 - f1.x0) / f1.steps;
      cands.push(Math.min(f1.steps, Math.floor((x - f1.x0) / d) + 1) * r);
    }
    const lt = (f1.steps + 1) * r;
    if (inRect([L.x0, L.z0, L.x1, L.z1], x, z)) cands.push(lt);
    if (inRect([f2.x0, f2.z0, f2.x1, f2.z1], x, z)) {
      const d = (f2.x1 - f2.x0) / f2.steps;
      cands.push(lt + Math.min(f2.steps, Math.floor((f2.x1 - x) / d) + 1) * r);
    }
    if (SLABS.upper.some((rr) => inRect(rr, x, z))) cands.push(LEVELS.upper);
    // the roof terrace is only reachable when walking through walls
    if (this.noclip && SLABS.terrace.some((rr) => inRect(rr, x, z))) cands.push(LEVELS.upper);
    let best = -Infinity;
    for (const h of cands) if (h <= y + STEP_UP && h > best) best = h;
    if (best === -Infinity) best = Math.min(...cands);
    return best;
  }

  collide(p) {
    const y0 = p.y + 0.3, y1 = p.y + 1.7;
    for (let it = 0; it < 3; it++) {
      for (const c of this.colliders) {
        if (c[5] <= y0 || c[4] >= y1) continue;
        const cx = Math.max(c[0], Math.min(p.x, c[2]));
        const cz = Math.max(c[1], Math.min(p.z, c[3]));
        let dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < RADIUS * RADIUS) {
          if (d2 < 1e-10) {
            // centre inside the box: push out along the shortest axis
            const opts = [[c[0] - RADIUS - p.x, 0], [c[2] + RADIUS - p.x, 0], [0, c[1] - RADIUS - p.z], [0, c[3] + RADIUS - p.z]];
            opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
            p.x += opts[0][0]; p.z += opts[0][1];
          } else {
            const d = Math.sqrt(d2);
            const push = RADIUS - d;
            p.x += (dx / d) * push; p.z += (dz / d) * push;
          }
        }
      }
    }
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      this.keys.add(e.code);
      if (e.code === 'Escape' && !document.pointerLockElement) this.onExit?.();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    this.dom.addEventListener('click', () => {
      if (this.enabled && !this.isTouch && !document.pointerLockElement) this.dom.requestPointerLock?.();
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || document.pointerLockElement !== this.dom) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0022, -1.35, 1.35);
    });
    // drag-to-look for mouse users without pointer lock and for touch
    this.dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      if (e.pointerType === 'touch') this.isTouch = true;
      if (document.pointerLockElement === this.dom) return;
      if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45 && this.joy.id === null) {
        this.joy.id = e.pointerId; this.joy.ox = e.clientX; this.joy.oy = e.clientY;
        this.showJoystick(e.clientX, e.clientY);
      } else if (this.look.id === null && e.pointerType === 'touch') {
        this.look.id = e.pointerId; this.look.x = e.clientX; this.look.y = e.clientY;
      }
    });
    this.dom.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      if (e.pointerId === this.joy.id) {
        const dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
        const l = Math.min(1, Math.hypot(dx, dy) / 55);
        const a = Math.atan2(dy, dx);
        this.joy.x = Math.cos(a) * l; this.joy.y = Math.sin(a) * l;
        this.moveKnob(Math.cos(a) * l * 55, Math.sin(a) * l * 55);
      } else if (e.pointerId === this.look.id) {
        this.yaw -= (e.clientX - this.look.x) * 0.005;
        this.pitch = THREE.MathUtils.clamp(this.pitch - (e.clientY - this.look.y) * 0.005, -1.3, 1.3);
        this.look.x = e.clientX; this.look.y = e.clientY;
      }
    });
    const end = (e) => {
      if (e.pointerId === this.joy.id) { this.joy.id = null; this.joy.x = this.joy.y = 0; this.hideJoystick(); }
      if (e.pointerId === this.look.id) this.look.id = null;
    };
    this.dom.addEventListener('pointerup', end);
    this.dom.addEventListener('pointercancel', end);
  }

  showJoystick(x, y) {
    if (!this.joyEl) {
      this.joyEl = document.createElement('div');
      this.joyEl.className = 'joystick';
      this.joyEl.innerHTML = '<div class="knob"></div>';
      document.body.appendChild(this.joyEl);
    }
    this.joyEl.style.display = 'block';
    this.joyEl.style.left = `${x - 60}px`;
    this.joyEl.style.top = `${y - 60}px`;
    this.moveKnob(0, 0);
  }

  moveKnob(dx, dy) {
    if (this.joyEl) this.joyEl.firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  hideJoystick() {
    if (this.joyEl) this.joyEl.style.display = 'none';
  }

  enter(pos, yaw) {
    if (pos) this.pos.copy(pos);
    if (yaw !== undefined) this.yaw = yaw;
    this.pitch = -0.05;
    this.pos.y = this.floorAt(this.pos.x, this.pos.z, this.pos.y + 0.5);
    this.enabled = true;
    this.apply();
  }

  exit() {
    this.enabled = false;
    this.keys.clear();
    if (document.pointerLockElement) document.exitPointerLock();
    this.hideJoystick();
  }

  teleport(x, z, level, yaw) {
    this.pos.set(x, level, z);
    if (yaw !== undefined) this.yaw = yaw;
    this.pos.y = this.floorAt(x, z, level + 0.1);
    this.apply();
  }

  update(dt) {
    if (!this.enabled) return;
    dt = Math.min(dt, 0.05);
    let f = 0, s = 0;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyA')) s -= 1;
    if (k.has('KeyD')) s += 1;
    if (k.has('ArrowLeft')) this.yaw += 1.8 * dt;
    if (k.has('ArrowRight')) this.yaw -= 1.8 * dt;
    f -= this.joy.y; s += this.joy.x;
    const speed = (k.has('ShiftLeft') || k.has('ShiftRight') ? 3.2 : 1.6);
    const len = Math.hypot(f, s);
    if (len > 1) { f /= len; s /= len; }
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const next = this.pos.clone().addScaledVector(fwd, f * speed * dt).addScaledVector(right, s * speed * dt);
    // climb or fall to the walking surface
    const target = this.floorAt(next.x, next.z, this.pos.y);
    if (!this.noclip) {
      if (target > this.pos.y + STEP_UP) { next.x = this.pos.x; next.z = this.pos.z; }
      this.collide(next);
    }
    const ground = this.floorAt(next.x, next.z, this.pos.y);
    if (ground < next.y - 0.01) {
      this.vy -= 9.8 * dt;
      next.y = Math.max(ground, next.y + this.vy * dt);
      if (next.y - ground < 0.4 && f !== 0) next.y = THREE.MathUtils.lerp(next.y, ground, 0.5);
    } else {
      this.vy = 0;
      next.y = THREE.MathUtils.lerp(this.pos.y, ground, Math.min(1, dt * 14));
      if (Math.abs(next.y - ground) < 0.005) next.y = ground;
    }
    this.pos.copy(next);
    this.apply();
  }

  apply() {
    const c = this.camera;
    c.position.set(this.pos.x, this.pos.y + EYE, this.pos.z);
    c.rotation.order = 'YXZ';
    c.rotation.set(this.pitch, this.yaw, 0);
    this.onMove?.(this.pos, this.yaw);
  }

  get level() {
    return this.pos.y > 2 ? 'upper' : 'ground';
  }
}
