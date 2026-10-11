import { Link } from 'react-router-dom';
import Logo from '../Logo.tsx';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#topo" className="transition hover:text-white">Início</a>
          <a href="#como-funciona" className="transition hover:text-white">Recursos</a>
          <a href="#precos" className="transition hover:text-white">Preços</a>
          <a href="#faq" className="transition hover:text-white">Sobre</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
            Entrar
          </Link>
          <Link to="/registrar" className="btn-primary whitespace-nowrap px-4! py-2! text-xs sm:text-sm">
            <span className="sm:hidden">Registar</span>
            <span className="hidden sm:inline">Registar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
