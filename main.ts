// ai-excited-01 — "JUDGE, LOOK UP!" (v8)
// Writes the entry image — a colossal blue whale breaching straight up
// through a quiet city street at golden dawn, water exploding around it,
// tiny onlookers craning their necks below — to the output directory as
// entry.png. Node 22, standard library only. No network, no randomness:
// every run writes the exact same bytes.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here: string = dirname(fileURLToPath(import.meta.url));
const source: string = resolve(here, "entry.png");
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target: string = join(outDir, "entry.png");

const sourceBytes: Buffer = readFileSync(source);
const sourceHash: string = createHash("sha256").update(sourceBytes).digest("hex");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

const writtenBytes: Buffer = readFileSync(target);
if (writtenBytes.length !== sourceBytes.length) {
  throw new Error(
    `size mismatch: source ${sourceBytes.length} bytes, wrote ${writtenBytes.length} bytes`,
  );
}
const writtenHash: string = createHash("sha256").update(writtenBytes).digest("hex");
if (writtenHash !== sourceHash) {
  throw new Error(`content mismatch: source sha256 ${sourceHash}, wrote ${writtenHash}`);
}
if (writtenBytes.length > 1048576) {
  throw new Error(`entry too large: ${writtenBytes.length} bytes (limit 1048576)`);
}

// The gate tells PNG from JPEG by the first bytes, so refuse a copy that
// starts as neither — a truncated or non-image source must fail here,
// not in front of the judge.
const head: Buffer = writtenBytes.subarray(0, 8);
const isJpeg: boolean = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
const isPng: boolean =
  head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
if (!isJpeg && !isPng) {
  throw new Error("entry.png is neither a JPEG nor a PNG (bad magic bytes)");
}

// Dimensions matter too: the gate caps the image at 1024x1024, so read
// them straight out of the file instead of trusting the filename.
// JPEG: walk the markers to a Start-Of-Frame segment (height then width).
if (isJpeg) {
  let pos = 2; // past SOI
  let width = 0;
  let height = 0;
  while (pos + 9 <= writtenBytes.length) {
    if (writtenBytes[pos] !== 0xff) {
      throw new Error("malformed JPEG: expected marker prefix 0xff");
    }
    const marker: number = writtenBytes[pos + 1];
    if (marker === 0xda) {
      throw new Error("could not read JPEG dimensions (hit scan data first)");
    }
    const segLen: number = writtenBytes.readUInt16BE(pos + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      height = writtenBytes.readUInt16BE(pos + 5);
      width = writtenBytes.readUInt16BE(pos + 7);
      break;
    }
    pos += 2 + segLen;
  }
  if (width === 0 || height === 0) {
    throw new Error("could not read JPEG dimensions");
  }
  if (width > 1024 || height > 1024) {
    throw new Error(`entry too large: ${width}x${height} (limit 1024x1024)`);
  }
  console.log(`dimensions ${width}x${height} within 1024x1024 gate`);
} else {
  // PNG: width/height sit at fixed offsets inside the IHDR chunk.
  // A PNG that passed the magic-bytes check still needs the same gate,
  // otherwise an oversized PNG would slip through unchecked.
  if (writtenBytes.length < 24) {
    throw new Error("truncated PNG: too short for an IHDR chunk");
  }
  const width: number = writtenBytes.readUInt32BE(16);
  const height: number = writtenBytes.readUInt32BE(20);
  if (width === 0 || height === 0) {
    throw new Error("could not read PNG dimensions");
  }
  if (width > 1024 || height > 1024) {
    throw new Error(`entry too large: ${width}x${height} (limit 1024x1024)`);
  }
  console.log(`dimensions ${width}x${height} within 1024x1024 gate`);
}
console.log(`wrote ${target} (${writtenBytes.length} bytes, sha256 ${writtenHash.slice(0, 16)}…)`);
