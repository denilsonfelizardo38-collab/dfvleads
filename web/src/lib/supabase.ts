import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true quando o web/.env já tem as chaves do Supabase. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Cliente Supabase real quando configurado. Sem configuração, devolve um
 * stub inofensivo para o app NÃO quebrar (tela branca): a landing renderiza
 * e as páginas de auth mostram aviso em vez de crash.
 */
function createStubClient(): SupabaseClient {
  const message =
    'Supabase não configurado. Crie o arquivo web/.env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (copie de web/.env.example) e reinicie o npm run dev:web.';
  const error = { message };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error }),
      signUp: async () => ({ data: { user: null, session: null }, error }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: null, error }),
      updateUser: async () => ({ data: { user: null }, error }),
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createStubClient();
