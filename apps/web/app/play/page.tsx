"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { KeyboardZone } from '@/components/play/KeyboardZone';
import { DrawCanvas } from '@/components/play/DrawCanvas';
import { BubbleGame } from '@/components/play/BubbleGame';
import { StarGame } from '@/components/play/StarGame';
import { WordAssocGame } from '@/components/play/WordAssocGame';
import { AnimalSoundsGame } from '@/components/play/AnimalSoundsGame';
import { OppositeGame } from '@/components/play/OppositeGame';
import { EmojiGame } from '@/components/play/EmojiGame';
import { BottomNav } from '@/components/ui/BottomNav';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';



export default function PlayPage() {
  const mode = useAppStore((state) => state.mode);
  const router = useRouter();
  const [showGate, setShowGate] = React.useState(false);
  const [gateAnswer, setGateAnswer] = React.useState('');
  const [gateQuestion, setGateQuestion] = React.useState({ a: 0, b: 0 });

  const startGate = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setGateQuestion({ a, b });
    setGateAnswer('');
    setShowGate(true);
  };

  const checkGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(gateAnswer) === gateQuestion.a + gateQuestion.b) {
      router.push('/dashboard');
    } else {
      alert("Oops! Ask a grown-up for help! ❤️");
      setShowGate(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <BackgroundEffects />

      
      {/* Mode Content */}
      <div className="w-full h-full">
        {mode === 'keyboard' && <KeyboardZone />}
        {mode === 'draw' && <DrawCanvas />}
        {mode === 'bubbles' && <BubbleGame />}
        {mode === 'stars' && <StarGame />}
        {mode === 'word-assoc' && <WordAssocGame />}
        {mode === 'animal-sounds' && <AnimalSoundsGame />}
        {mode === 'opposite' && <OppositeGame />}
        {mode === 'emoji' && <EmojiGame />}
      </div>

      {/* Navigation */}
      <BottomNav />
      
      {/* Visual Overlays (e.g. settings button top right) */}
      <button 
        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-3xl text-white/40 transition-all z-50 backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95 flex items-center gap-2"
        onClick={startGate}
        title="Parent Portal"
      >
        <span className="text-white text-xl">🔒</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Grown-ups</span>
      </button>

      {/* Parent Gate Modal */}
      {showGate && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white/10 border border-white/20 p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6 uppercase italic">Parent Gate</h3>
            <p className="text-slate-400 font-bold mb-8">What is {gateQuestion.a} + {gateQuestion.b}?</p>
            <form onSubmit={checkGate} className="space-y-6">
              <input 
                autoFocus
                type="number"
                value={gateAnswer}
                onChange={e => setGateAnswer(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-2xl px-6 py-4 text-center text-4xl font-black text-sky-400 focus:outline-none focus:border-sky-500 transition-all"
              />
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowGate(false)}
                  className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-sky-500 hover:text-white transition-all"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
