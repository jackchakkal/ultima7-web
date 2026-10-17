// Compiled only into the separate test engine, never the downloadable release.
#include "u7port.h"
#include "item.h"
#include "itemrec.h"
#include "typefram.h"
#include "coord.h"
#include "npcref.h"
#include "u7npc.h"
#include "bogus.h"
#include "camera.h"
#include "mapview.h"
#include "target.h"
#include "u7manage.h"
#include "convmgr.h"
#include "savegame.h"
#include <emscripten.h>

static objref probeItem;
static int probeStage;
extern "C" void web_probe_target(){
    int ax=-1,ay=-1;objref found;
    for(int y=40;y<150;y++)for(int x=70;x<250;x++){
        FindItemAtScreenPoint(&found,x,y,&MainWorldView,&gShapeManager,0);
        if(found.off==AvatarRef.off){ax=x;ay=y;}
    }
    EM_ASM({Module.onProbe?.({kind:'target',ax:$0,ay:$1,avatar:$2});},ax,ay,AvatarRef.off);
}
extern "C" void web_probe_picked(int object){EM_ASM({Module.onProbe?.({kind:'picked',item:$0,avatar:$1});},object,AvatarRef.off);}
extern "C" void web_probe_step(){
    int command=EM_ASM_INT({const c=Module.probeCommand||0;Module.probeCommand=0;return c;});
    if(command){
        probeStage=command;
        int shape=command==1?377:command==2?340:command==3?642:command==4?797:650;
        CreateItem(&probeItem,TypeFrame(shape,command==2?1:0),Item_getX(AvatarRef)+2,Item_getY(AvatarRef)+1,0);
        MarkItemOkayToTake(probeItem);
        if(command==1){Item_storeQuantity(&probeItem,2);GetNpcBufferForIbo(&AvatarRef)->food=0;}
        if(command==2)Item_setHitPoints(&AvatarRef,3);
        if(command==3)Item_setQuality(&probeItem,2);
        if(command==4)Item_setQuality(&probeItem,1);
        DrawWorld(&gCamera);
        int ix=-1,iy=-1,ax=-1,ay=-1;
        for(int y=40;y<150;y++)for(int x=70;x<250;x++){
            objref found;FindItemAtScreenPoint(&found,x,y,&MainWorldView,&gShapeManager,0);
            if(found.off==probeItem.off){ix=x;iy=y;}
            if(found.off==AvatarRef.off){ax=x;ay=y;}
        }
        SaveGameFiles.saveGame(9,"Teste de interacao",0);
        EM_ASM({Module.onProbe?.({kind:'ready',stage:$0,x:$1,y:$2,ax:$3,ay:$4,frame:$5,item:$6});},command,ix,iy,ax,ay,probeItem.frame(),probeItem.off);
    }
    if(probeStage)EM_ASM({Module.onProbe?.({kind:'tick',stage:$0,food:$1,hp:$2,quantity:$3});},probeStage,GetNpcBufferForIbo(&AvatarRef)->food,Item_getHitPoints(&AvatarRef),Item_getQuantity(&probeItem));
}
