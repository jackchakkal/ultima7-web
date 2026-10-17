# Ultima VII Web

**English** · [Português do Brasil](docs/readme/README.pt-BR.md) · [Español](docs/readme/README.es.md)

*Ultima VII: The Black Gate* with *Forge of Virtue*, running in the browser on its original engine compiled to WebAssembly. Open the page and play. There is nothing to install, no emulator and no files to provide.

**Play:** <https://ultimavii.vercel.app>

The project is about running the game online well: it starts fast, plays smoothly on desktop and phone, looks sharp on modern screens and never loses your progress. Translations come from the same work, because a clean, portable engine makes new languages easy to add.

## Contents

- [Performance](#performance)
- [Picture and sound](#picture-and-sound)
- [Saved games](#saved-games)
- [Controls](#controls)
- [Languages](#languages)
- [Privacy and security](#privacy-and-security)
- [Running and building](#running-and-building)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [Acknowledgements and references](#acknowledgements-and-references)
- [Licenses](#licenses)
- [Legal notice](#legal-notice)

## Performance

- **Native engine, no emulation.** The C/C++ source from [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp) is built with Emscripten. The game runs as a 4 MB WebAssembly module, not inside a DOS emulator.
- **One verified download.** The game's 193 resources ship as a single 17.4 MiB pack, checked with SHA-256 and kept in the browser cache. Later visits start from the cache.
- **Long-lived caching.** Engine, portraits and inventory art have versioned addresses and are served as immutable. A new release downloads only what changed.
- **Assets ready before they are needed.**
  - Inventory figures and buttons are fetched and decoded while the game loads, so the first inventory opens complete. Figures are resized to the largest size the screen ever shows: 1 MB in all, down from 4.5 MB.
  - Portraits of the Avatar and the party load at start. The rest follow the Avatar: the engine reports the Avatar's position, and the page fetches the portraits of the people who live or work nearby, according to their schedules.
- **Light on memory.**
  - Music streams through a single audio element.
  - Sound effects are decoded on demand into a small cache.
  - The engine starts with 64 MB of memory.
- **Phones.** Touch controls, landscape layout and full-window play. The page header hides during play.

## Picture and sound

- **Exult's video options**, using Exult's own code compiled into the engine:
  - 14 scalers: Point, Interlaced, Bilinear, BilinearPlus, 2xSaI, SuperEagle, Super2xSaI, Scale2x, Hq2x/3x/4x and 2xBR/3xBR/4xBR.
  - Scaler factor and fill scaler.
  - Fit, centre or stretch.
  - 8:5 or 4:3.
  - Gamma per channel.
  - In-game fades and border colour.
- **High-resolution text.**
  - Conversations, books and scrolls are drawn by the browser at screen resolution, while the game logic still decides every line and answer.
  - Signs keep their runes, with a Latin transcription beneath.
- **High-resolution inventory.**
  - Each character's panel is repainted in the style of the portraits.
  - Slot guides point to the body.
  - The buttons are redrawn.
  - Items, open bags and the cursor still sit on top, and night darkens the panel like the rest of the world.
- **Redrawn portraits** for every character.
- **Sound.**
  - Music: original OPL synthesis, Simon Quinn's Roland MT-32 recordings, or JD Harding's remix.
  - Effects: OPL, Joseph Morris's SoundBlaster set, or Simon Quinn's MT-32 set.

Defaults: JD Harding music, SoundBlaster effects, 60% volume, Point scaler at 8:5, and an automatic Avatar portrait.

## Saved games

- **Continue journey** resumes the latest save. **Load game** lists every saved game and opens any of them.
- Progress lives in the browser and does not depend on the site version, so updates never erase it.
- **To move to another browser or device:**
  - **Download progress (.u7save)** writes one file with every game in every language; **Open .u7save file** restores it.
  - A **recovery code** such as `ABCD-EFGH-JKMN` stores the same file on the server; type the code on the other device. After that, every save updates the same code.
- The in-game save menu (`S`) has ten named slots, save and load, file download, recovery codes and import from another browser.

## Controls

| Action | Mouse and keyboard | Touch |
|---|---|---|
| Walk | Hold the right button | Touch and hold (the Avatar follows your finger) |
| Talk, use, open | Double-click | Double-tap |
| Move an item | Drag | Drag |
| Inventory | `I` | Inventory button |
| Save menu | `S` | Save button |

Answers and **Continue** are buttons in the reading panel. **Reading** sets dialogue position, font, size and contrast; **Conversations** shows this session's history.

## Languages

Each language keeps its own saved games. Pick a language in the page header, or open `?lang=<code>`.

| Language | Code | Status | Source |
|---|---|---|---|
| English | `en` | Playable | Original game |
| Português do Brasil | `pt-BR` | Playable | This project |
| Español | `es` | Playable | Imported from L@Zar0 / Clan DLAN's Final V1 |
| Italiano | `it` | Planned | — |
| Русский | `ru` | Planned | — |

Notes on the Portuguese and Spanish versions:

- **Portuguese (Brazil).** The whole campaign is translated:
  - 21,182 strings across all 1,012 script functions, plus object names and engine messages.
  - Menu buttons, intro captions, credits, panel labels and cursor messages are redrawn in the game's own fonts.
  - The style is archaic (*tu/vós*), and every line reads correctly for a male or a female Avatar.
- **Spanish.** 21,476 strings are imported from the fan translation. The game's bytecode is kept byte for byte; only string references and the dependency cache are rebuilt.

How to add a language, including Cyrillic fonts for Russian, is described in [docs/ADDING_A_LANGUAGE.md](docs/ADDING_A_LANGUAGE.md). Languages are registered in `dist/languages.js`.

## Privacy and security

- **No tracking.** No accounts, no cookies, no analytics, no third-party requests: every file comes from the site itself.
- **Your games stay with you.**
  - Saved games are kept in your browser's storage.
  - Nothing is uploaded unless you create a recovery code. The server then stores only that save file, under a random 60-bit code. No name, e-mail or other personal data is asked for or stored.
  - Anyone who has the code can read and overwrite that save, so keep it private.
- **Strict headers.**
  - Content-Security-Policy with no inline scripts and no outside origins.
  - HSTS, framing denied, `nosniff`, a strict referrer policy, and a Permissions-Policy that turns off camera, microphone, location, payment and similar features.
- **Untrusted input is bounded.**
  - Save files and codes are size-checked and decompressed with a cap.
  - Paths inside a save are validated.
  - The server accepts only real backups.
  - Moving progress from the old address accepts only that exact origin and window, and asks before importing.

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## Running and building

This repository holds the code, the tools and the new art, but **no original game data**.

**To run it yourself:**
1. Own a copy of the game (for example *Ultima 7 Complete* on [GOG](https://www.gog.com/en/game/ultima_7_complete)).
2. Package its `STATIC/` folder with `node engine/package-game.mjs <path>/STATIC`.
3. Run `npm start` and open `http://127.0.0.1:8077`. The local server serves only `dist/`, like the hosted site.

**Requirements:**
- Node.js 22 or later.
- Git, Python 3, CMake and **Emscripten 6.0.12** to build the engine.

**Build the engine:**

```bash
bash engine/build.sh    # fetches Ultima7_Decomp at 770e21a, applies the browser layer, writes dist/engine/
```

**Build the translated files** (with `U7_GAME_DIR` pointing at the folder that contains `STATIC/`):

```bash
python engine/build_translation.py   # USECODE from translation-overrides.json
python engine/build_linkdep.py       # LINKDEP1/LINKDEP2
python engine/patch_textflx.py       # TEXT.FLX
python engine/build_menu.py          # menu buttons, intro, credits
python engine/build_gumps.py         # panel labels and inventory silhouettes
python engine/build_pointers.py      # cursor messages
python engine/check-translation.py   # markers, characters, keywords
```

**Audio packs.** Download the Black Gate packs from [Exult's download page](https://exult.sourceforge.io/download.html), then run `python engine/package-audio.py <exult-pack>.zip <jd-harding-remix>.zip`.

**Checks:**

```bash
npm run release && npm run check                  # release stamp and file checks (also run by the host)
U7_SMOKE_MODE=save node engine/verify-flow.cjs    # plays the opening, saves and restores
```

**Recovery codes.** Codes need a [Vercel Blob](https://vercel.com/docs/vercel-blob) store connected to the project (`BLOB_READ_WRITE_TOKEN`). Without it, save files still work and the page says that codes are off. Locally, codes are kept in `.local/saves`.

## Project layout

| Path | Content |
|---|---|
| `dist/` | The site: page, styles, scripts, fonts, portraits, inventory art |
| `dist/languages.js` | Language registry |
| `api/save.js`, `lib/save-codes.js` | Recovery-code function |
| `engine/` | Browser layer for the engine (`browser.c`, `prepare.py`, `CMakeLists.txt`), Exult scalers, build and test scripts |
| `engine/build_*.py` | Tools that write the translated game files |
| `translation-overrides.json` | Portuguese script catalogue (`FUNCTION:index` → text) |
| `translations/` | Glossary, style guide, Spanish catalogue and licence, panel and cursor tables |
| `docs/` | Adding a language; this README in other languages |

## Contributing

Bug reports, fixes, playtesting and new languages are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). For translation reports, include the `FUNCTION:index` key from the catalogue if you know it.

## Acknowledgements and references

**Engine and tools**
- [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp): the decompiled engine this port is built on.
- [Exult](https://github.com/exult/exult): the scalers, the usecode opcode table and decades of file-format knowledge.
- [Nuked OPL3](https://github.com/nukeykt/Nuked-OPL3) by Nuke.YKT: AdLib synthesis.

**Music and sound** (packs distributed by [Exult](https://exult.sourceforge.io/download.html))
- Simon Quinn: digital Roland MT-32 music and effects.
- Joseph Morris: SoundBlaster effects.
- JD Harding: the music remix.

**Fonts**
- [Source Serif 4](https://github.com/adobe-fonts/source-serif) and [Inter](https://github.com/rsms/inter), under the SIL Open Font License.

**Translations of Ultima VII**

These are the translations we know of. They are the references for future languages in this project, and none of their files are included except the Spanish one, which is used under its GPL licence. More details are on the [Ultima Codex list of translations](https://wiki.ultimacodex.com/wiki/Translations_of_Ultima_VII).

- **Spanish:**
  - *Final V1* (2017) by **L@Zar0 / Clan DLAN**, covering *The Black Gate* and *Forge of Virtue*. Imported into this project, under GPL-3.0; credits in `translations/LEEME-es.txt`. It also served as a reference for the Portuguese meaning.
  - An earlier fan translation with *Forge of Virtue* by **Dantoine's group**.
- **Italian:**
  - *Il Portale Oscuro* and *La Forgia della Virtù* (2009) by the **Babylon Team** of OldGamesItalia, coordinated by **The Ancient One** with final review by **Ragfox**.
  - Text, graphics and speech, for Exult.
  - See the [Ultima Codex page](https://wiki.ultimacodex.com/wiki/Ultima_VII_in_Italiano).
- **Russian:**
  - A fan translation by **Sleepy Emp & Quester** for Exult, listed on [PCGamingWiki](https://www.pcgamingwiki.com/wiki/Ultima_VII:_The_Black_Gate).
  - Collected with other mods in [Exult's translations discussion](https://github.com/exult/exult/discussions/260).
- **German:**
  - Origin's official German release (floppy disks only).
  - **Sir John**'s fan patch [*Ultima VII auf Deutsch*](https://wiki.ultimacodex.com/wiki/Ultima_VII_auf_Deutsch), which covers *Forge of Virtue*, graphics and voices.

If you made one of these translations, or know of another one, please open an issue. We will gladly correct or add the credit, and ask permission before importing anything.

**Origin Systems and Richard Garriott** made the game. This project exists out of affection for it.

## Licenses

- **Our code** (`dist/*.js`, `dist/*.html`, `dist/*.css`, `api/`, `lib/`, `engine/` scripts and the browser layer): [GPL-3.0-or-later](LICENSE).
- **Our art** (redrawn portraits, inventory figures and icons): [CC BY-SA 4.0](LICENSE-ART.md).
- **Third-party parts** keep their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
  - Exult scalers and opcode table: GPL-2.0-or-later.
  - Ultima7_Decomp's new code: MIT. Its decompiled game code remains Electronic Arts' property and is downloaded at build time, not stored here.
  - Nuked OPL3: LGPL-2.1.
  - Spanish translation: GPL-3.0.
  - Fonts: OFL-1.1.

## Legal notice

This is a non-commercial fan project. It is not affiliated with or endorsed by Electronic Arts. *Ultima* is a trademark of Electronic Arts. The game, its data, text and original art belong to Electronic Arts and keep their licences.

This repository contains no original game files. The hosted version provides them so the game runs without setup; they will be removed on request from the rights holder. If you enjoy the game, please buy it on [GOG](https://www.gog.com/en/game/ultima_7_complete).
