'use client';

import { useState, useEffect } from 'react';

interface QuestionnaireStatus {
  isGoogleOAuth: boolean;
  hasProfile: boolean;
  hasResponses: boolean;
  isCompleted: boolean;
  requiresQuestionnaire: boolean;
}

interface UseQuestionnaireValidationReturn {
  isRequired: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  status: QuestionnaireStatus | null;
  error: Error | null;
}

/**
 * Hook para validar el estado del cuestionario de un usuario
 * 
 * @param userId - ID del usuario a validar (opcional, se obtiene del servidor si no se proporciona)
 * @returns Estado del cuestionario y flags de validación
 */

export function useQuestionnaireValidation(userId?: string | null): UseQuestionnaireValidationReturn {
  return {
    isRequired: false,
    isCompleted: true,
    isLoading: false,
    status: {
      isGoogleOAuth: false, // irrelevant now
      hasProfile: true, // irrelevant now
      hasResponses: true, // irrelevant now
      isCompleted: true,
      requiresQuestionnaire: false,
    },
    error: null,
  };
}

