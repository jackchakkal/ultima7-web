import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(project,'dist');
// The public repository has no game data, audio or engine build: it checks the
// code and the project's own art only. The deployment must have everything.
const exists=file=>stat(path.join(dist,file)).then(()=>true,()=>false);
const full_release=await exists('game-data/manifest.json');
assert(full_release||!process.env.VERCEL,'Deployment without game data');
const player=await readFile(path.join(dist,'app.js'),'utf8'),html=await readFile(path.join(dist,'index.html'),'utf8');
const inventoryJs=await readFile(path.join(dist,'inventory.js'),'utf8');
let manifest,pack,engineJs='';
if(full_release){
manifest=JSON.parse(await readFile(path.join(dist,'game-data/manifest.json'),'utf8'));
assert.equal(manifest.format,'ultima7-resource-pack');assert.equal(manifest.version,1);
const full=path.resolve(dist,manifest.url);assert(full.startsWith(dist+path.sep));
pack=await readFile(full);assert.equal(pack.length,manifest.bytes);
assert.equal(createHash('sha256').update(pack).digest('hex'),manifest.revision);
const names=new Set();let offset=0;
for(const file of manifest.files){assert(/^[A-Z0-9_.-]+$/.test(file.name));assert(!names.has(file.name));names.add(file.name);assert.equal(file.offset,offset);assert(Number.isInteger(file.size)&&file.size>0);offset+=file.size;}
assert.equal(offset,pack.length);
for(const name of ['SHAPES.VGA','U7MAP','U7CHUNKS','FACES.VGA','GUMPS.VGA','INITGAME.DAT','USECODE','LINKDEP1','LINKDEP2','FONTS.VGA','TEXT.FLX','PALETTES.FLX','ENDGAME.DAT'])assert(names.has(name),`Missing game resource: ${name}`);
for(const file of ['engine/ultima7.js','engine/ultima7.wasm','fonts/Inter.ttf','fonts/SourceSerif4.ttf','patch/USECODE','patch/FONTS.VGA','patch/TEXT.FLX','patch/LINKDEP1','patch/LINKDEP2','patch/MAINSHP.FLX','patch/ENDSHAPE.FLX','patch/GUMPS.VGA','patch/es/GUMPS.VGA','patch/es/MAINSHP.FLX','patch/POINTERS.SHP','patch/es/POINTERS.SHP','portraits/iolo.webp','portraits/apollonia.webp','portraits/finnigan.webp',...['57','58','59','60','61','62','63','65','66','67','68'].map(id=>`inventory/${id}.webp`)])assert((await stat(path.join(dist,file))).size>0,`Missing release asset: ${file}`);
for(const file of ['locales.js','game-menu.js','cutscenes.js','inventory.js','saves.js','languages.js','languages.js','portraits.js','portraits/regions.json','inventory/panels.json','patch/en/GUMPS.VGA','patch/es/USECODE','patch/es/FONTS.VGA','patch/es/TEXT.FLX','patch/es/LINKDEP1','patch/es/LINKDEP2'])assert((await stat(path.join(dist,file))).size>0,`Missing language or menu asset: ${file}`);
for(const file of ['audio/sfx-soundblaster.flx','audio/sfx-mt32.flx','audio/music/mt32/00bg.ogg','audio/music/jd-hardings-remix/00bg.ogg'])assert((await stat(path.join(dist,file))).size>0,`Missing audio source: ${file}`);
for(const file of ['sfx-soundblaster.flx','sfx-mt32.flx']){const bytes=await readFile(path.join(dist,'audio',file));const count=bytes.readUInt32LE(84);assert(count>=115,`Incomplete SFX pack: ${file}`);for(let i=0;i<115;i++){const offset=bytes.readUInt32LE(128+i*8),size=bytes.readUInt32LE(132+i*8);assert.equal(bytes.toString('ascii',offset,offset+4),'RIFF',`Invalid WAV record ${i} in ${file}`);assert(bytes.subarray(offset,offset+size).includes(Buffer.from('WAVE')));}}
assert((await stat(path.join(dist,'audio/music/mt32/00bg.ogg'))).size>10000);assert((await stat(path.join(dist,'audio/music/jd-hardings-remix/00bg.ogg'))).size>10000);
const mt32Tracks=await readdir(path.join(dist,'audio/music/mt32')),jdTracks=await readdir(path.join(dist,'audio/music/jd-hardings-remix'));
assert.equal(mt32Tracks.filter(name=>/^\d\dbg\.ogg$/i.test(name)).length,57,'Unexpected MT-32 Black Gate track set');
assert.equal(jdTracks.filter(name=>/^\d\dbg\.ogg$/i.test(name)).length,54,'Unexpected JD Harding Black Gate track set');
assert(![...mt32Tracks,...jdTracks].some(name=>/^si\d/i.test(name)),'Serpent Isle audio must not be mixed into this Black Gate build');
for(const [folder,files] of [['mt32',mt32Tracks],['jd-hardings-remix',jdTracks]])for(const name of files){const data=await readFile(path.join(dist,'audio/music',folder,name));assert.equal(data.toString('ascii',0,4),'OggS',`Invalid OGG track: ${folder}/${name}`);}
engineJs=await readFile(path.join(dist,'engine/ultima7.js'),'utf8');
assert(engineJs.includes('_web_set_audio_modes')&&engineJs.includes('_web_audio_finished'),'WASM does not expose the audio event bridge');
assert(['onPaperdolls','onPaperdollMove','onPaperdollClose'].every(name=>engineJs.includes(name)),'Paperdoll panels are not driven by the engine');
assert(engineJs.includes('_web_scale_frame')&&engineJs.includes('_web_set_audio_state'),'Engine lacks Exult scalers or audio switches');
}
assert(player.includes('playGameMusic=playGameMusic')&&player.includes('decodeAudioData'),'Digital audio is not connected to the browser player');
assert(!/webkitdirectory|choose-folder|folder-input/.test(html));
const release=JSON.parse(await readFile(path.join(dist,'release.json'),'utf8'));
const pkg=JSON.parse(await readFile(path.join(project,'package.json'),'utf8'));
assert.equal(release.version,pkg.version,'Visible release must match package version');
const releaseHash=createHash('sha256');
const hashFile=async name=>{let data=await readFile(path.join(dist,name));if(/\.(?:js|css|json)$/i.test(name))data=Buffer.from(data.toString('utf8').replace(/\r\n/g,'\n'));releaseHash.update(data);};
if(full_release)for(const name of ['app.js','reader.js','style.css','locales.js','game-menu.js','cutscenes.js','inventory.js','saves.js','languages.js','portraits.js','portraits/regions.json','engine/ultima7.js','engine/ultima7.wasm','portraits/iolo.webp','portraits/apollonia.webp','portraits/finnigan.webp','patch/GUMPS.VGA','patch/es/GUMPS.VGA','patch/en/GUMPS.VGA','inventory/panels.json'])await hashFile(name);
for(const name of (await readdir(path.join(dist,'inventory'))).filter(name=>name.endsWith('.webp')).sort())await hashFile(`inventory/${name}`);
for(const name of (await readdir(path.join(dist,'inventory/icons'))).filter(name=>name.endsWith('.webp')).sort())await hashFile(`inventory/icons/${name}`);
const inventoryIcons=(await readdir(path.join(dist,'inventory/icons'))).filter(name=>name.endsWith('.webp')).sort();
assert.deepEqual(inventoryIcons,['dove.webp','flaming-sword.webp','halo-selected.webp','halo.webp','heart.webp','save-disk.webp'],'Inventory icon set is incomplete');
for(const name of inventoryIcons){assert((await stat(path.join(dist,'inventory/icons',name))).size>0,`Missing inventory icon: ${name}`);await hashFile(`inventory/icons/${name}`);}
const faceFiles=(await readdir(path.join(dist,'portraits/faces'))).filter(name=>name.endsWith('.webp')||name==='manifest.json').sort();
for(const name of faceFiles)await hashFile(`portraits/faces/${name}`);
if(full_release)assert.equal(release.revision,releaseHash.digest('hex').slice(0,12),'Run npm run release after changing release assets');
const faceManifest=JSON.parse(await readFile(path.join(dist,'portraits/faces/manifest.json'),'utf8'));
assert.equal(faceManifest.ids.length,283,'Portrait pack must cover every populated FACES.VGA record');
for(const id of faceManifest.ids)assert((await stat(path.join(dist,'portraits/faces',`${id}.webp`))).size>0,`Missing portrait for face ${id}`);
assert((await stat(path.join(dist,'portraits/faces/avatar-female.webp'))).size>0,'Missing female Avatar portrait');
for(const shape of [57,58,59,60,61,62,63,65,66,67,68])assert((await stat(path.join(dist,'inventory',`${shape}.webp`))).size>0,`Missing high-resolution paperdoll ${shape}`);
assert(player.includes('inventory.handlers')&&['onPaperdolls','onPaperdollMove','onPaperdollClose'].every(name=>inventoryJs.includes(name)),'Paperdoll panels are not driven by the engine');
const panels=JSON.parse(await readFile(path.join(dist,'inventory/panels.json'),'utf8'));
for(const shape of [57,58,59,60,61,62,63,65,66,67,68])assert(panels[shape]?.rects?.length&&panels[shape]?.guides?.length,`Missing paperdoll geometry ${shape}`);
assert(html.includes(`v${release.version} · ${release.revision.slice(0,7)}`),'Visible version badge is stale');
for(const asset of ['style.css','app.js','engine/ultima7.js'])assert(html.includes(`${asset}?v=${release.revision}`),'Asset cache revision is stale');
assert(html.includes('id="game-menu"'));assert(html.includes('id="language"'));
assert(html.includes('id="settings-music"')&&html.includes('id="settings-sfx"')&&html.includes('id="display-scaler"'));
console.log(full_release?`Release ready: ${manifest.files.length} game resources, ${(pack.length/1048576).toFixed(1)} MiB, SHA-256 verified; PT-BR/EN/ES, selectable MT-32/JD music and SoundBlaster/MT-32 effects.`:'Code and art checks passed (no game data in this checkout).');
