import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function CodeScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let controls: { stop: () => void } | undefined;
    setError(""); setReady(false);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach((track) => track.stop()); return; }
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromStream(stream, video, (result, _error, scanner) => {
          if (!result || cancelled) return;
          cancelled = true;
          scanner.stop();
          stream?.getTracks().forEach((track) => track.stop());
          onScan(result.getText());
        });
        if (cancelled) controls.stop();
        else setReady(true);
      } catch (err) {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError"
          ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser, atau ketik kode."
          : name === "NotFoundError"
          ? "Kamera tidak ditemukan. Ketik kode untuk melanjutkan."
          : name === "NotReadableError"
          ? "Kamera sedang digunakan. Tutup aplikasi kamera lain lalu coba lagi."
          : "Kamera tidak tersedia. Buka melalui HTTPS, atau ketik kode.");
      }
    }
    void start();
    return () => { cancelled = true; controls?.stop(); stream?.getTracks().forEach((track) => track.stop()); };
  }, [attempt, onScan]);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[398px] rounded-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Scan Kode</DialogTitle>
          <DialogDescription>QR / Barcode</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
          <video ref={videoRef} aria-label="Kamera pemindai kode" autoPlay muted playsInline className="h-full w-full object-cover" />
          {!ready && !error && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-card text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Membuka kamera…</div>}
          {ready && <div aria-hidden="true" className="pointer-events-none absolute inset-10 rounded-lg border-2 border-primary" />}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          {error && <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}><RotateCcw /> Coba lagi</Button>}
          <Button variant="secondary" className="flex-1" onClick={onClose}>Ketik Kode</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}