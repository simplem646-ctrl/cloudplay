// All UI CSS lives here as one template string, injected as a single <style> by init().
// Every class is prefixed lb-; everything is sized in em off the root font-size.

const BASE = `
.lb-root{--parch:#fff4dc;--parch2:#f7e6c4;--brown:#8a5a3a;--brown2:#c79a6b;--ink:#4a3426;--ink2:#7a5c48;--leaf:#6fb85a;--sky:#6fb7e8;--berry:#e0607e;--sun:#f4c542;--night:#2b3a67;
  position:absolute;inset:0;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none;
  font:600 1em/1.35 Nunito,system-ui,'Segoe UI',Roboto,sans-serif;font-size:clamp(11px,2.1vh,22px);color:var(--ink);z-index:5}
.lb-root *{box-sizing:border-box}
.lb-root button{font:inherit;color:inherit;cursor:pointer}
.lb-head,.lb-root h1,.lb-root h2,.lb-root h3{font-family:Fredoka,Nunito,system-ui,sans-serif;font-weight:600;margin:0}
.lb-layer{position:absolute;inset:0}
.lb-panel{background:radial-gradient(rgba(138,90,58,.06) .08em,transparent .12em) 0 0/.5em .5em,linear-gradient(180deg,#fff9ea,#fdeecb);
  border:.2em solid var(--brown);border-radius:.9em;
  box-shadow:0 .2em 0 rgba(112,70,40,.35),0 .8em 1.6em rgba(50,30,20,.3),inset 0 0 0 .16em #fff4dc,inset 0 0 0 .22em rgba(138,90,58,.3)}
.lb-panel.dark{background:linear-gradient(180deg,#34447a,#232f57);color:#fdf1d2;border-color:#7e6a9a;
  box-shadow:0 .8em 1.6em rgba(10,10,30,.5),inset 0 0 0 .16em rgba(255,244,220,.25)}
.lb-btn{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;gap:.4em;padding:.35em 1em;min-height:2em;
  background:linear-gradient(180deg,#fffaf0,#f6e3bd);border:.15em solid var(--brown);border-radius:.8em;
  box-shadow:0 .15em 0 rgba(112,70,40,.45);font-weight:700;transition:transform .12s,background .15s,box-shadow .12s;text-align:center}
.lb-btn:hover,.lb-btn.is-sel{background:linear-gradient(180deg,#fffbe0,#ffe9a0);transform:translateY(-.06em);box-shadow:0 .22em 0 rgba(112,70,40,.45),0 0 0 .18em rgba(244,197,66,.65)}
.lb-btn:active{transform:translateY(.1em);box-shadow:0 .05em 0 rgba(112,70,40,.45)}
.lb-btn.primary{background:linear-gradient(180deg,#9bd884,#6fb85a);color:#fff;text-shadow:0 .08em 0 rgba(40,90,30,.5);border-color:#4f8a3c}
.lb-btn.primary:hover,.lb-btn.primary.is-sel{background:linear-gradient(180deg,#b0e69a,#7cc866)}
.lb-btn.danger{background:linear-gradient(180deg,#f58aa0,#e0607e);color:#fff;border-color:#a8405a}
.lb-btn.is-disabled,.lb-btn:disabled{opacity:.5;filter:grayscale(.5);cursor:not-allowed}
.lb-btn.small{padding:.15em .6em;min-height:1.6em;font-size:.88em}
.lb-scrim{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(40,24,18,.35),rgba(30,18,14,.62));display:flex;align-items:center;justify-content:center;pointer-events:auto;animation:lb-fadein .18s ease-out}
.lb-scrim.light{background:radial-gradient(ellipse at center,rgba(40,24,18,.15),rgba(30,18,14,.45))}
.lb-pop{animation:lb-pop .26s cubic-bezier(.2,1.4,.4,1)}
.lb-bump{animation:lb-bump .3s ease-out}
.lb-muted{color:var(--ink2);font-weight:600}
.lb-kbd{display:inline-block;padding:0 .4em;border:.1em solid var(--brown2);border-bottom-width:.2em;border-radius:.35em;background:#fffaf0;font-size:.82em;font-weight:800;color:var(--ink2)}
.lb-icon-cvs{display:block;width:100%!important;height:100%!important}
.lb-in-dlg .lb-energy,.lb-in-dlg .lb-prompt{opacity:0;pointer-events:none}
.lb-scroll{overflow:auto;scrollbar-width:thin;scrollbar-color:var(--brown2) transparent}
@keyframes lb-fadein{from{opacity:0}to{opacity:1}}
@keyframes lb-pop{from{opacity:0;transform:scale(.88) translateY(.6em)}to{opacity:1;transform:none}}
@keyframes lb-bump{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
@keyframes lb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-.25em)}}
@keyframes lb-blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes lb-flame{0%,100%{transform:scale(1) rotate(-2deg)}50%{transform:scale(1.06,1.1) rotate(2deg)}}
@keyframes lb-glow{0%,100%{filter:drop-shadow(0 0 .35em rgba(255,200,80,.8))}50%{filter:drop-shadow(0 0 .8em rgba(255,214,110,1))}}
@keyframes lb-slidein{from{opacity:0;transform:translateY(-1em) scale(.92)}to{opacity:1;transform:none}}
@keyframes lb-float{0%{opacity:0;transform:translateY(.4em)}20%{opacity:1}100%{opacity:0;transform:translateY(-1.8em)}}
@keyframes lb-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-.25em)}75%{transform:translateX(.25em)}}
@media (prefers-reduced-motion:reduce){.lb-root *{animation-duration:.01s!important;transition-duration:.01s!important}}
`;

