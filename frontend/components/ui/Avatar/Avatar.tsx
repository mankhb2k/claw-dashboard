import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import styles from './Avatar.module.css';

export interface AvatarProps extends AvatarPrimitive.AvatarProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', variant = 'circle', className, ...props }, ref) => {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={`${styles.root} ${styles[size]} ${styles[variant]} ${className || ''}`}
        {...props}
      >
        {src && (
          <AvatarPrimitive.Image
            className={styles.image}
            src={src}
            alt={alt}
          />
        )}
        <AvatarPrimitive.Fallback
          className={styles.fallback}
          delayMs={600}
        >
          {fallback}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }
);
Avatar.displayName = 'Avatar';
