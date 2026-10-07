// Requires Playwright. Optional DUEVEJ_BROWSER_PATH and DUEVEJ_THREE_PATH use local runtimes.
// Instrumentation and synthetic colliders exist only in the served test copy.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { chromium } = require('playwright');
let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const debug = `window.__walls = { cols, camCols, resolve, movePlayerHorizontal, rayHit, keepCameraClear, updCamera, camPos, camLook, selectPlayerCharacter, keys, updPlayer, joy, get root(){return kid.root}, aim(){camInit=true;startBlend=1;lastDragEnd=clockT;cam.yaw=Math.PI/2;camPos.set(3,2,0);camLook.set(1,1.52,0)} };`;
html = html.replace('if (window.claude?.hot?.ready)', debug + '\nif (window.claude?.hot?.ready)');
const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
let browser;
async function main() {
  await new Promise(r => server.listen(8766, '127.0.0.1', r));
  browser = await chromium.launch({ ...(process.env.DUEVEJ_BROWSER_PATH ? { executablePath: process.env.DUEVEJ_BROWSER_PATH } : {}), headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
    if (process.env.DUEVEJ_THREE_PATH) await context.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', route => route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.DUEVEJ_THREE_PATH, 'utf8') }));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto('http://127.0.0.1:8766');
    await page.waitForFunction(() => window.__gameReady, {}, { timeout: 45000 });
    await page.locator('#goBtn').click();
    const checks = await page.evaluate(() => {
      const w = window.__walls, g = window.__duevej, p = g.P;
      const results = [], original = [...w.cols], originalCam = [...w.camCols];
      const check = (name, ok) => { if (!ok) throw Error(name); results.push(name); };
      const wall = { t: 'b', x0: -10, x1: 10, z0: 0, z1: 0.05, top: 4 };
      try {
        w.cols.splice(0, w.cols.length, wall);
        for (const character of ['girl', 'kat', 'mus', 'hund']) {
          w.selectPlayerCharacter(character);
          for (const speed of [5.2, 9.5, 20]) {
            p.pos.set(0, 0.12, -0.36); p.vel.set(0, 0, speed);
            for (let i = 0; i < 20; i++) { p.vel.z = speed; w.movePlayerHorizontal(0.05); }
            check(character + ' cannot cross a thin wall at speed ' + speed, p.pos.z <= -0.35 + 1e-6 && Math.abs(p.vel.z) < 1e-6);
          }
          p.pos.set(0, 0.12, -0.36);
          for (let i = 0; i < 20; i++) { p.vel.set(3, 0, 9.5); w.movePlayerHorizontal(0.05); }
          check(character + ' slides along wall', p.pos.x > 2.9 && p.pos.z <= -0.35 + 1e-6);
          p.vel.set(0, 0, -5.2); const z = p.pos.z; w.movePlayerHorizontal(0.1);
          check(character + ' leaves wall immediately', p.pos.z < z - 0.5);
        }
        w.cols.push({ t: 'b', x0: 0, x1: 0.05, z0: -10, z1: 10, top: 4 });
        p.pos.set(-0.36, 0.12, -0.36);
        for (let i = 0; i < 30; i++) { p.vel.set(9.5, 0, 9.5); w.movePlayerHorizontal(0.05); }
        check('corner stops both velocity components', p.pos.x <= -0.35 + 1e-6 && p.pos.z <= -0.35 + 1e-6 && Math.hypot(p.vel.x, p.vel.z) < 1e-6);
        w.cols.splice(0, w.cols.length, { t: 'b', x0: -10, x1: -0.6, z0: 0, z1: 0.2, top: 4 }, { t: 'b', x0: 0.6, x1: 10, z0: 0, z1: 0.2, top: 4 });
        p.pos.set(0, 0.12, -1); p.vel.set(0, 0, 5.2); w.movePlayerHorizontal(0.5);
        check('normal doorway remains passable', p.pos.z > 1);
        w.cols.splice(0, w.cols.length, { t: 'c', x: 0, z: 0, r: 0.2, top: 4 });
        p.pos.set(0, 0.12, -0.6); p.vel.set(0, 0, 20); w.movePlayerHorizontal(0.05);
        check('round posts block running', p.pos.z <= -0.55 + 1e-6);
        w.cols.splice(0, w.cols.length, ...original);
        for (const [x, y, z, edge] of [[27.8, 0.12, 2, 28.45], [19.8, 0.12, 0, 20.25], [27.8, 3.6, 0, 28.45]]) {
          p.pos.set(x, y, z); p.vel.set(0, 0, 0);
          for (let i = 0; i < 30; i++) { p.vel.x = 9.5; w.movePlayerHorizontal(0.05); }
          check('actual school wall ' + [x,y,z], p.pos.x <= edge + 1e-6);
        }
        w.camCols.splice(0, w.camCols.length, { t: 'b', x0: 0, x1: 0.1, z0: -100, z1: 100, bot: 0, top: 4 });
        const a = p.pos.clone().set(-0.36, 1.52, 0), b = a.clone().set(3, 1.52, 0);
        check('camera ray detects nearby wall', w.rayHit(a, b) < 0.1);
        w.keepCameraClear(a, b); check('camera maintains clearance', b.x <= -0.249);
        check('camera ray detects an origin inside wall', w.rayHit(a.clone().set(0.01,1.5,0), b) === 0);
        p.pos.set(-0.36,0.12,0); p.vel.set(9.5,0,0); p.face=Math.PI/2; w.aim();
        w.updCamera(1/60, 0);
        check('look ahead stays on player side of wall', w.camLook.x <= -0.219);
        check('smoothed camera cannot pass through wall', g.renderer.domElement && w.camPos.x <= -0.219);
        w.camCols[0].bot=5;w.camCols[0].top=6;
        check('camera can pass under high overhead objects', w.rayHit(a,a.clone().set(3,1.52,0)) === 1);
        w.camCols[0].bot=-200;w.camCols[0].top=-100;
        check('unlocked door does not obstruct camera', w.rayHit(a,a.clone().set(3,1.52,0)) === 1);
      } finally {
        w.cols.splice(0,w.cols.length,...original);w.camCols.splice(0,w.camCols.length,...originalCam);
      }
      return results;
    });
    assert.deepEqual(errors, []);
    console.log(`${mobile ? 'Mobile' : 'Desktop'}: ${checks.length} wall and camera checks PASS`);
    await context.close();
  }
}
main().catch(e => { console.error(e); process.exitCode=1; }).finally(async () => { if(browser) await browser.close();server.close(); });
