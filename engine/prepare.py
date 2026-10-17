"""Generate the browser-specific source overrides; the upstream checkout stays intact."""
from pathlib import Path
import shutil
import os

HERE = Path(__file__).resolve().parent
SOURCE = Path(os.environ.get('U7_SOURCE', HERE.parent / '.build/upstream/ultima7-portable/Black Gate'))
OUT = HERE / 'generated'
OUT.mkdir(exist_ok=True)

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError(f'Upstream source changed: {old[:90]!r}')
    return text.replace(old, new, 1)

text = (SOURCE / 'game/main/convmgr.cpp').read_text()
text = replace_once(text, '#include "plat.h"', '#include "plat.h"\n#include "web_bridge.h"')
start = text.index('void RepaintConversation(void)\n{')
end = text.index('\n/* show an npc', start)
text = text[:start] + '''void RepaintConversation(void)
{
    CopyView(gShapeManager.lockView(SavedScreen), &Viewport);
    web_dialog_begin(ConversationMode, SpeakingFace);
    web_avatar_gender(Npc_isMale(&AvatarRef));
    for (int i = 0; i < 2; i++) {
        if (TextBoxes[i] && TextBoxes[i]->visible)
            web_dialog_text(i, FaceNPC[i], TextBoxes[i]->text, TextBoxes[i]->width, TextBoxes[i]->used);
    }
    int index = 0;
    Answer *answer = 0;
    if (ConversationAnswers && ConversationAnswers->visible) {
        while (OfferedAnswers.next(&answer))
            web_dialog_choice(index++, answer->text);
    }
    web_dialog_end(index > 0);
    CopyFrameBuffer();
}
''' + text[end:]
text = replace_once(text, 'void CloseConversationGumps(void)\n{', 'void CloseConversationGumps(void)\n{\n    if (ConversationMode > 1)\n        WaitForTextClick();\n    web_dialog_hide();')
text = replace_once(text, '\tif (ConversationMode > 1)\n\t\tWaitForTextClick();\n\tfor (i = 0; i < 2; i++) {', '\tfor (i = 0; i < 2; i++) {')
text = replace_once(text, '\twhile (!done) {\n\t\tPlayAmbientSounds();', '''\twhile (!done) {
        int webAnswer = web_take_answer();
        if (webAnswer >= 0) {
            Answer *answer = 0;
            int index = 0;
            while (OfferedAnswers.next(&answer)) {
                if (index++ == webAnswer) {
                    strncpy(ChosenAnswer, answer->text, ANSWER_SIZE - 1);
                    ChosenAnswer[ANSWER_SIZE - 1] = 0;
                    ConversationAnswers->hide();
                    AvatarFace->hide();
                    return;
                }
            }
        }
\t\tPlayAmbientSounds();''')
text = replace_once(text, '\tSkipToMouseRelease();\n\twhile (!UpdateAndGetMouseState()->clicked() || PollKeyToGlobalDiscarding()) {', '\tSkipToMouseRelease();\n\twhile (!web_take_continue() && (!UpdateAndGetMouseState()->clicked() || PollKeyToGlobalDiscarding())) {')
text = replace_once(text, '\tif (n >= 0 && n <= 1)\n\t\tTextBoxes[n]->used = 0;', '\tif (n >= 0 && n <= 1) {\n        TextBoxes[n]->used = 0;\n        web_dialog_clear(n);\n    }')
(OUT / 'convmgr.cpp').write_text(text)

for name in ('u7font', 'colbuf'):
    text = (SOURCE / f'game/main/{name}.cpp').read_text()
    text = text.replace('font, c);', 'font, (uint8_t)c);').replace('font, c, 0, 0);', 'font, (uint8_t)c, 0, 0);')
    (OUT / f'{name}.cpp').write_text(text)

