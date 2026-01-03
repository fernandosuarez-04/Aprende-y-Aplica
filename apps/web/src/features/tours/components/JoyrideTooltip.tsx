'use client';

import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

/**
 * Custom Joyride tooltip component with responsive light/dark mode styling.
 */
export const JoyrideTooltip: React.FC<TooltipRenderProps> = ({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  tooltipProps,
  size,
}) => {
  return (
    <div
      ref={tooltipProps.ref as React.RefCallback<HTMLDivElement>}
      role={tooltipProps.role}
      aria-modal={tooltipProps['aria-modal']}
      className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden w-[90vw] sm:w-[380px] max-w-sm max-h-[85vh] border-0 bg-white dark:bg-[#1E2329] text-gray-900 dark:text-white"
      style={{
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none bg-[#00D4B3]"
      />

      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0 mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl text-xl shrink-0 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30"
          >
            <span className="text-[#00D4B3]">✨</span>
          </div>
          <h3 
            className="text-lg font-bold leading-tight text-gray-900 dark:text-white"
          >
            {step.title}
          </h3>
        </div>
        
        <button
          {...closeProps}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 text-gray-400 dark:text-gray-500"
          aria-label="Cerrar tour"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="px-6 text-sm leading-relaxed opacity-90 prose prose-slate dark:prose-invert max-w-none overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-300"
      >
        {step.content}
      </div>

      {/* Footer / Controls */}
      <div 
        className="flex items-center justify-between mt-auto p-6 pt-4 border-t shrink-0 relative z-10 bg-inherit border-gray-100 dark:border-white/10" 
      >
        {/* Progress */}
        <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
          <span>{index + 1}</span>
          <span className="opacity-50">/</span>
          <span>{size}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white"
            >
              <ChevronLeft size={16} />
              <span className="ml-1">Anterior</span>
            </button>
          )}

          {continuous && (
            <button
              {...primaryProps}
              className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shadow-lg bg-[#00D4B3] text-[#0A2540] shadow-[#00D4B3]/40"
            >
              {isLastStep ? (
                <>
                  <CheckCircle size={16} className="mr-1.5" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
