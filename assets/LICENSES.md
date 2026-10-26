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

Landmark silhouettes, paper plane, clouds and continent outlines (`src/map/landmarks.ts`, `src/map/continents.ts`) are our own simple shapes.
