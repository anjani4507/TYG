import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useStatistics } from '@/hooks/use-statistics';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

export default function StatisticsScreen() {
  const { analytics, achievements, loading, getUnlockedAchievements, getAchievementProgress } =
    useStatistics();
  const colors = useColors();

  if (loading || !analytics) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Loading statistics...</Text>
      </ScreenContainer>
    );
  }

  const unlockedCount = getUnlockedAchievements().length;
  const totalCount = achievements.length;
  const progressPercent = getAchievementProgress();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Statistics</Text>
            <Text className="text-sm text-muted">Your study journey at a glance</Text>
          </View>

          {/* Key Metrics */}
          <View className="gap-3">
            <View className="grid grid-cols-2 gap-3">
              {/* Total Minutes */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs text-muted mb-1">Total Studied</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {Math.round(analytics.totalMinutesStudied / 60)}h
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {analytics.totalMinutesStudied % 60}m
                </Text>
              </View>

              {/* Current Streak */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs text-muted mb-1">Current Streak</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {analytics.currentStreak}
                </Text>
                <Text className="text-xs text-muted mt-1">days 🔥</Text>
              </View>

              {/* Total Sessions */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs text-muted mb-1">Sessions</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {analytics.totalSessions}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  avg {analytics.averageSessionLength}m
                </Text>
              </View>

              {/* Longest Streak */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs text-muted mb-1">Best Streak</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {analytics.longestStreak}
                </Text>
                <Text className="text-xs text-muted mt-1">days</Text>
              </View>
            </View>
          </View>

          {/* Most Studied Subject */}
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-2">Most Studied Subject</Text>
            <Text className="text-xl font-bold text-foreground">
              {analytics.mostStudiedSubject}
            </Text>
            <Text className="text-xs text-muted mt-2">
              {analytics.studyFrequency} days studied this month
            </Text>
          </View>

          {/* Study Frequency Chart */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Study Frequency</Text>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <View className="flex-1">
                  <View className="h-2 rounded-full bg-muted/30">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${(analytics.studyFrequency / 30) * 100}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                </View>
                <Text className="text-sm font-semibold text-foreground">
                  {analytics.studyFrequency}/30
                </Text>
              </View>
              <Text className="text-xs text-muted">days active this month</Text>
            </View>
          </View>

          {/* Achievements Section */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Achievements</Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.primary }}>
                <Text className="text-xs font-bold text-background">
                  {unlockedCount}/{totalCount}
                </Text>
              </View>
            </View>

            {/* Achievement Progress Bar */}
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="h-2 rounded-full bg-muted/30 mb-2">
                <View
                  className="h-2 rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text className="text-xs text-muted">{progressPercent}% Complete</Text>
            </View>

            {/* Achievement Grid */}
            <View className="gap-3">
              {achievements.map((achievement, index) => (
                <Pressable
                  key={achievement.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    className="rounded-2xl p-4 flex-row items-center gap-4"
                    style={{
                      backgroundColor: achievement.unlockedAt ? colors.surface : colors.surface + '80',
                    }}
                  >
                    <Text className="text-3xl">{achievement.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={cn(
                          'font-semibold',
                          achievement.unlockedAt ? 'text-foreground' : 'text-muted'
                        )}
                      >
                        {achievement.name}
                      </Text>
                      <Text className="text-xs text-muted mt-1">{achievement.description}</Text>

                      {!achievement.unlockedAt && (
                        <View className="mt-2">
                          <View className="h-1 rounded-full bg-muted/30">
                            <View
                              className="h-1 rounded-full"
                              style={{
                                width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%`,
                                backgroundColor: colors.primary,
                              }}
                            />
                          </View>
                          <Text className="text-xs text-muted mt-1">
                            {achievement.progress}/{achievement.requirement}
                          </Text>
                        </View>
                      )}

                      {achievement.unlockedAt && (
                        <Text className="text-xs text-primary mt-1 font-semibold">✓ Unlocked</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Weekly Stats */}
          {analytics.weeklyStats.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Weekly Overview</Text>
              {analytics.weeklyStats.slice(0, 4).map(week => (
                <View
                  key={week.week}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-foreground">{week.week}</Text>
                    <Text className="text-sm font-bold text-primary">
                      {Math.round(week.totalMinutes / 60)}h {week.totalMinutes % 60}m
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {week.sessions} sessions • {week.avgMinutesPerDay}m/day avg
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Monthly Stats */}
          {analytics.monthlyStats.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Monthly Overview</Text>
              {analytics.monthlyStats.slice(0, 3).map(month => (
                <View
                  key={month.month}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-foreground">{month.month}</Text>
                    <Text className="text-sm font-bold text-primary">
                      {Math.round(month.totalMinutes / 60)}h
                    </Text>
                  </View>
                  <Text className="text-xs text-muted mb-2">
                    {month.sessions} sessions • Best day: {month.bestDayMinutes}m
                  </Text>
                  <View className="flex-row gap-1 flex-wrap">
                    {Object.entries(month.subjects)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([subject, minutes]) => (
                        <View
                          key={subject}
                          className="rounded-full px-2 py-1"
                          style={{ backgroundColor: colors.primary + '20' }}
                        >
                          <Text className="text-xs text-primary font-semibold">
                            {subject} ({Math.round(minutes / 60)}h)
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
