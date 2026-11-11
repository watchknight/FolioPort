/**
 * WATCHKNIGHT_OS
 * PROCEDURAL 8-BIT WEB AUDIO SYNTHESIZER (src/utils/retroAudio.ts)
 * 
 * Native browser Web Audio API synthesizer for retro UI lo-fi sound effects.
 * Synthesizes square and triangle wave oscillators with click-free envelopes
 * (setValueAtTime + exponentialRampToValueAtTime) and zero external audio files.
 */

export class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMutedState: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true, once: true });
      window.addEventListener('keydown', unlock, { passive: true, once: true });
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
    }
  }

  /**
   * Lazily initializes or returns the native Web Audio AudioContext.
   * Safe in SSR, Node, and test environments.
   */
  public getContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    if (typeof window === 'undefined') return null;

    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtxClass) {
      try {
        this.ctx = new AudioCtxClass();
      } catch {
        // AudioContext unsupported or blocked
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Set custom or mock AudioContext (useful for testing or external audio graph routing)
   */
  public setContext(customCtx: AudioContext | null): void {
    this.ctx = customCtx;
  }

  /**
   * Unlock AudioContext on first user interaction gesture.
   */
  public unlock(): void {
    if (this.isUnlocked) return;
    const ctx = this.getContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }
    }
  }

  /**
   * Query or update mute status controlled by the CRT monitor bezel's [SFX: ON/OFF] toggle.
   */
  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
  }

  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    return this.isMutedState;
  }

  /**
   * playBlip(): 12ms low-volume square-wave tick (680Hz).
   * Triggered when moving between [1] ABOUT ME, [2] MY PROJECTS, and [3] RESUME.
   */
  public playBlip(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.010; // exactly 10ms hover blip

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(680, now); // 680Hz

      // Low volume click-free envelope (0.05 -> 0.001)
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      // Clean disconnect
      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      }, Math.ceil(duration * 1000) + 20);
    } catch {
      // Audio fallback safe for browser restrictions
    }
  }

  /**
   * playOpenWindow(): Two-tone 8-bit confirm chime (520Hz -> 880Hz).
   * Triggered when opening or maximizing the 90s OS window.
   */
  public playOpenWindow(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const tone1Duration = 0.065; // 65ms tone 1
      const tone2Duration = 0.095; // 95ms tone 2

      // Tone 1: 520Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(520, now);

      gain1.gain.setValueAtTime(0.055, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + tone1Duration);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + tone1Duration);

      // Tone 2: 880Hz starts right as tone 1 finishes
      const startTone2 = now + 0.055;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(880, startTone2);

      gain2.gain.setValueAtTime(0.065, startTone2);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTone2 + tone2Duration);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(startTone2);
      osc2.stop(startTone2 + tone2Duration);

      const totalMs = Math.ceil((tone1Duration + tone2Duration) * 1000) + 50;
      setTimeout(() => {
        try {
          osc1.disconnect();
          gain1.disconnect();
          osc2.disconnect();
          gain2.disconnect();
        } catch {}
      }, totalMs);
    } catch {
      // Audio fallback
    }
  }

  /**
   * playKeyTick(): Soft mechanical key click during the > WELCOME TO MOAYED'S PORTFOLIO typewriter reveal.
   * Synthesized using a delicate triangle/noise burst with a sharp 10ms click-free envelope.
   */
  public playKeyTick(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.010; // 10ms

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Triangle wave delivers soft mechanical key feel without piercing high-frequency harshness
      osc.type = 'triangle';
      // Subtle pitch variation between 1100Hz and 1300Hz gives realistic typing texture
      const freq = 1200 + (Math.random() - 0.5) * 160;
      osc.frequency.setValueAtTime(freq, now);

      // Soft low volume (0.025)
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      }, Math.ceil(duration * 1000) + 15);
    } catch {
      // Audio fallback
    }
  }
}

// Global Singleton Instance
export const retroAudio = new RetroAudioEngine();

// Convenience Function Exports
export const playBlip = (): void => retroAudio.playBlip();
export const playOpenWindow = (): void => retroAudio.playOpenWindow();
export const playKeyTick = (): void => retroAudio.playKeyTick();

export default retroAudio;
