// src/audio/tests/WatchknightAudioEngine.test.ts
// Unit and Interaction Verification for WatchknightAudioEngine:
// - Mocked AudioContext & Web Audio API voice graphs
// - 80ms hover throttle
// - >5-trigger 30% attenuation rule within 3 seconds
// - +/-5% frequency variance bounds
// - 3D HRTF spatial panner
// - Real-time FFT spectral centroid math & beat flux pulse

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WatchknightAudioEngine,
  watchknightAudio,
} from '../WatchknightAudioEngine';

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

interface MockStereoPannerNode extends MockNode {
  pan: MockAudioParam;
}

interface MockPannerNode extends MockNode {
  panningModel: string;
  distanceModel: string;
  positionX: MockAudioParam;
  positionY: MockAudioParam;
  positionZ: MockAudioParam;
  setPosition: (x: number, y: number, z: number) => void;
}

interface MockCompressorNode extends MockNode {
  threshold: MockAudioParam;
  knee: MockAudioParam;
  ratio: MockAudioParam;
  attack: MockAudioParam;
  release: MockAudioParam;
}

interface MockAnalyserNode extends MockNode {
  fftSize: number;
  frequencyBinCount: number;
  smoothingTimeConstant: number;
  getByteFrequencyData: (buf: Uint8Array<ArrayBuffer>) => void;
}

interface MockBufferSourceNode extends MockNode {
  buffer: any;
  start: (time?: number) => void;
  stop: (time?: number) => void;
}

interface MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData: (ch: number) => Float32Array;
}

class MockAudioContext {
  public currentTime: number = 0;
  public sampleRate: number = 44100;
  public state: AudioContextState = 'running';
  public destination: MockNode = createMockNode();

  public createdGains: MockGainNode[] = [];
  public createdOscillators: MockOscillatorNode[] = [];
  public createdFilters: MockBiquadFilterNode[] = [];
  public createdStereoPanners: MockStereoPannerNode[] = [];
  public createdPanners: MockPannerNode[] = [];
  public createdCompressors: MockCompressorNode[] = [];
  public createdAnalysers: MockAnalyserNode[] = [];
  public createdBufferSources: MockBufferSourceNode[] = [];
  public createdBuffers: MockAudioBuffer[] = [];

  public createGain(): MockGainNode {
    const node: MockGainNode = {
      ...createMockNode(),
      gain: createMockAudioParam(1.0),
    };
    this.createdGains.push(node);
    return node;
  }

  public createOscillator(): MockOscillatorNode {
    const node: MockOscillatorNode = {
      ...createMockNode(),
      type: 'sine',
      frequency: createMockAudioParam(440),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.createdOscillators.push(node);
    return node;
  }

  public createBiquadFilter(): MockBiquadFilterNode {
    const node: MockBiquadFilterNode = {
      ...createMockNode(),
      type: 'lowpass',
      frequency: createMockAudioParam(350),
      Q: createMockAudioParam(1),
    };
    this.createdFilters.push(node);
    return node;
  }

  public createStereoPanner(): MockStereoPannerNode {
    const node: MockStereoPannerNode = {
      ...createMockNode(),
      pan: createMockAudioParam(0),
    };
    this.createdStereoPanners.push(node);
    return node;
  }

  public createPanner(): MockPannerNode {
    const node: MockPannerNode = {
      ...createMockNode(),
      panningModel: 'equalpower',
      distanceModel: 'inverse',
      positionX: createMockAudioParam(0),
      positionY: createMockAudioParam(0),
      positionZ: createMockAudioParam(0),
      setPosition: vi.fn((x: number, y: number, z: number) => {
        node.positionX.value = x;
        node.positionY.value = y;
        node.positionZ.value = z;
      }),
    };
    this.createdPanners.push(node);
    return node;
  }

  public createDynamicsCompressor(): MockCompressorNode {
    const node: MockCompressorNode = {
      ...createMockNode(),
      threshold: createMockAudioParam(-24),
      knee: createMockAudioParam(30),
      ratio: createMockAudioParam(12),
      attack: createMockAudioParam(0.003),
      release: createMockAudioParam(0.25),
    };
    this.createdCompressors.push(node);
    return node;
  }

  public createAnalyser(): MockAnalyserNode {
    const node: MockAnalyserNode = {
      ...createMockNode(),
      fftSize: 2048,
      frequencyBinCount: 512,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        // default: fill with 0
        buf.fill(0);
      }),
    };
    this.createdAnalysers.push(node);
    return node;
  }

  public createBufferSource(): MockBufferSourceNode {
    const node: MockBufferSourceNode = {
      ...createMockNode(),
      buffer: null,
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.createdBufferSources.push(node);
    return node;
  }

  public createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
    const channelArrays: Float32Array[] = [];
    for (let i = 0; i < channels; i++) {
      channelArrays.push(new Float32Array(length));
    }
    const buf: MockAudioBuffer = {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: vi.fn((ch: number) => channelArrays[ch] || new Float32Array(length)),
    };
    this.createdBuffers.push(buf);
    return buf;
  }

  public resume = vi.fn(async () => {
    this.state = 'running';
  });

  public suspend = vi.fn(async () => {
    this.state = 'suspended';
  });

  public close = vi.fn(async () => {
    this.state = 'closed';
  });
}

