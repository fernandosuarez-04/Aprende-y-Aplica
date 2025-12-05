/**
 * Componente para reproducir sesiones grabadas con rrweb
 */
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import type { RecordingSession } from '../../../lib/rrweb/session-recorder';

interface SessionPlayerProps {
  session: RecordingSession;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  showController?: boolean;
  skipInactive?: boolean;
  speed?: number;
}

/**
 * Normaliza las URLs en los eventos de rrweb para que funcionen en cualquier entorno
 * Reemplaza localhost y otras URLs con la URL actual del entorno
 */
function normalizeEventsUrls(events: any[]): any[] {
  if (typeof window === 'undefined') return events;
  
  const currentOrigin = window.location.origin;
  const localhostPatterns = [
    /https?:\/\/localhost(:\d+)?/gi,
    /https?:\/\/127\.0\.0\.1(:\d+)?/gi,
    /https?:\/\/0\.0\.0\.0(:\d+)?/gi,
  ];
  
  return events.map(event => {
    // Clonar el evento para no modificar el original
    const normalizedEvent = JSON.parse(JSON.stringify(event));
    
    // Procesar el snapshot inicial (tipo 2)
    if (normalizedEvent.type === 2 && normalizedEvent.data) {
      const data = normalizedEvent.data;
      
      // Normalizar URLs en el HTML del snapshot
      if (data.node && typeof data.node === 'object') {
        const normalizeNode = (node: any): any => {
          if (!node) return node;
          
          // Normalizar atributos que contienen URLs
          if (node.attributes) {
            Object.keys(node.attributes).forEach(attr => {
              const value = node.attributes[attr];
              if (typeof value === 'string') {
                localhostPatterns.forEach(pattern => {
                  if (pattern.test(value)) {
                    node.attributes[attr] = value.replace(pattern, currentOrigin);
                  }
                });
              }
            });
          }
          
          // Normalizar children recursivamente
          if (node.childNodes && Array.isArray(node.childNodes)) {
            node.childNodes = node.childNodes.map(normalizeNode);
          }
          
          return node;
        };
        
        data.node = normalizeNode(data.node);
      }
      
      // Normalizar URLs en el HTML string si existe
      if (typeof data === 'string') {
        let htmlString = data;
        localhostPatterns.forEach(pattern => {
          htmlString = htmlString.replace(pattern, currentOrigin);
        });
        normalizedEvent.data = htmlString;
      }
    }
    
    // Procesar eventos incrementales (tipo 3) que puedan tener URLs
    if (normalizedEvent.type === 3 && normalizedEvent.data) {
      const data = normalizedEvent.data;
      
      // Normalizar URLs en atributos de mutaciones
      if (data.attributes) {
        Object.keys(data.attributes).forEach(key => {
          const value = data.attributes[key];
          if (typeof value === 'string') {
            localhostPatterns.forEach(pattern => {
              if (pattern.test(value)) {
                data.attributes[key] = value.replace(pattern, currentOrigin);
              }
            });
          }
        });
      }
      
      // Normalizar URLs en textContent si contiene URLs
      if (data.textContent && typeof data.textContent === 'string') {
        localhostPatterns.forEach(pattern => {
          if (pattern.test(data.textContent)) {
            data.textContent = data.textContent.replace(pattern, currentOrigin);
          }
        });
      }
    }
    
    return normalizedEvent;
  });
}

