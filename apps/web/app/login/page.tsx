"use client";

import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { CSSBackground } from '@/components/ui/CSSBackground';

// ─── Form — all state here, never re-renders parent ─────────────────────────

// ─── Form — all state here, never re-renders parent ─────────────────────────
function LoginForm() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const routeAfterLogin = async (uid: string) => {
    const snap = await getDoc(doc(db, 'parents', uid));
    router.push(snap.exists() ? '/dashboard' : '/setup');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = tab === 'signin'
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      await routeAfterLogin(cred.user.uid);
    } catch (err) {
      setError((err as Error).message
        .replace('Firebase: ', '')
        .replace(/\(auth.*?\)\.?/, '')
        .trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await routeAfterLogin(cred.user.uid);
    } catch (err) {
      setError((err as Error).message
        .replace('Firebase: ', '')
        .replace(/\(auth.*?\)\.?/, '')
        .trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400">
          Kiddlr
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Parent Portal — Track your child&apos;s learning
        </p>
      </div>

      <div className="bg-white/8 border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Tabs */}
        <div className="flex bg-black/30 rounded-2xl p-1 mb-7 border border-white/10">
          {(['signin', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 mb-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:border-sky-500/60"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:border-sky-500/60"
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:border-sky-500/60"
            />
          </div>

          {error && (
            <p className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(14,165,233,0.35)] text-base"
          >
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6">
        Your data is private and never shared.
      </p>
    </div>
  );
}

// ─── Page shell — zero state ─────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      <CSSBackground />

      <div className="relative z-10 w-full h-full overflow-y-auto flex items-center justify-center px-4">
        <button
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <LoginForm />
      </div>
    </main>
  );
}
