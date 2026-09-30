const FAQS = [
  {
    q: 'Como o DFVLeads sabe que a empresa não tem site?',
    a: 'Cruzamos os dados do Google Places: empresas com website registrado ficam de fora da lista. Você vê apenas negócios sem site — às vezes também os que só têm página de rede social, sinalizados como "Só redes".',
  },
  {
    q: 'Como funciona a criação automática de sites?',
    a: 'Para cada lead sem site, um clique gera uma landing page premium com os dados reais da empresa (nome, telefone, endereço, avaliações do Google), botões de ligar e WhatsApp, animações e SEO local. O código é seu: baixe em ZIP e hospede onde quiser.',
  },
  {
    q: 'O que são créditos de busca?',
    a: 'Cada busca consome 1 crédito — trazendo 5 ou 50 leads, o custo é o mesmo. Exportar o CSV dos leads consome 3 créditos. Leads que você já viu em buscas anteriores voltam a aparecer sem custo extra.',
  },
  {
    q: 'A geração de site custa créditos extras?',
    a: 'Não. Gerar, visualizar e baixar as landing pages dos seus leads é ilimitado dentro do seu plano — o crédito é apenas pelas buscas e pela exportação de CSV.',
  },
  {
    q: 'Posso exportar os leads?',
    a: 'Sim. Selecione as linhas na tabela (ou todas) e baixe um CSV pronto para Excel ou Google Sheets, com nome, telefone, endereço e status. A exportação consome 3 créditos, independentemente do volume.',
  },
  {
    q: 'Quais formas de pagamento?',
    a: 'Binance (USDT, sem taxa) e PayPal, com ativação automática do plano assim que o pagamento confirma. Também aceitamos confirmação manual por WhatsApp.',
  },
  {
    q: 'Serve para quem?',
    a: 'Agências web, designers, gestores de tráfego e consultores que querem uma lista de prospects com dor real — e entregam o site antes mesmo da primeira reunião.',
  },
];

export default function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Perguntas frequentes</h2>
      <div className="mt-10 space-y-3">
        {FAQS.map((faq) => (
          <details key={faq.q} className="card group p-0!">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span className="text-brand-500 transition group-open:rotate-45">＋</span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
