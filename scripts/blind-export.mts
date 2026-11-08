/**
 * 検証役に渡すため、正解と説明を伏せた問題を出力する。
 *   node scripts/blind-export.mts u21 t-era-sense > blind.json
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../src/data/questions");
const out = process.argv.slice(2).flatMap((name) => {
  const qs = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as {
    id: string;
    stem: string;
    choices: { text: string }[];
  }[];
  return qs.map((q) => ({ id: q.id, stem: q.stem, choices: q.choices.map((c, i) => `${i}: ${c.text}`) }));
});
console.log(JSON.stringify(out, null, 1));
