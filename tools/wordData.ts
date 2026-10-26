// Loads the word sources used at build time: ENABLE (bonus words), WordNet (meanings), blocklist.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'tools', '.cache');

export function loadEnable(): Set<string> {
  const text = fs.readFileSync(path.join(CACHE, 'enable1.txt'), 'utf8');
  return new Set(text.split(/\r?\n/).filter(Boolean).map(w => w.toUpperCase()));
}

export function loadBlocklist(): Set<string> {
  const text = fs.readFileSync(path.join(ROOT, 'tools', 'blocklist', 'en.txt'), 'utf8');
  return new Set(text.split(/\r?\n/).filter(Boolean));
}

// Hand-written meanings for words WordNet does not have (our own text)
export function loadExtraMeanings(): Record<string, string> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'meanings-extra.json'), 'utf8'));
}

const POS_FILES = ['noun', 'verb', 'adj', 'adv'];

/** First WordNet sense of each word, noun first. Only for the words asked for. */
export function wordNetMeanings(words: Iterable<string>): Record<string, string> {
  const wanted = new Set([...words].map(w => w.toLowerCase()));
  const out: Record<string, string> = {};

  for (const pos of POS_FILES) {
    const dir = path.join(CACHE, 'wn', 'dict');
    const index = fs.readFileSync(path.join(dir, `index.${pos}`), 'utf8');
    const data = fs.readFileSync(path.join(dir, `data.${pos}`));

    for (const line of index.split('\n')) {
      if (line.startsWith(' ')) continue; // license header
      const parts = line.trim().split(' ');
      const lemma = parts[0];
      if (!wanted.has(lemma) || out[lemma.toUpperCase()]) continue;

      // lemma pos synset_cnt p_cnt [ptr...] sense_cnt tagsense_cnt offsets...
      const pCount = Number(parts[3]);
      const firstOffset = Number(parts[4 + pCount + 2]);
      const end = data.indexOf('\n', firstOffset);
      const record = data.toString('utf8', firstOffset, end);
      const gloss = record.slice(record.indexOf('| ') + 2);
      out[lemma.toUpperCase()] = cleanGloss(gloss);
    }
  }
  return out;
}

function cleanGloss(gloss: string): string {
  // Keep the definition, drop the quoted usage examples
  const definition = gloss
    .split(/;\s*"/)[0]
    .split('; ')[0]
    .replace(/^\([^)]*\)\s*/, '') // "(astronomy) ..." style labels
    .trim();
  return definition.charAt(0).toUpperCase() + definition.slice(1);
}
