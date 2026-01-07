'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, Lightbulb, HelpCircle, Trash2, Clock, Edit2, Check } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';
import { useLiaGeneralChat } from '../../hooks/useLiaGeneralChat';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '../../../features/business-panel/contexts/OrganizationStylesContext';
import { useThemeStore } from '@/core/stores/themeStore';
import { useTranslation } from 'react-i18next';

// Función para parsear Markdown completo y convertirlo a elementos React
function parseMarkdownContent(text: string, onLinkClick: (url: string) => void, isDarkMode: boolean = false): React.ReactNode {
  let keyIndex = 0;
  
  // Primero convertir listas con asterisco a guiones
  let processedText = text.replace(/^\*\s+/gm, '- ');
  
  // Dividir por líneas para procesar cada una
  const lines = processedText.split('\n');
  
  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';
  
  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    
    // Regex combinado para encontrar negritas, cursivas y enlaces
    // Orden: enlaces primero, luego negritas, luego cursivas
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = inlineRegex.exec(line)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Es un enlace [texto](url)
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              onLinkClick(linkUrl);
            }}
            style={{
              color: linkColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {linkText}
          </a>
        );
      } else if (match[4]) {
        // Es negrita **texto**
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[5]}
          </strong>
        );
      } else if (match[6]) {
        // Es cursiva *texto*
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[7]}
          </em>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Texto después del último match
    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }
    
    return elements.length > 0 ? elements : [line];
  };
  
  // Procesar cada línea y agregar saltos de línea
  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });
  
  return <>{result}</>;
}

// Altura del navbar (AdminHeader = 64px / h-16, DashboardNavbar = ~80px)
// Usamos 64px como valor base para el admin panel
const NAVBAR_HEIGHT = 64;
const PANEL_WIDTH = 420; // Mismo ancho que ARIA en IRIS

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

