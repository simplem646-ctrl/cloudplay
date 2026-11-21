/** Test fixtures for the systems layer: mini Game.data, a scripted fake UI, and an environment reset. */
import { Game } from '../../../src/core/game.js';
import { defaultState, _resetStorage } from '../../../src/core/state.js';
import * as Sys from '../../../src/systems/index.js';
import { opts, _resetWarnings } from '../../../src/systems/kit.js';

const item = (id, name, category, buy, sell, tags = [], extra = {}) => ({ id, name, desc: '', category, price: { buy, sell }, icon: { shape: 'leaf', colors: ['#000', '#fff'] }, tags, ...extra });

export const items = {
  bread: item('bread', 'Bread', 'food', 40, 20, ['baked'], { energy: 30 }),
  cookie: item('cookie', 'Cookie', 'food', 25, 12, ['sweet', 'baked'], { energy: 10 }),
  rose: item('rose', 'Rose', 'gift', 30, 15, ['flower']),
  tulip: item('tulip', 'Tulip', 'gift', 30, 15, ['flower']),
  rock: item('rock', 'Pebble', 'misc', null, 1, ['junk']),
  carp: item('carp', 'Carp', 'fish', null, 50, ['fish']),
  eel: item('eel', 'Eel', 'fish', null, 80, ['fish', 'seafood']),
  honey: item('honey', 'Wild Honey', 'forage', null, 40, ['honey']),
  cottage_key: item('cottage_key', 'Cottage Key', 'key', null, null, [], { key: true }),
  plain: item('plain', 'Plain Thing', 'misc', 10, 5, []),
};

const npc = (id, name, extra = {}) => ({
  id, name, short: name.split(' ')[0], age: 20, role: 'x', gender: 'f', romance: false, portrait: false, birthday: null, home: 'cottage', voice: 'soft',
  loves: { items: [], tags: [] }, likes: { items: [], tags: [] }, dislikes: { items: [], tags: [] }, hates: { items: [], tags: [] }, ...extra,
});

export const npcs = {
  mira: npc('mira', 'Mira Calloway', {
    romance: true, birthday: { season: 'spring', day: 12 },
    loves: { items: ['cookie'], tags: [] }, likes: { items: [], tags: ['flower'] }, dislikes: { items: [], tags: ['junk'] }, hates: { items: ['eel'], tags: [] },
  }),
  willa: npc('willa', 'Willa Thorne', { romance: true, loves: { items: [], tags: ['flower'] }, likes: { items: ['rose'], tags: [] }, hates: { items: [], tags: ['flower'] } }),
  gus: npc('gus', 'Captain Gus', { gender: 'm', startMet: true, likes: { items: [], tags: ['seafood'] } }),
  theo: npc('theo', 'Theo Marsh', { gender: 'm' }),
};

