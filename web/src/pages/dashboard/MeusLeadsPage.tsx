import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import LeadCards from '../../components/dashboard/LeadCards.tsx';
import LeadDetailModal from '../../components/dashboard/LeadDetailModal.tsx';
import LandingPageModal from '../../components/dashboard/LandingPageModal.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import type { Lead, LeadLista } from '../../types.ts';

type Filtro = 'todos' | 'NO_SITE' | 'SOCIAL_ONLY' | 'HAS_SITE';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'NO_SITE', label: 'Sem site' },
  { id: 'SOCIAL_ONLY', label: 'Só redes' },
  { id: 'HAS_SITE', label: 'Com site' },
];

/**
 * "Meus Leads": todos os leads coletados em qualquer busca, com filtro por
 * status e busca por nome — cada cartão abre o detalhe completo.
 */
export default function MeusLeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadLista[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [leadDetalhe, setLeadDetalhe] = useState<Lead | null>(null);
  const [leadParaSite, setLeadParaSite] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    api
      .meusLeads({ limite: 300 })
      .then((data) => {
        if (!cancelled) setLeads(data.leads);
      })
      .catch(() => {
        if (!cancelled) {
          toast('error', 'Falha ao carregar os seus leads.');
          setLeads([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtrados = useMemo(() => {
    const lista = leads ?? [];
    const termo = busca.trim().toLowerCase();
    return lista.filter((lead) => {
      if (filtro !== 'todos' && lead.status !== filtro) return false;
      if (termo && !lead.name.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [leads, filtro, busca]);

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus Leads</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Todos os leads encontrados nas suas buscas, num só lugar.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-night-900">
          {FILTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              aria-pressed={filtro === item.id}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filtro === item.id ? 'bg-brand-500/20 text-brand-700 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Procurar por nome…"
            className="input pl-9"
          />
        </div>
      </div>

      {!leads && (
        <div className="card flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <Spinner /> Carregando leads…
        </div>
      )}

      {leads && leads.length === 0 && (
        <div className="card text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Você ainda não tem leads — faça sua primeira busca para começar.
          </p>
        </div>
      )}

      {leads && leads.length > 0 && filtrados.length === 0 && (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum lead corresponde a este filtro.
        </div>
      )}

      {filtrados.length > 0 && (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filtrados.length} lead(s) · {selected.size} selecionado(s)
          </p>
          <LeadCards
            leads={filtrados}
            selected={selected}
            onToggle={toggle}
            onOpenDetail={setLeadDetalhe}
            onCriarSite={setLeadParaSite}
          />
        </>
      )}

      {leadDetalhe && <LeadDetailModal lead={leadDetalhe} onClose={() => setLeadDetalhe(null)} />}
      {leadParaSite && (
        <LandingPageModal lead={leadParaSite} onClose={() => setLeadParaSite(null)} />
      )}
    </div>
  );
}
