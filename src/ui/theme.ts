// Colour tokens and sizes from the WordEase design flow.

export const colors = {
  bgCream: '#FFF8EC',
  ink: '#1F2A37',
  primaryOcean: '#0E6E8C',
  accentCoral: '#F2785C',
  coinGold: '#F5B700',
  okGreen: '#2E9B5E',
  white: '#FFFFFF',
  // Okabe-Ito colour-blind safe palette for found words
  found: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
} as const;

export const sizes = {
  touchTarget: 56,
  radius: 16,
  gutter: 16,
} as const;

// Android picks the font by file name in android/app/src/main/assets/fonts
export const fonts = {
  grid: 'AtkinsonHyperlegible-Bold',
  body: 'AtkinsonHyperlegible-Regular',
  uiBold: 'Nunito-Bold',
  ui: 'Nunito-Regular',
} as const;

// Normal / Large / Huge
export const fontSizes = {
  gridLetter: [28, 34, 42],
  wordChip: [20, 24, 28],
  ui: [18, 21, 24],
} as const;
