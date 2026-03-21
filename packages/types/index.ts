export type Mode = 'keyboard' | 'draw' | 'bubbles' | 'stars' | 'word-assoc' | 'animal-sounds' | 'opposite' | 'emoji';

export interface Settings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: 'colorful' | 'space' | 'ocean' | 'jungle';
}

export interface SessionStats {
  id: string;
  startedAt: number;
  keyPresses: number;
  bubblesPopped: number;
  starsCaught: number;
}

export interface ParentProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  childName: string;
  childAge: string | number;
  createdAt: number;
}
