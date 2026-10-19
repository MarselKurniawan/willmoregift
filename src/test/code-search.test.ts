import { describe, expect, it } from "vitest";
import { extractPrintedCodes, normalizeScannedCode, searchCodes } from "@/lib/code-search";

describe("Admin code lookup", () => {
  const rows = [{ code: "WL81905641", day_number: 1, prize: "merch" }, { code: "WL95534656", day_number: 4, prize: "pintu_hq" }];
  it("searches across all days and retains day and prize details", () => {
    expect(searchCodes(rows, "  wl9553 ")).toEqual([{ code: "WL95534656", day_number: 4, prize: "pintu_hq" }]);
  });
  it("extracts a WL code from text", () => {
    expect(normalizeScannedCode("https://example.test/?code=wl95534656")).toBe("WL95534656");
    expect(normalizeScannedCode(" wl81905641 ")).toBe("WL81905641");
  });
  it("reads printed WL plus exactly eight digits, including OCR spacing", () => {
    expect(extractPrintedCodes("WILLMORE GIFT\nKode: wl95534656\nW L 8 1 9 0 5 6 4 1")).toEqual(["WL95534656", "WL81905641"]);
  });
  it("rejects incomplete, overlong or embedded codes without guessing letters as digits", () => {
    expect(extractPrintedCodes("WL1234567 WL123456789 XWL95534656 WL95534656X WL95534O56")).toEqual([]);
  });
  it("deduplicates codes and retains every distinct match for selection", () => {
    expect(extractPrintedCodes("WL95534656 WL95534656 WL81905641")).toEqual(["WL95534656", "WL81905641"]);
  });
  it("returns no matches for an unknown code", () => {
    expect(searchCodes(rows, "WL00000000")).toEqual([]);
  });
});