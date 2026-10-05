export const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export const startOfWeek = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export const addWeeks = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
};

// Settimana ISO, es. 2026-W41
export const getWeekId = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const weekRangeLabel = (date) => {
  const mon = startOfWeek(date);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return `${f(mon)} - ${f(sun)}`;
};

export const dayNumber = (date, index) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + index);
  return d.getDate();
};

export const todayIndex = () => (new Date().getDay() + 6) % 7;
