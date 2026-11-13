// src/audio/WatchknightAudioEngine.ts
// Zero-Asset Procedural Web Audio Synthesizer, 3D Spatial Panner & FFT Shader Bridge

import gsap from 'gsap';

export interface AudioShaderUniforms {
  uAudioBass: { value: number };
  uAudioMid: { value: number };
  uAudioTreble: { value: number };
  uSpectralCentroid: { value: number };
  uBeatPulse: { value: number };
}

export interface WatchknightAudioEngineOptions {
  context?: AudioContext;
  autoAttachTicker?: boolean;
  reducedMotion?: boolean;
}

export class WatchknightAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private prevBassData: Float32Array = new Float32Array(32);

  private isMuted: boolean = false;
  private reducedMotion: boolean = false;
  private isUnlocked: boolean = false;
  private lastHoverTime: number = 0;
  public readonly hoverThrottleMs: number = 80;
  private triggerTimestamps: number[] = [];
  private lastBeatTime: number = -1000;
  private energyHistory: number[] = [];
  private chiptuneInterval: ReturnType<typeof setInterval> | null = null;
  private isChiptuneActive: boolean = false;
  private chiptuneStep: number = 0;

  private isTickerAttached: boolean = false;
  private tickerBound: () => void;
  private unlockHandler: (() => void) | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  public readonly uniforms: AudioShaderUniforms = {
    uAudioBass: { value: 0.0 },
    uAudioMid: { value: 0.0 },
    uAudioTreble: { value: 0.0 },
    uSpectralCentroid: { value: 0.0 },
    uBeatPulse: { value: 0.0 },
  };

  constructor(options?: WatchknightAudioEngineOptions) {
    this.tickerBound = () => this.updateSpectralUniforms();

    if (options?.reducedMotion !== undefined) {
      this.reducedMotion = options.reducedMotion;
      if (this.reducedMotion) {
        this.isMuted = true;
      }
    }

    if (options?.context) {
      this.initContext(options.context);
    }

    if (typeof window !== 'undefined') {
      if (options?.reducedMotion === undefined) {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (mq) {
          this.reducedMotion = mq.matches;
          if (this.reducedMotion) {
            this.isMuted = true;
          }
          this.mediaQueryHandler = (e: MediaQueryListEvent) => {
            this.reducedMotion = e.matches;
            if (this.reducedMotion) {
              this.setMuted(true);
            }
          };
          mq.addEventListener?.('change', this.mediaQueryHandler);
        }
      }

      const unlock = () => {
        this.isUnlocked = true;
        this.initContext();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        this.unlockHandler = null;
      };
      this.unlockHandler = unlock;
      window.addEventListener('pointerdown', unlock, { passive: true, once: true });
      window.addEventListener('keydown', unlock, { passive: true, once: true });

      if (options?.autoAttachTicker !== false) {
        this.attachTicker();
      }
    }
  }

  /**
   * Lazily initializes or binds AudioContext on user gesture, configuring the calibrated Master Bus:
   * Master Gain (0.3 default) -> DynamicsCompressorNode limiter (-6dB) -> AnalyserNode (fftSize: 1024) -> destination.
   */
  public initContext(customCtx?: AudioContext): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    if (customCtx) {
      this.ctx = customCtx;
    } else {
      const AudioCtx = typeof window !== 'undefined'
        ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
        : (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;

      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isUnlocked = true;

    // Master Bus: Gain (0.3 default) -> Compressor/Limiter -> Analyser -> Destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted || this.reducedMotion ? 0.0 : 0.3;

    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6.0;
    this.limiter.knee.value = 4.0;
    this.limiter.ratio.value = 12.0;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024; // 512 frequency bins
    this.analyser.smoothingTimeConstant = 0.8;
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    return this.ctx;
  }

  /**
   * Sliding window loudness calibration:
   * Returns 0.7 (30% attenuation) after the 5th trigger within 3 seconds, else 1.0.
   */
  public getAttenuationFactor(): number {
    const now = performance.now();
    this.triggerTimestamps = this.triggerTimestamps.filter((t) => now - t <= 3000);
    this.triggerTimestamps.push(now);
    return this.triggerTimestamps.length > 5 ? 0.7 : 1.0;
  }

  public getTriggerCount(): number {
    return this.triggerTimestamps.length;
  }

  public resetTriggers(): void {
    this.triggerTimestamps = [];
  }

  public isAudioMuted(): boolean {
    return this.isMuted || this.reducedMotion;
  }

  public isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  public isEngineUnlocked(): boolean {
    return this.isUnlocked;
  }

  public unlock(): void {
    this.isUnlocked = true;
    this.initContext();
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Synthesizes a horological escapement hover tick:
   * Triangle oscillator sweeping 1800Hz -> 420Hz over 35ms through a bandpass filter (1600Hz, Q=3.5),
   * 5ms linear attack ramp, exponential decay, +/-5% random pitch variance,
   * routed through a StereoPannerNode, throttled to 80ms (hoverThrottleMs: 80),
   * with automatic 30% volume reduction after the 5th trigger within 3 seconds.
   *
   * @param normalizedX Pointer X position mapped to [-1, 1]
   */
  public playHoverTick(normalizedX: number = 0): void {
    if (this.isMuted || this.reducedMotion) return;

    const nowMs = performance.now();
    if (nowMs - this.lastHoverTime < this.hoverThrottleMs) return;
    this.lastHoverTime = nowMs;

    if (!this.ctx) {
      if (typeof window !== 'undefined' && !this.isUnlocked) {
        // Prevent autoplay policy warnings before first user gesture
        return;
      }
      this.initContext();
    }
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const pitchVariance = 1.0 + (Math.random() * 0.1 - 0.05); // +/- 5%
    const attenuation = this.getAttenuationFactor();
    const bakedGain = 0.35 * attenuation;

    const clampedPan = Math.max(-1, Math.min(1, normalizedX));
    let pannerNode: AudioNode;

    if (typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(clampedPan, t);
      panner.connect(this.masterGain);
      pannerNode = panner;
    } else {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'equalpower';
      if (panner.positionX?.setValueAtTime) {
        panner.positionX.setValueAtTime(clampedPan, t);
        panner.positionY.setValueAtTime(0, t);
        panner.positionZ.setValueAtTime(-1, t);
      } else if (typeof panner.setPosition === 'function') {
        panner.setPosition(clampedPan, 0, -1);
      }
      panner.connect(this.masterGain);
      pannerNode = panner;
    }

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800 * pitchVariance, t);
    osc.frequency.exponentialRampToValueAtTime(420 * pitchVariance, t + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.Q.setValueAtTime(3.5, t);

    // 5ms linear attack ramp, 35ms exponential decay envelope
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(bakedGain, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(pannerNode);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Synthesizes a dual-layer "Body + Click" mechanical latch in 3D HRTF space:
   * (240Hz -> 68Hz sub-body sine + 1420Hz modal harmonic partial)
   * routed through a 3D PannerNode (panningModel = 'HRTF').
   */
  public playSpatialClick(x: number = 0, y: number = 0, z: number = -1): void {
    if (this.isMuted || this.reducedMotion) return;

    if (!this.ctx) {
      if (typeof window !== 'undefined' && !this.isUnlocked) {
        return;
      }
      this.initContext();
    }
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const pitchVar = 1.0 + (Math.random() * 0.1 - 0.05); // +/- 5%
    const attenuation = this.getAttenuationFactor();

    const panner3D = this.ctx.createPanner();
    panner3D.panningModel = 'HRTF';
    panner3D.distanceModel = 'inverse';
    if (panner3D.positionX?.setValueAtTime) {
      panner3D.positionX.setValueAtTime(x, t);
      panner3D.positionY.setValueAtTime(y, t);
      panner3D.positionZ.setValueAtTime(z, t);
    } else if (typeof panner3D.setPosition === 'function') {
      panner3D.setPosition(x, y, z);
    }
    panner3D.connect(this.masterGain);

    // Layer 1: Warm Sub-Body (Pitch-swept Sine: 240Hz -> 68Hz over ~90ms)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(240 * pitchVar, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(68 * pitchVar, t + 0.09);

    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.linearRampToValueAtTime(0.55 * attenuation, t + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(panner3D);
    bodyOsc.start(t);
    bodyOsc.stop(t + 0.12);

    // Layer 2: Metallic Sentinel Harmonic (Modal Bell Partial: 1420Hz)
    const harmonicOsc = this.ctx.createOscillator();
    const harmonicGain = this.ctx.createGain();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(1420 * pitchVar, t);

    harmonicGain.gain.setValueAtTime(0.0001, t);
    harmonicGain.gain.linearRampToValueAtTime(0.18 * attenuation, t + 0.005);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(panner3D);
    harmonicOsc.start(t);
    harmonicOsc.stop(t + 0.17);
  }

  /**
   * Synthesizes a filtered noise swoosh tied to page transitions or high scroll velocity:
   * Generated white noise buffer swept through an exponential bandpass filter (180Hz -> 1400Hz -> 220Hz).
   */
  public playTransitionSwoosh(duration: number = 0.45): void {
    if (this.isMuted || this.reducedMotion) return;

    if (!this.ctx) {
      if (typeof window !== 'undefined' && !this.isUnlocked) {
        return;
      }
      this.initContext();
    }
    if (!this.ctx || !this.masterGain) return;

    const safeDuration = Math.max(0.08, Number.isFinite(duration) ? duration : 0.45);
    const t = this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate || 44100;
    const bufferSize = Math.max(1, Math.floor(sampleRate * safeDuration));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, t);
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + safeDuration * 0.45);
    filter.frequency.exponentialRampToValueAtTime(220, t + safeDuration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + safeDuration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + safeDuration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + safeDuration + 0.02);
  }

  /**
   * Synthesizes an authentic CRT Horizontal-Sync (H-Sync) electron beam laser hum:
   * High-frequency saw/sine oscillator (sweeping ~2800Hz -> 7800Hz -> 3200Hz) with subtle sub-harmonic buzz
   * and click-free exponential gain envelope.
   */
  public playCrtSyncHum(volume: number = 0.18): void {
    if (this.isMuted || this.reducedMotion) return;

    if (!this.ctx) {
      if (typeof window !== 'undefined' && !this.isUnlocked) return;
      this.initContext();
    }
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800, t);
    osc.frequency.exponentialRampToValueAtTime(7800, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(3200, t + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5200, t);
    filter.Q.setValueAtTime(4.0, t);

    const safeGain = Math.min(0.35, Math.max(0.01, volume));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(safeGain, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  /**
   * Computes the Spectral Centroid C = Sum(f_i * M_i) / Sum(M_i).
   * @param freqData Array of frequency magnitudes
   * @param normalized If true, normalizes centroid by total bin count into [0.0, 1.0]
   */
  public static computeSpectralCentroid(
    freqData: Uint8Array | Float32Array | number[],
    normalized: boolean = true
  ): number {
    const binCount = freqData.length;
    if (binCount === 0) return 0.0;

    let weightedSum = 0;
    let totalMagnitude = 0;

    for (let i = 0; i < binCount; i++) {
      const mag = freqData[i];
      weightedSum += i * mag;
      totalMagnitude += mag;
    }

    if (totalMagnitude <= 0.0001) {
      return 0.0;
    }

    const rawCentroid = weightedSum / totalMagnitude;
    return normalized ? rawCentroid / binCount : rawCentroid;
  }

  /**
   * Real-Time FFT Spectral Feature Extraction polled inside the unified gsap.ticker loop:
   * - Extracts normalized Bass (bins 0..31), Mid (bins 32..159), Treble (bins 160..511) with 0.15 exponential smoothing.
   * - Computes Spectral Centroid C = Sum(f_i * M_i) / Sum(M_i).
   * - Computes positive bass Spectral Flux, triggering uBeatPulse = 1.0 when instantaneous flux exceeds 1.5 * mean(energyHistory) with a 220ms cooldown.
   */
  public updateSpectralUniforms(): void {
    if (!this.analyser || this.isMuted || this.reducedMotion) {
      this.uniforms.uAudioBass.value *= 0.9;
      this.uniforms.uAudioMid.value *= 0.9;
      this.uniforms.uAudioTreble.value *= 0.9;
      this.uniforms.uSpectralCentroid.value *= 0.9;
      this.uniforms.uBeatPulse.value *= 0.88;
      return;
    }

    if (this.freqData.length !== this.analyser.frequencyBinCount) {
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }

    this.analyser.getByteFrequencyData(this.freqData);
    const binCount = this.freqData.length; // 512 bins (from fftSize 1024)
    if (binCount === 0) return;

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let spectralFlux = 0;

    const bassEnd = Math.min(32, binCount);
    const midEnd = Math.min(160, binCount);

    for (let i = 0; i < binCount; i++) {
      const val = this.freqData[i] / 255.0;

      if (i < bassEnd) {
        bassSum += val;
        const diff = val - this.prevBassData[i];
        if (diff > 0) spectralFlux += diff;
        this.prevBassData[i] = val;
      } else if (i < midEnd) {
        midSum += val;
      } else {
        trebleSum += val;
      }
    }

    const normBass = bassSum / 32;
    const normMid = midSum / 128;
    const normTreble = binCount > 160 ? trebleSum / (binCount - 160) : 0;
    const centroid = WatchknightAudioEngine.computeSpectralCentroid(this.freqData, true);

    // 0.15 exponential smoothing: y[n] += (x[n] - y[n-1]) * 0.15
    this.uniforms.uAudioBass.value += (normBass - this.uniforms.uAudioBass.value) * 0.15;
    this.uniforms.uAudioMid.value += (normMid - this.uniforms.uAudioMid.value) * 0.15;
    this.uniforms.uAudioTreble.value += (normTreble - this.uniforms.uAudioTreble.value) * 0.15;
    this.uniforms.uSpectralCentroid.value += (centroid - this.uniforms.uSpectralCentroid.value) * 0.15;

    // Beat Detection via positive bass spectral flux and energy history (1.5x threshold, 220ms cooldown)
    const avgHistory = this.energyHistory.length > 0
      ? this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
      : 0.01;

    const now = performance.now();
    const exceedsThreshold = spectralFlux > avgHistory * 1.5 && spectralFlux > 0.02;
    const cooldownElapsed = now - this.lastBeatTime > 220;

    if (exceedsThreshold && cooldownElapsed) {
      this.uniforms.uBeatPulse.value = 1.0;
      this.lastBeatTime = now;
    } else {
      this.uniforms.uBeatPulse.value *= 0.88;
    }

    this.energyHistory.push(spectralFlux);
    if (this.energyHistory.length > 20) {
      this.energyHistory.shift();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    const effectiveMuted = this.isMuted || this.reducedMotion;
    const targetGain = effectiveMuted ? 0.0 : 0.3;
    if (this.masterGain && this.ctx) {
      if (typeof this.masterGain.gain.setTargetAtTime === 'function') {
        this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
      } else {
        this.masterGain.gain.value = targetGain;
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Synthesizes an 8-bit retro UI blip using a square oscillator with click-free envelope
   */
  public play8BitBlip(frequency: number = 880): void {
    if (this.isMuted || this.reducedMotion) return;
    if (!this.ctx) this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, t);
      osc.frequency.setValueAtTime(frequency * 1.5, t + 0.025);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.075);
    } catch {
      // Audio node scheduling safely handled
    }
  }

  /**
   * Starts native Web Audio procedural 8-bit chiptune BGM loop
   * Zero external audio files: square lead + triangle bass + click-free ramps
   */
  public startChiptune(): void {
    if (this.isChiptuneActive || this.reducedMotion) return;
    if (!this.ctx) this.initContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.isMuted) {
      this.setMuted(false);
    }

    this.isChiptuneActive = true;
    this.chiptuneStep = 0;

    const MELODY = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 440, 392, 329.63, 293.66, 261.63, 329.63, 392, 440, 587.33];
    const BASS = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];

    this.chiptuneInterval = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isChiptuneActive || this.isMuted) return;

      const t = this.ctx.currentTime;
      const step = this.chiptuneStep % MELODY.length;
      const bassStep = Math.floor(this.chiptuneStep / 2) % BASS.length;
      this.chiptuneStep++;

      // Lead Channel (Square)
      try {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(MELODY[step], t);
        leadGain.gain.setValueAtTime(0.0001, t);
        leadGain.gain.linearRampToValueAtTime(0.08, t + 0.005);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        leadOsc.connect(leadGain);
        leadGain.connect(this.masterGain);
        leadOsc.start(t);
        leadOsc.stop(t + 0.13);

        // Bass Channel (Triangle)
        if (this.chiptuneStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(BASS[bassStep], t);
          bassGain.gain.setValueAtTime(0.0001, t);
          bassGain.gain.linearRampToValueAtTime(0.12, t + 0.005);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          bassOsc.connect(bassGain);
          bassGain.connect(this.masterGain);
          bassOsc.start(t);
          bassOsc.stop(t + 0.23);
        }
      } catch {
        // Safe audio scheduling
      }
    }, 140);
  }

  public stopChiptune(): void {
    if (this.chiptuneInterval) {
      clearInterval(this.chiptuneInterval);
      this.chiptuneInterval = null;
    }
    this.isChiptuneActive = false;
  }

  public toggleChiptune(): boolean {
    if (this.isChiptuneActive) {
      this.stopChiptune();
      return false;
    } else {
      this.startChiptune();
      return true;
    }
  }

  public isChiptuneRunning(): boolean {
    return this.isChiptuneActive;
  }

  public attachTicker(): void {
    if (this.isTickerAttached) return;
    gsap.ticker.add(this.tickerBound);
    this.isTickerAttached = true;
  }

  public detachTicker(): void {
    if (!this.isTickerAttached) return;
    gsap.ticker.remove(this.tickerBound);
    this.isTickerAttached = false;
  }

  public destroy(): void {
    this.stopChiptune();
    this.detachTicker();
    if (typeof window !== 'undefined') {
      if (this.unlockHandler) {
        window.removeEventListener('pointerdown', this.unlockHandler);
        window.removeEventListener('keydown', this.unlockHandler);
        this.unlockHandler = null;
      }
      if (this.mediaQueryHandler) {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (typeof mq?.removeEventListener === 'function') {
          mq.removeEventListener('change', this.mediaQueryHandler);
        } else if (typeof (mq as unknown as { removeListener?: (fn: any) => void })?.removeListener === 'function') {
          (mq as unknown as { removeListener: (fn: any) => void }).removeListener(this.mediaQueryHandler);
        }
        this.mediaQueryHandler = null;
      }
    }
    if (this.ctx && typeof this.ctx.close === 'function') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.limiter = null;
    this.analyser = null;
  }
}

export const watchknightAudio = new WatchknightAudioEngine();
export default watchknightAudio;
