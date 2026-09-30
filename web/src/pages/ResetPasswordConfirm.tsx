import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import Logo from '../components/Logo.tsx';
import Spinner from '../components/ui/Spinner.tsx';

/**
 * Destino do link do email de recuperação (redirectTo).
 * O Supabase cria uma sessão de recuperação ao chegar aqui; então
 * pedimos a nova senha e chamamos updateUser.
 */
export default function ResetPasswordConfirm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-2xl font-bold text-white">Definir nova senha</h1>

          {done ? (
            <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-500">
              Senha atualizada. Redirecionando para o dashboard…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
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
                {submitting ? <Spinner size="sm" /> : 'Salvar nova senha'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm">
            <Link to="/login" className="text-slate-400 transition hover:text-brand-500">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
