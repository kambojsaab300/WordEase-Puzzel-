import type { TKey } from '../i18n';
import { LANDMARK_EVERY, LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLDS, type WorldDef } from '../game/levels/worlds';
import { LANDMARK_PATHS } from './landmarks';

// Landmarks visual plan: every world has 4 famous sights, one per landmark level (15, 30, 45, 60).
// The first is the world's signature silhouette (also its passport stamp); the finale closes the world.
// All shapes are our own simple paper-cutouts in a 100 x 100 box: no logos, brands or traced art.
export const LANDMARKS_PER_WORLD = LEVELS_PER_WORLD / LANDMARK_EVERY;

export const LANDMARK_PLAN: Record<number, readonly [string, string, string, string]> = {
  1: ['cottage', 'clockTower', 'barn', 'waterWell'],
  2: ['eiffelTower', 'arcDeTriomphe', 'pontNeuf', 'versailles'],
  3: ['colosseum', 'leaningTower', 'gondola', 'treviFountain'],
  4: ['windmills', 'parthenon', 'whiteHouses', 'sailboat'],
  5: ['pyramids', 'sphinx', 'obelisk', 'felucca'],
  6: ['acaciaTree', 'mountKenya', 'giraffe', 'hotAirBalloon'],
  7: ['tajMahal', 'indiaGate', 'qutubMinar', 'hawaMahal'],
  8: ['grandPalace', 'longtailBoat', 'elephant', 'limestoneIslands'],
  9: ['mountFuji', 'himejiCastle', 'cherryBlossom', 'redBridge'],
  10: ['greatWall', 'forbiddenCity', 'guilinHills', 'giantPanda'],
  11: ['uluru', 'kangaroo', 'boabTree', 'seaStacks'],
  12: ['palmBeach', 'diamondHead', 'outriggerCanoe', 'seaTurtle'],
  13: ['desertCactus', 'chichenItza', 'hacienda', 'monarchButterfly'],
  14: ['machuPicchu', 'llama', 'rainbowMountain', 'reedBoat'],
  15: ['amazonTree', 'sugarloaf', 'toucan', 'iguazuFalls'],
  16: ['pineForest', 'moose', 'lighthouse', 'logCabin'],
  17: ['skyline', 'libertyStatue', 'brooklynBridge', 'yellowTaxi'],
  18: ['volcano', 'northernLights', 'geyser', 'puffin'],
  19: ['castle', 'highlandCow', 'lochNess', 'viaduct'],
  20: ['iceberg', 'penguins', 'whale', 'researchHut'],
};

// A circle as two clockwise arcs, so it joins the other clockwise shapes without cutting holes
const dot = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;

