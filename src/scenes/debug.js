// window.__game.debug: the stable QA / scripting API (docs/game/02_SIM_CONTENT_CONTRACTS.md section 12) plus a few helpers that make
// scripted Playwright runs reliable (walkTo, talkTo, autoAdvance, waitIdle, where).
// Methods that start long flows (runEvent, talkTo, sleep with scenes) return immediately or after the first beat; use waitIdle().
import { deepClone } from '../core/util.js';
import { SUBJECTS, TRAITS } from '../core/constants.js';
import { walkableTile } from './anchors.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createDebugApi(game) {
  const need = () => {
    if (!game.overworld) throw new Error('debug: no overworld is running (still on the title screen?)');
    return game.overworld;
  };
  const frame = () => new Promise((res) => {
    const hooks = game.app && game.app.hooks;
    if (!hooks) { requestAnimationFrame(() => res()); return; }
    const f = () => { const i = hooks.afterUpdate.indexOf(f); if (i >= 0) hooks.afterUpdate.splice(i, 1); res(); };
    hooks.afterUpdate.push(f);
  });
  const resync = () => { const o = need(); o.afterSubScene(); o.snapGrade = true; };

  const api = {
    /** Warp to `map:anchor` (fade included, enterMap events fire afterwards). Resolves true, or false for a missing map. */
    async warp(map, anchor = 'entrance') {
      const o = need();
      try { await o.changeMap(map, anchor); } catch (e) { console.warn(`[debug] warp(${map}) failed: ${e.message}`); return false; }
      o.queue.push({ type: 'enterMap', map });
      return true;
    },
    setTime(hhmm) { need().sim.clock.setTime(hhmm); resync(); return game.sim.state.time.minute; },
    setDate(year, season, day) { need().sim.clock.setDate({ year, season, day }); resync(); return game.sim.state.time.absDay; },
    giveMoney(n) { return need().sim.player.addMoney(n); },
    giveItem(id, n = 1) { return need().sim.inventory.add(id, n); },
    setFlag(name, value = true) { need().sim.player.setFlag(name, value); return value; },
    addFriend(npc, points = 10) { const s = need().sim; s.relationships.markMet(npc); s.relationships.addFriendship(npc, points); return s.relationships.friendship(npc); },
    setStat(name, value) {
      const st = need().sim.state;
      if (SUBJECTS.includes(name)) st.player.subjects[name] = value;
      else if (TRAITS.includes(name)) st.player.traits[name] = value;
      else if (name === 'conduct') st.player.conduct = value;
      else if (name === 'energy') need().sim.player.addEnergy(value - st.player.energy);
      else if (name === 'money') need().sim.player.addMoney(value - st.player.money);
      else if (name === 'spirit') st.school.spirit = value;
      else throw new Error(`debug.setStat: unknown stat "${name}"`);
      return value;
    },
    /** Sleep through the night pipeline (no summary scene) and wake up next morning. Resolves with the day summary. */
    async sleep({ scene = false } = {}) {
      const o = need();
      return o.runExclusive(() => o.sleepFlow({ quick: !scene }));
    },
    /** Skip n whole days (night pipeline each time, no scenes, no wake events). Resolves with the new absDay. */
    async skipDays(n = 1) {
      const o = need();
      for (let i = 0; i < n; i++) {
        o.sim.clock.sleep({});
        o.dayDirty = true;
      }
      o.enterMorning();
      o.needResync = true;
      await frame();
      return o.sim.state.time.absDay;
    },
    /** Start an event by id (not awaited: the script needs input; use waitIdle()). Returns false for an unknown id. */
    runEvent(id) {
      const o = need();
      if (!o.es.events.get(id)) return false;
      o.runEventById(id).catch((e) => console.error('[debug] runEvent', e));
      return true;
    },
    listEvents() {
      const st = game.sim.state;
      return game.events.events.all().map((e) => ({ id: e.id, title: e.title, kind: e.kind, seen: !!st.events.seen[e.id] }));
    },
    state() { return deepClone(game.sim.state); },
    async loadState(json) {
      const o = need();
      const st = typeof json === 'string' ? JSON.parse(json) : json;
      await o.loadSession(st);
      return true;
    },
    /** Hold an input action for `ms` milliseconds (real time). */
    async press(action, ms = 80) {
      game.input.inject(action, true);
      await wait(ms);
      game.input.inject(action, false);
      await frame();
    },
    screenshot() { return game.renderer.toDataURL(); },
    nextFrame() { return frame(); },
    /** Resolve once nothing is running (no dialogue, script, fade, walk or sub-scene) for 3 frames; rejects after `timeout` ms. */
    async waitIdle({ timeout = 20000 } = {}) {
      const t0 = Date.now();
      let n = 0;
      while (n < 3) {
        await frame();
        const o = game.overworld;
        const ok = o && o.idle && !o.walkers.length && !o.autoWalk && game.renderer.fade.amount < 0.01 && !game.renderer.fade.busy && !o.queue.length;
        n = ok ? n + 1 : 0;
        if (Date.now() - t0 > timeout) throw new Error('debug.waitIdle timed out');
      }
      return true;
    },

    // ---- scripting helpers -------------------------------------------------------------
    /** Walk the player to a tile along A* (run by default). Resolves true on arrival. */
    walkTo(tx, ty, opts) { return need().walkPlayerTo(tx, ty, opts); },
    teleport(tx, ty, dir) { const p = need().player; p.setTile(tx, ty); if (dir) p.setDir(dir); game.world.cam.snapTo(p.x, p.y - 8); return true; },
    /** Walk next to an NPC, face it and press interact. Resolves true when the conversation started. */
    async talkTo(id) {
      const o = need();
      const a = o.npcs.actorOf(id);
      if (!a) return false;
      const p = o.player;
      const cands = [[0, 1], [0, -1], [-1, 0], [1, 0]].map(([dx, dy]) => ({ x: a.tx + dx, y: a.ty + dy }))
        .filter((c) => walkableTile(o.map, c.x, c.y))
        .sort((u, v) => Math.abs(u.x - p.tx) + Math.abs(u.y - p.ty) - (Math.abs(v.x - p.tx) + Math.abs(v.y - p.ty)));
      for (const c of cands) {
        if (!(await o.walkPlayerTo(c.x, c.y, { run: true }))) continue;
        p.faceToward(a);
        await frame();
        return o.interact();
      }
      return false;
    },
    npcs() { return need().npcs.list().map((e) => ({ id: e.id, tx: e.actor.tx, ty: e.actor.ty, ref: e.ref, walking: !!e.walker })); },
    where() {
      const o = need();
      const st = game.sim.state;
      const top = game.scenes.top;
      return { scene: top ? top.constructor.name : null, map: o.mapId, tx: o.player.tx, ty: o.player.ty, dir: o.player.dir, minute: st.time.minute, day: st.time.day, season: st.time.season, weather: st.weather.today, idle: o.idle, busy: o.busy, modals: o.modals.length, script: o.scriptDepth, fps: Math.round(game.renderer.perf.fps) };
    },
    /** Auto-confirm dialogue (and pick `choice` in choice boxes) so events run to the end unattended. */
    autoAdvance(on = true, choice = 0) { need().auto = on ? { delay: 0.25, choice } : null; return !!on; },
    overlay(on = true) { game.world.setDebug(on); return on; },
    fps(on = true) { need().showFps = on; return on; },
  };
  Object.assign(game.debug, api);
  return api;
}
