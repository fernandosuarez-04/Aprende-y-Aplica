'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  Play, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  slug: string;
  category: string;
  duration_total_minutes: number;
  level: string;
}

interface Route {
  id: string;
  name: string;
  description: string;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<Route | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      fetchRouteData();
    }
  }, [routeId]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/study-planner/routes/${routeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ruta no encontrada');
        }
        throw new Error('Error al cargar la ruta');
      }

      const data = await response.json();
      setRoute(data.route);
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (slug: string) => {
    router.push(`/courses/${slug}`);
  };

  const calculateTotalDuration = () => {
    return courses.reduce((total, course) => total + (course.duration_total_minutes || 0), 0);
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
      case 'avanzado':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando ruta de aprendizaje...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-300 mb-6">{error || 'Ruta no encontrada'}</p>
          <button
            onClick={() => router.push('/study-planner/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalHours = Math.round(calculateTotalDuration() / 60 * 10) / 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{route.name}</h1>
                    {route.description && (
                      <p className="text-slate-300 mt-2">{route.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-300">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">
                      <span className="text-white font-semibold">{courses.length}</span> curso{courses.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">
                      <span className="text-white font-semibold">{totalHours}h</span> total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cursos */}
        {courses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Cursos en esta ruta ({courses.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col h-full"
                  onClick={() => handleViewCourse(course.slug)}
                >
                  {/* Thumbnail */}
                  <div className="mb-4 relative overflow-hidden rounded-lg flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-semibold">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content - flex-grow para ocupar espacio disponible */}
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-slate-300 text-sm mb-4 line-clamp-2 flex-grow">
                        {course.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getLevelColor(course.level)}`}>
                        {getLevelLabel(course.level)}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration_total_minutes || 0} min
                      </span>
                      {course.category && (
                        <span className="text-slate-400 text-xs">
                          {course.category}
                        </span>
                      )}
                    </div>

                    {/* Action button - mt-auto para empujarlo hacia abajo */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCourse(course.slug);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium mt-auto"
                    >
                      <Play className="w-4 h-4" />
                      Ver curso
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center"
          >
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No hay cursos en esta ruta
            </h3>
            <p className="text-slate-300 mb-6">
              Esta ruta de aprendizaje aún no tiene cursos asignados
            </p>
            <button
              onClick={() => router.push('/study-planner/dashboard')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

