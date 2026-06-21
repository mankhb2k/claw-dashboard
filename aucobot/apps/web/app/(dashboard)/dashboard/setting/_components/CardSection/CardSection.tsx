import * as React from "react";

import styles from "./CardSection.module.css";

type CardSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardSection({ children, className = "", ...props }: CardSectionProps) {
  return (
    <div className={`${styles.card} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardRowProps extends React.HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
}

CardSection.Row = function CardRow({ children, className = "", noBorder, ...props }: CardRowProps) {
  return (
    <div className={`${styles.cardRow} ${noBorder ? styles.noBorder : ""} ${className}`} {...props}>
      {children}
    </div>
  );
};

type RowInfoProps = React.HTMLAttributes<HTMLDivElement>;

CardSection.Info = function RowInfo({ children, className = "", ...props }: RowInfoProps) {
  return (
    <div className={`${styles.rowInfo} ${className}`} {...props}>
      {children}
    </div>
  );
};

type RowActionProps = React.HTMLAttributes<HTMLDivElement>;

CardSection.Action = function RowAction({ children, className = "", ...props }: RowActionProps) {
  return (
    <div className={`${styles.rowAction} ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  flexClassName?: string;
}

CardSection.Footer = function CardFooter({ children, className = "", flexClassName = "", ...props }: CardFooterProps) {
  return (
    <div className={`${styles.cardFooter} ${className}`} {...props}>
      <div className={`${styles.footerFlex} ${flexClassName}`}>{children}</div>
    </div>
  );
};
