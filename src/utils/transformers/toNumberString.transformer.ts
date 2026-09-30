import { Transform } from 'class-transformer';

export function ToNumberString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\D+/g, '');
    }
    return value;
  });
}
