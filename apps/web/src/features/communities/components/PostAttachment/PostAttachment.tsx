'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, 
  FileText, 
  Video, 
  Youtube, 
  Link, 
  BarChart3,
  ExternalLink,
  Download,
  Play
} from 'lucide-react';
import { ImageModal } from '../ImageModal';
import { AttachmentImage } from '../OptimizedImage';

interface PostAttachmentProps {
  attachmentType: string;
  attachmentUrl?: string;
  attachmentData?: any;
  className?: string;
  postId?: string;
  communitySlug?: string;
}

export function PostAttachment({ 
  attachmentType, 
  attachmentUrl, 
  attachmentData, 
  className = '',
  postId,
  communitySlug
}: PostAttachmentProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!attachmentType) return null;

  // Validar que tenemos una URL válida para tipos que la requieren
  const hasValidUrl = attachmentUrl && attachmentUrl.trim() !== '';
  const requiresUrl = ['image', 'video', 'document', 'youtube', 'link'].includes(attachmentType);
  
  if (requiresUrl && !hasValidUrl) {
    console.warn('PostAttachment: Missing or invalid URL for type:', attachmentType);
    return null;
  }

  const renderAttachment = () => {
    switch (attachmentType) {
      case 'image':
        if (!attachmentUrl) return null;
        
        // Verificar si es una URL base64
        const isBase64 = attachmentUrl.startsWith('data:');
        const isExternalUrl = attachmentUrl.startsWith('http');
        
        // Si es base64, validar que esté bien formateado
        if (isBase64) {
          // Verificar que el base64 esté bien formateado
          const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/;
          if (!base64Regex.test(attachmentUrl)) {
            console.warn('🎨 [IMAGE] Base64 mal formateado:', attachmentUrl.substring(0, 100) + '...');
            return (
              <div className="w-full h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Imagen no válida</p>
                </div>
              </div>
            );
          }
        }
        
        return (
          <AttachmentImage
              src={attachmentUrl}
              alt={attachmentData?.name || 'Imagen adjunta'}
            attachmentData={attachmentData}
            fileName={attachmentData?.name}
            className="w-full max-h-96 rounded-lg"
            containerClassName="relative group"
            showModal={true}
          />
        );

      case 'video':
        if (!attachmentUrl) return null;
        
        // CORRECCIÓN TEMPORAL: Si la URL es de YouTube, renderizar como YouTube
        const isYouTubeUrl = attachmentUrl.includes('youtube.com/embed/') || attachmentUrl.includes('youtu.be/') || attachmentUrl.includes('youtube.com/watch');
        
        if (isYouTubeUrl) {
          console.log('🎥 [YOUTUBE] Detectado video de YouTube en caso video, renderizando como YouTube');
          
          // Extraer videoId de la URL
          let videoId = null;
          if (attachmentUrl.includes('youtube.com/embed/')) {
            videoId = attachmentUrl.split('youtube.com/embed/')[1]?.split('?')[0];
          } else if (attachmentUrl.includes('youtu.be/')) {
            videoId = attachmentUrl.split('youtu.be/')[1]?.split('?')[0];
          } else if (attachmentUrl.includes('youtube.com/watch')) {
            const match = attachmentUrl.match(/[?&]v=([^&]+)/);
            videoId = match ? match[1] : null;
          }
          
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
          
          return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              {embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    title="Video de YouTube"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => console.log('🎥 [YOUTUBE] Iframe cargado exitosamente:', embedUrl)}
                    onError={(e) => console.error('🎥 [YOUTUBE] Error cargando iframe:', embedUrl, e)}
                  />
                  {/* Debug info - temporal */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-1 rounded opacity-50">
                    ID: {videoId}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                    <div className="text-center">
                      <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm mb-3">No se pudo extraer videoId</p>
                      <button
                        onClick={() => window.open(attachmentUrl, '_blank')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver en YouTube
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h4 className="font-medium text-white mb-1">
                  Video de YouTube
                </h4>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </p>
              </div>
            </div>
          );
        }
        
        // Si no es YouTube, renderizar como video normal
        const isVideoBase64 = attachmentUrl.startsWith('data:');
        const isVideoExternalUrl = attachmentUrl.startsWith('http');
        
        return (
          <div className="relative group">
            <video
              src={attachmentUrl}
              controls
              className="w-full max-h-96 rounded-lg"
              poster={attachmentData?.thumbnail}
              onError={(e) => {
                console.error('Error loading video:', isVideoBase64 ? 'Base64 video failed to load' : attachmentUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Download 
                className="w-4 h-4 text-white cursor-pointer"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = attachmentUrl!;
                  link.download = attachmentData?.name || 'video';
                  link.click();
                }}
              />
            </div>
          </div>
        );

      case 'document':
        if (!attachmentUrl) return null;
        
        const isDocBase64 = attachmentUrl.startsWith('data:');
        const isDocExternalUrl = attachmentUrl.startsWith('http');
        
        return (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
               onClick={() => {
                 if (isDocExternalUrl) {
                   window.open(attachmentUrl, '_blank');
                 } else {
                   // Para base64, crear un enlace de descarga
                   const link = document.createElement('a');
                   link.href = attachmentUrl;
                   link.download = attachmentData?.name || 'documento';
                   link.click();
                 }
               }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">
                  {attachmentData?.name || 'Documento'}
                </h4>
                <p className="text-sm text-slate-400">
                  {attachmentData?.size ? formatFileSize(attachmentData.size) : 'Documento adjunto'}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        );

      case 'youtube':
        if (!attachmentUrl) return null;
        
        // Intentar extraer videoId de diferentes fuentes
        let videoId = attachmentData?.videoId;
        
        // Si no hay videoId en attachmentData, intentar extraerlo de la URL
        if (!videoId && attachmentUrl) {
          const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
          const match = attachmentUrl.match(regex);
          videoId = match ? match[1] : null;
        }
        
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        
        // Debug: Log para ver qué datos tenemos
        console.log('🎥 [YOUTUBE DEBUG] Datos completos:', { 
          attachmentUrl, 
          attachmentData, 
          videoId, 
          embedUrl,
          extractedVideoId: videoId,
          attachmentType: 'youtube'
        });
        
        return (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  title={attachmentData?.title || 'Video de YouTube'}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => console.log('🎥 [YOUTUBE] Iframe cargado exitosamente:', embedUrl)}
                  onError={(e) => console.error('🎥 [YOUTUBE] Error cargando iframe:', embedUrl, e)}
                />
                {/* Debug info - temporal */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-1 rounded opacity-50">
                  ID: {videoId}
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                  <div className="text-center">
                    <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm mb-3">No se pudo cargar el video</p>
                    <button
                      onClick={() => window.open(attachmentUrl, '_blank')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en YouTube
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4">
              <h4 className="font-medium text-white mb-1">
                {attachmentData?.title || 'Video de YouTube'}
              </h4>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Youtube className="w-4 h-4" />
                YouTube
              </p>
            </div>
          </div>
        );

      case 'link':
        if (!attachmentUrl) return null;
        return (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
               onClick={() => window.open(attachmentUrl, '_blank')}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Link className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white mb-1">
                  {attachmentData?.title || 'Enlace web'}
                </h4>
                <p className="text-sm text-slate-400 truncate">
                  {attachmentUrl}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        );

      case 'poll':
        return <InteractivePoll 
          attachmentData={attachmentData} 
          postId={postId} 
          communitySlug={communitySlug} 
        />;

      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mt-3 ${className}`}
      >
        {renderAttachment()}
      </motion.div>
      
      {/* Modal de imagen */}
      {attachmentType === 'image' && attachmentUrl && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={attachmentUrl}
          imageName={attachmentData?.name}
          imageData={attachmentData}
        />
      )}
    </>
  );
}

// Componente de encuesta interactiva
function InteractivePoll({ 
  attachmentData, 
  postId, 
  communitySlug 
}: { 
  attachmentData: any; 
  postId?: string; 
  communitySlug?: string; 
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [pollData, setPollData] = useState(attachmentData);
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Generar un ID único para esta encuesta
  const pollId = `poll-${postId || 'default'}-${Math.random().toString(36).substr(2, 9)}`;

  // Cargar voto del usuario al montar el componente
  useEffect(() => {
    if (postId && communitySlug) {
      loadUserVote();
    }
  }, [postId, communitySlug]);

  const loadUserVote = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/polls/${postId}/vote`);
      if (response.ok) {
        const data = await response.json();
        setUserVote(data.userVote);
        setSelectedOption(data.userVote);
      }
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !postId || !communitySlug || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/polls/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option: selectedOption,
          action: 'vote'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPollData(data.pollData);
        setUserVote(selectedOption);
        
        // Mostrar mensaje de éxito temporal
        setVoteSuccess(true);
        setTimeout(() => setVoteSuccess(false), 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al votar');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error al votar');
    } finally {
      setIsVoting(false);
    }
  };

  const calculatePercentage = (option: string) => {
    if (!pollData?.votes || !pollData.votes[option]) return 0;
    const totalVotes = Object.values(pollData.votes).reduce((total: number, votes: any) => {
      return total + (Array.isArray(votes) ? votes.length : 0);
    }, 0);
    
    if (totalVotes === 0) return 0;
    const optionVotes = Array.isArray(pollData.votes[option]) ? pollData.votes[option].length : 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getTotalVotes = () => {
    if (!pollData?.votes) return 0;
    return Object.values(pollData.votes).reduce((total: number, votes: any) => {
      return total + (Array.isArray(votes) ? votes.length : 0);
    }, 0);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-600/50 rounded-xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white text-lg">Encuesta</h4>
          <p className="text-xs text-slate-400">Participa en la votación</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg px-3 py-1">
          <span className="text-sm font-medium text-slate-300">
            {getTotalVotes()} {getTotalVotes() === 1 ? 'voto' : 'votos'}
          </span>
        </div>
      </div>
      <h5 className="text-white text-lg font-medium mb-4 leading-relaxed">{pollData?.question}</h5>
      <div className="space-y-3">
        {pollData?.options?.map((option: string, index: number) => {
          const percentage = calculatePercentage(option);
          const isSelected = selectedOption === option;
          const hasUserVoted = userVote === option;
          
          return (
            <motion.div 
              key={index} 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-400/50 shadow-lg shadow-orange-500/20' 
                    : 'bg-slate-700/30 border border-slate-600/30 hover:bg-slate-600/40 hover:border-slate-500/50'
                }`}
                onClick={() => setSelectedOption(option)}
              >
                {/* Radio button personalizado */}
                <div className="relative">
                  <input
                    type="radio"
                    name={pollId}
                    value={option}
                    id={`${pollId}-option-${index}`}
                    checked={isSelected}
                    onChange={() => setSelectedOption(option)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-orange-400 bg-orange-400' 
                      : 'border-slate-400 group-hover:border-slate-300'
                  }`}>
                    {isSelected && (
                      <motion.div 
                        className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Contenido de la opción */}
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={`${pollId}-option-${index}`}
                    className={`block text-sm font-medium cursor-pointer transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {option}
                  </label>
                  
                  {/* Barra de progreso mejorada */}
                  {getTotalVotes() > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">
                          {percentage}% • {Array.isArray(pollData.votes?.[option]) ? pollData.votes[option].length : 0} votos
                        </span>
                      </div>
                      <div className="h-2 bg-slate-600/50 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${
                            isSelected 
                              ? 'bg-gradient-to-r from-orange-400 to-amber-400' 
                              : 'bg-gradient-to-r from-slate-400 to-slate-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Indicador de porcentaje */}
                <div className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-orange-400/20 text-orange-300' 
                    : 'bg-slate-600/50 text-slate-400'
                }`}>
                  {percentage}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-between items-center">
        {/* Información adicional */}
        <div className="text-xs text-slate-500">
          {getTotalVotes() > 0 ? `${getTotalVotes()} personas han votado` : 'Sé el primero en votar'}
        </div>
        
        {/* Botón y mensaje de éxito */}
        <div className="flex items-center gap-3">
          {voteSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2 text-green-400 text-sm font-medium flex items-center gap-2"
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </motion.svg>
              ¡Voto registrado!
            </motion.div>
          )}
          
          <motion.button 
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
              voteSuccess 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25' 
                : isVoting 
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105'
            }`}
            whileHover={!isVoting && !voteSuccess ? { scale: 1.05 } : {}}
            whileTap={!isVoting && !voteSuccess ? { scale: 0.95 } : {}}
          >
            {isVoting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Votando...
              </div>
            ) : userVote ? (
              'Cambiar voto'
            ) : (
              'Votar'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


