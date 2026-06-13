/**
 * Subject Manager Modal
 *
 * Modal for adding, editing, and deleting subjects.
 * Includes color picker integration.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { ColorPicker } from "@/components/color-picker";
import { Subject } from "@/lib/subject-service";
import * as Haptics from "expo-haptics";

interface SubjectManagerModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  subject?: Subject;
  onSave: (name: string, color: string) => void;
  onDelete?: (id: number) => void;
}

export function SubjectManagerModal({
  visible,
  onClose,
  mode,
  subject,
  onSave,
  onDelete,
}: SubjectManagerModalProps) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FF6B6B");

  useEffect(() => {
    if (mode === "edit" && subject) {
      setName(subject.name);
      setColor(subject.color);
    } else {
      setName("");
      setColor("#FF6B6B");
    }
  }, [mode, subject, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a subject name");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(name.trim(), color);
    onClose();
  };

  const handleDelete = () => {
    if (!subject || !onDelete) return;

    if (!subject.isCustom) {
      Alert.alert("Cannot Delete", "Default subjects cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Subject",
      `Are you sure you want to delete "${subject.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(subject.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: "85%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.foreground,
                marginBottom: 20,
              }}
            >
              {mode === "add" ? "Add Subject" : "Edit Subject"}
            </Text>

            {/* Preview */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: color,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 24, color: "white" }}>▶</Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                {name || "Subject Name"}
              </Text>
            </View>

            {/* Name Input */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.muted,
                marginBottom: 6,
              }}
            >
              Subject Name *
            </Text>
            <TextInput
              placeholder="Enter subject name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
              }}
            />

            {/* Color Picker */}
            <ColorPicker selectedColor={color} onColorSelected={setColor} />

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              {mode === "edit" && subject?.isCustom && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: colors.error,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                    Delete
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {mode === "add" ? "Add" : "Save"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
