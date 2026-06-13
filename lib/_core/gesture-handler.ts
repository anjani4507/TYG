/**
 * Gesture Handler Service
 * 
 * Handles pinch-to-zoom and two-finger pan gestures for canvas
 */

import { GestureResponderEvent, PanResponder, PanResponderGestureState } from 'react-native';
import { useCanvasGestureStore } from '@/lib/stores/canvas-gesture-store';

export interface GestureConfig {
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  panEnabled?: boolean;
  zoomEnabled?: boolean;
}

export class CanvasGestureHandler {
  private static instance: CanvasGestureHandler;
  private panResponder: any;
  private lastDistance: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;
  private config: Required<GestureConfig>;

  private constructor(config: GestureConfig = {}) {
    this.config = {
      minScale: config.minScale ?? 0.5,
      maxScale: config.maxScale ?? 5,
      zoomStep: config.zoomStep ?? 0.2,
      panEnabled: config.panEnabled ?? true,
      zoomEnabled: config.zoomEnabled ?? true,
    };

    this.initializePanResponder();
  }

  static getInstance(config?: GestureConfig): CanvasGestureHandler {
    if (!CanvasGestureHandler.instance) {
      CanvasGestureHandler.instance = new CanvasGestureHandler(config);
    }
    return CanvasGestureHandler.instance;
  }

  /**
   * Initialize pan responder for gesture handling
   */
  private initializePanResponder(): void {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        this.handleGestureStart(evt);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        this.handleGestureMove(evt, gestureState);
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        this.handleGestureEnd(evt, gestureState);
      },
      onPanResponderTerminate: () => {
        this.handleGestureEnd(undefined, {} as PanResponderGestureState);
      },
    });
  }

  /**
   * Handle gesture start
   */
  private handleGestureStart(evt: GestureResponderEvent): void {
    const store = useCanvasGestureStore.getState();
    store.startGesture();

    if (evt.nativeEvent.touches.length === 2) {
      // Two-finger gesture
      this.lastDistance = this.calculateDistance(evt.nativeEvent.touches);
    } else if (evt.nativeEvent.touches.length === 1) {
      // Single finger - prepare for pan
      const touch = evt.nativeEvent.touches[0];
      this.lastX = touch.pageX;
      this.lastY = touch.pageY;
    }
  }

  /**
   * Handle gesture move
   */
  private handleGestureMove(
    evt: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ): void {
    const store = useCanvasGestureStore.getState();

    if (evt.nativeEvent.touches.length === 2) {
      // Pinch-to-zoom
      if (this.config.zoomEnabled) {
        this.handlePinchZoom(evt);
      }
    } else if (evt.nativeEvent.touches.length === 1) {
      // Pan
      if (this.config.panEnabled) {
        this.handlePan(gestureState);
      }
    }
  }

  /**
   * Handle gesture end
   */
  private handleGestureEnd(
    evt: GestureResponderEvent | undefined,
    gestureState: PanResponderGestureState
  ): void {
    const store = useCanvasGestureStore.getState();
    store.endGesture();

    this.lastDistance = 0;
    this.lastX = 0;
    this.lastY = 0;
  }

  /**
   * Handle pinch-to-zoom gesture
   */
  private handlePinchZoom(evt: GestureResponderEvent): void {
    const store = useCanvasGestureStore.getState();
    const currentDistance = this.calculateDistance(evt.nativeEvent.touches);

    if (this.lastDistance > 0) {
      const scale = currentDistance / this.lastDistance;
      const newScale = store.scale * scale;

      store.setScale(newScale);
    }

    this.lastDistance = currentDistance;
  }

  /**
   * Handle pan gesture
   */
  private handlePan(gestureState: PanResponderGestureState): void {
    const store = useCanvasGestureStore.getState();

    const deltaX = gestureState.dx;
    const deltaY = gestureState.dy;

    store.setPan(deltaX, deltaY);
  }

  /**
   * Calculate distance between two touches
   */
  private calculateDistance(touches: any[]): number {
    if (touches.length < 2) return 0;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch2.pageX - touch1.pageX;
    const dy = touch2.pageY - touch1.pageY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get pan responder handlers
   */
  getPanResponderHandlers() {
    return this.panResponder.panHandlers;
  }

  /**
   * Handle double tap to zoom
   */
  handleDoubleTap(tapX: number, tapY: number): void {
    const store = useCanvasGestureStore.getState();
    const currentScale = store.scale;

    if (currentScale < 2) {
      // Zoom in to 2x
      store.setScale(2);
    } else {
      // Reset zoom
      store.resetView();
    }
  }

  /**
   * Handle mouse wheel zoom (for web)
   */
  handleMouseWheel(event: WheelEvent, canvasX: number, canvasY: number): void {
    event.preventDefault();

    const store = useCanvasGestureStore.getState();
    const delta = event.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + delta * this.config.zoomStep;

    const newScale = store.scale * zoomFactor;
    store.setScale(newScale);
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<GestureConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Reset gesture state
   */
  reset(): void {
    const store = useCanvasGestureStore.getState();
    store.reset();
    this.lastDistance = 0;
    this.lastX = 0;
    this.lastY = 0;
  }
}

// Global instance
let globalGestureHandler: CanvasGestureHandler | null = null;

export function getGlobalGestureHandler(config?: GestureConfig): CanvasGestureHandler {
  if (!globalGestureHandler) {
    globalGestureHandler = CanvasGestureHandler.getInstance(config);
  }
  return globalGestureHandler;
}

export function initializeGestureHandler(config?: GestureConfig): CanvasGestureHandler {
  if (!globalGestureHandler) {
    globalGestureHandler = CanvasGestureHandler.getInstance(config);
  }
  return globalGestureHandler;
}
