/**
 * 解答ログ・誤り報告の同期のための純粋関数。
 * どちらも追記だけのデータなので、同期は「ID で和集合をとる」だけでよい。
 */
import type { AnswerRecord } from "./progress";

export type ReportRecord = { id: string; questionId: string; note: string; createdAt: number };

export type SyncData = {
  answers: readonly AnswerRecord[];
  reports: readonly ReportRecord[];
};

function unionById<T extends { id: string }>(a: readonly T[], b: readonly T[], time: (x: T) => number): T[] {
  const byId = new Map<string, T>();
  for (const x of a) byId.set(x.id, x);
  for (const x of b) if (!byId.has(x.id)) byId.set(x.id, x);
  return [...byId.values()].sort((x, y) => time(x) - time(y) || x.id.localeCompare(y.id));
}

/** 手元とサーバーのデータを合わせる。同じ ID は手元を優先（内容は同じはず） */
export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  return {
    answers: unionById(local.answers, remote.answers, (r) => r.answeredAt),
    reports: unionById(local.reports, remote.reports, (r) => r.createdAt),
  };
}

/** サーバーにまだない行（送る必要があるもの） */
export function unsent(local: SyncData, serverIds: ReadonlySet<string>): SyncData {
  return {
    answers: local.answers.filter((r) => !serverIds.has(r.id)),
    reports: local.reports.filter((r) => !serverIds.has(r.id)),
  };
}

/** 2 つのデータの中身（ID の集合）が同じか。不要な再描画を避けるために使う */
export function sameIds(a: SyncData, b: SyncData): boolean {
  if (a.answers.length !== b.answers.length || a.reports.length !== b.reports.length) return false;
  const ids = new Set([...a.answers, ...a.reports].map((x) => x.id));
  return [...b.answers, ...b.reports].every((x) => ids.has(x.id));
}

// ---- DB の行との変換 ----

export type AnswerRow = { id: string; question_id: string; correct: boolean; answered_at: string };
export type ReportRow = { id: string; question_id: string; note: string; reported_at: string };

export const answerToRow = (r: AnswerRecord): AnswerRow => ({
  id: r.id,
  question_id: r.questionId,
  correct: r.correct,
  answered_at: new Date(r.answeredAt).toISOString(),
});

export const reportToRow = (r: ReportRecord): ReportRow => ({
  id: r.id,
  question_id: r.questionId,
  note: r.note,
  reported_at: new Date(r.createdAt).toISOString(),
});

/** 壊れた行は捨てる（null を返す） */
export function rowToAnswer(row: AnswerRow): AnswerRecord | null {
  const t = Date.parse(row.answered_at);
  if (!row.id || !row.question_id || typeof row.correct !== "boolean" || Number.isNaN(t)) return null;
  return { id: row.id, questionId: row.question_id, correct: row.correct, answeredAt: t };
}

export function rowToReport(row: ReportRow): ReportRecord | null {
  const t = Date.parse(row.reported_at);
  if (!row.id || !row.question_id || !row.note || Number.isNaN(t)) return null;
  return { id: row.id, questionId: row.question_id, note: row.note, createdAt: t };
}
