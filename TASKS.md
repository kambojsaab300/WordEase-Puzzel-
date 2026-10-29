# WordEase — Chhote Tasks ka Plan

Source: `WordEase: Word Search Puzzle — Game Design & Build Flow.pdf` (26 pages).

**Kaam karne ka tareeka:** ek baar mein ek task. Har task ke end mein APK banegi, aap phone par
test karoge, "OK" bologe, tab agla task. Har task ka status yahan update hoga.

Status: `[ ]` baaki · `[~]` chal raha hai · `[x]` ho gaya, test pass

APK banana:
```bash
cd android && gradlew.bat assembleRelease
```
APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Phase 0 — Base app
- [x] **T0. Hello World app** — RN 0.88 CLI + TypeScript, New Arch + Hermes, ABIs `arm64-v8a,x86_64`.
  - Test: app khule, cream screen par "Hello World".

## Phase 1 — Foundation (UI system)
- [x] **T1. Theme + folder structure + basic buttons**
  - `src/` folders (flow ka structure), `src/ui/theme.ts` (colour tokens, sizes), `PrimaryButton` (56dp pill), `IconButton` (56dp).
  - Home screen par logo text + Play button.
  - Test: rang flow jaise, button bada (56dp), tap par response.
- [x] **T2. Fonts** — Atkinson Hyperlegible (grid, chips), Nunito Bold (UI); OFL license `assets/LICENSES.md` mein.
  - Test: naye fonts dikhen, text saaf padha jaye.
- [x] **T3. Navigation** — React Navigation 7 native-stack; screens: Splash, Onboarding, Map, Globe, Album, Level, Result, Settings, About.
  - Test: buttons se har screen par jaana aur Back se wapas.
- [x] **T4. Baaki UI components** — CoinPill, StarRow, WordChip, ProgressBar, Toast, PostcardModal, HintSheet, MeaningCard, PassportStamp, ShopModal, DailyCalendarModal.
  - Test: har component pixel-perfect aur responsive.

## Phase 2 — Game engine (pure TypeScript + Jest tests)
- [x] **T5. Seeded random + generator v1** — `prng.ts` (mulberry32), `placeWords.ts` (lambe se chhote, backtracking), `fill.ts`; directions.
  - Jest: same seed = same puzzle, har word theek ek baar.
  - Test: 35 engine & generator Jest tests pass.
- [x] **T6. Selection logic** — `selection.ts` (8-direction snap, 22.5°), `validate.ts` (aage + ulta match).
  - Jest: har direction, ulta drag, kinare.
- [x] **T6b. Difficulty ladder v2 (ulte shabd)** — 2026-10-28: pehle ulta (← ↑) shabd level 121 se pehle aata hi nahi tha. Ab har stage EK nayi direction jodti hai: 1-10 → ↓, 11 ← (RAC = CAR), 26 ↘, 46 ↑, 61 ↗, 121 se saari 8. Naya stage 2 halke levels se khulta hai aur pehle level par "Naya!" tip (6 bhashayein) jab tak us direction ka shabd na mile. Ulte shabdon ka hissa 25% → 60% tak dheere badhta hai (`levelSpec.ts` BANDS, `placeWords.ts` directionPlan). 301+ filler mein theme ke akshar (decoy), 501+ shabd ek doosre ko kaatte, 801+ adhoore shabd (TIG… TIGER ke liye). Validator har level par ulta share aur nayi direction check karta hai.

## Phase 3 — Core gameplay (sabse bada hissa)
- [x] **T7. Skia + Reanimated 4 + Gesture Handler install** — Skia canvas aur gesture handling.
  - Test: 60/120 FPS GPU rendering.
- [x] **T8. Grid render (Skia)** — `GridCanvas.tsx`, 8x8 grid, dynamic cell size auto-fit, Atkinson font.
  - Test: grid saaf, phone par fit.
- [x] **T9. Drag selection + capsule highlight** — line snap, mila word rangeen capsule (Okabe-Ito rang), galat par halka shake.
  - Test: ungli se word smoothly dhoondh sakein.
- [x] **T10. Word chips + level complete** — chips par tick, saare words mile → Result screen (stars, coins).
  - Test: pura level khel kar Result tak jaana.
- [x] **T11. Tap-Tap input mode** — pehla + aakhri letter tap (GridCanvas + Settings toggle + Onboarding).
  - Test: Tap-Tap mode perfectly working.
