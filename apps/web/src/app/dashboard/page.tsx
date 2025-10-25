'use client';

import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCourses } from '../../features/courses/hooks/useCourses';
import { useFavorites } from '../../features/courses/hooks/useFavorites';
import { useCategories } from '../../features/courses/hooks/useCategories';
import { UserDropdown } from '../../core/components/UserDropdown';
import { useRouter } from 'next/navigation';

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
    // Debug: verificar que se esté obteniendo la imagen
    console.log(`Curso: ${course.title}, Thumbnail: ${course.thumbnail}`);
    
    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor_name || 'Instructor',
      rating: course.rating || 4.5,
      price: course.price || 'MX$0',
      status: course.status || 'Disponible',
      image: course.thumbnail || null, // Usar null en lugar de placeholder para detectar si hay imagen
      category: course.category || 'General',
      isFavorite: isFavorite(course.id), // Usar el hook de favoritos
    };
  });

  // Mostrar loading mientras se obtienen los datos del usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-carbon">
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
                  className="px-4 py-2 rounded-full bg-carbon-700 animate-pulse"
                >
                  <div className="w-16 h-4 bg-carbon-600 rounded"></div>
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
                  <h3 className="text-yellow-400 font-medium">Error al cargar categorías</h3>
                  <p className="text-yellow-300/70 text-sm">Usando categorías por defecto</p>
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
                      : 'bg-carbon-700 text-text-secondary hover:bg-carbon-600 hover:text-text-primary'
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
                  <p className="text-text-secondary">Cargando cursos...</p>
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
                    <h3 className="text-red-400 font-medium">Error al cargar cursos</h3>
                    <p className="text-red-300/70 text-sm">{coursesError}</p>
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
                  className="bg-carbon-800 rounded-lg overflow-hidden border border-carbon-700 hover:border-primary/50 transition-colors"
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
                        <p className="text-sm text-text-secondary">APRENDE Y APLICA IA®</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleFavorite(workshop.id)}
                      className="absolute top-3 right-3 p-2 bg-carbon-800/80 rounded-full hover:bg-carbon-700 transition-colors z-10"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          workshop.isFavorite ? 'text-red-500 fill-current' : 'text-text-secondary'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Workshop Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {workshop.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-3">
                      {workshop.instructor}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-text-secondary">{workshop.rating}</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{workshop.price}</span>
                    </div>

                    <Button
                      variant={workshop.status === 'Adquirido' ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (workshop.status === 'Disponible') {
                          // Navegar al slug del curso
                          const course = courses.find(c => c.id === workshop.id);
                          if (course?.slug) {
                            window.location.href = `/courses/${course.slug}`;
                          }
                        }
                      }}
                    >
                      {workshop.status}
                    </Button>
                  </div>
                </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!coursesLoading && !coursesError && workshops.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No hay cursos disponibles
                </h3>
                <p className="text-text-secondary">
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
            <div className="bg-carbon-800 rounded-lg p-6 border border-carbon-700">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Talleres Destacados
              </h3>
              <Button variant="primary" className="w-full">
                Ver talleres destacados
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="bg-carbon-800 rounded-lg p-6 border border-carbon-700">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Tu Progreso
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Talleres Completados</span>
                  <span className="text-primary font-semibold">
                    {courses.filter(course => course.status === 'Completado').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">En Progreso</span>
                  <span className="text-primary font-semibold">
                    {courses.filter(course => course.status === 'En Progreso').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Favoritos</span>
                  <span className="text-primary font-semibold">
                    {favorites.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-carbon-800 rounded-lg p-6 border border-carbon-700">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {courses.filter(course => course.status === 'Completado').length > 0 ? (
                  courses
                    .filter(course => course.status === 'Completado')
                    .slice(0, 2)
                    .map((course) => (
                      <div key={course.id} className="text-sm text-text-secondary">
                        <p>Completaste "{course.title}"</p>
                        <p className="text-xs text-text-tertiary">Recientemente</p>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-text-secondary">
                    <p>No hay actividad reciente</p>
                    <p className="text-xs text-text-tertiary">Comienza un curso para ver tu progreso</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
