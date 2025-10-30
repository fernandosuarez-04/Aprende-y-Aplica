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

export const NotesModalWithLibraries: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  isEditing = false
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // Inicializar contenido cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title);
        setContent(initialNote.content);
        setTags(initialNote.tags || []);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
      }
      setTagInput('');
      setIsSaving(false);
      
      // Inicializar historial
      const initialContent = initialNote?.content || '';
      historyRef.current = [initialContent];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [isOpen, initialNote]);

  // Actualizar el editor cuando cambie el contenido
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
    }
  }, [isOpen]);

  // Actualizar contenido y guardar en historial
  const updateContent = () => {
    const newContent = editorRef.current?.innerHTML || '';
    setContent(newContent);
    
    // Guardar en historial
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    
    // Si el contenido es diferente al último guardado
    if (newContent !== currentHistory[currentIndex]) {
      // Eliminar historial futuro si estamos en el medio
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(newContent);
      
      // Limitar historial a 50 entradas
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        historyIndexRef.current++;
      }
      
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
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

  // Deshacer
  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = previousContent;
        setContent(previousContent);
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  };

  // Rehacer
  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        setContent(nextContent);
      }
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
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

  // Exportar a PDF usando librerías
  const handleExportPDF = async () => {
    if (!title.trim() || !content.trim()) {
      alert('La nota debe tener título y contenido para exportar');
      return;
    }

    try {
      // Importación dinámica de las librerías
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Crear un elemento temporal para renderizar el contenido
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          color: #1f2937;
          line-height: 1.6;
        ">
          <h1 style="
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 1rem 0;
            color: #1f2937;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.5rem;
          ">${title}</h1>
          
          <div style="margin-bottom: 2rem;">
            ${content}
          </div>
          
          ${tags.length > 0 ? `
            <div style="
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e5e7eb;
            ">
              <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #6b7280;">Etiquetas:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${tags.map(tag => `
                  <span style="
                    background: #3b82f6;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                  ">${tag}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div style="
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
          ">
            Generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      `;

      // Aplicar estilos para los elementos HTML
      const style = document.createElement('style');
      style.textContent = `
        h1 { font-size: 1.875rem; font-weight: 700; margin: 1rem 0 0.5rem 0; color: #1f2937; }
        h2 { font-size: 1.5rem; font-weight: 600; margin: 0.875rem 0 0.5rem 0; color: #1f2937; }
        h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem 0; color: #1f2937; }
        ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
        ul { list-style-type: disc; }
        ol { list-style-type: decimal; }
        li { margin: 0.25rem 0; }
        p { margin: 0.5rem 0; }
        strong { font-weight: 700; }
        em { font-style: italic; }
        u { text-decoration: underline; }
        a { color: #3b82f6; text-decoration: underline; }
      `;
      tempDiv.appendChild(style);

      // Agregar al DOM temporalmente
      document.body.appendChild(tempDiv);

      // Convertir a canvas
      const canvas = await html2canvas.default(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Limpiar
      document.body.removeChild(tempDiv);

      // Descargar
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

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

  // Cerrar modal
  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-3xl h-[70vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Type className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isEditing ? 'Editar Nota' : 'Nueva Nota'}
                  </h2>
                  <p className="text-sm text-slate-400">Studio &gt; Notas</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {/* Título */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la nota..."
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              {/* Barra de herramientas */}
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Deshacer/Rehacer */}
                  <div className="flex gap-1">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Deshacer (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rehacer (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-slate-600/50 mx-2"></div>

                  {/* Formato de texto */}
                  <div className="flex gap-1">
                    <select 
                      onChange={(e) => applyHeading(e.target.value)}
                      className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                      <Bold className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('italic')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Cursiva (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('underline')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Subrayado (Ctrl+U)"
                    >
                      <Underline className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-slate-600/50 mx-2"></div>

                  {/* Listas */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyList('ul')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Lista sin ordenar"
                    >
                      <List className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => applyList('ol')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Lista ordenada"
                    >
                      <ListOrdered className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyLeft')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear izquierda"
                    >
                      <AlignLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyCenter')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear centro"
                    >
                      <AlignCenter className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyRight')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear derecha"
                    >
                      <AlignRight className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-slate-600/50 mx-2"></div>

                  {/* Enlaces */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = prompt('Ingresa la URL:');
                        if (url) execCommand('createLink', url);
                      }}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Insertar enlace"
                    >
                      <Link className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor de contenido */}
              <div className="flex-1 bg-slate-700/30 border border-slate-600/50 rounded-xl p-3">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContent}
                  className="notes-editor w-full h-full text-white placeholder-slate-400 focus:outline-none resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '150px',
                    lineHeight: '1.6'
                  }}
                  data-placeholder="Comienza a escribir tu nota aquí..."
                />
              </div>

              {/* Etiquetas */}
              <div className="mt-4">
                <label className="block text-sm text-slate-300 mb-2">Etiquetas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Agregar etiqueta..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-700/50 flex-shrink-0">
              <div className="text-sm text-slate-400">
                <p>Ctrl+S para guardar • Ctrl+Z para deshacer • Ctrl+Y para rehacer</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
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
