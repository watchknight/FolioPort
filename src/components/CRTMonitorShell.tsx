import React, { useState, useCallback, useRef, useEffect } from 'react';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { retroAudio } from '../utils/retroAudio';
import { CRTBootSequence } from './CRTBootSequence';
import { useRetroOS } from '../context/RetroOSContext';

export interface CRTMonitorShellProps {
  children: React.ReactNode;
  initialBoot?: boolean;
}

export const CRTMonitorShell: React.FC<CRTMonitorShellProps> = ({
  children,
  initialBoot = true,
}) => {
  const os = useRetroOS();
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [transitionType, setTransitionType] = useState<'off' | 'on' | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isBooting, setIsBooting] = useState<boolean>(initialBoot);
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sync initial sfx state
    retroAudio.setMuted(!sfxEnabled);
    if (os.isInsideProvider) {
      os.setSoundEnabled(sfxEnabled);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [sfxEnabled, os]);

  useEffect(() => {
    if (os.isInsideProvider) {
      os.setIsBooting(isBooting && isPoweredOn);
    }
  }, [isBooting, isPoweredOn, os]);

  const handlePowerToggle = useCallback(() => {
    if (transitionType !== null) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPoweredOn) {
      setTransitionType('off');
      if (sfxEnabled) {
        watchknightAudio.play8BitBlip(160);
        watchknightAudio.playTransitionSwoosh(0.4);
      }
      // 450ms collapse animation duration
      timerRef.current = setTimeout(() => {
        setIsPoweredOn(false);
        setIsBooting(false);
        setTransitionType(null);
        timerRef.current = null;
      }, 450);
    } else {
      setIsPoweredOn(true);
      setTransitionType('on');
      setIsBooting(true);
      if (sfxEnabled) {
        retroAudio.playBlip();
      }
      // 500ms expand animation duration
      timerRef.current = setTimeout(() => {
        setTransitionType(null);
        timerRef.current = null;
      }, 500);
    }
  }, [isPoweredOn, transitionType, sfxEnabled]);

  const handleSfxToggle = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      watchknightAudio.setMuted(!next);
      chiptuneAudio.setMuted(!next);
      retroAudio.setMuted(!next);
      if (os.isInsideProvider) {
        os.setSoundEnabled(next);
      }
      if (next) {
        retroAudio.playBlip();
      }
      return next;
    });
  }, [os]);

  return (
    <div
      className="min-h-screen h-[100dvh] w-full bg-[#0a0e0b] flex items-center justify-center p-0 md:p-6 lg:p-8 select-none font-pixel overflow-x-hidden"
      style={{ backgroundColor: '#0a0e0b' }}
      data-testid="crt-monitor-room"
    >
      {/* 90s CRT Monitor Outer Hardware Chassis Frame */}
      <div
        className="relative w-full max-w-[980px] h-[100dvh] md:h-auto md:aspect-[4/3] flex flex-col bg-[#c8c2ab] border-t-[8px] border-l-[8px] border-[#ded8c1] border-b-[12px] border-r-[12px] border-[#8f8973] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_0_2px_#3b3a32] p-2.5 sm:p-4 md:p-6 transition-all duration-300 min-h-screen md:min-h-0 overflow-x-hidden"
        style={{
          maxWidth: '980px',
          backgroundColor: '#c8c2ab',
        }}
        data-testid="crt-monitor-casing"
      >
        {/* Recessed Corner Seams & Top Bezel Ventilation Slots */}
        <div className="flex items-center justify-between px-2 pb-2 opacity-75">
          {/* Top-Left Recessed Corner Seam */}
          <div
            className="w-4 h-1 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
            aria-hidden="true"
          />

          {/* Center Cooling Louver Slots */}
          <div className="flex items-center gap-1.5 sm:gap-2" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="h-1 w-3 sm:w-5 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
              />
            ))}
          </div>

          {/* Top-Right Recessed Corner Seam */}
          <div
            className="w-4 h-1 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
            aria-hidden="true"
          />
        </div>

        {/* Deep Recessed Inner Screen Frame Lip (#3b3a32) */}
        <div
          className="relative flex-1 flex flex-col bg-[#3b3a32] p-2 sm:p-3 md:p-4 rounded-[32px] border-t-[4px] border-l-[4px] border-[#22211c] border-b-[4px] border-r-[4px] border-[#555348] shadow-[inset_0_4px_16px_rgba(0,0,0,0.9),0_2px_0_#ded8c1] overflow-hidden"
          style={{ backgroundColor: '#3b3a32' }}
          data-testid="crt-bezel-lip"
        >
          {/* Curved CRT Glass Screen (border-radius: 28px, box-shadow: inset 0 0 65px rgba(0,0,0,0.75)) */}
          <div
            ref={screenRef}
            className={`relative flex-1 flex flex-col bg-[#111712] rounded-[28px] shadow-[inset_0_0_65px_rgba(0,0,0,0.75)] overflow-hidden crt-glass-screen ${
              transitionType === 'off'
                ? 'animate-tube-off'
                : transitionType === 'on'
                ? 'animate-tube-on'
                : ''
            }`}
            style={{
              backgroundColor: '#111712',
              borderRadius: '28px',
              boxShadow: 'inset 0 0 65px rgba(0,0,0,0.75)',
            }}
            data-testid="crt-glass-screen"
          >
            {/* Screen Content Wrapper: scrollable inside CRT */}
            {isPoweredOn ? (
              <div
                data-lenis-prevent
                className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden crt-screen-scroll flex flex-col text-[#c2cdb4]"
              >
                {children}
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070b08] select-none">
                <div className="w-2.5 h-2.5 bg-[#2e3b2b] animate-ping mb-4" />
                <p className="font-pixel text-[10px] text-[#6e7d62] uppercase tracking-wider mb-2">
                  [ CRT TUBE STANDBY // POWER OFF ]
                </p>
                <p className="font-crt text-sm text-[#2e3b2b]">
                  PRESS [POWER] ON HARDWARE BEZEL TO RE-ENERGIZE CATHODE GUNS
                </p>
              </div>
            )}

            {/* Fast 90s CRT Power-On & BIOS Boot Sequence */}
            {isPoweredOn && isBooting && (
              <CRTBootSequence
                onComplete={() => {
                  setIsBooting(false);
                  if (os.isInsideProvider) {
                    os.setIsBooting(false);
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Tactile Hardware Controls Along Bottom-Right Beige Plastic Bezel */}
        <aside
          className="mt-2.5 sm:mt-3 flex items-center justify-between px-2 pt-1 font-pixel select-none text-[9px]"
          aria-label="90s CRT Monitor Hardware Bezel Controls"
        >
          {/* Bottom-Left: Vintage Debossed Hardware Emblem */}
          <div className="flex items-center gap-2">
            <span
              className="font-pixel text-[9px] sm:text-[10px] font-bold text-[#3b3a32] tracking-widest"
              style={{ textShadow: '1px 1px 0 #ded8c1' }}
            >
              WATCHKNIGHT
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[8px] bg-[#3b3a32] text-[#c8c2ab] border border-[#8f8973] shadow-[inset_1px_1px_0_#22211c]">
              SYS.96 CRT // 15"
            </span>
          </div>

          {/* Bottom-Center: Cooling Louvers / Speaker Slits */}
          <div className="hidden md:flex gap-1 items-center opacity-60" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="w-1 h-3 bg-[#8f8973] shadow-[0_1px_0_#ded8c1]"
              />
            ))}
          </div>

          {/* Bottom-Right: Tactile Hardware Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* [SFX: ON/OFF] Hardware Toggle Switch */}
            <button
              type="button"
              onClick={handleSfxToggle}
              className={`px-2 py-1 font-pixel text-[8px] uppercase tracking-wider transition-all duration-75 border-t-2 border-l-2 border-b-2 border-r-2 ${
                sfxEnabled
                  ? 'bg-[#ded8c1] text-[#111712] border-t-[#ded8c1] border-l-[#ded8c1] border-b-[#8f8973] border-r-[#8f8973] shadow-[1px_1px_0_#3b3a32]'
                  : 'bg-[#8f8973] text-[#ded8c1] border-t-[#3b3a32] border-l-[#3b3a32] border-b-[#ded8c1] border-r-[#ded8c1] translate-y-[1px]'
              }`}
              title="Toggle Web Audio Sound Effects"
              aria-label={`Sound effects are currently ${sfxEnabled ? 'ON' : 'OFF'}. Click to toggle.`}
            >
              {`[SFX: ${sfxEnabled ? 'ON' : 'OFF'}]`}
            </button>

            {/* Glowing Pixel Power LED */}
            <div className="flex items-center gap-1.5 pl-1">
              <span
                className={`w-2 h-2 transition-all duration-200 border border-[#3b3a32] ${
                  isPoweredOn
                    ? 'bg-[#c2cdb4] shadow-[0_0_8px_#c2cdb4]'
                    : 'bg-[#2e3b2b]'
                }`}
                aria-hidden="true"
              />
              <span className="text-[8px] font-bold text-[#3b3a32]">PWR</span>
            </div>

            {/* Clickable Tactile Power Button */}
            <button
              type="button"
              onClick={handlePowerToggle}
              disabled={transitionType !== null}
              className="px-2.5 py-1 font-pixel text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#c8c2ab] text-[#3b3a32] border-t-2 border-l-2 border-[#ded8c1] border-b-2 border-r-2 border-[#8f8973] active:border-t-[#8f8973] active:border-l-[#8f8973] active:border-b-[#ded8c1] active:border-r-[#ded8c1] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed shadow-[1px_1px_0_#3b3a32] hover:bg-[#ded8c1] transition-all"
              aria-label="Toggle CRT Monitor Power"
            >
              [POWER]
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CRTMonitorShell;
