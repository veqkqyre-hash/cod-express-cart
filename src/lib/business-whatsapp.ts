/** Public business WhatsApp number, without + or spaces (Kosovo). */
export const BUSINESS_WHATSAPP = "38348146886";

export function whatsappLink(message: string) {
  return `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
