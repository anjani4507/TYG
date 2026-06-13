/**
 * Notification Preferences Component
 * 
 * UI for managing notification settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import {
  NotificationPreferences,
  getGlobalNotificationService,
} from '@/lib/_core/notification-service';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: NotificationPreferences) => void;
}

export function NotificationPreferencesComponent({
  userId,
  onSave,
}: NotificationPreferencesProps) {
  const colors = useColors();
  const notificationService = getGlobalNotificationService();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences(userId)
  );

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
  };

  const handleTimeChange = (time: string) => {
    const updated = { ...preferences, dailyReminderTime: time };
    setPreferences(updated);
  };

  const handleSave = () => {
    notificationService.updatePreferences(userId, preferences);
    onSave?.(preferences);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 24 }}
    >
      {/* Sprint Alerts */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          🏃 Sprint Alerts
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.foreground }}>Sprint notifications</Text>
          <Switch
            value={preferences.sprintAlerts}
            onValueChange={(value) => handleToggle('sprintAlerts', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Tier Notifications */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          👑 Tier Notifications
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.foreground }}>Promotions & demotions</Text>
          <Switch
            value={preferences.tierNotifications}
            onValueChange={(value) => handleToggle('tierNotifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Daily Reminder */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          📚 Daily Reminder
        </Text>
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground }}>Daily reminder</Text>
            <Switch
              value={preferences.dailyReminder}
              onValueChange={(value) => handleToggle('dailyReminder', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {preferences.dailyReminder && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: colors.muted }}>Time:</Text>
              <TextInput
                value={preferences.dailyReminderTime}
                onChangeText={handleTimeChange}
                placeholder="HH:mm"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  color: colors.foreground,
                  fontFamily: 'monospace',
                }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Focus Debt Warnings */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          ⚡ Focus Debt
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.foreground }}>Debt warnings</Text>
          <Switch
            value={preferences.focusDebtWarnings}
            onValueChange={(value) => handleToggle('focusDebtWarnings', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Milestone Notifications */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          🏆 Milestones
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.foreground }}>Milestone achievements</Text>
          <Switch
            value={preferences.milestoneNotifications}
            onValueChange={(value) => handleToggle('milestoneNotifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Team Notifications */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          👥 Team
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.foreground }}>Team notifications</Text>
          <Switch
            value={preferences.teamNotifications}
            onValueChange={(value) => handleToggle('teamNotifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Sound & Vibration */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          🔊 Sound & Haptics
        </Text>
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground }}>Sound</Text>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground }}>Vibration</Text>
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: colors.background,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          Save Preferences
        </Text>
      </Pressable>
    </ScrollView>
  );
}
