import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpeechManager } from '../speech';

describe('SpeechManager', () => {
  let originalSpeechSynthesis: typeof window.speechSynthesis;

  beforeEach(() => {
    originalSpeechSynthesis = window.speechSynthesis;

    const speakMock = vi.fn();
    const cancelMock = vi.fn();
    const getVoicesMock = vi.fn().mockReturnValue([
      { name: 'Google US English', lang: 'en-US' } as SpeechSynthesisVoice
    ]);

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: getVoicesMock,
        onvoiceschanged: null,
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      writable: true
    });
    vi.clearAllMocks();
  });

  it('should create a singleton instance', () => {
    const instance1 = SpeechManager.getInstance();
    const instance2 = SpeechManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should not crash when speak is called', () => {
    const manager = SpeechManager.getInstance();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => manager.speak("Hello testing")).not.toThrow();
    consoleSpy.mockRestore();
  });

  it('should not crash when cancel is called', () => {
    const manager = SpeechManager.getInstance();
    expect(() => manager.cancel()).not.toThrow();
  });
});
