import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function ConsentScreen() {
  const colors = useColors();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [crashReporting, setCrashReporting] = useState(true);

  const handleConsent = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Save consent preferences
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Header */}
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Data & Consent
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
            Manage your privacy preferences
          </Text>

          {/* Required Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Essential (Required)
            </Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                  Core Functionality
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12 }}>✓</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Required to provide the app's core features like session tracking and user authentication.
              </Text>
            </View>
          </View>

          {/* Optional Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Optional
            </Text>

            {/* Crash Reporting */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground, flex: 1 }}>
                  Crash Reporting
                </Text>
                <Switch
                  value={crashReporting}
                  onValueChange={setCrashReporting}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Help us improve by automatically reporting app crashes and errors.
              </Text>
            </View>

            {/* Analytics */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground, flex: 1 }}>
                  Usage Analytics
                </Text>
                <Switch
                  value={analytics}
                  onValueChange={setAnalytics}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Allow us to collect anonymous usage data to improve the app experience.
              </Text>
            </View>

            {/* Marketing */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground, flex: 1 }}>
                  Marketing Communications
                </Text>
                <Switch
                  value={marketing}
                  onValueChange={setMarketing}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Receive updates about new features, tips, and special offers.
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={{ backgroundColor: colors.primary + "20", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              You can update these preferences anytime in Settings. We respect your privacy and will never sell your data to third parties.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleConsent}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Save Preferences
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Accept All
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
