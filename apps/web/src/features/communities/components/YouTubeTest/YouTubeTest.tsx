'use client';

import { useState } from 'react';
import { supabaseStorageService } from '../../../../core/services/supabaseStorage';

export function YouTubeTest() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testYouTubeUrl = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      console.log('🧪 [TEST] Probando URL:', url);
      
      const videoId = supabaseStorageService.extractYouTubeVideoId(url);
      console.log('🧪 [TEST] Video ID extraído:', videoId);
      
      if (videoId) {
        try {
          const videoInfo = await supabaseStorageService.getYouTubeVideoInfo(videoId);
          console.log('🧪 [TEST] Información del video:', videoInfo);
          
          setResult({
            videoId,
            videoInfo,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            success: true
          });
        } catch (error) {
          console.warn('🧪 [TEST] Error obteniendo info del video:', error);
          setResult({
            videoId,
            videoInfo: null,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      } else {
        setResult({
          videoId: null,
          videoInfo: null,
          embedUrl: null,
          success: false,
          error: 'No se pudo extraer videoId de la URL'
        });
      }
    } catch (error) {
      console.error('🧪 [TEST] Error general:', error);
      setResult({
        videoId: null,
        videoInfo: null,
        embedUrl: null,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-white text-lg font-semibold mb-4">🧪 Test de YouTube</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            URL de YouTube:
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        <button
          onClick={testYouTubeUrl}
          disabled={!url || loading}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          {loading ? 'Probando...' : 'Probar URL'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-slate-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Resultado:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Video ID:</span>
                <span className="text-white ml-2">{result.videoId || 'No encontrado'}</span>
              </div>
              <div>
                <span className="text-slate-400">Embed URL:</span>
                <span className="text-white ml-2">{result.embedUrl || 'No disponible'}</span>
              </div>
              {result.videoInfo && (
                <div>
                  <span className="text-slate-400">Título:</span>
                  <span className="text-white ml-2">{result.videoInfo.title}</span>
                </div>
              )}
              {result.error && (
                <div>
                  <span className="text-red-400">Error:</span>
                  <span className="text-red-300 ml-2">{result.error}</span>
                </div>
              )}
            </div>
            
            {result.embedUrl && (
              <div className="mt-4">
                <h5 className="text-white font-medium mb-2">Preview del iframe:</h5>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={result.embedUrl}
                    title="Test YouTube Video"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
