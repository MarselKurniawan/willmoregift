import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Shuffle, RotateCcw, Trash2, LogOut, Loader2, ListPlus } from "lucide-react";
import { adminLogin, adminOverview, adminAddCodes, adminDeleteCode, adminSetDate, adminDraw, adminFillWLCodes } from "@/lib/draw.functions";
import { Shell, PRIZE_LABEL } from "@/components/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Willmore Gift" },
      { name: "description", content: "Kelola kode unik dan undian harian." },
      { property: "og:title", content: "Admin — Willmore Gift" },
      { property: "og:description", content: "Kelola kode unik dan undian harian." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Overview = Awaited<ReturnType<typeof adminOverview>>;

function Admin() {
  const [pass, setPass] = useState<string | null>(null);
  useEffect(() => setPass(sessionStorage.getItem("adm")), []);
  if (!pass) return <Login onOk={(p) => { sessionStorage.setItem("adm", p); setPass(p); }} />;
  return <Dashboard pass={pass} onLogout={() => { sessionStorage.removeItem("adm"); setPass(null); }} />;
}

function Login({ onOk }: { onOk: (p: string) => void }) {
  const login = useServerFn(adminLogin);
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  return (
    <Shell>
      <Link to="/" className="text-sm text-muted-foreground">← Kembali</Link>
      <div className="mt-24 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><Lock /></div>
      <h1 className="mt-5 text-3xl font-extrabold">Admin Area</h1>
      <p className="mt-1 text-muted-foreground">Masukkan kode akses.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try { await login({ data: { pass: v } }); onOk(v); } catch { setErr("Kode salah"); }
        }}
      >
        <input type="password" value={v} onChange={(e) => setV(e.target.value)} placeholder="Kode akses"
          className="w-full rounded-2xl border border-input bg-card px-4 py-4 outline-none focus:border-primary" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground">Masuk</button>
      </form>
    </Shell>
  );
}

function Dashboard({ pass, onLogout }: { pass: string; onLogout: () => void }) {
  const overview = useServerFn(adminOverview);
  const add = useServerFn(adminAddCodes);
  const del = useServerFn(adminDeleteCode);
  const setDate = useServerFn(adminSetDate);
  const draw = useServerFn(adminDraw);
  const fill = useServerFn(adminFillWLCodes);
  const [data, setData] = useState<Overview | null>(null);
  const [day, setDay] = useState(1);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => setData(await overview({ data: { pass } })), [pass, overview]);
  useEffect(() => { load().catch(onLogout); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(""); setNotice("");
    try { await fn(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan. Silakan coba lagi."); }
    finally { setBusy(false); }
  };

  if (!data) return <Shell><Loader2 className="mx-auto mt-40 h-8 w-8 animate-spin text-primary" /></Shell>;
  const d = data.days.find((x) => x.day_number === day);
  if (!d) return <Shell><p>Hari undian belum tersedia.</p></Shell>;
  const codes = data.codes.filter((c) => c.day_number === day);
  const order = ["pintu_hq", "cash", "goodybag", "merch", "zonk"];
  const sorted = d.drawn_at ? [...codes].sort((a, b) => order.indexOf(a.prize ?? "zonk") - order.indexOf(b.prize ?? "zonk")) : codes;

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Willmore <span className="text-primary">Gift</span></h1>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm text-muted-foreground"><LogOut className="h-4 w-4" /> Keluar</button>
      </header>
      <p className="mt-1 text-sm text-muted-foreground">Total kode: <b className="text-foreground">{data.codes.length}</b> / 160</p>
      <Button disabled={busy} className="mt-4 h-auto w-full whitespace-normal py-3 font-bold"
        onClick={() => run(async () => {
          const result = await fill({ data: { pass } });
          setNotice(`${result.total} kode WL tersimpan · 40 kode per hari.`);
        })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
        Isi Otomatis 160 Kode WL
      </Button>
      {notice && <p role="status" className="mt-2 text-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid grid-cols-4 gap-2">
        {data.days.map((x) => {
          const n = data.codes.filter((c) => c.day_number === x.day_number).length;
          return (
            <button key={x.day_number} onClick={() => setDay(x.day_number)}
              className={`rounded-2xl border p-3 text-left transition ${day === x.day_number ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              <div className="text-xs font-semibold opacity-70">Hari</div>
              <div className="text-2xl font-extrabold">{x.day_number}</div>
              <div className="text-[11px] opacity-70">{n} kode{x.drawn_at ? " ✓" : ""}</div>
            </button>
          );
        })}
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-card p-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tanggal pengumuman</label>
        <input type="date" aria-label={`Tanggal pengumuman Hari ${day}`} disabled={busy} value={d.announce_date} onChange={(e) => { const date = e.target.value; if (date) run(() => setDate({ data: { pass, day, date } })); }}
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 [color-scheme:dark]" />
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tambah kode unik (Hari {day})</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Satu kode per baris, atau pisahkan dengan koma"
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 font-mono text-sm uppercase outline-none focus:border-primary" />
        <button disabled={busy || !text.trim()} onClick={() => run(async () => { await add({ data: { pass, day, codes: text.split(/[\s,;]+/) } }); setText(""); })}
          className="mt-2 w-full rounded-xl bg-secondary py-3 font-semibold disabled:opacity-50">Simpan Kode</button>
      </section>

      <section className="mt-4 rounded-3xl bg-primary p-4 text-primary-foreground">
        <p className="text-sm font-semibold">Undian Hari {day}: 1× Rp50rb · 5× Goody Bag · 4× Merch · sisanya Zonk</p>
        {d.drawn_at ? (
          <button disabled={busy} onClick={() => confirm("Reset hasil undian hari ini?") && run(() => draw({ data: { pass, day, reset: true } }))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-background py-3 font-bold text-foreground"><RotateCcw className="h-4 w-4" /> Reset Undian</button>
        ) : (
          <button disabled={busy || codes.length === 0} onClick={() => run(() => draw({ data: { pass, day } }))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-background py-3 font-bold text-foreground disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} Random Pick Sekarang
          </button>
        )}
      </section>

      <section className="mt-5 space-y-2">
        {sorted.length === 0 && <p className="text-center text-sm text-muted-foreground">Belum ada kode untuk hari ini.</p>}
        {sorted.map((c) => (
          <div key={c.code} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="font-mono font-bold">{c.code}</span>
            <div className="flex items-center gap-3">
              {c.prize && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.prize === "zonk" ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                  {PRIZE_LABEL[c.prize]}
                </span>
              )}
              {!d.drawn_at && c.code !== "WL95534656" && (
                <button onClick={() => run(() => del({ data: { pass, code: c.code } }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        ))}
      </section>
    </Shell>
  );
}
