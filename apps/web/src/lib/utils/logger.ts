/**
 * Logger Utility - Conditional Logging for Development
 * 
 * Este logger solo muestra mensajes en desarrollo (NODE_ENV !== 'production').
 * En producción, los logs de debug se eliminan automáticamente para mejorar performance.
 * 
 * Los errores SIEMPRE se registran en todos los entornos.
 * 
 * @see docs/PLAN_OPTIMIZACION_PERFORMANCE.md
 */

const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

/**
 * Logger condicional que solo muestra mensajes en desarrollo
 */
export const logger = {
  /**
   * Log normal - Solo en desarrollo
   * @example logger.log('User logged in:', userId)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      // console.log(...args)
    }
  },

  /**
   * Log de información - Solo en desarrollo
   * @example logger.info('Processing request...')
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      // console.info(...args)
    }
  },

  /**
   * Log de advertencia - Solo en desarrollo
   * @example logger.warn('Deprecated function used')
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      // console.warn(...args)
    }
  },

  /**
   * Log de debug - Solo en desarrollo
   * @example logger.debug('Variable value:', myVar)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      // console.debug(...args)
    }
  },

  /**
   * Log de error - SIEMPRE se registra
   * Los errores son críticos y deben registrarse en todos los entornos
   * @example logger.error('Database connection failed:', error)
   */
  error: (...args: any[]) => {
    // console.error(...args)
  },

  /**
   * Log de tabla - Solo en desarrollo
   * Útil para visualizar objetos/arrays
   * @example logger.table([{name: 'John', age: 30}])
   */
  table: (data: any) => {
    if (isDevelopment && console.table) {

    }
  },

  /**
   * Log agrupado - Solo en desarrollo
   * @example 
   * logger.group('User Details')
   * logger.log('Name:', name)
   * logger.log('Email:', email)
   * logger.groupEnd()
   */
  group: (label: string) => {
    if (isDevelopment && console.group) {
      console.group(label)
    }
  },

  groupCollapsed: (label: string) => {
    if (isDevelopment && console.groupCollapsed) {
      console.groupCollapsed(label)
    }
  },

  groupEnd: () => {
    if (isDevelopment && console.groupEnd) {
      console.groupEnd()
    }
  },

  /**
   * Timer - Solo en desarrollo
   * Útil para medir performance
   * @example
   * logger.time('api-call')
   * await fetchData()
   * logger.timeEnd('api-call') // Muestra: api-call: 245ms
   */
  time: (label: string) => {
    if (isDevelopment && console.time) {

    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment && console.timeEnd) {

    }
  },

  /**
   * Trace - Solo en desarrollo
   * Muestra el stack trace actual
   * @example logger.trace('Function called from')
   */
  trace: (...args: any[]) => {
    if (isDevelopment && console.trace) {

    }
  },
}

/**
 * Logger para componentes React con información de componente
 */
export const componentLogger = {
  /**
   * Log de render de componente
   * @example componentLogger.render('UserProfile', { userId: 123 })
   */
  render: (componentName: string, props?: Record<string, any>) => {
    if (isDevelopment) {
      // console.log(`🎨 [${componentName}] Rendering`, props || '')
    }
  },

  /**
   * Log de mount de componente
   * @example componentLogger.mount('UserProfile')
   */
  mount: (componentName: string) => {
    if (isDevelopment) {
      // console.log(`✅ [${componentName}] Mounted`)
    }
  },

  /**
   * Log de unmount de componente
   * @example componentLogger.unmount('UserProfile')
   */
  unmount: (componentName: string) => {
    if (isDevelopment) {
      // console.log(`❌ [${componentName}] Unmounted`)
    }
  },

  /**
   * Log de efecto de componente
   * @example componentLogger.effect('UserProfile', 'Fetching user data')
   */
  effect: (componentName: string, description: string) => {
    if (isDevelopment) {
      // console.log(`⚡ [${componentName}] Effect: ${description}`)
    }
  },
}

/**
 * Logger para APIs con información de request/response
 */
export const apiLogger = {
  /**
   * Log de request API
   * @example apiLogger.request('GET', '/api/users', { userId: 123 })
   */
  request: (method: string, path: string, data?: any) => {
    if (isDevelopment) {
      // console.log(`🔍 [API] ${method} ${path}`, data || '')
    }
  },

  /**
   * Log de response exitoso
   * @example apiLogger.success('GET', '/api/users', responseData)
   */
  success: (method: string, path: string, data?: any) => {
    if (isDevelopment) {
      // console.log(`✅ [API] ${method} ${path} - Success`, data || '')
    }
  },

  /**
   * Log de error de API - SIEMPRE se registra
   * @example apiLogger.error('GET', '/api/users', error)
   */
  error: (method: string, path: string, error: any) => {
    // console.error(`❌ [API] ${method} ${path} - Error:`, error)
  },
}

// Export default para uso directo
export default logger
