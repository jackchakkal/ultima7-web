# Portraits to redraw

The game shows a portrait by **face number**. Each new portrait must show the same person as the original face with that number. The original faces are in `docs/portraits/reference/<face>.png`; they are the model to follow. The list of faces still missing is `redrawNeeded` in `dist/portraits/faces/manifest.json`. Run `python engine/register_portraits.py --check` to print it.

## Style (same as the existing portraits)

- Painted fantasy portrait, realistic, warm oil-painting look, as in `dist/portraits/faces/1.webp` (Iolo) or `dist/portraits/faces/12.webp` (Finnigan).
- **Portrait orientation, 2:3**, at least 1024 × 1536. Head and shoulders, the face in the upper half, looking towards the viewer.
- Plain dark brown background, soft light. No frame, no text, no logo, no signature.
- Keep what identifies the person in the original: sex, age, skin tone, hair colour and style, beard, headwear, clothing colours, objects held.

## Faces

| Face | Name | Who to draw (from the original) |
|---|---|---|
| 26 | Batlin | Heavyset middle-aged man, full round face, long dark hair swept back to the shoulders, gold earring, faint smile. Cream robe collar with a gold Fellowship medallion. Deep blue tones. |
| 46 | James | Man around 40, curly golden-blond hair, thick drooping golden-brown moustache, ruddy face. Blue clothing. |
| 48 | Amanda | Young woman, wide warm smile showing teeth, shoulder-length wavy brown hair with a fringe, tanned skin. |
| 50 | Fred | Older man, bald head with a little white hair at the sides, broad smile, tanned skin, purple collar. |
| 51 | Kelly | Young woman, light-brown hair pulled up in a bun, round face, gentle smile, purple top. |
| 52 | Willy | Baker: round friendly man, rosy cheeks, tall white baker's cap and white clothes, brick oven wall behind. |
| 72 | Nell | Young woman, black hair in a bob with a fringe, white lace maid's headband, smiling, green dress. |
| 73 | Charles | Middle-aged man, short red-brown hair, seen three-quarters facing right, brown hooded servant's tunic. |
| 81 | Elynor | Woman, long wavy golden-blond hair, round face, a red mark on one cheek, serious look, plum dress. |
| 85 | Gladstone | Man, red-brown hair under a blue cap, blue tunic, three-quarter view, golden light. |
| 88 | Seara | Young woman, short black hair, white cap, wide smile, light skin. |
| 168 | Brita | Woman, two long blond braids, round face, gentle smile, green dress. |
| 179 | Polly | Woman, warm brown skin, cream head-wrap covering the hair, smiling, purple collar. |
| 205 | Zaksam | Man, dark brown skin, black beard and moustache, gold headband, broad grin. |
| 224 | Roberto | Young man, long blond hair with a braid over the shoulder, purple headband, white open-collar shirt. |
| 228 | Lucky | Man, dark brown skin, black hair in thin braids, gold hoop earring, smiling, yellow shirt (a pirate). |
| 248 | Brion | Older man, round face, purple soft cap with green dots, purple robe, holding a brass telescope. Identical twin of Nelson. |
| 249 | Nelson | Older man, the same face as Brion (twin), green soft cap with purple dots, green robe, holding a scroll. |

## Installing

1. Save each image as `dist/portraits/incoming/<face>.png` (for example `dist/portraits/incoming/26.png`).
2. Run `python engine/register_portraits.py`. It resizes and saves the portrait, registers it, rebuilds the regions and the release stamp, and prints what is still missing.
3. Run `npm run check`; it must end with "Release ready".
4. Do not edit `dist/app.js` or the manifest by hand, and do not touch other portraits.
