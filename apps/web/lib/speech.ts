export class SpeechManager {
  private static instance: SpeechManager;
  private synth: SpeechSynthesis | null = null;
  private isSupported: boolean = false;
  private defaultVoice: SpeechSynthesisVoice | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
      
      // Load voices if available immediately, or wait for event
      this.loadVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }

  public static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
       // Prefer a clear, friendly, and somewhat slow English voice if possible
       this.defaultVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Samantha') || v.name.includes('Google'))) || voices[0];
    }
  }

  public speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.isSupported || !this.synth) {
      console.warn("Speech Synthesis is not supported in this environment.", text);
      return;
    }

    // Cancel any currently playing speech to prevent overlap
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Default settings optimized for clear, friendly instructions for kids
    utterance.rate = options?.rate ?? 0.85; // slightly slower for comprehension
    utterance.pitch = options?.pitch ?? 1.2; // slightly higher pitch sounds friendlier
    utterance.volume = options?.volume ?? 1.0;
    
    if (this.defaultVoice) {
      utterance.voice = this.defaultVoice;
    }

    this.synth.speak(utterance);
  }

  public cancel() {
    if (this.isSupported && this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechManager = SpeechManager.getInstance();
