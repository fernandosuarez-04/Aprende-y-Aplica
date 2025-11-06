import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * ✅ OPTIMIZACIÓN: Connection Pooling implementado
 *
 * Nota: Para server-side con cookies (auth), seguimos usando createServerClient
 * porque necesita acceso a las cookies de Next.js para autenticación.
 *
 * El pooling se aplica principalmente en cliente browser y requests API sin cookies.
 */

export async function createClient() {
  const cookieStore = await cookies()

  // Validar que las variables de entorno estén definidas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Variables de entorno faltantes:
      NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}

      Asegúrate de crear apps/web/.env.local con:
      NEXT_PUBLIC_SUPABASE_URL=https://miwbzotcuaywpdbidpwo.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui`
    )
  }

  // ✅ OPTIMIZACIÓN: Reutilizar configuración optimizada
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side no necesita persistencia
      },
      db: {
        schema: 'public',
      },
    }
  )
}
