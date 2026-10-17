import {language,t,applyLocale} from './locales.js';
import {endgameTexts,closingTexts} from './cutscenes.js';
import {createGameMenu} from './game-menu.js';
import {createReader} from './reader.js';
import {createInventoryLayer} from './inventory.js';
import * as saves from './saves.js';
import {languageInfo,storageOf,patchUrl} from './languages.js';
import {createPortraitCache} from './portraits.js';
const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d',{alpha:false});
const image=ctx.createImageData(320,200);
let inventory,portraitCache;
let engine,running=false,starting=false,audio,processor,audioPtr,dialogue,lastDialogKey='',lastSerial=-1,toastTimer;
let masterVolume=.6,quitRequested=false,itemCaptionTimer,musicGain;
// Default settings (JD Harding music, SoundBlaster effects, 60% volume, sharp pixels,
// 8:5 square pixels, automatic Avatar portrait). Raising DEFAULTS_VERSION applies
// new defaults once to returning players too.
const DEFAULTS_VERSION='2';
try{if(localStorage.getItem('u7-defaults')!==DEFAULTS_VERSION){for(const key of ['u7-audio-sources','u7-display','u7-volume','u7-avatar-portrait'])localStorage.removeItem(key);localStorage.setItem('u7-defaults',DEFAULTS_VERSION);}}catch{}
const audioChoices=(()=>{try{return Object.assign({music:2,sfx:1},JSON.parse(localStorage.getItem('u7-audio-sources')||'{}'));}catch{return {music:2,sfx:1};}})();
const history=[];
const reader=createReader(()=>engine?._web_continue());
let program=3;
const names={0:'Avatar',1:'Iolo',2:'Spark',11:'Petre',12:'Finnigan',13:'Gilberto',14:'Johnson',16:'Klog',17:'Chantu',18:'Dell',19:'Apollonia',20:'Markus',21:'Gargan',22:'Caroline',236:'Ellen',277:'O Guardião'};
const portraitIds=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,140,141,142,143,144,145,146,147,148,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,258,259,261,262,263,264,265,266,267,273,274,275,276,277,280,281,282,283,284,285,286,287,288,289,290,291,292,293]);
const prefs=Object.assign({font:'literary',size:28,contrast:'soft',layout:'overlay'},JSON.parse(localStorage.getItem('u7-reading')||'{}'));
function applyPrefs(){
 document.documentElement.style.setProperty('--reading',({literary:'SourceSerif,Georgia,serif',clear:'Inter,"Segoe UI",sans-serif',classic:'Georgia,serif'})[prefs.font]);
 document.documentElement.style.setProperty('--size',`${prefs.size}px`);
 document.documentElement.style.setProperty('--panel',prefs.contrast==='high'?'#080e0c':'#142321');
 $('#font-size').value=prefs.size;$('#size-value').value=`${prefs.size} px`;$('#contrast').value=prefs.contrast;
 document.querySelectorAll('[data-font]').forEach(b=>{const selected=b.dataset.font===prefs.font;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 document.querySelectorAll('[data-layout]').forEach(b=>{const selected=b.dataset.layout===prefs.layout;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 document.body.classList.toggle('overlay-dialogue',prefs.layout!=='below');
 const dialoguePanel=$('#dialogue'),world=$('.canvas-wrap');
 if(prefs.layout!=='below'){if(dialoguePanel.parentElement!==world)world.append(dialoguePanel);}
 else if(dialoguePanel.parentElement!==$('#player'))$('#stage').after(dialoguePanel);
 localStorage.setItem('u7-reading',JSON.stringify(prefs));
}
applyPrefs();
applyLocale();
const gameMenu=createGameMenu({getEngine:()=>engine,onQuit:()=>{quitRequested=true;},onSaved:()=>{if(recoveryCode)updateCode(true);else if(!savedHintShown){savedHintShown=true;setTimeout(()=>toast(t('savedHint')),1200);}}});
$('#language').onchange=()=>{if(running&&!confirm(t('changeLanguage'))){$('#language').value=language;return;}localStorage.setItem('u7-language',$('#language').value);const url=new URL(location.href);url.searchParams.set('lang',$('#language').value);location.assign(url);};
function openSettings(){
 $('#settings-music').value=audioChoices.music;$('#settings-sfx').value=audioChoices.sfx;
 $('#avatar-portrait-choice').value=localStorage.getItem('u7-avatar-portrait')||'auto';
 $('#settings-volume').value=Math.round(masterVolume*100);$('#settings-volume-value').value=`${$('#settings-volume').value}%`;
 for(const kind of ['music','speech','effects'])$(`#set-${kind}`).checked=audioSwitches[kind];
 $('#settings').showModal();
}
// Music, speech and effects switches (the original save menu's), applied by the engine at its next step.
const audioSwitches=(()=>{try{return Object.assign({music:true,speech:true,effects:true},JSON.parse(localStorage.getItem('u7-audio-switches')||'{}'));}catch{return {music:true,speech:true,effects:true};}})();
function applyAudioSwitches(){if(engine?._web_set_audio_state)engine._web_set_audio_state(audioSwitches.music?1:0,audioSwitches.speech?1:0,audioSwitches.effects?1:0);if(!audioSwitches.music&&musicSource){musicSource.stop();musicSource=null;}}
for(const kind of ['music','speech','effects'])$(`#set-${kind}`).onchange=e=>{audioSwitches[kind]=e.target.checked;localStorage.setItem('u7-audio-switches',JSON.stringify(audioSwitches));if(running)applyAudioSwitches();};
$('#open-settings').onclick=$('#player-settings').onclick=openSettings;
$('#settings-music').onchange=$('#settings-sfx').onchange=()=>{setAudioChoices(Number($('#settings-music').value),Number($('#settings-sfx').value));audio?.resume();$('#audio-status').textContent=running?'Preferência aplicada. A trilha será retomada pelo jogo.':'Preferência salva para iniciar o jogo.';};
$('#avatar-portrait-choice').onchange=e=>{localStorage.setItem('u7-avatar-portrait',e.target.value);if(dialogue)renderDialog(dialogue);};
$('#settings-volume').oninput=e=>{masterVolume=Number(e.target.value)/100;localStorage.setItem('u7-volume',e.target.value);$('#settings-volume-value').value=e.target.value+'%';if(musicGain)musicGain.gain.value=masterVolume;if(musicNode===true&&musicElement)musicElement.volume=masterVolume;};
{const stored=Number(localStorage.getItem('u7-volume'));if(Number.isFinite(stored)&&localStorage.getItem('u7-volume')!==null)masterVolume=Math.max(0,Math.min(1,stored/100));}
$('#enable-audio').onclick=async()=>{if(!audio){audio=new AudioContext({sampleRate:48000});}await audio.resume();$('#audio-status').textContent=audio.state==='running'?'Som ativado. Escolha a trilha acima.':'O navegador ainda não liberou o áudio.';};
// Display options, after Exult's video options: scaler (Exult's own scalers,
// compiled into the engine), scaler size, fill scaler, fill mode, aspect,
// gamma per channel, fades and border colour.
const SCALERS=['point','interlaced','bilinear','bilinearplus','2xsai','supereagle','super2xsai','scale2x','hq2x','hq3x','hq4x','2xbr','3xbr','4xbr'];
const DISPLAY_DEFAULTS={scaler:'point',factor:1,fill:'point',mode:'fit',aspect:'wide',gamma:[1,1,1],fades:true,border:'#060c0b'};
const display=(()=>{let stored={};try{stored=JSON.parse(localStorage.getItem('u7-display')||'{}');}catch{}
 const value=Object.assign(structuredClone(DISPLAY_DEFAULTS),stored);
 if(stored.filter==='smooth')value.fill='bilinear';if(stored.filter==='integer')value.mode='integer';delete value.filter;
 if(!SCALERS.includes(value.scaler))value.scaler='point';if(!Array.isArray(value.gamma)||value.gamma.length!==3)value.gamma=[1,1,1];
 return value;})();
let scaledImage=null,scaleFactorPtr=0;
const gammaText=value=>value.toLocaleString(language,{minimumFractionDigits:2,maximumFractionDigits:2});
function applyDisplay(){
 const body=document.body;body.dataset.fill=display.fill;body.dataset.mode=display.mode;body.dataset.aspect=display.aspect;
 $('#display-scaler').value=display.scaler;$('#display-factor').value=String(display.factor);$('#display-fill').value=display.fill;$('#display-mode').value=display.mode;$('#display-aspect').value=display.aspect;
 $('#display-factor').disabled=!['point','interlaced'].includes(display.scaler);
 ['r','g','b'].forEach((c,i)=>{$(`#gamma-${c}`).value=Math.round(display.gamma[i]*100);$(`#gamma-${c}-value`).value=gammaText(display.gamma[i]);});
 $('#display-fades').checked=display.fades;$('#display-border').value=display.border;
 const stage=$('#stage'),wrap=$('.canvas-wrap'),ratio=display.aspect==='original'?4/3:8/5;
 stage.style.background=display.border;
 if(engine)engine.noFades=!display.fades;
 if(running){
  if(display.mode==='stretch'){wrap.style.width=`${stage.clientWidth}px`;wrap.style.height=`${stage.clientHeight}px`;}
  else{
   let height=Math.min(stage.clientHeight,stage.clientWidth/ratio);
   if(display.mode==='integer'){const dpr=window.devicePixelRatio||1,width=Math.min(stage.clientWidth,height*ratio);const k=Math.max(1,Math.min(Math.floor(width*dpr/320),Math.floor(height*dpr/200)));height=Math.min(height,k*200/dpr*(display.aspect==='original'?1.2:1));}
   wrap.style.height=`${Math.min(stage.clientHeight,height)}px`;wrap.style.width=`${Math.min(stage.clientWidth,height*ratio)}px`;
  }
 }
 lastSerial=-1;
 try{localStorage.setItem('u7-display',JSON.stringify(display));}catch{}
}
$('#display-scaler').onchange=e=>{display.scaler=e.target.value;if(display.scaler==='interlaced'&&display.factor<2)display.factor=2;applyDisplay();};
$('#display-factor').onchange=e=>{display.factor=Number(e.target.value);applyDisplay();};
$('#display-fill').onchange=e=>{display.fill=e.target.value;applyDisplay();};
$('#display-mode').onchange=e=>{display.mode=e.target.value;applyDisplay();};
$('#display-aspect').onchange=e=>{display.aspect=e.target.value;applyDisplay();};
['r','g','b'].forEach((c,i)=>{$(`#gamma-${c}`).oninput=e=>{display.gamma[i]=Number(e.target.value)/100;applyDisplay();};});
$('#gamma-reset').onclick=()=>{display.gamma=[1,1,1];applyDisplay();};
$('#display-fades').onchange=e=>{display.fades=e.target.checked;applyDisplay();};
$('#display-border').oninput=e=>{display.border=e.target.value;applyDisplay();};
// Runs Exult's scaler on the current frame; returns false to use the plain path.
function drawScaled(key){
 const plain=display.scaler==='point'&&display.factor===1&&display.gamma.every(g=>g===1);
 if(plain||!engine._web_scale_frame)return false;
 scaleFactorPtr||=engine._malloc(4);
 const [gr,gg,gb]=display.gamma.map(g=>Math.round(g*1000));
 const pointer=engine._web_scale_frame(SCALERS.indexOf(display.scaler),display.factor,inventory.key,(key[0]<<16)|(key[1]<<8)|key[2],gr,gg,gb,scaleFactorPtr);
 const heap=engine.HEAPU8,factor=heap[scaleFactorPtr]|(heap[scaleFactorPtr+1]<<8),width=320*factor,height=200*factor;
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 if(!scaledImage||scaledImage.width!==width)scaledImage=ctx.createImageData(width,height);
 scaledImage.data.set(heap.subarray(pointer,pointer+width*height*4));ctx.putImageData(scaledImage,0,0);
 return true;
}
new ResizeObserver(applyDisplay).observe($('#stage'));applyDisplay();
$('#settings-fullscreen').onclick=()=>{ $('#settings').close();$('#fullscreen').click(); };
$('#cancel-target').onclick=()=>{if(engine)engine.targetCancelled=true;};
const loadedRevision=new URL(document.querySelector('script[src*="ultima7.js"]').src).searchParams.get('v');
async function checkRelease(){try{const next=await fetch('release.json',{cache:'no-store'}).then(r=>r.json());if(loadedRevision&&next.revision!==loadedRevision)$('#release-update').hidden=false;}catch{}}
checkRelease();setInterval(checkRelease,60000);
$('#reload-release').onclick=()=>{if(!running||confirm('Salvou sua partida? Atualizar a página encerra a sessão atual.'))location.reload();};
document.querySelectorAll('[data-font]').forEach(b=>b.onclick=()=>{prefs.font=b.dataset.font;applyPrefs();});
document.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>{prefs.layout=b.dataset.layout;applyPrefs();});
$('#font-size').oninput=e=>{prefs.size=Number(e.target.value);applyPrefs();};
$('#contrast').onchange=e=>{prefs.contrast=e.target.value;applyPrefs();};
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function progress(message,fraction){$('#progress').hidden=false;$('#status').textContent=message;$('.progress-track i').style.width=`${Math.round(fraction*100)}%`;}
function fatal(message){console.error(message);$('#engine-error p').textContent=message;$('#engine-error').hidden=false;$('#welcome').hidden=true;$('#player').hidden=false;running=false;}
function sync(populate=false){return new Promise((resolve,reject)=>engine.FS.syncfs(populate,error=>error?reject(error):resolve()));}
function exists(path){try{return engine.FS.stat(path).mode>0;}catch{return false;}}
function hasSavedWorld(){try{const directory=engine.FS.readdir('/game').find(name=>name.toUpperCase()==='GAMEDAT');return !!directory&&engine.FS.isDir(engine.FS.stat('/game/'+directory).mode);}catch{return false;}}
async function initialize(){
 if(engine)return;
 if(!window.createUltima7)throw new Error(t('errEngine'));
 progress(t('preparing'),.08);
 inventory??=createInventoryLayer({canvas,t,revision:loadedRevision});
 engine=await createUltima7({noInitialRun:true,locateFile:path=>`engine/${path}?v=${new URL(document.querySelector('script[src*="ultima7.js"]').src).searchParams.get('v')||'dev'}`,print:line=>console.info('[Ultima VII]',line),printErr:line=>console.warn('[Ultima VII]',line),onDialog:renderDialog,...inventory.handlers,onSign:renderSign,onMenu:gameMenu.render,onBarks:renderBarks,onItemCaption:renderItemCaption,onTarget:active=>{$('#target-prompt').hidden=!active;canvas.classList.toggle('targeting',active);},onProgram:code=>{program=code;$('#inventory').disabled=$('#save-game').disabled=code!==3;$('#place-label').textContent=code===6?t('placeIntro'):code===3?'BRITANNIA':t('placeMenu');},onFatal:fatal,onAbort:message=>fatal(String(message)),onStopped:code=>{running=false;if(quitRequested)location.reload();else toast(`Sessão encerrada (${code}). Reabra a página para continuar.`);},onSave:error=>{$('#save-state').textContent=error?'Falha ao guardar progresso':t('progress');}});
 if(language!=='en'){engine.uiTexts={0:t('menuNoGame'),1:t('menuNoName'),2:t('menuCreateFirst'),...closingTexts(language)};engine.endgameTexts=endgameTexts(language);}
 const storage=storageOf(language);
 engine.FS.mkdirTree(storage);engine.FS.mount(engine.IDBFS,{},storage);
 if(storage!=='/game')engine.FS.symlink(storage,'/game');
 await sync(true);
}
async function downloadGame(){
 const response=await fetch('game-data/manifest.json',{cache:'no-cache'});
 if(!response.ok)throw new Error(t('errData'));
 const manifest=await response.json();
 if(manifest.format!=='ultima7-resource-pack'||manifest.version!==1||!Array.isArray(manifest.files))throw new Error(t('errFormat'));
 const marker='/game/.resource-revision';
 if(exists(marker)&&engine.FS.readFile(marker,{encoding:'utf8'})===manifest.revision&&exists('/game/STATIC/SHAPES.VGA'))return;
 progress(t('downloading')+'…',.1);
 const dataResponse=await fetch(manifest.url);
 if(!dataResponse.ok)throw new Error(t('errDownload'));
 const buffer=new Uint8Array(manifest.bytes);let received=0;
 if(dataResponse.body){
  const reader=dataResponse.body.getReader();
  while(true){const {value,done}=await reader.read();if(done)break;if(received+value.length>buffer.length)throw new Error(t('errDamaged'));buffer.set(value,received);received+=value.length;progress(`${t('downloading')} · ${(received/1048576).toFixed(1)} / ${(manifest.bytes/1048576).toFixed(1)} MB`,.1+.6*received/manifest.bytes);}
 }else{const data=new Uint8Array(await dataResponse.arrayBuffer());if(data.length!==buffer.length)throw new Error(t('errIncomplete'));buffer.set(data);received=data.length;}
 if(received!==manifest.bytes)throw new Error(t('errIncomplete'));
 if(crypto.subtle){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));const hash=Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');if(hash!==manifest.revision)throw new Error(t('errDamaged'));}
 engine.FS.mkdirTree('/game/STATIC');
 for(const file of manifest.files){if(!/^[A-Z0-9_.-]+$/.test(file.name)||file.offset<0||file.size<0||file.offset+file.size>buffer.length)throw new Error(t('errDamaged'));engine.FS.writeFile(`/game/STATIC/${file.name}`,buffer.subarray(file.offset,file.offset+file.size));}
 engine.FS.writeFile(marker,manifest.revision);
}
async function applyTranslation(){
 progress(t('translation'),.8);
 for(const name of languageInfo(language).files){
  const res=await fetch(patchUrl(language,name),{cache:'no-cache'});if(!res.ok)throw new Error(`${t('translation')}: ${name}`);
  engine.FS.writeFile(`/game/STATIC/${name}`,new Uint8Array(await res.arrayBuffer()));
 }
 engine.FS.writeFile('/game/U7.CFG',new TextEncoder().encode('a 388\r\n220 7 1\r\n'));
}
async function start(startProgram=2,slot=null){
 if(starting||running)return;
 starting=true;$('#play').disabled=true;
 if(!new URLSearchParams(location.search).has('mute'))unlockMusic();
 try{
  if(!audio&&!new URLSearchParams(location.search).has('mute')){audio=new AudioContext({sampleRate:48000});await audio.resume();}
  await initialize();
  inventory.preload();
  portraitCache??=createPortraitCache({urlFor:face=>portraitIds.has(face)||face===0?portrait(face):null,revision:loadedRevision});
  for(let face=0;face<=10;face++)portraitCache.warm(face);
  await downloadGame();
  await applyTranslation();
  saves.persistStorage();
  if(Number.isInteger(slot)){engine.restoreSlot=slot;engine.FS.mkdirTree('/game/GAMEDAT');}
  else if(!hasSavedWorld()){
   const args=new Uint8Array(16);args.set(new TextEncoder().encode('Avatar'),1);engine.FS.writeFile('/game/GAMEARGS.DAT',args);
  }
  await sync();
  progress(t('portal'),1);
  $('#welcome').hidden=true;$('#player').hidden=false;document.body.classList.add('playing');
  engine.startProgram=startProgram;
  running=true;if(!new URLSearchParams(location.search).has('mute'))setupAudio();applyDisplay();draw();canvas.focus();
  engine.noFades=!display.fades;if(!audioSwitches.music||!audioSwitches.speech||!audioSwitches.effects)applyAudioSwitches();
  if(matchMedia('(pointer:coarse) and (orientation:portrait)').matches)setTimeout(()=>toast(t('rotateHint')),1500);
  engine.callMain([]);
  setInterval(()=>{if(running&&!starting)sync().catch(e=>console.warn('Save sync:',e));},15000);
  setInterval(()=>{if(running&&program===3&&engine._web_avatar_position)portraitCache.update(engine._web_avatar_position());},2500);
 }catch(error){console.error(error);progress(error.message,0);$('#play').disabled=false;}
 finally{starting=false;}
}
$('#play').onclick=()=>start(2);
$('#reload-game').onclick=()=>location.reload();
$('#original-menu').onclick=()=>start(3);
$('#continue-game').onclick=()=>start(3);
$('#new-journey').onclick=()=>$('#new-game').click();

function draw(){
 if(!engine)return;
 const serial=engine._web_frame_serial();
 if(serial!==lastSerial){
  const memory=engine.HEAPU8,pixels=engine._web_frame_ptr(),pal=engine._web_palette_ptr(),data=image.data;
  const key=inventory.frame(memory,pixels,pal),keyIndex=inventory.key;
  if(drawScaled(key)){lastSerial=serial;}else{
  if(canvas.width!==320){canvas.width=320;canvas.height=200;}
  for(let i=0,j=0;i<64000;i++,j+=4){const index=memory[pixels+i];if(index===keyIndex){data[j]=key[0];data[j+1]=key[1];data[j+2]=key[2];data[j+3]=255;continue;}const color=index*3+pal;data[j]=(memory[color]*255/63)|0;data[j+1]=(memory[color+1]*255/63)|0;data[j+2]=(memory[color+2]*255/63)|0;data[j+3]=255;}
  ctx.putImageData(image,0,0);lastSerial=serial;}
 }
 inventory.render();
 if(running)requestAnimationFrame(draw);
}
function setupAudio(){
 try{
  audio??=new AudioContext({sampleRate:48000});audio.resume();
  musicGain=audio.createGain();musicGain.gain.value=masterVolume;musicGain.connect(audio.destination);
  engine.musicMode=audioChoices.music;engine.sfxMode=audioChoices.sfx;engine._web_set_audio_modes(audioChoices.music,audioChoices.sfx);
  engine.playGameMusic=playGameMusic;engine.playGameSfx=playGameSfx;engine.stopGameSfx=stopGameSfx;engine.setGameSfxVolume=setGameSfxVolume;engine.stopGameSfxAll=stopGameSfxAll;
  processor=audio.createScriptProcessor(2048,0,2);audioPtr=engine._malloc(2048*2*4);
  processor.onaudioprocess=e=>{
   engine._web_audio(audioPtr,2048);
   const values=engine.HEAPF32,base=audioPtr>>2;
   for(let c=0;c<2;c++){const output=e.outputBuffer.getChannelData(c);for(let i=0;i<2048;i++)output[i]=values[base+i*2+c]*masterVolume;}
  };
  processor.connect(audio.destination);
 }catch(error){console.warn('Audio unavailable:',error);toast('Som indisponível neste navegador. O jogo pode continuar.');}
}

function setAudioChoices(music,sfx){
 const musicChanged=audioChoices.music!==music,sfxChanged=audioChoices.sfx!==sfx;audioChoices.music=music;audioChoices.sfx=sfx;localStorage.setItem('u7-audio-sources',JSON.stringify(audioChoices));
 if(sfxChanged){stopGameSfxAll();sfxFilePromise=null;sfxBufferCache.clear();}
 if(engine){engine.musicMode=music;engine.sfxMode=sfx;engine._web_set_audio_modes(music,sfx);if(musicChanged)playGameMusic(255,3);if(running&&musicChanged)engine._web_restart_music();}
}
let musicSource,musicTrack=-1,musicToken=0,queuedMusic=null;
async function playGameMusic(track,mode){
 if(track===255){musicToken++;queuedMusic=null;musicSource?.stop();musicSource=null;musicTrack=track;return;}
 if(mode===1&&musicSource){queuedMusic={track,mode};return;}
 startGameMusic(track,mode);
}
// Music streams through one reused <audio> element instead of decoding whole
// tracks into memory (a decoded track takes tens of megabytes on a phone).
let musicElement,musicNode;
function musicPlayer(){
 if(!musicElement){musicElement=new Audio();musicElement.preload='auto';musicElement.crossOrigin='anonymous';}
 if(!musicNode&&audio&&musicGain){try{musicNode=audio.createMediaElementSource(musicElement);musicNode.connect(musicGain);}catch(error){console.warn('Music routing:',error);musicNode=true;musicElement.volume=masterVolume;}}
 return musicElement;
}
// Mobile browsers only let media play after a tap: start the element inside the click.
function unlockMusic(){try{const element=musicPlayer();element.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';element.play().catch(()=>{});}catch{}}
function canPlay(element,url){
 return new Promise((resolve,reject)=>{
  const ok=()=>{clean();resolve();},fail=()=>{clean();reject(new Error(`Faixa indisponível: ${url}`));};
  const clean=()=>{element.removeEventListener('canplay',ok);element.removeEventListener('error',fail);};
  element.addEventListener('canplay',ok);element.addEventListener('error',fail);element.src=url;element.load();
 });
}
async function startGameMusic(track,mode){
 const token=++musicToken;musicSource?.stop();musicSource=null;musicTrack=track;
 if(!audio||!musicGain)return;
 const file=String(track).padStart(2,'0')+'bg.ogg';
 const primary=audioChoices.music===2?`audio/music/jd-hardings-remix/${file}`:`audio/music/mt32/${file}`;
 const fallback=audioChoices.music===2?`audio/music/mt32/${file}`:null;
 const element=musicPlayer();
 try{
  try{await canPlay(element,primary);}catch(error){if(!fallback)throw error;await canPlay(element,fallback);}
  if(token!==musicToken)return;
  element.onended=()=>{if(token!==musicToken)return;musicSource=null;if(queuedMusic){const next=queuedMusic;queuedMusic=null;startGameMusic(next.track,next.mode);return;}engine?._web_audio_finished();};
  musicSource={stop(){element.onended=null;element.pause();}};
  await element.play();
  $('#audio-status').textContent=`Reproduzindo ${audioChoices.music===2?'JD Harding':'MT-32'} · faixa ${track}.`;
 }catch(error){if(token!==musicToken)return;console.warn('Faixa digital indisponível:',error);$('#audio-status').textContent='Não foi possível carregar esta faixa. Verifique a conexão ou selecione OPL.';}
}
let sfxFilePromise,sfxBufferCache=new Map(),activeSfx=new Map(),sfxGeneration=0;
const sfxTokens=new Map();
async function getSfxBuffer(number){
 const key=`${audioChoices.sfx}:${number}`;if(sfxBufferCache.has(key))return sfxBufferCache.get(key);
 if(!sfxFilePromise||sfxFilePromise.mode!==audioChoices.sfx){const mode=audioChoices.sfx;sfxFilePromise=fetch(mode===1?'audio/sfx-soundblaster.flx':'audio/sfx-mt32.flx').then(r=>{if(!r.ok)throw new Error('Pacote de efeitos indisponível');return r.arrayBuffer();});sfxFilePromise.mode=mode;}
 const file=await sfxFilePromise,view=new DataView(file),count=view.getUint32(84,true);if(number<0||number>=count)throw new Error('ID de efeito inválido');
 const offset=view.getUint32(128+number*8,true),size=view.getUint32(132+number*8,true),decoded=await audio.decodeAudioData(file.slice(offset,offset+size));
 if(sfxBufferCache.size>24)sfxBufferCache.delete(sfxBufferCache.keys().next().value);sfxBufferCache.set(key,decoded);return decoded;
}
async function playGameSfx(number,volume,pan){
 if(!audio||!audioChoices.sfx)return;
 stopGameSfx(number);const token=sfxTokens.get(number),generation=sfxGeneration;try{
  const buffer=await getSfxBuffer(number);if(token!==sfxTokens.get(number)||generation!==sfxGeneration)return;const source=audio.createBufferSource(),gain=audio.createGain(),panner=audio.createStereoPanner();
  source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume/255));panner.pan.value=Math.max(-1,Math.min(1,(pan-64)/64));
  source.connect(gain).connect(panner).connect(musicGain);activeSfx.set(number,{source,gain});source.onended=()=>{if(activeSfx.get(number)?.source===source)activeSfx.delete(number);};source.start();
 }catch(error){console.warn('Efeito digital indisponível:',error);}
}
function stopGameSfx(number){sfxTokens.set(number,(sfxTokens.get(number)||0)+1);const sound=activeSfx.get(number);if(sound){try{sound.source.stop();}catch{}activeSfx.delete(number);}}
function setGameSfxVolume(number,volume){const sound=activeSfx.get(number);if(sound)sound.gain.gain.value=Math.max(0,Math.min(1,volume/255));}
function stopGameSfxAll(){sfxGeneration++;for(const number of activeSfx.keys())stopGameSfx(number);}

// FLEX and VGA shape decoding. The portrait is read from the user's own files.
function flexObject(bytes,index){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),count=view.getUint32(84,true);if(index>=count)return null;const at=128+index*8,offset=view.getUint32(at,true),size=view.getUint32(at+4,true);return bytes.subarray(offset,offset+size);}
const portraits=new Map();
function portrait(npc){
 const revision=new URL(import.meta.url).searchParams.get('v')||'dev';
 if(npc===0){const selected=localStorage.getItem('u7-avatar-portrait')||'auto',female=selected==='female'||(selected==='auto'&&engine?.avatarMale===false);const avatar=female?'avatar-female':'0';return new URL(`portraits/faces/${avatar}.webp?v=${revision}`,import.meta.url).href;}
 if(portraitIds.has(npc))return new URL(`portraits/faces/${npc}.webp?v=${revision}`,import.meta.url).href;
 if(portraits.has(npc))return portraits.get(npc);
 try{
  const file=engine.FS.readFile('/game/STATIC/FACES.VGA'),shape=flexObject(file,npc);if(!shape?.length)return null;
  const view=new DataView(shape.buffer,shape.byteOffset,shape.byteLength),offset=view.getUint32(4,true);
  const right=view.getInt16(offset,true),left=view.getInt16(offset+2,true),above=view.getInt16(offset+4,true),below=view.getInt16(offset+6,true);
  const w=left+right+1,h=above+below+1;if(w<1||h<1||w>256||h>256)return null;
  const pic=document.createElement('canvas');pic.width=w;pic.height=h;const pc=pic.getContext('2d'),image=pc.createImageData(w,h);
  const palette=flexObject(engine.FS.readFile('/game/STATIC/PALETTES.FLX'),0);
  let p=offset+8;
  function pixel(x,y,color){const i=((y+above)*w+x+left)*4;if(color===255||i<0||i+3>=image.data.length)return;image.data[i]=palette[color*3]*255/63;image.data[i+1]=palette[color*3+1]*255/63;image.data[i+2]=palette[color*3+2]*255/63;image.data[i+3]=255;}
  while(p+2<=shape.length){const count=view.getUint16(p,true);p+=2;if(!count)break;let x=view.getInt16(p,true),y=view.getInt16(p+2,true);p+=4;let remaining=count>>1;
   if(!(count&1)){for(let k=0;k<remaining;k++)pixel(x++,y,shape[p++]);}
   else while(remaining>0){const run=shape[p++],n=run>>1;if(!n)break;if(run&1){const color=shape[p++];for(let k=0;k<n;k++)pixel(x++,y,color);}else for(let k=0;k<n;k++)pixel(x++,y,shape[p++]);remaining-=n;}
  }
  pc.putImageData(image,0,0);const url=pic.toDataURL();portraits.set(npc,url);return url;
 }catch(error){console.warn('Portrait:',error);return null;}
}
function renderDialog(state){
 if(state?.mode>=2){dialogue=state;$('#dialogue').hidden=true;$('#world-labels').replaceChildren();$('#item-caption').hidden=true;reader.show(state);return;}
 reader.show(null);
 dialogue=state;$('#dialogue').hidden=!state;document.body.classList.toggle('reading',!!state);
 $('#inventory').disabled=!!state||program!==3;$('#save-game').disabled=!!state||program!==3;
 if(!state)return;
 const box=state.boxes.find(x=>x.slot===state.speaker&&x.text)||state.boxes.filter(x=>x.text).at(-1);
 const text=(box?.text||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
 const npc=box?.npc??-1;
 const speaker=state.mode>=2?t('bookSpeaker'):(npc===277?t('guardian'):names[npc]||t('resident'));
 $('#speaker').textContent=speaker;$('#page-kind').textContent=state.mode>=2?t('books'):t('conversation');
 if($('#speech').textContent!==text){$('#speech').textContent=text;$('#speech').scrollTop=0;}
 const url=npc>=0&&state.mode===1?portrait(npc):null;
 $('#portrait').hidden=!url;$('#portrait-fallback').hidden=!!url;if(url)$('#portrait').src=url;
 const avatarUrl=state.mode===1?portrait(0):null;
 $('#avatar-portrait').hidden=!avatarUrl;$('#avatar-portrait-fallback').hidden=!!avatarUrl;if(avatarUrl)$('#avatar-portrait').src=avatarUrl;
 const choices=$('#choices');choices.replaceChildren();
 for(const choice of state.choices){const button=document.createElement('button');if(choice.index<9){const key=document.createElement('kbd');key.textContent=choice.index+1;button.append(key);}button.append(document.createTextNode(choice.text));button.onclick=()=>{engine._web_select_answer(choice.index);for(const b of choices.children)b.disabled=true;};choices.append(button);}
 $('#continue').hidden=state.choosing;
 $('#continue').disabled=false;
 const key=`${speaker}|${text}`;
 if(text&&key!==lastDialogKey){history.push({speaker,text});lastDialogKey=key;}
}
function renderBarks(items){
 const labels=$('#world-labels');labels.replaceChildren();
 if(dialogue)return;
 const occupied=[],seen=new Set(),width=labels.clientWidth,height=labels.clientHeight;
 for(const item of items){
  if(item.x<0||item.x>319||item.y<0||item.y>199||seen.has(`${item.text}:${item.x}:${item.y}`))continue;
  seen.add(`${item.text}:${item.x}:${item.y}`);const label=document.createElement('span');label.className='world-label';label.textContent=item.text;labels.append(label);
  const w=label.offsetWidth,h=label.offsetHeight;let x=Math.max(0,Math.min(width-w,item.x*width/320)),y=Math.max(0,Math.min(height-h,item.y*height/200));
  const candidates=[y,...occupied.flatMap(r=>[r.y-h-5,r.y+r.h+5])];
  const free=candidates.find(at=>at>=0&&at+h<=height&&!occupied.some(r=>x<r.x+r.w+4&&x+w+4>r.x&&at<r.y+r.h+4&&at+h+4>r.y));
  if(free===undefined){label.remove();continue;}y=free;
  label.style.left=`${x}px`;label.style.top=`${y}px`;occupied.push({x,y,w,h});
 }
}
function renderItemCaption(item){
 const label=$('#item-caption');
 if(!item?.text){label.hidden=true;return;}
 label.textContent=item.text;
 label.style.left=`${Math.max(0,Math.min(319,item.x))/3.2}%`;
 label.style.top=`${Math.max(0,Math.min(199,item.y))/2}%`;
 label.hidden=false;
 clearTimeout(itemCaptionTimer);
 itemCaptionTimer=setTimeout(()=>{label.hidden=true;},2200);
}
function continueDialogue(){if(!engine||$('#continue').disabled)return;$('#continue').disabled=true;engine._web_continue();}
$('#continue').onclick=continueDialogue;
$('#journal').onclick=()=>{
 const entries=$('#journal-entries');if(history.length)entries.replaceChildren();
 for(const item of history){const entry=document.createElement('article');entry.className='journal-entry';const name=document.createElement('strong');name.textContent=item.speaker;const text=document.createElement('p');text.textContent=item.text;entry.append(name,text);entries.append(entry);}
 $('#journal-panel').showModal();entries.scrollTop=entries.scrollHeight;
};
$('#close-journal').onclick=()=>$('#journal-panel').close();

const scans={Escape:1,Digit1:2,Digit2:3,Digit3:4,Digit4:5,Digit5:6,Digit6:7,Digit7:8,Digit8:9,Digit9:10,Digit0:11,Minus:12,Equal:13,Backspace:14,Tab:15,KeyQ:16,KeyW:17,KeyE:18,KeyR:19,KeyT:20,KeyY:21,KeyU:22,KeyI:23,KeyO:24,KeyP:25,BracketLeft:26,BracketRight:27,Enter:28,KeyA:30,KeyS:31,KeyD:32,KeyF:33,KeyG:34,KeyH:35,KeyJ:36,KeyK:37,KeyL:38,Semicolon:39,Quote:40,Backquote:41,Backslash:43,KeyZ:44,KeyX:45,KeyC:46,KeyV:47,KeyB:48,KeyN:49,KeyM:50,Comma:51,Period:52,Slash:53,Space:57,Home:71,ArrowUp:72,PageUp:73,ArrowLeft:75,ArrowRight:77,End:79,ArrowDown:80,PageDown:81,Insert:82,Delete:83};
for(let i=1;i<=10;i++)scans[`F${i}`]=58+i;
function sendKey(code,key,mod=0){if(!running)return;let ascii=key.length===1?key.charCodeAt(0):({Enter:13,Escape:27,Backspace:8,Tab:9})[code]||0;engine._web_key(scans[code]||0,mod&8?0:ascii,mod);}
window.addEventListener('keydown',e=>{
 if(!running||document.querySelector('dialog[open]')||e.metaKey)return;
 if(e.key==='Tab'||(e.target.closest?.('button,a,input,select,textarea')&&(e.key==='Enter'||e.key===' ')))return;
 if(dialogue){if(dialogue.choosing&&/^[1-9]$/.test(e.key)){const button=$('#choices').children[Number(e.key)-1];if(button&&!button.disabled)button.click();e.preventDefault();return;}if(!dialogue.choosing&&(e.key==='Enter'||e.key===' ')){continueDialogue();e.preventDefault();return;}}
 if(dialogue){if(scans[e.code])e.preventDefault();return;}
 if(scans[e.code]){e.preventDefault();let mod=(e.shiftKey?3:0)|(e.ctrlKey?4:0)|(e.altKey?8:0);let key=e.ctrlKey&&e.key.length===1?String.fromCharCode(e.key.toUpperCase().charCodeAt(0)-64):e.key;sendKey(e.code,key,mod);}
});
let buttons=0;
function mouse(e,mask){if(!running)return;const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(319,Math.floor((e.clientX-r.left)/r.width*320))),y=Math.max(0,Math.min(199,Math.floor((e.clientY-r.top)/r.height*200)));engine._web_mouse(x,y,buttons,mask);}
// Touch: a tap is a left click (two quick taps interact), touch-and-hold walks
// toward the finger (the right button), dragging right away moves items and windows.
const touch={id:null,mode:null,x:0,y:0,timer:0,last:null};
function touchDown(e){
 Object.assign(touch,{id:e.pointerId,mode:null,x:e.clientX,y:e.clientY,last:e});
 clearTimeout(touch.timer);touch.timer=setTimeout(()=>{if(touch.id===e.pointerId&&!touch.mode){touch.mode='walk';buttons|=2;mouse(touch.last,8);navigator.vibrate?.(12);}},280);
}
function touchMove(e){
 if(e.pointerId!==touch.id)return;touch.last=e;
 if(!touch.mode&&Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>9){clearTimeout(touch.timer);touch.mode='drag';buttons|=1;mouse({clientX:touch.x,clientY:touch.y},2);}
 if(touch.mode)mouse(e,1);
}
function touchUp(e){
 if(e.pointerId!==touch.id)return;clearTimeout(touch.timer);
 if(touch.mode==='walk'){buttons&=~2;mouse(e,16);}
 else if(touch.mode==='drag'){buttons&=~1;mouse(e,4);}
 else{mouse(e,1);buttons|=1;mouse(e,2);setTimeout(()=>{buttons&=~1;mouse(e,4);},40);}
 touch.id=null;touch.mode=null;
}
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onpointermove=e=>{if(e.pointerType==='touch')touchMove(e);else mouse(e,1);};
canvas.onpointerdown=e=>{e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);if(audio?.state==='suspended')audio.resume();
 if(e.pointerType==='touch'){touchDown(e);return;}
 if(e.button===0)buttons|=1;if(e.button===2)buttons|=2;mouse(e,e.button===2?8:2);};
