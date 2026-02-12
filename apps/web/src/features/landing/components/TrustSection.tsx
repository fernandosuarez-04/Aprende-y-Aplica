'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Globe2, 
  ShieldCheck, 
  Award, 
  Users, 
  BarChart3, 
  FileCheck 
} from 'lucide-react';

const trustBadges = [
  {
    icon: Globe2,
    key: 'multilingual',
    color: '#00D4B3',
  },
  {
    icon: FileCheck,
    key: 'scorm',
    color: '#10B981',
  },
  {
    icon: Award,
    key: 'certificates',
    color: '#F59E0B',
  },
  {
    icon: Users,
    key: 'roles',
    color: '#0A2540',
  },
  {
    icon: BarChart3,
    key: 'analytics',
    color: '#00D4B3',
  },
  {
    icon: ShieldCheck,
    key: 'security',
    color: '#10B981',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function TrustSection() {
  const { t } = useTranslation('common');

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-[#1E2329]">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-4">
            {t('landing.trust.title', 'Enterprise-ready desde el día uno')}
          </h2>
          <p className="text-lg text-[#6C757D] dark:text-white/60 max-w-2xl mx-auto">
            {t('landing.trust.subtitle', 'Diseñada para cumplir con los estándares más exigentes de capacitación corporativa')}
          </p>
        </motion.div>

        {/* Trust Badges Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6"
        >
          {trustBadges.map((badge) => (
            <motion.div
              key={badge.key}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative p-6 rounded-2xl bg-[#E9ECEF]/30 dark:bg-white/5 border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/50 dark:hover:border-[#00D4B3]/50 transition-all duration-300"
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${badge.color}15` }}
              >
                <badge.icon 
                  size={24} 
                  style={{ color: badge.color }}
                />
              </div>

              {/* Label */}
              <h3 className="text-sm font-semibold text-[#0A2540] dark:text-white mb-1">
                {t(`landing.trust.badges.${badge.key}.title`, badge.key)}
              </h3>
              <p className="text-xs text-[#6C757D] dark:text-white/50">
                {t(`landing.trust.badges.${badge.key}.description`, '')}
              </p>

              {/* Hover Glow */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${badge.color}10, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-16"
        >
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-[#00D4B3]">3</p>
            <p className="text-sm text-[#6C757D] dark:text-white/50">
              {t('landing.trust.stats.languages', 'Idiomas')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-[#00D4B3]">SCORM</p>
            <p className="text-sm text-[#6C757D] dark:text-white/50">
              {t('landing.trust.stats.compatible', 'Compatible')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-[#00D4B3]">24/7</p>
            <p className="text-sm text-[#6C757D] dark:text-white/50">
              {t('landing.trust.stats.SofLIA', 'Asistente SofLIA')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-[#00D4B3]">SHA-256</p>
            <p className="text-sm text-[#6C757D] dark:text-white/50">
              {t('landing.trust.stats.hash', 'Certificados')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
