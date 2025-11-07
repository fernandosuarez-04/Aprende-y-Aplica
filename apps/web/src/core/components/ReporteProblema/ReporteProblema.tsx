'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  Zap, 
  Palette, 
  HelpCircle,
  Camera,
  Send,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import html2canvas from 'html2canvas';

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
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);

  // Datos del formulario
  const [categoria, setCategoria] = useState<Categoria>(preselectedCategory as Categoria || 'bug');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pasosReproducir, setPasosReproducir] = useState('');
  const [comportamientoEsperado, setComportamientoEsperado] = useState('');

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError(null);
      setScreenshot(null);
      if (preselectedCategory) {
        setCategoria(preselectedCategory as Categoria);
      }
    }
  }, [isOpen, preselectedCategory]);

  const captureScreenshot = async () => {
    setCapturingScreenshot(true);
    try {
      // Ocultar el modal temporalmente
      const modal = document.querySelector('[data-reporte-modal]') as HTMLElement;
      if (modal) {
        modal.style.display = 'none';
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 0.5 // Reducir calidad para menor tamaño
      });

      const screenshotData = canvas.toDataURL('image/jpeg', 0.7);
      setScreenshot(screenshotData);

      // Mostrar el modal nuevamente
      if (modal) {
        modal.style.display = 'flex';
      }
    } catch (error) {
      console.error('Error capturando pantalla:', error);
      setError('No se pudo capturar la pantalla. Puedes continuar sin captura.');
    } finally {
      setCapturingScreenshot(false);
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
        screenshot_data: screenshot,
        from_lia: fromLia
      };

      console.log('📤 Enviando reporte:', reportData);

      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el reporte');
      }

      const result = await response.json();
      console.log('✅ Reporte enviado:', result);

      // Mostrar pantalla de éxito
      setStep('success');

      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        onClose();
        // Reset form
        setTitulo('');
        setDescripcion('');
        setPasosReproducir('');
        setComportamientoEsperado('');
        setScreenshot(null);
        setCategoria('bug');
        setPrioridad('media');
      }, 3000);

    } catch (error) {
      console.error('❌ Error al enviar reporte:', error);
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
          className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] p-6 text-white relative">
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
            <p className="text-white/90 text-sm">
              {step === 'form' 
                ? 'Ayúdanos a mejorar reportando problemas o sugerencias'
                : 'Gracias por tu reporte. Lo revisaremos pronto.'
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
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
                          className={`p-3 rounded-lg border-2 transition-all ${
                            categoria === cat.value
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${cat.color}`} />
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Resumen breve del problema"
                    maxLength={200}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el problema en detalle..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    required
                  />
                </div>

                {/* Pasos para reproducir (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Pasos para reproducir (opcional)
                  </label>
                  <textarea
                    value={pasosReproducir}
                    onChange={(e) => setPasosReproducir(e.target.value)}
                    placeholder="1. Haz clic en...&#10;2. Navega a...&#10;3. El error ocurre cuando..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                  />
                </div>

                {/* Comportamiento esperado (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Comportamiento esperado (opcional)
                  </label>
                  <textarea
                    value={comportamientoEsperado}
                    onChange={(e) => setComportamientoEsperado(e.target.value)}
                    placeholder="¿Qué esperabas que sucediera?"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                  />
                </div>

                {/* Captura de pantalla */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Captura de pantalla (opcional)
                  </label>
                  {screenshot ? (
                    <div className="relative">
                      <img 
                        src={screenshot} 
                        alt="Screenshot" 
                        className="w-full rounded-lg border border-[var(--color-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={capturingScreenshot}
                      className="w-full py-3 px-4 border-2 border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                    >
                      {capturingScreenshot ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Capturando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Capturar Pantalla
                        </>
                      )}
                    </button>
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
                    className="flex-1 px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-dark)] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !titulo.trim() || !descripcion.trim()}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                  ¡Reporte Enviado con Éxito!
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold hover:shadow-lg transition-all"
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
