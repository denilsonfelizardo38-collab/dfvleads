import { NavLink } from 'react-router-dom';
import Icon, { type IconName } from '../ui/Icon.tsx';

interface SidebarLink {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const LINKS: SidebarLink[] = [
  { to: '/dashboard', label: 'Busca', icon: 'search', end: true },
  { to: '/dashboard/historico', label: 'Histórico', icon: 'clock' },
  { to: '/dashboard/planos', label: 'Planos', icon: 'sparkles' },
  { to: '/dashboard/creditos', label: 'Créditos', icon: 'credit' },
  { to: '/dashboard/configuracoes', label: 'Configurações', icon: 'sliders' },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const links = isAdmin
    ? [...LINKS, { to: '/dashboard/admin', label: 'Administração', icon: 'target' as const }]
    : LINKS;
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-night-900/80 p-2 md:sticky md:top-0 md:h-screen md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-500/15 text-brand-500'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon name={link.icon} className="h-4 w-4 shrink-0" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
