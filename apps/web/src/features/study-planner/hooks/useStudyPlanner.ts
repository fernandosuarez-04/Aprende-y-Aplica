'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import type {
  StudyPlan,
  StudySession,
  StudyPreferences,
  LearningMetrics,
  StudyHabitStats,
} from '@repo/shared/types';

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Error fetching data');
  }
  const data = await response.json();
  return data.success ? data.data : null;
};

export function useStudyPlanner() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Fetch plans
  const {
    data: plans,
    error: plansError,
    isLoading: plansLoading,
    mutate: mutatePlans,
  } = useSWR<StudyPlan[]>('/api/study-planner/plans', fetcher);

  // Fetch preferences
  const {
    data: preferences,
    error: preferencesError,
    isLoading: preferencesLoading,
    mutate: mutatePreferences,
  } = useSWR<StudyPreferences | null>('/api/study-planner/preferences', fetcher);

  // Fetch sessions
  const {
    data: sessions,
    error: sessionsError,
    isLoading: sessionsLoading,
    mutate: mutateSessions,
  } = useSWR<StudySession[]>(
    selectedPlanId
      ? `/api/study-planner/sessions?planId=${selectedPlanId}`
      : '/api/study-planner/sessions',
    fetcher
  );

  // Fetch metrics
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
    mutate: mutateMetrics,
  } = useSWR<LearningMetrics>('/api/study-planner/metrics?type=learning', fetcher);

  // Fetch habit stats
  const {
    data: habitStats,
    error: habitStatsError,
    isLoading: habitStatsLoading,
    mutate: mutateHabitStats,
  } = useSWR<StudyHabitStats>('/api/study-planner/metrics?type=habits', fetcher);

  const createPlan = useCallback(async (planData: Partial<StudyPlan>) => {
    const response = await fetch('/api/study-planner/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      throw new Error('Error creating plan');
    }

    await mutatePlans();
    return response.json();
  }, [mutatePlans]);

  const updatePlan = useCallback(async (planId: string, updates: Partial<StudyPlan>) => {
    const response = await fetch(`/api/study-planner/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Error updating plan');
    }

    await mutatePlans();
    return response.json();
  }, [mutatePlans]);

  const deletePlan = useCallback(async (planId: string) => {
    const response = await fetch(`/api/study-planner/plans/${planId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error deleting plan');
    }

    await mutatePlans();
  }, [mutatePlans]);

  const createSession = useCallback(async (sessionData: Partial<StudySession>) => {
    const response = await fetch('/api/study-planner/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error('Error creating session');
    }

    await mutateSessions();
    await mutateMetrics();
    return response.json();
  }, [mutateSessions, mutateMetrics]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<StudySession>) => {
    const response = await fetch(`/api/study-planner/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Error updating session');
    }

    await mutateSessions();
    await mutateMetrics();
    await mutateHabitStats();
    return response.json();
  }, [mutateSessions, mutateMetrics, mutateHabitStats]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const response = await fetch(`/api/study-planner/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error deleting session');
    }

    await mutateSessions();
    await mutateMetrics();
  }, [mutateSessions, mutateMetrics]);

  const updatePreferences = useCallback(async (preferencesData: Partial<StudyPreferences>) => {
    const response = await fetch('/api/study-planner/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(preferencesData),
    });

    if (!response.ok) {
      throw new Error('Error updating preferences');
    }

    const result = await response.json();
    
    // Esperar un momento para que el backend termine de generar las sesiones
    // antes de refrescar los datos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refrescar preferencias y sesiones (ya que se generan nuevas sesiones automáticamente)
    console.log('[FRONTEND] Refreshing sessions after preferences update...');
    await Promise.all([
      mutatePreferences(),
      mutateSessions(),
      mutateMetrics(),
      mutateHabitStats(),
    ]);
    console.log('[FRONTEND] Sessions refreshed successfully');
    
    return result;
  }, [mutatePreferences, mutateSessions, mutateMetrics, mutateHabitStats]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      mutatePlans(),
      mutatePreferences(),
      mutateSessions(),
      mutateMetrics(),
      mutateHabitStats(),
    ]);
  }, [mutatePlans, mutatePreferences, mutateSessions, mutateMetrics, mutateHabitStats]);

  /**
   * Elimina todas las sesiones generadas automáticamente
   */
  const deleteAutoGeneratedSessions = useCallback(async () => {
    const response = await fetch('/api/study-planner/sessions/bulk', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error eliminando sesiones generadas automáticamente');
    }

    const result = await response.json();
    
    // Refrescar datos después de eliminar
    await Promise.all([
      mutateSessions(),
      mutateMetrics(),
      mutateHabitStats(),
    ]);

    return result.data;
  }, [mutateSessions, mutateMetrics, mutateHabitStats]);

  /**
   * Regenera todas las sesiones basadas en las preferencias actuales
   */
  const regenerateSessions = useCallback(async () => {
    const response = await fetch('/api/study-planner/sessions/bulk/regenerate', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error regenerando sesiones');
    }

    const result = await response.json();
    
    // Esperar un momento para que el backend termine
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refrescar datos después de regenerar
    await Promise.all([
      mutateSessions(),
      mutateMetrics(),
      mutateHabitStats(),
    ]);

    return result.data;
  }, [mutateSessions, mutateMetrics, mutateHabitStats]);

  return {
    // Data
    plans: plans || [],
    preferences,
    sessions: sessions || [],
    metrics,
    habitStats,

    // Loading states
    plansLoading,
    preferencesLoading,
    sessionsLoading,
    metricsLoading,
    habitStatsLoading,
    isLoading:
      plansLoading || preferencesLoading || sessionsLoading || metricsLoading || habitStatsLoading,

    // Errors
    plansError,
    preferencesError,
    sessionsError,
    metricsError,
    habitStatsError,

    // Actions
    createPlan,
    updatePlan,
    deletePlan,
    createSession,
    updateSession,
    deleteSession,
    updatePreferences,
    refreshAll,
    deleteAutoGeneratedSessions,
    regenerateSessions,

    // Selection
    selectedPlanId,
    setSelectedPlanId,
  };
}

