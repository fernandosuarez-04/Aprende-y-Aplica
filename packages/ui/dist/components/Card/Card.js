import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
const cardVariants = cva('rounded-xl border transition-all duration-500 ease-out transform-gpu relative overflow-hidden group', {
    variants: {
        variant: {
            default: 'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
            gradient: 'bg-gradient-to-r from-primary to-success border-primary/30 text-white shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden',
            glassmorphism: 'backdrop-blur-sm hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-3 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
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
});
const Card = React.forwardRef(({ className, variant, padding, shadow, animate = false, ...props }, ref) => {
    const getCardStyle = () => {
        switch (variant) {
            case 'glassmorphism':
                return {
                    backgroundColor: 'var(--glass-strong)',
                    borderColor: 'var(--glass-light)',
                    color: 'var(--color-contrast)',
                };
            case 'gradient':
                return {};
            default:
                return {
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--color-contrast)',
                };
        }
    };
    return (_jsxs("div", { className: cn(cardVariants({ variant, padding, shadow }), animate && 'hover:scale-[1.03] hover:-translate-y-3', className), style: getCardStyle(), ref: ref, ...props, children: [animate && (_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out opacity-0 group-hover:opacity-100" })), _jsx("div", { className: "relative z-10", children: props.children })] }));
});
Card.displayName = 'Card';
// Sub-componentes para estructura semántica
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 pb-4', className), ...props })));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, style, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn('text-xl font-semibold leading-none tracking-tight', className), style: { color: 'var(--color-contrast)', ...style }, ...props })));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, style, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm leading-relaxed', className), style: { color: 'var(--text-secondary)', ...style }, ...props })));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('pt-0', className), ...props })));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex items-center pt-4', className), ...props })));
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
//# sourceMappingURL=Card.js.map