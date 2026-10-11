import { supabaseAdmin } from './supabaseAdmin.ts';

/**
 * Débito ATÓMICO de créditos via RPC (`supabase/migration_creditos_atomicos.sql`).
 * Uma única instrução SQL confere o saldo E debita — duas requisições
 * simultâneas nunca gastam 1 crédito por 2 usos, e o saldo nunca fica negativo.
 *
 * Se a migração ainda não foi aplicada no banco, usa o caminho antigo
 * (ler → conferir → escrever) para não quebrar.
 */
export interface DebitoResultado {
  ok: boolean;
  credits: number;
  atomico: boolean;
}

function funcaoAusente(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === '42883' ||
    code === 'PGRST202' ||
    message.includes('debitar_creditos') ||
    message.includes('consumir_site_quota')
  );
}

export async function debitarCreditos(userId: string, valor: number): Promise<DebitoResultado> {
  try {
    const { data, error } = await supabaseAdmin.rpc('debitar_creditos', {
      p_user_id: userId,
      p_valor: valor,
    });
    if (!error && data && data.length > 0) {
      return { ok: Boolean(data[0].ok), credits: Number(data[0].credits), atomico: true };
    }
    if (error && !funcaoAusente(error)) throw error;
  } catch (error) {
    if (!funcaoAusente(error)) throw error;
  }

  // Fallback pré-migração (não atómico — aplicar a migração quanto antes).
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('user_id', userId)
    .single();
  const saldo = perfil?.credits ?? 0;
  if (saldo < valor) return { ok: false, credits: saldo, atomico: false };
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ credits: saldo - valor, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateError) throw updateError;
  return { ok: true, credits: saldo - valor, atomico: false };
}

export interface CotaResultado {
  ok: boolean;
  restantes: number;
  atomico: boolean;
}

/** Consome 1 unidade da cota de sites do período (atómico via RPC, com fallback). */
export async function consumirSiteQuota(userId: string, limite: number): Promise<CotaResultado> {
  try {
    const { data, error } = await supabaseAdmin.rpc('consumir_site_quota', {
      p_user_id: userId,
      p_limite: limite,
    });
    if (!error && data && data.length > 0) {
      return { ok: Boolean(data[0].ok), restantes: Number(data[0].restantes), atomico: true };
    }
    if (error && !funcaoAusente(error)) throw error;
  } catch (error) {
    if (!funcaoAusente(error)) throw error;
  }

  // Fallback pré-migração.
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('sites_used')
    .eq('user_id', userId)
    .single();
  const usados = perfil?.sites_used ?? 0;
  if (usados >= limite) return { ok: false, restantes: Math.max(limite - usados, 0), atomico: false };
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ sites_used: usados + 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateError) throw updateError;
  return { ok: true, restantes: limite - (usados + 1), atomico: false };
}
