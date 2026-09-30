import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import type { AuthedRequest, LeadDTO, LeadStatus } from '../types.ts';

export const leadsRouter = Router();

/** GET /api/leads/:searchId — resultado completo de uma busca do histórico. */
leadsRouter.get('/:searchId', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const searchId = String(request.params.searchId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(searchId)) throw new HttpError(400, 'ID de busca inválido.');

    const { data: search, error: searchError } = await supabaseAdmin
      .from('searches')
      .select('id, user_id, niche, city, radius_km, lead_count, created_at')
      .eq('id', searchId)
      .single();

    if (searchError || !search) throw new HttpError(404, 'Busca não encontrada.');
    if (search.user_id !== user.id) throw new HttpError(403, 'Esta busca pertence a outro usuário.');

    const { data: rows, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, place_id, name, phone, address, website, rating, reviews, status')
      .eq('search_id', searchId);

    if (leadsError) throw new HttpError(500, 'Falha ao carregar leads.');

    // Sem site primeiro, depois só-redes; tem-site (descartável) por último.
    const statusPriority: Record<LeadStatus, number> = { NO_SITE: 0, SOCIAL_ONLY: 1, HAS_SITE: 2 };
    const sorted = [...(rows ?? [])].sort(
      (a, b) =>
        (statusPriority[a.status as LeadStatus] ?? 9) - (statusPriority[b.status as LeadStatus] ?? 9) ||
        String(a.name).localeCompare(String(b.name)),
    );

    const leads: LeadDTO[] = sorted.map((row) => ({
      id: row.id as string,
      placeId: row.place_id as string,
      name: row.name as string,
      phone: (row.phone as string | null) ?? null,
      address: (row.address as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      rating: row.rating == null ? null : Number(row.rating),
      reviews: (row.reviews as number | null) ?? null,
      status: row.status as LeadStatus,
      seen: false, // ao reabrir do histórico, tudo já é conhecido
    }));

    response.json({
      search: {
        id: search.id,
        niche: search.niche,
        city: search.city,
        radiusKm: (search.radius_km as number | null) ?? null,
        leadCount: search.lead_count,
        createdAt: search.created_at,
      },
      leads,
    });
  } catch (error) {
    next(error);
  }
});
