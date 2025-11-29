'use client';

import { useState, useCallback } from 'react';
import { ShareData } from '../components/ShareModal/ShareModal';

interface UseShareModalReturn {
  isOpen: boolean;
  shareData: ShareData | null;
  openShareModal: (data: ShareData) => void;
  closeShareModal: () => void;
}

export function useShareModal(): UseShareModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const openShareModal = useCallback((data: ShareData) => {
    setShareData(data);
    setIsOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsOpen(false);
    // Limpiar datos después de un pequeño delay para permitir la animación de salida
    setTimeout(() => {
      setShareData(null);
    }, 300);
  }, []);

  return {
    isOpen,
    shareData,
    openShareModal,
    closeShareModal,
  };
}

