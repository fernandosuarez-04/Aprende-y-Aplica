'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Search,
  Trophy,
  Star,
  Target,
  Zap,
  Gamepad2,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  Flame,
  Sword,
  Shield,
  Heart,
  Coins,
  Gift,
  Timer,
  BarChart3,
  Brain,
  Puzzle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter, useParams } from 'next/navigation';

interface LeagueMember {
  id: string;
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  points: number;
  league: 'gold' | 'platinum' | 'diamond';
  league_info: {
    min: number;
    max: number;
    name: string;
    color: string;
    icon: string;
  };
  role: string;
  joined_at: string;
  rank: number;
  total_members: number;
}

interface LeagueSystem {
  gold: { min: number; max: number; name: string; color: string; icon: string };
  platinum: { min: number; max: number; name: string; color: string; icon: string };
  diamond: { min: number; max: number; name: string; color: string; icon: string };
}

interface PointsSystem {
  post: number;
  comment: number;
  reaction: number;
  popular_post: number;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  access_type: string;
}

interface CurrentUser {
  id: string;
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  points: number;
  league: 'gold' | 'platinum' | 'diamond';
  league_info: {
    min: number;
    max: number;
    name: string;
    color: string;
    icon: string;
  };
  role: string;
  joined_at: string;
  rank: number;
  total_members: number;
}

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
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Constantes de padding móvil (consistentes con Miembros)
const MOBILE_BOTTOM_NAV_HEIGHT = 72;
const MOBILE_CONTENT_EXTRA_PADDING = 24;

const getLeagueIcon = (league: string) => {
  switch (league) {
    case 'gold': return '🥇';
    case 'platinum': return '🥈';
    case 'diamond': return '💎';
    default: return '🏆';
  }
};

const getLeagueColor = (league: string) => {
  switch (league) {
    case 'gold': return 'from-[#F59E0B] to-[#F59E0B]';
    case 'platinum': return 'from-[#6C757D] to-[#6C757D]';
    case 'diamond': return 'from-[#00D4B3] to-[#00D4B3]';
    default: return 'from-[#6C757D] to-[#6C757D]';
  }
};