text = (SOURCE / 'platform/matoya/files.c').read_text().replace('#include "backend.h"', '#include "web_backend.h"')
(OUT / 'files.c').write_text(text)
text = (SOURCE / 'game/main/u7.c').read_text().replace('#include "plat.h"', '#include "plat.h"\n#include "web_bridge.h"')
for call in ('SetDataDirectories();', 'ConfigureSound("u7.cfg", ".\\\\gamedat\\\\options.cfg");', 'ParseCommandLine(argc, argv);', 'InitEnvironment();', 'InitGameSystems();', 'MainGameLoop();'):
    text = replace_once(text, '\t' + call, '\tweb_debug("' + call.split('(')[0] + '");\n\t' + call)
(OUT / 'u7.c').write_text(text)
text = (SOURCE / 'game/main/sysusage.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"')
text = replace_once(text, 'void LogMemoryUsage(char *fmt, ...)\n{', 'void LogMemoryUsage(char *fmt, ...)\n{\n    web_debug(fmt);')
(OUT / 'sysusage.cpp').write_text(text)
text = (SOURCE / 'game/main/actitem.cpp').read_text()
text = replace_once(text, 'const WorkHandler WorkTypeHandlers[53] = {', '''static void WebRunWaitSchedule(objref *) { RunWaitSchedule(); }
static void WebRunSpecialSchedule(objref *) { RunSpecialSchedule(); }
const WorkHandler WorkTypeHandlers[53] = {''')
text = text.replace('(WorkHandler) RunWaitSchedule', 'WebRunWaitSchedule').replace('(WorkHandler) RunSpecialSchedule', 'WebRunSpecialSchedule')
(OUT / 'actitem.cpp').write_text(text)
text = (SOURCE / 'game/main/sprite.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"')
text = replace_once(text, 's->shape = MakeShapeFromImage(image);', 's->shape = MakeShapeFromImage(image);\n    web_bark_register(s->shape, text);')
text = replace_once(text, '\tif (draw) {\n\t\tShapeManager_drawInViewport', '\tif (draw && s->textHeight) {\n        web_bark_show(s->shape, x, y);\n    } else if (draw) {\n\t\tShapeManager_drawInViewport')
text = replace_once(text, '\tfor (; count != 0; count--, sprites++) {\n\t\tSprite_update(sprites, advance);\n\t}', '\tif (advance) web_bark_begin();\n\tfor (; count != 0; count--, sprites++) {\n\t\tSprite_update(sprites, advance);\n\t}\n\tif (advance) web_bark_end();')
(OUT / 'sprite.cpp').write_text(text)
text = (SOURCE / 'game/inter/farstr.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"\nextern int16_t SpeakingFace;')
start=text.index('void FarString::show()\n{')
text=text[:start]+'''void FarString::show()
{
    if (ConversationMode < 2) ClearSpeakerText();
    web_dialog_raw(SpeakingFace, text, ConversationMode);
    if (ConversationMode < 2) WaitForTextClick();
}
'''
text = text.replace('#define FAR_STRING_SIZE     1000', '#define FAR_STRING_SIZE     30000')
text = text.replace('FAR_STRING_SIZE - 1 - _fstrlen(buffer)', 'FAR_STRING_SIZE - 1 - _fstrlen(text)')
text = text.replace('_fstrncat(text, buffer, FAR_STRING_SIZE - 1);', '_fstrncat(text, buffer, FAR_STRING_SIZE - 1 - _fstrlen(text));')
(OUT / 'farstr.cpp').write_text(text)

