'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  Zap, 
  Palette, 
  HelpCircle,
  Upload,
  Send,
  CheckCircle,
  Loader2,
  Video
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { sessionRecorder } from '../../../lib/rrweb/session-recorder';

interface ReporteProblemProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: string;
  fromLia?: boolean;
}

type Categoria = 'bug' | 'sugerencia' | 'contenido' | 'performance' | 'ui-ux' | 'otro';
type Prioridad = 'baja' | 'media' | 'alta' | 'critica';

const categorias: { value: Categoria; label: string; icon: any; color: string }[] = [
  { value: 'bug', label: 'Bug / Error', icon: AlertCircle, color: 'text-red-500' },
  { value: 'sugerencia', label: 'Sugerencia', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'contenido', label: 'Problema de Contenido', icon: FileText, color: 'text-blue-500' },
  { value: 'performance', label: 'Performance', icon: Zap, color: 'text-purple-500' },
  { value: 'ui-ux', label: 'Diseño / UX', icon: Palette, color: 'text-pink-500' },
  { value: 'otro', label: 'Otro', icon: HelpCircle, color: 'text-gray-500' }
];

const prioridades: { value: Prioridad; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' }
];

export function ReporteProblema({ isOpen, onClose, preselectedCategory, fromLia = false }: ReporteProblemProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 🎬 Ya no necesitamos el hook porque la grabación corre en background desde el layout
  // Usamos el singleton sessionRecorder directamente al enviar el reporte

  // Datos del formulario
  const [categoria, setCategoria] = useState<Categoria>(preselectedCategory as Categoria || 'bug');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pasosReproducir, setPasosReproducir] = useState('');
  const [comportamientoEsperado, setComportamientoEsperado] = useState('');

  // Reset form cuando se abre o cierra
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      if (preselectedCategory) {
        setCategoria(preselectedCategory as Categoria);
      }
      
      // 🎬 La grabación ya está corriendo en background desde que cargó la app
      // No necesitamos iniciar una nueva grabación aquí
    } else {
      // Limpiar también cuando se cierra
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setTitulo('');
      setDescripcion('');
      setPasosReproducir('');
      setComportamientoEsperado('');
      setCategoria('bug');
      setPrioridad('media');
      setError(null);
      
      // 🎬 Ya no detenemos la grabación al cerrar porque sigue corriendo en background
      // La grabación continúa hasta que el usuario recargue la página o cierre la app
    }
  }, [isOpen, preselectedCategory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setError(null);
    setScreenshotFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validaciones
      if (!titulo.trim()) {
        throw new Error('El título es requerido');
      }
      if (!descripcion.trim()) {
        throw new Error('La descripción es requerida');
      }

      // Capturar información del navegador y pantalla
      const userAgent = navigator.userAgent;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const navegador = navigator.userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[0] || 'Desconocido';

      // Convertir File a base64 si hay screenshot
      let screenshotData = null;
      if (screenshotFile) {
        const reader = new FileReader();
        screenshotData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(screenshotFile);
        });
      }

      // 🎬 NUEVO: Capturar snapshot de la sesión SIN detener la grabación
      let sessionRecording = null;
      let recordingDuration = 0;
      let recordingSizeStr = 'N/A';
      
      // La grabación está corriendo en background, capturamos un snapshot sin detenerla
      console.log('📸 Capturando snapshot de la sesión en background...');
      const session = sessionRecorder.captureSnapshot();
      
      if (session && session.endTime) {
        // Exportar el snapshot capturado
        sessionRecording = sessionRecorder.exportSessionBase64(session);
        recordingDuration = session.endTime - session.startTime;
        recordingSizeStr = `${Math.round(sessionRecording.length / 1024)} KB`;
        console.log(`✅ Snapshot capturado: ${session.events.length} eventos, ${recordingSizeStr}, ${recordingDuration}ms`);
      } else {
        console.warn('⚠️ No se pudo capturar el snapshot de la sesión');
      }

      const reportData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        prioridad,
        pagina_url: window.location.href,
        pathname: window.location.pathname,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        navegador,
        pasos_reproducir: pasosReproducir.trim() || null,
        comportamiento_esperado: comportamientoEsperado.trim() || null,
        screenshot_data: screenshotData,
        // 🎬 NUEVO: Incluir grabación de sesión
        session_recording: sessionRecording,
        recording_size: recordingSizeStr,
        recording_duration: recordingDuration,
        from_lia: fromLia
      };

      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al enviar el reporte');
      }

      const result = await response.json();
      // Mostrar pantalla de éxito
      setStep('success');

      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      // console.error('❌ Error al enviar reporte:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        data-reporte-modal
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-2">
              {step === 'form' ? 'Reportar un Problema' : '¡Reporte Enviado!'}
            </h2>
            <p className="text-blue-100">
              {step === 'form' 
                ? 'Ayúdanos a mejorar reportando problemas o sugerencias'
                : 'Gracias por tu reporte. Lo revisaremos pronto.'
              }
            </p>
            
            {/* 🎬 Indicador de que la sesión será capturada (siempre grabando en background) */}
            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-300/30 rounded-lg backdrop-blur-sm"
              >
                <Video className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium text-blue-100">
                  Se incluirá grabación de los últimos 60 segundos
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Categoría *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categorias.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategoria(cat.value)}
                          className={`p-3 rounded-lg border-2 transition-all bg-white dark:bg-slate-700/50 ${
                            categoria === cat.value
                              ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20'
                              : 'border-gray-300 dark:border-slate-600 hover:border-blue-500/50 dark:hover:border-blue-500/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${cat.color}`} />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {prioridades.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Resumen breve del problema"
                    maxLength={200}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el problema en detalle..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                {/* Pasos para reproducir (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Pasos para reproducir (opcional)
                  </label>
                  <textarea
                    value={pasosReproducir}
                    onChange={(e) => setPasosReproducir(e.target.value)}
                    placeholder="1. Haz clic en...&#10;2. Navega a...&#10;3. El error ocurre cuando..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Comportamiento esperado (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Comportamiento esperado (opcional)
                  </label>
                  <textarea
                    value={comportamientoEsperado}
                    onChange={(e) => setComportamientoEsperado(e.target.value)}
                    placeholder="¿Qué esperabas que sucediera?"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Captura de pantalla */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Captura de pantalla (opcional)
                  </label>
                  {screenshotPreview ? (
                    <div className="relative">
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot preview" 
                        className="w-full rounded-lg border border-gray-300 dark:border-slate-600 max-h-64 object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 bg-white dark:bg-slate-700/50 cursor-pointer"
                      >
                        <Upload className="w-5 h-5" />
                        Subir Imagen
                      </label>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 text-center">
                        Máximo 10MB. Formatos: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !titulo.trim() || !descripcion.trim()}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Reporte
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Screen */
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  ¡Reporte Enviado con Éxito!
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
