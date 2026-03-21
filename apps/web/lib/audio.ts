import * as Tone from 'tone';

class AudioManager {
  private sampler: Tone.Sampler | null = null;
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    // A simple polyphonic synth for the pentatonic scale
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.synth.set({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, release: 1 }
    });

    await Tone.start();
    this.isInitialized = true;
  }

  playNote(note: string) {
    if (!this.isInitialized) this.init();
    this.synth?.triggerAttackRelease(note, '8n');
  }

  // Map keys to pentatonic notes
  playKey(key: string) {
    const pentatonicScale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    const index = key.charCodeAt(0) % pentatonicScale.length;
    this.playNote(pentatonicScale[index]);
  }
}

export const audioManager = new AudioManager();