# Route Exult's music/SFX events to browser audio packs when selected.
text = (SOURCE / 'game/sound/u7sound.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"\n#include <emscripten.h>')
music_anchor = '\tif (track == CurrentMusic)\n\t\treturn;\n\tif (track == MUSIC_NONE) {\n\t\tFadeOutSong(0);'
music_hook = '\tif (track == CurrentMusic)\n\t\treturn;\n    if (web_audio_music_mode() != 0) {\n        web_audio_play_music(track, mode);\n        BackgroundMusicDue = 0;\n        SongStopped = 0;\n        if (mode == 1) {\n            SpecialMusicPlaying = 1;\n            return;\n        }\n        CurrentMusic = DeferredMusic = track;\n        SpecialMusicPlaying = mode == 2;\n        return;\n    }\n\tif (track == MUSIC_NONE) {\n\t\tFadeOutSong(0);'
text = replace_once(text, music_anchor, music_hook)
text = replace_once(text, '\tif (MusicDevice == MUSIC_DEVICE_MT32) {\n\t\tLoadSfxPatch(number);', '\tif (web_audio_sfx_mode() != 0) {\n        web_audio_play_sfx(number, volume, pan, flags);\n        return;\n    }\n\tif (MusicDevice == MUSIC_DEVICE_MT32) {\n\t\tLoadSfxPatch(number);')
text = replace_once(text, 'void StopSfx(uint8_t number)\n{\n\tSoundChannel *current;', 'void StopSfx(uint8_t number)\n{\n\tSoundChannel *current;')
stop_anchor = 'void StopSfx(uint8_t number)\n{'
start = text.index(stop_anchor)
text = text[:start] + text[start:].replace('\tif (number >= SFX_COUNT)\n\t\treturn;', '\tif (number >= SFX_COUNT)\n\t\treturn;\n    if (web_audio_sfx_mode() != 0) web_audio_stop_sfx(number);', 1)
start = text.index('void SetSfxVolume(uint8_t number, int16_t volume)')
text = text[:start] + text[start:].replace('\tif (MusicDevice == MUSIC_DEVICE_MT32 && SfxVoices[number] != 0) {', '\tif (web_audio_sfx_mode() != 0) web_audio_set_sfx_volume(number, volume);\n\tif (MusicDevice == MUSIC_DEVICE_MT32 && SfxVoices[number] != 0) {', 1)
text = replace_once(text, '\telse if (SfxEnabled) {', '\telse if (SfxEnabled) {\n        web_audio_stop_sfx_all();')
text += '''
static int WebRestartMusicPending = 0;
extern "C" EMSCRIPTEN_KEEPALIVE uint8_t web_current_music(void) { return CurrentMusic; }
extern "C" EMSCRIPTEN_KEEPALIVE void web_audio_finished(void) { SongStopped = 1; BackgroundMusicDue = 1; }
extern "C" EMSCRIPTEN_KEEPALIVE void web_restart_music(void) { WebRestartMusicPending = 1; }
extern "C" void web_apply_audio(void) {
    if (!WebRestartMusicPending) return;
    WebRestartMusicPending = 0;
    uint8_t track = CurrentMusic;
    FadeOutSong(0); CurrentMusic = MUSIC_NONE; SongStopped = 1;
    if (track != MUSIC_NONE) PlayMusic(track);
}
'''
(OUT / 'u7sound.cpp').write_text(text)
print('Browser source overrides prepared.')

# Browser key events arrive while the cooperative frame wait is suspended.
# The old DOS per-frame drain otherwise discards toolbar commands before polling.
text = (SOURCE / 'game/main/main.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include <emscripten.h>\n#include "web_bridge.h"')
text = replace_once(text, 'void RunGameStep(void)\n{\n\tFlushKeyboard();', 'void RunGameStep(void)\n{\n    /* Preserve queued browser input until PollAndProcessKey consumes it. */')
# Music, speech and effects switches live in the page's settings: the request
# is applied at the next game step, like the original save menu's switches.
text = text.replace('void RunGameStep(void)\n{', '''static int WebAudioPending = 0, WebAudioWanted[3];
extern "C" EMSCRIPTEN_KEEPALIVE void web_set_audio_state(int music, int speech, int effects)
{
    WebAudioWanted[0] = music; WebAudioWanted[1] = speech; WebAudioWanted[2] = effects; WebAudioPending = 1;
}
// The Avatar's tile position (x << 16 | y), for the page to preload the
// portraits of the people who live and work nearby; -1 outside the game world.
extern "C" EMSCRIPTEN_KEEPALIVE int web_avatar_position(void)
{
    if (!AvatarRef.valid()) return -1;
    return ((int) (uint16_t) Item_getX(AvatarRef).value << 16) | (uint16_t) Item_getY(AvatarRef).value;
}
// Current switches: 0 unavailable, 1 off, 2 on; music | speech << 4 | effects << 8.
extern "C" EMSCRIPTEN_KEEPALIVE int web_audio_state(void)
{
    uint8_t music, speech, effects;
    GetAudioOptions(&music, &speech, &effects);
    return music | (speech << 4) | (effects << 8);
}
static void WebApplyAudioState(void)
{
    if (!WebAudioPending) return;
    WebAudioPending = 0;
    uint8_t music, speech, effects;
    GetAudioOptions(&music, &speech, &effects);
    if (music) music = WebAudioWanted[0] ? 2 : 1;
    if (speech) speech = WebAudioWanted[1] ? 2 : 1;
    if (effects) effects = WebAudioWanted[2] ? 2 : 1;
    SetAudioState(music, speech, effects);
    if (music == 2) web_restart_music();
}
void RunGameStep(void)
{
    web_apply_audio();
    WebApplyAudioState();''')
