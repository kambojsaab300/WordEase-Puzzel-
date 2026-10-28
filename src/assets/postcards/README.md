# WordEase postcards: game asset pack

20 worlds, one paper-cutout landmark postcard each.

## Copy into the app
Copy this whole folder to `src/assets/postcards/`.
`index.ts` uses static `require()` calls, so Metro bundles everything with no extra config.
WebP works on Android and on iOS 14+.

## What each world has
| Folder | Size | Use |
|---|---|---|
| `art/<slug>.webp` | 1080x489 | Postcard art, full colour |
| `art/<slug>-gray.webp` | 1080x489 | Same art in grey: the "sketch" before painting |
| `thumb/<slug>.webp` | 360x163 | World Trip map card / collection grid |
| `level/<slug>.webp` | 1080x1920 | Level screen background (scene at the bottom, sky above for the grid) |
| `stamp/<slug>.webp` | 256x256, transparent | Passport stamp after a world is finished |
| `svg/<slug>.svg` | vector | Master art, to re-export at any size later |

`worlds.json` has the text for each world: name, local name, "Did you know?" fact, default sky and an accessibility label.

## Paint the Postcard
The World Trip card stacks the grey image under the colour image and fades the colour in as levels are won.
With Skia, load `art/<slug>.webp` and lerp a grayscale ColorMatrix by the share of levels won.

## Notes
- Text is not baked into the art, so Hindi and other languages only need new strings in `worlds.json`.
  Stamps contain English text; regenerate them for the Hindi build.
- Only landmarks marked Free in the Landmarks plan are drawn. Italy, Greece, Mexico, Peru and Egypt use generic scenes
  (canal, island village, plaza, Rainbow Mountain, Nile felucca). New York uses a generic skyline.
- All art is original, simplified drawing. No logos, brand names or real people.
