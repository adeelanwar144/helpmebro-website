/** International format without +, spaces, or dashes (for wa.me links). */
export const WHATSAPP_NUMBER = '923026062955';

export function whatsAppLink(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}

export function whatsAppUrl(message: string): string {
  return `${whatsAppLink()}?text=${encodeURIComponent(message)}`;
}
