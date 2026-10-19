export type SearchableCode = { code: string; day_number: number; prize: string | null };

export function extractPrintedCodes(value: string): string[] {
  // OCR may insert spaces between printed letters/digits; never guess missing digits.
  const matches = value.toUpperCase().matchAll(/(?<![A-Z0-9])W[ \t]*L[ \t]*(?:\d[ \t]*){8}(?![A-Z0-9])/g);
  return [...new Set(Array.from(matches, (match) => match[0].replace(/[ \t]/g, "")))];
}

export function normalizeScannedCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized.match(/\bWL\d{8}\b/)?.[0] ?? normalized;
}

export function searchCodes<T extends SearchableCode>(codes: T[], query: string) {
  const term = query.trim().toUpperCase();
  return term ? codes.filter((row) => row.code.toUpperCase().includes(term)) : [];
}