import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  hover?: 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  disableHover?: boolean;
}

/**
 * Card — bordered wrapper with hover shadow.
 * Follows the design system in .agent/rule.md
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  width,
  height,
  hover,
  radius = 'lg',
  disableHover,
  style,
  ...props 
}) => {
  const combinedStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${styles.card} ${className}`} 
      style={combinedStyle}
      data-hover={hover}
      data-radius={radius}
      data-disable-hover={disableHover}
      {...props}
    >
      {children}
    </div>
  );
};
