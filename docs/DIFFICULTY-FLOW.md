# Difficulty flow (measured, not guessed)

Goal: every level's difficulty is **measured by a bot before release**, the curve follows a planned sawtooth, and
real play data can correct it later. This is how King tunes Candy Crush: designers set the intent, bots predict
difficulty, live data retunes or removes bad levels.

## Where we are today

| Part | State |
| --- | --- |
| Difficulty ladder (`levelSpec.ts` BANDS) | Done: grid size, word count, directions, backwards share, decoy filler, crossing words, near-miss starts |
| Sawtooth inside a world (`rhythmDelta`) | Done: levels 1–5 easy, landmarks (15/30/45/60) +1, 16–17 breather, 46+ hard, new direction opens on 2 easy levels |
| `difficulty` field in every level | A guess (`size + words + dirs + …`); nothing reads it, nothing checks it |
| Level tool (`generate-levels.ts`) | Takes the **first** valid seed; never checks if that puzzle is as hard as its slot wants |
| Play data (`AnalyticsManager`, T30) | Event list only, kept in memory; no screen sends events, no Firebase |

## What "hard" means in a word search

There is no losing, so Candy Crush's pass rate does not exist here. We use what King uses next to it:

| WordEase metric | Candy Crush version |
| --- | --- |
| Seconds to solve | time to pass |
| Hints used | boosters used |
| Quit before finishing | time to abandon / churn |

The main target number is **estimated seconds to solve**.

### Knobs

- Existing: grid size, word count, directions, backwards share, decoy filler, crossing words, near-miss starts.
- New: **short-word share.** 3–4 letter words hide easily, long words pop out. Today `pickWords` ignores length.
- No knob needed for first-letter rarity (a word starting with Q or Z is found fast, one starting with E or S is
  slow): the bot sees it on its own.

## Step 1 — Search bot

`src/game/difficulty/searchBot.ts`, pure TypeScript, Jest-tested. It copies how a person hunts a word:

1. Take the next unfound word (random order each run).
2. Scan the grid row by row from a random cell, looking for the word's first letter. Each cell looked at costs `LOOK`.
3. On a match, check the neighbours in habit order: → ↓ ↘ ↙ first, then ← ↑ ↖ ↗. Each direction checked costs
   `CHECK`; backwards directions cost more. A start that matches 2–3 letters and then breaks (decoy, near-miss
   start) costs extra.
4. Found → next word.

Run each level ~200 times with different seeds → `median` seconds and `p90`. `LOOK` and `CHECK` start as guesses
(about 0.12 s and 0.3 s) and get fitted to real timings in Step 5.

## Step 2 — Report: is the sawtooth real?

`tools/difficulty-report.ts` runs the bot on all 1,200 shipped levels and writes a CSV plus an HTML chart (level on
x, seconds on y, intended rhythm on top). It flags:

- a level harder than the next landmark (peak in the wrong place)
- a breather (16–17, new-direction intro) that is not easier than the level before it
- a jump of more than 50% between neighbours

Read-only: no level changes. Run: `npm run levels:difficulty` (about 10 s).

### First run (2026-10-29, bot pace not yet calibrated)

| Finding | Number |
| --- | --- |
| Range | 15 s (level 3) to 516 s (level 1170) |
| World averages | world 1: 40 s → world 10: 230 s → world 20: 408 s |
| Old `difficulty` guess vs bot | 0.96 rank match: the overall order is right |
| Warm-up 1–5 | 0.84–0.89× world average: works |
| Landmarks 15 / 30 / 45 | 1.07× / 1.12× / 1.23×: real peaks |
| Breather 16–17 | 0.86× / 0.90×: works |
| **Finale 60** | 1.15×, same as the 46–59 stretch (1.09–1.22×): **not a peak**; `rhythmDelta` gives both +1 |
| Harder than their landmark | 290 levels (134 of them in 46–59) |
| Dips not easier | 41: 28 are world-start warm-ups that land in a bigger band than the previous finale (61, 181 …) |
| Sudden jumps (> +50%) | 39: mostly random word count and word lengths, e.g. level 18 is +92% over 17 |
| Late levels | 6–9 min typical: too long for "hard should be short". The bot does not spot words by chance while scanning, so it likely overestimates long levels; D4 calibrates |

What D2 must fix: make 60 the real top, let world-start warm-ups dip below the previous finale even across a band
change, smooth neighbour jumps by picking the candidate closest to target, and cap late-level length.

## Step 3 — Target curve, generator picks to fit (done 2026-10-29)

**Roles** (`levelRole` in `levelSpec.ts`): warm-up (1–5), intro (first 2 levels of a new direction), normal,
breather (16–17), peak (15, 30, 45), hard (46–59), finale (60).

**Target** (`src/game/difficulty/target.ts`): `base × role factor`, in bot seconds.

