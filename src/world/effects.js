/**
 * Particles: CPU-simulated pools for one-shot effects (playEffect) + smoke, GPU-wrapped "volume" systems for
 * weather/season ambience (rain, snow, petals, leaves, fireflies) and tiny ambient creatures (butterflies, birds).
 */
import * as THREE from 'three';
import { clamp, mulberry32 } from '../core/util.js';

export const SHAPES = { soft: 0, star: 1, heart: 2, note: 3, drop: 4, square: 5, leaf: 6, smoke: 7, ring: 8, petal: 9, spark: 10 };

const SHAPE_GLSL = `
  float shapeAlpha(vec2 p, float id, float rot) {
    float c = cos(rot), s = sin(rot);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    float r = length(p);
    if (id < 0.5) return smoothstep(1.0, 0.25, r);
    if (id < 1.5) { // 4-point star sparkle
      float a = abs(p.x), b = abs(p.y);
      float core = smoothstep(0.35, 0.0, r);
      float rays = smoothstep(0.12, 0.0, min(a, b)) * smoothstep(1.0, 0.1, r);
      return clamp(core + rays, 0.0, 1.0);
    }
    if (id < 2.5) { // heart
      vec2 q = vec2(p.x * 1.15, -p.y * 1.15 + 0.2);
      float k = pow(q.x * q.x + q.y * q.y - 0.5, 3.0) - q.x * q.x * q.y * q.y * q.y;
      return smoothstep(0.02, -0.02, k * 4.0);
    }
    if (id < 3.5) { // music note
      float head = smoothstep(0.3, 0.24, length((p - vec2(-0.2, 0.45)) * vec2(1.0, 1.4)));
      float stem = step(abs(p.x - 0.05), 0.07) * step(-0.5, p.y) * step(p.y, 0.45);
      float flag = step(0.05, p.x) * step(p.x, 0.4) * step(abs(p.y + 0.45 - (p.x - 0.05) * 0.8), 0.1);
      return clamp(head + stem + flag, 0.0, 1.0);
    }
    if (id < 4.5) return smoothstep(1.0, 0.8, r);
    if (id < 5.5) return step(abs(p.x), 0.8) * step(abs(p.y), 0.45);
    if (id < 6.5) { // leaf
      vec2 q = p * vec2(0.8, 1.3);
      float d = length(q);
      return smoothstep(0.9, 0.78, d) * (1.0 - smoothstep(0.0, 0.05, abs(p.x) - (0.55 - abs(p.y) * 0.5)) * 0.0);
    }
    if (id < 7.5) return smoothstep(1.0, 0.0, r) * 0.9;
    if (id < 8.5) return smoothstep(0.12, 0.0, abs(r - 0.8)) ;
    if (id < 9.5) { // petal
      vec2 q = p * vec2(1.0, 1.7);
      return smoothstep(0.95, 0.7, length(q));
    }
    return smoothstep(1.0, 0.0, r);
  }`;

