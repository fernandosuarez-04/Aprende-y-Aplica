'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeBio } from '../../../../lib/sanitize/html-sanitizer';
import { 
  ArrowLeft,
  Search,
  Users,
  Crown,
  Star,
  MessageSquare,
  Heart,
  ThumbsUp,
  MapPin,
  Calendar,
  Mail,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Trophy,
  TrendingUp,
  Award,
  User,
  Filter,
  SortAsc,
  SortDesc,
  Info,
  X
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter, useParams } from 'next/navigation';
import { SkillBadgeList } from '@/features/skills/components/SkillBadgeList';

interface Member {
  id: string;
  role: string;
  joined_at: string;
  rank: number;
  total_members: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    profile_picture_url?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    bio?: string;
    location?: string;
    created_at: string;
    profile_visibility?: string;
  };
  stats: {
    posts_count: number;
    comments_count: number;
    reactions_given: number;
    reactions_received: number;
    points: number;
  };
}

interface Community {
  id: string;
  name: string;
  slug: string;
  access_type: string;
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
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const MOBILE_BOTTOM_NAV_HEIGHT = 72;
const MOBILE_CONTENT_EXTRA_PADDING = 24;

const getRankBadge = (rank: number, total: number) => {
  const percentage = (rank / total) * 100;
  
  if (rank === 1) {
    return { 
      text: '🥇 #1', 
      color: 'from-[#F59E0B] to-[#F59E0B]', 
      bgColor: 'bg-[#F59E0B]/20',
      borderColor: 'border-[#F59E0B]/30'
    };
  } else if (rank === 2) {
    return { 
      text: '🥈 #2', 
      color: 'from-[#6C757D] to-[#6C757D]', 
      bgColor: 'bg-[#6C757D]/20',
      borderColor: 'border-[#6C757D]/30'
    };
  } else if (rank === 3) {
    return { 
      text: '🥉 #3', 
      color: 'from-[#10B981] to-[#10B981]', 
      bgColor: 'bg-[#10B981]/20',
      borderColor: 'border-[#10B981]/30'
    };
  } else if (percentage <= 10) {
    return { 
      text: `#${rank}`, 
      color: 'from-[#00D4B3] to-[#00D4B3]', 
      bgColor: 'bg-[#00D4B3]/20',
      borderColor: 'border-[#00D4B3]/30'
    };
  } else if (percentage <= 25) {
    return { 
      text: `#${rank}`, 
      color: 'from-[#0A2540] to-[#00D4B3]', 
      bgColor: 'bg-[#0A2540]/20',
      borderColor: 'border-[#0A2540]/30'
    };
  } else {
    return { 
      text: `#${rank}`, 
      color: 'from-[#6C757D] to-[#6C757D]', 
      bgColor: 'bg-[#6C757D]/20',
      borderColor: 'border-[#6C757D]/30'
    };
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return { 
        text: 'ADMIN', 
        color: 'from-[#0A2540] to-[#0A2540]', 
        bgColor: 'bg-[#0A2540]/20',
        borderColor: 'border-[#0A2540]/30',
        icon: Crown
      };
    case 'moderator':
      return { 
        text: 'MOD', 
        color: 'from-[#00D4B3] to-[#00D4B3]', 
        bgColor: 'bg-[#00D4B3]/20',
        borderColor: 'border-[#00D4B3]/30',
        icon: Award
      };
    default:
      return { 
        text: 'MIEMBRO', 
        color: 'from-[#10B981] to-[#10B981]', 
        bgColor: 'bg-[#10B981]/20',
        borderColor: 'border-[#10B981]/30',
        icon: User
      };
  }
};

export default function MembersPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'points' | 'joined' | 'name'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'comunidad' | 'miembros' | 'ligas'>('miembros');
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [memberSkills, setMemberSkills] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const headerSectionRef = useRef<HTMLElement | null>(null);
  const contentSectionRef = useRef<HTMLElement | null>(null);

