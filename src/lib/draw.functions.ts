import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_DRAW_DAYS, WL_CODE_ROWS } from "@/lib/wl-codes";
import { getCodeResult } from "@/lib/draw-result";
import { allocatePrizes, GRAND_PRIZE_CODE } from "@/lib/draw-allocation";

const ADMIN_CODES = ["willmore", "aaaa"];

function assertAdmin(pass: string) {
  if (!ADMIN_CODES.includes((pass ?? "").trim().toLowerCase())) throw new Error("Kode admin salah");
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
const norm = (c: string) => c.trim().toUpperCase();

export const checkCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: String(d.code ?? "").slice(0, 64) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("codes")
      .select("code, prize, day_number, draw_days(announce_date, drawn_at)")
      .eq("code", norm(data.code))
      .maybeSingle();
    return getCodeResult(row);
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    const { data: days } = await db.from("draw_days").select("*").order("day_number");
    const { data: codes } = await db.from("codes").select("code, day_number, prize").order("created_at");
    return { days: days ?? [], codes: codes ?? [] };
  });

export const adminAddCodes = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string; day: number; codes: string[] }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    const list = Array.from(new Set(data.codes.map(norm).filter(Boolean)));
    if (!list.length) return { added: 0 };
    const { error, count } = await db
      .from("codes")
      .upsert(list.map((code) => ({ code, day_number: data.day })), { onConflict: "code", ignoreDuplicates: true, count: "exact" });
    if (error) throw new Error(error.message);
    return { added: count ?? list.length };
  });

export const adminFillWLCodes = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string }) => ({ pass: String(d.pass ?? "") }))
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    const { error: dayError } = await db.from("draw_days").upsert(DEFAULT_DRAW_DAYS, {
      onConflict: "day_number", ignoreDuplicates: true,
    });
    if (dayError) throw new Error("Gagal menyiapkan hari undian.");
    // Only send code and day: existing prizes and announcement dates stay intact.
    const { error } = await db.from("codes").upsert(WL_CODE_ROWS, { onConflict: "code" });
    if (error) throw new Error("Gagal mengisi kode WL. Silakan coba lagi.");
    return { total: WL_CODE_ROWS.length };
  });

export const adminDeleteCode = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string; code: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    if (norm(data.code) === GRAND_PRIZE_CODE) throw new Error("Kode hadiah utama terkunci dan tidak dapat dihapus.");
    const { error } = await db.from("codes").delete().eq("code", norm(data.code));
    if (error) throw new Error("Gagal menghapus kode.");
    return { ok: true };
  });

export const adminSetDate = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string; day: number; date: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    const { error } = await db.from("draw_days").update({ announce_date: data.date }).eq("day_number", data.day);
    if (error) throw new Error("Gagal menyimpan tanggal pengumuman.");
    return { ok: true };
  });

export const adminDraw = createServerFn({ method: "POST" })
  .inputValidator((d: { pass: string; day: number; reset?: boolean }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data.pass);
    const db = await admin();
    if (data.reset) {
      const { error } = await db.from("codes").update({ prize: null }).eq("day_number", data.day).neq("code", GRAND_PRIZE_CODE);
      if (error) throw new Error("Gagal mereset undian.");
      const { error: dayError } = await db.from("draw_days").update({ drawn_at: null }).eq("day_number", data.day);
      if (dayError) throw new Error("Gagal mereset hari undian.");
      return { ok: true };
    }
    const { data: codes, error: readError } = await db.from("codes").select("code").eq("day_number", data.day);
    if (readError) throw new Error("Gagal membaca kode undian.");
    const groups = allocatePrizes((codes ?? []).map((c) => c.code), (size) => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return (value ?? 0) % size;
    });
    for (const [prize, cs] of Object.entries(groups)) {
      const { error } = await db.from("codes").update({ prize }).in("code", cs);
      if (error) throw new Error("Gagal menyimpan hasil undian.");
    }
    const { error: dayError } = await db.from("draw_days").update({ drawn_at: new Date().toISOString() }).eq("day_number", data.day);
    if (dayError) throw new Error("Gagal menyimpan status undian.");
    return { ok: true };
  });
