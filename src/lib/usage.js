// Storico: quanto tempo fa è stato pianificato ogni piatto.

// 2026-W41 -> lunedì di quella settimana
export const weekIdToMonday = (weekId) => {
  const [y, w] = weekId.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (w - 1) * 7);
  return monday;
};

export const weeksBetween = (fromWeekId, toWeekId) => Math.round((weekIdToMonday(toWeekId) - weekIdToMonday(fromWeekId)) / (7 * 86400000));

// recipeId -> settimane trascorse dall'ultima volta, guardando solo le settimane precedenti a targetWeekId
export const buildRecency = (plans, targetWeekId) => {
  const map = new Map();
  for (const p of plans) {
    if (p.id >= targetWeekId) continue;
    const ago = weeksBetween(p.id, targetWeekId);
    for (const slots of Object.values(p.days || {})) {
      for (const data of Object.values(slots || {})) {
        for (const item of data?.items || []) {
          if (item.leftoverOf || !item.recipeId) continue;
          if (!map.has(item.recipeId) || map.get(item.recipeId) > ago) map.set(item.recipeId, ago);
        }
      }
    }
  }
  return map;
};

// Penalità di punteggio in base a quanto è recente: i piatti fatti da poco vengono evitati
export const recencyPenalty = (weeksAgo) => (weeksAgo === undefined ? 0 : weeksAgo <= 1 ? 14 : weeksAgo === 2 ? 8 : weeksAgo === 3 ? 4 : weeksAgo <= 5 ? 1.5 : 0);

export const agoLabel = (weeks) => (weeks === undefined ? '' : weeks <= 0 ? 'questa settimana' : weeks === 1 ? 'la settimana scorsa' : `${weeks} settimane fa`);
