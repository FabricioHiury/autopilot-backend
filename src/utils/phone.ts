export function normalizePhone(raw: string): string {
  let number = raw.replace(/\D+/g, '');

  if (!number.startsWith('55')) {
    number = '55' + number;
  }

  if (number.startsWith('55') && number.length >= 12) {
    const ddd = number.substring(2, 4);
    const dddNum = parseInt(ddd);

    if (dddNum >= 11 && dddNum <= 99) {
      const remaining = number.substring(4);

      if (remaining.length === 9 && remaining.startsWith('9')) {
        number = '55' + ddd + remaining.substring(1);
      } else if (remaining.length === 10 && remaining.startsWith('9')) {
        number = '55' + ddd + remaining.substring(1);
      } else if (remaining.length === 8) {
        number = '55' + ddd + '9' + remaining;
      } else if (remaining.length === 9 && !remaining.startsWith('9')) {
        number = '55' + ddd + '9' + remaining;
      }
    }
  }

  return number;
}