export default function LeaguesPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [leagueSystem, setLeagueSystem] = useState<LeagueSystem | null>(null);
  const [pointsSystem, setPointsSystem] = useState<PointsSystem | null>(null);
  const [leagueStats, setLeagueStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'gold' | 'platinum' | 'diamond'>('all');
  const [filteredMembers, setFilteredMembers] = useState<LeagueMember[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'comunidad' | 'miembros' | 'ligas' | 'acerca'>('ligas');
  const headerSectionRef = useRef<HTMLElement | null>(null);
  const standingsSectionRef = useRef<HTMLElement | null>(null);

  // 🚀 OPTIMIZACIÓN: Cargar datos de ligas cuando cambie el slug
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function loadLeaguesData() {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/communities/${slug}/leagues`, {
          // Agregar caché para mejorar performance en navegaciones repetidas
          next: { revalidate: 60 } // Revalidar cada 60 segundos
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setCommunity(data.community);
          setCurrentUser(data.currentUser);
          setMembers(data.members || []);
          setLeagueSystem(data.leagueSystem);
          setPointsSystem(data.pointsSystem);
          setLeagueStats(data.leagueStats);
        } else {
          const errorData = await response.json();
          if (response.status === 401) {
            router.push('/auth');
          } else if (response.status === 403) {
            router.push(`/communities/${slug}`);
          }
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeaguesData();

    return () => {
      isMounted = false;
    };
  }, [slug, router]);

  // 🚀 OPTIMIZACIÓN: Memoizar el filtrado para evitar cálculos innecesarios
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(member => member.league === activeFilter);
    }

    return filtered;
  }, [members, activeFilter]);

  // Sincronizar con el estado filteredMembers solo cuando cambie el resultado memoizado
  useEffect(() => {
    setFilteredMembers(filteredAndSortedMembers);
  }, [filteredAndSortedMembers]);

  useEffect(() => {
    const checkViewport = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const memberTabs = [
    { id: 'comunidad' as const, label: 'Comunidad', icon: MessageSquare },
    { id: 'miembros' as const, label: 'Miembros', icon: Users },
    { id: 'ligas' as const, label: 'Ligas', icon: Trophy },
    { id: 'acerca' as const, label: 'Acerca', icon: Award },
  ];

  const handleTabNavigation = (tab: 'comunidad' | 'miembros' | 'ligas' | 'acerca') => {
    setActiveTab(tab);

    switch (tab) {
      case 'comunidad':
        router.push(`/communities/${slug}`);
        return;
      case 'miembros':
        router.push(`/communities/${slug}/members`);
        return;
      case 'acerca':
        if (headerSectionRef.current) {
          headerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      case 'ligas':
      default:
        if (standingsSectionRef.current) {
          standingsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  };

  const getProgressPercentage = (points: number, league: string) => {
    if (!leagueSystem) return 0;
    
    const currentLeague = leagueSystem[league as keyof LeagueSystem];
    const nextLeague = league === 'gold' ? leagueSystem.platinum : 
                      league === 'platinum' ? leagueSystem.diamond : null;
    
    if (!nextLeague) return 100; // Si es la liga más alta
    
    const currentRange = currentLeague.max - currentLeague.min;
    const progress = points - currentLeague.min;
    
    return Math.min((progress / currentRange) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#00D4B3]/30 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#0A2540] dark:text-white/70">Cargando sistema de ligas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-4">Comunidad no encontrada</h1>
            <Button onClick={() => router.push('/communities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Comunidades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0F1419]"
      style={
        isMobile
          ? {
              paddingBottom: `calc(72px + env(safe-area-inset-bottom, 0px))`,
            }
          : undefined
      }
    >
      {/* Navigation Bar */}
      <motion.nav
        className="hidden md:block"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="flex items-center justify-between gap-6 rounded-[32px] bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-xl backdrop-blur-xl px-6 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push(`/communities/${slug}`)}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2540] text-white font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:text-white dark:shadow-[#0A2540]/30"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Volver
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {memberTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabNavigation(tab.id)}
                    className={`group relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-[#0A2540] dark:text-white'
                        : 'text-[#6C757D] hover:text-[#0A2540] dark:text-white/70 dark:hover:text-white'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {tab.label}
                    </span>
                    <span
                      className={`absolute inset-0 rounded-full bg-[#00D4B3] opacity-0 transition-opacity ${
                        activeTab === tab.id
                          ? 'opacity-100 shadow-lg shadow-[#00D4B3]/30 dark:shadow-[#00D4B3]/30'
                          : 'group-hover:opacity-20 bg-[#00D4B3]/50 dark:bg-[#00D4B3]/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-white/60 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar miembros..."
                  className="pl-12 pr-4 py-2 rounded-full bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 text-[#0A2540] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all dark:text-white dark:placeholder-white/60"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Header Section */}
      <motion.section
        ref={headerSectionRef}
        className="relative py-16 px-4 md:px-6 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/5 to-[#00D4B3]/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0A2540]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D4B3]/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          {/* Mobile Controls */}
          <div className="md:hidden mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/communities/${slug}`)}
                className="bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 text-[#0A2540] dark:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Comunidades
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar miembros..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 focus:border-transparent dark:text-white dark:placeholder-white/60"
                />
              </div>
            </div>
          </div>

          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2540] dark:text-white mb-6">
              Sistema de Ligas de{' '}
              <span className="bg-gradient-to-r from-[#0A2540] to-[#00D4B3] dark:from-[#00D4B3] dark:to-[#00D4B3] bg-clip-text text-transparent">
                {community.name}
              </span>
            </h1>
            <p className="text-xl text-[#6C757D] dark:text-white/70 max-w-3xl mx-auto leading-relaxed">
              Gana puntos participando y sube de liga para competir con los mejores
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-12"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F59E0B] dark:text-[#F59E0B]">
                {members.length}
              </div>
              <div className="text-[#6C757D] dark:text-white/70">PARTICIPANTES</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00D4B3] dark:text-[#00D4B3]">
                {members.reduce((sum, m) => sum + (m.points || 0), 0)}
              </div>
              <div className="text-[#6C757D] dark:text-white/70">PUNTOS TOTALES</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0A2540] dark:text-[#00D4B3]">3</div>
              <div className="text-[#6C757D] dark:text-white/70">LIGAS</div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        ref={standingsSectionRef}
        className="px-4 md:px-6 pt-8"
        style={{
          paddingBottom: isMobile
            ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_CONTENT_EXTRA_PADDING}px)`
            : '4rem',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Current User League Status */}
            {currentUser && (
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          {currentUser.profile_picture_url ? (
                            <img
                              src={currentUser.profile_picture_url}
                              alt={currentUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-10 h-10 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F1419] animate-pulse" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
                          {currentUser.first_name && currentUser.last_name
                            ? `${currentUser.first_name} ${currentUser.last_name}`
                            : currentUser.username
                          }
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-bold text-[#00D4B3] dark:text-[#00D4B3]">
                            {currentUser.points} puntos
                          </span>
                          <div className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getLeagueColor(currentUser.league)} text-white`}>
                            {getLeagueIcon(currentUser.league)} {currentUser.league_info.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
                        #{currentUser.rank}
                      </div>
                      <div className="text-sm text-[#6C757D] dark:text-white/70 flex flex-col items-end gap-1">
                        <span className="text-xs font-medium px-2 py-1 bg-[#00D4B3]/10 text-[#00D4B3] dark:text-[#00D4B3] rounded-full">
                          {currentUser.total_members} miembros
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex flex-col sm:hidden space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          {currentUser.profile_picture_url ? (
                            <img
                              src={currentUser.profile_picture_url}
                              alt={currentUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F1419] animate-pulse" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-[#0A2540] dark:text-white truncate">
                          {currentUser.first_name && currentUser.last_name
                            ? `${currentUser.first_name} ${currentUser.last_name}`
                            : currentUser.username
                          }
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-[#00D4B3] dark:text-[#00D4B3]">
                            {currentUser.points} pts
                          </span>
                          <span className="text-[#6C757D] dark:text-white/50">•</span>
                          <span className="font-semibold text-[#0A2540] dark:text-white">
                            #{currentUser.rank}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${getLeagueColor(currentUser.league)} text-white text-center`}>
                        {getLeagueIcon(currentUser.league)} {currentUser.league_info.name}
                      </div>
                      <div className="px-3 py-2 bg-[#00D4B3]/10 text-[#00D4B3] dark:text-[#00D4B3] rounded-lg text-xs font-medium">
                        {currentUser.total_members} miembros
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-[#6C757D] dark:text-white/70 mb-2">
                      <span>Progreso hacia la siguiente liga</span>
                      <span>{Math.round(getProgressPercentage(currentUser.points, currentUser.league))}%</span>
                    </div>
                    <div className="w-full bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(currentUser.points, currentUser.league)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.section>
            )}

            {/* League Information and Points System */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* League Ranks */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                >
                  <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[#F59E0B] dark:text-[#F59E0B]" />
                    Rangos de Puntos por Liga
                  </h3>
                  
                  <div className="space-y-4">
                    {leagueSystem && Object.entries(leagueSystem).map(([key, league]) => (
                      <motion.div
                        key={key}
                        className="flex items-center justify-between p-4 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{league.icon}</span>
                          <div>
                            <div className="font-semibold text-[#0A2540] dark:text-white">{league.name}</div>
                            <div className="text-sm text-[#6C757D] dark:text-white/70">
                              {league.min} - {league.max === Infinity ? '∞' : league.max} puntos
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#6C757D] dark:text-white/70">Miembros</div>
                          <div className="font-bold text-[#0A2540] dark:text-white">
                            {leagueStats ? leagueStats[key] : 0}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.section>

              {/* Points System */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                >
                  <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />
                    Puntos por Acción
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {pointsSystem && Object.entries(pointsSystem).map(([action, points]) => (
                      <motion.div
                        key={action}
                        className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg p-4 text-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-12 h-12 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          {action === 'post' && <Target className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />}
                          {action === 'comment' && <Star className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />}
                          {action === 'reaction' && <Heart className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />}
                          {action === 'popular_post' && <Flame className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />}
                        </div>
                        <div className="text-sm text-[#6C757D] dark:text-white/70 capitalize mb-1">
                          {action.replace('_', ' ')}
                        </div>
                        <div className="font-bold text-[#0A2540] dark:text-white">
                          +{points} puntos
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.section>
            </div>

            {/* Global Leaderboard */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                variants={cardVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#10B981] dark:text-[#10B981]" />
                    Clasificación Global
                  </h3>
                  <div className="text-sm text-[#6C757D] dark:text-white/70">
                    {filteredMembers.length} participantes
                  </div>
                </div>

                {/* League Filters */}
                <div className="flex gap-2 mb-6">
                  {[
                    { key: 'all', label: 'Todas las Ligas' },
                    { key: 'gold', label: 'Oro' },
                    { key: 'platinum', label: 'Platino' },
                    { key: 'diamond', label: 'Diamante' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeFilter === filter.key
                          ? 'bg-[#0A2540] text-white'
                          : 'bg-[#E9ECEF] dark:bg-[#0A0D12] text-[#0A2540] dark:text-white/80 hover:bg-[#6C757D]/20 dark:hover:bg-[#1E2329]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Leaderboard List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg hover:bg-[#6C757D]/10 dark:hover:bg-[#1E2329] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#0A2540] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {member.rank}
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          {member.profile_picture_url ? (
                            <img
                              src={member.profile_picture_url}
                              alt={member.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0A2540] dark:text-white">
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.username
                            }
                          </div>
                          <div className="text-sm text-[#6C757D] dark:text-white/70">
                            {getLeagueIcon(member.league)} {member.league_info.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#00D4B3] dark:text-[#00D4B3]">
                          {member.points} puntos
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.section>

          {/* Games Panel - Full Width Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <motion.div
              className="bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl p-6 shadow-lg dark:shadow-xl"
              variants={cardVariants}
            >
              <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />
                Zona de Juegos
              </h3>

              {/* Games Grid - Responsive 1/2/4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'memory', name: 'Memoria', icon: Brain, description: 'Entrena tu memoria', points: 5 },
                  { id: 'quiz', name: 'Quiz', icon: Target, description: 'Pon a prueba tus conocimientos', points: 10 },
                  { id: 'puzzle', name: 'Puzzle', icon: Puzzle, description: 'Resuelve acertijos', points: 8 },
                  { id: 'speed', name: 'Velocidad', icon: Zap, description: 'Prueba tu rapidez', points: 12 }
                ].map((game) => (
                  <motion.div
                    key={game.id}
                    className="w-full p-4 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg border border-transparent hover:border-[#00D4B3]/40 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 rounded-lg flex items-center justify-center">
                        <game.icon className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#0A2540] dark:text-white">{game.name}</div>
                        <div className="text-sm text-[#6C757D] dark:text-white/70">{game.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-[#F59E0B] dark:text-[#F59E0B]">+{game.points} pts</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-[#00D4B3]/20 to-[#0A2540]/20 rounded-lg border border-[#00D4B3]/30 text-center">
                <Sparkles className="w-6 h-6 text-[#00D4B3] mx-auto mb-2" />
                <p className="text-sm text-[#0A2540] dark:text-white/80">
                  Pronto podrás jugar mini-retos directamente aquí para ganar puntos extra.
                </p>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </motion.section>

      {isMobile && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#1E2329]/95 backdrop-blur-lg border-t border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex items-center justify-around px-4 py-3">
            {memberTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigation(tab.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                    isActive
                      ? 'text-[#00D4B3] dark:text-[#00D4B3]'
                      : 'text-[#6C757D] dark:text-white/70 hover:text-[#0A2540] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </div>
  );
}