const HUD = `
.lb-hud{position:absolute;inset:0;pointer-events:none;transition:opacity .25s}
.lb-hud.is-hidden{opacity:0}
.lb-clock{position:absolute;left:.8em;top:.8em;display:flex;align-items:center;gap:.6em;padding:.45em .9em .45em .55em;background:rgba(255,244,220,.88);border-radius:1em;min-width:11em}
.lb-clock .lb-emblem{width:2.7em;height:2.7em;flex:none}
.lb-clock .lb-cdate{font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:1.02em;line-height:1.1}
.lb-clock .lb-ctime{font-weight:800;font-size:1.25em;line-height:1.1;display:flex;align-items:center;gap:.3em}
.lb-emblem{width:2.7em;height:2.7em;flex:none}
.lb-emblem svg,.lb-wx svg,.lb-moon svg{width:100%;height:100%;display:block}
.lb-clock .lb-wx{width:1.5em;height:1.5em;flex:none;margin-left:auto}
.lb-clock .lb-moon{width:1.1em;height:1.1em;opacity:0;transition:opacity .5s}
.lb-clock .lb-moon.on{opacity:1}
.lb-questline{position:absolute;left:.8em;top:5.6em;max-width:min(22em,44vw);padding:.3em .8em .3em .6em;background:rgba(255,244,220,.8);border:.14em solid rgba(138,90,58,.7);border-radius:.8em;font-size:.88em;display:flex;gap:.5em;align-items:center;box-shadow:0 .3em .6em rgba(50,30,20,.2)}
.lb-questline svg{width:1.3em;height:1.3em;flex:none}
.lb-questline b{display:block;font-size:.85em;color:var(--ink2);line-height:1.1}
.lb-questline span{display:block;line-height:1.2}
.lb-questline[hidden]{display:none}
.lb-coins{position:absolute;right:.8em;top:.8em;padding:.35em .9em .35em .5em;display:flex;align-items:center;gap:.5em;background:rgba(255,244,220,.88);border-radius:1em;font-weight:800;font-size:1.2em;min-width:5.5em}
.lb-coins svg{width:1.6em;height:1.6em;flex:none}
.lb-coins .lb-delta{position:absolute;right:.5em;top:100%;font-size:.8em;font-weight:800;color:#3f8a2e;text-shadow:0 .05em 0 #fff;animation:lb-float 1.6s ease-out forwards;pointer-events:none}
.lb-coins .lb-delta.neg{color:#c0405a}
.lb-energy{position:absolute;left:.8em;bottom:.8em;display:flex;align-items:center;gap:.5em;padding:.35em .9em .35em .5em;background:rgba(255,244,220,.88);border-radius:1em}
.lb-energy svg{width:1.8em;height:1.8em;flex:none;transform-origin:50% 90%;animation:lb-flame 1.6s ease-in-out infinite}
.lb-energy .lb-ebar{width:9em;height:1.05em;border-radius:1em;background:#d9c3a0;border:.14em solid var(--brown);overflow:hidden;box-shadow:inset 0 .12em .2em rgba(60,35,20,.3)}
.lb-energy .lb-ebar i{display:block;height:100%;width:100%;border-radius:1em;background:linear-gradient(180deg,#a5e48d,#6fb85a);transition:width .4s,background .4s}
.lb-energy.mid .lb-ebar i{background:linear-gradient(180deg,#ffd978,#f0a93a)}
.lb-energy.low .lb-ebar i{background:linear-gradient(180deg,#ff9aa8,#e0607e)}
.lb-energy.low svg{animation-duration:.7s}
.lb-energy .lb-enum{font-size:.85em;font-weight:800;min-width:2.2em;text-align:right}
.lb-prompt{position:absolute;left:50%;bottom:3.2em;transform:translate(-50%,.5em);padding:.35em 1.1em;background:rgba(74,52,38,.88);color:#fff4dc;border-radius:2em;border:.14em solid #f4c542;font-weight:800;opacity:0;transition:opacity .2s,transform .2s;white-space:nowrap;box-shadow:0 .3em .8em rgba(0,0,0,.3)}
.lb-prompt.on{opacity:1;transform:translate(-50%,0)}
.lb-toasts{position:absolute;left:50%;top:.8em;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.4em;pointer-events:none;width:min(30em,90vw)}
.lb-toast{display:flex;align-items:center;gap:.6em;padding:.35em 1em .35em .5em;background:linear-gradient(180deg,#fffaf0,#fbe9c4);border:.16em solid var(--brown);border-radius:2em;box-shadow:0 .25em .7em rgba(50,30,20,.3);animation:lb-slidein .28s cubic-bezier(.2,1.4,.4,1);transition:opacity .4s,transform .4s;font-weight:700;max-width:100%}
.lb-toast.out{opacity:0;transform:translateY(-.8em)}
.lb-toast .lb-ticon{width:1.9em;height:1.9em;flex:none;border-radius:50%;background:#fff;border:.12em solid var(--brown2);display:flex;align-items:center;justify-content:center;font-size:1em;overflow:hidden}
.lb-toast .lb-ticon canvas{width:1.7em;height:1.7em}
.lb-toast.k-quest{border-color:#4f8a3c;background:linear-gradient(180deg,#f4ffe8,#d9f0c4)}
.lb-toast.k-heart{border-color:#c0405a;background:linear-gradient(180deg,#fff0f3,#ffd6df)}
.lb-toast.k-warn{border-color:#c07a2a;background:linear-gradient(180deg,#fff6e0,#ffe0a8)}
.lb-toast.k-item{border-color:#4a8bb8;background:linear-gradient(180deg,#f2faff,#d6ecfb)}
.lb-banner{position:absolute;left:0;right:0;top:32%;text-align:center;pointer-events:none;opacity:0}
.lb-banner.on{animation:lb-banner 3s ease-in-out forwards}
.lb-banner .lb-bt{display:inline-block;padding:.25em 1.6em .3em;font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:3em;color:#fff4dc;text-shadow:0 .06em 0 #8a5a3a,0 .12em .3em rgba(0,0,0,.45);letter-spacing:.04em;background:linear-gradient(90deg,transparent,rgba(74,52,38,.55) 18%,rgba(74,52,38,.55) 82%,transparent)}
.lb-banner .lb-bs{margin-top:.2em;font-weight:800;font-size:1.3em;color:#ffe9a8;text-shadow:0 .08em .2em rgba(0,0,0,.6);letter-spacing:.1em;text-transform:uppercase}
@keyframes lb-banner{0%{opacity:0;transform:translateY(-1em) scale(.9)}14%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0;transform:translateY(.6em)}}
.lb-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:50}
.lb-fade.block{pointer-events:auto}
.lb-letterbox i{position:absolute;left:0;right:0;height:11%;background:#120c0c;transition:transform .6s ease-in-out;z-index:40}
.lb-letterbox i:first-child{top:0;transform:translateY(-101%)}
.lb-letterbox i:last-child{bottom:0;transform:translateY(101%)}
.lb-letterbox.on i{transform:none}
.lb-rotate{position:absolute;left:50%;top:.6em;transform:translateX(-50%);padding:.3em 1em;border-radius:2em;background:rgba(74,52,38,.9);color:#fff4dc;font-size:.9em;display:none;z-index:60}
@media (orientation:portrait) and (max-width:700px){.lb-rotate{display:block}}
`;

