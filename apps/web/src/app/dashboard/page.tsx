'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Play,
    CheckCircle,
    ArrowRight,
    Sparkles,
    Users,
    Building2,
    GraduationCap,
    Brain,
    MessageSquare,
    BarChart3,
    Star,
    Zap,
    Crown,
    Check
} from 'lucide-react'
import { useAuth } from '../../features/auth/hooks/useAuth'

// ============================================
// DESIGN SYSTEM COLORS
// ============================================
const colors = {
    primary: '#0A2540',
    accent: '#00D4B3',
    accentLight: '#00E5C4',
    success: '#10B981',
    warning: '#F59E0B',
    bgPrimary: '#0F1419',
    bgSecondary: '#1E2329',
    bgTertiary: '#161B22',
    purple: '#8B5CF6',
    blue: '#3B82F6',
}

// ============================================
// TOUR STEPS
// ============================================
const tourSteps = [
    {
        id: 1,
        title: '¡Bienvenido a SOFIA!',
        description: 'SOFIA es tu plataforma de aprendizaje empresarial impulsada por Inteligencia Artificial. Te ayudamos a desarrollar las habilidades de tu equipo de manera personalizada y efectiva.',
        icon: <Sparkles className="w-8 h-8" />,
        color: colors.accent,
    },
    {
        id: 2,
        title: 'Cursos Especializados',
        description: 'Accede a una biblioteca de cursos diseñados para empresas, con contenido actualizado y práctico que tu equipo puede aplicar inmediatamente.',
        icon: <GraduationCap className="w-8 h-8" />,
        color: colors.purple,
    },
    {
        id: 3,
        title: 'Asistente IA - LIA',
        description: 'LIA es tu asistente inteligente que responde dudas, genera contenido personalizado y te ayuda a maximizar el aprendizaje de tu equipo 24/7.',
        icon: <Brain className="w-8 h-8" />,
        color: colors.blue,
    },
    {
        id: 4,
        title: 'Gestión de Equipos',
        description: 'Asigna cursos a tu equipo, monitorea su progreso en tiempo real y obtén reportes detallados del desarrollo de cada colaborador.',
        icon: <Users className="w-8 h-8" />,
        color: colors.warning,
    },
    {
        id: 5,
        title: 'Métricas y Análisis',
        description: 'Dashboards ejecutivos con métricas clave: progreso, tiempo invertido, certificaciones obtenidas y ROI del aprendizaje.',
        icon: <BarChart3 className="w-8 h-8" />,
        color: colors.success,
    },
]

