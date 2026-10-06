// Prova di check-in e segnalazioni: cadenza, segnali d'allarme, ritocchi al piano e rispetto del piano della nutrizionista
import fs from 'node:fs';
import { assess, applyAdjustment, checkinDue, followUpDue, DAY } from '../src/lib/wellbeing.js';
import { computeNeeds } from '../src/lib/needs.js';
import { buildAutoPlan } from '../src/lib/autoPlan.js';
import { setNutrition } from '../src/lib/nutrition.js';

const nd = new URL('../src/data/nutrition/', import.meta.url);
setNutrition(fs.readdirSync(nd).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, nd)))));
let ko = 0;
const check = (c, m) => { if (!c) { ko++; console.log('KO', m); } };
const body = { sex: 'F', age: 34, height: 165, weight: 60, work: 'sedentary', workouts: 0, goal: 'maintain' };
const now = Date.now();
const auto = { id: 'a', name: 'A', diet: 'omnivore', planSource: 'auto', autoPlan: true, body, createdAt: new Date(now - 30 * DAY).toISOString() };

// cadenza
check(checkinDue(auto, now), 'check-in dovuto dopo 30 giorni');
check(!checkinDue({ ...auto, lastCheckin: new Date(now - 3 * DAY).toISOString() }, now), 'non prima di 7 giorni');
check(checkinDue({ ...auto, lastCheckin: new Date(now - 8 * DAY).toISOString() }, now), 'dopo 8 giorni sì');
check(!checkinDue({ ...auto, createdAt: new Date(now - 2 * DAY).toISOString() }, now), 'non nei primi giorni');
check(!checkinDue({ ...auto, checkinOff: true }, now), 'disattivato');
check(!checkinDue({ ...auto, planSource: undefined }, now), 'senza scelta del piano non si chiede');
check(!checkinDue({ ...auto, checkinSnooze: new Date(now + 3 * DAY).toISOString() }, now), '"non ora" rispettato');

// segnali d'allarme: nessun ritocco
for (const [flag, level] of [['chest', 'emergency'], ['faint', 'emergency'], ['thirst', 'urgent'], ['ed', 'support'], ['weight', 'doctor']]) {
  const r = assess(auto, 'stanchezza', [flag], 0, now);
  check(r.level === level && !r.adjustment, `${flag} → ${level} senza ritocchi (${r.level})`);
}
check(assess(auto, 'stanchezza', [], 4, now).level === 'doctor', 'stanchezza da oltre 3 settimane → medico');
check(assess(auto, 'umore', [], 0, now).level === 'doctor', 'umore basso → sempre medico');
check(!assess(auto, 'umore', [], 0, now).adjustment, 'umore: nessun ritocco');

// ritocco prudente e un cambio alla volta
const r1 = assess(auto, 'stanchezza', [], 0, now);
check(r1.level === 'ok' && r1.adjustment?.kind === 'energy' && r1.adjustment.step === 5, 'primo ritocco: energia +5%');
const adj1 = applyAdjustment(auto, r1.adjustment, now);
check(adj1.tweaks.kcalPct === 5, 'tweak applicato');
const r2 = assess(adj1, 'stanchezza', [], 0, now + 5 * DAY);
check(!r2.adjustment && /aspettiamo/.test(r2.message), 'non si cambia due volte in meno di 14 giorni');
const r3 = assess(adj1, 'stanchezza', [], 0, now + 15 * DAY);
check(r3.adjustment?.kind === 'energy' && r3.adjustment.step === 10, 'secondo ritocco: +10% al massimo');
const adj2 = applyAdjustment(adj1, r3.adjustment, now + 15 * DAY);
const r4 = assess(adj2, 'stanchezza', [], 0, now + 30 * DAY);
check(r4.adjustment?.kind === 'iron', 'poi più fonti di ferro, non altra energia');
check(followUpDue(adj1, now + 15 * DAY) && !followUpDue(adj1, now + 5 * DAY), 'com\'è andata dopo 14 giorni');

// il piano cresce davvero col ritocco
const n = computeNeeds({ ...body });
const p0 = buildAutoPlan({ diet: 'omnivore', kcal: n.kcal, protein: n.protein });
const p10 = buildAutoPlan({ diet: 'omnivore', kcal: n.kcal, protein: n.protein, tweaks: { kcalPct: 10 } });
check(p10.estKcal > p0.estKcal + 100, `piano +10% (${p0.estKcal} → ${p10.estKcal})`);
const pi = buildAutoPlan({ diet: 'vegetarian', kcal: n.kcal, protein: n.protein, tweaks: { legumes: 1 } });
check(/legumi cotti/.test(pi.texts.Cena), 'legumi presenti');

// piano della nutrizionista: mai modificato
const nutri = { ...auto, planSource: 'nutritionist', autoPlan: false };
const rn = assess(nutri, 'stanchezza', [], 0, now);
check(rn.level === 'ok' && !rn.adjustment && rn.share, 'nutrizionista: nessun ritocco, riepilogo da condividere');
console.log(ko ? `${ko} problemi` : 'Tutto ok.');
process.exit(ko ? 1 : 0);
