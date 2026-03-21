"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, Baby, Calendar } from 'lucide-react';
import { CSSBackground } from '@/components/ui/CSSBackground';

// ─── Setup Form — state isolation to prevent background re-renders ───────────

// ─── Setup Form — state isolation to prevent background re-renders ───────────
function SetupForm({ user }: { user: FirebaseUser | null }) {
  const router = useRouter();
  const [parentName, setParentName] = useState(user?.displayName || '');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'parents', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: parentName || 'Parent',
        childName,
        childAge: parseInt(childAge, 10),
        createdAt: Date.now()
      });
      router.push('/dashboard');
    } catch (err) {
      console.error("Setup failed", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg z-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400">
          Welcome to Kiddlr!
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Let&apos;s personalize the experience for you and your little one.
        </p>
      </div>

      <div className="bg-white/8 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Your Nickname</label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Mom, Dad, SuperParent"
                required
                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Child&apos;s Nickname</label>
              <div className="relative">
                <Baby size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Leo"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-center md:text-left">Child Age</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="Years"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 mt-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Profile...' : 'Go to Parent Dashboard'}
          </button>
        </form>
      </div>
      
      <p className="text-center text-slate-600 text-xs mt-8">
        We use this to customize the learning words for your child.
      </p>
    </div>
  );
}

// ─── Main Page Shell ────────────────────────────────────────────────────────
export default function SetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans flex items-center justify-center px-4">
      <CSSBackground />
      <SetupForm user={user} />
    </main>
  );
}
