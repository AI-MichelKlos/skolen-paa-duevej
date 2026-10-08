// Requires Playwright; optional DUEVEJ_BROWSER_PATH and DUEVEJ_THREE_PATH select local runtimes.
const fs=require('fs'), path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
let html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
html=html.replace('if (window.claude?.hot?.ready)',`window.__feel={keys,updPlayer,updCamera,updWalkingPresentation,updPlayerCharacter,CONTACT,WALK_FEEL,selectPlayerCharacter,get indoor(){return camIn},step(n=1){for(let i=0;i<n;i++){updPlayer(1/60);updCamera(1/60,i/60);updPlayerCharacter(1/60,i/60);updWalkingPresentation(1/60)}},jump(){jumpReq=true},render(){for(const h of HOOKS.frame)h(1/60,0);renderer.shadowMap.enabled=false;renderer.render(scene,camera)}};\nif (window.claude?.hot?.ready)`);
// Serve the exact local Three.js build when supplied, without browser routing.
if(process.env.DUEVEJ_THREE_PATH)html=html.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','/three.module.js');
html=html.replace(/<link[^>]*(?:googleapis|gstatic)[^>]*>/g,'');
const server=http.createServer((q,r)=>{if(q.url==='/three.module.js'&&process.env.DUEVEJ_THREE_PATH){r.setHeader('Content-Type','application/javascript');r.end(fs.readFileSync(process.env.DUEVEJ_THREE_PATH));return;}r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html)});let browser;
async function main(){
 await new Promise(r=>server.listen(8768,'127.0.0.1',r));browser=await chromium.launch({...(process.env.DUEVEJ_BROWSER_PATH?{executablePath:process.env.DUEVEJ_BROWSER_PATH}:{}),headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mode of (process.env.DUEVEJ_TEST_MODE?[process.env.DUEVEJ_TEST_MODE]:['desktop','mobile','reduced'])){
  const context=await browser.newContext(mode==='mobile'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1100,height:800},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(process.env.DUEVEJ_THREE_PATH)await context.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.DUEVEJ_THREE_PATH,'utf8')}));
  await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('http://127.0.0.1:8768',{waitUntil:'commit'});await page.waitForFunction(()=>window.__gameReady,{}, {polling:100,timeout:45000});await page.locator('#goBtn').click();
  const result=await page.evaluate(mode=>{
   const f=window.__feel,g=window.__duevej,p=g.P,checks=[];const check=(n,ok)=>{if(!ok)throw Error(n);checks.push(n)};
   const place=(x,y,z)=>{p.pos.set(x,y,z);p.vel.set(0,0,0);p.face=0;p.onGround=true;g.snap(0);g.cam.yaw=Math.PI;f.keys.clear()};
   for(const key of ['girl','kat','mus','hund']){
    f.selectPlayerCharacter(key);place(0,.12,-20);f.keys.add('KeyW');f.step(30);check(key+' starts smoothly',p.vel.z>4.8&&p.vel.z<5.21);const phase=p.walkT,z=p.pos.z;f.step(30);check(key+' steps follow travel',Math.abs((p.walkT-phase)-(p.pos.z-z)*2.1)<1e-4);f.keys.clear();const stop=p.pos.z;f.step(60);check(key+' stops without long slide',p.pos.z-stop<.35&&Math.hypot(p.vel.x,p.vel.z)<.001);
    f.jump();f.step(12);const airOpacity=f.CONTACT.material.opacity;f.step(60);check(key+' shadow follows landing',p.onGround&&f.CONTACT.material.opacity>airOpacity&&Math.abs(f.CONTACT.position.y-(p.pos.y+.018))<.03);check(key+' pose resets',Math.abs(g.kid.pose.rotation.z)<.001&&Math.abs(g.kid.pose.scale.y-1)<.001);
   }
   place(5,.12,-20);f.step(120);check('outdoor camera stays wide',f.indoor<.01);place(26.7,.12,2);f.step(1);check('indoor transition gradual',f.indoor>0&&f.indoor<.1);f.step(120);check('indoor camera moves closer',f.indoor>.99);check('indoor camera stays on same floor',Number.isFinite(g.cam.yaw)&&f.CONTACT.position.y>.1&&f.CONTACT.position.y<.2);
   place(26.7,3.6,0);f.step(90);check('shadow follows first floor',Math.abs(f.CONTACT.position.y-3.618)<.02);
   if(mode==='reduced'){f.keys.add('KeyW');f.step(20);check('reduced motion has no extra body lean',g.kid.pose.rotation.x===0&&g.kid.pose.rotation.z===0&&g.kid.pose.scale.y===1)}
   return checks;
  },mode);assert.deepEqual(errors,[]);console.log(mode+': '+result.length+' walking presentation checks PASS');await context.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
