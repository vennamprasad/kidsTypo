"use client";

import React from 'react';

export function CSSBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      {/* Slow drifting gradient orbs — GPU composited layer, no repaints */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #0ea5e9, transparent)',
          top: '-10%', left: '-10%',
          animation: 'drift1 18s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #10b981, transparent)',
          bottom: '-10%', right: '-10%',
          animation: 'drift2 22s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #f59e0b, transparent)',
          top: '40%', right: '20%',
          animation: 'drift3 15s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />
      {/* Static noise grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <style>{`
        @keyframes drift1 {
          from { transform: translate(0px, 0px) scale(1); }
          to   { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes drift2 {
          from { transform: translate(0px, 0px) scale(1); }
          to   { transform: translate(-50px, -30px) scale(1.15); }
        }
        @keyframes drift3 {
          from { transform: translate(0px, 0px) scale(1); }
          to   { transform: translate(-40px, 50px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
