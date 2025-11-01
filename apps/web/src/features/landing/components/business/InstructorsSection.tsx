'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Badge } from '@aprende-y-aplica/ui';
import { Instructor } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../../shared/utils/animations';
import { Star, Users, GraduationCap } from 'lucide-react';

interface InstructorsSectionProps {
  title: string;
  subtitle: string;
  instructors: Instructor[];
}

export function InstructorsSection({ title, subtitle, instructors }: InstructorsSectionProps) {
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

        {/* Instructors Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {instructors.map((instructor, index) => (
            <motion.div
              key={instructor.id}
              variants={staggerItem}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="glassmorphism" className="h-full cursor-pointer group">
                <CardContent className="p-8">
                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold text-3xl">
                        {instructor.avatar ? (
                          <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          instructor.name.split(' ').map(name => name[0]).join('')
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold mb-1">{instructor.name}</h3>
                    <p className="text-sm opacity-70">{instructor.role}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-center mb-6 min-h-[60px]">{instructor.bio}</p>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">{instructor.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{instructor.students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span className="font-semibold">{instructor.courses}</span>
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {instructor.expertise.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

