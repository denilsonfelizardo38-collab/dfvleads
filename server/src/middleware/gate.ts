import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import type { AuthedRequest } from '../types.ts';

export interface ProfileGate {
  user_id: string;
  is_admin: boolean;
  blocked: boolean;
  plan: string;
  plan_expires: string | null;
  credits: number;
  sites_used: number;
  searches_used: number;
  period_start: string | null;
}

/**
 * Carrega o perfil uma vez por request (gate + rotas reutilizam).
 * Se as colunas novas ainda não existirem (migration pendente), degrada
 * com aviso claro em vez de derrubar o produto inteiro com 500.
 */
export async function carregarPerfil(user_id: string): Promise<ProfileGate> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, is_admin, blocked, plan, plan_expires, credits, sites_used, searches_used, period_start')
    .eq('user_id', user_id)
    .single();
  if (error || !data) {
    console.warn('[gate] colunas novas ausentes — rode supabase/migration_admin_billing.sql no Supabase.');
    const { data: basico, error: erroBasico } = await supabaseAdmin
      .from('profiles')
      .select('user_id, plan, credits')
      .eq('user_id', user_id)
      .single();
    if (erroBasico || !basico) throw new HttpError(500, 'Perfil não encontrado. Rode as migrações SQL no Supabase (schema.sql e migration_admin_billing.sql).');
    return {
      user_id: basico.user_id,
      is_admin: false,
      blocked: false,
      plan: basico.plan,
      plan_expires: null,
      credits: basico.credits,
      sites_used: 0,
      searches_used: 0,
      period_start: null,
    };
  }
  return data as ProfileGate;
}

/** 403 se a conta estiver bloqueada pelo admin. */
export async function gateBloqueio(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');
    const perfil = await carregarPerfil(user.id);
    if (perfil.blocked) throw new HttpError(403, 'Conta bloqueada. Fale com o suporte pelo WhatsApp.');
    (request as Request & { perfil?: ProfileGate }).perfil = perfil;
    next();
  } catch (error) {
    next(error);
  }
}

/** 403 se não for admin. Usar DEPOIS de requireAuth. */
export async function requireAdmin(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');
    const perfil = await carregarPerfil(user.id);
    if (!perfil.is_admin) throw new HttpError(403, 'Acesso restrito ao administrador.');
    next();
  } catch (error) {
    next(error);
  }
}
