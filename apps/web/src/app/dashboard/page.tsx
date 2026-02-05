'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Sparkles,
    Building2,
    MessageSquare,
    Star,
    Zap,
    Crown,
    Check,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

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
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
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
        color: 'text-teal-400',
        bgColor: 'bg-teal-400/10',
        borderColor: 'border-teal-400/50',
        buttonColor: 'bg-teal-500 hover:bg-teal-600',
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
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        icon: <Crown className="w-6 h-6" />,
    },
];

// ============================================
// MAIN DASHBOARD PAGE (Plans Selection)
// ============================================
export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleSelectPlan = (planId: string) => {
        router.push(`/business/subscribe?plan=${planId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F1419] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">SOFLIA</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">
                                    {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-gray-300 text-sm hidden sm:block pr-2">
                                    {user.email}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20"
                    >
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Planes para Empresas</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
                    >
                        Elige el plan perfecto <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                            para tu equipo
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Transforma el aprendizaje de tu organización con nuestra plataforma impulsada por IA.
                        Comienza gratis o escala con nuestros planes premium.
                    </motion.p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index + 0.3 }}
                            className={`
                                relative rounded-3xl border overflow-hidden transition-transform duration-300 hover:scale-[1.02]
                                ${plan.featured ? 'border-teal-500/50 shadow-2xl shadow-teal-500/10 md:-mt-8 md:mb-8 z-10' : 'border-white/10 bg-[#161b22]'}
                                ${plan.featured ? 'bg-[#161b22]' : ''}
                            `}
                        >
                            {plan.featured && (
                                <div className="absolute top-0 left-0 right-0 py-1.5 text-center bg-teal-500 text-[#0F1419] text-xs font-bold uppercase tracking-wider">
                                    Más Popular
                                </div>
                            )}

                            <div className={`p-8 ${plan.featured ? 'pt-10' : ''}`}>
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.bgColor} ${plan.color}`}>
                                        {plan.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                        <p className="text-gray-400 text-sm">{plan.users}</p>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-8 min-h-[40px]">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-8">
                                    {plan.price ? (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-white">${plan.price}</span>
                                            <span className="text-gray-500">/{plan.period}</span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold text-white">
                                            Contactar
                                        </div>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    className={`
                                        w-full py-3.5 rounded-xl font-semibold mb-8 transition-all flex items-center justify-center gap-2 group
                                        ${plan.featured 
                                            ? 'bg-teal-500 hover:bg-teal-400 text-[#0F1419] shadow-lg shadow-teal-500/20' 
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}
                                    `}
                                >
                                    {plan.price ? 'Comenzar Ahora' : 'Contactar Ventas'}
                                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${plan.featured ? 'text-[#0F1419]' : 'text-gray-400'}`} />
                                </button>

                                {/* Features */}
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Incluye:</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                                <Check className={`w-5 h-5 flex-shrink-0 ${plan.color}`} />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Contact */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center pb-8"
                >
                    <p className="text-gray-500 mb-4">¿Tienes dudas sobre qué plan elegir?</p>
                    <a
                        href="mailto:ventas@aprendeyaplica.com"
                        className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors font-medium"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Hablar con un experto
                    </a>
                </motion.div>
            </main>
        </div>
    );
}