export function SessionPlayer({
  session,
  width = '100%',
  height = '600px',
  autoPlay = false,
  showController = true,
  skipInactive = true,
  speed = 1,
}: SessionPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Relación de aspecto estándar para videos (16:9)
  const ASPECT_RATIO = 16 / 9;
  
  // Normalizar eventos para reemplazar URLs de localhost
  const normalizedEvents = useMemo(() => {
    if (!session?.events) return [];
    return normalizeEventsUrls(session.events);
  }, [session?.events]);
  
  // Crear sesión normalizada
  const normalizedSession = useMemo(() => {
    if (!session) return null;
    return {
      ...session,
      events: normalizedEvents,
    };
  }, [session, normalizedEvents]);

  // Calcular dimensiones basadas en el contenedor padre
  useEffect(() => {
    const updateDimensions = () => {
      if (!wrapperRef.current) {
        // Si el wrapper no está disponible, usar un pequeño delay
        setTimeout(updateDimensions, 50);
        return;
      }

      const parent = wrapperRef.current.parentElement;
      if (!parent) {
        setTimeout(updateDimensions, 50);
        return;
      }

      const parentRect = parent.getBoundingClientRect();
      const parentWidth = parentRect.width;

      // Si el ancho es 0, esperar un poco más
      if (parentWidth === 0) {
        setTimeout(updateDimensions, 50);
        return;
      }

      // Obtener el padding del contenedor padre (si tiene)
      const parentStyles = window.getComputedStyle(parent);
      const paddingLeft = parseFloat(parentStyles.paddingLeft) || 0;
      const paddingRight = parseFloat(parentStyles.paddingRight) || 0;
      const borderLeft = parseFloat(parentStyles.borderLeftWidth) || 0;
      const borderRight = parseFloat(parentStyles.borderRightWidth) || 0;
      
      // Calcular ancho disponible (restando padding y borders)
      const totalHorizontalPadding = paddingLeft + paddingRight + borderLeft + borderRight;
      const availableWidth = Math.max(100, parentWidth - totalHorizontalPadding);
      
      // Intentar obtener el tamaño real de la pantalla grabada del snapshot
      let availableHeight = Math.round(availableWidth / ASPECT_RATIO); // Fallback a 16:9
      
      if (normalizedSession && normalizedSession.events) {
        const snapshotEvent = normalizedSession.events.find((e: any) => e.type === 2);
        if (snapshotEvent && snapshotEvent.data) {
          // Intentar obtener el tamaño del viewport/documento del snapshot
          let snapshotWidth = 0;
          let snapshotHeight = 0;
          
          // Método 1: Buscar en meta
          if (snapshotEvent.data.meta?.width && snapshotEvent.data.meta?.height) {
            snapshotWidth = snapshotEvent.data.meta.width;
            snapshotHeight = snapshotEvent.data.meta.height;
          }
          // Método 2: Buscar en el nodo raíz del documento
          else if (snapshotEvent.data.node) {
            try {
              // Buscar el elemento body o html que tenga dimensiones
              const findDimensions = (node: any): { width: number; height: number } | null => {
                if (!node) return null;
                
                // Buscar en atributos
                if (node.attributes) {
                  const style = node.attributes.style;
                  if (style && typeof style === 'string') {
                    const widthMatch = style.match(/width[:\s]+(\d+)px/);
                    const heightMatch = style.match(/height[:\s]+(\d+)px/);
                    if (widthMatch && heightMatch) {
                      return {
                        width: parseInt(widthMatch[1]),
                        height: parseInt(heightMatch[1])
                      };
                    }
                  }
                }
                
                // Buscar en children
                if (node.childNodes && Array.isArray(node.childNodes)) {
                  for (const child of node.childNodes) {
                    const dims = findDimensions(child);
                    if (dims) return dims;
                  }
                }
                
                return null;
              };
              
              const dims = findDimensions(snapshotEvent.data.node);
              if (dims) {
                snapshotWidth = dims.width;
                snapshotHeight = dims.height;
              }
            } catch (e) {
              console.warn('Error buscando dimensiones en snapshot:', e);
            }
          }
          
          // Si encontramos dimensiones, calcular altura manteniendo la relación de aspecto
          if (snapshotWidth > 0 && snapshotHeight > 0) {
            const aspectRatio = snapshotWidth / snapshotHeight;
            availableHeight = Math.round(availableWidth / aspectRatio);
            console.log('📐 Dimensiones del snapshot encontradas:', {
              snapshotWidth,
              snapshotHeight,
              aspectRatio,
              calculatedHeight: availableHeight
            });
          } else {
            // Si no encontramos dimensiones, usar una altura mínima más grande
            // La mayoría de pantallas tienen al menos 600-800px de altura
            availableHeight = Math.max(800, Math.round(availableWidth * 1.2)); // Al menos 1.2:1 o 800px
            console.log('📐 Usando altura mínima (no se encontraron dimensiones del snapshot):', availableHeight);
          }
        } else {
          // Si no hay snapshot aún, usar altura mínima
          availableHeight = Math.max(800, Math.round(availableWidth * 1.2));
        }
      } else {
        // Fallback: usar altura mínima más grande
        availableHeight = Math.max(800, Math.round(availableWidth * 1.2));
      }

      setDimensions({
        width: availableWidth,
        height: availableHeight,
      });

      console.log('📐 Dimensiones finales calculadas:', {
        parentWidth,
        availableWidth,
        availableHeight,
        ratio: (availableWidth / availableHeight).toFixed(2),
      });
    };

    // Calcular dimensiones iniciales después de un pequeño delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(updateDimensions, 100);

    // Observar cambios en el tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    // Observar el contenedor padre cuando esté disponible
    const observeParent = () => {
      if (wrapperRef.current?.parentElement) {
        resizeObserver.observe(wrapperRef.current.parentElement);
      } else {
        setTimeout(observeParent, 50);
      }
    };
    
    observeParent();

    // También escuchar eventos de resize de la ventana
    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [normalizedSession]); // Agregar normalizedSession como dependencia

  // Convertir height de string a número si es posible
  const getHeightValue = (): number | undefined => {
    if (dimensions) return dimensions.height;
    if (typeof height === 'number') return height;
    if (typeof height === 'string' && height.endsWith('px')) {
      return parseInt(height.replace('px', ''), 10);
    }
    return undefined;
  };

  // Convertir width de string a número si es posible
  const getWidthValue = (): number | undefined => {
    if (dimensions) return dimensions.width;
    if (typeof width === 'number') return width;
    if (typeof width === 'string' && width.endsWith('px')) {
      return parseInt(width.replace('px', ''), 10);
    }
    return undefined;
  };

  useEffect(() => {
    console.log('🎬 useEffect ejecutado');
    
    if (!normalizedSession || !normalizedSession.events.length) {
      console.warn('⚠️ SessionPlayer: No hay eventos para reproducir')
      setError('No hay eventos para reproducir');
      setIsLoading(false);
      return;
    }

    let attemptCount = 0;
    const maxAttempts = 50; // Máximo 50 intentos (unos 3 segundos)

    // Esperar a que el ref esté disponible con requestAnimationFrame
    const initializePlayer = () => {
      attemptCount++;
      
      if (!containerRef.current) {
        if (attemptCount >= maxAttempts) {
          console.error('❌ Timeout: Contenedor no disponible después de', maxAttempts, 'intentos');
          setError('Error: No se pudo cargar el reproductor (timeout)');
          setIsLoading(false);
          return;
        }
        console.log(`⏳ Intento ${attemptCount}/${maxAttempts}: Ref no disponible aún, reintentando...`);
        requestAnimationFrame(initializePlayer);
        return;
      }

      const container = containerRef.current;
      
      // Usar dimensiones calculadas o las del contenedor
      const widthValue = getWidthValue();
      const heightValue = getHeightValue();
      
      // Verificar que tengamos dimensiones válidas
      if (!widthValue || !heightValue || widthValue === 0 || heightValue === 0) {
        if (attemptCount >= maxAttempts) {
          console.error('❌ Timeout: Sin dimensiones válidas después de', maxAttempts, 'intentos');
          setError('Error: No se pudieron calcular las dimensiones del reproductor');
          setIsLoading(false);
          return;
        }
        console.log(`⏳ Intento ${attemptCount}/${maxAttempts}: Esperando dimensiones (${widthValue}x${heightValue}), reintentando...`);
        requestAnimationFrame(initializePlayer);
        return;
      }

      console.log('✅ Contenedor encontrado después de', attemptCount, 'intentos');
      console.log('   - Dimensiones calculadas:', widthValue, 'x', heightValue);

      try {
        console.log('🎬 PASO 1: Iniciando proceso de player...');
        
        // Limpiar player anterior si existe
        if (playerRef.current) {
          console.log('🧹 Limpiando player anterior...');
          try {
            playerRef.current.pause();
          } catch (e) {
            console.warn('Error al pausar player anterior:', e);
          }
          container.innerHTML = '';
        }

        console.log('🎬 PASO 2: Preparando datos...');
        console.log('   - Total eventos:', normalizedSession.events.length);
        console.log('   - Eventos normalizados (URLs de localhost reemplazadas)');
        console.log('   - Primeros 5 eventos:', normalizedSession.events.slice(0, 5).map((e: any) => ({
          type: e.type,
          timestamp: e.timestamp
        })));

        console.log('🎬 PASO 3: Creando instancia de rrwebPlayer...');
        
        // Las dimensiones ya están calculadas arriba
        console.log('   - Dimensiones del player:', widthValue, 'x', heightValue);
        console.log('   - Total eventos:', normalizedSession.events.length);
        console.log('   - Primer evento:', normalizedSession.events[0]);
        console.log('   - Último evento:', normalizedSession.events[normalizedSession.events.length - 1]);
        
        // Verificar que haya al menos un snapshot (tipo 2)
        const snapshotEvents = normalizedSession.events.filter((e: any) => e.type === 2);
        const incrementalEvents = normalizedSession.events.filter((e: any) => e.type === 3);
        
        console.log('📊 Análisis de eventos:');
        console.log('   - Total eventos:', normalizedSession.events.length);
        console.log('   - Snapshots (tipo 2):', snapshotEvents.length);
        console.log('   - Eventos incrementales (tipo 3):', incrementalEvents.length);
        console.log('   - Otros tipos:', normalizedSession.events.filter((e: any) => e.type !== 2 && e.type !== 3).map((e: any) => e.type));
        
        if (snapshotEvents.length === 0) {
          console.error('❌ No se encontró ningún snapshot inicial (tipo 2)');
          console.error('   - Tipos de eventos encontrados:', [...new Set(normalizedSession.events.map((e: any) => e.type))]);
          setError('Error: La grabación no tiene un snapshot inicial válido');
          setIsLoading(false);
          return;
        }
        
        if (incrementalEvents.length === 0) {
          console.warn('⚠️ No hay eventos incrementales (tipo 3) - solo se mostrará el snapshot estático');
          console.warn('   - Esto significa que no hay acciones grabadas, solo la captura inicial');
        }
        
        // Verificar que los eventos tengan la estructura correcta
        const firstEvent = normalizedSession.events[0];
        if (!firstEvent || typeof firstEvent !== 'object') {
          console.error('❌ Los eventos no tienen la estructura correcta');
          setError('Error: Los eventos de la grabación no son válidos');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Validación de eventos pasada');
        console.log('   - Primer evento:', {
          type: firstEvent.type,
          timestamp: firstEvent.timestamp,
          hasData: 'data' in firstEvent
        });
        
        // Verificar timestamps
        if (normalizedSession.events.length > 1) {
          const timestamps = normalizedSession.events.map((e: any) => e.timestamp).filter(Boolean);
          if (timestamps.length > 0) {
            const duration = Math.max(...timestamps) - Math.min(...timestamps);
            console.log('   - Duración de la grabación:', Math.round(duration / 1000), 'segundos');
          }
        }
        
        // Crear nuevo player
        try {
          // Asegurar que el contenedor esté visible antes de crear el player
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          
          console.log('   - Creando player con configuración:', {
            eventsCount: session.events.length,
            width: widthValue,
            height: heightValue,
            autoPlay,
            showController,
            skipInactive,
            speed
          });
          
          // Si el player ya existe y solo cambian las dimensiones, actualizarlo
          if (playerRef.current && dimensions) {
            try {
              // Intentar actualizar las dimensiones del player existente
              if (playerRef.current.updateDimensions) {
                playerRef.current.updateDimensions(widthValue, heightValue);
              } else {
                // Si no hay método de actualización, recrear el player
                console.log('🔄 Recreando player con nuevas dimensiones...');
                container.innerHTML = '';
                playerRef.current = null;
              }
            } catch (e) {
              console.warn('⚠️ Error actualizando dimensiones, recreando player:', e);
              container.innerHTML = '';
              playerRef.current = null;
            }
          }
          
          // Crear nuevo player solo si no existe
          if (!playerRef.current) {
            console.log('   - Instanciando nuevo rrwebPlayer...');
            console.log('   - Tipo de rrwebPlayer:', typeof rrwebPlayer);
            console.log('   - Es función:', typeof rrwebPlayer === 'function');
            console.log('   - Es clase:', typeof rrwebPlayer === 'function' && rrwebPlayer.prototype);
            
            try {
            console.log('   - Creando player con eventos:', normalizedSession.events.length);
            console.log('   - Eventos tipo 2 (snapshots):', normalizedSession.events.filter((e: any) => e.type === 2).length);
            console.log('   - Eventos tipo 3 (incrementales):', normalizedSession.events.filter((e: any) => e.type === 3).length);
            
            // Crear el player con configuración simplificada
            playerRef.current = new rrwebPlayer({
              target: container,
              props: {
                events: normalizedSession.events,
                width: widthValue,
                height: heightValue,
                autoPlay: true, // Reproducir automáticamente
                showController: true, // Mostrar controles
                skipInactive: false, // No saltar períodos inactivos
                speed: 1,
                UNSAFE_replayCanvas: false,
              },
            });
            
            console.log('   - Player creado, esperando renderizado...');
            
            // Esperar a que el player se renderice y luego forzar reproducción
            setTimeout(() => {
              const iframe = container.querySelector('iframe');
              const canvas = container.querySelector('canvas');
              const playerElement = container.querySelector('.rr-player');
              
              console.log('   - Elementos encontrados:', {
                iframe: !!iframe,
                canvas: !!canvas,
                playerElement: !!playerElement
              });
              
              // Intentar forzar la reproducción si el player tiene métodos
              if (playerRef.current) {
                try {
                  // Intentar métodos comunes de rrweb-player
                  if (typeof playerRef.current.play === 'function') {
                    playerRef.current.play();
                    console.log('   - Reproducción iniciada con play()');
                  }
                  if (typeof playerRef.current.start === 'function') {
                    playerRef.current.start();
                    console.log('   - Reproducción iniciada con start()');
                  }
                } catch (e) {
                  console.warn('   - No se pudo iniciar reproducción automáticamente:', e);
                }
              }
              
              // Ajustar estilos del iframe/canvas para que se vea completo
              const elementToStyle = iframe || canvas || playerElement;
              if (elementToStyle) {
                const el = elementToStyle as HTMLElement;
                el.style.width = '100%';
                el.style.height = '100%';
                el.style.maxWidth = '100%';
                el.style.maxHeight = '100%';
                console.log('   - Estilos aplicados al elemento del player');
              }
            }, 500);
              
              console.log('   - Player instanciado exitosamente');
              console.log('   - Player ref:', !!playerRef.current);
              console.log('   - Tipo del player:', typeof playerRef.current);
              
              if (playerRef.current) {
                console.log('   - Player métodos disponibles:', Object.keys(playerRef.current).slice(0, 10));
              }
            } catch (playerError) {
              console.error('❌ Error al instanciar rrwebPlayer:', playerError);
              console.error('   - Stack:', (playerError as Error).stack);
              throw playerError;
            }
          } else {
            console.log('   - Player ya existe, reutilizando...');
          }

          console.log('🎬 PASO 4: Player creado, verificando...');
          console.log('   - Player ref:', !!playerRef.current);
          console.log('   - Container children:', container.children.length);
          console.log('   - Container HTML:', container.innerHTML.substring(0, 200));
          
          // Mostrar el contenedor inmediatamente
          container.style.display = 'block';
          
          // Forzar que el contenedor sea visible
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          container.style.width = '100%';
          container.style.height = '100%';
          
          // Esperar un momento y luego ocultar el loading
          // El player debería renderizarse automáticamente
          setTimeout(() => {
            const iframe = container.querySelector('iframe');
            const canvas = container.querySelector('canvas');
            const playerElement = container.querySelector('.rr-player');
            const allChildren = Array.from(container.children);
            
            console.log('🔍 Verificación del player:');
            console.log('   - Iframe encontrado:', !!iframe);
            console.log('   - Canvas encontrado:', !!canvas);
            console.log('   - Player element encontrado:', !!playerElement);
            console.log('   - Total children:', allChildren.length);
            console.log('   - Container HTML length:', container.innerHTML.length);
            
            if (iframe) {
              console.log('   - Iframe dimensiones:', iframe.offsetWidth, 'x', iframe.offsetHeight);
            }
            if (canvas) {
              console.log('   - Canvas dimensiones:', canvas.offsetWidth, 'x', canvas.offsetHeight);
            }
            
            // Ocultar loading siempre después de un tiempo razonable
            // El player debería estar funcionando incluso si no detectamos los elementos
            console.log('✅ Ocultando loading y mostrando player');
            setIsLoading(false);
            setError(null);
          }, 500);
          
        } catch (playerError) {
          console.error('❌ Error creando instancia del player:', playerError);
          throw playerError;
        }
      } catch (err) {
        console.error('❌ Error inicializando player en algún paso:', err);
        console.error('   Stack:', (err as Error).stack);
        setError('Error al cargar la reproducción: ' + (err as Error).message);
        setIsLoading(false);
      }
    };

    // Iniciar el proceso
    initializePlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (err) {
          console.error('Error al pausar player:', err);
        }
      }
    };
  }, [normalizedSession, width, height, autoPlay, showController, skipInactive, speed, dimensions]);

  // Calcular estilos del wrapper basados en dimensiones calculadas
  const wrapperStyle: React.CSSProperties = {
    width: dimensions ? `${dimensions.width}px` : (typeof width === 'number' ? `${width}px` : width),
    height: dimensions ? `${dimensions.height}px` : (typeof height === 'number' ? `${height}px` : height),
    position: 'relative',
    minHeight: dimensions ? `${dimensions.height}px` : (typeof height === 'number' ? `${height}px` : height),
    maxWidth: '100%',
    margin: '0 auto',
  };

  return (
    <div ref={wrapperRef} className="session-player-wrapper" style={wrapperStyle}>
      {/* Div del player - SIEMPRE presente */}
      <div 
        ref={containerRef} 
        className="rrweb-player-container bg-white dark:bg-gray-800"
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: dimensions ? `${dimensions.height}px` : (typeof height === 'number' ? `${height}px` : height),
          position: 'relative',
          display: 'block', // Siempre mostrar el contenedor
          overflow: 'hidden',
          zIndex: 1,
          opacity: isLoading || error ? 0.3 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }} 
      />
      
      {/* Overlay de loading */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando reproducción...</p>
          </div>
        </div>
      )}
      
      {/* Overlay de error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-center px-4">
            <svg
              className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente compacto para mostrar info de la sesión
 */
interface SessionInfoProps {
  session: RecordingSession;
  showSize?: boolean;
}

export function SessionInfo({ session, showSize = true }: SessionInfoProps) {
  const duration = session.endTime
    ? session.endTime - session.startTime
    : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSize = () => {
    const json = JSON.stringify(session);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-400">Eventos grabados:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{session.events.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-400">Duración:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{formatDuration(duration)}</span>
      </div>
      {showSize && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Tamaño:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{getSize()}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
        <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
          {new Date(session.startTime).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
