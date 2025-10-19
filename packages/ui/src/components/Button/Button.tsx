import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden transform-gpu group',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-primary via-primary to-blue-600 text-white shadow-lg shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
        secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:border-primary hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] before:absolute before:inset-0 before:bg-primary before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 before:-z-10',
        tertiary: 'text-primary hover:text-blue-600 hover:scale-105 transition-all duration-300 hover:bg-primary/5 px-4 py-2 rounded-lg',
        ghost: 'border border-primary/20 text-primary bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-white hover:scale-[1.02] hover:-translate-y-0.5 backdrop-blur-sm',
        gradient: 'bg-gradient-to-r from-primary via-blue-600 to-primary text-white shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/60 hover:scale-[1.02] hover:-translate-y-1 hover:from-blue-600 hover:via-primary hover:to-blue-700 active:scale-[0.98]',
        destructive: 'bg-gradient-to-r from-error to-red-600 text-white shadow-lg shadow-error/30 hover:shadow-xl hover:shadow-error/50 hover:scale-[1.02] hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-10 px-4 text-sm min-w-[80px]',
        md: 'h-12 px-6 text-base min-w-[120px]',
        lg: 'h-14 px-8 text-lg min-w-[140px]',
        icon: 'h-11 w-11 rounded-xl',
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
        style={{
          ...props.style,
        }}
      >
        {/* Efecto de brillo */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        
        {/* Contenido del botón */}
        <span className="relative z-10 flex items-center gap-2">
          {props.children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
