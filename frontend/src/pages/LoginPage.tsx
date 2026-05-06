import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-panel-base flex flex-col items-center justify-center px-4">

      {/* Logo / branding */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/logo.png" alt="SurfGuru" className="h-20 w-auto rounded-xl shadow-md" />
        <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-white tracking-wide">
          Dashboard Pro
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-panel-border bg-panel-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-semibold text-ink-primary">
          Entrar
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-panel-border bg-panel-base px-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-secondary">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-panel-border bg-panel-base px-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-ink-muted">Uso interno — SurfGuru</p>
    </div>
  );
}
