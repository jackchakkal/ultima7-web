#ifndef U7_WEB_BACKEND_H
#define U7_WEB_BACKEND_H
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include "plat.h"
const char *files_root(void);
void files_set_root(const char *dir);
void files_reset(void);
bool files_check_data(char *message, size_t size);
#endif
