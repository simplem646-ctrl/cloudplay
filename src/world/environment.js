/**
 * Environment state machine: time-of-day, season and weather -> light colours/intensities, grade, glow factors,
 * precipitation amounts. Target values are computed from the inputs and damped every frame (cheap, smooth).
 */
import * as THREE from 'three';
import { clamp, lerp, damp, smoothstep } from '../core/util.js';

const C = (h) => new THREE.Color(h);

// minute, sunColor, sunInt, el(deg), az(deg, 0=south +90=east), sky, ground, hemiInt, bg(horizon), night, glow
const KEYS = [
  [0, '#6f86d8', 0.55, 55, -30, '#4a5a9c', '#262c58', 0.62, '#1a2145', 1],
  [330, '#6f86d8', 0.55, 55, -30, '#4a5a9c', '#262c58', 0.62, '#1a2145', 1],
  [400, '#ffb98a', 1.0, 9, 100, '#ffc9a8', '#8a7a9a', 0.78, '#ffcfa8', 0.4],
  [470, '#ffe9c4', 1.5, 26, 85, '#d4e8ff', '#a6b280', 0.92, '#cfe6ff', 0],
  [720, '#fff6e0', 1.7, 62, 12, '#d2e9ff', '#a8c47e', 1.0, '#cfe8ff', 0],
  [990, '#ffe2b0', 1.6, 38, -42, '#d8e8ff', '#b2b27a', 0.98, '#d8e8f8', 0],
  [1070, '#ffbe78', 1.5, 17, -72, '#ffd8a8', '#b48e62', 0.9, '#ffd3a0', 0.08],
  [1140, '#ff8f62', 0.95, 5, -86, '#ff9fa8', '#6c5a88', 0.74, '#ff9a90', 0.5],
  [1200, '#7a8ad8', 0.6, 50, -30, '#566aa8', '#2e3560', 0.66, '#33406f', 0.88],
  [1260, '#6f86d8', 0.55, 55, -30, '#4a5a9c', '#262c58', 0.62, '#1a2145', 1],
  [1440, '#6f86d8', 0.55, 55, -30, '#4a5a9c', '#262c58', 0.62, '#1a2145', 1],
];
const KEY_COLORS = KEYS.map((k) => ({ sun: C(k[1]), sky: C(k[5]), gnd: C(k[6]), bg: C(k[8]) }));

const WEATHER = {
  sunny: { sun: 1, hemi: 1, sat: 1, bright: 0, tint: '#ffffff', tintAmt: 0, cloud: 0.25, rain: 0, snow: 0, haze: 0.1 },
  cloudy: { sun: 0.42, hemi: 1.12, sat: 0.78, bright: 0.0, tint: '#b8c2d0', tintAmt: 0.18, cloud: 0.85, rain: 0, snow: 0, haze: 0.3 },
  rain: { sun: 0.22, hemi: 0.95, sat: 0.7, bright: -0.03, tint: '#7c92b0', tintAmt: 0.28, cloud: 1, rain: 0.75, snow: 0, haze: 0.45 },
  storm: { sun: 0.1, hemi: 0.75, sat: 0.62, bright: -0.06, tint: '#5c6c88', tintAmt: 0.34, cloud: 1, rain: 1, snow: 0, haze: 0.55 },
  snow: { sun: 0.5, hemi: 1.15, sat: 0.78, bright: 0.04, tint: '#c8d8ee', tintAmt: 0.22, cloud: 0.9, rain: 0, snow: 1, haze: 0.4 },
};
const SEASON = {
  spring: { sun: '#fff2dc', sunMix: 0.1, sat: 1.05, tint: '#ffe6f0', tintAmt: 0.03, sunK: 1 },
  summer: { sun: '#fff0c8', sunMix: 0.2, sat: 1.1, tint: '#fff2c0', tintAmt: 0.04, sunK: 1.05 },
  autumn: { sun: '#ffd09a', sunMix: 0.3, sat: 1.06, tint: '#ffc890', tintAmt: 0.07, sunK: 0.98 },
  winter: { sun: '#e6f0ff', sunMix: 0.3, sat: 0.86, tint: '#bcd4f4', tintAmt: 0.1, sunK: 0.88 },
};

