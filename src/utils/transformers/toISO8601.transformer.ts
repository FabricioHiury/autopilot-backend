import { Transform } from 'class-transformer';

export function ToISO8601() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }

      const isoString = date.toISOString();
      return isoString;
    } catch {
      return value;
    }
  });
}
