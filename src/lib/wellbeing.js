// Check-in settimanale e segnalazioni ("mi sento sempre stanco"): cosa chiedere, quando fermarsi e consigliare il medico,
// quali ritocchi prudenti fare al piano creato dall'app. Basato su docs/benessere.md (NHS, CREA, LARN, ISS e Ministero).
// Le parti marcate PROPOSTA in quel documento sono scelte di progetto: vanno validate da un medico o da un dietista.
// L'app non diagnostica e non modifica mai il piano di una nutrizionista.

export const DAY = 24 * 3600 * 1000;
export const CHECKIN_EVERY_DAYS = 7; // una domanda breve a settimana
export const MIN_DAYS_BETWEEN_ADJUSTMENTS = 14; // non si cambia il piano due volte in meno di due settimane

export const CHECKIN_QUESTIONS = [
  { id: 'energy', label: 'Come ti senti di energia?', symptom: 'stanchezza' },
  { id: 'digestion', label: 'Come hai digerito?', symptom: 'gonfiore' },
  { id: 'sleep', label: 'Come hai dormito?', symptom: 'sonno' },
  { id: 'hunger', label: 'Com\'è andata con fame e sazietà?', symptom: 'fame' },
];
export const CHECKIN_ANSWERS = [{ id: 'good', label: 'Bene' }, { id: 'so-so', label: 'Così così' }, { id: 'bad', label: 'Non bene' }];

const daysSince = (iso, now) => (iso ? (now - new Date(iso).getTime()) / DAY : Infinity);

// Quando proporre il check-in: ogni 7 giorni, non nei primi 7 giorni del profilo, mai se disattivato
export const checkinDue = (member, now = Date.now()) => {
  if (!member || member.checkinOff || !member.planSource) return false;
  if (daysSince(member.createdAt, now) < CHECKIN_EVERY_DAYS) return false;
  if (member.checkinSnooze && now < new Date(member.checkinSnooze).getTime()) return false;
  return daysSince(member.lastCheckin, now) >= CHECKIN_EVERY_DAYS;
};
// Dopo un ritocco al piano, dopo 14-35 giorni si chiede com'è andata
export const followUpDue = (member, now = Date.now()) => {
  const d = daysSince(member?.lastAdjust, now);
  return !!member?.lastAdjust && d >= MIN_DAYS_BETWEEN_ADJUSTMENTS && d <= 35 && member.followUpDone !== member.lastAdjust;
};

// Segnali che richiedono di sentire un medico, senza ritocchi alla dieta (docs/benessere.md, sezione 3)
export const RED_FLAGS = [
  { id: 'chest', level: 'emergency', text: 'Dolore o oppressione al petto, o fiato corto improvviso' },
  { id: 'faint', level: 'emergency', text: 'Svenimenti o perdita di coscienza' },
  { id: 'confusion', level: 'emergency', text: 'Confusione, difficoltà a parlare, perdita della vista o forte mal di testa improvviso' },
  { id: 'blood', level: 'emergency', text: 'Sangue nel vomito o nelle feci, feci nere' },
  { id: 'selfharm', level: 'emergency', text: 'Pensieri di farmi del male' },
  { id: 'thirst', level: 'urgent', text: 'Sete continua con urine molto frequenti e grande stanchezza' },
  { id: 'weight', level: 'doctor', text: 'Ho perso peso senza volerlo' },
  { id: 'lumps', level: 'doctor', text: 'Formicolii, lingua dolente, debolezza muscolare, problemi di memoria' },
  { id: 'pain', level: 'doctor', text: 'Dolore addominale forte o vomito che torna' },
  { id: 'ed', level: 'support', text: 'Salto i pasti o mangio pochissimo per paura di ingrassare, o penso al cibo e al peso quasi di continuo' },
  { id: 'cycle', level: 'doctor', text: 'Il ciclo mestruale è irregolare o è sparito' },
];

