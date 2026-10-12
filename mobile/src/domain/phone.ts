export function normalizePhone(phone: string): string {
  let digits = phone.trim().replace(/\D/g, '');

  if (digits.startsWith('62')) {
    digits = `0${digits.slice(2)}`;
  } else if (digits !== '' && !digits.startsWith('0')) {
    digits = `0${digits}`;
  }

  return digits;
}
