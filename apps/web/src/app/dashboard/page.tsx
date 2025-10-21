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

// Mock data como fallback - se usará cuando no haya datos de la API
const mockWorkshops = [
  {
    id: '1',
    title: 'Introducción a la IA',
    instructor: 'Ernesto Hernandez',
    rating: 4.9,
    price: 'MX$0',
    status: 'Adquirido',
    image: '/api/placeholder/300/200',
    category: 'IA',
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Machine Learning Avanzado',
    instructor: 'María García',
    rating: 4.8,
    price: 'MX$299',
    status: 'Disponible',
    image: '/api/placeholder/300/200',
    category: 'IA',
    isFavorite: true,
  },
  {
    id: '3',
    title: 'Análisis de Datos con Python',
    instructor: 'Carlos López',
    rating: 4.7,
    price: 'MX$199',
    status: 'Disponible',
    image: '/api/placeholder/300/200',
    category: 'Datos',
    isFavorite: false,
  },
];

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
    }
  };

  // Usar datos de la API o fallback a mock data (sin favoritos hardcodeados)
  const workshops = filteredCourses.length > 0 ? filteredCourses.map(course => ({
    id: course.id,
    title: course.title,
    instructor: course.instructor_name || 'Instructor',
    rating: course.rating || 4.5,
    price: course.price || 'MX$0',
    status: course.status || 'Disponible',
    image: course.thumbnail || '/api/placeholder/300/200',
    category: course.category || 'General',
    isFavorite: isFavorite(course.id), // Usar el hook de favoritos
  })) : mockWorkshops.map(workshop => ({
    ...workshop,
    isFavorite: isFavorite(workshop.id) // Usar el hook de favoritos para mock también
  }));

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
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-carbon-900/95 backdrop-blur-xl border-b border-carbon-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo con animación */}
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                  <img 
                    src="/icono.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl"
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Navigation con animaciones */}
            <nav className="hidden lg:flex items-center space-x-4">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Fondo activo con gradiente */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg"
                        layoutId="activeTab"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Fondo hover */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-carbon-700/50 rounded-xl opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Indicador de notificación */}
                    {item.id === 'community' && (
                      <motion.div
                        className="relative z-10 w-2 h-2 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* User Menu con animaciones */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Notificaciones */}
              <motion.button 
                className="relative p-3 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                  3
                </span>
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.button>

              {/* Configuración */}
              <motion.button 
                className="p-3 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Settings className="w-5 h-5" />
              </motion.button>

              {/* User Dropdown */}
              <div className="relative">
                <UserDropdown />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div 
          className="lg:hidden border-t border-carbon-700/50"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-primary to-primary/80'
                        : 'text-text-secondary hover:text-text-primary hover:bg-carbon-700/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </header>

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
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm text-text-secondary">APRENDE Y APLICA IA®</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(workshop.id)}
                      className="absolute top-3 right-3 p-2 bg-carbon-800/80 rounded-full hover:bg-carbon-700 transition-colors"
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
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">En Progreso</span>
                  <span className="text-primary font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Favoritos</span>
                  <span className="text-primary font-semibold">1</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-carbon-800 rounded-lg p-6 border border-carbon-700">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-text-secondary">
                  <p>Completaste "Introducción a la IA"</p>
                  <p className="text-xs text-text-tertiary">Hace 2 días</p>
                </div>
                <div className="text-sm text-text-secondary">
                  <p>Te uniste a la plataforma</p>
                  <p className="text-xs text-text-tertiary">Hace 1 semana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
