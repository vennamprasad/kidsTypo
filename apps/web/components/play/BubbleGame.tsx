"use client";

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useAppStore } from '@/store/useAppStore';
import { usePixiApp } from '@/hooks/usePixiApp';
import { motion, AnimatePresence } from "framer-motion";
import { speechManager } from '@/lib/speech';
import { cn } from '@/lib/utils';

export const BubbleGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const session = useAppStore((state) => state.session);
  const incrementStat = useAppStore((state) => state.incrementStat);
  const resetStat = useAppStore((state) => state.resetStat);

  const incrementStatRef = useRef(incrementStat);
  useEffect(() => { incrementStatRef.current = incrementStat; }, [incrementStat]);

  const [countdown, setCountdown] = React.useState<number | 'START' | null>(null);
  const [isGameOver, setIsGameOver] = React.useState(false);
  const isCountingDownRef = useRef(true);
  const isGameOverRef = useRef(false);

  // Sync ref for Pixi closure
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

  const startCountdown = async () => {
    isCountingDownRef.current = true;
    setCountdown(3);
    speechManager.speak("3");
    
    await new Promise(r => setTimeout(r, 1000));
    setCountdown(2);
    speechManager.speak("2");
    
    await new Promise(r => setTimeout(r, 1000));
    setCountdown(1);
    speechManager.speak("1");
    
    await new Promise(r => setTimeout(r, 1000));
    setCountdown('START');
    speechManager.speak("START!");
    
    await new Promise(r => setTimeout(r, 800));
    setCountdown(null);
    isCountingDownRef.current = false;
  };

  // Countdown Logic
  useEffect(() => {
    startCountdown();
  }, []);

  const handleRetry = () => {
    resetStat('bubblesPopped');
    setIsGameOver(false);
    isGameOverRef.current = false;
    startCountdown();
  };

  usePixiApp({
    containerRef,
    onInit: (app: PIXI.Application) => {
      const emojis = ['🫧', '🐠', '🐙', '🦀', '🐳', '🐬', '🐙'];
      const bubbles = new Set<PIXI.Container>();

      const createBubble = () => {
        if (!app.stage || app.renderer === null || (app as unknown as { destroyed: boolean }).destroyed) return;
        const container = new PIXI.Container();
        
        const bubble = new PIXI.Graphics();
        bubble.circle(0, 0, 40);
        bubble.fill({ color: 0xffffff, alpha: 0.3 });
        bubble.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const text = new PIXI.Text({ text: emoji, style: { fontSize: 40 } });
        text.anchor.set(0.5);
        
        container.addChild(bubble);
        container.addChild(text);
        
        container.x = Math.random() * app.screen.width;
        container.y = app.screen.height + 100;
        
        container.interactive = true;
        container.on('pointerdown', () => {
          popBubble(container);
        });

        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(container);
          bubbles.add(container);
        }
      };

      const popBubble = (b: PIXI.Container) => {
        if (b.destroyed || (app as unknown as { destroyed: boolean }).destroyed) return;
        incrementStatRef.current('bubblesPopped');
        bubbles.delete(b);
        
        const bx = b.x;
        const by = b.y;
        
        if (b.parent) b.parent.removeChild(b);
        b.destroy({ children: true });
        
        // Particle effect
        for (let i = 0; i < 5; i++) {
          const spark = new PIXI.Graphics();
          spark.circle(0, 0, 4);
          spark.fill(0xffffff);
          spark.x = bx;
          spark.y = by;
          
          if (app.stage && !app.stage.destroyed) {
            app.stage.addChild(spark);
            
            const vx = (Math.random() - 0.5) * 10;
            const vy = (Math.random() - 0.5) * 10;
            let alpha = 1;
            
            const tick = (ticker: PIXI.Ticker) => {
              if (spark.destroyed || (app as unknown as { destroyed: boolean }).destroyed || !app.stage || app.stage.destroyed) {
                app.ticker.remove(tick);
                return;
              }
              spark.x += vx * ticker.deltaTime;
              spark.y += vy * ticker.deltaTime;
              alpha -= 0.1 * ticker.deltaTime;
              spark.alpha = alpha;
              if (alpha <= 0) {
                app.ticker.remove(tick);
                if (spark.parent) spark.parent.removeChild(spark);
                if (!spark.destroyed) spark.destroy();
              }
            };
            app.ticker.add(tick);
          }
        }
      };

      let spawnTimer = 0;
      const gameTick = (ticker: PIXI.Ticker) => {
        if ((app as unknown as { destroyed: boolean }).destroyed) {
          app.ticker.remove(gameTick);
          return;
        }
        if (isCountingDownRef.current || isGameOverRef.current) return;

        const score = session.bubblesPopped;
        const spawnInterval = score > 100 ? 400 : (score > 30 ? 700 : 1000);
        const floatSpeed = score > 100 ? 6 : (score > 30 ? 4 : 2);

        spawnTimer += ticker.deltaMS;
        if (spawnTimer >= spawnInterval) {
          createBubble();
          spawnTimer = 0;
        }

        const toRemove: PIXI.Container[] = [];
        bubbles.forEach((b) => {
          if (b.destroyed) {
            toRemove.push(b);
            return;
          }
          b.y -= floatSpeed * ticker.deltaTime;
          b.x += Math.sin(b.y / 50) * 1;
          
          if (b.y < -100) {
            // MISSED BUBBLE!
            setIsGameOver(true);
            speechManager.speak("Oops! Bubble floated away!");
            toRemove.push(b);
          }
        });

        toRemove.forEach(b => {
          bubbles.delete(b);
          if (b.parent) b.parent.removeChild(b);
          if (!b.destroyed) b.destroy({ children: true });
        });
      };

      app.ticker.add(gameTick);

      return () => {
        app.ticker.remove(gameTick);
      };
    }
  });

  return (
    <div className="relative w-full h-full overflow-hidden cursor-pointer">
      <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
        <span className="text-2xl font-black text-white drop-shadow-md">🫧 {session.bubblesPopped}</span>
      </div>

      {/* COUNTDOWN OVERLAY - Centered Dialog Style */}
      <AnimatePresence mode="wait">
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -20 }}
              className="bg-sky-900/60 backdrop-blur-2xl border-4 border-white/20 rounded-[60px] p-12 flex flex-col items-center gap-4 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <span className="text-white/60 font-black tracking-widest uppercase text-xl animate-pulse">
                {countdown === 'START' ? "Let's Go!" : "Get Ready!"}
              </span>
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 200 }}
                className={cn(
                  "text-[10rem] font-black italic tracking-tighter drop-shadow-2xl leading-none",
                  countdown === 3 ? "text-amber-400" :
                  countdown === 2 ? "text-sky-400" :
                  countdown === 1 ? "text-rose-400" :
                  "text-emerald-400"
                )}
              >
                {countdown}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RETRY OVERLAY */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border-8 border-sky-400 rounded-[60px] p-12 flex flex-col items-center gap-6 shadow-2xl relative"
            >
              <div className="absolute -top-12 -right-8 animate-bounce text-6xl">🫧</div>
              <div className="absolute -top-12 -left-8 animate-bounce delay-100 text-6xl">🐠</div>
              
              <h2 className="text-sky-500 font-black text-5xl uppercase tracking-tighter">Oh No!</h2>
              <p className="text-sky-900 font-black text-2xl">You popped <span className="text-rose-500">{session.bubblesPopped}</span> bubbles!</p>
              
              <button 
                onClick={handleRetry}
                className="mt-4 px-12 py-6 bg-sky-500 hover:bg-sky-600 text-white font-black text-3xl rounded-[30px] shadow-[0_10px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest flex items-center gap-4 group"
              >
                Try Again <span className="group-hover:rotate-12 transition-transform">💙</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="absolute inset-0 z-1" />
    </div>
  );
};