- [x] **T12. Save (MMKV v4 + zustand)** — progress, wallet, settings, daily; har word par `inProgress` save; `schemaVersion`.
  - Test: level ke beech app band karo, kholo → wahi se shuru.

## Phase 4 — Levels content
- [x] **T13. `tools/generate-levels.ts`** — World 1 se 20, 1,200 levels JSON pre-generated; difficulty table + sawtooth.
- [x] **T14. Level checks (CI script)** — har word ek baar, blocklist scan, `npm run levels:validate` pass.
  - Test: 1,200 shipped levels automated verification OK.
- [x] **T15. Meaning card + bonus words** — WordNet meanings card; ENABLE list se bonus +1 coin.

## Phase 5 — Map & progression
- [x] **T16. Route map v1** — FlashList, level nodes (Locked / Current / Done / Landmark), auto-scroll to current.
  - Test: map se level kholo, jeeto, agla node khule.
- [x] **T17. Map art + paper plane + parallax** (Reduce Motion par band). 2026-10-27: "Level Map" design — paper plane ki jagah hot-air balloon, naya scenery/road/nodes (Progress log dekho).
- [x] **T18. Globe view + 20 worlds + baadal unlock animation.**
- [x] **T19. Passport album** — har world par stamp.
- [x] **T19b. Landmarks visual plan** (upgrade PDF) — har world ke 4 famous landmarks (level 15/30/45/60), 80 apne paper-cutout silhouettes; route par har landmark level ka apna sight + naam plaque, TalkBack label mein naam; Result par "You reached …" postcard (pehli jeet par); album mein har stamp ke neeche 4 landmarks + total ginti; 6 bhashaon mein naam.

## Phase 6 — Economy, hints, daily
- [x] **T20. Coins + Hints** — Spotlight 25 / Compass 40 / Reveal 60; stars hint ke hisaab se.
- [x] **T21. Daily Postcard** — calendar, streak, freeze (sirf 1 chhoota din, har hafte 1 refill), 7-din reward cycle, date-peeche par inaam nahi, apna save slot. 2026-10-26 audit mein streak bugs fix.
- [x] **T22. Onboarding + Tutorial level** — text size preview, input mode, Level 1 par animated haath (drag ya tap-tap dikhata hai, Reduce Motion par sthir).

## Phase 7 — Settings, audio, accessibility
- [x] **T23. Settings screen** — Text Size ab grid letters (28/34/42), cells, chips, meaning card aur buttons par lagta hai; Huge mode mein grid max 10x10 (bade levels ka 10x10 version). **Baaki:** baaki screens ka text scale.
- [~] **T24. Audio + Haptics** — Haptics kaam karta hai. Sound effects (`tools/generate-sfx.py`) + background music ke 4 gaane (`tools/generate-music.py`) khud synthesize kiye, Android SoundPool/MediaPlayer se bajte hain; kahan kaun si aawaz: [docs/SOUND-FLOW.md](docs/SOUND-FLOW.md). **Baaki:** phone par sun ke test.
- [~] **T25. Accessibility pass** — High contrast (safed board, kaale letters, grid lines, gehre outlines) aur colour-blind patterns + chip symbols game screen par. **Baaki:** TalkBack aur font scale "Largest" asli phone par test; high contrast baaki screens par.

## Phase 8 — Kamai (ads + IAP)
- [~] **T26. UMP consent + AdMob init** — 2026-10-29: `react-native-google-mobile-ads` 17.4.0 laga; app start par consent (UMP) → SDK → interstitial + rewarded load (`src/services/ads/admob.ts`); IDs `src/services/ads/adKeys.ts` mein, App ID `app.json` mein (abhi Google test IDs); rewarded sirf poora dekhne par inaam, ad na ho to "No ad is ready yet" (6 bhashayein). **Baaki:** apni IDs daalna (`docs/ADS-AND-FIREBASE.md`), Settings mein "Privacy choices" button, EEA debug geography se test, app-ads.txt, APK par test.
- [~] **T27. AdsManager** — caps ka logic aur tests hain. **Baaki:** koi ad SDK nahi; free-coin cap memory mein (restart par reset).
- [~] **T28. Rewarded ads** — **STUB:** `showRewardedAd` bina ad ke turant inaam deta hai. react-native-google-mobile-ads chahiye.
- [~] **T29. Shop + Remove Ads / coin packs** — UI hai, "Test build" label ke saath. **STUB:** koi payment nahi; react-native-iap + Play Billing chahiye.

