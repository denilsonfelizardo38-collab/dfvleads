import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import type { AuthedRequest } from '../types.ts';

export const historyRouter = Router();

/** GET /api/history — buscas do usuário, mais recentes primeiro. */
historyRouter.get('/', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const { data, error } = await supabaseAdmin
      .from('searches')
      .select('id, niche, city, radius_km, lead_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new HttpError(500, 'Falha ao carregar histórico.');

    response.json({
      searches: (data ?? []).map((row) => ({
        id: row.id as string,
        niche: row.niche as string,
        city: row.city as string,
        radiusKm: (row.radius_km as number | null) ?? null,
        leadCount: row.lead_count as number,
        createdAt: row.created_at as string,
      })),
    });
  } catch (error) {
    next(error);
  }
});
