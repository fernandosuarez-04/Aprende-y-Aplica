'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Brain,
  MessageSquare,
  Zap,
  Lightbulb,
  Cpu,
  Network,
  Navigation,
  Layers,
  Sparkles,
  CheckCircle2,
  Code2,
  BookOpen,
  Target,
  Rocket,
  Users,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function ConocerLiaPage() {
  const heroRef = useRef<HTMLElement>(null);
  const capabilitiesRef = useRef<HTMLElement>(null);
  const metaphorsRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const capabilitiesInView = useInView(capabilitiesRef, { once: false, amount: 0.2 });
  const metaphorsInView = useInView(metaphorsRef, { once: false, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: false, amount: 0.2 });

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start']
  });

  const { scrollYProgress: capabilitiesScroll } = useScroll({
    target: capabilitiesRef,
    offset: ['start end', 'end start']
  });

  // Parallax effects
  const heroY1 = useTransform(heroScroll, [0, 1], [0, -100]);
  const heroY2 = useTransform(heroScroll, [0, 1], [0, 100]);
  const heroOpacity = useTransform(heroScroll, [0, 0.3, 0.7, 1], [0, 1, 1, 0.5]);

  const capabilitiesY = useTransform(capabilitiesScroll, [0, 1], [50, -50]);

  // MetÃ¡foras centrales de LIA
  const metaphors = [
    {
      icon: Cpu,
      title: 'Sistema Operativo de Aprendizaje',
      description: 'LIA es la capa que organiza, coordina y conecta todas las aplicaciones de formaciÃ³n, contenidos y experiencias. SOFLIA piensa, LIA te acompaÃ±a.',
      color: '#00D4B3',
      gradient: 'from-[#00D4B3] to-[#00D4B3]/80'
    },
    {
      icon: Brain,
      title: 'Cerebro Extendido',
      description: 'LIA amplÃ­a tu capacidad de memoria, razonamiento y acceso a conocimiento. El nÃºcleo de IA procesa datos; LIA es la voz que explica y orienta.',
      color: '#10B981',
      gradient: 'from-[#10B981] to-[#10B981]/80'
    },
    {
      icon: Navigation,
      title: 'Copiloto de Aprendizaje',
      description: 'Nadie recorre la ruta de desarrollo solo. LIA es tu copiloto visible que te ayuda a decidir el prÃ³ximo paso y te propone rutas personalizadas.',
      color: '#F59E0B',
      gradient: 'from-[#F59E0B] to-[#F59E0B]/80'
    },
    {
      icon: Network,
      title: 'Sistema Nervioso del Talento',
      description: 'LIA conecta seÃ±ales dispersas (datos, capacidades, necesidades) y las transforma en acciÃ³n coordinada. Detecta patrones y te interpreta las seÃ±ales.',
      color: '#0A2540',
      gradient: 'from-[#0A2540] to-[#0A2540]/80'
    },
    {
      icon: Layers,
      title: 'Infraestructura de Conocimiento',
      description: 'LIA es la puerta de acceso a la infraestructura donde se almacena, organiza y actualiza el conocimiento crÃ­tico. Orquesta y ensambla tu aprendizaje.',
      color: '#00D4B3',
      gradient: 'from-[#00D4B3] to-[#00D4B3]/80'
    }
  ];

  // Capacidades de LIA
  const capabilities = [
    {
      icon: MessageSquare,
      title: 'PRL-1.0 Mini',
      description: 'Modelo conversacional con contexto de pÃ¡gina. Resuelve dudas, explica conceptos y te guÃ­a en tu aprendizaje de forma personalizada.',
      examples: ['Contexto inteligente de pÃ¡gina', 'Resuelve dudas al instante', 'Explica conceptos complejos']
    },
    {
      icon: BookOpen,
      title: 'ResÃºmenes y Explicaciones',
      description: 'Â¿Necesitas un resumen para recordar lo que acabas de aprender? LIA resume y explica fragmentos de tus clases favoritas.',
      examples: ['ResÃºmenes de clases', 'Explicaciones paso a paso', 'SÃ­ntesis de conceptos']
    },
    {
      icon: CheckCircle2,
      title: 'CorrecciÃ³n de Ejercicios',
      description: 'Revisa tus ejercicios con LIA. Resuelve tus dudas y pide ayuda para entender las partes con las que tienes dificultades.',
      examples: ['Revisa tu cÃ³digo', 'Corrige ejercicios', 'Explica errores']
    },
    {
      icon: Target,
      title: 'Respuestas Personalizadas',
      description: 'Estudia con LIA de tu propia manera, de forma personalizada. Pregunta lo que consideres necesario y profundiza en el conocimiento.',
      examples: ['Adaptado a tu nivel', 'Respuestas contextualizadas', 'Aprendizaje personalizado']
    }
  ];

  // CaracterÃ­sticas de personalidad
  const personalityFeatures = [
    {
      icon: Sparkles,
      title: 'Tono CÃ¡lido pero Profesional',
      description: 'LIA habla de "nosotros" (equipo) mÃ¡s que de "yo mÃ¡quina". Siempre justifica sus recomendaciones y adapta la complejidad segÃºn tu perfil.',
      color: '#00D4B3'
    },
    {
      icon: Users,
      title: 'Anticipa y Sugiere',
      description: 'LIA no impone ni regaÃ±a. Anticipa tus necesidades, sugiere prÃ³ximos pasos y explica el porquÃ© de cada recomendaciÃ³n.',
      color: '#10B981'
    },
    {
      icon: Clock,
      title: 'Disponible 24/7',
      description: 'LIA estÃ¡ siempre disponible para ayudarte. Estudia las 24 horas, los 7 dÃ­as de la semana, cuando y donde quieras.',
      color: '#F59E0B'
    },
    {
      icon: TrendingUp,
      title: 'Transparencia Total',
      description: 'LIA es transparente sobre lo que sabe, lo que infiere y lo que aÃºn necesita que definas. Sin lÃ­mites ocultos.',
      color: '#0A2540'
    }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-[#0F1419] relative overflow-x-hidden">
      {/* Global Background Effects - Fixed position to avoid clipping */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ overflow: 'visible', clipPath: 'none' }}>
        {/* Subtle Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#0A2540 1px, transparent 1px), linear-gradient(90deg, #0A2540 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Global Gradient Orbs - Extended beyond viewport in all directions */}
        <motion.div
          className="absolute -top-[400px] -left-[400px] w-[1000px] h-[1000px] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute -bottom-[400px] -right-[400px] w-[1000px] h-[1000px] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />
        {/* Additional orbs for better coverage */}
        <motion.div
          className="absolute top-1/2 -left-[200px] w-[600px] h-[600px] bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-[200px] w-[600px] h-[600px] bg-[#0A2540]/5 dark:bg-[#0A2540]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3
          }}
        />
      </div>

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#6C757D] dark:text-white/70 hover:text-[#0A2540] dark:hover:text-white transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </Link>
        </motion.div>
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="container mx-auto px-4 py-16 lg:py-24 relative z-10"
      >

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 text-[#0A2540] dark:text-white leading-tight"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.8,
                type: 'spring',
                stiffness: 100
              }}
            >
              Conoce a{' '}
              <span className="text-[#00D4B3]">
                LIA
              </span>
            </motion.h1>

            <motion.p
              className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80 leading-relaxed mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Tu asistente inteligente de aprendizaje. LIA te guÃ­a, responde tus preguntas y te ayuda a dominar la inteligencia artificial.
            </motion.p>

            <motion.p
              className="text-lg lg:text-xl max-w-2xl mx-auto text-[#00D4B3] font-semibold"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              "SOFLIA piensa, LIA te acompaÃ±a"
            </motion.p>
          </motion.div>

          {/* LIA Visual - Circular Design */}
          <motion.div
            className="flex justify-center mb-16"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
              {/* Outer Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D4B3] to-[#0A2540] opacity-20 blur-2xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />

              {/* Middle Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-[#00D4B3]/30"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />

              {/* Inner Circle with Image */}
              <motion.div
                className="absolute inset-4 rounded-full bg-gradient-to-br from-[#00D4B3] to-[#0A2540] flex items-center justify-center shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/lia-avatar.png"
                  alt="LIA - Asistente Inteligente"
                  width={320}
                  height={320}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MetÃ¡foras Centrales Section */}
      <section
        ref={metaphorsRef}
        className="py-32 relative bg-white dark:bg-[#0F1419]"
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl lg:text-6xl font-bold mb-6 text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
            >
              LIA: Tu{' '}
              <span className="text-[#00D4B3]">SabidurÃ­a Aumentada</span>
            </h2>
            <p
              className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              LIA es mÃ¡s que un asistente. Es la interfaz humana que traduce la inteligencia de SOFLIA en conversaciones, acciones y decisiones cotidianas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {metaphors.map((metaphor, index) => {
              const IconComponent = metaphor.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 100, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.8,
                    type: 'spring',
                    stiffness: 100
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Animated Background Gradient */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${metaphor.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    />

                    {/* Icon */}
                    <div className="relative z-10 mb-6">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${metaphor.color}20` }}
                      >
                        <IconComponent
                          className="w-8 h-8"
                          style={{ color: metaphor.color }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3
                        className="text-2xl font-bold mb-4 text-[#0A2540] dark:text-white"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                      >
                        {metaphor.title}
                      </h3>
                      <p
                        className="text-[#6C757D] dark:text-white/70 leading-relaxed"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {metaphor.description}
                      </p>
                    </div>

                    {/* Decorative Corner */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 opacity-5"
                      style={{
                        background: `linear-gradient(135deg, ${metaphor.color} 0%, transparent 70%)`
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capacidades de LIA Section */}
      <section
        ref={capabilitiesRef}
        className="py-32 relative bg-gradient-to-b from-white to-[#F8F9FA] dark:from-[#0F1419] dark:to-[#0A0D12]"
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl lg:text-6xl font-bold mb-6 text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
            >
              Â¿QuÃ© puede hacer{' '}
              <span className="text-[#00D4B3]">LIA</span>
              {' '}por ti?
            </h2>
            <p
              className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Explora todas las capacidades que LIA tiene para ayudarte en tu aprendizaje
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {capabilities.map((capability, index) => {
              const IconComponent = capability.icon;
              return (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6
                  }}
                  style={{ y: capabilitiesY }}
                >
                  <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00D4B3] to-[#0A2540] flex items-center justify-center mb-4">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3
                      className="text-xl font-bold mb-3 text-[#0A2540] dark:text-white"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      {capability.title}
                    </h3>
                    <p
                      className="text-[#6C757D] dark:text-white/70 leading-relaxed mb-4"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {capability.description}
                    </p>

                    {/* Examples */}
                    <div className="space-y-2">
                      {capability.examples.map((example, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#6C757D] dark:text-white/60">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planificador de Estudios Section */}
      <section className="py-32 relative bg-white dark:bg-[#0F1419]">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl lg:text-6xl font-bold mb-6 text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
            >
              Planificador de{' '}
              <span className="text-[#00D4B3]">Estudios</span>
            </h2>
            <p
              className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              LIA genera planes de estudio personalizados adaptados a tu perfil profesional, disponibilidad y objetivos de aprendizaje
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: Target,
                title: 'GeneraciÃ³n AutomÃ¡tica con IA',
                description: 'LIA crea tu plan de estudios considerando tu rol profesional, perfil completo, cursos adquiridos y progreso actual. Todo adaptado a tu disponibilidad y preferencias.',
                color: '#00D4B3',
                features: [
                  'AnÃ¡lisis de tu perfil profesional',
                  'CÃ¡lculo de disponibilidad granular',
                  'DistribuciÃ³n inteligente de lecciones',
                  'Ajuste segÃºn tu progreso'
                ]
              },
              {
                icon: Clock,
                title: 'GestiÃ³n Inteligente de Tiempo',
                description: 'LIA calcula tiempos mÃ­nimos por lecciÃ³n, considera duraciÃ³n de videos, actividades y materiales. Valida que tu plan sea realista y alcanzable.',
                color: '#10B981',
                features: [
                  'CÃ¡lculo preciso de tiempos',
                  'ValidaciÃ³n de tiempos mÃ­nimos',
                  'Sesiones cortas, medianas o largas',
                  'OptimizaciÃ³n de tu tiempo'
                ]
              },
              {
                icon: Navigation,
                title: 'Rutas Personalizadas',
                description: 'LIA propone rutas de aprendizaje basadas en tu nivel, Ã¡rea profesional y objetivos. Te sugiere el siguiente paso mÃ¡s adecuado para ti.',
                color: '#F59E0B',
                features: [
                  'Rutas adaptadas a tu nivel',
                  'Secuencias optimizadas',
                  'Recomendaciones contextuales',
                  'ProgresiÃ³n natural'
                ]
              },
              {
                icon: TrendingUp,
                title: 'Seguimiento de Progreso',
                description: 'LIA monitorea tu avance, detecta patrones de estudio y ajusta tu plan dinÃ¡micamente. Te ayuda a mantener rachas y cumplir objetivos.',
                color: '#0A2540',
                features: [
                  'Monitoreo continuo',
                  'Ajustes automÃ¡ticos',
                  'Sistema de rachas',
                  'MÃ©tricas de progreso'
                ]
              },
              {
                icon: Calendar,
                title: 'IntegraciÃ³n con Calendarios',
                description: 'LIA sincroniza tu plan de estudios con tus calendarios externos. Respeta tus compromisos y encuentra los mejores momentos para estudiar.',
                color: '#00D4B3',
                features: [
                  'SincronizaciÃ³n automÃ¡tica',
                  'DetecciÃ³n de conflictos',
                  'Reagendamiento inteligente',
                  'Recordatorios personalizados'
                ]
              },
              {
                icon: Brain,
                title: 'Mejores PrÃ¡cticas de Estudio',
                description: 'LIA aplica tÃ©cnicas comprobadas como repeticiÃ³n espaciada, prÃ¡ctica distribuida y recall activo para maximizar tu retenciÃ³n y aprendizaje.',
                color: '#10B981',
                features: [
                  'RepeticiÃ³n espaciada',
                  'PrÃ¡ctica distribuida',
                  'TÃ©cnica Pomodoro',
                  'Recall activo'
                ]
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    {/* Icon */}
                    <div className="mb-6">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <IconComponent
                          className="w-7 h-7"
                          style={{ color: feature.color }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <h3
                      className="text-xl font-bold mb-3 text-[#0A2540] dark:text-white"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="text-[#6C757D] dark:text-white/70 leading-relaxed mb-4"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {feature.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2">
                      {feature.features.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#6C757D] dark:text-white/60">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Personalidad de LIA Section */}
      <section
        ref={featuresRef}
        className="py-32 relative bg-gradient-to-b from-white to-[#F8F9FA] dark:from-[#0F1419] dark:to-[#0A0D12]"
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl lg:text-6xl font-bold mb-6 text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
            >
              La{' '}
              <span className="text-[#00D4B3]">Personalidad</span>
              {' '}de LIA
            </h2>
            <p
              className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              LIA no es solo tecnologÃ­a, es tu compaÃ±ero de aprendizaje con una personalidad Ãºnica
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {personalityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <IconComponent
                          className="w-6 h-6"
                          style={{ color: feature.color }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-xl font-bold mb-2 text-[#0A2540] dark:text-white"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className="text-[#6C757D] dark:text-white/70 leading-relaxed"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#00D4B3]">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl lg:text-6xl font-bold mb-6 text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              Â¿Listo para comenzar con LIA?
            </motion.h2>
            <p
              className="text-xl lg:text-2xl mb-12 text-white/90"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Ãšnete a miles de estudiantes que ya estÃ¡n transformando su aprendizaje con inteligencia artificial
            </p>
            <Link href="/auth">
              <motion.button
                className="px-12 py-5 bg-white text-[#0A2540] rounded-xl font-bold text-lg shadow-2xl"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Comienza con LIA
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
