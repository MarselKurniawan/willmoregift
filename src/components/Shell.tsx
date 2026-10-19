import type { ReactNode } from "react";

export const PRIZE_LABEL: Record<string, string> = {
  cash: "Saldo Rp50.000",
  goodybag: "Goody Bag Eksklusif",
  merch: "Official Merch",
  zonk: "Zonk",
};

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-background grid-bg">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative px-5 pb-12 pt-6">{children}</div>
      </div>
    </div>
  );
}
