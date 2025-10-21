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
  Bell
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useAuth } from '../../features/auth/hooks/useAuth';

// Mock data - en el futuro vendrá de la API
const mockWorkshops = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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

const categories = [
  { id: 'all', name: 'Todos', active: true },
  { id: 'favorites', name: 'Favoritos', active: false },
  { id: 'ai', name: 'IA', active: false },
  { id: 'data', name: 'Datos', active: false },
  { id: 'development', name: 'Desarrollo', active: false },
  { id: 'design', name: 'Diseño', active: false },
  { id: 'it', name: 'IT & Software', active: false },
  { id: 'marketing', name: 'Marketing', active: false },
  { id: 'business', name: 'Negocios', active: false },
];

const navigationItems = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen, active: true },
  { id: 'directory', name: 'Directorio IA', icon: Brain, active: false },
  { id: 'community', name: 'Comunidad', icon: Users, active: false },
  { id: 'news', name: 'Noticias', icon: Newspaper, active: false },
];

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeNav, setActiveNav] = useState('workshops');
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const toggleFavorite = (workshopId: number) => {
    // TODO: Implementar toggle de favoritos
    console.log('Toggle favorite:', workshopId);
  };

  const filteredWorkshops = activeCategory === 'all' 
    ? mockWorkshops 
    : activeCategory === 'favorites'
    ? mockWorkshops.filter(w => w.isFavorite)
    : mockWorkshops.filter(w => w.category.toLowerCase() === activeCategory);

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

              {/* Perfil de usuario */}
              <motion.div 
                className="flex items-center space-x-4 px-4 py-2 rounded-xl hover:bg-carbon-700/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <User className="w-5 h-5 text-white" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-text-primary">
                    {user?.display_name || user?.username || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {user?.cargo_rol || 'Usuario'}
                  </p>
                </div>
              </motion.div>

              {/* Logout */}
              <motion.button
                onClick={handleLogout}
                className="p-3 text-text-secondary hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
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
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-carbon-700 text-text-secondary hover:bg-carbon-600 hover:text-text-primary'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workshops Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkshops.map((workshop) => (
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
                      onClick={() => toggleFavorite(workshop.id)}
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
