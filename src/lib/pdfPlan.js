// Lettura del piano alimentare da un PDF, interamente sul dispositivo (nessun file viene caricato altrove).
// extractPdfLines riceve la libreria pdf.js già caricata, così la stessa logica si può provare anche da terminale.
import { parseSlotPlan } from './dietPlan.js';

// Ricostruisce le righe di ogni pagina dalla posizione delle parole. Le lettere staccate dalle legature ("fi", "fl")
// e le cifre separate ("9 0") si riuniscono guardando lo spazio reale tra i pezzi.
export const extractPdfLines = async (pdfjs, data) => {
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    const rows = new Map();
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 3);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(it);
    }
    pages.push([...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, items]) => {
      items.sort((a, b) => a.transform[4] - b.transform[4]);
      let line = '';
      let prevEnd = null;
      for (const it of items) {
        const size = Math.abs(it.transform[0]) || 10;
        const gap = prevEnd === null ? Infinity : it.transform[4] - prevEnd;
        line += (prevEnd !== null && gap > size * 0.22 ? ' ' : '') + it.str.trim();
        prevEnd = it.transform[4] + (it.width || 0);
      }
      return line.replace(/\s+/g, ' ').trim();
    }));
  }
  return pages;
};

const HEADING = /^(colazione|spuntino|merenda|pranzo|cena)\s*:?\s*$/i;
const SEP = /^(accompagnat\w+ da|ed in aggiunta|in aggiunta|inoltre)\b[^.]{0,30}:?$/i;
const POOL = /^fino a\s+\d+\s+volte\s+(a|alla)\s+settimana/i;
const START = /^(oppure\b|\d|(un|una|uno|due|tre)\s+[a-zà-ù]|fino a\s+\d)/;

// Righe di un pasto -> testo nel formato che l'app capisce (alternative per riga, riga vuota tra i gruppi)
const canonicalSlot = (lines) => {
  const out = [];
  let last = null;
  let sawVeg = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^[•·*-]$/.test(t)) continue;
    const s = t.replace(/^[•·*-]\s*/, '');
    if (SEP.test(s)) { out.push({ type: 'sep' }); last = out.at(-1); continue; }
    if (POOL.test(s)) { out.push({ type: 'pool', text: s.replace(/[:,].*$/, ':') }); last = out.at(-1); continue; }
    if (START.test(s) || (/^[•·]/.test(t) && /\d/.test(s))) { out.push({ type: 'opt', text: s.replace(/^oppure\s+/i, '') }); last = out.at(-1); continue; }
    if (last?.type === 'opt' && /^[a-zà-ù(\[]/.test(s)) { last.text += ` ${s}`; continue; }
    out.push({ type: 'prose', text: s }); last = out.at(-1);
    if (/verdur/i.test(s)) sawVeg = true;
  }
  const text = out.map((o) => (o.type === 'sep' ? '' : o.type === 'prose' ? null : o.text)).filter((x) => x !== null).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  // il piano dice che le verdure non devono mai mancare: diventano un gruppo a sé
  return sawVeg && text ? `${text}\n\nverdure` : text;
};

// Dalle righe delle pagine al testo di ogni pasto. Non serve riconoscere l'intero documento: si parte dal primo titolo di pasto.
export const planFromPages = (pages) => {
  // toglie intestazioni e piè di pagina (righe che si ripetono su più pagine)
  const freq = new Map();
  pages.forEach((lines) => new Set(lines).forEach((l) => freq.set(l, (freq.get(l) || 0) + 1)));
  const limit = Math.max(3, Math.ceil(pages.length / 2));
  const lines = pages.flatMap((p) => p.filter((l) => (freq.get(l) || 0) < limit || HEADING.test(l)));

  const slots = {};
  let cur = null;
  let spuntini = 0;
  let buffer = [];
  const flush = () => { if (cur) slots[cur] = (slots[cur] || []).concat(buffer); buffer = []; };
  for (const line of lines) {
    if (HEADING.test(line.trim()) && line.trim().length < 20) {
      flush();
      const w = line.trim().toLowerCase().replace(':', '');
      cur = w === 'colazione' ? 'Colazione' : w === 'pranzo' ? 'Pranzo' : w === 'cena' ? 'Cena' : w === 'merenda' ? 'Spuntino 2' : (++spuntini > 1 ? 'Spuntino 2' : 'Spuntino 1');
      continue;
    }
    if (cur) buffer.push(line);
  }
  flush();
  const text = {};
  for (const [slot, ls] of Object.entries(slots)) {
    const t = canonicalSlot(ls);
    if (t) text[slot] = t;
  }
  return text;
};

export const readPlanPdf = async (pdfjs, data) => planFromPages(await extractPdfLines(pdfjs, data));

// Per l'anteprima: quanti gruppi e alternative ha capito
export const summarize = (text) => Object.fromEntries(Object.entries(text).map(([slot, t]) => [slot, parseSlotPlan(t)]));
