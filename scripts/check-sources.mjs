// Controlla che le pagine citate come fonte delle ricette esistano (stato HTTP). Alcuni siti bloccano i controlli
// automatici (403): in quel caso il risultato è "non verificabile", non "rotto".
import fs from 'node:fs';
const dir = new URL('../src/data/recipes/', import.meta.url);
const items = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'))).filter((r) => r.source?.url);
const seen = new Map();
for (const r of items) if (!seen.has(r.source.url)) seen.set(r.source.url, r.title);
let bad = 0;
await Promise.all([...seen.entries()].map(async ([url, title]) => {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GermoglioCheck/1.0)' }, signal: AbortSignal.timeout(20000) });
    if (res.status === 404 || res.status === 410) { bad++; console.log('ROTTO', res.status, url, '←', title); }
    else if (res.status >= 400) console.log('non verificabile', res.status, url);
  } catch (e) { console.log('non raggiungibile', url, e.message); }
}));
console.log(`${seen.size} indirizzi controllati, ${bad} rotti.`);
process.exit(bad ? 1 : 0);
