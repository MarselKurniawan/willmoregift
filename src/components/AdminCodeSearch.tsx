import { useCallback, useRef, useState } from "react";
import { Camera, Search, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIZE_LABEL, formatDate } from "@/components/Shell";
import { CodeScanner } from "@/components/CodeScanner";
import { normalizeScannedCode, searchCodes, type SearchableCode } from "@/lib/code-search";

type Day = { day_number: number; drawn_at: string | null; announce_date: string };

export function AdminCodeSearch({ codes, days }: { codes: SearchableCode[]; days: Day[] }) {
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onScan = useCallback((value: string) => { setQuery(normalizeScannedCode(value)); setScanning(false); }, []);
  const results = searchCodes(codes, query);
  function close() { setScanning(false); requestAnimationFrame(() => inputRef.current?.focus()); }
  return (
    <section aria-label="Pencarian kode" className="mt-6 border-y border-border py-5">
      <h2 className="text-base font-bold">Cari Kode</h2>
      <div className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input ref={inputRef} aria-label="Cari kode semua hari" placeholder="Cari kode semua hari" value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm font-semibold outline-none focus:border-primary" />
          {query && <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-10 w-8" aria-label="Hapus pencarian" title="Hapus pencarian" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><X /></Button>}
        </div>
        <Button className="h-10 px-3" onClick={() => setScanning(true)}><Camera /> Scan Kode</Button>
      </div>
      {query.trim() && <div aria-live="polite" className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">{results.length} kode ditemukan · Semua hari</p>
        {!results.length && <p role="status" className="py-3 text-sm text-muted-foreground">Kode tidak ditemukan.</p>}
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {results.map((row) => {
            const day = days.find((d) => d.day_number === row.day_number);
            return <article key={row.code} className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-mono font-bold">{row.code}</h3><span className="text-xs text-muted-foreground">Hari {row.day_number}</span></div>
              <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${row.prize && row.prize !== "zonk" ? "text-primary" : "text-muted-foreground"}`}>
                {row.prize === "pintu_hq" && <Lock className="h-3.5 w-3.5" />}{row.prize ? PRIZE_LABEL[row.prize] ?? row.prize : "Belum diundi"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{day?.drawn_at ? "Hari sudah diundi" : "Hari belum diundi"}{row.prize === "pintu_hq" ? " · Hadiah terkunci" : ""}</p>
              {day && <p className="mt-1 text-xs text-muted-foreground">Pengumuman: {formatDate(day.announce_date)}</p>}
            </article>;
          })}
        </div>
      </div>}
      {scanning && <CodeScanner onScan={onScan} onClose={close} />}
    </section>
  );
}