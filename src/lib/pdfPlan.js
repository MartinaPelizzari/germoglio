// Lettura del piano alimentare da un PDF, interamente sul dispositivo (nessun file viene caricato altrove).
// Le funzioni ricevono la libreria pdf.js già caricata, così la stessa logica si può provare anche da terminale.
//
// Due tipi di piano:
//  - testo corrente ("90 g di pasta  oppure  90 g di riso ...", "ed in aggiunta:");
//  - tabelle "alimento base | sostituto": ogni riga è un gruppo di alternative. Le righe si trovano dai bordi disegnati
//    nella pagina (non dal solo testo), perché il testo da solo non dice dove finisce una riga e inizia la successiva.
import { parseSlotPlan } from './dietPlan.js';

const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];

// Righe di testo (con la posizione di ogni pezzo) e segmenti orizzontali (bordi di tabella) di una pagina
const readPage = async (pdfjs, page) => {
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const items = tc.items.filter((it) => it.str && it.str.trim()).map((it) => ({ x: it.transform[4], y: vp.height - it.transform[5], w: it.width || 0, size: Math.abs(it.transform[0]) || 10, str: it.str.trim() }));
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  for (const it of items) {
    const row = rows.find((r) => Math.abs(r.y - it.y) < 2.5);
    if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  rows.sort((a, b) => a.y - b.y).forEach((r) => r.items.sort((a, b) => a.x - b.x));

  // bordi orizzontali: rettangoli sottili e larghi
  const { OPS } = pdfjs;
  const ol = await page.getOperatorList();
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const pending = [];
  const segments = [];
  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i];
    const a = ol.argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() || ctm;
    else if (fn === OPS.transform) ctm = mul(ctm, a);
    else if (fn === OPS.constructPath) {
      const [ops, coords] = a;
      let ci = 0;
      for (const o of ops) {
        if (o === OPS.rectangle) { pending.push({ x: coords[ci], y: coords[ci + 1], w: coords[ci + 2], h: coords[ci + 3], m: ctm.slice() }); ci += 4; }
        else if (o === OPS.moveTo || o === OPS.lineTo) ci += 2;
        else if (o === OPS.curveTo) ci += 6;
        else if (o === OPS.curveTo2 || o === OPS.curveTo3) ci += 4;
      }
    } else if ([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.stroke].includes(fn)) {
      for (const r of pending) {
        const m = r.m;
        const x1 = m[0] * r.x + m[2] * r.y + m[4];
        const y1 = m[1] * r.x + m[3] * r.y + m[5];
        const x2 = m[0] * (r.x + r.w) + m[2] * (r.y + r.h) + m[4];
        const y2 = m[1] * (r.x + r.w) + m[3] * (r.y + r.h) + m[5];
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        if (h < 4 && w >= 60) segments.push({ x: Math.min(x1, x2), w, y: vp.height - Math.max(y1, y2) });
      }
      pending.length = 0;
    } else if (fn === OPS.endPath) pending.length = 0;
  }
  return { width: vp.width, height: vp.height, rows, segments };
};

export const readPdfPages = async (pdfjs, data) => {
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) pages.push(await readPage(pdfjs, await doc.getPage(p)));
  return pages;
};

// Unisce i pezzi di una riga: le legature ("fi", "fl") e le cifre staccate si riuniscono guardando lo spazio reale
const joinItems = (items) => {
  let line = '';
  let prevEnd = null;
  for (const it of items) {
    const gap = prevEnd === null ? Infinity : it.x - prevEnd;
    line += (prevEnd !== null && gap > it.size * 0.22 ? ' ' : '') + it.str;
    prevEnd = it.x + it.w;
  }
  return line.replace(/\s+/g, ' ').trim();
};

