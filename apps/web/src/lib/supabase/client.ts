import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Crea un cliente de Supabase para el navegador
 * 
 * IMPORTANTE: Este cliente maneja automáticamente las cookies de sesión
 * de Supabase. No uses createBrowserClient() directamente - siempre usa
 * este helper para asegurar que la sesión del usuario se envíe correctamente.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return { name, value: decodeURIComponent(rest.join('=')) }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            if (options?.path) cookieString += `; path=${options.path}`
            if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options?.domain) cookieString += `; domain=${options.domain}`
            if (options?.secure) cookieString += `; secure`
            if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
            document.cookie = cookieString
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}