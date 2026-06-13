/**
 * Snapshot Compositor
 * 
 * Composite all visible layers into a single high-resolution PNG
 */

import { useCanvasLayersStore } from '@/lib/stores/canvas-layers-store';

export interface SnapshotOptions {
  width?: number;
  height?: number;
  quality?: number;
  includeBackground?: boolean;
}

export class SnapshotCompositor {
  private static instance: SnapshotCompositor;

  private constructor() {}

  static getInstance(): SnapshotCompositor {
    if (!SnapshotCompositor.instance) {
      SnapshotCompositor.instance = new SnapshotCompositor();
    }
    return SnapshotCompositor.instance;
  }

  /**
   * Composite all visible layers into PNG
   */
  async compositeSnapshot(options: SnapshotOptions = {}): Promise<string> {
    const {
      width = 1080,
      height = 1920,
      quality = 0.9,
      includeBackground = true,
    } = options;

    const store = useCanvasLayersStore.getState();
    const layers = store.getVisibleLayers();

    // Filter layers based on options
    const layersToComposite = includeBackground
      ? layers
      : layers.filter((l) => !l.isBackgroundLayer);

    if (layersToComposite.length === 0) {
      return this.createBlankImage(width, height);
    }

    // Create canvas context (simulated - in real implementation, use Skia)
    const compositeData = this.compileLayerData(layersToComposite, width, height);

    // Convert to PNG (simulated - in real implementation, use image library)
    return this.encodeToBase64PNG(compositeData, width, height, quality);
  }

  /**
   * Compile layer data for compositing
   */
  private compileLayerData(
    layers: Array<any>,
    width: number,
    height: number
  ): Uint8ClampedArray {
    // Create image data buffer
    const imageData = new Uint8ClampedArray(width * height * 4);

    // Fill with white background
    for (let i = 0; i < imageData.length; i += 4) {
      imageData[i] = 255; // R
      imageData[i + 1] = 255; // G
      imageData[i + 2] = 255; // B
      imageData[i + 3] = 255; // A
    }

    // Composite each layer
    for (const layer of layers) {
      if (!layer.visible) continue;

      for (const path of layer.paths) {
        this.drawPathToImageData(
          imageData,
          width,
          height,
          path,
          layer.opacity,
          layer.compositingMode
        );
      }
    }

    return imageData;
  }

  /**
   * Draw path to image data
   */
  private drawPathToImageData(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    path: any,
    opacity: number,
    compositingMode: string
  ): void {
    // Parse color
    const [r, g, b] = this.parseColor(path.color);

    // Draw each point in the path
    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i];
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const pixelIndex = (y * width + x) * 4;

        // Apply stroke width (simple circle)
        const radius = Math.ceil(path.strokeWidth / 2);
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const px = x + dx;
            const py = y + dy;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const pIndex = (py * width + px) * 4;
              this.blendPixel(
                imageData,
                pIndex,
                r,
                g,
                b,
                opacity * path.opacity,
                compositingMode
              );
            }
          }
        }
      }
    }
  }

  /**
   * Blend pixel using compositing mode
   */
  private blendPixel(
    imageData: Uint8ClampedArray,
    pixelIndex: number,
    r: number,
    g: number,
    b: number,
    alpha: number,
    compositingMode: string
  ): void {
    const currentR = imageData[pixelIndex];
    const currentG = imageData[pixelIndex + 1];
    const currentB = imageData[pixelIndex + 2];
    const currentA = imageData[pixelIndex + 3];

    let newR = r;
    let newG = g;
    let newB = b;

    switch (compositingMode) {
      case 'multiply':
        newR = Math.floor((r * currentR) / 255);
        newG = Math.floor((g * currentG) / 255);
        newB = Math.floor((b * currentB) / 255);
        break;

      case 'screen':
        newR = Math.floor(255 - ((255 - r) * (255 - currentR)) / 255);
        newG = Math.floor(255 - ((255 - g) * (255 - currentG)) / 255);
        newB = Math.floor(255 - ((255 - b) * (255 - currentB)) / 255);
        break;

      case 'overlay':
        newR =
          currentR < 128
            ? Math.floor((2 * r * currentR) / 255)
            : Math.floor(255 - (2 * (255 - r) * (255 - currentR)) / 255);
        newG =
          currentG < 128
            ? Math.floor((2 * g * currentG) / 255)
            : Math.floor(255 - (2 * (255 - g) * (255 - currentG)) / 255);
        newB =
          currentB < 128
            ? Math.floor((2 * b * currentB) / 255)
            : Math.floor(255 - (2 * (255 - b) * (255 - currentB)) / 255);
        break;

      case 'normal':
      default:
        // Normal alpha blending
        newR = Math.floor(r * alpha + currentR * (1 - alpha));
        newG = Math.floor(g * alpha + currentG * (1 - alpha));
        newB = Math.floor(b * alpha + currentB * (1 - alpha));
        break;
    }

    imageData[pixelIndex] = newR;
    imageData[pixelIndex + 1] = newG;
    imageData[pixelIndex + 2] = newB;
    imageData[pixelIndex + 3] = Math.floor(
      currentA * (1 - alpha) + 255 * alpha
    );
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(colorString: string): [number, number, number] {
    // Handle hex colors
    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }

    // Handle rgb colors
    if (colorString.startsWith('rgb')) {
      const match = colorString.match(/\d+/g);
      if (match) {
        return [
          parseInt(match[0]),
          parseInt(match[1]),
          parseInt(match[2]),
        ];
      }
    }

    // Default to black
    return [0, 0, 0];
  }

  /**
   * Create blank image
   */
  private createBlankImage(width: number, height: number): string {
    const imageData = new Uint8ClampedArray(width * height * 4);

    // Fill with white
    for (let i = 0; i < imageData.length; i += 4) {
      imageData[i] = 255;
      imageData[i + 1] = 255;
      imageData[i + 2] = 255;
      imageData[i + 3] = 255;
    }

    return this.encodeToBase64PNG(imageData, width, height, 0.9);
  }

  /**
   * Encode image data to base64 PNG
   */
  private encodeToBase64PNG(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    quality: number
  ): string {
    // Simulated PNG encoding - in real implementation, use proper PNG library
    const header = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    // For now, return a placeholder
    // In production, use canvas or image library to encode properly
    return header;
  }

  /**
   * Export snapshot with metadata
   */
  async exportSnapshotWithMetadata(
    sessionId: string,
    subject: string,
    options: SnapshotOptions = {}
  ): Promise<{
    imageBase64: string;
    metadata: {
      sessionId: string;
      subject: string;
      layerCount: number;
      timestamp: number;
      dimensions: { width: number; height: number };
    };
  }> {
    const imageBase64 = await this.compositeSnapshot(options);
    const store = useCanvasLayersStore.getState();
    const visibleLayers = store.getVisibleLayers();

    return {
      imageBase64,
      metadata: {
        sessionId,
        subject,
        layerCount: visibleLayers.length,
        timestamp: Date.now(),
        dimensions: {
          width: options.width || 1080,
          height: options.height || 1920,
        },
      },
    };
  }
}

// Global instance
let globalSnapshotCompositor: SnapshotCompositor | null = null;

export function getGlobalSnapshotCompositor(): SnapshotCompositor {
  if (!globalSnapshotCompositor) {
    globalSnapshotCompositor = SnapshotCompositor.getInstance();
  }
  return globalSnapshotCompositor;
}
