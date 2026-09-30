import { Link } from 'react-router-dom';
import Logo from '../Logo.tsx';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#como-funciona" className="transition hover:text-white">Como funciona</a>
          <a href="#precos" className="transition hover:text-white">Preços</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
          <a
            href="https://denilsonfelizardo38-collab.github.io/DFVCode/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            DFVCode
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
            Entrar
          </Link>
          <Link to="/registrar" className="btn-primary whitespace-nowrap px-4! py-2! text-xs sm:text-sm">
            <span className="sm:hidden">Criar conta</span>
            <span className="hidden sm:inline">Criar conta grátis</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
