
// Universal: Get current local time as "YYYY-MM-DD HH:mm:ss"
export function getCurrentLocalTimeString() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    now.getFullYear() +
    '-' + pad(now.getMonth() + 1) +
    '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) +
    ':' + pad(now.getMinutes()) +
    ':' + pad(now.getSeconds())
  );
}

// Universal: Display a timestamp string (YYYY-MM-DD HH:mm:ss) as local time (no conversion)
export function displayLocalTimestamp(ts: string) {
  // Just return as is, or format for display if needed
  // Example: "2025-11-06 14:30:00" => "11/06/2025 14:30"
  if (!ts) return '';
  const [datePart, timePart] = ts.split(/[ T]/);
  if (!datePart || !timePart) return ts;
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year} ${timePart.slice(0,5)}`;
}

export function formatDateMDY(dateString: string) {
  const date = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}