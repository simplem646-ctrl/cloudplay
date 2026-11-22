/* QA flow: are the NPCs of exterior heart/friend events standing next to the player and inside the camera frame?
 *
 *   npm run build && node tools/serve.mjs --port 4220 &
 *   node tools/shot.cjs "http://127.0.0.1:4220/dist/index.html?q=low&autostart=Kai&skipPrologue=1&fast=1" \
 *        --script tools/qa/event-staging-check.cjs --ready --out /tmp/qa
 *
 * For every heart_* / friend_* event in an exterior area it takes the initial staging (the `place` steps before the first
 * line of dialogue), snaps the follow camera onto the player's spot and prints the events whose first NPC is more than 4 tiles
 * away or outside the central part of the frame, with a suggested free cell beside the player (use it as `npcAt: {x, z}`).
 * Expected output after the staging fixes of 2026-11-22: `AREA <id> []` for every area. Event NPCs are NOT moved by the
 * scripts (only heart_willa_8 walks, indoors), so a far `npcAt` means a conversation across the whole area, often off-screen.
 */
module.exports = async (page, h) => {
  const { sleep } = h;
  const ev = (js) => page.evaluate(js);
  const G = 'window.__game';
  await page.waitForFunction(`${G} && ${G}.Game.mode === 'field'`, null, { timeout: 120000 });
  await sleep(500);
  const ext = ['brook_lane', 'town_square', 'market_street', 'riverside_park', 'harbor', 'whispering_woods', 'starview_hill'];
  const areas = JSON.parse(await ev(`(() => { const set = new Set(); for (const e of Object.values(${G}.Data.events)) { if (!['heart', 'friend'].includes(e.kind) && !/^heart_|^friend_/.test(e.id)) continue; const a = (e.script || []).find((s) => s && s.area); if (a) set.add(a.area); } return JSON.stringify([...set]); })()`));
  for (const area of areas.filter((a) => ext.includes(a))) {
    ev(`${G}.LB.goto('${area}')`).catch(() => {});
    try { await page.waitForFunction(`${G}.Game.state.player.area === '${area}'`, null, { timeout: 60000 }); } catch (e) { console.log('goto failed', area); continue; }
    await sleep(1200);
    const out = await ev(`(() => {
      const rig = ${G}.Game.world.__internals.rig, ent = ${G}.svc.entities, a = ent.area();
      const V = rig.camera.position.constructor; const v = new V();
      const res = [];
      const visible = (px, pz, x, z) => { rig.snap(px, pz); rig.camera.updateMatrixWorld(); rig.camera.updateProjectionMatrix(); v.set(x, 0.6, z).project(rig.camera); return Math.abs(v.x) < 0.8 && v.y > -0.7 && v.y < 0.8; };
      for (const [id, e] of Object.entries(${G}.Data.events)) {
        if (!/^heart_|^friend_/.test(id)) continue;
        const steps = e.script || [];
        const areaStep = steps.find((s) => s && s.area);
        if (!areaStep || areaStep.area !== '${area}') continue;
        const firstTalk = steps.findIndex((s) => s && (s.say || s.narrate || s.ask));
        const pre = steps.slice(0, firstTalk < 0 ? steps.length : firstTalk).filter((s) => s && s.place);
        const P = ent.pointOf((pre.find((s) => s.place === 'player') || {}).at || areaStep.at);
        const npcStep = pre.find((s) => s.place !== 'player');
        if (!P || !npcStep) continue;
        const N = ent.pointOf(npcStep.at);
        if (!N) continue;
        const d = Math.hypot(N.x - P.x, N.z - P.z);
        const vis = visible(P.x, P.z, N.x, N.z);
        if (d <= 4 && vis) continue;
        // suggest a free, in-frame cell 1.4-2.4 tiles from the player
        let best = null;
        const dirs = [[1, 0.35], [-1, 0.35], [1, -0.35], [-1, -0.35], [0.35, 1], [-0.35, 1], [1, 1], [-1, 1], [0, -1]];
        outer: for (const r of [1.5, 1.8, 2.1, 2.5]) for (const [dx, dz] of dirs) {
          const m = Math.hypot(dx, dz); const x = Math.round((P.x + dx / m * r) * 10) / 10, z = Math.round((P.z + dz / m * r) * 10) / 10;
          if (a.isBlockedAt(x, z, 0.36)) continue;
          if (!visible(P.x, P.z, x, z)) continue;
          best = { x, z }; break outer;
        }
        res.push({ id, npc: npcStep.place, player: [+P.x.toFixed(1), +P.z.toFixed(1)], npcNow: [+N.x.toFixed(1), +N.z.toFixed(1)], dist: +d.toFixed(1), inFrame: vis, suggest: best });
      }
      return JSON.stringify(res);
    })()`);
    console.log('AREA', area, out);
  }
};
