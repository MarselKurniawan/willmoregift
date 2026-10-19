export type SearchableCode = { code: string; day_number: number; prize: string | null };

export function normalizeScannedCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized.match(/\bWL\d{8}\b/)?.[0] ?? normalized;
}

export function searchCodes<T extends SearchableCode>(codes: T[], query: string) {
  const term = query.trim().toUpperCase();
  return term ? codes.filter((row) => row.code.toUpperCase().includes(term)) : [];
}