- Base: 21 s at level 1 → 360 s at level 1,200, growth power 0.8. Fitted to what the bands can reach; the last
  worlds come out about 10% shorter than before.
- Factors: warm-up 0.75, intro and breather 0.8, normal 0.9 → 1.1 (climbs through the world), hard 1.15,
  peak 1.3, finale 1.45.

**Sawtooth rules** (`rhythmBounds`, used by the tool and the validator):

1. A dip is easier than the last level that was not a dip.
2. A landmark is harder than every level since the previous landmark.
3. The finale is the hardest level of its world.

**Level tool** (`generate-levels.ts`), one world at a time:

1. Build a candidate for each of 12 tweaks (words −2…+1, grid −1…+1 around the band, grid at most 12) and time
   each with the bot (200 runs).
2. Every level must stay under the hardest candidate of the landmark that closes its stretch and of the finale, so a
   peak always has a candidate that tops what came before it.
3. Keep the candidate closest to the target among those that keep the rules. Peaks first try without extra words.
4. `difficulty` = the chosen bot time (rounded seconds).

**Peaks get harder by placement:** +15% backwards words and +15% decoy filler; no extra word from the band. The tool
may still add one when nothing else tops the stretch (7 of 80 peaks).

**`levels:validate`** checks the three rules on `difficulty`, and fails a level more than ±50% from target. The
±50% only catches broken levels: near the end of a band the grid cannot reach the curve. A Jest test re-runs the bot
on sample levels to prove `difficulty` is the real bot time.

**Dropped: the short-word knob.** The bot hunts by first letter, so it cannot see that short words hide better.
Picking it without a way to measure it would be guessing; revisit with phone data (D4).

### Result (2026-10-29)

| | Before (D1) | After (D2) |
| --- | --- | --- |
| Within ±25% of target | — | 1,187 / 1,200 |
| Dips not easier | 41 | 0 |
| Levels harder than their landmark | 290 | 0 |
| Sudden jumps (> +50%) | 39 | 3 |
| Finale vs world average | 1.15× (not a peak) | 1.45× (top) |
| World averages | 40 → 408 s, uneven (230, 239, 251, 285, 267 …) | 39 → 367 s, rising every world |

All 1,200 grids changed. A saved half-played level just loses its found words (`sanitizeSaved`), no crash.

## Step 4 — "Hard" and "Super hard" tags (done 2026-10-29)

A warned and rewarded hard level feels fair instead of unfair.

- `levelTag(levelId)` (`levelSpec.ts`): landmarks 15 / 30 / 45 are **Hard**, the finale 60 is **Super hard**. The
  sawtooth rules guarantee these are the hardest of their stretch / world, so the badge never lies.
- Map: a 🔥 badge on the node's top-right rim (orange for Hard, purple for Super hard). TalkBack reads
  "…, Hard level".
- Level screen: a pill above the grid until the first word is found: "🔥 Hard level · +15 bonus coins on your first
  win" (just "🔥 Hard level" on a replay).
- Coins (`rewards.ts` `TAG_BONUS_COINS`): first win only, Hard +15, Super hard +30, on top of stars and the world
  bonus. The Result screen shows a "🔥 Hard level bonus +15" line under the coins.
- Text in all 6 languages (`tag.*`, `level.tagBonus`, `result.bonus.*`). Colours and labels live in
  `src/ui/levelTag.ts`.

## Step 5 — Real play data on the phone (done 2026-10-29)

- **Clock** (`engine/playClock.ts`, `screens/level/usePlayRecord.ts`): counts active play only. It runs while the
  Level screen is in front, unpaused (leaving the app pauses), and words are left. Time is saved on every stop, so
  leaving or closing the app mid-level keeps counting from there next time. Restart sets it to zero.
- **Analytics log** (`AnalyticsManager`, still memory-only until Firebase, T30): `level_start`, `word_found`
  (length, direction), `hint_used`, `level_complete` (stars, hints, seconds), `level_quit` (words found, seconds).
- **Play data on the phone** (`store/playStats.ts`): per level opens, quits, wins, and the **first win only**
  (seconds, hints). Replays are left out because a known grid is faster. Huge-text wins on a re-made smaller grid are
  marked `resized` and left out of the comparison. The Daily puzzle is not stored (new every day, no bot time).
  Reset All Progress clears it.
- **Hidden Play data screen**: About → long-press the version line. It shows "your time ÷ bot time", a rank match
  (do your times order levels like the bot?) and a table. **Share as text** sends a CSV through the phone's share
  sheet; **Clear** deletes it.
- **Calibration**: `npm run levels:calibrate -- play-data.csv` prints the scale, the rank match, the ratio per role
  (warm-up, peak …) and the scaled `DEFAULT_PACE` seconds. One scale changes no level choice, since times and
  targets move together. Only a role far from 1.00, or a low rank match, means the bot itself needs work.