export function makeData() {
  const d = {
    items: { ...items },
    npcs: { ...npcs },
    fish: {}, forage: {}, jobs: { bakery_shift: { id: 'bakery_shift', spot: 'job_bakery', area: 'bakery', name: 'Bakery' } },
    schedules: {},
    shops: {
      bakery: {
        id: 'bakery', name: 'Rye & Rose', owner: 'mira', area: 'bakery', counter: 'shop_bakery', greeting: 'Welcome, {player}!',
        stock: [{ item: 'bread', limit: 2 }, { item: 'cookie', price: 30, seasons: ['spring'] }, { item: 'rose', seasons: ['summer'] }, { item: 'rock' }],
        buys: ['food', 'fish'], sellMult: 0.5,
      },
      store: { id: 'store', name: 'Store', owner: 'gus', area: 'general_store', counter: 'shop_general', greeting: 'Hi', stock: [{ item: 'plain' }], buys: 'all' },
    },
    buildings: {
      bakery: { open: '07:00', close: '17:00', closedDays: ['sun'], closedText: 'The bakery is closed.' },
      general_store: { open: '09:00', close: '18:00', closedDays: ['wed'], closedText: 'Closed.' },
      workshop: { open: '00:00', close: '27:00', closedDays: [], lockFlag: 'workshop_unlocked', closedText: 'Locked.', lockedText: 'The shed is locked tight.' },
      observatory: { open: '16:00', close: '27:00', closedDays: [], closedText: 'Closed.' },
    },
    quests: {
      q_talk: { id: 'q_talk', kind: 'side', title: 'Say hi', giver: 'mira', desc: 'd', stages: [{ id: 's1', text: 'Talk to Mira', goal: { type: 'talk', npc: 'mira' } }], reward: { money: 100, items: [{ id: 'bread', qty: 2 }], aff: { mira: 30 }, flags: ['said_hi'] } },
      q_multi: {
        id: 'q_multi', kind: 'main', title: 'Multi', desc: 'd',
        stages: [
          { id: 'a', text: 'Have 2 bread', goal: { type: 'have', item: 'bread', qty: 2 }, onEnter: [{ setFlag: 'entered_a' }], onDone: [{ setFlag: 'done_a' }] },
          { id: 'b', text: 'Catch 2 fish', goal: { type: 'catch', fish: 'any', qty: 2 } },
          { id: 'c', text: 'Forage honey', goal: { type: 'forage', item: 'honey', qty: 1 } },
        ],
        reward: { script: [{ setFlag: 'multi_reward' }] },
      },
      q_visit: { id: 'q_visit', kind: 'side', title: 'Visit', desc: 'd', stages: [{ id: 'v', text: 'Go to the harbor', goal: { type: 'visit', area: 'harbor' } }], reward: {} },
      q_hearts: { id: 'q_hearts', kind: 'side', title: 'Hearts', desc: 'd', stages: [{ id: 'h', text: 'h', goal: { type: 'hearts', npc: 'mira', hearts: 2 } }], reward: {} },
      q_job: { id: 'q_job', kind: 'side', title: 'Job', desc: 'd', stages: [{ id: 'j', text: 'j', goal: { type: 'job', job: 'bakery_shift', times: 2 } }], reward: {} },
      q_earn: { id: 'q_earn', kind: 'side', title: 'Earn', desc: 'd', stages: [{ id: 'e', text: 'e', goal: { type: 'earn', amount: 100 } }], reward: {} },
      q_flag: { id: 'q_flag', kind: 'side', title: 'Flag', desc: 'd', stages: [{ id: 'f', text: 'f', goal: { type: 'flag', flag: 'the_flag' } }], reward: {} },
      q_date: { id: 'q_date', kind: 'side', title: 'Date', desc: 'd', stages: [{ id: 'd', text: 'd', goal: { type: 'date', season: 'spring', day: 3 } }], reward: {} },
      q_lantern: { id: 'q_lantern', kind: 'side', title: 'Lantern', desc: 'd', stages: [{ id: 'l', text: 'l', goal: { type: 'lanterns', count: 2 } }], reward: {} },
      q_give: { id: 'q_give', kind: 'side', title: 'Give', desc: 'd', stages: [{ id: 'g', text: 'g', goal: { type: 'give', npc: 'mira', item: 'cookie', qty: 1 } }], reward: {} },
      q_board: { id: 'q_board', kind: 'side', title: 'Board quest', desc: 'Help out', board: true, unlock: { flag: 'board_unlocked' }, stages: [{ id: 'x', text: 'x', goal: { type: 'flag', flag: 'zzz' } }], reward: { money: 10 } },
    },
    events: {
      prologue: { id: 'prologue', kind: 'story', when: { notFlag: 'prologue_done' }, priority: 100, once: true, script: [{ say: 'narrator', text: 'Welcome {player}.' }, { giveItem: 'cottage_key' }, { setFlag: 'prologue_done' }] },
      low: { id: 'low', kind: 'misc', when: { flag: 'trigger_a' }, priority: 1, once: true, script: [{ setFlag: 'ran_low' }] },
      high: { id: 'high', kind: 'misc', when: { flag: 'trigger_a' }, priority: 9, once: true, script: [{ setFlag: 'ran_high' }] },
      repeat: { id: 'repeat', kind: 'misc', when: { flag: 'trigger_r' }, priority: 5, once: false, cooldownDays: 3, script: [{ incFlag: 'repeat_count' }] },
      festival_test: { id: 'festival_test', kind: 'festival', when: [], priority: 50, once: true, script: [{ setFlag: 'festival_ran' }] },
    },
    festivals: {
      testfest: { id: 'testfest', name: 'Test Fest', date: { season: 'spring', day: 14 }, area: 'riverside_park', from: '10:00', to: '14:00', eventId: 'festival_test', decor: 'spring_picnic', closes: ['bakery'], placement: { default: { area: 'riverside_park', anchors: ['gazebo_spot'] }, byNpc: {} } },
    },
    calendar: { festivals: ['testfest'], weekly: [] },
    mail: {
      welcome: { id: 'welcome', from: 'odell', subject: 'Hello {player}', body: ['Welcome!'], when: { notFlag: 'never' }, once: true, attach: { money: 50, items: [{ id: 'bread', qty: 1 }] } },
      later: { id: 'later', from: 'town', subject: 'Later', body: ['Later.'], when: { flag: 'later_ok' }, once: true },
    },
    books: { b1: { id: 'b1', title: 'Old Book', author: 'x', where: 'bookshelf_lib_1', pages: ['Page one', 'Page {player}'], hint: { quest: 'q_talk', text: 'Hint!' } } },
    interactions: {
      'brook_lane.sign_bl': { script: [{ narrate: 'Custom sign for {player}' }] },
      'brook_lane.sign_x': { text: ['A sign.'] },
      _defaults: { sign: ['Default sign.'], object: ['Default object.'] },
    },
    dialogue: {
      mira: {
        npc: 'mira',
        intro: [{ say: 'mira', text: 'Hi, I am Mira!' }],
        talk: [
          { id: 't1', lines: ['Line one', ['Line two', 'happy']] },
          { id: 't2', lines: ['Other line'] },
          { id: 't3', when: { flag: 'only_flag' }, lines: ['Gated line'], after: [{ setFlag: 'after_ran' }] },
        ],
        gifts: { love: ['Love it!'], like: ['Like it.'], neutral: ['Thanks.'], dislike: ['Hmm.'], hate: ['Yuck!'], birthday: ['Birthday!'], again: ['Already gave.'] },
        shop: { greet: ['Fresh bread!'] },
      },
    },
    tutorial: [{ id: 'hint1', when: { flag: 'hint_on' }, text: 'Press I for items, {player}.' }],
    errands: [
      { id: 'e_deliver', text: 'Deliver {qty} {item} to {npc}', kind: 'deliver', pool: { npcs: ['mira', 'theo'], items: ['bread'], qty: [1, 2] }, reward: { money: [20, 40], aff: 5 }, weight: 1 },
      { id: 'e_bring', text: 'Bring {qty} {item} to {npc}', kind: 'bring', pool: { npcs: ['mira'], items: ['cookie'], qty: [1, 3] }, reward: { money: [30, 60] }, weight: 1 },
      { id: 'e_catch', text: 'Catch {qty} fish', kind: 'catch', pool: { npcs: [], items: ['carp'], qty: [1, 2] }, reward: { money: [30, 60] }, weight: 1 },
      { id: 'e_forage', text: 'Find {qty} {item}', kind: 'forage', pool: { npcs: [], items: ['honey'], qty: [1, 2] }, reward: { money: [30, 60] }, weight: 1 },
    ],
    getItem(id) { return this.items[id] || null; },
    getNpc(id) { return this.npcs[id] || null; },
  };
  return d;
}

