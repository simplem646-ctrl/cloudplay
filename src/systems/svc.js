/** Service registry shared by every systems module (kept separate from index.js to avoid import cycles). */
export const svc = {};
const order = [];

/** Register (or replace) a service. `init()` / `update(dt)` are called in registration order. */
export function registerService(name, obj) {
  svc[name] = obj;
  if (!order.includes(name)) order.push(name);
  return obj;
}
export function serviceNames() {
  return order.slice();
}
export function initServices() {
  for (const n of order) {
    try {
      svc[n]?.init?.();
    } catch (err) {
      console.error(`[systems] ${n}.init failed`, err);
    }
  }
}
export function updateServices(dt) {
  for (const n of order) {
    try {
      svc[n]?.update?.(dt);
    } catch (err) {
      console.error(`[systems] ${n}.update failed`, err);
    }
  }
}
