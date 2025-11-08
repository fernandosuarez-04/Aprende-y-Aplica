'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error a servicio de monitoreo (ej: Sentry)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error, errorInfo)
    }

    // Llamar callback personalizado si existe
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Algo salió mal
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Lo sentimos, ocurrió un error inesperado. Por favor, intenta recargar la página.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>

              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
