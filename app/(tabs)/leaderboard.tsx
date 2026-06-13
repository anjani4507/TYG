/**
 * Leaderboard Screen
 * 
 * Display rankings by Consistency and Intensity
 */

import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import {
  leaderboardService,
  type LeaderboardType,
  type TimePeriod,
  type LeaderboardEntry,
  type UserStats,
} from '@/lib/_core/leaderboard';
import { useHapticFeedback } from '@/lib/_core/haptic-feedback';

// Mock user stats data
const MOCK_USERS: UserStats[] = [
  {
    userId: '1',
    userName: 'Raj Kumar',
    avatar: '👨‍💻',
    totalSessions: 156,
    totalFocusTime: 468000, // 130 hours
    avgIntensity: 0.92,
    currentStreak: 45,
    longestStreak: 67,
    lastSessionDate: Date.now(),
    badges: ['🔥 7-Day Streak', '⚡ Intense Focuser', '📚 Century Sessions'],
  },
  {
    userId: '2',
    userName: 'Priya Singh',
    avatar: '👩‍💻',
    totalSessions: 142,
    totalFocusTime: 426000, // 118.3 hours
    avgIntensity: 0.88,
    currentStreak: 38,
    longestStreak: 52,
    lastSessionDate: Date.now() - 86400000,
    badges: ['🔥 7-Day Streak', '📚 Century Sessions'],
  },
  {
    userId: '3',
    userName: 'Amit Patel',
    avatar: '👨‍🎓',
    totalSessions: 128,
    totalFocusTime: 384000, // 106.7 hours
    avgIntensity: 0.85,
    currentStreak: 32,
    longestStreak: 48,
    lastSessionDate: Date.now() - 172800000,
    badges: ['📚 Century Sessions'],
  },
  {
    userId: '4',
    userName: 'Neha Gupta',
    avatar: '👩‍🎓',
    totalSessions: 115,
    totalFocusTime: 345000, // 95.8 hours
    avgIntensity: 0.82,
    currentStreak: 28,
    longestStreak: 40,
    lastSessionDate: Date.now() - 259200000,
    badges: [],
  },
  {
    userId: '5',
    userName: 'Vikram Sharma',
    avatar: '👨‍🔬',
    totalSessions: 98,
    totalFocusTime: 294000, // 81.7 hours
    avgIntensity: 0.79,
    currentStreak: 21,
    longestStreak: 35,
    lastSessionDate: Date.now() - 345600000,
    badges: [],
  },
];

export default function LeaderboardScreen() {
  const colors = useColors();
  const haptic = useHapticFeedback();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('combined');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time');

  const leaderboardData = useMemo(() => {
    const filtered = leaderboardService.filterByTimePeriod(MOCK_USERS, timePeriod);
    return leaderboardService.generateLeaderboard(filtered, leaderboardType);
  }, [leaderboardType, timePeriod]);

  const stats = useMemo(() => {
    return leaderboardService.getLeaderboardStats(MOCK_USERS);
  }, []);

  const getRankMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.9) return '#22C55E';
    if (intensity >= 0.8) return '#3B82F6';
    if (intensity >= 0.7) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Leaderboard
          </Text>
          <Text className="text-muted">Compete and climb the ranks</Text>
        </View>

        {/* Stats Overview */}
        <View className="gap-3 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-xs mb-1">Total Users</Text>
              <Text className="text-2xl font-bold text-foreground">
                {stats.totalUsers}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-xs mb-1">Avg Intensity</Text>
              <Text className="text-2xl font-bold text-foreground">
                {Math.round(stats.avgIntensity * 100)}%
              </Text>
            </View>
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-muted text-xs mb-1">Total Focus Time</Text>
            <Text className="text-2xl font-bold text-foreground">
              {Math.round(stats.totalFocusTime / 3600)}h
            </Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">Ranking Type</Text>
          <View className="flex-row gap-2">
            {(['combined', 'consistency', 'intensity'] as const).map((type) => (
              <Pressable
                key={type}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border',
                  leaderboardType === type
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
                onPress={() => {
                  setLeaderboardType(type);
                  haptic.triggerSuccess();
                }}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm text-center',
                    leaderboardType === type
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Period Filter */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">Time Period</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((period) => (
              <Pressable
                key={period}
                className={cn(
                  'px-4 py-2 rounded-full border',
                  timePeriod === period
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
                onPress={() => {
                  setTimePeriod(period);
                  haptic.triggerSuccess();
                }}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    timePeriod === period
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Leaderboard List */}
        <View>
          <FlatList
            scrollEnabled={false}
            data={leaderboardData.entries}
            keyExtractor={(item) => item.userId}
            renderItem={({ item, index }) => (
              <View
                key={item.userId}
                className={cn(
                  'flex-row items-center gap-3 p-4 mb-2 rounded-lg border',
                  index < 3
                    ? 'bg-surface border-primary'
                    : 'bg-surface border-border'
                )}
              >
                {/* Rank */}
                <View className="w-10 items-center">
                  {index < 3 ? (
                    <Text className="text-2xl">{getRankMedalEmoji(index + 1)}</Text>
                  ) : (
                    <Text className="text-lg font-bold text-muted">
                      #{item.rank}
                    </Text>
                  )}
                </View>

                {/* User Info */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-2xl">{item.avatar}</Text>
                    <View className="flex-1">
                      <Text className="text-foreground font-bold">
                        {item.userName}
                      </Text>
                      <Text className="text-muted text-xs">
                        {item.totalSessions} sessions
                      </Text>
                    </View>
                  </View>

                  {/* Badges */}
                  {item.badges.length > 0 && (
                    <View className="flex-row gap-1 mt-1">
                      {item.badges.slice(0, 2).map((badge, i) => (
                        <Text key={i} className="text-xs">
                          {badge}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Score */}
                <View className="items-end">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: getIntensityColor(item.avgIntensity) }}
                  >
                    {Math.round(item.score)}
                  </Text>
                  <Text className="text-muted text-xs">
                    {Math.round(item.avgIntensity * 100)}%
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
