import { Link } from 'react-router-dom';
import Logo from '../Logo.tsx';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-night-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-500">
            Encontre empresas sem site no Google Maps, gere o site delas e transforme cada lead em
            cliente.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">Produto</h3>
          <ul className="mt-3 space-y-2 text-slate-500">
            <li><a href="#como-funciona" className="transition hover:text-slate-300">Como funciona</a></li>
            <li><a href="#precos" className="transition hover:text-slate-300">Preços</a></li>
            <li><a href="#faq" className="transition hover:text-slate-300">FAQ</a></li>
            <li>
              <a
                href="https://denilsonfelizardo38-collab.github.io/DFVCode/"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-slate-300"
              >
                DFVCode
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">Conta</h3>
          <ul className="mt-3 space-y-2 text-slate-500">
            <li><Link to="/login" className="transition hover:text-slate-300">Entrar</Link></li>
            <li><Link to="/registrar" className="transition hover:text-slate-300">Criar conta grátis</Link></li>
            <li><Link to="/recuperar" className="transition hover:text-slate-300">Recuperar senha</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} DFVLeads · Feito para quem vende sites a quem ainda não tem um.
      </div>
    </footer>
  );
}
