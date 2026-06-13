/**
 * Gesture Controls UI Component
 * 
 * Zoom buttons, reset, and zoom percentage display
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useCanvasGestureStore } from '@/lib/stores/canvas-gesture-store';

interface GestureControlsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

export function GestureControls({
  position = 'top-right',
  onZoomIn,
  onZoomOut,
  onReset,
}: GestureControlsProps) {
  const colors = useColors();
  const { scale, zoomIn, zoomOut, resetView } = useCanvasGestureStore();

  const handleZoomIn = () => {
    zoomIn();
    onZoomIn?.();
  };

  const handleZoomOut = () => {
    zoomOut();
    onZoomOut?.();
  };

  const handleReset = () => {
    resetView();
    onReset?.();
  };

  // Position styles
  const positionStyles = {
    'top-right': { top: 16, right: 16 },
    'top-left': { top: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
  };

  return (
    <View
      style={{
        position: 'absolute',
        ...positionStyles[position],
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderColor: colors.border,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {/* Zoom In Button */}
      <Pressable
        onPress={handleZoomIn}
        style={({ pressed: isPressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: isPressed ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          opacity: isPressed ? 0.8 : 1,
        })}
      >
        {({ pressed: isPressed }) => (
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isPressed ? colors.background : colors.foreground,
            }}
          >
            +
          </Text>
        )}
      </Pressable>

      {/* Zoom Percentage Display */}
      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          minWidth: 60,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.foreground,
          }}
        >
          {Math.round(scale * 100)}%
        </Text>
      </View>

      {/* Zoom Out Button */}
      <Pressable
        onPress={handleZoomOut}
        style={({ pressed: isPressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: isPressed ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          opacity: isPressed ? 0.8 : 1,
        })}
      >
        {({ pressed: isPressed }) => (
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isPressed ? colors.background : colors.foreground,
            }}
          >
            −
          </Text>
        )}
      </Pressable>

      {/* Reset Button */}
      <Pressable
        onPress={handleReset}
        style={({ pressed: isPressed }) => ({
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: isPressed ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isPressed ? 0.8 : 1,
        })}
      >
        {({ pressed: isPressed }) => (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isPressed ? colors.background : colors.foreground,
            }}
          >
            ⟲
          </Text>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Gesture Info Display Component
 * Shows current zoom level and pan offset
 */
export function GestureInfo() {
  const colors = useColors();
  const { scale, offsetX, offsetY } = useCanvasGestureStore();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderColor: colors.border,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          fontFamily: 'monospace',
        }}
      >
        Zoom: {Math.round(scale * 100)}%
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          fontFamily: 'monospace',
        }}
      >
        Pan: ({Math.round(offsetX)}, {Math.round(offsetY)})
      </Text>
    </View>
  );
}

/**
 * Gesture Hints Component
 * Shows gesture instructions
 */
export function GestureHints() {
  const colors = useColors();

  return (
    <View
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderColor: colors.border,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        maxWidth: 200,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: 4,
        }}
      >
        Gestures:
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
        }}
      >
        • Pinch: Zoom in/out
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
        }}
      >
        • Two fingers: Pan
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
        }}
      >
        • Double tap: Quick zoom
      </Text>
    </View>
  );
}