  // 🚀 OPTIMIZACIÓN: Cargar miembros cuando cambie el slug
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function loadMembers() {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/communities/${slug}/members`, {
          // Agregar caché para mejorar performance en navegaciones repetidas
          next: { revalidate: 60 } // Revalidar cada 60 segundos
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setCommunity(data.community);
          setMembers(data.members || []);
        } else {
          const errorData = await response.json();
          if (response.status === 401) {
            router.push('/auth');
          } else if (response.status === 403 && errorData.requiresQuestionnaire) {
            // Si requiere cuestionario, redirigir a la página de estadísticas
            router.push('/statistics');
          } else if (response.status === 403) {
            // Otros errores 403, redirigir a la página principal de la comunidad
            router.push(`/communities/${slug}`);
          } else if (response.status === 404) {
            // Comunidad no encontrada, mantener en la página pero mostrar el mensaje
            setCommunity(null);
          }
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [slug, router]);

  // 🚀 OPTIMIZACIÓN: Memoizar el filtrado y ordenamiento para evitar cálculos innecesarios
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.user.first_name?.toLowerCase().includes(query) ||
        member.user.last_name?.toLowerCase().includes(query) ||
        member.user.username?.toLowerCase().includes(query) ||
        member.user.email?.toLowerCase().includes(query)
      );
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'points':
          comparison = a.stats.points - b.stats.points;
          break;
        case 'joined':
          comparison = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
          break;
        case 'name':
          const nameA = `${a.user.first_name || ''} ${a.user.last_name || ''}`.trim();
          const nameB = `${b.user.first_name || ''} ${b.user.last_name || ''}`.trim();
          comparison = nameA.localeCompare(nameB);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [members, searchQuery, sortBy, sortOrder]);

  // Sincronizar con el estado filteredMembers solo cuando cambie el resultado memoizado
  useEffect(() => {
    setFilteredMembers(filteredAndSortedMembers);
  }, [filteredAndSortedMembers]);

  useEffect(() => {
    // Solo ejecutar en el cliente para evitar problemas de hidratación
    if (typeof window === 'undefined') return;
    
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Inicializar después del primer render para evitar diferencias SSR/CSR
    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (selectedMember?.user?.id) {
      loadMemberSkills(selectedMember.user.id);
    } else {
      setMemberSkills([]);
    }
  }, [selectedMember?.user?.id]);

  const loadMemberSkills = async (userId: string) => {
    setLoadingSkills(true);
    try {
      const response = await fetch(`/api/users/${userId}/skills`);
      const data = await response.json();
      if (data.success && data.skills) {
        // Transformar datos al formato esperado
        const formattedSkills = data.skills.map((skill: any) => ({
          skill_id: skill.skill_id,
          name: skill.skill?.name || '',
          slug: skill.skill?.slug || '',
          description: skill.skill?.description || null,
          category: skill.skill?.category || 'other',
          icon_url: skill.skill?.icon_url || null,
          level: skill.level || null,
          badge_url: skill.badge_url || null,
          course_count: skill.course_count || 0
        }));
        setMemberSkills(formattedSkills);
      }
    } catch (error) {
      console.error('Error loading member skills:', error);
      setMemberSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const memberTabs = [
    { id: 'comunidad' as const, label: 'Comunidad', icon: MessageSquare },
    { id: 'miembros' as const, label: 'Miembros', icon: Users },
    { id: 'ligas' as const, label: 'Ligas', icon: Trophy },
  ];

  const handleTabNavigation = (tab: 'comunidad' | 'miembros' | 'ligas') => {
    setActiveTab(tab);

    switch (tab) {
      case 'comunidad':
        router.push(`/communities/${slug}`);
        return;
      case 'ligas':
        router.push(`/communities/${slug}/leagues`);
        return;
      case 'miembros':
      default:
        if (contentSectionRef.current) {
          contentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#00D4B3]/30 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#0A2540] dark:text-white/70">Cargando miembros...</p>
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
      className={`min-h-screen bg-white dark:bg-[#0F1419] ${isMobile === true ? 'pb-[calc(72px+env(safe-area-inset-bottom,0px))]' : ''}`}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar miembros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              Miembros de{' '}
              <span className="bg-gradient-to-r from-[#0A2540] to-[#00D4B3] dark:from-[#00D4B3] dark:to-[#00D4B3] bg-clip-text text-transparent">
                {community.name}
              </span>
            </h1>
            <p className="text-xl text-[#6C757D] dark:text-white/70 max-w-3xl mx-auto leading-relaxed">
              Conoce a los miembros de nuestra comunidad y conecta con profesionales increíbles
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-12"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0A2540] dark:text-[#00D4B3]">{members.length}</div>
              <div className="text-[#6C757D] dark:text-white/70">MIEMBROS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00D4B3] dark:text-[#00D4B3]">
                {members.reduce((sum, member) => sum + member.stats.points, 0)}
              </div>
              <div className="text-[#6C757D] dark:text-white/70">PUNTOS TOTALES</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#10B981] dark:text-[#10B981]">
                {members.reduce((sum, member) => sum + member.stats.posts_count, 0)}
              </div>
              <div className="text-[#6C757D] dark:text-white/70">POSTS</div>
            </div>
          </motion.div>

          {/* Sort Controls */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            variants={itemVariants}
          >
            <div className="relative">
              <div className="flex items-center gap-2 bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg p-3 hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] transition-all">
                <Filter className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[#0A2540] dark:text-white border-none outline-none cursor-pointer appearance-none pr-6 font-medium"
                >
                  <option value="rank" className="bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white">Rango</option>
                  <option value="points" className="bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white">Puntos</option>
                  <option value="joined" className="bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white">Fecha de unión</option>
                  <option value="name" className="bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white">Nombre</option>
                </select>
                <div className="absolute right-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg p-3 hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] transition-all"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
              ) : (
                <SortDesc className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
              )}
              <span className="text-[#0A2540] dark:text-white text-sm font-medium">
                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </span>
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Members Grid */}
      <motion.section
        ref={contentSectionRef}
        className="px-4 md:px-6 pt-8"
        className={isMobile === true ? 'pb-[calc(72px+env(safe-area-inset-bottom,0px)+24px)]' : 'pb-16'}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredMembers.map((member, index) => {
              const rankBadge = getRankBadge(member.rank, member.total_members);
              const roleBadge = getRoleBadge(member.role);
              const RoleIcon = roleBadge.icon;
              const isProfileRestricted = member.user.profile_visibility === 'self';
              
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative bg-white dark:bg-[#1E2329] backdrop-blur-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-2xl overflow-hidden hover:border-[#00D4B3]/50 dark:hover:border-[#00D4B3]/50 transition-all duration-300 cursor-pointer shadow-lg dark:shadow-xl"
                  onClick={() => setSelectedMember(member)}
                >
                  {/* Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540]/5 to-[#00D4B3]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative p-6">
                    {/* Header with Rank and Role */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${rankBadge.color} ${rankBadge.bgColor} ${rankBadge.borderColor} border`}>
                        {rankBadge.text}
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${roleBadge.color} ${roleBadge.bgColor} ${roleBadge.borderColor} border`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleBadge.text}
                      </div>
                    </div>

                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          {member.user.profile_picture_url ? (
                            <img
                              src={member.user.profile_picture_url}
                              alt={`${member.user.first_name} ${member.user.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F1419] animate-pulse" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-[#0A2540] dark:text-white truncate">
                          {member.user.first_name && member.user.last_name
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user.username || 'Usuario'
                          }
                        </h3>
                        {!isProfileRestricted && member.user.username && (
                          <p className="text-sm text-[#6C757D] dark:text-white/70">@{member.user.username}</p>
                        )}
                        {!isProfileRestricted && member.user.bio && (
                          <p 
                            className="text-sm text-[#0A2540] dark:text-white/80 mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeBio(member.user.bio) }}
                          />
                        )}
                        {isProfileRestricted && (
                          <p className="text-sm text-[#6C757D] dark:text-white/60 italic mt-1">
                            Este usuario ha restringido su perfil
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats - Solo mostrar si el perfil no está restringido */}
                    {!isProfileRestricted && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-[#F59E0B] dark:text-[#F59E0B]" />
                            <span className="text-xs text-[#6C757D] dark:text-white/70">Puntos</span>
                          </div>
                          <div className="text-lg font-bold text-[#0A2540] dark:text-white">{member.stats.points}</div>
                        </div>
                        <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-[#00D4B3] dark:text-[#00D4B3]" />
                            <span className="text-xs text-[#6C757D] dark:text-white/70">Posts</span>
                          </div>
                          <div className="text-lg font-bold text-[#0A2540] dark:text-white">{member.stats.posts_count}</div>
                        </div>
                      </div>
                    )}

                    {/* Social Links - Solo mostrar si el perfil no está restringido */}
                    {!isProfileRestricted && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {member.user.linkedin_url && (
                            <a
                              href={member.user.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#0A2540]/20 hover:bg-[#0A2540]/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3] group-hover/link:text-[#00D4B3]" />
                            </a>
                          )}
                          {member.user.github_url && (
                            <a
                              href={member.user.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#6C757D]/20 hover:bg-[#6C757D]/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Github className="w-4 h-4 text-[#6C757D] dark:text-white/70 group-hover/link:text-[#00D4B3]" />
                            </a>
                          )}
                          {member.user.portfolio_url && (
                            <a
                              href={member.user.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#00D4B3]/20 hover:bg-[#00D4B3]/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-4 h-4 text-[#00D4B3] group-hover/link:text-[#00D4B3]" />
                            </a>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-[#6C757D] dark:text-white/70">
                            <Calendar className="w-3 h-3" />
                            {formatJoinDate(member.joined_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredMembers.length === 0 && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E9ECEF] dark:bg-[#1E2329] flex items-center justify-center">
                <Users className="w-12 h-12 text-[#6C757D] dark:text-white/70" />
              </div>
              <h3 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2">
                No se encontraron miembros
              </h3>
              <p className="text-[#6C757D] dark:text-white/70">
                Intenta ajustar tu búsqueda
              </p>
            </motion.div>
          )}
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

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1E2329] rounded-3xl p-6 sm:p-8 w-full max-w-md sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto shadow-xl scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Perfil del Miembro</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#6C757D] dark:text-white/70 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedMember.user.profile_visibility === 'self' ? (
                /* Perfil restringido - Solo mostrar nombre y foto */
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center mx-auto">
                    {selectedMember.user.profile_picture_url ? (
                      <img
                        src={selectedMember.user.profile_picture_url}
                        alt={`${selectedMember.user.first_name} ${selectedMember.user.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
                    {selectedMember.user.first_name && selectedMember.user.last_name
                      ? `${selectedMember.user.first_name} ${selectedMember.user.last_name}`
                      : selectedMember.user.username || 'Usuario'
                    }
                  </h3>
                  <div className="p-6 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <p className="text-[#6C757D] dark:text-white/70 italic leading-relaxed">
                      Este usuario ha restringido su perfil
                    </p>
                  </div>
                </div>
              ) : (
                /* Perfil público - Mostrar toda la información */
                <>
                  {/* Member Profile */}
                  <div className="text-center mb-8 space-y-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center mx-auto">
                      {selectedMember.user.profile_picture_url ? (
                        <img
                          src={selectedMember.user.profile_picture_url}
                          alt={`${selectedMember.user.first_name} ${selectedMember.user.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
                      {selectedMember.user.first_name && selectedMember.user.last_name
                        ? `${selectedMember.user.first_name} ${selectedMember.user.last_name}`
                        : selectedMember.user.username || 'Usuario'
                      }
                    </h3>
                    {selectedMember.user.username && (
                      <p className="text-[#6C757D] dark:text-white/70">@{selectedMember.user.username}</p>
                    )}
                    {selectedMember.user.bio && (
                      <p 
                        className="text-[#0A2540] dark:text-white/80 mt-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeBio(selectedMember.user.bio) }}
                      />
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
                    <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-2xl p-4 text-center">
                      <Trophy className="w-6 h-6 text-[#F59E0B] dark:text-[#F59E0B] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{selectedMember.stats.points}</div>
                      <div className="text-xs text-[#6C757D] dark:text-white/70">Puntos</div>
                    </div>
                    <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-2xl p-4 text-center">
                      <MessageSquare className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{selectedMember.stats.posts_count}</div>
                      <div className="text-xs text-[#6C757D] dark:text-white/70">Posts</div>
                    </div>
                    <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-2xl p-4 text-center">
                      <Heart className="w-6 h-6 text-[#10B981] dark:text-[#10B981] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{selectedMember.stats.reactions_received}</div>
                      <div className="text-xs text-[#6C757D] dark:text-white/70">Reacciones</div>
                    </div>
                    <div className="bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-2xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-[#00D4B3] dark:text-[#00D4B3] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-[#0A2540] dark:text-white">#{selectedMember.rank}</div>
                      <div className="text-xs text-[#6C757D] dark:text-white/70">Rango</div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {memberSkills.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4">
                        Skills
                      </h4>
                      <SkillBadgeList
                        skills={memberSkills}
                        showFilter={false}
                        size="sm"
                        layout="overlap"
                      />
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-4">
                    {selectedMember.user.email && (
                      <div className="flex items-center gap-3 text-sm sm:text-base">
                        <Mail className="w-5 h-5 text-[#00D4B3] dark:text-[#00D4B3]" />
                        <span className="text-[#0A2540] dark:text-white/80">{selectedMember.user.email}</span>
                      </div>
                    )}
                    {selectedMember.user.location && (
                      <div className="flex items-center gap-3 text-sm sm:text-base">
                        <MapPin className="w-5 h-5 text-[#10B981] dark:text-[#10B981]" />
                        <span className="text-[#0A2540] dark:text-white/80">{selectedMember.user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm sm:text-base">
                      <Calendar className="w-5 h-5 text-[#00D4B3] dark:text-[#00D4B3]" />
                      <span className="text-[#0A2540] dark:text-white/80">Se unió {formatJoinDate(selectedMember.joined_at)}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(selectedMember.user.linkedin_url || selectedMember.user.github_url || selectedMember.user.portfolio_url) && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4">Enlaces Sociales</h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {selectedMember.user.linkedin_url && (
                          <a
                            href={selectedMember.user.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2540]/20 dark:bg-[#0A2540]/20 hover:bg-[#0A2540]/40 dark:hover:bg-[#0A2540]/40 rounded-lg transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                            <span className="text-[#0A2540] dark:text-white">LinkedIn</span>
                          </a>
                        )}
                        {selectedMember.user.github_url && (
                          <a
                            href={selectedMember.user.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#6C757D]/20 dark:bg-[#6C757D]/20 hover:bg-[#6C757D]/40 dark:hover:bg-[#6C757D]/40 rounded-lg transition-colors"
                          >
                            <Github className="w-5 h-5 text-[#6C757D] dark:text-white/70" />
                            <span className="text-[#0A2540] dark:text-white">GitHub</span>
                          </a>
                        )}
                        {selectedMember.user.portfolio_url && (
                          <a
                            href={selectedMember.user.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/40 dark:hover:bg-[#00D4B3]/40 rounded-lg transition-colors"
                          >
                            <Globe className="w-5 h-5 text-[#00D4B3] dark:text-[#00D4B3]" />
                            <span className="text-[#0A2540] dark:text-white">Portafolio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
