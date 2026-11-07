import { describe, expect, it } from "vitest";
import { validateBank, normalizeText } from "./question";
import { createRandom, shuffle, shuffleChoices } from "./random";
import { applyAnswer, deriveProgress, mergeLogs, REVIEW_INTERVALS, type AnswerRecord } from "./progress";
import { pickPractice, pickDueReviews } from "./selection";
import { daysUntilExam } from "./countdown";

const known = { unitIds: new Set(["u01"]), topicIds: new Set(["t1"]) };
const q = (over: Record<string, unknown> = {}) => ({
  id: "q-1",
  set: "unit",
  unitId: "u01",
  format: "correct",
  difficulty: 2,
  stem: "問題文",
  choices: ["ア", "イ", "ウ", "エ"].map((t) => ({ text: t, explanation: `${t}の説明` })),
  answerIndex: 1,
  ...over,
});

describe("validateBank", () => {
  it("正しい問題は通る", () => {
    const r = validateBank([q()], known);
    expect(r.issues).toEqual([]);
    expect(r.questions).toHaveLength(1);
  });
  it("形式エラー・ID重複・内容重複・選択肢重複・未知の単元・topicId欠落を見つける", () => {
    const r = validateBank(
      [
        q(),
        q({ choices: [] }),
        q(), // ID と内容が重複
        q({ id: "q-3", stem: "別", choices: ["ア", "ア ", "ウ", "エ"].map((t) => ({ text: t, explanation: "x" })) }),
        q({ id: "q-4", stem: "別2", unitId: "u99" }),
        q({ id: "q-5", stem: "別3", set: "frequent" }),
        q({ id: "q-6", stem: "別4", set: "frequent", topicId: "t9" }),
      ],
      known,
    );
    const msgs = r.issues.map((i) => `${i.id}:${i.message}`);
    expect(msgs.some((m) => m.startsWith("q-1:形式エラー"))).toBe(true);
    expect(msgs).toContain("q-1:ID が重複しています");
    expect(msgs).toContain("q-1:q-1 と問題文・正解が同じです");
    expect(msgs).toContain("q-3:同じ選択肢があります");
    expect(msgs).toContain("q-4:未知の単元 u99");
    expect(msgs).toContain("q-5:頻出帯なのに topicId がありません");
    expect(msgs).toContain("q-6:未知のテーマ t9");
  });
  it("normalizeText は全角半角・空白・括弧の違いを無視する", () => {
    expect(normalizeText("（ア） ＡＢＣ、")).toBe(normalizeText("(ア)abc"));
  });
});

describe("random", () => {
  it("同じシードなら同じ並び、元の配列は変えない", () => {
    const a = [1, 2, 3, 4, 5];
    expect(shuffle(a, createRandom(1))).toEqual(shuffle(a, createRandom(1)));
    expect(a).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffle(a, createRandom(2))].sort()).toEqual(a);
  });
  it("shuffleChoices の displayAnswer は元の正解を指す", () => {
    for (let s = 0; s < 50; s++) {
      const { order, displayAnswer } = shuffleChoices(2, createRandom(s));
      expect(order[displayAnswer]).toBe(2);
    }
  });
  it("正解の表示位置がおおむね均等に散る", () => {
    const counts = [0, 0, 0, 0];
    const rnd = createRandom(42);
    for (let i = 0; i < 4000; i++) counts[shuffleChoices(0, rnd).displayAnswer]++;
    for (const c of counts) expect(c).toBeGreaterThan(850);
  });
});