function LiaSidePanelContent() {
  const { t } = useTranslation('common');
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Obtener estilos de la organización para modo claro/oscuro
  const orgContext = useOrganizationStylesContext();
  const orgStyles = orgContext?.styles;

  // Determinar si estamos en el dashboard de usuario o planner
  const isUserDashboard = pathname?.includes('/business-user') || pathname?.includes('/study-planner') || pathname === '/dashboard';
  
  // Seleccionar los estilos activos según la ruta
  const effectiveStyles = isUserDashboard 
    ? (orgStyles?.userDashboard || orgStyles?.panel) 
    : orgStyles?.panel;
  
  // Determinar si es tema claro
  const isLightTheme = !isDarkMode;
  
  // Colores dinámicos basados en el tema
  const themeColors = {
    panelBg: isLightTheme ? '#FFFFFF' : (effectiveStyles?.sidebar_background || '#0a0f14'),
    headerBg: isLightTheme ? '#F8FAFC' : (effectiveStyles?.sidebar_background || '#0a0f14'),
    borderColor: isLightTheme ? '#E2E8F0' : (effectiveStyles?.border_color || '#1e2a35'),
    messageBubbleAssistant: isLightTheme ? '#F1F5F9' : (effectiveStyles?.card_background || '#1e2a35'),
    messageBubbleUser: effectiveStyles?.primary_button_color || '#0A2540',
    // Forzar texto oscuro en modo claro, ignorando el tema de la organización si este es 'sofia-predeterminado' (oscuro)
    textPrimary: isLightTheme ? '#1E293B' : (effectiveStyles?.text_color || '#e5e7eb'),
    textSecondary: isLightTheme ? '#64748B' : '#6b7280',
    inputBg: isLightTheme ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
    inputBorder: isLightTheme ? '#CBD5E1' : (effectiveStyles?.border_color || '#374151'),
    accentColor: '#00D4B3', // Siempre usar Aqua para identidad de LIA
  };
  
  const { messages, isLoading, sendMessage, clearHistory, loadConversation } = useLiaGeneralChat();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentTip, setCurrentTip] = useState('');
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (showHistory) {
      setIsHistoryLoading(true);
      fetch('/api/lia/conversations?limit=20')
        .then(res => res.json())
        .then(data => {
            setHistoryList(data.conversations || []);
        })
        .catch(err => console.error('Error fetching history:', err))
        .finally(() => setIsHistoryLoading(false));
    }
  }, [showHistory]);

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    setShowHistory(false);
  };

  const handleStartEdit = (conv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conv.conversation_id);
    setEditingTitle(conv.conversation_title || new Date(conv.started_at).toLocaleDateString());
  };

  const handleSaveEdit = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    
    try {
        const response = await fetch('/api/lia/conversations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: convId, title: editingTitle })
        });
        
        if (response.ok) {
            setHistoryList(prev => prev.map(c => 
                c.conversation_id === convId ? { ...c, conversation_title: editingTitle } : c
            ));
            setEditingConversationId(null);
        }
    } catch (err) {
        console.error('Error saving title', err);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'capabilities',
      label: t('lia.quickActions.capabilities'),
      icon: HelpCircle,
      prompt: t('lia.quickActions.capabilities')
    },
    {
      id: 'courses',
      label: t('lia.quickActions.courses'),
      icon: MessageSquare,
      prompt: t('lia.quickActions.courses')
    },
    {
      id: 'recommend',
      label: t('lia.quickActions.recommend'),
      icon: Lightbulb,
      prompt: t('lia.quickActions.recommend')
    },
    {
      id: 'help',
      label: t('lia.quickActions.help'),
      icon: Sparkles,
      prompt: t('lia.quickActions.help')
    }
  ];

  // Cast tips to string array just to be safe with unknown return type of returnObjects
  const tips = (t('lia.tips', { returnObjects: true }) as string[]) || [];

  // Seleccionar tip aleatorio al abrir el panel
  useEffect(() => {
    if (isOpen && tips.length > 0) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
    }
  }, [isOpen, t]); // Re-run if language changes (t changes)

  // Función para manejar clicks en enlaces del chat
  const handleLinkClick = useCallback((url: string) => {
    // Si es una URL interna (comienza con /), navegar con router
    if (url.startsWith('/')) {
      closePanel();
      router.push(url);
    } else if (url.startsWith('http')) {
      // Si es una URL externa, abrir en nueva pestaña
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [router, closePanel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, false, pageContext);
  }, [inputValue, isLoading, sendMessage, pageContext]);

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    await sendMessage(action.prompt);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: `${PANEL_WIDTH}px`,
            height: '100vh',
            backgroundColor: themeColors.panelBg,
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderBottomLeftRadius: '30px',
            overflow: 'hidden',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isLightTheme ? '-4px 0 24px rgba(0, 0, 0, 0.08)' : '-4px 0 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header del panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${themeColors.borderColor}`,
              backgroundColor: themeColors.headerBg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar de LIA */}
              <div style={{ position: 'relative' }}>
                <motion.img
                  layoutId="lia-avatar-header"
                  src="/lia-avatar.png"
                  alt="LIA"
                  onClick={() => setIsAvatarExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${themeColors.accentColor}`,
                    cursor: 'zoom-in'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                    border: `2px solid ${themeColors.panelBg}`,
                  }}
                />
              </div>
              
              <div>
                <h2 style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  {t('lia.header.title')}
                </h2>
                <p style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
                  {t('lia.header.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Contenedor de acciones (Limpiar + Cerrar) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                title={showHistory ? "Volver al chat" : "Historial"}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent'}
              >
                <Clock style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>
              <button
                onClick={clearHistory}
                title={t('lia.chat.cleanHistory')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  opacity: messages.length > 0 ? 1 : 0.5,
                  pointerEvents: messages.length > 0 ? 'auto' : 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#fee2e2' : '#450a0a'} // Fondo rojo suave al hover
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 style={{ width: '18px', height: '18px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
              </button>

              <button
                onClick={closePanel}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
               // Empty State / Loading Screen Style
               <div
                 style={{
                   flex: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   textAlign: 'center',
                   opacity: 0.8,
                   padding: '0 20px'
                 }}
               >
                 <motion.div
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ duration: 0.5 }}
                   style={{ marginBottom: '24px', position: 'relative' }}
                 >
                   {/* Glow effect behind avatar */}
                   <div style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     width: '120px',
                     height: '120px',
                     borderRadius: '50%',
                     backgroundColor: themeColors.accentColor,
                     filter: 'blur(40px)',
                     opacity: 0.2,
                     zIndex: 0
                   }} />
                   
                   <img
                    src="/lia-avatar.png"
                    alt="LIA"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${themeColors.accentColor}`,
                      boxShadow: `0 0 20px ${themeColors.accentColor}40`,
                      position: 'relative',
                      zIndex: 1
                    }}
                   />
                 </motion.div>

                 <motion.div
                   key={currentTip} // Animate when tip changes
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2, duration: 0.5 }}
                 >
                   <h3 style={{ 
                     color: themeColors.textPrimary, 
                     fontSize: '18px', 
                     fontWeight: 600, 
                     marginBottom: '8px' 
                   }}>
                     LIA
                   </h3>
                   <p style={{ 
                     color: themeColors.textSecondary, 
                     fontSize: '14px', 
                     lineHeight: 1.5,
                     maxWidth: '280px',
                     margin: '0 auto'
                   }}>
                     {currentTip}
                   </p>
                 </motion.div>
               </div>
            ) : (
              // Chat Messages
              messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: message.role === 'user' ? themeColors.messageBubbleUser : themeColors.messageBubbleAssistant,
                    color: message.role === 'user' ? 'white' : themeColors.textPrimary,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  <p style={{ 
                    fontSize: '14px', 
                    lineHeight: 1.5, 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}>
                    {message.role === 'assistant' 
                      ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode)
                      : message.content
                    }
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      marginTop: '6px',
                      marginBottom: 0,
                      color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
            )}
            
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: themeColors.messageBubbleAssistant,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.2s' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div style={{ padding: '0 20px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: themeColors.inputBg,
                        border: `1px solid ${themeColors.borderColor}`,
                        color: themeColors.textPrimary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#2d3a47';
                        e.currentTarget.style.borderColor = themeColors.accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.inputBg;
                        e.currentTarget.style.borderColor = themeColors.borderColor;
                      }}
                    >
                      <Icon style={{ width: '14px', height: '14px' }} color={themeColors.accentColor} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: themeColors.inputBg,
                borderRadius: '24px',
                padding: '10px 16px',
                border: `1px solid ${themeColors.inputBorder}`,
              }}
            >

              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={t('lia.chat.inputPlaceholder')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: themeColors.textPrimary,
                  fontSize: '14px',
                }}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: inputValue.trim() && !isLoading ? themeColors.accentColor : (isLightTheme ? '#CBD5E1' : '#374151'),
                  border: 'none',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <Send style={{ width: '16px', height: '16px', color: 'white' }} />
              </button>
            </div>
          </div>
          
          {/* History View Overlay */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  position: 'absolute',
                  top: '81px', 
                  left: 0, 
                  right: 0,
                  bottom: 0,
                  backgroundColor: themeColors.panelBg,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{marginBottom: '8px'}}>
                      <h3 style={{color: themeColors.textPrimary, margin: 0, fontSize: '18px', fontWeight: 600}}>Historial</h3>
                      <p style={{color: themeColors.textSecondary, fontSize:'13px', margin:'4px 0 0'}}>Tus conversaciones recientes</p>
                    </div>

                    {isHistoryLoading ? (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', color: themeColors.textSecondary}}>
                           <div style={{width:'20px', height:'20px', border:`2px solid ${themeColors.accentColor}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:'10px'}}></div>
                           <span>Cargando...</span>
                        </div>
                    ) : historyList.length === 0 ? (
                        <div style={{textAlign:'center', padding:'60px 20px', color: themeColors.textSecondary}}>
                           <Clock size={48} style={{opacity:0.2, margin:'0 auto 16px', display:'block'}} />
                           <p>No hay conversaciones guardadas.</p>
                           <button onClick={() => setShowHistory(false)} style={{marginTop:'12px', background:'transparent', border:`1px solid ${themeColors.borderColor}`, padding:'8px 16px', borderRadius:'8px', color: themeColors.textPrimary, cursor:'pointer'}}>Volver al chat</button>
                        </div>
                    ) : (
                        historyList.map((conv) => (
                          <div
                            key={conv.conversation_id}
                            onClick={() => handleSelectConversation(conv.conversation_id)}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              backgroundColor: themeColors.inputBg,
                              border: `1px solid ${themeColors.borderColor}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                               e.currentTarget.style.borderColor = themeColors.accentColor;
                               e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                               e.currentTarget.style.borderColor = themeColors.borderColor;
                               e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', alignItems: 'center'}}>
                                {editingConversationId === conv.conversation_id ? (
                                    <div style={{display:'flex', flex:1, gap:'8px', alignItems:'center'}}>
                                        <input
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(conv.conversation_id, e as any);
                                                if (e.key === 'Escape') handleCancelEdit(e as any);
                                            }}
                                            style={{
                                                flex: 1,
                                                background: themeColors.inputBg,
                                                border: `1px solid ${themeColors.accentColor}`,
                                                color: themeColors.textPrimary,
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <button onClick={(e) => handleSaveEdit(conv.conversation_id, e)} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.accentColor, padding: 0}}>
                                            <Check size={16} />
                                        </button>
                                        <button onClick={handleCancelEdit} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0}}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{fontWeight:600, color: themeColors.textPrimary, fontSize:'14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px'}}>
                                           {conv.conversation_title || new Date(conv.started_at).toLocaleDateString()}
                                        </span>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                            <button 
                                                onClick={(e) => handleStartEdit(conv, e)}
                                                style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0, opacity: 0.6}}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <span style={{fontSize:'12px', color: themeColors.textSecondary}}>
                                               {new Date(conv.started_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </>
                                )}
                             </div>
                             <div style={{fontSize:'12px', color: themeColors.textSecondary, display:'flex', gap:'8px'}}>
                                <span>{conv.total_messages || 'Varios'} mensajes</span>
                             </div>
                          </div>
                        ))
                    )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes liaPulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
          {/* Expanded Avatar Overlay (Easter Egg) */}
          <AnimatePresence>
            {isAvatarExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAvatarExpanded(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-out',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative' }}
                >
                    <motion.img
                      layoutId="lia-avatar-header"
                      src="/lia-avatar.png"
                      alt="LIA Expanded"
                      style={{
                        width: 'min(80vw, 400px)',
                        height: 'min(80vw, 400px)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `4px solid ${themeColors.accentColor}`,
                        boxShadow: `0 0 50px ${themeColors.accentColor}80`
                      }}
                    />
                    <div style={{
                      marginTop: '20px',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>LIA</h3>
                      <p style={{ opacity: 0.8, margin: 0 }}>Learning Intelligence Assistant</p>
                    </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function LiaSidePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaSidePanelContent />, document.body);
}

// Exportar constante para uso en ContentWrapper
export const LIA_PANEL_WIDTH = PANEL_WIDTH;
