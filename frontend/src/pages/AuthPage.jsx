import { useState } from 'react';
import { api } from '../services/api';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { onAuth(await (mode === 'login' ? api.login(form) : api.register(form))); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const field = 'w-full rounded border border-line bg-white px-3 py-2';
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="bg-ink text-white p-8 md:p-14 flex flex-col justify-between">
        <p className="text-xl font-semibold tracking-wide">E.D.I.T.H.</p>
        <div className="py-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-md">
            See what your apps do with the access you gave them.
          </h1>
          <p className="mt-5 text-white/70 max-w-sm">
            A calculator that asks for your contacts gets noticed here, scored, and flagged for you to restrict.
          </p>
        </div>
        <p className="text-sm text-white/50">All activity in this prototype is simulated.</p>
      </section>
      <section className="p-8 md:p-14 flex items-center">
        <form onSubmit={submit} className="w-full max-w-sm mx-auto space-y-4">
          <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
          {mode === 'register' && (
            <label className="block text-sm font-medium">Name
              <input className={`${field} mt-1`} value={form.name} onChange={set('name')} required />
            </label>
          )}
          <label className="block text-sm font-medium">Email
            <input type="email" className={`${field} mt-1`} value={form.email} onChange={set('email')} required />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" minLength={10} maxLength={72} className={`${field} mt-1`} value={form.password} onChange={set('password')} required />
          </label>
          {error && <p role="alert" className="text-danger text-sm">{error}</p>}
          <button disabled={busy} className="w-full rounded bg-signal text-white py-2 font-medium disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" className="text-sm text-signal underline"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