const DIALOGUE = `
.lb-dlg{position:absolute;left:0;right:0;bottom:1.2em;display:flex;justify-content:center;pointer-events:none;padding:0 1em}
.lb-dlg[hidden]{display:none}
.lb-dlg-box{position:relative;pointer-events:auto;width:min(62em,100%);min-height:8.4em;padding:1.1em 1.6em 1.1em 1.6em;font-size:1.12em;animation:lb-pop .22s ease-out;cursor:pointer}
.lb-dlg-box.has-portrait{padding-left:11.6em}
.lb-dlg-name{position:absolute;top:-1.55em;left:2em;padding:.18em 1.1em .3em;font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:1.05em;background:linear-gradient(180deg,#9bd884,#6fb85a);color:#fff;text-shadow:0 .08em 0 rgba(40,90,30,.55);border:.18em solid #4f8a3c;border-bottom:none;border-radius:.8em .8em 0 0;box-shadow:0 -.1em .4em rgba(0,0,0,.15)}
.lb-dlg-box.has-portrait .lb-dlg-name{left:11.2em}
.lb-dlg-name[hidden]{display:none}
.lb-dlg-text{min-height:4.1em;font-size:1.06em;line-height:1.5;white-space:pre-wrap;font-weight:700}
.lb-dlg-text .hid{opacity:0}
.lb-dlg-more{position:absolute;right:1.4em;bottom:.7em;color:var(--berry);font-size:1.1em;animation:lb-blink 1s ease-in-out infinite;visibility:hidden}
.lb-dlg-more.on{visibility:visible}
.lb-dlg-portrait{position:absolute;left:1em;bottom:0;width:10.4em;height:13.5em;pointer-events:none;animation:lb-bob 3.2s ease-in-out infinite;transform-origin:50% 100%;z-index:2;overflow:visible}
.lb-dlg-portrait canvas{position:absolute;left:0;bottom:0;width:100%;height:100%;filter:drop-shadow(0 .15em .25em rgba(60,35,20,.35));transition:opacity .22s}
.lb-dlg-portrait canvas.fresh{animation:lb-fadein .22s ease-out}
.lb-dlg-portrait.right{left:auto;right:1em}
.lb-badge{position:absolute;left:.4em;top:.6em;width:8.4em;height:8.4em;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Fredoka,sans-serif;font-weight:600;font-size:4.4em;color:#fff;text-shadow:0 .06em 0 rgba(0,0,0,.25);border:.08em solid rgba(255,255,255,.8);box-shadow:inset 0 -.1em .2em rgba(0,0,0,.2),0 .1em .2em rgba(0,0,0,.25)}
.lb-dlg-box.has-badge{padding-left:9.4em}
.lb-dlg-box.has-badge .lb-dlg-name{left:8.8em}
.lb-dlg-portrait.is-badge{width:3.2em;height:3.2em;left:1.5em;bottom:auto;top:1.6em;animation:none}
.lb-dlg-portrait.is-badge .lb-badge{left:0;top:0;width:100%;height:100%;font-size:1.6em}
.lb-dlg-box.right.has-portrait{padding-left:1.6em;padding-right:11.6em}
.lb-dlg-opts{display:flex;flex-direction:column;gap:.35em;margin-top:.5em}
.lb-dlg-prompt{font-weight:700;margin-bottom:.1em}
.lb-opt{pointer-events:auto;text-align:left;display:flex;align-items:center;gap:.6em;padding:.35em .9em;border-radius:.7em;border:.13em solid transparent;background:rgba(138,90,58,.07);font-weight:700;cursor:pointer;transition:background .12s,transform .12s}
.lb-opt .lb-caret{width:1em;color:var(--berry);visibility:hidden;font-size:.95em}
.lb-opt:hover,.lb-opt.is-sel{background:rgba(244,197,66,.38);border-color:var(--sun);transform:translateX(.2em)}
.lb-opt.is-sel .lb-caret,.lb-opt:hover .lb-caret{visibility:visible}
.lb-opt.is-disabled{opacity:.5;cursor:not-allowed}
.lb-opt.is-disabled:hover{transform:none;background:rgba(138,90,58,.07);border-color:transparent}
.lb-opt .lb-hint{margin-left:auto;font-size:.82em;font-style:italic;color:var(--ink2)}
.lb-narrate{position:absolute;left:0;right:0;bottom:26%;display:flex;justify-content:center;pointer-events:none;padding:0 1em}
.lb-narrate[hidden]{display:none}
.lb-narrate-box{pointer-events:auto;cursor:pointer;position:relative;width:min(44em,100%);padding:1em 2.2em 1.2em;text-align:center;font-style:italic;font-weight:700;font-size:1.25em;line-height:1.55;background:rgba(34,24,28,.78);color:#fff4dc;border:.14em solid rgba(255,230,160,.55);border-radius:1.2em;box-shadow:0 .6em 1.6em rgba(0,0,0,.45);animation:lb-pop .25s ease-out}
.lb-narrate-box .hid{opacity:0}
.lb-narrate-box .lb-dlg-more{color:#ffd978;right:1em}
`;

import { SCREENS_CSS } from './styles_screens.js';
import { EXTRA_CSS } from './styles_extra.js';

/** The complete stylesheet (injected as one <style> by init). */
export const getCss = () => [BASE, HUD, DIALOGUE, SCREENS_CSS, EXTRA_CSS].join('\n');
