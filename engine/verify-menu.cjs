const fs=require('node:fs'),path=require('node:path');
const dist=path.resolve(__dirname,'../dist'),dir=path.join(dist,'engine');
const script=fs.readFileSync(path.join(dir,'ultima7.js'),'utf8');
const create=new Function('require','module','__filename','__dirname',script+'\nreturn createUltima7;')(require,{exports:{}},path.join(dir,'ultima7.js'),dir);
setTimeout(()=>{console.error('Menu timeout');process.exit(1);},60000);
(async()=>{
 let introSeen=false;
 const m=await create({noInitialRun:true,locateFile:name=>path.join(dir,name),startProgram:2,onProgram:code=>{
  console.log('PROGRAM',code);
  if(code===6){introSeen=true;setTimeout(()=>m._web_key(1,27,0),6000);}
  if(code===2&&introSeen){console.log('PASS native menu -> introduction -> menu');process.exit(0);}
 },printErr:console.error});
 m.FS.mkdirTree('/game/STATIC');
 const manifest=JSON.parse(fs.readFileSync(path.join(dist,'game-data/manifest.json'))),pack=fs.readFileSync(path.join(dist,manifest.url));
 for(const f of manifest.files)m.FS.writeFile('/game/STATIC/'+f.name,pack.subarray(f.offset,f.offset+f.size));
 m.FS.writeFile('/game/U7.CFG',Buffer.from('a 388\r\n220 7 1\r\n'));
 const out=m._malloc(16384);setInterval(()=>m._web_audio(out,2048),43);
 setTimeout(()=>m._web_key(57,32,0),1500);
 setTimeout(()=>m._web_mouse(159,132,1,2),5000);
 setTimeout(()=>m._web_mouse(159,132,0,4),5100);
 m.callMain([]);
})();
