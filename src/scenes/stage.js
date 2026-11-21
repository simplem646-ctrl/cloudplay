// The Stage: implements the interface of docs/game/02_SIM_CONTENT_CONTRACTS.md section 7 (+ begin/end/currentMap) over the
// overworld scene. The interpreter calls these from event scripts; everything is async and resolves when the beat is over.
// Scripts start with input locked (begin) and end with control returned (end). Holding `skip` fast-forwards skippable events.
import { ChoiceBox, DialogueBox, Banner } from '../ui/index.js';
import { openCall } from './registry.js';
import { resolveAnchorRef, findFreeTile } from './anchors.js';
import { displayName } from './npc_plan.js';

export class OverworldStage {
  constructor(ow) {
    this.ow = ow;
    this.depth = 0;
  }

  get game() { return this.ow.game; }

  // ---- lifecycle hooks (called by runEvent) --------------------------------------------------------
  async begin(ev) { this.ow.beginScript(ev); }
  async end(ev) { await this.ow.endScript(ev); }
  currentMap() { return this.ow.mapId; }

  /** Anchor ref -> { map, x, y, dir } (tile coords). 'spot_a' = current map; 'map:anchor' = global. */
  resolveAnchor(ref) {
    return resolveAnchorRef(ref, this.ow.mapId, (m) => this.ow.getMapDef(m));
  }

  // ---- actors -------------------------------------------------------------------------------------
  actor(who) {
    if (!who || who === 'theo' || who === 'player') return this.ow.player;
    return this.ow.npcs.ensure(who);
  }
  peek(who) {
    if (!who || who === 'theo' || who === 'player') return this.ow.player;
    return this.ow.npcs.actorOf(who);
  }

  // ---- dialogue -----------------------------------------------------------------------------------
  async say({ who, face = 'neutral', text, name }) {
    if (who === 'narrator') return this.narrate(text);
    const speaker = who === 'unknown' ? null : who;
    const a = speaker && speaker !== 'theo' ? this.peek(speaker) : null;
    if (a && this.ow.player) a.clearEmote();
    await this.ow.showDialogue({ who, face, text, name: name || (who === 'unknown' ? '???' : displayName(who)), style: 'normal' });
  }
  async narrate(text) { await this.ow.showDialogue({ who: null, text, style: 'narrate' }); }
  async think(text) { await this.ow.showDialogue({ who: 'theo', face: 'thinking', name: 'Theo', text, style: 'think' }); }
  async choice(labels) {
    const box = new ChoiceBox({ services: this.game.ui.services, options: labels, cancellable: false });
    const r = await this.ow.ask(box, { keepLast: true });
    return typeof r === 'number' && r >= 0 ? r : 0;
  }

  // ---- map / actors -----------------------------------------------------------------------------------
  async warp({ map, at = 'entrance', dir, fade = true }) {
    await this.ow.changeMap(map, at, { dir, fade, scripted: true });
  }
  async place({ who, at, dir }) {
    const a = this.resolveAnchor(at);
    this.ow.cancelWalks(this.peek(who) || { none: true }); // placing an actor ends any walk it was still doing
    if (who === 'theo' || who === 'player') {
      this.ow.player.setPose(null);
      this.ow.player.setTile(a.x, a.y);
      this.ow.player.setDir(dir || a.dir);
      this.game.world.cam.snapTo(this.ow.player.x, this.ow.player.y - 8);
      return;
    }
    if (a.map !== this.ow.mapId) return; // a different map: nothing to show
    const t = findFreeTile(this.ow.map, a.x, a.y, (x, y) => (this.ow.npcs.occupied(who).has(`${x},${y}`) || (this.ow.player.tx === x && this.ow.player.ty === y)), { radius: 3 }) || a;
    this.ow.npcs.place(who, t, dir || a.dir);
  }
  async hide(who) {
    this.ow.cancelWalks(this.peek(who) || { none: true });
    if (who === 'theo' || who === 'player') { this.ow.player.visible = false; return; }
    this.ow.npcs.despawn(who);
  }
  async moveTo({ who, to, speed = 'walk', wait = true }) {
    const actor = this.actor(who);
    const a = this.resolveAnchor(to);
    if (a.map !== this.ow.mapId) return;
    if (!actor.visible) actor.visible = true;
    const p = this.ow.walkActor(actor, { x: a.x, y: a.y }, { run: speed === 'run' });
    if (wait !== false) await p;
  }
  async face({ who, dir, toward }) {
    const actor = this.actor(who);
    if (dir) { actor.setDir(dir); return; }
    if (toward) {
      const other = this.peek(toward);
      if (other) { actor.faceToward(other); return; }
      try { const a = this.resolveAnchor(toward); actor.faceToward(a.x * 16 + 8, a.y * 16 + 14); } catch { /* ignore */ }
    }
  }
  async pose({ who, pose }) { this.actor(who).setPose(pose || null); }
  async emote({ who, emote }) {
    this.actor(who).emote(emote, 1.6);
    await this.wait(550);
  }