function makeMaterial(additive, extraUniforms = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 500 }, ...extraUniforms },
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `
      attribute vec4 aColor; attribute float aSize; attribute float aShape; attribute float aRot;
      varying vec4 vColor; varying float vShape; varying float vRot;
      uniform float uScale;
      void main() {
        vColor = aColor; vShape = aShape; vRot = aRot;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
      }`,
    fragmentShader: `
      varying vec4 vColor; varying float vShape; varying float vRot;
      ${SHAPE_GLSL}
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0; p.y = -p.y;
        float a = shapeAlpha(p, vShape, vRot) * vColor.a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor.rgb, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** CPU pool of billboard points */
export class PointPool {
  constructor(max, additive) {
    this.max = max;
    this.n = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.shape = new Float32Array(max);
    this.rot = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.age = new Float32Array(max);
    this.cfg = new Float32Array(max * 4); // gravity, drag, grow, spin
    this.size0 = new Float32Array(max);
    this.alpha0 = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aShape', new THREE.BufferAttribute(this.shape, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aRot', new THREE.BufferAttribute(this.rot, 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    this.material = makeMaterial(additive);
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.color = new THREE.Color();
  }

  spawn(x, y, z, vx, vy, vz, life, size, color, shape, o = {}) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.age[i] = 0;
    this.size[i] = this.size0[i] = size;
    this.shape[i] = shape;
    this.rot[i] = o.rot ?? Math.random() * 6.28;
    this.color.set(color);
    this.col[i * 4] = this.color.r; this.col[i * 4 + 1] = this.color.g; this.col[i * 4 + 2] = this.color.b;
    this.alpha0[i] = this.col[i * 4 + 3] = o.alpha ?? 1;
    this.cfg[i * 4] = o.gravity ?? 0; this.cfg[i * 4 + 1] = o.drag ?? 0; this.cfg[i * 4 + 2] = o.grow ?? 0; this.cfg[i * 4 + 3] = o.spin ?? 0;
  }

  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        const l = --this.n;
        if (i !== l) this.copy(l, i);
        continue;
      }
      const u = this.age[i] / this.life[i];
      const drag = Math.exp(-this.cfg[i * 4 + 1] * dt);
      this.vel[i * 3] *= drag; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * drag - this.cfg[i * 4] * dt; this.vel[i * 3 + 2] *= drag;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.shape[i] !== SHAPES.smoke && this.pos[i * 3 + 1] < 0.02 && this.cfg[i * 4] > 0) { this.pos[i * 3 + 1] = 0.02; this.vel[i * 3 + 1] *= -0.2; }
      this.size[i] = this.size0[i] * (1 + this.cfg[i * 4 + 2] * u);
      this.rot[i] += this.cfg[i * 4 + 3] * dt;
      const fade = u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88;
      this.col[i * 4 + 3] = this.alpha0[i] * clamp(fade, 0, 1);
      i++;
    }
    const g = this.points.geometry;
    g.setDrawRange(0, this.n);
    for (const k of ['position', 'aColor', 'aSize', 'aRot', 'aShape']) g.attributes[k].needsUpdate = true;
  }

  copy(from, to) {
    for (let k = 0; k < 3; k++) { this.pos[to * 3 + k] = this.pos[from * 3 + k]; this.vel[to * 3 + k] = this.vel[from * 3 + k]; }
    for (let k = 0; k < 4; k++) { this.col[to * 4 + k] = this.col[from * 4 + k]; this.cfg[to * 4 + k] = this.cfg[from * 4 + k]; }
    for (const a of ['size', 'shape', 'rot', 'life', 'age', 'size0', 'alpha0']) this[a][to] = this[a][from];
  }

  clear() { this.n = 0; this.points.geometry.setDrawRange(0, 0); }
}

/** Camera-following wrapped volume of particles with analytic motion (no CPU cost). */
function makeVolume({ count, size, fall = 1, drift = 0, sway = 0, shape = 0, colors = ['#ffffff'], additive = false, pointSize = 0.1, spin = 0, wander = 0, twinkle = 0, alpha = 1, seed = 1 }) {
  const rng = mulberry32(seed);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 4);
  const sz = new Float32Array(count);
  const shp = new Float32Array(count).fill(shape);
  const rot = new Float32Array(count);
  const rnd = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3] = rng() * size[0]; pos[i * 3 + 1] = rng() * size[1]; pos[i * 3 + 2] = rng() * size[2];
    c.set(colors[(rng() * colors.length) | 0]);
    col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = alpha * (0.6 + rng() * 0.4);
    sz[i] = pointSize * (0.6 + rng() * 0.8);
    rot[i] = rng() * 6.28;
    rnd[i] = rng();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 4));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  g.setAttribute('aShape', new THREE.BufferAttribute(shp, 1));
  g.setAttribute('aRot', new THREE.BufferAttribute(rot, 1));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 500 }, uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAmount: { value: 1 }, uBox: { value: new THREE.Vector3(...size) } },
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `
      attribute vec4 aColor; attribute float aSize; attribute float aShape; attribute float aRot; attribute float aRnd;
      varying vec4 vColor; varying float vShape; varying float vRot;
      uniform float uScale; uniform float uTime; uniform vec3 uCenter; uniform float uAmount; uniform vec3 uBox;
      void main() {
        vec3 p = position;
        float t = uTime;
        p.y -= t * ${fall.toFixed(3)} * (0.7 + aRnd * 0.6);
        p.x += t * ${drift.toFixed(3)} + sin(t * (0.5 + aRnd) + aRnd * 40.0) * ${sway.toFixed(3)};
        p.z += cos(t * (0.4 + aRnd * 0.8) + aRnd * 17.0) * ${sway.toFixed(3)} * 0.7;
        ${wander > 0 ? `p.x += sin(t * 0.6 + aRnd * 30.0) * ${wander.toFixed(3)}; p.y += sin(t * 0.8 + aRnd * 50.0) * ${wander.toFixed(3)} * 0.5; p.z += cos(t * 0.5 + aRnd * 20.0) * ${wander.toFixed(3)};` : ''}
        vec3 w = uCenter - uBox * 0.5 + mod(p - (uCenter - uBox * 0.5), uBox);
        vColor = aColor;
        ${twinkle > 0 ? `vColor.a *= 0.5 + 0.5 * sin(t * ${twinkle.toFixed(2)} + aRnd * 50.0);` : ''}
        vShape = aShape; vRot = aRot + t * ${spin.toFixed(3)} * (aRnd - 0.3);
        vec4 mv = modelViewMatrix * vec4(w, 1.0);
        gl_Position = projectionMatrix * mv;
        float vis = step(aRnd, uAmount);
        gl_PointSize = min(aSize * uScale / max(0.1, -mv.z), 60.0) * vis;
      }`,
    fragmentShader: `
      varying vec4 vColor; varying float vShape; varying float vRot;
      ${SHAPE_GLSL}
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0; p.y = -p.y;
        float a = shapeAlpha(p, vShape, vRot) * vColor.a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor.rgb, a);
        #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  return pts;
}

