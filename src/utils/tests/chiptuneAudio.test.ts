import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChiptuneAudioEngine, chiptuneAudio } from '../chiptuneAudio';

interface MockParamCall {
  method: string;
  args: any[];
}

interface MockAudioParam {
  value: number;
  calls: MockParamCall[];
  setValueAtTime: (val: number, time: number) => void;
  exponentialRampToValueAtTime: (val: number, time: number) => void;
  linearRampToValueAtTime: (val: number, time: number) => void;
  setTargetAtTime: (val: number, time: number, constant: number) => void;
  cancelScheduledValues: (time: number) => void;
}

const createMockAudioParam = (initialValue: number = 0): MockAudioParam => {
  const calls: MockParamCall[] = [];
  const param: MockAudioParam = {
    value: initialValue,
    calls,
    setValueAtTime: vi.fn((val: number, time: number) => {
      param.value = val;
      calls.push({ method: 'setValueAtTime', args: [val, time] });
    }),
    exponentialRampToValueAtTime: vi.fn((val: number, time: number) => {
      calls.push({ method: 'exponentialRampToValueAtTime', args: [val, time] });
    }),
    linearRampToValueAtTime: vi.fn((val: number, time: number) => {
      calls.push({ method: 'linearRampToValueAtTime', args: [val, time] });
    }),
    setTargetAtTime: vi.fn((val: number, time: number, constant: number) => {
      param.value = val;
      calls.push({ method: 'setTargetAtTime', args: [val, time, constant] });
    }),
    cancelScheduledValues: vi.fn((time: number) => {
      calls.push({ method: 'cancelScheduledValues', args: [time] });
    }),
  };
  return param;
};

interface MockNode {
  connect: (dest: any) => any;
  disconnect: () => void;
}

const createMockNode = (): MockNode => ({
  connect: vi.fn((dest: any) => dest),
  disconnect: vi.fn(),
});

interface MockGainNode extends MockNode {
  gain: MockAudioParam;
}

interface MockOscillatorNode extends MockNode {
  type: OscillatorType;
  frequency: MockAudioParam;
  start: (time?: number) => void;
  stop: (time?: number) => void;
}

interface MockBiquadFilterNode extends MockNode {
  type: BiquadFilterType;
  frequency: MockAudioParam;
  Q: MockAudioParam;
}

interface MockAnalyserNode extends MockNode {
  fftSize: number;
  frequencyBinCount: number;
  smoothingTimeConstant: number;
  getByteFrequencyData: (arr: Uint8Array) => void;
}

interface MockAudioBufferSourceNode extends MockNode {
  buffer: any;
  start: (time?: number) => void;
  stop: (time?: number) => void;
}

class MockAudioContext {
  public currentTime: number = 0.5;
  public state: AudioContextState = 'running';
  public sampleRate: number = 44100;
  public destination: any = { channelCount: 2 };

  public createdOscillators: MockOscillatorNode[] = [];
  public createdGains: MockGainNode[] = [];
  public createdFilters: MockBiquadFilterNode[] = [];
  public createdAnalysers: MockAnalyserNode[] = [];
  public createdBufferSources: MockAudioBufferSourceNode[] = [];

  public createGain(): MockGainNode {
    const gain: MockGainNode = {
      ...createMockNode(),
      gain: createMockAudioParam(1.0),
    };
    this.createdGains.push(gain);
    return gain;
  }

  public createOscillator(): MockOscillatorNode {
    const osc: MockOscillatorNode = {
      ...createMockNode(),
      type: 'sine',
      frequency: createMockAudioParam(440),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.createdOscillators.push(osc);
    return osc;
  }

  public createBiquadFilter(): MockBiquadFilterNode {
    const filter: MockBiquadFilterNode = {
      ...createMockNode(),
      type: 'lowpass',
      frequency: createMockAudioParam(350),
      Q: createMockAudioParam(1.0),
    };
    this.createdFilters.push(filter);
    return filter;
  }

  public createAnalyser(): MockAnalyserNode {
    const analyser: MockAnalyserNode = {
      ...createMockNode(),
      fftSize: 256,
      frequencyBinCount: 128,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: vi.fn((arr: Uint8Array) => {
        // Mock bass energy in bins 0..7
        for (let i = 0; i < Math.min(8, arr.length); i++) {
          arr[i] = 180;
        }
      }),
    };
    this.createdAnalysers.push(analyser);
    return analyser;
  }

  public createBuffer(channels: number, length: number, sampleRate: number): any {
    const channelData = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => channelData,
    };
  }

