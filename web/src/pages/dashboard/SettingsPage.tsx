import { useEffect, useState } from 'react';
import type { Profile } from '../../types.ts';

interface SettingsPageProps {
  profile: Profile | null;
}

interface Preferencias {
  notificarEmail: boolean;
  notificarWhatsapp: boolean;
}

const PREFS_KEY = 'dfvleads:preferencias';
const PREFS_PADRAO: Preferencias = { notificarEmail: true, notificarWhatsapp: false };

function carregarPrefs(): Preferencias {
  try {
    return { ...PREFS_PADRAO, ...(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Preferencias>) };
  } catch {
    return PREFS_PADRAO;
  }
}

/**
 * "Configurações": conta + preferências de notificação (guardadas neste
 * dispositivo) — mesmos controlos do layout DFVLeads.
 */
export default function SettingsPage({ profile }: SettingsPageProps) {
  const [prefs, setPrefs] = useState<Preferencias>(() => carregarPrefs());

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  function alternar(chave: keyof Preferencias) {
    setPrefs((current) => ({ ...current, [chave]: !current[chave] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="mt-1 text-sm text-slate-400">Sua conta e preferências.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Conta</h2>
        <Row label="Email" value={profile?.email ?? '—'} />
        <Row label="Plano" value={(profile?.planoInfo?.nome ?? profile?.plan ?? '—').toString()} />
        <Row label="Créditos restantes" value={String(profile?.credits ?? '—')} />
        <Row label="Buscas realizadas" value={String(profile?.totalSearches ?? 0)} />
        <Row label="Leads coletados" value={String(profile?.totalLeads ?? 0)} />
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Preferências</h2>
        <Toggle
          label="Receber notificações por email"
          checked={prefs.notificarEmail}
          onChange={() => alternar('notificarEmail')}
        />
        <Toggle
          label="Receber notificações no WhatsApp"
          checked={prefs.notificarWhatsapp}
          onChange={() => alternar('notificarWhatsapp')}
        />
        <p className="text-xs text-slate-500">
          As preferências ficam guardadas neste dispositivo.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0 select-none">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? 'bg-brand-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}
