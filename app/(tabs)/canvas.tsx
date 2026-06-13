/**
 * Canvas Screen
 * 
 * Note-taking canvas with GPU-accelerated drawing
 */

import React, { useEffect, useState } from 'react';
import { View, Dimensions, Pressable, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { CanvasProvider } from '@/lib/_core/canvas-provider';
import { CanvasSurface } from '@/components/canvas/canvas-surface';
import { CanvasToolbar } from '@/components/canvas/canvas-toolbar';

/**
 * Canvas Screen Component
 */
export default function CanvasScreen(): React.ReactNode {
  const [sessionId, setSessionId] = useState('session-' + Date.now());
  const { width, height } = Dimensions.get('window');
  const canvasHeight = height * 0.7; // 70% for canvas, 30% for toolbar

  return (
    <ScreenContainer className="flex-1" edges={['top', 'left', 'right']}>
      <CanvasProvider sessionId={sessionId}>
        <View className="flex-1 gap-4">
          {/* Header */}
          <View className="px-4 pt-2">
            <Text className="text-2xl font-bold text-foreground">
              Study Canvas
            </Text>
            <Text className="text-sm text-muted">
              Take notes with GPU-accelerated drawing
            </Text>
          </View>

          {/* Canvas Surface */}
          <View className="flex-1 bg-white rounded-lg mx-4 overflow-hidden shadow-sm">
            <CanvasSurface
              width={width - 32}
              height={canvasHeight}
              onStrokeComplete={(points) => {
                // Handle stroke completion
                console.log('Stroke completed with', points.length, 'points');
              }}
            />
          </View>

          {/* Toolbar */}
          <CanvasToolbar />
        </View>
      </CanvasProvider>
    </ScreenContainer>
  );
}
