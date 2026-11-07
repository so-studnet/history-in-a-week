/**
 * 解答の記録と、そこから導く各問題の状態（復習の予定など）。
 *
 * 記録は「追記だけの解答ログ」として持つ。PC とスマホで別々に解いても、
 * ログを合わせて時刻順に並べ直せば同じ状態が再現できるので、同期で衝突しない。
 */

export type AnswerRecord = {
  id: string;
  questionId: string;
  correct: boolean;
  /** 解答した時刻（UTC のミリ秒） */
  answeredAt: number;
};

export type QuestionProgress = {
  attempts: number;
  correctCount: number;
  lastCorrect: boolean;
  lastAnsweredAt: number;
  /** 復習中の段階。null = 復習対象でない（未ミス or 卒業済み） */
  box: number | null;
  /** 次に復習に出す時刻。box が null のときは null */
  dueAt: number | null;
};

export type ProgressMap = ReadonlyMap<string, QuestionProgress>;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * 復習の間隔。間違えた直後は 10 分後、そこから正解するたびに
 * 1 日後 → 2 日後 → 卒業。試験まで約 1 週間なので短めにしてある。
 */
export const REVIEW_INTERVALS = [10 * MINUTE, 1 * DAY, 2 * DAY] as const;

export function applyAnswer(
  prev: QuestionProgress | undefined,
  record: Pick<AnswerRecord, "correct" | "answeredAt">,
): QuestionProgress {
  const base: QuestionProgress = prev ?? {
    attempts: 0,
    correctCount: 0,
    lastCorrect: false,
    lastAnsweredAt: 0,
    box: null,
    dueAt: null,
  };
  let box: number | null;
  let dueAt: number | null;
  if (!record.correct) {
    box = 0;
    dueAt = record.answeredAt + REVIEW_INTERVALS[0];
  } else if (base.box === null) {
    box = null;
    dueAt = null;
  } else {
    const next = base.box + 1;
    if (next >= REVIEW_INTERVALS.length) {
      box = null;
      dueAt = null;
    } else {
      box = next;
      dueAt = record.answeredAt + REVIEW_INTERVALS[next];
    }
  }
  return {
    attempts: base.attempts + 1,
    correctCount: base.correctCount + (record.correct ? 1 : 0),
    lastCorrect: record.correct,
    lastAnsweredAt: record.answeredAt,
    box,
    dueAt,
  };
}

/** 解答ログ全体から各問題の状態を作る。ログの順番は問わない（時刻順に並べ直す） */
export function deriveProgress(log: readonly AnswerRecord[]): Map<string, QuestionProgress> {
  const sorted = log
    .slice()
    .sort((a, b) => a.answeredAt - b.answeredAt || a.id.localeCompare(b.id));
  const map = new Map<string, QuestionProgress>();
  for (const r of sorted) map.set(r.questionId, applyAnswer(map.get(r.questionId), r));
  return map;
}

/** 2 つの端末のログを ID で重複を除いて合わせる */
export function mergeLogs(a: readonly AnswerRecord[], b: readonly AnswerRecord[]): AnswerRecord[] {
  const byId = new Map<string, AnswerRecord>();
  for (const r of [...a, ...b]) byId.set(r.id, r);
  return [...byId.values()].sort((x, y) => x.answeredAt - y.answeredAt || x.id.localeCompare(y.id));
}
