'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, User, Pin, Reply, MoreVertical } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamMessage } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface TeamChatTabProps {
  teamId: string
}

export function TeamChatTab({ teamId }: TeamChatTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { user } = useAuth()
  
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${cardBg}CC`
  const modalBorder = cardBorder

  const [messages, setMessages] = useState<WorkTeamMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Auto-refresh cada 10 segundos
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [teamId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedMessages = await TeamsService.getTeamMessages(teamId, undefined, 50, 0)
      setMessages(fetchedMessages.reverse()) // Mostrar más recientes al final
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mensajes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const message = await TeamsService.createTeamMessage(teamId, {
        content: newMessage.trim()
      })
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes} min`
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border backdrop-blur-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="font-heading font-semibold" style={{ color: textColor }}>
            Conversación del Equipo
          </h3>
          <span className="text-xs font-body opacity-70 ml-auto">
            {messages.length} mensaje(s)
          </span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-red-400 text-sm font-body" style={{ backgroundColor: 'rgba(127, 29, 29, 0.2)' }}>
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-body opacity-70">No hay mensajes aún</p>
            <p className="text-sm font-body opacity-50 mt-2">Sé el primero en escribir</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            return (
              <motion.div
                key={message.message_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                {!isOwnMessage && (
                  <div className="flex-shrink-0">
                    {message.sender?.profile_picture_url ? (
                      <img 
                        src={message.sender.profile_picture_url} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}30` }}
                      >
                        <User className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwnMessage && (
                    <p className="text-xs font-body opacity-70 mb-1">
                      {message.sender?.name || 'Usuario'}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                      isOwnMessage ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                    style={{
                      backgroundColor: isOwnMessage ? primaryColor : sectionBg,
                      color: isOwnMessage ? '#fff' : textColor
                    }}
                  >
                    <p className="text-sm font-body whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs font-body opacity-50 mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t" style={{ borderColor: cardBorder }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 rounded-xl border font-body focus:outline-none focus:ring-1 transition-all"
            style={{ 
              borderColor: modalBorder,
              backgroundColor: sectionBg,
              color: textColor
            }}
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            variant="gradient"
            className="font-body"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

