/**
 * 検証役の解答（{ id, answer, confidence, concern? }[] の JSON）と正解を比べ、要確認の問題を表示する。
 *   node scripts/blind-compare.mts answers.json
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Q = { id: string; answerIndex: number; stem: string; choices: { text: string }[] };
type A = { id: string; answer: number; confidence?: string; concern?: string };

const dir = join(import.meta.dirname, "../src/data/questions");
const bank = new Map<string, Q>();
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")))
  for (const q of JSON.parse(readFileSync(join(dir, f), "utf8")) as Q[]) bank.set(q.id, q);

const answers = JSON.parse(readFileSync(process.argv[2], "utf8")) as A[];
let ok = 0;
for (const a of answers) {
  const q = bank.get(a.id);
  if (!q) {
    console.log(`? ${a.id}: 問題が見つかりません`);
    continue;
  }
  const match = q.answerIndex === a.answer;
  if (match && !a.concern) {
    ok++;
    continue;
  }
  console.log(`${match ? "△" : "✗"} ${a.id} 想定=${q.answerIndex} 検証役=${a.answer} (${a.confidence ?? "-"}) ${a.concern ?? ""}`);
}
console.log(`\n一致かつ指摘なし: ${ok}/${answers.length}`);