canvas.onpointerup=canvas.onpointercancel=e=>{if(e.pointerType==='touch'){touchUp(e);return;}if(e.button===0)buttons&=~1;if(e.button===2)buttons&=~2;mouse(e,e.button===2?16:4);};
$('#inventory').onclick=()=>sendKey('KeyI','i');
$('#save-game').onclick=()=>sendKey('KeyS','s');
$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('#player').requestFullscreen();
window.addEventListener('blur',()=>{buttons=0;if(running)engine._web_mouse(160,100,0,4|16);});

// Saved progress: start page, load panel, .u7save files and recovery codes (saves.js).
let recoveryCode=localStorage.getItem('u7-recovery-code')||'',cloud=null,savedHintShown=false;
// The one older address allowed to hand progress over to the official one.
const MOVE_SOURCE='https://ultima7-ptbr-web.vercel.app';
async function profileInfo(lang=language){try{return saves.describeProfile(await saves.readProfile(lang));}catch(error){console.warn('Saved games:',error);return {slots:[],inProgress:false,empty:true};}}
async function anyProgress(){for(const lang of saves.LANGUAGES)if(!(await profileInfo(lang)).empty)return true;return false;}
async function refreshWelcome(){
 const info=await profileInfo();
 $('#continue-game').hidden=!info.inProgress;
 $('#play').classList.toggle('primary',!info.inProgress);$('#play').classList.toggle('secondary',info.inProgress);
 $('#original-menu').hidden=info.inProgress;$('#new-journey').hidden=!info.inProgress;
 return info;
}
async function exportBytes(){if(engine&&running)await sync();return saves.exportAll(loadedRevision);}
function showCode(){
 for(const [box,button] of [[$('#code-result'),$('#make-code')],[$('#menu-code-result'),$('#menu-code')]]){
  box.hidden=!recoveryCode;if(!recoveryCode)continue;
  const span=box.querySelector('span'),[before,after]=t('codeReady',{code:'\u0000'}).split('\u0000'),strong=document.createElement('strong');
  strong.textContent=recoveryCode;span.replaceChildren(before,strong,after);button.textContent=t('updateCode');
 }
}
async function downloadProgress(){
 const bytes=await exportBytes();if(!bytes){toast(t('nothingToSave'));return;}
 const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
 link.download=`ultima7-${new Date().toISOString().slice(0,10)}.u7save`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000);toast(t('exported'));
}
async function updateCode(quiet=false){
 const bytes=await exportBytes();if(!bytes){if(!quiet)toast(t('nothingToSave'));return;}
 cloud??=await saves.cloudAvailable();if(!cloud){if(!quiet)$('#load-status').textContent=t('codeUnavailable');return;}
 try{recoveryCode=await saves.uploadCode(bytes,recoveryCode||undefined);localStorage.setItem('u7-recovery-code',recoveryCode);showCode();}
 catch(error){console.warn('Recovery code:',error);if(!quiet)$('#load-status').textContent=t('codeFailed');}
}
// Writes brought progress into this browser. The engine must not be holding an older copy.
async function importBytes(bytes){
 let profiles;try{profiles=await saves.parseSave(bytes);}catch{throw new Error(t('invalidSave'));}
 let existing=false;for(const lang of Object.keys(profiles))if(!(await profileInfo(lang)).empty)existing=true;
 if(existing&&!confirm(t('restoreConfirm')))return false;
 running=false;await saves.restoreAll(profiles);
 if(engine){location.reload();return true;}
 toast(t('restored'));await openLoadPanel();return true;
}
async function openLoadPanel(){
 const info=await refreshWelcome(),list=$('#load-slots');list.replaceChildren();
 const add=(number,title,note,action)=>{const button=document.createElement('button');button.type='button';
  const n=document.createElement('span');n.className='slot-number';n.textContent=number;
  const d=document.createElement('span');d.className='slot-description';const strong=document.createElement('strong');strong.textContent=title;const small=document.createElement('small');small.textContent=note;d.append(strong,small);
  button.append(n,d);button.onclick=action;list.append(button);};
 const launch=slot=>()=>{$('#load-panel').close();start(3,slot);};
 if(info.inProgress)add('▸',t('inProgress'),t('inProgressNote'),launch(null));
 for(const slot of info.slots)add(String(slot.slot+1).padStart(2,'0'),slot.title,t('slotSize',{size:Math.max(1,Math.round(slot.size/1024))}),launch(slot.slot));
 if(!info.inProgress&&!info.slots.length){const p=document.createElement('p');p.className='empty';p.textContent=t('noSaves');list.append(p);}
 $('#load-status').textContent='';showCode();
 if(!$('#load-panel').open)$('#load-panel').showModal();
}
$('#load-game').onclick=()=>openLoadPanel();
$('#close-load').onclick=()=>$('#load-panel').close();
$('#load-file').onclick=$('#import-save').onclick=()=>$('#save-input').click();
$('#download-save').onclick=$('#export-save').onclick=()=>downloadProgress().catch(error=>toast(error.message));
$('#make-code').onclick=()=>updateCode();
// The same backups from inside the game's save menu.
$('#menu-download').onclick=()=>downloadProgress().catch(error=>toast(error.message));
$('#menu-code').onclick=async()=>{await updateCode();if(!recoveryCode)$('#menu-status').textContent=$('#load-status').textContent||t('codeFailed');};
$('#menu-copy-code').onclick=()=>navigator.clipboard?.writeText(recoveryCode).then(()=>toast(t('codeCopied')));
$('#menu-import').onclick=()=>$('#save-input').click();
showCode();
$('#menu-code-form').onsubmit=async event=>{event.preventDefault();$('#code-input').value=$('#menu-code-input').value;$('#code-form').requestSubmit();};
$('#copy-code').onclick=()=>navigator.clipboard?.writeText(recoveryCode).then(()=>toast(t('codeCopied')));
$('#code-form').onsubmit=async event=>{
 event.preventDefault();const code=$('#code-input').value.toUpperCase().replace(/[^0-9A-Z]/g,'');
 try{const bytes=await saves.downloadCode(code);if(await importBytes(bytes)){recoveryCode=code.replace(/(.{4})(?=.)/g,'$1-');localStorage.setItem('u7-recovery-code',recoveryCode);showCode();}}
 catch(error){const message=error.message==='not-found'||error.message==='download'?t('codeNotFound'):error.message;$('#load-status').textContent=message;if(running)$('#menu-status').textContent=message;}
};
$('#save-input').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 try{await importBytes(new Uint8Array(await file.arrayBuffer()));}catch(error){toast(error.message);}
};
// The game moved to one address; progress left on another address can follow it.
async function checkHost(){
 const host=location.hostname,params=new URLSearchParams(location.search);
 if(params.has('receive-progress')&&window.opener){
  toast(t('receiving'));
  const opener=window.opener;
  window.addEventListener('message',async function receive(event){
   if(event.origin!==MOVE_SOURCE||event.source!==opener||event.data?.type!=='u7-progress'||!(event.data.bytes instanceof Uint8Array))return;
   window.removeEventListener('message',receive);
   if(!confirm(t('receiveConfirm',{host:new URL(event.origin).host})))return;
   try{await importBytes(event.data.bytes);event.source.postMessage({type:'u7-received'},event.origin);}catch(error){toast(error.message);}
   history.replaceState(null,'',`${location.pathname}?lang=${language}`);
  });
  opener.postMessage({type:'u7-ready'},MOVE_SOURCE);return;
 }
 // Older addresses of the site (ultima7-ptbr-web*.vercel.app) send players to the official one;
 // ?stay keeps a preview deployment where it is.
 if(!host.endsWith('.vercel.app')||host===saves.CANONICAL_HOST||!host.startsWith('ultima7-ptbr-web')||params.has('stay'))return;
 const target=`https://${saves.CANONICAL_HOST}/${location.search}`;
 if(!await anyProgress()){location.replace(target);return;}
 if(location.origin!==MOVE_SOURCE){$('#host-move p').textContent=t('movedTitle',{host:saves.CANONICAL_HOST});$('#move-progress').textContent=t('downloadSave');$('#move-progress').onclick=()=>downloadProgress();$('#host-move').hidden=false;return;}
 $('#host-move p').textContent=t('movedTitle',{host:saves.CANONICAL_HOST});$('#host-move').hidden=false;
 $('#move-progress').onclick=async()=>{
  const bytes=await saves.exportAll(loadedRevision),origin=`https://${saves.CANONICAL_HOST}`;
  const win=window.open(`${origin}/?receive-progress=1&lang=${language}`,'_blank');if(!win){toast(t('moveBlocked'));return;}
  const onMessage=event=>{if(event.origin!==origin)return;
   if(event.data?.type==='u7-ready')win.postMessage({type:'u7-progress',bytes},origin);
   if(event.data?.type==='u7-received'){toast(t('moveDone'));window.removeEventListener('message',onMessage);}};
  window.addEventListener('message',onMessage);
 };
}
refreshWelcome();checkHost();
$('#new-game').onclick=async()=>{
 if(!confirm(t('newGameConfirm')))return;
 await initialize();const args=new Uint8Array(16);args.set(new TextEncoder().encode('Avatar'),1);engine.FS.writeFile('/game/GAMEARGS.DAT',args);await sync();location.reload();
};
window.addEventListener('beforeunload',()=>{if(engine&&running)engine._web_save_sync();});
window.addEventListener('error',event=>{if(running&&/ultima7\.wasm/.test(event.error?.stack||''))fatal('O motor encontrou um erro. Informe a versão exibida no topo e a ação realizada.\n'+event.message);});

// Signs, tombstones and plaques are drawn in Britannian runes; show a readable transcription.
const RUNE_LIGATURES={'(':'th',',':'st',')':'ee','+':'ea','*':'ng','|':' ','~':''};
function renderSign(sign){
 const box=$('#sign-reading');
 if(!sign||!sign.lines.some(line=>/[a-zà-ú]/.test(line))){box.hidden=true;return;}
 const lines=sign.lines.map(line=>line.replace(/[(,)+*|~]/g,c=>RUNE_LIGATURES[c]).replace(/\s+/g,' ').trim()).filter(Boolean);
 if(lines.length)lines[0]=lines[0][0].toLocaleUpperCase()+lines[0].slice(1);
 box.querySelector('h3').textContent=t('signReading');box.querySelector('small').textContent=t('signClose');
 box.querySelector('p').replaceChildren(...lines.flatMap((line,i)=>i?[document.createElement('br'),line]:[line]));
 box.hidden=false;
}
