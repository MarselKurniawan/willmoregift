import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const { check } = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/draw.functions", () => ({ checkCode: check }));
vi.mock("@/components/CodeScanner", () => ({
  CodeScanner: ({ onScan }: { onScan: (value: string) => void }) =>
    <button onClick={() => onScan("WL95534656")}>Detected card</button>,
}));
vi.mock("@/components/GrandPrizeCard", () => ({ GrandPrizeCard: () => <div>PINTU HQ 1783</div> }));

import { Route } from "@/routes/index";

describe("Public printed-code scan", () => {
  it("checks the detected WL code automatically without login or using the previous input", async () => {
    check.mockResolvedValue({ status: "win", prize: "pintu_hq", day: 4 });
    const Homepage = Route.options.component as ComponentType;
    render(<Homepage />);
    fireEvent.change(screen.getByLabelText("Kode Unik"), { target: { value: "WL81905641" } });
    fireEvent.click(screen.getByRole("button", { name: "Scan kode kamera atau foto" }));
    fireEvent.click(screen.getByRole("button", { name: "Detected card" }));
    await waitFor(() => expect(check).toHaveBeenCalledExactlyOnceWith({ data: { code: "WL95534656" } }));
    expect((screen.getByLabelText("Kode Unik") as HTMLInputElement).value).toBe("WL95534656");
    expect(await screen.findByText("PINTU HQ 1783")).toBeInTheDocument();
  });
});