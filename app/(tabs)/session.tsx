import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSessionStore } from '@/lib/stores/session-store';
import { useGroupStore } from '@/lib/stores/group-store';
import * as Haptics from 'expo-haptics';

export default function SessionScreen() {
  const router = useRouter();
  const sessionStore = useSessionStore();
  const groupStore = useGroupStore();
  
  const [subject, setSubject] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [intensity, setIntensity] = useState(5);

  // Timer update interval
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setElapsedTime(sessionStore.getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleStartSession = async () => {
    if (!subject.trim()) {
      alert('Please enter a session subject');
      return;
    }

    sessionStore.startSession(subject, selectedGroupId);
    setIsSessionActive(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePauseResume = async () => {
    if (sessionStore.currentSession?.isPaused) {
      sessionStore.resumeSession();
    } else {
      sessionStore.pauseSession();
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEndSession = async () => {
    sessionStore.endSession();
    setIsSessionActive(false);
    setSubject('');
    setElapsedTime(0);
    setIntensity(5);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const joinedGroups = groupStore.getJoinedGroups();
  const currentSession = sessionStore.currentSession;

  if (!isSessionActive) {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 justify-center gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Start Session</Text>
              <Text className="text-sm text-muted text-center">
                What will you focus on today?
              </Text>
            </View>

            {/* Subject Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Session Subject</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="e.g., Project work, Study, Writing"
                placeholderTextColor="#999"
                value={subject}
                onChangeText={setSubject}
                editable={!isSessionActive}
              />
            </View>

            {/* Group Selection */}
            {joinedGroups.length > 0 && (
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Group (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                  <TouchableOpacity
                    className={`rounded-lg px-4 py-2 border ${
                      selectedGroupId === undefined
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    }`}
                    onPress={() => setSelectedGroupId(undefined)}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedGroupId === undefined ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      Solo
                    </Text>
                  </TouchableOpacity>
                  {joinedGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      className={`rounded-lg px-4 py-2 border ${
                        selectedGroupId === group.id
                          ? 'bg-primary border-primary'
                          : 'bg-surface border-border'
                      }`}
                      onPress={() => setSelectedGroupId(group.id)}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedGroupId === group.id ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Start Button */}
            <TouchableOpacity
              className="bg-primary rounded-lg py-4 items-center justify-center mt-4"
              onPress={handleStartSession}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Start Focus Session</Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              className="border border-border rounded-lg py-3 items-center justify-center"
              onPress={() => router.back()}
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Active session view
  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 justify-between px-6 py-8">
        {/* Timer Display */}
        <View className="items-center gap-4">
          <Text className="text-sm text-muted font-semibold">{subject}</Text>
          <View className="bg-surface rounded-2xl p-8 border-2 border-primary items-center">
            <Text className="text-6xl font-bold text-primary">{formatTime(elapsedTime)}</Text>
          </View>
        </View>

        {/* Intensity Slider */}
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-foreground">Intensity</Text>
            <View className="bg-primary/10 rounded-full px-3 py-1">
              <Text className="text-sm font-bold text-primary">{intensity}/10</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                className={`flex-1 rounded-lg py-2 ${
                  i < intensity ? 'bg-primary' : 'bg-surface border border-border'
                }`}
                onPress={() => {
                  setIntensity(i + 1);
                  sessionStore.setIntensity(i + 1);
                }}
              />
            ))}
          </View>
        </View>

        {/* Controls */}
        <View className="gap-3">
          <TouchableOpacity
            className={`rounded-lg py-4 items-center justify-center ${
              currentSession?.isPaused ? 'bg-success' : 'bg-warning'
            }`}
            onPress={handlePauseResume}
          >
            <Text className="text-white font-bold text-lg">
              {currentSession?.isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-error rounded-lg py-4 items-center justify-center"
            onPress={handleEndSession}
          >
            <Text className="text-white font-bold text-lg">End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
