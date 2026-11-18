// Normalises Arabic text so searches match regardless of hamza, taa marbuta, alef maqsura or tashkeel.
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)] ?? d);
}

export function formatFare(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${toArabicDigits(rounded.toLocaleString("en-US", { maximumFractionDigits: 2 }))} ج.م`;
}
