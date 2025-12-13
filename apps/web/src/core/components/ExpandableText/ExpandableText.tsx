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

// Función para formatear el texto preservando saltos de línea, listas y párrafos
function formatText(text: string): React.ReactNode {
  // Dividir el texto en líneas
  const lines = text.split('\n');
  const formattedElements: React.ReactNode[] = [];
  
  let currentList: string[] = [];
  let listType: 'ordered' | 'unordered' | null = null;
  
  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ordered') {
        formattedElements.push(
          <ol key={`list-${formattedElements.length}`} className="list-decimal list-inside space-y-1 my-2 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-gray-600 dark:text-slate-300">
                {item.trim()}
              </li>
            ))}
          </ol>
        );
      } else if (listType === 'unordered') {
        formattedElements.push(
          <ul key={`list-${formattedElements.length}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-gray-600 dark:text-slate-300">
                {item.trim()}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detectar listas numeradas (1., 2., etc.)
    const orderedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (orderedListMatch) {
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      currentList.push(orderedListMatch[2]);
      return;
    }
    
    // Detectar listas con viñetas (-, *, •)
    const unorderedListMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
    if (unorderedListMatch) {
      if (listType !== 'unordered') {
        flushList();
        listType = 'unordered';
      }
      currentList.push(unorderedListMatch[1]);
      return;
    }
    
    // Si no es una lista, cerrar cualquier lista pendiente
    flushList();
    
    // Si la línea está vacía, agregar un espacio
    if (trimmedLine === '') {
      formattedElements.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Detectar títulos/secciones (líneas que terminan con :)
    if (trimmedLine.endsWith(':')) {
      formattedElements.push(
        <p key={`p-${index}`} className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">
          {trimmedLine}
        </p>
      );
      return;
    }
    
    // Párrafo normal
    formattedElements.push(
      <p key={`p-${index}`} className="text-gray-600 dark:text-slate-300 mb-2">
        {trimmedLine}
      </p>
    );
  });
  
  // Cerrar cualquier lista pendiente al final
  flushList();
  
  return <div className="space-y-1">{formattedElements}</div>;
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
      <div className={`text-gray-600 dark:text-slate-300 leading-relaxed ${className}`}>
        {formatText(text)}
      </div>
    );
  }

  return (
    <div className={className}>
      {isExpanded ? (
        <div className="text-gray-600 dark:text-slate-300 leading-relaxed">
          {formatText(text)}
        </div>
      ) : (
        <div
          className="text-gray-600 dark:text-slate-300 leading-relaxed overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out
          bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 
          dark:from-primary/20 dark:via-primary/10 dark:to-primary/20
          border border-primary/20 dark:border-primary/30
          text-primary dark:text-primary-400
          hover:from-primary/20 hover:via-primary/10 hover:to-primary/20
          dark:hover:from-primary/30 dark:hover:from-primary/20 dark:hover:to-primary/30
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
