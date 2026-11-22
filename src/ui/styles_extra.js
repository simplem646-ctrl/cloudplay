// CSS part 3: title screen, new game / continue, mini-games, touch overlay.
export const EXTRA_CSS = `
.lb-title{position:absolute;inset:0;pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2em;
  background:radial-gradient(ellipse at 50% 42%,rgba(255,236,180,.18),rgba(30,20,40,0) 45%),radial-gradient(ellipse at center,rgba(20,14,34,0) 35%,rgba(26,18,40,.72) 100%),linear-gradient(180deg,rgba(24,28,60,.35),rgba(24,18,30,0) 40%,rgba(24,18,30,.35));z-index:3}
.lb-logo{display:flex;flex-direction:column;align-items:center;gap:.1em;animation:lb-pop .7s cubic-bezier(.2,1.3,.4,1)}
.lb-logo-lamp{width:6.5em;height:6.5em;animation:lb-glow 2.8s ease-in-out infinite,lb-bob 4s ease-in-out infinite}
.lb-logo-lamp svg{width:100%;height:100%}
.lb-wordmark{display:flex;flex-direction:column;align-items:center;line-height:.95;font-family:Fredoka,Nunito,system-ui,sans-serif;font-weight:600;font-size:4.4em;color:#fff4dc;
  text-shadow:0 .04em 0 #c79a6b,0 .08em 0 #8a5a3a,0 .12em 0 #5a3d2b,0 .2em .3em rgba(0,0,0,.5),0 0 .6em rgba(255,214,110,.55);letter-spacing:.02em}
.lb-wm-days{font-size:.62em;color:#ffd978;letter-spacing:.35em;margin-top:.08em;padding-left:.35em}
.lb-logo-sub{margin-top:.9em;font-weight:800;color:#ffe9c4;text-shadow:0 .08em .2em rgba(0,0,0,.6);letter-spacing:.14em;font-size:1em;text-transform:lowercase}
.lb-spark i{position:absolute;width:.3em;height:.3em;border-radius:50%;background:#ffe9a0;box-shadow:0 0 .8em .2em rgba(255,226,140,.9);animation:lb-blink 3.2s ease-in-out infinite;pointer-events:none}
.lb-title-stage{display:flex;justify-content:center;min-height:11em;align-items:flex-start;max-width:100%}
.lb-press{font-weight:900;font-size:1.5em;color:#fff4dc;text-shadow:0 .08em .3em rgba(0,0,0,.6);letter-spacing:.12em;text-transform:uppercase;animation:lb-blink 1.6s ease-in-out infinite;margin-top:1.2em;background:rgba(40,28,40,.5);padding:.2em 1.2em;border-radius:2em}
.lb-title-menu{display:flex;flex-direction:column;gap:.55em;min-width:15em}
.lb-title-btn{font-size:1.35em;font-family:Fredoka,Nunito,sans-serif;padding:.3em 1em}
.lb-newgame{pointer-events:auto;display:flex;gap:1.4em;padding:1.1em 1.6em;align-items:center;max-width:94vw}
.lb-ng-avatar{background:linear-gradient(180deg,#cfeaff,#fdf0cf);border-radius:1em;border:.14em solid var(--brown2);padding:.4em;flex:none}
.lb-avatar{display:block;width:10.5em;height:13em}
.lb-ng-form{display:flex;flex-direction:column;gap:.5em;min-width:19em}
.lb-ng-form .lb-modal-title{text-align:left;margin:0}
.lb-ng-form .lb-modal-title::after{margin-left:0}
.namerow .lb-input{flex:1;min-width:7em;font-size:1.1em}
.lb-err{color:#b03a5a;font-weight:800;font-size:.85em;min-height:1.2em}
.lb-pal{display:flex;flex-direction:column;gap:.3em}
.lb-palrow{display:flex;align-items:center;gap:.7em;padding:.2em .6em;border-radius:.8em;border:.13em solid transparent;background:rgba(255,250,236,.6)}
.lb-palrow.is-sel,.namerow.is-sel,.lb-set-row.namerow.is-sel{border-color:var(--sun);background:rgba(244,197,66,.28)}
.lb-swatches{display:flex;gap:.35em}
.lb-sw{width:1.9em;height:1.9em;border-radius:50%;border:.14em solid rgba(74,52,38,.8);box-shadow:inset 0 .15em .2em rgba(255,255,255,.4),0 .1em .2em rgba(0,0,0,.25);pointer-events:auto;transition:transform .12s}
.lb-sw:hover{transform:scale(1.12)}
.lb-sw.on{box-shadow:0 0 0 .18em #fff,0 0 0 .34em var(--sun);transform:scale(1.1)}
.lb-ng-btns{display:flex;gap:.6em;justify-content:flex-end;margin-top:.3em}
.lb-start.is-sel{outline:none}
.lb-start.is-sel,.lb-start:focus-visible{box-shadow:0 .22em 0 rgba(40,90,30,.5),0 0 0 .2em rgba(244,197,66,.85)}
.lb-continue{pointer-events:auto;padding:1em 1.3em;width:min(44em,94vw)}
.lb-cont-list{display:flex;flex-direction:column;gap:.45em;margin:.4em 0}
.lb-card{display:flex;align-items:center;gap:.8em;padding:.45em .8em;border-radius:.9em;border:.14em solid #d9bd86;background:linear-gradient(180deg,#fffaf0,#f8e8c4)}
.lb-card.is-sel{border-color:var(--sun);box-shadow:0 0 0 .18em rgba(244,197,66,.6)}
.lb-card.empty{opacity:.6;background:rgba(199,154,107,.16)}
.lb-card-slot{width:2.3em;height:2.3em;border-radius:50%;background:var(--leaf);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Fredoka,sans-serif;font-weight:600;font-size:1.1em;flex:none;text-shadow:0 .06em 0 rgba(40,90,30,.5)}
.lb-card.empty .lb-card-slot{background:#c9b392}
.lb-card-info{flex:1;display:flex;flex-direction:column;min-width:0;line-height:1.25;font-size:.92em}
.lb-card-info b{font-size:1.1em}
.lb-card-btns{display:flex;gap:.3em;flex:none}
.lb-options{pointer-events:auto;width:min(56em,96vw);max-height:92vh;display:flex;flex-direction:column;padding:.8em 1em .5em}
.lb-options .lb-tab-settings{flex:1;min-height:0}
/* fishing */
.lb-fishing{pointer-events:auto;padding:.8em 1.4em 1em;width:min(34em,94vw);position:relative}
.lb-fish-stage{display:flex;gap:1.1em;align-items:stretch;height:min(21em,60vh)}
.lb-water{position:relative;width:6em;border-radius:1em;border:.18em solid #3a7aa8;overflow:hidden;background:linear-gradient(180deg,#bfe9ff 0,#6fc0e8 12%,#3f9ad0 55%,#2a6fa8 100%);box-shadow:inset 0 0 1.2em rgba(20,60,110,.45)}
.lb-water::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.08) 0 .35em,transparent .35em .9em);animation:lb-ripple 3s linear infinite}
@keyframes lb-ripple{to{background-position:0 .9em}}
.lb-zone{position:absolute;left:.3em;right:.3em;border-radius:.7em;background:linear-gradient(90deg,rgba(150,240,120,.55),rgba(110,220,100,.75));border:.15em solid rgba(60,160,60,.85);transition:background .15s}
.lb-zone.on{background:linear-gradient(90deg,rgba(170,255,130,.8),rgba(120,235,100,.95));box-shadow:0 0 1em rgba(140,255,120,.8)}
.lb-fish{position:absolute;left:50%;margin-left:-1.6em;width:3.2em;height:3.2em;transition:none;filter:drop-shadow(0 .1em .15em rgba(0,0,0,.35))}
.lb-fish.caught{animation:lb-bump .5s ease-out}
.lb-bobber{position:absolute;left:50%;top:.2em;width:1.1em;height:1.1em;border-radius:50%;background:linear-gradient(180deg,#fff 0 48%,#e0607e 52%);border:.12em solid #5a3d2b;z-index:3}
.lb-bobber i{position:absolute;left:50%;top:100%;width:.1em;height:5em;background:rgba(255,255,255,.5)}
.lb-bubbles i{position:absolute;bottom:-1em;width:.5em;height:.5em;border-radius:50%;border:.1em solid rgba(255,255,255,.7);animation:lb-rise 4s linear infinite}
.lb-bubbles i:nth-child(1){left:20%}.lb-bubbles i:nth-child(2){left:62%;animation-delay:1.3s}.lb-bubbles i:nth-child(3){left:42%;animation-delay:2.6s}
@keyframes lb-rise{to{transform:translateY(-22em);opacity:0}}
.lb-meter{width:1.4em;border-radius:1em;border:.15em solid var(--brown);background:#d9c3a0;position:relative;overflow:hidden;box-shadow:inset 0 .12em .25em rgba(60,35,20,.3)}
.lb-meter i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#f0a93a,#ffd978);transition:height .08s linear}
.lb-meter.hot i{background:linear-gradient(0deg,#6fb85a,#a5e48d)}
.lb-fish-side{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.6em;text-align:center}
.lb-mg-msg{font-weight:800;font-size:1.1em;line-height:1.3}
.lb-mg-msg.big{font-family:Fredoka,sans-serif;font-size:1.5em;color:var(--berry)}
.lb-mg-time{font-family:Fredoka,sans-serif;font-size:2.4em;color:var(--ink2)}
.lb-mg-fx{position:absolute;left:1.4em;top:4em;width:6em;height:min(21em,60vh);pointer-events:none}
.lb-splash{position:absolute;top:30%;width:.7em;height:.7em;border-radius:50%;background:#bfe9ff;border:.1em solid #fff;animation:lb-splash .8s ease-out forwards}
@keyframes lb-splash{0%{transform:translate(0,0) scale(1)}100%{transform:translate(var(--dx),-5em) scale(.3);opacity:0}}
/* kneading */
.lb-kneading{pointer-events:auto;padding:.8em 1.6em 1em;width:min(36em,94vw);display:flex;flex-direction:column;align-items:center;gap:.6em}
.lb-dough-wrap{position:relative;height:7.5em;width:100%;display:flex;align-items:flex-end;justify-content:center}
.lb-dough{position:relative;width:8em;height:5em;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff7e4,#f5dcae 60%,#e6c488);border:.18em solid #b88a55;box-shadow:inset 0 -.5em .7em rgba(160,110,60,.3),0 .4em .6em rgba(60,35,20,.25);transform-origin:50% 100%}
.lb-dough .e1,.lb-dough .e2{position:absolute;top:38%;width:.6em;height:.9em;border-radius:50%;background:#4a3426}
.lb-dough .e1{left:30%}.lb-dough .e2{right:30%}
.lb-dough .mouth{position:absolute;left:50%;top:60%;width:1.2em;height:.6em;margin-left:-.6em;border-bottom:.18em solid #4a3426;border-radius:0 0 1em 1em}
.lb-dough.squish{animation:lb-squish .38s ease-out}
@keyframes lb-squish{0%{transform:scale(1)}25%{transform:scale(1.35,.55)}60%{transform:scale(.9,1.15)}100%{transform:scale(1)}}
.lb-feedback{position:absolute;top:0;left:50%;transform:translateX(-50%);font-family:Fredoka,sans-serif;font-weight:600;font-size:1.8em;opacity:0;white-space:nowrap;text-shadow:0 .06em 0 #fff}
.lb-feedback.show{animation:lb-fb .9s ease-out forwards}
.lb-feedback.final{animation:none;opacity:1;color:var(--berry)}
.lb-feedback.great{color:#e8a01e}.lb-feedback.good{color:#4f9a38}.lb-feedback.okay{color:#4a8bb8}.lb-feedback.miss{color:#a8523f}
@keyframes lb-fb{0%{opacity:0;transform:translate(-50%,.6em) scale(.7)}20%{opacity:1;transform:translate(-50%,0) scale(1.15)}100%{opacity:0;transform:translate(-50%,-.8em)}}
.lb-ktrack{position:relative;width:100%;height:2.4em;border-radius:1.2em;background:linear-gradient(180deg,#d9c3a0,#ecd9b4);border:.16em solid var(--brown);box-shadow:inset 0 .15em .3em rgba(60,35,20,.3);overflow:visible}
.lb-sweet{position:absolute;top:.2em;bottom:.2em;border-radius:1em;background:linear-gradient(180deg,#a5e48d,#6fb85a);border:.12em solid #4f8a3c;transition:left .25s,width .25s;box-shadow:0 0 .8em rgba(120,230,100,.7)}
.lb-marker{position:absolute;top:-.5em;bottom:-.5em;width:.7em;margin-left:-.35em;border-radius:.5em;background:linear-gradient(180deg,#ff9aa8,#e0607e);border:.13em solid #a8405a;box-shadow:0 .1em .3em rgba(0,0,0,.35)}
.lb-rdots{display:flex;gap:.5em}
.lb-rdot{width:1.1em;height:1.1em;border-radius:50%;background:#d9c3a0;border:.13em solid var(--brown)}
.lb-rdot.great{background:#f4c542}.lb-rdot.good{background:#6fb85a}.lb-rdot.okay{background:#6fb7e8}.lb-rdot.miss{background:#c9b392}
.lb-knead-btn{font-size:1.2em;padding:.3em 2em}
/* touch */
.lb-touch{position:absolute;inset:0;pointer-events:none;display:none;z-index:6}
.lb-touch.on{display:block}
.lb-stick{position:absolute;left:1.2em;bottom:4.4em;width:8em;height:8em;border-radius:50%;background:radial-gradient(circle,rgba(255,244,220,.28),rgba(255,244,220,.12));border:.18em solid rgba(255,244,220,.65);pointer-events:auto;touch-action:none}
.lb-knob{position:absolute;left:50%;top:50%;width:3.6em;height:3.6em;margin:-1.8em 0 0 -1.8em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fffaf0,#e8cd98);border:.16em solid #8a5a3a;box-shadow:0 .2em .5em rgba(0,0,0,.3);transition:transform .05s}
.lb-tbtns{position:absolute;right:1.2em;bottom:1.2em;width:11em;height:9em}
.lb-tbtn{position:absolute;border-radius:50%;border:.18em solid #8a5a3a;background:radial-gradient(circle at 35% 30%,#fffaf0,#f0d9a6);font-family:Fredoka,sans-serif;font-weight:600;color:var(--ink);box-shadow:0 .25em .5em rgba(0,0,0,.3);pointer-events:auto;touch-action:none;opacity:.88}
.lb-tbtn.down{transform:scale(.92);background:radial-gradient(circle at 35% 30%,#fff3b8,#f4c542)}
.lb-tbtn.a{width:5em;height:5em;right:0;bottom:2.2em;font-size:1.5em}
.lb-tbtn.b{width:4em;height:4em;right:5.6em;bottom:0;font-size:1.3em}
.lb-tbtn.run{width:3.2em;height:3.2em;right:6.2em;bottom:4.9em;font-size:.9em}
.lb-tbtn.menu{position:absolute;right:.8em;top:4.6em;width:2.6em;height:2.6em;font-size:1.2em;line-height:1}
`;
