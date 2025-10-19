'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Shield, Users, Check } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { LegalDocumentTab } from '../../types/auth.types';
import { LEGAL_DOCUMENTS } from './LegalDocumentsModal.data';

interface LegalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function LegalDocumentsModal({
  isOpen,
  onClose,
  onAccept,
}: LegalDocumentsModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocumentTab>('terms');

  const tabs = [
    { id: 'terms' as LegalDocumentTab, label: 'Términos y Condiciones', icon: FileText },
    { id: 'privacy' as LegalDocumentTab, label: 'Política de Privacidad', icon: Shield },
    { id: 'conduct' as LegalDocumentTab, label: 'Código de Conducta', icon: Users },
  ];

  const currentDocument = LEGAL_DOCUMENTS[activeTab];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="auth-modal w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-light bg-primary">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Documentos Legales</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-4 border-b border-glass-light bg-color-bg-light">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-glass'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentDocument.sections.map((section) => (
              <div key={section.number} className="space-y-3">
                <h3 className="text-lg font-bold text-primary">
                  {section.number}. {section.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">{section.content}</p>
                {section.list && (
                  <ul className="space-y-2 ml-6">
                    {section.list.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-text-secondary">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-glass-light">
            {onAccept && (
              <Button
                variant="primary"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1"
              >
                <Check className="w-4 h-4" />
                Aceptar y Continuar
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="flex-1">
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
