// Shop screen: buy / sell tabs, quantity stepper, shopkeeper portrait + greeting.
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { h, clear, sfx, getItem, getNpc, cap, append } from './dom.js';
import { itemIcon } from './icons.js';
import { openModal } from './widgets.js';
import { toast } from './hud.js';
import { COIN_SVG } from './svgs.js';
import { sellPrice, fmtNum } from './helpers.js';
import { portraitThumb } from './menu_tabs.js';

/** @returns {Promise<void>} */
export function openShop(opts = {}) {
  const { title = 'Shop', greeting = 'Welcome!', portraitId, stock = [], canSell = true, onBuy, onSell } = opts;
  return new Promise((resolve) => {
    let tab = 'buy';
    let sel = 0;
    let qty = 1;
    let shownMoney = money();
    const stockLeft = new Map(stock.map((s) => [s.itemId, s.left]));
    function money() { return (Game.state && Game.state.player && Game.state.player.money) || 0; }
    const sellable = () => {
      const slots = (Game.state && Game.state.inventory && Game.state.inventory.slots) || [];
      const out = [];
      slots.forEach((s, i) => {
        if (!s) return;
        const d = getItem(s.id);
        if (!d || !sellPrice(d)) return;
        if (Array.isArray(canSell) && !canSell.includes(d.category)) return;
        if (canSell === false) return;
        out.push({ slot: i, id: s.id, qty: s.qty, def: d, price: sellPrice(d) });
      });
      return out;
    };
    const buyList = () => stock.map((s) => ({ id: s.itemId, price: s.price, left: stockLeft.get(s.itemId), def: getItem(s.itemId) }));
    const list = () => (tab === 'buy' ? buyList() : sellable());
    const maxQty = (e) => {
      if (!e) return 1;
      if (tab === 'sell') return e.qty;
      const aff = Math.floor(money() / Math.max(1, e.price));
      const cap2 = e.left != null ? e.left : 99;
      return Math.max(1, Math.min(99, cap2, aff || 1));
    };

    // chrome
    const coinNum = h('b', { testid: 'shop-coins' }, fmtNum(shownMoney));
    const coinBox = h('div', { class: 'lb-shop-coins' }, h('span', { class: 'lb-mini', html: COIN_SVG }), coinNum);
    const tabBuy = h('button', { class: 'lb-seg on', testid: 'shop-tab-buy', onClick: () => setTab('buy') }, 'Buy');
    const tabSell = h('button', { class: 'lb-seg', testid: 'shop-tab-sell', onClick: () => setTab('sell') }, 'Sell');
    const listEl = h('div', { class: 'lb-shop-list lb-scroll', testid: 'shop-list' });
    const detail = h('div', { class: 'lb-shop-detail', testid: 'shop-detail' });
    const greet = h('div', { class: 'lb-shop-greet' }, greeting);
    const keeper = h('div', { class: 'lb-shop-keeper' }, portraitThumb(portraitId || 'shop', title, false, true), greet);
    const panel = h('div', { class: 'lb-panel lb-shop lb-pop', testid: 'shop' },
      h('div', { class: 'lb-shop-head' }, h('h2', { class: 'lb-modal-title' }, title), h('div', { class: 'lb-segs' }, tabBuy, tabSell), coinBox),
      h('div', { class: 'lb-shop-main' }, h('div', { class: 'lb-shop-left' }, keeper, detail), listEl),
      h('div', { class: 'lb-menu-foot' }, h('span', null, h('span', { class: 'lb-kbd' }, 'Q'), ' ', h('span', { class: 'lb-kbd' }, 'E'), ' buy / sell'), h('span', null, h('span', { class: 'lb-kbd' }, '←→'), ' amount'), h('span', null, h('span', { class: 'lb-kbd' }, 'Space'), ' confirm  ', h('span', { class: 'lb-kbd' }, 'X'), ' leave')));

    function paintList() {
      clear(listEl);
      const es = list();
      sel = Math.max(0, Math.min(es.length - 1, sel));
      if (!es.length) listEl.appendChild(h('div', { class: 'lb-muted lb-shop-empty' }, tab === 'buy' ? 'Nothing for sale today.' : 'You have nothing this shop wants.'));
      es.forEach((e, i) => {
        const cv = itemIcon(e.def || { icon: { shape: 'bag' } }, 44); cv.className = 'lb-icon-cvs';
        const can = tab === 'sell' || (money() >= e.price && (e.left == null || e.left > 0));
        listEl.appendChild(h('div', {
          class: 'lb-shop-row' + (i === sel ? ' is-sel' : '') + (can ? '' : ' poor') + (e.left === 0 ? ' soldout' : ''), testid: 'shop-row', dataset: { id: e.id },
          onClick: () => { if (sel === i) act(); else { sel = i; qty = 1; paint(); } }, onPointerenter: () => { if (sel !== i) { sel = i; qty = 1; paint(true); } },
        }, h('div', { class: 'lb-shop-ico' }, cv), h('div', { class: 'lb-shop-name' }, h('b', null, e.def ? e.def.name : '???'), tab === 'buy' && e.left != null ? h('small', { class: 'lb-muted' }, e.left > 0 ? `${e.left} left` : 'Sold out') : tab === 'sell' ? h('small', { class: 'lb-muted' }, `×${e.qty}`) : null),
        h('div', { class: 'lb-shop-price' }, fmtNum(e.price), h('span', { class: 'lb-mini', html: COIN_SVG }))));
      });
    }
    function paintDetail() {
      clear(detail);
      const e = list()[sel];
      if (!e) return;
      qty = Math.max(1, Math.min(maxQty(e), qty));
      const total = e.price * qty;
      const down = h('button', { class: 'lb-btn small', testid: 'qty-down', onClick: () => step(-1) }, '−');
      const up = h('button', { class: 'lb-btn small', testid: 'qty-up', onClick: () => step(1) }, '+');
      const can = tab === 'sell' || money() >= total && (e.left == null || e.left >= qty);
      const big = itemIcon(e.def || { icon: { shape: 'bag' } }, 64); big.className = 'lb-icon-cvs';
      append(detail,
        h('div', { class: 'lb-detail-head' }, h('div', { class: 'lb-detail-icon' }, big), h('h3', { class: 'lb-detail-name' }, e.def ? e.def.name : '???')),
        h('p', { class: 'lb-shop-desc' }, (e.def && e.def.desc) || ''),
        h('div', { class: 'lb-stepper' }, down, h('b', { class: 'lb-qty-n', testid: 'qty' }, '×' + qty), up, h('span', { class: 'lb-shop-total' + (can ? '' : ' poor') }, `${tab === 'buy' ? 'Total' : 'You get'} `, h('b', null, fmtNum(total)), h('span', { class: 'lb-mini', html: COIN_SVG }))),
        h('button', { class: 'lb-btn primary' + (can || tab === 'sell' ? '' : ' is-disabled'), testid: 'shop-act', onClick: act }, tab === 'buy' ? 'Buy' : 'Sell'));
    }
    function paint(keepScroll) { paintList(); paintDetail(); const s = listEl.querySelector('.is-sel'); if (s && !keepScroll) s.scrollIntoView({ block: 'nearest' }); }
    function setTab(t) { if (tab === t) return; tab = t; sel = 0; qty = 1; tabBuy.classList.toggle('on', t === 'buy'); tabSell.classList.toggle('on', t === 'sell'); sfx('ui_tab'); paint(); }
    function step(d) { const e = list()[sel]; if (!e) return; const n = Math.max(1, Math.min(maxQty(e), qty + d)); if (n !== qty) { qty = n; sfx('ui_move'); paintDetail(); } else sfx('ui_error'); }
    async function act() {
      const e = list()[sel];
      if (!e) return;
      let res;
      try {
        res = tab === 'buy' ? (onBuy ? await onBuy(e.id, qty) : { ok: false, reason: 'Not available.' }) : (onSell ? await onSell(e.slot, qty) : { ok: false, reason: 'Not buying.' });
      } catch (err) { res = { ok: false, reason: 'Something went wrong.' }; }
      res = res || { ok: false };
      const name = e.def ? e.def.name : 'item';
      if (res.ok) {
        if (tab === 'buy') { if (e.left != null) stockLeft.set(e.id, Math.max(0, e.left - qty)); sfx('buy'); toast(`Bought ${name}${qty > 1 ? ' ×' + qty : ''}`, { icon: e.def, kind: 'item' }); Game.bus.emit(EVT.UI_BUY, { shopId: opts.shopId || opts.id || title, itemId: e.id, qty, done: true }); }
        else { sfx('sell'); toast(`Sold ${name}${qty > 1 ? ' ×' + qty : ''} for ${fmtNum(res.gained != null ? res.gained : e.price * qty)} coins`, { icon: e.def, kind: 'item' }); Game.bus.emit(EVT.UI_SELL, { slot: e.slot, qty, done: true }); }
        sfx('coin');
        flash(tab === 'buy' ? -e.price * qty : res.gained != null ? res.gained : e.price * qty);
        qty = 1;
        setTimeout(() => paint(true), 30);
      } else {
        sfx('ui_error');
        toast(res.reason || (tab === 'buy' ? 'You can\'t buy that right now.' : 'The shop won\'t take that.'), { kind: 'warn' });
      }
    }
    function flash(delta) {
      const f = h('span', { class: 'lb-delta' + (delta < 0 ? ' neg' : '') }, (delta > 0 ? '+' : '') + fmtNum(delta));
      coinBox.appendChild(f); setTimeout(() => f.remove(), 1700);
    }
    const timer = setInterval(() => {
      const m = money();
      if (m !== shownMoney) { shownMoney += Math.sign(m - shownMoney) * Math.max(1, Math.abs(m - shownMoney) * 0.25); if (Math.abs(m - shownMoney) < 1) shownMoney = m; coinNum.textContent = fmtNum(shownMoney); paint(true); }
    }, 50);
    const m = openModal(panel, {
      mode: 'shop', testid: 'shop-scrim',
      onPress: (a) => {
        const es = list();
        if (a === 'up') { if (sel > 0) { sel--; qty = 1; sfx('ui_move'); paint(); } } else if (a === 'down') { if (sel < es.length - 1) { sel++; qty = 1; sfx('ui_move'); paint(); } } else if (a === 'left') step(-1);
        else if (a === 'right') step(1);
        else if (a === 'tab_prev' || a === 'tab_next') setTab(tab === 'buy' ? 'sell' : 'buy');
        else if (a === 'confirm') act();
        else if (a === 'cancel' || a === 'menu') leave();
      },
      onClose: () => clearInterval(timer),
    });
    function leave() { if (m.closed()) return; sfx('ui_close'); m.close(); try { Game.bus.emit(EVT.SHOP_CLOSE, { id: title }); } catch (_) { /* ignore */ } resolve(); }
    panel.querySelector('.lb-shop-head').appendChild(h('button', { class: 'lb-menu-close', testid: 'shop-close', onClick: leave }, '✕'));
    paint();
    sfx('ui_open');
  });
}
export { cap, getNpc };
