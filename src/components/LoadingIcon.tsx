import { Loader2 } from 'lucide-react';

interface LoadingIconProps {
  size?: number;
  className?: string;
}

export function LoadingIcon({ size = 16, className = '' }: LoadingIconProps) {
  return (
    <Loader2 
      size={size} 
      className={`animate-spin ${className}`}
    />
  );
}