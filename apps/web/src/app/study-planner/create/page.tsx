'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Wand2, 
  Calendar, 
  Clock, 
  BookOpen, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Brain,
  Settings
} from 'lucide-react';
import { ManualPlanWizard } from '@/features/study-planner/components';
import { AIWizard } from '@/features/study-planner/components';

type Mode = 'selection' | 'manual' | 'ai';

export default function StudyPlannerCreatePage() {
  const [selectedMode, setSelectedMode] = useState<Mode>('selection');
  const router = useRouter();

  const handleModeSelect = (mode: 'manual' | 'ai') => {
    setSelectedMode(mode);
  };

  const handleCancel = () => {
    setSelectedMode('selection');
  };

  const handleComplete = () => {
    // Esperar un momento para que el plan se guarde antes de redirigir
    setTimeout(() => {
      router.push('/study-planner/dashboard');
      // Forzar recarga de la página para asegurar que se carguen los datos nuevos
      router.refresh();
    }, 500);
  };

  // Si ya se seleccionó un modo, mostrar el wizard correspondiente
  if (selectedMode === 'manual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <ManualPlanWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    );
  }

  if (selectedMode === 'ai') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AIWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    );
  }

  // Pantalla de selección de modo
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-2xl">
              <Calendar className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Planificador de Estudios
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Elige cómo quieres crear tu plan de estudios personalizado
          </p>
        </motion.div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Manual Mode Card */}
          <ModeCard
            mode="manual"
            title="Plan Manual"
            description="Crea tu plan de estudios paso a paso con control total sobre horarios, cursos y sesiones"
            icon={Settings}
            features={[
              'Control total de horarios',
              'Selección manual de cursos',
              'Configuración personalizada',
              'Flexibilidad completa'
            ]}
            gradient="from-blue-500 via-cyan-500 to-blue-600"
            glowColor="blue"
            onClick={() => handleModeSelect('manual')}
            delay={0.3}
          />

          {/* AI Mode Card */}
          <ModeCard
            mode="ai"
            title="Plan con IA"
            description="Deja que nuestra IA cree un plan optimizado basado en tu perfil, disponibilidad y objetivos"
            icon={Brain}
            features={[
              'Generación automática inteligente',
              'Optimización de horarios',
              'Técnicas de aprendizaje avanzadas',
              'Personalización basada en tu perfil'
            ]}
            gradient="from-purple-500 via-pink-500 to-purple-600"
            glowColor="purple"
            onClick={() => handleModeSelect('ai')}
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
}

interface ModeCardProps {
  mode: 'manual' | 'ai';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  gradient: string;
  glowColor: 'blue' | 'purple';
  onClick: () => void;
  delay: number;
}

function ModeCard({
  mode,
  title,
  description,
  icon: Icon,
  features,
  gradient,
  glowColor,
  onClick,
  delay,
}: ModeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      {/* Glow Effect */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.8 : 0.4,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.3 }}
        className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-40 group-hover:opacity-80 transition-opacity`}
      />

      {/* Card Content */}
      <div className="relative bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 h-full transition-all duration-300 group-hover:border-slate-600 group-hover:shadow-2xl">
        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%',
            }}
            transition={{
              duration: 3,
              repeat: isHovered ? Infinity : 0,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `linear-gradient(90deg, transparent, ${glowColor === 'blue' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(168, 85, 247, 0.5)'}, transparent)`,
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Icon */}
        <motion.div
          animate={{
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.5 }}
          className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} mb-6 shadow-lg`}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Features List */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 * (index + 1) }}
              className="flex items-center gap-3 text-gray-300"
            >
              <motion.div
                animate={{
                  scale: isHovered ? [1, 1.2, 1] : 1,
                }}
                transition={{ delay: index * 0.1 }}
                className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </motion.div>
              <span className="text-sm sm:text-base">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r ${gradient} text-white font-semibold flex items-center justify-center gap-2 shadow-lg group-hover:shadow-xl transition-all duration-300`}
        >
          <span>Crear Plan {mode === 'ai' ? 'con IA' : 'Manual'}</span>
          <motion.div
            animate={{
              x: isHovered ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Floating Particles Effect */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                    y: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/60"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

