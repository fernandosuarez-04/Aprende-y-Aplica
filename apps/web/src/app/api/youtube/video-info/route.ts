import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener la API key desde las variables de entorno del servidor
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (!apiKey) {
      // Si no hay API key, devolver información básica usando el videoId
      return NextResponse.json({
        title: 'Video de YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      });
    }

    // Hacer la llamada a la API de YouTube desde el servidor
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
    );

    if (!response.ok) {
      // Si falla, devolver información básica
      return NextResponse.json({
        title: 'Video de YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      });
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return NextResponse.json({
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.maxres?.url || 
                   video.snippet.thumbnails.high?.url || 
                   `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      });
    }

    // Si no se encuentra el video, devolver información básica
    return NextResponse.json({
      title: 'Video de YouTube',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    });
  } catch (error) {
    // En caso de error, devolver información básica
    const videoId = request.nextUrl.searchParams.get('videoId');
    return NextResponse.json({
      title: 'Video de YouTube',
      thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
    });
  }
}

