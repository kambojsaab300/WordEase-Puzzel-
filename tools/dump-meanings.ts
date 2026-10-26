// Prints every theme word with its WordNet meaning, for manual review.
import { THEMES_BY_WORLD } from '../src/game/levels/themes';
import { loadExtraMeanings, wordNetMeanings } from './wordData';

const words = new Set(THEMES_BY_WORLD.flat().flatMap(t => t.words));
const meanings = { ...wordNetMeanings(words), ...loadExtraMeanings() };
for (const w of [...words].sort()) console.log(`${w}: ${(meanings[w] ?? '-').slice(0, 90)}`);
