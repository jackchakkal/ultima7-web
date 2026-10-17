// Execute the shipped WASM and resource pack; no local installation is needed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),dir=path.join(dist,'engine');
const language=process.env.U7_LANGUAGE||'pt-BR',full=process.env.U7_SMOKE_MODE==='save',musicMode=Number(process.env.U7_AUDIO_MUSIC_MODE||0),sfxMode=Number(process.env.U7_AUDIO_SFX_MODE||0);
const script=fs.readFileSync(path.join(dir,'ultima7.js'),'utf8');
const create=new Function('require','module','__filename','__dirname',script+'\nreturn createUltima7;')(require,{exports:{}},path.join(dir,'ultima7.js'),dir);
setTimeout(()=>{console.error('Timed out:',language);process.exit(1);},90000);
(async()=>{
 let module,questions=0,phase='arrival',savedBytes=0,musicEvents=0,sfxEvents=0;
 const command=(action,slot=0,title='Trinsic - investigação')=>{
  const bytes=Buffer.from(title,'latin1'),pointer=module._malloc(bytes.length+1);module.HEAPU8.set(bytes,pointer);module.HEAPU8[pointer+bytes.length]=0;
  module._web_menu_command(action,slot,pointer,2,2,2,0,0);module._free(pointer);
 };
 const openMenu=()=>module._web_key(31,115,0);
 module=await create({noInitialRun:true,locateFile:name=>path.join(dir,name),onDialog:dialog=>{
  if(!dialog){if(full&&questions>=2&&phase==='arrival'){phase='opening';setTimeout(openMenu,500);}return;}
  if(dialog.choosing){
   console.log('CHOICES',language,JSON.stringify(dialog.choices));
   if(!full){assert(dialog.choices.some(x=>/^(sim|yes|s[ií])$/i.test(x.text)));process.exit(0);}
   const index=questions++===0?0:1;setTimeout(()=>module._web_select_answer(index),50);
  }else setTimeout(()=>module._web_continue(),50);
 },onMenu:menu=>{
  if(!menu){
   if(phase==='closing'){phase='reopening';setTimeout(openMenu,350);}
   else if(phase==='loading'){console.log('PASS',language,'native save and restore returned;',savedBytes,'save bytes');process.exit(0);}
   return;
  }
  assert.equal(menu.slots.length,10);
  if(phase==='opening'){phase='saving';setTimeout(()=>command(2),50);}
  else if(phase==='saving'){
   assert.equal(menu.slots[0].title,'Trinsic - investigação');
   const file=module.FS.readdir('/game').find(x=>x.toUpperCase()==='GAME00.U7');assert(file);
   savedBytes=module.FS.stat('/game/'+file).size;assert(savedBytes>10000);
   if(process.env.U7_FIXTURE){
    const files={};const visit=directory=>{for(const name of module.FS.readdir(directory)){if(name==='.'||name==='..'||name==='STATIC')continue;const fullPath=directory+'/'+name,info=module.FS.stat(fullPath);if(module.FS.isDir(info.mode))visit(fullPath);else files[fullPath.slice(6)]=Buffer.from(module.FS.readFile(fullPath)).toString('base64');}};visit('/game');
    const output=path.join(__dirname,'../.local/verified-progress-'+language+'.json');fs.writeFileSync(output,JSON.stringify({format:'ultima7-browser-save',version:1,language,files}));
   }
   phase='closing';setTimeout(()=>command(1),50);
  }else if(phase==='reopening'){assert.equal(menu.slots[0].title,'Trinsic - investigação');phase='loading';setTimeout(()=>command(3),50);}
 },onFatal:message=>{console.error('FATAL',message);process.exit(1);},onAbort:message=>{console.error('ABORT',message);process.exit(1);}});
 module.musicMode=musicMode;module.sfxMode=sfxMode;module.playGameMusic=(track,mode)=>{musicEvents++;console.log('AUDIO MUSIC',track,mode);};module.playGameSfx=(number)=>{sfxEvents++;console.log('AUDIO SFX',number);};module.stopGameSfx=()=>{};module.setGameSfxVolume=()=>{};module.stopGameSfxAll=()=>{};module._web_set_audio_modes(musicMode,sfxMode);
 module.FS.mkdirTree('/game/STATIC');
 const manifest=JSON.parse(fs.readFileSync(path.join(dist,'game-data/manifest.json'),'utf8'));
 const pack=fs.readFileSync(path.join(dist,manifest.url));
 for(const file of manifest.files)module.FS.writeFile('/game/STATIC/'+file.name,pack.subarray(file.offset,file.offset+file.size));
 if(language!=='en')for(const file of ['USECODE','TEXT.FLX','FONTS.VGA','LINKDEP1','LINKDEP2'])module.FS.writeFile('/game/STATIC/'+file,fs.readFileSync(path.join(dist,'patch',language==='es'?'es':'',file)));
 module.FS.writeFile('/game/U7.CFG',Buffer.from('a 388\r\n220 7 1\r\n'));
 const args=new Uint8Array(16);args.set(Buffer.from('Avatar'),1);module.FS.writeFile('/game/GAMEARGS.DAT',args);
 module.callMain([]);
})();
