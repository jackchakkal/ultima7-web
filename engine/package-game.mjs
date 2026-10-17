// Package the provided installation for direct delivery by the static host.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]||path.join(project,'../STATIC'));
const output=path.join(project,'dist/game-data');
const entries=[];let offset=0;
for(const item of (await readdir(source,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
 if(!item.isFile()||/^\d+_FONTS\.VGA$/i.test(item.name))continue;
 const name=item.name.toUpperCase();
 if(!/^[A-Z0-9_.-]+$/.test(name))throw new Error(`Unsupported resource name: ${name}`);
 const data=await readFile(path.join(source,item.name));
 entries.push({name,data,offset,size:data.length});offset+=data.length;
}
if(!entries.some(x=>x.name==='FONTS.VGA')){
 const data=await readFile(path.join(project,'dist/patch/FONTS.VGA'));
 entries.push({name:'FONTS.VGA',data,offset,size:data.length});offset+=data.length;
}
const pack=Buffer.concat(entries.map(x=>x.data));
const sha256=createHash('sha256').update(pack).digest('hex');
const filename=`blackgate-${sha256.slice(0,12)}.bin`;
await mkdir(output,{recursive:true});
await writeFile(path.join(output,filename),pack);
await writeFile(path.join(output,'manifest.json'),JSON.stringify({format:'ultima7-resource-pack',version:1,revision:sha256,url:`game-data/${filename}`,bytes:pack.length,files:entries.map(({name,offset,size})=>({name,offset,size}))},null,2)+'\n');
console.log(`Packaged ${entries.length} game resources, ${pack.length} bytes, SHA-256 ${sha256}.`);
