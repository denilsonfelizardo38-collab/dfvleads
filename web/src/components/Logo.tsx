import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-extrabold tracking-tight text-white">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 shadow-lg shadow-brand-500/25">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6" />
        </svg>
      </span>
      <span className="text-lg">DFVLeads</span>
    </Link>
  );
}