// Silhouettes for landmarks 2-4 of each world (landmark 1 reuses the world's LANDMARK_PATHS shape)
const EXTRA_ART: Record<string, string> = {
  clockTower: 'M30 100 V88 H70 V100 Z M36 88 V38 H64 V88 Z M32 38 V32 H68 V38 Z M36 32 L50 10 L64 32 Z M49 10 V2 H51 V10 Z',
  barn: 'M10 100 V55 L25 35 H75 L90 55 V100 Z M90 100 V46 Q90 36 95 36 Q100 36 100 46 V100 Z',
  waterWell:
    'M20 100 V72 H80 V100 Z M26 72 V40 H32 V72 Z M68 72 V40 H74 V72 Z M14 42 L50 18 L86 42 Z M49 56 V40 H51 V56 Z M45 66 V56 H55 V66 Z',

  arcDeTriomphe: 'M10 100 V24 H90 V100 H64 V62 Q50 44 36 62 V100 Z M6 24 V14 H94 V24 Z',
  pontNeuf:
    'M0 100 V60 H100 V100 H90 Q80 74 70 100 H60 Q50 74 40 100 H30 Q20 74 10 100 Z M0 60 V54 H100 V60 Z M24 54 V40 H27 V54 Z M73 54 V40 H76 V54 Z M22 40 V34 H29 V40 Z M71 40 V34 H78 V40 Z',
  versailles: 'M0 100 V60 H30 V50 H40 V40 H60 V50 H70 V60 H100 V100 Z M44 40 L50 30 L56 40 Z M2 60 V56 H28 V60 Z M72 60 V56 H98 V60 Z',

  leaningTower:
    'M32 100 L46 10 L66 13 L56 100 Z M34 68 L62 69 L62 73 L34 72 Z M38 43 L65 44 L65 48 L38 47 Z M42 20 L67 21 L67 25 L42 24 Z M45 12 L48 4 L62 6 L64 14 Z',
  gondola:
    'M2 70 Q12 78 30 78 H72 Q92 76 98 62 Q92 86 72 88 H30 Q8 84 2 70 Z M58 78 V52 H64 V78 Z ' +
    dot(61, 46, 5) +
    ' M70 40 L72 41 L44 92 L42 91 Z',
  treviFountain:
    'M10 70 V30 H90 V70 Z M14 30 V20 H86 V30 Z M0 100 V86 Q50 78 100 86 V100 Z M10 84 Q20 72 30 76 Q40 70 50 74 Q60 70 70 76 Q80 72 90 84 Z M44 20 V12 H56 V20 Z',

  parthenon:
    'M5 100 V92 H95 V100 Z M10 92 V86 H90 V92 Z M14 86 V50 H22 V86 Z M30 86 V50 H38 V86 Z M46 86 V50 H54 V86 Z M62 86 V50 H70 V86 Z M78 86 V50 H86 V86 Z M10 50 V42 H90 V50 Z M8 42 L50 22 L92 42 Z',
  whiteHouses:
    'M5 100 V70 H35 V100 Z M30 100 V55 H62 V100 Z M58 100 V75 H95 V100 Z M40 55 Q40 38 50 36 Q60 38 60 55 Z M49 36 V28 H51 V36 Z M12 70 V62 H26 V70 Z',
  sailboat: 'M10 82 H90 L78 96 H22 Z M50 82 V8 H52 V82 Z M54 12 L84 76 H54 Z M48 18 V76 H20 Z',

  sphinx: 'M4 100 V82 Q6 74 16 74 H60 V60 L62 44 Q72 34 84 44 L88 60 V74 H96 V100 Z M60 50 L56 66 H62 Z M88 50 L92 66 H86 Z',
  obelisk: 'M40 100 L44 22 L50 10 L56 22 L60 100 Z M32 100 V92 H68 V100 Z',
  felucca: 'M8 80 H92 Q86 94 72 94 H26 Q14 94 8 80 Z M46 80 V30 H49 V80 Z M20 70 L80 8 L62 72 Z',

  mountKenya: 'M0 100 L30 50 L40 58 L52 22 L58 30 L64 24 L74 52 L84 46 L100 100 Z',
  giraffe:
    'M24 62 Q24 52 34 52 H66 Q74 52 74 62 V68 H24 Z M26 100 V64 H31 V100 Z M36 100 V64 H41 V100 Z M58 100 V64 H63 V100 Z M67 100 V64 H72 V100 Z M62 56 L76 14 L84 16 L72 58 Z M74 14 Q76 6 86 8 L94 14 Q94 18 88 18 L80 20 Z M78 8 V2 H80 V8 Z M84 8 V2 H86 V8 Z M26 60 L20 75 L18 74 L24 58 Z',
  hotAirBalloon:
    'M50 4 Q86 4 86 38 Q86 58 60 74 H40 Q14 58 14 38 Q14 4 50 4 Z M42 74 L44 84 H42 L40 74 Z M60 74 L58 84 H56 L58 74 Z M40 84 H60 V98 H40 Z',

  indiaGate: 'M24 100 V22 H76 V100 H60 V52 Q50 38 40 52 V100 Z M20 22 V14 H80 V22 Z M32 14 V8 H68 V14 Z M44 8 Q44 2 50 2 Q56 2 56 8 Z',
  qutubMinar: 'M38 100 L44 10 H56 L62 100 Z M36 76 H64 V80 H36 Z M39 52 H61 V56 H39 Z M41 30 H59 V34 H41 Z M47 10 V4 H53 V10 Z',
  hawaMahal:
    'M8 100 V60 H92 V100 Z M16 60 V44 H84 V60 Z M24 44 V30 H76 V44 Z M34 30 V18 H66 V30 Z M44 18 L50 8 L56 18 Z M8 60 Q14 52 20 60 Z M80 60 Q86 52 92 60 Z M16 44 Q22 36 28 44 Z M72 44 Q78 36 84 44 Z M24 30 Q30 22 36 30 Z M64 30 Q70 22 76 30 Z',

  longtailBoat:
    'M2 78 H84 L96 58 L98 60 L90 90 H14 Q6 88 2 78 Z M20 78 V58 H24 V78 Z M56 78 V58 H60 V78 Z M16 58 Q40 46 64 58 Z',
  elephant:
    'M14 70 Q14 40 44 40 Q70 40 72 60 V72 H14 Z M64 48 Q70 34 84 38 Q94 42 92 60 L94 86 H88 L86 64 Q80 70 70 66 Z M18 100 V68 H28 V100 Z M34 100 V68 H44 V100 Z M52 100 V68 H62 V100 Z M64 100 V64 H72 V100 Z M17 58 L10 71 L8 70 L15 56 Z',
  limestoneIslands:
    'M4 100 Q6 60 18 40 Q30 30 34 56 Q36 80 40 100 Z M44 100 Q46 50 60 22 Q74 18 76 50 Q76 80 80 100 Z M82 100 Q84 74 90 66 Q98 66 98 100 Z',

  himejiCastle:
    'M14 100 L20 78 H80 L86 100 Z M26 78 V66 H74 V78 Z M14 68 Q30 62 50 56 Q70 62 86 68 Z M32 58 V48 H68 V58 Z M22 50 Q36 44 50 38 Q64 44 78 50 Z M38 40 V32 H62 V40 Z M30 34 Q40 28 50 20 Q60 28 70 34 Z M48 20 V14 H52 V20 Z',
  cherryBlossom:
    'M46 100 L48 62 L36 48 L40 46 L50 56 L60 44 L64 46 L54 62 L56 100 Z ' +
    [dot(28, 42, 15), dot(48, 30, 18), dot(70, 36, 16), dot(60, 52, 11), dot(36, 56, 10)].join(' '),
  redBridge:
    'M0 100 V86 Q50 50 100 86 V100 H86 Q50 70 14 100 Z M0 76 Q50 40 100 76 V80 Q50 44 0 80 Z M19 76 V62 H22 V76 Z M49 70 V54 H52 V70 Z M79 76 V62 H82 V76 Z',

  forbiddenCity:
    'M8 100 V88 H92 V100 Z M16 88 V66 H84 V88 Z M2 68 Q20 64 26 54 H74 Q80 64 98 68 Z M28 54 V46 H72 V54 Z M14 48 Q30 44 34 34 H66 Q70 44 86 48 Z M46 34 V28 H54 V34 Z',
  guilinHills:
    'M0 100 V70 Q4 40 14 40 Q24 40 26 70 Q30 30 44 28 Q58 30 60 70 Q64 46 74 44 Q86 46 88 70 Q92 56 100 58 V100 Z',
  giantPanda:
    'M28 100 Q20 70 34 54 Q50 44 66 54 Q80 70 72 100 Z ' +
    [dot(50, 38, 16), dot(37, 24, 6), dot(63, 24, 6)].join(' ') +
    ' M82 100 V20 H86 V100 Z M86 30 Q96 24 98 30 Q92 34 86 32 Z',

  kangaroo:
    'M30 96 Q24 76 34 58 Q42 44 56 44 L62 30 Q64 22 70 22 L74 14 L76 22 Q82 24 82 30 L76 34 L70 40 Q72 56 66 72 L72 96 H62 L58 80 Q48 88 40 96 Z M2 100 Q14 94 32 92 L34 100 Z M66 56 L76 62 L74 64 L64 60 Z',
  boabTree:
    'M36 100 Q28 70 38 50 Q40 40 40 30 H60 Q60 40 62 50 Q72 70 64 100 Z M40 32 L26 16 L30 14 L44 28 Z M50 30 V10 H53 V30 Z M58 32 L72 14 L76 16 L62 34 Z ' +
    [dot(26, 14, 7), dot(52, 8, 7), dot(76, 14, 7)].join(' '),
  seaStacks:
    'M0 100 V40 Q10 36 20 42 V100 Z M30 100 V54 Q36 46 42 54 V100 Z M52 100 V62 Q57 56 62 62 V100 Z M70 100 V50 Q76 42 82 50 V100 Z M90 100 V68 Q95 62 100 68 V100 Z',

  diamondHead: 'M0 100 L14 70 L24 74 L36 48 Q50 40 62 50 L72 44 L84 66 L100 74 V100 Z',
  outriggerCanoe:
    'M2 80 H98 Q90 90 76 90 H24 Q10 90 2 80 Z M14 96 H86 V99 H14 Z M30 96 V90 H33 V96 Z M66 96 V90 H69 V96 Z M46 80 V62 H54 V80 Z ' +
    dot(50, 56, 5) +
    ' M56 66 L74 92 L72 93 L54 67 Z',
  seaTurtle:
    'M50 30 Q78 30 78 56 Q78 82 50 82 Q22 82 22 56 Q22 30 50 30 Z ' +
    dot(50, 22, 8) +
    ' M74 40 L94 30 L90 44 L76 50 Z M26 40 L24 50 L10 44 L6 30 Z M70 74 L86 88 L72 86 Z M30 74 L28 86 L14 88 Z',

  chichenItza:
    'M0 100 V90 H8 V80 H16 V70 H24 V60 H32 V50 H40 V40 H60 V50 H68 V60 H76 V70 H84 V80 H92 V90 H100 V100 Z M42 40 V28 H58 V40 Z M40 28 V24 H60 V28 Z',
  hacienda:
    'M4 100 V58 H96 V100 H86 V80 Q80 70 74 80 V100 H62 V80 Q56 70 50 80 V100 H38 V80 Q32 70 26 80 V100 Z M0 60 L8 48 H92 L100 60 Z M40 48 V34 H60 V48 Z M38 34 L50 24 L62 34 Z',
  monarchButterfly:
    'M52 50 Q70 20 92 26 Q96 44 72 56 Z M52 54 Q78 58 80 76 Q70 90 54 70 Z M48 50 L28 56 Q4 44 8 26 Q30 20 48 50 Z M48 54 L46 70 Q30 90 20 76 Q22 58 48 54 Z M48 40 Q50 36 52 40 V78 Q50 82 48 78 Z M49 38 L42 24 L43 23 L50 37 Z M50 37 L57 23 L58 24 L51 38 Z',

  llama:
    'M20 56 Q20 46 30 46 H62 Q70 46 70 56 V66 H20 Z M22 100 V62 H28 V100 Z M32 100 V62 H38 V100 Z M54 100 V62 H60 V100 Z M63 100 V62 H69 V100 Z M60 50 V16 H72 V50 Z M60 18 Q60 10 68 10 H80 Q84 12 82 18 L74 22 H60 Z M62 12 L63 2 L66 2 L66 10 Z M68 10 L69 2 L72 2 L71 10 Z M20 58 L14 58 Q12 50 20 50 Z',
  rainbowMountain:
    'M0 100 V74 L30 62 L52 56 L74 62 L100 70 V100 Z M4 70 L30 50 L52 42 L74 50 L98 66 L74 58 L52 52 L30 58 Z M30 46 L52 26 L74 46 L52 38 Z',
  reedBoat:
    'M4 60 Q12 76 30 76 H70 Q88 76 96 60 Q90 86 70 88 H30 Q10 86 4 60 Z M46 76 V20 H49 V76 Z M50 24 H74 L70 66 H50 Z',

  sugarloaf: 'M0 100 V84 Q14 76 24 80 Q32 40 52 22 Q70 20 74 50 Q78 74 86 78 Q94 76 100 82 V100 Z',
  toucan:
    'M30 50 Q30 34 46 34 Q58 36 58 52 Q58 74 44 86 L40 98 L36 86 Q28 74 30 50 Z M54 38 Q76 30 94 42 Q80 52 56 48 Z M4 86 H96 V91 H4 Z',
  iguazuFalls:
    'M0 40 Q10 28 20 34 Q30 22 42 32 Q54 22 64 32 Q76 22 86 32 Q94 28 100 34 V40 Z M0 40 H100 V48 H0 Z M4 48 H14 V96 H4 Z M18 48 H28 V100 H18 Z M32 48 H42 V94 H32 Z M46 48 H56 V100 H46 Z M60 48 H70 V96 H60 Z M74 48 H84 V100 H74 Z M88 48 H98 V94 H88 Z',

  moose:
    'M24 54 Q24 42 36 42 H66 Q74 42 74 52 V66 H24 Z M26 100 V60 H32 V100 Z M36 100 V60 H42 V100 Z M60 100 V60 H66 V100 Z M68 100 V60 H74 V100 Z M70 46 L80 40 Q90 40 94 50 L92 58 Q86 60 80 56 L74 56 Z M74 40 Q70 28 62 30 L60 26 Q70 22 78 40 Z M82 40 Q86 22 96 24 L94 28 Q88 28 86 40 Z',
  lighthouse:
    'M38 100 L42 34 H58 L62 100 Z M36 34 V28 H64 V34 Z M42 28 V18 H58 V28 Z M40 18 L50 8 L60 18 Z M20 100 Q26 90 38 92 V100 Z M62 92 Q74 88 82 100 H62 Z M58 22 L94 14 V30 Z M42 22 L6 30 V14 Z',
  logCabin:
    'M10 100 V60 H90 V100 Z M4 62 L50 28 L96 62 Z M66 46 V30 H74 V52 Z ' +
    [dot(72, 22, 4), dot(78, 14, 5), dot(86, 6, 5)].join(' '),

  libertyStatue:
    'M30 100 V70 H70 V100 Z M34 70 V60 H66 V70 Z M40 60 L44 30 Q50 24 56 30 L60 60 Z ' +
    dot(50, 22, 5) +
    ' M44 20 L42 12 L47 17 L50 10 L53 17 L58 12 L56 20 Z M54 32 L64 8 L68 9 L58 34 Z M64 2 H68 L70 8 H62 Z M42 42 L38 48 L36 46 L40 40 Z',
  brooklynBridge:
    'M0 76 H100 V82 H0 Z M18 100 V24 H34 V100 Z M66 100 V24 H82 V100 Z M26 24 Q50 66 74 24 L74 28 Q50 70 26 28 Z M0 60 Q14 50 26 24 L26 28 Q16 54 0 64 Z M74 24 Q86 50 100 60 V64 Q84 54 74 28 Z M40 76 V42 H41 V76 Z M50 76 V46 H51 V76 Z M60 76 V42 H61 V76 Z',
  yellowTaxi:
    'M4 82 V68 Q4 62 12 62 L26 60 L36 46 H66 L78 60 L90 62 Q96 64 96 72 V82 Z M44 46 V40 H58 V46 Z ' +
    [dot(24, 84, 9), dot(76, 84, 9)].join(' '),

  northernLights:
    'M0 30 Q25 10 50 26 Q75 42 100 20 V30 Q75 52 50 36 Q25 20 0 40 Z M0 52 Q30 36 56 50 Q80 62 100 46 V54 Q80 70 56 58 Q30 44 0 60 Z M0 100 V80 Q20 70 40 78 Q60 66 80 76 Q90 72 100 76 V100 Z M80 76 L86 62 L92 76 Z',
  geyser:
    'M0 100 V88 Q50 80 100 88 V100 Z M44 86 Q42 50 46 30 H54 Q58 50 56 86 Z ' +
    [dot(40, 26, 10), dot(52, 16, 12), dot(64, 26, 10), dot(34, 38, 7), dot(68, 38, 7)].join(' '),
  puffin:
    'M34 96 Q26 70 34 46 Q40 30 54 30 Q66 32 66 46 Q70 72 62 96 Z M64 40 L82 44 L64 52 Z M40 96 H52 V100 H40 Z M54 96 H64 V100 H54 Z M10 100 Q20 92 40 94 H70 Q86 92 92 100 Z',

  highlandCow:
    'M18 58 Q18 44 32 44 H64 Q72 44 72 56 V72 H18 Z M20 100 V68 H28 V100 Z M32 100 V68 H40 V100 Z M54 100 V68 H62 V100 Z M64 100 V68 H72 V100 Z M66 50 Q66 40 76 40 Q86 40 86 50 L84 64 Q78 70 70 64 Z M68 42 Q56 40 54 28 Q60 34 70 38 Z M82 38 Q92 34 98 28 Q96 40 84 42 Z M20 54 L14 69 L12 68 L18 52 Z',
  lochNess:
    'M0 100 V84 Q12 80 25 84 Q38 88 50 84 Q62 80 75 84 Q88 88 100 84 V100 Z M30 86 Q38 66 46 86 Z M50 86 Q58 70 66 86 Z M70 86 Q72 50 84 44 Q94 42 96 50 L88 52 Q80 56 78 86 Z M4 84 V60 H8 V56 H12 V60 H16 V56 H20 V84 Z',
  viaduct:
    'M0 100 V50 H100 V100 H94 V74 Q88 62 82 74 V100 H76 V74 Q70 62 64 74 V100 H58 V74 Q52 62 46 74 V100 H40 V74 Q34 62 28 74 V100 H22 V74 Q16 62 10 74 V100 Z M20 50 V40 H44 V50 Z M46 50 V40 H68 V50 Z M70 50 V38 Q70 34 76 34 H84 V50 Z M76 34 V28 H80 V34 Z',

  penguins:
    'M24 98 Q16 70 24 48 Q30 36 38 48 Q46 70 40 98 Z ' +
    dot(31, 40, 7) +
    ' M37 38 L44 40 L37 42 Z M54 98 Q44 64 56 38 Q64 26 72 38 Q84 64 74 98 Z ' +
    dot(64, 30, 9) +
    ' M72 28 L80 30 L72 33 Z M0 100 V96 H100 V100 Z',
  whale:
    'M46 70 Q24 52 14 42 Q34 40 50 62 Z M50 62 Q66 40 86 42 Q76 52 54 70 Z M44 100 Q46 80 46 66 H54 Q54 80 56 100 Z M0 100 V90 Q12 86 25 90 Q38 94 50 90 Q62 86 75 90 Q88 94 100 90 V100 Z ' +
    [dot(24, 30, 3), dot(78, 30, 3), dot(50, 34, 3)].join(' '),
  researchHut:
    'M14 76 V62 Q14 40 40 40 H60 Q86 40 86 62 V76 Z M20 100 V74 H26 V100 Z M74 100 V74 H80 V100 Z M90 100 V20 H92 V100 Z M92 20 H100 V30 H92 Z M0 100 Q50 92 100 100 Z',
};

