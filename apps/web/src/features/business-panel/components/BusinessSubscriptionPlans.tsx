'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  ArrowRight,
  Crown,
  Building2,
  Users,
  Sparkles,
  Star,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures'

interface PlanFeature {
  name: string
  description: string
  team: boolean
  business: boolean
  enterprise: boolean
}

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  priceYearly: number
  priceMonthly: number
  yearlyPrice: string
  monthlyPrice: string
  features: string[]
  isPopular?: boolean
  badge?: string
}

export function BusinessSubscriptionPlans() {
  const { plan: currentPlan, loading: planLoading } = useSubscriptionFeatures()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const plans: Plan[] = [
    {
      id: 'team',
      name: 'Team',
      tagline: 'Perfecto para equipos pequeños',
      priceYearly: 4999,
      priceMonthly: 499,
      yearlyPrice: '$4,999 /año',
      monthlyPrice: '$499/mes',
      price: billingCycle === 'yearly' ? '$4,999 /año' : '$499/mes',
      features: [
        'Hasta 10 usuarios',
        'Acceso a todos los cursos',
        '50 certificados/mes',
        'Reportes básicos',
        'Plantillas de reportes',
        'Notificaciones automáticas',
        'Soporte por email'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      tagline: 'Ideal para empresas en crecimiento',
      priceYearly: 14999,
      priceMonthly: 1499,
      yearlyPrice: '$14,999 /año',
      monthlyPrice: '$1,499/mes',
      price: billingCycle === 'yearly' ? '$14,999 /año' : '$1,499/mes',
      features: [
        'Hasta 50 usuarios',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics avanzados',
        'Panel de administración',
        'AI Coach para equipos',
        'White-label parcial',
        'Recordatorios automáticos',
        'Benchmarking',
        'Soporte prioritario',
        'Contenido personalizado'
      ],
      isPopular: true,
      badge: '20% OFF'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Soluciones a medida para grandes organizaciones',
      priceYearly: 0,
      priceMonthly: 0,
      yearlyPrice: 'Personalizado',
      monthlyPrice: 'Personalizado',
      price: 'Personalizado',
      features: [
        'Usuarios ilimitados',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics empresariales',
        'Panel administración avanzado',
        'White-label completo',
        'AI Coach avanzado',
        'Multi-tenancy avanzado',
        'Advanced compliance',
        'Métricas personalizadas',
        'Onboarding automatizado',
        'Comunidades privadas',
        'Learning paths avanzados',
        'Soporte 24/7 dedicado',
        'Contenido 100% personalizado',
        'API de datos completa',
        'Consultoría estratégica',
        'Branding corporativo'
      ]
    }
  ]

  // Características por categoría
  const featuresByCategory: Record<string, PlanFeature[]> = {
    'Administración y Gestión': [
      {
        name: 'Panel de administración',
        description: 'Gestiona usuarios y asignaciones de cursos',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Asignación de cursos con mensajería',
        description: 'Personaliza mensajes al asignar cursos',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Grupos de usuarios personalizados',
        description: 'Organiza tu equipo por departamentos o roles',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Administración avanzada de grupos',
        description: 'Control granular por grupo',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Branding corporativo',
        description: 'Personaliza la plataforma con tu logo y colores',
        team: false,
        business: false,
        enterprise: true
      }
    ],
    'Análisis e Informes': [
      {
        name: 'Reportes básicos',
        description: 'Estadísticas de progreso y completación',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Analytics avanzados',
        description: 'Análisis profundo de aprendizaje',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Información de habilidades',
        description: 'Skills insights y gaps de conocimiento',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Análisis de cursos',
        description: 'Performance y engagement por curso',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Dashboard personalizado',
        description: 'Dashboards a medida por necesidad',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Exportación de datos',
        description: 'Exporta reportes en múltiples formatos',
        team: false,
        business: false,
        enterprise: true
      }
    ],
    'Experiencia del Usuario': [
      {
        name: 'Acceso a catálogo completo',
        description: 'Todos los cursos disponibles',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Certificaciones ilimitadas',
        description: 'Sin límite de certificaciones emitidas',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Certificados personalizados',
        description: 'Diseño de certificados propio',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Aplicación móvil',
        description: 'Acceso desde dispositivos móviles',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Offline learning',
        description: 'Descarga cursos para ver offline',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Cursos en vivo',
        description: 'Integración con Zoom/Google Meet para webinars',
        team: false,
        business: false,
        enterprise: true
      }
    ],
    'Notificaciones y Automatización': [
      {
        name: 'Notificaciones automáticas',
        description: 'Email y push cuando ocurren eventos importantes',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Recordatorios inteligentes',
        description: 'Notificaciones de cursos pendientes y fechas límite',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Integración con sistemas externos',
        description: 'Conexión con sistemas de RRHH y gestión',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'SSO empresarial',
        description: 'Single Sign-On con proveedores de identidad',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Integración con calendarios',
        description: 'Google Calendar, Outlook para sesiones',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'API de datos',
        description: 'Acceso completo a datos via API REST',
        team: false,
        business: false,
        enterprise: true
      }
    ],
    'Soporte y Servicios': [
      {
        name: 'Soporte por email',
        description: 'Tiempo de respuesta 24-48 horas',
        team: true,
        business: true,
        enterprise: true
      },
      {
        name: 'Soporte prioritario',
        description: 'Respuesta rápida garantizada',
        team: false,
        business: true,
        enterprise: true
      },
      {
        name: 'Soporte 24/7 dedicado',
        description: 'Equipo dedicado disponible siempre',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Customer Success Manager',
        description: 'Gerente de cuenta asignado',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Onboarding personalizado',
        description: 'Capacitación a medida para tu equipo',
        team: false,
        business: false,
        enterprise: true
      },
      {
        name: 'Consultoría estratégica',
        description: 'Asesoría en estrategia de aprendizaje',
        team: false,
        business: false,
        enterprise: true
      }
    ]
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    // Aquí iría la lógica para procesar el cambio de plan
    if (planId === 'enterprise') {
      // Para Enterprise, redirigir a contacto de ventas
      alert('Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.')
    } else {
      // Para otros planes, mostrar confirmación
      if (confirm(`¿Estás seguro de que deseas cambiar al plan ${planId === 'team' ? 'Team' : 'Business'}?`)) {
        // Aquí iría la lógica para actualizar el plan
        alert(`Cambio de plan a ${planId === 'team' ? 'Team' : 'Business'} en desarrollo. Próximamente estarás disponible para actualizar tu plan.`)
      }
    }
  }

  return (
    <div className="w-full space-y-12">
      {/* Toggle de Facturación */}
      <div className="flex justify-center">
        <div className="bg-carbon-900 rounded-lg p-1 border border-carbon-700 inline-flex gap-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-primary text-white'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-primary text-white'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Cards de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-carbon-900 rounded-xl border-2 p-8 ${
              plan.isPopular
                ? 'border-primary bg-gradient-to-b from-carbon-900 to-carbon-800'
                : 'border-carbon-700'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  MÁS POPULAR
                </div>
              </div>
            )}

            {plan.badge && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {plan.badge}
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-carbon-400 text-sm mb-4">{plan.tagline}</p>
              <div className="mb-2">
                <span className="text-3xl font-bold text-white">
                  {plan.price !== 'Personalizado' 
                    ? billingCycle === 'yearly' 
                      ? plan.yearlyPrice 
                      : plan.monthlyPrice
                    : plan.price
                  }
                </span>
                {plan.price !== 'Personalizado' && (
                  <span className="text-carbon-400 text-sm ml-2">
                    {billingCycle === 'yearly' ? '/año' : '/mes'}
                  </span>
                )}
              </div>
              {plan.price !== 'Personalizado' && billingCycle === 'yearly' && (
                <p className="text-carbon-400 text-sm">
                  ${Math.round(plan.priceYearly / 12).toLocaleString('es-ES')}/mes facturado anualmente
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-carbon-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {(() => {
              const isCurrentPlan = currentPlan && plan.id === currentPlan
              const isDisabled = isCurrentPlan || planLoading
              
              return (
                <button
                  onClick={() => !isDisabled && handleSelectPlan(plan.id)}
                  disabled={isDisabled}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isDisabled
                      ? 'bg-carbon-700 text-carbon-400 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : plan.id === 'enterprise'
                      ? 'bg-carbon-800 hover:bg-carbon-700 text-white border border-carbon-600'
                      : 'bg-carbon-800 hover:bg-carbon-700 text-white'
                  }`}
                >
                  {isCurrentPlan ? (
                    <>
                      Adquirido
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  ) : plan.id === 'enterprise' ? (
                    <>
                      Contactar Ventas
                      <Mail className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Cambiar de plan
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )
            })()}
          </motion.div>
        ))}
      </div>

      {/* Comparación Detallada por Categorías */}
      <div className="space-y-8">
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="bg-carbon-900 rounded-xl border border-carbon-700 overflow-hidden">
            <div className="bg-carbon-800 px-6 py-4 border-b border-carbon-700">
              <h3 className="text-xl font-bold text-white">{category}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-carbon-800 border-b border-carbon-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300 w-1/2">
                      Característica
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-carbon-300">
                      Team
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-carbon-300">
                      Business
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-carbon-300">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-700">
                  {features.map((feature, idx) => (
                    <tr key={idx} className="hover:bg-carbon-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{feature.name}</p>
                          <p className="text-carbon-400 text-sm mt-1">{feature.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.team ? (
                          <Check className="w-6 h-6 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-carbon-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.business ? (
                          <Check className="w-6 h-6 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-carbon-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.enterprise ? (
                          <Check className="w-6 h-6 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-carbon-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

