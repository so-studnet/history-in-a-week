/**
 * 問題データ（src/data/questions/*.json）を検証し、配分を表示する。
 *   npm run questions:check            # 検証と配分の表示
 *   npm run questions:check -- --strict-coverage  # 問題が 0 の単元があれば失敗
 *   npm run questions:check -- --only u01,u02     # 指定したファイルだけ検証（作成中の他ファイルを無視）
 * Node の型除去で直接動かすので、import は拡張子付きの相対パスにする。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBank, QUESTION_FORMATS } from "../src/lib/domain/question.ts";
import { UNITS, TOPICS, UNIT_IDS, TOPIC_IDS } from "../src/data/units.ts";

const dir = join(import.meta.dirname, "../src/data/questions");
const onlyArg = process.argv.find((a) => a.startsWith("--only"));
const onlyIdx = process.argv.indexOf("--only");
const only = onlyArg?.includes("=")
  ? onlyArg.split("=")[1].split(",")
  : onlyIdx >= 0
    ? process.argv[onlyIdx + 1].split(",")
    : null;
const raw: unknown[] = [];
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !only || only.includes(f.replace(/\.json$/, "")))
  .sort();
for (const file of files) {
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  if (!Array.isArray(data)) {
    console.error(`${file}: 配列ではありません`);
    process.exit(1);
  }
  raw.push(...data);
}

const { questions, issues } = validateBank(raw, { unitIds: UNIT_IDS, topicIds: TOPIC_IDS });

const count = <K extends string>(keys: readonly K[], f: (q: (typeof questions)[number]) => K | undefined) => {
  const m = new Map<K, number>(keys.map((k) => [k, 0]));
  for (const q of questions) {
    const k = f(q);
    if (k !== undefined) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};

const byUnit = count(UNITS.map((u) => u.id), (q) => q.unitId);
const byTopic = count(TOPICS.map((t) => t.id), (q) => (q.set === "frequent" ? q.topicId : undefined));
const byFormat = count(QUESTION_FORMATS, (q) => q.format);
const byAnswer = count(["0", "1", "2", "3"], (q) => String(q.answerIndex) as "0");

console.log(`問題数: ${questions.length}（単元帯 ${questions.filter((q) => q.set === "unit").length} / 頻出帯 ${questions.filter((q) => q.set === "frequent").length}）`);
console.log("形式:", Object.fromEntries(byFormat));
console.log("正解位置（表示時にシャッフルするので参考値）:", Object.fromEntries(byAnswer));
console.log("単元ごと:");
for (const u of UNITS) console.log(`  ${u.id} [${u.frequency}] ${byUnit.get(u.id)}  ${u.title}`);
console.log("頻出テーマごと:");
for (const t of TOPICS) console.log(`  ${t.id} ${byTopic.get(t.id)}  ${t.title}`);

if (process.argv.includes("--strict-coverage")) {
  for (const [id, n] of byUnit) if (n === 0) issues.push({ id, message: "問題が 0 問の単元です" });
}

if (issues.length > 0) {
  console.error(`\n問題が ${issues.length} 件あります:`);
  for (const i of issues) console.error(`  ${i.id}: ${i.message}`);
  process.exit(1);
}
console.log("\n検証 OK");
