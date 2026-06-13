import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthStore } from '@/lib/stores/auth-store';
import { supabase } from '@/lib/_core/supabase';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const authStore = useAuthStore();

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = authStore.user;
      if (!user) {
        setError('User not found');
        return;
      }

      // Update user profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: name.trim(),
        });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update local auth store
      authStore.setUser({
        ...user,
        name: name.trim(),
      });
      await authStore.saveAuthState();

      // Navigate to home
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to setup profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Welcome!</Text>
            <Text className="text-base text-muted text-center">
              Let's set up your profile
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Name Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Display Name</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="Your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                autoCapitalize="words"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center justify-center mt-2"
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Get Started</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm text-muted text-center leading-relaxed">
              You can update your profile anytime in settings
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
