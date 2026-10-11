import Icon, { type IconName } from '../ui/Icon.tsx';

interface Passo {
  icon: IconName;
  title: string;
  text: string;
}

const STEPS: Passo[] = [
  {
    icon: 'search',
    title: '1. Pesquise',
    text: 'Defina a cidade, bairro e nicho de negócio que deseja — barbearias em Luanda, dentistas em Lisboa.',
  },
  {
    icon: 'target',
    title: '2. Descubra',
    text: 'Veja empresas que ainda não têm website, com telefone real, endereço e avaliações do Google Maps.',
  },
  {
    icon: 'message',
    title: '3. Contacte',
    text: 'Faça contacto directo com os dados dos negócios via WhatsApp, telefone ou ligação — com mensagem pronta.',
  },
  {
    icon: 'sparkles',
    title: '4. Converta',
    text: 'Apresente o site profissional gerado com um clique e transforme cada lead num cliente pagante.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Como funciona?
          </h2>
          <p className="mt-3 text-slate-500">
            Do mapa ao cliente em quatro passos — feito para quem programa.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`animate-fade-up animate-fade-up-${index + 1} rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500/40 hover:shadow-md`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
                <Icon name={step.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
