import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/_core/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const authStore = useAuthStore();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            await authStore.logout();
            router.replace('/(auth)/login' as any);
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deletion', 'Account deletion is not yet implemented');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="px-6 pb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Profile</Text>
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View>
              <Text className="text-xs text-muted mb-1">Name</Text>
              <Text className="text-base font-semibold text-foreground">
                {authStore.user?.name || 'Not set'}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted mb-1">Email</Text>
              <Text className="text-base font-semibold text-foreground">
                {authStore.user?.email}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary rounded-lg py-2 items-center justify-center mt-2"
              onPress={() => {
                // TODO: Navigate to edit profile screen
                Alert.alert('Edit Profile', 'Profile editing coming soon');
              }}
            >
              <Text className="text-white font-semibold text-sm">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="px-6 pb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Preferences</Text>
          <View className="bg-surface rounded-lg border border-border overflow-hidden">
            {/* Dark Mode */}
            <View className="flex-row justify-between items-center p-4 border-b border-border">
              <View>
                <Text className="font-semibold text-foreground">Dark Mode</Text>
                <Text className="text-xs text-muted mt-1">Use dark theme</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                disabled={true} // TODO: Implement theme switching
              />
            </View>

            {/* Notifications */}
            <View className="flex-row justify-between items-center p-4">
              <View>
                <Text className="font-semibold text-foreground">Notifications</Text>
                <Text className="text-xs text-muted mt-1">Receive session reminders</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="px-6 pb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">About</Text>
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">App Version</Text>
              <Text className="text-sm font-semibold text-foreground">1.0.0</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                // TODO: Open privacy policy
                Alert.alert('Privacy Policy', 'Privacy policy coming soon');
              }}
            >
              <Text className="text-sm text-primary font-semibold">Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // TODO: Open terms of service
                Alert.alert('Terms of Service', 'Terms of service coming soon');
              }}
            >
              <Text className="text-sm text-primary font-semibold">Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-6 pb-12">
          <Text className="text-sm font-semibold text-error mb-3">Danger Zone</Text>
          <View className="bg-surface rounded-lg border border-error overflow-hidden">
            {/* Logout */}
            <TouchableOpacity
              className="p-4 border-b border-error"
              onPress={handleLogout}
            >
              <Text className="text-base font-semibold text-error">Sign Out</Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity className="p-4" onPress={handleDeleteAccount}>
              <Text className="text-base font-semibold text-error">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
