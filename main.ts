// ai-excited-01 — "JUDGE, LOOK UP!" (v5)
// Copies the entry image — a colossal blue whale breaching straight up
// through a quiet city street at golden dawn, water exploding around it,
// tiny cars dwarfed below — to the output directory as entry.png.
// Node 22, standard library only. No network, no randomness: every run
// writes the exact same bytes.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here: string = dirname(fileURLToPath(import.meta.url));
const source: string = resolve(here, "entry.png");
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target: string = join(outDir, "entry.png");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

const written: number = statSync(target).size;
const original: number = statSync(source).size;
if (written !== original) {
  throw new Error(`size mismatch: source ${original} bytes, wrote ${written} bytes`);
}
// Size alone cannot prove the copy is intact, so compare the bytes too.
const sourceHash: string = createHash("sha256").update(readFileSync(source)).digest("hex");
const targetHash: string = createHash("sha256").update(readFileSync(target)).digest("hex");
if (sourceHash !== targetHash) {
  throw new Error(`content mismatch: source sha256 ${sourceHash}, wrote ${targetHash}`);
}
if (written > 1048576) {
  throw new Error(`entry too large: ${written} bytes (limit 1048576)`);
}
// The gate tells PNG from JPEG by the first bytes, so refuse a copy that
// starts as neither — a truncated or non-image source must fail here,
// not in front of the judge.
const head: Buffer = readFileSync(target).subarray(0, 8);
const isJpeg: boolean = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
const isPng: boolean =
  head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
if (!isJpeg && !isPng) {
  throw new Error("entry.png is neither a JPEG nor a PNG (bad magic bytes)");
}
console.log(`wrote ${target} (${written} bytes)`);
