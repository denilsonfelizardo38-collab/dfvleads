import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import { planoPelaChave } from '../env.ts';
import { requireAdmin } from '../middleware/gate.ts';
import type { AuthedRequest } from '../types.ts';

export const adminRouter = Router();

// Todas as rotas abaixo exigem perfil is_admin = true.
adminRouter.use(requireAdmin);

interface PedidoRow {
  id: string;
  user_id: string;
  plan_key: string;
  amount_usd: number;
  metodo: string;
  referencia: string | null;
  status: string;
  created_at: string;
  profiles: { email?: string; full_name?: string } | null;
}

/** GET /api/admin/stats — números gerais para o topo do painel. */
adminRouter.get('/stats', async (_request, response, next) => {
  try {
    const [usuarios, bloqueados, pedidosPendentes, aprovados, sites, buscas] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }).eq('blocked', true),
      supabaseAdmin.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseAdmin.from('landing_pages').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('searches').select('id', { count: 'exact', head: true }),
    ]);
    response.json({
      usuarios: usuarios.count ?? 0,
      bloqueados: bloqueados.count ?? 0,
      pagamentosPendentes: pedidosPendentes.count ?? 0,
      pagamentosAprovados: aprovados.count ?? 0,
      sitesGerados: sites.count ?? 0,
      buscasTotais: buscas.count ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/admin/usuarios?q= — lista com saldo, plano e bloqueio. */
adminRouter.get('/usuarios', async (request, response, next) => {
  try {
    const q = String(request.query.q ?? '').trim();
    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, plan, plan_expires, credits, sites_used, searches_used, period_start, blocked, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (q) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const ids = users?.users.filter((u) => u.email?.toLowerCase().includes(q.toLowerCase())).map((u) => u.id) ?? [];
      query = query.in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    }
    const { data: perfis, error } = await query;
    if (error) throw new HttpError(500, `Falha ao listar usuários: ${error.message}`);

    // Junta os e-mails do Auth aos perfis.
    const { data: auth } = await supabaseAdmin.auth.admin.listUsers();
    const emails = new Map((auth?.users ?? []).map((u) => [u.id, u.email ?? '']));
    const usuarios = (perfis ?? []).map((p) => ({ ...p, email: emails.get(p.user_id) ?? '' }));
    response.json({ usuarios });
  } catch (error) {
    next(error);
  }
});

/** POST /api/admin/usuarios/:id/bloquear { blocked } — bloqueia/desbloqueia. */
adminRouter.post('/usuarios/:id/bloquear', async (request, response, next) => {
  try {
    const admin = (request as AuthedRequest).user;
    const blocked = Boolean(request.body?.blocked);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ blocked, updated_at: new Date().toISOString() })
      .eq('user_id', request.params.id);
    if (error) throw new HttpError(500, 'Falha ao atualizar o usuário.');

    if (blocked && admin) {
      await supabaseAdmin.from('notifications').insert({
        user_id: request.params.id,
        titulo: 'Conta bloqueada',
        corpo: 'Sua conta foi bloqueada. Fale com o suporte pelo WhatsApp para resolver.',
      });
    }
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/** POST /api/admin/usuarios/:id/creditar { credits } — ajuste manual de saldo. */
adminRouter.post('/usuarios/:id/creditar', async (request, response, next) => {
  try {
    const credits = Math.trunc(Number(request.body?.credits));
    if (!Number.isFinite(credits) || credits < 0 || credits > 100000) throw new HttpError(400, 'Valor de créditos inválido (0-100000).');
    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', request.params.id)
      .single();
    const atual = perfil?.credits ?? 0;
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ credits: credits, updated_at: new Date().toISOString() })
      .eq('user_id', request.params.id);
    if (error) throw new HttpError(500, 'Falha ao creditar.');
    await supabaseAdmin.from('credit_logs').insert({
      user_id: request.params.id,
      tipo: 'ajuste',
      quantidade: credits - atual,
      detalhe: 'Ajuste manual do admin',
    });
    await supabaseAdmin.from('notifications').insert({
      user_id: request.params.id,
      titulo: 'Saldo atualizado',
      corpo: `Seu saldo de buscas foi definido em ${credits} créditos pelo suporte.`,
    });
    response.json({ ok: true, credits });
  } catch (error) {
    next(error);
  }
});

