import type { ReactNode, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ClickableCardProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ClickableCard({ href, onClick, children, className = '', ariaLabel }: ClickableCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    if (href) navigate(href);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const isInteractive = !!onClick || !!href;

  return (
    <motion.div
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      className={`${isInteractive ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded-xl' : ''} ${className}`}
      whileHover={isInteractive ? { scale: 1.015, y: -2 } : undefined}
      whileTap={isInteractive ? { scale: 0.985 } : undefined}
    >
      {children}
    </motion.div>
  );
}