  public createBufferSource(): MockAudioBufferSourceNode {
    const source: MockAudioBufferSourceNode = {
      ...createMockNode(),
      buffer: null,
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.createdBufferSources.push(source);
    return source;
  }

  public resume = vi.fn(async () => {
    this.state = 'running';
  });

  public close = vi.fn(async () => {
    this.state = 'closed';
  });
}

describe('ChiptuneAudioEngine (src/utils/chiptuneAudio.ts)', () => {
  let mockCtx: MockAudioContext;
  let engine: ChiptuneAudioEngine;

  beforeEach(() => {
    if (typeof (globalThis as any).window === 'undefined') {
      const listeners = new Map<string, Array<(e: unknown) => void>>();
      (globalThis as any).window = {
        addEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
          const list = listeners.get(event) || [];
          list.push(cb);
          listeners.set(event, list);
        }),
        removeEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
          const list = listeners.get(event) || [];
          listeners.set(event, list.filter((item) => item !== cb));
        }),
        dispatchEvent: vi.fn((event: Event) => {
          const list = listeners.get(event.type) || [];
          list.forEach((cb) => cb(event));
          return true;
        }),
        matchMedia: vi.fn(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      };
    }
    mockCtx = new MockAudioContext();
    engine = new ChiptuneAudioEngine();
    engine.initContext(mockCtx as unknown as AudioContext);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('Initialization & Master Audio Graph', () => {
    it('exports chiptuneAudio singleton as instance of ChiptuneAudioEngine', () => {
      expect(chiptuneAudio).toBeDefined();
      expect(chiptuneAudio).toBeInstanceOf(ChiptuneAudioEngine);
      expect(typeof chiptuneAudio.playPixelTick).toBe('function');
      expect(typeof chiptuneAudio.playCoinSFX).toBe('function');
      expect(typeof chiptuneAudio.playPowerUpSFX).toBe('function');
      expect(typeof chiptuneAudio.playNoiseTap).toBe('function');
      expect(typeof chiptuneAudio.toggleChiptuneBGM).toBe('function');
      expect(typeof chiptuneAudio.getAudioBass).toBe('function');
    });

    it('creates Master Gain and AnalyserNode with fftSize = 256', () => {
      const analyser = engine.getAnalyser() as unknown as MockAnalyserNode;
      expect(analyser).toBeDefined();
      expect(analyser.fftSize).toBe(256);
      expect(analyser.smoothingTimeConstant).toBe(0.8);
      expect(analyser.connect).toHaveBeenCalledWith(mockCtx.destination);
    });

    it('sets initial uniform values to 0.0', () => {
      expect(engine.uniforms.uAudioBass.value).toBe(0.0);
      expect(engine.uniforms.u_audioBass.value).toBe(0.0);
    });
  });

  describe('UI Hover: playPixelTick', () => {
    it('synthesizes a crisp 25ms square wave tick at 880Hz with exponential ramp to eliminate clicks', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;
      const beforeGainCount = mockCtx.createdGains.length;

      engine.playPixelTick();

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 1);
      expect(mockCtx.createdGains.length).toBe(beforeGainCount + 1);

      const osc = mockCtx.createdOscillators[beforeOscCount];
      const gain = mockCtx.createdGains[beforeGainCount];

      expect(osc.type).toBe('square');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(880, mockCtx.currentTime);

      // Volume 0.05 and exponential ramp to 0.001 at now + 0.025
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.05, mockCtx.currentTime);
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, mockCtx.currentTime + 0.025);

      expect(osc.start).toHaveBeenCalledWith(mockCtx.currentTime);
      expect(osc.stop).toHaveBeenCalledWith(mockCtx.currentTime + 0.026);
    });

    it('does not produce sound if engine is muted', () => {
      engine.setMuted(true);
      const beforeOscCount = mockCtx.createdOscillators.length;

      engine.playPixelTick();

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount);
    });
  });

  describe('Project / Cartridge Select: playCoinSFX', () => {
    it('synthesizes classic 2-tone 8-bit coin chime (987Hz for 0.1s, then 1318Hz at 100ms for 0.15s)', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;

      engine.playCoinSFX();

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 2);

      const osc1 = mockCtx.createdOscillators[beforeOscCount];
      const osc2 = mockCtx.createdOscillators[beforeOscCount + 1];

      expect(osc1.type).toBe('square');
      expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(987, mockCtx.currentTime);
      expect(osc1.start).toHaveBeenCalledWith(mockCtx.currentTime);
      expect(osc1.stop).toHaveBeenCalledWith(mockCtx.currentTime + 0.105);

      expect(osc2.type).toBe('square');
      expect(osc2.frequency.setValueAtTime).toHaveBeenCalledWith(1318, mockCtx.currentTime + 0.1);
      expect(osc2.start).toHaveBeenCalledWith(mockCtx.currentTime + 0.1);
      expect(osc2.stop).toHaveBeenCalledWith(mockCtx.currentTime + 0.255);
    });
  });

  describe('Render-Pass / Terminal Execute: playPowerUpSFX', () => {
    it('synthesizes rising square wave arpeggio sweep (261.63Hz -> 523.25Hz -> 659.25Hz -> 1046.50Hz over 0.45s)', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;

      engine.playPowerUpSFX();

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 4);

      const frequencies = [261.63, 523.25, 659.25, 1046.50];
      const stepDuration = 0.45 / 4;

      for (let i = 0; i < 4; i++) {
        const osc = mockCtx.createdOscillators[beforeOscCount + i];
        expect(osc.type).toBe('square');
        const expectedStartTime = mockCtx.currentTime + i * stepDuration;
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(frequencies[i], expectedStartTime);
        expect(osc.start).toHaveBeenCalledWith(expectedStartTime);
      }
    });
  });

  describe('Snare / Keystroke Click: playNoiseTap', () => {
    it('shapes 0.04s white noise buffer through bandpass filter for mechanical keyboard feedback', () => {
      const beforeBufferCount = mockCtx.createdBufferSources.length;
      const beforeFilterCount = mockCtx.createdFilters.length;

      engine.playNoiseTap();

      expect(mockCtx.createdBufferSources.length).toBe(beforeBufferCount + 1);
      expect(mockCtx.createdFilters.length).toBe(beforeFilterCount + 1);

      const source = mockCtx.createdBufferSources[beforeBufferCount];
      const filter = mockCtx.createdFilters[beforeFilterCount];

      expect(source.buffer).toBeDefined();
      expect(filter.type).toBe('bandpass');
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1200, mockCtx.currentTime);
      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(2.0, mockCtx.currentTime);

      expect(source.start).toHaveBeenCalledWith(mockCtx.currentTime);
      expect(source.stop).toHaveBeenCalledWith(mockCtx.currentTime + 0.042);
    });
  });

  describe('Toggleable Lo-Fi 8-Bit Chiptune BGM Loop', () => {
    it('starts and stops BGM loop on toggleChiptuneBGM', () => {
      expect(engine.isBGMActive()).toBe(false);

      const isPlaying = engine.toggleChiptuneBGM();
      expect(isPlaying).toBe(true);
      expect(engine.isBGMActive()).toBe(true);

      const isNowStopped = engine.toggleChiptuneBGM();
      expect(isNowStopped).toBe(false);
      expect(engine.isBGMActive()).toBe(false);
    });

    it('unmutes audio if currently muted when starting BGM', () => {
      engine.setMuted(true);
      expect(engine.isSoundMuted()).toBe(true);

      engine.startChiptuneBGM();
      expect(engine.isSoundMuted()).toBe(false);
      expect(engine.isBGMActive()).toBe(true);

      engine.stopChiptuneBGM();
    });

    it('dispatches wk-chiptune-bgm-change event with active status on start and stop', () => {
      const listener = vi.fn();
      window.addEventListener('wk-chiptune-bgm-change', listener);

      engine.startChiptuneBGM();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { active: true },
        })
      );

      engine.stopChiptuneBGM();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { active: false },
        })
      );

      window.removeEventListener('wk-chiptune-bgm-change', listener);
    });

    it('smoothly ramps BGM sub-gain down on stopChiptuneBGM to mute future scheduled notes', () => {
      engine.startChiptuneBGM();
      const bgmGainParam = (engine as any).bgmGain.gain as MockAudioParam;
      expect(bgmGainParam.linearRampToValueAtTime).toHaveBeenCalledWith(0.06, expect.any(Number));

      engine.stopChiptuneBGM();
      expect(bgmGainParam.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, expect.any(Number));
    });
  });

  describe('Real-Time FFT Bass Spectrum: getAudioBass', () => {
    it('extracts normalized bass frequency energy and updates uniforms', () => {
      const bass = engine.getAudioBass();

      expect(bass).toBeGreaterThan(0.0);
      expect(bass).toBeLessThanOrEqual(1.0);
      expect(engine.uniforms.uAudioBass.value).toBe(bass);
      expect(engine.uniforms.u_audioBass.value).toBe(bass);
    });

    it('smoothly decays bass value when muted', () => {
      engine.getAudioBass();
      engine.setMuted(true);

      const decayed = engine.getAudioBass();
      expect(decayed).toBeLessThan(0.7);
    });
  });

  describe('Section Boundary Shutter Ratchet SFX: playShutterRollTick', () => {
    it('synthesizes low-pass 140Hz sawtooth and noise burst when velocity >= 150px/s', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;
      const beforeBufferSources = mockCtx.createdBufferSources.length;

      engine.playShutterRollTick(200);

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 1);
      expect(mockCtx.createdBufferSources.length).toBe(beforeBufferSources + 1);

      const osc = mockCtx.createdOscillators[beforeOscCount];
      expect(osc.type).toBe('sawtooth');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(140, expect.any(Number));
    });

    it('ignores calls when scroll velocity is under 150px/s', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;
      const beforeBufferSources = mockCtx.createdBufferSources.length;

      engine.playShutterRollTick(100);

      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount);
      expect(mockCtx.createdBufferSources.length).toBe(beforeBufferSources);
    });

    it('throttles rapid consecutive triggers spaced under 90ms', () => {
      const beforeOscCount = mockCtx.createdOscillators.length;

      // First call triggers
      engine.playShutterRollTick(250);
      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 1);

      // Immediate second call should be ignored by 90ms throttle
      engine.playShutterRollTick(300);
      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount + 1);
    });

    it('reuses cached noise AudioBuffer across consecutive triggers to eliminate GC allocations', () => {
      const createBufferSpy = vi.spyOn(mockCtx, 'createBuffer');

      // Call 1
      engine.playShutterRollTick(200);
      expect(createBufferSpy).toHaveBeenCalledTimes(1);

      // Advance mock timer beyond 90ms throttle
      (engine as any).lastShutterTickTime = 0;

      // Call 2: Buffer should be reused without re-allocating
      engine.playShutterRollTick(200);
      expect(createBufferSpy).toHaveBeenCalledTimes(1);
    });

    it('respects global mute state and does not create nodes when muted', () => {
      engine.setMuted(true);
      const beforeOscCount = mockCtx.createdOscillators.length;

      engine.playShutterRollTick(500);
      expect(mockCtx.createdOscillators.length).toBe(beforeOscCount);
    });
  });
});

