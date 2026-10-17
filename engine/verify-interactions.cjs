const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),dir=path.join(root,'.local/test-engine');
const create=new Function('require','module','__filename','__dirname',fs.readFileSync(path.join(dir,'ultima7.js'),'utf8')+'\nreturn createUltima7;')(require,{exports:{}},path.join(dir,'ultima7.js'),dir);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let engine,ready,stage=0,targetCount=0,documentSeen=false,started=0,lastFood=0,lastHp=0,clock;
const click=async(x,y,double=false)=>{engine._web_mouse(x,y,0,1);await sleep(35);for(let i=0;i<(double?2:1);i++){engine._web_mouse(x,y,1,2);await sleep(45);engine._web_mouse(x,y,0,4);await sleep(65);}};
function next(){clearTimeout(clock);stage=Math.abs(stage)+1;if(stage>4){console.log('PASS food, healing potion, complete multi-part book and scroll, real double-click input and target selection');process.exit(0);}documentSeen=false;engine.probeCommand=stage;clock=setTimeout(()=>{console.error('FAIL stage',stage,'targetCount',targetCount,'food',lastFood,'hp',lastHp);process.exit(1);},15000);}
(async()=>{
engine=await create({noInitialRun:true,locateFile:name=>path.join(dir,name),print:()=>{},onStage:stage=>{if(stage==='MainGameLoop')setTimeout(next,1200);},onProbe:event=>{
 if(event.kind==='ready'){
  ready=event;assert(event.x>=0&&event.ax>=0,JSON.stringify(event));console.log('CLICK',event);
  const files={};function visit(dir){for(const name of engine.FS.readdir(dir)){if(name==='.'||name==='..'||name==='STATIC')continue;const full=dir+'/'+name,stat=engine.FS.stat(full);if(engine.FS.isDir(stat.mode))visit(full);else files[full.slice(6)]=Buffer.from(engine.FS.readFile(full)).toString('base64');}}visit('/game');
  fs.writeFileSync(path.join(root,`.local/probe-save-${stage}.json`),JSON.stringify({format:'ultima7-browser-save',version:1,language:'pt-BR',files}));
  started=Date.now();click(event.x,event.y,true);
 }
 if(event.kind==='target'){console.log('TARGET POINT',event);setTimeout(()=>click(event.ax,event.ay),180);}
 if(event.kind==='picked'){console.log('PICKED',event);assert.equal(event.item,event.avatar);}
 if(event.kind==='tick'&&event.stage===stage){lastFood=event.food;lastHp=event.hp;if((stage===1&&event.food>0)||(stage===2&&event.hp>3)||((stage===3||stage===4)&&documentSeen)){console.log('RESULT',stage,Date.now()-started,'ms',event);setTimeout(next,300);stage=-stage;}}
},onTarget:active=>{console.log('TARGET',stage,active);if(active)targetCount++;},onDialog:state=>{
 if(!state)return;
 if(state.mode>=2&&state.document){console.log('DOCUMENT',stage,state.document.length,state.document.slice(0,70));
  if(stage===3){assert(state.document.includes('ALAGNER')||/Alagner/i.test(state.document));assert(state.document.length>3500);assert(/Guardian|Guardião/.test(state.document));}
  if(stage===4){assert(/Chuckles/.test(state.document));assert(/Margareta/.test(state.document));assert(state.document.length>600);}
  documentSeen=true;setTimeout(()=>engine._web_continue(),300);
  fs.writeFileSync(path.join(root,`.local/document-${stage}.json`),JSON.stringify(state));
 }else if(state.mode===1){if(state.choosing)setTimeout(()=>engine._web_select_answer(1),30);else setTimeout(()=>engine._web_continue(),30);}
},onFatal:message=>{throw new Error(message);}});
const audioBuffer=engine._malloc(2048*8);setInterval(()=>engine._web_audio(audioBuffer,2048),43);
engine.FS.mkdirTree('/game/STATIC');const manifest=JSON.parse(fs.readFileSync(path.join(dist,'game-data/manifest.json'))),pack=fs.readFileSync(path.join(dist,manifest.url));for(const file of manifest.files)engine.FS.writeFile('/game/STATIC/'+file.name,pack.subarray(file.offset,file.offset+file.size));
for(const file of ['USECODE','TEXT.FLX','FONTS.VGA','LINKDEP1','LINKDEP2'])engine.FS.writeFile('/game/STATIC/'+file,fs.readFileSync(path.join(dist,'patch',file)));
const save=JSON.parse(fs.readFileSync(path.join(root,'.local/verified-progress-pt-BR.json')));for(const [name,data]of Object.entries(save.files)){if(name.toUpperCase()==='GAMEARGS.DAT')continue;engine.FS.mkdirTree(path.posix.dirname('/game/'+name));engine.FS.writeFile('/game/'+name,Buffer.from(data,'base64'));}
engine.FS.writeFile('/game/U7.CFG',Buffer.from('a 388\r\n220 7 1\r\n'));engine.callMain([]);
})();
