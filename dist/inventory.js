// High-resolution inventory (paperdoll) panels.
//
// The paperdoll records of GUMPS.VGA are flat silhouettes painted in palette
// index PAPERDOLL_KEY (engine/build_gumps.py). The engine reports every
// paperdoll it paints, every position of one being dragged and every gump it
// closes (engine/prepare.py). This layer paints a modern panel, the painted
// figure and the load text over each paperdoll, in the engine's stacking
// order, and keeps them only where the key colour is still on screen: items,
// buttons, other gumps, open bags and the cursor drawn by the engine stay on top.
const PAPERDOLL_KEY=16,KEY_BASE=[63,54,54],FIRST_GUMP_SHAPE=1359;
const FIGURE={centerX:77,bottomY:108,maxWidth:78,maxHeight:102};
const KEY_FALLBACK=[34,25,18];
// Equipment slots (the engine's PaperdollSlotOffsets) and the part of the body
// each one belongs to, after the guides of the original paperdolls.
const SLOTS=[[116,24,'back'],[116,55,'handR'],[36,55,'handL'],[116,37,'armR'],[36,24,'neck'],[36,37,'chest'],[116,70,'fingersR'],[36,70,'fingersL'],[36,10,'head'],[116,10,'headR'],[116,85,'leg'],[77,97,'feet']];
// Body landmarks of each painted figure, as fractions of the image (x, y);
// L and R are the left and right of the picture.
const BODY={
 57:{head:[45,7],neck:[47,16],chest:[35,27],back:[75,20],armR:[85,34],handL:[9,52],handR:[87,52],fingersL:[8,55],fingersR:[88,55],leg:[64,62],feetL:[15,95],feetR:[82,95]},
 58:{head:[47,8],neck:[50,17],chest:[40,27],back:[78,20],armR:[86,33],handL:[17,51],handR:[85,51],fingersL:[17,54],fingersR:[86,54],leg:[70,62],feetL:[20,95],feetR:[80,95]},
 59:{head:[48,8],neck:[48,18],chest:[38,30],back:[75,24],armR:[88,38],handL:[9,52],handR:[90,52],fingersL:[8,56],fingersR:[92,56],leg:[70,70],feetL:[20,95],feetR:[80,95]},
 60:{head:[47,6],neck:[48,15],chest:[38,25],back:[72,19],armR:[84,32],handL:[6,52],handR:[92,52],fingersL:[5,56],fingersR:[93,56],leg:[65,63],feetL:[15,96],feetR:[85,96]},
 61:{head:[47,7],neck:[48,16],chest:[38,27],back:[75,20],armR:[85,35],handL:[6,50],handR:[90,50],fingersL:[6,54],fingersR:[91,54],leg:[68,65],feetL:[15,95],feetR:[82,95]},
 62:{head:[48,8],neck:[48,17],chest:[36,25],back:[75,20],armR:[85,34],handL:[8,52],handR:[88,52],fingersL:[8,55],fingersR:[89,55],leg:[67,62],feetL:[18,95],feetR:[82,95]},
 63:{head:[48,8],neck:[48,17],chest:[38,27],back:[72,20],armR:[82,34],handL:[10,50],handR:[88,50],fingersL:[10,53],fingersR:[89,53],leg:[65,70],feetL:[25,95],feetR:[78,95]},
 65:{head:[47,8],neck:[47,17],chest:[36,26],back:[72,20],armR:[84,32],handL:[6,50],handR:[88,50],fingersL:[6,53],fingersR:[89,53],leg:[66,62],feetL:[18,95],feetR:[82,95]},
 66:{head:[48,6],neck:[48,17],chest:[38,25],back:[72,20],armR:[80,30],handL:[12,48],handR:[86,48],fingersL:[12,51],fingersR:[87,51],leg:[65,75],feetL:[22,95],feetR:[78,95]},
 67:{head:[45,7],neck:[46,17],chest:[35,25],back:[72,19],armR:[80,32],handL:[8,51],handR:[90,51],fingersL:[8,54],fingersR:[91,54],leg:[62,68],feetL:[15,96],feetR:[85,96]},
 68:{head:[48,8],neck:[48,17],chest:[36,26],back:[75,20],armR:[88,35],handL:[8,52],handR:[92,52],fingersL:[8,56],fingersR:[93,56],leg:[66,65],feetL:[18,95],feetR:[82,95]},
};
// Buttons drawn as high-resolution icons: GUMPS.VGA record -> image per frame.
const ICONS={7:['halo','halo-selected'],24:['save-disk','save-disk'],25:['heart','heart'],46:['dove','flaming-sword']};
// Buttons redrawn as vector art: the paperdoll's own copies of the close (72)
// and attack-mode (73) buttons.
const VECTOR_ICONS={72:drawClose,73:drawAttackMode};
// Attack modes, on the original 19 x 19 grid: foes (dark), the Avatar (light),
// allies (small light), red arrows [points...] with a head at the last point,
// red bars and the question marks of manual mode.
const BIG=2.6,SMALL=1.35;
const ATTACK_MODES=[
 {foes:[[3.5,3.5,BIG],[15.5,3.5,BIG],[9.5,5.5,BIG]],arrows:[[[9.5,12.7],[9.5,8.4]]]},                                   // nearest
 {foes:[[9.5,3.5,1.4]],arrows:[[[9.5,11.7],[9.5,7.2]]]},                                                                  // weakest
 {foes:[[9.5,4,3.4]],arrows:[[[9.5,11.7],[9.5,7.6]]]},                                                                    // strongest
 {foes:[[9.5,3.5,BIG],[3.5,5.5,BIG],[15.5,5.5,BIG]],arrows:[[[9.5,12.5],[9.5,6.5]],[[9.2,12.5],[5,9]],[[9.8,12.5],[14,9]]]}, // berserk
 {foes:[[11.5,3.5,BIG]],arrows:[[[11.5,6.3],[11.5,10]]],bars:[[8,11.5,15,11.5],[11.3,12.3,8.6,15.2]],avatar:[5.5,15.5],allies:[[11.5,16,1.3]]}, // protect
 {foes:[[9.5,3.5,BIG]],arrows:[[[9.5,6.3],[9.5,10]]],bars:[[7,11.5,12,11.5],[9.5,11.8,9.5,12.9]]},                       // defend
 {foes:[[7.5,3.5,BIG]],arrows:[[[10.4,15.5],[13.5,15.5],[13.5,7.3]]],avatar:[7.5,15.5]},                                  // flank
 {foes:[[9.5,3.5,BIG]],arrows:[[[9.5,12.3],[9.5,16.7]]],avatar:[9.5,9.5]},                                                // flee
 {foes:[[3.5,3.5,BIG],[15.5,3.5,BIG],[3.5,15.5,BIG],[15.5,15.5,BIG]],bars:[[7.2,7.2,5.6,5.6],[11.8,7.2,13.4,5.6],[7.2,11.8,5.6,13.4],[11.8,11.8,13.4,13.4]],avatar:[9.5,9.5]}, // random
 {foes:[[3.5,3.5,BIG],[9.5,3.5,BIG],[15.5,3.5,BIG]],marks:'??'},                                                          // manual
];
function ball(c,x,y,r,light){
 const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);
 if(light){g.addColorStop(0,'#ffffff');g.addColorStop(1,'#d9d2c3');}else{g.addColorStop(0,'#5a514a');g.addColorStop(1,'#120d0a');}
 c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 c.strokeStyle=light?'rgba(120,90,40,.7)':'rgba(226,192,120,.85)';c.lineWidth=light?.22:.32;c.stroke();
}
function arrow(c,points){
 c.strokeStyle='#e0362a';c.fillStyle='#e0362a';c.lineWidth=.8;c.lineCap='round';c.lineJoin='round';
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
 const [x1,y1]=points[points.length-1],[x0,y0]=points[points.length-2],a=Math.atan2(y1-y0,x1-x0),l=1.9;
 c.beginPath();c.moveTo(x1+Math.cos(a)*.4,y1+Math.sin(a)*.4);c.lineTo(x1-Math.cos(a-.55)*l,y1-Math.sin(a-.55)*l);c.lineTo(x1-Math.cos(a+.55)*l,y1-Math.sin(a+.55)*l);c.closePath();c.fill();
}
function drawAttackMode(c,frame,x,y,w,h){
 const mode=ATTACK_MODES[frame]||ATTACK_MODES[0];
 c.save();c.translate(x,y);c.scale(w/19,h/19);
 for(const [fx,fy,r] of mode.foes)ball(c,fx,fy,r,false);
 c.strokeStyle='#e0362a';c.lineWidth=.8;c.lineCap='round';
 for(const [x0,y0,x1,y1] of mode.bars||[]){c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();}
 for(const points of mode.arrows||[])arrow(c,points);
 if(mode.marks){c.fillStyle='#e0362a';c.font='700 6px Inter, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(mode.marks,9.5,9.6);}
 const [ax,ay]=mode.avatar||[9.5,15.5];ball(c,ax,ay,BIG,true);
 for(const [lx,ly,r] of mode.allies||[])ball(c,lx,ly,r,true);
 c.restore();
}
function drawClose(c,frame,x,y,w,h){
 c.save();c.translate(x+(frame?.5:0),y+(frame?.5:0));c.scale(w/21,h/21);c.lineCap='round';c.lineJoin='round';
 const path=()=>{c.beginPath();c.moveTo(2,11.4);c.lineTo(9.6,18.6);c.lineTo(19.2,2);};
 c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=4.6;path();c.stroke();
 const g=c.createLinearGradient(2,2,19,19);g.addColorStop(0,'#ff6b55');g.addColorStop(1,'#a8110d');
 c.strokeStyle=g;c.lineWidth=3.1;path();c.stroke();
 c.strokeStyle='rgba(255,220,200,.55)';c.lineWidth=.6;c.beginPath();c.moveTo(3.2,11.2);c.lineTo(9.5,17.1);c.stroke();
 c.restore();
}

export function createInventoryLayer({canvas,t,revision}){
 const overlay=document.createElement('canvas'),ctx=overlay.getContext('2d');
 overlay.id='inventory-art-overlay';overlay.setAttribute('aria-hidden','true');
 overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
 canvas.after(overlay);
 const mask=document.createElement('canvas');mask.width=320;mask.height=200;
 const maskCtx=mask.getContext('2d'),maskImage=maskCtx.createImageData(320,200);
 const papers=new Map(),panels=new Map(),figures=new Map(),icons=new Map();
// Panels are cached at the screen's own density (2x on a small phone, up to 8x on
 // a 4K monitor), so small screens do not pay for pixels they cannot show.
 let panelScale=2;
 let order=0,geometry=null,dirty=true,keyVisible=false,light='rgb(255,255,255)',keyColor=KEY_FALLBACK;
 fetch(`inventory/panels.json?v=${revision||'dev'}`).then(r=>r.json()).then(data=>{geometry=data;dirty=true;}).catch(error=>console.warn('Inventory panels unavailable:',error));
 if(document.fonts)document.fonts.ready.then(()=>{dirty=true;});
 new ResizeObserver(()=>{dirty=true;}).observe(canvas);

 function upsert(p){
  const icons=(p.icons||[]).map(icon=>({shape:icon.shape-FIRST_GUMP_SHAPE,frame:icon.frame,dx:icon.x-p.x,dy:icon.y-p.y}));
  papers.set(p.id,{...papers.get(p.id),...p,icons,shape:p.shape-FIRST_GUMP_SHAPE,active:true,z:++order});
 }
 const handlers={
  // A full redraw lists every visible paperdoll from back to front; one missing
  // from the list is hidden (it may be about to be dragged), not closed.
  onPaperdolls(list){const seen=new Set();for(const p of list){upsert(p);seen.add(p.id);}for(const [id,p] of papers)if(!seen.has(id))p.active=false;dirty=true;},
  onPaperdoll(p){upsert(p);dirty=true;},
  onPaperdollMove(id,x,y){const p=papers.get(id);if(!p)return;Object.assign(p,{x,y,active:true,z:++order});dirty=true;},
  onPaperdollClose(id){if(papers.delete(id))dirty=true;},
  // A button redrawn on its own (pressed, toggled): it belongs to the topmost
  // paperdoll under its hot spot.
  onPaperdollIcon(icon){
   const shape=icon.shape-FIRST_GUMP_SHAPE;
   const owner=[...papers.values()].filter(p=>p.active&&icon.x>p.x&&icon.y>p.y&&icon.x<=p.x+133&&icon.y<=p.y+136).sort((a,b)=>b.z-a.z)[0];
   if(!owner)return;
   owner.icons=(owner.icons||[]).filter(i=>i.shape!==shape).concat({shape,frame:icon.frame,dx:icon.x-owner.x,dy:icon.y-owner.y});dirty=true;
  },
 };

 // Called for every new engine frame. Returns the RGB the page should show for a
 // key pixel before the panel covers it (a dark panel tone, never the key itself).
 function frame(memory,pixels,pal){
  const r=memory[pal+PAPERDOLL_KEY*3],g=memory[pal+PAPERDOLL_KEY*3+1],b=memory[pal+PAPERDOLL_KEY*3+2];
  const scale=[Math.min(1,r/KEY_BASE[0]),Math.min(1,g/KEY_BASE[1]),Math.min(1,b/KEY_BASE[2])];
  light=`rgb(${scale.map(v=>Math.round(v*255)).join(',')})`;
  keyColor=KEY_FALLBACK.map((v,i)=>Math.round(v*scale[i]));
  keyVisible=false;
  if([...papers.values()].some(p=>p.active)){
   const data=maskImage.data;
   for(let i=0,j=3;i<64000;i++,j+=4){const key=memory[pixels+i]===PAPERDOLL_KEY;data[j]=key?255:0;if(key)keyVisible=true;}
   if(keyVisible)maskCtx.putImageData(maskImage,0,0);
  }
  dirty=true;
  return keyColor;
 }

 function figure(shape){
  if(figures.has(shape))return figures.get(shape);
  const image=new Image();image.decoding='async';
  image.onload=()=>{panels.delete(shape);dirty=true;};
  image.onerror=()=>{figures.set(shape,null);panels.delete(shape);dirty=true;};
  image.src=`inventory/${shape}.webp?v=${revision||'dev'}`;
  figures.set(shape,image);return image;
 }

 // Guides from each slot to its part of the painted body: a dot at the slot, a
 // short level run, then straight to the landmark (the figure covers the end).
 function bodyGuides(c,body,rect){
  const at=([px,py])=>[rect.x+rect.w*px/100,rect.y+rect.h*py/100];
  c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle='rgba(222,190,120,.55)';c.lineWidth=.42;c.fillStyle='rgba(240,212,140,.85)';
  for(const [sx,sy,part] of SLOTS){
   const targets=part==='feet'?[body.feetL,body.feetR]:part==='headR'?[[body.head[0]+9,body.head[1]+2]]:[body[part]];
   for(const target of targets){
    if(!target)continue;
    const [tx,ty]=at(target),dir=Math.sign(tx-sx)||1,start=[sx+dir*3,sy];
    c.beginPath();c.moveTo(...start);
    if(part!=='feet'){const elbow=sx+dir*Math.max(4,Math.min(Math.abs(tx-sx)-5,Math.abs(tx-sx)*.45));c.lineTo(elbow,sy);}
    c.lineTo(tx,ty);c.stroke();
   }
   c.beginPath();c.arc(sx,sy,.85,0,Math.PI*2);c.fill();
  }
  c.restore();
 }
 function guides(c,points){
  const set=new Set(points.map(([x,y])=>`${x},${y}`)),has=(x,y)=>set.has(`${x},${y}`);
  c.save();c.lineCap='round';c.lineJoin='round';
  c.strokeStyle='rgba(222,190,120,.5)';c.lineWidth=.42;c.beginPath();
  for(const [x,y] of points)for(const [dx,dy] of [[1,0],[0,1],[1,1],[-1,1]])if(has(x+dx,y+dy)){c.moveTo(x+.5,y+.5);c.lineTo(x+dx+.5,y+dy+.5);}
  c.stroke();
  c.fillStyle='rgba(240,212,140,.85)';
  for(const [x,y] of points){
   let n=0;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&has(x+dx,y+dy))n++;
   if(n===0){c.beginPath();c.arc(x+.5,y+.5,.85,0,Math.PI*2);c.fill();}
  }
  c.restore();
 }

 function panel(shape){
  const cached=panels.get(shape);if(cached)return cached;
  const g=geometry[shape],S=panelScale;
  const w=Math.max(...g.rects.map(r=>r[3]))+1,h=Math.max(...g.rects.map(r=>r[1]))+1;
  const art=document.createElement('canvas');art.width=w*S;art.height=h*S;
  const c=art.getContext('2d');c.scale(S,S);
  const silhouette=new Path2D();for(const [y0,y1,x0,x1] of g.rects)silhouette.rect(x0,y0,x1-x0+1,y1-y0+1);
  const main=g.rects.reduce((a,r)=>(r[3]-r[2])*(r[1]-r[0])>(a[3]-a[2])*(a[1]-a[0])?r:a);
  const box={x:main[2],y:0,w:main[3]-main[2]+1,h};
  c.fillStyle='#140e0a';c.fill(silhouette);
  // the plinth behind the buttons that stick out of the panel
  for(const [y0,y1,x0,x1] of g.rects){
   if(x0>=box.x&&x1<box.x+box.w)continue;
   const grad=c.createLinearGradient(0,y0,0,y1+1);grad.addColorStop(0,'#3b2c20');grad.addColorStop(1,'#1c140e');
   c.fillStyle=grad;c.fillRect(x0,y0,x1-x0+1,y1-y0+1);
   c.strokeStyle='rgba(201,164,92,.55)';c.lineWidth=.35;c.strokeRect(x0+.4,y0+.4,x1-x0+.2,y1-y0+.2);
  }
  // main leaf: warm leather with a soft light behind the figure
  const leaf=c.createRadialGradient(box.x+box.w/2,52,6,box.x+box.w/2,60,box.h*.75);
  leaf.addColorStop(0,'#5a412b');leaf.addColorStop(.55,'#3a2a1c');leaf.addColorStop(1,'#1d140d');
  c.fillStyle=leaf;c.fillRect(box.x,box.y,box.w,box.h);
  // fine grain, fixed per shape so it never shimmers
  let seed=shape*9973;const random=()=>((seed=(seed*16807)%2147483647)/2147483647);
  for(let i=0;i<1400;i++){c.fillStyle=random()<.5?'rgba(255,230,190,.035)':'rgba(0,0,0,.06)';c.fillRect(box.x+random()*box.w,box.y+random()*box.h,.25+random()*.5,.25+random()*.35);}
  // gilded frame
  c.strokeStyle='#c9a45c';c.lineWidth=.7;c.beginPath();c.roundRect(box.x+1.2,box.y+1.2,box.w-2.4,box.h-2.4,2.5);c.stroke();
  c.strokeStyle='rgba(201,164,92,.35)';c.lineWidth=.3;c.beginPath();c.roundRect(box.x+2.8,box.y+2.8,box.w-5.6,box.h-5.6,1.6);c.stroke();
  c.fillStyle='#e0bf74';
  for(const [x,y] of [[box.x+2.8,box.y+2.8],[box.x+box.w-2.8,box.y+2.8],[box.x+2.8,box.y+box.h-2.8],[box.x+box.w-2.8,box.y+box.h-2.8]]){c.beginPath();c.moveTo(x,y-1.1);c.lineTo(x+1.1,y);c.lineTo(x,y+1.1);c.lineTo(x-1.1,y);c.closePath();c.fill();}
  // load area divider
  const divider=c.createLinearGradient(box.x+20,0,box.x+box.w-20,0);
  divider.addColorStop(0,'rgba(201,164,92,0)');divider.addColorStop(.5,'rgba(201,164,92,.6)');divider.addColorStop(1,'rgba(201,164,92,0)');
  c.fillStyle=divider;c.fillRect(box.x+20,111.6,box.w-40,.3);
  const image=figure(shape);let ready=true,rect=null;
  if(image&&image.complete&&image.naturalWidth){
   const scale=Math.min(FIGURE.maxWidth/image.naturalWidth,FIGURE.maxHeight/image.naturalHeight);
   rect={w:image.naturalWidth*scale,h:image.naturalHeight*scale};rect.x=FIGURE.centerX-rect.w/2;rect.y=FIGURE.bottomY-rect.h;
  }else if(image)ready=false;
  if(BODY[shape]&&rect)bodyGuides(c,BODY[shape],rect);else guides(c,g.guides);
  // ground shadow and figure
  const shadow=c.createRadialGradient(FIGURE.centerX,FIGURE.bottomY,0,FIGURE.centerX,FIGURE.bottomY,20);
  shadow.addColorStop(0,'rgba(0,0,0,.5)');shadow.addColorStop(1,'rgba(0,0,0,0)');
  c.save();c.translate(FIGURE.centerX,FIGURE.bottomY);c.scale(1,.16);c.translate(-FIGURE.centerX,-FIGURE.bottomY);c.fillStyle=shadow;c.fillRect(FIGURE.centerX-20,FIGURE.bottomY-20,40,40);c.restore();
  if(rect){c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,rect.x,rect.y,rect.w,rect.h);}
  const result={canvas:art,w,h,silhouette};
  if(ready)panels.set(shape,result);
  return result;
 }

 function iconImage(name){
  if(icons.has(name))return icons.get(name);
  const entry={image:new Image(),box:null};entry.image.decoding='async';
  entry.image.onload=()=>{
   // trim the transparent margin so each icon fills its button
   const probe=document.createElement('canvas'),w=probe.width=entry.image.naturalWidth,h=probe.height=entry.image.naturalHeight,c=probe.getContext('2d',{willReadFrequently:true});
   c.drawImage(entry.image,0,0);const data=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   entry.box=x1<0?[0,0,w,h]:[x0,y0,x1-x0+1,y1-y0+1];dirty=true;
  };
  entry.image.src=`inventory/icons/${name}.webp?v=${revision||'dev'}`;
  icons.set(name,entry);return entry;
 }
 function drawIcons(c,p){
  const extents=geometry.icons||{};
  for(const icon of p.icons||[]){
   const names=ICONS[icon.shape],vector=VECTOR_ICONS[icon.shape],extent=extents[icon.shape]?.[icon.frame]||extents[icon.shape]?.[0];if((!names&&!vector)||!extent)continue;
   const x=p.x+icon.dx+extent[0],y=p.y+icon.dy+extent[1],w=extent[2]-extent[0]+1,h=extent[3]-extent[1]+1;
   if(vector){c.save();c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=5;c.shadowOffsetY=1.5;vector(c,icon.frame,x,y,w,h);c.restore();continue;}
   const pressed=icon.frame===1&&names[0]===names[1];
   // transparent icons straight on the panel, with a soft shadow for contrast
   c.save();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=6;c.shadowOffsetY=2;
   const entry=iconImage(names[icon.frame]||names[0]);
   if(entry.box){
    const [bx,by,bw,bh]=entry.box,pad=pressed?.9:.3,scale=Math.min((w-pad*2)/bw,(h-pad*2)/bh),dw=bw*scale,dh=bh*scale;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(entry.image,bx,by,bw,bh,x+(w-dw)/2+(pressed?.3:0),y+(h-dh)/2+(pressed?.3:0),dw,dh);
   }
   c.restore();
  }
 }

 function loadText(c,p){
  const over=p.load>p.capacity,heavy=p.load>p.capacity*.85;
  c.textAlign='center';c.textBaseline='alphabetic';
  c.font='600 4.6px Inter, "Segoe UI", sans-serif';c.fillStyle='#c9a45c';
  c.fillText(t('invLoad').toUpperCase(),p.x+77,p.y+118);
  c.font='650 8px SourceSerif, Georgia, serif';c.fillStyle=over?'#ff8b6e':heavy?'#f1c46a':'#f4ead2';
  c.fillText(`${p.load} / ${p.capacity}`,p.x+77,p.y+126.4);
  c.font='500 4.4px Inter, "Segoe UI", sans-serif';c.fillStyle='#b8a684';
  c.fillText(t('invStones'),p.x+77,p.y+132.3);
 }

 function render(){
  const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  const ratio=window.devicePixelRatio||1,width=Math.round(bounds.width*ratio),height=Math.round(bounds.height*ratio);
  if(overlay.width!==width||overlay.height!==height){overlay.width=width;overlay.height=height;dirty=true;
   const scale=Math.max(2,Math.min(8,Math.ceil(width/320)));if(scale!==panelScale){panelScale=scale;panels.clear();}}
  if(!dirty)return;dirty=false;
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,width,height);
  if(!geometry||!keyVisible)return;
  const list=[...papers.values()].filter(p=>p.active&&geometry[p.shape]).sort((a,b)=>a.z-b.z);
  if(!list.length)return;
  ctx.setTransform(width/320,0,0,height/200,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const lit=new Path2D();
  for(const p of list){
   const art=panel(p.shape);
   ctx.drawImage(art.canvas,p.x,p.y,art.w,art.h);
   loadText(ctx,p);
   drawIcons(ctx,p);
   lit.addPath(art.silhouette,new DOMMatrix().translateSelf(p.x,p.y));
  }
  // follow the game's palette: night, fades and flashes darken or tint the panels too
  ctx.save();ctx.clip(lit);ctx.globalCompositeOperation='multiply';ctx.fillStyle=light;ctx.fillRect(0,0,320,200);ctx.restore();
  // keep only the pixels where the engine still shows the key colour
  ctx.globalCompositeOperation='destination-in';ctx.imageSmoothingEnabled=false;ctx.drawImage(mask,0,0,320,200);
  ctx.globalCompositeOperation='source-over';
 }

 // Downloads and decodes every paperdoll figure and button icon ahead of time,
 // so an inventory opens complete on the first click.
 function preload(){
  const jobs=[];
  for(const shape of [57,58,59,60,61,62,63,65,66,67,68]){const image=figure(shape);jobs.push(image?.decode?.().catch(()=>{}));}
  for(const names of Object.values(ICONS))for(const name of new Set(names))jobs.push(iconImage(name).image.decode?.().catch(()=>{}));
  return Promise.all(jobs);
 }

 return {handlers,frame,render,preload,key:PAPERDOLL_KEY};
}
