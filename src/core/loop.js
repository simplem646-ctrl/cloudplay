/** requestAnimationFrame loop: dt clamped to 0.05 s, pauses when the tab is hidden, exposes fps. */
export const MAX_DT = 0.05;

/**
 * @param {(dt:number)=>void} frame called once per animation frame
 * @returns {{start():void, stop():void, readonly running:boolean, readonly fps:number, readonly frames:number}}
 */
export function createLoop(frame) {
  let rafId = 0;
  let running = false;
  let last = 0;
  let fps = 0;
  let frames = 0;
  let acc = 0;
  let accFrames = 0;

  const tick = (t) => {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    const raw = last ? (t - last) / 1000 : 0;
    last = t;
    const dt = Math.min(Math.max(raw, 0), MAX_DT);
    acc += raw;
    accFrames++;
    if (acc >= 0.5) {
      fps = accFrames / acc;
      acc = 0;
      accFrames = 0;
    }
    frames++;
    frame(dt);
  };
  const onVis = () => {
    if (document.hidden) pause();
    else if (running && !rafId) resume();
  };
  function pause() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function resume() {
    last = 0; // avoid a giant first dt after being hidden
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      document.addEventListener('visibilitychange', onVis);
      if (!document.hidden) resume();
    },
    stop() {
      running = false;
      pause();
      document.removeEventListener('visibilitychange', onVis);
    },
    get running() { return running; },
    get fps() { return fps; },
    get frames() { return frames; },
  };
}
