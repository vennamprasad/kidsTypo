"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAndActivate, getAll } from 'firebase/remote-config';
import { remoteConfig } from '@/lib/firebase';

interface RemoteConfigContextType {
  config: Record<string, unknown>;
  loading: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigContextType>({
  config: {},
  loading: true,
});

export const RemoteConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    bubbleSpawnInterval: 1200,
    starSpawnInterval: 1000,
    maxBubbleSpeed: 2.5,
    enablePremiumWords: true,
    useAIWords: false,
    useMaintenanceMode: false,
    showKeyboard: true,
    showWords: true,
    showSounds: true,
    showOpposite: true,
    showEmoji: true,
    showDraw: true,
    showBubbles: true,
    showStars: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!remoteConfig) return;

    const initConfig = async () => {
      if (!remoteConfig) return;
      try {
        remoteConfig.settings.minimumFetchIntervalMillis = 60000; // 1 minute for better responsiveness during setup
        await fetchAndActivate(remoteConfig);
        const allValues = getAll(remoteConfig);
        
        const configMap: Record<string, unknown> = {};
        Object.entries(allValues).forEach(([key, value]) => {
          configMap[key] = value.asString();
          // Try to parse booleans and numbers
          const strVal = value.asString().toLowerCase();
          if (strVal === 'true') configMap[key] = true;
          else if (strVal === 'false') configMap[key] = false;
          else {
            const num = value.asNumber();
            if (!isNaN(num)) configMap[key] = num;
          }
        });

        setConfig((prev: Record<string, unknown>) => ({ ...prev, ...configMap }));
      } catch (err) {
        console.error('Failed to fetch remote config', err);
      } finally {
        setLoading(false);
      }
    };

    initConfig();
  }, []);

  return (
    <RemoteConfigContext.Provider value={{ config, loading }}>
      {children}
    </RemoteConfigContext.Provider>
  );
};

export const useConfig = () => useContext(RemoteConfigContext);
