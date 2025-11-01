'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
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
  Puzzle
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
    case 'gold': return 'from-yellow-400 to-yellow-600';
    case 'platinum': return 'from-gray-300 to-gray-500';
    case 'diamond': return 'from-blue-400 to-blue-600';
    default: return 'from-slate-400 to-slate-600';
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
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchLeaguesData();
    }
  }, [slug]);

  useEffect(() => {
    filterMembers();
  }, [members, activeFilter]);

  const fetchLeaguesData = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching leagues data for community:', slug);
      
      const response = await fetch(`/api/communities/${slug}/leagues`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Leagues data received:', data);
        setCommunity(data.community);
        setCurrentUser(data.currentUser);
        setMembers(data.members || []);
        setLeagueSystem(data.leagueSystem);
        setPointsSystem(data.pointsSystem);
        setLeagueStats(data.leagueStats);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        if (response.status === 401) {
          router.push('/auth');
        } else if (response.status === 403) {
          router.push(`/communities/${slug}`);
        }
      }
    } catch (error) {
      console.error('❌ Network error fetching leagues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(member => member.league === activeFilter);
    }
    
    setFilteredMembers(filtered);
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

  const startGame = (gameType: string) => {
    setSelectedGame(gameType);
    setGameScore(0);
    setGameTime(0);
    setIsGameActive(true);
  };

  const stopGame = () => {
    setIsGameActive(false);
    setSelectedGame(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-white/70">Cargando sistema de ligas...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Navigation Bar */}
      <motion.nav
        className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/communities/${slug}`)}
                className="bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex items-center gap-1">
                {['comunidad', 'miembros', 'ligas', 'acerca'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'comunidad') {
                        router.push(`/communities/${slug}`);
                      } else if (tab === 'miembros') {
                        router.push(`/communities/${slug}/members`);
                      } else if (tab === 'ligas') {
                        // Ya estamos aquí
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      tab === 'ligas'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en esta comunidad..."
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Header Section */}
            <motion.section
              className="text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                  Sistema de{' '}
                  <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                    Ligas
                  </span>
                </h1>
                <p className="text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  Gana puntos participando y sube de liga para competir con los mejores
                </p>
              </motion.div>
            </motion.section>

            {/* Current User League Status */}
            {currentUser && (
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="bg-white dark:bg-gradient-to-r dark:from-slate-800/50 dark:to-slate-700/50 backdrop-blur-sm border border-gray-200 dark:border-slate-600/50 rounded-2xl p-8 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {currentUser.first_name && currentUser.last_name
                            ? `${currentUser.first_name} ${currentUser.last_name}`
                            : currentUser.username
                          }
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {currentUser.points} puntos
                          </span>
                          <div className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getLeagueColor(currentUser.league)} text-white`}>
                            {getLeagueIcon(currentUser.league)} {currentUser.league_info.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        #{currentUser.rank}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        de {currentUser.total_members} miembros
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
                      <span>Progreso hacia la siguiente liga</span>
                      <span>{Math.round(getProgressPercentage(currentUser.points, currentUser.league))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
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
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    Rangos de Puntos por Liga
                  </h3>
                  
                  <div className="space-y-4">
                    {leagueSystem && Object.entries(leagueSystem).map(([key, league]) => (
                      <motion.div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{league.icon}</span>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{league.name}</div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">
                              {league.min} - {league.max === Infinity ? '∞' : league.max} puntos
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-slate-400">Miembros</div>
                          <div className="font-bold text-gray-900 dark:text-white">
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
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                  variants={cardVariants}
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Puntos por Acción
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {pointsSystem && Object.entries(pointsSystem).map(([action, points]) => (
                      <motion.div
                        key={action}
                        className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-4 text-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-12 h-12 bg-blue-500/20 dark:bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          {action === 'post' && <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                          {action === 'comment' && <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                          {action === 'reaction' && <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                          {action === 'popular_post' && <Flame className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 capitalize mb-1">
                          {action.replace('_', ' ')}
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">
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
                className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg dark:shadow-xl"
                variants={cardVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Clasificación Global
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600/50'
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
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600/30 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {member.rank}
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.username
                            }
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400">
                            {getLeagueIcon(member.league)} {member.league_info.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {member.points} puntos
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.section>
          </div>

          {/* Right Column - Games Panel */}
          <div className="lg:col-span-1">
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 sticky top-8 shadow-lg dark:shadow-xl"
                variants={cardVariants}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Zona de Juegos
                </h3>
                
                <div className="space-y-4">
                  {/* Game Selection */}
                  <div className="space-y-3">
                    {[
                      { id: 'memory', name: 'Memoria', icon: Brain, description: 'Entrena tu memoria', points: 5 },
                      { id: 'quiz', name: 'Quiz', icon: Target, description: 'Pon a prueba tus conocimientos', points: 10 },
                      { id: 'puzzle', name: 'Puzzle', icon: Puzzle, description: 'Resuelve acertijos', points: 8 },
                      { id: 'speed', name: 'Velocidad', icon: Zap, description: 'Prueba tu rapidez', points: 12 }
                    ].map((game) => (
                      <motion.button
                        key={game.id}
                        onClick={() => startGame(game.id)}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600/30 transition-colors text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <game.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">{game.name}</div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">{game.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">+{game.points} pts</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Active Game */}
                  {selectedGame && (
                    <motion.div
                      className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-white mb-2">
                          {selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1)}
                        </div>
                        <div className="text-3xl font-bold text-purple-400 mb-2">
                          {gameScore}
                        </div>
                        <div className="text-sm text-slate-400 mb-4">
                          Puntos obtenidos
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsGameActive(!isGameActive)}
                            className="flex-1"
                            size="sm"
                          >
                            {isGameActive ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Jugar
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={stopGame}
                            variant="outline"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Game Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700/50">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Estadísticas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Juegos jugados</span>
                        <span className="text-gray-900 dark:text-white">0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Puntos ganados</span>
                        <span className="text-gray-900 dark:text-white">0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Mejor puntuación</span>
                        <span className="text-gray-900 dark:text-white">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
