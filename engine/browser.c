/* Browser platform for Kitrinx's portable Black Gate reconstruction.
 * Single-threaded cooperative execution: the original synchronous game yields
 * through Emscripten Asyncify. No game files are embedded in this binary.
 */
#include <emscripten.h>
#include <emscripten/emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "web_backend.h"
#include "web_bridge.h"
#include "opl3.h"

static uint8_t screen[320*200], palette[256*3];
static const uint8_t *live_screen;
static unsigned serial;
static double epoch;
static plat_timer_fn timers[16], sound_tick;
static uint32_t last_tick;
static int pumping;
static double last_browser_yield;
static int program_depth;
extern void web_exit_program(int code);
extern int web_invoke_program(const char *name,int argc,char **argv);
static uint16_t keys[128], key_head, key_count, modifiers;
static int pending_scan=-1;
static int16_t mouse_x=320, mouse_y=100;
static uint16_t mouse_buttons;
static plat_mouse_fn mouse_handler;
typedef struct {uint16_t mask, buttons; int16_t x,y;} mouse_event;
static mouse_event mouse_events[128];
static unsigned mouse_count;
static int answer_pending=-1, continue_pending;
EM_JS(void,web_target_begin,(void),{Module.targetCancelled=false;Module.onTarget?.(true);});
EM_JS(void,web_target_end,(void),{Module.onTarget?.(false);});
EM_JS(int,web_target_cancelled,(void),{return Module.targetCancelled?1:0;});
EM_JS(void,web_target_abandon,(void),{Module.targetCancelled=true;});
EM_JS(int,web_take_target_cancelled,(void),{const cancelled=Module.targetCancelled;Module.targetCancelled=false;return cancelled?1:0;});
static web_menu_request menu_request;
static int audio_music_mode,audio_sfx_mode;
EM_JS(void,web_avatar_gender,(int male),{Module.avatarMale=!!male;});
static opl3_chip opl;
static uint16_t opl_address;
static int opl_new_mode;
static double opl_io_us;
static struct {uint8_t preset; int running,masked,flag; double start,period,seen;} opl_timer[2];
static uint8_t pcm[65536];
static uint32_t pcm_head,pcm_count,pcm_rate;
static double pcm_phase;

