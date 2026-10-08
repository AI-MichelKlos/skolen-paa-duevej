// Run from any directory with Playwright installed: node dev/test-characters.cjs
// Optional DUEVEJ_BROWSER_PATH selects an existing Chromium/Edge executable.
// Test instrumentation is served in memory; production HTML is never modified.
const fs = require('fs');
const http = require('http');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const path = require('path');
const reportDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'duevej-characters-'));
let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const debug = `window.__test = {selectPlayerCharacter, updPlayerCharacter, updPlayer, updAnimals, updParade, discover, found, keys, joy, playerModels, girlBodyParts, FILIPA_ANIMALS, save, load, openIntro, render(){P.pos.set(0,0.12,-30);P.vel.set(0,0,0);P.face=0;P.onGround=true;updPlayer(1/60);updPlayerCharacter(1/60,0);kid.root.visible=true;renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;camera.position.set(3,2.2,-26);camera.lookAt(0,0.8,-30);renderer.render(scene,camera)}, get character(){return playerCharacter}, tick(n=600){for(let i=0;i<n;i++){updAnimals(1/60,i/60);updParade(1/60,i/60);for(const h of HOOKS.frame)h(1/60,i/60)}}, jump(){jumpReq=true}};`;
// Serve the exact local Three.js build when supplied, without browser routing.
if(process.env.DUEVEJ_THREE_PATH)html=html.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','/three.module.js');
html=html.replace(/<link[^>]*(?:googleapis|gstatic)[^>]*>/g,'');
const server = http.createServer((req,res) => {if(req.url==='/three.module.js'&&process.env.DUEVEJ_THREE_PATH){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(process.env.DUEVEJ_THREE_PATH));return;} res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html.replace('if (window.claude?.hot?.ready)',debug+'\nif (window.claude?.hot?.ready)')); });
async function main(){
  await new Promise(r => server.listen(8765,'127.0.0.1',r));
  const browser = await chromium.launch({...(process.env.DUEVEJ_BROWSER_PATH ? {executablePath:process.env.DUEVEJ_BROWSER_PATH} : {}),headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const results=[];
  for(const mobile of [false,true]){
    const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1280,height:900}});
    await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const page=await context.newPage();
    if(process.env.DUEVEJ_THREE_PATH) await context.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', route => route.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.DUEVEJ_THREE_PATH,'utf8')}));
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message)});
    await page.goto('http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
    try { await page.waitForFunction(()=>window.__gameReady,{},{timeout:45000}); }
    catch(e) { console.error('Bootstrap errors:', errors, await page.locator('#loadErr').textContent()); throw e; }
    if(!process.env.DUEVEJ_SKIP_SCREENSHOTS) await page.screenshot({path:path.join(reportDir, `${mobile?'mobile':'desktop'}-start.png`)});
    for(const character of ['girl','kat','mus','hund']){
      const button=page.locator(`[data-character="${character}"]`);
      if(mobile)await button.tap();else await button.click();
      assert.equal(await button.getAttribute('aria-pressed'),'true');
      const bounds=await button.boundingBox();assert(bounds.width>=80&&bounds.height>=100);
      await page.locator('#goBtn').click();
      const check=await page.evaluate(character=>{
        const d=window.__test,g=window.__duevej;const result={character:d.character,rooms:[],move:false,jump:false,independent:true};
        const points=[[0,0.12,-30],[17,0.12,0],[27,0.12,2],[14.4,3.6,-3],[18.5,3.6,-3],[26.6,3.6,-3],[14.4,3.6,3],[18.5,3.6,3],[22.6,3.6,3],[26.8,3.6,3]];
        for(const [x,y,z]of points){g.P.pos.set(x,y,z);g.P.vel.set(0,0,0);g.P.onGround=true;d.updPlayer(1/60);d.updPlayerCharacter(1/60,2);const model=d.playerModels.get(character);result.rooms.push(g.kid.root.position.distanceTo(g.P.pos)<1e-6&&(character==='girl'?d.girlBodyParts.every(p=>p.visible):model.g.visible&&model.g.parent===g.kid.g&&d.girlBodyParts.every(p=>!p.visible)));}
        g.P.pos.set(0,0.12,-30);g.P.vel.set(0,0,0);g.P.face=0;g.P.onGround=true;
        const before=g.P.pos.clone();d.keys.add('KeyW');for(let i=0;i<60;i++)d.updPlayer(1/60);d.keys.clear();result.move=g.P.pos.distanceTo(before)>2;
        d.jump();d.updPlayer(1/60);result.jump=!g.P.onGround&&g.P.vel.y>0;
        const model=d.playerModels.get(character);result.independent=!model||g.animals.every(a=>a.g!==model.g);
        return result;
      },character);
      assert.equal(check.character,character);assert(check.rooms.every(Boolean));assert(check.move&&check.jump&&check.independent);
      results.push(`${mobile?'mobile':'desktop'} ${character}: choice, 10 rooms, movement, jump, separate identity PASS`);
      if(character!=='girl'&&!process.env.DUEVEJ_SKIP_SCREENSHOTS){await page.evaluate(()=>window.__test.render());await page.screenshot({path:path.join(reportDir, `${mobile?'mobile':'desktop'}-${character}.png`),timeout:90000});}
      await page.locator('#bHelp').click();
    }
    await page.locator('#goBtn').click();
    const animals=await page.evaluate(()=>{
      const d=window.__test,g=window.__duevej;const cat=g.animals.find(a=>a.k==='kat');d.discover(cat);d.tick(220);
      const single=cat.gather&&!cat.follow&&g.PARADE.length===0;
      for(const a of g.animals.filter(a=>a.id<12&&!d.found.has(a.id)))d.discover(a);
      d.tick(900);
      return {single,count:[...d.found].filter(i=>i<12).length,home:d.FILIPA_ANIMALS.filter(a=>a.id<12&&a.arrived).length,unique:new Set(d.FILIPA_ANIMALS).size===d.FILIPA_ANIMALS.length,parade:g.PARADE.length,character:d.character};
    });
    assert(animals.single&&animals.unique);assert.equal(animals.count,12);assert.equal(animals.home,12);assert.equal(animals.parade,0);
    results.push(`${mobile?'mobile':'desktop'} animals: single find, rapid discoveries, 12 home, no duplicate identities PASS`);
    await page.reload();await page.waitForFunction(()=>window.__gameReady);
    assert.equal(await page.evaluate(()=>window.__test.character),'hund');
    assert.equal(await page.evaluate(()=>window.__test.found.size),12);
    await page.locator('#goBtn').click();
    await page.evaluate(()=>window.__test.tick(900));
    assert.equal(await page.evaluate(()=>window.__test.FILIPA_ANIMALS.filter(a=>a.id<12&&a.arrived).length),12);
    await page.locator('#bHelp').click();await page.evaluate(()=>window.__test.tick(1));await page.locator('#restartBtn').click();await page.locator('#restartBtn').click();
    assert.equal(await page.evaluate(()=>window.__test.found.size),0);
    assert.equal(await page.evaluate(()=>window.__test.FILIPA_ANIMALS.length),0);
    assert.equal(await page.evaluate(()=>window.__test.character),'hund');
    results.push(`${mobile?'mobile':'desktop'} saved character, saved animals and Start forfra PASS`);
    const secret=await page.evaluate(()=>{
      const d=window.__test,g=window.__duevej;d.selectPlayerCharacter('mus');
      const mouse=g.FX.sal1.mouseAnimal;g.P.pos.copy(mouse.g.position);g.P.vel.set(0,0,0);d.tick(900);
      const ok=d.found.has(12)&&mouse.arrived&&!mouse.follow&&mouse.g!==d.playerModels.get('mus').g;
      d.selectPlayerCharacter('hund');return ok;
    });
    assert(secret);results.push(`${mobile?'mobile':'desktop'} mouse player can find secret mouse and send it home PASS`);
    // Both round reset paths must retain the character and clear the animal gathering.
    await page.evaluate(()=>{const d=window.__test,g=window.__duevej;d.discover(g.animals.find(a=>a.k==='kat'));d.tick(900);document.getElementById('finAgain').click();});
    assert.equal(await page.evaluate(()=>window.__test.found.size),0);
    assert.equal(await page.evaluate(()=>window.__test.FILIPA_ANIMALS.length),0);
    assert.equal(await page.evaluate(()=>window.__test.character),'hund');
    await page.evaluate(()=>{const d=window.__test,g=window.__duevej;d.discover(g.animals.find(a=>a.k==='hund'));d.tick(900);});
    await page.locator('#bHelp').click();
    await page.evaluate(()=>{document.getElementById('newGameBtn').hidden=false;});
    page.once('dialog',dialog=>dialog.accept());
    await Promise.all([page.waitForEvent('load'),page.locator('#newGameBtn').click()]);
    await page.waitForFunction(()=>window.__gameReady,{},{timeout:45000});
    assert.equal(await page.evaluate(()=>window.__test.found.size),0);
    assert.equal(await page.evaluate(()=>window.__test.FILIPA_ANIMALS.length),0);
    assert.equal(await page.evaluate(()=>window.__test.character),'hund');
    await page.locator('#goBtn').click();
    results.push(`${mobile?'mobile':'desktop'} Gem dyrene igen and Nyt spil retain character, reset animals PASS`);
    if(mobile){
      const moved=await page.evaluate(()=>{const d=window.__test,g=window.__duevej;g.P.pos.set(0,0.12,-30);g.P.vel.set(0,0,0);g.P.face=0;g.P.onGround=true;const z=g.P.pos.z;d.joy.id=1;d.joy.x=0;d.joy.y=-1;for(let i=0;i<60;i++)d.updPlayer(1/60);d.joy.id=null;d.joy.y=0;return g.P.pos.z-z>2;});assert(moved);results.push('mobile joystick input PASS');
    }
    assert.deepEqual(errors,[]);results.push(`${mobile?'mobile':'desktop'} no uncaught browser errors PASS`);
    await context.close();
  }
  await browser.close();server.close();fs.writeFileSync(path.join(reportDir,'test-results.txt'),results.join('\n'));console.log(results.join('\n'));
}
main().catch(e=>{console.error(e);server.close();process.exit(1)});
