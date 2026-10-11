import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import type { AdminStats, AdminUsuario } from '../../types.ts';

interface Pedido {
  id: string;
  user_id: string;
  plan_key: string;
  amount_usd: number;
  metodo: string;
  referencia: string | null;
  status: string;
  created_at: string;
  email: string;
  profiles?: { full_name?: string } | null;
}

const PEDIDO_VAZIO: Pedido = {
  id: '',
  user_id: '',
  plan_key: '',
  amount_usd: 0,
  metodo: '',
  referencia: null,
  status: 'pending',
  created_at: '',
  email: '',
};

type Aba = 'pagamentos' | 'usuarios' | 'avisos';

export default function AdminPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [aba, setAba] = useState<Aba>('pagamentos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState('');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [alvo, setAlvo] = useState('todos');
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [estatisticas, fila, lista] = await Promise.all([
        api.adminStats(),
        api.adminPagamentos(aba === 'pagamentos' ? 'pending' : 'todos'),
        api.adminUsuarios(busca),
      ]);
      setStats(estatisticas);
      setPedidos(fila.pedidos.map((p) => ({ ...PEDIDO_VAZIO, ...p })));
      setUsuarios(lista.usuarios);
      setErro(null);
    } catch (erro_) {
      // Mostra o erro REAL (403 de não-admin, coluna faltando etc.).
      const mensagem = erro_ instanceof Error ? erro_.message : 'Falha ao carregar o painel admin.';
      setErro(mensagem);
      toast('error', mensagem);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, busca]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  async function decidir(id: string, aprovar: boolean) {
    setAcao(id);
    try {
      await api.adminDecidirPagamento(id, aprovar);
      toast('success', aprovar ? 'Plano ativado para o usuário.' : 'Pedido rejeitado.');
      await recarregar();
    } catch {
      toast('error', 'Falha ao processar o pedido.');
    } finally {
      setAcao('');
    }
  }

  async function bloquear(usuario: AdminUsuario) {
    setAcao(usuario.user_id);
    try {
      await api.adminBloquear(usuario.user_id, !usuario.blocked);
      toast('success', usuario.blocked ? 'Usuário desbloqueado.' : 'Usuário bloqueado.');
      await recarregar();
    } catch {
      toast('error', 'Falha ao atualizar o usuário.');
    } finally {
      setAcao('');
    }
  }

  async function creditar(usuario: AdminUsuario) {
    const valor = window.prompt(`Novo saldo de buscas para ${usuario.email}:`, String(usuario.credits));
    if (valor === null) return;
    const credits = Math.trunc(Number(valor));
    if (!Number.isFinite(credits) || credits < 0) {
      toast('error', 'Valor inválido.');
      return;
    }
    setAcao(usuario.user_id);
    try {
      await api.adminCreditar(usuario.user_id, credits);
      toast('success', `Saldo de ${usuario.email} atualizado para ${credits}.`);
      await recarregar();
    } catch {
      toast('error', 'Falha ao creditar.');
    } finally {
      setAcao('');
    }
  }

  async function enviarAviso() {
    if (titulo.trim().length < 3 || corpo.trim().length < 3) {
      toast('error', 'Preencha título e mensagem.');
      return;
    }
    setEnviandoAviso(true);
    try {
      const resultado = await api.adminNotificar({ userId: alvo, titulo: titulo.trim(), corpo: corpo.trim() });
      toast('success', alvo === 'todos' ? `Aviso enviado para ${resultado.enviados ?? 0} usuários.` : 'Aviso enviado.');
      setTitulo('');
      setCorpo('');
    } catch {
      toast('error', 'Falha ao enviar o aviso.');
    } finally {
      setEnviandoAviso(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administração</h1>
        <p className="mt-1 text-sm text-slate-500">Pagamentos, usuários e avisos da plataforma.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            { label: 'Usuários', valor: stats.usuarios },
            { label: 'Bloqueados', valor: stats.bloqueados },
            { label: 'Pag. pendentes', valor: stats.pagamentosPendentes, destaque: true },
            { label: 'Pag. aprovados', valor: stats.pagamentosAprovados },
            { label: 'Sites gerados', valor: stats.sitesGerados },
            { label: 'Buscas', valor: stats.buscasTotais },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.destaque && item.valor > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-200 bg-white'}`}>
              <p className="text-2xl font-extrabold text-slate-900">{item.valor}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {(
          [
            ['pagamentos', `Pagamentos${stats?.pagamentosPendentes ? ` (${stats.pagamentosPendentes})` : ''}`],
            ['usuarios', 'Usuários'],
            ['avisos', 'Notificações'],
          ] as [Aba, string][]
        ).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === chave ? 'bg-brand-500/15 text-brand-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {erro && !carregando && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          <b>Não foi possível carregar o painel:</b> {erro}
          <p className="mt-1 text-xs text-red-600">
            Se diz "Acesso restrito", sua conta não é admin — rode no Supabase o SQL que marca
            dfvcode@mail.com como is_admin. Se cita coluna/tabela inexistente, rode as migrações
            supabase/migration_admin_billing.sql e supabase/migration_pagamentos_auto.sql.
          </p>
        </div>
      )}

      {erro && !carregando && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          <b>Não foi possível carregar o painel:</b> {erro}
          <p className="mt-1 text-xs text-red-600">
            Se diz "Acesso restrito", sua conta não está marcada como admin — rode no Supabase o
            SQL que marca dfvcode@mail.com com is_admin = true. Se cita coluna ou tabela
            inexistente, rode as migrações supabase/migration_admin_billing.sql e
            supabase/migration_pagamentos_auto.sql no SQL Editor.
          </p>
        </div>
      )}

      {carregando && (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}

      {!carregando && aba === 'pagamentos' && (
        <div className="space-y-3">
          {pedidos.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Nenhum pagamento aguardando confirmação. Assim que um usuário enviar o comprovante pelo
              WhatsApp, ele aparece aqui.
            </p>
          )}
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {pedido.email} — {pedido.amount_usd} USD
                    <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-700">
                      {pedido.plan_key}
                    </span>
                  </p>
                  <p className="mt-0.5 break-all text-xs text-slate-500">
                    {pedido.metodo} · ID: {pedido.referencia} · {new Date(pedido.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void decidir(pedido.id, true)}
                    disabled={acao === pedido.id}
                    className="btn-primary px-3.5! py-2! text-xs"
                  >
                    {acao === pedido.id ? <Spinner size="sm" /> : <Icon name="check" className="h-3.5 w-3.5" />}
                    Aprovar e ativar
                  </button>
                  <button
                    type="button"
                    onClick={() => void decidir(pedido.id, false)}
                    disabled={acao === pedido.id}
                    className="btn-secondary px-3.5! py-2! text-xs"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!carregando && aba === 'usuarios' && (
        <div className="space-y-3">
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por e-mail…"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500"
          />
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Usuário</th>
                  <th className="px-4 py-2.5">Plano</th>
                  <th className="px-4 py-2.5">Buscas</th>
                  <th className="px-4 py-2.5">Sites</th>
                  <th className="px-4 py-2.5">Validade</th>
                  <th className="px-4 py-2.5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.user_id} className={usuario.blocked ? 'text-slate-400' : 'text-slate-600'}>
                    <td className="px-4 py-2.5">
                      <span className={usuario.blocked ? 'line-through' : ''}>{usuario.email}</span>
                      {usuario.is_admin && (
                        <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-700">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{usuario.plan}</td>
                    <td className="px-4 py-2.5">{usuario.searches_used}</td>
                    <td className="px-4 py-2.5">{usuario.sites_used}</td>
                    <td className="px-4 py-2.5">
                      {usuario.plan_expires ? new Date(usuario.plan_expires).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void creditar(usuario)}
                          disabled={acao === usuario.user_id}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-900 transition hover:border-brand-500 hover:text-brand-500"
                        >
                          Creditar
                        </button>
                        <button
                          type="button"
                          onClick={() => void bloquear(usuario)}
                          disabled={acao === usuario.user_id}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                            usuario.blocked
                              ? 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10'
                              : 'border-red-500/40 text-red-600 hover:bg-red-500/10'
                          }`}
                        >
                          {usuario.blocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!carregando && aba === 'avisos' && (
        <div className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Destinatário</label>
            <select
              value={alvo}
              onChange={(evento) => setAlvo(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500"
            >
              <option value="todos">Todos os usuários</option>
              {usuarios.map((usuario) => (
                <option key={usuario.user_id} value={usuario.user_id}>
                  {usuario.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Título</label>
            <input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ex.: Manutenção programada"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mensagem</label>
            <textarea
              value={corpo}
              onChange={(evento) => setCorpo(evento.target.value)}
              rows={4}
              placeholder="Escreva o aviso que aparece no sininho do painel do usuário."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500"
            />
          </div>
          <button type="button" onClick={() => void enviarAviso()} disabled={enviandoAviso} className="btn-primary w-full">
            {enviandoAviso ? <Spinner size="sm" /> : <Icon name="message" className="h-4 w-4" />}
            {enviandoAviso ? 'Enviando…' : 'Enviar notificação'}
          </button>
        </div>
      )}
    </div>
  );
}
