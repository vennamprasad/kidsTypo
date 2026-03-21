"use client";

import React, { useEffect, useRef } from 'react';

export const BackgroundEffects = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use alpha: false for better painting performance if black background, but we need opacity?
    // Actually the parent has bg-black, so we can use alpha: false and fill black.
    // Wait, the parent app/page.tsx has bg-black. BackgroundEffects has inline opacity: 0.8
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const starCount = 60;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
      size: Math.random() * 2 + 1,
    }));

    const particles: { x: number, y: number, vx: number, vy: number, alpha: number, color: string, size: number }[] = [];
    const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#4dffff'];
    
    let lastPos = { x: -100, y: -100 };
    let moveDistance = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (width / rect.width);
      const y = (e.clientY - rect.top) * (height / rect.height);
      
      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      moveDistance += Math.sqrt(dx * dx + dy * dy);
      
      if (lastPos.x < 0) {
        lastPos = { x, y };
        return;
      }

      if (moveDistance > 5) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 3 + (dx * 0.1),
            vy: (Math.random() - 0.5) * 3 + (dy * 0.1),
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 2
          });
        }
        moveDistance = 0;
      }
      lastPos = { x, y };
    };
    window.addEventListener('pointermove', handlePointerMove, { capture: true });

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const deltaTime = (time - lastTime) / 16.666;
      lastTime = time;

      // Fill background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Stars
      stars.forEach(s => {
        s.x += s.vx * deltaTime;
        s.y += s.vy * deltaTime;
        s.phase += s.speed * deltaTime;

        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const currentAlpha = 0.3 + Math.sin(s.phase) * 0.2;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      });

      // Mouse Trail
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.alpha -= 0.04 * deltaTime;
        
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.8 }}
    />
  );
});

BackgroundEffects.displayName = 'BackgroundEffects';
