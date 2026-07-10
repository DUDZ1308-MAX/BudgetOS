import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label: string;
}

export function AccessibleIcon({ children, label }: Props) {
  return (
    <span role="img" aria-label={label}>
      {children}
    </span>
  );
}
