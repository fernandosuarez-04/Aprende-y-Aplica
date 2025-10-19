import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'rounded-xl border transition-all duration-500 ease-out transform-gpu relative overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'bg-surface border-border/20 text-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
        gradient: 'bg-gradient-to-r from-primary to-success border-primary/30 text-white shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden',
        glassmorphism: 'bg-surface/80 backdrop-blur-sm border-white/10 text-white hover:bg-surface/90 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-3 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md shadow-black/10',
        lg: 'shadow-lg shadow-black/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      shadow: 'sm',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  animate?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, shadow, animate = false, ...props }, ref) => {
    return (
      <div
        className={cn(
          cardVariants({ variant, padding, shadow }),
          animate && 'hover:scale-[1.03] hover:-translate-y-3',
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Efecto shimmer adicional para cards animadas */}
        {animate && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out opacity-0 group-hover:opacity-100" />
        )}
        
        {/* Contenido de la card */}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

// Sub-componentes para estructura semántica
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-300 leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };

