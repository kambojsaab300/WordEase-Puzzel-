/** One first win: how long the player took against the bot's typical time for that level. */
export type PaceSample = { levelId: number; seconds: number; botSeconds: number };

/** The fields of the phone's play data this file reads (store/playStats.ts LevelPlay). */
type Play = {
  opens: number;
  quits: number;
  wins: number;
  firstWin?: { seconds: number; hints: number; resized: boolean };
};

export const PLAY_CSV_HEADER = 'level,seconds,hints,bot_seconds,opens,quits,wins,resized';

/** First wins on the shipped grid; Huge-text wins on a re-made grid and levels without a bot time are left out. */
export function paceSamples(
  levels: Record<number, Play>,
  botSecondsOf: (levelId: number) => number | undefined,
): PaceSample[] {
  const out: PaceSample[] = [];
  for (const [id, play] of Object.entries(levels)) {
    const levelId = Number(id);
    const botSeconds = botSecondsOf(levelId);
    if (!play.firstWin || play.firstWin.resized || botSeconds === undefined) continue;
    out.push({ levelId, seconds: play.firstWin.seconds, botSeconds });
  }
  return out.sort((a, b) => a.levelId - b.levelId);
}

/** Everything on one line per level, for the player to share with the developer. */
export function playDataCsv(
  levels: Record<number, Play>,
  botSecondsOf: (levelId: number) => number | undefined,
): string {
  const lines = Object.entries(levels)
    .map(([id, p]) => {
      const w = p.firstWin;
      const bot = botSecondsOf(Number(id));
      return [id, w?.seconds ?? '', w?.hints ?? '', bot ?? '', p.opens, p.quits, p.wins, w ? Number(w.resized) : ''];
    })
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(cells => cells.join(','));
  return [PLAY_CSV_HEADER, ...lines].join('\n');
}

export type PaceFit = {
  n: number;
  /** Player seconds ÷ bot seconds for a typical level; multiply the bot's pace by this */
  scale: number;
  /** Do the player's times rank levels like the bot does? 1 = same order, 0 = unrelated */
  rankMatch: number | null;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2; // ties share the average rank
    i = j + 1;
  }
  return out;
}

function spearman(a: number[], b: number[]): number | null {
  const ra = ranks(a);
  const rb = ranks(b);
  const mean = (xs: number[]) => xs.reduce((x, y) => x + y, 0) / xs.length;
  const ma = mean(ra);
  const mb = mean(rb);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? null : num / Math.sqrt(da * db);
}

// Fewer samples than this say nothing about ranking
const MIN_FOR_RANK = 5;

/**
 * The median ratio, not the mean, so one distracted run (phone call, tea break) cannot
 * swing the result.
 */
export function fitPace(samples: PaceSample[]): PaceFit | null {
  const usable = samples.filter(s => s.seconds > 0 && s.botSeconds > 0);
  if (usable.length === 0) return null;
  const scale = Math.exp(median(usable.map(s => Math.log(s.seconds / s.botSeconds))));
  const rankMatch =
    usable.length >= MIN_FOR_RANK
      ? spearman(
          usable.map(s => s.seconds),
          usable.map(s => s.botSeconds),
        )
      : null;
  return { n: usable.length, scale, rankMatch };
}
