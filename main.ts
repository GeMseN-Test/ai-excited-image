// ai-excited-01 — "Whale in the City — dawn breach" (v9)
// Writes the entry image — a colossal blue whale breaching straight up
// through a quiet city street at golden dawn, water exploding around it,
// tiny onlookers craning their necks below, and the golden shout
// "JUDGE, LOOK UP!" across the sky — to the output directory as entry.png.
// Node 22, standard library only. No network, no randomness, no clock:
// every run writes the exact same bytes.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576; // 1 MiB gate
const MAX_SIDE = 1024; // 1024x1024 gate

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

function fail(msg: string): never {
  throw new Error(`entry: ${msg}`);
}

// Read the JPEG SOF segment to get width/height without any dependency.
function jpegSize(buf: Buffer): { width: number; height: number } {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) fail("not a JPEG");
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) fail("bad JPEG marker");
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  fail("no JPEG SOF segment found");
}

const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) fail(`source is ${bytes.length} bytes, over the 1 MiB gate`);
const { width, height } = jpegSize(bytes);
if (width > MAX_SIDE || height > MAX_SIDE) fail(`source is ${width}x${height}, over the 1024x1024 gate`);
const hash = createHash("sha256").update(bytes).digest("hex");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

const written = readFileSync(target);
if (written.length !== bytes.length) fail("output size mismatch");
if (createHash("sha256").update(written).digest("hex") !== hash) fail("output hash mismatch");
// Re-read the dimensions from the file that actually landed on disk, so a
// truncated or corrupted copy can never pass on the source's word alone.
const outSize = jpegSize(written);
if (outSize.width !== width || outSize.height !== height) fail("output dimensions mismatch");
if (statSync(target).size > MAX_BYTES) fail("output over the 1 MiB gate");

console.log(`wrote ${target} (${width}x${height}, ${written.length} bytes, sha256 ${hash})`);
