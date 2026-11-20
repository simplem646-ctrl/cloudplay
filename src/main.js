// STUB entry point. The real boot sequence is written by the integration task (T9).
// Right now it only proves the toolchain: Three.js bundles, WebGL works, the canvas is
// exactly 320x240 and gets scaled with nearest-neighbour filtering.
// GOTCHA: a y-down ortho camera (top=0, bottom=H) flips winding => use DoubleSide or flip y.
import * as THREE from 'three';
import { VIEW_W, VIEW_H, GAME_TITLE } from './core/constants.js';

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(VIEW_W, VIEW_H, false);
const scale = Math.max(1, Math.floor(Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H)));
renderer.domElement.style.width = `${VIEW_W * scale}px`;
renderer.domElement.style.height = `${VIEW_H * scale}px`;
app.replaceChildren(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8fd0f0');
const camera = new THREE.OrthographicCamera(0, VIEW_W, 0, VIEW_H, -10, 10);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(64, 48), new THREE.MeshBasicMaterial({ color: '#f2b84b', side: THREE.DoubleSide }));
quad.position.set(VIEW_W / 2, VIEW_H / 2, 0);
scene.add(quad);
renderer.render(scene, camera);

document.title = GAME_TITLE;
window.__game = { stub: true, ok: true, three: THREE.REVISION };
