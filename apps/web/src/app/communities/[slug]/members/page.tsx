'use client';

import React, { useState, useEffect, useRef } from 'react';
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
      color: 'from-yellow-400 to-yellow-600', 
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    };
  } else if (rank === 2) {
    return { 
      text: '🥈 #2', 
      color: 'from-gray-300 to-gray-500', 
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30'
    };
  } else if (rank === 3) {
    return { 
      text: '🥉 #3', 
      color: 'from-orange-400 to-orange-600', 
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30'
    };
  } else if (percentage <= 10) {
    return { 
      text: `#${rank}`, 
      color: 'from-purple-400 to-purple-600', 
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    };
  } else if (percentage <= 25) {
    return { 
      text: `#${rank}`, 
      color: 'from-blue-400 to-blue-600', 
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    };
  } else {
    return { 
      text: `#${rank}`, 
      color: 'from-slate-400 to-slate-600', 
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-500/30'
    };
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return { 
        text: 'ADMIN', 
        color: 'from-red-500 to-red-700', 
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: Crown
      };
    case 'moderator':
      return { 
        text: 'MOD', 
        color: 'from-orange-500 to-orange-700', 
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        icon: Award
      };
    default:
      return { 
        text: 'MIEMBRO', 
        color: 'from-green-500 to-green-700', 
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
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
  const [isMobile, setIsMobile] = useState(false);
  const headerSectionRef = useRef<HTMLElement | null>(null);
  const contentSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (slug) {
      fetchMembers();
    }
  }, [slug]);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, sortBy, sortOrder]);

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

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      // console.log('🔍 Fetching members for community:', slug);
      
      const response = await fetch(`/api/communities/${slug}/members`);
      
      if (response.ok) {
        const data = await response.json();
        // console.log('✅ Members data received:', data);
        setCommunity(data.community);
        setMembers(data.members || []);
      } else {
        const errorData = await response.json();
        // console.error('❌ API Error:', errorData);
        if (response.status === 401) {
          router.push('/auth');
        } else if (response.status === 403) {
          router.push(`/communities/${slug}`);
        }
      }
    } catch (error) {
      // console.error('❌ Network error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortMembers = () => {
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
    filtered.sort((a, b) => {
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

    setFilteredMembers(filtered);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-white/70">Cargando miembros...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comunidad no encontrada</h1>
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
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900"
      style={
        isMobile
          ? {
              paddingBottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
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
          <div className="flex items-center justify-between gap-6 rounded-[32px] bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl px-6 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push(`/communities/${slug}`)}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-slate-900 font-semibold shadow-lg shadow-slate-200 transition-all duration-300 hover:-translate-y-0.5 dark:bg-gradient-to-r dark:from-blue-500 dark:to-indigo-500 dark:text-white dark:shadow-blue-500/30"
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
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {tab.label}
                    </span>
                    <span
                      className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity ${
                        activeTab === tab.id
                          ? 'opacity-100 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/30'
                          : 'group-hover:opacity-30 bg-white/50 dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500'
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
                  className="pl-12 pr-4 py-2 rounded-full bg-white/90 border border-white/70 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-white/60"
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="md:hidden mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/communities/${slug}`)}
                className="bg-white/80 border border-gray-200 text-gray-900"
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
                  className="w-full pl-10 pr-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Miembros de{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {community.name}
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Conoce a los miembros de nuestra comunidad y conecta con profesionales increíbles
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-12"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{members.length}</div>
              <div className="text-gray-600 dark:text-slate-400">MIEMBROS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {members.reduce((sum, member) => sum + member.stats.points, 0)}
              </div>
              <div className="text-gray-600 dark:text-slate-400">PUNTOS TOTALES</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {members.reduce((sum, member) => sum + member.stats.posts_count, 0)}
              </div>
              <div className="text-gray-600 dark:text-slate-400">POSTS</div>
            </div>
          </motion.div>

          {/* Sort Controls */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            variants={itemVariants}
          >
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all">
                <Filter className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-gray-900 dark:text-white border-none outline-none cursor-pointer appearance-none pr-6 font-medium"
                >
                  <option value="rank" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Rango</option>
                  <option value="points" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Puntos</option>
                  <option value="joined" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Fecha de unión</option>
                  <option value="name" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Nombre</option>
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
              className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4 text-gray-600 dark:text-slate-400" />
              ) : (
                <SortDesc className="w-4 h-4 text-gray-600 dark:text-slate-400" />
              )}
              <span className="text-gray-700 dark:text-slate-300 text-sm font-medium">
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
        style={{
          paddingBottom: isMobile
            ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_CONTENT_EXTRA_PADDING}px)`
            : '4rem',
        }}
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
                  className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-lg dark:shadow-xl"
                  onClick={() => setSelectedMember(member)}
                >
                  {/* Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
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
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {member.user.first_name && member.user.last_name
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user.username || 'Usuario'
                          }
                        </h3>
                        {!isProfileRestricted && member.user.username && (
                          <p className="text-sm text-gray-600 dark:text-slate-400">@{member.user.username}</p>
                        )}
                        {!isProfileRestricted && member.user.bio && (
                          <p 
                            className="text-sm text-gray-700 dark:text-slate-300 mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeBio(member.user.bio) }}
                          />
                        )}
                        {isProfileRestricted && (
                          <p className="text-sm text-gray-500 dark:text-slate-400 italic mt-1">
                            Este usuario ha restringido su perfil
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats - Solo mostrar si el perfil no está restringido */}
                    {!isProfileRestricted && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                            <span className="text-xs text-gray-600 dark:text-slate-400">Puntos</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.points}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-gray-600 dark:text-slate-400">Posts</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.posts_count}</div>
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
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="w-4 h-4 text-blue-400 group-hover/link:text-blue-300" />
                            </a>
                          )}
                          {member.user.github_url && (
                            <a
                              href={member.user.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-600/20 hover:bg-gray-600/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Github className="w-4 h-4 text-gray-400 group-hover/link:text-gray-300" />
                            </a>
                          )}
                          {member.user.portfolio_url && (
                            <a
                              href={member.user.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors group/link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-4 h-4 text-purple-400 group-hover/link:text-purple-300" />
                            </a>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
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
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron miembros
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
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
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 shadow-2xl"
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
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
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
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto shadow-xl scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil del Miembro</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedMember.user.profile_visibility === 'self' ? (
                /* Perfil restringido - Solo mostrar nombre y foto */
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
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
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedMember.user.first_name && selectedMember.user.last_name
                      ? `${selectedMember.user.first_name} ${selectedMember.user.last_name}`
                      : selectedMember.user.username || 'Usuario'
                    }
                  </h3>
                  <div className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-200 dark:border-slate-600">
                    <p className="text-gray-600 dark:text-slate-400 italic leading-relaxed">
                      Este usuario ha restringido su perfil
                    </p>
                  </div>
                </div>
              ) : (
                /* Perfil público - Mostrar toda la información */
                <>
                  {/* Member Profile */}
                  <div className="text-center mb-8 space-y-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
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
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedMember.user.first_name && selectedMember.user.last_name
                        ? `${selectedMember.user.first_name} ${selectedMember.user.last_name}`
                        : selectedMember.user.username || 'Usuario'
                      }
                    </h3>
                    {selectedMember.user.username && (
                      <p className="text-gray-600 dark:text-slate-400">@{selectedMember.user.username}</p>
                    )}
                    {selectedMember.user.bio && (
                      <p 
                        className="text-gray-700 dark:text-slate-300 mt-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeBio(selectedMember.user.bio) }}
                      />
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                      <Trophy className="w-6 h-6 text-yellow-500 dark:text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMember.stats.points}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">Puntos</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                      <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMember.stats.posts_count}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">Posts</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                      <Heart className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMember.stats.reactions_received}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">Reacciones</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">#{selectedMember.rank}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">Rango</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    {selectedMember.user.email && (
                      <div className="flex items-center gap-3 text-sm sm:text-base">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-slate-300">{selectedMember.user.email}</span>
                      </div>
                    )}
                    {selectedMember.user.location && (
                      <div className="flex items-center gap-3 text-sm sm:text-base">
                        <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-gray-700 dark:text-slate-300">{selectedMember.user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm sm:text-base">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-700 dark:text-slate-300">Se unió {formatJoinDate(selectedMember.joined_at)}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(selectedMember.user.linkedin_url || selectedMember.user.github_url || selectedMember.user.portfolio_url) && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enlaces Sociales</h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {selectedMember.user.linkedin_url && (
                          <a
                            href={selectedMember.user.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 dark:bg-blue-600/20 hover:bg-blue-600/40 dark:hover:bg-blue-600/40 rounded-lg transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-gray-900 dark:text-white">LinkedIn</span>
                          </a>
                        )}
                        {selectedMember.user.github_url && (
                          <a
                            href={selectedMember.user.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600/20 dark:bg-gray-600/20 hover:bg-gray-600/40 dark:hover:bg-gray-600/40 rounded-lg transition-colors"
                          >
                            <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-gray-900 dark:text-white">GitHub</span>
                          </a>
                        )}
                        {selectedMember.user.portfolio_url && (
                          <a
                            href={selectedMember.user.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/20 dark:bg-purple-600/20 hover:bg-purple-600/40 dark:hover:bg-purple-600/40 rounded-lg transition-colors"
                          >
                            <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="text-gray-900 dark:text-white">Portafolio</span>
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
