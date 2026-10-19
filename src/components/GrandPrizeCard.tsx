import { Crown, Sparkles, Trophy } from "lucide-react";

export function GrandPrizeCard() {
  return (
    <section role="status" aria-label="Hadiah utama PINTU HQ 1783" className="grand-prize mt-6">
      <div className="grand-confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => <span key={i} />)}
      </div>
      <div className="grand-content">
        <div className="grand-badge"><Sparkles className="h-3.5 w-3.5" /> GRAND PRIZE / HADIAH SPESIAL</div>
        <div className="grand-emblem" aria-hidden="true"><Crown className="h-14 w-14" fill="currentColor" strokeWidth={1.4} /></div>
        <h2 className="grand-heading">
          <span className="grand-congratulations">SELAMAT!</span>
          <span className="grand-intro">KAMU MEMENANGKAN HADIAH UTAMA:</span>
          <span className="grand-name">PINTU HQ<br />1783</span>
        </h2>
        <div className="grand-divider"><span /><Trophy className="h-5 w-5" /><span /></div>
        <p className="grand-code">WL95534656</p>
        <p className="mt-2 text-sm text-muted-foreground">Simpan kode ini untuk klaim hadiah spesialmu.</p>
      </div>
    </section>
  );
}