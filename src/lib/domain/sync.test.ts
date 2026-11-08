import { describe, expect, it } from "vitest";
import { answerToRow, mergeSyncData, rowToAnswer, rowToReport, reportToRow, sameIds, unsent, type SyncData } from "./sync";

const a = (id: string, t: number) => ({ id, questionId: "q", correct: true, answeredAt: t });
const r = (id: string, t: number) => ({ id, questionId: "q", note: "n", createdAt: t });

describe("sync", () => {
  it("手元とサーバーを ID で合わせ、時刻順に並べる", () => {
    const local: SyncData = { answers: [a("1", 10), a("3", 30)], reports: [r("x", 5)] };
    const remote: SyncData = { answers: [a("2", 20), a("1", 10)], reports: [r("y", 1)] };
    const m = mergeSyncData(local, remote);
    expect(m.answers.map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(m.reports.map((x) => x.id)).toEqual(["y", "x"]);
  });
  it("サーバーにない行だけを送る", () => {
    const local: SyncData = { answers: [a("1", 1), a("2", 2)], reports: [r("x", 1)] };
    const u = unsent(local, new Set(["1"]));
    expect(u.answers.map((x) => x.id)).toEqual(["2"]);
    expect(u.reports.map((x) => x.id)).toEqual(["x"]);
  });
  it("sameIds は中身の ID が同じかを見る", () => {
    expect(sameIds({ answers: [a("1", 1)], reports: [] }, { answers: [a("1", 1)], reports: [] })).toBe(true);
    expect(sameIds({ answers: [a("1", 1)], reports: [] }, { answers: [a("2", 1)], reports: [] })).toBe(false);
  });
  it("DB の行と相互に変換でき、壊れた行は捨てる", () => {
    const rec = a("1", Date.parse("2026-11-08T01:02:03.000Z"));
    expect(rowToAnswer(answerToRow(rec))).toEqual(rec);
    expect(rowToAnswer({ ...answerToRow(rec), answered_at: "2026-11-08T01:02:03+00:00" })).toEqual(rec);
    expect(rowToAnswer({ ...answerToRow(rec), answered_at: "bad" })).toBeNull();
    const rep = r("x", 1000);
    expect(rowToReport(reportToRow(rep))).toEqual(rep);
    expect(rowToReport({ ...reportToRow(rep), note: "" })).toBeNull();
  });
});
