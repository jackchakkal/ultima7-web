#include "plat.h"

// A DOS program exit must escape its whole call tree. A typed C++ exception
// crosses Asyncify/indirect-call wrappers without resuming the disposed menu.
struct WebProgramExit { int code; };
extern "C" void web_exit_program(int code) { throw WebProgramExit{code}; }
extern "C" int web_invoke_program(const char *name, int argc, char **argv) {
    try { return ProgramMain(name, argc, argv); }
    catch (const WebProgramExit &exit) { return exit.code; }
}
