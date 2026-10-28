# WordEase — Sound Flow (kahan kaun si aawaz)

Saari aawazein `tools/generate-sfx.py` se aur background music `tools/generate-music.py` se khud bani hain
(sine waves, FM electric piano, string pluck, noise). Koi recording ya bahar ki file nahi, isliye copyright ka
jhanjhat nahi. Koi voice nahi, sirf music.

**Rule:** naram aur sukoon wali aawazein, kabhi chubhti ya daraati nahi (players ko relax karna hai).
Settings → "Sound effects" aur "Background music" alag-alag on/off hote hain.

## Background music

Chaar gaane, har ek ~2.5 minute, Ogg Vorbis (`res/raw/music_*.ogg`, kul ~7 MB):

| Kahan | Playlist | Gaana | Kaisa |
|---|---|---|---|
| Onboarding, Map, World Trip, Album, Settings | `map` | `music_sunny` | F major, 76 bpm. Kalimba ki dhun, electric piano, naram lo-fi beat; beech mein flute wala hissa, phir dhun piano par |
| | | `music_garden` | D major, 84 bpm. Ungliyon se bajta guitar, flute ki dhun, neeche utarti bass line |
| Level, Daily Quiz | `level` (Map se dheema) | `music_pages` | C major, 66 bpm. Dheeme chords, kalimba ki halki lehar, kabhi-kabhi ghanti |
| | | `music_drift` | E♭ major, 62 bpm. Guitar, garam pad, flute ke kuch lambe sur |
| Splash, Celebration (Result) | — | Koi background music nahi | Yahan apni jingle bajti hai |

**Kaise bajta hai:** playlist ke gaane baari-baari bajte hain. Har gaana wahin se aage chalta hai jahan ruka tha,
isliye har level par wahi shuruaati hissa dobara nahi aata. Screen badalne par ~1.2 s mein dheere se fade hota
hai (Map ↔ Level par ek gaana ghatta hai aur doosra badhta hai). Ek second ke andar wapas aaye (Level → Result →
Next level) toh wahi gaana bina ruke chalta rehta hai. App background mein jaane par music ruk jaata hai, aur
Settings mein band karne par bhi.

**Research se kya liya:**
- Bina bol (lyrics) ka music: padhai par research mein lyrics wala music samajh ko sabse zyada nuksaan karta hai,
  bina bol ka music lagbhag neutral rehta hai. Level ke gaanon mein chalti hui dhun bhi nahi hai, taaki dhyaan
  letters par rahe.
- Kaan na thake: ek gaana jaldi-jaldi loop ho toh bore karta hai. Game music ke composers ki salah hai ki ~5 minute
  ka music ho, tab dohraya jaaye. Isliye har playlist mein do gaane hain (~5 minute), aur har gaana jahan ruka
  wahin se chalta hai.
- Har ~25-30 second mein kuch badalta hai (naya instrument aata ya jaata hai, dhun alag instrument par, ya beech
  ka hissa), taaki kaan ko kuch naya mile par jhatka na lage.
- Lo-fi / chill style: 60-85 bpm, 7th aur 9th wale naram chords, thoda insaani dheela-pan (timing aur zor mein
  halka farak, swing). Bass mein 2nd/3rd harmonic hai taaki phone ke chhote speaker par bhi sunai de.
- Dhun ka koi lamba sur chord ke sur se aadha sur upar ho (minor 9th) toh chubhta hai. Generator aise chord sur ko
  apne aap dhun ke sur par khisaka deta hai.

Sources: [Background music aur padhai (systematic review, 2022)](https://journals.sagepub.com/doi/10.1177/20592043221134392),
[Lyrics aur reading comprehension (2025)](https://ila.onlinelibrary.wiley.com/doi/full/10.1002/rrq.70004),
[Game audio loops aur thakan](https://www.gamedeveloper.com/audio/rethinking-the-audio-loop-in-games),
[Vertical layering (GDC 2021)](https://www.gamedeveloper.com/game-platforms/pure-vertical-layering-for-game-music-composers-from-spyder-to-sackboy-gdc-2021-),
[Lo-fi chords aur tempo](https://www.native-instruments.com/blogs/blog/lo-fi-chord-progressions).

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
- `android/.../SoundModule.kt` — chhoti aawazein SoundPool se (turant, ek saath kai), music MediaPlayer se
  (playlist, fade, har gaane ki ruki jagah yaad).
- Aawaz badalni ho: `tools/generate-sfx.py` mein badlo → `python tools/generate-sfx.py` → APK dobara banao.
- Music badalna ho: `tools/generate-music.py` mein badlo (dhun aur chords wahin text mein likhe hain) →
  `python tools/generate-music.py` (numpy, scipy, soundfile chahiye) → APK dobara banao.

## Jaan-boojh kar chup

- iOS: player abhi sirf Android ka hai (Play Store ke liye kaafi). iPhone build ke liye iOS player alag banana hoga.
