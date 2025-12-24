'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  User,
  Smile,
  Paperclip,
  Star,
  CheckCheck,
  Sparkles,
  Users,
  X,
  FileText
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamMessage } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// Emojis organizados por categorías
const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes',
    emojis: ['👍', '❤️', '😊', '🎉', '🔥', '😂', '👏', '💪']
  },
  {
    name: 'Caras',
    emojis: ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩']
  },
  {
    name: 'Gestos',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👋', '🙌', '👏', '🤝', '🙏', '💪', '✍️', '🦾', '💅']
  },
  {
    name: 'Símbolos',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✨', '⭐', '🌟', '💫', '🔥', '💥', '⚡']
  },
  {
    name: 'Objetos',
    emojis: ['🎉', '🎊', '🎁', '🏆', '🥇', '🎯', '💡', '📌', '📍', '🚀', '✈️', '🎵', '🎶', '💻', '📱', '⏰']
  }
]

interface TeamChatTabProps {
  teamId: string
  teamName?: string
  teamImageUrl?: string | null
}

export function TeamChatTab({ teamId, teamName, teamImageUrl }: TeamChatTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { user } = useAuth()

  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const textColor = panelStyles?.text_color || '#ffffff'
  const cardBg = panelStyles?.card_background || '#1a1f2e'

  const [messages, setMessages] = useState<WorkTeamMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configurar Realtime y cargar mensajes iniciales
  useEffect(() => {
    if (!teamId) return

    const supabase = createClient()

    const loadMessages = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedMessages = await TeamsService.getTeamMessages(teamId, undefined, 50, 0)
        setMessages(fetchedMessages.reverse())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar mensajes')
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    const channel = supabase
      .channel(`team-messages:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_team_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          const newMessage = payload.new as any

          const { data: sender } = await supabase
            .from('users')
            .select('id, display_name, first_name, last_name, email, profile_picture_url')
            .eq('id', newMessage.sender_id)
            .single()

          const enrichedMessage: WorkTeamMessage = {
            ...newMessage,
            sender: sender ? {
              id: sender.id,
              name: sender.display_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email,
              email: sender.email,
              profile_picture_url: sender.profile_picture_url,
              display_name: sender.display_name
            } : null
          }

          setMessages(prev => {
            if (prev.some(m => m.message_id === enrichedMessage.message_id)) {
              return prev
            }
            return [...prev, enrichedMessage]
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [teamId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await TeamsService.createTeamMessage(teamId, {
        content: newMessage.trim()
      })
      setNewMessage('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoy'
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  }

  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {} as Record<string, WorkTeamMessage[]>)

  // Loading State Premium
  if (isLoading && messages.length === 0) {
    return (
      <div className="h-[600px] rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-t-transparent"
              style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
              Cargando conversación...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[600px] rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Header Premium */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)'
        }}
      >
        <div className="flex items-center gap-4">
          {/* Team Logo */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative"
          >
            {teamImageUrl ? (
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2" style={{ borderColor: `${accentColor}40` }}>
                <Image
                  src={teamImageUrl}
                  alt={teamName || 'Equipo'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                  boxShadow: `0 4px 15px ${accentColor}40`
                }}
              >
                {(teamName || 'E')[0].toUpperCase()}
              </div>
            )}
            {/* Online Indicator */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
              style={{
                backgroundColor: '#10b981',
                borderColor: cardBg
              }}
            />
          </motion.div>

          <div>
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: textColor }}>
              {teamName || 'Chat del Equipo'}
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            </h3>
            <p className="text-xs flex items-center gap-2" style={{ color: textColor, opacity: 0.5 }}>
              <Users className="w-3 h-3" />
              {messages.length} mensajes • En tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-6"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 100%)'
        }}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center py-12"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${secondaryColor}20)`,
                border: `1px solid ${accentColor}30`
              }}
            >
              <MessageSquare className="w-10 h-10" style={{ color: accentColor }} />
            </motion.div>
            <h4 className="text-lg font-bold mb-2" style={{ color: textColor }}>
              No hay mensajes aún
            </h4>
            <p className="text-sm max-w-[250px]" style={{ color: textColor, opacity: 0.5 }}>
              Sé el primero en iniciar la conversación con tu equipo
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inputRef.current?.focus()}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                boxShadow: `0 8px 25px ${accentColor}40`
              }}
            >
              Escribir mensaje
            </motion.button>
          </motion.div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: textColor,
                    opacity: 0.5
                  }}
                >
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {dateMessages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id
                  const showAvatar = !isOwnMessage && (index === 0 || dateMessages[index - 1]?.sender_id !== message.sender_id)

                  return (
                    <motion.div
                      key={message.message_id}
                      initial={{ opacity: 0, y: 20, x: isOwnMessage ? 20 : -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      {!isOwnMessage && (
                        <div className="flex-shrink-0 w-10">
                          {showAvatar ? (
                            message.sender?.profile_picture_url ? (
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                                <Image
                                  src={message.sender.profile_picture_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                style={{
                                  background: `linear-gradient(135deg, ${secondaryColor}, ${accentColor})`,
                                  color: 'white'
                                }}
                              >
                                {(message.sender?.name || 'U')[0].toUpperCase()}
                              </div>
                            )
                          ) : null}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {showAvatar && !isOwnMessage && (
                          <p className="text-xs font-medium mb-1 ml-1" style={{ color: accentColor }}>
                            {message.sender?.name || 'Usuario'}
                          </p>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`group relative px-4 py-3 rounded-2xl ${isOwnMessage
                            ? 'rounded-br-md'
                            : 'rounded-bl-md'
                            }`}
                          style={{
                            background: isOwnMessage
                              ? `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`
                              : 'rgba(255,255,255,0.08)',
                            color: isOwnMessage ? 'white' : textColor,
                            boxShadow: isOwnMessage
                              ? `0 4px 15px ${accentColor}30`
                              : 'none'
                          }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>

                          {/* Hover Actions */}
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isOwnMessage ? '-left-20' : '-right-20'
                              }`}
                          >
                            {[Smile, Star].map((Icon, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  color: textColor
                                }}
                              >
                                <Icon className="w-4 h-4" />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>

                        {/* Time & Status */}
                        <div className="flex items-center gap-1.5 mt-1 mx-1">
                          <span className="text-[11px]" style={{ color: textColor, opacity: 0.4 }}>
                            {formatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            <CheckCheck className="w-3.5 h-3.5" style={{ color: accentColor }} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <User className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area Premium - Nuevo Diseño */}
      <div className="relative border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Panel de Emojis Compacto - Estilo WhatsApp */}
        <AnimatePresence>
          {showStickerPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-4 mb-2 rounded-2xl overflow-hidden z-50"
              style={{
                width: '360px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)'
              }}
            >
              {/* Tabs de Categorías Compactos */}
              <div
                className="flex items-center overflow-x-auto"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(0,0,0,0.15)'
                }}
              >
                {EMOJI_CATEGORIES.map((category, index) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setSelectedEmojiCategory(index)}
                    className="flex-shrink-0 px-3.5 py-2.5 text-xs font-medium transition-all relative"
                    style={{
                      color: selectedEmojiCategory === index ? accentColor : 'rgba(255,255,255,0.5)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {category.name}
                    {selectedEmojiCategory === index && (
                      <motion.div
                        layoutId="emoji-tab-indicator"
                        className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </button>
                ))}

                {/* Botón cerrar */}
                <button
                  type="button"
                  onClick={() => setShowStickerPanel(false)}
                  className="ml-auto px-3 py-2 flex-shrink-0 hover:bg-white/10 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid de Emojis Compacto */}
              <div
                className="overflow-y-auto p-2"
                style={{ maxHeight: '180px' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '4px'
                  }}
                >
                  {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      type="button"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji)
                        inputRef.current?.focus()
                      }}
                      className="hover:bg-white/15 active:scale-90 transition-all rounded-lg"
                      style={{
                        width: '38px',
                        height: '38px',
                        fontSize: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview de archivo adjunto */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b flex items-center gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {filePreview ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={filePreview} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <FileText className="w-6 h-6" style={{ color: accentColor }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textColor }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: textColor, opacity: 0.5 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setSelectedFile(null)
                  setFilePreview(null)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de Input Principal */}
        <form onSubmit={handleSendMessage} className="px-4 py-3">
          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setSelectedFile(file)
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = (e) => setFilePreview(e.target?.result as string)
                  reader.readAsDataURL(file)
                } else {
                  setFilePreview(null)
                }
              }
            }}
          />

          <div className="flex items-center gap-3">
            {/* Botón Adjuntar */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: textColor,
                opacity: 0.7
              }}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>

            {/* Campo de Texto */}
            <div
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: textColor }}
                disabled={isSending}
              />

              {/* Botón Emoji dentro del input */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStickerPanel(!showStickerPanel)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: showStickerPanel ? `${accentColor}20` : 'transparent',
                  color: showStickerPanel ? accentColor : textColor,
                  opacity: showStickerPanel ? 1 : 0.6
                }}
              >
                <Smile className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Botón Enviar */}
            <motion.button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: (newMessage.trim() || selectedFile)
                  ? `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`
                  : 'rgba(255,255,255,0.08)',
                boxShadow: (newMessage.trim() || selectedFile)
                  ? `0 4px 20px ${accentColor}50`
                  : 'none'
              }}
            >
              {isSending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
