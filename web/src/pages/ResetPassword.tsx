import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import Logo from '../components/Logo.tsx';
import Spinner from '../components/ui/Spinner.tsx';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const redirectTo = `${window.location.origin}/reset-confirm`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enviaremos um link de redefinição para o seu email.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-500">
              Link enviado. Verifique sua caixa de entrada (e o spam).
            </div>
          ) : (
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
                  className="input"
                  placeholder="voce@agencia.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Spinner size="sm" /> : 'Enviar link de recuperação'}
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
