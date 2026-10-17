// Keep the complete document in DOM. Changing pages never advances usecode.
export function createReader(onClose){
 const panel=document.querySelector('#reader'),pages=document.querySelector('#reader-pages'),text=document.querySelector('#reader-text');
 let content='',page=0,count=1,mode=0;
 function layout(){
  const width=pages.clientWidth;if(!width)return;
  const columns=mode===3&&width>560?2:1;
  const columnWidth=(width-(columns-1)*48)/columns;
  text.classList.remove('reader-pad');
  text.style.columnWidth=`${columnWidth}px`;
  text.style.columnGap='48px';
  const columnCount=Math.round((text.scrollWidth+48)/(columnWidth+48));
  if(columns===2&&columnCount%2)text.classList.add('reader-pad');
  count=Math.max(1,Math.ceil((text.scrollWidth+48)/(width+48)));
  page=Math.min(page,count-1);pages.scrollLeft=page*(width+48);
  document.querySelector('#reader-page').textContent=`${page+1} / ${count}`;
  document.querySelector('#reader-prev').disabled=page===0;
  document.querySelector('#reader-next').disabled=page===count-1;
 }
 function close(){if(panel.open){panel.close();onClose();}}
 document.querySelector('#reader-close').onclick=close;document.querySelector('#reader-finish').onclick=close;
 document.querySelector('#reader-prev').onclick=()=>{page=Math.max(0,page-1);layout();};
 document.querySelector('#reader-next').onclick=()=>{page=Math.min(count-1,page+1);layout();};
 panel.oncancel=e=>{e.preventDefault();close();};
 panel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();page=Math.max(0,Math.min(count-1,page+(e.key==='ArrowRight'?1:-1)));layout();}e.stopPropagation();});
 new ResizeObserver(layout).observe(pages);document.fonts.ready.then(layout);
 return {show(state){
  if(!state){if(panel.open)panel.close();content='';return;}
  if(!state.document?.trim())return;
  mode=state.mode;panel.dataset.kind=mode===3?'book':'scroll';
  if(content!==state.document){content=state.document;page=0;text.replaceChildren();for(const fragment of content.split('\f')){const section=document.createElement('section');section.textContent=fragment.trim();section.className='document-section';text.append(section);}}
  if(!panel.open)panel.showModal();requestAnimationFrame(layout);
 }};
}
