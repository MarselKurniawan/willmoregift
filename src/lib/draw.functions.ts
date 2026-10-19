import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_DRAW_DAYS, WL_CODE_ROWS } from "@/lib/wl-codes";

const ADMIN_CODES = ["willmore", "aaaa"];
export const PRIZES = { cash: 1, goodybag: 5, merch: 4 } as const;

function assertAdmin(pass: string) {
  if (!ADMIN_CODES.includes((pass ?? "").trim().toLowerCase())) throw new Error("Kode admin salah");
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
function todayWIB() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
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
    if (!row) return { status: "invalid" as const };
    const day = row.draw_days as unknown as { announce_date: string; drawn_at: string | null };
    if (!day.drawn_at || todayWIB() < day.announce_date || !row.prize)
      return { status: "pending" as const, announceDate: day.announce_date, day: row.day_number };
    return {
      status: row.prize === "zonk" ? ("zonk" as const) : ("win" as const),
      prize: row.prize,
      announceDate: day.announce_date,
      day: row.day_number,
    };
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
    await db.from("codes").delete().eq("code", data.code);
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
      await db.from("codes").update({ prize: null }).eq("day_number", data.day);
      await db.from("draw_days").update({ drawn_at: null }).eq("day_number", data.day);
      return { ok: true };
    }
    const { data: codes } = await db.from("codes").select("code").eq("day_number", data.day);
    const list = (codes ?? []).map((c) => c.code);
    for (let i = list.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1);
      [list[i], list[j]] = [list[j]!, list[i]!];
    }
    const pool = [
      ...Array(PRIZES.cash).fill("cash"),
      ...Array(PRIZES.goodybag).fill("goodybag"),
      ...Array(PRIZES.merch).fill("merch"),
    ];
    const groups: Record<string, string[]> = {};
    list.forEach((code, i) => {
      const p = pool[i] ?? "zonk";
      (groups[p] ??= []).push(code);
    });
    for (const [prize, cs] of Object.entries(groups)) {
      await db.from("codes").update({ prize }).in("code", cs);
    }
    await db.from("draw_days").update({ drawn_at: new Date().toISOString() }).eq("day_number", data.day);
    return { ok: true };
  });
