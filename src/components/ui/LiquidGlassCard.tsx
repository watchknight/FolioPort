import React, { useRef, useState, useCallback } from 'react';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  spotlightColor?: 'cyan' | 'amber' | 'magenta' | 'multi';
  spotlightRadius?: number;
  spotlightOpacity?: number;
  highlightBorderOnHover?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  title,
  spotlightColor = 'cyan',
  spotlightRadius = 450,
  spotlightOpacity = 0.12,
  highlightBorderOnHover = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const getSpotlightGradient = () => {
    let colorRgba = '0, 240, 255'; // #00F0FF (Tech Cyan Wave)
    if (spotlightColor === 'amber') {
      colorRgba = '255, 204, 0'; // #FFCC00 (Pixel Amber Gold)
    } else if (spotlightColor === 'magenta') {
      colorRgba = '255, 42, 133'; // #FF2A85 (Tech Magenta Crest)
    } else if (spotlightColor === 'multi') {
      return `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(0, 240, 255, ${spotlightOpacity}), rgba(255, 42, 133, ${spotlightOpacity * 0.6}) 50%, transparent 80%)`;
    }

    return `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(${colorRgba}, ${spotlightOpacity}), transparent 75%)`;
  };

  const borderColorClass = spotlightColor === 'amber'
    ? 'border-[#FFCC00]/50 hover:border-[#FFCC00]'
    : spotlightColor === 'magenta'
    ? 'border-[#FF2A85]/50 hover:border-[#FF2A85]'
    : 'border-[#2D3645] hover:border-[#00F0FF]';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden bg-[#131629] border-2 ${borderColorClass} shadow-[2px_2px_0_0_#070814] transition-all duration-200 ease-out ${
        isHovered ? 'shadow-[0_0_20px_rgba(0,240,255,0.2),2px_2px_0_0_#070814] -translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {/* 90s Retro Window Top Accent Strip if title provided */}
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D1512] border-b-2 border-[#2D3645] text-xs font-pixel text-[#00F0FF] select-none">
          <span className="truncate">{title}</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#D6CFC2] border border-[#2D3645] text-[7px] text-black flex items-center justify-center">-</span>
            <span className="w-2.5 h-2.5 bg-[#D6CFC2] border border-[#2D3645] text-[7px] text-black flex items-center justify-center">+</span>
            <span className="w-2.5 h-2.5 bg-[#D6CFC2] border border-[#2D3645] text-[7px] text-black flex items-center justify-center">x</span>
          </div>
        </div>
      )}

      {/* Dynamic mouse-tracking radial spotlight shader */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: getSpotlightGradient(),
        }}
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
