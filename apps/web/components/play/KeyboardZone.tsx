"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { audioManager } from '@/lib/audio';
import { useAppStore } from '@/store/useAppStore';
import { usePixiApp } from '@/hooks/usePixiApp';
import { cn } from '@/lib/utils';
import { Trophy, Sparkles, Hash, Type, Leaf, Apple, Palette, Cat, Music } from 'lucide-react';
import { useConfig } from '../providers/RemoteConfigProvider';
import { speechManager } from '@/lib/speech';
import { TaskSuccessOverlay } from './TaskSuccessOverlay';
import { getPremiumWords, getRhymeHints } from '@/app/actions/ai';

type PlayMode = 'free' | 'alphabet' | 'numbers' | 'words' | 'rhyme';
type WordCategory = 'animals' | 'fruits' | 'colors' | 'veggies';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const RHYME_ROOTS = ['CAT', 'BUG', 'SUN', 'PIG', 'NET', 'DOG', 'HAT', 'PEN', 'CAR', 'BED'];

// Common kid-friendly rhymes so they aren't totally lost
const RHYME_HINTS: Record<string, string[]> = {
  'CAT': ['B', 'H', 'M', 'R', 'P', 'S', 'F', 'V'],
  'BUG': ['H', 'R', 'M', 'J', 'T', 'P', 'L', 'D'],
  'SUN': ['R', 'B', 'F', 'N', 'P'],
  'PIG': ['B', 'D', 'F', 'J', 'W', 'Z'],
  'NET': ['P', 'W', 'J', 'S', 'V', 'M'],
  'DOG': ['F', 'H', 'J', 'L'],
  'HAT': ['C', 'M', 'B', 'R', 'P', 'S', 'F', 'V'],
  'PEN': ['H', 'M', 'T', 'D', 'Z'],
  'CAR': ['S', 'F', 'T', 'J'],
  'BED': ['R', 'F', 'L', 'W']
};

