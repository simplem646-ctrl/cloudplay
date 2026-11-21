// Entry point: boots the game (see src/scenes/boot.js). window.__game exposes the service bag (+ debug API) for QA.
import { bootGame } from './scenes/boot.js';

bootGame({ container: document.getElementById('app') });