const startsLower = (s) => /^[a-zà-ù(\[]/.test(s);

// Tabella "alimento base | sostituto" -> blocchi di testo (uno per riga di tabella) + intervallo verticale occupato
export const readTable = (pg) => {
  const header = pg.rows.find((r) => /alimento\s*base/i.test(joinItems(r.items)) && /so?s?titut/i.test(joinItems(r.items)));
  if (!header) return null;
  // bordi: raggruppa i segmenti per altezza
  const wide = pg.segments.filter((s) => s.w >= 150); // i bordi della tabella (non le sottolineature del testo)
  const ys = [];
  for (const s of wide) if (!ys.some((y) => Math.abs(y - s.y) < 2.5)) ys.push(s.y);
  ys.sort((a, b) => a - b);
  const hi = ys.findIndex((y, i) => y <= header.y && (ys[i + 1] ?? Infinity) > header.y);
  if (hi < 0) return null;
  const bounds = [ys[hi + 1]];
  for (let i = hi + 2; i < ys.length && ys[i] - ys[i - 1] < 320; i++) bounds.push(ys[i]);
  if (bounds.length < 2) return null;
  // colonna destra: dove inizia il secondo segmento dello stesso bordo
  const starts = [...new Set(wide.filter((s) => Math.abs(s.y - ys[hi + 1]) < 2.5).map((s) => Math.round(s.x)))].sort((a, b) => a - b);
  let xr = starts.find((x) => x > starts[0] + 100) ?? null;
  if (xr === null) {
    const right = header.items.find((it) => /so?s?titut/i.test(it.str));
    xr = right ? right.x - 4 : pg.width / 2;
  }
  const groups = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const top = bounds[i];
    const bottom = bounds[i + 1];
    const inRow = pg.rows.filter((r) => r.y > top - 1 && r.y <= bottom + 0.5);
    const left = [];
    const right = [];
    for (const r of inRow) {
      const l = r.items.filter((it) => it.x + it.w / 2 < xr);
      const rr = r.items.filter((it) => it.x + it.w / 2 >= xr);
      if (l.length) left.push(joinItems(l));
      if (rr.length) right.push(joinItems(rr));
    }
    // righe spezzate dall'a capo dentro la cella: si riuniscono
    const merge = (lines) => lines.reduce((acc, l) => { if (acc.length && startsLower(l) && !/^\d/.test(l)) acc[acc.length - 1] += ` ${l}`; else acc.push(l); return acc; }, []);
    const base = merge(left).join(' ').trim();
    const subs = merge(right);
    groups.push({ base, subs });
  }
  return { top: bounds[0] - 14, bottom: bounds[bounds.length - 1] + 2, groups };
};

// Una riga di tabella diventa un gruppo di alternative (testo, una per riga)
const tableGroupText = ({ base, subs }) => {
  if (subs.length && /^quantit[aà] a piacere/i.test(subs[0])) return /verdur/i.test(base) ? 'verdure' : '';
  if (!subs.length) return /\d/.test(base) ? base : '';
  const lines = subs.filter((l) => !/^\(?ipoteticamente/i.test(l));
  return (/\d/.test(base) ? [base, ...lines] : lines).join('\n');
};

const HEAD = /^(colazione|spuntino|merenda|pranzo\s*(?:\/|e)\s*cena|pranzo|cena)\s*:?\s*$/i;
const SEP = /^(accompagnat\w+ da|ed in aggiunta|in aggiunta|inoltre)\b[^.]{0,30}:?$/i;
const POOL = /^fino a\s+\d+\s+volte\s+(a|alla)\s+settimana/i;
const START = /^(oppure\b|\d|(un|una|uno|due|tre)\s+[a-zà-ù]|fino a\s+\d)/;
const BULLET = /^[•·*-]\s*\S/;
const STOP = /^(esempi?|alcuni esempi|ti lascio)\b/i;
const upperHeading = (s) => s.length >= 6 && s.length < 45 && s === s.toUpperCase() && /[A-ZÀ-Ý]{4}/.test(s) && !/\d/.test(s);

const slotsOf = (heading, counter) => {
  const w = heading.toLowerCase().replace(/[:\s]/g, '');
  if (/^pranzo(\/|e)cena$/.test(w)) return ['Pranzo', 'Cena'];
  if (w === 'colazione') return ['Colazione'];
  if (w === 'pranzo') return ['Pranzo'];
  if (w === 'cena') return ['Cena'];
  if (w === 'merenda') return ['Spuntino 2'];
  counter.n += 1;
  return [counter.n > 1 ? 'Spuntino 2' : 'Spuntino 1'];
};

// Dalle pagine (testo + tabelle) al testo di ogni pasto, nel formato che l'app capisce
export const planFromPages = (pages) => {
  // intestazioni e piè di pagina: righe di testo che si ripetono su molte pagine
  const freq = new Map();
  pages.forEach((pg) => new Set(pg.rows.map((r) => joinItems(r.items))).forEach((t) => freq.set(t, (freq.get(t) || 0) + 1)));
  const limit = Math.max(3, Math.ceil(pages.length / 2));
  const repeated = (t) => (freq.get(t) || 0) >= limit && !HEAD.test(t);

  const entries = []; // { kind: 'head' | 'line' | 'table', text }
  for (const pg of pages) {
    const texts = pg.rows.map((r) => joinItems(r.items));
    // pagina con l'esempio di menu settimanale (tabella dei giorni): non è il piano
    if (texts.some((t) => /luned[iì]/i.test(t)) && texts.some((t) => /marted[iì]/i.test(t))) continue;
    const table = readTable(pg);
    let tableDone = false;
    for (const r of pg.rows) {
      const text = joinItems(r.items);
      if (table && r.y >= table.top && r.y <= table.bottom) {
        if (!tableDone) { entries.push({ kind: 'table', text: table.groups.map(tableGroupText).filter(Boolean).join('\n\n') }); tableDone = true; }
        continue;
      }
      if (!text || repeated(text)) continue;
      entries.push({ kind: HEAD.test(text) && text.length < 24 ? 'head' : 'line', text });
    }
  }

  const slots = {};
  const counter = { n: 0 };
  let cur = null;
  let buffer = [];
  const flush = () => { if (cur) for (const s of cur) slots[s] = (slots[s] || []).concat(buffer); buffer = []; };
  for (const e of entries) {
    if (e.kind === 'head') { flush(); cur = slotsOf(e.text, counter); continue; }
    if (e.kind === 'line' && cur && upperHeading(e.text)) { flush(); cur = null; continue; } // altra sezione (es. "AVANZI/PIATTI VELOCI")
    if (cur) buffer.push(e);
  }
  flush();

  const text = {};
  for (const [slot, ls] of Object.entries(slots)) {
    const t = canonicalSlot(ls);
    if (t) text[slot] = t;
  }
  // un solo titolo "spuntino" vale per metà mattina e metà pomeriggio
  if (text['Spuntino 1'] && !text['Spuntino 2'] && counter.n === 1) text['Spuntino 2'] = text['Spuntino 1'];
  return text;
};

// Righe di un pasto -> testo (alternative per riga, riga vuota tra i gruppi)
const canonicalSlot = (entries) => {
  const out = [];
  let last = null;
  let stopped = false;
  let sawVeg = false;
  for (const e of entries) {
    if (e.kind === 'table') { out.push({ type: 'sep' }, { type: 'table', text: e.text }, { type: 'sep' }); last = null; continue; }
    if (stopped) continue;
    const t = e.text.trim();
    if (!t || /^[•·*-]$/.test(t)) continue;
    const s = t.replace(/^[•·*-]\s*/, '');
    if (STOP.test(s)) { stopped = true; continue; }
    if (SEP.test(s)) { out.push({ type: 'sep' }); last = out.at(-1); continue; }
    if (POOL.test(s)) { out.push({ type: 'pool', text: s.replace(/[:,].*$/, ':') }); last = out.at(-1); continue; }
    if (START.test(s) || BULLET.test(t)) { out.push({ type: 'opt', text: s.replace(/^oppure\s+/i, '') }); last = out.at(-1); continue; }
    if (last?.type === 'opt' && startsLower(s)) { last.text += ` ${s}`; continue; }
    out.push({ type: 'prose', text: s }); last = out.at(-1);
    if (/verdur/i.test(s)) sawVeg = true;
  }
  const text = out.map((o) => (o.type === 'sep' ? '' : o.type === 'prose' ? null : o.text)).filter((x) => x !== null).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  const hasVeg = /(^|\n)verdure\s*($|\n)/.test(text);
  // il piano dice che le verdure non devono mai mancare: diventano un gruppo a sé
  return sawVeg && text && !hasVeg ? `${text}\n\nverdure` : text;
};

export const readPlanPdf = async (pdfjs, data) => planFromPages(await readPdfPages(pdfjs, data));

// Per l'anteprima: quanti gruppi e alternative ha capito