/** Scripted fake UI: queues answers per method; records every call in ui.calls. */
export function makeUi() {
  const ui = {
    calls: [],
    answers: { ask: [], confirm: [], pickItem: [], title: [] },
    log(name, arg) { ui.calls.push({ name, arg }); },
    of(name) { return ui.calls.filter((c) => c.name === name).map((c) => c.arg); },
    toasts() { return ui.of('toast').map((a) => a.text); },
    toast(text, o) { ui.log('toast', { text, ...o }); },
    banner(t, s) { ui.log('banner', { t, s }); return Promise.resolve(); },
    fade(a, ms) { ui.log('fade', { a, ms }); return Promise.resolve(); },
    confirm(q) { ui.log('confirm', q); return Promise.resolve(ui.answers.confirm.length ? ui.answers.confirm.shift() : true); },
    pickItem(o) { ui.log('pickItem', o); return Promise.resolve(ui.answers.pickItem.length ? ui.answers.pickItem.shift() : null); },
    setPrompt() {}, hudVisible(v) { ui.log('hud', v); }, letterbox(v) { ui.log('letterbox', v); },
    daySummary(s) { ui.log('daySummary', s); return Promise.resolve(); },
    showTitle() { ui.log('showTitle'); return Promise.resolve(ui.answers.title.length ? ui.answers.title.shift() : { action: 'quit' }); },
    dialogue: {
      say(o) { ui.log('say', o); return Promise.resolve(); },
      ask(o) { ui.log('ask', o); return Promise.resolve(ui.answers.ask.length ? ui.answers.ask.shift() : 0); },
      narrate(t) { ui.log('narrate', t); return Promise.resolve(); },
      close() {},
    },
    menu: { open(tab) { ui.log('menu', tab); return Promise.resolve(); }, close() {} },
    shop: { open(o) { ui.log('shop', o); ui.lastShop = o; return Promise.resolve(); } },
    notes: { read(o) { ui.log('notes', o); return Promise.resolve(); } },
  };
  return ui;
}

export function fakeAudio() {
  const a = { calls: [], playSfx(id) { a.calls.push(['sfx', id]); }, playMusic(t) { a.calls.push(['music', t]); }, stopMusic() { a.calls.push(['stop']); }, setVolume() {} };
  return a;
}

export function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
}

/** Fresh world: new bus, data, ui, state (field mode), services initialised. */
export function setup(o = {}) {
  globalThis.localStorage = fakeStorage();
  _resetStorage();
  _resetWarnings();
  Game.bus.clear();
  Game.data = o.data || makeData();
  Game.ui = makeUi();
  Game.audio = fakeAudio();
  Game.world = null;
  Game.settings = { timeScale: 'normal', showHints: true };
  Game.state = defaultState({ name: 'Kai' });
  Game.mode = 'field';
  opts.skipFades = true;
  delete Sys.svc.entities;
  delete Sys.svc.jobs;
  delete Sys.svc.npcs;
  Sys.init();
  Sys.svc.weather.initState();
  return Game;
}

/** Set the date directly: season name or index, day, minutes. */
export function setDate(season, day, minutes = 360) {
  Sys.svc.clock.set({ season, day, minutes });
}
export const { svc } = Sys;
export { Sys, Game };
