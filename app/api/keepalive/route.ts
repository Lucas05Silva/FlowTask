import { NextResponse } from "next/server";
import { pingSupabase } from "@/lib/supabase/keepalive";

export const dynamic = "force-dynamic";

// O Vercel Cron envia "Authorization: Bearer <CRON_SECRET>" automaticamente
// quando a variável CRON_SECRET está definida no projeto.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pingSupabase();
  const timestamp = new Date().toISOString();
  console.log(`[Keepalive] ${timestamp} — ${result.message}`);

  return NextResponse.json({ timestamp, ...result }, { status: result.ok ? 200 : 500 });
}
