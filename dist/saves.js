// Saved progress outside the running engine.
//
// Each language keeps its game directory in an Emscripten IDBFS database named
// after its mount point ("/game" for pt-BR, "/profiles/<language>" for the
// others). This module reads and writes those databases directly, so the start
// page can list saved games, back them up to a .u7save file or a recovery code,
// and restore them on any browser, any device and any version of the site.
// A .u7save file is gzip-compressed JSON:
//   {format:'ultima7-browser-save', version:2, created, profiles:{<language>:{<path>:{mode,data}}}}
// Version 1 files (plain JSON with one language's {files}) are still accepted.
import {LANGUAGES as REGISTRY,storageOf,DEFAULT_LANGUAGE} from './languages.js';
export const LANGUAGES=REGISTRY.map(l=>l.code);
export const CANONICAL_HOST='ultimavii.vercel.app';
const STORE='FILE_DATA',DB_VERSION=21,DIR_MODE=0o40777,FILE_MODE=0o100666;
const mountOf=storageOf;
const kept=path=>!/^STATIC(\/|$)/i.test(path)&&!/\.\$\$\$$/.test(path)&&path!=='.resource-revision';
const validPath=path=>path.length<=200&&/^[A-Za-z0-9_.$\/-]+$/.test(path)&&path.split('/').every(part=>part&&part!=='.'&&part!=='..'&&part!=='__proto__');

function request(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function done(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);});}
async function databaseExists(name){
 if(indexedDB.databases){try{return (await indexedDB.databases()).some(db=>db.name===name);}catch{}}
 return true;
}
function open(name,create){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(name,DB_VERSION);
  r.onupgradeneeded=()=>{
   const db=r.result;
   if(!create&&!db.objectStoreNames.contains(STORE)){r.transaction.abort();return;}
   const store=db.objectStoreNames.contains(STORE)?r.transaction.objectStore(STORE):db.createObjectStore(STORE);
   if(!store.indexNames.contains('timestamp'))store.createIndex('timestamp','timestamp',{unique:false});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>create?reject(r.error):resolve(null);
 });
}

// {relative path: {mode, contents?}} for one language, without the game data.
export async function readProfile(language){
 const mount=mountOf(language);if(!await databaseExists(mount))return {};
 const db=await open(mount,false);if(!db)return {};
 try{
  if(!db.objectStoreNames.contains(STORE))return {};
  const tx=db.transaction(STORE),store=tx.objectStore(STORE),entries={};
  await new Promise((resolve,reject)=>{
   const cursor=store.openCursor();
   cursor.onsuccess=()=>{const c=cursor.result;if(!c){resolve();return;}
    const key=String(c.key);if(key.startsWith(mount+'/')){const path=key.slice(mount.length+1);if(kept(path)&&c.value&&!c.value.link)entries[path]={mode:c.value.mode,contents:c.value.contents?new Uint8Array(c.value.contents):undefined};}
    c.continue();};
   cursor.onerror=()=>reject(cursor.error);
  });
  return entries;
 }finally{db.close();}
}

// Replaces one language's saved world and slots (the game data is untouched).
export async function writeProfile(language,entries){
 const mount=mountOf(language),db=await open(mount,true);
 try{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),now=new Date();
  const keys=await request(store.getAllKeys());
  for(const key of keys){const path=String(key).startsWith(mount+'/')?String(key).slice(mount.length+1):null;if(path&&kept(path))store.delete(key);}
  const dirs=new Set();
  for(const path of Object.keys(entries)){const parts=path.split('/');for(let i=1;i<parts.length;i++)dirs.add(parts.slice(0,i).join('/'));}
  store.put({timestamp:now,mode:DIR_MODE},mount);
  for(const dir of dirs)if(!entries[dir])store.put({timestamp:now,mode:DIR_MODE},`${mount}/${dir}`);
  for(const [path,entry] of Object.entries(entries)){
   if(entry.contents)store.put({timestamp:now,mode:entry.mode||FILE_MODE,contents:entry.contents},`${mount}/${path}`);
   else store.put({timestamp:now,mode:entry.mode||DIR_MODE},`${mount}/${path}`);
  }
  await done(tx);
 }finally{db.close();}
}

