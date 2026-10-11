import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { listarContactos } from '../../lib/contatos.ts';
import Icon from '../../components/ui/Icon.tsx';
import LeadDetailModal from '../../components/dashboard/LeadDetailModal.tsx';
import { initials } from '../../lib/format.ts';
import { STATUS_META, type LeadLista, type Profile } from '../../types.ts';

interface DashboardHomeProps {
  profile: Profile | null;
}

interface DiaLeads {
  dia: string;
  total: number;
}

/**
 * Home do painel: saudação, cartões de estatísticas, gráfico dos últimos
 * 7 dias e últimos leads encontrados.
 */
export default function DashboardHome({ profile }: DashboardHomeProps) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadLista[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [leadAberto, setLeadAberto] = useState<LeadLista | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .meusLeads({ limite: 10 })
      .then((data) => {
        if (!cancelled) setLeads(data.leads);
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Gráfico: leads por dia nos últimos 7 dias (a partir dos leads carregados).
  const ultimos7: DiaLeads[] = (() => {
    const dias: DiaLeads[] = [];
    const agora = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(agora);
      d.setDate(agora.getDate() - i);
      dias.push({ dia: d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3), total: 0 });
    }
    for (const lead of leads ?? []) {
      const criado = new Date(lead.createdAt);
      const diffDias = Math.floor((agora.getTime() - criado.getTime()) / 86_400_000);
      if (diffDias >= 0 && diffDias <= 6) dias[6 - diffDias].total += 1;
    }
    return dias;
  })();
  const maximo = Math.max(1, ...ultimos7.map((d) => d.total));

  const nome = (profile?.nome ?? '').trim() || profile?.email?.split('@')[0] || 'there';

  const stats = [
    { label: 'Total de Pesquisas', value: profile?.totalSearches ?? 0, icon: 'search' as const },
    { label: 'Leads Encontrados', value: profile?.totalLeads ?? 0, icon: 'users' as const },
    {
      label: 'Contactos Feitos',
      value: listarContactos().length,
      icon: 'message' as const,
    },
    { label: 'Websites Gerados', value: profile?.sitesUsed ?? 0, icon: 'layout' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Olá,{' '}
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              {nome}
            </span>
            !
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aqui está um resumo da sua atividade.</p>
        </div>
        <Link to="/dashboard/pesquisar" className="btn-primary">
          <Icon name="search" className="h-4 w-4" />
          Pesquisar Leads
        </Link>
      </div>

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card card-hover flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-brand-500/5 text-brand-700 dark:text-brand-400 shadow-sm ring-1 ring-brand-500/25">
                <Icon name={stat.icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Gráfico dos últimos 7 dias */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Leads nos últimos 7 dias</h2>
            <Link to="/dashboard/historico" className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-500">
              Ver detalhes <Icon name="arrow-right" className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
            {ultimos7.map((dia, index) => (
              <div key={`${dia.dia}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{dia.total}</span>
                <div
                  className="w-full rounded-full bg-gradient-to-t from-brand-700 via-brand-500 to-brand-400 shadow-[0_0_12px_rgba(34,197,94,0.25)] transition-all hover:brightness-110"
                  style={{ height: `${Math.max(6, (dia.total / maximo) * 100)}%` }}
                />
                <span className="text-[11px] capitalize text-slate-400 dark:text-slate-500">{dia.dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos leads */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Últimos Leads</h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/leads')}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-500"
            >
              Ver todos <Icon name="arrow-right" className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {carregando && (
              <div className="space-y-2 py-2" aria-label="Carregando…">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-2/3 rounded" />
                      <div className="skeleton h-2.5 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!carregando && (leads ?? []).length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhum lead ainda — faça sua primeira busca.
              </div>
            )}
            {(leads ?? []).slice(0, 5).map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setLeadAberto(lead)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-brand-500/[0.07] dark:hover:bg-brand-500/10"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-700 dark:text-brand-400 ring-1 ring-brand-500/25">
                  {initials(lead.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {lead.cidade || lead.address || '—'}
                  </span>
                </span>
                <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:block ${STATUS_META[lead.status].chip}`}>
                  {lead.status === 'NO_SITE' ? 'Sem website' : STATUS_META[lead.status].label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {leadAberto && <LeadDetailModal lead={leadAberto} onClose={() => setLeadAberto(null)} />}
    </div>
  );
}
