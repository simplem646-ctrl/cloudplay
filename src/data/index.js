/**
 * STUB — replaced by workstream 5 (Story & Content).
 * Empty collections with the exact keys of API_SURFACE.data.
 */
const empty = () => ({});

export const Data = {
  npcs: empty(), items: empty(), fish: empty(), forage: empty(), shops: empty(), jobs: empty(), buildings: empty(),
  schedules: empty(), quests: empty(), events: empty(), festivals: empty(),
  calendar: { festivals: [], weekly: [] },
  mail: empty(), books: empty(), interactions: empty(), dialogue: empty(), tutorial: [], errands: [],
  getItem(id) { return this.items[id] || null; },
  getNpc(id) { return this.npcs[id] || null; },
};
