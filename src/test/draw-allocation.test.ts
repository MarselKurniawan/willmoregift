import { describe, expect, it } from "vitest";
import { allocatePrizes } from "@/lib/draw-allocation";

describe("Permanent grand prize", () => {
  const codes = ["WL95534656", ...Array.from({ length: 39 }, (_, i) => `CODE${i}`)];
  it("always assigns WL95534656 only to pintu_hq across random picks", () => {
    for (const pick of [(size: number) => size - 1, () => 0, (size: number) => Math.floor(size / 2)]) {
      const groups = allocatePrizes(codes, pick);
      expect(groups["pintu_hq"]).toEqual(["WL95534656"]);
      expect(Object.entries(groups).filter(([, rows]) => rows.includes("WL95534656")).map(([prize]) => prize)).toEqual(["pintu_hq"]);
    }
  });
  it("keeps the regular daily prizes alongside the special winner", () => {
    const groups = allocatePrizes(codes, () => 0);
    expect(groups["cash"]).toHaveLength(1);
    expect(groups["goodybag"]).toHaveLength(5);
    expect(groups["merch"]).toHaveLength(4);
    expect(groups["zonk"]).toHaveLength(29);
    expect(Object.values(groups).flat()).toHaveLength(40);
  });
});