// kind: ritocco possibile; weeks: da quante settimane il sintomo è un motivo per sentire il medico
export const SYMPTOMS = [
  { id: 'stanchezza', label: 'Mi sento sempre stanco', adjust: ['energy', 'iron'], weeks: 3, tips: [
    'Dormi abbastanza e prova a distribuire i pasti nell\'arco della giornata, senza saltarne.',
    'Bevi con regolarità: anche una lieve disidratazione stanca.',
    'Verifica che il piano non sia troppo leggero per quanto ti muovi.'] },
  { id: 'fame', label: 'Ho sempre fame', adjust: ['energy'], weeks: 4, tips: [
    'Legumi, verdura e cereali integrali nei pasti aiutano a sentirsi sazi più a lungo.',
    'Uno spuntino pianificato è previsto dalle linee guida: non è uno sgarro.',
    'Mangia con calma e senza schermi, se riesci.'] },
  { id: 'pesantezza', label: 'Mi sento pesante dopo i pasti', adjust: [], weeks: 4, tips: [
    'Prova porzioni un po\' più piccole e più frequenti, e una cena più leggera.',
    'Se hai aumentato di colpo la fibra, scegli per qualche giorno frutta e verdura meno ricche di fibra, senza toglierle.'] },
  { id: 'gonfiore', label: 'Sono gonfio', adjust: [], weeks: 3, tips: [
    'Introduci la fibra gradualmente e bevi acqua nel corso della giornata.',
    'Riduci per un po\' bevande gassate, alcol e cibi molto piccanti.',
    'Non togliere glutine o latticini per conto tuo: se il gonfiore persiste, parlane con il medico.'] },
  { id: 'stitichezza', label: 'Sono stitico', adjust: [], weeks: 3, tips: [
    'Aumenta la fibra con calma (frutta, cereali integrali, semi di lino) e bevi di più: insieme funzionano meglio.',
    'Muoviti ogni giorno, anche solo camminando.',
    'Non servono lassativi dall\'app: se serve, chiedi al farmacista o al medico.'] },
  { id: 'diarrea', label: 'Ho la diarrea', adjust: [], weeks: 1, tips: [
    'Bevi a piccoli sorsi e mangia cibi semplici quando hai fame; evita per qualche giorno grassi e piccante.',
    'Di solito passa in 5-7 giorni: oltre una settimana senti il medico.'] },
  { id: 'reflusso', label: 'Ho bruciore o reflusso', adjust: [], weeks: 3, tips: [
    'Porzioni più piccole, cena distante dal momento di andare a letto.',
    'Caffè, pomodoro, cioccolato, alcol, cibi grassi e piccanti possono peggiorarlo: prova a ridurli per qualche giorno.'] },
  { id: 'testa', label: 'Ho mal di testa', adjust: [], weeks: 2, tips: [
    'Non saltare i pasti e bevi con regolarità.',
    'Se torna spesso o non passa, parlane con il medico: non propongo farmaci.'] },
  { id: 'sonno', label: 'Dormo male', adjust: [], weeks: 3, tips: [
    'Evita tè, caffè e alcol nelle 6 ore prima di dormire e i pasti abbondanti la sera.',
    'Orari regolari aiutano più di qualsiasi alimento.'] },
  { id: 'concentrazione', label: 'Faccio fatica a concentrarmi', adjust: ['energy'], weeks: 3, tips: [
    'Colazione e pranzo regolari, e acqua a portata di mano.',
    'Sonno e stress contano quanto il cibo.'] },
  { id: 'allenamento', label: 'Crampi o calo nelle prestazioni', adjust: ['energy'], weeks: 3, tips: [
    'Mangia carboidrati prima e dopo l\'allenamento e bevi di più quando ti alleni.',
    'Se ti alleni molto o per gare, un dietista dello sport costruisce un piano su misura.'] },
  { id: 'vertigini', label: 'Ho capogiri', adjust: [], weeks: 1, tips: [
    'Bevi con regolarità, non saltare i pasti e alzati lentamente.',
    'Se tornano spesso o durano, senti il medico.'] },
  { id: 'freddo', label: 'Ho sempre freddo', adjust: ['energy'], weeks: 3, tips: [
    'Controlla che il piano non sia troppo leggero.',
    'Se il freddo resta con stanchezza, pelle secca o capelli diradati, parlane con il medico: può essere la tiroide.'] },
  { id: 'umore', label: 'Ho l\'umore basso', adjust: [], weeks: 2, always: true, tips: [
    'Pasti regolari possono aiutare, ma un umore basso che dura merita attenzione: parlane con il medico o con uno psicologo.'] },
  { id: 'capelli', label: 'Mi cadono i capelli o ho le unghie fragili', adjust: ['iron'], weeks: 4, tips: [
    'Capelli e unghie reagiscono con tempi lunghi: non cambio nulla prima di 4 settimane.',
    'Se la caduta è forte o si accompagna a stanchezza o freddo, parlane con il medico.'] },
  { id: 'sete', label: 'Ho molta sete', adjust: [], weeks: 1, tips: [
    'Bevi regolarmente a piccoli sorsi durante la giornata (in media 1,5-2 litri, di più se ti alleni o fa caldo).',
    'Le urine dovrebbero essere chiare.'] },
];

export const ADJUSTMENTS = {
  energy: { label: 'Aumento un po\' l\'energia del piano', detail: 'Più carboidrati e porzioni leggermente più grandi nei pasti principali.' },
  iron: { label: 'Metto più legumi nei pasti', detail: 'Più fonti di ferro. Abbinale a frutta o verdura con vitamina C e riduci tè e caffè durante i pasti.' },
};

