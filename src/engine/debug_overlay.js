// Optional debug overlay drawn in the world pass: collision tiles (red), warps (blue), anchors (green
// crosses + names), interactables (yellow outlines), actor hitboxes (magenta). Static parts are baked
// into one map-sized canvas texture; hitboxes are redrawn each frame into a second small pool.
import * as THREE from 'three';
import { TILE } from '../core/constants.js';
import { makePixelMaterial, ORDER } from './sprites.js';
import { getHitbox } from './mover.js';

export class DebugOverlay {
  constructor(world) {
    this.world = world;
    this.flags = { collision: true, warps: true, anchors: true, interactables: true, hitboxes: true, grid: false };
    this.mesh = null;
    this.canvas = null;
    this.hit = [];
    this._rect = {};
  }

  setFlags(f) {
    Object.assign(this.flags, f === true ? {} : f);
    this.build();
  }

  build() {
    this.dispose(true);
    const map = this.world.map;
    if (!map) return;
    const W = map.width * TILE;
    const H = map.height * TILE;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const f = this.flags;
    if (f.collision) {
      ctx.fillStyle = 'rgba(255,40,60,0.38)';
      for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (map.collision[y * map.width + x]) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
    if (f.grid) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 0; x <= map.width; x++) ctx.fillRect(x * TILE, 0, 1, H);
      for (let y = 0; y <= map.height; y++) ctx.fillRect(0, y * TILE, W, 1);
    }
    const outline = (x, y, w, h, col, fill) => {
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
      ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    };
    if (f.warps) for (const w of map.warps || []) outline(w.x * TILE, w.y * TILE, (w.w || 1) * TILE, (w.h || 1) * TILE, '#4aa8ff', 'rgba(60,140,255,0.35)');
    if (f.interactables) for (const i of map.interactables || []) outline(i.x * TILE, i.y * TILE, (i.w || 1) * TILE, (i.h || 1) * TILE, '#ffe14a', null);
    if (f.anchors) {
      for (const [name, a] of Object.entries(map.anchors || {})) {
        const cx = a.x * TILE + TILE / 2;
        const cy = a.y * TILE + TILE / 2;
        ctx.fillStyle = '#3cff7a';
        ctx.fillRect(cx - 3, cy, 7, 1);
        ctx.fillRect(cx, cy - 3, 1, 7);
        // facing tick
        const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[a.dir] || [0, 0];
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx + v[0] * 4, cy + v[1] * 4, 1, 1);
      }
      ctx.font = '6px monospace';
      ctx.textBaseline = 'top';
      for (const [name, a] of Object.entries(map.anchors || {})) {
        const label = name.length > 8 ? name.slice(0, 8) : name;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(a.x * TILE + 1, a.y * TILE + 1, label.length * 4 + 1, 7);
        ctx.fillStyle = '#9dffbe';
        ctx.fillText(label, a.x * TILE + 2, a.y * TILE + 1);
      }
    }
    this.canvas = c;
    const tex = this.world.textures.acquire(c);
    const g = new THREE.PlaneGeometry(W, H);
    g.translate(W / 2, H / 2, 0);
    // PlaneGeometry is y-up with uv v=1 at the top; our y-down world needs top row at y=0
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, H - pos.getY(i));
    this.mesh = new THREE.Mesh(g, makePixelMaterial(tex));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = ORDER.debug;
    this.world.scene.add(this.mesh);
  }

  /** Per-frame: hitbox rectangles of all actors. */
  update() {
    if (!this.flags.hitboxes) return this._hideHits(0);
    const actors = this.world.actors;
    for (let i = 0; i < actors.length; i++) {
      let m = this.hit[i];
      if (!m) {
        m = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({ color: 0xff40ff, transparent: true, opacity: 0.45, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
        );
        m.frustumCulled = false;
        m.renderOrder = ORDER.debug + 1;
        this.world.scene.add(m);
        this.hit[i] = m;
      }
      const r = getHitbox(actors[i], this._rect);
      m.visible = actors[i].visible;
      m.scale.set(r.x1 - r.x0, r.y1 - r.y0, 1);
      m.position.set(Math.round((r.x0 + r.x1) / 2 * 2) / 2, Math.round((r.y0 + r.y1) / 2 * 2) / 2, 0);
    }
    this._hideHits(actors.length);
  }

  _hideHits(from) {
    for (let i = from; i < this.hit.length; i++) this.hit[i].visible = false;
  }

  dispose(keepHits) {
    if (this.mesh) {
      this.world.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.world.textures.release(this.canvas);
      this.mesh = null;
      this.canvas = null;
    }
    if (!keepHits) {
      for (const m of this.hit) {
        this.world.scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      }
      this.hit = [];
    }
  }
}
