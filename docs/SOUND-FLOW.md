# WordEase — Sound Flow (kahan kaun si aawaz)

Saari aawazein aur music `tools/generate-sfx.py` se khud bani hain (sine waves, string pluck, noise).
Koi recording ya bahar ki file nahi, isliye copyright ka jhanjhat nahi. Koi voice nahi, sirf music.

**Rule:** naram aur sukoon wali aawazein, kabhi chubhti ya daraati nahi (players ko relax karna hai).
Settings → "Sound effects" aur "Background music" alag-alag on/off hote hain.

## Background music

| Kahan | Music | Kab rukta hai |
|---|---|---|
| Onboarding, Map, Level, Globe, Album, Settings, Daily Quiz | `music_calm` — dheemi, sukoon wali loop (C–Am–F–G, ~24 s) | App background mein jaane par, Settings mein band karne par |
| Splash, Celebration (Result) | Koi background music nahi | Yahan apni jingle bajti hai, music beech mein nahi aata |

Level screen par music Map se thoda dheema bajta hai, taaki letters dhoondhte waqt dhyaan na bhatke.

## Har pal ki aawaz

| # | Screen / pal | Aawaz | File |
|---|---|---|---|
| 1 | Splash: letters aate hain, WORD aur EASE highlight | Do chamakti ghanti + chhota "ta-da" (logo jingle) | `sfx_splash` **(naya)** |
| 2 | Koi bhi button ya chunav: Map ka khula level, Globe card, Onboarding aur Settings ke saare chunav/switch, Celebration ke buttons, shabd ka chip, meaning card band karna, Share | Naram "pop" (+ halka vibration) | `sfx_tap` |
| 3 | Popup khulna (Shop, Daily calendar, Hint, Pause) | Kaagaz jaisa halka "swish" | `sfx_open` **(naya)** |
| 4 | Map: locked level dabana | Dheema "knock" (galti nahi, bas "abhi nahi") | `sfx_locked` **(naya)** |
| 5 | Level: pehla letter chhoona | Lakdi jaisa "tick" | `sfx_letter` |
| 6 | Level: letters par ungli ghumana | Chhoti blip, har letter par oonchi | `sfx_tick` |
| 7 | Level: shabd mila | Do ghanti upar jaati hui | `sfx_word` |
| 8 | Level: bonus shabd | Sikke ki khanak | `sfx_coin` |
| 9 | Level: galat chunav | Naram "bonk" | `sfx_wrong` |
| 10 | Level: hint liya (Spotlight / Compass / Reveal) | Jaadui chamak | `sfx_hint` **(naya)** |
| 11 | Level poora (aam level) | Celebration jingle (~3 s) | `sfx_level` |
| 12 | Level poora + naya landmark (15/30/45) | Jingle + upar ghantiyon ki dhun | `sfx_landmark` **(naya)** |
| 13 | World poora (har 60va level) | Badi fanfare | `sfx_world` **(naya)** |
| 14 | Celebration: har star pop | "Ding", har star par oonchi (1, 2, 3) | `sfx_star` **(naya)** |
| 15 | Celebration: sikke aaye / Double coins | Sikke ki khanak | `sfx_coin` |
| 16 | World-complete popup: passport stamp | Thump | `sfx_stamp` |
| 17 | Globe: naya world unlock (coins se, ya level jeet ke "New stop unlocked") | Khulne wali chamak | `sfx_unlock` **(naya)** |
| 18 | Shop: coins mile (khareed ke ya free "Watch" se) | Sikke ki khanak | `sfx_coin` |
| 19 | Daily Quiz: sahi / galat | `sfx_word` / `sfx_wrong` | |
| 19b | Daily Quiz jumble: letter rakhna | Lakdi jaisa "tick" | `sfx_letter` |
| 20 | Daily Quiz: combo 3+ | Oonchi "ding" | `sfx_star` |
| 21 | Daily Quiz: mystery chest khula | Dhakkan "pop" + sikke | `sfx_chest` **(naya)** |
| 22 | Daily Quiz poora | Celebration jingle | `sfx_level` |

## Kaise bajta hai (code)

- `src/ui/withTap.ts` — kisi bhi press par pop + vibration (IconButton/PrimaryButton jaisa) lagane ka helper.
- `src/services/audio/AudioManager.ts` — har pal ka ek function (`playHint`, `playStar(i)` …) aur music (`startMusic`, `stopMusic`).
- `android/.../SoundModule.kt` — chhoti aawazein SoundPool se (turant, ek saath kai), music MediaPlayer se (loop).
- Aawaz badalni ho: `tools/generate-sfx.py` mein badlo → `python tools/generate-sfx.py` → APK dobara banao.

## Jaan-boojh kar chup

- iOS: player abhi sirf Android ka hai (Play Store ke liye kaafi). iPhone build ke liye iOS player alag banana hoga.
