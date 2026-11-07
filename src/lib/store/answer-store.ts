/**
 * 解答ログと誤り報告の保存先。画面は useSyncExternalStore で読む。
 * 今はブラウザ内保存（localStorage）。M5 で Supabase と同期する実装に差し替える。
 */
import type { AnswerRecord } from "@/lib/domain/progress";

export type ProblemReport = { id: string; questionId: string; note: string; createdAt: number };

export type AnswerData = {
  answers: readonly AnswerRecord[];
  reports: readonly ProblemReport[];
};

export interface AnswerStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): AnswerData;
  getServerSnapshot(): AnswerData;
  addAnswer(record: AnswerRecord): void;
  addReport(report: ProblemReport): void;
}

const EMPTY: AnswerData = { answers: [], reports: [] };
const KEY = "hiaw:data:v1";

function isAnswer(x: unknown): x is AnswerRecord {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.questionId === "string" && typeof r.correct === "boolean" && typeof r.answeredAt === "number";
}
function isReport(x: unknown): x is ProblemReport {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.questionId === "string" && typeof r.note === "string" && typeof r.createdAt === "number";
}

/** 保存された JSON を読む。壊れた要素は捨てる */
export function parseStored(text: string | null): AnswerData {
  if (!text) return EMPTY;
  try {
    const v = JSON.parse(text) as { answers?: unknown; reports?: unknown };
    return {
      answers: Array.isArray(v.answers) ? v.answers.filter(isAnswer) : [],
      reports: Array.isArray(v.reports) ? v.reports.filter(isReport) : [],
    };
  } catch {
    return EMPTY;
  }
}

export class LocalAnswerStore implements AnswerStore {
  private data: AnswerData | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        this.data = parseStored(e.newValue);
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  getSnapshot = (): AnswerData => {
    if (this.data === null) {
      let text: string | null = null;
      try {
        text = localStorage.getItem(KEY);
      } catch {}
      this.data = parseStored(text);
    }
    return this.data;
  };

  getServerSnapshot = (): AnswerData => EMPTY;

  addAnswer = (record: AnswerRecord) => this.update((d) => ({ ...d, answers: [...d.answers, record] }));
  addReport = (report: ProblemReport) => this.update((d) => ({ ...d, reports: [...d.reports, report] }));

  private update(fn: (d: AnswerData) => AnswerData) {
    this.data = fn(this.getSnapshot());
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {}
    for (const l of this.listeners) l();
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
