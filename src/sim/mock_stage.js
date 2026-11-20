// A Stage that records every call and auto-answers: for tests, content smoke tests and headless playthroughs.
// MockStage({ choices: [1, 0], choicePolicy: (labels, n) => labels.length - 1, callResults: { track_sprint: { score: 90, rank: 'gold' } }, map: 'town_square' })
// `choices` are consumed first, then `choicePolicy(labels, callNumber)` (default: always the first option).
export class MockStage {
  constructor({ choices = [], choicePolicy = null, callResults = {}, map = 'town_square' } = {}) {
    this.log = [];
    this.choices = choices.slice();
    this.choicePolicy = choicePolicy;
    this.callResults = callResults;
    this.map = map;
    this.ended = false;
  }
  rec(type, payload = {}) { this.log.push({ type, ...payload }); }
  currentMap() { return this.map; }
  count(type) { return this.log.filter((l) => l.type === type).length; }
  of(type) { return this.log.filter((l) => l.type === type); }
  resolveAnchor(ref) { return typeof ref === 'string' ? { map: ref.includes(':') ? ref.split(':')[0] : this.map, x: 5, y: 5, dir: 'down' } : { map: this.map, ...ref }; }

  async say(p) { this.rec('say', p); }
  async narrate(text) { this.rec('narrate', { text }); }
  async think(text) { this.rec('think', { text }); }
  async choice(labels) {
    const raw = this.choices.length ? this.choices.shift() : this.choicePolicy ? this.choicePolicy(labels, this.count('choice')) : 0;
    const i = Math.max(0, Math.min(raw, labels.length - 1));
    this.rec('choice', { labels, picked: i });
    return i;
  }
  async warp(p) { this.map = p.map; this.rec('warp', p); }
  async place(p) { this.rec('place', p); }
  async hide(who) { this.rec('hide', { who }); }
  async moveTo(p) { this.rec('moveTo', p); }
  async face(p) { this.rec('face', p); }
  async pose(p) { this.rec('pose', p); }
  async emote(p) { this.rec('emote', p); }
  async cam(p) { this.rec('cam', p); }
  async fade(p) { this.rec('fade', p); }
  async flash(p) { this.rec('flash', p); }
  async lighting(preset) { this.rec('lighting', { preset }); }
  async sfx(id) { this.rec('sfx', { id }); }
  async music(id, fadeMs) { this.rec('music', { id, fadeMs }); }
  async musicResume() { this.rec('musicResume'); }
  async banner(p) { this.rec('banner', p); }
  async wait(ms) { this.rec('wait', { ms }); }
  async call(p) {
    this.rec('call', p);
    return this.callResults[p.id] || { score: 70, rank: 'silver' };
  }
  async endGame() { this.ended = true; this.rec('endGame'); }
  async begin(ev) { this.rec('begin', { id: ev.id }); }
  async end(ev) { this.rec('end', { id: ev.id }); }
}
