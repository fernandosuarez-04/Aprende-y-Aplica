'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
}

export function ExpandableText({
  text,
  maxLines = 2,
  className = '',
  showMoreText = 'Ver más',
  showLessText = 'Ver menos',
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Verificar si el texto necesita truncamiento
  // Usamos una aproximación: si el texto tiene más de ~150 caracteres, probablemente necesite truncamiento
  const needsTruncation = text.length > 150;

  if (!needsTruncation) {
    return (
      <p className={`text-gray-600 dark:text-slate-300 leading-relaxed ${className}`}>
        {text}
      </p>
    );
  }

  return (
    <div className={className}>
      <div
        className="text-gray-600 dark:text-slate-300 leading-relaxed overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitLineClamp: isExpanded ? 'none' : maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: isExpanded ? 'visible' : 'hidden',
          textOverflow: isExpanded ? 'clip' : 'ellipsis',
        }}
      >
        {text}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out
          bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 
          dark:from-primary/20 dark:via-primary/10 dark:to-primary/20
          border border-primary/20 dark:border-primary/30
          text-primary dark:text-primary-400
          hover:from-primary/20 hover:via-primary/10 hover:to-primary/20
          dark:hover:from-primary/30 dark:hover:via-primary/20 dark:hover:to-primary/30
          hover:border-primary/40 dark:hover:border-primary/50
          hover:shadow-md hover:shadow-primary/10 dark:hover:shadow-primary/20
          hover:scale-[1.02] active:scale-[0.98]
          backdrop-blur-sm overflow-hidden"
      >
        {/* Efecto de brillo sutil en hover */}
        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
        
        <span className="relative z-10 flex items-center gap-1.5">
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span>{showLessText}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              <span>{showMoreText}</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

