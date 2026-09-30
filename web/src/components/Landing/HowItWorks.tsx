import Icon, { type IconName } from '../ui/Icon.tsx';

interface Passo {
  icon: IconName;
  title: string;
  text: string;
}

const STEPS: Passo[] = [
  {
    icon: 'search',
    title: '1. Busque por nicho e cidade',
    text: 'Barbearias em Luanda, dentistas em Lisboa — o DFVLeads varre o Google Maps e mostra apenas as empresas SEM site.',
  },
  {
    icon: 'sparkles',
    title: '2. Gere o site de cada lead',
    text: 'Um clique cria uma landing page premium com os dados reais da empresa: telefone, endereço, avaliações e botões de contato.',
  },
  {
    icon: 'message',
    title: '3. Entregue e feche o cliente',
    text: 'Baixe o código em ZIP e use a mensagem de WhatsApp pronta para abordar o dono. Você vende o site que já está feito.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-white/5 bg-night-900/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-slate-400">
            Da lista de prospects ao site entregue — o funil completo em uma plataforma.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((passo) => (
            <div key={passo.title} className="card">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                <Icon name={passo.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{passo.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{passo.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
