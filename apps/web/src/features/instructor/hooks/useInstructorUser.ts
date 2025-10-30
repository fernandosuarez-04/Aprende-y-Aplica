'use client'

import { useAuth } from '../../auth/hooks/useAuth'

interface UseInstructorUserResult {
  user: ReturnType<typeof useAuth>['user']
  isLoading: boolean
}

export function useInstructorUser(): UseInstructorUserResult {
  const { user, isLoading } = useAuth()
  return { user, isLoading }
}

export default useInstructorUser


