import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReveal } from '../hooks/useReveal';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { MagneticButton } from './ui/MagneticButton';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  Activity,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Lock,
  Puzzle,
  Star,
  Zap,
  Terminal,
  Globe,
  Sliders,
  HardDrive,
  Code2,
  Clock,
  Radio,
} from 'lucide-react';

export type StudioTab = 'popup' | 'shadow-dom' | 'service-worker';

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  subsystem: 'DNR' | 'SW' | 'STORAGE' | 'ALARMS' | 'MEMORY';
  message: string;
  status: 'ok' | 'blocked' | 'warn' | 'active';
}

export const ExtensionStudio: React.FC = () => {
  const containerRef = useReveal<HTMLElement>();

  // Active studio architecture tab
  const [activeTab, setActiveTab] = useState<StudioTab>('popup');

  // Omnibox & browser chrome state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtensionPinnedActive, setIsExtensionPinnedActive] = useState(false);

  // TAB 1: FocusGuard Popup & RAM Throttler state
  const [shieldActive, setShieldActive] = useState(true);
  const [throttlePercent, setThrottlePercent] = useState(75);
  const [displayMemory, setDisplayMemory] = useState(775); // Target at 75% = 1840 - 0.75*(1840-420) = 775

  // TAB 2: Shadow DOM Radial Timer & HUD state
  const [isHudInjected, setIsHudInjected] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25:00 Pomodoro
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'short-break'>('focus');
  const [distractionsBlockedCount, setDistractionsBlockedCount] = useState(42);
  const [showDomInspector, setShowDomInspector] = useState(false);

  // TAB 3: Service Worker & Telemetry state
  const [swStatus, setSwStatus] = useState<'DORMANT' | 'ACTIVE' | 'WAKING'>('DORMANT');
  const [activeSignalPath, setActiveSignalPath] = useState<string | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEntry[]>([
    {
      id: 'init-1',
      timestamp: '00:00:01',
      subsystem: 'SW',
      message: 'Worker registered with Chromium ServiceWorkerContainer. Scope: chrome-extension://focusguard/',
      status: 'ok',
    },
    {
      id: 'init-2',
      timestamp: '00:00:02',
      subsystem: 'DNR',
      message: 'Loaded 1,482 dynamic declarativeNetRequest rules from ruleset_prod.json (0ms kernel evaluation)',
      status: 'ok',
    },
    {
      id: 'init-3',
      timestamp: '00:00:03',
      subsystem: 'ALARMS',
      message: 'Registered periodic alarm "heap-audit" { periodInMinutes: 5, delayInMinutes: 5 }',
      status: 'ok',
    },
  ]);

  // Safe timeout management to prevent memory leaks and unmounted state updates
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const safeSetTimeout = useCallback((callback: () => void, delayMs: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      callback();
    }, delayMs);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Audio helper with spatial click and chiptune feedback
  const playInteractionTick = useCallback((e?: React.MouseEvent) => {
    const normX = e && typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playSpatialClick(normX, 0, -1);
    chiptuneAudio.playPixelTick();
  }, []);

  const playInteractionCoin = useCallback(() => {
    chiptuneAudio.playCoinSFX();
  }, []);

  // 1. Smooth Memory Counter Animation for RAM Throttler
  // Range: 0% throttle = 1,840 MB, 100% throttle = 420 MB
  const targetMemory = Math.round(1840 - (throttlePercent / 100) * (1840 - 420));

  useEffect(() => {
    if (displayMemory === targetMemory) return;

    let animId: number;
    const step = () => {
      setDisplayMemory((prev) => {
        const diff = targetMemory - prev;
        if (Math.abs(diff) <= 2) {
          return targetMemory;
        }
        return Math.round(prev + diff * 0.22);
      });
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetMemory, displayMemory]);

  // Handle throttler slider dragging
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setThrottlePercent(val);
    if (val % 5 === 0) {
      chiptuneAudio.playPixelTick();
    }
  };

  const setThrottlerPreset = (percent: number) => {
    playInteractionCoin();
    setThrottlePercent(percent);
  };

  // 2. Radial Timer Ticking Loop for TAB 2 (Decoupled & Side-Effect Free)
  useEffect(() => {
    if (!isTimerRunning) return;

    if (timerSeconds <= 0) {
      setIsTimerRunning(false);
      chiptuneAudio.playCoinSFX();
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => {
    playInteractionCoin();
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    playInteractionTick();
    setIsTimerRunning(false);
    setTimerSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchTimerMode = (mode: 'focus' | 'short-break') => {
    playInteractionTick();
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  // Format time mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Radial Timer SVG Calculations
  const timerRadius = 46;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const totalDuration = timerMode === 'focus' ? 25 * 60 : 5 * 60;
  const strokeOffset =
    timerCircumference - (timerSeconds / totalDuration) * timerCircumference;

  // 3. Service Worker Simulation Actions for TAB 3 (Race-Safe with Tracking)
  const appendLog = (
    subsystem: TelemetryLogEntry['subsystem'],
    message: string,
    status: TelemetryLogEntry['status']
  ) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setTelemetryLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        subsystem,
        message,
        status,
      },
      ...prev.slice(0, 14),
    ]);
  };

  const simulateDnrBlock = () => {
    playInteractionCoin();
    setActiveSignalPath('dnr');
    setDistractionsBlockedCount((c) => c + 1);
    appendLog(
      'DNR',
      'Rule #104 matched urlFilter "*://*.doubleclick.net/*" -> BLOCKED (0.01ms kernel fast-path, SW: DORMANT)',
      'blocked'
    );
    safeSetTimeout(() => setActiveSignalPath(null), 1200);
  };

  const simulateAlarmWakeup = () => {
    playInteractionCoin();
    clearAllTimeouts(); // Avoid colliding overlapping alarm runs
    setActiveSignalPath('alarm-sw');
    setSwStatus('WAKING');
    appendLog('ALARMS', 'chrome.alarms.onAlarm("heap-audit") triggered -> spawning Service Worker', 'ok');

    safeSetTimeout(() => {
      setSwStatus('ACTIVE');
      appendLog('SW', 'Worker ACTIVE: background heap 9.4 MB (<12 MB budget). Invoking chrome.tabs.discard()', 'active');
      appendLog('MEMORY', 'Discarded 6 inactive tabs. Freeing 412 MB simulated renderer heap', 'ok');

      safeSetTimeout(() => {
        setSwStatus('DORMANT');
        setActiveSignalPath(null);
        appendLog('SW', 'No pending microtasks in event loop -> Worker terminated (0 MB dormant heap)', 'warn');
      }, 1600);
    }, 600);
  };

  const simulateAtomicStorage = () => {
    playInteractionCoin();
    setActiveSignalPath('storage');
    appendLog(
      'STORAGE',
      'chrome.storage.local.set({ shieldState: true, sessionDuration: 1500 }) committed atomically with CRC32 integrity check (0.12ms)',
      'ok'
    );
    safeSetTimeout(() => setActiveSignalPath(null), 1200);
  };

  // Omnibox URL based on active architectural tab
  const omniboxUrl =
    activeTab === 'popup'
      ? 'chrome-extension://focusguard/popup.html'
      : activeTab === 'shadow-dom'
      ? 'chrome-extension://focusguard/content-script/shadow-hud.inject'
      : 'chrome-extension://focusguard/service-worker/telemetry.json';

  const selectTab = (tab: StudioTab) => {
    playInteractionTick();
    setActiveTab(tab);
    if (tab === 'popup') {
      setIsExtensionPinnedActive(true);
    } else {
      setIsExtensionPinnedActive(false);
    }
  };

  return (
    <section
      id="extensions"
      ref={containerRef}
      className="relative z-20 py-24 md:py-32 text-[var(--pixel-ivory-text,#F0EFE6)] border-t border-[var(--crt-bezel-shadow,#2D3645)] overflow-hidden"
      style={{ backgroundColor: 'var(--crt-void-bg, #070814)' }}
    >
      {/* Background Telemetry Parallax Badge */}
      <div
        data-parallax="0.08"
        className="pointer-events-none absolute right-4 top-12 font-mono text-[8vw] font-black text-white/[0.018] select-none uppercase tracking-tighter"
        aria-hidden="true"
      >
        CHROMIUM//MV3
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div data-anim className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-none bg-[var(--pixel-phosphor-green,#4AF626)] animate-pulse shadow-[0_0_8px_var(--pixel-phosphor-green,#4AF626)]" />
              <span className="font-pixel text-[10px] uppercase tracking-widest text-[var(--tech-cyan-wave,#00F0FF)]">
                &gt; [02] BROWSER EXTENSION STUDIO // CHROMIUM MANIFEST V3
              </span>
            </div>

            <div className="overflow-visible">
              <h2
                data-anim
                className="font-display uppercase text-[var(--pixel-ivory-text,#F0EFE6)] text-fluid-h2 sm:text-fluid-h1 leading-tight tracking-tight font-extrabold"
              >
                CHROME EXTENSION <span className="text-[var(--tech-cyan-wave,#00F0FF)]">STUDIO</span> //{' '}
                <span className="text-[var(--tech-magenta-crest,#FF2A85)]">FOCUSGUARD</span>
              </h2>
            </div>
          </div>

          <p
            data-anim
            data-delay="0.15"
            className="max-w-md font-body text-sm sm:text-base text-[var(--crt-bezel-putty,#D6CFC2)] leading-relaxed"
          >
            Engineering sub-millisecond Chromium extensions with kernel-level declarative network blocking,
            event-driven MV3 service workers, and leak-free Shadow DOM containment.
          </p>
        </div>

        {/* Drawn Top Divider Line */}
        <div data-draw className="w-full h-px bg-white/15 mb-10" />

        {/* Main 2-Column Cockpit Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Simulated Chrome Browser Window & Extension Popup Inspector Frame (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div
              className="relative border-2 border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)]/60 shadow-[0_0_35px_rgba(0,0,0,0.85),2px_2px_0_0_var(--crt-void-bg,#070814)] transition-all duration-200"
              style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
            >
              {/* Chrome Window Titlebar & Tab Strip */}
              <div
                className="flex items-center justify-between px-3 py-1.5 border-b-2 border-[var(--crt-bezel-shadow,#2D3645)] select-none"
                style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
              >
                {/* Left: Interactive Chrome Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {/* Tab 1 (FocusGuard Extension Popup Tab) */}
                  <button
                    type="button"
                    onClick={() => selectTab('popup')}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-mono rounded-none border-t-2 border-x-2 transition-all ${
                      activeTab === 'popup'
                        ? 'bg-[var(--crt-panel-slate,#131629)] border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--tech-cyan-wave,#00F0FF)] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-black/40 border-white/10 text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] opacity-70'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-[var(--tech-cyan-wave,#00F0FF)]" />
                    <span className="font-pixel text-[9px] tracking-tight">FocusGuard // popup.html</span>
                    <span className="text-[10px] text-[#8E98AA] ml-1">×</span>
                  </button>

                  {/* Tab 2 (Mock Host Page for Content Script Injection) */}
                  <button
                    type="button"
                    onClick={() => selectTab('shadow-dom')}
                    className={`hidden sm:flex items-center gap-2 px-3 py-1 text-xs font-mono rounded-none border-t-2 border-x-2 transition-all ${
                      activeTab === 'shadow-dom'
                        ? 'bg-[var(--crt-panel-slate,#131629)] border-[var(--pixel-phosphor-green,#4AF626)] text-[var(--pixel-phosphor-green,#4AF626)] shadow-[0_0_10px_rgba(74,246,38,0.2)]'
                        : 'bg-black/40 border-white/10 text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] opacity-70'
                    }`}
                  >
                    <Globe className="w-3 h-3 text-[var(--pixel-phosphor-green,#4AF626)]" />
                    <span className="font-pixel text-[9px] tracking-tight">target-host.org</span>
                    <span className="text-[10px] text-[#8E98AA] ml-1">×</span>
                  </button>

                  {/* Tab 3 (Service Worker Telemetry Tab) */}
                  <button
                    type="button"
                    onClick={() => selectTab('service-worker')}
                    className={`hidden md:flex items-center gap-2 px-3 py-1 text-xs font-mono rounded-none border-t-2 border-x-2 transition-all ${
                      activeTab === 'service-worker'
                        ? 'bg-[var(--crt-panel-slate,#131629)] border-[var(--tech-magenta-crest,#FF2A85)] text-[var(--tech-magenta-crest,#FF2A85)] shadow-[0_0_10px_rgba(255,42,133,0.2)]'
                        : 'bg-black/40 border-white/10 text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] opacity-70'
                    }`}
                  >
                    <Cpu className="w-3 h-3 text-[var(--tech-magenta-crest,#FF2A85)]" />
                    <span className="font-pixel text-[9px] tracking-tight">telemetry.json</span>
                    <span className="text-[10px] text-[#8E98AA] ml-1">×</span>
                  </button>

                  {/* Tab Plus Button */}
                  <button
                    type="button"
                    onClick={() => playInteractionTick()}
                    className="px-2 py-0.5 text-[#8E98AA] hover:text-[var(--tech-cyan-wave,#00F0FF)] text-xs font-mono transition-colors"
                    title="New Tab"
                    aria-label="New Tab"
                  >
                    +
                  </button>
                </div>

                {/* Right: Retro Window Chrome Controls [ - ] [ + ] [ x ] */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => playInteractionTick(e)}
                    className="w-5 h-5 flex items-center justify-center font-pixel text-[9px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-bezel-putty,#D6CFC2)] hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-colors rounded-none"
                    aria-label="Minimize"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => playInteractionTick(e)}
                    className="w-5 h-5 flex items-center justify-center font-pixel text-[9px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-bezel-putty,#D6CFC2)] hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-colors rounded-none"
                    aria-label="Maximize"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={(e) => playInteractionTick(e)}
                    className="w-5 h-5 flex items-center justify-center font-pixel text-[9px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-magenta-crest,#FF2A85)] text-[var(--crt-bezel-putty,#D6CFC2)] hover:text-[var(--tech-magenta-crest,#FF2A85)] transition-colors rounded-none"
                    aria-label="Close"
                  >
                    x
                  </button>
                </div>
              </div>

              {/* Chrome Navigation / Omnibox Bar */}
              <div
                className="px-3 py-2 border-b border-[var(--crt-bezel-shadow,#2D3645)] flex items-center gap-2 select-none"
                style={{ backgroundColor: '#090C18' }}
              >
                {/* Back, Forward, Refresh */}
                <div className="flex items-center gap-1 text-[#8E98AA]">
                  <button
                    type="button"
                    onClick={(e) => playInteractionTick(e)}
                    className="p-1 hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-colors"
                    title="Back"
                    aria-label="Browser Back"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => playInteractionTick(e)}
                    className="p-1 hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-colors opacity-50 cursor-not-allowed"
                    title="Forward"
                    aria-label="Browser Forward"
                    disabled
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playInteractionCoin();
                      setIsRefreshing(true);
                      safeSetTimeout(() => setIsRefreshing(false), 500);
                    }}
                    className={`p-1 hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-transform ${
                      isRefreshing ? 'animate-spin text-[var(--tech-cyan-wave,#00F0FF)]' : ''
                    }`}
                    title="Reload Extension"
                    aria-label="Reload Extension"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Omnibox (Address Bar) */}
                <div
                  className="flex-1 flex items-center justify-between px-3 py-1 border border-[var(--crt-bezel-shadow,#2D3645)] text-xs font-mono min-w-0"
                  style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1 text-[var(--pixel-phosphor-green,#4AF626)] font-pixel text-[8px] shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      SECURE
                    </span>
                    <span className="text-[var(--tech-cyan-wave,#00F0FF)] select-all break-all text-[11px] sm:text-xs">
                      {omniboxUrl}
                    </span>
                  </div>
                  <Star className="w-3 h-3 text-[#8E98AA] shrink-0 hover:text-[var(--pixel-amber-gold,#FFCC00)] cursor-pointer" />
                </div>

                {/* Toolbar Extension Action Area (PINNED EXTENSION ICON NEXT TO OMNIBOX) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playInteractionCoin();
                      setIsExtensionPinnedActive((prev) => !prev);
                      setActiveTab('popup');
                    }}
                    className={`relative p-1.5 border transition-all rounded-none ${
                      activeTab === 'popup' || isExtensionPinnedActive
                        ? 'bg-[#0E2B12] border-[var(--pixel-phosphor-green,#4AF626)] text-[var(--pixel-phosphor-green,#4AF626)] shadow-[0_0_10px_rgba(74,246,38,0.4)]'
                        : 'bg-[var(--crt-panel-slate,#131629)] border-[var(--crt-bezel-shadow,#2D3645)] text-[var(--tech-cyan-wave,#00F0FF)] hover:border-[var(--tech-cyan-wave,#00F0FF)]'
                    }`}
                    title="FocusGuard Pinned Extension (Click to inspect popup)"
                    aria-label="FocusGuard Pinned Extension"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-none bg-[var(--pixel-phosphor-green,#4AF626)] animate-pulse" />
                  </button>

                  <div className="w-px h-5 bg-[var(--crt-bezel-shadow,#2D3645)] mx-0.5" />
                  <Puzzle className="w-4 h-4 text-[#8E98AA] hover:text-[var(--tech-cyan-wave,#00F0FF)] cursor-pointer p-0.5" />
                </div>
              </div>

              {/* Architecture Mode Toggle Tabs (3 Interactive Tabs) */}
              <div
                className="px-3 pt-2 pb-0 border-b border-[var(--crt-bezel-shadow,#2D3645)] flex items-center gap-2 overflow-x-auto select-none"
                style={{ backgroundColor: 'var(--crt-void-bg, #070814)' }}
              >
                <button
                  type="button"
                  onClick={() => selectTab('popup')}
                  className={`flex items-center gap-2 px-3 py-2 text-[10px] font-pixel border-b-2 transition-all shrink-0 rounded-none ${
                    activeTab === 'popup'
                      ? 'border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--tech-cyan-wave,#00F0FF)] bg-[var(--crt-panel-slate,#131629)]'
                      : 'border-transparent text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] hover:bg-white/5'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[var(--tech-cyan-wave,#00F0FF)]" />
                  <span>[TAB 1: LIVE POPUP UI &amp; RAM THROTTLER]</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('shadow-dom')}
                  className={`flex items-center gap-2 px-3 py-2 text-[10px] font-pixel border-b-2 transition-all shrink-0 rounded-none ${
                    activeTab === 'shadow-dom'
                      ? 'border-[var(--pixel-phosphor-green,#4AF626)] text-[var(--pixel-phosphor-green,#4AF626)] bg-[var(--crt-panel-slate,#131629)]'
                      : 'border-transparent text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[var(--pixel-phosphor-green,#4AF626)]" />
                  <span>[TAB 2: SHADOW DOM INJECTION HUD]</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('service-worker')}
                  className={`flex items-center gap-2 px-3 py-2 text-[10px] font-pixel border-b-2 transition-all shrink-0 rounded-none ${
                    activeTab === 'service-worker'
                      ? 'border-[var(--tech-magenta-crest,#FF2A85)] text-[var(--tech-magenta-crest,#FF2A85)] bg-[var(--crt-panel-slate,#131629)]'
                      : 'border-transparent text-[#8E98AA] hover:text-[var(--pixel-ivory-text,#F0EFE6)] hover:bg-white/5'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-[var(--tech-magenta-crest,#FF2A85)]" />
                  <span>[TAB 3: MANIFEST V3 SERVICE WORKER TELEMETRY]</span>
                </button>
              </div>

              {/* TAB 1: LIVE POPUP UI & RAM THROTTLER */}
              {activeTab === 'popup' && (
                <div className="p-4 sm:p-6 bg-[#090C18]/95 space-y-6">
                  {/* Extension Popup Simulated Shell */}
                  <div
                    className="max-w-xl mx-auto border-2 border-[var(--crt-bezel-shadow,#2D3645)] shadow-[0_0_25px_rgba(0,0,0,0.8),2px_2px_0_0_var(--crt-void-bg,#070814)]"
                    style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                  >
                    {/* Popup Window Bar */}
                    <div
                      className="flex items-center justify-between px-3 py-1.5 border-b-2 border-[var(--crt-bezel-shadow,#2D3645)]"
                      style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[var(--tech-cyan-wave,#00F0FF)]" />
                        <span className="font-pixel text-[10px] text-[var(--tech-cyan-wave,#00F0FF)]">
                          FOCUSGUARD // POPUP_INSPECTOR.SYS
                        </span>
                        <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-black/50 border border-[var(--tech-cyan-wave,#00F0FF)]/30 text-[var(--pixel-phosphor-green,#4AF626)]">
                          MV3
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-none bg-[var(--pixel-phosphor-green,#4AF626)] animate-pulse" />
                        <span className="font-mono text-[9px] text-[#8E98AA]">v2.4.0</span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-5">
                      {/* 1. Distraction Shield Toggle */}
                      <div
                        onClick={() => {
                          playInteractionCoin();
                          setShieldActive((prev) => !prev);
                        }}
                        className={`cursor-pointer p-4 border-2 transition-all select-none rounded-none ${
                          shieldActive
                            ? 'bg-[#0E2B12]/80 border-[var(--pixel-phosphor-green,#4AF626)] shadow-[0_0_20px_rgba(74,246,38,0.25)]'
                            : 'bg-[#2A2008]/80 border-[var(--pixel-amber-gold,#FFCC00)] shadow-[0_0_20px_rgba(255,204,0,0.25)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 border rounded-none ${
                                shieldActive
                                  ? 'border-[var(--pixel-phosphor-green,#4AF626)] bg-[var(--pixel-phosphor-green,#4AF626)]/10 text-[var(--pixel-phosphor-green,#4AF626)]'
                                  : 'border-[var(--pixel-amber-gold,#FFCC00)] bg-[var(--pixel-amber-gold,#FFCC00)]/10 text-[var(--pixel-amber-gold,#FFCC00)]'
                              }`}
                            >
                              {shieldActive ? (
                                <ShieldCheck className="w-6 h-6" />
                              ) : (
                                <ShieldAlert className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-pixel text-xs sm:text-sm tracking-wide ${
                                    shieldActive ? 'text-[var(--pixel-phosphor-green,#4AF626)]' : 'text-[var(--pixel-amber-gold,#FFCC00)]'
                                  }`}
                                >
                                  {shieldActive
                                    ? 'DISTRACTION SHIELD: ENGAGED [ACTIVE]'
                                    : 'DISTRACTION SHIELD: BYPASS [PAUSED]'}
                                </span>
                              </div>
                              <p className="font-mono text-xs text-[var(--crt-bezel-putty,#D6CFC2)] mt-1 leading-relaxed">
                                {shieldActive
                                  ? '1,482 Declarative Net Rules Active • Zero DNS Leaks • Video Feeds & Ads Blocked'
                                  : 'Bypass active for 15m • Pass-through traffic unhindered • Standby mode'}
                              </p>
                            </div>
                          </div>

                          {/* 90s Cyber Beveled Switch Lamp */}
                          <div
                            className={`shrink-0 px-3 py-1.5 border-2 font-pixel text-[10px] tracking-wider transition-colors rounded-none ${
                              shieldActive
                                ? 'bg-[var(--pixel-phosphor-green,#4AF626)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-phosphor-green,#4AF626)] font-bold shadow-[0_0_12px_var(--pixel-phosphor-green,#4AF626)]'
                                : 'bg-[var(--pixel-amber-gold,#FFCC00)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-amber-gold,#FFCC00)] font-bold shadow-[0_0_12px_var(--pixel-amber-gold,#FFCC00)]'
                            }`}
                          >
                            {shieldActive ? '[ ON ]' : '[ OFF ]'}
                          </div>
                        </div>
                      </div>

                      {/* 2. Background Tab Heap Throttler Slider & Memory Readout */}
                      <div
                        className="p-4 border border-[var(--crt-bezel-shadow,#2D3645)] space-y-4"
                        style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-[var(--tech-cyan-wave,#00F0FF)]" />
                            <span className="font-pixel text-[10px] text-[var(--tech-cyan-wave,#00F0FF)]">
                              BACKGROUND TAB HEAP THROTTLER
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#8E98AA]">
                            Level: <strong className="text-[var(--pixel-phosphor-green,#4AF626)]">{throttlePercent}%</strong>
                          </span>
                        </div>

                        {/* Interactive Range Input */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={throttlePercent}
                            onChange={handleSliderChange}
                            aria-label="Background Tab Heap Throttler Slider"
                            className="w-full h-2 border border-[var(--crt-bezel-shadow,#2D3645)] appearance-none cursor-pointer accent-[var(--tech-cyan-wave,#00F0FF)] rounded-none"
                            style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                          />
                          <div className="flex justify-between text-[9px] font-mono text-[#8E98AA]">
                            <span>0% (Idle / Unrestricted)</span>
                            <span>50% (Balanced)</span>
                            <span>100% (Aggressive Discard)</span>
                          </div>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setThrottlerPreset(0)}
                            className={`py-1 px-2 border font-pixel text-[8px] transition-all rounded-none ${
                              throttlePercent === 0
                                ? 'bg-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-void-bg,#070814)] border-[var(--tech-cyan-wave,#00F0FF)]'
                                : 'bg-[var(--crt-phosphor-dark,#0D1512)] text-[var(--crt-bezel-putty,#D6CFC2)] border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)]'
                            }`}
                          >
                            0% IDLE (1,840 MB)
                          </button>
                          <button
                            type="button"
                            onClick={() => setThrottlerPreset(50)}
                            className={`py-1 px-2 border font-pixel text-[8px] transition-all rounded-none ${
                              throttlePercent === 50
                                ? 'bg-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-void-bg,#070814)] border-[var(--tech-cyan-wave,#00F0FF)]'
                                : 'bg-[var(--crt-phosphor-dark,#0D1512)] text-[var(--crt-bezel-putty,#D6CFC2)] border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)]'
                            }`}
                          >
                            50% BALANCED
                          </button>
                          <button
                            type="button"
                            onClick={() => setThrottlerPreset(100)}
                            className={`py-1 px-2 border font-pixel text-[8px] transition-all rounded-none ${
                              throttlePercent === 100
                                ? 'bg-[var(--pixel-phosphor-green,#4AF626)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-phosphor-green,#4AF626)]'
                                : 'bg-[var(--crt-phosphor-dark,#0D1512)] text-[var(--crt-bezel-putty,#D6CFC2)] border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--pixel-phosphor-green,#4AF626)]'
                            }`}
                          >
                            100% AGGRESSIVE (420 MB)
                          </button>
                        </div>

                        {/* Live Animated Memory Readout */}
                        <div
                          className="p-3 border-2 border-[var(--crt-bezel-shadow,#2D3645)] flex flex-col sm:flex-row items-center justify-between gap-3"
                          style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                        >
                          <div>
                            <span className="font-pixel text-[8px] text-[#8E98AA] block uppercase">
                              SIMULATED CHROME RENDERER MEMORY
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="font-pixel text-2xl sm:text-3xl text-[var(--pixel-phosphor-green,#4AF626)] tracking-tight">
                                {displayMemory.toLocaleString()} MB
                              </span>
                              <span className="font-mono text-xs text-[var(--tech-cyan-wave,#00F0FF)]">
                                ({displayMemory < 1840 ? `-${Math.round(((1840 - displayMemory) / 1840) * 100)}% RECLAIMED` : '0% RECLAIMED (BASELINE)'})
                              </span>
                            </div>
                          </div>

                          {/* Reclaimed Heap Badge */}
                          <div className="text-right sm:border-l sm:border-[var(--crt-bezel-shadow,#2D3645)] sm:pl-4">
                            <span className="font-pixel text-[8px] text-[#8E98AA] block">
                              SAVED FROM CRASH
                            </span>
                            <span className="font-mono text-sm font-bold text-[var(--tech-cyan-wave,#00F0FF)]">
                              {displayMemory < 1840 ? `-${(1840 - displayMemory).toLocaleString()} MB HEAP` : '0 MB RECLAIMED'}
                            </span>
                          </div>
                        </div>

                        {/* Animated Visual Memory Bar */}
                        <div className="space-y-1">
                          <div
                            className="h-3 w-full border border-[var(--crt-bezel-shadow,#2D3645)] p-0.5 flex"
                            style={{ backgroundColor: 'var(--crt-void-bg, #070814)' }}
                          >
                            {/* Active Memory */}
                            <div
                              className="h-full bg-gradient-to-r from-[var(--tech-cyan-wave,#00F0FF)] to-[var(--pixel-phosphor-green,#4AF626)] transition-all duration-300"
                              style={{ width: `${(displayMemory / 1840) * 100}%` }}
                            />
                            {/* Reclaimed Memory */}
                            <div
                              className="h-full bg-white/10 border-l border-white/20 transition-all duration-300"
                              style={{ width: `${((1840 - displayMemory) / 1840) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-[#8E98AA]">
                            <span>Active: {displayMemory} MB</span>
                            <span className="text-[var(--tech-cyan-wave,#00F0FF)]">
                              Purged: {1840 - displayMemory} MB
                            </span>
                          </div>
                        </div>

                        {/* Telemetry Readout Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--crt-bezel-shadow,#2D3645)] text-center">
                          <div
                            className="p-1.5 border border-white/5"
                            style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                          >
                            <span className="font-mono text-[9px] text-[#8E98AA] block">chrome.tabs.discard()</span>
                            <span className="font-pixel text-[10px] text-[var(--pixel-ivory-text,#F0EFE6)]">
                              {Math.round((throttlePercent / 100) * 24)} / 24 Tabs
                            </span>
                          </div>
                          <div
                            className="p-1.5 border border-white/5"
                            style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                          >
                            <span className="font-mono text-[9px] text-[#8E98AA] block">GC Cycle</span>
                            <span className="font-pixel text-[10px] text-[var(--pixel-phosphor-green,#4AF626)]">180s POSIX</span>
                          </div>
                          <div
                            className="p-1.5 border border-white/5"
                            style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                          >
                            <span className="font-mono text-[9px] text-[#8E98AA] block">DOM Reflow</span>
                            <span className="font-pixel text-[10px] text-[var(--tech-cyan-wave,#00F0FF)]">0 ops/sec</span>
                          </div>
                          <div
                            className="p-1.5 border border-white/5"
                            style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                          >
                            <span className="font-mono text-[9px] text-[#8E98AA] block">DNR Latency</span>
                            <span className="font-pixel text-[10px] text-[var(--pixel-amber-gold,#FFCC00)]">&lt; 0.1 ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHADOW DOM INJECTION HUD */}
              {activeTab === 'shadow-dom' && (
                <div className="p-4 sm:p-6 bg-[#090C18]/95 space-y-6">
                  {/* Top Bar for Tab 2: Control HUD injection state */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 p-3 border border-[var(--crt-bezel-shadow,#2D3645)]"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[var(--pixel-phosphor-green,#4AF626)]" />
                      <span className="font-pixel text-[10px] text-[var(--pixel-ivory-text,#F0EFE6)]">
                        CONTENT SCRIPT // SHADOW DOM ISOLATION ENGINE
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playInteractionCoin();
                          setIsHudInjected((prev) => !prev);
                        }}
                        className={`px-3 py-1 font-pixel text-[9px] border transition-all rounded-none ${
                          isHudInjected
                            ? 'bg-[#0E2B12] border-[var(--pixel-phosphor-green,#4AF626)] text-[var(--pixel-phosphor-green,#4AF626)]'
                            : 'bg-black/50 border-[#8E98AA] text-[#8E98AA]'
                        }`}
                      >
                        {isHudInjected ? '[ HUD INJECTED ]' : '[ INJECT HUD ]'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playInteractionTick();
                          setShowDomInspector((prev) => !prev);
                        }}
                        className="px-2.5 py-1 border border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--tech-cyan-wave,#00F0FF)] font-pixel text-[9px] hover:bg-[var(--tech-cyan-wave,#00F0FF)] hover:text-[var(--crt-void-bg,#070814)] transition-colors rounded-none"
                        style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                      >
                        {showDomInspector ? 'HIDE DOM CODE' : 'INSPECT SHADOW ROOT'}
                      </button>
                    </div>
                  </div>

                  {/* DOM Tree Inspector Drawer (Conditional) */}
                  {showDomInspector && (
                    <div
                      className="p-3 border-2 border-[var(--tech-cyan-wave,#00F0FF)]/50 font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] space-y-1"
                      style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                    >
                      <div className="text-[var(--tech-cyan-wave,#00F0FF)] font-pixel text-[9px] mb-2 flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>ISOLATED SHADOW ROOT ARCHITECTURE // ZERO CSS BLEED</span>
                      </div>
                      <p className="text-[#8E98AA]">&lt;!-- Active Host Document DOM Tree --&gt;</p>
                      <p className="text-white">&lt;html class=&quot;host-document-with-custom-styles&quot;&gt;</p>
                      <p className="pl-4 text-white">&lt;body&gt;</p>
                      <p className="pl-8 text-[#8E98AA]">&lt;div class=&quot;host-article-container&quot;&gt;...&lt;/div&gt;</p>
                      <p className="pl-8 text-[var(--pixel-phosphor-green,#4AF626)]">&lt;div id=&quot;focusguard-shadow-host&quot;&gt;</p>
                      <p className="pl-12 text-[var(--tech-magenta-crest,#FF2A85)] font-bold">#shadow-root (closed)</p>
                      <p className="pl-16 text-[var(--tech-cyan-wave,#00F0FF)]">
                        &lt;style&gt; :host &#123; all: initial; position: fixed; z-index: 2147483647; font-family: &apos;JetBrains Mono&apos;; &#125; ... &lt;/style&gt;
                      </p>
                      <p className="pl-16 text-[var(--pixel-phosphor-green,#4AF626)]">&lt;div class=&quot;focusguard-radial-hud&quot;&gt;...&lt;/div&gt;</p>
                      <p className="pl-8 text-[var(--pixel-phosphor-green,#4AF626)]">&lt;/div&gt;</p>
                      <p className="pl-4 text-white">&lt;/body&gt;</p>
                      <p className="text-white">&lt;/html&gt;</p>
                    </div>
                  )}

                  {/* Simulated Host Web Page Viewport with Injected Focus HUD */}
                  <div className="relative min-h-[360px] bg-[#0c101d] border-2 border-[var(--crt-bezel-shadow,#2D3645)] p-5 sm:p-6 overflow-hidden">
                    {/* Simulated Host Page Header */}
                    <div className="space-y-3 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#8E98AA]">
                        <Globe className="w-3.5 h-3.5 text-[var(--tech-cyan-wave,#00F0FF)]" />
                        <span>https://techdocs.systems.org/distributed-consensus</span>
                        <span className="text-[10px] px-1 bg-white/10 text-white">EXTERNAL HOST SITE</span>
                      </div>
                      <h3 className="font-serif text-xl sm:text-2xl text-amber-100 font-bold tracking-tight">
                        Byzantine Fault Tolerance &amp; Distributed Systems Engineering
                      </h3>
                      <p className="font-serif text-sm text-[var(--crt-bezel-putty,#D6CFC2)]/80 leading-relaxed max-w-lg">
                        In fault-tolerant distributed networks, consensus must be achieved even when up to one-third of the participating nodes arbitrarily mutate packets, fail, or exhibit Byzantine behavior...
                      </p>
                      <div className="p-3 bg-red-950/20 border border-red-500/20 text-xs font-serif text-red-200/60 max-w-md">
                        [Aggressive Host CSS Applied: <code className="text-red-300">* &#123; font-family: serif; color: #ffcccc; &#125;</code>]
                      </div>
                    </div>

                    {/* Zero-Latency INJECTED SHADOW DOM FOCUS HUD */}
                    {isHudInjected && (
                      <div
                        className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 max-w-xs border-2 border-[var(--pixel-phosphor-green,#4AF626)] shadow-[0_0_25px_rgba(74,246,38,0.35),2px_2px_0_0_var(--crt-void-bg,#070814)] p-4 animate-in fade-in zoom-in duration-200 rounded-none"
                        style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                      >
                        {/* Shadow Root Banner */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--crt-bezel-shadow,#2D3645)]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-none bg-[var(--pixel-phosphor-green,#4AF626)] animate-pulse" />
                            <span className="font-pixel text-[8px] text-[var(--pixel-phosphor-green,#4AF626)]">
                              #shadow-root (closed)
                            </span>
                          </div>
                          <span
                            className="font-mono text-[8px] px-1 text-[var(--tech-cyan-wave,#00F0FF)] border border-[var(--tech-cyan-wave,#00F0FF)]/30"
                            style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                          >
                            ZERO_REFLOW
                          </span>
                        </div>

                        {/* Interactive Custom Radial Timer HUD */}
                        <div className="flex items-center gap-4">
                          {/* Radial Progress SVG Ring */}
                          <div
                            onClick={toggleTimer}
                            className="relative w-24 h-24 shrink-0 flex items-center justify-center cursor-pointer group"
                            title={isTimerRunning ? 'Click to Pause' : 'Click to Start'}
                          >
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              {/* Background Track */}
                              <circle
                                cx="50"
                                cy="50"
                                r={timerRadius}
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="6"
                                fill="none"
                              />
                              {/* Active Radial Progress */}
                              <circle
                                cx="50"
                                cy="50"
                                r={timerRadius}
                                stroke={timerMode === 'focus' ? 'var(--tech-cyan-wave, #00F0FF)' : 'var(--pixel-phosphor-green, #4AF626)'}
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={timerCircumference}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            </svg>

                            {/* Digital Timer in Center */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="font-pixel text-xs text-[var(--pixel-ivory-text,#F0EFE6)] tracking-tight">
                                {formatTimer(timerSeconds)}
                              </span>
                              <span className="font-mono text-[8px] text-[var(--tech-cyan-wave,#00F0FF)] uppercase">
                                {timerMode}
                              </span>
                            </div>
                          </div>

                          {/* Timer Controls & Session Badges */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={toggleTimer}
                                className={`flex items-center gap-1 px-2 py-1 font-pixel text-[8px] border transition-all rounded-none ${
                                  isTimerRunning
                                    ? 'bg-[var(--pixel-amber-gold,#FFCC00)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-amber-gold,#FFCC00)]'
                                    : 'bg-[var(--pixel-phosphor-green,#4AF626)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-phosphor-green,#4AF626)]'
                                }`}
                                aria-label={isTimerRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
                              >
                                {isTimerRunning ? (
                                  <>
                                    <Pause className="w-2.5 h-2.5" /> PAUSE
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5" /> START
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={resetTimer}
                                className="p-1 border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-bezel-putty,#D6CFC2)] hover:text-[var(--tech-cyan-wave,#00F0FF)] transition-colors rounded-none"
                                style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                                title="Reset Timer"
                                aria-label="Reset Timer"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => switchTimerMode('focus')}
                                className={`px-1.5 py-0.5 font-pixel text-[7px] border transition-all rounded-none ${
                                  timerMode === 'focus'
                                    ? 'bg-[var(--tech-cyan-wave,#00F0FF)] text-[var(--crt-void-bg,#070814)] border-[var(--tech-cyan-wave,#00F0FF)]'
                                    : 'text-[#8E98AA] border-[var(--crt-bezel-shadow,#2D3645)]'
                                }`}
                                style={{
                                  backgroundColor: timerMode === 'focus' ? undefined : 'var(--crt-panel-slate, #131629)',
                                }}
                              >
                                25M FOCUS
                              </button>
                              <button
                                type="button"
                                onClick={() => switchTimerMode('short-break')}
                                className={`px-1.5 py-0.5 font-pixel text-[7px] border transition-all rounded-none ${
                                  timerMode === 'short-break'
                                    ? 'bg-[var(--pixel-phosphor-green,#4AF626)] text-[var(--crt-void-bg,#070814)] border-[var(--pixel-phosphor-green,#4AF626)]'
                                    : 'text-[#8E98AA] border-[var(--crt-bezel-shadow,#2D3645)]'
                                }`}
                                style={{
                                  backgroundColor: timerMode === 'short-break' ? undefined : 'var(--crt-panel-slate, #131629)',
                                }}
                              >
                                5M BREAK
                              </button>
                            </div>

                            <div className="font-mono text-[9px] text-[#8E98AA] space-y-0.5">
                              <div>Blocked: <strong className="text-[var(--tech-magenta-crest,#FF2A85)]">{distractionsBlockedCount} items</strong></div>
                              <div>Session: <span className="text-[var(--tech-cyan-wave,#00F0FF)]">DEEP_WORK_04</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Architectural Isolation Callouts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)]"
                      style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[var(--tech-cyan-wave,#00F0FF)] font-pixel text-[9px]">
                        <Shield className="w-3 h-3" />
                        <span>CLOSED SHADOW BOUNDARY</span>
                      </div>
                      <p className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] leading-relaxed">
                        Injected via <code className="text-[var(--pixel-phosphor-green,#4AF626)]">attachShadow(&#123; mode: &apos;closed&apos; &#125;)</code>. Host JavaScript and aggressive host CSS resets cannot query or penetrate the internal HUD DOM tree.
                      </p>
                    </div>

                    <div
                      className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)]"
                      style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[var(--pixel-phosphor-green,#4AF626)] font-pixel text-[9px]">
                        <Zap className="w-3 h-3" />
                        <span>ZERO-REFLOW RENDERING</span>
                      </div>
                      <p className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] leading-relaxed">
                        Positioned in a fixed top-layer compositing plane. Timer ticks and radial SVG animations trigger 0 layout recalculations or style invalidations on the host page.
                      </p>
                    </div>

                    <div
                      className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)]"
                      style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[var(--pixel-amber-gold,#FFCC00)] font-pixel text-[9px]">
                        <Activity className="w-3 h-3" />
                        <span>EVENT PROPAGATION BARRIER</span>
                      </div>
                      <p className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] leading-relaxed">
                        Internal HUD events call <code className="text-[var(--tech-cyan-wave,#00F0FF)]">e.stopPropagation()</code>, preventing hotkey collision with host website keyboard listeners.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MANIFEST V3 SERVICE WORKER TELEMETRY */}
              {activeTab === 'service-worker' && (
                <div className="p-4 sm:p-6 bg-[#090C18]/95 space-y-6">
                  {/* Event Simulation Controller Bar */}
                  <div
                    className="p-4 border border-[var(--crt-bezel-shadow,#2D3645)] space-y-3"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[var(--tech-magenta-crest,#FF2A85)]" />
                        <span className="font-pixel text-[10px] text-[var(--tech-magenta-crest,#FF2A85)]">
                          INTERACTIVE EVENT DISPATCHER // SIMULATE CHROMIUM SIGNALS
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#8E98AA]">
                        SW State: <strong className={`font-pixel text-[9px] ${
                          swStatus === 'ACTIVE'
                            ? 'text-[var(--pixel-phosphor-green,#4AF626)]'
                            : swStatus === 'WAKING'
                            ? 'text-[var(--pixel-amber-gold,#FFCC00)]'
                            : 'text-[#8E98AA]'
                        }`}>[{swStatus}]</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={simulateDnrBlock}
                        className="p-2 border border-[var(--tech-cyan-wave,#00F0FF)] hover:bg-[var(--tech-cyan-wave,#00F0FF)] hover:text-[var(--crt-void-bg,#070814)] text-[var(--tech-cyan-wave,#00F0FF)] font-pixel text-[8px] transition-all text-left flex items-center gap-2 shadow-[1px_1px_0_0_var(--crt-void-bg,#070814)] rounded-none"
                        style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                      >
                        <Zap className="w-3 h-3 shrink-0" />
                        <span>[1] TEST DECLARATIVE BLOCK (0ms)</span>
                      </button>

                      <button
                        type="button"
                        onClick={simulateAlarmWakeup}
                        className="p-2 border border-[var(--tech-magenta-crest,#FF2A85)] hover:bg-[var(--tech-magenta-crest,#FF2A85)] hover:text-[var(--crt-void-bg,#070814)] text-[var(--tech-magenta-crest,#FF2A85)] font-pixel text-[8px] transition-all text-left flex items-center gap-2 shadow-[1px_1px_0_0_var(--crt-void-bg,#070814)] rounded-none"
                        style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>[2] TRIGGER 5-MIN ALARM TICK</span>
                      </button>

                      <button
                        type="button"
                        onClick={simulateAtomicStorage}
                        className="p-2 border border-[var(--pixel-phosphor-green,#4AF626)] hover:bg-[var(--pixel-phosphor-green,#4AF626)] hover:text-[var(--crt-void-bg,#070814)] text-[var(--pixel-phosphor-green,#4AF626)] font-pixel text-[8px] transition-all text-left flex items-center gap-2 shadow-[1px_1px_0_0_var(--crt-void-bg,#070814)] rounded-none"
                        style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                      >
                        <HardDrive className="w-3 h-3 shrink-0" />
                        <span>[3] ATOMIC STORAGE UPDATE</span>
                      </button>
                    </div>
                  </div>

                  {/* Architectural Flow Diagram with Signal Packets */}
                  <div
                    className="relative p-5 border-2 border-[var(--crt-bezel-shadow,#2D3645)] space-y-4 overflow-hidden"
                    style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--crt-bezel-shadow,#2D3645)]">
                      <span className="font-pixel text-[9px] text-[var(--tech-cyan-wave,#00F0FF)]">
                        MV3 ARCHITECTURAL BUS FLOW &amp; DATA PIPELINE
                      </span>
                      <span className="font-mono text-[9px] text-[#8E98AA]">
                        Zero Persistent Background Heap
                      </span>
                    </div>

                    {/* Flow Nodes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                      {/* Node 1: Event Dispatcher */}
                      <div
                        className={`p-3 border-2 transition-all rounded-none ${
                          activeSignalPath === 'alarm-sw'
                            ? 'border-[var(--pixel-amber-gold,#FFCC00)] bg-[var(--pixel-amber-gold,#FFCC00)]/10 shadow-[0_0_15px_rgba(255,204,0,0.3)]'
                            : 'border-[var(--crt-bezel-shadow,#2D3645)]'
                        }`}
                        style={{
                          backgroundColor: activeSignalPath === 'alarm-sw' ? undefined : 'var(--crt-panel-slate, #131629)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-[var(--pixel-amber-gold,#FFCC00)] font-pixel text-[8px] mb-1">
                          <Radio className="w-3 h-3" />
                          <span>CHROME.ALARMS</span>
                        </div>
                        <p className="font-mono text-[10px] text-[var(--crt-bezel-putty,#D6CFC2)]">
                          Zero-polling scheduled wakeups. Fires every 5 min.
                        </p>
                      </div>

                      {/* Node 2: DeclarativeNetRequest */}
                      <div
                        className={`p-3 border-2 transition-all rounded-none ${
                          activeSignalPath === 'dnr'
                            ? 'border-[var(--tech-cyan-wave,#00F0FF)] bg-[var(--tech-cyan-wave,#00F0FF)]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'border-[var(--crt-bezel-shadow,#2D3645)]'
                        }`}
                        style={{
                          backgroundColor: activeSignalPath === 'dnr' ? undefined : 'var(--crt-panel-slate, #131629)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-[var(--tech-cyan-wave,#00F0FF)] font-pixel text-[8px] mb-1">
                          <Zap className="w-3 h-3" />
                          <span>DNR FAST-PATH</span>
                        </div>
                        <p className="font-mono text-[10px] text-[var(--crt-bezel-putty,#D6CFC2)]">
                          Chromium C++ kernel evaluation. Blocks in 0ms without waking SW.
                        </p>
                      </div>

                      {/* Node 3: Ephemeral Service Worker */}
                      <div
                        className={`p-3 border-2 transition-all rounded-none ${
                          swStatus === 'ACTIVE'
                            ? 'border-[var(--pixel-phosphor-green,#4AF626)] bg-[var(--pixel-phosphor-green,#4AF626)]/15 shadow-[0_0_20px_rgba(74,246,38,0.4)]'
                            : swStatus === 'WAKING'
                            ? 'border-[var(--pixel-amber-gold,#FFCC00)] bg-[var(--pixel-amber-gold,#FFCC00)]/10'
                            : 'border-[var(--crt-bezel-shadow,#2D3645)]'
                        }`}
                        style={{
                          backgroundColor:
                            swStatus === 'ACTIVE' || swStatus === 'WAKING'
                              ? undefined
                              : 'var(--crt-panel-slate, #131629)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-[var(--pixel-phosphor-green,#4AF626)] font-pixel text-[8px] mb-1">
                          <Cpu className="w-3 h-3" />
                          <span>SERVICE WORKER</span>
                        </div>
                        <p className="font-mono text-[10px] text-[var(--crt-bezel-putty,#D6CFC2)]">
                          Status: <strong className="text-white">{swStatus}</strong>. Memory budget &lt; 12 MB.
                        </p>
                      </div>

                      {/* Node 4: Atomic Storage */}
                      <div
                        className={`p-3 border-2 transition-all rounded-none ${
                          activeSignalPath === 'storage'
                            ? 'border-[var(--pixel-phosphor-green,#4AF626)] bg-[var(--pixel-phosphor-green,#4AF626)]/15 shadow-[0_0_15px_rgba(74,246,38,0.4)]'
                            : 'border-[var(--crt-bezel-shadow,#2D3645)]'
                        }`}
                        style={{
                          backgroundColor: activeSignalPath === 'storage' ? undefined : 'var(--crt-panel-slate, #131629)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-[var(--pixel-phosphor-green,#4AF626)] font-pixel text-[8px] mb-1">
                          <HardDrive className="w-3 h-3" />
                          <span>STORAGE.LOCAL</span>
                        </div>
                        <p className="font-mono text-[10px] text-[var(--crt-bezel-putty,#D6CFC2)]">
                          Atomic JSON storage cache with zero lock contention.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Live Telemetry Stream Console */}
                  <div
                    className="border border-[var(--crt-bezel-shadow,#2D3645)] p-3 space-y-2"
                    style={{ backgroundColor: 'var(--crt-void-bg, #070814)' }}
                  >
                    <div className="flex items-center justify-between border-b border-[var(--crt-bezel-shadow,#2D3645)] pb-1.5">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[var(--pixel-phosphor-green,#4AF626)]" />
                        <span className="font-pixel text-[8px] text-[var(--pixel-phosphor-green,#4AF626)]">
                          SERVICE_WORKER // STDOUT TELEMETRY STREAM
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playInteractionTick();
                          setTelemetryLogs([]);
                        }}
                        className="font-mono text-[9px] text-[#8E98AA] hover:text-[var(--tech-magenta-crest,#FF2A85)] transition-colors"
                      >
                        [CLEAR LOG]
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] select-text">
                      {telemetryLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#8E98AA] shrink-0">[{log.timestamp}]</span>
                          <span
                            className={`font-pixel text-[8px] px-1 py-0.2 shrink-0 ${
                              log.subsystem === 'DNR'
                                ? 'bg-[var(--tech-cyan-wave,#00F0FF)]/10 text-[var(--tech-cyan-wave,#00F0FF)] border border-[var(--tech-cyan-wave,#00F0FF)]/30'
                                : log.subsystem === 'SW'
                                ? 'bg-[var(--tech-magenta-crest,#FF2A85)]/10 text-[var(--tech-magenta-crest,#FF2A85)] border border-[var(--tech-magenta-crest,#FF2A85)]/30'
                                : log.subsystem === 'ALARMS'
                                ? 'bg-[var(--pixel-amber-gold,#FFCC00)]/10 text-[var(--pixel-amber-gold,#FFCC00)] border border-[var(--pixel-amber-gold,#FFCC00)]/30'
                                : 'bg-[var(--pixel-phosphor-green,#4AF626)]/10 text-[var(--pixel-phosphor-green,#4AF626)] border border-[var(--pixel-phosphor-green,#4AF626)]/30'
                            }`}
                          >
                            {log.subsystem}
                          </span>
                          <span
                            className={
                              log.status === 'blocked'
                                ? 'text-[var(--tech-magenta-crest,#FF2A85)]'
                                : log.status === 'warn'
                                ? 'text-[var(--pixel-amber-gold,#FFCC00)]'
                                : 'text-[var(--crt-bezel-putty,#D6CFC2)]'
                            }
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Retro 90s Cyberdeck Architecture Spec Sheet & Direct GitHub Repo Link (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Retro 90s Spec Sheet Window */}
            <div
              className="border-2 border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)]/60 shadow-[2px_2px_0_0_var(--crt-void-bg,#070814)] transition-all duration-200"
              style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
            >
              {/* Retro Window Titlebar */}
              <div
                className="flex items-center justify-between px-3 py-1.5 border-b-2 border-[var(--crt-bezel-shadow,#2D3645)] select-none"
                style={{ backgroundColor: 'var(--crt-phosphor-dark, #0D1512)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-[var(--tech-cyan-wave,#00F0FF)] shadow-[0_0_8px_var(--tech-cyan-wave,#00F0FF)]" />
                  <span className="font-pixel text-[10px] text-[var(--tech-cyan-wave,#00F0FF)]">
                    SPEC_SHEET // FOCUSGUARD.SYS
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 flex items-center justify-center font-pixel text-[8px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] text-[var(--crt-bezel-putty,#D6CFC2)]">
                    -
                  </span>
                  <span className="w-3.5 h-3.5 flex items-center justify-center font-pixel text-[8px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] text-[var(--crt-bezel-putty,#D6CFC2)]">
                    +
                  </span>
                  <span className="w-3.5 h-3.5 flex items-center justify-center font-pixel text-[8px] bg-[var(--crt-panel-slate,#131629)] border border-[var(--crt-bezel-shadow,#2D3645)] text-[var(--crt-bezel-putty,#D6CFC2)]">
                    x
                  </span>
                </div>
              </div>

              {/* Spec Sheet Body */}
              <div
                className="p-5 space-y-5"
                style={{ backgroundColor: 'rgba(13, 21, 18, 0.95)' }}
              >
                <div className="border-b border-[var(--crt-bezel-shadow,#2D3645)] pb-3">
                  <span className="font-pixel text-[9px] text-[var(--pixel-phosphor-green,#4AF626)] block uppercase tracking-wider mb-1">
                    PRODUCTION EXTENSION MATRIX
                  </span>
                  <p className="font-mono text-xs text-[var(--crt-bezel-putty,#D6CFC2)] leading-relaxed">
                    Zero-compromise Manifest V3 implementation certified for modern Chromium browsers.
                  </p>
                </div>

                {/* Core Architectural Specs (4 Mandatory Items) */}
                <div className="space-y-4">
                  {/* 1. Architecture */}
                  <div
                    className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-cyan-wave,#00F0FF)]/50 transition-colors"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[10px] text-[#8E98AA] block uppercase">
                      Architecture
                    </span>
                    <span className="font-pixel text-xs text-[var(--tech-cyan-wave,#00F0FF)] block mt-0.5">
                      Chrome Manifest V3 / TypeScript
                    </span>
                    <span className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] block mt-1">
                      Strict CSP compliance, typed IPC messaging, zero eval(), tree-shaken bundles.
                    </span>
                  </div>

                  {/* 2. Memory Footprint */}
                  <div
                    className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--pixel-phosphor-green,#4AF626)]/50 transition-colors"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[10px] text-[#8E98AA] block uppercase">
                      Memory Footprint
                    </span>
                    <span className="font-pixel text-xs text-[var(--pixel-phosphor-green,#4AF626)] block mt-0.5">
                      &lt; 12 MB background heap
                    </span>
                    <span className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] block mt-1">
                      Zero persistent background pages. Non-blocking tab discarding frees up to 1.4 GB RAM.
                    </span>
                  </div>

                  {/* 3. Network Latency */}
                  <div
                    className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--tech-magenta-crest,#FF2A85)]/50 transition-colors"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[10px] text-[#8E98AA] block uppercase">
                      Network Latency
                    </span>
                    <span className="font-pixel text-xs text-[var(--tech-magenta-crest,#FF2A85)] block mt-0.5">
                      0ms (Local declarative blocking)
                    </span>
                    <span className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] block mt-1">
                      Bypass JavaScript execution loop entirely via C++ declarativeNetRequest engine.
                    </span>
                  </div>

                  {/* 4. Isolation */}
                  <div
                    className="p-3 border border-[var(--crt-bezel-shadow,#2D3645)] hover:border-[var(--pixel-amber-gold,#FFCC00)]/50 transition-colors"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[10px] text-[#8E98AA] block uppercase">
                      Isolation
                    </span>
                    <span className="font-pixel text-xs text-[var(--pixel-amber-gold,#FFCC00)] block mt-0.5">
                      Closed Shadow DOM Tree + CSS Variables
                    </span>
                    <span className="font-mono text-[11px] text-[var(--crt-bezel-putty,#D6CFC2)] block mt-1">
                      Complete style isolation. Immune to host page CSS collision and global style pollution.
                    </span>
                  </div>
                </div>

                {/* Additional Chromium Specs */}
                <div className="pt-2 border-t border-[var(--crt-bezel-shadow,#2D3645)] grid grid-cols-2 gap-2 text-center">
                  <div
                    className="p-2 border border-white/5"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[9px] text-[#8E98AA] block">Target Browsers</span>
                    <span className="font-pixel text-[9px] text-[var(--pixel-ivory-text,#F0EFE6)]">Blink / V8 116+</span>
                  </div>
                  <div
                    className="p-2 border border-white/5"
                    style={{ backgroundColor: 'var(--crt-panel-slate, #131629)' }}
                  >
                    <span className="font-mono text-[9px] text-[#8E98AA] block">Dependencies</span>
                    <span className="font-pixel text-[9px] text-[var(--pixel-phosphor-green,#4AF626)]">0 External Pkgs</span>
                  </div>
                </div>

                {/* Direct Magnetic GitHub Repo Button */}
                <div className="pt-3">
                  <MagneticButton
                    as="a"
                    href="https://github.com/watchknight/FocusGuard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playInteractionCoin()}
                    className="w-full group flex items-center justify-center gap-2 py-3 px-4 bg-[#0C2430] hover:bg-[var(--tech-cyan-wave,#00F0FF)] border-2 border-[var(--tech-cyan-wave,#00F0FF)] text-[var(--tech-cyan-wave,#00F0FF)] hover:text-[var(--crt-void-bg,#070814)] font-pixel text-[10px] sm:text-[11px] tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(0,240,255,0.3),2px_2px_0_0_var(--crt-void-bg,#070814)] rounded-none"
                    aria-label="Inspect FocusGuard Repository on GitHub"
                  >
                    <span>&gt;_</span>
                    <span>INSPECT FOCUSGUARD REPO ON GITHUB ↗</span>
                  </MagneticButton>
                  <p className="font-mono text-[10px] text-center text-[#8E98AA] mt-2">
                    Repository: github.com/watchknight/FocusGuard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExtensionStudio;
