import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './useAppStore';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } }
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      mode: 'keyboard',
      isClient: false,
      settings: {
        soundEnabled: true,
        animationsEnabled: true,
        theme: 'colorful',
      },
      session: {
        id: 'test-session',
        startedAt: Date.now(),
        keyPresses: 0,
        bubblesPopped: 0,
        starsCaught: 0,
      },
      parentProfile: null,
    });
  });

  it('initially sets mode to keyboard', () => {
    expect(useAppStore.getState().mode).toBe('keyboard');
  });

  it('updates mode correctly', () => {
    useAppStore.getState().setMode('draw');
    expect(useAppStore.getState().mode).toBe('draw');
  });

  it('toggles sound setting correctly', () => {
    const initialState = useAppStore.getState().settings.soundEnabled;
    useAppStore.getState().updateSettings({ soundEnabled: !initialState });
    expect(useAppStore.getState().settings.soundEnabled).toBe(!initialState);
  });

  it('increments session stats correctly', () => {
    useAppStore.getState().incrementStat('keyPresses');
    useAppStore.getState().incrementStat('bubblesPopped');
    useAppStore.getState().incrementStat('bubblesPopped');
    
    expect(useAppStore.getState().session.keyPresses).toBe(1);
    expect(useAppStore.getState().session.bubblesPopped).toBe(2);
    expect(useAppStore.getState().session.starsCaught).toBe(0);
  });
});
