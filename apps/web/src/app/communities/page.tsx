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
import { useTranslation } from 'react-i18next';

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

// Las categorías se obtienen de las traducciones
const getCategories = (t: any) => [
  { id: 'all', name: t('categories.all'), icon: Globe },
  { id: 'general', name: t('categories.general'), icon: Users },
  { id: 'ai', name: t('categories.ai'), icon: TrendingUp },
  { id: 'data', name: t('categories.data'), icon: FileText },
  { id: 'development', name: t('categories.development'), icon: Code },
  { id: 'design', name: t('categories.design'), icon: Palette },
  { id: 'it', name: t('categories.it'), icon: Monitor },
  { id: 'marketing', name: t('categories.marketing'), icon: Megaphone },
  { id: 'business', name: t('categories.business'), icon: Briefcase }
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
  const { t } = useTranslation('communities');
  
  // 🚀 SWR Hook - Cache inteligente con revalidación automática
  const { communities: communitiesData, isLoading, isError, mutate } = useCommunities();
  const communities = communitiesData?.communities || [];
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);
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
        return { label: t('accessTypes.member'), color: 'text-[#10B981]', icon: CheckCircle };
      case 'invitation_only':
        return { label: t('accessTypes.invitation'), color: 'text-[#0A2540] dark:text-[#00D4B3]', icon: Lock };
      case 'paid':
        return { label: t('accessTypes.paid'), color: 'text-[#F59E0B]', icon: Crown };
      default:
        return { label: t('accessTypes.member'), color: 'text-[#10B981]', icon: CheckCircle };
    }
  }, [t]);

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


  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2540] dark:text-white mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Comunidades
            </h1>
            <p className="text-xl text-[#6C757D] dark:text-white/80 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="flex justify-center gap-8 mb-12"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0A2540] dark:text-[#00D4B3]" style={{ fontFamily: 'Inter, sans-serif' }}>{totalMembers}</div>
              <div className="text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>{t('stats.members')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0A2540] dark:text-[#00D4B3]" style={{ fontFamily: 'Inter, sans-serif' }}>{totalCommunities}</div>
              <div className="text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>{t('stats.communities')}</div>
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D] dark:text-[#6C757D]" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-sm font-normal text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[#6C757D] dark:text-[#6C757D]" />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative lg:w-60" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white text-[#0A2540] font-medium shadow-sm border border-[#E9ECEF] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] dark:bg-[#1E2329] dark:text-white dark:border-[#6C757D]/30 dark:focus:ring-[#00D4B3]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {getCategories(t).find((c) => c.id === selectedCategory)?.name || t('categories.all')}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterOpen && (
                  <div className="absolute top-full mt-3 min-w-full lg:w-72 bg-white border border-[#E9ECEF] dark:bg-[#1E2329] dark:border-[#6C757D]/30 rounded-xl shadow-xl p-3 space-y-2 z-20 max-h-64 overflow-y-auto custom-scroll">
                    {getCategories(t).map((category) => {
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
                              ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3]'
                              : 'text-[#6C757D] dark:text-white/80 hover:bg-[#00D4B3]/5 dark:hover:bg-[#00D4B3]/10'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D4B3]' : 'text-[#6C757D]'}`} />
                            {category.name}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00D4B3]' : 'bg-[#E9ECEF] dark:bg-[#6C757D]'}`} />
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
                    className={`relative group flex flex-col rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] shadow-sm overflow-hidden cursor-pointer`}
                    onClick={() => router.push(`/communities/${community.slug}`)}
                    {...prefetchOnHover(`/communities/${community.slug}`)}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 bg-[#00D4B3]/5" />
                    </div>

                    {/* Header media */}
                    <div className="relative h-48 overflow-hidden rounded-t-xl">
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
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A2540] backdrop-blur dark:border-white/30 dark:bg-white/20 dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {getCategories(t).find(cat => cat.id === community.category)?.icon &&
                              React.createElement(getCategories(t).find(cat => cat.id === community.category)!.icon, { className: 'w-3.5 h-3.5' })
                            }
                            {getCategories(t).find(cat => cat.id === community.category)?.name || community.category}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A2540] shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <AccessIcon className={`w-3.5 h-3.5 ${cardStyle.accent}`} />
                        {accessInfo.label}
                      </div>

                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col gap-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {community.name}
                          </h3>
                          <p className="text-sm text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {t('community.updated')} {updatedDateFormatter.format(new Date(community.updated_at))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {new Intl.NumberFormat('es-ES').format(community.member_count)}
                          </p>
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {t('community.members')}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#6C757D] dark:text-white/80 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {community.description}
                      </p>

                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#E9ECEF]/50 dark:bg-white/5 px-4 py-3 text-sm text-[#6C757D] dark:text-white/80">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#00D4B3]" />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>{community.visibility === 'public' ? t('community.open') : t('community.moderated')}</span>
                        </div>
                        <div className="h-6 w-px bg-[#E9ECEF] dark:bg-white/10" />
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#00D4B3]" />
                          {yearFormatter.format(new Date(community.created_at))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9ECEF] dark:bg-white/10 px-3 py-1 text-[#6C757D] dark:text-white/80">
                          <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                          {community.is_active ? t('community.active') : t('community.paused')}
                        </span>
                        {community.is_member && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-3 py-1 text-[#10B981]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('community.alreadyMember')}
                          </span>
                        )}
                        {community.has_pending_request && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[#F59E0B]">
                            <Clock className="w-3.5 h-3.5" />
                            {t('community.requestSent')}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                        {community.is_member ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/communities/${community.slug}`)}
                            className="w-full rounded-xl bg-[#0A2540] hover:bg-[#0d2f4d] py-3 text-sm font-semibold text-white shadow-sm transition"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {t('community.enter')}
                          </button>
                        ) : community.has_pending_request ? (
                          <button
                            type="button"
                            disabled
                            className="w-full rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/20 py-3 text-sm font-semibold text-[#F59E0B]"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {t('community.requestPending')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinCommunity(community.id, community.access_type)}
                            disabled={joiningCommunity === community.id}
                            className={`w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition bg-[#0A2540] hover:bg-[#0d2f4d] ${joiningCommunity === community.id ? 'cursor-wait opacity-80' : ''}`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {joiningCommunity === community.id ? (
                              <div className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              t('community.join')
                            )}
                          </button>
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
              <h3 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('errors.loadError')}
              </h3>
              <p className="text-[#6C757D] dark:text-white/80 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                {isError?.message || t('errors.loadErrorMessage')}
              </p>
              <Button
                onClick={() => mutate()}
                className="bg-[#0A2540] hover:bg-[#0d2f4d] text-white px-6 py-2 rounded-xl"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('errors.retry')}
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
              <h3 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('errors.noCommunities')}
              </h3>
              <p className="text-[#6C757D] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('errors.noCommunitiesMessage')}
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
              <h3 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('errors.noResults')}
              </h3>
              <p className="text-[#6C757D] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('errors.noResultsMessage')}
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
          className="bg-[#0A2540] hover:bg-[#0d2f4d] text-white px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Info className="w-5 h-5 mr-2" />
          {t('rules.button')}
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('rules.title')}</h2>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-700 dark:text-slate-300 mb-8">
                {t('rules.subtitle')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 dark:bg-red-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rules.respectful.title')}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {t('rules.respectful.description')}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 dark:bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rules.shareKnowledge.title')}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {t('rules.shareKnowledge.description')}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 dark:bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rules.privacy.title')}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {t('rules.privacy.description')}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 dark:bg-yellow-500/20 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rules.report.title')}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {t('rules.report.description')}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowRulesModal(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {t('rules.understood')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}


