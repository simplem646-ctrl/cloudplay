// CSS part 2: modal host, menu frame + tabs, shop, notes, summary, io dialogs.
export const SCREENS_CSS = `
.lb-modal-title{font-size:1.45em;color:var(--ink);text-align:center;margin:0 0 .4em;letter-spacing:.02em}
.lb-modal-title::after{content:'';display:block;height:.18em;width:3em;margin:.25em auto 0;border-radius:1em;background:linear-gradient(90deg,transparent,var(--sun),transparent)}
.lb-hint-row{font-size:.82em;color:var(--ink2);text-align:center;margin-top:.3em}
.lb-mini{display:inline-flex;width:1.3em;height:1.3em;vertical-align:-.3em}
.lb-mini svg{width:100%;height:100%}
.sil{filter:brightness(0) opacity(.28)}
.lb-chips{display:flex;flex-wrap:wrap;gap:.3em;margin:.25em 0}
.lb-chip{display:inline-block;padding:.05em .7em;border-radius:1em;background:#ecd9b4;border:.1em solid var(--brown2);font-size:.82em;font-weight:800;color:var(--ink2)}
.lb-chip.key{background:#ffe9a0;border-color:#d9a21e;color:#8a5a00}
.lb-chip.dating{background:#ffd6df;border-color:var(--berry);color:#b03a5a}
.lb-chip.done,.lb-chip.here{background:#d9f0c4;border-color:#4f8a3c;color:#2f6a22}
.lb-menu{pointer-events:auto;width:min(64em,96vw);height:min(37em,92vh);display:flex;flex-direction:column;padding:.55em .8em .45em;position:relative}
.lb-menu-tabs{display:flex;gap:.25em;align-items:flex-end;padding:0 2.2em .1em 0;flex:none;position:relative}
.lb-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:.35em;padding:.35em .3em;border:.14em solid var(--brown2);border-bottom:none;border-radius:.8em .8em 0 0;background:linear-gradient(180deg,#f3dfb6,#e8cd98);color:var(--ink2);font-weight:800;font-size:.9em;transition:transform .12s,background .15s;margin-bottom:-.14em;position:relative;z-index:1;pointer-events:auto}
.lb-tab:hover{background:linear-gradient(180deg,#fff0c8,#f6dca0)}
.lb-tab.on{background:linear-gradient(180deg,#fffaf0,#fff2d6);color:var(--ink);border-color:var(--brown);transform:translateY(-.12em);z-index:2;padding-bottom:.5em}
.lb-tab-ico{width:1.3em;height:1.3em;display:inline-flex}.lb-tab-ico svg{width:100%;height:100%}
.lb-tab.on .lb-tab-ico{color:var(--berry)}
@media (max-width:760px){.lb-tab-label{display:none}.lb-tab-ico{width:1.6em;height:1.6em}}
.lb-menu-close{position:absolute;right:.2em;top:.2em;width:1.9em;height:1.9em;border-radius:50%;border:.14em solid var(--brown);background:#fff4dc;font-weight:900;line-height:1;pointer-events:auto;z-index:3}
.lb-menu-close:hover{background:var(--berry);color:#fff}
.lb-menu-body{flex:1;min-height:0;border:.14em solid var(--brown);border-radius:0 0 .8em .8em;background:rgba(255,250,236,.7);padding:.7em;overflow:hidden;position:relative}
.lb-menu-body>*{height:100%}
.lb-tabin{animation:lb-fadein .2s}
.lb-menu-foot{display:flex;justify-content:space-between;gap:1em;font-size:.8em;color:var(--ink2);padding:.35em .3em 0;flex:none}
.lb-menu-hint{font-weight:800;color:var(--ink)}
.lb-tab-items{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:.8em}
.lb-items-left{display:flex;flex-direction:column;min-height:0;overflow:auto;scrollbar-width:thin;padding:.25em}
.lb-slotgrid{display:grid;gap:.35em;align-content:start}
.lb-slot{position:relative;aspect-ratio:1;border-radius:.7em;background:linear-gradient(180deg,#f1dfba,#e5cc9a);border:.13em solid #c79a6b;box-shadow:inset 0 .12em .25em rgba(90,55,30,.2);cursor:pointer;transition:transform .1s;pointer-events:auto}
.lb-slot.empty{background:rgba(199,154,107,.18);box-shadow:inset 0 .12em .25em rgba(90,55,30,.12)}
.lb-slot.is-sel{border-color:var(--sun);box-shadow:0 0 0 .2em rgba(244,197,66,.8),inset 0 0 0 .1em #fff;transform:scale(1.06);z-index:2;background:linear-gradient(180deg,#fff6d6,#ffe9a8)}
.lb-slot.dim{opacity:.38;filter:grayscale(.6)}
.lb-slot-icon{position:absolute;inset:12%}
.lb-qty{position:absolute;right:.2em;bottom:.05em;font-weight:900;font-size:.85em;color:#fff;text-shadow:0 0 .15em #4a3426,0 0 .15em #4a3426,0 .05em .1em #4a3426}
.lb-keytag{position:absolute;left:.25em;top:.05em;color:#e8a01e;font-size:.8em;text-shadow:0 0 .1em #fff}
.lb-cap-note{font-size:.82em;margin-top:.4em;text-align:center}
.lb-detail{background:linear-gradient(180deg,#fffaf0,#fcecc8);border:.14em solid var(--brown2);border-radius:.8em;padding:.8em;overflow:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:.45em;min-height:0}
.lb-detail-head{display:flex;gap:.7em;align-items:center}
.lb-detail-icon{width:4.2em;height:4.2em;flex:none;border-radius:.8em;background:#ecd9b4;border:.13em solid var(--brown2);padding:.3em}
.lb-detail-name{font-size:1.25em;line-height:1.15}
.lb-detail-desc{margin:0;font-weight:600;color:var(--ink);line-height:1.4}
.lb-detail-meta{display:flex;flex-direction:column;gap:.15em;font-size:.92em;color:var(--ink2)}
.lb-detail-empty{margin:auto;text-align:center}
.lb-use{align-self:flex-start;margin-top:auto}
.lb-tab-people{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:.8em}
.lb-plist{display:flex;flex-direction:column;gap:.2em;padding-right:.3em;min-height:0}
.lb-prow{display:flex;align-items:center;gap:.6em;padding:.2em .6em .2em .3em;border-radius:.8em;border:.13em solid transparent;cursor:pointer;flex:none;pointer-events:auto}
.lb-prow:hover{background:rgba(244,197,66,.2)}
.lb-prow.is-sel{background:rgba(244,197,66,.4);border-color:var(--sun)}
.lb-prow-name{font-weight:800;flex:1}
.lb-dating{width:1.2em;height:1.2em;display:inline-flex}.lb-dating svg{width:100%;height:100%}
.lb-pthumb{width:2.6em;height:2.6em;border-radius:50%;overflow:hidden;background:#ecd9b4;border:.12em solid var(--brown2);flex:none;position:relative}
.lb-pthumb canvas{position:absolute;left:-8%;top:2%;width:116%;height:auto}
.lb-pthumb.big{width:9em;height:11em;border-radius:1.2em}
.lb-pthumb.big canvas{left:0;top:0;width:100%;height:100%;object-fit:cover}
.lb-badge.flat{position:static;width:100%;height:100%;font-size:1.3em;border:none;box-shadow:none}
.lb-pthumb.big .lb-badge.flat{font-size:4.5em}
.lb-badge.flat.sil{filter:none;color:#fff6e6}
.lb-pdetail{flex-direction:row;gap:.9em;align-items:flex-start}
.lb-pinfo{display:flex;flex-direction:column;gap:.4em;min-width:0}
@media (max-width:900px){.lb-pthumb.big{width:6em;height:7.5em}}
.lb-tab-quests{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:.8em}
.lb-qleft{display:flex;flex-direction:column;gap:.5em;min-height:0}
.lb-lanterns{display:flex;flex-direction:column;gap:.1em;padding:.35em .6em;border-radius:.8em;background:linear-gradient(180deg,#fff0c0,#ffe39a);border:.13em solid #d9a21e;font-size:.9em;flex:none}
.lb-lrow{display:flex;gap:.2em}
.lb-lan{width:1.7em;height:1.7em;filter:grayscale(1) brightness(.85) opacity(.55)}
.lb-lan svg{width:100%;height:100%}
.lb-lan.lit{filter:drop-shadow(0 0 .3em rgba(255,200,60,.9));animation:lb-glow 2.4s ease-in-out infinite}
.lb-qlist{display:flex;flex-direction:column;gap:.2em;min-height:0;flex:1}
.lb-qhead{font-family:Fredoka,sans-serif;font-weight:600;color:var(--ink2);font-size:.9em;margin-top:.3em;text-transform:uppercase;letter-spacing:.08em}
.lb-qrow{display:flex;gap:.5em;align-items:center;padding:.3em .6em;border-radius:.7em;border:.13em solid transparent;cursor:pointer;flex:none;pointer-events:auto}
.lb-qrow:hover{background:rgba(244,197,66,.2)}
.lb-qrow.is-sel{background:rgba(244,197,66,.4);border-color:var(--sun)}
.lb-qrow.done{opacity:.7}
.lb-qname{flex:1;font-weight:800}
.lb-dotq{width:1.3em;text-align:center;color:var(--leaf);font-weight:900}
.lb-tracked{font-size:.7em;padding:.05em .6em;border-radius:1em;background:#d9f0c4;color:#2f6a22;font-weight:800}
.lb-stage{padding:.4em .7em;border-radius:.7em;background:#e7f4d8;border:.1em dashed #6fb85a}
.lb-qempty{padding:1em;text-align:center}
.lb-tab-map{display:flex;flex-direction:column;gap:.4em}
.lb-map-frame{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;border-radius:.8em;overflow:hidden;background:#d9bd86;padding:.3em}
.lb-map-cvs{max-width:100%;max-height:100%;aspect-ratio:960/600;border-radius:.6em;box-shadow:0 0 0 .15em #8a5a3a;pointer-events:auto}
.lb-map-info{display:flex;gap:.6em;align-items:center;justify-content:center;font-size:1.05em;min-height:1.6em;flex:none;height:auto!important}
.lb-tab-calendar{display:flex;flex-direction:column;gap:.45em}
.lb-cal-head{display:flex;align-items:center;justify-content:center;gap:1em;flex:none;height:auto!important}
.lb-cal-title{display:flex;align-items:center;gap:.5em;min-width:12em;justify-content:center}
.lb-cal-title h3{font-size:1.5em}
.lb-cal-emblem{width:2em;height:2em;display:inline-flex}.lb-cal-emblem svg{width:100%;height:100%}
.lb-cal-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);gap:.8em}
.lb-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:auto repeat(4,1fr);gap:.25em;min-height:0}
.lb-cal-wd{text-align:center;font-weight:900;font-size:.82em;color:var(--ink2);text-transform:uppercase}
.lb-cal-cell{position:relative;border-radius:.6em;background:linear-gradient(180deg,#fffaf0,#f8e8c4);border:.12em solid #d9bd86;padding:.15em .3em;display:flex;flex-direction:column;justify-content:space-between;min-height:0}
.lb-cal-cell.past{opacity:.6}
.lb-cal-cell.today{border-color:var(--berry);background:linear-gradient(180deg,#fff0f3,#ffd9e2);box-shadow:0 0 0 .15em rgba(224,96,126,.4);opacity:1}
.lb-cal-day{font-weight:900;font-size:.95em}
.lb-cal-icons{display:flex;gap:.1em;justify-content:flex-end}
.lb-cal-ic{display:inline-flex;width:1.35em;height:1.35em;vertical-align:-.3em}.lb-cal-ic svg{width:100%;height:100%}
.lb-cal-legend{display:flex;flex-direction:column;gap:.25em;background:rgba(255,250,236,.8);border:.13em solid var(--brown2);border-radius:.8em;padding:.5em .7em;min-height:0;font-size:.92em}
.lb-leg{display:grid;grid-template-columns:1.35em 6.4em minmax(0,1fr);align-items:center;column-gap:.45em}.lb-leg-date{white-space:nowrap}.lb-leg-text{min-width:0}.lb-leg-text.one{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-leg.muted{color:var(--ink2)}
.lb-tab-collection{overflow:auto;padding-right:.4em}
.lb-col-sec h3{font-size:1.15em;margin:.1em 0 .4em}
.lb-col-sec{margin-bottom:.9em}
.lb-cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(7.2em,1fr));gap:.45em}
.lb-ccard{display:flex;flex-direction:column;align-items:center;gap:.05em;padding:.4em .3em;border-radius:.8em;background:linear-gradient(180deg,#fffaf0,#f8e8c4);border:.12em solid #d9bd86;text-align:center;font-size:.88em}
.lb-ccard.unknown{background:rgba(199,154,107,.18)}
.lb-cicon{width:3.4em;height:3.4em}
.lb-cprice{font-weight:800;color:#8a6a00;font-size:.9em}
.lb-booklist{display:flex;flex-direction:column;gap:.3em}
.lb-bookrow{display:flex;align-items:center;gap:.6em;padding:.25em .6em;border-radius:.7em;background:rgba(255,250,236,.8);border:.1em solid #e0c898}
.lb-bookrow.unknown{opacity:.6}
.lb-tab-settings{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:1em;overflow:auto;padding-right:.3em;align-content:start}
.lb-set-col{display:flex;flex-direction:column;gap:.35em}
.lb-set-col h3{font-size:1.05em;color:var(--ink2);margin:.3em 0 .1em;text-transform:uppercase;letter-spacing:.08em}
.lb-set-row{display:flex;align-items:center;gap:.7em;padding:.25em .6em;border-radius:.8em;border:.13em solid transparent;background:rgba(255,250,236,.6);flex-wrap:wrap}
.lb-set-row.is-sel{border-color:var(--sun);background:rgba(244,197,66,.28)}
.lb-set-label{font-weight:800;min-width:7.5em}
.lb-slider{flex:1;min-width:6em;height:.9em;border-radius:1em;background:#d9c3a0;border:.13em solid var(--brown);position:relative;cursor:pointer;pointer-events:auto;touch-action:none}
.lb-slider i{display:block;height:100%;border-radius:1em;background:linear-gradient(180deg,#a5e48d,#6fb85a);pointer-events:none}
.lb-set-val{min-width:2.6em;text-align:right;font-weight:800}
.lb-segs{display:flex;gap:.2em;flex-wrap:wrap}
.lb-seg{padding:.15em .8em;border-radius:1em;border:.13em solid var(--brown2);background:#f6e6c4;font-weight:800;font-size:.9em;pointer-events:auto}
.lb-seg.on{background:var(--leaf);color:#fff;border-color:#4f8a3c;text-shadow:0 .06em 0 rgba(40,90,30,.5)}
.lb-seg:hover:not(.on){background:#ffefc0}
.slotrow{flex-wrap:nowrap}
.lb-slot-info{display:flex;flex-direction:column;flex:1;min-width:0;font-size:.85em;line-height:1.2}
.lb-slot-info span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-slot-status{font-weight:900;color:#2f6a22;min-width:3.4em;font-size:.85em}
.lb-set-row.is-sel .lb-btn.subsel{box-shadow:0 .15em 0 rgba(112,70,40,.45),0 0 0 .18em rgba(244,197,66,.95)}
.lb-set-actions{display:flex;gap:.4em;flex-wrap:wrap}
.lb-controls{display:grid;grid-template-columns:1fr 1fr;gap:.2em .8em;font-size:.85em}
.lb-controls div{display:flex;justify-content:space-between;align-items:center;gap:.4em}
.lb-confirm{pointer-events:auto;padding:1.2em 1.8em 1.1em;min-width:20em;max-width:min(30em,92vw);text-align:center}
.lb-confirm-q{font-weight:800;font-size:1.15em;margin-bottom:.9em;line-height:1.4}
.lb-confirm-btns{display:flex;gap:.8em;justify-content:center}
.lb-pick{pointer-events:auto;padding:.8em 1em;width:min(34em,94vw)}
.lb-pick-foot{margin-top:.6em;min-height:4.2em}
.lb-pick-name{font-weight:900;font-size:1.1em}
.lb-paper{pointer-events:auto;position:relative;width:min(36em,92vw);min-height:min(26em,80vh);padding:1.6em 2.4em 2em;cursor:pointer;color:#4a3a2a;border-radius:.5em .9em .9em .5em;border:.16em solid #b08a5a;
  background:repeating-linear-gradient(180deg,transparent 0 1.78em,rgba(120,150,190,.22) 1.78em 1.86em),linear-gradient(90deg,rgba(138,90,58,.18),transparent 6%),linear-gradient(180deg,#fffaf0,#f8ecd0);
  box-shadow:0 .9em 2em rgba(40,25,15,.45),inset 0 0 2em rgba(180,130,70,.25)}
.lb-notes-title{font-family:Fredoka,Nunito,sans-serif;font-size:1.5em;text-align:center;font-weight:600;color:#6a4a2a}
.lb-notes-rule{height:.15em;margin:.3em auto .6em;width:60%;background:linear-gradient(90deg,transparent,#c79a6b,transparent)}
.lb-notes-body p{margin:0 0 .5em;font-size:1.12em;line-height:1.78em;font-weight:600}
.lb-notes-body{transform-origin:0 50%}
.lb-notes-body.turn-fwd{animation:lb-turnf .35s ease-out}
.lb-notes-body.turn-back{animation:lb-turnb .35s ease-out}
@keyframes lb-turnf{0%{opacity:0;transform:perspective(60em) rotateY(40deg) translateX(1.5em)}100%{opacity:1;transform:none}}
@keyframes lb-turnb{0%{opacity:0;transform:perspective(60em) rotateY(-40deg) translateX(-1.5em)}100%{opacity:1;transform:none}}
.lb-notes-num{position:absolute;left:0;right:0;bottom:.7em;text-align:center;font-size:.85em;color:#8a6a4a;font-weight:800}
.lb-notes-next{position:absolute;right:1.2em;bottom:.6em;color:var(--berry);font-weight:900;animation:lb-blink 1s infinite}
.lb-summary{pointer-events:auto;position:relative;overflow:hidden;width:min(30em,92vw);padding:1.3em 2em;text-align:center}
.lb-summary .lb-modal-title{color:#fdf1d2}
.lb-sum-list{display:flex;flex-direction:column;gap:.3em;margin:.6em 0;position:relative;z-index:1}
.lb-sum-row{display:flex;justify-content:space-between;padding:.2em .8em;border-radius:.7em;background:rgba(255,244,220,.1);opacity:0;animation:lb-pop .4s forwards;font-size:1.05em}
.lb-sum-row.heart b{color:#ff9fb8}
.lb-sum-val{font-variant-numeric:tabular-nums;color:#ffe9a8}
.lb-sum-note{font-style:italic;margin:.7em 0 1em;color:#cfd8f5;position:relative;z-index:1}
.lb-summary .lb-btn{position:relative;z-index:1}
.lb-stars i{position:absolute;width:.25em;height:.25em;border-radius:50%;background:#fff4c8;animation:lb-blink 3s ease-in-out infinite;box-shadow:0 0 .4em #fff4c8}
.lb-io{pointer-events:auto;padding:1em 1.4em;width:min(36em,94vw);display:flex;flex-direction:column;gap:.5em}
.lb-select,.lb-input,.lb-textarea{font:inherit;font-weight:700;color:var(--ink);background:#fffdf6;border:.14em solid var(--brown2);border-radius:.6em;padding:.3em .6em;pointer-events:auto;user-select:text;-webkit-user-select:text}
.lb-textarea{resize:vertical;font-family:ui-monospace,Menlo,monospace;font-size:.8em;min-height:6em}
.lb-select:focus,.lb-input:focus,.lb-textarea:focus{outline:none;border-color:var(--sun);box-shadow:0 0 0 .2em rgba(244,197,66,.6)}
.lb-io-btns{display:flex;gap:.6em;justify-content:center}
.lb-io-status.err{color:#b03a5a}
.lb-shop{pointer-events:auto;width:min(60em,96vw);height:min(35em,92vh);display:flex;flex-direction:column;padding:.6em .9em .5em;position:relative}
.lb-shop-head{display:flex;align-items:center;gap:1em;justify-content:space-between;padding-right:2.2em}
.lb-shop-head .lb-modal-title{margin:0;text-align:left}
.lb-shop-head .lb-modal-title::after{margin-left:0}
.lb-shop-coins{position:relative;display:flex;align-items:center;gap:.4em;padding:.2em .9em .2em .5em;border-radius:2em;background:#fff0c0;border:.14em solid #d9a21e;font-weight:900;font-size:1.1em;min-width:6em}
.lb-shop-coins .lb-delta{position:absolute;right:.4em;top:100%;font-weight:900;color:#3f8a2e;animation:lb-float 1.6s ease-out forwards}
.lb-shop-coins .lb-delta.neg{color:#c0405a}
.lb-shop-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:.8em;margin-top:.4em}
.lb-shop-left{display:flex;flex-direction:column;gap:.5em;min-height:0}
.lb-shop-keeper{display:flex;gap:.8em;align-items:center}
.lb-shop-keeper .lb-pthumb.big{width:6.5em;height:8em;flex:none}
.lb-shop-greet{position:relative;flex:1;background:#fffdf6;border:.13em solid var(--brown2);border-radius:.9em;padding:.5em .8em;font-weight:700;font-size:.92em;line-height:1.35}
.lb-shop-greet::before{content:'';position:absolute;left:-.5em;top:1.2em;width:.8em;height:.8em;background:#fffdf6;border-left:.13em solid var(--brown2);border-bottom:.13em solid var(--brown2);transform:rotate(45deg)}
.lb-shop-detail{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;background:linear-gradient(180deg,#fffaf0,#fcecc8);border:.14em solid var(--brown2);border-radius:.8em;padding:.7em;display:flex;flex-direction:column;gap:.5em}
.lb-shop-desc{margin:0;font-weight:600;line-height:1.4}
.lb-shop-list{display:flex;flex-direction:column;gap:.25em;min-height:0;padding-right:.3em}
.lb-shop-row{display:flex;align-items:center;gap:.6em;padding:.25em .7em .25em .4em;border-radius:.8em;border:.13em solid #e0c898;background:rgba(255,250,236,.8);cursor:pointer;flex:none;pointer-events:auto}
.lb-shop-row:hover{background:rgba(244,197,66,.2)}
.lb-shop-row.is-sel{background:rgba(244,197,66,.42);border-color:var(--sun)}
.lb-shop-row.poor .lb-shop-price{color:#c0405a}
.lb-shop-row.soldout{opacity:.5}
.lb-shop-ico{width:2.6em;height:2.6em;flex:none}
.lb-shop-name{flex:1;display:flex;flex-direction:column;line-height:1.15}
.lb-shop-price{font-weight:900;display:flex;align-items:center;gap:.25em}
.lb-shop-empty{padding:1em;text-align:center}
.lb-stepper{display:flex;align-items:center;gap:.5em;flex-wrap:wrap}
.lb-qty-n{min-width:2.6em;text-align:center;font-size:1.2em}
.lb-shop-total{margin-left:auto;font-weight:700}
.lb-shop-total.poor b{color:#c0405a}
.lb-shop .lb-menu-close{top:.5em}
`;
