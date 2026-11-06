import React, { useRef, useState, useCallback } from 'react';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: 'cyan' | 'amber' | 'multi';
  spotlightRadius?: number;
  spotlightOpacity?: number;
  highlightBorderOnHover?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  spotlightColor = 'cyan',
  spotlightRadius = 450,
  spotlightOpacity = 0.12,
  highlightBorderOnHover = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Directly update CSS custom properties on mousemove: 0 React re-renders, 120 FPS GPU performance
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
    let colorRgba = '223, 108, 79'; // burnt coral #DF6C4F default
    if (spotlightColor === 'amber') {
      colorRgba = '167, 64, 36'; // terracotta rust #A74024
    } else if (spotlightColor === 'multi') {
      return `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(223, 108, 79, ${spotlightOpacity}), rgba(167, 64, 36, ${spotlightOpacity * 0.5}) 50%, transparent 80%)`;
    }

    return `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(${colorRgba}, ${spotlightOpacity}), transparent 75%)`;
  };

  const getBorderGradient = () => {
    if (!highlightBorderOnHover) return '';
    const accentColor = spotlightColor === 'amber' ? 'rgba(167, 64, 36, 0.45)' : 'rgba(223, 108, 79, 0.45)';
    return `radial-gradient(280px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${accentColor}, rgba(255, 255, 255, 0.08) 60%, transparent 100%)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl bg-carbon/65 backdrop-blur-xl transition-all duration-300 ease-out ${
        isHovered ? 'shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)] -translate-y-0.5' : 'shadow-[0_16px_36px_-12px_rgba(0,0,0,0.7)]'
      } ${className}`}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      {...props}
    >
      {/* Dynamic mouse-tracking border illumination */}
      {highlightBorderOnHover && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: getBorderGradient(),
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: '1px',
          }}
          aria-hidden="true"
        />
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

      {/* Subtle top inner edge highlight for optical glass realism */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
