import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mode, Settings, SessionStats } from '@kiddokeys/types';

interface AppState {
  // Mode
  mode: Mode;
  setMode: (mode: Mode) => void;

  // Settings
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // Session
  session: SessionStats;
  incrementStat: (key: keyof Omit<SessionStats, 'id' | 'startedAt'>) => void;
  resetStat: (key: keyof Omit<SessionStats, 'id' | 'startedAt'>) => void;
  resetSession: () => void;
  flushSession: () => Promise<void>;

  // Auth (Parent Portal)
  parentUser: any | null; // Replace with Firebase User type
  setParentUser: (user: any | null) => void;

  // Assignments
  activeTask: { id: string; title: string; type: 'typing' | 'drawing'; content: string } | null;
  setActiveTask: (task: { id: string; title: string; type: 'typing' | 'drawing'; content: string } | null) => void;
  completeActiveTask: () => Promise<void>;

  // Word History (No-Repeat Logic)
  wordHistory: string[];
  recordWord: (word: string) => void;
  resetWordHistory: () => void;
  
  // Difficulty
  difficulty: 'easy' | 'medium' | 'hard';
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mode: 'keyboard',
      setMode: (mode) => set({ mode }),

      settings: {
        soundEnabled: true,
        animationsEnabled: true,
        theme: 'colorful',
      },
      updateSettings: (patch) => set((state) => ({
        settings: { ...state.settings, ...patch }
      })),

      session: {
        id: Math.random().toString(36).substring(7),
        startedAt: Date.now(),
        keyPresses: 0,
        bubblesPopped: 0,
        starsCaught: 0,
      },
      incrementStat: (key) => set((state) => ({
        session: {
          ...state.session,
          [key]: (state.session[key] as number) + 1
        }
      })),
      resetStat: (key) => set((state) => ({
        session: {
          ...state.session,
          [key]: 0
        }
      })),
      resetSession: () => set({
        session: {
          id: Math.random().toString(36).substring(7),
          startedAt: Date.now(),
          keyPresses: 0,
          bubblesPopped: 0,
          starsCaught: 0,
        }
      }),
      flushSession: async () => {
        const { session } = get();
        // Only flush if there's actual activity
        if (session.keyPresses === 0 && session.bubblesPopped === 0 && session.starsCaught === 0) {
          return;
        }

        try {
          // Dynamic import to avoid SSR errors in Zustand
          const { db, auth } = await import('@/lib/firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log("Cannot flush session: User not logged in");
            return;
          }

          const sessionRef = doc(db, `parents/${currentUser.uid}/sessions`, session.id);
          await setDoc(sessionRef, session);
          
          console.log('Session flushed to Firestore successfully:', session.id);
          get().resetSession();
        } catch (e) {
          console.error("Failed to sync session to cloud", e);
        }
      },

      parentUser: null,
      setParentUser: (user) => set({ parentUser: user }),

      activeTask: null,
      setActiveTask: (task) => set({ activeTask: task, mode: task ? (task.type === 'typing' ? 'keyboard' : 'draw') : get().mode }),
      completeActiveTask: async () => {
        const { activeTask } = get();
        if (!activeTask) return;
        try {
          const { db } = await import('@/lib/firebase');
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'tasks', activeTask.id), { completed: true });
          set({ activeTask: null });
        } catch (e) {
          console.error("Failed to complete task", e);
        }
      },

      wordHistory: [],
      recordWord: (word) => {
        const wordUpper = word.toUpperCase();
        const history = get().wordHistory;
        if (history.includes(wordUpper)) return;
        
        const newHistory = [wordUpper, ...history].slice(0, 500);
        set({ wordHistory: newHistory });
      },
      resetWordHistory: () => set({ wordHistory: [] }),

      difficulty: 'easy',
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    {
      name: 'kiddlr-storage',
      partialize: (state) => ({
        settings: state.settings,
        session: state.session,
        wordHistory: state.wordHistory,
        difficulty: state.difficulty,
      }),
    }
  )
);
