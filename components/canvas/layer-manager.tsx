/**
 * Layer Manager UI Component
 * 
 * Non-intrusive overlay for layer management (add, delete, reorder, blend)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useCanvasLayersStore, CompositingMode } from '@/lib/stores/canvas-layers-store';
import { cn } from '@/lib/utils';

interface LayerManagerProps {
  visible: boolean;
  onClose?: () => void;
}

export function LayerManager({ visible, onClose }: LayerManagerProps) {
  const colors = useColors();
  const {
    layers,
    activeLayerId,
    createLayer,
    deleteLayer,
    selectLayer,
    renameLayer,
    reorderLayers,
    setLayerOpacity,
    setLayerVisibility,
    setLayerLocked,
    setLayerCompositingMode,
  } = useCanvasLayersStore();

  const [newLayerName, setNewLayerName] = useState('');
  const [showNewLayerModal, setShowNewLayerModal] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const compositingModes: CompositingMode[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
  ];

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      createLayer(newLayerName);
      setNewLayerName('');
      setShowNewLayerModal(false);
    }
  };

  const handleStartEdit = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingLayerId && editingName.trim()) {
      renameLayer(editingLayerId, editingName);
      setEditingLayerId(null);
      setEditingName('');
    }
  };

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    const currentIndex = layers.findIndex((l) => l.id === layerId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < layers.length) {
      reorderLayers(layerId, newIndex);
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.metadata.order - b.metadata.order);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Layer Manager Panel */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80%',
            paddingTop: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
              }}
            >
              Layers
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 24, color: colors.foreground }}>✕</Text>
            </Pressable>
          </View>

          {/* Layers List */}
          <FlatList
            data={sortedLayers}
            keyExtractor={(item) => item.id}
            scrollEnabled
            style={{ maxHeight: 400 }}
            renderItem={({ item: layer }) => (
              <View
                style={{
                  backgroundColor:
                    activeLayerId === layer.id ? colors.primary : 'transparent',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginHorizontal: 8,
                  marginVertical: 4,
                  borderRadius: 8,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                {editingLayerId === layer.id ? (
                  // Edit mode
                  <View style={{ gap: 8 }}>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      placeholder="Layer name"
                      placeholderTextColor={colors.muted}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 6,
                        color: colors.foreground,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 8,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Pressable
                        onPress={handleSaveEdit}
                        style={({ pressed }) => ({
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: colors.primary,
                          borderRadius: 6,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: colors.background,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          Save
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setEditingLayerId(null)}
                        style={({ pressed }) => ({
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: colors.border,
                          borderRadius: 6,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 12,
                          }}
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // View mode
                  <View style={{ gap: 8 }}>
                    {/* Layer name and controls */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Pressable
                        onPress={() => selectLayer(layer.id)}
                        style={{ flex: 1 }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color:
                              activeLayerId === layer.id
                                ? colors.background
                                : colors.foreground,
                          }}
                        >
                          {layer.name}
                        </Text>
                      </Pressable>

                      {/* Layer controls */}
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 4,
                        }}
                      >
                        {/* Visibility toggle */}
                        <Pressable
                          onPress={() =>
                            setLayerVisibility(layer.id, !layer.visible)
                          }
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Text style={{ fontSize: 16 }}>
                            {layer.visible ? '👁' : '🚫'}
                          </Text>
                        </Pressable>

                        {/* Lock toggle */}
                        {!layer.isBackgroundLayer && (
                          <Pressable
                            onPress={() =>
                              setLayerLocked(layer.id, !layer.locked)
                            }
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.6 : 1,
                            })}
                          >
                            <Text style={{ fontSize: 16 }}>
                              {layer.locked ? '🔒' : '🔓'}
                            </Text>
                          </Pressable>
                        )}

                        {/* Edit name */}
                        <Pressable
                          onPress={() =>
                            handleStartEdit(layer.id, layer.name)
                          }
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Text style={{ fontSize: 16 }}>✏️</Text>
                        </Pressable>

                        {/* Delete */}
                        {!layer.isBackgroundLayer && (
                          <Pressable
                            onPress={() => deleteLayer(layer.id)}
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.6 : 1,
                            })}
                          >
                            <Text style={{ fontSize: 16 }}>🗑️</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Opacity slider */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          width: 50,
                        }}
                      >
                        Opacity
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          height: 4,
                          backgroundColor: colors.border,
                          borderRadius: 2,
                        }}
                      >
                        <View
                          style={{
                            height: '100%',
                            width: `${layer.opacity * 100}%`,
                            backgroundColor: colors.primary,
                            borderRadius: 2,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          width: 30,
                        }}
                      >
                        {Math.round(layer.opacity * 100)}%
                      </Text>
                    </View>

                    {/* Blending mode */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          width: 50,
                        }}
                      >
                        Blend
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          gap: 4,
                        }}
                      >
                        {compositingModes.map((mode) => (
                          <Pressable
                            key={mode}
                            onPress={() =>
                              setLayerCompositingMode(layer.id, mode)
                            }
                            style={({ pressed }) => ({
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              backgroundColor:
                                layer.compositingMode === mode
                                  ? colors.primary
                                  : colors.background,
                              borderRadius: 4,
                              opacity: pressed ? 0.8 : 1,
                            })}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color:
                                  layer.compositingMode === mode
                                    ? colors.background
                                    : colors.foreground,
                                fontWeight: '500',
                              }}
                            >
                              {mode.slice(0, 3)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Move layer buttons */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 8,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Pressable
                        onPress={() => handleMoveLayer(layer.id, 'up')}
                        disabled={layer.metadata.order === 0}
                        style={({ pressed }) => ({
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: colors.border,
                          borderRadius: 4,
                          opacity:
                            layer.metadata.order === 0
                              ? 0.3
                              : pressed
                                ? 0.8
                                : 1,
                        })}
                      >
                        <Text style={{ fontSize: 12 }}>⬆️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleMoveLayer(layer.id, 'down')}
                        disabled={layer.metadata.order === layers.length - 1}
                        style={({ pressed }) => ({
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: colors.border,
                          borderRadius: 4,
                          opacity:
                            layer.metadata.order === layers.length - 1
                              ? 0.3
                              : pressed
                                ? 0.8
                                : 1,
                        })}
                      >
                        <Text style={{ fontSize: 12 }}>⬇️</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}
          />

          {/* Add Layer Button */}
          <Pressable
            onPress={() => setShowNewLayerModal(true)}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginVertical: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.primary,
              borderRadius: 8,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: colors.background,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              + New Layer
            </Text>
          </Pressable>
        </View>
      </View>

      {/* New Layer Modal */}
      <Modal
        visible={showNewLayerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewLayerModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              width: '100%',
              maxWidth: 300,
              gap: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
              }}
            >
              New Layer
            </Text>
            <TextInput
              value={newLayerName}
              onChangeText={setNewLayerName}
              placeholder="Layer name"
              placeholderTextColor={colors.muted}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                color: colors.foreground,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <Pressable
                onPress={() => setShowNewLayerModal(false)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreateLayer}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontWeight: '600',
                  }}
                >
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
