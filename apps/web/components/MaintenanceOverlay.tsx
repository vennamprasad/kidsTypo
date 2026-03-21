"use client";

import React from 'react';
import { useConfig } from './providers/RemoteConfigProvider';
import { Wrench } from 'lucide-react';

export const MaintenanceOverlay = ({ children }: { children: React.ReactNode }) => {
  const { config, loading } = useConfig();

  if (!loading && config.useMaintenanceMode === true) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black p-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/20">
          <Wrench className="h-12 w-12 text-yellow-500 animate-pulse" />
        </div>
        <h1 className="mb-4 text-4xl font-black text-white md:text-6xl">We&apos;re Tidying Up!</h1>
        <p className="max-w-md text-xl text-zinc-400">
          Kiddlr is getting some magical updates right now. We&apos;ll be back to play very soon! 🎈
        </p>
        <div className="mt-12 h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>
    );
  }

  return <>{children}</>;
};
