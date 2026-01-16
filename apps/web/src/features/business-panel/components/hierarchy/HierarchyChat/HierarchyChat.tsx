'use client'

import { Loader2, MessageSquare } from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import type { HierarchyChatType } from '@/features/business-panel/types/hierarchy.types'
import { useChatLogic } from './hooks/useChatLogic'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { FilePreview } from './FilePreview'
import { ImageModal } from './ImageModal'

interface HierarchyChatProps {
  entityType: 'region' | 'zone' | 'team'
  entityId: string
  chatType: HierarchyChatType
  title?: string
  className?: string
}

export function HierarchyChat({
  entityType,
  entityId,
  chatType,
  title,
  className = ''
}: HierarchyChatProps) {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const {
    chat,
    messages,
    participants,
    isLoading,
    isSending,
    messageContent,
    editingMessageId,
    editContent,
    error,
    showEmojiPicker,
    activeEmojiCategory,
    selectedFile,
    filePreview,
    imageModal,
    user,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    setMessageContent,
    setEditingMessageId,
    setEditContent,
    setShowEmojiPicker,
    setActiveEmojiCategory,
    setImageModal,
    handleFileSelect,
    removeSelectedFile,
    insertEmoji,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    startEditing,
    getMessageAttachment
  } = useChatLogic({ entityType, entityId, chatType })

  const getChatTitle = () => {
    if (title) return title

    const entityNames = {
      region: 'Gerentes Regionales',
      zone: 'Gerentes de Zona',
      team: 'Líderes de Equipo'
    }

    if (chatType === 'horizontal') {
      return `Chat entre ${entityNames[entityType]}`
    } else {
      return entityType === 'team'
        ? 'Chat con Miembros del Equipo'
        : `Chat con ${entityType === 'region' ? 'Gerentes de Zona' : 'Líderes de Equipo'}`
    }
  }

  const handleDownloadFile = async (url: string, name: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error descargando archivo:', error)
      alert('Error al descargar el archivo')
    }
  }

  const chatTitle = getChatTitle()

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-[500px] rounded-2xl ${className}`}
        style={{ backgroundColor: isDark ? '#0F1419' : '#F8FAFC' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          <p className="text-sm" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (!chat && !isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-[500px] gap-4 rounded-2xl ${className}`}
        style={{ backgroundColor: isDark ? '#0F1419' : '#F8FAFC' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <MessageSquare className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
        <div className="text-center px-6">
          <p className="font-medium mb-1" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
            Error al cargar el chat
          </p>
          <p className="text-sm max-w-sm" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-[600px] rounded-2xl overflow-hidden shadow-xl border ${className}`}
      style={{
        backgroundColor: isDark ? '#0F1419' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}
    >
      <ChatHeader
        chatType={chatType}
        title={chatTitle}
        participants={participants}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <ChatMessages
        messages={messages}
        userId={user?.id}
        editingMessageId={editingMessageId}
        editContent={editContent}
        onEditChange={setEditContent}
        onEditSubmit={handleEditMessage}
        onEditCancel={() => {
          setEditingMessageId(null)
          setEditContent('')
        }}
        onStartEdit={startEditing}
        onDelete={handleDeleteMessage}
        onImageClick={(url, name) => setImageModal({ url, name })}
        onDownload={handleDownloadFile}
        getAttachment={getMessageAttachment}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        primaryColor={primaryColor}
        accentColor={accentColor}
        isDark={isDark}
      />

      {selectedFile && (
        <FilePreview
          file={selectedFile}
          preview={filePreview}
          onRemove={removeSelectedFile}
          primaryColor={primaryColor}
          isDark={isDark}
        />
      )}

      <ChatInput
        messageContent={messageContent}
        onMessageChange={setMessageContent}
        onSend={handleSendMessage}
        isSending={isSending}
        hasFile={!!selectedFile}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        activeEmojiCategory={activeEmojiCategory}
        onEmojiCategoryChange={setActiveEmojiCategory}
        onEmojiSelect={insertEmoji}
        onFileClick={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
        onFileChange={handleFileSelect}
        primaryColor={primaryColor}
        isDark={isDark}
      />

      {imageModal && (
        <ImageModal
          url={imageModal.url}
          name={imageModal.name}
          onClose={() => setImageModal(null)}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  )
}
