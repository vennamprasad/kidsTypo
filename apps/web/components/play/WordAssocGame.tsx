"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { audioManager } from '@/lib/audio';
import { useAppStore } from '@/store/useAppStore';
import { usePixiApp } from '@/hooks/usePixiApp';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { speechManager } from '@/lib/speech';

const ROOT_WORDS = ['COW', 'CAR', 'SUN', 'DOG', 'CAT', 'BED', 'RED', 'SEA', 'TREE', 'BOOK'];

export const WordAssocGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const session = useAppStore((state) => state.session);
  const incrementStat = useAppStore((state) => state.incrementStat);

  const [rootWord, setRootWord] = useState('');
  const [validAssocs, setValidAssocs] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const incrementStatRef = useRef(incrementStat);
  const rootWordRef = useRef(rootWord);
  const validAssocsRef = useRef(validAssocs);
  const currentAttemptRef = useRef(currentAttempt);

  const setAttemptState = (val: string) => {
    setCurrentAttempt(val);
    currentAttemptRef.current = val;
  };

  useEffect(() => { incrementStatRef.current = incrementStat; }, [incrementStat]);
  useEffect(() => { rootWordRef.current = rootWord; }, [rootWord]);
  useEffect(() => { validAssocsRef.current = validAssocs; }, [validAssocs]);

  const loadNewWord = async () => {
    setIsLoading(true);
    const newRoot = ROOT_WORDS[Math.floor(Math.random() * ROOT_WORDS.length)];
    setRootWord(newRoot);
    setAttemptState('');
    
    // Announce the new challenge
    speechManager.speak(`Type a word related to ${newRoot}`);

    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_trg=${newRoot}&max=100`);
      const data = await res.json() as Array<{ word: string }>;
      const assocs = data
        .map((item) => item.word.toUpperCase())
        .filter((w: string) => /^[A-Z]+$/.test(w) && w.length >= 2 && w.length <= 8 && w !== newRoot);
        
      setValidAssocs(assocs);
    } catch (e) {
      console.error("Failed to fetch associations", e);
      const fb = ['FARM', 'MILK', 'MOO', 'GRASS'];
      setValidAssocs(fb);
    }
    setIsLoading(false);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!rootWord) {
      loadNewWord();
    }
  }, [rootWord]);
  /* eslint-enable react-hooks/exhaustive-deps */

  usePixiApp({
    containerRef,
    onInit: (app: PIXI.Application) => {
      const createBurst = (text: string, x: number, y: number, color = '#ffffff', scaleMult = 1) => {
        if (!app.stage) return;
        const style = new PIXI.TextStyle({
          fontFamily: ['"Bubblegum Sans"', 'Arial', 'sans-serif'],
          fontSize: 100 * scaleMult,
          fontWeight: 'bold',
          fill: color,
          stroke: { color: '#4a1850', width: 6, join: 'round' },
        });

        const richText = new PIXI.Text({ text, style });
        richText.anchor.set(0.5);
        richText.x = x;
        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(richText);

          let elapsed = 0;
          const tick = (ticker: PIXI.Ticker) => {
            if (richText.destroyed || (app as unknown as { destroyed: boolean }).destroyed || !app.stage || app.stage.destroyed) {
              app.ticker.remove(tick);
              return;
            }
            elapsed += ticker.deltaTime;
            richText.alpha -= 0.02 * ticker.deltaTime;
            richText.scale.set(1 + elapsed * 0.01 * scaleMult);
            
            if (richText.alpha <= 0) {
              app.ticker.remove(tick);
              if (richText.parent) richText.parent.removeChild(richText);
              if (!richText.destroyed) richText.destroy();
            }
          };
          app.ticker.add(tick);
        }
      };

      const createConfetti = () => {
         for(let i=0; i<40; i++) {
           setTimeout(() => {
             const cx = app.screen.width / 2 + (Math.random() - 0.5) * 800;
             const cy = app.screen.height / 2 + (Math.random() - 0.5) * 800;
             const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff'];
             createBurst('✨', cx, cy, colors[Math.floor(Math.random() * colors.length)], 0.8);
           }, i * 30);
         }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (!app.stage) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        
        if (e.key === 'Backspace') {
           if (currentAttemptRef.current.length > 0) {
             const newVal = currentAttemptRef.current.slice(0, -1);
             setAttemptState(newVal);
             audioManager.playKey('A');
           }
           return;
        }

        const char = e.key.toUpperCase();
        if (char.length !== 1 || !/^[A-Z]$/.test(char)) return;

        if (!rootWordRef.current || validAssocsRef.current.length === 0) return;
        
        if (validAssocsRef.current.includes(currentAttemptRef.current)) return;
        
        const marginX = Math.min(app.screen.width * 0.2, 160);
        const marginY = Math.min(app.screen.height * 0.2, 160);
        const cx = marginX + Math.random() * (app.screen.width - 2 * marginX);
        const cy = marginY + Math.random() * (app.screen.height - 2 * marginY);

        createBurst(char, cx, cy, '#38bdf8', 1.0); // Sky blue
        audioManager.playKey(char);
        incrementStatRef.current('keyPresses');
        
        const newAttempt = currentAttemptRef.current + char;
        
        if (validAssocsRef.current.includes(newAttempt)) {
           setAttemptState(newAttempt);
           createConfetti();
           audioManager.playKey('C4'); // Success chord roughly
           speechManager.speak("Great job!");
           setTimeout(() => {
              setRootWord(''); 
           }, 2500);
        } else {
           if (newAttempt.length > 8) {
              createBurst('Try Again!', app.screen.width/2, app.screen.height/2, '#ff4d4d', 1.5);
              setAttemptState('');
           } else {
              setAttemptState(newAttempt);
           }
        }
      };

      window.addEventListener('keydown', onKeyDown);

      (app as PIXI.Application & { _keyboardCleanup?: () => void })._keyboardCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    },
    onCleanup: (app: PIXI.Application) => {
      if ((app as PIXI.Application & { _keyboardCleanup?: () => void })._keyboardCleanup) {
        (app as PIXI.Application & { _keyboardCleanup?: () => void })._keyboardCleanup!();
      }
    }
  });

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center">
      <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 flex gap-4 items-center">
        <span className="text-2xl font-black text-white drop-shadow-md">⌨️ {session.keyPresses}</span>
      </div>

      <div className="absolute top-6 z-10 flex flex-col items-center gap-2 max-w-[90vw]">
        <div className="flex gap-2 p-3 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl items-center text-white font-bold text-xl px-8">
           <Play className="mr-2" /> Word Association
        </div>
      </div>

      <div className="absolute top-40 z-10 flex flex-col items-center mt-8 w-full px-4">
        { rootWord && (
           <div className="mb-4 text-center">
             <div className="text-xl text-sky-200 font-bold mb-2 uppercase tracking-widest">Type a word related to</div>
             <div className="px-10 py-4 bg-sky-500 text-white rounded-[40px] text-5xl md:text-7xl font-black border-4 border-sky-300 shadow-[0_0_40px_rgba(14,165,233,0.5)] animate-pulse">
               {rootWord}
             </div>
           </div>
        )}

        <div className="flex gap-3 mt-8 items-center justify-center flex-wrap max-w-4xl min-h-[120px]">
          {isLoading ? (
            <div className="w-40 h-16 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white font-black text-2xl animate-pulse">
              Loading...
            </div>
          ) : rootWord ? (
              Array.from({ length: Math.min(8, currentAttempt.length + 1) }).map((_, i) => {
                const char = currentAttempt[i];
                const isCurrent = i === currentAttempt.length;
                const isDone = validAssocs.includes(currentAttempt);
                
                return (
                  <div key={i} className={cn(
                    "w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-black transition-all duration-300 border-4 shadow-2xl font-mono",
                    isDone ? "bg-emerald-400 text-white border-emerald-300 scale-110 opacity-100 shadow-[0_0_50px_rgba(52,211,153,0.8)]" :
                    char ? "bg-sky-400 text-white border-sky-300 scale-100" :
                    isCurrent ? "bg-white/20 backdrop-blur-md text-white/50 border-white/60 animate-pulse border-dashed" :
                    "bg-white/10 backdrop-blur-md text-white/30 border-white/20 border-dashed"
                  )}>
                    {char || "_"}
                  </div>
                )
              })
          ) : null}
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full absolute inset-0 z-1" />
    </div>
  );
};
