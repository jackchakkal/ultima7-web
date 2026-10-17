import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {handleSaveRequest} from './lib/save-codes.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
// The same response headers as production (vercel.json), so security headers are tested locally.
const vercel=JSON.parse(await readFile(path.join(here,'vercel.json'),'utf8'));
const headerRules=vercel.headers.map(rule=>({pattern:new RegExp('^'+rule.source.replace(/[.]/g,'\\.').replace('(.*)','(.*)')+'$'),headers:rule.headers}));
const dist=path.join(here,'dist'),port=Number(process.env.U7_WEB_PORT||8077);
// Recovery codes work locally too, stored as files in .local/saves/.
const saveDir=path.join(here,'.local','saves');
const localSaves={enabled:true,async read(code){try{return await readFile(path.join(saveDir,`${code}.u7save`));}catch{return null;}},async write(code,bytes){await mkdir(saveDir,{recursive:true});await writeFile(path.join(saveDir,`${code}.u7save`),bytes);}};
const mime={'.webp':'image/webp','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.wasm':'application/wasm','.json':'application/json; charset=utf-8','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/save'){
   const body=req.method==='POST'?Buffer.concat(await Array.fromAsync(req)):undefined;
   const response=await handleSaveRequest(new Request(url,{method:req.method,headers:req.headers,body}),localSaves);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  res.setHeader('Cache-Control','no-cache');
  for(const rule of headerRules)if(rule.pattern.test(url.pathname))for(const {key,value} of rule.headers)if(key!=='Strict-Transport-Security'&&!(key==='Content-Security-Policy'))res.setHeader(key,value);
  for(const rule of headerRules)for(const {key,value} of rule.headers)if(key==='Content-Security-Policy'&&rule.pattern.test(url.pathname))res.setHeader(key,value.replace('; upgrade-insecure-requests',''));
  const decoded=decodeURIComponent(url.pathname),relative=decoded==='/'?'index.html':decoded.replace(/^\/+/, '');const full=path.resolve(dist,relative);if(!full.startsWith(dist+path.sep))throw new Error('Invalid path');
  const data=await readFile(full);res.writeHead(200,{'Content-Type':mime[path.extname(full).toLowerCase()]||'application/octet-stream','Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
 }catch(error){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Ultima VII no navegador: http://127.0.0.1:${port}`));