text = text.replace('void RunGameStep(void)\n{', '#ifdef U7_INTERACTION_PROBE\nextern "C" void web_probe_step();\n#endif\nvoid RunGameStep(void)\n{\n#ifdef U7_INTERACTION_PROBE\n    web_probe_step();\n#endif')
(OUT / 'main.cpp').write_text(text)

# Persist only after the engine has finished serializing the live game state.
text = (SOURCE / 'game/main/savegame.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\nextern "C" void web_save_sync(void);')
text = replace_once(text, '\t\tsave.save(GamedatPath, getSaveFileName(n), title, SAVE_VERSION, 300);\n\t}\n}', '\t\tsave.save(GamedatPath, getSaveFileName(n), title, SAVE_VERSION, 300);\n\t}\n    web_save_sync();\n}')
(OUT / 'savegame.cpp').write_text(text)

text = (SOURCE / 'game/zevent/u7event.cpp').read_text()
text = replace_once(text, '\t\tif (discard != 0) {\n\t\t\twhile (KeyPressed() != 0)\n\t\t\t\tReadKey();\n\t\t}', '\t\t/* Browser typing is queued; consume every character on a later poll. */\n        (void)discard;')
text = replace_once(text, '\tDoubleClickDelay = 12;', '\tDoubleClickDelay = 18;')
(OUT / 'u7event.cpp').write_text(text)

text = (SOURCE / 'game/main/lsgump.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"')
helper='''static void PublishBrowserMenu(SaveGump *menu)
{
    web_menu_begin(menu->musicState, menu->speechState, menu->effectsState);
    for (int i=0;i<10;i++) web_menu_slot(i,menu->slots[i]->text);
    web_menu_end();
}

'''
text=replace_once(text,'SaveGump::SaveGump() :',helper+'SaveGump::SaveGump() :')
start=text.index('SaveGump::SaveGump() :');end=text.index('\nSaveGump::~SaveGump()',start)
constructor=text[start:end]
at=constructor.rfind('}')
constructor=constructor[:at]+'''    load.hide();save.hide();quit.hide();close.hide();
    music.hide();speech.hide();effects.hide();
    for(int i=0;i<10;i++)slots[i]->hide();
    PublishBrowserMenu(this);
'''+constructor[at:]
text=text[:start]+constructor+text[end:]
text=replace_once(text,'SaveGump::~SaveGump()\n{','SaveGump::~SaveGump()\n{\n    web_menu_hide();')
start=text.index('void SaveGump::draw(View *target)\n{');end=text.index('\nvoid SaveGump::blink',start)
text=text[:start]+'''void SaveGump::draw(View *target) { (void)target; }
'''+text[end:]
start=text.index('uint8_t SaveGump::handle(MouseState *state)\n{');end=text.index('\nSaveGump *NewSaveGump()',start)
text=text[:start]+'''uint8_t SaveGump::handle(MouseState *state)
{
    (void)state;
    web_apply_audio();
    web_menu_request request;
    if(!web_menu_take(&request))return 0;
    if(request.action==1)return GUMP_CLOSE;
    if(request.action==4)return GUMP_QUIT;
    if(request.action==5){
        if(musicState)musicState=request.music==2?2:1;
        if(speechState)speechState=request.speech==2?2:1;
        if(effectsState)effectsState=request.effects==2?2:1;
        SetAudioState(musicState,speechState,effectsState);
        if (musicState == 2) web_restart_music();
        PublishBrowserMenu(this);
        return GUMP_HANDLED;
    }
    int slot=request.slot;
    if(slot<0||slot>=10)return 0;
    if(request.action==2&&request.title[0]){
        CheckItemBuffer();
        SetAudioState(musicState,speechState,effectsState);
        SaveGameFiles.saveGame(slot,request.title,0);
        strncpy(slots[slot]->text,request.title,79);slots[slot]->text[79]=0;
        occupied[slot]=1;
        PublishBrowserMenu(this);
        return GUMP_HANDLED;
    }
    if(request.action==3&&occupied[slot]){
        SaveGameFiles.restoreGame(slot);
        GameRestored=1;
        return GUMP_RESTORED;
    }
    return 0;
}
'''+text[end:]
(OUT / 'lsgump.cpp').write_text(text)

