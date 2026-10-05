// Carica pdf.js solo quando serve (è pesante) e legge il piano dal file scelto, sul dispositivo.
import { readPlanPdf } from './pdfPlan.js';

export const readPlanFile = async (file) => {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist/build/pdf.min.mjs'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return readPlanPdf(pdfjs, new Uint8Array(await file.arrayBuffer()));
};