const latin1=bytes=>Array.from(bytes,b=>String.fromCharCode(b)).join('');
// Saved games of one language: [{slot, title, size}] plus whether a game is in progress.
export function describeProfile(entries){
 const slots=[];
 for(const [path,entry] of Object.entries(entries)){
  const match=/^GAME(\d\d)\.U7$/i.exec(path);if(!match||!entry.contents)continue;
  const header=entry.contents.subarray(0,80),end=header.indexOf(0);
  slots.push({slot:Number(match[1]),title:latin1(end<0?header:header.subarray(0,end)).trim()||`#${Number(match[1])+1}`,size:entry.contents.length});
 }
 slots.sort((a,b)=>a.slot-b.slot);
 const inProgress=Object.keys(entries).some(path=>/^GAMEDAT\//i.test(path));
 return {slots,inProgress,empty:!slots.length&&!inProgress};
}

function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
function unbase64(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
async function gzip(text){return new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());}
// Limits for files and codes brought from elsewhere: a real backup is about 0.5 MB
// compressed and a few MB expanded.
const MAX_FILE=32*1024*1024,MAX_EXPANDED=96*1024*1024,MAX_ENTRIES=8000;
async function gunzip(bytes){
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let size=0;
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_EXPANDED){reader.cancel();throw new Error('too-large');}chunks.push(value);}
 return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}

// Every language's progress as one compressed .u7save file.
export async function exportAll(revision){
 const profiles={};
 for(const language of LANGUAGES){
  const entries=await readProfile(language);if(describeProfile(entries).empty)continue;
  profiles[language]=Object.fromEntries(Object.entries(entries).map(([path,e])=>[path,e.contents?{mode:e.mode,data:base64(e.contents)}:{mode:e.mode}]));
 }
 if(!Object.keys(profiles).length)return null;
 return gzip(JSON.stringify({format:'ultima7-browser-save',version:2,created:new Date().toISOString(),revision,profiles}));
}

// Parses a .u7save (or a version 1 .json backup) into {language: entries}.
export async function parseSave(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>MAX_FILE)throw new Error('too-large');
 const text=bytes[0]===0x1f&&bytes[1]===0x8b?await gunzip(bytes):new TextDecoder().decode(bytes);
 const data=JSON.parse(text);
 if(data?.format!=='ultima7-browser-save')throw new Error('invalid');
 let profiles;
 if(data.version===1&&data.files&&typeof data.files==='object')profiles={[LANGUAGES.includes(data.language)?data.language:DEFAULT_LANGUAGE]:Object.fromEntries(Object.entries(data.files).map(([path,value])=>[path,{data:value}]))};
 else if(data.version===2&&data.profiles&&typeof data.profiles==='object')profiles=data.profiles;
 else throw new Error('invalid');
 const result=Object.create(null);
 for(const [language,files] of Object.entries(profiles)){
  if(!LANGUAGES.includes(language)||!files||typeof files!=='object')throw new Error('invalid');
  const entries=Object.create(null);
  if(Object.keys(files).length>MAX_ENTRIES)throw new Error('invalid');
  for(const [path,entry] of Object.entries(files)){
   if(!validPath(path)||!kept(path)||!entry||typeof entry!=='object')throw new Error('invalid');
   entries[path]=typeof entry.data==='string'?{mode:FILE_MODE,contents:unbase64(entry.data)}:{mode:DIR_MODE};
  }
  if(describeProfile(entries).empty)continue;
  result[language]=entries;
 }
 if(!Object.keys(result).length)throw new Error('empty');
 return result;
}

export async function restoreAll(profiles){for(const [language,entries] of Object.entries(profiles))await writeProfile(language,entries);}

// Recovery codes (api/save.js). A code keeps pointing at the latest upload made with it.
export async function cloudAvailable(){try{const r=await fetch('api/save',{cache:'no-store'});return r.ok&&(await r.json()).enabled===true;}catch{return false;}}
export async function uploadCode(bytes,code){
 const r=await fetch(`api/save${code?`?code=${encodeURIComponent(code)}`:''}`,{method:'POST',body:bytes,headers:{'Content-Type':'application/octet-stream'}});
 const body=await r.json().catch(()=>({}));if(!r.ok||!body.code)throw new Error(body.error||'upload');return body.code;
}
export async function downloadCode(code){
 const r=await fetch(`api/save?code=${encodeURIComponent(code)}`,{cache:'no-store'});
 if(r.status===404)throw new Error('not-found');if(!r.ok)throw new Error('download');
 return new Uint8Array(await r.arrayBuffer());
}

// Asks the browser not to evict saved games under storage pressure.
export function persistStorage(){try{navigator.storage?.persist?.();}catch{}}
