'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare as MessageSquareIcon,
  Heart,
  Share2,
  Globe,
  Shield,
  Crown,
  Code,
  Palette,
  Monitor,
  Megaphone,
  Briefcase,
  Flag,
  X,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter } from 'next/navigation';
import { usePrefetchOnHover } from '../../core/hooks/usePrefetch';
import { useCommunities } from '../../core/hooks/useCommunities';
import useSWR from 'swr';

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
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estadísticas memoizadas - solo recalcular cuando cambian las comunidades
  const totalMembers = React.useMemo(() => 
    communities.reduce((sum, community) => sum + community.member_count, 0),
    [communities]
  );
  const totalCommunities = communities.length;

  // Filtrado y ordenamiento memoizado - evita recalcular en cada render
  const filteredCommunities = React.useMemo(() => {
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

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
              throw new Error(errorData.error || errorData.message || 'Failed to request access');
            }

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
      // Error handled silently in production
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

  const updatedDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }),
    []
  );

  const yearFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        timeZone: 'UTC'
      }),
    []
  );

  const { overview, isLoading: overviewLoading, isError: overviewError } = useCommunityOverview(selectedCommunity?.slug ?? null);

  const handleOpenDetails = (community: Community) => {
    setSelectedCommunity(community);
  };

  const handleCloseDetails = () => setSelectedCommunity(null);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900 bg-gradient-to-br from-blue-50 via-purple-50 to-white dark:text-white dark:bg-gradient-to-br dark:from-[#0a0d2c] dark:via-[#120827] dark:to-[#1c0635]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.2),transparent_55%)] dark:bg-[radial-gradient(circle_at_10%_15%,_rgba(99,102,241,0.45),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_80%_10%,_rgba(236,72,153,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(248,113,113,0.1),transparent_45%)] dark:bg-[radial-gradient(circle_at_50%_85%,_rgba(59,130,246,0.22),_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-white/70 via-transparent to-transparent dark:from-black/40" />
      </div>
      <div className="relative z-10">
      {/* Hero Section */}
      <motion.section
        className="relative py-16 px-6 overflow-visible"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Comunidad de{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-200 dark:to-purple-200">
                Aprende y Aplica
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-white/80 max-w-3xl mx-auto leading-relaxed">
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
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-200">{totalMembers}</div>
              <div className="text-slate-500 dark:text-white/60">MIEMBROS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-200">{totalCommunities}</div>
              <div className="text-slate-500 dark:text-white/60">COMUNIDADES</div>
            </div>
          </motion.div>

          {/* Search + Filters */}
          <motion.div
            className="max-w-4xl mx-auto mb-12"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-white/60 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar comunidades o contenido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-white/60 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-transparent transition-all backdrop-blur-md shadow-lg shadow-purple-200/40 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-white/60 dark:focus:ring-blue-400/50"
                  />
                </div>
              </div>
              <div className="relative lg:w-60" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium shadow-lg shadow-purple-200/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:text-white dark:shadow-blue-500/20 dark:border-transparent dark:focus:ring-blue-500/40"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {categories.find((c) => c.id === selectedCategory)?.name || 'Categorías'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterOpen && (
                  <div className="absolute top-full mt-3 min-w-full lg:w-72 bg-white border border-gray-200 dark:bg-slate-900/95 dark:border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl p-3 space-y-2 z-20 max-h-64 overflow-y-auto custom-scroll">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;

                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-200'
                              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500 dark:text-blue-200' : 'text-blue-400/70'}`} />
                            {category.name}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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
                    whileHover={{ y: -6, scale: 1.01 }}
                    className={`relative group flex flex-col rounded-[28px] border ${cardStyle.border} bg-white dark:bg-slate-950/60 shadow-xl ${cardStyle.shadow} overflow-hidden cursor-pointer`}
                    onClick={() => router.push(`/communities/${community.slug}`)}
                    {...prefetchOnHover(`/communities/${community.slug}`)}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent" />
                    </div>

                    {/* Header media */}
                    <div className="relative h-48 overflow-hidden rounded-[28px] rounded-b-none">
                      {community.image_url ? (
                        <Image
                          src={community.image_url}
                          alt={community.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          loading="lazy"
                          quality={80}
                        />
                      ) : (
                        <div className={`absolute inset-0 ${cardStyle.headerBg}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />

                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        {community.category && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur dark:border-white/30 dark:bg-white/20 dark:text-white">
                            {categories.find(cat => cat.id === community.category)?.icon &&
                              React.createElement(categories.find(cat => cat.id === community.category)!.icon, { className: 'w-3.5 h-3.5' })
                            }
                            {categories.find(cat => cat.id === community.category)?.name || community.category}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-lg">
                        <AccessIcon className={`w-3.5 h-3.5 ${cardStyle.accent}`} />
                        {accessInfo.label}
                      </div>

                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col gap-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {community.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Actualizado {updatedDateFormatter.format(new Date(community.updated_at))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {new Intl.NumberFormat('es-ES').format(community.member_count)}
                          </p>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Miembros
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2">
                        {community.description}
                      </p>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/5 px-4 py-3 text-sm text-slate-600 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          {community.visibility === 'public' ? 'Comunidad abierta' : 'Acceso moderado'}
                        </div>
                        <div className="h-6 w-px bg-slate-200/70 dark:bg-white/10" />
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-purple-500" />
                          {yearFormatter.format(new Date(community.created_at))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          {community.is_active ? 'Activa' : 'En pausa'}
                        </span>
                        {community.is_member && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-500">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ya eres miembro
                          </span>
                        )}
                        {community.has_pending_request && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-amber-500">
                            <Clock className="w-3.5 h-3.5" />
                            Solicitud enviada
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                        {community.is_member ? (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(community)}
                              className="flex-1 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:border-blue-400/60"
                            >
                              Ver detalles
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/communities/${community.slug}`)}
                              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110"
                            >
                              Entrar
                            </button>
                          </div>
                        ) : community.has_pending_request ? (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(community)}
                              className="flex-1 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:border-blue-400/60"
                            >
                              Ver detalles
                            </button>
                            <button
                              type="button"
                              disabled
                              className="flex-1 rounded-2xl border border-amber-400/40 bg-amber-500/20 py-3 text-sm font-semibold text-amber-700 dark:text-amber-200"
                            >
                              Solicitud pendiente
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(community)}
                              className="flex-1 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:border-blue-400/60"
                            >
                              Ver detalles
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJoinCommunity(community.id, community.access_type)}
                              disabled={joiningCommunity === community.id}
                              className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-lg transition ${
                                community.access_type === 'free'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30 hover:brightness-110'
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30 hover:brightness-110'
                              } ${joiningCommunity === community.id ? 'cursor-wait opacity-80' : ''}`}
                            >
                              {joiningCommunity === community.id ? (
                                <div className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                'Unirme'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
        className="fixed bottom-6 left-6 z-[9990]"
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
      <AnimatePresence>
        {selectedCommunity && (
          <CommunityDetailsModal
            community={selectedCommunity}
            overview={overview}
            isLoading={overviewLoading}
            isError={overviewError}
            onClose={handleCloseDetails}
            onEnter={() => {
              router.push(`/communities/${selectedCommunity.slug}`);
              handleCloseDetails();
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

interface CommunityOverviewData {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url?: string;
  member_count?: number;
  created_at?: string;
  category?: string | null;
  access_type?: string;
  visibility?: string;
  stats: {
    members: number;
    posts: number;
    createdAt: string | null;
  };
  creator?: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
    cargo_rol: string | null;
  } | null;
  admins: Array<{
    id: string;
    display_name: string | null;
    profile_picture_url: string | null;
    role: string;
  }>;
  recentMembers: Array<{
    id: string;
    display_name: string | null;
    profile_picture_url: string | null;
    role: string;
    joined_at: string | null;
  }>;
}

function useCommunityOverview(slug: string | null) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/communities/${slug}/overview` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al obtener detalles de la comunidad');
      }
      return res.json();
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    overview: (data?.overview as CommunityOverviewData) || null,
    isLoading,
    isError: error,
  };
}

