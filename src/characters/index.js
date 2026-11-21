/**
 * STUB — replaced by workstream 2 (Characters & Portraits).
 * Returns inert objects with the full Rig / Critter shapes; no Three import.
 */
export function createCharacter(id) {
  const rig = {
    id, group: { isStub: true }, height: 1.15,
    setFacing() {}, getFacing: () => 's', faceTowards() {}, locomote() {},
    play: () => Promise.resolve(), stop() {}, setExpression() {}, emote() {}, setHeld() {},
    setVisible() {}, setSeason() {}, update() {}, dispose() {},
  };
  return rig;
}
export function createCritter() {
  return { group: { isStub: true }, update() {}, setBounds() {}, dispose() {} };
}
export function listAppearances() {
  return [];
}
export function preload() {
  return Promise.resolve();
}
