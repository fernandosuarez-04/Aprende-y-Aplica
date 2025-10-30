'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Star, 
  BookOpen, 
  Play,
  Heart,
  Share2,
  CheckCircle,
  Award,
  Users,
  Calendar
} from 'lucide-react';
import { CourseService, CourseWithInstructor } from '../../../features/courses/services/course.service';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [course, setCourse] = useState<CourseWithInstructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${slug}`);
        
        if (!response.ok) {
          throw new Error('Curso no encontrado');
        }
        
        const courseData = await response.json();
        setCourse(courseData);
        setIsFavorite(courseData.isFavorite || false);
      } catch (err) {
        setError('Error al cargar el curso');
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    }

    async function checkPurchase() {
      try {
        setCheckingPurchase(true);
        const response = await fetch(`/api/courses/${slug}/check-purchase`);
        
        if (response.ok) {
          const data = await response.json();
          setIsPurchased(data.isPurchased);
        }
      } catch (err) {
        console.error('Error checking purchase:', err);
      } finally {
        setCheckingPurchase(false);
      }
    }

    if (slug) {
      loadCourse();
      checkPurchase();
    }
  }, [slug]);

  const handlePurchase = async () => {
    if (!course) return;
    
    setIsPurchasing(true);
    try {
      const response = await fetch(`/api/courses/${slug}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al adquirir el curso');
      }

      // Mostrar mensaje de éxito
      alert(`¡Curso "${data.data.course_title}" adquirido exitosamente! 🎉`);
      
      // Actualizar el estado de compra
      setIsPurchased(true);
      
    } catch (error) {
      console.error('Error purchasing course:', error);
      alert(error instanceof Error ? error.message : 'Error al adquirir el curso');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Aquí iría la lógica para guardar en favoritos
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return 'General';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-8">{error || 'No se pudo cargar el curso'}</p>
          <button 
            onClick={() => router.back()} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header con navegación mejorado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-slate-800/90 via-purple-900/20 to-slate-800/90 backdrop-blur-md border-b border-slate-700/50 -mt-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              
              {/* Icono de empresa y nombre del curso */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <img 
                    src="/icono.png" 
                    alt="Aprende y Aplica" 
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-6 h-6 bg-white rounded flex items-center justify-center"><span class="text-blue-600 font-bold text-xs">A&A</span></div>';
                      }
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">{course.title}</h1>
                  <p className="text-xs text-slate-400">Taller de Aprende y Aplica</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50"
            >
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/50">Imagen del curso</p>
                  </div>
                )}
              </div>
              
              {/* Overlay con información */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(course.difficulty)}`}>
                    {getDifficultyText(course.difficulty)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {course.title}
                </h1>
                <div className="flex items-center gap-4 text-white/70">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(course.estimatedDuration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Descripción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                Descripción del Curso
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {course.description}
              </p>
            </motion.div>

            {/* Lo que aprenderás */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-green-400" />
                  Lo que aprenderás
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {course.learning_objectives.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Instructor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-purple-400" />
                Instructor
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{course.instructor_name}</h3>
                  <p className="text-slate-400">{course.instructor_email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.student_count ? `${course.student_count.toLocaleString()}+ estudiantes` : '0 estudiantes'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span>{course.rating ? `${course.rating} (${course.review_count || 0} reseñas)` : 'Sin calificaciones'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="sticky top-24"
            >
              {/* Card de compra */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-white mb-2">{course.price}</div>
                  <div className="text-slate-400">Precio único</div>
                </div>
                
                {isPurchased ? (
                  <button
                    onClick={() => router.push(`/courses/${slug}/learn`)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Ir a Taller
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || checkingPurchase}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isPurchasing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </div>
                    ) : checkingPurchase ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verificando...
                      </div>
                    ) : (
                      'Adquirir Curso'
                    )}
                  </button>
                )}
                
                <div className="mt-4 text-center text-sm text-slate-400">
                  Garantía de 30 días
                </div>
              </div>

              {/* Información del curso */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Información del Curso</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duración</span>
                    <span className="text-white font-medium">{formatDuration(course.estimatedDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nivel</span>
                    <span className="text-white font-medium">{getDifficultyText(course.difficulty)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Categoría</span>
                    <span className="text-white font-medium">{course.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calificación</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="text-white font-medium">{course.rating || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estudiantes</span>
                    <span className="text-white font-medium">{course.student_count ? `${course.student_count.toLocaleString()}+` : '0'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
