import axios from 'axios';

export async function downloadFileContentSafe(
  src: string,
  maxBytes = 50 * 1024 * 1024,
): Promise<{ fileBuffer: Buffer; mimeType: string }> {
  const res = await axios.get(src, {
    responseType: 'stream',
    timeout: 15000,
    maxRedirects: 3,
  });

  let loaded = 0;
  const chunks: Buffer[] = [];

  return new Promise<{ fileBuffer: Buffer; mimeType: string }>(
    (resolve, reject) => {
      res.data.on('data', (chunk: Buffer) => {
        loaded += chunk.length;
        if (loaded > maxBytes) {
          res.data.destroy();
          return reject(new Error('File very grande'));
        }
        chunks.push(chunk);
      });

      res.data.on('end', () => {
        resolve({
          fileBuffer: Buffer.concat(chunks),
          mimeType: res.headers['content-type'] || 'application/octet-stream',
        });
      });

      res.data.on('error', reject);
    },
  );
}

export function isBase64Content(src: string): boolean {
  if (src.startsWith('data:')) {
    return /^data:[\w/+.-]+;base64,/.test(src);
  }

  if (src.length < 32) return false;
  if (/[^A-Za-z0-9+/=]/.test(src)) return false;

  try {
    Buffer.from(src, 'base64');
    return true;
  } catch {
    return false;
  }
}

export function processBase64Content(src: string): {
  fileBuffer: Buffer;
  mimeType: string;
} {
  let base64Data = src;
  let mimeType = 'image/jpeg';

  if (base64Data.startsWith('data:image')) {
    const parts = base64Data.split(',');
    mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    base64Data = parts[1];
  }

  const fileBuffer = Buffer.from(base64Data, 'base64');
  return { fileBuffer, mimeType };
}

export function extractMimeTypeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    if (pathname.includes('.jpg') || pathname.includes('.jpeg'))
      return 'image/jpeg';
    if (pathname.includes('.png')) return 'image/png';
    if (pathname.includes('.webp')) return 'image/webp';
    if (pathname.includes('.pdf')) return 'application/pdf';
    if (pathname.includes('.mp4')) return 'video/mp4';
    if (pathname.includes('.mp3')) return 'audio/mpeg';

    return null;
  } catch {
    return null;
  }
}

export async function generateContentHash(src: string): Promise<string> {
  const crypto = require('crypto');

  if (isBase64Content(src)) {
    const base64Data = src.startsWith('data:') ? src.split(',')[1] : src;
    return crypto.createHash('sha256').update(base64Data).digest('hex');
  } else {
    return crypto.createHash('sha256').update(src).digest('hex');
  }
}
