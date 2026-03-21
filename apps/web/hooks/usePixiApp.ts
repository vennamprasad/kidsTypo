import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface UsePixiAppOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  options?: Partial<PIXI.ApplicationOptions>;
  onInit?: (app: PIXI.Application) => void | (() => void);
  onCleanup?: (app: PIXI.Application) => void;
}

/**
 * A custom hook to initialize and manage a PIXI.js Application lifecycle in a React component.
 * Prevents memory leaks by ensuring the application is destroyed cleanly on unmount,
 * and handles React StrictMode double-invocations safely.
 */
export const usePixiApp = ({ containerRef, options, onInit, onCleanup }: UsePixiAppOptions) => {
  const appRef = useRef<PIXI.Application | null>(null);
  const initCleanupRef = useRef<(() => void) | null>(null);

  // Use refs for callbacks to avoid re-triggering the effect if the user passes inline functions
  const onInitRef = useRef(onInit);
  const onCleanupRef = useRef(onCleanup);

  useEffect(() => { onInitRef.current = onInit; }, [onInit]);
  useEffect(() => { onCleanupRef.current = onCleanup; }, [onCleanup]);

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;

    const initPixi = async () => {
      // Prevent double init
      if (appRef.current) return;

      const app = new PIXI.Application();

      try {
        await app.init({
          resizeTo: containerRef.current || window,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          ...options,
        });
      } catch (err) {
        console.warn("usePixiApp: Initialization failed", err);
        return;
      }

      // Check if component unmounted while initializing
      if (!active || !containerRef.current) {
        app.destroy(true);
        return;
      }

      // Clear any existing children (prevents hydration/HMR leftovers)
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      if (onInitRef.current) {
        const cleanup = onInitRef.current(app);
        if (typeof cleanup === 'function') {
          initCleanupRef.current = cleanup;
        }
      }
    };

    initPixi();

    return () => {
      active = false;
      if (initCleanupRef.current) {
        initCleanupRef.current();
        initCleanupRef.current = null;
      }
      if (appRef.current) {
        try {
          // Mark as explicitly destroyed for child components/tickers
          (appRef.current as any)._isDestroyed = true;

          // Explicitly stop the ticker to prevent race conditions during destruction
          appRef.current.ticker.stop();

          // Manually detach from DOM just in case destroy() fails to complete
          if (appRef.current.canvas && appRef.current.canvas.parentNode) {
            appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
          }

          appRef.current.destroy(true);
        } catch (e) {
          console.warn('usePixiApp: Safely caught internal PIXI unmount error -', e);
        }

        appRef.current = null;
      }
    };
  }, [containerRef, options]);

  return { appRef };
};
