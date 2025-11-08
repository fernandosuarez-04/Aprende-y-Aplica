import { createClient } from '@/lib/supabase/server'

export class SubscriptionService {
  /**
   * Verifica si un usuario tiene una membresía activa
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_id, subscription_status, end_date')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, lo cual es válido
        // console.error('Error checking subscription:', error)
        return false
      }

      if (!data) {
        return false
      }

      // Verificar que la membresía no haya expirado
      if (data.end_date) {
        const endDate = new Date(data.end_date)
        const now = new Date()
        if (endDate < now) {
          return false
        }
      }

      // Si end_date es null, significa lifetime y está activa
      return true
    } catch (error) {
      // console.error('Error in SubscriptionService.hasActiveSubscription:', error)
      return false
    }
  }

  /**
   * Obtiene la información de la membresía activa del usuario
   */
  static async getActiveSubscription(userId: string) {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_id, subscription_type, subscription_status, start_date, end_date, price_cents')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // console.error('Error getting subscription:', error)
        return null
      }

      if (!data) {
        return null
      }

      // Verificar que la membresía no haya expirado
      if (data.end_date) {
        const endDate = new Date(data.end_date)
        const now = new Date()
        if (endDate < now) {
          return null
        }
      }

      return data
    } catch (error) {
      // console.error('Error in SubscriptionService.getActiveSubscription:', error)
      return null
    }
  }
}

