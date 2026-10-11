import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import Logo from '../components/Logo.tsx';
import Spinner from '../components/ui/Spinner.tsx';

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      toast('success', 'Bem-vindo de volta!');
      navigate('/dashboard', { replace: true });
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Falha ao entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* brilhos de fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
      </div>

      <div className="animate-fade-up relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card-dark border-white/10 bg-night-900/80 p-6! shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur sm:p-7!">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Entrar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Entre no seu painel de leads e sites.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input-dark"
                placeholder="voce@agencia.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input-dark"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Spinner size="sm" /> : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/recuperar" className="text-slate-400 transition hover:text-brand-400">
              Esqueci a senha
            </Link>
            <Link to="/registrar" className="font-medium text-brand-400 transition hover:text-brand-500">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
