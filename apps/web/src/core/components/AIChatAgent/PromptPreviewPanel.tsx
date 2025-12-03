'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Copy,
  Check,
  X,
  Edit3,
  Download,
  AlertCircle,
  Sparkles,
  Tag,
  Target,
  Lightbulb,
} from 'lucide-react';

export interface PromptDraft {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  use_cases: string[];
  tips: string[];
  category_id?: string;
}

interface PromptPreviewPanelProps {
  draft: PromptDraft;
  onSave: (prompt: PromptDraft) => Promise<void>;
  onClose: () => void;
  onEdit?: (draft: PromptDraft) => void;
  isSaving?: boolean;
}

export function PromptPreviewPanel({
  draft,
  onSave,
  onClose,
  onEdit,
  isSaving = false,
}: PromptPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<PromptDraft>(draft);

  // Calcular completitud del prompt
  const completeness = calculateCompleteness(draft);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([draft.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      await onSave(isEditing ? editedDraft : draft);
    } catch (error) {
      console.error('Error guardando prompt:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      onEdit?.(editedDraft);
    }
    setIsEditing(!isEditing);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-20 bottom-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">
            Vista Previa del Prompt
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Completeness Indicator */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Completitud
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {completeness}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            className={`h-2 rounded-full transition-colors ${
              completeness === 100
                ? 'bg-green-500'
                : completeness >= 70
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Completa todos los campos para mejorar la calidad del prompt
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Título
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedDraft.title}
              onChange={(e) =>
                setEditedDraft({ ...editedDraft, title: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
          ) : (
            <h4 className="mt-1 font-semibold text-gray-900 dark:text-white">
              {draft.title || 'Sin título'}
            </h4>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Descripción
          </label>
          {isEditing ? (
            <textarea
              value={editedDraft.description}
              onChange={(e) =>
                setEditedDraft({ ...editedDraft, description: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              rows={3}
            />
          ) : (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {draft.description || 'Sin descripción'}
            </p>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Contenido del Prompt
          </label>
          {isEditing ? (
            <textarea
              value={editedDraft.content}
              onChange={(e) =>
                setEditedDraft({ ...editedDraft, content: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
              rows={8}
            />
          ) : (
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                {draft.content || 'Sin contenido'}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {draft.tags && draft.tags.length > 0 && (
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Tag className="w-3 h-3" />
              Etiquetas
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Level */}
        {draft.difficulty_level && (
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Target className="w-3 h-3" />
              Nivel de Dificultad
            </label>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                draft.difficulty_level === 'beginner'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : draft.difficulty_level === 'intermediate'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {draft.difficulty_level === 'beginner'
                ? 'Principiante'
                : draft.difficulty_level === 'intermediate'
                ? 'Intermedio'
                : 'Avanzado'}
            </span>
          </div>
        )}

        {/* Use Cases */}
        {draft.use_cases && draft.use_cases.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Casos de Uso
            </label>
            <ul className="mt-2 space-y-1">
              {draft.use_cases.map((useCase, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {draft.tips && draft.tips.length > 0 && (
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Lightbulb className="w-3 h-3" />
              Consejos
            </label>
            <ul className="mt-2 space-y-1">
              {draft.tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-yellow-500 mt-0.5">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-2">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={handleEditToggle}
            className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || completeness < 50}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            isSaving || completeness < 50
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg'
          }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar en Biblioteca
            </>
          )}
        </button>

        {completeness < 50 && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              El prompt necesita al menos 50% de completitud para guardarse.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Calcula el porcentaje de completitud del prompt
 */
function calculateCompleteness(draft: PromptDraft): number {
  const weights = {
    title: 20,
    description: 15,
    content: 35,
    tags: 10,
    difficulty_level: 5,
    use_cases: 10,
    tips: 5,
  };

  let score = 0;

  if (draft.title && draft.title.trim().length > 0) score += weights.title;
  if (draft.description && draft.description.trim().length > 0)
    score += weights.description;
  if (draft.content && draft.content.trim().length > 10)
    score += weights.content;
  if (draft.tags && draft.tags.length > 0) score += weights.tags;
  if (draft.difficulty_level) score += weights.difficulty_level;
  if (draft.use_cases && draft.use_cases.length > 0) score += weights.use_cases;
  if (draft.tips && draft.tips.length > 0) score += weights.tips;

  return score;
}

