/**
 * Real-time Pulse Dashboard
 * 
 * Displays group's collective activity with dynamic pulsing interface
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, Animated } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/lib/_core/haptic-feedback';

interface GroupMember {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  focusIntensity: number;
  sessionDuration: number;
  avatar: string;
}

interface GroupStats {
  totalMembers: number;
  activeMembers: number;
  groupIntensity: number;
  totalFocusTime: number;
  avgSessionDuration: number;
}

// Mock data
const MOCK_MEMBERS: GroupMember[] = [
  {
    id: '1',
    name: 'Raj Kumar',
    status: 'active',
    focusIntensity: 0.92,
    sessionDuration: 1800,
    avatar: '👨‍💻',
  },
  {
    id: '2',
    name: 'Priya Singh',
    status: 'active',
    focusIntensity: 0.88,
    sessionDuration: 2400,
    avatar: '👩‍💻',
  },
  {
    id: '3',
    name: 'Amit Patel',
    status: 'active',
    focusIntensity: 0.85,
    sessionDuration: 1200,
    avatar: '👨‍🎓',
  },
  {
    id: '4',
    name: 'Neha Gupta',
    status: 'idle',
    focusIntensity: 0.65,
    sessionDuration: 600,
    avatar: '👩‍🎓',
  },
  {
    id: '5',
    name: 'Vikram Sharma',
    status: 'offline',
    focusIntensity: 0,
    sessionDuration: 0,
    avatar: '👨‍🔬',
  },
];

/**
 * Pulsing Circle Component
 */
function PulsingCircle({ intensity }: { intensity: number }) {
  const [pulseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const color =
    intensity > 0.8
      ? '#22C55E'
      : intensity > 0.6
        ? '#F59E0B'
        : '#EF4444';

  return (
    <View className="items-center justify-center w-32 h-32">
      <Animated.View
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
          position: 'absolute',
        }}
      />
      <View
        className="w-24 h-24 rounded-full items-center justify-center"
        style={{ backgroundColor: color + '30' }}
      >
        <Text className="text-3xl font-bold" style={{ color }}>
          {Math.round(intensity * 100)}%
        </Text>
      </View>
    </View>
  );
}

export default function PulseDashboardScreen() {
  const colors = useColors();
  const haptic = useHapticFeedback();
  const [members, setMembers] = useState(MOCK_MEMBERS);

  const stats: GroupStats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    groupIntensity:
      members.reduce((sum, m) => sum + m.focusIntensity, 0) / members.length,
    totalFocusTime: members.reduce((sum, m) => sum + m.sessionDuration, 0),
    avgSessionDuration:
      members.reduce((sum, m) => sum + m.sessionDuration, 0) / members.length,
  };

  const handleStartGroupSprint = () => {
    haptic.triggerSessionStart();
    // TODO: Implement group sprint sync
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#22C55E';
      case 'idle':
        return '#F59E0B';
      case 'offline':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Focusing';
      case 'idle':
        return 'Idle';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Group Pulse
          </Text>
          <Text className="text-muted">Real-time focus activity</Text>
        </View>

        {/* Main Pulse Display */}
        <View className="items-center mb-8">
          <PulsingCircle intensity={stats.groupIntensity} />
          <Text className="text-muted text-sm mt-4">Group Intensity</Text>
        </View>

        {/* Stats Cards */}
        <View className="gap-3 mb-8">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-xs mb-1">Active Members</Text>
              <Text className="text-2xl font-bold text-foreground">
                {stats.activeMembers}/{stats.totalMembers}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-xs mb-1">Avg Duration</Text>
              <Text className="text-2xl font-bold text-foreground">
                {Math.round(stats.avgSessionDuration / 60)}m
              </Text>
            </View>
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-muted text-xs mb-1">Total Focus Time</Text>
            <Text className="text-2xl font-bold text-foreground">
              {Math.round(stats.totalFocusTime / 3600)}h {Math.round((stats.totalFocusTime % 3600) / 60)}m
            </Text>
          </View>
        </View>

        {/* Start Group Sprint Button */}
        <Pressable
          className="bg-primary rounded-lg py-4 items-center mb-8"
          onPress={handleStartGroupSprint}
        >
          <Text className="text-background font-semibold text-lg">
            Start Group Sprint
          </Text>
        </Pressable>

        {/* Members List */}
        <View>
          <Text className="text-foreground font-semibold mb-3">
            Group Members
          </Text>

          {members.map((member) => (
            <View
              key={member.id}
              className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Text className="text-3xl">{member.avatar}</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    {member.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(member.status) }}
                    />
                    <Text className="text-muted text-xs">
                      {getStatusLabel(member.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {member.status === 'active' && (
                <View className="items-end">
                  <Text className="text-foreground font-bold">
                    {Math.round(member.focusIntensity * 100)}%
                  </Text>
                  <Text className="text-muted text-xs">
                    {Math.round(member.sessionDuration / 60)}m
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
