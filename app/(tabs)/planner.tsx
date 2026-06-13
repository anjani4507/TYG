import { ScrollView, Text, View, Pressable, Modal, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { usePlanner } from '@/hooks/use-planner';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export default function PlannerScreen() {
  const { plans, quizzes, recommendations, loading, createPlan, updatePlanProgress, generateRecommendation } =
    usePlanner();
  const colors = useColors();

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planDuration, setPlanDuration] = useState('30');
  const [planSubject, setPlanSubject] = useState('Math');

  const handleCreatePlan = async () => {
    if (planTitle.trim()) {
      await createPlan(
        planSubject,
        planTitle,
        planDescription,
        parseInt(planDuration) || 30,
        planDescription.split(',').map(t => t.trim()).filter(Boolean)
      );
      setPlanTitle('');
      setPlanDescription('');
      setPlanDuration('30');
      setShowPlanModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Loading planner...</Text>
      </ScreenContainer>
    );
  }

  const activePlans = plans.filter(p => !p.completed);
  const completedPlans = plans.filter(p => p.completed);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Study Planner</Text>
            <Text className="text-sm text-muted">Plan, practice, and master your subjects</Text>
          </View>

          {/* Quick Stats */}
          <View className="grid grid-cols-3 gap-2">
            <View className="rounded-2xl p-3" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs text-muted mb-1">Active Plans</Text>
              <Text className="text-2xl font-bold text-foreground">{activePlans.length}</Text>
            </View>
            <View className="rounded-2xl p-3" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs text-muted mb-1">Quizzes</Text>
              <Text className="text-2xl font-bold text-foreground">{quizzes.length}</Text>
            </View>
            <View className="rounded-2xl p-3" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs text-muted mb-1">Completed</Text>
              <Text className="text-2xl font-bold text-foreground">{completedPlans.length}</Text>
            </View>
          </View>

          {/* Create Plan Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPlanModal(true);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View
              className="rounded-2xl p-4 items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-background font-bold text-lg">+ Create Study Plan</Text>
            </View>
          </Pressable>

          {/* Active Plans Section */}
          {activePlans.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Active Plans</Text>
              {activePlans.map(plan => (
                <View
                  key={plan.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{plan.title}</Text>
                      <Text className="text-xs text-muted mt-1">{plan.subject}</Text>
                    </View>
                    <View className="rounded-full px-2 py-1" style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-xs font-bold text-primary">{plan.difficulty}</Text>
                    </View>
                  </View>

                  <Text className="text-sm text-muted mb-3">{plan.description}</Text>

                  {/* Progress Bar */}
                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-muted">Progress</Text>
                      <Text className="text-xs font-semibold text-foreground">{plan.progress}%</Text>
                    </View>
                    <View className="h-2 rounded-full bg-muted/30">
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: `${plan.progress}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                  </View>

                  {/* Topics */}
                  <View className="flex-row gap-2 flex-wrap">
                    {plan.topics.map((topic, idx) => (
                      <View
                        key={idx}
                        className="rounded-full px-2 py-1"
                        style={{ backgroundColor: colors.border }}
                      >
                        <Text className="text-xs text-muted">{topic}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Update Progress Buttons */}
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updatePlanProgress(plan.id, Math.min(plan.progress + 25, 100));
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                    >
                      <View className="rounded-lg p-2 items-center" style={{ backgroundColor: colors.primary + '20' }}>
                        <Text className="text-xs font-semibold text-primary">+25%</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updatePlanProgress(plan.id, 100);
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                    >
                      <View className="rounded-lg p-2 items-center" style={{ backgroundColor: colors.success + '20' }}>
                        <Text className="text-xs font-semibold text-success">Complete</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Recommendations</Text>
              {recommendations.slice(0, 3).map(rec => (
                <View
                  key={rec.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{rec.title}</Text>
                      <Text className="text-xs text-muted mt-1">{rec.subject}</Text>
                    </View>
                    <View
                      className="rounded-full px-2 py-1"
                      style={{
                        backgroundColor:
                          rec.priority === 'high'
                            ? colors.error + '20'
                            : rec.priority === 'medium'
                              ? colors.warning + '20'
                              : colors.success + '20',
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color:
                            rec.priority === 'high'
                              ? colors.error
                              : rec.priority === 'medium'
                                ? colors.warning
                                : colors.success,
                        }}
                      >
                        {rec.priority}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted">{rec.reason}</Text>
                  <Text className="text-xs text-muted mt-2">~{rec.suggestedDuration} minutes</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quizzes Section */}
          {quizzes.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Available Quizzes</Text>
              {quizzes.map(quiz => (
                <View
                  key={quiz.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{quiz.title}</Text>
                      <Text className="text-xs text-muted mt-1">{quiz.subject}</Text>
                    </View>
                    <View className="rounded-full px-2 py-1" style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-xs font-bold text-primary">{quiz.questions.length} Q</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted mb-2">{quiz.description}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted">~{quiz.estimatedTime} min</Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View className="rounded-lg px-3 py-2" style={{ backgroundColor: colors.primary }}>
                        <Text className="text-xs font-bold text-background">Start Quiz</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Completed Plans Section */}
          {completedPlans.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Completed Plans</Text>
              {completedPlans.slice(0, 3).map(plan => (
                <View
                  key={plan.id}
                  className="rounded-2xl p-4 opacity-60"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{plan.title}</Text>
                      <Text className="text-xs text-muted mt-1">{plan.subject}</Text>
                    </View>
                    <Text className="text-lg text-success">✓</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {activePlans.length === 0 && quizzes.length === 0 && recommendations.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-3">📚</Text>
              <Text className="text-lg font-semibold text-foreground mb-1">No Plans Yet</Text>
              <Text className="text-sm text-muted text-center">
                Create a study plan to get started on your learning journey
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Plan Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="rounded-t-3xl p-6 gap-4"
            style={{ backgroundColor: colors.background }}
          >
            <Text className="text-2xl font-bold text-foreground mb-2">Create Study Plan</Text>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Title</Text>
              <TextInput
                placeholder="e.g., Algebra Basics"
                placeholderTextColor={colors.muted}
                value={planTitle}
                onChangeText={setPlanTitle}
                className="border rounded-lg p-3"
                style={{
                  borderColor: colors.border,
                  color: colors.foreground,
                }}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Subject</Text>
              <TextInput
                placeholder="e.g., Math"
                placeholderTextColor={colors.muted}
                value={planSubject}
                onChangeText={setPlanSubject}
                className="border rounded-lg p-3"
                style={{
                  borderColor: colors.border,
                  color: colors.foreground,
                }}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Description & Topics</Text>
              <TextInput
                placeholder="Describe your plan, separate topics with commas"
                placeholderTextColor={colors.muted}
                value={planDescription}
                onChangeText={setPlanDescription}
                multiline
                numberOfLines={3}
                className="border rounded-lg p-3"
                style={{
                  borderColor: colors.border,
                  color: colors.foreground,
                }}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Duration (minutes)</Text>
              <TextInput
                placeholder="30"
                placeholderTextColor={colors.muted}
                value={planDuration}
                onChangeText={setPlanDuration}
                keyboardType="numeric"
                className="border rounded-lg p-3"
                style={{
                  borderColor: colors.border,
                  color: colors.foreground,
                }}
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowPlanModal(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
              >
                <View className="rounded-lg p-3 items-center" style={{ backgroundColor: colors.surface }}>
                  <Text className="font-semibold text-foreground">Cancel</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={handleCreatePlan}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
              >
                <View className="rounded-lg p-3 items-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="font-semibold text-background">Create</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
