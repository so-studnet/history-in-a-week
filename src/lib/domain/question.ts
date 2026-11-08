import { z } from "zod";

/** 問題帯。unit = 時代・地域の単元別、frequent = 頻出テーマ別 */
export const QUESTION_SETS = ["unit", "frequent"] as const;
export type QuestionSet = (typeof QUESTION_SETS)[number];

/** 問い方の型。生成の偏りを数えるために使う */
export const QUESTION_FORMATS = [
  "correct", // 正しいものを選べ
  "incorrect", // 誤っているものを選べ
  "term", // 空欄・用語・人物を答える
  "combination", // 正しい組み合わせ
  "chronology", // 年代順・同時代
] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export const choiceSchema = z.object({
  text: z.string().trim().min(1),
  /** その選択肢が正しい／誤っている理由の短い説明 */
  explanation: z.string().trim().min(1),
});

export const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  set: z.enum(QUESTION_SETS),
  /** 時代×地域の単元。頻出帯の問題も分析用に必ず単元を持つ */
  unitId: z.string().min(1),
  /** 頻出帯のときのテーマ ID */
  topicId: z.string().min(1).optional(),
  format: z.enum(QUESTION_FORMATS),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  stem: z.string().trim().min(1),
  choices: z.array(choiceSchema).length(4),
  answerIndex: z.number().int().min(0).max(3),
  /** 問題全体の補足（任意） */
  note: z.string().trim().min(1).optional(),
});

export type Choice = z.infer<typeof choiceSchema>;
export type Question = z.infer<typeof questionSchema>;

export type BankIssue = { id: string; message: string };

/** 比較用に、空白・句読点・全角半角の違いを消す */
export function normalizeText(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[\s、。，．・「」『』（）()〔〕［］\[\]]/g, "")
    .toLowerCase();
}

/**
 * 問題集全体を検証する。形式のほか、ID 重複・問題文の重複・
 * 選択肢の重複・頻出帯の topicId 欠落・存在しない単元を見つける。
 */
export function validateBank(
  raw: unknown[],
  known: { unitIds: ReadonlySet<string>; topicIds: ReadonlySet<string> },
): { questions: Question[]; issues: BankIssue[] } {
  const issues: BankIssue[] = [];
  const questions: Question[] = [];
  const ids = new Set<string>();
  const stems = new Map<string, string>();

  raw.forEach((item, i) => {
    const parsed = questionSchema.safeParse(item);
    const fallbackId =
      typeof item === "object" && item && "id" in item ? String(item.id) : `#${i}`;
    if (!parsed.success) {
      issues.push({ id: fallbackId, message: `形式エラー: ${parsed.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join(" / ")}` });
      return;
    }
    const q = parsed.data;
    if (ids.has(q.id)) issues.push({ id: q.id, message: "ID が重複しています" });
    ids.add(q.id);

    const key = normalizeText(q.stem) + "|" + normalizeText(q.choices[q.answerIndex].text);
    const dup = stems.get(key);
    if (dup) issues.push({ id: q.id, message: `${dup} と問題文・正解が同じです` });
    else stems.set(key, q.id);

    const texts = q.choices.map((c) => normalizeText(c.text));
    if (new Set(texts).size !== texts.length) issues.push({ id: q.id, message: "同じ選択肢があります" });

    if (!known.unitIds.has(q.unitId)) issues.push({ id: q.id, message: `未知の単元 ${q.unitId}` });
    if (q.set === "frequent") {
      if (!q.topicId) issues.push({ id: q.id, message: "頻出帯なのに topicId がありません" });
      else if (!known.topicIds.has(q.topicId)) issues.push({ id: q.id, message: `未知のテーマ ${q.topicId}` });
    }
    questions.push(q);
  });

  return { questions, issues };
}
