export const GRAND_PRIZE_CODE = "WL95534656";
export const GRAND_PRIZE = "pintu_hq";
export const PRIZES = { cash: 1, goodybag: 5, merch: 4 } as const;

export function allocatePrizes(codes: string[], randomIndex: (size: number) => number) {
  const list = codes.filter((code) => code !== GRAND_PRIZE_CODE);
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    const a = list[i];
    const b = list[j];
    if (a === undefined || b === undefined) throw new Error("Invalid shuffle index");
    list[i] = b;
    list[j] = a;
  }
  const pool = [
    ...Array<string>(PRIZES.cash).fill("cash"),
    ...Array<string>(PRIZES.goodybag).fill("goodybag"),
    ...Array<string>(PRIZES.merch).fill("merch"),
  ];
  const groups: Record<string, string[]> = {};
  list.forEach((code, i) => (groups[pool[i] ?? "zonk"] ??= []).push(code));
  if (codes.includes(GRAND_PRIZE_CODE)) groups[GRAND_PRIZE] = [GRAND_PRIZE_CODE];
  return groups;
}