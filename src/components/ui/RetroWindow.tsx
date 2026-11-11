import React, { useState, useCallback } from 'react';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface RetroWindowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  tag?: string;
  variant?: 'default' | 'cyan' | 'magenta' | 'amber' | 'phosphor';
  showControls?: boolean;
  collapsible?: boolean;
  statusBar?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({
  title = 'Window',
  icon,
  tag,
  variant = 'default',
  showControls = true,
  collapsible = false,
  statusBar,
  className = '',
  bodyClassName = '',
  children,
  ...props
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleControlClick = useCallback((e: React.MouseEvent, type: 'min' | 'max' | 'close') => {
    e.stopPropagation();
    const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playSpatialClick(normX, 0, -1);

    if (type === 'min' && collapsible) {
      setIsMinimized(prev => !prev);
    } else if (type === 'max') {
      setIsMaximized(prev => !prev);
    }
  }, [collapsible]);

  // Variant color definitions
  const borderStyles: Record<string, string> = {
    default: 'border-2 border-[#2D3645] hover:border-[#00F0FF]/60 shadow-[2px_2px_0_0_#070814]',
    cyan: 'border-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25),2px_2px_0_0_#070814]',
    magenta: 'border-2 border-[#FF2A85] shadow-[0_0_15px_rgba(255,42,133,0.25),2px_2px_0_0_#070814]',
    amber: 'border-2 border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.25),2px_2px_0_0_#070814]',
    phosphor: 'border-2 border-[#4AF626] shadow-[0_0_15px_rgba(74,246,38,0.25),2px_2px_0_0_#070814]',
  };

  const titlebarStyles: Record<string, string> = {
    default: 'bg-gradient-to-r from-[#171B2E] to-[#111422] text-[#F0EFE6] border-b-2 border-[#2D3645]',
    cyan: 'bg-gradient-to-r from-[#0C2430] to-[#0A1A24] text-[#00F0FF] border-b-2 border-[#00F0FF]',
    magenta: 'bg-gradient-to-r from-[#300E1F] to-[#1F0A15] text-[#FF2A85] border-b-2 border-[#FF2A85]',
    amber: 'bg-gradient-to-r from-[#332505] to-[#1E1705] text-[#FFCC00] border-b-2 border-[#FFCC00]',
    phosphor: 'bg-gradient-to-r from-[#0E2B12] to-[#091A0B] text-[#4AF626] border-b-2 border-[#4AF626]',
  };

  return (
    <div
      className={`relative bg-[#131629] text-[#F0EFE6] transition-all duration-200 ${borderStyles[variant]} ${
        isMaximized ? 'fixed inset-4 z-50 overflow-auto' : ''
      } ${className}`}
      style={{
        backgroundColor: 'var(--crt-panel-slate, #131629)',
        color: 'var(--pixel-ivory-text, #F0EFE6)',
        ...props.style,
      }}
      {...props}
    >
      {/* 90s Titlebar with controls and dotted drag handle */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 select-none ${titlebarStyles[variant]}`}>
        {/* Left: Window Glyph & Title */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {icon && <span className="flex-shrink-0 text-current">{icon}</span>}
          {tag && (
            <span className="font-pixel text-[9px] px-1 py-0.5 bg-black/40 border border-white/20 text-[#4AF626]">
              {tag}
            </span>
          )}
          <span className="font-pixel text-[10px] sm:text-[11px] break-words tracking-wider">
            {title}
          </span>
        </div>

        {/* Center: Dotted pixel drag handles */}
        <div className="hidden sm:flex items-center gap-1 mx-2 flex-1 justify-center opacity-40 hover:opacity-80 transition-opacity">
          <div className="retro-drag-dots" />
        </div>

        {/* Right: Retro square [ - ] [ + ] [ x ] controls */}
        {showControls && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => handleControlClick(e, 'min')}
              className="retro-btn-box"
              title="Minimize"
              aria-label="Minimize window"
            >
              -
            </button>
            <button
              type="button"
              onClick={(e) => handleControlClick(e, 'max')}
              className="retro-btn-box"
              title={isMaximized ? 'Restore' : 'Maximize'}
              aria-label="Maximize window"
            >
              +
            </button>
            <button
              type="button"
              onClick={(e) => handleControlClick(e, 'close')}
              className="retro-btn-box hover:bg-[#FF2A85] hover:text-white"
              title="Close"
              aria-label="Close window"
            >
              x
            </button>
          </div>
        )}
      </div>

      {/* Window Body */}
      {!isMinimized && (
        <div className={`relative ${bodyClassName.includes('bg-') ? '' : 'bg-[var(--crt-phosphor-dark,#0D1512)]'} p-4 sm:p-5 ${bodyClassName}`}>
          {children}
        </div>
      )}

      {/* Optional 90s Status Bar */}
      {statusBar && !isMinimized && (
        <div className="flex items-center justify-between px-3 py-1 bg-[var(--crt-panel-slate,#131629)] border-t-2 border-[var(--crt-bezel-shadow,#2D3645)] text-[10px] font-mono text-[var(--text-secondary,#8E98AA)]">
          {statusBar}
        </div>
      )}
    </div>
  );
};

export default RetroWindow;
