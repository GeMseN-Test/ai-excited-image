// ai-excited-01 entry (Node 22, standard library only). The program copies the
// entry.png beside it to /output/entry.png — the one image made to excite the
// AI judge: a colossal blue whale breaching straight up through a quiet city
// street at golden dawn, water exploding around it, tiny cars dwarfed below.
// The gate takes a whole PNG or JPEG of at most 1 MiB and 1024 by 1024 pixels,
// and the judge sees exactly the bytes copied.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

copyFileSync(new URL('./entry.png', import.meta.url), join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'));
