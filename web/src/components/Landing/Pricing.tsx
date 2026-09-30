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

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '10$',
    period: 'por mês',
    credits: '100 pesquisas + 4 sites',
    perks: [
      'Busca por nicho + cidade',
      'Só empresas sem site, com telefone real',
      '4 sites gerados com IA',
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
      '15 sites gerados com IA',
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
      '35 sites gerados com IA',
      'Volume para equipes',
      'Suporte prioritário por WhatsApp',
    ],
  },
];

export default function Pricing() {
  return (
    <section id="precos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Preços simples</h2>
        <p className="mt-3 text-slate-400">
          Conta nova: 1 busca + 1 site grátis. Depois, escolha o plano — pagamento por Binance
          (USDT) ou PayPal, e o plano ativa sozinho.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card relative flex flex-col ${plan.highlight ? 'border-brand-500/40 bg-brand-500/[0.06] shadow-brand-500/10' : ''}`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-night-950">
                Mais popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-brand-500">{plan.credits}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-300">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                  {perk}
                </li>
              ))}
            </ul>
            <Link to="/registrar" className="btn-primary mt-6">
              Começar agora
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Pagamento automático: Binance (USDT, 0% de taxa) e PayPal — o plano ativa na hora.
      </p>
    </section>
  );
}
