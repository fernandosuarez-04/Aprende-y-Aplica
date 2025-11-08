import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

export interface PurchaseHistoryItem {
  id: string;
  type: 'course' | 'subscription';
  title: string;
  description?: string;
  thumbnail_url?: string | null;
  slug?: string;
  price: string;
  currency: string;
  purchased_at: string;
  status: string;
  transaction_status?: string;
  expires_at?: string | null;
  course_id?: string;
  // Campos específicos de suscripción
  subscription_type?: string;
  subscription_status?: string;
  start_date?: string;
  end_date?: string | null;
  next_billing_date?: string | null;
}

export interface PurchaseHistoryData {
  purchases: PurchaseHistoryItem[];
  total: number;
  courses: number;
  subscriptions: number;
}

interface UsePurchaseHistoryReturn {
  purchases: PurchaseHistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  total: number;
  coursesCount: number;
  subscriptionsCount: number;
}

export function usePurchaseHistory(): UsePurchaseHistoryReturn {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const { user } = useAuth();

  const fetchPurchaseHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/purchase-history');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: PurchaseHistoryData = await response.json();
      setPurchases(data.purchases || []);
      setTotal(data.total || 0);
      setCoursesCount(data.courses || 0);
      setSubscriptionsCount(data.subscriptions || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      // console.error('Error fetching purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchaseHistory,
    total,
    coursesCount,
    subscriptionsCount,
  };
}

