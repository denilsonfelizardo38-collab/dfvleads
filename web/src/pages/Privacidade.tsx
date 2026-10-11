import { Link } from 'react-router-dom';
import Navbar from '../components/Landing/Navbar.tsx';
import Footer from '../components/Landing/Footer.tsx';

export default function Privacidade() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            DFVLeads · Última atualização: 11/10/2026
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm leading-relaxed">
            Esta Política explica que dados o DFVLeads recolhe, como os usa e quais são os seus
            direitos. Usamos os dados apenas para prestar e melhorar o serviço.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">1. Dados que recolhemos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Recolhemos: email e nome fornecidos no registo; histórico de buscas efetuadas; leads
            guardados; e sites gerados pela sua conta. Não recolhemos dados sensíveis além do
            necessário ao funcionamento do serviço.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">2. Autenticação</h2>
          <p className="mt-2 text-sm leading-relaxed">
            A autenticação é gerida via Supabase, que armazena credenciais e sessões de forma
            segura. Nunca partilhe a sua senha; a equipa do DFVLeads nunca a solicitará.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">3. Pagamentos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os pagamentos são processados por PayPal e Binance. Não guardamos dados de cartão nem
            credenciais desses serviços — apenas o registo mínimo da transação necessário para
            ativar o seu plano.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">4. Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Usamos apenas cookies essenciais ao funcionamento (sessão e segurança) e a preferência
            de tema (claro/escuro). Não usamos cookies de publicidade de terceiros.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">5. Partilha de dados</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Não vendemos os seus dados. Partilhamos apenas o estritamente necessário com os
            prestadores que operam o serviço (alojamento, autenticação e pagamentos), sujeitos a
            obrigações de confidencialidade.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">6. Os seus direitos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Tem direito a aceder, corrigir e apagar os seus dados pessoais. Para exercer estes
            direitos, envie um pedido por email a partir do endereço da sua conta e responderemos
            com brevidade razoável.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">7. Contacto</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para questões de privacidade ou pedidos relacionados com dados, contacte-nos via
            WhatsApp através dos canais indicados no site.
          </p>

          <div className="mt-10 border-t border-slate-200 pt-6 text-sm">
            <Link to="/" className="font-medium text-emerald-600 hover:text-emerald-700">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
