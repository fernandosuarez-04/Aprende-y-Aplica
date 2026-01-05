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
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown
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

  // Inyectar estilos CSS para el editor
  useEffect(() => {
    const styleId = 'notes-editor-styles';
    // Verificar si los estilos ya existen
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .notes-editor h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0.5rem 0;
        color: inherit;
      }
      .notes-editor h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.875rem 0 0.5rem 0;
        color: inherit;
      }
      .notes-editor h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem 0;
        color: inherit;
      }
      .notes-editor p {
        margin: 0.5rem 0;
      }
      .notes-editor ul,
      .notes-editor ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      .notes-editor strong {
        font-weight: 700;
      }
      .notes-editor em {
        font-style: italic;
      }
      .notes-editor u {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);

    // Limpiar al desmontar
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
      // console.error('Error al guardar nota:', error);
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
      // console.error('Error al generar PDF:', error);
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
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-carbon rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[85vh] md:h-[75vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header minimalista */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5 shrink-0 bg-white dark:bg-carbon">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <Type className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    {isEditing ? 'Editar Nota' : 'Nueva Nota'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">Studio &gt; Notas</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de herramientas minimalista */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-carbon shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/5">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Deshacer (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Rehacer (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1"></div>

                <div className="flex gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/5">
                  <div className="relative flex items-center">
                    <select 
                      onChange={(e) => applyHeading(e.target.value)}
                      className="pl-3 pr-8 py-1.5 bg-transparent rounded-md text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:bg-gray-100 dark:focus:bg-white/10 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-none"
                    >
                      <option value="Normal" className="bg-white dark:bg-carbon">Normal</option>
                      <option value="H1" className="bg-white dark:bg-carbon">H1</option>
                      <option value="H2" className="bg-white dark:bg-carbon">H2</option>
                      <option value="H3" className="bg-white dark:bg-carbon">H3</option>
                    </select>
                    <ChevronDown className="absolute right-2 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center"></div>

                  <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Negrita"><Bold className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Cursiva"><Italic className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Subrayado"><Underline className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => execCommand('createLink')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Enlace"><Link className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1"></div>

                <div className="flex gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/5">
                  <button onClick={() => applyList('ul')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Lista"><List className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => applyList('ol')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Lista Num"><ListOrdered className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center"></div>
                  <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"><AlignLeft className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"><AlignCenter className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                  <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"><AlignRight className="w-4 h-4 text-gray-600 dark:text-white/70" /></button>
                </div>
              </div>
            </div>

            {/* Área de contenido */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-carbon">
              <div className="mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="Título de la nota..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:!bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg font-medium placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20 transition-all"
                />
              </div>

              {/* Editor de contenido */}
              <div className="flex-1 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-4 min-h-0 overflow-hidden flex flex-col">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContent}
                  className="notes-editor w-full flex-1 text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '150px',
                    lineHeight: '1.7'
                  }}
                  data-placeholder="Comienza a escribir tu nota aquí..."
                />
              </div>

              {/* Etiquetas */}
              <div className="mt-4 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Agregar etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                       if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                    }}
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-xs font-medium transition-colors border border-gray-200 dark:border-white/10"
                  >
                    Agregar
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-accent text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-carbon shrink-0">
              <div className="hidden md:block text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium">
                Ctrl+S guardar • Ctrl+Z deshacer
              </div>
              <div className="flex gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-white/10"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Nota'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