## Phase 9 — Launch prep
- [~] **T30. Analytics** — event list `AnalyticsManager` mein; 2026-10-29: `@react-native-firebase/app` + `analytics` 27.1.0, har event Firebase ko jaata hai (`firebaseSink.ts`) jaise hi `android/app/google-services.json` daloge; uske bina build aur app normal. **Baaki:** google-services.json, BigQuery export, Crashlytics/Remote Config, APK par test.
- [x] **T31. About screen** — WordNet notice, ENABLE, LDNOOBW (CC BY 4.0), fonts. Splash + app icon 2026-10-27 ko bane (logo concept A "Found Word", animated splash) — Progress log dekho.
- [ ] **T32. Release signing + AAB, R8 on** (apni upload key). 2026-10-28: R8 + shrinkResources on (build + phone test baaki). **Baaki:** apni upload key (abhi debug keystore), AAB.
- [ ] **T33. Maestro E2E 7 flows + device matrix test.**
- [ ] **T34. Play Console: closed test 20+ testers, 14 din.**

## Phase 10 — Bhashayein (localization)
- [~] **T35. Multi-language i18n** — UI 6 bhashaon mein (en, es, pt-BR, de, fr, hi): saari screens, toasts, alerts, TalkBack labels, world names; onboarding par bhasha chunna; Settings se turant badalna; month names locale se. **Baaki:** native speaker review (flow rule), har bhasha ki puzzle word lists + store listing; Hindi ke liye Noto Sans Devanagari font (abhi phone ka system font).
- [ ] **T36. Hindi Devanagari grid generator pack** — Hindi grapheme splitting.

## Phase 11 — Difficulty v3 (Candy Crush jaisa, plan `docs/DIFFICULTY-FLOW.md`)
- [x] **D1. Search bot + report** — insaan ki tarah shabd dhoondhne wala bot (`src/game/difficulty/searchBot.ts`), har level ka andaazan seconds; `npm run levels:difficulty` → `tools/.cache/difficulty-report.html` + CSV. Levels nahi badle. Nateeje `docs/DIFFICULTY-FLOW.md` mein.
- [x] **D2. Target curve + generator fit** — har level ka role (warm-up, intro, normal, breather, peak, hard, finale) aur target time (`src/game/difficulty/target.ts`); tool har level ke 12 puzzle bana kar target ke sabse paas wala chunta hai, sawtooth ke 3 niyam ke saath (dip pichhle se aasaan, landmark apne stretch se hard, finale world mein sabse hard); peaks ulte shabd + decoy se hard, shabd nahi badhte (80 mein se 7 ko ek shabd zyada laga); validator niyam + ±50%; 1,200 levels dobara. Chhote shabdon ka knob chhoda: bot use naap nahi sakta (D4 ke baad).
- [x] **D3. Hard / Super hard tag** — landmark 15/30/45 = Hard, finale 60 = Super hard (`levelTag`); map node par 🔥 badge (narangi / baingani) + TalkBack mein "Hard level"; level par pehla shabd milne tak pill "🔥 Hard level · +15 bonus coins…"; pehli jeet par Hard +15, Super hard +30 coins, Result par bonus ki line; 6 bhashayein.
- [x] **D4. Phone par play data** — sirf asli khelne ka time (pause, background, doosri screen nahi gini jaati); har level ke opens, quits, wins aur **sirf pehli jeet** ka time + hints phone mein (`store/playStats.ts`); analytics events Level screen se (start, shabd, hint, complete, quit); chhupi "Play data" screen (About → version par long-press): tumhara time ÷ bot time, rank match, table, Share as text, Clear; `npm run levels:calibrate -- file.csv` pace batata hai. Huge text wali chhoti grid aur Daily alag rakhe.
- [x] **D5. Atke player ko free nudge** — faisla: star **nahi** katega, aur player ko offer milega (khud nahi lagega). 60 s asli khel mein koi shabd nahi, ya level pehle 2 baar chhoda → neeche tairti pill "💡 Stuck? Tap for a free hint" (grid nahi hilti); tap → agle shabd par free Spotlight, coins nahi, star nahi; har attempt mein ek (app band karke dobara nahi), Restart par wapas; 3 star par Result kehta hai "free hint gina nahi" (jhooth "ek bhi hint nahi" nahi); 6 bhashayein.
- [~] **D6. Live tuning** — tools taiyaar: BigQuery query (`docs/DIFFICULTY-FLOW.md` step 6) → `npm run levels:tune -- levels.csv` sabse kharab 5% levels (quit, hints, time apne role ke hisaab se) ka target ×0.85 karta hai (`tools/level-tuning.json`) → `levels:generate` unhe aasaan banata hai, sawtooth niyam ke saath. **Baaki:** Firebase keys + asli players ka data (closed test T34).

