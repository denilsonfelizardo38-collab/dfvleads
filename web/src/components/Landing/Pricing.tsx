import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';

interface Plan {
  name: string;
  price: string;
  period: string;
  credits: string;
  perks: string[];
  highlight?: boolean;
}

/**
 * Preços/nomes reais do billing (server/src/env.ts) — apenas o visual
 * segue a imagem showcase (secção branca, cartão Pro em destaque).
 */
const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '10$',
    period: 'por mês',
    credits: '100 pesquisas + 4 sites',
    perks: [
      'Busca por nicho + cidade',
      'Só empresas sem site, com telefone real',
      '4 sites profissionais',
      'Publicação com link próprio',
    ],
  },
  {
    name: 'Business',
    price: '30$',
    period: 'por mês',
    credits: '200 pesquisas + 15 sites',
    perks: [
      'Tudo do Starter',
      '15 sites profissionais',
      'Exportação CSV completa',
      'Publicação com link próprio',
    ],
    highlight: true,
  },
  {
    name: 'Agência',
    price: '75$',
    period: 'por mês',
    credits: '600 pesquisas + 35 sites',
    perks: [
      'Tudo do Business',
      '35 sites profissionais',
      'Volume para equipes',
      'Suporte prioritário por WhatsApp',
    ],
  },
];

export default function Pricing() {
  return (
    <section id="precos" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Escolha o plano
          </h2>
          <p className="mt-3 text-slate-500">
            O mais indicado para o seu crescimento. Conta nova: 1 busca + 1 site grátis. Pagamento
            por Binance (USDT) ou PayPal — e o plano ativa sozinho.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 transition hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-brand-500 shadow-[0_24px_70px_-20px_rgba(34,197,94,0.45)] ring-2 ring-brand-500/50 lg:scale-[1.04]'
                  : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                  Mais popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-700">{plan.credits}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                    {perk}
                  </li>
                ))}
              </ul>
              {plan.highlight ? (
                <Link to="/registrar" className="btn-primary mt-6">
                  Começar agora
                </Link>
              ) : (
                <Link
                  to="/registrar"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Começar agora
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Pagamento automático: Binance (USDT, 0% de taxa) e PayPal — o plano ativa na hora.
        </p>
      </div>
    </section>
  );
}
