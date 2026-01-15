'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqItems = [
  { key: 'roi' },
  { key: 'implementation' },
  { key: 'integration' },
  { key: 'governance' },
  { key: 'multilingual' },
  { key: 'certificates' },
  { key: 'whitelabel' },
  { key: 'adoption' },
];

interface FAQItemProps {
  questionKey: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ questionKey, isOpen, onToggle, index }: FAQItemProps) {
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-[#E9ECEF] dark:border-white/10 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between gap-4 text-left group"
      >
        <span className="text-base lg:text-lg font-medium text-[#0A2540] dark:text-white group-hover:text-[#00D4B3] transition-colors">
          {t(`landing.faq.items.${questionKey}.question`, questionKey)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E9ECEF] dark:bg-white/10 flex items-center justify-center"
        >
          <ChevronDown 
            size={18} 
            className={`transition-colors ${isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D]'}`}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[#6C757D] dark:text-white/60 leading-relaxed">
              {t(`landing.faq.items.${questionKey}.answer`, '')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  const { t } = useTranslation('common');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      id="faq"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-white dark:bg-[#1E2329]"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block px-4 py-2 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-sm font-medium mb-6"
            >
              {t('landing.faq.tag', 'Preguntas Frecuentes')}
            </motion.span>

            <h2 className="text-3xl lg:text-5xl font-bold text-[#0A2540] dark:text-white mb-6 leading-tight">
              {t('landing.faq.title', 'Respuestas a las preguntas que importan')}
            </h2>

            <p className="text-lg text-[#6C757D] dark:text-white/60 mb-8">
              {t('landing.faq.subtitle', 'Todo lo que necesitas saber para tomar una decisión informada.')}
            </p>

            {/* Help Icon */}
            <div className="hidden lg:flex items-center gap-4 p-6 rounded-2xl bg-[#E9ECEF]/50 dark:bg-white/5 border border-[#E9ECEF] dark:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-[#00D4B3]/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle size={24} className="text-[#00D4B3]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0A2540] dark:text-white mb-1">
                  {t('landing.faq.help.title', '¿Tienes más preguntas?')}
                </p>
                <p className="text-sm text-[#6C757D] dark:text-white/60">
                  {t('landing.faq.help.description', 'Agenda una demo y resolvemos todas tus dudas.')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: FAQ Items */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#E9ECEF]/20 dark:bg-white/5 rounded-2xl p-6 lg:p-8 border border-[#E9ECEF] dark:border-white/10"
          >
            {faqItems.map((item, index) => (
              <FAQItem
                key={item.key}
                questionKey={item.key}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                index={index}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
