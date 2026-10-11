import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';
import Spinner from '../ui/Spinner.tsx';
import { GRUPOS_NICHOS, TODOS_NICHOS } from '../../lib/nichos.ts';
import { paisDoTexto } from '../../lib/paises.ts';

interface SearchFormProps {
  credits: number;
  searching: boolean;
  /** Mantém a lista só com empresas sem site (padrão do produto). */
  apenasSemSite: boolean;
  onToggleApenasSemSite: (valor: boolean) => void;
  onSubmit: (input: { niche: string; city: string; radiusKm: number | null }) => void;
}

export default function SearchForm({
  credits,
  searching,
  apenasSemSite,
  onToggleApenasSemSite,
  onSubmit,
}: SearchFormProps) {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const noCredits = credits <= 0;

  const paisDetectado = useMemo(() => paisDoTexto(city), [city]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (searching || noCredits) return;
    onSubmit({
      niche: niche.trim(),
      city: city.trim(),
      radiusKm: radiusKm ? Number(radiusKm) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-600">
            Cidade / Bairro
          </label>
          <input
            id="city"
            required
            minLength={2}
            className="input"
            placeholder="ex.: Nampula, Luanda, Bairro Central…"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          {paisDetectado && (
            <div className="mt-2">
              <label htmlFor="division" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {paisDetectado.rotuloDivisao} de {paisDetectado.nome}
              </label>
              <select
                id="division"
                className="input"
                value=""
                onChange={(event) => {
                  if (event.target.value) setCity(`${event.target.value}, ${paisDetectado.nome}`);
                }}
              >
                <option value="">Escolher {paisDetectado.rotuloDivisao.toLowerCase()}…</option>
                {paisDetectado.divisoes.map((divisao) => (
                  <option key={divisao} value={divisao}>
                    {divisao}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!paisDetectado && (
            <datalist id="city-suggestions">
              {['Brasil', 'Angola', 'Moçambique', 'Portugal', 'Cabo Verde', 'São Tomé e Príncipe', 'Guiné-Bissau', 'Timor-Leste'].map((pais) => (
                <option key={pais} value={pais} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label htmlFor="niche" className="mb-1.5 block text-sm font-medium text-slate-600">
            Nicho de negócio
          </label>
          <input
            id="niche"
            list="niche-suggestions"
            required
            minLength={2}
            className="input"
            placeholder="ex.: restaurante, barbearia, pizzaria…"
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
          />
          <datalist id="niche-suggestions">
            {TODOS_NICHOS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          {niche.trim().length >= 2 && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              {(() => {
                const grupo = GRUPOS_NICHOS.find((g) =>
                  g.nichos.some((n) => n.toLowerCase() === niche.trim().toLowerCase()),
                );
                return grupo ? `Categoria: ${grupo.categoria}` : 'Nicho livre — a IA analisa qualquer negócio';
              })()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 select-none">
          <button
            type="button"
            role="switch"
            aria-checked={apenasSemSite}
            onClick={() => onToggleApenasSemSite(!apenasSemSite)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              apenasSemSite ? 'bg-brand-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                apenasSemSite ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
          Apenas empresas sem site
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltrosAbertos((valor) => !valor)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <Icon name="filter" className="h-4 w-4" />
            Filtros avançados
            <Icon
              name="arrow-right"
              className={`h-3 w-3 transition ${filtrosAbertos ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>
          {noCredits ? (
            <Link to="/dashboard/creditos" className="btn-primary">
              <Icon name="alert" className="h-4 w-4" />
              Sem créditos — upgrade
            </Link>
          ) : (
            <button type="submit" disabled={searching} className="btn-primary">
              {searching ? (
                <>
                  <Spinner size="sm" /> Buscando…
                </>
              ) : (
                <>
                  Pesquisar <Icon name="search" className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {filtrosAbertos && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="radius" className="mb-1.5 block text-sm font-medium text-slate-600">
                Raio de busca (km) <span className="text-slate-400">opcional</span>
              </label>
              <input
                id="radius"
                type="number"
                min={1}
                max={500}
                className="input"
                placeholder="—"
                value={radiusKm}
                onChange={(event) => setRadiusKm(event.target.value)}
              />
            </div>
            <p className="self-end pb-2 text-xs text-slate-500">
              Só entram empresas <span className="text-slate-600">com telefone</span> e sem site ·
              cada busca consome 1 crédito · exportar o CSV consome 3 créditos
            </p>
          </div>
        </div>
      )}
      {!filtrosAbertos && (
        <p className="mt-4 text-xs text-slate-500">
          Só entram empresas <span className="text-slate-600">com telefone</span> e sem site · cada
          busca consome 1 crédito · exportar o CSV consome 3 créditos
        </p>
      )}
    </form>
  );
}
