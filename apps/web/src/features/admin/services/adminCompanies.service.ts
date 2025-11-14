import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface AdminCompany {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  is_active: boolean
  max_users: number | null
  total_users: number
  active_users: number
  invited_users: number
  suspended_users: number
  created_at: string
  updated_at: string
}

export interface CompanyStats {
  totalCompanies: number
  activeCompanies: number
  trialCompanies: number
  pausedCompanies: number
  totalSeats: number
  usedSeats: number
  averageUtilization: number
}

export interface CompanyUpdatePayload {
  is_active?: boolean
  subscription_status?: string
  subscription_plan?: string
  max_users?: number
}

interface OrganizationRow {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  is_active: boolean
  max_users: number | null
  created_at: string
  updated_at: string
  organization_users?: Array<{
    status?: string | null
  }> | null
}

export class AdminCompaniesService {
  private static mapOrganization(row: OrganizationRow): AdminCompany {
    const members = row.organization_users || []
    const totalUsers = members.length
    const activeUsers = members.filter(member => member.status === 'active').length
    const invitedUsers = members.filter(member => member.status === 'invited').length
    const suspendedUsers = members.filter(member => member.status === 'suspended').length

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logo_url: row.logo_url,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      website_url: row.website_url,
      subscription_plan: row.subscription_plan,
      subscription_status: row.subscription_status,
      is_active: row.is_active,
      max_users: row.max_users,
      total_users: totalUsers,
      active_users: activeUsers,
      invited_users: invitedUsers,
      suspended_users: suspendedUsers,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  static async getCompanies(): Promise<AdminCompany[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        logo_url,
        contact_email,
        contact_phone,
        website_url,
        subscription_plan,
        subscription_status,
        is_active,
        max_users,
        created_at,
        updated_at,
        organization_users (
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching organizations:', error)
      throw error
    }

    return ((data as OrganizationRow[] | null) ?? []).map(org => this.mapOrganization(org))
  }

  static calculateStats(companies: AdminCompany[]): CompanyStats {
    const stats = companies.reduce(
      (acc, company) => {
        acc.totalCompanies += 1
        if (company.is_active) acc.activeCompanies += 1
        else acc.pausedCompanies += 1

        if (
          (company.subscription_status && company.subscription_status.toLowerCase() === 'trial') ||
          (company.subscription_plan && company.subscription_plan.toLowerCase() === 'trial')
        ) {
          acc.trialCompanies += 1
        }

        acc.totalSeats += company.max_users || 0
        acc.usedSeats += company.active_users
        return acc
      },
      {
        totalCompanies: 0,
        activeCompanies: 0,
        trialCompanies: 0,
        pausedCompanies: 0,
        totalSeats: 0,
        usedSeats: 0
      }
    )

    const averageUtilization =
      stats.totalCompanies > 0 ? Math.round((stats.usedSeats / Math.max(stats.totalSeats, 1)) * 100) : 0

    return {
      ...stats,
      averageUtilization
    }
  }

  static async getCompanyById(id: string): Promise<AdminCompany | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        logo_url,
        contact_email,
        contact_phone,
        website_url,
        subscription_plan,
        subscription_status,
        is_active,
        max_users,
        created_at,
        updated_at,
        organization_users (
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('❌ Error fetching organization by id:', error)
      return null
    }

    return data ? this.mapOrganization(data as OrganizationRow) : null
  }

  static async updateCompany(id: string, updates: CompanyUpdatePayload): Promise<AdminCompany> {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active
    }

    if (updates.subscription_status !== undefined) {
      updateData.subscription_status = updates.subscription_status
    }

    if (updates.subscription_plan !== undefined) {
      updateData.subscription_plan = updates.subscription_plan
    }

    if (updates.max_users !== undefined) {
      updateData.max_users = updates.max_users
    }

    if (Object.keys(updateData).length === 1) {
      throw new Error('No hay campos para actualizar')
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)

    if (error) {
      logger.error('❌ Error updating organization:', error)
      throw error
    }

    const updatedCompany = await this.getCompanyById(id)

    if (!updatedCompany) {
      throw new Error('Organización no encontrada después de actualizar')
    }

    return updatedCompany
  }
}

