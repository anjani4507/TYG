/**
 * Canvas Gesture Store
 * 
 * Zustand store for managing canvas zoom and pan state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GestureState {
  // Zoom state
  scale: number;
  minScale: number;
  maxScale: number;
  
  // Pan state
  offsetX: number;
  offsetY: number;
  
  // Gesture tracking
  isGestureActive: boolean;
  lastGestureTime: number;
  
  // Actions
  setScale: (scale: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  setPan: (deltaX: number, deltaY: number) => void;
  resetView: () => void;
  
  // Gesture lifecycle
  startGesture: () => void;
  endGesture: () => void;
  
  // Zoom helpers
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (contentWidth: number, contentHeight: number, viewportWidth: number, viewportHeight: number) => void;
  
  // State queries
  getTransformMatrix: () => {
    scale: number;
    translateX: number;
    translateY: number;
  };
  
  // Reset
  reset: () => void;
}

const DEFAULT_MIN_SCALE = 0.5;
const DEFAULT_MAX_SCALE = 5;
const DEFAULT_ZOOM_STEP = 0.2;

export const useCanvasGestureStore = create<GestureState>()(
  subscribeWithSelector((set, get) => ({
    scale: 1,
    minScale: DEFAULT_MIN_SCALE,
    maxScale: DEFAULT_MAX_SCALE,
    offsetX: 0,
    offsetY: 0,
    isGestureActive: false,
    lastGestureTime: 0,

    // Set scale
    setScale: (scale) => {
      set((state) => ({
        scale: Math.max(state.minScale, Math.min(state.maxScale, scale)),
        lastGestureTime: Date.now(),
      }));
    },

    // Set offset
    setOffset: (offsetX, offsetY) => {
      set({
        offsetX,
        offsetY,
        lastGestureTime: Date.now(),
      });
    },

    // Pan by delta
    setPan: (deltaX, deltaY) => {
      set((state) => ({
        offsetX: state.offsetX + deltaX,
        offsetY: state.offsetY + deltaY,
        lastGestureTime: Date.now(),
      }));
    },

    // Reset view to original
    resetView: () => {
      set({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        lastGestureTime: Date.now(),
      });
    },

    // Start gesture
    startGesture: () => {
      set({
        isGestureActive: true,
        lastGestureTime: Date.now(),
      });
    },

    // End gesture
    endGesture: () => {
      set({
        isGestureActive: false,
        lastGestureTime: Date.now(),
      });
    },

    // Zoom in
    zoomIn: () => {
      set((state) => ({
        scale: Math.min(
          state.maxScale,
          state.scale + DEFAULT_ZOOM_STEP
        ),
        lastGestureTime: Date.now(),
      }));
    },

    // Zoom out
    zoomOut: () => {
      set((state) => ({
        scale: Math.max(
          state.minScale,
          state.scale - DEFAULT_ZOOM_STEP
        ),
        lastGestureTime: Date.now(),
      }));
    },

    // Zoom to fit
    zoomToFit: (contentWidth, contentHeight, viewportWidth, viewportHeight) => {
      const scaleX = viewportWidth / contentWidth;
      const scaleY = viewportHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      set({
        scale: Math.max(DEFAULT_MIN_SCALE, Math.min(DEFAULT_MAX_SCALE, scale)),
        offsetX: (viewportWidth - contentWidth * scale) / 2,
        offsetY: (viewportHeight - contentHeight * scale) / 2,
        lastGestureTime: Date.now(),
      });
    },

    // Get transform matrix
    getTransformMatrix: () => {
      const state = get();
      return {
        scale: state.scale,
        translateX: state.offsetX,
        translateY: state.offsetY,
      };
    },

    // Reset
    reset: () => {
      set({
        scale: 1,
        minScale: DEFAULT_MIN_SCALE,
        maxScale: DEFAULT_MAX_SCALE,
        offsetX: 0,
        offsetY: 0,
        isGestureActive: false,
        lastGestureTime: 0,
      });
    },
  }))
);

/**
 * Hook to get gesture state
 */
export function useCanvasGestures() {
  return useCanvasGestureStore();
}

/**
 * Hook to get only transform matrix
 */
export function useCanvasTransform() {
  return useCanvasGestureStore((state) => state.getTransformMatrix());
}
