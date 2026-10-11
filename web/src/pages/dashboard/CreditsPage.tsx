import { Link } from 'react-router-dom';
import type { Profile } from '../../types.ts';

interface CreditsPageProps {
  profile: Profile | null;
}

export default function CreditsPage({ profile }: CreditsPageProps) {
  const plano = profile?.planoAtivo ? profile.planoInfo ?? null : null;
  const sitesRestantes = plano
    ? Math.max(0, plano.sites - (profile?.sitesUsed ?? 0))
    : Math.max(0, 1 - (profile?.sitesUsed ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Créditos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cada busca consome 1 crédito — não importa quantos leads encontre. Cada site gerado (ou
          regenerado) consome 1 site da cota do plano.
        </p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Saldo de buscas</p>
          <p className="text-4xl font-extrabold text-slate-900">
            {profile?.credits ?? '—'} <span className="text-base font-medium text-slate-500">créditos</span>
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>
            Plano:{' '}
            <span className="font-semibold uppercase text-brand-700">
              {plano ? plano.nome : 'Trial (sem plano pago)'}
            </span>
          </p>
          <p className="mt-1">
            {sitesRestantes} {sitesRestantes === 1 ? 'site restante' : 'sites restantes'} ·{' '}
            {profile?.totalSearches ?? 0} buscas feitas · {profile?.totalLeads ?? 0} leads coletados
          </p>
          {profile?.planExpires && plano && (
            <p className="mt-1">
              Válido até <b className="text-slate-900">{new Date(profile.planExpires).toLocaleDateString('pt-BR')}</b>
            </p>
          )}
        </div>
      </div>

      {!plano && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800">
          Você está no trial: 1 busca + 1 site grátis. Assine um plano para continuar gerando sites.
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Planos disponíveis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Starter 10$ (100 pesquisas + 4 sites) · Business 30$ (200 + 15) · Agência 75$ (600 + 35).
          Pagamento por Binance (USDT) ou PayPal, com ativação automática.
        </p>
        <Link to="/dashboard/planos" className="btn-primary mt-4">
          Ver planos e assinar
        </Link>
      </div>
    </div>
  );
}
