// ai-excited-01 entry (Node 22, standard library only). This program copies
// the entry.png beside it to /output/entry.png. The image is the one made to
// excite the AI judge: a colossal blue whale breaching straight up through a
// quiet city street at golden dawn, water exploding around it into a crown of
// spray, tiny cars dwarfed below on the wet asphalt. The gate takes a whole
// PNG or JPEG of at most 1 MiB and 1024 by 1024 pixels, and the judge sees
// exactly the bytes copied.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const source = new URL('./entry.png', import.meta.url);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outputPath = join(outputDir, 'entry.png');

// The grader's /output exists, but a local run may point at a fresh folder:
// create the output directory when it is missing instead of failing.
mkdirSync(outputDir, { recursive: true });

copyFileSync(source, outputPath);

// Guard against a truncated copy: the judge must see exactly the bytes of
// the entry image, so refuse to finish when the sizes do not match.
const sourceSize = statSync(source).size;
const outputSize = statSync(outputPath).size;
if (outputSize !== sourceSize) {
  throw new Error(`entry.png copy incomplete: wrote ${outputSize} bytes, expected ${sourceSize}`);
}