- Seeing **all** players still needs Firebase (T30) and a Firebase account.

## Step 6 — Live tuning (tooling done 2026-10-29; needs Firebase keys + real players)

King fixed its 100 least fun levels and engagement went up. Same loop here:

1. **Data in**: events go to Firebase Analytics once `android/app/google-services.json` is added (setup in
   `docs/ADS-AND-FIREBASE.md`). Turn on the BigQuery export.
2. **One row per level**: run this in BigQuery after a few weeks of play. Replace the project and dataset, set the
   dates, and download the result as `levels.csv`:

   ```sql
   WITH ev AS (
     SELECT
       user_pseudo_id,
       event_name,
       (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'level_id') AS level,
       (SELECT COALESCE(value.int_value, CAST(value.double_value AS INT64))
          FROM UNNEST(event_params) WHERE key = 'seconds') AS seconds,
       (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'hints') AS hints
     FROM `YOUR_PROJECT.analytics_NNNNNNNNN.events_*`
     WHERE event_name IN ('level_start', 'level_complete', 'level_quit')
       AND _TABLE_SUFFIX BETWEEN '20261101' AND '20261130'
   )
   SELECT
     level,
     COUNT(DISTINCT user_pseudo_id) AS players,
     APPROX_QUANTILES(IF(event_name = 'level_complete', seconds, NULL), 2)[OFFSET(1)] AS median_seconds,
     AVG(IF(event_name = 'level_complete', IF(hints > 0, 1, 0), NULL)) AS hint_rate,
     COUNTIF(event_name = 'level_quit') / NULLIF(COUNTIF(event_name = 'level_start'), 0) AS quit_rate
   FROM ev
   WHERE level BETWEEN 1 AND 1200
   GROUP BY level
   ORDER BY level
   ```

   `level_complete` includes replays, so times run a little fast. That is the same for every level, so the ranking
   still holds.
3. **Find the worst levels**: `npm run levels:tune -- levels.csv` (`tools/live-tune.ts`). Each level with 30+
   players gets a frustration score: quit rate and hint rate against levels of the **same role** (a peak may be
   harder than a warm-up), plus time against its own target at the players' overall pace. The worst 5% (score > 0)
   get their target ×0.85, at most down to ×0.6 over several rounds. The result is saved in
   `tools/level-tuning.json`, merged with earlier rounds.
4. **Rebuild**: `npm run levels:generate && npm run levels:validate && npm run levels:difficulty`. The generator and
   the validator read `level-tuning.json` (`tools/levelTuning.ts`). The sawtooth rules still hold, so an eased peak
   stays the top of its stretch.
5. Ship a new APK. Swapping levels without an app update (Remote Config) is still for later.

## Not doing: secret per-player difficulty

No hidden board changes per player (the "change the seed when churn risk is high" idea from EA's patent). Every player
gets the same fixed puzzle, so it stays fair and testable. Instead, open help: a player who is stuck is offered a
free Spotlight nudge. King's rule applies: never make a level hard to sell hints, retention always wins.

### Free nudge (done 2026-10-29)

Decided by the user: it **costs no star**, and it is an **offer the player taps**, never applied on its own.

- **When** (`engine/nudge.ts`): 60 s of play-clock time without a new word (pauses don't count), or the level was
  left twice before (then offered as soon as it opens, until the first word). Never when no words are left.
- **How often**: one per attempt. The hint is saved with a `free` flag, so closing the app does not give a second
  one. Restart gives the fresh attempt its nudge back.
- **Where**: a floating pill over the space under the word list, "💡 Stuck? Tap for a free hint". It floats, so the
  grid never moves under the finger. It hides while a meaning card is open and after the next word.
- **What it does**: a Spotlight on the next word, with no coins and no star. A toast says "A free hint, and no star
  lost". Stars count only paid hints (`paidHints`). Three stars with a free hint show "Three stars! The free hint does
  not count." instead of "Not a single hint". Analytics logs it as `hint_used` with source `free`; play data counts
  it in the win's hints.
- Text in all 6 languages (`level.nudge`, `level.nudgeTaken`, `result.starsLine.free`).

## Batches

| Batch | What | Changes levels? |
| --- | --- | --- |
| D1 ✓ | Search bot + report | No |
| D2 ✓ | Target curve, generator fit, validator, regenerate 1,200 levels (short-word knob dropped) | Yes |
| D3 ✓ | Hard / Super hard tags + bonus coins | No |
| D4 ✓ | On-device play data + debug report | No |
| D5 ✓ | Free nudge for stuck players | No |
| D6 ✓ (tools) | Live tuning: Firebase sink, BigQuery query, `levels:tune`, tuned regenerate | Yes, when run on real data |
