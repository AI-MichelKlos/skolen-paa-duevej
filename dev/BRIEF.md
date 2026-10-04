# Shared brief for feature agents - "Skolen på Duevej" (3D walking game for a 5-year-old girl)

The game is ONE html file with an ES-module script (three.js 0.160, cartoon toon style). A girl walks around a Danish school (Frederiksberg), finds 12 animals, plays. Texts in the game are Danish, short and simple (she is 5 and mostly listens; all toasts are read aloud). Never use the long dash "–" in Danish texts; use "-".

## Your sandbox (isolation is important)
- Several agents work at the same time. Work ONLY in your own folder: `<TEST>/ag_<you>/` (`<TEST>` is the test folder the lead agent tells you; it is made with `dev/make_test_copies.py`).
- `index.html` there is your private test copy (three.js is loaded from ../node_modules). `index_original.html` is a pristine copy. Never edit /home/claude/skolen-paa-duevej/ or other agents' folders.
- A local web server serves `<TEST>` at http://localhost:8765, so your copy is http://localhost:8765/ag_<you>/index.html. If down: `cd <TEST> && nohup python3 -m http.server 8765 >/dev/null 2>&1 &`.

## Deliverables (files in your folder)
- `world_<you>.js`: static geometry. It will be pasted in place of the line `// (feature world blocks go here)` (inside the world section, BEFORE the static world is merged and before window planes are instanced). At that point `kid`, `animals`, `P`, sounds etc. do NOT exist yet; only world helpers/materials do.
- `logic_<you>.js`: behaviour. It will be pasted in place of the line `// (feature logic blocks go here)` (just before the main loop; everything in the game exists by then).
- Wrap each file's code in a block `{ ... }` so your names can't clash with other agents. Share things between your two files through the global object `FX`, e.g. `FX.salen = { ... }`.
- `notes.md`: short summary, plus (only if truly needed) exact small find/replace changes you need OUTSIDE your blocks. Keep these minimal; others edit the same file.
- To test, paste your blocks into your own `index.html` at those two marker lines (keep the marker lines' neighbours intact). Final check: take `index_original.html`, insert ONLY your deliverables (+ the notes.md changes) and verify it runs without errors.

## Coordinates and world
x = east, z = south, y = up, metres. The player is `P` (`P.pos`, `P.vel`, `P.face` (0 = facing +z, PI/2 = +x), `P.onGround`). Walk speed 5.2 m/s, run 9.5.
School grounds roughly x -37.5..40, z -92..91. Main building ~ (2.5, -58.5). The wide yellow wing ("de gule huse", enterable): outer box x 12..29, z -6.25..6.75, 7 m tall:
- wall thickness 0.3; inner faces ix0 = 12.3, ix1 = 28.85, iz0 = -5.95, iz1 = 6.45.
- ground floor y = 0.12, ceiling 3.45 (underside of first-floor slab). First floor y = 3.6, its ceiling 6.55.
- Hall ("salen") x 12.3..20.6 with wooden floor; wall at x 20.6..20.8 with a door z 3.4..4.6 (sign SALEN). Stage x 12.3..15.3, top 0.62, a red back-curtain plane at x≈12.34, curtain "wings" boxes at x≈15.05 (0.3 thick, 1.6 deep, y 0.62..3.42) at z≈-5.15 and z≈5.65, and a red valance at the top. Floor lines, cones at (17,-3.5),(18.2,-2.2),(19.4,-3.5),(17,3),(19.4,3); roller skates lying at (16.6,-0.6),(17.0,-0.45),(19.6,1.4); benches z -4.6 and 5.0 (x 17.1..19.5, 0.63 high). Ceiling lamps at (16.5,-3),(16.5,3.5),(19.5,-3),(19.5,3.5).
- Lobby x 20.8..28.85. Entrance doorways in the south wall and north wall at x 25.9..28.1 (south one through a glass tower x 25.4..29, z 6.75..9.3). Stair x 20.85..23.95, z -0.85..-5.95 (up north, landing, back south to the first floor at z -0.85). Cloakroom ("garderobe") along the east wall x≈28.0..28.85 with jackets, benches z -4.6..-0.4 and 0.9..4.6, sign GARDEROBE.
- First floor: corridor z -0.85..1.35 (walls 0.2 thick just outside it), from x 12.3 to 28.85. Rooms (agreed layout, do not change):
  - north: 2.A = MUSIKLOKALET x 12.3..16.45; 2.B = BILLEDKUNST (drawing) x 16.45..20.6; (stairwell 20.8..24.15); 3.A = BIBLIOTEKET x 24.35..28.85; all z -5.95..-1.05.
  - south: 3.B x 12.3..16.45, 4.A x 16.45..20.55, 4.B x 20.55..24.65, 5.A x 24.65..28.85; all z 1.55..6.45 (normal classrooms).
  - doors (1.1 m wide, 2.2 high) at x 14.4 (2.A), 18.5 (2.B), 26.6 (3.A) in the north corridor wall (z -1.05..-0.85), and x 14.4, 18.5, 22.6, 26.8 in the south corridor wall (z 1.35..1.55). Keep 1.2 m inside each door free of furniture. "Lærerværelset" door at the east end stays locked.
  - First-floor outside windows are at y 5.2: north side x 14.58, 16.95, 19.32, 21.68, 24.05, 26.42; south side x 14.58, 16.95, 19.32, 21.68, 24.05.

## Helpers you can use (read their code in index.html)
World building: `box(w,h,d,mat,x,y,z,{edges,col,cast,ry,map})` (y = bottom; col:true adds a collider), `mesh(geo,mat,x,y,z,{rx,ry,rz,edges,cast,parent})`, `boxGeo`, `mplane`, `prismGeo`, `rectG`, `discG`, `edges`, `ctex(w,h,drawFn,{rep,wrap,srgb})` (canvas texture), `toon(color,{...})` (MeshToonMaterial), materials in `M` (M.brick, M.yellow, M.deck, M.steel, M.white, M.dark, M.wood, M.stone, M.concrete, M.metal, M.bulb, M.net, M.hedge, M.grass, M.asphalt, M.sidewalk, M.slate, M.tile, ...), textures in `TX` (TX.glow is a soft round sprite), `addWin(kind,x,y,z,ry,w,h,litP)` with kinds 'rect','arch','yellow','modern','doorArch','doorGreen','doorModern','green','french' (instanced window planes; only call in world blocks), `WOFF` (0.075).
Colliders: `colBox(x0,x1,z0,z1,top)`, `colCirc(x,z,r,top)`, `colRamp(x0,x1,z0,z1,h0,h1,'z'|'x')`, or push `{t:'b',x0,x1,z0,z1,top,bot}` into `cols` (bot = underside, the player walks under it). The player steps up anything < 0.5 m. `groundAt(x,z,maxY)` gives the floor height. `camOnly` (boxes the camera must not pass), `mapItems` (minimap), `LOCKED` ({x,z,y,n}: walking there shows "<n> er låst lige nu").
Scene: `world` (static, auto-merged), `dyn` (anything that moves or changes - put it here), `scene`, `camera`, `hemi`, `sun`, `skyU`, `scene.fog`, `cloudMat`. Static meshes added to `world` in a world block are merged by material after building (so many small boxes are fine, but create each material ONCE, not per mesh). A world group with `userData.noMerge = true` is kept as is.
Game: `kid` (`kid.root` group at P.pos, `kid.g` body group, `kid.head`, `kid.legs[i].hip/.knee/.shoe`, `kid.arms[0..1]`, `kid.coat` material), `animals` (each `a.k` key, `a.def.n` name e.g. 'Hund', `a.def.d` e.g. 'hunden', `a.g` group, `a.follow` true when in her parade, `a.happy` > 0 while cheering), `found` (Set of animal ids), `ANIM` (per-animal idle animation), `SOUNDS[a.k]()` (animal sound), `toast(msg)` (message box, also read aloud), `say(text)` (read aloud only), `tone(f0,f1,start,dur,vol,type)`, `noise(dur,filterType,freq,vol)`, `fanfare()`, `hop()`, `sparkleSound()`, `burst(pos)` (sparkles), `popLabel(text,pos,s)`, `effects` (sprite effects list, see updEffects), `WEATHER` ({raining, t}), `wet` (0..1 rain amount), `ev` (0..1 evening), `isTouch`, `reduceMotion`, `$` (getElementById), `keys` (Set of held key codes), `started`, `paused`, `clockT` (seconds), `rand/rr/pick/jit`, `inWing(x,z,margin)`, `JACKETS`, `jacketCol`, `applyColours()`, `save()`, `UMB` (umbrella), `BALL`, `PARADE`, `PILES` (leaf piles), `PUDDLES`, `fl`/`LEAFN` (falling leaves).
Hooks (call `.push(fn)`): `HOOKS.frame` (dt,t) every frame; `HOOKS.ride` (dt) => return true if you moved the player yourself this frame (like a ride); `HOOKS.key` (e) on keydown while walking; `HOOKS.found` (animal) when an animal is found; `HOOKS.start` () when the walk starts. Player modifiers: set `P.mod = { speed, acc, turn }` (multipliers, default 1) e.g. for roller skates.
Shared action button: call `offerAction({ id, label, run, prio })` EVERY FRAME while the player can do something (e.g. near a thing). The best offer is shown as a big button "E  <label>" and read aloud once; key E or a click/tap runs `run()`. Use short Danish labels like 'Dans', 'Klap hunden', 'Byg snemand'.
Keys already used: W A S D, arrows, Shift, Space (jump), N (evening), M (map), P (umbrella), S (kick when holding the ball), V (show the way), E (action button). New: B = soap bubbles (agent "ude"), O = winter (agent "vinter"). Don't use others without need.
UI: create any extra DOM/CSS from your JS (e.g. append a <style> element and buttons to `$('hud')` or `$('tools')`, class "sticker btn" matches the look). Buttons must also work on touch.

## Quality bar
- Cartoon toon style, bright, readable, with simple outlines (`edges: true` on main shapes). Big visible effects and sounds - she is 5.
- No console errors. Avoid per-frame allocations (reuse vectors), keep draw calls low (few new materials, static stuff in world blocks), keep it light for phones.
- Storage: localStorage only inside try/catch.

## Testing
- Syntax: extract the `<script type="module">` content to a .mjs file and run `node --check`.
- Python Playwright is installed. Launch Chromium with args ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']. It renders at only ~1-2 fps, so real-time key holding moves the player very little: test logic by calling functions directly. Your copy exposes `window.__dbg = { updPlayer, keys, cols, groundAt, topAt, animals, found, discover, WEATHER, offerAction, runAction, ACT, HOOKS, FX, P, kid }` and `window.__duevej` (start(), P, cam, snap(e), peek(yaw), ...). Simulate with e.g. `for (...) { __dbg.updPlayer(1/60); hook(1/60, t) }`. Add more to `window.__dbg` in your copy if you need (only in your copy).
- After load (~5.5 s): `window.__duevej.start()`. Teleport: `(()=>{const d=window.__duevej; d.P.pos.set(X,Y,Z); d.P.vel.set(0,0,0); d.P.face=F; d.cam.yaw=F+Math.PI; d.snap(0);})()`. Free camera: `window.__camOverride = c => { c.fov=50; c.aspect=innerWidth/innerHeight; c.updateProjectionMatrix(); c.up.set(0,1,0); c.position.set(..); c.lookAt(..); }`. Hide UI: `$('intro').hidden = true; $('hud').hidden = true` (via document.getElementById).
- Look at your screenshots with the Read tool and iterate until it looks good and works.

## Report back
Max ~200 words, English: what you built, your files, any notes.md changes, 2-3 best screenshot paths.
