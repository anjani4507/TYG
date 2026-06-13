/**
 * Color Picker Component
 *
 * A grid-based color picker for subject customization.
 * Supports predefined palette with custom color option.
 */

import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

const PRESET_COLORS = [
  "#FF6B6B", "#FF8A65", "#FFB74D", "#FBBF24", "#A3E635",
  "#34D399", "#06B6D4", "#60A5FA", "#818CF8", "#A78BFA",
  "#C084FC", "#EC4899", "#FB7185", "#F3F4F6", "#9BA1A6",
  "#64748B", "#475569", "#1E293B", "#DC2626", "#059669",
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelected: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorSelected }: ColorPickerProps) {
  const colors = useColors();
  const [customColor, setCustomColor] = useState("");

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
        Select Color
      </Text>

      {/* Preset Colors Grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {PRESET_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onColorSelected(color)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: color,
              borderWidth: selectedColor === color ? 3 : 1,
              borderColor: selectedColor === color ? colors.foreground : colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {selectedColor === color && (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* Custom Color Input */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          placeholder="#HEXCODE"
          placeholderTextColor={colors.muted}
          value={customColor}
          onChangeText={setCustomColor}
          maxLength={7}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            color: colors.foreground,
            fontSize: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        <Pressable
          onPress={() => {
            if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
              onColorSelected(customColor);
            }
          }}
          style={({ pressed }) => [
            {
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customColor)
                ? customColor
                : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            Apply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
