export interface AdminSkill {
  skill_id: string
  name: string
  slug: string
  description?: string
  category: string
  icon_url?: string
  icon_type?: string
  icon_name?: string
  color?: string
  level?: string
  is_active: boolean
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface CreateSkillData {
  name: string
  slug: string
  description?: string
  category?: string
  icon_url?: string
  icon_type?: string
  icon_name?: string
  color?: string
  level?: string
  is_active?: boolean
  is_featured?: boolean
  display_order?: number
}

export interface UpdateSkillData extends Partial<CreateSkillData> {}

export class AdminSkillsService {
  static async getSkills(): Promise<AdminSkill[]> {
    const response = await fetch('/api/admin/skills', {
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al obtener skills' }))
      throw new Error(errorData.error || 'Error al obtener skills')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener skills')
    }

    return data.skills || []
  }

  static async getSkill(skillId: string): Promise<AdminSkill> {
    const response = await fetch(`/api/admin/skills/${skillId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al obtener skill' }))
      throw new Error(errorData.error || 'Error al obtener skill')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener skill')
    }

    return data.skill
  }

  static async createSkill(skillData: CreateSkillData): Promise<AdminSkill> {
    const response = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(skillData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al crear skill' }))
      throw new Error(errorData.error || 'Error al crear skill')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al crear skill')
    }

    return data.skill
  }

  static async updateSkill(skillId: string, skillData: UpdateSkillData): Promise<AdminSkill> {
    const response = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(skillData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al actualizar skill' }))
      throw new Error(errorData.error || 'Error al actualizar skill')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar skill')
    }

    return data.skill
  }

  static async deleteSkill(skillId: string): Promise<void> {
    const response = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al eliminar skill' }))
      throw new Error(errorData.error || 'Error al eliminar skill')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al eliminar skill')
    }
  }
}