// ============================================
// SUBSCRIPTION PLANS
// ============================================
const plans = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Ideal para equipos pequeños que inician su transformación digital',
        price: 299,
        period: 'mes',
        users: 'Hasta 10 usuarios',
        featured: false,
        features: [
            'Acceso a biblioteca de cursos básicos',
            'Asistente LIA (100 consultas/mes)',
            'Asignación de cursos',
            'Reportes básicos',
            'Soporte por email',
        ],
        color: colors.blue,
        icon: <Star className="w-6 h-6" />,
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Para empresas que buscan escalar el aprendizaje de su equipo',
        price: 699,
        period: 'mes',
        users: 'Hasta 50 usuarios',
        featured: true,
        features: [
            'Acceso completo a todos los cursos',
            'Asistente LIA ilimitado',
            'Rutas de aprendizaje personalizadas',
            'Analytics avanzados y dashboards',
            'Integraciones (Slack, Teams)',
            'Soporte prioritario',
            'Branding personalizado',
        ],
        color: colors.accent,
        icon: <Zap className="w-6 h-6" />,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Solución completa para grandes organizaciones',
        price: null,
        period: 'Personalizado',
        users: 'Usuarios ilimitados',
        featured: false,
        features: [
            'Todo lo de Business +',
            'Contenido personalizado',
            'API de integración',
            'SSO / SAML',
            'Account Manager dedicado',
            'SLA garantizado',
            'Onboarding personalizado',
            'Capacitación a administradores',
        ],
        color: colors.purple,
        icon: <Crown className="w-6 h-6" />,
    },
]

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export default function DashboardPage() {
    const router = useRouter()
    const { user, loading } = useAuth()
    const [currentStep, setCurrentStep] = useState(0)
    const [tourCompleted, setTourCompleted] = useState(false)
    const [showPlans, setShowPlans] = useState(false)

    // Check if user has seen tour before (localStorage)
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('sofia_tour_completed')
        if (hasSeenTour === 'true') {
            setTourCompleted(true)
            setShowPlans(true)
        }
    }, [])

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            // Tour completed
            setTourCompleted(true)
            setShowPlans(true)
            localStorage.setItem('sofia_tour_completed', 'true')
        }
    }

    const skipTour = () => {
        setTourCompleted(true)
        setShowPlans(true)
        localStorage.setItem('sofia_tour_completed', 'true')
    }

    const handleSelectPlan = (planId: string) => {
        // Redirect to subscription page with selected plan
        router.push(`/business/subscribe?plan=${planId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ border: `3px solid ${colors.accent}20` }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full border-3 border-t-[#00D4B3] border-r-transparent border-b-transparent border-l-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    <p className="text-white/50">Cargando...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
            {/* Header */}
            <header
                className="sticky top-0 z-50 backdrop-blur-xl border-b"
                style={{ backgroundColor: `${colors.bgPrimary}e6`, borderColor: 'rgba(255,255,255,0.05)' }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentLight})` }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <Sparkles className="w-5 h-5 text-black" />
                        </motion.div>
                        <span className="text-xl font-bold text-white">SOFIA</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/60 text-sm hidden sm:block">
                                    {user.email}
                                </span>
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{ backgroundColor: colors.accent, color: colors.primary }}
                                >
                                    {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <AnimatePresence mode="wait">
                    {/* TOUR SECTION */}
                    {!tourCompleted && (
                        <motion.div
                            key="tour"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            {/* Progress */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-2">
                                    {tourSteps.map((_, index) => (
                                        <motion.div
                                            key={index}
                                            className="h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: index === currentStep ? '2rem' : '0.5rem',
                                                backgroundColor: index <= currentStep ? colors.accent : 'rgba(255,255,255,0.1)',
                                            }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={skipTour}
                                    className="text-white/40 hover:text-white/60 text-sm transition-colors"
                                >
                                    Saltar tour
                                </button>
                            </div>

                            {/* Current Step */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative"
                                >
                                    {/* Card */}
                                    <div
                                        className="relative overflow-hidden rounded-3xl border p-8 md:p-12"
                                        style={{
                                            backgroundColor: colors.bgSecondary,
                                            borderColor: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        {/* Gradient background */}
                                        <div
                                            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20"
                                            style={{ backgroundColor: tourSteps[currentStep].color }}
                                        />

                                        <div className="relative">
                                            {/* Icon */}
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.2, type: 'spring' }}
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                                                style={{
                                                    backgroundColor: `${tourSteps[currentStep].color}20`,
                                                    color: tourSteps[currentStep].color,
                                                }}
                                            >
                                                {tourSteps[currentStep].icon}
                                            </motion.div>

                                            {/* Content */}
                                            <motion.h1
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-3xl md:text-4xl font-bold text-white mb-4"
                                            >
                                                {tourSteps[currentStep].title}
                                            </motion.h1>

                                            <motion.p
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="text-lg text-white/60 leading-relaxed mb-8"
                                            >
                                                {tourSteps[currentStep].description}
                                            </motion.p>

                                            {/* Next Button */}
                                            <motion.button
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                onClick={nextStep}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                                                style={{ backgroundColor: tourSteps[currentStep].color, color: colors.primary }}
                                                whileHover={{ scale: 1.02, boxShadow: `0 10px 30px ${tourSteps[currentStep].color}40` }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {currentStep === tourSteps.length - 1 ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Ver Planes
                                                    </>
                                                ) : (
                                                    <>
                                                        Siguiente
                                                        <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* SUBSCRIPTION PLANS SECTION */}
                    {showPlans && (
                        <motion.div
                            key="plans"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Header */}
                            <div className="text-center mb-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                                    style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="text-sm font-medium">Planes para Empresas</span>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                                >
                                    Elige el plan perfecto para tu equipo
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl text-white/50 max-w-2xl mx-auto"
                                >
                                    Transforma el aprendizaje de tu organización con nuestra plataforma impulsada por IA
                                </motion.p>
                            </div>

                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                {plans.map((plan, index) => (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className={`relative rounded-3xl border overflow-hidden ${plan.featured ? 'md:-mt-4 md:mb-4' : ''
                                            }`}
                                        style={{
                                            backgroundColor: colors.bgSecondary,
                                            borderColor: plan.featured ? plan.color : 'rgba(255,255,255,0.05)',
                                            borderWidth: plan.featured ? '2px' : '1px',
                                        }}
                                    >
                                        {/* Featured Badge */}
                                        {plan.featured && (
                                            <div
                                                className="absolute top-0 left-0 right-0 py-2 text-center text-sm font-bold"
                                                style={{ backgroundColor: plan.color, color: colors.primary }}
                                            >
                                                Más Popular
                                            </div>
                                        )}

                                        <div className={`p-6 lg:p-8 ${plan.featured ? 'pt-12' : ''}`}>
                                            {/* Plan Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                                                >
                                                    {plan.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                                    <p className="text-white/40 text-sm">{plan.users}</p>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-white/50 text-sm mb-6">
                                                {plan.description}
                                            </p>

                                            {/* Price */}
                                            <div className="mb-6">
                                                {plan.price ? (
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                                                        <span className="text-white/40">/{plan.period}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-bold text-white">
                                                        Contactar Ventas
                                                    </div>
                                                )}
                                            </div>

                                            {/* CTA Button */}
                                            <motion.button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                className="w-full py-3 rounded-xl font-semibold mb-6 transition-all duration-300"
                                                style={{
                                                    backgroundColor: plan.featured ? plan.color : 'rgba(255,255,255,0.05)',
                                                    color: plan.featured ? colors.primary : 'white',
                                                }}
                                                whileHover={{
                                                    scale: 1.02,
                                                    backgroundColor: plan.featured ? plan.color : 'rgba(255,255,255,0.1)'
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {plan.price ? 'Comenzar Ahora' : 'Contactar'}
                                            </motion.button>

                                            {/* Features */}
                                            <ul className="space-y-3">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-3">
                                                        <Check
                                                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                                                            style={{ color: plan.color }}
                                                        />
                                                        <span className="text-white/70 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Contact Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-16 text-center"
                            >
                                <p className="text-white/40 mb-4">
                                    ¿Tienes preguntas? Nuestro equipo está listo para ayudarte
                                </p>
                                <a
                                    href="mailto:ventas@aprendeyaplica.com"
                                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    ventas@aprendeyaplica.com
                                </a>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
