// ai-excited-01 — "JUDGE, LOOK UP!"
// Copies the entry image (a colossal blue whale breaching through a city
// street at golden dawn) to the output directory as entry.png.
// Node 22, standard library only. No network, no randomness: the same
// bytes go out on every run.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here: string = dirname(fileURLToPath(import.meta.url));
const source: string = resolve(here, "entry.png");
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target: string = join(outDir, "entry.png");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

const from: number = statSync(source).size;
const to: number = statSync(target).size;
if (from !== to) {
  throw new Error(`size mismatch: source ${from} bytes, wrote ${to} bytes`);
}
if (to > 1048576) {
  throw new Error(`entry too large: ${to} bytes (limit 1048576)`);
}
// The gate tells PNG from JPEG by the first bytes, so make sure the copy
// actually starts as one of them — a truncated or non-image source must
// fail here, not in front of the judge.
const head: Buffer = readFileSync(target).subarray(0, 8);
const isJpeg: boolean = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
const isPng: boolean =
  head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
if (!isJpeg && !isPng) {
  throw new Error("entry.png is neither a JPEG nor a PNG (bad magic bytes)");
}
console.log(`wrote ${target} (${to} bytes)`);
