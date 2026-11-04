import { createClient } from "@supabase/supabase-js";

/**
 * Faz uma requisição leve ao Postgres do Supabase para contar como atividade
 * e evitar a pausa automática do plano gratuito (7 dias sem requisições).
 * Roda apenas no servidor (chamado pela rota /api/keepalive).
 */
export async function pingSupabase(): Promise<{ ok: boolean; message: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, message: "Supabase não configurado" };

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const start = Date.now();
    // Sem .single(): com RLS a consulta anônima retorna [] — ainda conta como requisição ao banco.
    const { error } = await supabase.from("users").select("id").limit(1);
    const ms = Date.now() - start;

    if (error) return { ok: false, message: `Erro: ${error.message}` };
    return { ok: true, message: `Pong! Latência: ${ms}ms` };
  } catch (err) {
    return { ok: false, message: `Exceção: ${err instanceof Error ? err.message : String(err)}` };
  }
}
