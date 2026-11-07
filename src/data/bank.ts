import type { Question } from "@/lib/domain/question";
import { RAW_QUESTIONS } from "./questions/index";
import { UNITS, TOPICS, type Unit, type Topic } from "./units";

/** 全問題。形式は scripts/check-questions.mts で検証済みのものだけがコミットされる */
export const QUESTIONS = RAW_QUESTIONS as readonly Question[];

export const QUESTION_BY_ID: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));
export const UNIT_BY_ID: ReadonlyMap<string, Unit> = new Map(UNITS.map((u) => [u.id, u]));
export const TOPIC_BY_ID: ReadonlyMap<string, Topic> = new Map(TOPICS.map((t) => [t.id, t]));

/**
 * 出題範囲。URL の ?scope= に入れる文字列。
 *   all / set:unit / set:frequent / era:古代 / unit:u21 / topic:t-places / review
 */
export type Scope = string;

export function questionIdsInScope(scope: Scope): string[] {
  const [kind, value] = scope.split(":", 2) as [string, string | undefined];
  const match = (q: Question): boolean => {
    switch (kind) {
      case "all":
      case "review":
        return true;
      case "set":
        return q.set === value;
      case "era":
        return UNIT_BY_ID.get(q.unitId)?.era === value;
      case "unit":
        return q.unitId === value;
      case "topic":
        return q.topicId === value;
      default:
        return false;
    }
  };
  return QUESTIONS.filter(match).map((q) => q.id);
}

export function scopeLabel(scope: Scope): string {
  const [kind, value] = scope.split(":", 2);
  switch (kind) {
    case "all":
      return "全範囲";
    case "review":
      return "苦手の復習";
    case "set":
      return value === "frequent" ? "頻出テーマ（全部）" : "時代・地域（全部）";
    case "era":
      return `${value}（全部）`;
    case "unit":
      return UNIT_BY_ID.get(value ?? "")?.title ?? "単元";
    case "topic":
      return TOPIC_BY_ID.get(value ?? "")?.title ?? "テーマ";
    default:
      return "演習";
  }
}
