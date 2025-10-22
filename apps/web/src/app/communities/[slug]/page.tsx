'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Search,
  Users,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Plus,
  Image,
  FileText,
  Link,
  Play,
  BarChart3,
  Send,
  Clock,
  CheckCircle,
  Lock,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter, useParams } from 'next/navigation';

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
  user_role?: string;
  can_join?: boolean;
}

interface Post {
  id: string;
  community_id: string;
  user_id: string;
  title?: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  likes_count: number;
  comments_count: number;
  reaction_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_has_liked?: boolean;
  user_reaction_type?: string;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
  };
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
  hidden: { opacity: 0, scale: 0.95, y: 20 },
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
    y: -2,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('comunidad');

  useEffect(() => {
    if (slug) {
      fetchCommunityDetail();
      fetchPosts();
    }
  }, [slug]);

  const fetchCommunityDetail = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data.community);
      } else {
        console.error('Error fetching community:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/communities/${slug}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        const errorData = await response.json();
        console.error('Error fetching posts:', errorData);
        
        // Si es error de autenticación, no mostrar posts pero permitir ver la comunidad
        if (response.status === 401 && errorData.requires_auth) {
          setPosts([]);
        } else if (response.status === 403 && errorData.requires_membership) {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!community) return;
    
    try {
      setIsJoining(true);
      
      if (community.access_type === 'free') {
        const response = await fetch('/api/communities/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ communityId: community.id }),
        });

        if (response.ok) {
          // Actualizar estado local
          setCommunity(prev => prev ? { ...prev, is_member: true, member_count: prev.member_count + 1 } : null);
          // Recargar posts para mostrar contenido completo
          fetchPosts();
        } else {
          const errorData = await response.json();
          console.error('Error joining community:', errorData.error);
        }
      } else {
        const response = await fetch('/api/communities/request-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ communityId: community.id }),
        });

        if (response.ok) {
          setCommunity(prev => prev ? { ...prev, has_pending_request: true } : null);
        } else {
          const errorData = await response.json();
          console.error('Error requesting access:', errorData.error);
        }
      }
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getCommunityStyle = (community: Community) => {
    if (community.slug === 'profesionales') {
      return {
        background: 'bg-gradient-to-br from-blue-900/40 to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        accent: 'text-blue-400',
        border: 'border-blue-500/30'
      };
    } else if (community.slug === 'ecos-liderazgo') {
      return {
        background: 'bg-gradient-to-br from-purple-900/40 to-slate-800/60',
        headerBg: 'bg-gradient-to-r from-purple-600 to-purple-700',
        accent: 'text-orange-400',
        border: 'border-orange-500/30'
      };
    } else if (community.slug === 'openminder') {
      return {
        background: 'bg-gradient-to-br from-slate-900/50 to-black/60',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-900',
        accent: 'text-yellow-400',
        border: 'border-yellow-500/30'
      };
    }
    
    return {
      background: 'bg-gradient-to-br from-slate-800/50 to-slate-900/60',
      headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
      accent: 'text-slate-400',
      border: 'border-slate-600/30'
    };
  };

  const getAccessButton = () => {
    if (!community) return null;

    if (community.is_member) {
      return (
        <Button
          className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
          disabled
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Ya eres miembro
        </Button>
      );
    }

    if (community.has_pending_request) {
      return (
        <Button
          className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30"
          disabled
        >
          <Clock className="w-4 h-4 mr-2" />
          Solicitud pendiente
        </Button>
      );
    }

    if (community.access_type === 'free') {
      if (community.can_join === false) {
        return (
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-2">Ya perteneces a otra comunidad</div>
            <Button
              className="bg-slate-600/50 text-slate-400 border border-slate-600/50"
              disabled
            >
              <Lock className="w-4 h-4 mr-2" />
              Acceso Restringido
            </Button>
          </div>
        );
      }
      
      return (
        <Button
          onClick={handleJoinCommunity}
          disabled={isJoining}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isJoining ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2" />
          )}
          Unirse Gratis
        </Button>
      );
    }

    return (
      <Button
        onClick={handleJoinCommunity}
        disabled={isJoining}
        className="bg-purple-500 hover:bg-purple-600 text-white"
      >
        {isJoining ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Lock className="w-4 h-4 mr-2" />
        )}
        Solicitar Acceso
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Comunidad no encontrada</h1>
            <Button onClick={() => router.push('/communities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Comunidades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const communityStyle = getCommunityStyle(community);
  const canViewContent = community.is_member || (community.access_type === 'free' && community.can_join !== false);
  const needsAuth = !community.is_member && community.access_type === 'invitation_only';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Bar */}
      <motion.nav
        className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/communities')}
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex items-center gap-1">
                {['comunidad', 'miembros', 'ligas', 'acerca'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en esta comunidad..."
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Community Header */}
      <motion.section
        className={`relative py-16 px-6 overflow-hidden ${communityStyle.background}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            className="flex items-start justify-between"
            variants={itemVariants}
          >
            <div className="flex items-start gap-6">
              {/* Community Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {community.name}
                </h1>
                <p className="text-xl text-white/90 mb-4 max-w-2xl">
                  {community.description}
                </p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="w-4 h-4" />
                    {community.member_count} Miembros
                  </div>
                  <div className={`flex items-center gap-2 ${communityStyle.accent}`}>
                    {community.access_type === 'free' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {community.access_type === 'free' ? 'Acceso Gratuito' : 'Por Invitación'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              {getAccessButton()}
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">24</div>
                <div className="text-slate-400 text-sm">POSTS</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">7</div>
                <div className="text-slate-400 text-sm">COMENTARIOS</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">11</div>
                <div className="text-slate-400 text-sm">REACCIONES</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.section
        className="px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          {canViewContent ? (
            <>
              {/* Create Post Card - Solo para miembros */}
              {community.is_member && (
                <motion.div
                  variants={cardVariants}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Escribe algo para la comunidad..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50">
                            <Plus className="w-4 h-4 mr-2" />
                            Adjuntar
                          </Button>
                        </div>
                        <Button
                          disabled={!newPostContent.trim()}
                          className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Publicar
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Posts Feed */}
              <motion.div
                variants={containerVariants}
                className="space-y-6"
              >
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    variants={cardVariants}
                    whileHover="hover"
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6"
                  >
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {post.user?.user_metadata?.full_name || post.user?.email || 'Usuario'}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Hace {Math.floor(Math.random() * 30)} días • general
                          </p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-white leading-relaxed">{post.content}</p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-4 border-t border-slate-700/50">
                      <button className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors">
                        <Heart className="w-5 h-5" />
                        <span>{post.likes_count}</span>
                      </button>
                      <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments_count}</span>
                      </button>
                      <button className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span>Compartir</span>
                      </button>
                    </div>
                  </motion.div>
                ))}

                {posts.length === 0 && (
                  <motion.div
                    variants={cardVariants}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No hay posts aún
                    </h3>
                    <p className="text-slate-400">
                      Sé el primero en compartir algo en esta comunidad
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </>
          ) : (
            /* Preview Mode for Non-Members */
            <motion.div
              variants={cardVariants}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                <EyeOff className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Contenido restringido
              </h3>
              <p className="text-slate-400 mb-6">
                {community.access_type === 'free' 
                  ? 'Únete a esta comunidad para ver todo el contenido'
                  : 'Esta comunidad es solo por invitación'
                }
              </p>
              {getAccessButton()}
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
