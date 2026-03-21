"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import { Palette, Keyboard, Star, LineChart } from 'lucide-react';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function LandingPage() {
  const router = useRouter();
  const [isLogged, setIsLogged] = React.useState(false);

  React.useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setIsLogged(!!user);
    });
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      <BackgroundEffects />
      
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-screen text-center">
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
            Kiddlr
          </h1>
          <p className="text-xl md:text-3xl text-slate-300 font-medium mb-12 max-w-3xl leading-relaxed">
            The magical, safe, and ad-free interactive playground built to spark your child&apos;s imagination.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-24 w-full px-4 sm:px-0 justify-center">
            <button 
              onClick={() => router.push('/play')}
              className="px-8 sm:px-12 py-5 sm:py-6 text-xl sm:text-2xl font-black bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(14,165,233,0.5)] border-4 border-white/20 w-full sm:w-auto"
            >
              Start Playing
            </button>
            <button 
              onClick={() => router.push(isLogged ? '/dashboard' : '/login')}
              className="px-8 sm:px-12 py-5 sm:py-6 text-xl sm:text-2xl font-bold bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/10 w-full sm:w-auto"
            >
              {isLogged ? 'Go to Dashboard' : 'Parent Portal'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-5xl">
            <FeatureCard 
              icon={<Palette size={40} className="text-amber-400" />}
              title="Magic Canvas"
              description="Draw, stamp stickers, and paint with glowing rainbow colors."
            />
            <FeatureCard 
              icon={<Keyboard size={40} className="text-sky-400" />}
              title="Musical Keyboard"
              description="Learn to type while creating beautiful generative music."
            />
            <FeatureCard 
              icon={<Star size={40} className="text-emerald-400" />}
              title="Mini Games"
              description="Pop bubbles and catch falling stars to improve hand-eye coordination."
            />
            <FeatureCard 
              icon={<LineChart size={40} className="text-rose-400" />}
              title="Parent Dashboard"
              description="Sync progress to the cloud and track your child's creative journey."
            />
          </div>

        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors flex flex-col items-center text-center group">
      <div className="mb-6 p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
