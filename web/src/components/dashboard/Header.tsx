import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { api } from '../../lib/api.ts';
import Logo from '../Logo.tsx';
import Icon from '../ui/Icon.tsx';
import type { Notificacao, Profile } from '../../types.ts';

interface HeaderProps {
  profile: Profile | null;
}

export default function Header({ profile }: HeaderProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      try {
        const dados = await api.notificacoes();
        if (vivo) setNotificacoes(dados.notificacoes);
      } catch {
        // silencioso: sininho é secundário
      }
    };
    void carregar();
    const intervalo = setInterval(carregar, 60_000);
    return () => {
      vivo = false;
      clearInterval(intervalo);
    };
  }, []);

  async function abrirSininho() {
    setAberto((valor) => !valor);
    if (!aberto && notificacoes.some((n) => !n.read)) {
      try {
        await api.marcarLidas();
        setNotificacoes((atuais) => atuais.map((n) => ({ ...n, read: true })));
      } catch {
        // ignora
      }
    }
  }

  async function handleLogout() {
    await signOut();
    toast('info', 'Sessão encerrada.');
    navigate('/', { replace: true });
  }

  const creditos = profile?.credits ?? 0;
  const naoLidas = notificacoes.filter((n) => !n.read).length;
  const plano = profile?.planoAtivo ? profile?.planoInfo ?? null : null;
  // Sem plano pago: trial de conta nova = 1 site grátis.
  const sitesRestantes = plano
    ? Math.max(0, plano.sites - (profile?.sitesUsed ?? 0))
    : Math.max(0, 1 - (profile?.sitesUsed ?? 0));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-night-950/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <Logo to="/dashboard" />
      </div>

      <div className="hidden md:block">
        <p className="text-sm text-slate-400">
          <span className={`font-bold ${creditos > 0 ? 'text-brand-500' : 'text-red-400'}`}>
            {creditos} {creditos === 1 ? 'busca' : 'buscas'}
          </span>
          <span className="text-slate-500">
            {' '}
            · <span className="font-bold text-white">{sitesRestantes}</span>{' '}
            {sitesRestantes === 1 ? 'site restante' : 'sites restantes'}
            {plano ? '' : ' (trial)'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${creditos > 0 ? 'bg-brand-500/15 text-brand-500' : 'bg-red-500/15 text-red-400'}`}
        >
          {creditos} buscas
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => void abrirSininho()}
            className="relative rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Notificações"
          >
            <Icon name="alert" className="h-4.5 w-4.5" />
            {naoLidas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {naoLidas}
              </span>
            )}
          </button>
          {aberto && (
            <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-2xl border border-white/10 bg-night-900 shadow-2xl">
              <p className="border-b border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Notificações
              </p>
              <div className="max-h-80 overflow-y-auto">
                {notificacoes.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">Nada por aqui ainda.</p>
                )}
                {notificacoes.map((n) => (
                  <div key={n.id} className={`border-b border-white/5 px-4 py-3 ${n.read ? '' : 'bg-brand-500/5'}`}>
                    <p className="text-sm font-bold text-white">{n.titulo}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{n.corpo}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className="hidden text-xs text-slate-500 sm:block">{profile?.email}</span>
        <button type="button" onClick={handleLogout} className="btn-secondary px-3.5! py-2! text-xs">
          Sair
        </button>
      </div>
    </header>
  );
}
