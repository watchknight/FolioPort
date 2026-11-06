import React from 'react';
import { Magnetic } from './Magnetic';
export { Magnetic } from './Magnetic';

export interface MagneticButtonProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  innerStrength?: number;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  strength = 0.35,
  innerStrength = 0.15,
  as,
  href,
  target,
  rel,
  disabled,
  type = 'button',
  onClick,
  ...props
}) => {
  const isAnchor = as === 'a' || Boolean(href);
  const componentTag = isAnchor ? 'a' : 'button';

  return (
    <Magnetic
      as={componentTag}
      href={href}
      target={target}
      rel={rel}
      disabled={disabled}
      type={!isAnchor ? type : undefined}
      strength={strength}
      textStrength={innerStrength}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Magnetic>
  );
};

export default MagneticButton;
