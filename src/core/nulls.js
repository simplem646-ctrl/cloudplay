/** No-op adapters implementing the full audio / portraits API (Game defaults until real modules are wired in). */

export const nullAudio = {
  init() {},
  unlock() {},
  playMusic() {},
  stopMusic() {},
  playSfx() {},
  blip() {},
  footstep() {},
  setAmbience() {},
  setVolume() {},
  setMuted() {},
  duckMusic() {},
  tracks: [],
  sfxList: [],
  stats() {
    return { state: 'null', playing: [] };
  },
};

export const nullPortraits = {
  hasPortrait() {
    return false;
  },
  getPortrait() {
    return null;
  },
  drawPortrait() {},
  preload() {
    return Promise.resolve();
  },
};
