import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import styles from './Container.module.css';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  size?: 'sm' | 'setting' | 'md' | 'lg' | 'full';
  display?: React.CSSProperties['display'];
  align?: React.CSSProperties['alignItems'] | 'center' | 'left' | 'right';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ asChild = false, size = 'lg', display, align, className, style, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    const classes = [
      styles.container,
      styles[`size_${size}`],
      className || '',
    ].filter(Boolean).join(' ');

    const combinedStyle: React.CSSProperties = {
      display: display,
      alignItems: display === 'flex' || display === 'inline-flex' ? (align as React.CSSProperties['alignItems']) : undefined,
      textAlign: (align === 'left' || align === 'center' || align === 'right') ? (align as React.CSSProperties['textAlign']) : undefined,
      ...style,
    };

    // Nếu align là center và không phải flex, ta dùng margin: auto (mặc định trong CSS của container)
    // Nhưng nếu muốn căn trái/phải cho toàn bộ container:
    if (align === 'left') {
      combinedStyle.marginLeft = '0';
      combinedStyle.marginRight = 'auto';
    } else if (align === 'right') {
      combinedStyle.marginLeft = 'auto';
      combinedStyle.marginRight = '0';
    } else if (align === 'center') {
      combinedStyle.marginLeft = 'auto';
      combinedStyle.marginRight = 'auto';
    }

    return (
      <Comp ref={ref} className={classes} style={combinedStyle} {...props}>
        {children}
      </Comp>
    );
  }
);

Container.displayName = 'Container';
