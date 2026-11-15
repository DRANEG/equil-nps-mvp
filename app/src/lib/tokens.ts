import { randomBytes } from "crypto";

// Alfabet fara caractere confundabile (0/O, 1/l/I) — tokenul ajunge pe coduri QR tiparite.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function publicToken(length = 8) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** Slug unic pentru firma: numele + sufix aleatoriu scurt. */
export function companySlug(name: string) {
  return `${slugify(name) || "firma"}-${publicToken(4)}`;
}
