import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import type { AuthedRequest } from '../types.ts';

export const notificationsRouter = Router();

/** GET /api/notifications — últimas 20 do usuário. */
notificationsRouter.get('/', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) return;
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id, titulo, corpo, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    response.json({ notificacoes: data ?? [] });
  } catch (error) {
    next(error);
  }
});

/** POST /api/notifications/lidas — marca todas como lidas. */
notificationsRouter.post('/lidas', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) return;
    await supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
