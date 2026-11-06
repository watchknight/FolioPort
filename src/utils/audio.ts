/**
 * Procedural Web Audio API Synthesizer Utility
 * 
 * Zero-dependency procedural sound generator designed for editorial portfolios.
 * Generates sub-millisecond low-pass filtered tactile clicks and subtle harmonic chords.
 * Defaults strictly to opt-in, respectful audio (muted by default).
 */

type SoundStateListener = (enabled: boolean) => void;

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;
  private listeners: Set<SoundStateListener> = new Set();
  private masterGain: GainNode | null = null;
  private tickToggle: boolean = false;
  private gestureListenerAttached: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check stored preference, but default strictly to false (opt-in respectful audio)
      const stored = localStorage.getItem('folioport_sound_enabled');
      this.enabled = stored === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('Web Audio API not supported or blocked:', err);
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.gestureListenerAttached) {
      this.gestureListenerAttached = true;
      const resume = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', resume, { passive: true });
      window.addEventListener('keydown', resume, { passive: true });
    }

    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('folioport_sound_enabled', String(val));
    }
    if (val) {
      this.initContext();
      this.playChord(); // Play subtle harmonic confirmation chord when enabled
    }
    this.listeners.forEach((fn) => fn(this.enabled));
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public subscribe(fn: SoundStateListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Generates a crisp 2ms low-pass filtered sine/triangle tick on project row hover
   */
  public playTick(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low-pass filter for a crisp, organic wooden/mechanical tick without harsh high frequencies
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.2, now);

      // Alternates between triangle and sine for acoustic warmth
      this.tickToggle = !this.tickToggle;
      osc.type = this.tickToggle ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(1250, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.003);

      // Crisp 2ms - 3ms micro-envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.0006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.0035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.005);
    } catch {
      // Audio operation safely suppressed
    }
  }

  /**
   * Generates a subtle harmonic chord on theme or view switch
   * Dreamy ambient chord (e.g. C-major 9th: C5, E5, G5, B5 with warm lowpass filtering)
   */
  public playChord(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Frequencies for an ethereal, subtle pentatonic chord: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77)
      const freqs = [523.25, 659.25, 783.99, 987.77];
      const masterChordGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.6);

      masterChordGain.gain.setValueAtTime(0.0001, now);
      masterChordGain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      masterChordGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      filter.connect(masterChordGain);
      masterChordGain.connect(this.masterGain || ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Slightly staggered attack across chord notes for acoustic dimensionality
        const noteOffset = idx * 0.015;
        noteGain.gain.setValueAtTime(0.0001, now + noteOffset);
        noteGain.gain.linearRampToValueAtTime(0.25 / freqs.length, now + noteOffset + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(now + noteOffset);
        osc.stop(now + 0.7);
      });
    } catch {
      // Audio operation safely suppressed
    }
  }

  /**
   * Retro 8-bit procedural blips for Pong mini-game
   */
  public playPongBlip(type: 'paddle' | 'wall' | 'score' | 'unlock'): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'paddle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'wall') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'unlock') {
        // CRT unlock triumph arpeggio
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((n, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'square';
          noteOsc.frequency.setValueAtTime(n, now + i * 0.06);
          noteGain.gain.setValueAtTime(0.05, now + i * 0.06);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
          noteOsc.connect(noteGain);
          noteGain.connect(this.masterGain || ctx.destination);
          noteOsc.start(now + i * 0.06);
          noteOsc.stop(now + i * 0.06 + 0.14);
        });
      }
    } catch {
      // Audio operation safely suppressed
    }
  }
}

// Global Singleton instance
export const audio = new ProceduralAudioEngine();

export default audio;
