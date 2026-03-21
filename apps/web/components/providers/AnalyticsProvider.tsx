"use client";

import React, { useEffect } from 'react';
import { logEvent } from 'firebase/analytics';
import { analyticsPromise } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode } = useAppStore();

  useEffect(() => {
    // Log mode switch
    const logModeSwitch = async () => {
      const analytics = await analyticsPromise;
      if (analytics) {
        logEvent(analytics, 'mode_switch', { to: mode });
      }
    };
    logModeSwitch();
  }, [mode]);

  return <>{children}</>;
};

export const trackInteraction = async (eventName: string, params?: Record<string, unknown>) => {
  const analytics = await analyticsPromise;
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};
