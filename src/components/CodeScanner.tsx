import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { extractPrintedCodes } from "@/lib/code-search";
import type { Worker } from "tesseract.js";

export function CodeScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("Membaca teks…");
  const [matches, setMatches] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      void workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    setReady(false); setError("");
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 },
        } });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach((track) => track.stop()); return; }
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setReady(true);
      } catch (err) {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError"
          ? "Izin kamera ditolak. Izinkan kamera, unggah foto, atau ketik kode."
          : name === "NotFoundError"
          ? "Kamera tidak ditemukan. Unggah foto atau ketik kode."
          : name === "NotReadableError"
          ? "Kamera sedang digunakan. Tutup aplikasi kamera lain lalu coba lagi."
          : "Kamera tidak tersedia. Unggah foto atau ketik kode.");
      }
    }
    void start();
    return () => { cancelled = true; stream?.getTracks().forEach((track) => track.stop()); };
  }, [attempt]);

  async function readText(source: HTMLCanvasElement | File) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError(""); setMatches([]); setProgress("Menyiapkan pembaca teks…");
    try {
      if (!workerRef.current) {
        const { createWorker, PSM } = await import("tesseract.js");
        if (!activeRef.current) return;
        const worker = await createWorker("eng", 1, {
          logger: (message) => {
            if (activeRef.current && message.status === "recognizing text") {
              setProgress(`Membaca teks… ${Math.round(message.progress * 100)}%`);
            }
          },
        });
        if (!activeRef.current) { await worker.terminate(); return; }
        workerRef.current = worker;
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      }
      const worker = workerRef.current;
      if (!worker || !activeRef.current) return;
      const result = await worker.recognize(source);
      if (!activeRef.current) return;
      const found = extractPrintedCodes(result.data.text);
      const first = found[0];
      if (found.length === 1 && first) onScan(first);
      else if (found.length > 1) setMatches(found);
      else setError("Kode WL + 8 angka belum terbaca. Dekatkan kartu dan pastikan teks terang serta tidak buram.");
    } catch {
      if (activeRef.current) {
        setError("Foto belum bisa dibaca. Coba lagi dengan foto JPG/PNG yang jelas, atau ketik kode.");
        void workerRef.current?.terminate(); workerRef.current = null;
      }
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    void readText(canvas);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[398px] max-h-[90dvh] overflow-y-auto rounded-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Scan Teks Kode</DialogTitle>
          <DialogDescription>Kode unik kartu · WL + 8 angka</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
          <video ref={videoRef} aria-label="Kamera pembaca teks kode" autoPlay muted playsInline className="h-full w-full object-contain" />
          {!ready && !error && !busy && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-card text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Membuka kamera…</div>}
          {busy && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-card/90 text-primary"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">{progress}</span></div>}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {matches.length > 1 && <div className="space-y-2"><p className="text-sm text-muted-foreground">Pilih kode</p>{matches.map((code) => <Button key={code} variant="outline" className="w-full font-mono" onClick={() => onScan(code)}>{code}</Button>)}</div>}
        <Button onClick={capture} disabled={!ready || busy} className="w-full"><Camera /> Ambil & Baca Kode</Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Foto kartu kode" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          if (!/image\/(jpeg|png|webp)/.test(file.type)) { setError("Gunakan foto JPG, PNG, atau WebP."); return; }
          if (file.size > 20 * 1024 * 1024) { setError("Ukuran foto maksimal 20 MB."); return; }
          void readText(file);
        }} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} className="flex-1" onClick={() => fileRef.current?.click()}><ImagePlus /> Unggah Foto</Button>
          {error && !ready && <Button size="icon" variant="outline" disabled={busy} title="Coba kamera lagi" aria-label="Coba kamera lagi" onClick={() => setAttempt((n) => n + 1)}><RotateCcw /></Button>}
          <Button variant="secondary" className="flex-1" onClick={onClose}>Ketik Kode</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