# Item names inside open containers used to be painted as low-resolution
# Caption controls. Forward them to the same responsive HTML text layer as
# dialogue and world barks instead.
text = (SOURCE / 'game/main/gumpmgr.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"')
start = text.index('void ShowItemNameCaption(objref obj, MouseState *state)\n{')
end = text.index('\nvoid AddBarkCaption(objref obj, char *text)', start)
caption = text[start:end]
caption = replace_once(caption, '\t\tfor (i = 0; i < 10; i++) {\n\t\t\tif (!BarkTexts[i]) {\n\t\t\t\tBarkTexts[i] = new Caption(x, y, name);\n\t\t\t\tif (!BarkTexts[i])\n\t\t\t\t\tReportOutOfNearMemory();\n\t\t\t\tbreak;\n\t\t\t}\n\t\t}', '\t\tweb_item_caption(name, x, y);')
text = text[:start] + caption + text[end:]
text = replace_once(text, '\t\t\t\tBarkTexts[i] = new Caption(x, y, text);\n\t\t\t\tif (!BarkTexts[i])\n\t\t\t\t\tReportOutOfNearMemory();', '\t\t\t\tweb_item_caption(text, x, y);')
text = replace_once(text, '\t\t\t\tBarkTexts[i]->paint(&Viewport);\n\t\t\t\tCopyFrameBuffer();', '')
(OUT / 'gumpmgr.cpp').write_text(text)

# Pointer-move events were being inserted into the same ten-slot queue used
# to classify button presses and releases. A tiny cursor movement between the
# two clicks could therefore split a double-click sequence, and move noise
# could crowd out actual clicks. Cursor position is tracked independently, so
# only button transitions belong in this queue.
text = (SOURCE / 'game/zevent/msclick.cpp').read_text()
text = replace_once(text, '\tEnqueueMouseEvent(&ev);\n}', '\tif (ev.type != 0)\n\t\tEnqueueMouseEvent(&ev);\n}')
(OUT / 'msclick.cpp').write_text(text)

# The target picker is a modal DOS loop. Publish its cursor/frame while yielding
# and allow explicit cancellation; a pending mouse release is not a new target.
text = (SOURCE / 'game/main/getpick.cpp').read_text().replace('#include "plat.h"', '#include "plat.h"\n#include "web_bridge.h"')
text = text.replace('int16_t obj;', 'int16_t obj = 0;').replace('int16_t x, y;', 'int16_t x = 0, y = 0;')
text = replace_once(text, '\tGameInput.enableKeyboardMouse();', '\tGameInput.enableKeyboardMouse();\n    web_target_begin();')
text = text.replace('    web_target_begin();', '    web_target_begin();\n#ifdef U7_INTERACTION_PROBE\n    web_probe_target();\n#endif')
text = '#ifdef U7_INTERACTION_PROBE\nextern "C" void web_probe_target();\nextern "C" void web_probe_picked(int);\n#endif\n' + text
text = replace_once(text, '\twhile (!done) {', '''\twhile (!done) {
        plat_yield();
        if (web_target_cancelled() || PollEscapeKey()) {
            web_target_abandon();
            web_target_end();
            SelectMouseCursor(cursor);
            *px = *py = 0; *pz = 0;
            return 0;
        }''')
