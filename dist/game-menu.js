import {t,language} from './locales.js';
// The game's save menu: ten slots saved and loaded by the engine's own routines,
// plus the page's backups (file and recovery code, wired by app.js).
export function createGameMenu({getEngine,onQuit,onSaved}){
 const $=selector=>document.querySelector(selector),panel=$('#game-menu');
 let state,selected=0,busy=false,lastAction=0,confirmAction;
 const metaKey=`u7-save-dates-${language}`;
 let dates={};try{dates=JSON.parse(localStorage.getItem(metaKey)||'{}');}catch{}
 function setBusy(value){busy=value;for(const item of panel.querySelectorAll('.save-list-section button,.save-editor button,.save-editor input'))item.disabled=value;if(!value)updateSelection();}
 function command(action){
  if(busy||!state)return;
  const engine=getEngine();if(!engine)return;
  const bytes=Uint8Array.from(Array.from($('#save-title').value.trim().normalize('NFC')).slice(0,79),ch=>ch.charCodeAt(0)<=255?ch.charCodeAt(0):63);
  const pointer=engine._malloc(bytes.length+1);engine.HEAPU8.set(bytes,pointer);engine.HEAPU8[pointer+bytes.length]=0;
  lastAction=action;setBusy(true);
  if(action===2)$('#menu-status').textContent=t('saving');
  if(action===3)$('#menu-status').textContent=t('loading');
  if(action===4)onQuit();
  const audio=state.audio||{};
  engine._web_menu_command(action,selected,pointer,audio.music||0,audio.speech||0,audio.effects||0,audio.musicSource||0,audio.sfxSource||0);
  engine._free(pointer);
 }
 function updateSelection(){
  if(!state)return;
  for(const button of $('#save-slots').children){const active=Number(button.dataset.index)===selected;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  $('#selected-slot').textContent=t('slot',{n:String(selected+1).padStart(2,'0')});
  $('#menu-load').disabled=busy||!state.slots[selected]?.title;
 }
 function select(index){selected=index;$('#save-title').value=state.slots[index]?.title||'';$('#menu-status').textContent='';$('#menu-confirm').hidden=true;updateSelection();}
 function ask(message,action){$('#menu-confirm p').textContent=message;$('#menu-confirm').hidden=false;confirmAction=action;$('#menu-confirm-yes').focus();}
 function render(next){
  if(!next){state=null;busy=false;if(panel.open)panel.close();return;}
  const first=!state;state=next;
  if(lastAction===2){dates[selected]=new Date().toISOString();localStorage.setItem(metaKey,JSON.stringify(dates));}
  $('#save-slots').replaceChildren();
  for(const slot of state.slots){
   const button=document.createElement('button');button.type='button';button.dataset.index=slot.index;
   const number=document.createElement('span');number.className='slot-number';number.textContent=String(slot.index+1).padStart(2,'0');
   const details=document.createElement('span');details.className='slot-description';const name=document.createElement('strong');name.textContent=slot.title||t('emptySlot');
   const date=document.createElement('small');date.textContent=slot.title?(dates[slot.index]?new Intl.DateTimeFormat(language,{dateStyle:'short',timeStyle:'short'}).format(new Date(dates[slot.index])):t('savedSlot')):'—';
   details.append(name,date);button.append(number,details);button.onclick=()=>select(slot.index);$('#save-slots').append(button);
  }
  if(first){selected=state.slots.find(x=>!x.title)?.index??0;select(selected);}
  $('#menu-confirm').hidden=true;setBusy(false);
  if(lastAction===2){$('#menu-status').textContent=t('saved');onSaved?.();}lastAction=0;
  if(!panel.open)panel.showModal();
 }
 $('#menu-save').onclick=()=>{if(!$('#save-title').value.trim()){$('#menu-status').textContent=t('needName');$('#save-title').focus();return;}if(state.slots[selected]?.title)ask(t('overwrite'),()=>command(2));else command(2);};
 $('#menu-load').onclick=()=>ask(t('restore'),()=>command(3));
 $('#menu-quit').onclick=()=>ask(t('quitQuestion'),()=>command(4));
 $('#menu-confirm-yes').onclick=()=>{const action=confirmAction;$('#menu-confirm').hidden=true;action?.();};
 $('#menu-confirm-no').onclick=()=>{$('#menu-confirm').hidden=true;$('#menu-save').focus();};
 $('#close-game-menu').onclick=$('#menu-resume').onclick=()=>command(1);
 panel.oncancel=event=>{event.preventDefault();command(1);};
 return {render};
}
