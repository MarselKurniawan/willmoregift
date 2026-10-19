import { describe, expect, it } from "vitest";
import { normalizeScannedCode, searchCodes } from "@/lib/code-search";

describe("Admin code lookup", () => {
  const rows = [{ code: "WL81905641", day_number: 1, prize: "merch" }, { code: "WL95534656", day_number: 4, prize: "pintu_hq" }];
  it("searches across all days and retains day and prize details", () => {
    expect(searchCodes(rows, "  wl9553 ")).toEqual([{ code: "WL95534656", day_number: 4, prize: "pintu_hq" }]);
  });
  it("extracts a scanned WL code from QR link or plain barcode text", () => {
    expect(normalizeScannedCode("https://example.test/?code=wl95534656")).toBe("WL95534656");
    expect(normalizeScannedCode(" wl81905641 ")).toBe("WL81905641");
  });
  it("returns no matches for an unknown code", () => {
    expect(searchCodes(rows, "WL00000000")).toEqual([]);
  });
});