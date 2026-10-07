// Glue the last two words together with a non-breaking space so a wrapped line never ends with a
// lone word ("...reset the\ntimer?"). Works the same on iOS and Android.
export function noOrphan(text: string): string {
  const i = text.lastIndexOf(' ');
  return i > 0 ? `${text.slice(0, i)} ${text.slice(i + 1)}` : text;
}
