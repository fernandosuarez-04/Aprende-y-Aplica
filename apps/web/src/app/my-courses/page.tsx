'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Clock,
  Play,
  Award,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Target,
  Lightbulb,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslatedContent } from '../../core/hoc/withContentTranslation';

interface Course {
  purchase_id: string;
  course_id: string;
  course_title: string;
  course_description: string;
  course_thumbnail: string;
  course_slug: string;
  course_category: string;
  instructor_name: string;
  access_status: string;
  purchased_at: string;
  access_granted_at: string;
  expires_at?: string;
  enrollment_status: string;
  progress_percentage: number;
  last_accessed_at: string;
  course_duration_minutes: number;
  difficulty?: string;
}

interface Stats {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_time_minutes: number;
  average_progress: number;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_courses: 0,
    completed_courses: 0,
    in_progress_courses: 0,
    total_time_minutes: 0,
    average_progress: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation('my-courses');

  // Traducir contenido de cursos desde la BD
  const coursesForTranslation = useMemo(() => {
    return courses.map(course => ({
      id: course.course_id,
      title: course.course_title,
      description: course.course_description,
      ...course
    }));
  }, [courses]);

  const translatedCoursesData = useTranslatedContent(
    'course',
    coursesForTranslation,
    ['title', 'description']
  );

  const translatedCourses = useMemo(() => {
    if (translatedCoursesData.length === 0) return courses;
    return courses.map(course => {
      const translated = translatedCoursesData.find(t => t.id === course.course_id);
      if (translated) {
        return {
          ...course,
          course_title: translated.title || course.course_title,
          course_description: translated.description || course.course_description
        };
      }
      return course;
    });
  }, [courses, translatedCoursesData]);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/my-courses');
      if (!response.ok) throw new Error('Error al cargar cursos');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      // console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/my-courses?stats_only=true');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      // console.error('Error fetching stats:', error);
    }
  };

  // Encontrar el próximo curso recomendado (el que está en progreso o el primero sin comenzar)
  const recommendedCourse = useMemo(() => {
    const inProgress = translatedCourses.find(c => c.progress_percentage > 0 && c.progress_percentage < 100);
    if (inProgress) return inProgress;
    return translatedCourses.find(c => c.progress_percentage === 0) || translatedCourses[0];
  }, [translatedCourses]);

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Intermedio';
    const key = difficulty.toLowerCase();
    if (key === 'beginner') return 'Principiante';
    if (key === 'intermediate') return 'Intermedio';
    if (key === 'advanced') return 'Avanzado';
    return difficulty;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // Calcular progreso semanal (simplificado - usar promedio de progreso)
  const weeklyProgress = Math.round(stats.average_progress || 0);
  
  // Capacidades en foco = cursos en progreso
  const capabilitiesInFocus = stats.in_progress_courses;
  
  // Puntos de habilidad (simplificado - basado en cursos completados * 100)
  const skillPoints = stats.completed_courses * 150 + Math.round(stats.average_progress * stats.in_progress_courses);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#00D4B3]/30 border-t-[#00D4B3] rounded-full mx-auto mb-4"
          />
          <p className="text-[#6C757D] dark:text-white/70 text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] dark:text-white mb-2">
            {t('header.title')}
          </h1>
          <p className="text-[#6C757D] dark:text-white/60 text-lg">
            {t('header.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Columna izquierda - KPIs y Próximo Paso */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPIs Clave */}
            <div>
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-4">
                KPIs Clave
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Progreso Semanal - Verde claro difuminado */}
          <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-100/60 via-green-50/40 to-white rounded-2xl p-6 border border-green-200/30 dark:from-green-900/20 dark:via-green-800/10 dark:to-[#0F1419] dark:border-green-700/20"
                >
                  <h3 className="text-sm font-medium text-[#0A2540] dark:text-white/80 mb-4">
                    Progreso Semanal
                  </h3>
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#E9ECEF"
                        strokeWidth="8"
                        fill="none"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#10B981"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - weeklyProgress / 100) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#10B981]">{weeklyProgress}%</span>
              </div>
            </div>
          </motion.div>

                {/* Capacidades en Foco - Azul claro difuminado */}
          <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-100/60 via-blue-50/40 to-white rounded-2xl p-6 border border-blue-200/30 dark:from-blue-900/20 dark:via-blue-800/10 dark:to-[#0F1419] dark:border-blue-700/20"
                >
                  <h3 className="text-sm font-medium text-[#0A2540] dark:text-white/80 mb-4">
                    Capacidades en Foco
                  </h3>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-blue-500 dark:text-blue-400">
                      {capabilitiesInFocus}
                    </span>
                    <div className="flex justify-center gap-2 mt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
              </div>
            </div>
          </motion.div>

                {/* Puntos de Habilidad - Gris claro */}
          <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-[#E9ECEF] to-gray-100/50 dark:from-[#1E2329] dark:to-[#0F1419] rounded-2xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30"
          >
                  <h3 className="text-sm font-medium text-[#0A2540] dark:text-white/80 mb-4">
                    Puntos de Habilidad
                  </h3>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-[#0A2540] dark:text-white">
                      {skillPoints}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Tu Próximo Paso Recomendado */}
            {recommendedCourse && (
              <div>
                <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-4">
                  Tu Próximo Paso Recomendado
                </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
                  className="relative bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-xl overflow-hidden"
                >
                  {/* Fondo con patrones abstractos */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4B3] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0A2540] rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-4">
                          {recommendedCourse.course_title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-[#6C757D] dark:text-white/60">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">
                              {formatDuration(recommendedCourse.course_duration_minutes)}
                            </span>
              </div>
                          <div className="flex items-center gap-2 text-[#6C757D] dark:text-white/60">
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-medium">
                              {getDifficultyLabel(recommendedCourse.difficulty)}
                            </span>
            </div>
        </div>

                        <p className="text-[#6C757D] dark:text-white/70 mb-6">
                          <strong className="text-[#0A2540] dark:text-white">Objetivo:</strong>{' '}
                          {recommendedCourse.course_description || 'Mejorar tus habilidades en este tema.'}
                        </p>
          </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(`/courses/${recommendedCourse.course_slug}`)}
                        className="px-8 py-4 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Play className="w-5 h-5" />
                        Comenzar
                      </motion.button>
                    </div>
                  </div>
        </motion.div>
              </div>
            )}
          </div>

          {/* Columna derecha - Lista de cursos (opcional o puede ser sidebar) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-4">
              Mis Cursos
            </h2>
            <div className="space-y-4">
              {translatedCourses.slice(0, 5).map((course, index) => (
                <motion.div
                  key={course.purchase_id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => router.push(`/courses/${course.course_slug}`)}
                  className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3] dark:hover:border-[#00D4B3] cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {course.course_thumbnail ? (
                      <img
                        src={course.course_thumbnail}
                        alt={course.course_title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[#00D4B3]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#0A2540] dark:text-white text-sm mb-1 truncate">
                      {course.course_title}
                      </h4>
                    {course.progress_percentage > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-[#E9ECEF] dark:bg-[#6C757D]/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress_percentage}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-[#00D4B3]"
                          />
                        </div>
                          <span className="text-xs text-[#6C757D] dark:text-white/60 mt-1 block">
                            {course.progress_percentage}% completado
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