text = replace_once(text, '\tSelectMouseCursor(cursor);\n\tif (IS_VALID(obj))', '\tweb_target_end();\n\tSelectMouseCursor(cursor);\n\tif (IS_VALID(obj))')
# Physical button state is reliable even when another poll consumed the release.
text = text.replace('while (!GameInput.isButtonReleased(1))', 'while (ReadMouseButtons() & 1)')
text = text.replace('\tif (IS_VALID(obj)) {', '#ifdef U7_INTERACTION_PROBE\n    web_probe_picked(obj);\n#endif\n\tif (IS_VALID(obj)) {')
(OUT / 'getpick.cpp').write_text(text)

# Cancel an item action before the script can consume it or apply a ground target.
text = (SOURCE / 'game/inter/inter.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"')
text = replace_once(text, '\t\t\tOpcodeCount++;', '\t\t\tif (web_take_target_cancelled()) goto abort;\n\t\t\tOpcodeCount++;')
(OUT / 'inter.cpp').write_text(text)

# Signs, tombstones and plaques: the runic text is drawn by the engine and a
# readable transcription is published to the HTML layer while the gump is open.
text = (OUT / 'convmgr.cpp').read_text()
text = replace_once(text, '\tSignGump box(shape, text);\n', '\tweb_sign_show(shape, text);\n\tSignGump box(shape, text);\n')
text = replace_once(text, '\twhile (!GameInput.isButtonPressed(1))\n\t\t;\n}', '\twhile (!GameInput.isButtonPressed(1))\n\t\t;\n\tweb_sign_hide();\n}')
(OUT / 'convmgr.cpp').write_text(text)