/** GET /api/admin/pagamentos?status= — fila de confirmação de pagamentos. */
adminRouter.get('/pagamentos', async (request, response, next) => {
  try {
    const status = String(request.query.status ?? 'pending');
    let query = supabaseAdmin
      .from('payment_requests')
      .select('id, user_id, plan_key, amount_usd, metodo, referencia, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (status !== 'todos') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new HttpError(500, `Falha ao listar pagamentos: ${error.message}`);

    // Junta e-mail (Auth) e nome (profiles) em duas consultas simples.
    const { data: auth } = await supabaseAdmin.auth.admin.listUsers();
    const emails = new Map((auth?.users ?? []).map((u) => [u.id, u.email ?? '']));
    const { data: perfis } = await supabaseAdmin.from('profiles').select('user_id, full_name');
    const nomes = new Map((perfis ?? []).map((p) => [p.user_id, (p as { full_name?: string }).full_name ?? '']));
    const pedidos = (data ?? []).map((p) => {
      const row = p as unknown as PedidoRow;
      return { ...row, email: emails.get(row.user_id) ?? '', full_name: nomes.get(row.user_id) ?? '' };
    });
    response.json({ pedidos });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/pagamentos/:id/decidir { aprovar: true|false }
 * Aprovar ativa o plano do usuário (cotas + expiração em 30 dias).
 */
adminRouter.post('/pagamentos/:id/decidir', async (request, response, next) => {
  try {
    const admin = (request as AuthedRequest).user;
    if (!admin) throw new HttpError(401, 'Não autenticado.');
    const aprovar = Boolean(request.body?.aprovar);

    const { data: pedido } = await supabaseAdmin
      .from('payment_requests')
      .select('id, user_id, plan_key, status')
      .eq('id', String(request.params.id))
      .single();
    if (!pedido) throw new HttpError(404, 'Pedido não encontrado.');
    if (pedido.status !== 'pending') throw new HttpError(400, 'Este pedido já foi analisado.');

    if (aprovar) {
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
        corpo: `Pagamento confirmado. Você tem ${plano.pesquisas} pesquisas e ${plano.sites} sites até ${expira.toLocaleDateString('pt-BR')}. Bom trabalho!`,
      });
    } else {
      await supabaseAdmin.from('notifications').insert({
        user_id: pedido.user_id,
        titulo: 'Pagamento não confirmado',
        corpo: 'Não localizamos sua transferência. Confira o ID enviado ou fale com o suporte pelo WhatsApp.',
      });
    }

    const { error } = await supabaseAdmin
      .from('payment_requests')
      .update({ status: aprovar ? 'approved' : 'rejected', admin_id: admin.id, reviewed_at: new Date().toISOString() })
      .eq('id', pedido.id);
    if (error) throw new HttpError(500, 'Falha ao atualizar o pedido.');
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/** POST /api/admin/notificar { userId | 'todos', titulo, corpo } */
adminRouter.post('/notificar', async (request, response, next) => {
  try {
    const titulo = String(request.body?.titulo ?? '').trim().slice(0, 120);
    const corpo = String(request.body?.corpo ?? '').trim().slice(0, 600);
    const alvo = String(request.body?.userId ?? '').trim();
    if (titulo.length < 3 || corpo.length < 3) throw new HttpError(400, 'Título e corpo são obrigatórios.');

    if (alvo === 'todos') {
      const { data: perfis } = await supabaseAdmin.from('profiles').select('user_id').limit(2000);
      const linhas = (perfis ?? []).map((p) => ({ user_id: p.user_id, titulo, corpo }));
      if (linhas.length) await supabaseAdmin.from('notifications').insert(linhas);
      response.json({ ok: true, enviados: linhas.length });
      return;
    }
    if (!/^[0-9a-f-]{36}$/i.test(alvo)) throw new HttpError(400, 'ID de usuário inválido.');
    const { error } = await supabaseAdmin.from('notifications').insert({ user_id: alvo, titulo, corpo });
    if (error) throw new HttpError(500, 'Falha ao enviar a notificação.');
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/** GET /api/admin/logs — últimos registros de crédito (auditoria). */
adminRouter.get('/logs', async (_request, response, next) => {
  try {
    const { data } = await supabaseAdmin
      .from('credit_logs')
      .select('id, user_id, tipo, quantidade, detalhe, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    response.json({ logs: data ?? [] });
  } catch (error) {
    next(error);
  }
});
