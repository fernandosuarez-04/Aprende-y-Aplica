'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  FileDown, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered, 
  Paperclip,
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content: string; tags: string[] }) => void;
  initialNote?: {
    id: string;
    title: string;
    content: string;
    tags: string[];
  } | null;
  isEditing?: boolean;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote = null,
  isEditing = false
}) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // Inicializar contenido cuando cambie la nota inicial
  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setTags(initialNote.tags || []);
      // Establecer el contenido HTML en el editor
      if (editorRef.current) {
        editorRef.current.innerHTML = initialNote.content;
      }
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      // Limpiar el editor
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [initialNote]);

  // Guardar estado en el historial
  const saveToHistory = (newContent: string) => {
    const currentContent = editorRef.current?.innerHTML || '';
    if (currentContent !== newContent) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(newContent);
      historyIndexRef.current = historyRef.current.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Aplicar formato al texto
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  // Aplicar estilos de encabezado
  const applyHeading = (level: string) => {
    if (level === 'Normal') {
      execCommand('formatBlock', 'div');
    } else {
      execCommand('formatBlock', level.toLowerCase());
    }
  };

  // Aplicar estilos de lista mejorados
  const applyList = (type: 'ul' | 'ol') => {
    if (type === 'ul') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  // Actualizar contenido y guardar en historial
  const updateContent = () => {
    const newContent = editorRef.current?.innerHTML || '';
    setContent(newContent);
    saveToHistory(newContent);
  };

  // Deshacer
  const undo = () => {
    if (canUndo && historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = previousContent;
        setContent(previousContent);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    }
  };

  // Rehacer
  const redo = () => {
    if (canRedo && historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        setContent(nextContent);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    }
  };

  // Agregar etiqueta
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Eliminar etiqueta
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Guardar nota
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar nota:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Exportar a PDF usando la API nativa del navegador
  const handleExportPDF = async () => {
    if (!title.trim() || !content.trim()) {
      alert('La nota debe tener título y contenido para exportar');
      return;
    }

    try {
      // Crear una nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('No se pudo abrir la ventana de impresión. Verifica que los pop-ups estén habilitados.');
        return;
      }

      // Crear el contenido HTML para imprimir
      const printContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              color: #1f2937;
              line-height: 1.6;
            }
            
            h1 {
              font-size: 2rem;
              font-weight: 700;
              margin: 0 0 1rem 0;
              color: #1f2937;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 0.5rem;
            }
            
            h2 {
              font-size: 1.5rem;
              font-weight: 600;
              margin: 0.875rem 0 0.5rem 0;
              color: #1f2937;
            }
            
            h3 {
              font-size: 1.25rem;
              font-weight: 600;
              margin: 0.75rem 0 0.5rem 0;
              color: #1f2937;
            }
            
            ul, ol {
              margin: 0.5rem 0;
              padding-left: 1.5rem;
              list-style-position: outside;
            }
            
            ul {
              list-style-type: disc;
            }
            
            ol {
              list-style-type: decimal;
            }
            
            ul ul {
              list-style-type: circle;
              margin-top: 0.25rem;
              margin-bottom: 0.25rem;
            }
            
            ul ul ul {
              list-style-type: square;
            }
            
            ol ol {
              list-style-type: lower-alpha;
            }
            
            ol ol ol {
              list-style-type: lower-roman;
            }
            
            li {
              margin: 0.25rem 0;
              padding-left: 0.25rem;
              display: list-item;
            }
            
            p {
              margin: 0.5rem 0;
            }
            
            strong {
              font-weight: 700;
            }
            
            em {
              font-style: italic;
            }
            
            u {
              text-decoration: underline;
            }
            
            a {
              color: #3b82f6;
              text-decoration: underline;
            }
            
            .tags {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e5e7eb;
            }
            
            .tags p {
              margin: 0 0 0.5rem 0;
              font-weight: 600;
              color: #6b7280;
            }
            
            .tag-list {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            
            .tag {
              background: #3b82f6;
              color: white;
              padding: 0.25rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.875rem;
              font-weight: 500;
            }
            
            .footer {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 0.875rem;
            }
            
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              z-index: 1000;
            }
            
            .print-button:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
          
          <h1>${title}</h1>
          
          <div class="content">
            ${content}
          </div>
          
          ${tags.length > 0 ? `
            <div class="tags">
              <p>Etiquetas:</p>
              <div class="tag-list">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="footer">
            Generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </body>
        </html>
      `;

      // Escribir el contenido en la nueva ventana
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Esperar a que se cargue el contenido y luego mostrar el diálogo de impresión
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };

  // Manejar teclas de atajo
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 w-full max-w-4xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Type className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? 'Editar Nota' : 'Nueva Nota'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Studio &gt; Notas</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>

            {/* Barra de herramientas */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
              <div className="flex flex-wrap gap-2">
                {/* Primera fila */}
                <div className="flex gap-1">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Deshacer (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Rehacer (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2"></div>

                <div className="flex gap-1">
                  <select 
                    onChange={(e) => applyHeading(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Normal">Normal</option>
                    <option value="H1">H1</option>
                    <option value="H2">H2</option>
                    <option value="H3">H3</option>
                  </select>
                  
                  <button
                    onClick={() => execCommand('bold')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Negrita (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('italic')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Cursiva (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('underline')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Subrayado (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('createLink')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Enlace"
                  >
                    <Link className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2"></div>

                <div className="flex gap-1">
                  <button
                    onClick={() => applyList('ul')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Lista sin ordenar"
                  >
                    <List className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => applyList('ol')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Lista ordenada"
                  >
                    <ListOrdered className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('justifyLeft')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Alinear izquierda"
                  >
                    <AlignLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('justifyCenter')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Alinear centro"
                  >
                    <AlignCenter className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={() => execCommand('justifyRight')}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Alinear derecha"
                  >
                    <AlignRight className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                  <button
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Área de contenido */}
            <div className="flex-1 p-6 flex flex-col">
              {/* Campo de título */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Título de la nota..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg font-semibold placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              {/* Editor de contenido */}
              <div className="flex-1 bg-white dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContent}
                  className="notes-editor w-full h-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '200px',
                    lineHeight: '1.6'
                  }}
                  data-placeholder="Comienza a escribir tu nota aquí..."
                />
              </div>

              {/* Etiquetas */}
              <div className="mt-4">
                <label className="block text-sm text-gray-700 dark:text-slate-300 mb-2">Etiquetas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Agregar etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm rounded-lg border border-blue-500/30"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Ctrl+S para guardar • Ctrl+Z para deshacer • Ctrl+Y para rehacer
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-600/50 text-gray-900 dark:text-white rounded-xl font-medium transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Guardar Nota'}
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  <FileDown className="w-4 h-4" />
                  Convertir en PDF
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
    </AnimatePresence>
  );
};
