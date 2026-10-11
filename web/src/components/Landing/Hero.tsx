import { Link } from 'react-router-dom';
import Icon, { type IconName } from '../ui/Icon.tsx';

/** Pins verdes posicionados sobre o mapa do mockup. */
const PINS = [
  { left: '22%', top: '34%' },
  { left: '46%', top: '58%' },
  { left: '63%', top: '28%' },
  { left: '76%', top: '64%' },
  { left: '35%', top: '74%' },
];

/** Etiquetas flutuantes ao redor do mockup (como na imagem showcase). */
const BADGES: { icon: IconName; label: string; pos: string }[] = [
  { icon: 'users', label: 'Mais clientes', pos: '-left-5 top-14' },
  { icon: 'layout', label: 'Mais projetos', pos: '-right-5 top-28' },
  { icon: 'sparkles', label: 'Mais liberdade', pos: 'left-10 -bottom-6' },
];

export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      {/* brilhos de fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="animate-fade-up mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-brand-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Para Programadores e Vibe Coders
          </span>

          <h1 className="font-display mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Encontre empresas{' '}
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              que precisam de um site.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            O DFVLeads ajuda-o a encontrar empresas que ainda não têm website, para que possa
            oferecer os seus serviços e gerar rendimento a partir do que sabe fazer — programar.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/registrar" className="btn-primary w-full sm:w-auto">
              Vamos Começar
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
            <a href="#como-funciona" className="btn-secondary-dark w-full sm:w-auto">
              Ver como funciona
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Pesquisa por cidade, bairro e nicho · Apenas empresas sem website · Contacto directo
            via WhatsApp
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs text-slate-600">
            Trial grátis:{' '}
            <span className="font-semibold text-slate-400">1 busca + 1 site</span> ao criar conta
          </p>
        </div>

        {/* mockup: mapa com pins + etiquetas flutuantes */}
        <div className="animate-fade-up animate-fade-up-2 relative mx-auto mt-16 max-w-4xl">
          <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-brand-500/20 via-brand-500/5 to-transparent blur-2xl" />
          <div className="card-dark relative overflow-hidden p-0! ring-1 ring-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-xs text-slate-500">dfvleads.app/pesquisar</span>
            </div>

            {/* mapa estilizado com pins de leads */}
            <div className="relative h-64 overflow-hidden bg-night-900 sm:h-80">
              <svg
                viewBox="0 0 800 400"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden
                className="absolute inset-0 h-full w-full"
              >
                {/* quarteirões */}
                <rect width="800" height="400" fill="var(--color-night-900)" />
                <g fill="var(--color-night-800)">
                  <rect x="30" y="30" width="180" height="110" rx="8" />
                  <rect x="240" y="30" width="230" height="70" rx="8" />
                  <rect x="500" y="30" width="130" height="130" rx="8" />
                  <rect x="660" y="30" width="110" height="90" rx="8" />
                  <rect x="30" y="170" width="120" height="90" rx="8" />
                  <rect x="180" y="180" width="200" height="120" rx="8" />
                  <rect x="420" y="150" width="90" height="150" rx="8" />
                  <rect x="540" y="200" width="230" height="100" rx="8" />
                  <rect x="30" y="290" width="240" height="80" rx="8" />
                  <rect x="300" y="330" width="180" height="40" rx="8" />
                  <rect x="510" y="330" width="260" height="40" rx="8" />
                </g>
                {/* avenidas */}
                <g stroke="var(--color-night-600)" strokeWidth="10" strokeLinecap="round">
                  <path d="M0 155 H800" />
                  <path d="M0 315 H800" />
                  <path d="M225 0 V400" />
                  <path d="M520 0 V400" />
                </g>
                {/* parque */}
                <rect x="660" y="150" width="110" height="120" rx="10" fill="rgba(34,197,94,0.10)" />
                <text
                  x="715"
                  y="215"
                  textAnchor="middle"
                  fill="rgba(74,222,128,0.55)"
                  fontSize="13"
                  fontFamily="system-ui, sans-serif"
                >
                  Parque
                </text>
              </svg>

              {/* pins de leads */}
              {PINS.map((pin, index) => (
                <span
                  key={`${pin.left}-${pin.top}`}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ left: pin.left, top: pin.top }}
                >
                  <svg
                    viewBox="0 0 24 32"
                    aria-hidden
                    className={`h-8 w-6 drop-shadow-lg drop-shadow-black/50 ${
                      index === 1 ? 'animate-pulse' : ''
                    }`}
                  >
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12c0 8.4 10.6 19.2 11.06 19.66a1.7 1.7 0 0 0 1.88 0C13.4 31.2 24 20.4 24 12 24 5.37 18.63 0 12 0Z"
                      fill="#22c55e"
                    />
                    <circle cx="12" cy="12" r="4.4" fill="#fff" />
                  </svg>
                </span>
              ))}

              {/* painel lateral do mapa (contagem de leads) */}
              <div className="absolute left-3 top-3 hidden rounded-xl border border-white/10 bg-night-950/85 px-3.5 py-2.5 backdrop-blur sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Resultados
                </p>
                <p className="text-lg font-extrabold text-white">50 leads</p>
                <p className="text-[11px] font-semibold text-brand-400">sem website</p>
              </div>
            </div>
          </div>

          {/* etiquetas flutuantes */}
          {BADGES.map((badge, i) => (
            <div
              key={badge.label}
              style={{ animationDelay: `${i * 1.2}s` }}
              className={`animate-float absolute hidden items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-2xl shadow-brand-500/10 ring-1 ring-black/5 backdrop-blur sm:flex ${badge.pos}`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 text-brand-600">
                <Icon name={badge.icon} className="h-4 w-4" />
              </span>
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
