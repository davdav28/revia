/**
 * Décompte des SMS en SEGMENTS (critique pour la marge et le quota).
 *  - GSM-7 (latin + accents FR) : 160 caractères = 1 segment ; au-delà 153/segment.
 *  - UCS-2 (emoji / caractères spéciaux) : 70 = 1 segment ; au-delà 67/segment.
 * 1 segment = 1 unité de quota. Un emoji fait basculer tout le message en UCS-2.
 */

// Alphabet GSM-7 par défaut (les caractères « simples »).
const GSM7_BASIC =
  "@£$¥èéùìòÇç\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
// Caractères de l'extension GSM-7 : valides, mais comptent pour 2 unités.
const GSM7_EXTENDED = "^{}\\[~]|€";

function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) return false;
  }
  return true;
}

function gsm7Length(text: string): number {
  let len = 0;
  for (const ch of text) len += GSM7_EXTENDED.includes(ch) ? 2 : 1;
  return len;
}

/** Nombre de segments SMS d'un message (0 si vide). */
export function countSegments(message: string): number {
  if (!message) return 0;

  if (isGsm7(message)) {
    const len = gsm7Length(message);
    return len <= 160 ? 1 : Math.ceil(len / 153);
  }
  // UCS-2 : on compte les unités de code UTF-16 (un emoji = 2 unités).
  const len = message.length;
  return len <= 70 ? 1 : Math.ceil(len / 67);
}

/** Libellé pour l'aperçu : « 1 SMS », « 2 SMS »… */
export function segmentsLabel(message: string): string {
  const n = countSegments(message);
  return `${n} SMS`;
}
