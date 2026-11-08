/**
 * 検証役に渡すため、正解と説明を伏せた問題を出力する。
 *   node scripts/blind-export.mts u21 t-era-sense > blind.json
 *   node scripts/blind-export.mts --since HEAD u01 u02   # HEAD 以降に足した問題だけ
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../src/data/questions");
const args = process.argv.slice(2);
const sinceIdx = args.indexOf("--since");
const since = sinceIdx >= 0 ? args.splice(sinceIdx, 2)[1] : null;
function oldIds(name: string): Set<string> {
  if (!since) return new Set();
  try {
    const text = execFileSync("git", ["show", `${since}:src/data/questions/${name}.json`], { encoding: "utf8" });
    return new Set((JSON.parse(text) as { id: string }[]).map((q) => q.id));
  } catch {
    return new Set();
  }
}
const out = args.flatMap((name) => {
  const skip = oldIds(name);
  const qs = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as {
    id: string;
    stem: string;
    choices: { text: string }[];
  }[];
  return qs.filter((q) => !skip.has(q.id)).map((q) => ({ id: q.id, stem: q.stem, choices: q.choices.map((c, i) => `${i}: ${c.text}`) }));
});
console.log(JSON.stringify(out, null, 1));
