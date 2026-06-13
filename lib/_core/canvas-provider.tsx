/**
 * Canvas Provider & Context
 * 
 * Manages canvas state, strokes, and drawing operations
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { EventEmitter } from 'eventemitter3';

export type CanvasTool = 'pencil' | 'eraser' | 'highlighter' | 'line' | 'rectangle' | 'circle';
export type WorkspaceBackground = 'whiteboard' | 'blackboard' | 'grid' | 'ruled' | 'formula';

export interface Stroke {
  id: string;
  tool: CanvasTool;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity: number;
  timestamp: number;
}

export interface CanvasState {
  strokes: Stroke[];
  currentTool: CanvasTool;
  currentColor: string;
  currentWidth: number;
  currentOpacity: number;
  background: WorkspaceBackground;
  zoom: number;
  panX: number;
  panY: number;
  isDirty: boolean;
  sessionId: string;
}

export interface CanvasContextType {
  state: CanvasState;
  addStroke: (stroke: Stroke) => void;
  removeStroke: (strokeId: string) => void;
  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setBackground: (background: WorkspaceBackground) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => Promise<string>;
  loadSnapshot: (snapshotId: string) => Promise<void>;
  getSnapshot: () => Blob;
  on: (event: string, listener: (...args: any[]) => void) => void;
  off: (event: string, listener: (...args: any[]) => void) => void;
}

/**
 * Canvas Context
 */
const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * Canvas Provider Component
 */
export function CanvasProvider({
  children,
  sessionId,
}: {
  children: ReactNode;
  sessionId: string;
}): ReactNode {
  const [state, setState] = React.useState<CanvasState>({
    strokes: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentWidth: 2,
    currentOpacity: 1.0,
    background: 'whiteboard',
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDirty: false,
    sessionId,
  });

  const [history, setHistory] = React.useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const emitterRef = React.useRef(new EventEmitter());

  /**
   * Add stroke to canvas
   */
  const addStroke = (stroke: Stroke): void => {
    setState((prev) => {
      const newState = {
        ...prev,
        strokes: [...prev.strokes, stroke],
        isDirty: true,
      };

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      emitterRef.current.emit('stroke-added', stroke);
      return newState;
    });
  };

  /**
   * Remove stroke from canvas
   */
  const removeStroke = (strokeId: string): void => {
    setState((prev) => ({
      ...prev,
      strokes: prev.strokes.filter((s) => s.id !== strokeId),
      isDirty: true,
    }));
    emitterRef.current.emit('stroke-removed', strokeId);
  };

  /**
   * Set current tool
   */
  const setTool = (tool: CanvasTool): void => {
    setState((prev) => ({ ...prev, currentTool: tool }));
    emitterRef.current.emit('tool-changed', tool);
  };

  /**
   * Set current color
   */
  const setColor = (color: string): void => {
    setState((prev) => ({ ...prev, currentColor: color }));
    emitterRef.current.emit('color-changed', color);
  };

  /**
   * Set current width
   */
  const setWidth = (width: number): void => {
    setState((prev) => ({ ...prev, currentWidth: width }));
    emitterRef.current.emit('width-changed', width);
  };

  /**
   * Set current opacity
   */
  const setOpacity = (opacity: number): void => {
    setState((prev) => ({ ...prev, currentOpacity: opacity }));
    emitterRef.current.emit('opacity-changed', opacity);
  };

  /**
   * Set background
   */
  const setBackground = (background: WorkspaceBackground): void => {
    setState((prev) => ({ ...prev, background }));
    emitterRef.current.emit('background-changed', background);
  };

  /**
   * Set zoom level
   */
  const setZoom = (zoom: number): void => {
    const clampedZoom = Math.max(0.5, Math.min(3.0, zoom)); // 0.5x to 3x
    setState((prev) => ({ ...prev, zoom: clampedZoom }));
    emitterRef.current.emit('zoom-changed', clampedZoom);
  };

  /**
   * Set pan offset
   */
  const setPan = (panX: number, panY: number): void => {
    setState((prev) => ({ ...prev, panX, panY }));
    emitterRef.current.emit('pan-changed', { panX, panY });
  };

  /**
   * Clear canvas
   */
  const clearCanvas = (): void => {
    setState((prev) => {
      const newState = {
        ...prev,
        strokes: [],
        isDirty: true,
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      emitterRef.current.emit('canvas-cleared');
      return newState;
    });
  };

  /**
   * Undo last action
   */
  const undo = (): void => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
      emitterRef.current.emit('undo');
    }
  };

  /**
   * Redo last action
   */
  const redo = (): void => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
      emitterRef.current.emit('redo');
    }
  };

  /**
   * Save canvas snapshot (placeholder)
   */
  const saveSnapshot = async (): Promise<string> => {
    // TODO: Implement actual snapshot saving
    const snapshotId = `snapshot-${Date.now()}`;
    emitterRef.current.emit('snapshot-saved', snapshotId);
    return snapshotId;
  };

  /**
   * Load canvas snapshot (placeholder)
   */
  const loadSnapshot = async (snapshotId: string): Promise<void> => {
    // TODO: Implement actual snapshot loading
    emitterRef.current.emit('snapshot-loaded', snapshotId);
  };

  /**
   * Get canvas as blob (placeholder)
   */
  const getSnapshot = (): Blob => {
    // TODO: Implement actual canvas-to-blob conversion
    return new Blob([''], { type: 'image/png' });
  };

  /**
   * Event emitter methods
   */
  const on = (event: string, listener: (...args: any[]) => void): void => {
    emitterRef.current.on(event, listener);
  };

  const off = (event: string, listener: (...args: any[]) => void): void => {
    emitterRef.current.off(event, listener);
  };

  const value: CanvasContextType = {
    state,
    addStroke,
    removeStroke,
    setTool,
    setColor,
    setWidth,
    setOpacity,
    setBackground,
    setZoom,
    setPan,
    clearCanvas,
    undo,
    redo,
    saveSnapshot,
    loadSnapshot,
    getSnapshot,
    on,
    off,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

/**
 * Hook to use canvas context
 */
export function useCanvas(): CanvasContextType {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }
  return context;
}
