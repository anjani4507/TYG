/**
 * Canvas Layers Store
 * 
 * Zustand store for multi-layer canvas state management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type CompositingMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export interface PathData {
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  opacity: number;
  tool: 'pencil' | 'eraser' | 'highlighter' | 'line' | 'rectangle' | 'circle';
}

export interface CanvasLayer {
  id: string;
  name: string;
  paths: PathData[];
  opacity: number;
  visible: boolean;
  locked: boolean;
  compositingMode: CompositingMode;
  isBackgroundLayer: boolean;
  backgroundType?: 'grid' | 'lines' | 'ruler' | 'none';
  metadata: {
    subject?: string;
    createdAt: number;
    updatedAt: number;
    order: number;
  };
}

export interface CanvasLayersState {
  // Layer management
  layers: CanvasLayer[];
  activeLayerId: string | null;
  
  // Actions
  createLayer: (name: string, isBackground?: boolean, backgroundType?: string) => void;
  deleteLayer: (layerId: string) => void;
  selectLayer: (layerId: string) => void;
  renameLayer: (layerId: string, newName: string) => void;
  reorderLayers: (layerId: string, newIndex: number) => void;
  
  // Layer properties
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerLocked: (layerId: string, locked: boolean) => void;
  setLayerCompositingMode: (layerId: string, mode: CompositingMode) => void;
  setLayerMetadata: (layerId: string, metadata: Partial<CanvasLayer['metadata']>) => void;
  
  // Drawing operations
  addPathToLayer: (layerId: string, path: PathData) => void;
  clearLayer: (layerId: string) => void;
  clearAllLayers: () => void;
  
  // Layer queries
  getActiveLayer: () => CanvasLayer | null;
  getVisibleLayers: () => CanvasLayer[];
  getBackgroundLayers: () => CanvasLayer[];
  getLayerById: (layerId: string) => CanvasLayer | null;
  
  // State management
  saveLayerState: () => string; // Returns serialized state
  restoreLayerState: (state: string) => void;
  resetLayers: () => void;
}

const createDefaultLayers = (): CanvasLayer[] => [
  {
    id: 'bg-grid',
    name: 'Grid Background',
    paths: [],
    opacity: 1,
    visible: false,
    locked: true,
    compositingMode: 'normal',
    isBackgroundLayer: true,
    backgroundType: 'grid',
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
    },
  },
  {
    id: 'bg-lines',
    name: 'Lines Background',
    paths: [],
    opacity: 1,
    visible: false,
    locked: true,
    compositingMode: 'normal',
    isBackgroundLayer: true,
    backgroundType: 'lines',
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 1,
    },
  },
  {
    id: 'layer-1',
    name: 'Layer 1',
    paths: [],
    opacity: 1,
    visible: true,
    locked: false,
    compositingMode: 'normal',
    isBackgroundLayer: false,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 2,
    },
  },
];

export const useCanvasLayersStore = create<CanvasLayersState>()(
  subscribeWithSelector((set, get) => ({
    layers: createDefaultLayers(),
    activeLayerId: 'layer-1',

    // Create new layer
    createLayer: (name, isBackground = false, backgroundType = 'none') => {
      set((state) => {
        const newLayer: CanvasLayer = {
          id: `layer-${Date.now()}`,
          name,
          paths: [],
          opacity: 1,
          visible: true,
          locked: false,
          compositingMode: 'normal',
          isBackgroundLayer: isBackground,
          backgroundType: backgroundType as any,
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: state.layers.length,
          },
        };

        return {
          layers: [...state.layers, newLayer],
          activeLayerId: newLayer.id,
        };
      });
    },

    // Delete layer
    deleteLayer: (layerId) => {
      set((state) => {
        const filtered = state.layers.filter((l) => l.id !== layerId);
        const newActiveId =
          state.activeLayerId === layerId
            ? filtered[filtered.length - 1]?.id || null
            : state.activeLayerId;

        return {
          layers: filtered,
          activeLayerId: newActiveId,
        };
      });
    },

    // Select layer
    selectLayer: (layerId) => {
      set({ activeLayerId: layerId });
    },

    // Rename layer
    renameLayer: (layerId, newName) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId
            ? { ...l, name: newName, metadata: { ...l.metadata, updatedAt: Date.now() } }
            : l
        ),
      }));
    },

    // Reorder layers
    reorderLayers: (layerId, newIndex) => {
      set((state) => {
        const layers = [...state.layers];
        const currentIndex = layers.findIndex((l) => l.id === layerId);

        if (currentIndex === -1 || newIndex < 0 || newIndex >= layers.length) {
          return state;
        }

        const [layer] = layers.splice(currentIndex, 1);
        layers.splice(newIndex, 0, layer);

        // Update order metadata
        return {
          layers: layers.map((l, i) => ({
            ...l,
            metadata: { ...l.metadata, order: i },
          })),
        };
      });
    },

    // Set layer opacity
    setLayerOpacity: (layerId, opacity) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId
            ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) }
            : l
        ),
      }));
    },

    // Set layer visibility
    setLayerVisibility: (layerId, visible) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId ? { ...l, visible } : l
        ),
      }));
    },

    // Set layer locked
    setLayerLocked: (layerId, locked) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId ? { ...l, locked } : l
        ),
      }));
    },

    // Set compositing mode
    setLayerCompositingMode: (layerId, mode) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId ? { ...l, compositingMode: mode } : l
        ),
      }));
    },

    // Set layer metadata
    setLayerMetadata: (layerId, metadata) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId
            ? {
                ...l,
                metadata: {
                  ...l.metadata,
                  ...metadata,
                  updatedAt: Date.now(),
                },
              }
            : l
        ),
      }));
    },

    // Add path to layer
    addPathToLayer: (layerId, path) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId
            ? {
                ...l,
                paths: [...l.paths, path],
                metadata: { ...l.metadata, updatedAt: Date.now() },
              }
            : l
        ),
      }));
    },

    // Clear layer
    clearLayer: (layerId) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId
            ? {
                ...l,
                paths: [],
                metadata: { ...l.metadata, updatedAt: Date.now() },
              }
            : l
        ),
      }));
    },

    // Clear all layers
    clearAllLayers: () => {
      set((state) => ({
        layers: state.layers.map((l) => ({
          ...l,
          paths: [],
          metadata: { ...l.metadata, updatedAt: Date.now() },
        })),
      }));
    },

    // Get active layer
    getActiveLayer: () => {
      const state = get();
      return state.layers.find((l) => l.id === state.activeLayerId) || null;
    },

    // Get visible layers
    getVisibleLayers: () => {
      return get().layers.filter((l) => l.visible);
    },

    // Get background layers
    getBackgroundLayers: () => {
      return get().layers.filter((l) => l.isBackgroundLayer);
    },

    // Get layer by ID
    getLayerById: (layerId) => {
      return get().layers.find((l) => l.id === layerId) || null;
    },

    // Save layer state
    saveLayerState: () => {
      const state = get();
      return JSON.stringify({
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        timestamp: Date.now(),
      });
    },

    // Restore layer state
    restoreLayerState: (stateString) => {
      try {
        const saved = JSON.parse(stateString);
        set({
          layers: saved.layers,
          activeLayerId: saved.activeLayerId,
        });
      } catch (error) {
        console.error('Error restoring layer state:', error);
      }
    },

    // Reset layers
    resetLayers: () => {
      set({
        layers: createDefaultLayers(),
        activeLayerId: 'layer-1',
      });
    },
  }))
);
