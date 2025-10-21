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
  Settings
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
      {/* Header */}
      <header className="bg-carbon-800 border-b border-carbon-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">
                  APRENDE Y APLICA IA®
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'text-primary bg-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-carbon-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-text-primary hidden sm:block">
                  {user?.display_name || user?.username || 'Usuario'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
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
