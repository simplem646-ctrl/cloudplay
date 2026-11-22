// Mini-game overlays: fishing (hold to reel) and kneading (timing bar). Logic lives in ./logic.js.
import { Game } from '../../core/game.js';
import { h, sfx, getItem, wait } from '../dom.js';
import { openModal } from '../widgets.js';
import { itemIcon } from '../icons.js';
import { createFishing, stepFishing, fishingResult, createKneading, stepKneading, pressKneading } from './logic.js';

let ticker = null;
export function updateMinigames(dt) { if (ticker) ticker(dt); }

function confirmHeld(pointerRef) { return pointerRef.down || Game.input.held('confirm'); }

/** @returns {Promise<{caught:boolean, perfect:boolean}>} */
export function fishing({ fish = {}, rodPower = 1 } = {}) {
  return new Promise((resolve) => {
    const s = createFishing({ fish, rodPower });
    const ptr = { down: false };
    const def = getItem(fish.id) || { icon: { shape: 'fish_small', colors: ['#ffb36b', '#ff8a5a'] } };
    const fishCv = itemIcon(def, 44); fishCv.className = 'lb-icon-cvs';
    const fishEl = h('div', { class: 'lb-fish' }, fishCv);
    const zone = h('div', { class: 'lb-zone', style: { height: s.p.zoneSize * 100 + '%' } });
    const bobber = h('div', { class: 'lb-bobber' }, h('i'));
    const water = h('div', { class: 'lb-water' }, bobber, zone, fishEl, h('div', { class: 'lb-bubbles' }, h('i'), h('i'), h('i')));
    const meterFill = h('i');
    const meter = h('div', { class: 'lb-meter', testid: 'fish-meter' }, meterFill);
    const msg = h('div', { class: 'lb-mg-msg' }, 'Get ready…');
    const timeEl = h('div', { class: 'lb-mg-time' }, '25');
    const fx = h('div', { class: 'lb-mg-fx' });
    const box = h('div', { class: 'lb-panel lb-fishing lb-pop', testid: 'fishing' },
      h('h2', { class: 'lb-modal-title' }, 'Something\'s biting!'),
      h('div', { class: 'lb-fish-stage' }, water, meter, h('div', { class: 'lb-fish-side' }, msg, timeEl, h('div', { class: 'lb-hint-row' }, h('span', { class: 'lb-kbd' }, 'Hold Space'), ' or press to reel up'))), fx);
    let phase = 'intro'; // intro -> play -> end
    let intro = 0.9;
    let finished = false;
    const m = openModal(box, { mode: 'minigame', light: true, testid: 'fishing-scrim', onPress: (a) => { if (a === 'cancel' && phase !== 'end') end({ caught: false, perfect: false }, 'You let it go.'); }, onClose: () => { ticker = null; } });
    m.scrim.addEventListener('pointerdown', () => { ptr.down = true; });
    window.addEventListener('pointerup', up);
    function up() { ptr.down = false; }
    function splash(n = 6) { for (let i = 0; i < n; i++) { const d = h('i', { class: 'lb-splash', style: { left: 30 + Math.random() * 40 + '%', '--dx': (Math.random() - 0.5) * 6 + 'em', animationDelay: Math.random() * 0.15 + 's' } }); fx.appendChild(d); setTimeout(() => d.remove(), 900); } }
    function end(result, text) {
      if (finished) return;
      finished = true; phase = 'end';
      msg.textContent = text;
      msg.classList.add('big');
      if (result.caught) { sfx('catch'); splash(14); fishEl.classList.add('caught'); } else sfx('fish_escape');
      setTimeout(() => { window.removeEventListener('pointerup', up); m.close(); resolve(result); }, result.caught ? 1700 : 1200);
    }
    ticker = (dt) => {
      if (phase === 'intro') { intro -= dt; if (intro <= 0) { phase = 'play'; msg.textContent = 'Keep the fish in the green!'; sfx('bite'); } }
      if (phase === 'play') {
        const prev = s.inside;
        const ph = stepFishing(s, dt, confirmHeld(ptr));
        if (prev !== s.inside && s.inside) sfx('ui_move');
        if (ph === 'caught') end(fishingResult(s), `Caught ${fish.name || 'a fish'}!${fish.size ? ` (${Math.round(fish.size)}cm)` : ''}${s.perfect ? ' Perfect!' : ''}`);
        else if (ph === 'lost') end(fishingResult(s), 'It got away…');
      }
      zone.style.bottom = (s.pos - s.p.zoneSize / 2) * 100 + '%';
      fishEl.style.bottom = `calc(${s.fishPos * 100}% - 1.6em)`;
      meterFill.style.height = s.progress * 100 + '%';
      meter.classList.toggle('hot', s.progress > 0.7);
      zone.classList.toggle('on', s.inside);
      timeEl.textContent = String(Math.max(0, Math.ceil(s.p.limit - s.time)));
      bobber.style.transform = `translateX(-50%) translateY(${Math.sin(s.time * 5) * 0.12}em)`;
    };
  });
}

