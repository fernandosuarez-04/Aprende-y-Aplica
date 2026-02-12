'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { PersonalPlan, PersonalPlanId, BillingCycle, UserSubscription } from '../types/subscription.types';
import { PersonalSubscriptionService } from '../services/personal-subscription.service';

interface UsePersonalSubscriptionsReturn {
  plans: PersonalPlan[];
  currentSubscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  subscribe: (planId: PersonalPlanId, billingCycle: BillingCycle) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  getPlanById: (planId: PersonalPlanId) => PersonalPlan | undefined;
  hasActiveSubscription: boolean;
  refreshSubscription: () => Promise<void>;
}

export function usePersonalSubscriptions(): UsePersonalSubscriptionsReturn {
  const [plans] = useState<PersonalPlan[]>(PersonalSubscriptionService.getPersonalPlans());
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCurrentSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/personal/current');

      if (!response.ok) {
        if (response.status === 404) {
          // Usuario no tiene suscripción activa
          setCurrentSubscription(null);
          setLoading(false);
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentSubscription(data.subscription || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const subscribe = async (planId: PersonalPlanId, billingCycle: BillingCycle) => {
    if (!user) {
      throw new Error('Debes estar autenticado para suscribirte');
    }

    try {
      setError(null);
      const response = await fetch('/api/subscriptions/personal/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentSubscription(data.subscription);
      
      // TODO: Redirigir a página de pago o mostrar mensaje de éxito
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscription) {
      throw new Error('No hay suscripción activa para cancelar');
    }

    try {
      setError(null);
      const response = await fetch(`/api/subscriptions/personal/${currentSubscription.id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentSubscription(data.subscription);
      
      // TODO: Mostrar mensaje de éxito
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    }
  };

  const getPlanById = (planId: PersonalPlanId): PersonalPlan | undefined => {
    return PersonalSubscriptionService.getPlanById(planId);
  };

  const hasActiveSubscription = currentSubscription?.status === 'active';

  return {
    plans,
    currentSubscription,
    loading,
    error,
    subscribe,
    cancelSubscription,
    getPlanById,
    hasActiveSubscription,
    refreshSubscription: fetchCurrentSubscription,
  };
}