export const KeyboardZone = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const session = useAppStore((state) => state.session);
  const incrementStat = useAppStore((state) => state.incrementStat);
  const { config } = useConfig();

  const [playMode, setPlayMode] = useState<PlayMode>('free');
  const [wordCategory, setWordCategory] = useState<WordCategory>('animals');
  const [targetText, setTargetText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeTask = useAppStore(state => state.activeTask);
  const completeActiveTask = useAppStore(state => state.completeActiveTask);
  const wordHistory = useAppStore(state => state.wordHistory);
  const recordWord = useAppStore(state => state.recordWord);
  const difficulty = useAppStore(state => state.difficulty);
  const setDifficulty = useAppStore(state => state.setDifficulty);
  const resetWordHistory = useAppStore(state => state.resetWordHistory);

  const [activeWordList, setActiveWordList] = useState<string[]>([]);
  const activeWordListRef = useRef(activeWordList);

  const [rhymeRoot, setRhymeRoot] = useState('');
  const [validRhymes, setValidRhymes] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState('');

  const incrementStatRef = useRef(incrementStat);
  const modeRef = useRef(playMode);
  const targetRef = useRef(targetText);
  const indexRef = useRef(currentIndex);

  const rhymeRootRef = useRef(rhymeRoot);
  const validRhymesRef = useRef(validRhymes);
  const currentAttemptRef = useRef(currentAttempt);

  const setIndexState = (i: number) => {
    setCurrentIndex(i);
    indexRef.current = i;
  };

  const setAttemptState = (val: string) => {
    setCurrentAttempt(val);
    currentAttemptRef.current = val;
  };

  useEffect(() => { incrementStatRef.current = incrementStat; }, [incrementStat]);
  useEffect(() => { modeRef.current = playMode; }, [playMode]);
  useEffect(() => { activeWordListRef.current = activeWordList; }, [activeWordList]);
  
  useEffect(() => { rhymeRootRef.current = rhymeRoot; }, [rhymeRoot]);
  useEffect(() => { validRhymesRef.current = validRhymes; }, [validRhymes]);

  useEffect(() => {
    if (playMode !== 'words') return;

    const loadCategoryWords = async () => {
      setIsLoadingWords(true);
      const configKey = `words_${wordCategory}`;
      let words: string[] = [];

      // Check remote config first for manual overrides
      if (typeof config[configKey] === 'string' && (config[configKey] as string).trim() !== '') {
        words = (config[configKey] as string).split(',').map(w => w.trim().toUpperCase());
      }

      if (words.length === 0) {
        try {
          if (config.enablePremiumWords !== false) {
            words = await getPremiumWords(wordCategory, difficulty, !!config.useAIWords);
          } else {
            console.log("[Game] Premium words disabled via Remote Config. Using fallback.");
            words = ['KIDDLR', 'HAPPY', 'LEARN'];
          }
        } catch (e) {
          console.error("Failed to fetch premium words", e);
          words = ['KIDDLR', 'HAPPY', 'LEARN'];
        }
      }

      // Filter out recently seen words to prevent repeats
      let filteredWords = words.filter(w => !wordHistory.includes(w.toUpperCase()));
      
      // AUTO-RESTART logic: If we ran out of words, reset history for a fresh start
      if (filteredWords.length === 0 && words.length > 0) {
        console.log(`[Game] Resetting history for category: ${wordCategory} (${difficulty})`);
        resetWordHistory();
        filteredWords = words;
      }

      const finalWords = filteredWords.length > 0 ? filteredWords : words;

      setActiveWordList(finalWords);
      setIsLoadingWords(false);
      
      const nextW = finalWords[Math.floor(Math.random() * finalWords.length)];
      setTargetText(nextW);
      targetRef.current = nextW;
      setIndexState(0);
      
      speechManager.speak(`Spell the word ${nextW}`);
    };

    if (activeTask && activeTask.type === 'typing') {
      const taskWord = activeTask.content.toUpperCase();
      setTargetText(taskWord);
      targetRef.current = taskWord;
      setIndexState(0);
      speechManager.speak(`Time for your special task: Spell ${taskWord}`);
      return;
    }

    loadCategoryWords();
  }, [playMode, wordCategory, difficulty, config, activeTask, resetWordHistory, wordHistory]);

  useEffect(() => {
    if (playMode !== 'rhyme') return;

    const loadNewRhyme = async () => {
      setIsLoadingWords(true);
      
      // Load a random root word
      const newRoot = RHYME_ROOTS[Math.floor(Math.random() * RHYME_ROOTS.length)];
      setRhymeRoot(newRoot);
      setAttemptState('');
      
      speechManager.speak(`Find a word that rhymes with ${newRoot}`);

      try {
        const rhymes = await getRhymeHints(newRoot);
        setValidRhymes(rhymes);
      } catch (e) {
        console.error("Failed to fetch rhymes", e);
        let fb = ['HAT', 'MAT', 'BAT', 'RAT', 'FAT', 'SAT', 'VAT', 'PAT'];
        if (newRoot === 'BUG') fb = ['HUG', 'RUG', 'MUG', 'JUG', 'TUG', 'PUG', 'LUG', 'DUG'];
        if (newRoot === 'SUN') fb = ['RUN', 'BUN', 'FUN', 'GUN', 'NUN', 'PUN'];
        setValidRhymes(fb);
      }
      setIsLoadingWords(false);
    };

    if (!rhymeRoot) {
      loadNewRhyme();
    }
  }, [playMode, rhymeRoot]);

  const loadNextTarget = (mode: PlayMode) => {
    if (mode === 'free' || mode === 'rhyme') {
      setTargetText('');
      targetRef.current = '';
      setIndexState(0);
    } else if (mode === 'alphabet') {
      const current = targetRef.current;
      const idx = current ? ALPHABET.indexOf(current) : -1;
      const next = idx !== -1 && idx < ALPHABET.length - 1 ? ALPHABET[idx + 1] : 'A';
      setTargetText(next);
      targetRef.current = next;
      setIndexState(0);
    } else if (mode === 'numbers') {
      const current = targetRef.current;
      const idx = current ? NUMBERS.indexOf(current) : -1;
      const next = idx !== -1 && idx < NUMBERS.length - 1 ? NUMBERS[idx + 1] : '0';
      setTargetText(next);
      targetRef.current = next;
      setIndexState(0);
    } else if (mode === 'words') {
      const words = activeWordListRef.current;
      if (words.length === 0) return;
      
      let nextW = targetRef.current;
      const currentHistory = useAppStore.getState().wordHistory;
      
      // Filter by wordHistory
      let availableWords = words.filter((w: string) => !currentHistory.includes(w.toUpperCase()));
      
      // If pool is dry, we'll reload everything (restart)
      if (availableWords.length === 0) {
        resetWordHistory();
        availableWords = words;
      }

      const pool = availableWords.length > 0 ? availableWords : words;

      while (nextW === targetRef.current && pool.length > 1) {
        nextW = pool[Math.floor(Math.random() * pool.length)];
      }
      setTargetText(nextW);
      targetRef.current = nextW;
      setIndexState(0);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (playMode !== 'words' && playMode !== 'rhyme') {
      loadNextTarget(playMode);
    }
  }, [playMode]);
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
        richText.y = y;

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
         const stickers = ['⭐️', '🎈', '🍦', '🎉', '🚀', '🍰', '🍪', '🌈', '🎨'];
         for(let i=0; i<40; i++) {
           setTimeout(() => {
             const cx = app.screen.width / 2 + (Math.random() - 0.5) * 800;
             const cy = app.screen.height / 2 + (Math.random() - 0.5) * 800;
             const sticker = stickers[Math.floor(Math.random() * stickers.length)];
             const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#00d2ff'];
             createBurst(sticker, cx, cy, colors[Math.floor(Math.random() * colors.length)], 0.7);
           }, i * 30);
         }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (!app.stage) return;
        if (showSuccess) return; 
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        
        const mode = modeRef.current;

        if (e.key === 'Backspace') {
          if (mode === 'rhyme') {
             if (currentAttemptRef.current.length > 0) {
               const newVal = currentAttemptRef.current.slice(0, -1);
               setAttemptState(newVal);
               audioManager.playKey('A');
             }
          }
          return;
        }

        const char = e.key.toUpperCase();
        if (char.length !== 1) return;

        const target = targetRef.current;
        const idx = indexRef.current;

        const marginX = Math.min(app.screen.width * 0.25, 250);
        const marginY = Math.min(app.screen.height * 0.2, 180);
        const cx = marginX + Math.random() * (app.screen.width - 2 * marginX);
        const cy = marginY + Math.random() * (app.screen.height - 2 * marginY);

        if (mode === 'free') {
          createBurst(char, cx, cy);
          audioManager.playKey(char);
          incrementStatRef.current('keyPresses');
        } 
        else if (mode === 'alphabet' || mode === 'numbers') {
          if (char === target) {
            createBurst(char, app.screen.width/2, app.screen.height/2, '#4dff4d', 2.5);
            audioManager.playKey(char); 
            incrementStatRef.current('keyPresses');
            loadNextTarget(mode);
          } else {
            createBurst(char, cx, cy, '#ff4d4d', 0.5);
          }
        } 
        else if (mode === 'words') {
          if (!target || target.length === 0) return;
          
          if (char === target[idx]) {
            createBurst(char, cx, cy, '#4dff4d', 1.2);
            audioManager.playKey(char);
            incrementStatRef.current('keyPresses');
            
            setIndexState(idx + 1);
            if (idx + 1 === target.length) {
              createConfetti();
              speechManager.speak("Awesome!");
              
              // Record in history to prevent immediate repeats
              recordWord(target);
              
              if (activeTask && activeTask.type === 'typing' && target === activeTask.content.toUpperCase()) {
                setShowSuccess(true);
                completeActiveTask();
              } else {
                // Reduced from 1500 to 800 for snappier feel
                setTimeout(() => loadNextTarget(mode), 800);
              }
            }
          } else {
            createBurst(char, cx, cy, '#ff4d4d', 0.5);
          }
        }
        else if (mode === 'rhyme') {
          if (!/^[A-Z]$/.test(char)) return; 
          
          if (!rhymeRootRef.current || validRhymesRef.current.length === 0) return;
          
          if (validRhymesRef.current.includes(currentAttemptRef.current)) return;
          
          createBurst(char, cx, cy, '#b28dff', 1.0);
          audioManager.playKey(char);
          incrementStatRef.current('keyPresses');
          
          const newAttempt = currentAttemptRef.current + char;
          
          if (validRhymesRef.current.includes(newAttempt)) {
             setAttemptState(newAttempt);
             createConfetti();
             speechManager.speak("You did it!");
             
             setTimeout(() => {
                setRhymeRoot(''); 
             }, 1200);
          } else {
             if (newAttempt.length >= rhymeRootRef.current.length) {
                createBurst('Try Again!', app.screen.width/2, app.screen.height/2, '#ff4d4d', 1.5);
                setAttemptState('');
             } else {
                setAttemptState(newAttempt);
             }
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

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-x-auto w-full justify-center scrollbar-hide">
          <ModeButton active={playMode === 'free'} onClick={() => setPlayMode('free')} icon={<Sparkles size={20}/>} label="Free Play" />
          <ModeButton active={playMode === 'alphabet'} onClick={() => setPlayMode('alphabet')} icon={<Type size={20}/>} label="A-Z" />
          <ModeButton active={playMode === 'numbers'} onClick={() => setPlayMode('numbers')} icon={<Hash size={20}/>} label="0-9" />
          <ModeButton active={playMode === 'words'} onClick={() => setPlayMode('words')} icon={<Trophy size={20}/>} label="Words" />
          <ModeButton active={playMode === 'rhyme'} onClick={() => setPlayMode('rhyme')} icon={<Music size={20}/>} label="Rhyme Time" />
        </div>

        <div className={cn(
          "flex flex-col gap-2 p-3 bg-sky-900/30 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg transition-all duration-300",
           playMode === 'words' ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none absolute"
        )}>
           <div className="flex gap-2 justify-center">
             <CategoryButton active={wordCategory === 'animals'} onClick={() => setWordCategory('animals')} icon={<Cat size={16}/>} label="Animals" />
             <CategoryButton active={wordCategory === 'fruits'} onClick={() => setWordCategory('fruits')} icon={<Apple size={16}/>} label="Fruits" />
             <CategoryButton active={wordCategory === 'colors'} onClick={() => setWordCategory('colors')} icon={<Palette size={16}/>} label="Colors" />
             <CategoryButton active={wordCategory === 'veggies'} onClick={() => setWordCategory('veggies')} icon={<Leaf size={16}/>} label="Veggies" />
           </div>
           
           <div className="flex gap-2 justify-center border-t border-white/10 pt-2">
             <DifficultyButton active={difficulty === 'easy'} onClick={() => setDifficulty('easy')} label="Easy" />
             <DifficultyButton active={difficulty === 'medium'} onClick={() => setDifficulty('medium')} label="Medium" />
             <DifficultyButton active={difficulty === 'hard'} onClick={() => setDifficulty('hard')} label="Hard" />
           </div>
        </div>
      </div>

      {playMode !== 'free' && (
        <div className="flex flex-col items-center mt-64 z-10 w-full px-4">
          
          { playMode === 'rhyme' && rhymeRoot && (
             <div className="mb-8 px-8 py-3 bg-purple-500 text-white rounded-[30px] text-4xl md:text-5xl font-black border-4 border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-bounce font-mono">
               Rhyme with: {rhymeRoot}
             </div>
          )}

          <div className="flex gap-4 items-center justify-center flex-wrap max-w-2xl">
            {isLoadingWords ? (
              <div className="w-40 h-16 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white font-black text-2xl animate-pulse">
                Loading...
              </div>
            ) : playMode === 'rhyme' && rhymeRoot ? (
                // Draw boxes equal to the length of the root word, so for "CAT" we draw 3 boxes
                Array.from({ length: rhymeRoot.length }).map((_, i) => {
                  const char = currentAttempt[i];
                  const isCurrent = i === currentAttempt.length;
                  const isDone = validRhymes.includes(currentAttempt);
                  
                  // For the very first letter (index 0), if it's currently empty, we show a hint
                  const hintLetters = RHYME_HINTS[rhymeRoot];
                  const hasHint = i === 0 && !char && hintLetters && hintLetters.length > 0;
                  // Just show the first 3 letters as hints so it's not overwhelming
                  const hintDisplay = hasHint ? `${hintLetters[0]}, ${hintLetters[1]}, or ${hintLetters[2]}...` : '';
                  
                  return (
                    <div key={i} className={cn(
                      "rounded-3xl flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-black transition-all duration-300 border-4 shadow-2xl font-mono relative",
                      // First box with hint is extra wide
                      hasHint ? "w-64 md:w-80 h-20 sm:h-24 md:h-32 text-2xl sm:text-3xl" : "w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32",
                      isDone ? "bg-emerald-400 text-white border-emerald-300 scale-105 opacity-100 shadow-[0_0_40px_rgba(52,211,153,0.8)]" :
                      char ? "bg-purple-400 text-white border-purple-300 scale-100" :
                      isCurrent ? "bg-white/20 backdrop-blur-md text-white/50 border-white/60 animate-pulse border-dashed" :
                      "bg-white/10 backdrop-blur-md text-white/30 border-white/20 border-dashed"
                    )}>
                      {char || (hasHint ? <span className="text-white/40 italic">{hintDisplay}</span> : "_")}
                      
                      {/* For letters index > 0, we can flash the actual root letters as hints too */}
                      {!char && !hasHint && i > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-white/20">
                          {rhymeRoot[i]}
                        </span>
                      )}
                    </div>
                  )
                })
            ) : playMode === 'words' && targetText ? (
                targetText.split('').map((char: string, i: number) => {
                  const isCompleted = i < currentIndex;
                  const isCurrent = i === currentIndex;
                  return (
                    <div key={i} className={cn(
                      "w-16 h-20 sm:w-20 sm:h-24 md:w-28 md:h-32 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl md:text-8xl font-black transition-all duration-300 border-4 shadow-2xl",
                      isCompleted ? "bg-emerald-400 text-white border-emerald-300 scale-105 opacity-100 shadow-[0_0_30px_rgba(52,211,153,0.5)] z-20" :
                      isCurrent ? "bg-amber-400 text-white border-amber-300 scale-110 animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.5)] z-10" :
                      "bg-white/20 backdrop-blur-md text-white/50 border-white/30"
                    )}>
                      {char}
                    </div>
                  )
                })
            ) : targetText ? (
                <div className="w-32 h-40 md:w-48 md:h-56 bg-amber-400 text-white rounded-[40px] flex items-center justify-center text-8xl md:text-9xl font-black border-8 border-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.5)] animate-bounce mt-4">
                  {targetText}
                </div>
            ) : null}
          </div>
          
          {/* Task Objective Badge */}
          {activeTask && activeTask.type === 'typing' && (
            <div className="mt-8 px-6 py-2 bg-amber-400 text-white rounded-full font-black shadow-[0_4px_20px_rgba(251,191,36,0.3)] border-2 border-white/20 animate-pulse">
              GOAL: TYPE {activeTask.content.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* PIXI Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-1" />

      {activeTask && (
        <TaskSuccessOverlay 
          isVisible={showSuccess}
          onClose={() => setShowSuccess(false)}
          title={activeTask.title}
        />
      )}
    </div>
  );
};

function ModeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl font-bold transition-all duration-300 flex-shrink-0 whitespace-nowrap",
        active ? "bg-white text-sky-900 shadow-lg scale-105" : "text-white hover:bg-white/20"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CategoryButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 flex-shrink-0 whitespace-nowrap",
        active ? "bg-amber-400 text-white shadow-md scale-105" : "text-white/80 hover:bg-white/20 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DifficultyButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-1 rounded-full font-black text-xs transition-all duration-300 uppercase tracking-wider",
        active ? "bg-white text-sky-950 shadow-sm" : "text-white/40 hover:text-white/60"
      )}
    >
      {label}
    </button>
  );
}
