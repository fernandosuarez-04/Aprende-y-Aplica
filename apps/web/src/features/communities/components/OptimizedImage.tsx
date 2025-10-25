'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Download, ExternalLink, X } from 'lucide-react';

// Enums para mejor organización
enum ImageType {
  HEADER = 'header',
  POST = 'post',
  AVATAR = 'avatar',
  ATTACHMENT = 'attachment'
}

enum ImageSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl'
}

enum AspectRatio {
  SQUARE = 'square',
  VIDEO = 'video',
  WIDE = 'wide',
  PORTRAIT = 'portrait',
  AUTO = 'auto'
}

enum Quality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Clase para manejo de optimización de imágenes
class ImageOptimizer {
  private static instance: ImageOptimizer;
  private formatSupport: { webp: boolean; avif: boolean } = { webp: false, avif: false };

  private constructor() {
    this.detectFormatSupport();
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  private detectFormatSupport(): void {
    // Detectar soporte de WebP
    const webpTest = new Image();
    webpTest.onload = webpTest.onerror = () => {
      this.formatSupport.webp = webpTest.height === 2;
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

    // Detectar soporte de AVIF
    const avifTest = new Image();
    avifTest.onload = avifTest.onerror = () => {
      this.formatSupport.avif = avifTest.height === 2;
    };
    avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABgAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEAwgMgkAAAAA';
  }

  optimizeUrl(src: string, quality: Quality = Quality.MEDIUM): string {
    if (src.startsWith('data:')) return src;
    
    if (src.startsWith('http')) {
      if (src.includes('supabase')) {
        const qualityMap = { [Quality.LOW]: 'q=60', [Quality.MEDIUM]: 'q=80', [Quality.HIGH]: 'q=95' };
        const separator = src.includes('?') ? '&' : '?';
        return `${src}${separator}${qualityMap[quality]}&w=800`;
      }
    }
    
    return src;
  }

  getFormatSupport() {
    return this.formatSupport;
  }
}

// Clase para configuración de tipos de imagen
class ImageTypeConfig {
  static getConfig(type: ImageType, size: ImageSize = ImageSize.MD) {
    const configs = {
      [ImageType.HEADER]: {
        aspectRatio: AspectRatio.WIDE,
        maxHeight: '300px',
        quality: Quality.HIGH,
        lazy: false,
        showModal: false,
        showDownload: false,
        showExternal: false
      },
      [ImageType.POST]: {
        aspectRatio: AspectRatio.AUTO,
        maxHeight: '600px',
        quality: Quality.MEDIUM,
        lazy: true,
        showModal: true,
        showDownload: true,
        showExternal: true
      },
      [ImageType.AVATAR]: {
        aspectRatio: AspectRatio.SQUARE,
        maxHeight: this.getAvatarSize(size),
        quality: Quality.MEDIUM,
        lazy: false,
        showModal: false,
        showDownload: false,
        showExternal: false
      },
      [ImageType.ATTACHMENT]: {
        aspectRatio: AspectRatio.AUTO,
        maxHeight: '500px',
        quality: Quality.MEDIUM,
        lazy: true,
        showModal: true,
        showDownload: true,
        showExternal: true
      }
    };

    return configs[type];
  }

  private static getAvatarSize(size: ImageSize): string {
    const sizes = {
      [ImageSize.SM]: '40px',
      [ImageSize.MD]: '60px',
      [ImageSize.LG]: '80px',
      [ImageSize.XL]: '120px'
    };
    return sizes[size];
  }
}

// Clase para manejo de placeholders
class PlaceholderManager {
  static renderLoading(aspectRatio: AspectRatio, className: string = '') {
    const aspectClass = this.getAspectRatioClass(aspectRatio);
    
    return (
      <div className={`flex items-center justify-center bg-slate-700 rounded-lg ${aspectClass} ${className}`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full mx-auto mb-2"
          />
          <p className="text-slate-400 text-sm">Cargando imagen...</p>
        </div>
      </div>
    );
  }

  static renderError(aspectRatio: AspectRatio, message: string = 'Error al cargar imagen', onRetry?: () => void, className: string = '') {
    const aspectClass = this.getAspectRatioClass(aspectRatio);
    
    return (
      <div className={`flex items-center justify-center bg-slate-800 rounded-lg ${aspectClass} ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-2">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  private static getAspectRatioClass(aspectRatio: AspectRatio): string {
    const classes = {
      [AspectRatio.SQUARE]: 'aspect-square',
      [AspectRatio.VIDEO]: 'aspect-video',
      [AspectRatio.WIDE]: 'aspect-[16/9]',
      [AspectRatio.PORTRAIT]: 'aspect-[3/4]',
      [AspectRatio.AUTO]: ''
    };
    return classes[aspectRatio];
  }
}

// Clase para manejo del modal
class ModalManager {
  static renderModal(
    isOpen: boolean,
    onClose: () => void,
    imageUrl: string,
    imageName: string,
    showDownload: boolean,
    showExternal: boolean,
    isExternalUrl: boolean,
    attachmentData?: any
  ) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md rounded-xl"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-[95vw] max-h-[95vh] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl border border-slate-600/30 ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{imageName}</h3>
                    <p className="text-xs text-slate-400">
                      {imageUrl.startsWith('data:') ? 'Imagen adjunta' : 'Imagen externa'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {showDownload && (
                    <button
                      onClick={() => this.handleDownload(imageUrl, imageName)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                      title="Descargar imagen"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  {showExternal && isExternalUrl && (
                    <button
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Imagen */}
              <div className="relative flex items-center justify-center p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
                <motion.img
                  src={imageUrl}
                  alt={imageName}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                />
              </div>

              {/* Footer con información adicional */}
              {attachmentData && (
                <div className="p-4 bg-slate-800/60 backdrop-blur-sm border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {attachmentData.size ? `Tamaño: ${this.formatFileSize(attachmentData.size)}` : 'Imagen adjunta'}
                    </span>
                    <span>
                      {attachmentData.mimeType || 'Tipo de archivo no disponible'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  private static handleDownload(url: string, name: string) {
    // Obtener el nombre del archivo con extensión
    const getFileName = (url: string, fallbackName: string) => {
      if (url.startsWith('data:')) {
        const mimeType = url.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1] || 'png';
        return `${fallbackName || 'imagen'}.${extension}`;
      }
      
      // Extraer extensión de la URL
      const urlPath = url.split('?')[0];
      const extension = urlPath.split('.').pop() || 'jpg';
      return `${fallbackName || 'imagen'}.${extension}`;
    };

    const fileName = getFileName(url, name);

    // Si es una imagen base64, descargar directamente
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      return;
    }

    // Para URLs externas, descargar la imagen
    fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Error downloading image:', error);
        // Fallback: abrir en nueva pestaña
        window.open(url, '_blank');
      });
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Interfaces
interface OptimizedImageProps {
  src: string;
  alt: string;
  type?: ImageType;
  size?: ImageSize;
  className?: string;
  containerClassName?: string;
  showModal?: boolean;
  attachmentData?: any;
  fileName?: string;
  onError?: () => void;
  onLoad?: () => void;
}

// Hook personalizado para lazy loading
function useLazyLoading(lazy: boolean) {
  const [isInView, setIsInView] = useState(!lazy);
  const ref = useCallback((node: HTMLElement | null) => {
    if (!lazy || isInView || !node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  return { isInView, ref };
}

// Componente principal unificado
export function OptimizedImage({
  src,
  alt,
  type = ImageType.POST,
  size = ImageSize.MD,
  className = '',
  containerClassName = '',
  showModal = true,
  attachmentData,
  fileName,
  onError,
  onLoad
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtener configuración según el tipo
  const config = ImageTypeConfig.getConfig(type, size);
  const optimizer = ImageOptimizer.getInstance();
  
  // Lazy loading
  const { isInView, ref } = useLazyLoading(config.lazy);

  // Optimizar URL
  const optimizedSrc = optimizer.optimizeUrl(src, config.quality);

  // Manejar carga
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Manejar error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // Retry
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
  }, []);

  // Obtener clases de aspect ratio
  const getAspectRatioClass = () => {
    const classes = {
      [AspectRatio.SQUARE]: 'aspect-square',
      [AspectRatio.VIDEO]: 'aspect-video',
      [AspectRatio.WIDE]: 'aspect-[16/9]',
      [AspectRatio.PORTRAIT]: 'aspect-[3/4]',
      [AspectRatio.AUTO]: ''
    };
    return classes[config.aspectRatio];
  };

  // Obtener clases de tamaño para avatares
  const getSizeClasses = () => {
    if (type === ImageType.AVATAR) {
      const sizes = {
        [ImageSize.SM]: 'w-10 h-10',
        [ImageSize.MD]: 'w-16 h-16',
        [ImageSize.LG]: 'w-20 h-20',
        [ImageSize.XL]: 'w-32 h-32'
      };
      return sizes[size];
    }
    return '';
  };

  const isExternalUrl = src.startsWith('http') && !src.startsWith('data:');

  // Renderizar error
  if (hasError) {
    return PlaceholderManager.renderError(
      config.aspectRatio,
      'Error al cargar imagen',
      handleRetry,
      containerClassName
    );
  }

  return (
    <>
      <div
        ref={(node) => {
          containerRef.current = node;
          ref(node);
        }}
        className={`relative group ${containerClassName}`}
        style={{ maxHeight: config.aspectRatio === AspectRatio.AUTO ? config.maxHeight : undefined }}
      >
        {/* Placeholder mientras carga */}
        {!isLoaded && (
          <div className="absolute inset-0">
            {PlaceholderManager.renderLoading(config.aspectRatio, 'w-full h-full')}
          </div>
        )}

        {/* Imagen optimizada */}
        {isInView && (
          <motion.img
            ref={imgRef}
            src={optimizedSrc}
            alt={alt}
            className={`
              w-full h-auto transition-all duration-300
              ${getAspectRatioClass()}
              ${config.aspectRatio === AspectRatio.AUTO ? 'object-contain' : 'object-cover'}
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${showModal && config.showModal ? 'cursor-pointer hover:opacity-90' : ''}
              ${getSizeClasses()}
              ${className}
            `}
            style={{ maxHeight: config.aspectRatio === AspectRatio.AUTO ? config.maxHeight : undefined }}
            onLoad={handleLoad}
            onError={handleError}
            onClick={() => {
              console.log('🖼️ Image clicked:', { showModal, configShowModal: config.showModal });
              if (showModal && config.showModal) {
                setShowFullscreen(true);
              }
            }}
            loading={config.lazy ? 'lazy' : 'eager'}
            decoding="async"
          />
        )}

        {/* Overlay de hover */}
        {showModal && config.showModal && isLoaded && (
          <div 
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"
            onClick={() => setShowFullscreen(true)}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Modal de pantalla completa */}
      {showModal && config.showModal && (
        <>
          {console.log('🔍 Modal render check:', { showModal, configShowModal: config.showModal, showFullscreen })}
          {ModalManager.renderModal(
            showFullscreen,
            () => setShowFullscreen(false),
            src,
            fileName || alt,
            config.showDownload,
            config.showExternal,
            isExternalUrl,
            attachmentData
          )}
        </>
      )}
    </>
  );
}

// Componentes de conveniencia para diferentes tipos
export function CommunityHeaderImage(props: Omit<OptimizedImageProps, 'type'>) {
  return <OptimizedImage {...props} type={ImageType.HEADER} />;
}

export function PostImage(props: Omit<OptimizedImageProps, 'type'>) {
  return <OptimizedImage {...props} type={ImageType.POST} />;
}

export function UserAvatar(props: Omit<OptimizedImageProps, 'type'>) {
  return <OptimizedImage {...props} type={ImageType.AVATAR} />;
}

export function AttachmentImage(props: Omit<OptimizedImageProps, 'type'>) {
  return <OptimizedImage {...props} type={ImageType.ATTACHMENT} />;
}

// Exportar enums para uso externo
export { ImageType, ImageSize, AspectRatio, Quality };
