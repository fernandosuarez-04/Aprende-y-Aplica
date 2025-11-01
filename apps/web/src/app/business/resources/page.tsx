'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../shared/utils/animations';
import { BookOpen, FileText, Video, Trophy, Download, ArrowRight } from 'lucide-react';

export default function ResourcesPage() {
  const resourceCategories = [
    {
      id: 'articles',
      name: 'Artículos',
      icon: FileText,
      count: 45,
      description: 'Insights y mejores prácticas'
    },
    {
      id: 'guides',
      name: 'Guías',
      icon: BookOpen,
      count: 18,
      description: 'Descargables y whitepapers'
    },
    {
      id: 'webinars',
      name: 'Webinars',
      icon: Video,
      count: 32,
      description: 'Grabaciones y próximos eventos'
    },
    {
      id: 'case-studies',
      name: 'Casos de Éxito',
      icon: Trophy,
      count: 25,
      description: 'Historias de transformación'
    }
  ];

  return (
    <main className="min-h-screen bg-carbon">
      {/* Hero Section */}
      <section className="py-32 pt-40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h1
              className="text-5xl lg:text-6xl font-bold mb-6"
              variants={slideUp}
            >
              Recursos
            </motion.h1>
            <motion.p
              className="text-xl max-w-3xl mx-auto opacity-80"
              variants={fadeIn}
            >
              Aprende de los mejores y accede a contenido exclusivo
            </motion.p>
          </motion.div>

          {/* Resource Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {resourceCategories.map((category, idx) => {
              const IconComponent = category.icon;
              return (
                <motion.div
                  key={category.id}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="bg-glass border border-glass-light rounded-2xl p-8 cursor-pointer hover:border-primary/50 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{category.count}+</div>
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-text-secondary">{category.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-24 bg-carbon/30">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            Recursos Destacados
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Guía completa de IA generativa para empresas',
                type: 'Guía',
                description: 'Todo lo que necesitas saber para implementar IA en tu organización'
              },
              {
                title: '5 estrategias para aumentar la retención de empleados',
                type: 'Artículo',
                description: 'Mejores prácticas validadas por cientos de empresas'
              },
              {
                title: 'Webinar: Transformación digital en 2024',
                type: 'Webinar',
                description: 'Casos de éxito reales y roadmap práctico'
              }
            ].map((resource, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-glass border border-glass-light rounded-2xl p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="text-xs font-bold text-primary mb-3">{resource.type}</div>
                <h3 className="text-xl font-bold mb-3">{resource.title}</h3>
                <p className="text-sm text-text-secondary mb-4">{resource.description}</p>
                <div className="flex items-center text-primary text-sm font-medium group cursor-pointer">
                  Ver más
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Download className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">
              Recibe recursos exclusivos
            </h2>
            <p className="text-xl mb-8 opacity-80">
              Suscríbete a nuestro newsletter y accede a contenido premium mensual
            </p>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 px-4 py-3 rounded-lg bg-carbon border border-glass-light focus:outline-none focus:border-primary"
              />
              <button className="px-8 py-3 bg-primary hover:bg-primary/80 rounded-lg font-semibold transition-colors">
                Suscribirse
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

