'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Twitter, Facebook, Mail, Share2, Check } from 'lucide-react';

export interface ShareData {
  url: string;
  title?: string;
  text?: string;
  description?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData | null;
}

export function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!shareData) return null;

  const { url, title, text, description } = shareData;
  const shareText = text || description || title || 'Mira esto';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const subject = title || 'Compartir contenido';
    const body = `${shareText}\n\nVer más: ${url}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
  };

  const shareOptions = [
    {
      name: 'Copiar enlace',
      icon: Copy,
      action: copyToClipboard,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Compartir en Twitter',
      icon: Twitter,
      action: shareToTwitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Compartir en Facebook',
      icon: Facebook,
      action: shareToFacebook,
      color: 'text-blue-600 dark:text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Compartir por email',
      icon: Mail,
      action: shareByEmail,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto relative overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Contenido */}
              <div className="relative p-6 sm:p-8">
                {/* Botón de cerrar */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icono y título */}
                <div className="flex flex-col items-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-4"
                  >
                    <Share2 className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
                  >
                    Compartir
                  </motion.h3>

                  {title && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center text-gray-600 dark:text-gray-400 text-sm"
                    >
                      {title}
                    </motion.p>
                  )}
                </div>

                {/* Opciones de compartir */}
                <div className="space-y-2 mb-4">
                  {shareOptions.map((option, index) => (
                    <motion.button
                      key={option.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                      onClick={() => {
                        option.action();
                        if (option.name === 'Copiar enlace') {
                          // No cerrar inmediatamente para mostrar el feedback
                        } else {
                          // Cerrar después de un pequeño delay para otras acciones
                          setTimeout(() => onClose(), 300);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                    >
                      <div className={`p-2 rounded-lg ${option.bgColor} group-hover:scale-110 transition-transform`}>
                        <option.icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <span className="text-gray-900 dark:text-slate-200 font-medium flex-1">
                        {option.name}
                      </span>
                      {option.name === 'Copiar enlace' && copied && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-500"
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* URL preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Enlace:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-all font-mono">
                    {url}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

