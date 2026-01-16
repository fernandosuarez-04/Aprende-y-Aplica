'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Calendar, 
  BarChart3, 
  Users2, 
  Award, 
  Palette, 
  FileCode, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const capabilities = [
  {
    key: 'lia',
    icon: Bot,
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#10B981]',
  },
  {
    key: 'studyPlanner',
    icon: Calendar,
    color: '#0A2540',
    gradient: 'from-[#0A2540] to-[#1E3A5F]',
  },
  {
    key: 'analytics',
    icon: BarChart3,
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#EF4444]',
  },
  {
    key: 'teams',
    icon: Users2,
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#00D4B3]',
  },
  {
    key: 'certificates',
    icon: Award,
    color: '#8B5CF6',
    gradient: 'from-[#8B5CF6] to-[#6366F1]',
  },
  {
    key: 'whiteLabel',
    icon: Palette,
    color: '#EC4899',
    gradient: 'from-[#EC4899] to-[#F43F5E]',
  },
  {
    key: 'scorm',
    icon: FileCode,
    color: '#06B6D4',
    gradient: 'from-[#06B6D4] to-[#0EA5E9]',
  },
  {
    key: 'community',
    icon: MessageSquare,
    color: '#14B8A6',
    gradient: 'from-[#14B8A6] to-[#22C55E]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function CapabilitiesGrid() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      id="capabilities"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-[#E9ECEF]/20 dark:bg-[#0F1419] relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #0A2540 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block px-4 py-2 rounded-full bg-[#00D4B3]/10 text-[#00D4B3] text-sm font-medium mb-6"
          >
            {t('landing.capabilities.tag', 'Capacidades')}
          </motion.span>
          
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0A2540] dark:text-white mb-6">
            {t('landing.capabilities.title', 'Todo lo que necesitas para capacitar a tu equipo')}
          </h2>
          
          <p className="text-lg lg:text-xl text-[#6C757D] dark:text-white/60 max-w-3xl mx-auto">
            {t('landing.capabilities.subtitle', 'Cada funcionalidad está diseñada para generar impacto medible en tu organización')}
          </p>
        </motion.div>

        {/* Capabilities Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {capabilities.map((cap) => (
            <motion.div
              key={cap.key}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/30 hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${cap.color}15` }}
              >
                <cap.icon 
                  size={28} 
                  style={{ color: cap.color }}
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-2">
                {t(`landing.capabilities.items.${cap.key}.title`, cap.key)}
              </h3>
              
              <p className="text-sm text-[#6C757D] dark:text-white/60 mb-3">
                {t(`landing.capabilities.items.${cap.key}.benefit`, '')}
              </p>
              
              <p className="text-xs text-[#00D4B3] font-medium">
                {t(`landing.capabilities.items.${cap.key}.result`, '')}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
