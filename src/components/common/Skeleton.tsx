import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = 'md',
  ...props
}) => {
  const roundedClasses = {
    sm: 'rounded-xs',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-slate-200/80 animate-pulse',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
};
