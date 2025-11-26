'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ShareModal, ShareData } from '../components/ShareModal';
import { useShareModal } from '../hooks/useShareModal';

interface ShareModalContextType {
  openShareModal: (data: ShareData) => void;
  closeShareModal: () => void;
}

const ShareModalContext = createContext<ShareModalContextType | undefined>(undefined);

export function ShareModalProvider({ children }: { children: ReactNode }) {
  const { isOpen, shareData, openShareModal, closeShareModal } = useShareModal();

  return (
    <ShareModalContext.Provider value={{ openShareModal, closeShareModal }}>
      {children}
      <ShareModal isOpen={isOpen} onClose={closeShareModal} shareData={shareData} />
    </ShareModalContext.Provider>
  );
}

export function useShareModalContext() {
  const context = useContext(ShareModalContext);
  if (context === undefined) {
    throw new Error('useShareModalContext must be used within a ShareModalProvider');
  }
  return context;
}

