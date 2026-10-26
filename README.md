# WordEase: Word Search Puzzle

> **Large print, relaxing word search puzzle game handcrafted for seniors and casual word lovers.**  
> Big clear letters, no timers, no pressure, offline play, and a rich "World Trip" progression.

[![Test Suites](https://img.shields.io/badge/tests-215%20passed-brightgreen.svg)](#testing)
[![Shipped Levels](https://img.shields.io/badge/levels-1%2C200%20shipped-blue.svg)](#level-content)
[![React Native](https://img.shields.io/badge/react--native-0.88-61dafb.svg)](#tech-stack)
[![Architecture](https://img.shields.io/badge/architecture-New%20Architecture%20%2B%20Hermes-orange.svg)](#tech-stack)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey.svg)](#licenses)

---

## 📖 Overview

**WordEase** is a relaxing offline word search mobile game built in React Native CLI with a "Paper Postcard World Trip" aesthetic. Players travel through 20 handcrafted worlds across the globe, solving word puzzles in each city stop to collect passport stamps.

### Key Highlights
* **Senior-Friendly & Low-Vision Accessible:** Big letters using *Atkinson Hyperlegible* (Braille Institute) with live Text Size controls (Normal, Large, Huge), high-contrast borders, and minimum 56dp touch targets.
* **Dual Input Modes:** Smooth 8-direction drag selection (with 22.5° directional snap) and **Tap-Tap mode** (tap first letter, then last letter) for players with trembling hands.
* **1,200 Pre-Generated Levels:** 20 themed worlds (60 levels per world) with automated CI validation, sawtooth difficulty progression, and infinite dynamic generation ("Classic Play") beyond level 1,200.
* **World Trip Route Map & Globe:** Winding dotted path with 60 level nodes per chunk (FlashList virtualized), parallax cloud layers, paper plane avatar, interactive Globe view, and Passport Album.
* **Daily Postcard:** A unique deterministic puzzle every day seeded by date, with monthly calendar collection, streak counter, weekly streak freezes, and milestone coin rewards.
* **Educational Word Meaning Card:** Instant dictionary definitions powered by WordNet 3.0 for every found word.
* **Fair Monetization & Ad Compliance:** Zero interstitial ads on levels 1–3, strict 90-second minimum gap, no ads after landmark levels, and a clean Coin Shop with "Remove Ads".
* **6 Languages Supported:** English, Spanish (*Sopa de Letras*), Portuguese (*Caça-Palavras*), German (*Wortsuche*), French (*Mots Mêlés*), and Hindi (*शब्द खोज*).

---

## 🛠 Tech Stack

* **Core Framework:** React Native `0.88.0` CLI + TypeScript `6.0` (New Architecture + Hermes V1 enabled)
* **GPU Canvas Rendering:** `@shopify/react-native-skia` `2.14.0` (GPU-accelerated letter grid, capsules, and path rendering)
* **Animations & Gestures:** `react-native-reanimated` `4.7.1` + `react-native-gesture-handler` `2.33.1`
* **Local Persistence:** `react-native-mmkv` `v4.3.2` + `react-native-nitro-modules` (synchronous ultra-fast storage with automatic recovery)
* **State Management:** `zustand` `5.0` (progress, wallet, settings, daily postcard, ad states)
* **List Virtualization:** `@shopify/flash-list` `v2.3.3` (for smooth 60 FPS route map chunks)
* **Navigation:** `@react-navigation/native` `v7.5` + `@react-navigation/native-stack` `v7.21`

---

## 📂 Project Architecture

```text
WordEase/
├── assets/
│   ├── fonts/           # Atkinson Hyperlegible & Nunito OFL fonts
│   ├── levels/en/       # 20 world JSON packs (1,200 levels pre-baked)
│   ├── meanings/        # WordNet 3.0 definitions dictionary
│   └── LICENSES.md      # Font and dictionary commercial licenses
├── docs/
│   └── WordEase...pdf   # 26-page official Game Design & Build Flow specification
├── src/
│   ├── app/             # Root navigator & app providers
│   ├── game/
│   │   ├── engine/      # Pure TypeScript game math: selection, validate, hints, scoring
│   │   ├── generator/   # Seeded mulberry32 PRNG, backtracking word placement, letter fill
│   │   ├── levels/      # Level specs, difficulty bands, daily level generator, themes, worlds
│   │   └── render/      # Skia GridCanvas, Okabe-Ito capsule highlights, cell rendering
│   ├── i18n/            # 6-language translations (en, es, pt, de, fr, hi) & useT hook
│   ├── map/             # RouteMap, WorldChunk, LevelNode, MapClouds, Globe, PaperPlane
│   ├── screens/         # Splash, Onboarding, Map, Globe, Album, Level, Result, Settings, About
│   ├── services/        # AdsManager, AudioManager, HapticsManager, AnalyticsManager
│   ├── store/           # Zustand + MMKV stores (progress, wallet, settings, daily)
│   └── ui/              # Reusable components: Buttons, CoinPill, Modals, WordChip, etc.
├── tools/
│   ├── generate-levels.ts # CLI script to generate world JSON packs
│   └── validate-levels.ts # Automated CI validation script
└── __tests__/           # 17 comprehensive Jest test suites (215 tests)
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js `>= 22.11.0`
* JDK 17+ and Android SDK (API 35+)

### Installation
```bash
npm install
```

### Running the App
* **Start Metro:**
  ```bash
  npm start
  ```
* **Run on Android:**
  ```bash
  npm run android
  ```

---

## 🧪 Testing & Validation

The codebase includes **17 Jest test suites with 215 tests** covering positive, negative, and boundary scenarios:

```bash
# Run unit and integration tests
npm test

# Run level verification check (validates all 1,200 shipped levels)
npm run levels:validate

# Type check
npx tsc --noEmit
```

---

## 📦 Building Production Release APK / AAB

```bash
cd android
./gradlew assembleRelease
```
Output:
`android/app/build/outputs/apk/release/app-release.apk`

For Play Store AAB:
```bash
./gradlew bundleRelease
```

---

## 📜 Attributions & Licenses

* **WordNet 3.0:** Copyright 2006 by Princeton University. All rights reserved.
* **Atkinson Hyperlegible:** Copyright 2020 Braille Institute of America. Licensed under the SIL Open Font License, Version 1.1.
* **Nunito:** Copyright 2014 Vernon Adams. Licensed under the SIL Open Font License, Version 1.1.
* **ENABLE Word List:** Public domain.
* **Game Design & Specification:** See [`docs/WordEase Word Search Puzzle — Game Design & Build Flow.pdf`](./docs/).