## Phase 12 — Postcard design (poori app, chuna gaya design "3 · Postcard Table")
Look: screen = garam table rang (`colors.bgTable`), card = airmail dhaariyon wala postcard (`src/ui/PostcardFrame.tsx`, Skia), word = luggage tag, kone mein world ka postmark (`src/ui/PostmarkStamp.tsx`).
- [~] **P1. Base + game screen** — 2026-10-29: theme tokens; `Screen` + navigation ka background table rang; IconButton = paper chehra + neeche gehra 3D kinara (dabane par neeche jaata hai, poori app), `tone="gold"` sikko wale kaam ke liye; game screen par Pause aur Hint ke emoji ki jagah khud bane icon (`src/ui/GameIcons.tsx`: neele bars, chamakta bulb sunehre button par); game screen par grid ek postcard mein, halka 3D jhukaav (rotateX 7°, rotateZ -0.6°; High contrast par seedha), upar world naam + theme + stamp (har shabd par thump, Reduce Motion par nahi; Daily/Classic par stamp nahi); upar `3 / 6` + progress + coins; words luggage tags; Pause = postcard, Hints sheet par airmail patti, meaning card paper. Grid ka cell size aur zoom pehle jaisa (frame gutter mein jaata hai). Grid ka Skia Canvas `TextureView` (jhukaav ke saath touch sahi). Table rang par phike hue rang theek: Quiz dots, locked world card, khali passport stamp. **Baaki:** phone par test (touch jhuke grid par, chhote phone par jagah).
- [~] **P2. Baaki paper screens** — 2026-10-29: niyam "ek screen par ek airmail postcard, baaki paper card" (`paperCard` style, `PostcardFrame.tsx` mein). Airmail postcard: Shop, Daily calendar, Postcard modal (world/landmark inaam), About ka upar wala card, Result ka celebration postcard (dhaariyon wala kinara; Result ka nila jashn wala scene waisa hi). Paper card: Settings, About, Onboarding, Quiz (intro, jawab, summary) ke sections; thande grey segment/chips garam rang mein; Shop ki rows par kinara. Daily calendar ka andar ka padding 15 taaki 360 dp phone par haftay ke 7 din pehle jitne chaude rahen. Quiz ka sawal postcard mein nahi daala: Jumble tiles screen ki chaudai se bante hain, frame se kat jaate. **Baaki:** phone par test.
- [~] **P3. Map, Globe, Album** — 2026-10-29: airmail dhaariyan ab Skia ki jagah ek chhoti repeat tile (`src/assets/ui/airmail*.png`, 40 dp, bina jod ke), taaki 20 world cards ki list halki rahe; saare postcards par wahi. Map: emoji buttons ki jagah bane icons (`GameIcons`: calendar, settings sliders, globe, passport, pin), upar ki patti paper + neeche airmail kinara, world chip paper tag. Globe: har world card ki tasveer airmail frame mein (locked par halki). Album: stamps ek passport panne (paper card) par, stamp ka size panne ke hisaab se. Game screen ke zoom ➖➕ bhi bane icons. Map ka scenery/route art nahi chheda. **Baaki:** phone par test.

---