function sample(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  let i = 0;
  while (i < KEYS.length - 2 && m >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
  const s = t * t * (3 - 2 * t);
  return { a, b, ca: KEY_COLORS[i], cb: KEY_COLORS[i + 1], t: s };
}

export class Environment {
  constructor() {
    this.s = {
      sunColor: C('#fff6e0'), sunInt: 1.5, sunDir: new THREE.Vector3(0, 1, 0.5), hemiSky: C('#d2e9ff'), hemiGnd: C('#a8c47e'), hemiInt: 1,
      bg: C('#cfe8ff'), tint: C('#ffffff'), tintAmt: 0, sat: 1, bright: 0, night: 0, glow: 0, cloud: 0.3, rain: 0, snow: 0, haze: 0.1,
      waterLight: C('#ffffff'), sparkle: 1, flash: 0, minutes: 720, season: 'spring', weather: 'sunny',
    };
    this.t = { ...this.s, sunColor: C('#fff'), sunDir: new THREE.Vector3(), hemiSky: C('#fff'), hemiGnd: C('#fff'), bg: C('#fff'), tint: C('#fff'), waterLight: C('#fff') };
    this.snapNext = true;
    this.flashT = 0;
    this.nextFlash = 3;
    this.kind = 'exterior';
  }

  /** compute targets */
  set({ minutes = 720, season = 'spring', weather = 'sunny', kind = 'exterior' }) {
    const key = `${Math.floor(minutes)}|${season}|${weather}|${kind}`;
    if (key === this._key) return;
    this._key = key;
    const t = this.t;
    this.kind = kind;
    this.s.minutes = minutes;
    this.s.season = season;
    this.s.weather = weather;
    const W = WEATHER[weather] || WEATHER.sunny;
    const S = SEASON[season] || SEASON.spring;
    const k = sample(minutes);
    const mix = (fa, fb) => lerp(fa, fb, k.t);
    t.night = mix(k.a[9], k.b[9]);
    const el = mix(k.a[3], k.b[3]) * (Math.PI / 180);
    const az = mix(k.a[4], k.b[4]) * (Math.PI / 180);
    t.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    t.sunColor.copy(k.ca.sun).lerp(k.cb.sun, k.t).lerp(C(S.sun), S.sunMix * (1 - t.night));
    t.sunInt = mix(k.a[2], k.b[2]) * W.sun * S.sunK;
    t.hemiSky.copy(k.ca.sky).lerp(k.cb.sky, k.t);
    t.hemiGnd.copy(k.ca.gnd).lerp(k.cb.gnd, k.t);
    t.hemiInt = mix(k.a[7], k.b[7]) * W.hemi;
    t.bg.copy(k.ca.bg).lerp(k.cb.bg, k.t).lerp(C(W.tint), W.tintAmt * 0.6);
    t.tint.copy(C(W.tint)).lerp(C(S.tint), 0.5);
    t.tintAmt = W.tintAmt + S.tintAmt + t.night * 0.05;
    t.sat = W.sat * S.sat * (1 - t.night * 0.12);
    t.bright = W.bright;
    t.glow = smoothstep(0.18, 0.7, t.night) * (1 - (weather === 'sunny' ? 0 : 0) );
    // overcast days glow a little earlier
    t.glow = clamp(t.glow + (weather === 'rain' || weather === 'storm' ? 0.18 * (1 - t.night) : 0), 0, 1);
    t.cloud = W.cloud;
    t.rain = W.rain;
    t.snow = W.snow;
    t.haze = W.haze;
    t.sparkle = (1 - t.night * 0.6) * (weather === 'sunny' ? 1 : 0.35);
    // water takes the ambient light colour
    t.waterLight.copy(t.hemiSky).multiplyScalar(0.55 + t.hemiInt * 0.45).lerp(t.sunColor, 0.25).multiplyScalar(1.0 - t.night * 0.25);
    if (kind === 'interior') {
      // rooms stay warm and readable: blend toward lamp light, dim with night and weather a little
      const day = 1 - t.night;
      t.sunColor.set(day > 0.5 ? '#fff0cf' : '#ffb667').lerp(t.sunColor, 0.15);
      t.sunInt = lerp(1.05, 1.55, day) * (weather === 'sunny' ? 1 : 0.8);
      t.sunDir.set(0.25, 0.8, 0.7).normalize();
      t.hemiSky.set(day > 0.5 ? '#fff0d6' : '#ffd9a8').lerp(t.hemiSky, 0.1);
      t.hemiGnd.set('#b88a62');
      t.hemiInt = lerp(0.78, 1.0, day);
      t.bg.set('#2a1d1c');
      t.tintAmt *= 0.4;
      t.sat = 1.03;
      t.glow = Math.max(t.glow, 0.55);
    }
    if (weather === 'storm') {
      this.nextFlash = Math.min(this.nextFlash, 6);
    }
  }

  update(dt) {
    const s = this.s, t = this.t;
    const k = this.snapNext ? 1 : 1 - Math.exp(-2.4 * dt);
    const L = (a, b) => lerp(a, b, k);
    s.sunColor.lerp(t.sunColor, k);
    s.sunDir.lerp(t.sunDir, k).normalize();
    s.hemiSky.lerp(t.hemiSky, k);
    s.hemiGnd.lerp(t.hemiGnd, k);
    s.bg.lerp(t.bg, k);
    s.tint.lerp(t.tint, k);
    s.waterLight.lerp(t.waterLight, k);
    for (const key of ['sunInt', 'hemiInt', 'tintAmt', 'sat', 'bright', 'night', 'glow', 'cloud', 'rain', 'snow', 'haze', 'sparkle']) s[key] = L(s[key], t[key]);
    this.snapNext = false;
    // lightning
    if (s.weather === 'storm') {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) {
        this.flashT = 0.5;
        this.nextFlash = 5 + Math.random() * 9;
      }
    }
    this.flashT = Math.max(0, this.flashT - dt);
    const f = this.flashT > 0 ? (Math.sin(this.flashT * 40) * 0.5 + 0.5) * Math.min(1, this.flashT * 3) : 0;
    s.flash = f;
  }

  snap() { this.snapNext = true; }
}
