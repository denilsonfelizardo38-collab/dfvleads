import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { api } from '../../lib/api.ts';
import Logo from '../Logo.tsx';
import Icon from '../ui/Icon.tsx';
import { initials } from '../../lib/format.ts';
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

  const naoLidas = notificacoes.filter((notificacao) => !notificacao.read).length;

  async function handleMarcarLidas() {
    if (naoLidas === 0) return;
    try {
      await api.marcarLidas();
      setNotificacoes((lista) => lista.map((notificacao) => ({ ...notificacao, read: true })));
    } catch {
      toast('error', 'Não foi possível marcar as notificações.');
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const nome = (profile?.nome ?? '').trim() || profile?.email?.split('@')[0] || '—';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-[0_1px_16px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo apenas no mobile (desktop tem a logo na sidebar) */}
        <div className="md:hidden">
          <Logo to="/dashboard" />
        </div>

        {/* Créditos + sino + avatar */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {profile?.planoInfo && (
            <span className="hidden rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm sm:inline">
              {profile.planoInfo.nome}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <Icon name="credit" className="h-3.5 w-3.5 text-brand-600" />
            {profile?.credits ?? '—'}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAberto((valor) => !valor);
                if (!aberto) void handleMarcarLidas();
              }}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notificações"
            >
              <Icon name="bell" className="h-4.5 w-4.5" />
              {naoLidas > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {naoLidas}
                </span>
              )}
            </button>

            {aberto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
                <div className="animate-fade-up absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Notificações
                  </p>
                  <div className="max-h-72 overflow-y-auto">
                    {notificacoes.length === 0 && (
                      <p className="px-3 py-4 text-center text-xs text-slate-400">
                        Sem notificações.
                      </p>
                    )}
                    {notificacoes.map((notificacao) => (
                      <div
                        key={notificacao.id}
                        className={`rounded-xl px-3 py-2.5 ${notificacao.read ? 'opacity-60' : 'bg-slate-50'}`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{notificacao.titulo}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{notificacao.corpo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-extrabold text-white">
              {initials(nome)}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-slate-900">{nome}</p>
              <p className="max-w-36 truncate text-[11px] text-slate-500">{profile?.email ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Sair"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
