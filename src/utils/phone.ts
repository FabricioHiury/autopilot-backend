export function normalizePhone(raw: string): string {
  let number = raw.replace(/\D+/g, '');
  
  if (!number.startsWith('55')) {
    number = '55' + number;
  }
  
  if (number.startsWith('55') && number.length >= 12) {
    const ddd = number.substring(2, 4);
    const dddNum = parseInt(ddd);
    
    if (dddNum >= 11 && dddNum <= 99) {
      const restante = number.substring(4);
      
      if (restante.length === 9 && restante.startsWith('9')) {
        number = '55' + ddd + restante.substring(1);
      }
      else if (restante.length === 10 && restante.startsWith('9')) {
        number = '55' + ddd + restante.substring(1);
      }
      else if (restante.length === 8) {
        number = '55' + ddd + '9' + restante;
      }
      else if (restante.length === 9 && !restante.startsWith('9')) {
        number = '55' + ddd + '9' + restante;
      }
    }
  }
  
  return number;
}
