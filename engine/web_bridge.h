#ifndef U7_WEB_BRIDGE_H
#define U7_WEB_BRIDGE_H
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
void web_dialog_begin(int mode, int speaker);
void web_avatar_gender(int male);
void web_dialog_text(int slot, int npc, const char *lines, int width, int count);
void web_dialog_choice(int index, const char *label);
void web_dialog_end(int choosing);
void web_dialog_hide(void);
void web_dialog_raw(int slot, const char *text, int mode);
void web_target_begin(void);
void web_target_end(void);
int web_target_cancelled(void);
void web_target_abandon(void);
int web_take_target_cancelled(void);
void web_dialog_clear(int slot);
void web_debug(const char *stage);
void web_bark_register(int shape, const char *text);
void web_bark_begin(void);
void web_bark_show(int shape, int x, int y);
void web_bark_end(void);
void web_item_caption(const char *text, int x, int y);
int web_audio_music_mode(void);
int web_audio_sfx_mode(void);
void web_audio_play_music(int track, int mode);
void web_audio_play_sfx(int number, int volume, int pan, int flags);
void web_audio_stop_sfx(int number);
void web_audio_set_sfx_volume(int number, int volume);
void web_audio_stop_sfx_all(void);
void web_apply_audio(void);
void web_restart_music(void);
int web_take_answer(void);
int web_take_continue(void);
typedef struct { int action,slot,music,speech,effects,music_source,sfx_source; char title[80]; } web_menu_request;
void web_menu_begin(int music,int speech,int effects);
void web_menu_slot(int index,const char *title);
void web_menu_end(void);
void web_menu_hide(void);
int web_menu_take(web_menu_request *request);
void web_sign_show(int shape, const char *text);
void web_sign_hide(void);
char *web_text(int id, const char *fallback);
const char *web_tr(const char *text);
void web_paperdolls_begin(void);
void web_paperdoll(int id, int shape, int x, int y, int load, int capacity, int npc);
void web_paperdoll_move(int id, int x, int y);
void web_paperdoll_close(int id);
void web_paperdoll_icon(int shape, int frame, int x, int y);
int web_restore_slot(void);
int web_fade_step(void);
void web_paperdolls_end(void);
#ifdef __cplusplus
}
#endif
#endif
