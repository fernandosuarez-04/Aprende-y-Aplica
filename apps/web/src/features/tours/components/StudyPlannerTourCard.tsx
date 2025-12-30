'use client';

import React from 'react';
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles';
import { CardComponentProps } from 'nextstepjs';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

/**
 * Custom tour card component specifically for Study Planner to ensure dashboard-like aesthetics.
 * Forces a dark, neutral background instead of organization-specific card backgrounds if they are too blue.
 */
export const StudyPlannerTourCard: React.FC<CardComponentProps> = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}) => {
  // Access organization styles just for accent colors
  const { styles } = useOrganizationStyles();
  
  // Hardcoded dashboard-like theme for consistency in Study Planner
  const theme = {
    // Force a neutral dark background similar to the dashboard container
    background: '#1E2329', // Dark gunmetal/gray, matching LIA components
    text: '#FFFFFF',
    primary: '#0A2540',
    accent: styles?.userDashboard?.accent_color || '#00D4B3', // Keep the aqua accent
    border: 'rgba(255, 255, 255, 0.1)',
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden max-w-sm w-[380px] max-h-[85vh] border-0 font-sans"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        boxShadow: `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border}`,
      }}
    >
      {/* Background decoration - simplified and less intrusive */}
      <div 
        className="absolute top-0 right-0 w-40 h-40 opacity-5 rounded-bl-[100px] pointer-events-none"
        style={{ backgroundColor: theme.accent }}
      />

      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0 mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          {step.icon && (
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-2xl text-xl shrink-0 backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${theme.border}`
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
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
            style={{ color: `${theme.text}60` }}
            aria-label="Cerrar tour"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div 
        className="px-6 text-[15px] leading-relaxed opacity-90 prose prose-invert max-w-none overflow-y-auto custom-scrollbar"
        style={{ color: '#E9ECEF' }} // High contrast text
      >
        {step.content}
      </div>

      {/* Footer / Controls */}
      <div className="flex items-center justify-between mt-auto p-6 pt-5 border-t shrink-0 relative z-10 bg-inherit" style={{ borderColor: theme.border }}>
        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, idx) => (
             <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6' : 'w-1.5'}`}
                style={{ 
                    backgroundColor: idx === currentStep ? theme.accent : 'rgba(255,255,255,0.2)'
                }}
             />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ 
                color: theme.text,
                border: `1px solid ${theme.border}`
              }}
            >
              Anterior
            </button>
          )}

          <button
            onClick={nextStep}
            className="flex items-center justify-center px-5 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 shadow-lg"
            style={{ 
              backgroundColor: theme.accent, 
              color: '#0A2540',
              boxShadow: `0 4px 20px ${theme.accent}30`
            }}
          >
            {isLastStep ? (
              <span className="flex items-center">
                Finalizar
                <CheckCircle size={16} className="ml-2" />
              </span>
            ) : (
              <span className="flex items-center">
                Siguiente
                <ChevronRight size={16} className="ml-1" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
