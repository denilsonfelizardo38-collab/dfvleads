import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import Icon from '../../components/ui/Icon.tsx';
import Spinner from '../../components/ui/Spinner.tsx';
import { initials } from '../../lib/format.ts';
import type { Profile } from '../../types.ts';

interface PerfilPageProps {
  profile: Profile | null;
  onSaved: () => void;
}

const AVATAR_KEY = 'dfvleads:avatar';

/**
 * "Perfil": dados pessoais (nome editável no servidor, avatar local) e
 * resumo da conta — plano, créditos e consumo.
 */
export default function PerfilPage({ profile, onSaved }: PerfilPageProps) {
  const { toast } = useToast();
  const [nome, setNome] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNome(profile?.nome ?? '');
  }, [profile?.nome]);

  useEffect(() => {
    setAvatar(localStorage.getItem(AVATAR_KEY));
  }, []);

  const nomeExibicao = nome.trim() || profile?.email?.split('@')[0] || '—';

  function escolherFoto() {
    inputFile.current?.click();
  }

  function handleFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      toast('error', 'A imagem deve ter no máximo 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      localStorage.setItem(AVATAR_KEY, url);
      setAvatar(url);
      toast('success', 'Foto atualizada neste dispositivo.');
    };
    reader.readAsDataURL(file);
  }

  function removerFoto() {
    localStorage.removeItem(AVATAR_KEY);
    setAvatar(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      await api.atualizarPerfil(nome.trim());
      toast('success', 'Perfil atualizado!');
      onSaved();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="mt-1 text-sm text-slate-400">Os seus dados pessoais e conta.</p>
      </div>

      <form onSubmit={(evento) => void handleSubmit(evento)} className="card space-y-5">
        <h2 className="font-bold text-white">Dados pessoais</h2>

        <div className="flex flex-wrap items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-500/40" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-extrabold text-white ring-2 ring-brand-500/40">
              {initials(nomeExibicao)}
            </span>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={escolherFoto} className="btn-secondary px-3.5! py-2! text-xs">
              <Icon name="user" className="h-3.5 w-3.5" /> Alterar foto
            </button>
            {avatar && (
              <button
                type="button"
                onClick={removerFoto}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                Remover
              </button>
            )}
            <input
              ref={inputFile}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFoto}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-300">
              Nome
            </label>
            <input
              id="nome"
              className="input"
              value={nome}
              placeholder={profile?.email?.split('@')[0] ?? 'O seu nome'}
              onChange={(evento) => setNome(evento.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              className="input opacity-60"
              value={profile?.email ?? ''}
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? (
              <>
                <Spinner size="sm" /> Salvando…
              </>
            ) : (
              'Guardar alterações'
            )}
          </button>
        </div>
      </form>

      <div className="card space-y-3">
        <h2 className="font-bold text-white">Conta</h2>
        <dl className="space-y-2.5 text-sm">
          <Linha label="Plano atual" value={profile?.planoInfo?.nome ?? 'Gratuito (trial)'} />
          <Linha label="Créditos de busca" value={String(profile?.credits ?? '—')} />
          <Linha label="Buscas realizadas" value={String(profile?.totalSearches ?? 0)} />
          <Linha label="Leads coletados" value={String(profile?.totalLeads ?? 0)} />
          <Linha label="Sites gerados" value={String(profile?.sitesUsed ?? 0)} />
        </dl>
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Link to="/dashboard/planos" className="btn-primary flex-1 py-2! text-xs">
            Fazer Upgrade
          </Link>
          <Link to="/dashboard/configuracoes" className="btn-secondary flex-1 py-2! text-xs">
            Configurações
          </Link>
        </div>
      </div>
    </div>
  );
}

function Linha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}
