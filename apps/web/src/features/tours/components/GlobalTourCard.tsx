'use client';

import React from 'react';
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles';
import { CardComponentProps } from 'nextstepjs';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

/**
 * Custom tour card component that inherits the organization styles.
 */
export const GlobalTourCard: React.FC<CardComponentProps> = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}) => {
  // Access organization styles
  const { styles } = useOrganizationStyles();
  
  // Define colors based on user dashboard configuration or fallbacks
  const theme = {
    background: styles?.userDashboard?.card_background || '#1E2329',
    text: styles?.userDashboard?.text_color || '#FFFFFF',
    primary: styles?.userDashboard?.primary_button_color || '#0A2540',
    accent: styles?.userDashboard?.accent_color || '#00D4B3',
    border: styles?.userDashboard?.border_color || 'rgba(255, 255, 255, 0.1)',
  };

  const isLastStep = currentStep === totalSteps - 1;

  // Remove manual offsets to rely on library adaptive positioning
  return (
    <div
      className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden w-[90vw] sm:w-[380px] max-w-sm max-h-[85vh] border-0 mx-2 sm:mx-0"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        boxShadow: `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border}`,
      }}
    >
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none"
        style={{ backgroundColor: theme.accent }}
      />

      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0 mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          {step.icon && (
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-xl text-xl shrink-0"
              style={{ 
                backgroundColor: `${theme.accent}20`,
                border: `1px solid ${theme.accent}30`
              }}
            >
              {typeof step.icon === 'string' ? step.icon : step.icon}
            </div>
          )}
          <h3 
            className="text-lg font-bold leading-tight"
            style={{ color: theme.text }}
          >
            {step.title}
          </h3>
        </div>
        
        {step.showSkip && (
          <button
            onClick={skipTour}
            className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
            style={{ color: `${theme.text}60` }}
            aria-label="Cerrar tour"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div 
        className="px-6 text-sm leading-relaxed opacity-90 prose prose-invert max-w-none overflow-y-auto custom-scrollbar"
        style={{ color: theme.text }}
      >
        {step.content}
      </div>

      {/* Footer / Controls */}
      <div className="flex items-center justify-between mt-auto p-6 pt-4 border-t shrink-0 relative z-10 bg-inherit" style={{ borderColor: theme.border }}>
        {/* Progress */}
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: `${theme.text}60` }}>
          <span>{currentStep + 1}</span>
          <span className="opacity-50">/</span>
          <span>{totalSteps}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
              style={{ 
                color: theme.text,
                border: `1px solid ${theme.border}`
              }}
            >
              <ChevronLeft size={16} />
              <span className="ml-1">Anterior</span>
            </button>
          )}

          <button
            onClick={nextStep}
            className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shadow-lg"
            style={{ 
              backgroundColor: theme.accent, 
              color: '#0A2540', // Always dark text on accent for contrast
              boxShadow: `0 4px 15px ${theme.accent}40`
            }}
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
        </div>
      </div>
      
      {/* Arrow element for pointing */}
      {arrow && (
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none font-sans">
             {arrow}
         </div>
      )}
    </div>
  );
};