describe("progress", () => {
  const T = 1_000_000;
  it("初回正解は復習対象にならない", () => {
    const p = applyAnswer(undefined, { correct: true, answeredAt: T });
    expect(p).toMatchObject({ attempts: 1, correctCount: 1, box: null, dueAt: null });
  });
  it("間違えると10分後に復習、正解ごとに間隔が伸びて卒業", () => {
    let p = applyAnswer(undefined, { correct: false, answeredAt: T });
    expect(p).toMatchObject({ box: 0, dueAt: T + REVIEW_INTERVALS[0] });
    p = applyAnswer(p, { correct: true, answeredAt: T + 1 });
    expect(p).toMatchObject({ box: 1, dueAt: T + 1 + REVIEW_INTERVALS[1] });
    p = applyAnswer(p, { correct: true, answeredAt: T + 2 });
    expect(p).toMatchObject({ box: 2, dueAt: T + 2 + REVIEW_INTERVALS[2] });
    p = applyAnswer(p, { correct: true, answeredAt: T + 3 });
    expect(p).toMatchObject({ box: null, dueAt: null, attempts: 4, correctCount: 3 });
  });
  it("復習中に間違えると最初に戻る", () => {
    let p = applyAnswer(undefined, { correct: false, answeredAt: T });
    p = applyAnswer(p, { correct: true, answeredAt: T + 1 });
    p = applyAnswer(p, { correct: false, answeredAt: T + 2 });
    expect(p.box).toBe(0);
  });
  it("ログの順番が違っても同じ結果、端末のログを重複なく合わせられる", () => {
    const log: AnswerRecord[] = [
      { id: "a", questionId: "q", correct: false, answeredAt: T },
      { id: "b", questionId: "q", correct: true, answeredAt: T + 5 },
    ];
    expect(deriveProgress(log)).toEqual(deriveProgress([...log].reverse()));
    const merged = mergeLogs(log, [log[1], { id: "c", questionId: "r", correct: true, answeredAt: T + 1 }]);
    expect(merged.map((r) => r.id)).toEqual(["a", "c", "b"]);
  });
});

describe("selection", () => {
  const T = 1_000_000;
  const ids = ["q1", "q2", "q3", "q4"];
  it("未出題を優先し、その後は正答率の低い順", () => {
    const progress = deriveProgress([
      { id: "1", questionId: "q1", correct: true, answeredAt: T },
      { id: "2", questionId: "q2", correct: false, answeredAt: T },
    ]);
    const picked = pickPractice(ids, progress, 3, createRandom(1));
    expect(new Set(picked.slice(0, 2))).toEqual(new Set(["q3", "q4"]));
    expect(picked[2]).toBe("q2");
  });
  it("時刻が来た復習だけを予定順に返す", () => {
    const progress = deriveProgress([
      { id: "1", questionId: "q1", correct: false, answeredAt: T },
      { id: "2", questionId: "q2", correct: false, answeredAt: T - 1000 },
      { id: "3", questionId: "q3", correct: false, answeredAt: T + REVIEW_INTERVALS[0] },
    ]);
    expect(pickDueReviews(ids, progress, T + REVIEW_INTERVALS[0], 10)).toEqual(["q2", "q1"]);
  });
});

describe("daysUntilExam", () => {
  it("日本時間の日付で数える", () => {
    expect(daysUntilExam(Date.parse("2026-11-07T12:00:00+09:00"))).toBe(8);
    expect(daysUntilExam(Date.parse("2026-11-14T23:59:00+09:00"))).toBe(1);
    expect(daysUntilExam(Date.parse("2026-11-15T00:00:00+09:00"))).toBe(0);
    expect(daysUntilExam(Date.parse("2026-11-14T15:30:00Z"))).toBe(0); // JST では15日 0:30
  });
});

import { groupStats } from "./stats";
describe("groupStats", () => {
  it("解いた数・正答率・復習中の数を数える", () => {
    const progress = deriveProgress([
      { id: "1", questionId: "a", correct: true, answeredAt: 1 },
      { id: "2", questionId: "b", correct: false, answeredAt: 2 },
      { id: "3", questionId: "b", correct: true, answeredAt: 3 },
      { id: "4", questionId: "x", correct: true, answeredAt: 4 },
    ]);
    expect(groupStats(["a", "b", "c"], progress)).toEqual({ total: 3, seen: 2, attempts: 3, correct: 2, rate: 2 / 3, inReview: 1 });
    expect(groupStats(["c"], progress).rate).toBeNull();
  });
});
