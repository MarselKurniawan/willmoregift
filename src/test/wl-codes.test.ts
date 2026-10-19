import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { DEFAULT_DRAW_DAYS, WL_CODES_BY_DAY, WL_CODE_ROWS } from "@/lib/wl-codes";

describe("Supplied WL promo codes", () => {
  it("contains exactly 160 distinct codes", () => {
    expect(WL_CODE_ROWS).toHaveLength(160);
    expect(new Set(WL_CODE_ROWS.map((row) => row.code)).size).toBe(160);
  });
  const hashes = [
    "70c8064a432baea12073c533695dcbb8ad63b4fb558b472e2a43afb881bc2b48",
    "b033a42d923f296c12b77e393c0bc2c575bb67898c231434d40f15efb113b537",
    "7de79b2f9f0b9b893662282689e36bf10a415c1d1b2dba86516b04f1eaeb2a4c",
    "4da2f6029199f10304932b92210043cac41c779db3e9ea80404293cbcb289cec",
  ];
  for (const [index, hash] of hashes.entries()) {
    it(`matches all 40 supplied codes for day ${index + 1}`, () => {
      const codes = WL_CODES_BY_DAY[index];
      expect(codes).toHaveLength(40);
      expect(createHash("sha256").update(codes?.join("\n") ?? "").digest("hex")).toBe(hash);
      expect(WL_CODE_ROWS.filter((row) => row.day_number === index + 1).map((row) => row.code)).toEqual(codes);
    });
  }
  it("defaults to October 20–23, 2026", () => {
    expect(DEFAULT_DRAW_DAYS.map((day) => day.announce_date)).toEqual([
      "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23",
    ]);
  });
});