import { GRAND_PRIZE, GRAND_PRIZE_CODE } from "@/lib/draw-allocation";

type CheckedCode = {
  code?: string;
  prize: string | null;
  day_number: number;
  draw_days: { announce_date: string; drawn_at: string | null } | null;
};

export function getCodeResult(row: CheckedCode | null) {
  if (!row) return { status: "invalid" as const };
  if (row.code === GRAND_PRIZE_CODE && row.prize === GRAND_PRIZE)
    return { status: "win" as const, prize: GRAND_PRIZE, day: row.day_number };
  const day = row.draw_days;
  if (!day?.drawn_at || !row.prize)
    return { status: "pending" as const, day: row.day_number };
  return {
    status: row.prize === "zonk" ? ("zonk" as const) : ("win" as const),
    prize: row.prize,
    day: row.day_number,
  };
}