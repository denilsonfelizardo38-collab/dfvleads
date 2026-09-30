import Navbar from '../components/Landing/Navbar.tsx';
import Hero from '../components/Landing/Hero.tsx';
import HowItWorks from '../components/Landing/HowItWorks.tsx';
import Pricing from '../components/Landing/Pricing.tsx';
import Faq from '../components/Landing/Faq.tsx';
import Footer from '../components/Landing/Footer.tsx';
import { isSupabaseConfigured } from '../lib/supabase.ts';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {!isSupabaseConfigured && (
        <div className="bg-brand-500/15 px-4 py-2 text-center text-xs text-brand-400">
          Modo visualização: crie o <code className="font-mono">web/.env</code> com as chaves do
          Supabase (veja o README) para ativar login e buscas.
        </div>
      )}
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
