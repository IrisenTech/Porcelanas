/**
 * imageUtils.ts
 * Canvas-based image processing: WebP conversion, thumbnail compression.
 */

/**
 * Convert any image File to a WebP blob, resizing if wider than maxWidth.
 * Returns a Blob and a local object URL.
 */
export async function toWebP(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const srcUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(srcUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const dataUrl = URL.createObjectURL(blob);
          resolve({ blob, dataUrl });
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(srcUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = srcUrl;
  });
}

/**
 * Create a compressed data URL from an existing image src (dataUrl or object URL).
 * Used for embedding thumbnails in PDF (smaller size).
 */
export async function canvasCompress(
  src: string,
  width = 200,
  quality = 0.6,
  rotation = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = width / img.width;
      const w = width;
      const h = Math.round(img.height * scale);

      // Normalize rotation to 0/90/180/270; swap canvas dims for quarter turns.
      const rot = (((rotation % 360) + 360) % 360);
      const swap = rot === 90 || rot === 270;

      const canvas = document.createElement('canvas');
      canvas.width = swap ? h : w;
      canvas.height = swap ? w : h;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

/**
 * Read a File as a data URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
