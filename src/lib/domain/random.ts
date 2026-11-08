/** シード付きの疑似乱数（mulberry32）。テストで結果を固定するために使う */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 元の配列を変えずにシャッフルした新しい配列を返す（Fisher–Yates） */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 選択肢の表示順を決める。order[k] = 表示 k 番目に出す元の選択肢の番号。
 * 生成時の正解位置の偏りを、出題のたびに並べ替えて打ち消す。
 */
export function shuffleChoices(
  answerIndex: number,
  random: () => number,
  count = 4,
): { order: number[]; displayAnswer: number } {
  const order = shuffle(
    Array.from({ length: count }, (_, i) => i),
    random,
  );
  return { order, displayAnswer: order.indexOf(answerIndex) };
}
