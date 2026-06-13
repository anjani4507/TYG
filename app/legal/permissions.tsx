import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export default function PermissionsScreen() {
  const colors = useColors();
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    microphone: false,
    storage: false,
  });

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setPermissions({ ...permissions, notifications: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const PermissionItem = ({
    title,
    description,
    granted,
    onPress,
  }: {
    title: string;
    description: string;
    granted: boolean;
    onPress: () => void;
  }) => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground, flex: 1 }}>
          {title}
        </Text>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: granted ? colors.primary + "20" : colors.error + "20",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: granted ? colors.primary : colors.error }}>
            {granted ? "Granted" : "Denied"}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
        {description}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            backgroundColor: granted ? colors.surface : colors.primary,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: "center",
            borderWidth: granted ? 1 : 0,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: granted ? colors.foreground : "white",
          }}
        >
          {granted ? "Revoke" : "Grant"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Header */}
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            App Permissions
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
            Manage permissions for TYG features
          </Text>

          {/* Info Box */}
          <View style={{ backgroundColor: colors.primary + "20", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              These permissions allow TYG to provide enhanced features. You can manage these permissions in your device settings at any time.
            </Text>
          </View>

          {/* Notifications */}
          <PermissionItem
            title="Notifications"
            description="Receive sprint alerts, tier promotions, and daily accountability reminders to stay motivated."
            granted={permissions.notifications}
            onPress={requestNotificationPermission}
          />

          {/* Camera */}
          <PermissionItem
            title="Camera"
            description="Capture photos or videos for session documentation and canvas-based note-taking features."
            granted={permissions.camera}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Camera permission request would go here
            }}
          />

          {/* Microphone */}
          <PermissionItem
            title="Microphone"
            description="Record voice notes after sessions for spaced repetition and personal reflections."
            granted={permissions.microphone}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Microphone permission request would go here
            }}
          />

          {/* Storage */}
          <PermissionItem
            title="Storage"
            description="Save session notes, canvas drawings, and session exports to your device."
            granted={permissions.storage}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Storage permission request would go here
            }}
          />

          {/* Permission Details */}
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Permission Details
            </Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 20 }}>
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Notifications: </Text>
                Required for sprint alerts and daily reminders.{"\n\n"}
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Camera: </Text>
                Optional for capturing study materials.{"\n\n"}
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Microphone: </Text>
                Optional for voice notes and reflections.{"\n\n"}
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Storage: </Text>
                Required for saving session data locally.
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 16,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
              Open Device Settings
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