/** @returns {Promise<{score:number}>} */
export function kneading({ difficulty = 1, rounds = 3 } = {}) {
  return new Promise((resolve) => {
    const s = createKneading({ difficulty, rounds });
    const zone = h('div', { class: 'lb-sweet' });
    const marker = h('div', { class: 'lb-marker' });
    const track = h('div', { class: 'lb-ktrack', testid: 'knead-track' }, zone, marker);
    const dough = h('div', { class: 'lb-dough' }, h('i', { class: 'e1' }), h('i', { class: 'e2' }), h('i', { class: 'mouth' }));
    const fb = h('div', { class: 'lb-feedback' });
    const dots = Array.from({ length: s.rounds }, () => h('span', { class: 'lb-rdot' }));
    const btn = h('button', { class: 'lb-btn primary lb-knead-btn', testid: 'knead-press', onPointerdown: (e) => { e.stopPropagation(); press(); } }, 'Knead!');
    const box = h('div', { class: 'lb-panel lb-kneading lb-pop', testid: 'kneading' }, h('h2', { class: 'lb-modal-title' }, 'Knead the dough'), h('div', { class: 'lb-dough-wrap' }, dough, fb), track, h('div', { class: 'lb-rdots' }, dots), btn, h('div', { class: 'lb-hint-row' }, h('span', { class: 'lb-kbd' }, 'Space'), ' when the marker is in the sweet spot'));
    let ended = false;
    let phase = 'intro'; let intro = 0.7;
    const place = () => { zone.style.left = (s.centre - s.width / 2) * 100 + '%'; zone.style.width = s.width * 100 + '%'; };
    const m = openModal(box, { mode: 'minigame', light: true, testid: 'kneading-scrim', onPress: (a) => { if (a === 'confirm') press(); }, onClose: () => { ticker = null; } });
    m.scrim.addEventListener('pointerdown', () => press());
    function press() {
      if (ended || phase !== 'play') return;
      const g = pressKneading(s);
      if (!g) return;
      const label = { great: 'Great!', good: 'Good', okay: 'Okay', miss: 'Miss…' }[g];
      fb.textContent = label; fb.className = 'lb-feedback show ' + g;
      dough.classList.remove('squish'); void dough.offsetWidth; dough.classList.add('squish');
      dots[s.results.length - 1].className = 'lb-rdot ' + g;
      sfx('knead');
      if (s.phase === 'done') {
        ended = true;
        setTimeout(() => { fb.textContent = `Score ${Math.round(s.score * 100)}%`; fb.className = 'lb-feedback show final'; }, 450);
        setTimeout(() => { m.close(); resolve({ score: s.score }); }, 1700);
      } else place();
    }
    ticker = (dt) => {
      if (phase === 'intro') { intro -= dt; if (intro <= 0) phase = 'play'; }
      if (phase === 'play' && !ended) stepKneading(s, dt);
      marker.style.left = s.marker * 100 + '%';
    };
    place();
  });
}
export { wait };
