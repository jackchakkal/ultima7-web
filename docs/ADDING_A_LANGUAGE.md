# Adding a language

The game runs the original engine and script. A language is a set of translated game files that the page writes over `STATIC/` before the engine starts, plus a dictionary for the page around it. Brazilian Portuguese and Spanish are complete examples. Italian and Russian are registered as `planned` in `dist/languages.js`.

## 1. Register the language

Add or edit the entry in `dist/languages.js`:

```js
{code:'it', name:'Italiano', patch:'it', files:[...SCRIPT,...ART], ui:'it', status:'planned'}
```

- The language stays out of the menu until `status` is `available`.
- Saves are kept per language (IndexedDB profile `/profiles/<code>`), and the `.u7save` file carries every language.

## 2. Translate the script (USECODE)

All dialogue, books, signs and messages live in `USECODE`. There are two ways to translate it:

- **From an existing fan translation**, as `engine/import-spanish.py` does with the Clan DLAN Spanish patch. It matches every string of the translated USECODE to the original by function and position. The bytecode stays byte for byte; only string references, function sizes and `LINKDEP1/LINKDEP2` are rebuilt.
- **From a catalogue**, as Brazilian Portuguese does: `translation-overrides.json` holds `FUNCTION:index → text`. `engine/build_translation.py` applies the catalogue, `engine/build_linkdep.py` rebuilds the dependency cache, and `engine/check-translation.py` validates markers, characters and keywords.

Rules the engine imposes:

- **Conversation keywords** are compared byte for byte by the script (`cmps`/`cmpeq`). Each one must be translated the same way everywhere and fit in 29 bytes (`ANSWER_SIZE` = 30).
- **Keep the markers:** edge spaces, quotes, `@` (barks), `*` (pause), `~` (line break) and `|` (sign separator).
- **Text is single-byte**, and every character must exist in `FONTS.VGA`.

## 3. Fonts

`FONTS.VGA` holds ten fonts with one frame per character code.

- **Latin languages:** Italian, Spanish, French and Portuguese need accented letters. `engine/build_menu.py` draws them into spare frames, and the script text uses those codes.
- **Russian:** needs Cyrillic glyphs drawn into the 128–255 range of every font used by the game, including the rune and menu fonts where text is shown. Choose a single-byte code page (CP866 was common in DOS-era Russian patches; CP1251 is also possible). Encode the script text, `TEXT.FLX` and the page's `uiTexts` in that same code page. The page itself is Unicode and needs no change.

## 4. Text and art outside the script

| File | Content | Tool |
|---|---|---|
| `TEXT.FLX` | Object names and engine messages | `engine/patch_textflx.py` |
| `GUMPS.VGA` | Labels painted in panels (stats, spell scrolls, yes/no, quit) | `engine/build_gumps.py` (tables in `translations/menu/gumps-<code>.json`) |
| `POINTERS.SHP` | Cursor messages (TOO HEAVY, BLOCKED…) | `engine/build_pointers.py` (`translations/menu/pointers-<code>.json`) |
| `MAINSHP.FLX` | Original menu buttons, intro subtitles, credits, quotes | `engine/build_menu.py` |
| `ENDSHAPE.FLX` | Intro captions | `engine/build_menu.py` |

## 5. The page

- Add a dictionary to `dist/locales.js`; untranslated keys fall back to English.
- Ending texts go in `dist/cutscenes.js`.

## 6. Check and publish

```bash
python engine/check-translation.py
U7_LANGUAGE=<code> U7_SMOKE_MODE=save node engine/verify-flow.cjs
npm run release && npm run check
```

Set `status:'available'` and list the translators in the README's acknowledgements.
