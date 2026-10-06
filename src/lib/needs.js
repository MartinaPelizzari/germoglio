// Fabbisogni di un adulto sano: energia, proteine, fibra e nutrienti da tenere d'occhio.
// Formule e soglie vengono da docs/fabbisogni.md (LARN V revisione, Mifflin-St Jeor, Compendium of Physical Activities,
// linea guida Academy of Nutrition and Dietetics). Le parti marcate "proposta" in quel documento sono scelte di progetto
// da far validare a un dietista o a un medico prima di un uso più ampio. I valori sono stime, non prescrizioni.

export const bmi = (b) => (b?.weight && b?.height ? b.weight / (b.height / 100) ** 2 : null);

// Metabolismo basale: equazioni di Schofield come riprodotte dalle tabelle LARN V (docs/fabbisogni.md, 1.2, versione B)
export const bmr = ({ sex, age, weight }) => {
  const band = age < 30 ? 0 : age < 60 ? 1 : 2;
  const F = [[14.82, 486.6], [8.13, 845.6], [9.08, 658.8]];
  const M = [[15.06, 692.2], [11.47, 873.1], [11.71, 587.7]];
  const [a, c] = (sex === 'M' ? M : F)[band];
  return a * weight + c;
};
// Alternativa per confronto
export const bmrMifflin = ({ sex, age, weight, height }) => 10 * weight + 6.25 * height - 5 * age + (sex === 'M' ? 5 : -161);

// Livello di attività della giornata (PAL) dal lavoro; gli allenamenti si aggiungono a parte (proposta del documento, 2.1 e 2.2)
export const PAL = { sedentary: 1.4, light: 1.6, active: 1.8 };
// MET medi dal Compendium 2024: camminata/yoga ~3,8; corsa lenta, bici, palestra ~6; sport intensi ~9
export const MET = { light: 3.8, moderate: 6, intense: 9 };

// kcal medie al giorno degli allenamenti: (MET - 1) x peso x ore, distribuite sui 7 giorni
export const workoutKcal = (b) => {
  if (!b.workouts || !b.minutes) return 0;
  return ((MET[b.intensity] || MET.moderate) - 1) * b.weight * (b.minutes / 60) * b.workouts / 7;
};

const round10 = (x) => Math.round(x / 10) * 10;

// Perché l'app non propone un piano in automatico (sezione 6 del documento)
export const blockReason = (b = {}) => {
  const bm = bmi(b);
  if (b.age < 18) return { id: 'minor', text: 'Per chi ha meno di 18 anni il fabbisogno dipende dalla crescita: un piano calorico va deciso con il pediatra o con un dietista.' };
  if (b.pregnant) return { id: 'pregnant', text: 'In gravidanza e allattamento i fabbisogni cambiano: parlane con ostetrica, ginecologo o dietista prima di seguire un piano.' };
  if (b.condition) return { id: 'condition', text: 'Con patologie o terapie in corso il piano alimentare va deciso da un medico o da un dietista: qui non posso proporlo in automatico.' };
  if (bm !== null && bm < 18.5) return { id: 'underweight', text: 'Con questo peso e questa altezza l\'indice di massa corporea è sotto 18,5: meglio sentire un medico prima di un piano.' };
  return null;
};

// Calcolo completo. Restituisce { blocked } oppure { kcal, ... }
export const computeNeeds = (b = {}) => {
  const block = blockReason(b);
  if (block) return { blocked: block };
  const base = bmr(b);
  const pal = PAL[b.work] || PAL.sedentary;
  const tdee = base * pal + workoutKcal(b);
  let goal = b.goal || 'maintain';
  const notes = [];
  // con una storia di disturbi alimentari: nessun obiettivo di peso e niente numeri a vista
  const hideNumbers = !!b.edHistory;
  if (hideNumbers) { goal = 'maintain'; notes.push('Ho impostato il mantenimento e non ti mostro le calorie. Se il rapporto con il cibo è difficile, parlane con un professionista.'); }
  if (goal === 'lose' && b.age >= 75) { goal = 'maintain'; notes.push('Dai 75 anni non propongo diete dimagranti: serve una valutazione medica.'); }
  let target = tdee;
  if (goal === 'lose') {
    const deficit = Math.min(500, tdee * 0.15);
    const floor = Math.max(b.sex === 'M' ? 1500 : 1200, base);
    target = Math.max(tdee - deficit, floor);
    if (target > tdee - 50) notes.push('Il tuo fabbisogno è già vicino al minimo di sicurezza: tengo l\'apporto di mantenimento.');
    if (target < tdee) notes.push(`Deficit prudente di circa ${round10(tdee - target)} kcal al giorno (non oltre 0,5% del peso a settimana).`);
  } else if (goal === 'gain') {
    target = tdee * 1.075;
    notes.push(`Aumento graduale: circa ${round10(target - tdee)} kcal in più al giorno.`);
  }
  target = round10(target);
  const trainer = (b.workouts || 0) >= 3;
  const gPerKg = b.age >= 65 ? 1.1 : (b.workouts || 0) >= 5 ? 1.5 : trainer ? 1.3 : 0.9;
  const protein = Math.round(Math.min(gPerKg * b.weight, (target * 0.2) / 4));
  const fiber = Math.max(25, Math.round((target / 1000) * 14));
  const bmiV = bmi(b);
  const vegan = b.diet === 'vegan';
  const watch = vegan ? ['vitamina B12', 'ferro', 'calcio', 'zinco', 'iodio', 'vitamina D', 'omega-3'] : b.diet === 'vegetarian' ? ['vitamina B12', 'ferro', 'zinco', 'iodio', 'omega-3'] : [];
  if (bmiV >= 30 && goal === 'lose') notes.push('Con questo indice di massa corporea conviene farsi seguire da un professionista.');
  return {
    blocked: null, hideNumbers, goal,
    bmr: round10(base), pal, workout: round10(workoutKcal(b)), tdee: round10(tdee), kcal: target,
    protein, fiber, carbsPct: [45, 60], fatPct: [20, 35], bmi: bmiV ? Math.round(bmiV * 10) / 10 : null,
    watch, notes,
  };
};
