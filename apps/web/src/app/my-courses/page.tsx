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
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  Target,
  TrendingDown
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { t } = useTranslation('my-courses');

  // Traducir contenido de cursos desde la BD
  // Necesitamos adaptar los datos para el hook que espera 'id' y campos específicos
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

  // Mapear traducciones de vuelta a los cursos
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

  const filteredCourses = translatedCourses.filter(course => {
    const matchesSearch = course.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'completed') return matchesSearch && course.progress_percentage >= 100;
    if (filterStatus === 'in_progress') return matchesSearch && course.progress_percentage > 0 && course.progress_percentage < 100;
    if (filterStatus === 'not_started') return matchesSearch && course.progress_percentage === 0;

    return matchesSearch;
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'advanced': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-[#00D4B3] bg-[#00D4B3]/10 border-[#00D4B3]/30';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-[#00D4B3] to-[#00b89a]';
    if (progress > 0) return 'from-[#0A2540] to-[#00D4B3]';
    return 'from-gray-500 to-gray-600';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const key = difficulty?.toLowerCase();
    if (key === 'beginner') return t('difficulty.beginner');
    if (key === 'intermediate') return t('difficulty.intermediate');
    if (key === 'advanced') return t('difficulty.advanced');
    return difficulty;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#00D4B3]/30 border-t-[#00D4B3] rounded-full mx-auto mb-4"
          />
          <p className="text-gray-700 dark:text-white/70 text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3]">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('header.title')}</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">{t('header.subtitle')}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-[#0A2540]/50 dark:hover:border-[#0A2540]/50 transition-colors shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-600 dark:text-slate-400 text-sm">{t('stats.totalCourses')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_courses}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 dark:hover:border-green-500/50 transition-colors shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-600 dark:text-slate-400 text-sm">{t('stats.completed')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed_courses}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-[#0A2540]/50 dark:hover:border-[#0A2540]/50 transition-colors shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00D4B3]/20">
                <TrendingUp className="w-5 h-5 text-[#00D4B3]" />
              </div>
              <span className="text-gray-600 dark:text-slate-400 text-sm">{t('stats.inProgress')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.in_progress_courses}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-colors shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-gray-600 dark:text-slate-400 text-sm">{t('stats.totalTime')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatDuration(stats.total_time_minutes)}</p>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 dark:focus:border-blue-500/50 transition-colors shadow-lg dark:shadow-xl"
            />
          </div>

          <label htmlFor="filter-status" className="sr-only">
            {t('filters.all')}
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            title={t('filters.all')}
            aria-label={t('filters.all')}
            className="px-4 py-3 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 dark:focus:border-blue-500/50 transition-colors shadow-lg dark:shadow-xl"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="in_progress">{t('filters.inProgress')}</option>
            <option value="completed">{t('filters.completed')}</option>
            <option value="not_started">{t('filters.notStarted')}</option>
          </select>
        </motion.div>

        {/* Courses Grid */}
        <AnimatePresence mode="wait">
          {filteredCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-12 h-12 text-gray-400 dark:text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('empty.title')}</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">{t('empty.subtitle')}</p>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="gradient"
              >
                {t('empty.exploreButton')}
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 justify-items-center">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.purchase_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-800/60 border border-gray-100/70 dark:border-slate-700/60 rounded-[1.5rem] overflow-hidden hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all duration-300 group shadow-[0_20px_60px_rgba(15,20,40,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col h-full w-full max-w-[420px]"
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-[#0A2540]/15 to-[#00D4B3]/15 overflow-hidden">
                    {course.course_thumbnail ? (
                      <img
                        src={course.course_thumbnail}
                        alt={course.course_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <BookOpen className="w-16 h-16 text-blue-400/50 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-slate-500">{t('course.imagePlaceholder')}</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />

                    {/* Progress Overlay */}
                    {course.progress_percentage > 0 && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 dark:bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
                        {t('course.completedBadge', { percentage: course.progress_percentage })}
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    {/* Category & Difficulty */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {course.course_category}
                      </span>
                      {course.difficulty && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(course.difficulty)}`}>
                          {getDifficultyLabel(course.difficulty)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.course_title}
                    </h3>

                    {/* Instructor */}
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      {t('course.instructor', { name: course.instructor_name })}
                    </p>

                    {/* Progress Bar */}
                    {course.progress_percentage > 0 && (
                      <div className="mb-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-slate-400">{t('course.progress')}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{course.progress_percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress_percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${getProgressColor(course.progress_percentage)}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.course_duration_minutes)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto pt-1">
                      <Button
                        onClick={() => router.push(`/courses/${course.course_slug}`)}
                        variant="gradient"
                        className="flex-1 group/btn h-12 rounded-xl shadow-[0_10px_25px_rgba(37,99,235,0.25)]"
                      >
                        <Play className="w-4 h-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                        {course.progress_percentage > 0 ? t('course.continueButton') : t('course.startButton')}
                      </Button>

                      {course.progress_percentage === 100 && (
                        <div className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-medium">{t('course.completedStatus')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

