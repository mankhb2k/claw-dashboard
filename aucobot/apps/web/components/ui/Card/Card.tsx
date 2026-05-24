import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  hover?: 'sm' | 'md' | 'lg' | 'xl';
  disableHover?: boolean;
}

/**
 * Card component - Một wrapper cơ bản có border và hiệu ứng hover shadow.
 * Tuân thủ quy tắc Design System trong .agent/rule.md
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  width,
  height,
  hover,
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
      data-disable-hover={disableHover}
      {...props}
    >
      {children}
    </div>
  );
};
