import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Sparkles, Clock, XCircle, Frown, ArrowRight, Loader2 } from "lucide-react";
import { checkCode } from "@/lib/draw.functions";
import { Shell, PRIZE_LABEL } from "@/components/Shell";
import { GrandPrizeCard } from "@/components/GrandPrizeCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cek Kode Unik — Willmore Gift" },
      { name: "description", content: "Masukkan kode unikmu dan lihat hadiah apa yang kamu dapatkan." },
      { property: "og:title", content: "Cek Kode Unik — Willmore Gift" },
      { property: "og:description", content: "Masukkan kode unikmu dan lihat hadiah apa yang kamu dapatkan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Result = Awaited<ReturnType<typeof checkCode>>;

function Index() {
  const check = useServerFn(checkCode);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setRes(null);
    try {
      setRes(await check({ data: { code } }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          Willmore<span className="text-primary">Gift</span>
        </div>
      </header>

      <section className="mt-12">
        <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight">
          Cek kode unikmu, <span className="text-primary">menang</span> apa hari ini?
        </h1>
        <p className="mt-4 text-muted-foreground">Masukkan kode unik yang kamu dapat, langsung ketahui hasilnya.</p>
      </section>

      <form onSubmit={submit} className="mt-8 rounded-3xl border border-border bg-card p-4 shadow-glow">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Kode Unik</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CONTOH: AB12CD"
          className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-4 text-center text-xl font-bold tracking-[0.25em] outline-none placeholder:text-sm placeholder:tracking-widest placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Cek Sekarang <ArrowRight className="h-5 w-5" /></>}
        </button>
      </form>

      {res && <ResultCard res={res} />}

    </Shell>
  );
}

function ResultCard({ res }: { res: Result }) {
  if (res.status === "win" && res.prize === "pintu_hq") return <GrandPrizeCard />;
  if (res.status === "invalid")
    return (
      <Card icon={<XCircle className="h-7 w-7" />} tone="muted" title="Kode tidak ditemukan" text="Periksa kembali kode unikmu ya." />
    );
  if (res.status === "pending")
    return (
      <Card
        icon={<Clock className="h-7 w-7" />}
        tone="muted"
        title="Kode terdaftar"
        text={`Kode kamu terdaftar di undian Hari ${res.day}. Undian belum dilakukan.`}
      />
    );
  if (res.status === "zonk")
    return <Card icon={<Frown className="h-7 w-7" />} tone="muted" title="Maaf, belum beruntung" text="Jangan menyerah, coba lagi di kesempatan berikutnya!" />;
  return (
    <div className="mt-6 animate-in zoom-in-95 fade-in rounded-3xl bg-primary p-6 text-primary-foreground shadow-glow">
      <Gift className="h-10 w-10" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-widest">Selamat! Kamu dapat</p>
      <h2 className="mt-1 text-3xl font-extrabold">{PRIZE_LABEL[res.prize ?? ""]}</h2>
      <p className="mt-3 text-sm opacity-80">Undian Hari {res.day}. Simpan kode ini untuk klaim hadiah.</p>
    </div>
  );
}

function Card({ icon, title, text }: { icon: React.ReactNode; tone: string; title: string; text: string }) {
  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-border bg-card p-6">
      <div className="text-primary">{icon}</div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
