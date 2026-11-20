# UI toolkit API (`src/ui/**`, task T2, built by the lead)

`import { UICanvas, DialogueBox, ... } from '../ui/index.js'`. Pure canvas-2D at 320x240, integer coordinates. All modules import in
Node (drawing functions need a canvas context; metrics, wrapping and widget logic do not). No engine/art/audio imports: they are injected.

## The `ui` service
```js
const ui = new UICanvas();                 // canvas 320x240 + ctx; engine loop: ui.beginFrame() -> scenes draw into ui.ctx -> ui.endFrame()
ui.configure({ drawIcon, getPortraitSheet, sfx });   // injected services (all optional; placeholders/silence otherwise)
//   drawIcon(ctx, name, x, y)            -> art.drawIcon      (ICON_NAMES)
//   getPortraitSheet(who) -> {canvas,...PORTRAIT_SHEET} | null   -> art.getPortraitSheet(who, outfit)
//   sfx(name)                            -> audio.sfx  ('cursor','confirm','cancel','error','blip','blip_low','page')
ui.services.settings = { textSpeed: 'slow'|'normal'|'fast', keyHints: true }   // shared; DialogueBox reads textSpeed every frame
createApp({ container }); Object.assign(app.game, { ui });   // the engine uploads ui.canvas unless ui.dirty === false
```
Scenes draw in `draw(ui)`: use `ui.ctx` (`const ctx = ui.ctx`) and the widget `draw(ctx)` methods. Every widget gets `services: game.ui.services`.

## Widgets (all: `update(dt, input)`, `draw(ctx)`, `done`, `result`)
`input` = engine Input (`pressed(a)`, `repeat(a)`, `down(a)`; actions up/down/left/right/confirm/cancel/fast/skip). Stack discipline: a scene keeps
the active widget(s), calls `update` on the top one, `draw` on all, and reads `result` when `done` becomes true.

| widget | constructor options | result |
|---|---|---|
| `DialogueBox` | `{services, who, name, face, text, style:'normal'\|'think'\|'narrate', speed?}` | `true` |
| `ChoiceBox` | `{services, options:['text'\|{text,disabled}], cursor, cancellable:false, title?}` | index (`-1` on cancel if cancellable) |
| `ConfirmBox` | `{services, message, yes, no, defaultYes}` | `true`/`false` |
| `NumberPicker` | `{services, label, min, max, value, step, unitPrice?}` | number or `null` |
| `ListMenu` | `{services, items:[{label,value?,icon?,disabled?,desc?,color?}], x,y,w,rows,title,style:'menu'\|'parchment',cursor,cancellable,descBox,onCursor(i,item),footer}` | `{index,item}` or `null`; `setItems(items)` |
| `GridMenu` | `{services, items:[{label,icon,qty?,desc?,disabled?}], x,y,cols,rows,cell,title,style,descBox,onCursor}` | `{index,item}` or `null` |
| `TabBar` | `{services, labels, index, x,y,w,style,onChange(i)}` | never done; left/right change `index` |
| `CalendarGrid` | `{services, season, year, today, data:{[day]:{festival?,exam?,breakDay?,birthdays?}}, selectable, x,y, detail?(day)->lines}` | day number or `null` |
| `HUD` | `{services}`; `setData({season,day,weekday,minute,weather,money,energy,maxEnergy,festival?})`, `showLocation(name)`, `visible` | never done |
| `ToastStack` | `{services}`; `push({text, icon?, ttl?, color?})` | never done |
| `Banner` | `{services, text, sub?, ms, fullDim}` full-screen title card | `true` (confirm skips after 0.5 s) |
| `TextPage` | `{services, lines:[{text, style:'title'\|'head'\|'text'\|'blank', color?}], speed}` auto-scrolling credits/notes (confirm = faster, cancel = skip) | `true` |

DialogueBox details: box at (6,164) 308x70; 48x48 portrait at the left (blink row every 2.4-5.4 s, talk-mouth row alternates 0.12 s while typing), name tab above,
word-wrapped colour-markup text, 3 lines per page, typewriter with punctuation pauses, `blip` sfx every 3rd letter, confirm = finish typing then turn page, hold
`fast`/`skip` = 4x speed, bouncing ▼ prompt. `who:'unknown'` shows a placeholder silhouette (name '???'); `style:'narrate'` has no portrait/name; `think` tints the text blue.
Pass `face` from `EXPRESSIONS`. `isTyping()`, `skipToEnd()`, `page`, `pages`.

Functions (draw directly): `drawWindow(ctx,x,y,w,h,style)` (styles `dialogue|menu|parchment|hud|tooltip|dim`), `drawTab`, `drawBar(ctx,x,y,w,h,value,max,{fill,back,border,segments})`,
`drawHeart/drawHeartsRow(ctx,x,y,{hearts|points})` (self-drawn pixel hearts, 8 px each, half hearts from `points`), `drawCursor`, `drawPrompt`, `drawIconSafe`,
`drawTable(ctx,{x,y,columns:[{key,label,w,align}],rows,footer,style,title})` (report card), `drawStatBars(ctx,x,y,[{label,value,max?,color?,text?}],{w,labelW,style})`.
`THEME` has the palette (navy, cream, parchment, wood, gold, ...). Windows: dark navy/cream border for in-world UI, parchment for status/records screens, `hud` cream panels.

## Text (`font.js`)
Original proportional pixel font: 5-wide glyphs, 7-row capitals, descenders, `$ ♥ ▼ ► ◄ ▲ ★ ♪ ✓ × •` and ASCII. `drawText(ctx, text, x, y, {color, shadow, align:'left'|'center'|'right', scale, alpha, outline, maxChars})`,
`measureText(text)`, `wrapText(text, maxWidth) -> lines` (colour state carried across breaks; long words split), `drawLines`, `stripMarkup`, `visibleLength`, `LINE_H = 10`.
Markup: `{y}` gold `{r}` red `{g}` green `{b}` blue `{p}` pink `{k}` grey `{w}` white `{c}` cyan, `{#rrggbb}`, `{/}` reset; `\n` breaks lines. Accented letters are not in the font.

## Harness and tests
`node scripts/build.mjs --entry src/dev/ui_demo.js --out dist/dev/ui_demo.html` then open `?widget=dialogue|choice|list|grid|hud|calendar|table|banner|text|all`
(or `node scripts/shot.mjs ... --script`). `window.__uiDemo.step(n, ['confirm'])` drives it. The harness uses mock portraits/icons. Tests: `test/ui/*.test.mjs` (24 cases).

## Gotchas
- Widgets are not scenes: the owning scene decides when to draw them. Keep at most one input-taking widget active; non-interactive ones (HUD, ToastStack) are updated every frame.
- `ListMenu`/`GridMenu` do not draw their own backdrop dimming: draw `drawWindow(ctx,0,0,320,240,'dim')` first when covering the world.
- The dialogue box and HUD share screen space (HUD energy bar bottom-left is hidden behind the box): set `hud.visible=false` during scripted scenes.
- Never create canvases per frame; glyph atlases are cached per colour.
