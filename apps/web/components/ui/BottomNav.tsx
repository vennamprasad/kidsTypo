"use client";

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Keyboard, Palette, Circle, Star, Link, Speaker, FlipHorizontal, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mode } from '@kiddokeys/types';
import { useConfig } from '../providers/RemoteConfigProvider';

const navItems: { mode: Mode; icon: React.ElementType; label: string }[] = [
  // Keyboard/Typing Things First
  { mode: 'keyboard', icon: Keyboard, label: 'Keyboard' },
  { mode: 'word-assoc', icon: Link, label: 'Words' },
  { mode: 'animal-sounds', icon: Speaker, label: 'Sounds' },
  { mode: 'opposite', icon: FlipHorizontal, label: 'Opposite' },
  { mode: 'emoji', icon: Smile, label: 'Emoji' },
  // Paint
  { mode: 'draw', icon: Palette, label: 'Draw' },
  // Games
  { mode: 'bubbles', icon: Circle, label: 'Bubbles' },
  { mode: 'stars', icon: Star, label: 'Stars' },
];

export const BottomNav = () => {
  const { mode, setMode } = useAppStore();
  const { config } = useConfig();

  const filteredItems = navItems.filter(item => {
    const key = `show${item.label.replace(/ /g, '')}`;
    // Fallback to true if config for that key is not found (allows graceful defaults)
    return config[key] !== false;
  });

  return (
    <div className="fixed bottom-4 md:bottom-6 z-[100] w-[95vw] md:w-auto md:min-w-[400px] left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-4 px-2 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl overflow-x-auto scrollbar-hide no-scrollbar">
      {filteredItems.map((item) => (
        <button
          key={item.mode}
          onClick={() => setMode(item.mode)}
          className={cn(
            "p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex-shrink-0 flex items-center gap-2",
            mode === item.mode
              ? "bg-white text-sky-900 shadow-xl scale-105"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
          aria-label={item.label}
          title={item.label}
        >
          <item.icon size={window?.innerWidth < 768 ? 20 : 24} />
          {mode === item.mode && <span className="font-bold text-xs md:text-sm pr-1 md:pr-2">{item.label}</span>}
        </button>
      ))}
    </div>
  );
};
