/**
 * Image Compression Service
 *
 * Compresses images to a target size using sharp library.
 * Supports WebP and JPEG formats with quality adjustment.
 */

import sharp from 'sharp';

export interface CompressionOptions {
  maxSizeKB?: number;       // Target max size in KB (default: 400)
  maxWidth?: number;        // Max width in pixels (default: 1200)
  format?: 'webp' | 'jpeg'; // Output format (default: 'webp')
  initialQuality?: number;  // Starting quality 1-100 (default: 85)
  minQuality?: number;      // Minimum quality to try (default: 30)
}

export interface CompressionResult {
  buffer: Buffer;
  format: 'webp' | 'jpeg';
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  quality: number;
}

/**
 * Compress an image buffer to meet target size requirements.
 * Uses progressive quality reduction until target size is achieved.
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeKB = 400,
    maxWidth = 1200,
    format = 'webp',
    initialQuality = 85,
    minQuality = 30,
  } = options;

  const maxSizeBytes = maxSizeKB * 1024;
  const originalSize = inputBuffer.length;

  console.log(`[ImageCompression] Starting compression: ${(originalSize / 1024).toFixed(1)}KB, target: ${maxSizeKB}KB`);

  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const needsResize = metadata.width && metadata.width > maxWidth;

  if (needsResize) {
    console.log(`[ImageCompression] Resizing from ${metadata.width}px to ${maxWidth}px`);
  }

  // Create base processor with optional resize
  let baseProcessor = sharp(inputBuffer);

  if (needsResize) {
    baseProcessor = baseProcessor.resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  // Try compression with decreasing quality until target size is met
  let quality = initialQuality;
  let compressedBuffer: Buffer = inputBuffer;
  let finalQuality = initialQuality;

  while (quality >= minQuality) {
    // Clone the processor for each attempt
    const processor = baseProcessor.clone();

    if (format === 'webp') {
      compressedBuffer = await processor.webp({ quality }).toBuffer();
    } else {
      compressedBuffer = await processor.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    finalQuality = quality;

    // Check if we hit the target
    if (compressedBuffer.length <= maxSizeBytes) {
      console.log(`[ImageCompression] Target reached at quality ${quality}: ${(compressedBuffer.length / 1024).toFixed(1)}KB`);
      break;
    }

    // Reduce quality for next iteration
    quality -= 5;
  }

  // Get final metadata
  const finalMetadata = await sharp(compressedBuffer).metadata();

  const result: CompressionResult = {
    buffer: compressedBuffer,
    format,
    originalSize,
    compressedSize: compressedBuffer.length,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    quality: finalQuality,
  };

  console.log(`[ImageCompression] Complete: ${(originalSize / 1024).toFixed(1)}KB -> ${(result.compressedSize / 1024).toFixed(1)}KB (${((1 - result.compressedSize / originalSize) * 100).toFixed(0)}% reduction, quality: ${finalQuality})`);

  return result;
}

/**
 * Get the content type for a given format.
 */
export function getContentType(format: 'webp' | 'jpeg'): string {
  return format === 'webp' ? 'image/webp' : 'image/jpeg';
}

/**
 * Get the file extension for a given format.
 */
export function getFileExtension(format: 'webp' | 'jpeg'): string {
  return format === 'webp' ? '.webp' : '.jpg';
}
