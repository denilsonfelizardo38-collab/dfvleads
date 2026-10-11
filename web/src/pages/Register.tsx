import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import Logo from '../components/Logo.tsx';
import Spinner from '../components/ui/Spinner.tsx';

export default function Register() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { needsEmailConfirm } = await signUp(email.trim(), password);
      if (needsEmailConfirm) {
        toast('info', 'Conta criada! Confirme seu email para entrar.');
        navigate('/login', { replace: true });
      } else {
        toast('success', 'Conta criada — você tem 1 busca + 1 site grátis!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Falha ao criar conta.');
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
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Criar conta grátis</h1>
          <p className="mt-1 text-sm text-slate-400">
            1 busca + 1 site grátis para encontrar seus primeiros clientes sem site.
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
                minLength={6}
                autoComplete="new-password"
                className="input-dark"
                placeholder="mínimo 6 caracteres"
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
              {submitting ? <Spinner size="sm" /> : 'Criar conta grátis'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-brand-400 transition hover:text-brand-500">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
