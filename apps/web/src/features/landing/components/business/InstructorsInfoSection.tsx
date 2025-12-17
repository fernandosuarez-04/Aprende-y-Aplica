'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Badge, Button } from '@aprende-y-aplica/ui';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { DollarSign, BarChart3, Wrench, GraduationCap, Check, ArrowRight, Calculator } from 'lucide-react';

interface InstructorsInfoSectionProps {
  title: string;
  subtitle: string;
  cards: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  benefits: string[];
  process: {
    title: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  };
}

export function InstructorsInfoSection({ title, subtitle, cards, benefits, process }: InstructorsInfoSectionProps) {
  const [courses, setCourses] = useState(3);
  const [studentsPerCourse, setStudentsPerCourse] = useState(100);
  const [pricePerCourse, setPricePerCourse] = useState(49);
  const commissionRate = 0.8;

  const iconMap: Record<string, React.ComponentType<any>> = {
    DollarSign,
    BarChart: BarChart3,
    Wrench,
    GraduationCap,
  };

  const calculateEarnings = () => {
    const totalStudents = courses * studentsPerCourse;
    const revenue = totalStudents * pricePerCourse;
    const earnings = revenue * commissionRate;
    return { revenue, earnings, totalStudents };
  };

  const { revenue, earnings, totalStudents } = calculateEarnings();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-4xl lg:text-5xl font-bold mb-6"
            variants={slideUp}
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

        {/* Features Cards */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {cards.map((card, index) => {
            const IconComponent = iconMap[card.icon] || GraduationCap;
            return (
              <motion.div
                key={card.id}
                variants={staggerItem}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card variant="glassmorphism" className="h-full cursor-pointer group">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center group-hover:from-primary/40 group-hover:to-success/40 transition-all duration-300">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-center text-sm">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefits */}
        <motion.div
          className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-8 lg:p-12 mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={slideUp}
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Beneficios Exclusivos</h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Earnings Calculator */}
        <motion.div
          className="mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <Card variant="glassmorphism" className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold">Calculadora de Ingresos Potenciales</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Number of Courses */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Número de Cursos
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={courses}
                      onChange={(e) => setCourses(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-2xl font-bold text-primary w-16 text-right">{courses}</span>
                  </div>
                </div>

                {/* Students per Course */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Estudiantes por Curso
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="50"
                      value={studentsPerCourse}
                      onChange={(e) => setStudentsPerCourse(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-2xl font-bold text-primary w-20 text-right">{studentsPerCourse}</span>
                  </div>
                </div>

                {/* Price per Course */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Precio por Curso
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="9"
                      max="200"
                      step="10"
                      value={pricePerCourse}
                      onChange={(e) => setPricePerCourse(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-2xl font-bold text-primary w-20 text-right">${pricePerCourse}</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <motion.div
                className="grid md:grid-cols-3 gap-6"
                key={`${courses}-${studentsPerCourse}-${pricePerCourse}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-2xl p-6 border border-primary/30">
                  <p className="text-sm opacity-70 mb-2">Ingresos Totales</p>
                  <p className="text-4xl font-bold">${revenue.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-success/20 to-green-600/20 rounded-2xl p-6 border border-success/30">
                  <p className="text-sm opacity-70 mb-2">Tus Ganancias ({Math.round(commissionRate * 100)}%)</p>
                  <p className="text-4xl font-bold text-success">${earnings.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                  <p className="text-sm opacity-70 mb-2">Total Estudiantes</p>
                  <p className="text-4xl font-bold">{totalStudents.toLocaleString()}</p>
                </div>
              </motion.div>

              <motion.div
                className="mt-8 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Button variant="gradient" size="lg" className="group shadow-lg">
                  <span className="flex items-center gap-2">
                    Comienza a Ganar Ahora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h3
            className="text-3xl font-bold mb-12 text-center"
            variants={slideUp}
          >
            {process.title}
          </motion.h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={staggerItem}
                className="relative"
              >
                <Card variant="glassmorphism" className="h-full cursor-pointer group">
                  <CardContent className="p-8">
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {index + 1}
                    </div>

                    {/* Arrow Between Steps */}
                    {index < process.steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                        <ArrowRight className="w-8 h-8 text-primary/30" />
                      </div>
                    )}

                    <h4 className="text-xl font-bold mb-3 mt-4 group-hover:text-primary transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

