import { useState, useEffect, useCallback } from 'react'
import { AdminSkillsService, AdminSkill, CreateSkillData, UpdateSkillData } from '../services/adminSkills.service'

export function useAdminSkills() {
  const [skills, setSkills] = useState<AdminSkill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSkills = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedSkills = await AdminSkillsService.getSkills()
      setSkills(fetchedSkills)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skills')
      console.error('Error fetching skills:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const createSkill = async (skillData: CreateSkillData): Promise<AdminSkill> => {
    try {
      const newSkill = await AdminSkillsService.createSkill(skillData)
      await fetchSkills()
      return newSkill
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear skill'
      setError(errorMessage)
      throw err
    }
  }

  const updateSkill = async (skillId: string, skillData: UpdateSkillData): Promise<AdminSkill> => {
    try {
      const updatedSkill = await AdminSkillsService.updateSkill(skillId, skillData)
      await fetchSkills()
      return updatedSkill
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar skill'
      setError(errorMessage)
      throw err
    }
  }

  const deleteSkill = async (skillId: string): Promise<void> => {
    try {
      await AdminSkillsService.deleteSkill(skillId)
      await fetchSkills()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar skill'
      setError(errorMessage)
      throw err
    }
  }

  return {
    skills,
    isLoading,
    error,
    refetch: fetchSkills,
    createSkill,
    updateSkill,
    deleteSkill
  }
}

