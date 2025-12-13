'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Lock, UserPlus, Users, MessageSquare, Share2, Copy, Check, Send } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useQuestionnaireValidation } from '@/features/auth/hooks/useQuestionnaireValidation'
import { QuestionnaireRequiredModal } from '@/features/auth/components/QuestionnaireRequiredModal'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/core/utils/date-utils'
import { PostMenu, EditPostModal } from '@/features/communities/components'
import { PostAttachment } from '@/features/communities/components/PostAttachment'
import { ReactionButton } from '@/features/communities/components/ReactionButton'
import { ReactionBanner } from '@/features/communities/components/ReactionBanner'
import { ReactionDetailsModal } from '@/features/communities/components/ReactionDetailsModal'
import { Button } from '@aprende-y-aplica/ui'
import dynamic from 'next/dynamic'

// Componentes locales (copiados de la página principal para mantener consistencia)
function LocalCommentsSection({ postId, communitySlug, onCommentAdded, showComments, setShowComments }: any) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      // Silenciar errores
    }
  }

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, postId, communitySlug])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        onCommentAdded?.(data.comment)
      } else {
        const errorData = await response.json()
        alert('Error al crear el comentario: ' + errorData.error)
      }
    } catch (error) {
      alert('Error al crear el comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4">
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'Enviando...' : 'Comentar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.first_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.user?.first_name && comment.user?.last_name 
                            ? `${comment.user.first_name} ${comment.user.last_name}`
                            : comment.user?.username || 'Usuario'
                          }
                        </span>
                        <span className="text-gray-600 dark:text-slate-400 text-sm">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-slate-200">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShareButton({ postId, postContent, communityName, communitySlug, isFacebookStyle = false }: any) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const postUrl = `${window.location.origin}/communities/${communitySlug}/posts/${postId}`
  const shareText = `Mira este post de ${communityName}: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Silenciar errores
    }
  }

  if (isFacebookStyle) {
    return (
      <div className="relative" ref={buttonRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Compartir</span>
        </button>
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-2 min-w-[200px] z-50"
          >
            <button
              onClick={() => copyToClipboard(postUrl)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

interface Post {
  id: string
  community_id: string
  user_id: string
  content: string
  attachment_url?: string | null
  attachment_type?: string | null
  attachment_data?: any
  likes_count: number
  comment_count: number
  reaction_count: number
  is_pinned: boolean
  is_edited: boolean
  created_at: string
  updated_at: string
  user?: {
    id: string
    username?: string
    first_name?: string
    last_name?: string
    profile_picture_url?: string
    email?: string
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const communitySlug = params.slug as string
  const postId = params.postSlug as string // En realidad es el ID del post

  const [post, setPost] = useState<Post | null>(null)
  const [community, setCommunity] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const [postReactions, setPostReactions] = useState<Record<string, { type: string | null; count: number }>>({})
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({})
  const [postReactionStats, setPostReactionStats] = useState<Record<string, any>>({})
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({})
  const [showReactionDetails, setShowReactionDetails] = useState<Record<string, boolean>>({})
  const [selectedReactionType, setSelectedReactionType] = useState<string | null>(null)

  // Validar cuestionario
  const { isRequired, isLoading: isLoadingValidation } = useQuestionnaireValidation(user?.id)

  // Helper para obtener el emoji de reacción
  const getReactionEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      'like': '👍',
      'love': '❤️',
      'laugh': '😂',
      'haha': '😂',
      'wow': '😮',
      'sad': '😢',
      'angry': '😡',
      'clap': '👏',
      'fire': '🔥',
      'rocket': '🚀',
      'eyes': '👀'
    }
    return emojiMap[type] || '👍'
  }

  useEffect(() => {
    if (user && !isLoadingValidation && isRequired) {
      setShowQuestionnaireModal(true)
    }
  }, [user, isLoadingValidation, isRequired])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Obtener información completa de la comunidad usando el endpoint
        const communityResponse = await fetch(`/api/communities/${communitySlug}`)
        if (!communityResponse.ok) {
          const errorData = await communityResponse.json()
          if (errorData.requiresQuestionnaire) {
            setShowQuestionnaireModal(true)
            return
          }
          setError(errorData.error || 'Comunidad no encontrada')
          return
        }

        const communityData = await communityResponse.json()
        setCommunity(communityData.community)

        // Verificar acceso
        const canViewContent = communityData.community.is_member || 
          (communityData.community.access_type === 'free' && communityData.community.can_join !== false) || 
          (communityData.community.slug === 'profesionales' && communityData.community.is_member)

        if (!canViewContent && communityData.community.access_type === 'invitation_only') {
          setError('No tienes acceso a esta comunidad')
          return
        }

        // Obtener el post por ID
        const { data: postData, error: postError } = await supabase
          .from('community_posts')
          .select(`
            *,
            user:user_id (
              id,
              username,
              first_name,
              last_name,
              profile_picture_url,
              email
            )
          `)
          .eq('id', postId)
          .eq('community_id', communityData.community.id)
          .single()

        if (postError || !postData) {
          setError('Post no encontrado')
          return
        }

        setPost(postData as Post)

        // Cargar reacciones del usuario y estadísticas
        if (user) {
          try {
            const reactionResponse = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions?include_stats=true`)
            if (reactionResponse.ok) {
              const reactionData = await reactionResponse.json()
              setUserReactions({ [postId]: reactionData.userReaction || null })
              setPostReactions({ [postId]: { type: null, count: reactionData.totalReactions || 0 } })
              setPostReactionStats({ [postId]: reactionData.reactions || {} })
            }
          } catch (err) {
            // Silenciar errores de reacciones
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err)
        setError('Error al cargar el post')
      } finally {
        setIsLoading(false)
      }
    }

    if (communitySlug && postId) {
      fetchData()
    }
  }, [communitySlug, postId, user])

  const handlePostUpdate = (updatedPost?: Post) => {
    if (updatedPost) {
      setPost(prevPost => prevPost ? { ...prevPost, ...updatedPost } : updatedPost)
    } else {
      // Recargar el post
      window.location.reload()
    }
  }

  const handleReactionClick = (postId: string, reactionType: string) => {
    setSelectedReactionType(reactionType)
    setShowReactionDetails(prev => ({
      ...prev,
      [postId]: true
    }))
  }

  const handleReaction = async (postId: string, reactionType: string | null) => {
    try {
      const currentUserReaction = userReactions[postId]
      let action = 'add'
      let typeToSend = reactionType
      
      if (reactionType === null) {
        action = 'remove'
        typeToSend = currentUserReaction
      } else if (currentUserReaction === reactionType) {
        action = 'remove'
        typeToSend = reactionType
      } else if (currentUserReaction && currentUserReaction !== reactionType) {
        action = 'update'
        typeToSend = reactionType
      }

      if (action === 'remove' && !typeToSend) {
        return
      }

      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reaction_type: typeToSend,
          action: action,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            type: data.action === 'removed' ? null : reactionType,
            count: data.action === 'added' 
              ? (prev[postId]?.count || 0) + 1
              : data.action === 'removed'
              ? Math.max((prev[postId]?.count || 0) - 1, 0)
              : (prev[postId]?.count || 0)
          }
        }))

        setUserReactions(prev => ({
          ...prev,
          [postId]: data.action === 'removed' ? null : reactionType
        }))

        setPost(prev => prev ? {
          ...prev,
          reaction_count: data.action === 'added' 
            ? prev.reaction_count + 1
            : data.action === 'removed'
            ? Math.max(prev.reaction_count - 1, 0)
            : prev.reaction_count
        } : prev)

        // Recargar estadísticas
        try {
          const statsResponse = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions?include_stats=true`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setPostReactionStats(prev => ({
              ...prev,
              [postId]: statsData.reactions || {}
            }))
          }
        } catch (error) {
          // Silenciar errores
        }
      }
    } catch (error) {
      // Silenciar errores
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    const needsAuth = community && !community.is_member && community.access_type === 'invitation_only'
    const needsMembership = community && !community.is_member && community.access_type === 'invitation_only'

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {needsAuth ? (
            <>
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Acceso Restringido
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Debes ser miembro de esta comunidad para ver este post'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push(`/communities/${communitySlug}`)}
                  variant="outline"
                >
                  Ver Comunidad
                </Button>
                {user && (
                  <Button
                    onClick={() => router.push(`/communities/${communitySlug}`)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Solicitar Acceso
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Post no encontrado'}</p>
              <Button
                onClick={() => router.push(`/communities/${communitySlug}`)}
              >
                Volver a la comunidad
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/communities/${communitySlug}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a {community?.name || 'la comunidad'}</span>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="community-post"
        >
          {/* Post Header */}
          <div className="community-post-header">
            <div className="flex items-center gap-3">
              <div className="community-post-avatar">
                {post.user?.profile_picture_url ? (
                  <img
                    src={post.user.profile_picture_url}
                    alt={post.user.first_name || post.user.username || 'Usuario'}
                    className="w-full h-full object-cover"
                  />
                ) : post.user?.first_name && post.user?.last_name ? (
                  <span className="text-white font-semibold text-sm">
                    {post.user.first_name.charAt(0)}{post.user.last_name.charAt(0)}
                  </span>
                ) : post.user?.username ? (
                  <span className="text-white font-semibold text-sm">
                    {post.user.username.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {post.user?.first_name && post.user?.last_name
                    ? `${post.user.first_name} ${post.user.last_name}`
                    : post.user?.username || post.user?.email || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {formatRelativeTime(post.created_at)} • {community?.name || 'Comunidad'}
                </p>
              </div>
            </div>
            {user && (
              <PostMenu
                post={post}
                communitySlug={communitySlug}
                onEdit={() => setEditingPost(post)}
                onPostUpdate={handlePostUpdate}
              />
            )}
          </div>

          {/* Post Content */}
          <div className="community-post-content">
            <p className="text-gray-900 dark:text-white">{post.content}</p>
          </div>

          {/* Post Attachments */}
          {post.attachment_type && (
            <div className="mb-4">
              <PostAttachment
                attachmentType={post.attachment_type}
                attachmentUrl={post.attachment_url}
                attachmentData={post.attachment_data}
                postId={post.id}
                communitySlug={communitySlug}
              />
            </div>
          )}

          {/* Facebook-style Post Stats Bar - Reacciones y comentarios */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-4 text-sm text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700/30">
            {/* Reacciones */}
            {(() => {
              const totalReactions = postReactions[post.id]?.count || post.reaction_count || 0
              const reactionStats = postReactionStats[post.id] || {}
              
              const topReactions = Object.values(reactionStats)
                .map((reaction: any) => ({
                  reaction_type: reaction.type || reaction.reaction_type,
                  count: reaction.count || 0,
                  emoji: reaction.emoji || getReactionEmoji(reaction.type || reaction.reaction_type)
                }))
                .filter((reaction: any) => reaction.count > 0)
                .sort((a: any, b: any) => b.count - a.count)
              
              return (
                <ReactionBanner
                  totalReactions={totalReactions}
                  topReactions={topReactions}
                  showTopReactions={true}
                  onReactionClick={(reactionType) => handleReactionClick(post.id, reactionType)}
                  postId={post.id}
                />
              )
            })()}
            
            {/* Comentarios */}
            <button 
              onClick={() => {
                const isCurrentlyShowing = showCommentsForPost[post.id] || false
                setShowCommentsForPost(prev => ({
                  ...prev,
                  [post.id]: !prev[post.id]
                }))
                if (!isCurrentlyShowing) {
                  setTimeout(() => {
                    const commentsSection = document.getElementById(`comments-${post.id}`)
                    if (commentsSection) {
                      commentsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }, 100)
                }
              }}
              className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {post.comment_count} comentarios
            </button>
          </div>

          {/* Facebook-style Action Buttons */}
          <div className="flex flex-nowrap items-center justify-between gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-2 border-t border-gray-200 dark:border-slate-700/30">
            {/* Botón de Reacciones */}
            <div className="flex-1 min-w-0 flex justify-center">
              <ReactionButton
                postId={post.id}
                currentReaction={userReactions[post.id] || null}
                reactionCount={postReactions[post.id]?.count || post.reaction_count || 0}
                onReaction={handleReaction}
                isFacebookStyle={true}
              />
            </div>
            <button 
              onClick={() => {
                const isCurrentlyShowing = showCommentsForPost[post.id] || false
                setShowCommentsForPost(prev => ({
                  ...prev,
                  [post.id]: !prev[post.id]
                }))
                if (!isCurrentlyShowing) {
                  setTimeout(() => {
                    const commentsSection = document.getElementById(`comments-${post.id}`)
                    if (commentsSection) {
                      commentsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }, 100)
                }
              }}
              className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Comentar</span>
            </button>
            <div className="flex-1 min-w-0 flex justify-center">
              <ShareButton
                postId={post.id}
                postContent={post.content}
                communityName={community?.name || 'Comunidad'}
                communitySlug={communitySlug}
                isFacebookStyle={true}
              />
            </div>
          </div>

          {/* Sección de comentarios */}
          <div id={`comments-${post.id}`}>
            <LocalCommentsSection
              postId={post.id}
              communitySlug={communitySlug}
              showComments={showCommentsForPost[post.id] || false}
              setShowComments={(show: boolean) => {
                setShowCommentsForPost(prev => ({
                  ...prev,
                  [post.id]: show
                }))
              }}
              onCommentAdded={(comment: any) => {
                setPost(prev => prev ? {
                  ...prev,
                  comment_count: prev.comment_count + 1
                } : prev)
              }}
            />
          </div>
        </motion.article>
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          communitySlug={communitySlug}
          onSave={(updatedPost) => {
            handlePostUpdate(updatedPost)
            setEditingPost(null)
          }}
        />
      )}

      {/* Questionnaire Required Modal */}
      <QuestionnaireRequiredModal
        isOpen={showQuestionnaireModal}
        onClose={() => {
          setShowQuestionnaireModal(false)
          router.push('/statistics')
        }}
      />

      {/* Reaction Details Modal */}
      {post && (
        <ReactionDetailsModal
          isOpen={showReactionDetails[post.id] || false}
          onClose={() => {
            setShowReactionDetails(prev => ({
              ...prev,
              [post.id]: false
            }))
            setSelectedReactionType(null)
          }}
          postId={post.id}
          communitySlug={communitySlug}
          selectedReactionType={selectedReactionType || undefined}
        />
      )}
    </div>
  )
}