# Main-menu messages come from the page, so each language can supply them.
text = (SOURCE / 'game/mainmenu/mainmenu.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, 'noGame.setText("You must start a new game first.", -1);', 'noGame.setText(web_text(0, "You must start a new game first."), -1);')
text = replace_once(text, 'noName.setText("Avatar! You must choose a name.", -1);', 'noName.setText(web_text(1, "Avatar! You must choose a name."), -1);')
text = replace_once(text, 'ShowMessage("You must create a new game first!");', 'ShowMessage(web_text(2, "You must create a new game first!"));')
local = SOURCE / 'game/mainmenu'
for header in sorted(local.glob('*.h')):
    text = text.replace(f'#include "{header.name}"', f'#include "{header.as_posix()}"')
(OUT / 'mainmenu.cpp').write_text(text)

def absolute_includes(text, folder):
    for header in sorted(folder.glob('*.h')):
        text = text.replace(f'#include "{header.name}"', f'#include "{header.as_posix()}"')
    return text

# Closing cards of the "desert Britannia" ending.
text = (SOURCE / 'game/mainmenu/credits.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, 'lines[0]->setText("\\\\CTHE END OF ULTIMA VII", -1);', 'lines[0]->setText(web_text(3, "\\\\CTHE END OF ULTIMA VII"), -1);')
text = replace_once(text, 'lines[0]->setText("\\\\CTHE END OF BRITANNIA AS YOU KNOW IT...", -1);', 'lines[0]->setText(web_text(0, "\\\\CTHE END OF BRITANNIA AS YOU KNOW IT..."), -1);'.replace('web_text(0,', 'web_text(4,'))
(OUT / 'credits.cpp').write_text(absolute_includes(text, SOURCE / 'game/mainmenu'))

# Ending texts: every printed line goes through the page's translation table.
import re as _re
text = (SOURCE / 'game/endgame/endgame.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = _re.sub(r'"(%Y%J[^"]*)"', r'web_tr("\1")', text)
for unit in ('year', 'month', 'day'):
    text = replace_once(text, f'snprintf(part, sizeof part, "%d {unit}", (int16_t) date.{unit});',
        f'snprintf(part, sizeof part, web_tr((int16_t) date.{unit} > 1 ? "%d {unit}s" : "%d {unit}"), (int16_t) date.{unit});')
    text = _re.sub(r'\n\t+if \(\(int16_t\) date\.' + unit + r' > 1\)\n\t+strcat\(text, "s"\);', '', text, count=1)
text = replace_once(text, 'strcat(text, ", & ");', 'strcat(text, web_tr(", & "));')
(OUT / 'endgame.cpp').write_text(absolute_includes(text, SOURCE / 'game/endgame'))

# The Guardian's speech is English; keep the translated subtitles on screen in
# step with the voice (start ticks proportional to the spoken lines).
text = (SOURCE / 'game/intro/intro.cpp').read_text()
text = replace_once(text, '\t\tif (!SpeechEnabled)\n\t\t\tsubtitle.visible = 1;', '\t\tsubtitle.visible = 1;\n\t\tstatic const uint16_t SubtitleStarts[] = { 40, 125, 344, 519, 729, 935, 1185, 1432, 1628, 1861, 2139, 2403, 2599, 2725 };')
text = replace_once(text, '\t\t\tif (!SpeechEnabled && (KeyHit() || lineClock.elapsed() > (uint32_t) lineTicks)) {',
  '\t\t\tif (SpeechEnabled && line + 1 < lines.count && line + 1 < (int16_t) (sizeof SubtitleStarts / sizeof SubtitleStarts[0]) && clock.elapsed() >= SubtitleStarts[line + 1]) {\n\t\t\t\tsubtitle.setText(lines.getLine(++line));\n\t\t\t}\n\t\t\tif (!SpeechEnabled && (KeyHit() || lineClock.elapsed() > (uint32_t) lineTicks)) {')
(OUT / 'intro.cpp').write_text(absolute_includes(text, SOURCE / 'game/intro'))

# Inventory paperdolls: the panels in GUMPS.VGA are flat key-coloured
# silhouettes, and the page paints the high-resolution panel, figure and load
# text over the key pixels still on screen. The engine reports every paperdoll
# it paints (in back-to-front order), every position of a paperdoll being
# dragged and every closed gump, so the page always knows which panel owns
# which key pixels. The weight text moves to the page.
text = (OUT / 'gumpmgr.cpp').read_text()
text = replace_once(text, '\tif (WorldArea)\n\t\tWorldArea->paint(&Viewport);\n\tGumpNode *node = 0;', '\tweb_paperdolls_begin();\n\tif (WorldArea)\n\t\tWorldArea->paint(&Viewport);\n\tGumpNode *node = 0;')
text = replace_once(text, '\t\t\tBarkTexts[i]->paint(&Viewport);\n\tCopyFrameBuffer();\n}', '\t\t\tBarkTexts[i]->paint(&Viewport);\n\tweb_paperdolls_end();\n\tCopyFrameBuffer();\n}')
text = replace_once(text, '\tif (dialog) {\n\t\tdelete dialog;', '\tif (dialog) {\n\t\tweb_paperdoll_close((int) (intptr_t) dialog);\n\t\tdelete dialog;')
(OUT / 'gumpmgr.cpp').write_text(text)
text = (SOURCE / 'game/main/inv_ov2.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, 'ProportionalTextPrinter InventoryTextPrinter;', 'ProportionalTextPrinter InventoryTextPrinter;\nextern View Viewport;')
# Paperdolls use their own copies of the close and attack-mode buttons (GUMPS.VGA
# records 72 and 73, unused by the game) so they can carry high-resolution art
# without changing the buttons of bags and other gumps.
text = replace_once(text, '\tadd(&closeButton);\n\tcloseButton.show();\n\tadd(&statsButton);', '\tcloseButton.shape = FIRST_GUMP_SHAPE + 72;\n\tattackModeButton.shape = FIRST_GUMP_SHAPE + 73;\n\tadd(&closeButton);\n\tcloseButton.show();\n\tadd(&statsButton);')
text = replace_once(text, '''		View *saved = InventoryTextPrinter.target;
		InventoryTextPrinter.target = target;
		int16_t weight = DetermineWeightOfContents(Gump::object());
		int16_t load = weight / 10;
		if (weight % 10 != 0)
			load++;
		char text[20];
		sprintf(text, "%02d/%02d", load, NPCRef(Gump::object()).strength() << 1);
		halfWidth = InventoryTextPrinter.textWidth(text);
		halfWidth >>= 1;
		InventoryTextPrinter.x = bounds.x - halfWidth + 77;
		InventoryTextPrinter.y = bounds.y + 126;
		InventoryTextPrinter.printString(text);
		InventoryTextPrinter.target = saved;
''', '''		int16_t weight = DetermineWeightOfContents(Gump::object());
		int16_t load = weight / 10;
		if (weight % 10 != 0)
			load++;
		(void) halfWidth;
		if (target == &Viewport)
			web_paperdoll((int) (intptr_t) static_cast<Gump *>(this), shape, bounds.x, bounds.y, load,
				NPCRef(Gump::object()).strength() << 1, NPCRef(Gump::object()).number());
''')
(OUT / 'inv_ov2.cpp').write_text(text)
text = (SOURCE / 'game/main/itemdrag.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, '\tShapeManager_drawInViewport(&gShapeManager, bounds.x, bounds.y, image, 0, 0, 0);\n}', '\tShapeManager_drawInViewport(&gShapeManager, bounds.x, bounds.y, image, 0, 0, 0);\n\tweb_paperdoll_move((int) (intptr_t) this, bounds.x, bounds.y);\n}')
text = replace_once(text, '\tShapeManager_drawInViewport(&gShapeManager, dx, dy, image, 0, 0, 0);\n\tCopyFrameBuffer();', '\tShapeManager_drawInViewport(&gShapeManager, dx, dy, image, 0, 0, 0);\n\tweb_paperdoll_move((int) (intptr_t) this, dx, dy);\n\tCopyFrameBuffer();')
(OUT / 'itemdrag.cpp').write_text(text)

# Inventory buttons with a high-resolution icon (halo, disk, heart, dove/sword)
# are key silhouettes too; the engine reports their frame and hot spot.
text = (SOURCE / 'game/main/controls.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, '\tif (visible)\n\t\tShapeManager_draw(&gShapeManager, target, x, y, shape, frame, 0, 0);\n}', '\tif (visible) {\n\t\tShapeManager_draw(&gShapeManager, target, x, y, shape, frame, 0, 0);\n\t\tif (target == &Viewport && (shape == 1366 || shape == 1383 || shape == 1384 || shape == 1405 || shape == 1431 || shape == 1432))\n\t\t\tweb_paperdoll_icon(shape, frame, x, y);\n\t}\n}')
(OUT / 'controls.cpp').write_text(text)

# The start page can open a saved game directly: the engine restores that
# slot instead of the game directory.
text = (SOURCE / 'game/main/preload.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
text = replace_once(text, '\tSaveGameFiles.restoreGame(-1);', '\tSaveGameFiles.restoreGame(web_restore_slot());')
(OUT / 'preload.cpp').write_text(text)

# "Fades" option (Exult's video/disable_fades): when the page turns fades off,
# fade-out, fade-in and unfade reach their colours in one step (99% plus the minimum step lands exactly on the target); the effect's
# timing and the game logic stay as they are.
text = (SOURCE / 'game/main/palette/creeper.cpp').read_text().replace('#include "u7port.h"', '#include "u7port.h"\n#include "web_bridge.h"', 1)
start = text.index('\tcase EFFECT_UNFADE:'); end = text.index('\tcase EFFECT_LIGHTNING:')
segment = text[start:end]
assert segment.count('creeper->original[creeper->pal->order[i]], 9);') == 3
text = text[:start] + segment.replace('creeper->original[creeper->pal->order[i]], 9);', 'creeper->original[creeper->pal->order[i]], web_fade_step());') + text[end:]
(OUT / 'creeper.cpp').write_text(absolute_includes(text, SOURCE / 'game/main/palette'))
