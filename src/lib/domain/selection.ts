import type { ProgressMap } from "./progress";
import { shuffle } from "./random";

/**
 * 演習で出す問題を選ぶ。
 * 1. まだ解いていない問題（ランダム）
 * 2. 解いたことがある問題は、正答率が低い順・前に解いたのが古い順
 * 同じ問題ばかり出ないよう、未出題を必ず優先する。
 */
export function pickPractice(
  questionIds: readonly string[],
  progress: ProgressMap,
  count: number,
  random: () => number,
): string[] {
  const unseen = shuffle(
    questionIds.filter((id) => !progress.has(id)),
    random,
  );
  if (unseen.length >= count) return unseen.slice(0, count);

  const seen = shuffle(
    questionIds.filter((id) => progress.has(id)),
    random,
  ).sort((a, b) => {
    const pa = progress.get(a)!;
    const pb = progress.get(b)!;
    const ra = pa.correctCount / pa.attempts;
    const rb = pb.correctCount / pb.attempts;
    return ra - rb || pa.lastAnsweredAt - pb.lastAnsweredAt;
  });
  return [...unseen, ...seen].slice(0, count);
}

/** 復習の時刻が来た問題を、予定が早い順に返す */
export function pickDueReviews(
  questionIds: readonly string[],
  progress: ProgressMap,
  now: number,
  count: number,
): string[] {
  return questionIds
    .filter((id) => {
      const p = progress.get(id);
      return p?.dueAt != null && p.dueAt <= now;
    })
    .sort((a, b) => progress.get(a)!.dueAt! - progress.get(b)!.dueAt!)
    .slice(0, count);
}

/** 復習待ち（まだ時刻が来ていないものも含む）の数 */
export function countInReview(questionIds: readonly string[], progress: ProgressMap): number {
  return questionIds.filter((id) => progress.get(id)?.box != null).length;
}
