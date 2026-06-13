import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Feature {
  id: string;
  name: string;
  icon: string;
  route?: string;
  action?: () => void;
}

interface FeatureCategory {
  title: string;
  features: Feature[];
}

export function FeatureMenuModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const router = useRouter();

  const categories: FeatureCategory[] = [
    {
      title: "Main features",
      features: [
        { id: "stats", name: "Statistics", icon: "📊", route: "/stats" },
        { id: "rankings", name: "Rankings", icon: "⭐", route: "/leaderboard" },
        { id: "pomodoro", name: "Pomodoro", icon: "⏲️", route: "/session" },
        { id: "allowed-apps", name: "Allowed Apps", icon: "🔒", route: "/allowed-apps" },
        { id: "edit-log", name: "Edit log", icon: "✏️", route: "/edit-log" },
        { id: "offline-mode", name: "Offline mode", icon: "📡", route: "/offline-mode" },
      ],
    },
    {
      title: "Extra features",
      features: [
        { id: "books", name: "Books", icon: "📚", route: "/books" },
        { id: "challenge", name: "Challenge", icon: "🏆", route: "/challenge" },
        { id: "timetable", name: "Timetable", icon: "📅", route: "/timetable" },
        { id: "timelapse", name: "Timelapse", icon: "🎬", route: "/timelapse" },
        { id: "music", name: "Music", icon: "🎵", route: "/music" },
      ],
    },
    {
      title: "Decorate",
      features: [
        { id: "theme", name: "Theme", icon: "🎨", route: "/theme" },
        { id: "studicon", name: "Studicon", icon: "🎭", route: "/studicon" },
        { id: "decorate-planner", name: "Decorate planner", icon: "✨", route: "/decorate-planner" },
        { id: "store", name: "Store", icon: "🛒", route: "/store" },
      ],
    },
    {
      title: "More",
      features: [
        { id: "select-home", name: "Select home screen", icon: "🏠", route: "/" },
        { id: "break-settings", name: "Break settings", icon: "⏸️", route: "/break-settings" },
        { id: "app-lock", name: "App lock", icon: "🔐", route: "/app-lock" },
        { id: "help", name: "Help", icon: "❓", route: "/help" },
        { id: "settings", name: "Settings", icon: "⚙️", route: "/settings" },
        { id: "canvas", name: "Canvas", icon: "🎨", route: "/canvas" },
        { id: "ai-planner", name: "AI Planner", icon: "🤖", route: "/ai-planner" },
      ],
    },
  ];

  const handleFeaturePress = (feature: Feature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (feature.route) {
      router.push(feature.route as any);
      onClose();
    } else if (feature.action) {
      feature.action();
      onClose();
    }
  };

  const FeatureItem = ({ feature }: { feature: Feature }) => (
    <Pressable
      onPress={() => handleFeaturePress(feature)}
      style={({ pressed }) => [
        {
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 12,
          marginHorizontal: 6,
          marginBottom: 12,
          borderRadius: 12,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{feature.icon}</Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.foreground,
          textAlign: "center",
        }}
      >
        {feature.name}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        {/* Modal Content */}
        <Pressable
          style={{
            width: "90%",
            maxHeight: "80%",
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={{ marginBottom: 24 }}>
                {/* Category Title */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.muted,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {category.title}
                </Text>

                {/* Features Grid */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginHorizontal: -6,
                  }}
                >
                  {category.features.map((feature) => (
                    <FeatureItem key={feature.id} feature={feature} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>
              Close
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
