'use server'

import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  try {
    const supabase = await createClient()
    
    // Obtener sesión actual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Eliminar sesión de user_sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
    }
    
    // Cerrar sesión de Supabase Auth
    await supabase.auth.signOut()
    
    redirect('/auth')
  } catch (error) {
    console.error('Logout error:', error)
    // Aún así redirigir en caso de error
    redirect('/auth')
  }
}
