export function isSameMonth(dateIso: string, ref = new Date()): boolean {
  const d = new Date(dateIso + "T00:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function inRange(dateIso: string, start?: string, end?: string): boolean {
  if (start && dateIso < start) return false;
  if (end && dateIso > end) return false;
  return true;
}

export function daysUntil(dateIso: string): number {
  const due = new Date(dateIso + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / (1000 * 60 * 60 * 24));
}
