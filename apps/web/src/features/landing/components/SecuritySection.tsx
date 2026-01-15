'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Users, 
  FileSearch, 
  Lock, 
  Eye, 
  Settings,
  CheckCircle2
} from 'lucide-react';

const securityFeatures = [
  {
    key: 'roles',
    icon: Users,
    color: '#00D4B3',
  },
  {
    key: 'hierarchy',
    icon: Settings,
    color: '#8B5CF6',
  },
  {
    key: 'audit',
    icon: FileSearch,
    color: '#F59E0B',
  },
  {
    key: 'visibility',
    icon: Eye,
    color: '#10B981',
  },
  {
    key: 'encryption',
    icon: Lock,
    color: '#EC4899',
  },
  {
    key: 'sso',
    icon: Shield,
    color: '#0A2540',
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

export function SecuritySection() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      id="security"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-[#E9ECEF]/30 dark:bg-[#0F1419] relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230A2540' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
            className="inline-block px-4 py-2 rounded-full bg-[#0A2540]/10 dark:bg-white/10 text-[#0A2540] dark:text-white text-sm font-medium mb-6"
          >
            {t('landing.security.tag', 'Seguridad Enterprise')}
          </motion.span>

          <h2 className="text-3xl lg:text-5xl font-bold text-[#0A2540] dark:text-white mb-6">
            {t('landing.security.title', 'Gobierno y control que tu organización necesita')}
          </h2>

          <p className="text-lg lg:text-xl text-[#6C757D] dark:text-white/60 max-w-3xl mx-auto">
            {t('landing.security.subtitle', 'Diseñada para cumplir con los estándares de seguridad y trazabilidad más exigentes')}
          </p>
        </motion.div>

        {/* Security Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {securityFeatures.map((feature) => (
            <motion.div
              key={feature.key}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group p-6 lg:p-8 rounded-2xl bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/50 dark:hover:border-[#00D4B3]/50 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300"
            >
              {/* Icon */}
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon size={28} style={{ color: feature.color }} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-3">
                {t(`landing.security.features.${feature.key}.title`, feature.key)}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#6C757D] dark:text-white/60 mb-4">
                {t(`landing.security.features.${feature.key}.description`, '')}
              </p>

              {/* Checkmarks */}
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#6C757D] dark:text-white/50">
                    <CheckCircle2 size={14} className="text-[#10B981] flex-shrink-0" />
                    <span>
                      {t(`landing.security.features.${feature.key}.check${i}`, '')}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enterprise Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 lg:mt-16 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-white/10 shadow-lg">
            <Shield className="text-[#00D4B3]" size={24} />
            <span className="text-sm font-medium text-[#0A2540] dark:text-white">
              {t('landing.security.badge', 'Enterprise-ready desde el día uno')}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
