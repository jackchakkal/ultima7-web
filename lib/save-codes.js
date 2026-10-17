// Recovery codes for saved progress: the page uploads a compressed .u7save
// file and gets a short code it can type on any browser or device.
// Shared by the Vercel Function (api/save.js) and the local server.
import {gunzipSync} from 'node:zlib';

// A real backup is about 0.5 MB compressed; Vercel Functions accept up to 4.5 MB.
const LIMIT=4*1024*1024,EXPANDED_LIMIT=64*1024*1024;
const ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O, 1/I/L confusion
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});

export function newCode(){
 const bytes=crypto.getRandomValues(new Uint8Array(12));
 return Array.from(bytes,b=>ALPHABET[b&31]).join('');
}
export function normalizeCode(value){
 const code=String(value||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
 return /^[2-9A-HJ-NP-Z]{12}$/.test(code)?code:null;
}
// Only the page's own backups are stored: gzip-compressed JSON in the
// ultima7-browser-save format, expanded with a size cap.
function isBackup(bytes){
 if(bytes[0]!==0x1f||bytes[1]!==0x8b)return false;
 try{
  const data=JSON.parse(gunzipSync(bytes,{maxOutputLength:EXPANDED_LIMIT}).toString('utf8'));
  return data?.format==='ultima7-browser-save'&&(data.version===1||data.version===2)&&typeof (data.profiles||data.files)==='object';
 }catch{return false;}
}
export const formatCode=code=>code.replace(/(.{4})(?=.)/g,'$1-');

// store: {enabled, read(code) -> ReadableStream|Uint8Array|null, write(code, bytes)}
export async function handleSaveRequest(request,store){
 const url=new URL(request.url);
 if(request.method==='GET'&&!url.searchParams.has('code'))return json({enabled:store.enabled});
 if(!store.enabled)return json({error:'disabled'},503);
 if(request.method==='GET'){
  const code=normalizeCode(url.searchParams.get('code'));if(!code)return json({error:'invalid-code'},400);
  const body=await store.read(code);if(!body)return json({error:'not-found'},404);
  return new Response(body,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store'}});
 }
 if(request.method==='POST'){
  const length=Number(request.headers.get('content-length')||0);if(length>LIMIT)return json({error:'too-large'},413);
  const bytes=new Uint8Array(await request.arrayBuffer());
  if(bytes.length<20||bytes.length>LIMIT||!isBackup(bytes))return json({error:'invalid-file'},400);
  const requested=url.searchParams.get('code'),code=requested?normalizeCode(requested):newCode();if(!code)return json({error:'invalid-code'},400);
  await store.write(code,bytes);
  return json({code:formatCode(code)});
 }
 return json({error:'method'},405);
}
