import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { formatDate } from '../../lib/format.ts';
import Spinner from '../../components/ui/Spinner.tsx';
import Icon from '../../components/ui/Icon.tsx';
import type { SearchRecord } from '../../types.ts';

interface HistoryPageProps {
  onOpen: (search: SearchRecord) => void;
}

export default function HistoryPage({ onOpen }: HistoryPageProps) {
  const { toast } = useToast();
  const [searches, setSearches] = useState<SearchRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .history()
      .then((data) => {
        if (!cancelled) setSearches(data.searches);
      })
      .catch(() => {
        if (!cancelled) {
          toast('error', 'Falha ao carregar histórico.');
          setSearches([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de buscas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reabra qualquer resultado anterior — reabrir é sempre grátis.
        </p>
      </div>

      {searches === null ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Carregando…
        </div>
      ) : searches.length === 0 ? (
        <div className="card text-center">
          <p className="text-slate-500">Você ainda não fez buscas.</p>
          <Link to="/dashboard/pesquisar" className="btn-primary mt-4">
            Fazer primeira busca
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {searches.map((search) => (
            <li key={search.id}>
              <button
                type="button"
                onClick={() => onOpen(search)}
                className="card flex w-full items-center justify-between gap-4 text-left transition hover:border-brand-500/30 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {search.niche} <span className="text-slate-500">em</span> {search.city}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(search.createdAt)}
                    {search.radiusKm ? ` · raio ${search.radiusKm} km` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {search.leadCount} leads
                  </span>
                  <Icon name="arrow-right" className="h-4 w-4 text-brand-500" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
