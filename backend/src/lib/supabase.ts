import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

function requireSupabaseEnv(): { url: string; serviceKey: string } {
  const url = process.env.SUPABASE_URL?.trim() ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim() ?? '';
  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!serviceKey) missing.push('SUPABASE_SERVICE_KEY');

  if (missing.length > 0) {
    const message = `[Supabase] Variáveis ausentes ou vazias: ${missing.join(', ')}. Defina-as em backend/.env (desenvolvimento local) ou nas Environment Variables do projeto na Vercel (produção).`;
    console.error(message);
    throw new Error(message);
  }

  return { url, serviceKey };
}

function getOrCreateClient(): SupabaseClient {
  if (!client) {
    const { url, serviceKey } = requireSupabaseEnv();
    client = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

/** Use quando preferir chamada explícita em vez de importar `supabase`. */
export function getSupabase(): SupabaseClient {
  return getOrCreateClient();
}

/**
 * Cliente server-side com service role.
 * Na primeira utilização valida `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getOrCreateClient();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
