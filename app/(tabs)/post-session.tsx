/**
 * Post-Session Synthesis Screen
 * 
 * Displays session metrics and prompts for qualitative review
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMMKVStore } from '@/lib/stores/mmkv-store';
import { localPersistence, type PersistedSession } from '@/lib/_core/local-persistence';
import { useHapticFeedback } from '@/lib/_core/haptic-feedback';
import { router } from 'expo-router';

interface PostSessionProps {
  sessionId: string;
  duration: number;
  focusIntensity: number;
  distractionCount: number;
}

/**
 * Calculate intensity score based on metrics
 */
function calculateIntensityScore(
  focusIntensity: number,
  distractionCount: number,
  duration: number
): number {
  // Base score from focus intensity (0-60 points)
  const focusScore = focusIntensity * 60;

  // Distraction penalty (0-20 points)
  const distractionPenalty = Math.min(
    (distractionCount / Math.max(1, duration / 60)) * 20,
    20
  );

  // Duration bonus (0-20 points)
  const durationBonus = Math.min((duration / 3600) * 20, 20);

  const totalScore = focusScore + durationBonus - distractionPenalty;
  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

/**
 * Get intensity level label
 */
function getIntensityLevel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Needs Improvement';
}

/**
 * Get intensity level color
 */
function getIntensityColor(score: number): string {
  if (score >= 90) return '#22C55E'; // green
  if (score >= 75) return '#3B82F6'; // blue
  if (score >= 60) return '#F59E0B'; // amber
  if (score >= 45) return '#EF4444'; // red
  return '#6B7280'; // gray
}

export default function PostSessionScreen() {
  const colors = useColors();
  const haptic = useHapticFeedback();
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<PostSessionProps | null>(null);
  const [intensityScore, setIntensityScore] = useState(0);

  // Get session data from route params
  useEffect(() => {
    // In a real app, you'd get this from route params
    // For now, we'll use mock data
    const mockData: PostSessionProps = {
      sessionId: 'session-' + Date.now(),
      duration: 1800, // 30 minutes
      focusIntensity: 0.85,
      distractionCount: 2,
    };
    setSessionData(mockData);
    const score = calculateIntensityScore(
      mockData.focusIntensity,
      mockData.distractionCount,
      mockData.duration
    );
    setIntensityScore(score);
  }, []);

  const handleSubmitReview = async () => {
    if (!sessionData) return;

    setIsSubmitting(true);
    try {
      haptic.triggerSessionComplete();

      // Create persisted session
      const persistedSession: PersistedSession = {
        id: sessionData.sessionId,
        userId: 'current-user', // Would come from auth store
        duration: sessionData.duration,
        intensityScore,
        focusIntensity: sessionData.focusIntensity,
        distractionCount: sessionData.distractionCount,
        startedAt: Date.now() - sessionData.duration * 1000,
        endedAt: Date.now(),
        status: 'completed',
        review: review || undefined,
        createdAt: Date.now(),
      };

      // Save to local storage
      await localPersistence.saveSession(persistedSession);

      // Show success message
      Alert.alert('Session Saved', `Intensity Score: ${intensityScore}`, [
        {
          text: 'View History',
          onPress: () => router.push('/(tabs)'),
        },
        {
          text: 'Start New Session',
          onPress: () => router.push('/(tabs)/session'),
        },
      ]);
    } catch (error) {
      console.error('Failed to save session:', error);
      haptic.triggerError();
      Alert.alert('Error', 'Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionData) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Loading session data...</Text>
      </ScreenContainer>
    );
  }

  const intensityLevel = getIntensityLevel(intensityScore);
  const intensityColor = getIntensityColor(intensityScore);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Session Complete
          </Text>
          <Text className="text-muted">Great work staying focused!</Text>
        </View>

        {/* Intensity Score Card */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-muted text-sm mb-3">Intensity Score</Text>
          <View className="flex-row items-center gap-4">
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: intensityColor + '20' }}
            >
              <Text
                className="text-4xl font-bold"
                style={{ color: intensityColor }}
              >
                {intensityScore}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-2xl font-bold mb-1"
                style={{ color: intensityColor }}
              >
                {intensityLevel}
              </Text>
              <Text className="text-muted text-sm">
                {sessionData.focusIntensity > 0.8
                  ? 'Excellent focus maintained'
                  : 'Good effort, keep improving'}
              </Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View className="gap-3 mb-6">
          <View className="bg-surface rounded-lg p-4 flex-row justify-between border border-border">
            <Text className="text-muted">Duration</Text>
            <Text className="text-foreground font-semibold">
              {Math.floor(sessionData.duration / 60)} min
            </Text>
          </View>

          <View className="bg-surface rounded-lg p-4 flex-row justify-between border border-border">
            <Text className="text-muted">Focus Intensity</Text>
            <Text className="text-foreground font-semibold">
              {Math.round(sessionData.focusIntensity * 100)}%
            </Text>
          </View>

          <View className="bg-surface rounded-lg p-4 flex-row justify-between border border-border">
            <Text className="text-muted">Distractions</Text>
            <Text className="text-foreground font-semibold">
              {sessionData.distractionCount}
            </Text>
          </View>
        </View>

        {/* Review Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">
            30-Second Review
          </Text>
          <Text className="text-muted text-sm mb-3">
            How was your focus? What helped or hindered your productivity?
          </Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-4 text-foreground"
            placeholder="Share your thoughts..."
            placeholderTextColor="#9BA1A6"
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            maxLength={280}
          />
          <Text className="text-muted text-xs mt-2">
            {review.length}/280
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mt-auto">
          <Pressable
            className={cn(
              'bg-primary rounded-lg py-4 items-center',
              isSubmitting && 'opacity-50'
            )}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            <Text className="text-background font-semibold text-lg">
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </Text>
          </Pressable>

          <Pressable
            className="bg-surface border border-border rounded-lg py-4 items-center"
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text className="text-foreground font-semibold">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
