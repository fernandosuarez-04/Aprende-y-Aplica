'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '../../../../../shared/utils/animations';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  subtitle: string;
  faqs: FAQ[];
  category: 'companies' | 'instructors';
}

export function FAQSection({ title, subtitle, faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden bg-carbon/30">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div
            className="flex justify-center mb-4"
            variants={fadeIn}
          >
            <HelpCircle className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.h2
            className="text-4xl lg:text-5xl font-bold mb-6"
            variants={fadeIn}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-xl max-w-3xl mx-auto"
            variants={fadeIn}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="mb-4"
            >
              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-glass border border-glass-light rounded-xl p-6 text-left hover:border-primary/50 transition-all duration-300 group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-lg pr-8 group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{
                      rotate: openIndex === index ? 180 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-6 h-6 text-primary flex-shrink-0" />
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-text-secondary leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

