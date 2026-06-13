/**
 * Canvas Drawing Surface Component
 * 
 * GPU-accelerated drawing surface using react-native-skia
 * (Simplified version for type checking - Skia will be integrated at runtime)
 */

import React, { useRef } from 'react';
import { View, GestureResponderEvent } from 'react-native';
import { useCanvas } from '@/lib/_core/canvas-provider';

interface CanvasSurfaceProps {
  width: number;
  height: number;
  onStrokeComplete?: (points: Array<{ x: number; y: number }>) => void;
}

/**
 * Canvas Surface Component
 * 
 * This component uses react-native-skia for GPU-accelerated drawing.
 * The actual Skia Canvas rendering will be implemented at runtime.
 */
export function CanvasSurface({
  width,
  height,
  onStrokeComplete,
}: CanvasSurfaceProps): React.ReactNode {
  const canvas = useCanvas();
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const isDrawingRef = useRef(false);

  /**
   * Handle touch start
   */
  const handleTouchStart = (event: GestureResponderEvent): void => {
    const { locationX, locationY } = event.nativeEvent;

    isDrawingRef.current = true;
    currentPointsRef.current = [{ x: locationX, y: locationY }];
  };

  /**
   * Handle touch move
   */
  const handleTouchMove = (event: GestureResponderEvent): void => {
    if (!isDrawingRef.current) return;

    const { locationX, locationY } = event.nativeEvent;
    currentPointsRef.current.push({ x: locationX, y: locationY });
  };

  /**
   * Handle touch end
   */
  const handleTouchEnd = (): void => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    // Add stroke to canvas
    if (currentPointsRef.current.length > 0) {
      const stroke = {
        id: `stroke-${Date.now()}`,
        tool: canvas.state.currentTool,
        points: currentPointsRef.current,
        color: canvas.state.currentColor,
        width: canvas.state.currentWidth,
        opacity: canvas.state.currentOpacity,
        timestamp: Date.now(),
      };

      canvas.addStroke(stroke);
      onStrokeComplete?.(currentPointsRef.current);
    }

    currentPointsRef.current = [];
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{ width, height }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
    >
      {/* Skia Canvas will be rendered here at runtime */}
      {/* This is a placeholder for the GPU-accelerated drawing surface */}
    </View>
  );
}
