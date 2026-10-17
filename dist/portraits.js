// Keeps the portraits the player is about to see already downloaded and
// decoded: the Avatar and the companions from the start, and the people whose
// schedules (SCHEDULE.DAT, engine/build_portrait_regions.py) bring them near
// the Avatar as he travels.
const KEEP=48,RADIUS=176,NEARBY=28;
export function createPortraitCache({urlFor,revision}){
 const decoded=new Map();
 let places=null;
 fetch(`portraits/regions.json?v=${revision||'dev'}`).then(r=>r.json()).then(data=>{places=data;}).catch(error=>console.warn('Portrait regions unavailable:',error));
 // Download and decode one portrait; the most recently used ones stay in memory.
 function warm(face){
  const url=urlFor(face);if(!url||url.startsWith('data:'))return;
  if(decoded.has(url)){const image=decoded.get(url);decoded.delete(url);decoded.set(url,image);return;}
  const image=new Image();image.decoding='async';image.src=url;image.decode?.().catch(()=>{});
  decoded.set(url,image);
  while(decoded.size>KEEP)decoded.delete(decoded.keys().next().value);
 }
 // position: x << 16 | y in tiles, as reported by the engine.
 function update(position){
  if(!places||position<0)return;
  const x=position>>>16,y=position&0xffff,best=new Map();
  for(const [face,px,py] of places){
   const distance=Math.max(Math.abs(px-x),Math.abs(py-y));
   if(distance<=RADIUS&&(!best.has(face)||distance<best.get(face)))best.set(face,distance);
  }
  [...best].sort((a,b)=>a[1]-b[1]).slice(0,NEARBY).forEach(([face])=>warm(face));
 }
 return {warm,update};
}