interface CommunityDetailsModalProps {
  community: Community;
  overview: CommunityOverviewData | null;
  isLoading: boolean;
  isError: Error | undefined;
  onClose: () => void;
  onEnter: () => void;
}

function CommunityDetailsModal({
  community,
  overview,
  isLoading,
  isError,
  onClose,
  onEnter,
}: CommunityDetailsModalProps) {
  const fallbackStats = {
    members: community.member_count || 0,
    posts: 0,
    createdAt: community.created_at || null,
  };

  const stats = overview?.stats || fallbackStats;
  const creator = overview?.creator;
  const admins = overview?.admins || [];
  const recentMembers = overview?.recentMembers || [];

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9995] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-6xl bg-gradient-to-br from-[#090a1c] via-[#060614] to-[#03020b] border border-white/10 rounded-[32px] shadow-[0_40px_160px_rgba(5,3,18,0.8)] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-8">
          <div className="relative">
            <div className="h-64 rounded-[32px] overflow-hidden border border-white/10 bg-slate-900/40 shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
              {community.image_url ? (
                <Image src={community.image_url} alt={community.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-purple-600/40 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050414] via-[#050414]/30 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)] mix-blend-soft-light" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">Comunidad</p>
                  <h2 className="text-3xl font-bold">{community.name}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <InfoBadge icon={community.visibility === 'public' ? Globe : Shield} value={community.visibility === 'public' ? 'Pública' : 'Privada'} />
                  <InfoBadge icon={community.access_type === 'free' ? CheckCircle : community.access_type === 'invitation_only' ? Lock : Crown} value={
                    community.access_type === 'free' ? 'Acceso libre' : community.access_type === 'invitation_only' ? 'Solo invitación' : 'Acceso premium'
                  } />
                  {community.category && (
                    <InfoBadge icon={Megaphone} value={categories.find((c) => c.id === community.category)?.name || community.category} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <section className="space-y-6">
              <p className="text-white/85 leading-relaxed text-lg">
                {community.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailStat label="Miembros" value={stats.members.toString()} icon={Users} />
                <DetailStat label="Posts publicados" value={stats.posts.toString()} icon={MessageSquareIcon} />
                <DetailStat
                  label="Creada"
                  value={
                    stats.createdAt
                      ? new Date(stats.createdAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                  }
                  icon={CalendarDays}
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[26px] p-6 space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Información clave</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <HighlightItem icon={Shield} title="Moderación activa" description="Un equipo dedicado mantiene conversaciones sanas y enfocadas." />
                  <HighlightItem icon={MessageSquareIcon} title="Colaboración constante" description="Comparte ideas, dudas y recursos con profesionales afines." />
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="bg-white/5 border border-white/10 rounded-[26px] p-6 space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Administradores</p>
                {isLoading ? (
                  <SkeletonList items={2} height="h-14" />
                ) : (
                  <div className="space-y-3">
                    {creator ? (
                      <AdminCard
                        name={creator.display_name || `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Administrador'}
                        role="Creador"
                        avatar={creator.profile_picture_url}
                      />
                    ) : (
                      <AdminCard name="Equipo Aprende y Aplica" role="Creador" avatar={null} />
                    )}
                    {admins.map((admin) => (
                      <AdminCard
                        key={admin.id}
                        name={admin.display_name || 'Administrador'}
                        role={admin.role === 'moderator' ? 'Moderador' : 'Administrador'}
                        avatar={admin.profile_picture_url}
                      />
                    ))}
                    {!admins.length && (
                      <p className="text-xs text-white/60">Aún no se asignan administradores adicionales.</p>
                    )}
                  </div>
                )}
              </section>

              <section className="bg-white/5 border border-white/10 rounded-[26px] p-6 space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Miembros recientes</p>
                {isLoading ? (
                  <SkeletonList items={3} height="h-12" />
                ) : recentMembers.length ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll pr-1">
                    {recentMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
                        <AvatarCircle name={member.display_name || 'Miembro'} src={member.profile_picture_url} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.display_name || 'Miembro'}</p>
                          <p className="text-xs text-white/60">
                            {member.role === 'admin' ? 'Administrador' : member.role === 'moderator' ? 'Moderador' : 'Miembro'} ·{' '}
                            {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-MX') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/60">Sé el primero en unirte a esta comunidad.</p>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={onEnter}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-500/90 hover:to-blue-500/90 text-white rounded-2xl py-4 shadow-lg shadow-green-500/20 text-base"
                >
                  Entrar a la Comunidad
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                className="w-full border border-white/20 text-white rounded-2xl py-4 hover:bg-white/10 text-base"
                >
                  Cerrar
                </Button>
              </div>

              {isError && (
                <p className="text-xs text-red-300">
                  No se pudieron cargar todos los detalles. Intenta nuevamente más tarde.
                </p>
              )}
            </aside>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailStat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 px-4 py-4 flex items-center gap-4 shadow-inner shadow-black/10">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function AdminCard({ name, role, avatar }: { name: string; role: string; avatar: string | null }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2 border border-white/10">
      <AvatarCircle name={name} src={avatar} />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-white/60">{role}</p>
      </div>
    </div>
  );
}

function AvatarCircle({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return <Image src={src} alt={name} width={40} height={40} className="rounded-full object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function InfoBadge({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
      <Icon className="w-4 h-4 text-white/80" />
      <span className="text-sm text-white/80">{value}</span>
    </span>
  );
}

function HighlightItem({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white/85" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </div>
  );
}

function SkeletonList({ items, height }: { items: number; height: string }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, idx) => (
        <div key={idx} className={`${height} bg-white/5 rounded-2xl animate-pulse`} />
      ))}
    </div>
  );
}
