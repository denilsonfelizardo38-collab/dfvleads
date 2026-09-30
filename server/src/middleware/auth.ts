import type { NextFunction, Request, Response } from 'express';
import { getAuthUser } from '../services/supabaseAdmin.ts';
import type { AuthedRequest } from '../types.ts';

/** Bloqueia rotas sem um JWT válido do Supabase; injeta req.user. */
export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const user = await getAuthUser(request);
  if (!user) {
    response.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }
  (request as AuthedRequest).user = { id: user.id, email: user.email ?? '' };
  next();
}
