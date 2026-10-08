// Playwright browser check for the second UX increment. Screenshots go to DUEVEJ_SCREENSHOT_DIR if set.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
let html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').replace(/<link[^>]*(?:googleapis|gstatic)[^>]*>/g,'');
if(process.env.DUEVEJ_THREE_PATH)html=html.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','/three.module.js');
html=html.replace('if (window.claude?.hot?.ready)',`window.__navigation={found,camCols,CONTACT,updWalkingPresentation,get fov(){return camera.fov},get near(){return camera.near},get indoor(){return camIn},tick(n=120){for(let i=0;i<n;i++){updPlayer(1/60);updCamera(1/60,i/60);for(const h of HOOKS.frame)h(1/60,i/60);updWalkingPresentation(1/60)}},render(){renderer.shadowMap.enabled=false;sky.position.copy(camera.position);renderer.render(scene,camera)}};\nif (window.claude?.hot?.ready)`);
const server=http.createServer((q,r)=>{if(q.url==='/three.module.js'){r.setHeader('Content-Type','application/javascript');r.end(fs.readFileSync(process.env.DUEVEJ_THREE_PATH));return}r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html)});let browser;
async function main(){await new Promise(r=>server.listen(0,'127.0.0.1',r));
 for(const mobile of [false,true]){
  browser=await chromium.launch({...(process.env.DUEVEJ_BROWSER_PATH?{executablePath:process.env.DUEVEJ_BROWSER_PATH}:{}),headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1100,height:800}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'commit'});await page.waitForFunction(()=>window.__gameReady,{}, {polling:100,timeout:45000});await page.locator('#goBtn').click();
  assert.equal(await page.locator('#tools > button').count(),3);
  for(const id of ['bMap','bHelp','bMore']){const box=await page.locator('#'+id).boundingBox();assert(box.width>=44&&box.height>=44)}
  await page.locator('#bMore').click();assert.equal(await page.locator('#bMore').getAttribute('aria-expanded'),'true');assert(await page.locator('#bNight span').isVisible());
  for(const id of ['bBubbles','bWinter','bNight','bSound','bVoice']){assert.equal(await page.locator('#'+id).evaluate(e=>e.parentElement.id),'moreTools');if(await page.locator('#'+id).isVisible()){const box=await page.locator('#'+id).boundingBox();assert(box.height>=48)}}
  await page.locator('#bNight').click();assert.equal(await page.locator('#bNight').getAttribute('aria-pressed'),'true');await page.locator('#bNight').click();
  await page.keyboard.press('Escape');assert.equal(await page.locator('#bMore').getAttribute('aria-expanded'),'false');
  await page.locator('#bMore').click();await page.locator('#bHelp').click();assert.equal(await page.locator('#bMore').getAttribute('aria-expanded'),'false');await page.locator('#goBtn').click();
  const cues=await page.evaluate(()=>{const n=window.__navigation,g=window.__duevej;n.found.clear();n.tick(1);const locked=g.FX.entranceHints.every(h=>h.marker.material.opacity===.12);n.found.add(0);n.tick(1);const first=g.FX.entranceHints.find(h=>h.door.nm==='2.A');return{count:g.FX.entranceHints.length,locked,open:first.marker.material.opacity===.65,parents:g.FX.entranceHints.every(h=>!!h.marker.parent)}});
  assert(cues.locked&&cues.open&&cues.parents);assert.equal(cues.count,7);
  const lens=await page.evaluate(()=>{const n=window.__navigation,g=window.__duevej;g.P.pos.set(5,.12,-20);g.P.vel.set(0,0,0);g.snap(0);n.tick();const outdoor=n.fov;g.P.pos.set(26.7,3.6,0);g.cam.yaw=Math.PI/2;g.snap(0);n.tick();return{outdoor,indoor:n.fov,near:n.near}});
  assert(lens.indoor>lens.outdoor+3&&lens.near===.12);
  if(process.env.DUEVEJ_SCREENSHOT_DIR){fs.mkdirSync(process.env.DUEVEJ_SCREENSHOT_DIR,{recursive:true});await page.evaluate(()=>window.__navigation.render());await page.screenshot({path:path.join(process.env.DUEVEJ_SCREENSHOT_DIR,(mobile?'mobile':'desktop')+'-indoor.png'),timeout:90000});await page.locator('#bMore').click();await page.screenshot({path:path.join(process.env.DUEVEJ_SCREENSHOT_DIR,(mobile?'mobile':'desktop')+'-tools.png'),timeout:90000});await page.keyboard.press('Escape')}
  if(mobile){for(const size of [{width:320,height:568},{width:640,height:360}]){await page.setViewportSize(size);const c=await page.locator('#counter').boundingBox(),t=await page.locator('#tools').boundingBox();assert(c.x+c.width<=t.x);await page.locator('#bMore').click();const panel=await page.locator('#moreTools').boundingBox();assert(panel.y+panel.height<=size.height);await page.locator('#moreTools button:visible').last().scrollIntoViewIfNeeded();await page.keyboard.press('Escape')}}
  assert.deepEqual(errors,[]);console.log((mobile?'Mobile':'Desktop')+': toolbar, large controls, toggles, seven entrance cues and indoor lens PASS');
  await browser.close();browser=null;
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