EMSCRIPTEN_KEEPALIVE uintptr_t web_frame_ptr(void){return (uintptr_t)screen;}
EMSCRIPTEN_KEEPALIVE uintptr_t web_palette_ptr(void){return (uintptr_t)palette;}
EMSCRIPTEN_KEEPALIVE unsigned web_frame_serial(void){return serial;}
EMSCRIPTEN_KEEPALIVE void web_key(int scan,int ascii,int mod){
    modifiers=mod;
    if (key_count<128) keys[(key_head+key_count++)%128]=(uint16_t)((scan<<8)|(ascii&255));
}
EMSCRIPTEN_KEEPALIVE void web_mouse(int x,int y,int buttons,int mask){
    if(mouse_count<128) mouse_events[mouse_count++]=(mouse_event){mask,buttons,x*2,y};
}
EMSCRIPTEN_KEEPALIVE void web_select_answer(int index){answer_pending=index;}
EMSCRIPTEN_KEEPALIVE void web_continue(void){continue_pending=1;}
int web_take_answer(void){int n=answer_pending;answer_pending=-1;return n;}
int web_take_continue(void){int n=continue_pending;continue_pending=0;return n;}
EMSCRIPTEN_KEEPALIVE void web_menu_command(int action,int slot,const char *title,int music,int speech,int effects,int music_source,int sfx_source){
    menu_request.action=action;menu_request.slot=slot;
    menu_request.music=music;menu_request.speech=speech;menu_request.effects=effects;
    menu_request.music_source=music_source;menu_request.sfx_source=sfx_source;
    strncpy(menu_request.title,title?title:"",79);menu_request.title[79]=0;
}
int web_menu_take(web_menu_request *request){if(!menu_request.action)return 0;*request=menu_request;menu_request.action=0;return 1;}
void web_menu_begin(int music,int speech,int effects){
    menu_request.action=0;
    EM_ASM({Module.menuDraft=({audio:{music:$0,speech:$1,effects:$2,musicSource:Module.musicMode||0,sfxSource:Module.sfxMode||0},slots:[]});},music,speech,effects);
}
void web_menu_slot(int index,const char *title){
    EM_ASM({let title='';for(let p=$1;HEAPU8[p];p++)title+=String.fromCharCode(HEAPU8[p]);Module.menuDraft.slots.push({index:$0,title});},index,title);
}
void web_menu_end(void){EM_ASM({Module.onMenu?.(Module.menuDraft);});}
void web_menu_hide(void){menu_request.action=0;EM_ASM({Module.onMenu?.(null);});}
EM_JS(void,web_sign_show,(int shape,const char *text),{let s='';for(let p=text;HEAPU8[p];p++)s+=String.fromCharCode(HEAPU8[p]);Module.onSign?.({shape,lines:s.split('\r').filter((x,i,a)=>i<a.length-1||x)});});
EM_JS(void,web_sign_hide,(void),{Module.onSign?.(null);});
/* Short UI strings supplied by the page for the current language (Latin-1). */
static char web_text_buffers[4][96];
char *web_text(int id,const char *fallback){
    char *out=web_text_buffers[id&3];
    int n=EM_ASM_INT({const t=(Module.uiTexts||{})[$0];if(typeof t!=='string')return -1;const n=Math.min(t.length,95);for(let i=0;i<n;i++)HEAPU8[$1+i]=t.charCodeAt(i)&255;return n;},id,out);
    if(n<0){strncpy(out,fallback,95);out[95]=0;}else out[n]=0;
    return out;
}
/* Ending lines: translated copy from Module.endgameTexts, or the original text. */
const char *web_tr(const char *text){
    int n=EM_ASM_INT({let k='';for(let p=$0;HEAPU8[p];p++)k+=String.fromCharCode(HEAPU8[p]);const t=(Module.endgameTexts||{})[k];if(typeof t!=='string')return -1;Module.trPending=t;return t.length;},text);
    if(n<0)return text;
    char *out=(char *)malloc(n+1);
    EM_ASM({const t=Module.trPending;for(let i=0;i<t.length;i++)HEAPU8[$0+i]=t.charCodeAt(i)&255;HEAPU8[$0+t.length]=0;},out);
    return out;
}
EM_JS(void,web_paperdolls_begin,(void),{Module.paperdollDraft=[];});
EM_JS(void,web_paperdoll,(int id,int shape,int x,int y,int load,int capacity,int npc),{const p={id,shape,x,y,load,capacity,npc};if(Module.paperdollDraft)Module.paperdollDraft.push(p);else Module.onPaperdoll?.(p);});
EM_JS(void,web_paperdolls_end,(void),{const list=Module.paperdollDraft||[];Module.paperdollDraft=null;Module.onPaperdolls?.(list);});
EM_JS(void,web_paperdoll_move,(int id,int x,int y),{Module.onPaperdollMove?.(id,x,y);});
EM_JS(void,web_paperdoll_close,(int id),{Module.onPaperdollClose?.(id);});
EM_JS(void,web_paperdoll_icon,(int shape,int frame,int x,int y),{const icon={shape,frame,x,y},draft=Module.paperdollDraft;if(draft){const owner=draft[draft.length-1];if(owner)(owner.icons||(owner.icons=[])).push(icon);}else Module.onPaperdollIcon?.(icon);});
EM_JS(int,web_fade_step,(void),{return Module.noFades?99:9;});
EM_JS(int,web_restore_slot,(void),{const slot=Module.restoreSlot;Module.restoreSlot=undefined;return Number.isInteger(slot)&&slot>=0&&slot<10?slot:-1;});
EM_JS(void,web_debug,(const char *stage),{
    const text=UTF8ToString(stage);
    console.info('U7 phase:',text);
    Module.onStage?.(text);
});
EM_JS(void,web_bark_register,(int shape,const char *text),{
    let value="";
    for(let p=text;HEAPU8[p];p++)value+=String.fromCharCode(HEAPU8[p]);
    if(!Module.barkText)Module.barkText=new Map();
    Module.barkText.set(shape,value);
});
EM_JS(void,web_bark_begin,(void),{Module.barkDraft=[];});
EM_JS(void,web_bark_show,(int shape,int x,int y),{
    const text=Module.barkText?.get(shape);
    if(text)Module.barkDraft?.push({text,x,y});
});
EM_JS(void,web_bark_end,(void),{Module.onBarks?.(Module.barkDraft||[]);});
EM_JS(void,web_item_caption,(const char *text,int x,int y),{
    let value="";
    for(let p=text;HEAPU8[p];p++)value+=String.fromCharCode(HEAPU8[p]);
    Module.onItemCaption?.({text:value,x,y});
});

