"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { audioManager } from '@/lib/audio';
import { useAppStore } from '@/store/useAppStore';
import { usePixiApp } from '@/hooks/usePixiApp';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import { speechManager } from '@/lib/speech';

const EMOJI_MAP: Record<string, string[]> = {
  '🍎': ['APPLE'],
  '🚗': ['CAR'],
  '🌞': ['SUN'],
  '🐶': ['DOG'],
  '🐈': ['CAT'],
  '🏠': ['HOUSE', 'HOME'],
  '🌲': ['TREE'],
  '⭐': ['STAR'],
  '🌧️': ['RAIN'],
  '🌊': ['WATER', 'WAVE', 'SEA'],
  '👑': ['CROWN', 'KING'],
  '🚀': ['ROCKET', 'SHIP'],
  '🎂': ['CAKE'],
  '🍓': ['STRAWBERRY'],
  '🍉': ['WATERMELON'],
  '🦋': ['BUTTERFLY']
};

const EMOJIS = Object.keys(EMOJI_MAP);

export const EmojiGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const session = useAppStore((state) => state.session);
  const incrementStat = useAppStore((state) => state.incrementStat);

  const [currentEmoji, setCurrentEmoji] = useState('');
  const [validWords, setValidWords] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState('');

  const incrementStatRef = useRef(incrementStat);
  const currentEmojiRef = useRef(currentEmoji);
  const validWordsRef = useRef(validWords);
  const currentAttemptRef = useRef(currentAttempt);

  const setAttemptState = (val: string) => {
    setCurrentAttempt(val);
    currentAttemptRef.current = val;
  };

  useEffect(() => { incrementStatRef.current = incrementStat; }, [incrementStat]);
  useEffect(() => { currentEmojiRef.current = currentEmoji; }, [currentEmoji]);
  useEffect(() => { validWordsRef.current = validWords; }, [validWords]);

  const loadNewEmoji = () => {
    let nextEmoji = currentEmoji;
    while (nextEmoji === currentEmoji && EMOJIS.length > 1) {
      nextEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    }
    setCurrentEmoji(nextEmoji);
    setValidWords(EMOJI_MAP[nextEmoji]);
    setAttemptState('');
    
    speechManager.speak("Type what you see");
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!currentEmoji) {
      loadNewEmoji();
    }
  }, [currentEmoji]);
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
         for(let i=0; i<30; i++) {
           setTimeout(() => {
             const cx = app.screen.width / 2 + (Math.random() - 0.5) * 800;
             const cy = app.screen.height / 2 + (Math.random() - 0.5) * 800;
             const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff'];
             // Burst with the current emoji!
             createBurst(currentEmojiRef.current, cx, cy, colors[Math.floor(Math.random() * colors.length)], 0.7);
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

        if (!currentEmojiRef.current || validWordsRef.current.length === 0) return;
        
        if (validWordsRef.current.includes(currentAttemptRef.current)) return;
        
        const marginX = Math.min(app.screen.width * 0.2, 160);
        const marginY = Math.min(app.screen.height * 0.2, 160);
        const cx = marginX + Math.random() * (app.screen.width - 2 * marginX);
        const cy = marginY + Math.random() * (app.screen.height - 2 * marginY);

        createBurst(char, cx, cy, '#ec4899', 1.0); // Pink
        audioManager.playKey(char);
        incrementStatRef.current('keyPresses');
        
        const newAttempt = currentAttemptRef.current + char;
        
        if (validWordsRef.current.includes(newAttempt)) {
           setAttemptState(newAttempt);
           createConfetti();
           audioManager.playKey('C4'); 
           speechManager.speak("You did it!");
           setTimeout(() => {
              loadNewEmoji(); 
           }, 2500);
        } else {
           // Find longest possible valid word for feedback threshold
           const maxLen = Math.max(...validWordsRef.current.map(w => w.length));
           if (newAttempt.length > maxLen) {
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
           <Smile className="mr-2" /> Emoji Decoder
        </div>
      </div>

      <div className="absolute top-40 z-10 flex flex-col items-center mt-8 w-full px-4">
        { currentEmoji && (
           <div className="mb-4 text-center">
             <div className="text-xl text-pink-200 font-bold mb-2 uppercase tracking-widest">Type what you see</div>
             <div className="px-12 py-6 bg-pink-500 rounded-[50px] text-8xl md:text-9xl border-4 border-pink-300 shadow-[0_0_50px_rgba(236,72,153,0.5)] animate-bounce filter drop-shadow-2xl">
               {currentEmoji}
             </div>
           </div>
        )}

        <div className="flex gap-3 mt-8 items-center justify-center flex-wrap max-w-4xl min-h-[120px]">
          {currentEmoji ? (
              Array.from({ length: Math.min(10, currentAttempt.length + 1) }).map((_, i) => {
                const char = currentAttempt[i];
                const isCurrent = i === currentAttempt.length;
                const isDone = validWords.includes(currentAttempt);
                
                return (
                  <div key={i} className={cn(
                    "w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-black transition-all duration-300 border-4 shadow-2xl font-mono",
                    isDone ? "bg-emerald-400 text-white border-emerald-300 scale-110 opacity-100 shadow-[0_0_50px_rgba(52,211,153,0.8)]" :
                    char ? "bg-pink-400 text-white border-pink-300 scale-100" :
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
