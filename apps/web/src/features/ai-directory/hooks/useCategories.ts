'use client'

import useSWR from 'swr'

interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ⚡ Fetcher optimizado para SWR
const categoriesFetcher = async (url: string): Promise<Category[]> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }

  const data = await response.json()
  return data.categories || []
}

export function useCategories(): UseCategoriesReturn {
  // ⚡ SWR con cache y deduplicación de 60s - categorías cambian raramente
  const { data: categories = [], error, isLoading, mutate } = useSWR<Category[]>(
    '/api/ai-directory/categories',
    categoriesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60s deduplication - categorías son muy estables
      refreshInterval: 0,
      shouldRetryOnError: false,
      fallbackData: [],
    }
  )

  return {
    categories,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}
