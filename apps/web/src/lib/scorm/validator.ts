import JSZip from 'jszip';

const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.asp',
  '.jsp',
  '.cgi',
  '.pl',
  '.py',
  '.rb',
];
const MAX_FILES = 5000;
const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function validatePackageSecurity(zip: JSZip): Promise<{
  valid: boolean;
  error?: string;
}> {
  const files = Object.keys(zip.files);

  // Límite de archivos
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Too many files (max ${MAX_FILES})` };
  }

  for (const filename of files) {
    const entry = zip.files[filename];
    if (entry.dir) continue;

    // Path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return { valid: false, error: `Invalid path: ${filename}` };
    }

    // Extensiones peligrosas
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Forbidden file type: ${ext}` };
    }

    // Tamaño individual
    const content = await entry.async('arraybuffer');
    if (content.byteLength > MAX_SINGLE_FILE_SIZE) {
      return { valid: false, error: `File too large: ${filename}` };
    }

    // Escanear HTML/JS por patrones sospechosos
    if (filename.endsWith('.html') || filename.endsWith('.htm') || filename.endsWith('.js')) {
      const text = await entry.async('string');
      const suspicious = scanForSuspiciousContent(text);
      if (suspicious) {
        return {
          valid: false,
          error: `Suspicious content in ${filename}: ${suspicious}`,
        };
      }
    }
  }

  return { valid: true };
}

function scanForSuspiciousContent(content: string): string | null {
  const patterns = [
    { regex: /eval\s*\(/gi, name: 'eval()' },
    { regex: /document\.cookie/gi, name: 'cookie access' },
    { regex: /new\s+WebSocket/gi, name: 'WebSocket' },
    { regex: /window\.location\s*=\s*[^;]*(?:http|\/\/)/gi, name: 'redirect' },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(content)) {
      // Reset regex lastIndex for global patterns
      regex.lastIndex = 0;
      return name;
    }
  }

  return null;
}

export function validateManifestExists(zip: JSZip): boolean {
  return zip.file('imsmanifest.xml') !== null;
}

export async function getPackageSize(zip: JSZip): Promise<number> {
  let totalSize = 0;
  const files = Object.keys(zip.files);

  for (const filename of files) {
    const file = zip.files[filename];
    if (!file.dir) {
      try {
        const content = await file.async('arraybuffer');
        totalSize += content.byteLength;
      } catch {
        // Ignorar archivos que no se pueden leer
      }
    }
  }

  return totalSize;
}