describe('WatchknightAudioEngine Procedural Soundscape & Spectral Extractor', () => {
  let mockCtx: MockAudioContext;
  let perfNow: number;

  beforeEach(() => {
    perfNow = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => perfNow);
    mockCtx = new MockAudioContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Lazy AudioContext Initialization & Calibrated Master Bus', () => {
    it('initializes Master Bus with GainNode(0.3) -> Limiter(-6dB) -> AnalyserNode(1024)', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      expect(mockCtx.createdGains.length).toBeGreaterThanOrEqual(1);
      const masterGain = mockCtx.createdGains[0];
      expect(masterGain.gain.value).toBe(0.3);

      expect(mockCtx.createdCompressors.length).toBe(1);
      const limiter = mockCtx.createdCompressors[0];
      expect(limiter.threshold.value).toBe(-6.0);
      expect(limiter.knee.value).toBe(4.0);
      expect(limiter.ratio.value).toBe(12.0);
      expect(limiter.attack.value).toBe(0.003);
      expect(limiter.release.value).toBe(0.1);

      expect(mockCtx.createdAnalysers.length).toBe(1);
      const analyser = mockCtx.createdAnalysers[0];
      expect(analyser.fftSize).toBe(1024);
      expect(analyser.smoothingTimeConstant).toBe(0.8);
      expect(engine.getContext()).toBe(mockCtx);
    });

    it('does not create AudioContext on hover before user interaction', () => {
      // Create engine without pre-injected context
      const engine = new WatchknightAudioEngine();
      // Without context and without unlock, playHoverTick does not crash or instantiate
      expect(engine.getContext()).toBeNull();
      engine.playHoverTick(0);
      expect(engine.getContext()).toBeNull();
    });

    it('lazily initializes AudioContext on explicit initContext call', () => {
      const engine = new WatchknightAudioEngine();
      expect(engine.getContext()).toBeNull();
      engine.initContext(mockCtx as unknown as AudioContext);
      expect(engine.getContext()).toBe(mockCtx);
      expect(engine.isEngineUnlocked()).toBe(true);
    });

    it('does not create AudioContext on playSpatialClick or playTransitionSwoosh before user interaction', () => {
      const engine = new WatchknightAudioEngine();
      expect(engine.getContext()).toBeNull();
      engine.playSpatialClick(0, 0, -1);
      expect(engine.getContext()).toBeNull();
      engine.playTransitionSwoosh(0.3);
      expect(engine.getContext()).toBeNull();
    });

    it('automatically resumes suspended context during initContext', () => {
      mockCtx.state = 'suspended';
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      expect(mockCtx.resume).toHaveBeenCalled();
      expect(engine.getContext()).toBe(mockCtx);
    });

    it('automatically mutes master gain and ignores unmuting when prefers-reduced-motion is active', () => {
      const engine = new WatchknightAudioEngine({
        context: mockCtx as unknown as AudioContext,
        reducedMotion: true,
      });
      expect(engine.isReducedMotion()).toBe(true);
      expect(engine.isAudioMuted()).toBe(true);

      const masterGain = engine.getMasterGain() as unknown as MockGainNode;
      expect(masterGain.gain.value).toBe(0.0);

      // Attempt to unmute while reducedMotion is active -> MUST REMAIN MUTED
      engine.setMuted(false);
      expect(engine.isAudioMuted()).toBe(true);
      expect(masterGain.gain.value).toBe(0.0);

      // Voice methods produce zero nodes
      engine.playHoverTick(0);
      engine.playSpatialClick(0, 0, -1);
      engine.playTransitionSwoosh(0.3);
      expect(mockCtx.createdOscillators.length).toBe(0);
      expect(mockCtx.createdBufferSources.length).toBe(0);
    });

    it('mutes master gain to 0.0 when setMuted(true) is invoked', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      expect(engine.isAudioMuted()).toBe(false);

      engine.setMuted(true);
      expect(engine.isAudioMuted()).toBe(true);
      const masterGain = engine.getMasterGain() as unknown as MockGainNode;
      expect(masterGain.gain.value).toBe(0.0);

      engine.setMuted(false);
      expect(engine.isAudioMuted()).toBe(false);
      expect(masterGain.gain.value).toBe(0.3);
    });

    it('toggles mute state and returns current state', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      expect(engine.toggleMute()).toBe(true);
      expect(engine.isAudioMuted()).toBe(true);
      expect(engine.toggleMute()).toBe(false);
      expect(engine.isAudioMuted()).toBe(false);
    });
  });

  describe('2. 80ms Hover Throttle (hoverThrottleMs: 80)', () => {
    it('throttles rapid hover tick invocations within the 80ms window', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      expect(engine.hoverThrottleMs).toBe(80);

      // Trigger 1 at t = 1000ms
      perfNow = 1000;
      engine.playHoverTick(0);
      expect(mockCtx.createdOscillators.length).toBe(1);

      // Trigger 2 at t = 1040ms (delta = 40ms < 80ms) -> THROTTLED
      perfNow = 1040;
      engine.playHoverTick(0.2);
      expect(mockCtx.createdOscillators.length).toBe(1);

      // Trigger 3 at t = 1079ms (delta = 79ms < 80ms) -> THROTTLED
      perfNow = 1079;
      engine.playHoverTick(-0.5);
      expect(mockCtx.createdOscillators.length).toBe(1);

      // Trigger 4 at t = 1080ms (delta = 80ms >= 80ms) -> ALLOWED
      perfNow = 1080;
      engine.playHoverTick(0.5);
      expect(mockCtx.createdOscillators.length).toBe(2);

      // Trigger 5 at t = 1120ms (delta = 40ms < 80ms) -> THROTTLED
      perfNow = 1120;
      engine.playHoverTick(0.1);
      expect(mockCtx.createdOscillators.length).toBe(2);

      // Trigger 6 at t = 1165ms (delta = 85ms >= 80ms) -> ALLOWED
      perfNow = 1165;
      engine.playHoverTick(-0.1);
      expect(mockCtx.createdOscillators.length).toBe(3);
    });
  });

  describe('3. >5-Trigger 30% Volume Attenuation Rule within 3 Seconds', () => {
    it('applies 30% volume reduction (0.7x factor) strictly after 5th trigger in 3000ms', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      perfNow = 1000;
      expect(engine.getAttenuationFactor()).toBe(1.0); // 1st trigger
      perfNow = 1100;
      expect(engine.getAttenuationFactor()).toBe(1.0); // 2nd trigger
      perfNow = 1200;
      expect(engine.getAttenuationFactor()).toBe(1.0); // 3rd trigger
      perfNow = 1300;
      expect(engine.getAttenuationFactor()).toBe(1.0); // 4th trigger
      perfNow = 1400;
      expect(engine.getAttenuationFactor()).toBe(1.0); // 5th trigger

      // 6th trigger within 3s -> > 5 triggers -> returns 0.7 (30% reduction)
      perfNow = 1500;
      expect(engine.getAttenuationFactor()).toBe(0.7);

      // 7th trigger within 3s remains attenuated
      perfNow = 1600;
      expect(engine.getAttenuationFactor()).toBe(0.7);

      // Advance time past 3000ms window (t = 5000ms)
      // Old triggers (1000..1600) fall outside (5000 - 3000 = 2000)
      perfNow = 5000;
      expect(engine.getAttenuationFactor()).toBe(1.0); // Back to full volume!
    });

    it('bakes attenuation into playHoverTick linear attack gain', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      // Trigger 5 hover ticks spaced by 100ms
      for (let i = 0; i < 5; i++) {
        perfNow = 1000 + i * 100;
        engine.playHoverTick(0);
      }

      // Check 5th gain node created (gain index 1..5, index 0 is masterGain)
      const fifthGain = mockCtx.createdGains[5];
      const ramp5 = fifthGain.gain.calls.find((c) => c.method === 'linearRampToValueAtTime');
      expect(ramp5).toBeDefined();
      expect(ramp5?.args[0]).toBeCloseTo(0.35 * 1.0, 4);

      // 6th hover tick -> attenuated!
      perfNow = 1600;
      engine.playHoverTick(0);

      const sixthGain = mockCtx.createdGains[6];
      const ramp6 = sixthGain.gain.calls.find((c) => c.method === 'linearRampToValueAtTime');
      expect(ramp6).toBeDefined();
      expect(ramp6?.args[0]).toBeCloseTo(0.35 * 0.7, 4);
    });
  });

  describe('4. +/-5% Frequency Variance Bounds', () => {
    it('constrains playHoverTick start and end frequencies strictly to +/-5%', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      const nominalStart = 1800;
      const nominalEnd = 420;
      const minStartAllowed = nominalStart * 0.95;
      const maxStartAllowed = nominalStart * 1.05;
      const minEndAllowed = nominalEnd * 0.95;
      const maxEndAllowed = nominalEnd * 1.05;

      const observedStarts: number[] = [];
      const observedEnds: number[] = [];

      // Run 50 iterations with distinct timestamps
      for (let i = 0; i < 50; i++) {
        perfNow = 1000 + i * 100;
        engine.playHoverTick(0);

        const osc = mockCtx.createdOscillators[i];
        expect(osc.type).toBe('triangle');

        const startCall = osc.frequency.calls.find((c) => c.method === 'setValueAtTime');
        const endCall = osc.frequency.calls.find((c) => c.method === 'exponentialRampToValueAtTime');

        expect(startCall).toBeDefined();
        expect(endCall).toBeDefined();

        const startFreq = startCall!.args[0];
        const endFreq = endCall!.args[0];

        expect(startFreq).toBeGreaterThanOrEqual(minStartAllowed - 1e-6);
        expect(startFreq).toBeLessThanOrEqual(maxStartAllowed + 1e-6);

        expect(endFreq).toBeGreaterThanOrEqual(minEndAllowed - 1e-6);
        expect(endFreq).toBeLessThanOrEqual(maxEndAllowed + 1e-6);

        observedStarts.push(startFreq);
        observedEnds.push(endFreq);
      }

      // Verify that frequency variance is actually non-constant
      const minObserved = Math.min(...observedStarts);
      const maxObserved = Math.max(...observedStarts);
      expect(maxObserved - minObserved).toBeGreaterThan(0.01);
    });

    it('configures bandpass filter for playHoverTick at 1600Hz and Q=3.5', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      perfNow = 1000;
      engine.playHoverTick(0.4);

      const filter = mockCtx.createdFilters[0];
      expect(filter.type).toBe('bandpass');
      expect(filter.frequency.value).toBe(1600);
      expect(filter.Q.value).toBe(3.5);

      const panner = mockCtx.createdStereoPanners[0];
      expect(panner.pan.value).toBe(0.4);
    });

    it('constrains playSpatialClick dual-layer frequencies strictly to +/-5%', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      const nominalBodyStart = 240;
      const nominalBodyEnd = 68;
      const nominalHarmonic = 1420;

      for (let i = 0; i < 20; i++) {
        const oscCountBefore = mockCtx.createdOscillators.length;
        engine.playSpatialClick(0.2, -0.4, -1.0);
        const bodyOsc = mockCtx.createdOscillators[oscCountBefore];
        const harmonicOsc = mockCtx.createdOscillators[oscCountBefore + 1];

        expect(bodyOsc.type).toBe('sine');
        expect(harmonicOsc.type).toBe('sine');

        const bodyStartCall = bodyOsc.frequency.calls.find((c) => c.method === 'setValueAtTime');
        const bodyEndCall = bodyOsc.frequency.calls.find((c) => c.method === 'exponentialRampToValueAtTime');
        const harmonicCall = harmonicOsc.frequency.calls.find((c) => c.method === 'setValueAtTime');

        expect(bodyStartCall!.args[0]).toBeGreaterThanOrEqual(nominalBodyStart * 0.95 - 1e-6);
        expect(bodyStartCall!.args[0]).toBeLessThanOrEqual(nominalBodyStart * 1.05 + 1e-6);

        expect(bodyEndCall!.args[0]).toBeGreaterThanOrEqual(nominalBodyEnd * 0.95 - 1e-6);
        expect(bodyEndCall!.args[0]).toBeLessThanOrEqual(nominalBodyEnd * 1.05 + 1e-6);

        expect(harmonicCall!.args[0]).toBeGreaterThanOrEqual(nominalHarmonic * 0.95 - 1e-6);
        expect(harmonicCall!.args[0]).toBeLessThanOrEqual(nominalHarmonic * 1.05 + 1e-6);
      }
    });

    it('configures 3D PannerNode with panningModel="HRTF" on playSpatialClick', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      engine.playSpatialClick(0.5, 0.25, -1.5);

      expect(mockCtx.createdPanners.length).toBe(1);
      const panner = mockCtx.createdPanners[0];
      expect(panner.panningModel).toBe('HRTF');
      expect(panner.distanceModel).toBe('inverse');
      expect(panner.positionX.value).toBe(0.5);
      expect(panner.positionY.value).toBe(0.25);
      expect(panner.positionZ.value).toBe(-1.5);
    });

    it('clamps stereo panner to [-1, 1] bounds for out-of-range normalizedX', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });

      perfNow = 1000;
      engine.playHoverTick(-3.5);
      const pannerLeft = mockCtx.createdStereoPanners[0];
      expect(pannerLeft.pan.value).toBe(-1);

      perfNow = 1100;
      engine.playHoverTick(4.2);
      const pannerRight = mockCtx.createdStereoPanners[1];
      expect(pannerRight.pan.value).toBe(1);
    });

    it('uses fallback 3D PannerNode with z = -1 when createStereoPanner is undefined', () => {
      const originalCreateStereoPanner = mockCtx.createStereoPanner;
      (mockCtx as any).createStereoPanner = undefined;

      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      perfNow = 1000;
      engine.playHoverTick(0.6);

      expect(mockCtx.createdPanners.length).toBe(1);
      const fallbackPanner = mockCtx.createdPanners[0];
      expect(fallbackPanner.panningModel).toBe('equalpower');
      expect(fallbackPanner.positionX.value).toBe(0.6);
      expect(fallbackPanner.positionY.value).toBe(0);
      expect(fallbackPanner.positionZ.value).toBe(-1);

      mockCtx.createStereoPanner = originalCreateStereoPanner;
    });
  });

  describe('5. White Noise Transition Swoosh', () => {
    it('generates random white noise buffer and sweeps bandpass filter 180Hz -> 1400Hz -> 220Hz', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      engine.playTransitionSwoosh(0.5);

      expect(mockCtx.createdBuffers.length).toBe(1);
      const buffer = mockCtx.createdBuffers[0];
      expect(buffer.sampleRate).toBe(44100);
      expect(buffer.length).toBe(Math.floor(44100 * 0.5));

      expect(mockCtx.createdBufferSources.length).toBe(1);
      const source = mockCtx.createdBufferSources[0];
      expect(source.buffer).toBe(buffer);

      expect(mockCtx.createdFilters.length).toBe(1);
      const filter = mockCtx.createdFilters[0];
      expect(filter.type).toBe('bandpass');
      expect(filter.Q.value).toBe(2.2);

      const freqCalls = filter.frequency.calls;
      expect(freqCalls[0].args[0]).toBe(180);
      expect(freqCalls[1].args[0]).toBe(1400);
      expect(freqCalls[2].args[0]).toBe(220);
    });

    it('safely clamps duration <= 0 or invalid duration without throwing DOMException', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      expect(() => engine.playTransitionSwoosh(0)).not.toThrow();
      expect(() => engine.playTransitionSwoosh(-0.5)).not.toThrow();
      expect(() => engine.playTransitionSwoosh(NaN)).not.toThrow();
    });
  });

  describe('6. Spectral Centroid Math (C = Sum(f_i * M_i) / Sum(M_i))', () => {
    it('returns 0.0 for silence (all zeros)', () => {
      const freqData = new Uint8Array(512);
      const centroidRaw = WatchknightAudioEngine.computeSpectralCentroid(freqData, false);
      const centroidNorm = WatchknightAudioEngine.computeSpectralCentroid(freqData, true);
      expect(centroidRaw).toBe(0.0);
      expect(centroidNorm).toBe(0.0);
    });

    it('computes exact centroid for an impulse at bin 0', () => {
      const freqData = new Uint8Array(512);
      freqData[0] = 255;
      const centroidRaw = WatchknightAudioEngine.computeSpectralCentroid(freqData, false);
      const centroidNorm = WatchknightAudioEngine.computeSpectralCentroid(freqData, true);
      expect(centroidRaw).toBe(0.0);
      expect(centroidNorm).toBe(0.0);
    });

    it('computes exact centroid for an impulse at bin K', () => {
      const freqData = new Uint8Array(512);
      const K = 128;
      freqData[K] = 200;

      const centroidRaw = WatchknightAudioEngine.computeSpectralCentroid(freqData, false);
      const centroidNorm = WatchknightAudioEngine.computeSpectralCentroid(freqData, true);

      expect(centroidRaw).toBeCloseTo(K, 6);
      expect(centroidNorm).toBeCloseTo(K / 512, 6);
    });

    it('computes exact mid-point centroid for symmetric spectrum', () => {
      const freqData = new Uint8Array(512);
      freqData[10] = 100;
      freqData[20] = 100;

      const centroidRaw = WatchknightAudioEngine.computeSpectralCentroid(freqData, false);
      // (10 * 100 + 20 * 100) / 200 = 3000 / 200 = 15.0
      expect(centroidRaw).toBeCloseTo(15.0, 6);
      expect(WatchknightAudioEngine.computeSpectralCentroid(freqData, true)).toBeCloseTo(15.0 / 512, 6);
    });

    it('computes theoretical center for uniform spectrum', () => {
      const freqData = new Uint8Array(512);
      freqData.fill(50);

      const centroidRaw = WatchknightAudioEngine.computeSpectralCentroid(freqData, false);
      // Sum_{i=0}^{N-1} i / N = (N - 1) / 2 = 511 / 2 = 255.5
      expect(centroidRaw).toBeCloseTo(255.5, 4);
      expect(WatchknightAudioEngine.computeSpectralCentroid(freqData, true)).toBeCloseTo(255.5 / 512, 4);
    });
  });

  describe('7. Real-Time FFT Spectral Feature Extraction & Beat Flux', () => {
    it('extracts Bass (0..31), Mid (32..159), Treble (160..511) with 0.15 exponential smoothing', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      const analyser = mockCtx.createdAnalysers[0];

      // Provide synthetic frequency data: Bass = 255, Mid = 0, Treble = 0
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 255;
        for (let i = 32; i < buf.length; i++) buf[i] = 0;
      });

      // Frame 1
      engine.updateSpectralUniforms();

      // normBass = 1.0. With 0.15 smoothing from 0.0 -> 0.0 + (1.0 - 0.0) * 0.15 = 0.15
      expect(engine.uniforms.uAudioBass.value).toBeCloseTo(0.15, 4);
      expect(engine.uniforms.uAudioMid.value).toBeCloseTo(0.0, 4);
      expect(engine.uniforms.uAudioTreble.value).toBeCloseTo(0.0, 4);

      // Frame 2
      engine.updateSpectralUniforms();
      // 0.15 + (1.0 - 0.15) * 0.15 = 0.2775
      expect(engine.uniforms.uAudioBass.value).toBeCloseTo(0.2775, 4);
    });

    it('triggers uBeatPulse = 1.0 when positive bass flux exceeds 1.5 * mean history', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      const analyser = mockCtx.createdAnalysers[0];

      perfNow = 1000;

      // Seed 12 quiet frames to establish a baseline energy history and allow decay past 220ms cooldown
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 10;
      });
      for (let f = 0; f < 12; f++) {
        perfNow += 25;
        engine.updateSpectralUniforms();
      }

      expect(engine.uniforms.uBeatPulse.value).toBeLessThan(0.3);

      // Massive bass transient onset past 220ms cooldown!
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 255;
      });
      perfNow += 25;
      engine.updateSpectralUniforms();

      // uBeatPulse triggered to 1.0
      expect(engine.uniforms.uBeatPulse.value).toBe(1.0);
    });

    it('enforces 220ms cooldown on uBeatPulse trigger', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext });
      const analyser = mockCtx.createdAnalysers[0];

      perfNow = 1000;
      // First burst
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 255;
      });
      engine.updateSpectralUniforms();
      expect(engine.uniforms.uBeatPulse.value).toBe(1.0);

      // Reset prev data to allow positive flux again
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 0;
      });
      perfNow = 1050; // 50ms later
      engine.updateSpectralUniforms();

      // Second burst at t = 1100ms (100ms elapsed < 220ms cooldown) -> COOLDOWN BLOCKS TRIGGER
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 255;
      });
      perfNow = 1100;
      engine.updateSpectralUniforms();
      expect(engine.uniforms.uBeatPulse.value).toBeLessThan(1.0);

      // Reset to 0
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 0;
      });
      perfNow = 1200;
      engine.updateSpectralUniforms();

      // Third burst at t = 1250ms (> 220ms since first burst at 1000ms) -> ALLOWED
      analyser.getByteFrequencyData = vi.fn((buf: Uint8Array<ArrayBuffer>) => {
        for (let i = 0; i < 32; i++) buf[i] = 255;
      });
      perfNow = 1250;
      engine.updateSpectralUniforms();
      expect(engine.uniforms.uBeatPulse.value).toBe(1.0);
    });

    it('decays spectral uniforms when prefers-reduced-motion is active', () => {
      const engine = new WatchknightAudioEngine({
        context: mockCtx as unknown as AudioContext,
        reducedMotion: true,
      });
      engine.uniforms.uAudioBass.value = 0.8;
      engine.uniforms.uBeatPulse.value = 1.0;

      engine.updateSpectralUniforms();

      expect(engine.uniforms.uAudioBass.value).toBeCloseTo(0.8 * 0.9, 4);
      expect(engine.uniforms.uBeatPulse.value).toBeCloseTo(1.0 * 0.88, 4);
    });
  });

  describe('8. Singleton Export & Lifecycle Cleanup', () => {
    it('exports watchknightAudio singleton as instance of WatchknightAudioEngine', () => {
      expect(watchknightAudio).toBeDefined();
      expect(watchknightAudio).toBeInstanceOf(WatchknightAudioEngine);
      expect(typeof watchknightAudio.playHoverTick).toBe('function');
      expect(typeof watchknightAudio.playSpatialClick).toBe('function');
      expect(typeof watchknightAudio.playTransitionSwoosh).toBe('function');
    });

    it('attaches and detaches gsap ticker loop cleanly', () => {
      const engine = new WatchknightAudioEngine({ context: mockCtx as unknown as AudioContext, autoAttachTicker: false });
      expect(() => engine.attachTicker()).not.toThrow();
      expect(() => engine.detachTicker()).not.toThrow();
      expect(() => engine.destroy()).not.toThrow();
      expect(engine.getContext()).toBeNull();
    });
  });
});
