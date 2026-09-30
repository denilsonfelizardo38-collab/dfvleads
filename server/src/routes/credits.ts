import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import { CUSTO_BUSCA } from '../env.ts';
import type { AuthedRequest } from '../types.ts';

export const creditsRouter = Router();

/**
 * POST /api/credits/consume
 * Pré-checagem da busca: no modelo atual, 1 crédito = 1 busca, então basta
 * validar se o saldo cobre o custo fixo. NÃO debita crédito — o débito real
 * acontece em POST /api/search, somente quando a busca retorna leads.
 * Usada pelo frontend para bloquear a busca com CTA de upgrade antes de tentar.
 */
creditsRouter.post('/consume', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();
    if (error || !profile) throw new HttpError(500, 'Perfil não encontrado.');

    const enough = profile.credits >= CUSTO_BUSCA;
    response.status(enough ? 200 : 402).json({
      enough,
      billable: CUSTO_BUSCA,
      credits: profile.credits,
      ...(enough
        ? {}
        : {
            error: `Cada busca consome ${CUSTO_BUSCA} crédito e você tem ${profile.credits}. Faça upgrade para continuar.`,
            needUpgrade: true,
          }),
    });
  } catch (error) {
    next(error);
  }
});