  // ---- camera / screen ------------------------------------------------------------------------------------
  async cam({ focus, ms = 600, reset, shake } = {}) {
    const cam = this.game.world.cam;
    if (shake) {
      const amp = typeof shake === 'object' ? shake.amp ?? 3 : 3;
      const dur = typeof shake === 'object' ? shake.ms ?? 300 : 300;
      cam.shake(amp, dur);
    }
    if (reset) {
      await cam.focus(this.ow.player, this.ow.scale(ms || 400));
      cam.follow(this.ow.player, { snap: false });
      return;
    }
    if (focus) {
      let target = null;
      if (typeof focus === 'string') target = this.peek(focus);
      if (!target && typeof focus === 'string') {
        try { const a = this.resolveAnchor(focus); target = { x: a.x * 16 + 8, y: a.y * 16 + 8 }; } catch { /* ignore */ }
      }
      if (!target && focus && typeof focus === 'object' && typeof focus.x === 'number') target = { x: focus.x * 16 + 8, y: focus.y * 16 + 8 };
      if (target) {
        cam.follow(null);
        await cam.panTo(target.x, target.y - (target.id ? 8 : 0), this.ow.scale(ms));
      }
    }
  }
  async fade({ dir, ms = 500, color = '#000000' }) {
    const f = this.game.renderer.fade;
    if (dir === 'out') await f.out(this.ow.scale(ms), color);
    else await f.in(this.ow.scale(ms));
  }
  async flash({ ms = 300, color = '#ffffff' } = {}) {
    this.game.renderer.flash(color, 0.9, ms);
    await this.wait(Math.min(ms, 400));
  }
  async lighting(preset) { this.ow.setLighting(preset); }

  // ---- audio ---------------------------------------------------------------------------------------------
  async sfx(id) { try { this.game.audio && this.game.audio.sfx(id); } catch { /* optional */ } }
  async music(id, fadeMs = 800) { this.ow.setMusicOverride(id === undefined ? null : id, fadeMs); }
  async musicResume() { this.ow.setMusicOverride(undefined); }

  // ---- misc -----------------------------------------------------------------------------------------------
  async banner({ text, sub, ms = 2500 }) {
    const b = new Banner({ services: this.game.ui.services, text, sub, ms: this.ow.skipping ? 400 : ms });
    await this.ow.ask(b);
  }
  async wait(ms) { await this.ow.sleep(this.ow.scale(ms)); }
  async call({ scene, id, opts }) {
    const r = await openCall(this.game, scene, id, opts);
    if (r && r.missing) this.ow.toast('Coming soon', 'warning');
    this.ow.afterSubScene();
    return r || { score: 0, rank: 'none' };
  }
  async endGame() { this.ow.pendingEnding = true; }
}
