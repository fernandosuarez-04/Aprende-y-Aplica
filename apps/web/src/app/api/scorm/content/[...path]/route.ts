import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

// Content-type mapping for SCORM resources
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    json: 'application/json; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    swf: 'application/x-shockwave-flash',
  };
  return types[ext || ''] || 'application/octet-stream';
}

// Check if the file type requires text processing
function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['html', 'htm', 'js', 'css', 'json', 'xml', 'svg'].includes(ext || '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Verify user authentication
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path } = await params;

    if (!path || path.length < 3) {
      return NextResponse.json(
        { error: 'Invalid path. Expected: /api/scorm/content/[orgId]/[packageId]/[...filePath]' },
        { status: 400 }
      );
    }

    // Path format: [orgId, packageId, ...filePath]
    const [orgId, packageId, ...filePath] = path;
    const fullFilePath = filePath.join('/');
    const storagePath = `${orgId}/${packageId}/${fullFilePath}`;

    const supabase = await createClient();

    // Verify user has access to this package
    const { data: packageData, error: packageError } = await supabase
      .from('scorm_packages')
      .select('id, organization_id')
      .eq('id', packageId)
      .eq('organization_id', orgId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('scorm-packages')
      .download(storagePath);

    if (error || !data) {
      console.error('Storage download error:', error);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const contentType = getContentType(fullFilePath);

    // Build response headers - permissive CSP for SCORM content
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });

    // For HTML files, rewrite relative URLs and set permissive CSP
    if (fullFilePath.endsWith('.html') || fullFilePath.endsWith('.htm')) {
      let htmlContent = await data.text();
      
      // Extract base directory for relative URLs
      const pathParts = fullFilePath.split('/');
      pathParts.pop();
      const baseDir = pathParts.length > 0 ? pathParts.join('/') : '';
      const baseDirPath = baseDir ? `${baseDir}/` : '';
      
      // Prevent content from trying to load main page in iframes
      htmlContent = htmlContent.replace(
        /(src|href|action)=["'](\/|http:\/\/localhost:3000\/|https?:\/\/[^\/]+:\d+\/)[^"']*["']/gi,
        (match, attr, url) => {
          if (url === '/' || url.match(/^https?:\/\/[^\/]+:\d+\/?$/)) {
            return `${attr}="#"`;
          }
          return match;
        }
      );
      
      // Rewrite relative URLs to use the proxy
      htmlContent = htmlContent.replace(
        /(src|href)=["']([^"']+)["']/gi,
        (match, attr, url) => {
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match;
          }
          const relativePath = url.startsWith('/') ? url.substring(1) : url;
          const resourcePath = baseDirPath ? `${baseDirPath}${relativePath}` : relativePath;
          return `${attr}="${req.nextUrl.origin}/api/scorm/content/${orgId}/${packageId}/${resourcePath}"`;
        }
      );
      
      // Rewrite CSS URLs
      htmlContent = htmlContent.replace(
        /url\(["']?([^"')]+)["']?\)/gi,
        (match, url) => {
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
            return match;
          }
          const resourcePath = baseDirPath ? `${baseDirPath}${url}` : url;
          return `url("${req.nextUrl.origin}/api/scorm/content/${orgId}/${packageId}/${resourcePath}")`;
        }
      );
      
      // Allow scripts, styles, images, fonts, and connections needed for SCORM
      headers.set(
        'Content-Security-Policy',
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "style-src 'self' 'unsafe-inline' data:; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "media-src 'self' data: blob: https:; " +
        "frame-ancestors 'self';"
      );
      headers.set('X-Frame-Options', 'SAMEORIGIN');
      
      return new NextResponse(htmlContent, { headers });
    }

    // Set frame options for all files
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self';"
    );
    
    // Return appropriate response based on file type
    if (isTextFile(fullFilePath) && !fullFilePath.endsWith('.html') && !fullFilePath.endsWith('.htm')) {
      const text = await data.text();
      return new NextResponse(text, { headers });
    } else {
      const arrayBuffer = await data.arrayBuffer();
      return new NextResponse(arrayBuffer, { headers });
    }
  } catch (error) {
    console.error('SCORM content proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    );
  }
}
