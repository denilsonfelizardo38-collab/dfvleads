import { Link } from 'react-router-dom';
import Navbar from '../components/Landing/Navbar.tsx';
import Footer from '../components/Landing/Footer.tsx';
import Icon from '../components/ui/Icon.tsx';

export default function Termos() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            DFVLeads · Última atualização: 11/10/2026
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Termos de Serviço
          </h1>
          <p className="mt-3 text-sm leading-relaxed">
            Estes Termos regulam o uso do DFVLeads, um SaaS de prospeção que ajuda a encontrar
            empresas sem website, contactá-las e gerar sites profissionais. Ao criar
            uma conta, o utilizador aceita estes Termos.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">1. Serviço e conta</h2>
          <p className="mt-2 text-sm leading-relaxed">
            O DFVLeads disponibiliza pesquisa de empresas, gestão de leads e geração de sites
            profissionais. A conta é pessoal e intransmissível. O utilizador é responsável por manter as suas
            credenciais em segurança e por toda a atividade realizada na sua conta.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">2. Período de teste</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Novas contas têm direito a um teste gratuito de 1 busca e 1 site gerado. O teste
            destina-se apenas à avaliação do serviço e não pode ser acumulado nem transferido.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">3. Planos e cotas</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os planos mensais são: Starter — 10 USD, Business — 30 USD e Agência — 75 USD. Cada
            plano inclui cotas de pesquisas e de sites válidas por 30 dias a contar da ativação.
            Créditos não utilizados expiram no fim do ciclo e não transitam para o mês seguinte,
            salvo indicação em contrário na página de preços.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">4. Pagamentos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os pagamentos são efetuados via Binance (USDT) e PayPal, com ativação automática após
            confirmação. O processamento é feito por esses prestadores; o DFVLeads não recolhe nem
            armazena dados de cartão.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">5. Reembolsos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Não há reembolso após o consumo de créditos do plano. Em caso de falha técnica
            comprovada que impeça o uso do serviço, o utilizador pode solicitar análise e eventual
            compensação em créditos ou reembolso proporcional.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">6. Uso aceitável</h2>
          <p className="mt-2 text-sm leading-relaxed">
            É proibido usar o DFVLeads para spam, assédio, fraude, extração abusiva de dados ou
            qualquer atividade ilegal. Contas que violem esta regra podem ser suspensas ou
            bloqueadas, sem direito a reembolso dos créditos já consumidos.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">7. Propriedade dos sites</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os sites gerados na sua conta pertencem ao cliente após o pagamento do plano que lhes dá
            origem. O DFVLeads mantém o direito de usar componentes genéricos e modelos internos,
            sem reproduzir conteúdos específicos de clientes.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">8. Suporte e contacto</h2>
          <p className="mt-2 text-sm leading-relaxed">
            O suporte é prestado via WhatsApp, através dos canais indicados no site. Esforçamo-nos
            por responder com brevidade em dias úteis.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">9. Alterações</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Estes Termos podem ser atualizados para refletir melhorias no serviço ou requisitos
            legais. A versão vigente estará sempre disponível nesta página.
          </p>

          <div className="mt-10 border-t border-slate-200 pt-6 text-sm">
            <Link to="/" className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700">
              <Icon name="arrow-left" className="h-4 w-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
