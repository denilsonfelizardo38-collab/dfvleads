import type { Profile } from '../../types.ts';

interface SettingsPageProps {
  profile: Profile | null;
}

export default function SettingsPage({ profile }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="mt-1 text-sm text-slate-400">Sua conta e preferências.</p>
      </div>

      <div className="card space-y-4">
        <Row label="Email" value={profile?.email ?? '—'} />
        <Row label="Plano" value={(profile?.plan ?? '—').toUpperCase()} />
        <Row label="Créditos restantes" value={String(profile?.credits ?? '—')} />
        <Row label="Buscas realizadas" value={String(profile?.totalSearches ?? 0)} />
        <Row label="Leads coletados" value={String(profile?.totalLeads ?? 0)} />
      </div>

      <div className="card">
        <h2 className="font-semibold text-white">Preferências</h2>
        <p className="mt-2 text-sm text-slate-400">
          Notificações por email, integração com CRM e API pública chegam nas próximas versões.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
