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
  CheckCircle2,
  TrendingUp
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

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'team':
        return <Users className="w-6 h-6" />;
      case 'business':
        return <Building2 className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'team':
        return 'from-blue-500 to-blue-600';
      case 'business':
        return 'from-purple-500 to-purple-600';
      case 'enterprise':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const calculateYearlySavings = (plan: Plan): number => {
    if (plan.price === 'Personalizado') return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    const savings = monthlyTotal - plan.priceYearly;
    const percentage = (savings / monthlyTotal) * 100;
    return Math.round(percentage);
  };

  return (
    <div className="w-full space-y-12">
      {/* Toggle de Facturación */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
            billingCycle === 'yearly'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Anual
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Ahorra ~20%
          </span>
        </button>
      </div>

      {/* Cards de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const savings = calculateYearlySavings(plan);
          const monthlyEquivalent = billingCycle === 'yearly' 
            ? Math.round(plan.priceYearly / 12)
            : plan.priceMonthly;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                plan.isPopular
                  ? 'border-primary shadow-xl scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-lg text-sm font-semibold z-10 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  {plan.badge || 'Más Popular'}
                </div>
              )}

              {/* Badge de descuento */}
              {plan.badge && !plan.isPopular && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                  {plan.badge}
                </div>
              )}

              {/* Header con gradiente */}
              <div className={`bg-gradient-to-br ${getPlanColor(plan.id)} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  {getPlanIcon(plan.id)}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">{plan.tagline}</p>
                <div className="flex items-baseline gap-2">
                  {plan.price === 'Personalizado' ? (
                    <span className="text-3xl font-bold">Personalizado</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        ${billingCycle === 'yearly' 
                          ? plan.priceYearly.toLocaleString('es-MX')
                          : plan.priceMonthly.toLocaleString('es-MX')
                        }
                      </span>
                      <span className="text-white/70">
                        /{billingCycle === 'yearly' ? 'año' : 'mes'}
                      </span>
                    </>
                  )}
                </div>
                {plan.price !== 'Personalizado' && billingCycle === 'yearly' && savings > 0 && (
                  <p className="text-white/80 text-sm mt-2">
                    Ahorra {savings}% vs plan mensual
                  </p>
                )}
                {plan.price !== 'Personalizado' && billingCycle === 'yearly' && (
                  <p className="text-white/70 text-sm mt-1">
                    ${monthlyEquivalent.toLocaleString('es-MX')}/mes facturado anualmente
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="p-6 bg-white dark:bg-gray-800">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
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
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparación Detallada por Categorías */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
          Comparación Detallada de Características
        </h2>
        <div className="space-y-6">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {category}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary w-1/2">
                        Característica
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Team
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Business
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {features.map((feature, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-text-primary font-medium">{feature.name}</p>
                            <p className="text-text-tertiary text-sm mt-1">{feature.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.team ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.business ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.enterprise ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto" />
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

      {/* Nota de comparación */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Todas las suscripciones incluyen cancelación en cualquier momento. Sin cargos ocultos.
        </p>
      </div>
    </div>
  )
}

