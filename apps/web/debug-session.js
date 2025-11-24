// Script para verificar cookies de sesión
// Ejecutar en la consola del navegador después de hacer login

// console.log('🍪 Verificando cookies de sesión...')

// Ver todas las cookies
// console.log('📋 Todas las cookies:', document.cookie)

// Buscar específicamente la cookie de sesión
const sessionCookie = document.cookie
  .split(';')
  .find(cookie => cookie.trim().startsWith('aprende-y-aplica-session'))

if (sessionCookie) {
  // console.log('✅ Cookie de sesión encontrada:', sessionCookie)
} else {
  // console.log('❌ Cookie de sesión NO encontrada')
}

// Verificar si hay cookies en absoluto
if (document.cookie) {
  // console.log('✅ Hay cookies en el navegador')
} else {
  // console.log('❌ No hay cookies en el navegador')
}

// Probar llamada a la API
fetch('/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(response => {
  // console.log('📡 Respuesta de /api/auth/me:', response.status, response.ok)
  return response.json()
})
.then(data => {
  // console.log('📋 Datos de la API:', data)
})
.catch(error => {
  // console.error('💥 Error en la llamada a la API:', error)
})
