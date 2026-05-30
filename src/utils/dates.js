export const todayISO = () => new Date().toISOString().split('T')[0];

export const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const fmtDateShort = (iso) => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export const isoToDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfWeek = (iso) => {
  const d = isoToDate(iso);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const startOfMonth = (iso) => iso.slice(0, 7) + '-01';

export const lastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

export const isSameDay = (a, b) => a?.slice(0, 10) === b?.slice(0, 10);

export const isSameWeek = (iso) => startOfWeek(iso) === startOfWeek(todayISO());

export const isSameMonth = (iso) => iso?.slice(0, 7) === todayISO().slice(0, 7);

export const daysBetween = (a, b) => {
  const da = isoToDate(a);
  const db = isoToDate(b);
  return Math.round((db - da) / 86400000);
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
