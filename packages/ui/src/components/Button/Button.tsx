import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5',
        secondary: 'border-2 border-primary text-primary hover:bg-primary/10 hover:border-primary-500',
        tertiary: 'text-primary hover:underline hover:opacity-80',
        ghost: 'border border-primary text-primary bg-transparent hover:bg-primary/10 hover:border-primary/50 hover:text-white',
        gradient: 'bg-gradient-to-r from-primary to-success text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 hover:from-primary/90 hover:to-success/90',
        destructive: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
