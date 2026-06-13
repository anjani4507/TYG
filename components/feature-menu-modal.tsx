import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Feature {
  id: string;
  name: string;
  icon: string;
  route?: string;
  implemented: boolean;
}

interface FeatureCategory {
  title: string;
  features: Feature[];
}

function showComingSoon(name: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(`${name} — Coming Soon!`, ToastAndroid.SHORT);
  } else {
    Alert.alert("Coming Soon", `${name} is coming in a future update!`);
  }
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
        { id: "stats", name: "Statistics", icon: "📊", route: "/statistics", implemented: true },
        { id: "rankings", name: "Rankings", icon: "⭐", route: "/leaderboard", implemented: true },
        { id: "pomodoro", name: "Pomodoro", icon: "⏲️", route: "/session", implemented: true },
        { id: "allowed-apps", name: "Allowed Apps", icon: "🔒", implemented: false },
        { id: "edit-log", name: "Edit log", icon: "✏️", implemented: false },
        { id: "offline-mode", name: "Offline mode", icon: "📡", implemented: false },
      ],
    },
    {
      title: "Extra features",
      features: [
        { id: "books", name: "Books", icon: "📚", route: "/books", implemented: true },
        { id: "planner", name: "Planner", icon: "📋", route: "/planner", implemented: true },
        { id: "challenge", name: "Challenge", icon: "🏆", implemented: false },
        { id: "timetable", name: "Timetable", icon: "📅", implemented: false },
        { id: "timelapse", name: "Timelapse", icon: "🎬", implemented: false },
        { id: "music", name: "Music", icon: "🎵", implemented: false },
      ],
    },
    {
      title: "Tools",
      features: [
        { id: "canvas", name: "Canvas", icon: "🎨", route: "/canvas", implemented: true },
        { id: "calendar", name: "Calendar", icon: "📅", route: "/calendar", implemented: true },
        { id: "todo", name: "To-Do", icon: "✅", route: "/todo", implemented: true },
        { id: "groups", name: "Groups", icon: "👥", route: "/groups", implemented: true },
      ],
    },
    {
      title: "Settings",
      features: [
        { id: "settings", name: "Settings", icon: "⚙️", route: "/settings", implemented: true },
        { id: "theme", name: "Theme", icon: "🎭", implemented: false },
        { id: "break-settings", name: "Break settings", icon: "⏸️", implemented: false },
        { id: "app-lock", name: "App lock", icon: "🔐", implemented: false },
        { id: "help", name: "Help", icon: "❓", implemented: false },
      ],
    },
  ];

  const handleFeaturePress = (feature: Feature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (feature.implemented && feature.route) {
      router.push(feature.route as any);
      onClose();
    } else {
      showComingSoon(feature.name);
    }
  };

  const FeatureItem = ({ feature }: { feature: Feature }) => (
    <Pressable
      onPress={() => handleFeaturePress(feature)}
      style={({ pressed }) => [
        {
          width: "30%",
          paddingVertical: 14,
          paddingHorizontal: 8,
          marginHorizontal: "1.5%",
          marginBottom: 12,
          borderRadius: 14,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : feature.implemented ? 1 : 0.5,
        },
      ]}
    >
      <Text style={{ fontSize: 24, marginBottom: 6 }}>{feature.icon}</Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.foreground,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {feature.name}
      </Text>
      {!feature.implemented && (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            backgroundColor: colors.primary + "30",
            borderRadius: 4,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: 7, color: colors.primary, fontWeight: "700" }}>
            SOON
          </Text>
        </View>
      )}
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
                    fontSize: 13,
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
