"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { audioManager } from '@/lib/audio';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  className?: string;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
];

const NUM_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const VirtualKeyboard = ({ onKeyPress, className }: VirtualKeyboardProps) => {
  const [isNumeric, setIsNumeric] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch capability
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  if (!isTouch) return null;

  const handleKey = (key: string) => {
    if (key === 'DEL') {
      onKeyPress('Backspace');
    } else {
      onKeyPress(key);
    }
    
    // Haptic feedback if supported
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  const rowsToRender = isNumeric ? [NUM_ROW] : ROWS;

  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto p-2 bg-black/20 backdrop-blur-xl rounded-t-[32px] border-t border-white/20 flex flex-col gap-2 select-none animate-in slide-in-from-bottom duration-500 z-[100]",
      className
    )}>
      {/* Keyboard Header / Toggles */}
      <div className="flex justify-between px-4 py-1">
        <button 
          onClick={() => setIsNumeric(!isNumeric)}
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          {isNumeric ? "Abc" : "123"}
        </button>
        <div className="h-1 w-12 bg-white/10 rounded-full" />
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2 pb-4">
        {rowsToRender.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 md:gap-1.5 px-1">
            {row.map((key) => {
              const isSpecial = key === 'DEL';
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={cn(
                    "flex-1 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-90 active:bg-white active:text-sky-900 border-b-4",
                    isSpecial
                      ? "bg-rose-500/80 text-white border-rose-700 min-w-[60px]"
                      : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
