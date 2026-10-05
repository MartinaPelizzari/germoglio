// Prova da terminale: legge un PDF di piano alimentare come farà l'app e mostra cosa ha capito.
// Uso: node scripts/read-plan-pdf.mjs "percorso/del/piano.pdf"
import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPlanPdf } from '../src/lib/pdfPlan.js';
import { describeOption, optionLimits, parseSlotPlan } from '../src/lib/dietPlan.js';

const file = process.argv[2];
if (!file) { console.log('Indica il percorso del PDF.'); process.exit(1); }
const text = await readPlanPdf(pdfjs, new Uint8Array(fs.readFileSync(file)));
for (const [slot, t] of Object.entries(text)) {
  console.log(`\n=== ${slot} ===`);
  parseSlotPlan(t).forEach((g, i) => {
    console.log(` gruppo ${i + 1}:`);
    g.options.forEach((o) => console.log(`   - ${describeOption(o)}${o.note ? `   (${o.note})` : ''}${optionLimits(o) ? `   [${optionLimits(o)}]` : ''}${o.avoid ? `   evita: ${o.avoid.join(', ')}` : ''}`));
  });
}
