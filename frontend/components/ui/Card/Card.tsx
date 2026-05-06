import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component - Một wrapper cơ bản có border và hiệu ứng hover shadow.
 * Tuân thủ quy tắc Design System trong .agent/rule.md
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`${styles.card} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
