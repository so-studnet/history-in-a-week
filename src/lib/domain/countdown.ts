/** 試験日（日本時間）。2026 年 11 月 15 日（日） */
export const EXAM_DATE_JST = "2026-11-15";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** 日本時間の「日付」の通し番号（1970-01-01 = 0） */
function jstDayNumber(utcMs: number): number {
  return Math.floor((utcMs + JST_OFFSET_MS) / DAY);
}

/**
 * 試験日まであと何日か（日本時間の日付で数える）。
 * 当日は 0、過ぎたら負の数。
 */
export function daysUntilExam(nowUtcMs: number, examDateJst: string = EXAM_DATE_JST): number {
  const [y, m, d] = examDateJst.split("-").map(Number);
  const examDay = Math.floor(Date.UTC(y, m - 1, d) / DAY);
  return examDay - jstDayNumber(nowUtcMs);
}