void web_dialog_begin(int mode,int speaker){
    EM_ASM({Module.dialogDraft=({mode:$0,speaker:$1,document:Module.documentText||'',boxes:[],choices:[]});},mode,speaker);
}
void web_dialog_text(int slot,int npc,const char *lines,int width,int count){
    EM_ASM({
        const lines=[];
        for(let i=0;i<$4;i++){
            let str='';
            for(let j=0;j<$3;j++){const ch=HEAPU8[$2+i*$3+j];if(!ch)break;str+=String.fromCharCode(ch);}
            lines.push(str);
        }
        Module.dialogDraft.boxes.push({slot:$0,npc:$1,text:Module.pageTexts?.[$0]??lines.join(' ')});
    },slot,npc,lines,width,count);
}
void web_dialog_choice(int index,const char *label){
    EM_ASM({let text='';for(let p=$1;HEAPU8[p];p++)text+=String.fromCharCode(HEAPU8[p]);Module.dialogDraft.choices.push({index:$0,text});},index,label);
}
void web_dialog_end(int choosing){EM_ASM({Module.dialogDraft.choosing=!!$0;Module.onDialog?.(Module.dialogDraft);},choosing);}
__attribute__((noinline)) void web_dialog_hide(void){answer_pending=-1;continue_pending=0;EM_ASM({Module.pageTexts=[];Module.documentText='';Module.onDialog?.(null);});}
EM_JS(void,web_dialog_raw,(int slot,const char *text,int mode),{
    let value="";
    for(let p=text;HEAPU8[p];p++)value+=String.fromCharCode(HEAPU8[p]);
    value=value.replaceAll('^','').replaceAll('@','"').replaceAll('*',mode>=2?'\f':'\n\n').replaceAll('~','\n');
    if(!Module.pageTexts)Module.pageTexts=[];
    Module.pageTexts[slot]=value;
    if(mode>=2)Module.documentText=(Module.documentText?Module.documentText+'\n\n':'')+value;
});
EM_JS(void,web_dialog_clear,(int slot),{if(Module.pageTexts)delete Module.pageTexts[slot];});

