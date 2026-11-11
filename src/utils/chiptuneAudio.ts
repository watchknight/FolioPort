/**
 * WATCHKNIGHT_OS
 * Zero-Asset 4-Channel 8-Bit Chiptune & Retro SFX Synthesizer
 * 
 * Pure Web Audio API procedural sound engine with zero external audio files.
 * Generates sub-millisecond click-free envelopes, classic 8-bit coin chimes,
 * rising power-up sweeps, mechanical keyboard noise bursts, and a 120 BPM
 * procedural 8-bit chiptune loop driving the 3D particle wave FFT spectrum.
 */

export interface ChiptuneAudioUniforms {
  uAudioBass: { value: number };
  u_audioBass: { value: number };
}

export class ChiptuneAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));

  private isMuted: boolean = false;
  private reducedMotion: boolean = false;
  private isUnlocked: boolean = false;
  private isBgmPlaying: boolean = false;

  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private bgmStep: number = 0;
  private nextNoteTime: number = 0;
  private smoothedBass: number = 0.0;
  private lastShutterTickTime: number = 0;
  private shutterNoiseBuffer: AudioBuffer | null = null;

  private unlockListener: (() => void) | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  public readonly uniforms: ChiptuneAudioUniforms = {
    uAudioBass: { value: 0.0 },
    u_audioBass: { value: 0.0 },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq) {
        this.reducedMotion = mq.matches;
        this.mediaQueryListener = (e: MediaQueryListEvent) => {
          this.reducedMotion = e.matches;
          if (this.reducedMotion && this.isBgmPlaying) {
            this.stopChiptuneBGM();
          }
        };
        mq.addEventListener?.('change', this.mediaQueryListener);
      }

      const unlock = () => {
        this.isUnlocked = true;
        this.initContext();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        this.unlockListener = null;
      };
      this.unlockListener = unlock;
      window.addEventListener('pointerdown', unlock, { passive: true, once: true });
      window.addEventListener('keydown', unlock, { passive: true, once: true });
    }
  }

  /**
   * Lazily initializes the native Web Audio API graph:
   * Channels (BGM Gain, SFX Gain) -> Master Gain -> AnalyserNode (fftSize: 256) -> Destination.
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

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.85, this.ctx.currentTime);

    // BGM Sub-Gain (calibrated for gentle low-volume background loop)
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    // SFX Sub-Gain
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // AnalyserNode configured with fftSize = 256 (128 frequency bins)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    return this.ctx;
  }

  public getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      this.initContext();
    }
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public isEngineUnlocked(): boolean {
    return this.isUnlocked;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0.0 : 0.85;
      if (typeof this.masterGain.gain.setTargetAtTime === 'function') {
        this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
      } else {
        this.masterGain.gain.value = target;
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * UI Hover (playPixelTick):
   * A crisp 25ms square wave tick (880Hz, volume 0.05) with
   * exponentialRampToValueAtTime(0.001, now + 0.025) so there are zero speaker clicks.
   */
  public playPixelTick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);

      // Crisp 25ms click-free envelope
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.026);
    } catch {
      // Safe audio node suppression
    }
  }

  /**
   * Project / Cartridge Select (playCoinSFX):
   * Classic 8-bit coin chime (987Hz square wave for 0.1s, followed at 100ms by 1318Hz for 0.15s).
   */
  public playCoinSFX(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const targetGain = this.sfxGain || this.masterGain || ctx.destination;

      // Note 1: 987Hz square wave for 0.1s
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(987, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(targetGain);
      osc1.start(now);
      osc1.stop(now + 0.105);

      // Note 2: followed at 100ms by 1318Hz for 0.15s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1318, now + 0.1);
      gain2.gain.setValueAtTime(0.08, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(targetGain);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.255);
    } catch {
      // Safe audio suppression
    }
  }

  /**
   * Render-Pass / Terminal Execute (playPowerUpSFX):
   * Rising square wave arpeggio sweep (261.63Hz -> 523.25Hz -> 659.25Hz -> 1046.50Hz) over 0.45s.
   */
  public playPowerUpSFX(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const targetGain = this.sfxGain || this.masterGain || ctx.destination;
      const frequencies = [261.63, 523.25, 659.25, 1046.50];
      const stepDuration = 0.45 / frequencies.length; // ~0.1125s per note

      frequencies.forEach((freq, idx) => {
        const noteStart = now + idx * stepDuration;
        const noteEnd = noteStart + stepDuration;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

        osc.connect(gain);
        gain.connect(targetGain);

        osc.start(noteStart);
        osc.stop(noteEnd + 0.005);
      });
    } catch {
      // Safe audio suppression
    }
  }

  /**
   * Snare / Keystroke Click (playNoiseTap):
   * A 0.04s white noise buffer (Math.random() * 2 - 1) shaped through a bandpass filter
   * for authentic mechanical keyboard feedback in the terminal and contact form.
   */
  public playNoiseTap(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const sampleRate = ctx.sampleRate || 44100;
      const bufferSize = Math.max(1, Math.floor(sampleRate * 0.04));
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Bandpass filter for mechanical switch resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.042);
    } catch {
      // Safe audio suppression
    }
  }

  /**
   * Section Boundary Shop Shutter Roll Ratchet / Hydraulic Tick (playShutterRollTick):
   * When a section boundary shutter is actively lifting and scroll velocity exceeds 150px/s,
   * triggers a subtle mechanical ratchet/hydraulic pulse (gain: 0.025, low-pass filtered 140Hz
   * sawtooth + 60ms noise burst) spaced at 90ms intervals for a weighted physical cyberdeck feel.
   */
  public playShutterRollTick(scrollVelocity?: number): void {
    if (this.isMuted) return;

    if (scrollVelocity !== undefined && Math.abs(scrollVelocity) < 150) {
      return;
    }

    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastShutterTickTime < 90) {
      return;
    }
    this.lastShutterTickTime = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const targetGain = this.sfxGain || this.masterGain || ctx.destination;

      // 1. Low-pass filtered 140Hz sawtooth mechanical click pulse
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);
      filter.Q.setValueAtTime(1.5, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(0.025, now + 0.004);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(targetGain);

      osc.start(now);
      osc.stop(now + 0.065);

      // 2. 60ms subtle noise burst (using cached buffer to avoid GC stalls on scroll)
      const noiseBuffer = this.getShutterNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(950, now);
      noiseFilter.Q.setValueAtTime(1.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.015, now + 0.004);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(targetGain);

      noiseSource.start(now);
      noiseSource.stop(now + 0.065);
    } catch {
      // Safe audio suppression
    }
  }

  private getShutterNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.shutterNoiseBuffer && this.shutterNoiseBuffer.sampleRate === ctx.sampleRate) {
      return this.shutterNoiseBuffer;
    }
    const sampleRate = ctx.sampleRate || 44100;
    const bufferSize = Math.max(1, Math.floor(sampleRate * 0.06));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.shutterNoiseBuffer = noiseBuffer;
    return noiseBuffer;
  }

  /**
   * Toggleable Lo-Fi 8-Bit Chiptune BGM Loop (toggleChiptuneBGM):
   * When the user clicks [ ♫ 8-BIT BGM: ON ] in the top bar, schedule a gentle,
   * low-volume (0.06 gain) 120 BPM procedural chiptune loop combining:
   *   1. A triangle bassline (C4: 261.63Hz, G4: 392.00Hz, A4: 440.00Hz, F4: 349.23Hz)
   *   2. A shimmering triangle chord arpeggiator
   *   3. A soft square lead melody (C5: 523.25Hz to G5: 783.99Hz).
   */
  public toggleChiptuneBGM(): boolean {
    if (this.isBgmPlaying) {
      this.stopChiptuneBGM();
      return false;
    } else {
      this.startChiptuneBGM();
      return true;
    }
  }

  public isBGMActive(): boolean {
    return this.isBgmPlaying;
  }

  public startChiptuneBGM(): void {
    if (this.isBgmPlaying || this.reducedMotion) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.isMuted) {
      this.setMuted(false);
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.isBgmPlaying = true;
    this.bgmStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    // 120 BPM Musical Definitions
    // 1 beat = 0.5s; 16th note step = 0.125s (125ms)
    const STEP_DURATION = 0.125;
    const TOTAL_STEPS = 32; // 2 bars of 4/4 at 16th notes (4 seconds per loop)

    // Bassline Progression (4 chords: C4, G4, A4, F4)
    // 8 steps per chord
    const BASS_CHORDS = [
      261.63, // C4
      392.00, // G4
      440.00, // A4
      349.23, // F4
    ];

    // Shimmering Triangle Arpeggio Notes per chord
    const ARPEGGIO_PATTERNS = [
      [261.63, 329.63, 392.00, 523.25], // C major (C4, E4, G4, C5)
      [392.00, 493.88, 587.33, 783.99], // G major (G4, B4, D5, G5)
      [440.00, 523.25, 659.25, 880.00], // A minor (A4, C5, E5, A5)
      [349.23, 440.00, 523.25, 698.46], // F major (F4, A4, C5, F5)
    ];

    // Soft Square Lead Melody (C5: 523.25Hz to G5: 783.99Hz)
    const LEAD_MELODY = [
      523.25, 0, 659.25, 0, 783.99, 659.25, 587.33, 523.25, // Bar 1 (C & G)
      587.33, 0, 783.99, 0, 659.25, 587.33, 523.25, 0,      // Bar 2
      659.25, 0, 783.99, 783.99, 783.99, 659.25, 523.25, 0,  // Bar 3 (Am, capped at G5)
      587.33, 523.25, 659.25, 0, 783.99, 0, 523.25, 0,       // Bar 4 (F)
    ];

    // Ensure BGM gain is cleanly scheduled up to 0.06
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (typeof this.bgmGain.gain.cancelScheduledValues === 'function') {
          this.bgmGain.gain.cancelScheduledValues(now);
        }
        this.bgmGain.gain.setValueAtTime(0.0001, now);
        this.bgmGain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      } catch {
        // Safe gain ramp
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wk-chiptune-bgm-change', { detail: { active: true } })
      );
    }

    const targetBgmBus = this.bgmGain || this.masterGain || ctx.destination;

    const scheduleStep = () => {
      if (!this.ctx || !this.isBgmPlaying || this.isMuted) return;

      // Anti-drift guard: prevent synchronous loop explosion if tab throttled or resumed
      if (this.nextNoteTime < this.ctx.currentTime) {
        this.nextNoteTime = this.ctx.currentTime + 0.02;
      }

      while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
        const step = this.bgmStep % TOTAL_STEPS;
        const chordIndex = Math.floor(step / 8) % BASS_CHORDS.length;
        const t = this.nextNoteTime;

        // 1. Triangle Bassline (plays on beats 0, 4 of each 8-step chord)
        if (step % 4 === 0) {
          try {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(BASS_CHORDS[chordIndex], t);

            bassGain.gain.setValueAtTime(0.0001, t);
            bassGain.gain.linearRampToValueAtTime(0.12, t + 0.01);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

            bassOsc.connect(bassGain);
            bassGain.connect(targetBgmBus);

            bassOsc.start(t);
            bassOsc.stop(t + 0.46);
          } catch {
            // Safe node suppression
          }
        }

        // 2. Shimmering Triangle Chord Arpeggiator (16th notes)
        try {
          const arpNotes = ARPEGGIO_PATTERNS[chordIndex];
          const noteFreq = arpNotes[step % arpNotes.length];

          const arpOsc = this.ctx.createOscillator();
          const arpGain = this.ctx.createGain();
          arpOsc.type = 'triangle';
          arpOsc.frequency.setValueAtTime(noteFreq, t);

          arpGain.gain.setValueAtTime(0.0001, t);
          arpGain.gain.linearRampToValueAtTime(0.045, t + 0.008);
          arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.115);

          arpOsc.connect(arpGain);
          arpGain.connect(targetBgmBus);

          arpOsc.start(t);
          arpOsc.stop(t + 0.12);
        } catch {
          // Safe node suppression
        }

        // 3. Soft Square Lead Melody (C5: 523.25Hz to G5: 783.99Hz)
        const leadFreq = LEAD_MELODY[step % LEAD_MELODY.length];
        if (leadFreq > 0) {
          try {
            const leadOsc = this.ctx.createOscillator();
            const leadFilter = this.ctx.createBiquadFilter();
            const leadGain = this.ctx.createGain();

            leadOsc.type = 'square';
            leadOsc.frequency.setValueAtTime(leadFreq, t);

            // Lowpass filter for warm, soft retro square tone
            leadFilter.type = 'lowpass';
            leadFilter.frequency.setValueAtTime(1600, t);
            leadFilter.Q.setValueAtTime(1.0, t);

            leadGain.gain.setValueAtTime(0.0001, t);
            leadGain.gain.linearRampToValueAtTime(0.05, t + 0.01);
            leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            leadOsc.connect(leadFilter);
            leadFilter.connect(leadGain);
            leadGain.connect(targetBgmBus);

            leadOsc.start(t);
            leadOsc.stop(t + 0.23);
          } catch {
            // Safe node suppression
          }
        }

        this.bgmStep++;
        this.nextNoteTime += STEP_DURATION;
      }
    };

    this.bgmTimer = setInterval(scheduleStep, 45);
  }

  public stopChiptuneBGM(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isBgmPlaying = false;

    // Cleanly silence BGM sub-bus with click-free fade to stop future scheduled notes from leaking
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (typeof this.bgmGain.gain.cancelScheduledValues === 'function') {
          this.bgmGain.gain.cancelScheduledValues(now);
        }
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
        this.bgmGain.gain.linearRampToValueAtTime(0.0001, now + 0.03);
      } catch {
        // Safe gain update
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wk-chiptune-bgm-change', { detail: { active: false } })
      );
    }
  }

  /**
   * Real-Time FFT Bass Spectrum Extraction:
   * Connects to AnalyserNode (fftSize = 256) and returns normalized bass frequency energy [0.0, 1.0]
   * for Three.js CyberWaveCanvas u_audioBass shader uniform.
   */
  public getAudioBass(): number {
    if (!this.analyser || this.isMuted) {
      this.smoothedBass *= 0.88;
      this.uniforms.uAudioBass.value = this.smoothedBass;
      this.uniforms.u_audioBass.value = this.smoothedBass;
      return this.smoothedBass;
    }

    if (this.freqData.length !== this.analyser.frequencyBinCount) {
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }

    this.analyser.getByteFrequencyData(this.freqData);
    const binCount = this.freqData.length; // 128 bins (fftSize = 256)
    if (binCount === 0) return 0.0;

    // Bass Bins: first 8 bins (0Hz to ~1378Hz with 44.1kHz sample rate)
    const bassBins = Math.min(8, binCount);
    let bassSum = 0;
    for (let i = 0; i < bassBins; i++) {
      bassSum += this.freqData[i];
    }

    const instantBass = bassSum / (bassBins * 255.0);
    // Smooth bass response for responsive yet punchy 3D wave elevation
    this.smoothedBass += (instantBass - this.smoothedBass) * 0.25;

    this.uniforms.uAudioBass.value = this.smoothedBass;
    this.uniforms.u_audioBass.value = this.smoothedBass;
    return this.smoothedBass;
  }

  public destroy(): void {
    this.stopChiptuneBGM();
    if (typeof window !== 'undefined') {
      if (this.unlockListener) {
        window.removeEventListener('pointerdown', this.unlockListener);
        window.removeEventListener('keydown', this.unlockListener);
        this.unlockListener = null;
      }
      if (this.mediaQueryListener) {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (typeof mq?.removeEventListener === 'function') {
          mq.removeEventListener('change', this.mediaQueryListener);
        }
        this.mediaQueryListener = null;
      }
    }
    if (this.ctx && typeof this.ctx.close === 'function') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.analyser = null;
    this.shutterNoiseBuffer = null;
  }
}

export const chiptuneAudio = new ChiptuneAudioEngine();
export default chiptuneAudio;
