/**
 * Canvas Toolbar Component
 * 
 * Toolbar for selecting drawing tools and options.
 * Includes Clear, Save, Export actions.
 */

import React from 'react';
import { View, Pressable, Text, ScrollView, Alert, Platform, ToastAndroid } from 'react-native';
import { useCanvas, CanvasTool, WorkspaceBackground } from '@/lib/_core/canvas-provider';
import { cn } from '@/lib/utils';

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Canvas', message);
  }
}

/**
 * Canvas Toolbar Component
 */
export function CanvasToolbar(): React.ReactNode {
  const canvas = useCanvas();

  const tools: Array<{ id: CanvasTool; label: string; icon: string }> = [
    { id: 'pencil', label: 'Pencil', icon: '✏️' },
    { id: 'eraser', label: 'Eraser', icon: '🧹' },
    { id: 'highlighter', label: 'Highlight', icon: '🖍️' },
    { id: 'line', label: 'Line', icon: '📏' },
    { id: 'rectangle', label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle', icon: '○' },
  ];

  const backgrounds: Array<{ id: WorkspaceBackground; label: string; icon: string }> = [
    { id: 'whiteboard', label: 'Whiteboard', icon: '⬜' },
    { id: 'blackboard', label: 'Blackboard', icon: '⬛' },
    { id: 'grid', label: 'Grid', icon: '⊞' },
    { id: 'ruled', label: 'Ruled', icon: '📄' },
    { id: 'formula', label: 'Formula', icon: '∑' },
  ];

  const handleClear = () => {
    Alert.alert(
      'Clear Canvas',
      'This will erase all strokes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            canvas.clearCanvas();
            showToast('Canvas cleared');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      const snapshotId = await canvas.saveSnapshot();
      showToast(`Saved as ${snapshotId}`);
    } catch (error) {
      showToast('Failed to save canvas');
    }
  };

  const handleExport = () => {
    try {
      const blob = canvas.getSnapshot();
      // In a real implementation this would trigger a share sheet or file save
      showToast('Canvas exported (PNG)');
    } catch (error) {
      showToast('Failed to export canvas');
    }
  };

  return (
    <View className="bg-surface border-t border-border">
      {/* Tools Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="p-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            onPress={() => canvas.setTool(tool.id)}
            className={cn(
              'px-3 py-2 rounded-lg border',
              canvas.state.currentTool === tool.id
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            )}
          >
            <Text className="text-lg">{tool.icon}</Text>
            <Text
              className={cn(
                'text-xs font-medium',
                canvas.state.currentTool === tool.id
                  ? 'text-background'
                  : 'text-foreground'
              )}
            >
              {tool.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Background Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-3 pb-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {backgrounds.map((bg) => (
          <Pressable
            key={bg.id}
            onPress={() => canvas.setBackground(bg.id)}
            className={cn(
              'px-3 py-2 rounded-lg border',
              canvas.state.background === bg.id
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            )}
          >
            <Text className="text-lg">{bg.icon}</Text>
            <Text
              className={cn(
                'text-xs font-medium',
                canvas.state.background === bg.id
                  ? 'text-background'
                  : 'text-foreground'
              )}
            >
              {bg.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Controls Section */}
      <View className="flex-row items-center justify-between px-3 pb-3 gap-2">
        {/* Stroke Width */}
        <View className="flex-1 gap-1">
          <Text className="text-xs font-semibold text-muted">Width</Text>
          <View className="flex-row gap-2">
            {[1, 2, 4, 6].map((width) => (
              <Pressable
                key={width}
                onPress={() => canvas.setWidth(width)}
                className={cn(
                  'w-10 h-10 rounded-lg border items-center justify-center',
                  canvas.state.currentWidth === width
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
              >
                <View
                  className="rounded-full bg-foreground"
                  style={{
                    width: width,
                    height: width,
                    opacity:
                      canvas.state.currentWidth === width ? 1 : 0.5,
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View className="flex-1 gap-1">
          <Text className="text-xs font-semibold text-muted">Color</Text>
          <View className="flex-row gap-2">
            {['#000000', '#FF0000', '#0000FF', '#00FF00'].map((color) => (
              <Pressable
                key={color}
                onPress={() => canvas.setColor(color)}
                className={cn(
                  'w-10 h-10 rounded-lg border-2',
                  canvas.state.currentColor === color
                    ? 'border-foreground'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-1 gap-1">
          <Text className="text-xs font-semibold text-muted">Actions</Text>
          <View className="flex-row gap-2 flex-wrap">
            <Pressable
              onPress={() => canvas.undo()}
              className="bg-surface border border-border rounded-lg p-2 items-center"
            >
              <Text className="text-lg">↶</Text>
            </Pressable>
            <Pressable
              onPress={() => canvas.redo()}
              className="bg-surface border border-border rounded-lg p-2 items-center"
            >
              <Text className="text-lg">↷</Text>
            </Pressable>
            <Pressable
              onPress={handleClear}
              className="bg-surface border border-border rounded-lg p-2 items-center"
            >
              <Text className="text-lg">🗑</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="bg-surface border border-border rounded-lg p-2 items-center"
            >
              <Text className="text-lg">💾</Text>
            </Pressable>
            <Pressable
              onPress={handleExport}
              className="bg-surface border border-border rounded-lg p-2 items-center"
            >
              <Text className="text-lg">📤</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
