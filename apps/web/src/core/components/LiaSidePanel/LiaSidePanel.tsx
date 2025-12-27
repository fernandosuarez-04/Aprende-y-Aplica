'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Sparkles, MessageSquare, Lightbulb, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';
import { useLiaGeneralChat } from '../../hooks/useLiaGeneralChat';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '../../../features/business-panel/contexts/OrganizationStylesContext';
import { useThemeStore } from '@/core/stores/themeStore';

// Función para parsear Markdown completo y convertirlo a elementos React
function parseMarkdownContent(text: string, onLinkClick: (url: string) => void): React.ReactNode {
  let keyIndex = 0;
  
  // Primero convertir listas con asterisco a guiones
  let processedText = text.replace(/^\*\s+/gm, '- ');
  
  // Dividir por líneas para procesar cada una
  const lines = processedText.split('\n');
  
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
              color: '#00D4B3',
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

const quickActions: QuickAction[] = [
  {
    id: 'capabilities',
    label: '¿Qué puedes hacer?',
    icon: HelpCircle,
    prompt: '¿Qué puedes hacer? ¿Cómo me puedes ayudar?'
  },
  {
    id: 'courses',
    label: 'Ver mis cursos',
    icon: MessageSquare,
    prompt: '¿Qué cursos tengo disponibles?'
  },
  {
    id: 'recommend',
    label: 'Recomiéndame',
    icon: Lightbulb,
    prompt: '¿Qué curso me recomiendas para empezar?'
  },
  {
    id: 'help',
    label: 'Ayuda rápida',
    icon: Sparkles,
    prompt: 'Necesito ayuda para navegar en la plataforma'
  }
];

function LiaSidePanelContent() {
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Obtener estilos de la organización para modo claro/oscuro
  const orgContext = useOrganizationStylesContext();
  const orgStyles = orgContext?.styles;
  const panelStyles = orgStyles?.panel;
  
  // Determinar si es tema claro
  const isLightTheme = !isDarkMode;
  
  // Colores dinámicos basados en el tema
  const themeColors = {
    panelBg: isLightTheme ? '#FFFFFF' : '#0a0f14',
    headerBg: isLightTheme ? '#F8FAFC' : '#0a0f14',
    borderColor: isLightTheme ? '#E2E8F0' : (panelStyles?.border_color || '#1e2a35'),
    messageBubbleAssistant: isLightTheme ? '#F1F5F9' : '#1e2a35',
    messageBubbleUser: panelStyles?.primary_button_color || '#0A2540',
    // Forzar texto oscuro en modo claro, ignorando el tema de la organización si este es 'sofia-predeterminado' (oscuro)
    textPrimary: isLightTheme ? '#1E293B' : (panelStyles?.text_color || '#e5e7eb'),
    textSecondary: isLightTheme ? '#64748B' : '#6b7280',
    inputBg: isLightTheme ? '#F1F5F9' : '#1e2a35',
    inputBorder: isLightTheme ? '#CBD5E1' : '#374151',
    accentColor: panelStyles?.accent_color || '#00D4B3',
  };
  
  const { messages, isLoading, sendMessage } = useLiaGeneralChat(
    user?.first_name 
      ? `¡Hola ${user.first_name}! 👋 Soy LIA, tu asistente de inteligencia artificial en SOFIA. Puedo ayudarte a gestionar tus cursos, responder preguntas y guiarte en la plataforma. ¿En qué te puedo ayudar?`
      : '¡Hola! 👋 Soy LIA, tu asistente de inteligencia artificial en SOFIA. Puedo ayudarte a gestionar tus cursos, responder preguntas y guiarte en la plataforma. ¿En qué te puedo ayudar?'
  );
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: PANEL_WIDTH }}
          animate={{ x: 0 }}
          exit={{ x: PANEL_WIDTH }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: `${NAVBAR_HEIGHT}px`,
            right: 0,
            width: `${PANEL_WIDTH}px`,
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            backgroundColor: themeColors.panelBg,
            borderLeft: `1px solid ${themeColors.borderColor}`,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isLightTheme ? '-4px 0 20px rgba(0, 0, 0, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header del panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${themeColors.borderColor}`,
              backgroundColor: themeColors.headerBg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar de LIA */}
              <div style={{ position: 'relative' }}>
                <img
                  src="/lia-avatar.png"
                  alt="LIA"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${themeColors.accentColor}`,
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
                  LIA
                </h2>
                <p style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
                  • Asistente IA • En línea
                </p>
              </div>
            </div>
            
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
              <X style={{ width: '18px', height: '18px', color: themeColors.textSecondary }} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((message) => (
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
                  }}
                >
                  <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {message.role === 'assistant' 
                      ? parseMarkdownContent(message.content, handleLinkClick)
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
            ))}
            
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
                      <Icon style={{ width: '14px', height: '14px', color: themeColors.accentColor }} />
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
              <button
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Paperclip style={{ width: '20px', height: '20px', color: themeColors.textSecondary }} />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje a LIA..."
                style={{
                  flex: 1,
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
          
          <style>{`
            @keyframes liaPulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
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
