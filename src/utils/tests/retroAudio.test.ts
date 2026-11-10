import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetroAudioEngine, retroAudio, playBlip, playOpenWindow, playKeyTick } from '../retroAudio';

describe('PROCEDURAL 8-BIT WEB AUDIO SYNTHESIZER (src/utils/retroAudio.ts)', () => {
  let mockCtx: any;
  let mockOsc: any;
  let mockGain: any;
  let createdOscillators: any[] = [];
  let createdGains: any[] = [];

  beforeEach(() => {
    createdOscillators = [];
    createdGains = [];

    mockOsc = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockGain = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockCtx = {
      state: 'running',
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn(() => {
        const osc = { ...mockOsc };
        createdOscillators.push(osc);
        return osc;
      }),
      createGain: vi.fn(() => {
        const gain = { ...mockGain };
        createdGains.push(gain);
        return gain;
      }),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    retroAudio.setMuted(false);
  });

  it('manages mute states controlled by the monitor bezel [SFX: ON/OFF] toggle', () => {
    const engine = new RetroAudioEngine();
    expect(engine.isMuted()).toBe(false);

    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);

    const toggled = engine.toggleMute();
    expect(toggled).toBe(false);
    expect(engine.isMuted()).toBe(false);
  });

  it('playBlip(): synthesizes 12ms low-volume square-wave tick at 680Hz', () => {
    const engine = new RetroAudioEngine();
    engine.setContext(mockCtx);

    engine.playBlip();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockCtx.createGain).toHaveBeenCalledTimes(1);

    const osc = createdOscillators[0];
    const gain = createdGains[0];

    // Square wave oscillator
    expect(osc.type).toBe('square');
    // 680Hz frequency
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(680, 10);
    // Low volume click-free envelope (12ms)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.05, 10);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10 + 0.012);
    // Starts and stops cleanly
    expect(osc.start).toHaveBeenCalledWith(10);
    expect(osc.stop).toHaveBeenCalledWith(10 + 0.012);
  });

  it('playOpenWindow(): synthesizes two-tone 8-bit confirm chime (520Hz -> 880Hz)', () => {
    const engine = new RetroAudioEngine();
    engine.setContext(mockCtx);

    engine.playOpenWindow();

    // Two oscillators created for the two tones
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockCtx.createGain).toHaveBeenCalledTimes(2);

    const [osc1, osc2] = createdOscillators;
    const [gain1, gain2] = createdGains;

    // Tone 1: 520Hz square wave
    expect(osc1.type).toBe('square');
    expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(520, 10);
    expect(gain1.gain.setValueAtTime).toHaveBeenCalledWith(0.055, 10);

    // Tone 2: 880Hz square wave
    expect(osc2.type).toBe('square');
    expect(osc2.frequency.setValueAtTime).toHaveBeenCalledWith(880, 10 + 0.055);
    expect(gain2.gain.setValueAtTime).toHaveBeenCalledWith(0.065, 10 + 0.055);
  });

  it('playKeyTick(): synthesizes soft mechanical key click for typewriter reveal', () => {
    const engine = new RetroAudioEngine();
    engine.setContext(mockCtx);

    engine.playKeyTick();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockCtx.createGain).toHaveBeenCalledTimes(1);

    const osc = createdOscillators[0];
    const gain = createdGains[0];

    // Triangle wave for soft mechanical keystroke
    expect(osc.type).toBe('triangle');
    // Soft volume (0.025)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.025, 10);
    // 10ms envelope
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10 + 0.01);
  });

  it('suppresses all sound effects when muted', () => {
    const engine = new RetroAudioEngine();
    engine.setContext(mockCtx);
    engine.setMuted(true);

    engine.playBlip();
    engine.playOpenWindow();
    engine.playKeyTick();

    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    expect(mockCtx.createGain).not.toHaveBeenCalled();
  });

  it('handles null AudioContext gracefully without throwing exceptions', () => {
    const engine = new RetroAudioEngine();
    engine.setContext(null);

    expect(() => engine.playBlip()).not.toThrow();
    expect(() => engine.playOpenWindow()).not.toThrow();
    expect(() => engine.playKeyTick()).not.toThrow();
  });

  it('exports convenient global helper functions', () => {
    retroAudio.setContext(mockCtx);

    expect(() => playBlip()).not.toThrow();
    expect(() => playOpenWindow()).not.toThrow();
    expect(() => playKeyTick()).not.toThrow();
  });

  it('unlocks suspended AudioContext on first user gesture', () => {
    const engine = new RetroAudioEngine();
    mockCtx.state = 'suspended';
    engine.setContext(mockCtx);

    engine.unlock();
    expect(mockCtx.resume).toHaveBeenCalled();
  });
});
