# Smooth play flow (no lag)

Goal: every touch answers within one frame (16 ms at 60 Hz, 8 ms at 120 Hz), on low-end Android too.

## The rule: two threads, keep the UI thread free of React

| Thread | Does | Must never wait for |
| --- | --- | --- |
| UI thread (Reanimated worklets, Skia, gestures) | finger tracking, highlight capsule, zoom, animations | JS / React renders |
| JS thread (React, stores, game logic) | word checking, toasts, saving, sound and haptic calls | — |

A frame drops when the finger has to wait for a React re-render. So anything that changes **per finger move** lives in
shared values and is drawn by Skia directly; React only hears about discrete events.

## Flow of one drag (Level screen)

1. **Finger down** → Pan worklet (UI thread) maps the point to a cell (`pointToCell`, worklet) and sets
   `selStart / selEnd / selLen`. Skia draws the capsule the same frame. JS is told once → letter-touch sound.
2. **Finger moves** → worklet runs `selectionFromDrag` and updates shared values only if the end cell changed.
   No React render. JS is called only when the length changes → tick haptic + sound.
3. **Finger up** → worklet sends start, end and length to JS once → `game.select()` → found / bonus / miss.
4. Only now React re-renders (new found capsule, word chip, toast).

## Render rules

- `GridCanvas` is `memo`; all letters are one Skia `Glyphs` node and the found capsules are `useMemo`'d, so a toast
  or coin change does not rebuild the grid. `WordChip` is `memo` and gets one stable `onPress(word)`.
- Props passed to the grid (`foundWords`, `hintOverlay`, `handleSelect`) are memoized in the screen.
- Map: FlashList recycles world chunks with `drawDistance` = one segment (the next stretch is drawn before a fling
  reaches it); scroll position goes to a shared value; `RouteMap` is `memo`, so world-chip changes skip the list.
- Navigation: `freezeOnBlur` on every screen. Screens under the top one (the map behind a level or result) do not
  re-render on store changes until they are shown again.
- Timers: a ticking countdown lives in its own small component (`Countdown` in the quiz summary), never in a big screen.
- Sounds: native SoundPool (pre-loaded), calls are fire-and-forget.
- Animations: Reanimated `withTiming` / `withRepeat` on the UI thread; respect Reduce Motion.

## Launch

- The Android theme's `windowBackground` is the splash's ocean blue (`res/values/colors.xml`, same as
  `colors.primaryOcean`), so the phone shows that colour from the tap on the icon until JS draws the splash:
  no white or black flash, also in dark mode.
- The splash runs ~3.2 s and a tap skips it.

## Release build

- `reactNativeArchitectures=arm64-v8a` only: x86_64 is for emulators and added ~33 MB of native libs.
- R8 + `shrinkResources` are on. `proguard-rules.pro` keeps libraries that C++ looks up by name (Skia, Nitro/MMKV,
  gesture handler, ...); `res/raw/keep.xml` keeps every drawable and raw file, because JS images are found by name.
- New native library? Check it ships consumer ProGuard rules; if not, add a `-keep` for its package and test a
  release APK on a phone.

## Checklist for new code

- [ ] Nothing calls `setState` inside a gesture `onUpdate` or a scroll handler.
- [ ] Per-frame values are shared values; pass them straight to Skia / animated styles.
- [ ] Helpers called from worklets start with `'worklet'`.
- [ ] Heavy lists use FlashList; list items are `memo`.
- [ ] Release APK tested on a real phone (debug builds are much slower and are not a fair test).
