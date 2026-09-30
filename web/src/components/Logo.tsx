import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold tracking-tight text-white">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="text-lg">
        DFV
        <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          Leads
        </span>
      </span>
    </Link>
  );
}
