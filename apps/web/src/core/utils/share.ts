/**
 * Utilidades para compartir contenido
 */

import { getBaseUrl } from '../../lib/env';

export interface ShareContent {
  url: string;
  title?: string;
  text?: string;
  description?: string;
}

/**
 * Genera una URL de compartir basada en el tipo de contenido
 */
export function generateShareUrl(type: 'reel' | 'post' | 'article' | 'community', id: string, slug?: string): string {
  const origin = typeof window !== 'undefined' ? getBaseUrl() : '';
  
  switch (type) {
    case 'reel':
      return `${origin}/reels?reel=${id}`;
    case 'post':
      return slug ? `${origin}/communities/${slug}#post-${id}` : `${origin}/communities#post-${id}`;
    case 'article':
      return slug ? `${origin}/news/${slug}` : `${origin}/news/${id}`;
    case 'community':
      return `${origin}/communities/${slug || id}`;
    default:
      return `${origin}`;
  }
}

/**
 * Prepara datos de compartir para el modal
 */
export function prepareShareData(
  type: 'reel' | 'post' | 'article' | 'community',
  id: string,
  title: string,
  description?: string,
  slug?: string
): ShareContent {
  return {
    url: generateShareUrl(type, id, slug),
    title,
    text: description || title,
    description,
  };
}

