import { supabaseAdmin } from './supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import { planoPelaChave } from '../env.ts';

/**
 * Ativa o plano de um usuário de forma IDEMPOTENTE: se o pedido já foi
 * aprovado, não faz nada. Usada pelo webhook do PayPal, pelo retorno do
 * Binance Pay e pela confirmação manual do admin.
 */
export async function ativarPlanoDoPedido(pedidoId: string): Promise<{ ok: boolean; jaProcessado: boolean }> {
  const { data: pedido, error } = await supabaseAdmin
    .from('payment_requests')
    .select('id, user_id, plan_key, status')
    .eq('id', pedidoId)
    .single();
  if (error || !pedido) throw new HttpError(404, 'Pedido não encontrado.');
  if (pedido.status === 'approved') return { ok: true, jaProcessado: true };

  const plano = planoPelaChave(pedido.plan_key);
  if (!plano) throw new HttpError(400, 'Plano do pedido inválido.');

  const agora = new Date();
  const expira = new Date(agora.getTime() + 30 * 24 * 3600 * 1000);
  const { error: erroPerfil } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: plano.key,
      plan_expires: expira.toISOString(),
      period_start: agora.toISOString(),
      sites_used: 0,
      searches_used: 0,
      credits: plano.pesquisas,
      blocked: false,
      updated_at: agora.toISOString(),
    })
    .eq('user_id', pedido.user_id);
  if (erroPerfil) throw new HttpError(500, 'Falha ao ativar o plano.');

  await supabaseAdmin.from('notifications').insert({
    user_id: pedido.user_id,
    titulo: `Plano ${plano.nome} ativado`,
    corpo: `Pagamento confirmado automaticamente. Você tem ${plano.pesquisas} pesquisas e ${plano.sites} sites até ${expira.toLocaleDateString('pt-BR')}.`,
  });
  await supabaseAdmin.from('credit_logs').insert({
    user_id: pedido.user_id,
    tipo: 'recarga',
    quantidade: plano.pesquisas,
    detalhe: `Plano ${plano.nome} ativado (pagamento automático)`,
  });

  await supabaseAdmin
    .from('payment_requests')
    .update({ status: 'approved', auto_approved: true, reviewed_at: agora.toISOString() })
    .eq('id', pedidoId);

  return { ok: true, jaProcessado: false };
}
