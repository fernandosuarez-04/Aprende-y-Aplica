'use client';

import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper, 
  Star, 
  Heart,
  User,
  LogOut,
  Settings,
  Bell,
  Loader2,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCourses } from '../../features/courses/hooks/useCourses';
import { useFavorites } from '../../features/courses/hooks/useFavorites';
import { useCategories } from '../../features/courses/hooks/useCategories';
import { UserDropdown } from '../../core/components/UserDropdown';
import { useRouter } from 'next/navigation';
import { useShoppingCartStore } from '../../core/stores/shoppingCartStore';

// 🚀 Lazy Loading - AIChatAgent pesado
const AIChatAgent = lazy(() => import('../../core/components/AIChatAgent/AIChatAgent').then(m => ({ default: m.AIChatAgent })));

// Los talleres ahora se obtienen únicamente de la API

// Las categorías ahora se obtienen dinámicamente desde la base de datos

const navigationItems = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen, active: true },
  { id: 'directory', name: 'Directorio IA', icon: Brain, active: false },
  { id: 'community', name: 'Comunidad', icon: Users, active: false },
  { id: 'news', name: 'Noticias', icon: Newspaper, active: false },
];

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('workshops');
  const { user, loading } = useAuth();
  const router = useRouter();
  const { 
    courses, 
    loading: coursesLoading, 
    error: coursesError, 
    filteredCourses, 
    setFilter, 
    activeFilter,
    setFavorites
  } = useCourses();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { addItem } = useShoppingCartStore();

  // Sincronizar favoritos entre hooks
  React.useEffect(() => {
    setFavorites(favorites);
  }, [favorites, setFavorites]);


  const handleToggleFavorite = async (courseId: string) => {
    try {
      await toggleFavorite(courseId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Mostrar mensaje de error al usuario si es necesario
      if (error instanceof Error && error.message.includes('Variables de entorno')) {
        alert('Error: Supabase no está configurado. Por favor, configura las variables de entorno.');
      }
    }
  };

  const handleNavigation = (itemId: string) => {
    if (itemId === 'news') {
      router.push('/news');
    } else {
      setActiveNav(itemId);
    }
  };

  // Usar únicamente datos de la API
  const workshops = filteredCourses.map(course => {
    // Debug: verificar que se esté obteniendo la imagen y el status
    console.log(`Curso: ${course.title}, Thumbnail: ${course.thumbnail}, Status: ${course.status}`);
    
    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor_name || 'Instructor',
      rating: course.rating || 4.5,
      price: course.price || 'MX$0',
      status: course.status || 'Disponible', // Usar el status del curso desde la API
      image: course.thumbnail || null, // Usar null en lugar de placeholder para detectar si hay imagen
      category: course.category || 'General',
      isFavorite: isFavorite(course.id), // Usar el hook de favoritos
    };
  });

  // Mostrar loading mientras se obtienen los datos del usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-white">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          {/* Loading state for categories */}
          {categoriesLoading && (
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-full bg-gray-200 dark:bg-carbon-700 animate-pulse"
                >
                  <div className="w-16 h-4 bg-gray-300 dark:bg-carbon-600 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error state for categories */}
          {categoriesError && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-400 text-sm">!</span>
                </div>
                <div>
                  <h3 className="text-yellow-600 dark:text-yellow-400 font-medium">Error al cargar categorías</h3>
                  <p className="text-yellow-700 dark:text-yellow-300/70 text-sm">Usando categorías por defecto</p>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {!categoriesLoading && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === category.id
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workshops Grid */}
          <div className="lg:col-span-2">
            {/* Loading State */}
            {coursesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-text-secondary">Cargando cursos...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {coursesError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-sm">!</span>
                  </div>
                  <div>
                    <h3 className="text-red-600 dark:text-red-400 font-medium">Error al cargar cursos</h3>
                    <p className="text-red-700 dark:text-red-300/70 text-sm">{coursesError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {!coursesLoading && !coursesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workshops.map((workshop) => (
                <motion.div
                  key={workshop.id}
                  className="flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors shadow-lg dark:shadow-none h-full"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Workshop Image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {workshop.image ? (
                      <img
                        src={workshop.image}
                        alt={workshop.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si la imagen falla al cargar, mostrar el placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Placeholder cuando no hay imagen o falla al cargar */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center ${
                        workshop.image ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-text-secondary">APRENDE Y APLICA IA®</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleFavorite(workshop.id)}
                      className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-carbon-800/80 rounded-full hover:bg-gray-100 dark:hover:bg-carbon-700 transition-colors z-10"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          workshop.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-text-secondary'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Workshop Info */}
                  <div className="flex flex-col flex-1 p-6 bg-white dark:bg-slate-800">
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 min-h-[3.5rem] line-clamp-2">
                        {workshop.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 min-h-[1.5rem]">
                        {workshop.instructor}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 h-6">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{workshop.rating}</span>
                        </div>
                        <span className="text-lg font-bold text-primary">{workshop.price}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-auto">
                      {workshop.status === 'Adquirido' ? (
                        // Si el curso está comprado: solo mostrar botón "Ir al curso"
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const course = courses.find(c => c.id === workshop.id);
                            if (course?.slug) {
                              router.push(`/courses/${course.slug}/learn`);
                            }
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Ir al curso
                        </Button>
                      ) : (
                        // Si el curso NO está comprado: mostrar "Ver detalles" y "Agregar al carrito"
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const course = courses.find(c => c.id === workshop.id);
                              if (course?.slug) {
                                router.push(`/courses/${course.slug}`);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const course = courses.find(c => c.id === workshop.id);
                              if (course) {
                                // Extraer precio numérico del string (ej: "MX$1500" -> 1500)
                                const priceString = workshop.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0';
                                const price = parseFloat(priceString);
                                
                                addItem({
                                  id: `course-${course.id}`,
                                  itemType: 'course',
                                  itemId: course.id,
                                  title: workshop.title,
                                  price: price || 0,
                                  thumbnail: workshop.image || course.thumbnail || undefined,
                                });
                              }
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Agregar al carrito
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!coursesLoading && !coursesError && workshops.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-600 dark:text-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-text-primary mb-2">
                  No hay cursos disponibles
                </h3>
                <p className="text-gray-600 dark:text-text-secondary">
                  {activeFilter === 'favorites' 
                    ? 'No tienes cursos favoritos aún'
                    : activeFilter === 'all'
                    ? 'No hay cursos en la plataforma'
                    : `No hay cursos en la categoría ${activeFilter}`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Workshops */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Talleres Destacados
              </h3>
              <Button variant="primary" className="w-full">
                Ver talleres destacados
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tu Progreso
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Talleres Completados</span>
                  <span className="text-primary font-semibold">
                    {courses.filter(course => course.status === 'Completado').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">En Progreso</span>
                  <span className="text-primary font-semibold">
                    {courses.filter(course => course.status === 'En Progreso').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Favoritos</span>
                  <span className="text-primary font-semibold">
                    {favorites.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {courses.filter(course => course.status === 'Completado').length > 0 ? (
                  courses
                    .filter(course => course.status === 'Completado')
                    .slice(0, 2)
                    .map((course) => (
                      <div key={course.id} className="text-sm text-gray-600 dark:text-gray-300">
                        <p>Completaste "{course.title}"</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Recientemente</p>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>No hay actividad reciente</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comienza un curso para ver tu progreso</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Agent - Lazy loaded */}
      <Suspense fallback={null}>
        <AIChatAgent
          assistantName="Lia"
          initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con información sobre talleres, cursos y contenido educativo. ¿En qué puedo asistirte hoy?"
          promptPlaceholder="Pregunta sobre talleres, cursos..."
          context="workshops"
        />
      </Suspense>
    </div>
  );
}
