import type { ProgressMap } from "./progress";

export type GroupStats = {
  total: number;
  /** 1回以上解いた問題数 */
  seen: number;
  attempts: number;
  correct: number;
  /** 正答率（解答がなければ null） */
  rate: number | null;
  /** 復習中の問題数 */
  inReview: number;
};

export function groupStats(questionIds: readonly string[], progress: ProgressMap): GroupStats {
  let seen = 0;
  let attempts = 0;
  let correct = 0;
  let inReview = 0;
  for (const id of questionIds) {
    const p = progress.get(id);
    if (!p) continue;
    seen++;
    attempts += p.attempts;
    correct += p.correctCount;
    if (p.box !== null) inReview++;
  }
  return { total: questionIds.length, seen, attempts, correct, rate: attempts ? correct / attempts : null, inReview };
}
