/**
 * Lightweight post pass (medium/high): scene -> MSAA render target -> fullscreen triangle with soft bloom-ish lift,
 * colour grade (tint/saturation/contrast), vignette and fine film grain. Writes the sRGB output.
 */
import * as THREE from 'three';

export class Post {
  constructor(renderer, samples = 4) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples, type: THREE.HalfFloatType, depthBuffer: true });
    this.rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
    this.uniforms = {
      tScene: { value: this.rt.texture }, uTime: { value: 0 }, uVig: { value: 0.32 }, uGrain: { value: 0.035 }, uSat: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) },
      uTintAmt: { value: 0 }, uBright: { value: 0 }, uContrast: { value: 1.04 }, uFlash: { value: 0 }, uTexel: { value: new THREE.Vector2(1, 1) },
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D tScene; uniform float uTime, uVig, uGrain, uSat, uTintAmt, uBright, uContrast, uFlash; uniform vec3 uTint; uniform vec2 uTexel;
        float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        void main() {
          vec3 c = texture2D(tScene, vUv).rgb;
          // cheap glow: average of a few wide taps of the bright parts
          vec3 g = vec3(0.0);
          for (int i = 0; i < 6; i++) {
            float a = float(i) * 1.0472;
            vec3 s = texture2D(tScene, vUv + vec2(cos(a), sin(a)) * uTexel * 7.0).rgb;
            g += max(s - 0.78, 0.0);
          }
          c += g * 0.22;
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c = mix(vec3(l), c, uSat);
          c = mix(c, c * uTint * 1.15, uTintAmt);
          c = (c - 0.5) * uContrast + 0.5 + uBright;
          // soft warm shadows lift (painted look)
          c += (1.0 - smoothstep(0.0, 0.35, l)) * vec3(0.02, 0.012, 0.03);
          c += uFlash * vec3(0.7, 0.75, 0.9);
          vec2 q = vUv - 0.5;
          float v = smoothstep(0.85, 0.2, length(q * vec2(1.0, 1.15)));
          c *= mix(1.0, v, uVig);
          c += (hash(vUv * 900.0 + fract(uTime) * 37.0) - 0.5) * uGrain;
          gl_FragColor = vec4(max(c, 0.0), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(g, this.mat);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setSize(w, h, dpr) {
    this.rt.setSize(Math.max(2, Math.floor(w * dpr)), Math.max(2, Math.floor(h * dpr)));
    this.uniforms.uTexel.value.set(1 / this.rt.width, 1 / this.rt.height);
  }

  render(scene, camera, env, t) {
    const r = this.renderer;
    const u = this.uniforms;
    u.uTime.value = t;
    u.uSat.value = env.sat;
    u.uTint.value.copy(env.tint);
    u.uTintAmt.value = env.tintAmt;
    u.uBright.value = env.bright;
    u.uFlash.value = env.flash * 0.35;
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }

  dispose() {
    this.rt.dispose();
    this.mat.dispose();
  }
}
