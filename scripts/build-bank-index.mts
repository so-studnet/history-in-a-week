/**
 * src/data/questions/*.json をまとめて読み込む src/data/questions/index.ts を作る。
 * 問題ファイルを足したら実行する（questions:check・dev・build の前に自動で動く）。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../src/data/questions");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const names = files.map((_, i) => `q${i}`);
const body = `// このファイルは scripts/build-bank-index.mts が生成する。手で編集しない。
${files.map((f, i) => `import ${names[i]} from "./${f}";`).join("\n")}

export const RAW_QUESTIONS: readonly unknown[] = [${names.map((n) => `...${n}`).join(", ")}];
`;
const target = join(dir, "index.ts");
let prev = "";
try {
  prev = readFileSync(target, "utf8");
} catch {}
if (prev !== body) writeFileSync(target, body);
