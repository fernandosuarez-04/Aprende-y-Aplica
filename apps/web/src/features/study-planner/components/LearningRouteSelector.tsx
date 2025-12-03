'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Check, X, Sparkles } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  slug: string;
  category: string;
  duration_total_minutes: number;
  level: string;
  instructor_name?: string;
}

interface LearningRoute {
  id: string;
  name: string;
  description: string;
  course_count?: number;
}

interface LearningRouteSelectorProps {
  onRouteSelect: (routeId: string | null, courses: Course[]) => void;
  onNewRoute: (name: string, courses: Course[]) => void;
}

export function LearningRouteSelector({ onRouteSelect, onNewRoute }: LearningRouteSelectorProps) {
  const [routes, setRoutes] = useState<LearningRoute[]>([]);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'my-courses' | 'suggested'>('my-courses');
  const [loading, setLoading] = useState(true);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener rutas existentes
      const routesRes = await fetch('/api/study-planner/routes');
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData.routes || []);
      }

      // Obtener cursos del usuario
      const coursesRes = await fetch('/api/my-courses');
      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        console.log('📦 Respuesta cruda de /api/my-courses:', courses);
        console.log('📦 Tipo de respuesta:', Array.isArray(courses) ? 'Array' : typeof courses);
        console.log('📦 Longitud:', Array.isArray(courses) ? courses.length : 'N/A');
        
        // Asegurarse de que courses sea un array
        const coursesArray = Array.isArray(courses) ? courses : [];
        
        if (coursesArray.length === 0) {
          console.warn('⚠️ No se recibieron cursos del endpoint');
          setUserCourses([]);
        } else {
          // Mapear la estructura de respuesta a la estructura esperada
          const mappedCourses = coursesArray.map((course: any) => {
            const mapped = {
              id: course.course_id || course.id,
              title: course.course_title || course.title || 'Sin título',
              description: course.course_description || course.description || '',
              thumbnail_url: course.course_thumbnail || course.thumbnail_url || '',
              slug: course.course_slug || course.slug || '',
              category: course.course_category || course.category || '',
              duration_total_minutes: course.course_duration_minutes || course.duration_total_minutes || 0,
              level: course.difficulty || course.level || 'beginner',
              instructor_name: course.instructor_name || '',
            };
            console.log('🔄 Mapeando curso:', { 
              original: { 
                course_id: course.course_id, 
                course_title: course.course_title,
                id: course.id,
                title: course.title
              }, 
              mapped 
            });
            return mapped;
          }).filter((course: Course) => {
            const isValid = !!(course.id && course.title && course.title !== 'Sin título');
            if (!isValid) {
              console.warn('⚠️ Curso filtrado (inválido):', course);
            }
            return isValid;
          });
          
          console.log('✅ Cursos mapeados finales:', mappedCourses);
          console.log('📊 Total de cursos válidos:', mappedCourses.length);
          setUserCourses(mappedCourses);
        }
      } else {
        const errorText = await coursesRes.text();
        console.error('❌ Error fetching courses:', coursesRes.status, coursesRes.statusText, errorText);
        setUserCourses([]);
      }

      // Obtener cursos sugeridos
      const suggestedRes = await fetch('/api/study-planner/suggested-courses');
      if (suggestedRes.ok) {
        const suggested = await suggestedRes.json();
        setSuggestedCourses(suggested.courses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = async (routeId: string) => {
    try {
      console.log('🔄 Seleccionando ruta:', routeId);
      const res = await fetch(`/api/study-planner/routes/${routeId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error al obtener la ruta:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });
        alert(`Error al cargar la ruta: ${errorData.error || 'Error desconocido'}`);
        return;
      }

      const data = await res.json();
      console.log('✅ Ruta obtenida:', {
        routeId: data.route?.id,
        routeName: data.route?.name,
        coursesCount: data.courses?.length || 0,
        courses: data.courses,
      });

      if (!data.courses || data.courses.length === 0) {
        console.warn('⚠️ La ruta no tiene cursos asociados');
        alert('Esta ruta no tiene cursos asociados. Por favor, selecciona otra ruta o crea una nueva.');
        return;
      }

      setSelectedRoute(routeId);
      setSelectedCourses(data.courses || []);
      onRouteSelect(routeId, data.courses || []);
      
      console.log('✅ Ruta seleccionada correctamente:', {
        routeId,
        coursesCount: data.courses.length,
      });
    } catch (error) {
      console.error('❌ Error fetching route courses:', error);
      alert(`Error al cargar la ruta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleCreateNewRoute = async () => {
    if (!newRouteName.trim()) {
      console.error('❌ Nombre de ruta vacío');
      alert('Por favor, ingresa un nombre para la ruta');
      return;
    }
    
    if (selectedCourses.length === 0) {
      console.error('❌ No hay cursos seleccionados');
      alert('Por favor, selecciona al menos un curso');
      return;
    }

    console.log('🚀 Creando nueva ruta:', {
      name: newRouteName.trim(),
      courses: selectedCourses.length,
      courseIds: selectedCourses.map(c => c.id),
    });

    setIsCreatingRoute(true);
    try {
      // Llamar a la función del padre que creará la ruta
      await onNewRoute(newRouteName.trim(), selectedCourses);
      
      console.log('✅ Ruta creada exitosamente, cerrando modal...');
      
      // Cerrar modal y resetear estado
      setShowNewRouteModal(false);
      setNewRouteName('');
      setSelectedCourses([]);
      setSearchTerm('');
      
      // Recargar rutas
      await fetchData();
    } catch (error) {
      console.error('❌ Error al crear ruta:', error);
      alert(`Error al crear la ruta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsCreatingRoute(false);
    }
  };

  const toggleCourseSelection = (course: Course) => {
    if (selectedCourses.some(c => c.id === course.id)) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const filteredCourses = (activeTab === 'my-courses' ? userCourses : suggestedCourses).filter(
    course => {
      if (!course) {
        console.warn('⚠️ Curso nulo en filtro');
        return false;
      }
      if (!course.title || course.title === 'Sin título') {
        console.warn('⚠️ Curso sin título válido:', course);
        return false;
      }
      if (!searchTerm) return true; // Si no hay búsqueda, mostrar todos
      const matches = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matches) {
        console.log('🔍 Curso no coincide con búsqueda:', course.title, 'vs', searchTerm);
      }
      return matches;
    }
  );

  // Debug: Log para verificar estado
  useEffect(() => {
    console.log('📊 Estado actual del componente:', {
      userCourses: userCourses.length,
      suggestedCourses: suggestedCourses.length,
      activeTab,
      searchTerm,
      filteredCourses: filteredCourses.length,
      userCoursesData: userCourses,
      filteredCoursesData: filteredCourses,
    });
  }, [userCourses, suggestedCourses, activeTab, searchTerm, filteredCourses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <BookOpen className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Ruta de Aprendizaje</h2>
          <p className="text-gray-400 text-sm mt-1">
            Selecciona una ruta existente o crea una nueva con tus cursos
          </p>
        </div>
      </div>

      {/* Rutas existentes */}
      {routes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Mis Rutas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <motion.button
                key={route.id}
                onClick={() => handleRouteSelect(route.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRoute === route.id
                    ? 'bg-blue-500/20 border-blue-400'
                    : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  {selectedRoute === route.id && (
                    <Check className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <h4 className="font-semibold text-white mb-1">{route.name}</h4>
                {route.course_count !== undefined && (
                  <p className="text-sm text-gray-400">{route.course_count} cursos</p>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Botón crear nueva ruta */}
      <motion.button
        onClick={() => {
          console.log('🔄 Abriendo modal, cursos actuales:', userCourses.length);
          setShowNewRouteModal(true);
          // Resetear selección y búsqueda al abrir
          setSelectedCourses([]);
          setSearchTerm('');
          setActiveTab('my-courses');
        }}
        className="w-full p-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-400 bg-slate-700/30 transition-all mb-8"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-center gap-3">
          <Plus className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">Crear nueva ruta</span>
        </div>
      </motion.button>

      {/* Modal crear nueva ruta */}
      <AnimatePresence>
        {showNewRouteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewRouteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Nueva ruta de aprendizaje</h3>
                <button
                  onClick={() => setShowNewRouteModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Nombre de la ruta */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRouteName.trim() && selectedCourses.length > 0) {
                      e.preventDefault();
                      handleCreateNewRoute();
                    }
                  }}
                  placeholder="Mi ruta personalizada"
                  maxLength={40}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{newRouteName.length}/40</p>
              </div>

              {/* Tabs para cursos */}
              <div className="flex gap-2 mb-4 border-b border-slate-700">
                <button
                  onClick={() => setActiveTab('my-courses')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'my-courses'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Mis Cursos ({userCourses.length})
                </button>
                <button
                  onClick={() => setActiveTab('suggested')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'suggested'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Sugeridos ({suggestedCourses.length})
                  </div>
                </button>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar cursos..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Lista de cursos */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">No se encontraron cursos</p>
                    {activeTab === 'my-courses' && userCourses.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No tienes cursos comprados aún
                      </p>
                    )}
                    {activeTab === 'my-courses' && userCourses.length > 0 && filteredCourses.length === 0 && searchTerm && (
                      <p className="text-xs text-gray-500">
                        No hay cursos que coincidan con "{searchTerm}"
                      </p>
                    )}
                    {activeTab === 'my-courses' && userCourses.length > 0 && filteredCourses.length === 0 && !searchTerm && (
                      <p className="text-xs text-gray-500">
                        Hay {userCourses.length} curso(s) disponible(s) pero no se están mostrando. Revisa la consola para más detalles.
                      </p>
                    )}
                  </div>
                ) : (
                  filteredCourses.map((course) => {
                    const isSelected = selectedCourses.some(c => c.id === course.id);
                    return (
                      <motion.button
                        key={course.id}
                        onClick={() => toggleCourseSelection(course)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-400'
                            : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start gap-4">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-white text-sm">{course.title}</h4>
                              {isSelected && (
                                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{course.category}</span>
                              <span>•</span>
                              <span>{course.duration_total_minutes} min</span>
                              <span>•</span>
                              <span className="capitalize">{course.level}</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="text-sm text-gray-400">
                  {selectedCourses.length} curso{selectedCourses.length !== 1 ? 's' : ''} seleccionado{selectedCourses.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewRouteModal(false)}
                    className="px-6 py-2 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewRoute}
                    disabled={!newRouteName.trim() || selectedCourses.length === 0 || isCreatingRoute}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                      newRouteName.trim() && selectedCourses.length > 0 && !isCreatingRoute
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg'
                        : 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isCreatingRoute ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </span>
                    ) : (
                      'Crear'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

