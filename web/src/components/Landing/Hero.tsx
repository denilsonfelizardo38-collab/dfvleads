import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';

export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      {/* brilhos de fundo verde/roxo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="animate-fade-up mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-brand-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Para Programadores e Vibe Coders
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
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
              Começar Agora
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
            <a href="#como-funciona" className="btn-secondary w-full sm:w-auto">
              Ver como funciona
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Pesquisa por cidade, bairro e nicho · Apenas empresas sem website · Contacto directo
            via WhatsApp
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs text-slate-600">
            Trial grátis: <span className="font-semibold text-slate-400">1 busca + 1 site</span> ao
            criar conta · Uma plataforma <span className="font-semibold text-slate-400">DFVCode</span> — Tecnologia &amp; Soluções
          </p>
        </div>

        {/* mockup do produto */}
        <div className="animate-fade-up animate-fade-up-2 mx-auto mt-14 max-w-4xl">
          <div className="card overflow-hidden p-0!">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-xs text-slate-500">dfvleads.dfvcode.com/dashboard</span>
            </div>
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Empresa</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Contato</th>
                  <th className="px-4 py-2.5 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-white/5">
                  <td className="px-4 py-2.5">
                    <span className="block font-medium text-white">Barbearia Navalha de Ouro</span>
                    <span className="text-[11px] text-slate-500">+244 923 000 111 · 4,8 (132)</span>
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">Luanda, Cazenga</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/15 px-2 py-1 text-[11px] font-bold text-brand-400">
                      Gerar site
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="px-4 py-2.5">
                    <span className="block font-medium text-white">Pizzaria Bella Massa</span>
                    <span className="text-[11px] text-slate-500">+351 912 345 678 · 4,5 (89)</span>
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">Lisboa, Alvalade</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/15 px-2 py-1 text-[11px] font-bold text-brand-400">
                      Gerar site
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">
                    <span className="block font-medium text-white">Auto Center Vieira</span>
                    <span className="text-[11px] text-slate-500">+55 11 4002 8922 · 4,9 (77)</span>
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">São Paulo, Moema</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-400">
                      Site pronto
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
