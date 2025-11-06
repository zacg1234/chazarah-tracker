export function msToMinutes(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  return `${minutes} min.`;
}

export function to12HourTime(datetime: string): string {
    //console.log('to12HourTime input datetime:', datetime);
  // Accepts ISO string, displays local time in 12-hour format
  const date = new Date(datetime);
  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
    //console.log('Date object output:', `${hour}:${minute} ${ampm}`);
  return `${hour}:${minute} ${ampm}`;
}