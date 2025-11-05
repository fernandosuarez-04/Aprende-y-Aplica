'use client';

import React, { useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  FileText, 
  Filter,
  Plus,
  Lock,
  UserPlus,
  Info,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  Globe,
  Shield,
  Crown,
  Code,
  Palette,
  Monitor,
  Megaphone,
  Briefcase,
  Flag,
  X
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter } from 'next/navigation';
import { usePrefetchOnHover } from '../../core/hooks/usePrefetch';
import { useCommunities } from '../../core/hooks/useCommunities';

// 🚀 Lazy Loading - Cargar componentes pesados solo cuando se necesitan
const AIChatAgent = lazy(() => import('../../core/components/AIChatAgent/AIChatAgent').then(m => ({ default: m.AIChatAgent })));

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url?: string;
  member_count: number;
  is_active: boolean;
  visibility: string;
  access_type: 'free' | 'invitation_only' | 'paid';
  created_at: string;
  updated_at: string;
  category?: string;
  is_member?: boolean;
  has_pending_request?: boolean;
}

interface CommunityAccessRequest {
  id: string;
  community_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
  reviewed_at?: string;
}

const categories = [
  { id: 'all', name: 'Todos', icon: Globe },
  { id: 'general', name: 'General', icon: Users },
  { id: 'ai', name: 'IA', icon: TrendingUp },
  { id: 'data', name: 'Datos', icon: FileText },
  { id: 'development', name: 'Desarrollo', icon: Code },
  { id: 'design', name: 'Diseño', icon: Palette },
  { id: 'it', name: 'IT & Software', icon: Monitor },
  { id: 'marketing', name: 'Marketing', icon: Megaphone },
  { id: 'business', name: 'Negocios', icon: Briefcase }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function CommunitiesPage() {
  const router = useRouter();
  const prefetchOnHover = usePrefetchOnHover();
  
  // 🚀 SWR Hook - Cache inteligente con revalidación automática
  const { communities: communitiesData, isLoading, isError, mutate } = useCommunities();
  const communities = communitiesData?.communities || [];
  
  // Log para debugging en producción
  React.useEffect(() => {
    if (communitiesData) {
      console.log('📊 Communities data loaded:', {
        total: communitiesData.total,
        count: communities.length,
        hasData: !!communitiesData.communities
      });
    }
    if (isError) {
      console.error('❌ Error loading communities:', isError);
    }
  }, [communitiesData, isError, communities.length]);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  // Estadísticas memoizadas - solo recalcular cuando cambian las comunidades
  const totalMembers = React.useMemo(() => 
    communities.reduce((sum, community) => sum + community.member_count, 0),
    [communities]
  );
  const totalCommunities = communities.length;

  // Filtrado y ordenamiento memoizado - evita recalcular en cada render
  const filteredCommunities = React.useMemo(() => {
    console.log('🔍 Filtering communities...');
    let filtered = communities;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(community => 
        community.category === selectedCategory
      );
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query)
      );
    }

    // Ordenar: primero las que ya es miembro, luego por fecha
    return [...filtered].sort((a, b) => {
      if (a.is_member && !b.is_member) return -1;
      if (!a.is_member && b.is_member) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [communities, selectedCategory, searchQuery]);

  // 🚀 Mutación optimista con SWR - Actualiza UI inmediatamente
  const handleJoinCommunity = React.useCallback(async (communityId: string, accessType: string) => {
    try {
      setJoiningCommunity(communityId);
      
      if (accessType === 'free') {
        // Mutación optimista: actualizar cache antes del request
        await mutate(
          async (currentData: any) => {
            // Request al API
            const response = await fetch('/api/communities/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ communityId }),
            });

            if (!response.ok) throw new Error('Failed to join');

            // Retornar datos actualizados
            return {
              ...currentData,
              communities: currentData.communities.map((c: Community) => 
                c.id === communityId 
                  ? { ...c, is_member: true, member_count: c.member_count + 1 }
                  : c
              )
            };
          },
          {
            optimisticData: (currentData: any) => ({
              ...currentData,
              communities: currentData.communities.map((c: Community) => 
                c.id === communityId 
                  ? { ...c, is_member: true, member_count: c.member_count + 1 }
                  : c
              )
            }),
            revalidate: false, // No revalidar hasta que termine la mutación
            rollbackOnError: true, // Revertir si falla
          }
        );
      } else {
        // Solicitar acceso a comunidad por invitación
        await mutate(
          async (currentData: any) => {
            const response = await fetch('/api/communities/request-access', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ communityId }),
            });

            if (!response.ok) throw new Error('Failed to request access');

            return {
              ...currentData,
              communities: currentData.communities.map((c: Community) => 
                c.id === communityId 
                  ? { ...c, has_pending_request: true }
                  : c
              )
            };
          },
          {
            optimisticData: (currentData: any) => ({
              ...currentData,
              communities: currentData.communities.map((c: Community) => 
                c.id === communityId 
                  ? { ...c, has_pending_request: true }
                  : c
              )
            }),
            revalidate: false,
            rollbackOnError: true,
          }
        );
      }
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setJoiningCommunity(null);
    }
  }, [mutate]); // Depende de mutate de SWR

  const getAccessTypeInfo = React.useCallback((accessType: string) => {
    switch (accessType) {
      case 'free':
        return { label: 'Miembro', color: 'text-green-400', icon: CheckCircle };
      case 'invitation_only':
        return { label: 'Invitación', color: 'text-purple-400', icon: Lock };
      case 'paid':
        return { label: 'Pago', color: 'text-yellow-400', icon: Crown };
      default:
        return { label: 'Miembro', color: 'text-green-400', icon: CheckCircle };
    }
  }, []); // Función pura sin dependencias

  const getCommunityCardStyle = React.useCallback((community: Community) => {
    // Estilos específicos para comunidades conocidas con mejor diseño
    if (community.slug === 'profesionales') {
      return {
        background: 'bg-gradient-to-br from-blue-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        accent: 'text-blue-400',
        border: 'border-blue-500/30',
        shadow: 'shadow-blue-500/10'
      };
    } else if (community.slug === 'ecos-liderazgo') {
      return {
        background: 'bg-gradient-to-br from-purple-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-purple-600 to-purple-700',
        accent: 'text-orange-400',
        border: 'border-orange-500/30',
        shadow: 'shadow-orange-500/10'
      };
    } else if (community.slug === 'openminder') {
      return {
        background: 'bg-gradient-to-br from-slate-900/50 to-black/50',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-900',
        accent: 'text-yellow-400',
        border: 'border-yellow-500/30',
        shadow: 'shadow-yellow-500/10'
      };
    }
    
    // Estilos por categoría para otras comunidades
    const categoryStyles = {
      'ai': {
        background: 'bg-gradient-to-br from-emerald-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
        accent: 'text-emerald-400',
        border: 'border-emerald-500/30',
        shadow: 'shadow-emerald-500/10'
      },
      'data': {
        background: 'bg-gradient-to-br from-cyan-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-cyan-600 to-cyan-700',
        accent: 'text-cyan-400',
        border: 'border-cyan-500/30',
        shadow: 'shadow-cyan-500/10'
      },
      'development': {
        background: 'bg-gradient-to-br from-indigo-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-indigo-600 to-indigo-700',
        accent: 'text-indigo-400',
        border: 'border-indigo-500/30',
        shadow: 'shadow-indigo-500/10'
      },
      'design': {
        background: 'bg-gradient-to-br from-pink-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-pink-600 to-pink-700',
        accent: 'text-pink-400',
        border: 'border-pink-500/30',
        shadow: 'shadow-pink-500/10'
      },
      'business': {
        background: 'bg-gradient-to-br from-amber-900/30 to-slate-800/50',
        headerBg: 'bg-gradient-to-r from-amber-600 to-amber-700',
        accent: 'text-amber-400',
        border: 'border-amber-500/30',
        shadow: 'shadow-amber-500/10'
      }
    };
    
    return categoryStyles[community.category as keyof typeof categoryStyles] || {
      background: 'bg-gradient-to-br from-slate-800/50 to-slate-900/50',
      headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
      accent: 'text-slate-400',
      border: 'border-slate-600/30',
      shadow: 'shadow-slate-500/10'
    };
  }, []); // Función pura, solo lee propiedades del objeto

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Hero Section */}
      <motion.section
        className="relative py-16 px-6 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/10 dark:to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Comunidad de{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Aprende y Aplica
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Conecta con otros estudiantes, comparte conocimientos y participa en discusiones 
              sobre inteligencia artificial y tecnología educativa
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="flex justify-center gap-8 mb-12"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalMembers}</div>
              <div className="text-gray-600 dark:text-slate-400">MIEMBROS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalCommunities}</div>
              <div className="text-gray-600 dark:text-slate-400">COMUNIDADES</div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="max-w-2xl mx-auto mb-8"
            variants={itemVariants}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar comunidades o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-12"
            variants={itemVariants}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white dark:bg-slate-800/50 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:border-gray-300 dark:hover:border-slate-500/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Communities Grid */}
      <motion.section
        className="px-6 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-64 bg-slate-800/50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredCommunities.map((community, index) => {
                const accessInfo = getAccessTypeInfo(community.access_type);
                const AccessIcon = accessInfo.icon;
                const cardStyle = getCommunityCardStyle(community);
                
                return (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`relative group ${cardStyle.background} ${cardStyle.border} border rounded-3xl overflow-hidden backdrop-blur-sm ${cardStyle.shadow} shadow-2xl cursor-pointer`}
                    onClick={() => router.push(`/communities/${community.slug}`)}
                    {...prefetchOnHover(`/communities/${community.slug}`)}
                  >
                      {/* Community Header with Image or Gradient */}
                      <div className={`${cardStyle.headerBg} p-6 pb-4 relative overflow-hidden`}>
                        {/* Community Image */}
                        {community.image_url ? (
                          <div className="absolute inset-0">
                            <Image
                              src={community.image_url}
                              alt={community.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                              loading="lazy"
                              quality={75}
                            />
                            {/* Overlay para mejorar legibilidad del texto */}
                            <div className="absolute inset-0 bg-black/40" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white mb-3">
                                {community.name}
                              </h3>
                              <p className="text-white/90 text-sm leading-relaxed">
                                {community.description}
                              </p>
                            </div>
                          </div>

                          {/* Community Stats */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-white/80 bg-white/10 px-3 py-1 rounded-full">
                                <Users className="w-4 h-4" />
                                {community.member_count} Miembros
                              </div>
                              <div className={`flex items-center gap-2 ${accessInfo.color} bg-white/10 px-3 py-1 rounded-full`}>
                                <AccessIcon className="w-4 h-4" />
                                {accessInfo.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 pt-4">
                        {/* Category Badge */}
                        {community.category && (
                          <div className="mb-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cardStyle.accent} bg-white/10`}>
                              {categories.find(cat => cat.id === community.category)?.icon && 
                                React.createElement(categories.find(cat => cat.id === community.category)!.icon, { className: "w-3 h-3" })
                              }
                              {categories.find(cat => cat.id === community.category)?.name || community.category}
                            </span>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                          {community.is_member ? (
                            <Button
                              onClick={() => router.push(`/communities/${community.slug}`)}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 rounded-xl py-3 font-medium transition-all duration-300"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Entrar a la Comunidad
                            </Button>
                          ) : community.has_pending_request ? (
                            <Button
                              className="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-xl py-3 font-medium"
                              disabled
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Solicitud pendiente
                            </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/communities/${community.slug}`)}
                              className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50 rounded-xl py-3 font-medium transition-all duration-300"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Comunidad
                            </Button>
                            <Button
                              onClick={() => handleJoinCommunity(community.id, community.access_type)}
                              disabled={joiningCommunity === community.id}
                              className={`rounded-xl py-3 font-medium transition-all duration-300 ${
                                community.access_type === 'free'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25'
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25'
                              }`}
                            >
                              {joiningCommunity === community.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Enhanced Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  );
                })}
            </motion.div>
          )}

          {!isLoading && isError && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <X className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error al cargar comunidades
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                {isError?.message || 'Ocurrió un error al intentar cargar las comunidades'}
              </p>
              <Button
                onClick={() => mutate()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl"
              >
                Reintentar
              </Button>
            </motion.div>
          )}

          {!isLoading && !isError && communities.length === 0 && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay comunidades disponibles
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                Aún no se han creado comunidades en la plataforma
              </p>
            </motion.div>
          )}

          {!isLoading && !isError && communities.length > 0 && filteredCommunities.length === 0 && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron comunidades
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                Intenta ajustar tus filtros de búsqueda
              </p>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Community Rules Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-[9990]"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          onClick={() => setShowRulesModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Info className="w-5 h-5 mr-2" />
          Ver Normas de la Comunidad
        </Button>
      </motion.div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Normas de la Comunidad</h2>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-700 dark:text-slate-300 mb-8">
                Ayúdanos a mantener un ambiente respetuoso y constructivo
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 dark:bg-red-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sé Respetuoso</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Trata a todos los miembros con respeto y cortesía. No toleramos el acoso o la discriminación.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 dark:bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comparte Conocimiento</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Contribuye con información útil y constructiva. Ayuda a otros a aprender y crecer.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 dark:bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mantén la Privacidad</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    No compartas información personal de otros miembros sin su consentimiento.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 dark:bg-yellow-500/20 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reporta Problemas</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Si ves contenido inapropiado, repórtalo inmediatamente a los moderadores.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowRulesModal(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Entendido
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Agent - Lazy loaded */}
      <Suspense fallback={null}>
        <AIChatAgent
          assistantName="Lia"
          initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con información sobre nuestras comunidades, cómo unirte y participar. ¿En qué puedo asistirte?"
          promptPlaceholder="Pregunta sobre comunidades..."
          context="communities"
        />
      </Suspense>
    </div>
  );
}
