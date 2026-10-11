import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import SearchForm from '../../components/dashboard/SearchForm.tsx';
import LeadsTable from '../../components/dashboard/LeadsTable.tsx';
import LeadCards from '../../components/dashboard/LeadCards.tsx';
import LeadDetailModal from '../../components/dashboard/LeadDetailModal.tsx';
import LandingPageModal from '../../components/dashboard/LandingPageModal.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import type { Lead, Profile, SearchRecord, SearchSummary } from '../../types.ts';

interface SearchPageProps {
  profile: Profile | null;
  onCreditsChange: (credits: number) => void;
  preloadedSearch: SearchRecord | null;
  onPreloadConsumed: () => void;
}

type State =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'result'; search: SearchRecord; summary: SearchSummary; leads: Lead[]; creditsUsed: number }
  | { phase: 'blocked'; message: string; billable?: number }
  | { phase: 'error'; message: string };

type Ordenacao = 'recentes' | 'nome' | 'avaliacao';
type Vista = 'cartoes' | 'tabela';

export default function SearchPage({
  profile,
  onCreditsChange,
  preloadedSearch,
  onPreloadConsumed,
}: SearchPageProps) {
  const { toast } = useToast();
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [leadParaSite, setLeadParaSite] = useState<Lead | null>(null);
  const [leadDetalhe, setLeadDetalhe] = useState<Lead | null>(null);
  const [apenasSemSite, setApenasSemSite] = useState(true);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recentes');
  const [vista, setVista] = useState<Vista>('cartoes');

  // Reabre um resultado do histórico (via link do Histórico).
  useEffect(() => {
    if (!preloadedSearch) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.leads(preloadedSearch.id);
        if (cancelled) return;
        setState({
          phase: 'result',
          search: data.search,
          summary: {
            total: data.leads.length,
            newLeads: data.leads.filter((lead) => !lead.seen).length,
            alreadySeen: data.leads.filter((lead) => lead.seen).length,
            noSite: data.leads.filter((lead) => lead.status === 'NO_SITE').length,
            socialOnly: data.leads.filter((lead) => lead.status === 'SOCIAL_ONLY').length,
            hasSite: data.leads.filter((lead) => lead.status === 'HAS_SITE').length,
          },
          leads: data.leads,
          creditsUsed: 0,
        });
        setSelected(new Set());
      } catch {
        if (!cancelled) toast('error', 'Não foi possível reabrir essa busca.');
      } finally {
        onPreloadConsumed();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preloadedSearch, onPreloadConsumed, toast]);

  const handleSearch = useCallback(
    async (input: { niche: string; city: string; radiusKm: number | null }) => {
      setState({ phase: 'loading' });
      setSelected(new Set());
      try {
        const data = await api.search(input);
        onCreditsChange(data.creditsRemaining);
        setState({
          phase: 'result',
          search: data.search,
          summary: data.summary,
          leads: data.leads,
          creditsUsed: data.creditsUsed,
        });
        toast(
          'success',
          `${data.summary.total} leads encontrados · ${data.creditsUsed} crédito de busca usado`,
        );
      } catch (error) {
        if (error instanceof ApiError && error.needUpgrade) {
          setState({ phase: 'blocked', message: error.message });
        } else {
          const message = error instanceof Error ? error.message : 'Falha na busca.';
          setState({ phase: 'error', message });
          toast('error', message);
        }
      }
    },
    [onCreditsChange, toast],
  );

  /** Leads visíveis: filtro "apenas sem site" + ordenação escolhida. */
  const leadsVisiveis = useMemo(() => {
    if (state.phase !== 'result') return [];
    const lista = apenasSemSite
      ? state.leads.filter((lead) => lead.status !== 'HAS_SITE')
      : [...state.leads];
    switch (ordenacao) {
      case 'nome':
        return lista.sort((a, b) => a.name.localeCompare(b.name, 'pt'));
      case 'avaliacao':
        return lista.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      default:
        return lista;
    }
  }, [state, apenasSemSite, ordenacao]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExport() {
    if (state.phase !== 'result') return;
    const ids = selected.size > 0 ? [...selected] : leadsVisiveis.map((lead) => lead.id);
    if (ids.length === 0) {
      toast('error', 'Nenhum lead visível para exportar.');
      return;
    }
    if ((profile?.credits ?? 0) < 3) {
      toast('error', 'Exportar o CSV consome 3 créditos — você não tem saldo suficiente.');
      return;
    }
    setExporting(true);
    try {
      const blob = await api.exportCsv(ids);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `dfvleads-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast('success', `CSV exportado com ${ids.length} lead(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao exportar CSV.';
      toast('error', message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pesquisar Leads</h1>
        <p className="mt-1 text-sm text-slate-400">
          Encontre empresas que não têm website.
        </p>
      </div>

      <SearchForm
        credits={profile?.credits ?? 0}
        searching={state.phase === 'loading'}
        apenasSemSite={apenasSemSite}
        onToggleApenasSemSite={setApenasSemSite}
        onSubmit={(input) => void handleSearch(input)}
      />

      {state.phase === 'loading' && (
        <div className="card flex items-center gap-3 text-sm text-slate-400">
          <Spinner /> Varrendo o Google Maps por empresas sem site…
        </div>
      )}

      {state.phase === 'blocked' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-200">
            <Icon name="alert" className="h-5 w-5" /> Saldo insuficiente
          </h2>
          <p className="mt-2 text-sm text-amber-100/80">{state.message}</p>
          <Link to="/dashboard/planos" className="btn-primary mt-4">
            Ver planos
          </Link>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          {state.message}
        </div>
      )}

      {state.phase === 'result' && (
        <div className="animate-fade-up space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Total" value={state.summary.total} />
            <Stat label="Sem site" value={state.summary.noSite} tone="text-red-300" />
            <Stat label="Só redes" value={state.summary.socialOnly} tone="text-amber-300" />
            <Stat label="Tem site" value={state.summary.hasSite} tone="text-slate-400" />
          </div>

          {state.summary.aviso && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90">
              <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-300" />
              <p>{state.summary.aviso}</p>
            </div>
          )}

          {/* Cabeçalho dos resultados: contagem + ordenação + vista + export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-white">Resultados ({leadsVisiveis.length})</h2>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                Ordenar:
                <select
                  value={ordenacao}
                  onChange={(evento) => setOrdenacao(evento.target.value as Ordenacao)}
                  className="rounded-lg border border-white/10 bg-night-800 px-2 py-1.5 text-xs text-slate-300 focus:border-brand-500 focus:outline-none"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="nome">Nome (A–Z)</option>
                  <option value="avaliacao">Melhor avaliação</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-500 sm:inline">
                −{state.creditsUsed} crédito · {profile?.credits ?? '?'} restante(s)
              </span>
              <div className="flex rounded-lg border border-white/10 bg-night-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setVista('cartoes')}
                  aria-pressed={vista === 'cartoes'}
                  className={`rounded-md p-1.5 transition ${vista === 'cartoes' ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500 hover:text-white'}`}
                  aria-label="Vista em cartões"
                >
                  <Icon name="template" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVista('tabela')}
                  aria-pressed={vista === 'tabela'}
                  className={`rounded-md p-1.5 transition ${vista === 'tabela' ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500 hover:text-white'}`}
                  aria-label="Vista em tabela"
                >
                  <Icon name="layout" className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting}
                className="btn-secondary px-3.5! py-2! text-xs"
              >
                {exporting ? 'Exportando…' : 'Exportar CSV'}
                {!exporting && <Icon name="download" className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Busca “{state.search.niche}” em “{state.search.city}”
            {state.search.radiusKm ? ` · raio ${state.search.radiusKm} km` : ''} ·{' '}
            {state.summary.alreadySeen > 0
              ? `${state.summary.alreadySeen} já visto(s) não cobrado(s)`
              : 'nenhum lead repetido'}
            {state.summary.ignoradasComSite
              ? ` · ${state.summary.ignoradasComSite} com site ignoradas`
              : ''}
            {state.summary.ignoradasSemTelefone
              ? ` · ${state.summary.ignoradasSemTelefone} sem telefone ignoradas`
              : ''}
          </p>

          {leadsVisiveis.length === 0 ? (
            <div className="card text-center text-sm text-slate-400">
              Nenhum lead corresponde ao filtro atual.
              {apenasSemSite && state.summary.hasSite > 0 && (
                <button
                  type="button"
                  onClick={() => setApenasSemSite(false)}
                  className="ml-1 font-semibold text-brand-400 hover:text-brand-500"
                >
                  Mostrar os {state.summary.hasSite} com site
                </button>
              )}
            </div>
          ) : vista === 'cartoes' ? (
            <LeadCards
              leads={leadsVisiveis}
              selected={selected}
              onToggle={toggle}
              onOpenDetail={setLeadDetalhe}
              onCriarSite={setLeadParaSite}
            />
          ) : (
            <LeadsTable
              leads={leadsVisiveis}
              selected={selected}
              onToggle={toggle}
              onToggleAll={() =>
                setSelected((current) =>
                  current.size === leadsVisiveis.length
                    ? new Set()
                    : new Set(leadsVisiveis.map((lead) => lead.id)),
                )
              }
              onCriarSite={setLeadParaSite}
            />
          )}
        </div>
      )}

      {leadDetalhe && <LeadDetailModal lead={leadDetalhe} onClose={() => setLeadDetalhe(null)} />}
      {leadParaSite && (
        <LandingPageModal lead={leadParaSite} onClose={() => setLeadParaSite(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'text-white' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-night-800/70 px-3.5 py-2.5">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
