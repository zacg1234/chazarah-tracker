const pad = (n: number) => n.toString().padStart(2, '0');

// Parse 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss' as LOCAL time.
// (new Date('YYYY-MM-DD') would be read as UTC, which shifts the day for users west of UTC.)
// Anything else (e.g. strings with a timezone offset) falls back to the native parser.
export function parseLocal(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(value.trim());
  if (!m) return new Date(value);
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 0);
  return d;
}

// Format a Date as local "YYYY-MM-DD"
export function toDateString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Format a Date as local "YYYY-MM-DD HH:mm:ss" (the format stored in the database)
export function toLocalTimestamp(d: Date) {
  return `${toDateString(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Display a timestamp string (YYYY-MM-DD HH:mm:ss) as local time (no conversion)
export function displayLocalTimestamp(ts: string) {
  // Example: "2025-11-06 14:30:00" => "11/06/2025 14:30"
  if (!ts) return '';
  const [datePart, timePart] = ts.split(/[ T]/);
  if (!datePart || !timePart) return ts;
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year} ${timePart.slice(0,5)}`;
}

export function formatDateMDY(dateString: string) {
  const date = parseLocal(dateString);
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}
