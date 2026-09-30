import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';
import Spinner from '../ui/Spinner.tsx';
import { GRUPOS_NICHOS, TODOS_NICHOS } from '../../lib/nichos.ts';
import { paisDoTexto } from '../../lib/paises.ts';

interface SearchFormProps {
  credits: number;
  searching: boolean;
  onSubmit: (input: { niche: string; city: string; radiusKm: number | null }) => void;
}

export default function SearchForm({ credits, searching, onSubmit }: SearchFormProps) {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
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
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px]">
        <div>
          <label htmlFor="niche" className="mb-1.5 block text-sm font-medium text-slate-300">
            Nicho
          </label>
          <input
            id="niche"
            list="niche-suggestions"
            required
            minLength={2}
            className="input"
            placeholder="ex.: barbearia, pizzaria, imobiliária…"
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

        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-300">
            Cidade / País
          </label>
          <input
            id="city"
            required
            minLength={2}
            className="input"
            placeholder="ex.: Luanda, São Paulo, Brasil…"
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
          <label htmlFor="radius" className="mb-1.5 block text-sm font-medium text-slate-300">
            Raio (km) <span className="text-slate-600">opcional</span>
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
      </div>

      <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-slate-500">
          Só entram empresas <span className="text-slate-300">com telefone</span> e sem site · cada busca
          consome 1 crédito · exportar o CSV consome 3 créditos
        </p>
        {noCredits ? (
          <Link to="/dashboard/creditos" className="btn-primary">
            <Icon name="alert" className="h-4 w-4" />
            Sem créditos — fazer upgrade
          </Link>
        ) : (
          <button type="submit" disabled={searching} className="btn-primary">
            {searching ? (
              <>
                <Spinner size="sm" /> Buscando no Maps…
              </>
            ) : (
              'Buscar leads'
            )}
          </button>
        )}
      </div>
    </form>
  );
}
