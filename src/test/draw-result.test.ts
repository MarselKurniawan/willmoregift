import { describe, expect, it } from "vitest";
import { getCodeResult } from "@/lib/draw-result";

describe("Anytime code checking", () => {
  it("shows a winning result even with a future announcement date", () => {
    expect(getCodeResult({ prize: "merch", day_number: 1, draw_days: {
      announce_date: "2099-10-20", drawn_at: "2026-10-19T00:00:00Z",
    } })).toEqual({ status: "win", prize: "merch", day: 1 });
  });
  it("shows zonk even with a future announcement date", () => {
    expect(getCodeResult({ prize: "zonk", day_number: 2, draw_days: {
      announce_date: "2099-10-21", drawn_at: "2026-10-19T00:00:00Z",
    } })).toEqual({ status: "zonk", prize: "zonk", day: 2 });
  });
  it("keeps undrawn codes pending", () => {
    expect(getCodeResult({ prize: null, day_number: 3, draw_days: {
      announce_date: "2026-10-22", drawn_at: null,
    } })).toEqual({ status: "pending", day: 3 });
  });
});