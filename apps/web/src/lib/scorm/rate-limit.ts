import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto

// Limpiar entradas expiradas periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Cada minuto

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null;
  }

  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        }
      }
    );
  }

  record.count++;
  return null;
}

export function getRateLimitHeaders(req: NextRequest): Record<string, string> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const record = rateLimitMap.get(ip);

  if (!record) {
    return {
      'X-RateLimit-Limit': String(MAX_REQUESTS),
      'X-RateLimit-Remaining': String(MAX_REQUESTS),
    };
  }

  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(Math.max(0, MAX_REQUESTS - record.count)),
    'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
  };
}

// Rate limiter específico para uploads (más restrictivo)
const uploadRateLimitMap = new Map<string, RateLimitEntry>();
const UPLOAD_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_UPLOADS = 10; // 10 uploads por hora

export function rateLimitUpload(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const now = Date.now();

  const record = uploadRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    uploadRateLimitMap.set(ip, { count: 1, resetTime: now + UPLOAD_WINDOW_MS });
    return null;
  }

  if (record.count >= MAX_UPLOADS) {
    return NextResponse.json(
      { error: 'Upload limit reached. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
        }
      }
    );
  }

  record.count++;
  return null;
}
