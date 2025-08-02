import React, { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  loading?: boolean;
}

const Card = ({ 
  children, 
  className, 
  variant = 'default', 
  size = 'md',
  hover = false,
  loading = false,
  ...props 
}: CardProps) => {
  const baseClasses = 'rounded-lg border transition-all duration-200 relative';
  
  const variantClasses = {
    default: 'bg-white border-slate-200 shadow-sm',
    outline: 'bg-transparent border-slate-200',
    ghost: 'bg-transparent border-transparent',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverClasses = hover ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : '';
  const loadingClasses = loading ? 'opacity-60 pointer-events-none' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        hoverClasses,
        loadingClasses,
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
        </div>
      )}
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div 
      className={cn('mb-4 pb-3 border-b border-slate-100', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = ({ children, className, level = 3, ...props }: CardTitleProps) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  const levelClasses = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-semibold',
    3: 'text-lg font-semibold',
    4: 'text-base font-semibold',
    5: 'text-sm font-semibold',
    6: 'text-xs font-semibold',
  };

  return (
    <Tag 
      className={cn('text-slate-900', levelClasses[level], className)} 
      {...props}
    >
      {children}
    </Tag>
  );
};

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

const CardDescription = ({ children, className, ...props }: CardDescriptionProps) => {
  return (
    <p 
      className={cn('text-sm text-slate-600 mt-1', className)} 
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div 
      className={cn('mt-4 pt-3 border-t border-slate-100', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

// Compound component exports
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;