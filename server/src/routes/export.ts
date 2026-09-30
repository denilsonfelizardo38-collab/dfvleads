import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError, badRequest } from '../lib/http.ts';
import { CUSTO_EXPORT_CSV } from '../env.ts';
import type { AuthedRequest } from '../types.ts';

export const exportRouter = Router();

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",;\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

/** POST /api/export — devolve CSV dos leads indicados (do próprio usuário). */
exportRouter.post('/', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const leadIds: unknown = request.body?.leadIds;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw badRequest('Envie leadIds: string[] com os leads a exportar.');
    }
    const ids = leadIds.filter((id): id is string => typeof id === 'string').slice(0, 1000);
    if (ids.length === 0) throw badRequest('Nenhum lead válido para exportar.');

    // ── Créditos: exportar CSV consome 3, independentemente do volume ──
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();
    if (profileError || !profile) throw new HttpError(500, 'Perfil não encontrado.');

    if (profile.credits < CUSTO_EXPORT_CSV) {
      response.status(402).json({
        error: `Exportar o CSV consome ${CUSTO_EXPORT_CSV} créditos e você tem ${profile.credits}. Faça upgrade para continuar.`,
        needUpgrade: true,
        credits: profile.credits,
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('name, phone, address, website, rating, reviews, status')
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) throw new HttpError(500, 'Falha ao carregar leads para exportação.');

    // Débito só depois de carregar os leads com sucesso.
    const { error: debitoError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - CUSTO_EXPORT_CSV, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (debitoError) throw new HttpError(500, 'Falha ao debitar os créditos da exportação.');

    const header = 'Nome;Telefone;Endereco;Website;Avaliacao;Reviews;Status';
    const statusLabel: Record<string, string> = {
      NO_SITE: 'Sem site',
      SOCIAL_ONLY: 'So redes sociais',
      HAS_SITE: 'Tem site',
    };
    const lines = (data ?? []).map((lead) =>
      [
        lead.name,
        lead.phone,
        lead.address,
        lead.website,
        lead.rating == null ? '' : Number(lead.rating).toFixed(1).replace('.', ','),
        lead.reviews,
        statusLabel[String(lead.status)] ?? '',
      ]
        .map(csvEscape)
        .join(';'),
    );

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="dfvleads-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    response.send(`\uFEFF${[header, ...lines].join('\r\n')}`);
  } catch (error) {
    next(error);
  }
});
