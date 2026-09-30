import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import SearchForm from '../../components/dashboard/SearchForm.tsx';
import LeadsTable from '../../components/dashboard/LeadsTable.tsx';
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

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const currentLeads = state.phase === 'result' ? state.leads : [];
    setSelected((current) =>
      current.size === currentLeads.length ? new Set() : new Set(currentLeads.map((lead) => lead.id)),
    );
  }

  async function handleExport() {
    if (state.phase !== 'result') return;
    const ids = selected.size > 0 ? [...selected] : state.leads.map((lead) => lead.id);
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
        <h1 className="text-2xl font-bold text-white">Buscar leads</h1>
        <p className="mt-1 text-sm text-slate-400">
          Empresas sem site no Google Maps — e o site de cada uma, gerado com um clique.
        </p>
      </div>

      <SearchForm
        credits={profile?.credits ?? 0}
        searching={state.phase === 'loading'}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Total" value={state.summary.total} />
              <Stat label="Sem site" value={state.summary.noSite} tone="text-red-300" />
              <Stat label="Só redes" value={state.summary.socialOnly} tone="text-amber-300" />
              <Stat label="Tem site" value={state.summary.hasSite} tone="text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                −{state.creditsUsed} crédito de busca · {profile?.credits ?? '?'} restante(s)
              </span>
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

          {state.summary.aviso && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90">
              <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-300" />
              <p>{state.summary.aviso}</p>
            </div>
          )}

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

          <LeadsTable
            leads={state.leads}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onCriarSite={setLeadParaSite}
          />
        </div>
      )}

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
