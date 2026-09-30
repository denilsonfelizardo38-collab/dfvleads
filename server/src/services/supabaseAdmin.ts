import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';
import { config } from '../env.ts';

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** Valida o JWT enviado pelo frontend e retorna o usuário Supabase. */
export async function getAuthUser(request: Request): Promise<User | null> {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
