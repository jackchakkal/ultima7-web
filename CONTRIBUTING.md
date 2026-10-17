# Contributing

Thank you for helping. *Contribuições em português e em espanhol também são bem-vindas. Las contribuciones en español también son bienvenidas.*

The most useful contributions now:

1. **Playtesting.** Play on desktop and on phones; report problems with the "Game problem" template, including the version shown on the page.
2. **Performance.** Loading time, memory and smoothness on slow devices. Measurements (browser, device, before and after) make changes easy to review.
3. **Translation review.** Use the "Translation error" template and give the `FUNCTION:index` key when you know it.
4. **New languages.** Follow [docs/ADDING_A_LANGUAGE.md](docs/ADDING_A_LANGUAGE.md). Open an issue first so the work is not duplicated, and tell us whether you start from an existing fan translation and have its authors' permission.

## Rules

- **No original game data** in commits: no `STATIC/` files, built `dist/patch/` files, game packs, audio packs or engine binaries. Pull requests that add them are closed.
- **No secrets** (tokens, `.env` files) and no personal data in code or tests.
- **Translations:**
  - Keep the markers: edge spaces, quotes, `@`, `*`, `~` and `|`.
  - Conversation keywords must match the glossary (`translations/ptbr-glossary.json`) and fit in 29 bytes.
  - Portuguese follows `translations/GUIA-ptbr.md`: archaic register (*tu/vós*), wording that fits a male or female Avatar.

## Before you open a pull request

```bash
npm run release && npm run check
python engine/check-translation.py                 # when the script text changed
U7_SMOKE_MODE=save node engine/verify-flow.cjs     # when the engine or saves changed
```

By contributing you agree that your code is licensed under GPL-3.0-or-later and your art under CC BY-SA 4.0.