/** Rain streaks (LineSegments) wrapped around the camera target. */
function makeRain(count, size) {
  const rng = mulberry32(7);
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const rnd = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = rng() * size[0], y = rng() * size[1], z = rng() * size[2];
    pos.set([x, y, z, x, y, z], i * 6);
    end[i * 2] = 0; end[i * 2 + 1] = 1;
    rnd[i * 2] = rnd[i * 2 + 1] = rng();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAmount: { value: 1 }, uBox: { value: new THREE.Vector3(...size) }, uAlpha: { value: 0.5 } },
    transparent: true, depthWrite: false,
    vertexShader: `
      attribute float aEnd; attribute float aRnd; varying float vA;
      uniform float uTime; uniform vec3 uCenter; uniform float uAmount; uniform vec3 uBox;
      void main() {
        vec3 p = position;
        p.y -= uTime * (16.0 + aRnd * 6.0);
        p.x += uTime * 3.0;
        vec3 w = uCenter - uBox * 0.5 + mod(p - (uCenter - uBox * 0.5), uBox);
        w += vec3(-0.22, 0.85, 0.0) * aEnd * (0.8 + aRnd * 0.4);
        vA = step(aRnd, uAmount) * (1.0 - aEnd * 0.6);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: `
      varying float vA; uniform float uAlpha;
      void main() {
        if (vA < 0.01) discard;
        gl_FragColor = vec4(0.78, 0.86, 1.0, vA * uAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const l = new THREE.LineSegments(g, mat);
  l.frustumCulled = false;
  l.renderOrder = 6;
  return l;
}

export class Effects {
  constructor(quality) {
    this.quality = quality;
    this.group = new THREE.Group();
    const k = quality === 'low' ? 0.45 : quality === 'high' ? 1.3 : 1;
    this.k = k;
    this.alphaPool = new PointPool(900, false);
    this.addPool = new PointPool(500, true);
    this.group.add(this.alphaPool.points, this.addPool.points);
    this.box = [30, 11, 26];
    this.volumes = {
      snow: makeVolume({ count: Math.round(900 * k), size: this.box, fall: 1.3, drift: 0.2, sway: 0.5, shape: SHAPES.soft, colors: ['#ffffff', '#eef6ff'], pointSize: 0.11, alpha: 0.95, seed: 2 }),
      petals: makeVolume({ count: Math.round(110 * k), size: this.box, fall: 0.7, drift: 0.7, sway: 1.1, shape: SHAPES.petal, colors: ['#ffc4d8', '#ffaec8', '#ffffff'], pointSize: 0.17, spin: 3, seed: 3 }),
      leaves: makeVolume({ count: Math.round(110 * k), size: this.box, fall: 0.9, drift: 0.9, sway: 1.4, shape: SHAPES.leaf, colors: ['#f0a03c', '#d4622c', '#e8c040', '#b8561f'], pointSize: 0.2, spin: 3.5, seed: 4 }),
      fireflies: makeVolume({ count: Math.round(70 * k), size: [34, 3, 28], fall: 0, wander: 1.3, shape: SHAPES.soft, colors: ['#e8ff8a', '#d6ff7a'], additive: true, pointSize: 0.2, twinkle: 2.4, seed: 5 }),
      dust: makeVolume({ count: Math.round(60 * k), size: [34, 6, 28], fall: -0.04, wander: 0.4, sway: 0.2, shape: SHAPES.soft, colors: ['#fff0c8'], additive: true, pointSize: 0.07, twinkle: 1.5, alpha: 0.7, seed: 6 }),
    };
    for (const v of Object.values(this.volumes)) this.group.add(v);
    this.rain = makeRain(Math.round(1300 * k), this.box);
    this.group.add(this.rain);
    this.volumes.fireflies.material.uniforms.uBox.value.set(34, 3, 28);
    this.smokers = [];
    this.smokeT = 0;
  }

  setScale(px) {
    const s = px;
    for (const m of [this.alphaPool.material, this.addPool.material, ...Object.values(this.volumes).map((v) => v.material)]) m.uniforms.uScale.value = s;
  }

  setAmounts(env, kind, area) {
    const winterOnly = env.season === 'winter';
    const calm = env.weather === 'sunny' || env.weather === 'cloudy';
    const exterior = kind === 'exterior';
    const V = this.volumes;
    const cloudy = env.weather === 'cloudy';
    V.snow.material.uniforms.uAmount.value = exterior ? clamp(env.snow, 0, 1) : 0;
    V.snow.visible = V.snow.material.uniforms.uAmount.value > 0.01;
    const petal = exterior && env.season === 'spring' && env.weather !== 'rain' && env.weather !== 'storm' ? 0.7 : 0;
    V.petals.material.uniforms.uAmount.value = petal;
    V.petals.visible = petal > 0;
    const leaf = exterior && env.season === 'autumn' && env.weather !== 'snow' ? 0.8 : 0;
    V.leaves.material.uniforms.uAmount.value = leaf;
    V.leaves.visible = leaf > 0;
    const ff = exterior && env.season === 'summer' && env.weather === 'sunny' ? clamp((env.night - 0.25) * 1.6, 0, 1) : 0;
    V.fireflies.material.uniforms.uAmount.value = ff;
    V.fireflies.visible = ff > 0.01;
    const dust = !exterior ? 0.9 : exterior && env.night < 0.1 && env.weather === 'sunny' ? 0.35 : 0;
    V.dust.material.uniforms.uAmount.value = dust;
    V.dust.visible = dust > 0.01;
    this.rain.material.uniforms.uAmount.value = exterior ? env.rain : 0;
    this.rain.visible = exterior && env.rain > 0.01;
  }

  update(dt, t, cx, cz, env, kind, area) {
    for (const v of Object.values(this.volumes)) {
      v.material.uniforms.uTime.value = t;
      v.material.uniforms.uCenter.value.set(cx, v === this.volumes.fireflies ? 1.4 : v === this.volumes.dust ? 3 : 5.5, cz);
    }
    this.rain.material.uniforms.uTime.value = t;
    this.rain.material.uniforms.uCenter.value.set(cx, 5.5, cz);
    // chimney smoke
    if (area) {
      this.smokeT += dt;
      for (const s of area.smokers) {
        s.t -= dt * s.rate;
        if (s.t <= 0) {
          s.t = 0.5 + Math.random() * 0.4;
          if (this.alphaPool.n < this.alphaPool.max - 10)
            this.alphaPool.spawn(s.x + (Math.random() - 0.5) * 0.15, s.y, s.z + (Math.random() - 0.5) * 0.15, 0.25 + Math.random() * 0.15, 0.55 + Math.random() * 0.15, 0.05, 3.8, 0.55 * s.size, env.night > 0.5 ? '#8c93b0' : '#e9e6e0', SHAPES.smoke, { grow: 3.2, alpha: 0.5, rot: 0 });
        }
      }
    }
    this.alphaPool.update(dt);
    this.addPool.update(dt);
  }

  /** one-shot effects */
  play(name, o = {}) {
    const { x = 0, z = 0, y = 0.4 } = o;
    const n = o.count ?? 0;
    const A = this.alphaPool, D = this.addPool;
    const rnd = (a, b) => a + Math.random() * (b - a);
    switch (name) {
      case 'sparkle':
        for (let i = 0; i < (n || 10); i++) D.spawn(x + rnd(-0.5, 0.5), y + rnd(0, 0.9), z + rnd(-0.5, 0.5), rnd(-0.2, 0.2), rnd(0.2, 0.7), rnd(-0.2, 0.2), rnd(0.7, 1.3), rnd(0.18, 0.34), o.color || '#fff3b0', SHAPES.star, { spin: rnd(-2, 2) });
        break;
      case 'splash':
        for (let i = 0; i < (n || 16); i++) { const a = rnd(0, 6.28), s = rnd(0.8, 2.2); A.spawn(x, y, z, Math.cos(a) * s * 0.6, rnd(2.2, 4.2), Math.sin(a) * s * 0.6, rnd(0.6, 1.0), rnd(0.09, 0.16), o.color || '#cfeeff', SHAPES.drop, { gravity: 9 }); }
        A.spawn(x, 0.06, z, 0, 0, 0, 0.9, 0.5, '#ffffff', SHAPES.ring, { grow: 3.5, alpha: 0.7, rot: 0 });
        break;
      case 'ripple':
        for (let i = 0; i < (n || 2); i++) A.spawn(x, 0.06, z, 0, 0, 0, 1.2 + i * 0.3, 0.3, '#e8f8ff', SHAPES.ring, { grow: 4 + i, alpha: 0.65, rot: 0 });
        break;
      case 'dust':
        for (let i = 0; i < (n || 8); i++) A.spawn(x + rnd(-0.3, 0.3), 0.1, z + rnd(-0.3, 0.3), rnd(-0.6, 0.6), rnd(0.2, 0.5), rnd(-0.6, 0.6), rnd(0.5, 0.9), rnd(0.25, 0.4), o.color || '#e0d2b8', SHAPES.smoke, { grow: 1.6, alpha: 0.5, drag: 2 });
        break;
      case 'hearts':
        for (let i = 0; i < (n || 6); i++) A.spawn(x + rnd(-0.4, 0.4), y + 0.6, z + rnd(-0.3, 0.3), rnd(-0.25, 0.25), rnd(0.8, 1.3), 0, rnd(1.1, 1.7), rnd(0.28, 0.42), o.color || '#ff6f8f', SHAPES.heart, { rot: 0 });
        break;
      case 'notes':
        for (let i = 0; i < (n || 5); i++) A.spawn(x + rnd(-0.3, 0.3), y + 0.8, z + rnd(-0.3, 0.3), rnd(-0.5, 0.5), rnd(0.6, 1.1), 0, rnd(1.2, 1.8), rnd(0.3, 0.42), o.color || '#6a5acd', SHAPES.note, { rot: 0 });
        break;
      case 'confetti':
        for (let i = 0; i < (n || 40); i++) { const a = rnd(0, 6.28), s = rnd(1, 4); A.spawn(x, y + 1, z, Math.cos(a) * s, rnd(3, 6), Math.sin(a) * s, rnd(1.4, 2.4), rnd(0.12, 0.2), ['#ff6f8f', '#ffd23f', '#6fb7e8', '#8fd16a', '#c9a4ff'][(Math.random() * 5) | 0], SHAPES.square, { gravity: 6, drag: 1.2, spin: rnd(-8, 8) }); }
        break;
      case 'leaves':
        for (let i = 0; i < (n || 10); i++) A.spawn(x + rnd(-0.6, 0.6), y + rnd(0.2, 1.5), z + rnd(-0.6, 0.6), rnd(-1, 1), rnd(0.5, 1.5), rnd(-1, 1), rnd(1.5, 2.5), 0.22, ['#f0a03c', '#d4622c', '#8fd16a', '#e8c040'][(Math.random() * 4) | 0], SHAPES.leaf, { gravity: 1.2, drag: 1.5, spin: rnd(-4, 4) });
        break;
      case 'steam':
        for (let i = 0; i < (n || 6); i++) A.spawn(x + rnd(-0.15, 0.15), y, z + rnd(-0.15, 0.15), rnd(-0.08, 0.08), rnd(0.5, 0.9), 0, rnd(1.2, 1.8), 0.32, '#ffffff', SHAPES.smoke, { grow: 2, alpha: 0.45, rot: 0 });
        break;
      case 'firework': {
        const col = o.color || ['#ff6f8f', '#ffd23f', '#6fd0ff', '#b78cff', '#8fff8f'][(Math.random() * 5) | 0];
        const cy = y + rnd(5, 8);
        for (let i = 0; i < (n || 70); i++) {
          const a = rnd(0, 6.28), b = Math.acos(rnd(-1, 1)), s = rnd(2.2, 4.4);
          D.spawn(x, cy, z, Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s, rnd(1.0, 1.8), rnd(0.2, 0.36), col, SHAPES.star, { gravity: 2.2, drag: 1.3, spin: rnd(-3, 3) });
        }
        break;
      }
      default:
        break;
    }
  }
}

/** Butterflies + birds (tiny meshes). */
export class Ambient {
  constructor(quality) {
    this.group = new THREE.Group();
    const nB = quality === 'low' ? 4 : 9;
    this.flies = [];
    const wingGeo = new THREE.PlaneGeometry(0.2, 0.17);
    wingGeo.translate(0.1, 0, 0);
    const cols = ['#ffd23f', '#ff9ec0', '#ffffff', '#9cc8ff', '#ffa45a'];
    for (let i = 0; i < nB; i++) {
      const g = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide });
      const l = new THREE.Mesh(wingGeo, m);
      const r = new THREE.Mesh(wingGeo, m);
      r.scale.x = -1;
      g.add(l, r);
      g.userData = { l, r, x: 0, z: 0, tx: 0, tz: 0, y: 0.8, ph: Math.random() * 6, sp: 0.8 + Math.random() * 0.6 };
      this.flies.push(g);
      this.group.add(g);
    }
    this.birds = [];
    const bm = new THREE.MeshBasicMaterial({ color: '#4a4358', side: THREE.DoubleSide });
    const wg = new THREE.PlaneGeometry(0.5, 0.2);
    wg.translate(0.25, 0, 0);
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), bm);
      body.scale.set(1.5, 0.8, 0.8);
      const l = new THREE.Mesh(wg, bm), r = new THREE.Mesh(wg, bm);
      r.scale.x = -1;
      g.add(body, l, r);
      g.userData = { l, r, t: -i * 1.5, ph: Math.random() * 6 };
      this.birds.push(g);
      this.group.add(g);
    }
    this.center = { x: 0, z: 0 };
  }

  update(dt, t, cx, cz, env, kind) {
    const ext = kind === 'exterior';
    const fliesOn = ext && (env.season === 'spring' || env.season === 'summer') && env.night < 0.2 && (env.weather === 'sunny' || env.weather === 'cloudy');
    for (const f of this.flies) {
      f.visible = fliesOn;
      if (!fliesOn) continue;
      const u = f.userData;
      if (Math.hypot(u.x - cx, u.z - cz) > 14 || Math.hypot(u.tx - u.x, u.tz - u.z) < 0.3) {
        u.tx = cx + (Math.random() - 0.5) * 18;
        u.tz = cz + (Math.random() - 0.5) * 9;
        if (Math.hypot(u.x - cx, u.z - cz) > 14) { u.x = u.tx; u.z = u.tz; }
      }
      const dx = u.tx - u.x, dz = u.tz - u.z, d = Math.hypot(dx, dz) || 1;
      u.x += (dx / d) * u.sp * dt + Math.sin(t * 3 + u.ph) * dt * 0.6;
      u.z += (dz / d) * u.sp * dt + Math.cos(t * 2.4 + u.ph) * dt * 0.5;
      u.y = 0.9 + Math.sin(t * 1.7 + u.ph) * 0.35;
      f.position.set(u.x, u.y, u.z);
      f.rotation.y = Math.atan2(dx, dz);
      const flap = Math.sin(t * 22 + u.ph) * 0.9;
      u.l.rotation.z = flap;
      u.r.rotation.z = -flap;
      f.rotation.x = 0.5;
    }
    const birdsOn = ext && env.night < 0.2 && env.weather !== 'storm' && env.weather !== 'rain';
    for (const b of this.birds) {
      b.visible = birdsOn;
      if (!birdsOn) continue;
      const u = b.userData;
      u.t += dt * 0.07;
      if (u.t > 1.3) u.t = -0.3 - Math.random() * 0.6;
      const k = u.t;
      b.position.set(cx - 18 + k * 36, 7 + Math.sin(u.ph + k * 8) * 0.6 + (b === this.birds[0] ? 0 : (this.birds.indexOf(b)) * 0.5), cz - 6 + Math.sin(k * 4 + u.ph) * 2 + this.birds.indexOf(b));
      b.rotation.y = -Math.PI / 2;
      const flap = Math.sin(t * 11 + u.ph) * 0.7;
      u.l.rotation.z = flap;
      u.r.rotation.z = -flap;
    }
  }
}
