"use client";

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useAppStore } from '@/store/useAppStore';
import { usePixiApp } from '@/hooks/usePixiApp';
import { motion, AnimatePresence } from "framer-motion";
import { speechManager } from '@/lib/speech';
import { cn } from '@/lib/utils';

export const StarGame = () => {
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
    resetStat('starsCaught');
    setIsGameOver(false);
    isGameOverRef.current = false;
    startCountdown();
  };

  usePixiApp({
    containerRef,
    onInit: (app: PIXI.Application) => {
      // Parallax Stars Background
      const starCount = 100;
      const bgStars: PIXI.Graphics[] = [];
      for (let i = 0; i < starCount; i++) {
        const s = new PIXI.Graphics();
        s.circle(0, 0, Math.random() * 2);
        s.fill(0xffffff);
        s.x = Math.random() * app.screen.width;
        s.y = Math.random() * app.screen.height;
        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(s);
          bgStars.push(s);
        }
      }

      const fallingStars = new Set<PIXI.Container>();

      const createStar = () => {
        if (!app.stage || app.renderer === null || (app as unknown as { destroyed: boolean }).destroyed) return;
        const container = new PIXI.Container();
        
        const star = new PIXI.Graphics();
        const points = 5;
        const radius = 30;
        const innerRadius = 15;
        star.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI) / points;
          const r = i % 2 === 0 ? radius : innerRadius;
          star.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        star.closePath();
        star.fill(0xffd700);
        star.stroke({ color: 0xffffff, width: 2 });
        
        container.addChild(star);
        container.x = Math.random() * app.screen.width;
        container.y = -100;
        
        container.interactive = true;
        container.on('pointerdown', () => {
          catchStar(container);
        });

        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(container);
          fallingStars.add(container);
        }
      };

      const catchStar = (s: PIXI.Container) => {
        if (s.destroyed) return;
        incrementStatRef.current('starsCaught');
        fallingStars.delete(s);
        if (s.parent) s.parent.removeChild(s);
        
        const sx = s.x;
        const sy = s.y;
        s.destroy({ children: true });
        
        // Glow effect
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, 50);
        glow.fill({ color: 0xffd700, alpha: 0.5 });
        glow.x = sx;
        glow.y = sy;
        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(glow);
          
          let alpha = 0.5;
          const tick = (ticker: PIXI.Ticker) => {
            if (glow.destroyed || (app as unknown as { destroyed: boolean }).destroyed || !app.stage || app.stage.destroyed) {
              app.ticker.remove(tick);
              return;
            }
            alpha -= 0.05 * ticker.deltaTime;
            glow.alpha = alpha;
            glow.scale.set(glow.scale.x + 0.1 * ticker.deltaTime);
            if (alpha <= 0) {
              app.ticker.remove(tick);
              if (glow.parent) glow.parent.removeChild(glow);
              if (!glow.destroyed) glow.destroy();
            }
          };
          app.ticker.add(tick);
        }
      };

      let spawnTimer = 0;
      const gameTick = (ticker: PIXI.Ticker) => {
        if ((app as unknown as { destroyed: boolean }).destroyed) {
          app.ticker.remove(gameTick);
          return;
        }
        if (isCountingDownRef.current || isGameOverRef.current) return;

        const score = session.starsCaught;
        const spawnInterval = score > 100 ? 500 : (score > 30 ? 800 : 1200);
        const fallSpeed = score > 100 ? 8 : (score > 30 ? 5 : 3);

        spawnTimer += ticker.deltaMS;
        if (spawnTimer >= spawnInterval) {
          createStar();
          spawnTimer = 0;
        }

        const toRemove: PIXI.Container[] = [];
        fallingStars.forEach((s) => {
          if (s.destroyed) {
            toRemove.push(s);
            return;
          }
          s.y += fallSpeed * ticker.deltaTime;
          s.rotation += 0.05 * ticker.deltaTime;
          
          if (s.y > app.screen.height + 50) {
            // MISSED STAR!
            setIsGameOver(true);
            speechManager.speak("Oh no! Try again!");
            toRemove.push(s);
          }
        });

        toRemove.forEach(s => {
          fallingStars.delete(s);
          if (s.parent) s.parent.removeChild(s);
          if (!s.destroyed) s.destroy({ children: true });
        });

        // Parallax scroll
        bgStars.forEach((s) => {
          if (!s.destroyed) {
            s.y += 0.5 * ticker.deltaTime;
            if (s.y > app.screen.height) s.y = 0;
          }
        });
      };

      app.ticker.add(gameTick);

      return () => {
        app.ticker.remove(gameTick);
      };
    }
  });

  return (
    <div className="relative w-full h-full overflow-hidden cursor-crosshair">
      <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
        <span className="text-2xl font-black text-white drop-shadow-md">⭐ {session.starsCaught}</span>
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
              className="bg-white border-8 border-rose-400 rounded-[60px] p-12 flex flex-col items-center gap-6 shadow-2xl relative"
            >
              <div className="absolute -top-12 -right-8 animate-bounce text-6xl">⭐</div>
              <div className="absolute -top-12 -left-8 animate-bounce delay-100 text-6xl">💫</div>
              
              <h2 className="text-rose-500 font-black text-5xl uppercase tracking-tighter">Oops!</h2>
              <p className="text-sky-900 font-black text-2xl">You caught <span className="text-amber-500">{session.starsCaught}</span> stars!</p>
              
              <button 
                onClick={handleRetry}
                className="mt-4 px-12 py-6 bg-rose-500 hover:bg-rose-600 text-white font-black text-3xl rounded-[30px] shadow-[0_10px_0_rgb(190,18,60)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest flex items-center gap-4 group"
              >
                Try Again <span className="group-hover:rotate-12 transition-transform">❤️</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="absolute inset-0 z-1" />
    </div>
  );
};