const nextEnergyStep = (member) => {
  const cur = member.tweaks?.kcalPct || 0;
  return cur >= 10 ? 0 : cur >= 5 ? 10 : 5;
};

// Valutazione di una segnalazione. flags: id di RED_FLAGS; weeks: da quante settimane; ritorna il messaggio e l'eventuale ritocco
export const assess = (member, symptomId, flags = [], weeks = 0, now = Date.now()) => {
  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
  const hit = RED_FLAGS.filter((f) => flags.includes(f.id));
  const worst = ['emergency', 'urgent', 'support', 'doctor'].find((l) => hit.some((f) => f.level === l));
  const base = { symptom, tips: symptom?.tips || [], adjustment: null };
  if (worst === 'emergency') return { ...base, level: 'emergency', tips: [], message: 'Quello che descrivi va valutato subito: chiama il 112 (numero unico di emergenza) o vai al pronto soccorso. Non faccio nessuna modifica alla dieta.' };
  if (worst === 'urgent') return { ...base, level: 'urgent', tips: [], message: 'Questi sintomi insieme vanno controllati in fretta: contatta oggi il tuo medico o la guardia medica. Non faccio modifiche alla dieta.' };
  if (worst === 'support') return { ...base, level: 'support', tips: [], message: 'Grazie per averlo detto. Quello che racconti merita di essere ascoltato da un professionista: parlane con il tuo medico o con un servizio per i disturbi alimentari. Non ti propongo cambi alla dieta né numeri, e se vuoi puoi togliere il piano in Impostazioni.' };
  if (worst === 'doctor' || symptom?.always || weeks >= (symptom?.weeks ?? 3)) {
    return { ...base, level: 'doctor', message: 'Per come lo descrivi conviene parlarne con il tuo medico: ti sa dire se serve un controllo (per esempio gli esami del sangue). Intanto non cambio il piano.' };
  }
  const info = { ...base, level: 'ok', message: 'Nessun segnale di allarme tra quelli che ti ho chiesto. Qui sotto ci sono alcune cose da provare.' };
  if (member.planSource !== 'auto' || !member.autoPlan || !member.body) {
    if (member.planSource === 'auto') return { ...info, message: info.message + ' Non ho ancora creato il tuo piano: quando lo avrai potrò ritoccarlo se serve.' };
    return { ...info, message: info.message + (member.planSource === 'nutritionist' ? ' Hai un piano preparato da un professionista: non lo modifico. Se il disturbo continua, parlane con chi lo ha preparato; puoi copiare il riepilogo e mandarglielo.' : ' Il piano non è stato creato dall\'app, quindi non lo modifico. Se il disturbo continua, parlane con il tuo medico o con chi ti segue; puoi copiare il riepilogo.'), share: true };
  }
  const since = daysSince(member.lastAdjust, now);
  if (since < MIN_DAYS_BETWEEN_ADJUSTMENTS) {
    return { ...info, message: info.message + ` Ho modificato il piano da poco: aspettiamo ancora ${Math.ceil(MIN_DAYS_BETWEEN_ADJUSTMENTS - since)} giorni prima di cambiarlo di nuovo, così capiamo se ha funzionato.` };
  }
  for (const kind of symptom?.adjust || []) {
    if (kind === 'energy' && nextEnergyStep(member)) return { ...info, adjustment: { kind, step: nextEnergyStep(member) } };
    if (kind === 'iron' && (member.tweaks?.legumes || 0) < 1) return { ...info, adjustment: { kind, step: 1 } };
  }
  return info;
};

// Profilo con il ritocco applicato (poi si ricalcola il piano con autoPlanFor)
export const applyAdjustment = (member, adj, now = Date.now()) => {
  const tweaks = { ...(member.tweaks || {}) };
  if (adj.kind === 'energy') tweaks.kcalPct = adj.step;
  if (adj.kind === 'iron') tweaks.legumes = adj.step;
  return { ...member, tweaks, lastAdjust: new Date(now).toISOString() };
};

// Testo da inviare a chi ha preparato il piano
export const summaryText = (member, symptomId, flags, weeks, extra = '') => {
  const s = SYMPTOMS.find((x) => x.id === symptomId);
  const w = weeks ? `da circa ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'}` : 'da pochi giorni';
  return `Segnalazione del ${new Date().toLocaleDateString('it-IT')} di ${member.name || 'me'}: ${s?.label.toLowerCase() || 'altro'}, ${w}.${flags.length ? ` Altri segnali indicati: ${RED_FLAGS.filter((f) => flags.includes(f.id)).map((f) => f.text.toLowerCase()).join('; ')}.` : ''}${extra ? ` Note: ${extra}` : ''}`;
};
