export const initials = (f, l) => ((f?.[0] || '') + (l?.[0] || '')).toUpperCase() || '?';

export const fmtDate = d => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export const fmtDateShort = d => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' }) : '';

export const fmtDateTime = d => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export const isOverdue = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date(new Date().toDateString());
};

export const isThisWeek = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
};

export const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
