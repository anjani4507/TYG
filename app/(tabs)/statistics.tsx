import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useStatistics } from '@/hooks/use-statistics';
import { useColors } from '@/hooks/use-colors';
import { StudyHeatmap } from '@/components/study-heatmap';
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

  // Find best study day
  const bestDay = analytics.dailyStats.length > 0
    ? analytics.dailyStats.reduce((best, day) =>
        day.totalMinutes > best.totalMinutes ? day : best,
        analytics.dailyStats[0]
      )
    : null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8" style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Statistics</Text>
            <Text className="text-sm text-muted">Your study journey at a glance</Text>
          </View>

          {/* Study Heatmap */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Study Heatmap</Text>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <StudyHeatmap data={analytics.heatmap} />
            </View>
          </View>

          {/* Key Metrics — Fixed flexbox layout (no grid) */}
          <View className="gap-3">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Total Minutes */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface, flex: 1 }}
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
                style={{ backgroundColor: colors.surface, flex: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Current Streak</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {analytics.currentStreak}
                </Text>
                <Text className="text-xs text-muted mt-1">days 🔥</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Total Sessions */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface, flex: 1 }}
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
                style={{ backgroundColor: colors.surface, flex: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Best Streak</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {analytics.longestStreak}
                </Text>
                <Text className="text-xs text-muted mt-1">days</Text>
              </View>
            </View>
          </View>

          {/* Most Studied Subject & Best Day */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, flex: 1 }}
            >
              <Text className="text-xs text-muted mb-2">Most Studied</Text>
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {analytics.mostStudiedSubject}
              </Text>
              <Text className="text-xs text-muted mt-2">
                {analytics.studyFrequency} days this month
              </Text>
            </View>

            {bestDay && (
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface, flex: 1 }}
              >
                <Text className="text-xs text-muted mb-2">Best Day</Text>
                <Text className="text-lg font-bold text-foreground">
                  {Math.floor(bestDay.totalMinutes / 60)}h {bestDay.totalMinutes % 60}m
                </Text>
                <Text className="text-xs text-muted mt-2">
                  {bestDay.date}
                </Text>
              </View>
            )}
          </View>

          {/* Daily Breakdown (last 7 days) */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Daily Breakdown</Text>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              {analytics.dailyStats.slice(0, 7).map(day => {
                const maxMinutes = Math.max(
                  ...analytics.dailyStats.slice(0, 7).map(d => d.totalMinutes),
                  1
                );
                const barWidth = Math.max((day.totalMinutes / maxMinutes) * 100, 2);

                return (
                  <View key={day.date} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text className="text-xs text-muted">{day.date}</Text>
                      <Text className="text-xs font-semibold text-foreground">
                        {Math.floor(day.totalMinutes / 60)}h {day.totalMinutes % 60}m
                      </Text>
                    </View>
                    <View className="h-2 rounded-full" style={{ backgroundColor: colors.border }}>
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
              {analytics.dailyStats.length === 0 && (
                <Text className="text-sm text-muted text-center py-4">
                  No study data yet. Start a session to see daily stats!
                </Text>
              )}
            </View>
          </View>

          {/* Study Frequency */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Study Frequency</Text>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <View className="flex-1">
                  <View className="h-2 rounded-full" style={{ backgroundColor: colors.border }}>
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
              <View className="h-2 rounded-full mb-2" style={{ backgroundColor: colors.border }}>
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
              {achievements.map((achievement) => (
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
                          <View className="h-1 rounded-full" style={{ backgroundColor: colors.border }}>
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
