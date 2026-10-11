import { NavLink } from 'react-router-dom';
import Logo from '../Logo.tsx';
import Icon, { type IconName } from '../ui/Icon.tsx';
import type { Profile } from '../../types.ts';

interface SidebarLink {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

/** Itens principais do painel (mesma ordem do layout DFVLeads). */
const LINKS: SidebarLink[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/dashboard/pesquisar', label: 'Pesquisar Leads', icon: 'search' },
  { to: '/dashboard/leads', label: 'Meus Leads', icon: 'users' },
  { to: '/dashboard/websites', label: 'Websites', icon: 'layout' },
  { to: '/dashboard/templates', label: 'Templates', icon: 'template' },
  { to: '/dashboard/mensagens', label: 'Mensagens', icon: 'message' },
  { to: '/dashboard/perfil', label: 'Perfil', icon: 'user' },
  { to: '/dashboard/configuracoes', label: 'Configurações', icon: 'sliders' },
];

/** Links secundários — funcionalidades existentes mantidas acessíveis. */
const LINKS_SECUNDARIOS: SidebarLink[] = [
  { to: '/dashboard/historico', label: 'Histórico', icon: 'clock' },
  { to: '/dashboard/creditos', label: 'Créditos', icon: 'credit' },
  { to: '/dashboard/planos', label: 'Planos', icon: 'sparkles' },
];

interface SidebarProps {
  isAdmin?: boolean;
  profile?: Profile | null;
}

export default function Sidebar({ isAdmin = false, profile = null }: SidebarProps) {
  const links = isAdmin
    ? [...LINKS_SECUNDARIOS, { to: '/dashboard/admin', label: 'Administração', icon: 'target' as const }]
    : LINKS_SECUNDARIOS;

  const planoAtivo = profile?.planoAtivo ? profile.planoInfo : null;
  const pesquisasUsadas = profile?.searchesUsed ?? 0;
  const pesquisasTotal = planoAtivo?.pesquisas ?? 50;
  const rotuloPlano = planoAtivo ? planoAtivo.nome : 'Plano Gratuito';

  function itemClass(isActive: boolean, claro = false): string {
    if (isActive) {
      return 'flex shrink-0 items-center gap-3 rounded-xl bg-gradient-to-r from-brand-400 to-brand-500 px-3.5 py-2.5 text-sm font-semibold text-night-950 shadow-md shadow-brand-500/25 transition';
    }
    return `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      claro
        ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;
  }

  return (
    <>
      {/* ── Desktop: coluna fixa à esquerda ─────────────────────────── */}
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-night-900/60 md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <Logo to="/dashboard" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Menu
          </p>
          <div className="space-y-1">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => itemClass(isActive)}>
                <Icon name={link.icon} className="h-4 w-4 shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </div>

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Conta
          </p>
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => itemClass(isActive)}>
                <Icon name={link.icon} className="h-4 w-4 shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Cartão de plano + upgrade (rodapé do menu) */}
        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-500/60 via-white/10 to-transparent p-px shadow-lg shadow-black/30">
            <div className="rounded-[11px] bg-night-800 p-3.5">
              <p className="text-xs font-bold text-white">{rotuloPlano}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {pesquisasUsadas} / {pesquisasTotal} pesquisas
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.7)] transition-all"
                  style={{ width: `${Math.min(100, (pesquisasUsadas / Math.max(1, pesquisasTotal)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <NavLink to="/dashboard/planos" className="btn-primary mt-3 w-full">
            Fazer Upgrade
          </NavLink>
        </div>
      </nav>

      {/* ── Mobile: barra horizontal rolável no topo ────────────────── */}
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 md:hidden">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => itemClass(isActive, true)}>
            <Icon name={link.icon} className="h-4 w-4 shrink-0" />
            {link.label}
          </NavLink>
        ))}
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => itemClass(isActive, true)}>
            <Icon name={link.icon} className="h-4 w-4 shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