uint32_t plat_milliseconds(void){return (uint32_t)(emscripten_get_now()-epoch);}
uint32_t plat_ticks(void){return (uint32_t)((emscripten_get_now()-epoch)*.06);}
void plat_pump(void){
    if(pumping)return;
    pumping=1;
    /* DOS waits often poll keys without sleeping. Native backends have an
     * independent event thread; the browser must yield here as well. */
    if(emscripten_get_now()-last_browser_yield>8){
        emscripten_sleep(1);
        last_browser_yield=emscripten_get_now();
    }
    unsigned count=mouse_count;mouse_count=0;
    for(unsigned i=0;i<count;i++){
        mouse_event e=mouse_events[i];mouse_x=e.x;mouse_y=e.y;mouse_buttons=e.buttons;
        if(mouse_handler)mouse_handler(e.mask,e.buttons,e.x,e.y);
    }
    uint32_t now=plat_ticks();
    if(now-last_tick>5)last_tick=now-5;
    while(last_tick<now){
        last_tick++;
        for(int i=0;i<16;i++)if(timers[i])timers[i]();
        if(sound_tick)sound_tick();
    }
    pumping=0;
}
void plat_sleep(uint32_t ms){emscripten_sleep(ms?ms:1);plat_pump();}
void plat_yield(void){plat_pump();if(live_screen){memcpy(screen,live_screen,sizeof screen);serial++;}plat_sleep(1);}
void plat_game_timer_add(plat_timer_fn fn){for(int i=0;i<16;i++)if(!timers[i]){timers[i]=fn;return;}}
void plat_game_timer_remove(plat_timer_fn fn){for(int i=0;i<16;i++)if(timers[i]==fn)timers[i]=0;}
void plat_sound_tick_set(plat_timer_fn fn){sound_tick=fn;}
void plat_sound_lock(void){}
void plat_sound_unlock(void){}
void plat_video_present(const uint8_t *pixels){live_screen=pixels;memcpy(screen,pixels,sizeof screen);serial++;plat_pump();}
void plat_video_set_palette(int16_t first,int16_t count,const uint8_t *rgb){if(first>=0&&first+count<=256)memcpy(palette+first*3,rgb,count*3);serial++;}
void plat_video_wait_retrace(void){plat_sleep(14);}
int16_t plat_key_available(void){plat_pump();return pending_scan>=0||key_count>0;}
int16_t plat_key_get(void){
    if(pending_scan>=0){int n=pending_scan;pending_scan=-1;return n;}
    while(!key_count)plat_yield();
    uint16_t word=keys[key_head++%128];key_count--;
    if(!(word&255)){pending_scan=word>>8;return 0;}
    return word&255;
}
uint16_t plat_key_modifiers(void){return modifiers;}
void plat_mouse_state(int16_t *x,int16_t *y,uint16_t *buttons){plat_pump();if(x)*x=mouse_x;if(y)*y=mouse_y;if(buttons)*buttons=mouse_buttons;}
void plat_mouse_set_handler(plat_mouse_fn fn){mouse_handler=fn;}
void plat_mouse_move_to(int16_t x,int16_t y){mouse_x=x;mouse_y=y;}
int16_t plat_cursor_is_hardware(void){return 0;}
void plat_cursor_set_shape(const uint8_t *p,int16_t w,int16_t h,int16_t x,int16_t y){(void)p;(void)w;(void)h;(void)x;(void)y;}
void plat_cursor_show(int16_t v){(void)v;}
void plat_log(const char *s){fputs(s,stdout);}
void plat_console_goto(int16_t x,int16_t y){(void)x;(void)y;}
void plat_console_write(const char *s){fputs(s,stdout);}
void plat_fatal(const char *s){EM_ASM({Module.onFatal?.(UTF8ToString($0));},s);fprintf(stderr,"FATAL: %s\n",s);plat_exit(1);}
void plat_exit(int16_t code){
    if(program_depth>0)web_exit_program(code);
    emscripten_force_exit(code);
}
int16_t plat_run_program(const char *name,int16_t argc,char **argv){
    if(program_depth>=8)abort();
    char *args[32];args[0]=(char*)name;
    for(int i=0;i<argc&&i<30;i++)args[i+1]=argv[i];
    args[argc+1]=NULL;
    files_reset();memset(timers,0,sizeof timers);sound_tick=0;
    epoch=emscripten_get_now();last_tick=0;live_screen=NULL;
    mouse_handler=NULL;mouse_count=0;mouse_buttons=0;pumping=0;
    key_count=key_head=0;pending_scan=-1;last_browser_yield=0;
    OPL3_Reset(&opl,48000);memset(opl_timer,0,sizeof opl_timer);
    ResetEnvironment();web_dialog_hide();
    program_depth++;
    int code=web_invoke_program(name,argc+1,args);
    program_depth--;
    return code;
}
int16_t plat_midi_available(void){return 0;}
void plat_midi_send(const uint8_t *m,int16_t n){(void)m;(void)n;}
bool plat_opl_available(void){return true;}
static double opl_clock(void){return emscripten_get_now()*1000+opl_io_us;}
static void opl_update(double now){for(int i=0;i<2;i++)if(opl_timer[i].running&&now>=opl_timer[i].start){double n=floor((now-opl_timer[i].start)/opl_timer[i].period);if(n>opl_timer[i].seen){opl_timer[i].seen=n;if(!opl_timer[i].masked)opl_timer[i].flag=1;}}}
void plat_opl_write(uint16_t port,uint8_t value){
    opl_io_us++;
    if((port&3)==0){opl_address=value;return;}
    if((port&3)==2){opl_address=(opl_new_mode||value==5)?0x100|value:value;return;}
    if(opl_address==2||opl_address==3)opl_timer[opl_address-2].preset=value;
    if(opl_address==4){
        double now=opl_clock();opl_update(now);
        if(value&128)opl_timer[0].flag=opl_timer[1].flag=0;
        else for(int i=0;i<2;i++){
            int start=!!(value&(1<<i));opl_timer[i].masked=!!(value&(i?32:64));
            if(opl_timer[i].masked)opl_timer[i].flag=0;
            if(start&&!opl_timer[i].running){opl_timer[i].start=now;opl_timer[i].period=(256-opl_timer[i].preset)*(i?320:80);opl_timer[i].seen=0;}
            opl_timer[i].running=start;
        }
    }
    if(opl_address==0x105)opl_new_mode=value&1;
    OPL3_WriteRegBuffered(&opl,opl_address,value);
}
uint8_t plat_opl_read(uint16_t p){(void)p;opl_io_us++;opl_update(opl_clock());int s=(opl_timer[0].flag?64:0)|(opl_timer[1].flag?32:0);return s?(s|128):0;}
void plat_pcm_start(uint32_t rate){pcm_rate=rate;pcm_head=pcm_count=0;pcm_phase=0;}
int32_t plat_pcm_queue(const uint8_t *s,int32_t n){int32_t i=0;while(i<n&&pcm_count<65536){pcm[(pcm_head+pcm_count)%65536]=s[i++];pcm_count++;}return i;}
int32_t plat_pcm_pending(void){return pcm_count;}
void plat_pcm_stop(void){plat_pcm_start(0);}
EMSCRIPTEN_KEEPALIVE void web_audio(float *out,int frames){
    for(int i=0;i<frames;i++){
        int16_t pair[2];OPL3_GenerateResampled(&opl,pair);
        float voice=0;
        if(pcm_count&&pcm_rate){voice=((int)pcm[pcm_head]-128)/256.0f;pcm_phase+=(double)pcm_rate/48000;while(pcm_phase>=1&&pcm_count){pcm_phase--;pcm_head=(pcm_head+1)%65536;pcm_count--;}}
        out[i*2]=fmaxf(-1,fminf(1,pair[0]/32768.0f+voice));
        out[i*2+1]=fmaxf(-1,fminf(1,pair[1]/32768.0f+voice));
    }
}
EMSCRIPTEN_KEEPALIVE void web_set_audio_modes(int music,int sfx){audio_music_mode=music;audio_sfx_mode=sfx;}
int web_audio_music_mode(void){return audio_music_mode;}
int web_audio_sfx_mode(void){return audio_sfx_mode;}
void web_audio_play_music(int track,int mode){EM_ASM({Module.playGameMusic?.($0,$1);},track,mode);}
void web_audio_play_sfx(int number,int volume,int pan,int flags){EM_ASM({Module.playGameSfx?.($0,$1,$2,$3);},number,volume,pan,flags);}
void web_audio_stop_sfx(int number){EM_ASM({Module.stopGameSfx?.($0);},number);}
void web_audio_set_sfx_volume(int number,int volume){EM_ASM({Module.setGameSfxVolume?.($0,$1);},number,volume);}
void web_audio_stop_sfx_all(void){EM_ASM({Module.stopGameSfxAll?.();});}
EMSCRIPTEN_KEEPALIVE void web_save_sync(void){EM_ASM({Module.FS.syncfs(false,err=>Module.onSave?.(err?String(err):null));});}
int main(int argc,char **argv){
    epoch=emscripten_get_now();OPL3_Reset(&opl,48000);files_set_root("/game");
    char message[2048];if(!files_check_data(message,sizeof message)){plat_fatal(message);return 1;}
    EM_ASM({Module.onEngineReady?.();});
    char *args[]={"-p","a388",NULL};
    int code=EM_ASM_INT({return Module.startProgram||3;});
    while(code==2||code==3||code==4||code==6||code==7||code==9||code==10){
        EM_ASM({Module.onProgram?.($0);},code);
        if(code==3)code=plat_run_program("u7",2,args);
        else if(code==6){char *intro[]={"ereiamjh",NULL};code=plat_run_program("intro",1,intro);}
        else if(code==4){char *ending[]={"ereiamjh",NULL};code=plat_run_program("endgame",1,ending);}
        else {char *menu[]={code==9?"l":code==7?"c":code==10?"m":"v",NULL};code=plat_run_program("mainmenu",1,menu);}
    }
    EM_ASM({Module.onStopped?.($0);},code);
    return code;
}