## Progress log
| Task | Date | APK / Tests | Result |
|---|---|---|---|
| T0 | 2026-10-26 | app-release.apk | Build OK |
| T1 | 2026-10-26 | WordEase-T1.apk | Phone test OK |
| T2 | 2026-10-26 | WordEase-T2.apk | Phone test OK |
| T3 | 2026-10-26 | WordEase-T3.apk | Phone test OK |
| T4-T10 | 2026-10-26 | WordEase-T10.apk | Build OK, 35 Jest tests pass |
| T11-T25, T27-T31, T35 | 2026-10-26 | All Suites Pass | 77 Jest tests pass (8 suites), 1,200 levels validate OK, TS 0 errors |
| Audit | 2026-10-26 | WordEase-audit.apk | 155 Jest tests (14 suites) pass, 1200 levels playable + validated, lint/TS clean. 9 bugs fixed (1 crash). Phone test baaki |
| Globe 3D | 2026-10-26 | WordEase-globe3d.apk | 3D globe (Natural Earth), world cards; 178 Jest tests pass; phone test baaki |
| T22, T23, T25 | 2026-10-26 | WordEase-a11y.apk | Text size, Huge 10x10, high contrast, colour-blind patterns, tutorial hand; 190 Jest tests pass; phone test baaki |
| T35 (UI) | 2026-10-26 | WordEase-i18n.apk | 6 UI languages wired, sound/music toggles hidden until T24; 215 Jest tests pass; phone test baaki |
| Map 3D | 2026-10-26 | WordEase-map3d.apk | Globe: climate-coloured land (no country borders), 3D markers; route: 3D stepping stones, road, extruded landmarks; 221 Jest tests; phone test baaki |
| Countries | 2026-10-26 | WordEase-countries.apk | Coloured countries on globe; India point of view (J&K, Ladakh incl. Aksai Chin, Arunachal in India) for India region / Hindi; 236 Jest tests; phone test baaki |
| Polish 1 | 2026-10-26 | WordEase-polish1.apk | Pause menu (resume/restart/settings/map, auto-pause, Back), pinch-zoom + zoom buttons for big grids, 80 themes (4 per world, 699 words); 247 Jest tests; phone test baaki |
| Globe fix | 2026-10-26 | WordEase-globefix.apk | Horizon clipping with rim arcs (no slivers/lines on the globe edge), date-line seam not drawn, borders/coast as visible-only outlines; preview tool tools/render-globe.*; 253 Jest tests; phone test baaki |
| Flat map | 2026-10-26 | WordEase-flatmap.apk | 3D globe removed; flat Equal Earth world map (countries, India view, pins, route, zoom/pan, fly-to on card); preview tools/render-map.*; 238 Jest tests; phone test baaki |
| Landmarks | 2026-10-26 | Jest | Upgrade PDF ka naya hissa: 80 landmarks (4 per world), route/result/album wired, 6-language names; 347 Jest tests, TS + lint clean; APK + phone test baaki |
| Launch crash fix | 2026-10-26 | WordEase-fix.apk | App khulte hi crash: in-app updates library ka react-native-device-info native link nahi tha (d3aaec4 se). Direct dependency + override (ek hi copy 15.0.2), update manager lazy/safe; 350 Jest tests, TS + lint clean; phone test baaki |
| Simple World Trip | 2026-10-26 | WordEase-worldtrip.apk | World map (globe button) screen ab simple list: har world ka bada card (landmark, status, progress, sitare, 4 landmarks, bada button), current world par auto-scroll, tablet par 2 columns; bhaari FlatMap hataya; 354 Jest tests, TS + lint clean; phone test baaki |
| Congrats UI | 2026-10-26 | WordEase.apk (cloudflare link) | Result screen naya: world ke rang + landmark wala postcard, har world ka apna cheer (Magnifique!, Shabash!, Subarashii!…) matlab ke saath, sitare pop, confetti (Reduce Motion par band), har 10 level par milestone ribbon, 100/200… par trophy, world finale par bada; 6 bhashayein; 373 Jest tests, TS + lint clean; phone test baaki |
| Toast fix | 2026-10-26 | WordEase.apk (cloudflare link) | Level par praise toast neeche meaning card/word list ko dhak raha tha (dono bottom par); ab Level aur Map par toast upar (top bar ke neeche), baaki screens par neeche; 376 Jest tests, TS + lint clean; phone test baaki |
| Country unlock | 2026-10-27 | app-release.apk | World Trip par locked country coins se kholo: 7500 + (world − 2) × 2250 (Antarctica 48000); kharidi country ke level ek-ek karke khulte hain, main route alag rehta hai; 6 bhashayein; 380 Jest tests, TS + lint clean; phone test baaki |
| Daily Word Quiz | 2026-10-27 | app-release.apk | Offline roz naya quiz (date seed, word list + meanings + landmarks se): 5 sawaal (meaning, missing letters, landmark silhouette, "kahan milega", jumble), Mon→Sun mushkil, Sunday double coins, combo, 50/50 (din mein 1), "did you know" card, mystery chest, streak (3/7/14/30 gifts, hafte mein 1 chhuta din maaf), countdown, share; map par 🧠 Quiz button; 6 bhashayein; 392 Jest tests, TS + lint clean; sound abhi stub (AudioManager); phone test baaki |
| Postcards | 2026-10-27 | WordEase.apk (cloudflare link) | 20 worlds ka postcard art pack `src/assets/postcards` (art, grey sketch, thumb, level bg, stamp, `worlds.json`, `PaintPostcard`); World Trip card par postcard banner jo levels jeetne par grey se rangeen hota hai; world-complete popup mein postcard; 376 Jest tests, TS + lint clean; phone test baaki |
| Logo + icon | 2026-10-27 | WordEase.apk (cloudflare link) | "WordEase Logo" concept A (Found Word) chuna: launcher icon saari densities + round + adaptive (Nunito Bold se render, `src/assets/logo/logo-icon.png`); purana coral W icon hata; 376 Jest tests; phone test baaki |
| Splash | 2026-10-27 | WordEase.apk (cloudflare link) | "WordEase Splash Screen" design: ocean background, letters pop, WORD/EASE pills sweep, suraj paani se uthta, naam + loading dots; tap se skip, Reduce Motion par seedha final; ~3.2 s; 376 Jest tests; phone test baaki |
| Level Map | 2026-10-27 | WordEase.apk (cloudflare link) | "WordEase Level Map" design, har world ke apne palette rangon mein: jhaadiyan, ghaas, ped, talaab/ghar, cream road, world-start par taped postcard (progress se rangeen), current level ke upar pencil-grey sketch, naye level nodes (current coral + ring, world-end gold), hot-air balloon, top bar world chip, 📍 jump-to-current; 6 bhashayein; 376 Jest tests, TS + lint clean; phone test baaki. Chhoda: level-tap postcard sheet, ad banner |
| Celebration | 2026-10-27 | WordEase.apk (cloudflare link) | "WordEase Celebration Screen" design: ocean burst + ghoomti kirnein + sparkles, world ka cheer 3D title mein, 3 glossy 3D stars, tilted postcard grey→colour, sikke, 3D buttons; "Next level" seedha agla level (world finale/daily par "Continue" → Map); milestone/stamp/landmark popups wahi; 392 Jest tests, TS + lint clean; phone test baaki |
| Popup fix | 2026-10-27 | WordEase.apk (cloudflare link) | Edge-to-edge: saare popups (Shop, Daily, Hint, Pause, Postcard) poori screen dhakte hain, status/nav bar se door, lambe hon toh scroll (`ui/ModalScroll.tsx`); Hint sheet nav bar ke upar; 392 Jest tests; emulator nahi, phone test baaki |
| Sound + music (T24) | 2026-10-27 | WordEase.apk (cloudflare link) | 18 aawazein + background music khud synthesize (`tools/generate-sfx.py`, koi bahar ki file nahi): taps, grid, shabd, galat, hint, star dings, level jingle, landmark/world fanfare, unlock, chest, splash jingle, popup swish, locked knock; `music_calm` loop Onboarding/Map/Level/Quiz par (Level par dheema), app background par rukta; native `SoundModule.kt` (SoundPool + MediaPlayer); Settings mein Sound effects + Background music switch; har press par pop (`ui/withTap.ts`); plan `docs/SOUND-FLOW.md`; `docs` tsconfig se bahar; 392 Jest tests, TS + lint clean; phone par sun ke test baaki |
| Music v2 | 2026-10-28 | app-release.apk | Purana 24 s loop hata kar 4 naye gaane (~2.5 min har ek, Ogg, kul ~7 MB), research ke hisaab se: bina bol, 62-84 bpm lo-fi, 7th/9th chords, har ~30 s mein layer badalti hai. Map playlist `sunny` + `garden` (dhun wale), Level/Quiz playlist `pages` + `drift` (bina chalti dhun, dheeme). Har gaana jahan ruka wahin se chalta hai, screen badalne par 1.2 s fade; `tools/generate-music.py`, `SoundModule.kt` playlist; 393 Jest tests, TS + lint clean; phone par sun ke test baaki |
| Speed + size | 2026-10-28 | APK nahi bana | Drag highlight UI thread par (shared values + worklets, drag ke beech React render nahi); grid letters ek `Glyphs` node; GridCanvas, WordChip, RouteMap `memo`; quiz countdown alag component; `freezeOnBlur` (peeche ki screens re-render nahi); map `drawDistance` = 1 segment; start par splash jaisa ocean-blue window (white/black flash nahi); APK se x86_64 hata (~33 MB native libs); R8 + shrinkResources + keep rules (`proguard-rules.pro`, `res/raw/keep.xml`); bina use ki `PaintPostcard`, `PaperPlane`, `StarRow` hatayi; plan `docs/SMOOTH-FLOW.md`; 395 Jest tests, TS + lint clean, levels OK; R8 build + phone test baaki |
| Ulte shabd + difficulty | 2026-10-28 | APK nahi bana | Saare 1,200 levels dobara bane: level 11 se ulte shabd, har stage ek nayi direction + "Naya!" tip, ulta share 0% → 27% → 34% → 40% → 46% → 53% → 58%, hard levels mein decoy filler, crossing words, adhoore shabd; bonus words pehle jitne hi; 407 Jest tests, TS + lint clean, levels OK; phone test baaki |
| Difficulty D1 | 2026-10-29 | APK nahi bana (app mein badlav nahi) | Search bot har level 200 baar khelta hai (pehla akshar dhoondhna, sikhayi directions, ulta padhna dheema); `npm run levels:difficulty` report: 15 s (level 3) se 516 s (level 1170), world 1 avg 40 s → world 20 avg 408 s; warm-up, breather, landmark 15/30/45 sach mein dikhte hain; kami: level 60 finale peak nahi (46-59 jitna), 290 levels apne landmark se hard, 41 dip easy nahi (28 world-start warm-up), 39 achanak jump (+50%); 416 Jest tests, TS + lint clean, levels OK |
| Difficulty D2 | 2026-10-29 | APK nahi bana | Saare 1,200 levels dobara bane, har level bot se 12 puzzle mein se chuna: target ke ±25% mein 1,187/1,200; dip jo aasaan nahi 41 → 0, landmark se hard 290 → 0, achanak jump 39 → 3, finale ab world ka top (1.45×); world avg 39 s → 367 s har world badhta hua (pehle 408 tak, oonch-neech); aadha khela level ka save khoje shabd kho deta hai (crash nahi); 442 Jest tests, TS + lint clean, levels OK; phone test baaki |
| Difficulty D3 | 2026-10-29 | APK nahi bana | Hard / Super hard tag: landmark levels Hard, world finale Super hard; map node ke kone par 🔥 badge, level shuru mein bonus wali pill (pehla shabd milne tak), pehli jeet par +15 / +30 coins, Result par "🔥 Hard level bonus" line; 6 bhashayein; tag + reward + badge + result tests; mere hisse ke saare tests pass. Doosra "Screen" session usi checkout mein UI restyle kar raha hai, uske 2 adhoore errors (PostcardFrame tsc, LevelScreen i18n scan) usse bata diye; phone test baaki |
| Difficulty D4 | 2026-10-29 | APK nahi bana | Phone par play data: asli khelne ka time (pause/background nahi), pehli jeet ka time + hints, quits; analytics events jude (abhi sirf memory, Firebase T30 baaki); chhupi Play data screen (About version par long-press) bot se tulna + CSV share; calibrate tool nakli data par 0.6× wapas 0.62× nikala; 473 Jest tests, TS + lint clean, levels OK; phone test baaki |
| Difficulty D5 | 2026-10-29 | APK nahi bana | Atke player ko free Spotlight ka offer (60 s bina shabd ya 2 baar chhoda), star aur coins nahi katte, har attempt mein ek; stars ab sirf kharide hints se; Result ki 3-star line sach bolti hai; 6 bhashayein; 485 Jest tests, TS + lint clean, levels OK; phone test baaki |
| Ads + D6 tools | 2026-10-29 | APK nahi bana | AdMob SDK jud gaya (consent, interstitial, rewarded; test IDs, apni IDs `adKeys.ts` + `app.json` mein), rewarded ab sach mein ad dikhata hai (pehle muft inaam tha); Firebase Analytics google-services.json aate hi chalu; live-tune tool + tuned regenerate; setup `docs/ADS-AND-FIREBASE.md`; 494 Jest tests, TS + lint clean, levels OK; **native build abhi tak nahi chala**, APK par test baaki |
