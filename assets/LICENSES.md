# Asset Licenses

Har asset ka source aur license yahan likhna zaroori hai (design flow rule).

## Fonts

| Font | Files | Source | License |
|---|---|---|---|
| Atkinson Hyperlegible (Braille Institute) | `fonts/AtkinsonHyperlegible-Regular.ttf`, `fonts/AtkinsonHyperlegible-Bold.ttf` | github.com/google/fonts — `ofl/atkinsonhyperlegible` | SIL OFL 1.1 — `fonts/OFL-Atkinson.txt` |
| Nunito (Vernon Adams et al.) | `fonts/Nunito-Regular.ttf`, `fonts/Nunito-Bold.ttf` | github.com/google/fonts — `ofl/nunito/Nunito[wght].ttf`, static weights 400/700 fontTools se nikaale | SIL OFL 1.1 — `fonts/OFL-Nunito.txt` |

## Word data

| Data | Used for | Source | License |
|---|---|---|---|
| ENABLE word list | Bonus words (build time only, `tools/.cache/enable1.txt`) | github.com/dolph/dictionary | Public domain |
| WordNet 3.0 | Word meanings in `meanings/en.json` | wordnetcode.princeton.edu/3.0 | WordNet 3.0 license, full text in `WORDNET-LICENSE.txt`. **The copyright notice must be shown in the app's About screen.** |
| Hand-written meanings | `tools/meanings-extra.json` (words WordNet lacks or where its first sense is wrong for a family game) | Our own text | Ours |
| Offensive-word blocklist | Level checks only (`tools/blocklist/en.txt`, never shipped in the app) | LDNOOBW "List of Dirty, Naughty, Obscene, and Otherwise Bad Words" | CC BY 4.0 — attribution in About screen |

## Art

Landmark silhouettes, paper plane and clouds (`src/map/landmarks.ts`) are our own simple shapes.

## Map data

| Data | Used for | Source | License |
|---|---|---|---|
| Natural Earth 1:10m admin-0 countries, default view and India point of view (`_ind`) | Country colours on the World Trip map, `src/map/countries.default.json` / `countries.ind.json` (built by `tools/build-countries.ts`, which checks J&K, Ladakh incl. Aksai Chin and Arunachal Pradesh are inside India in the India view) | naturalearthdata.com via github.com/nvkelso/natural-earth-vector | Public domain |

The world map shows the India view when the phone region is India or the UI language is Hindi, and Natural Earth's default view elsewhere. Before release in India, have the India view checked against the Survey of India outline.