export const LANDMARK_ART: Record<string, string> = { ...EXTRA_ART };
for (const world of WORLDS) LANDMARK_ART[LANDMARK_PLAN[world.id][0]] = LANDMARK_PATHS[world.landmark];

export type LandmarkInfo = {
  key: string;
  world: WorldDef;
  /** 0-3: which landmark of the world (level 15, 30, 45 or 60 inside it) */
  index: number;
  levelId: number;
  path: string;
};

export const landmarkKey = (key: string) => `landmark.${key}` as TKey;

/** The landmark a level shows on the route, or null for an ordinary level. */
export function landmarkAt(levelId: number): LandmarkInfo | null {
  if (!Number.isInteger(levelId) || levelId < 1 || levelId % LANDMARK_EVERY !== 0) return null;
  const worldId = Math.ceil(levelId / LEVELS_PER_WORLD);
  const plan = LANDMARK_PLAN[worldId];
  if (!plan) return null;
  const index = (levelId - (worldId - 1) * LEVELS_PER_WORLD) / LANDMARK_EVERY - 1;
  const key = plan[index];
  return { key, world: WORLDS[worldId - 1], index, levelId, path: LANDMARK_ART[key] };
}

/** All 4 landmarks of a world, in route order. */
export function worldLandmarks(worldId: number): LandmarkInfo[] {
  const first = (worldId - 1) * LEVELS_PER_WORLD;
  const out: LandmarkInfo[] = [];
  for (let i = 1; i <= LANDMARKS_PER_WORLD; i++) {
    const info = landmarkAt(first + i * LANDMARK_EVERY);
    if (info) out.push(info);
  }
  return out;
}

/** Landmarks the player has reached: a landmark counts once its level has been won. */
export const visitedCount = (stars: Record<number, number>, worldId?: number) =>
  (worldId ? worldLandmarks(worldId) : WORLDS.flatMap(w => worldLandmarks(w.id))).filter(l => stars[l.levelId])
    .length;
