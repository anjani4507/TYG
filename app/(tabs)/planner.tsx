import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { usePlanner } from "@/hooks/use-planner";
import { useSubjects } from "@/hooks/use-subjects";
import { useColors } from "@/hooks/use-colors";
import { geminiService } from "@/lib/gemini-service";
import * as Haptics from "expo-haptics";

type PlannerView = "plans" | "quizzes" | "quiz-active" | "quiz-results";

export default function PlannerScreen() {
  const {
    plans,
    quizzes,
    attempts,
    recommendations,
    loading,
    createPlan,
    updatePlanProgress,
    deletePlan,
    createQuiz,
    startQuizAttempt,
    recordAnswer,
    completeQuizAttempt,
    generateRecommendation,
    refresh,
  } = usePlanner();
  const { subjects } = useSubjects();
  const colors = useColors();

  const [currentView, setCurrentView] = useState<PlannerView>("plans");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Plan form state
  const [planTitle, setPlanTitle] = useState("");
  const [planSubject, setPlanSubject] = useState("");
  const [planExamName, setPlanExamName] = useState("");
  const [planExamDate, setPlanExamDate] = useState("");
  const [planHoursPerDay, setPlanHoursPerDay] = useState("2");
  const [planTopics, setPlanTopics] = useState("");
  const [planWeakAreas, setPlanWeakAreas] = useState("");
  const [planStrongAreas, setPlanStrongAreas] = useState("");
  const [planDifficulty, setPlanDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  // Quiz generation state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [quizTopics, setQuizTopics] = useState("");
  const [quizCount, setQuizCount] = useState("10");
  const [quizDifficulty, setQuizDifficulty] = useState("mixed");

  // Active quiz state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<
    Array<{ selected: number; correct: number; timeSpent: number }>
  >([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Quiz results state
  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(
    null
  );

  const activePlans = useMemo(
    () => plans.filter((p) => !p.completed),
    [plans]
  );
  const completedPlans = useMemo(
    () => plans.filter((p) => p.completed),
    [plans]
  );

  const subjectNames = useMemo(
    () => subjects.map((s) => s.name),
    [subjects]
  );

  // ─── Plan Creation ───────────────────────────────────────────
  const handleCreatePlan = useCallback(async () => {
    if (!planTitle.trim() || !planSubject.trim()) {
      Alert.alert("Missing Info", "Please fill in the title and subject.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const topics = planTopics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await createPlan(
      planSubject,
      planTitle,
      `Topics: ${topics.join(", ")}`,
      parseInt(planHoursPerDay) * 60 || 120,
      topics,
      planDifficulty
    );

    resetPlanForm();
    setShowPlanModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [
    planTitle,
    planSubject,
    planTopics,
    planHoursPerDay,
    planDifficulty,
    createPlan,
  ]);

  const handleGenerateWithAI = useCallback(async () => {
    if (!planSubject.trim()) {
      Alert.alert("Missing Info", "Please enter a subject first.");
      return;
    }

    if (!geminiService.isConfigured()) {
      Alert.alert(
        "API Key Required",
        "Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env.local file to use AI features."
      );
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await geminiService.generateStudyPlan({
        subject: planSubject,
        examName: planExamName || undefined,
        examDate: planExamDate || undefined,
        hoursPerDay: parseInt(planHoursPerDay) || 2,
        topics: planTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        weakAreas: planWeakAreas
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        strongAreas: planStrongAreas
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        difficulty: planDifficulty,
      });

      await createPlan(
        planSubject,
        result.title,
        result.description,
        result.durationMinutes,
        result.topics,
        planDifficulty
      );

      resetPlanForm();
      setShowPlanModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("AI plan generation error:", error);
      Alert.alert(
        "AI Error",
        "Failed to generate study plan. Please try again or create manually."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    planSubject,
    planExamName,
    planExamDate,
    planHoursPerDay,
    planTopics,
    planWeakAreas,
    planStrongAreas,
    planDifficulty,
    createPlan,
  ]);

  const resetPlanForm = () => {
    setPlanTitle("");
    setPlanSubject("");
    setPlanExamName("");
    setPlanExamDate("");
    setPlanHoursPerDay("2");
    setPlanTopics("");
    setPlanWeakAreas("");
    setPlanStrongAreas("");
    setPlanDifficulty("intermediate");
  };

  // ─── Quiz Generation ─────────────────────────────────────────
  const handleGenerateQuiz = useCallback(async () => {
    if (!quizSubject.trim()) {
      Alert.alert("Missing Info", "Please enter a subject.");
      return;
    }

    if (!geminiService.isConfigured()) {
      Alert.alert(
        "API Key Required",
        "Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env.local file to use AI features."
      );
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const topics = quizTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const questions = await geminiService.generateQuizQuestions({
        subject: quizSubject,
        topics: topics.length > 0 ? topics : undefined,
        count: parseInt(quizCount) || 10,
        difficulty: quizDifficulty,
      });

      // Map to service format with unique IDs
      const formattedQuestions = questions.map((q, i) => ({
        id: `q-${Date.now()}-${i}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
        topic: q.topic || quizSubject,
      }));

      await createQuiz(
        quizSubject,
        `${quizSubject} Quiz`,
        `${formattedQuestions.length} questions on ${quizSubject}`,
        formattedQuestions,
        "intermediate"
      );

      setQuizSubject("");
      setQuizTopics("");
      setQuizCount("10");
      setQuizDifficulty("mixed");
      setShowQuizModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Quiz generation error:", error);
      Alert.alert(
        "AI Error",
        "Failed to generate quiz. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [quizSubject, quizTopics, quizCount, quizDifficulty, createQuiz]);

  // ─── Quiz Taking ─────────────────────────────────────────────
  const handleStartQuiz = useCallback(
    async (quizId: string) => {
      const attempt = await startQuizAttempt(quizId);
      if (attempt) {
        setActiveQuizId(quizId);
        setActiveAttemptId(attempt.id);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizAnswers([]);
        setQuestionStartTime(Date.now());
        setCurrentView("quiz-active");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [startQuizAttempt]
  );

  const handleSelectAnswer = useCallback(
    (answerIndex: number) => {
      if (showExplanation) return; // Already answered
      setSelectedAnswer(answerIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [showExplanation]
  );

  const handleConfirmAnswer = useCallback(async () => {
    if (selectedAnswer === null || !activeAttemptId || !activeQuizId) return;

    const quiz = quizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return;

    const question = quiz.questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    // Record the answer
    await recordAnswer(activeAttemptId, currentQuestionIndex, selectedAnswer);

    setQuizAnswers((prev) => [
      ...prev,
      {
        selected: selectedAnswer,
        correct: question.correctAnswer,
        timeSpent,
      },
    ]);

    setShowExplanation(true);
    Haptics.impactAsync(
      selectedAnswer === question.correctAnswer
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Heavy
    );
  }, [
    selectedAnswer,
    activeAttemptId,
    activeQuizId,
    quizzes,
    currentQuestionIndex,
    questionStartTime,
    recordAnswer,
  ]);

  const handleNextQuestion = useCallback(() => {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return;

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      // Quiz complete
      handleFinishQuiz();
    }
  }, [activeQuizId, quizzes, currentQuestionIndex]);

  const handleFinishQuiz = useCallback(async () => {
    if (!activeAttemptId) return;

    const completed = await completeQuizAttempt(activeAttemptId);
    setCompletedAttemptId(activeAttemptId);
    setCurrentView("quiz-results");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeAttemptId, completeQuizAttempt]);

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>
            Loading planner...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Quiz Active View ────────────────────────────────────────
  if (currentView === "quiz-active" && activeQuizId) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    if (!quiz) {
      setCurrentView("quizzes");
      return null;
    }

    const question = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
      <ScreenContainer>
        <View style={{ flex: 1, paddingBottom: 20 }}>
          {/* Quiz Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={() => {
                Alert.alert("Exit Quiz", "Your progress will be lost.", [
                  { text: "Continue Quiz", style: "cancel" },
                  {
                    text: "Exit",
                    style: "destructive",
                    onPress: () => setCurrentView("quizzes"),
                  },
                ]);
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
            </Pressable>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}
              >
                {question.difficulty}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                height: 4,
                width: `${progress}%`,
                backgroundColor: colors.primary,
                borderRadius: 2,
              }}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Question */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {question.topic}
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 18,
                  fontWeight: "600",
                  lineHeight: 26,
                }}
              >
                {question.question}
              </Text>
            </View>

            {/* Options */}
            <View style={{ gap: 12 }}>
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrectOption = idx === question.correctAnswer;
                let optionBg = colors.surface;
                let optionBorder = colors.border;
                let optionTextColor = colors.foreground;

                if (showExplanation) {
                  if (isCorrectOption) {
                    optionBg = "#10B98120";
                    optionBorder = "#10B981";
                    optionTextColor = "#10B981";
                  } else if (isSelected && !isCorrectOption) {
                    optionBg = "#EF444420";
                    optionBorder = "#EF4444";
                    optionTextColor = "#EF4444";
                  }
                } else if (isSelected) {
                  optionBg = colors.primary + "20";
                  optionBorder = colors.primary;
                  optionTextColor = colors.primary;
                }

                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectAnswer(idx)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.8 : 1,
                        backgroundColor: optionBg,
                        borderWidth: 2,
                        borderColor: optionBorder,
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: optionBorder,
                        backgroundColor: isSelected ? optionBorder : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#fff" : optionTextColor,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: optionTextColor,
                        fontSize: 15,
                        fontWeight: "500",
                        flex: 1,
                      }}
                    >
                      {option}
                    </Text>
                    {showExplanation && isCorrectOption && (
                      <Text style={{ fontSize: 18 }}>✓</Text>
                    )}
                    {showExplanation && isSelected && !isCorrectOption && (
                      <Text style={{ fontSize: 18 }}>✗</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Explanation */}
            {showExplanation && (
              <View
                style={{
                  backgroundColor: isCorrect ? "#10B98115" : "#EF444415",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: isCorrect ? "#10B981" : "#EF4444",
                }}
              >
                <Text
                  style={{
                    color: isCorrect ? "#10B981" : "#EF4444",
                    fontWeight: "700",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {question.explanation}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action */}
          <View style={{ paddingTop: 16 }}>
            {!showExplanation ? (
              <Pressable
                onPress={handleConfirmAnswer}
                disabled={selectedAnswer === null}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      selectedAnswer !== null ? colors.primary : colors.surface,
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    opacity: selectedAnswer === null ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      selectedAnswer !== null
                        ? "#fff"
                        : colors.muted,
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  Confirm Answer
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleNextQuestion}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {currentQuestionIndex < (quizzes.find(q => q.id === activeQuizId)?.questions.length ?? 0) - 1
                    ? "Next Question →"
                    : "Finish Quiz 🎉"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Quiz Results View ───────────────────────────────────────
  if (currentView === "quiz-results" && activeQuizId) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    const correctCount = quizAnswers.filter(
      (a) => a.selected === a.correct
    ).length;
    const totalQuestions = quizAnswers.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const totalTime = quizAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
    const avgTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    // Topic breakdown
    const topicStats: Record<
      string,
      { correct: number; total: number }
    > = {};
    if (quiz) {
      quizAnswers.forEach((answer, idx) => {
        const question = quiz.questions[idx];
        if (question) {
          const topic = question.topic || "General";
          if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
          topicStats[topic].total++;
          if (answer.selected === answer.correct) topicStats[topic].correct++;
        }
      });
    }

    return (
      <ScreenContainer>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        >
          {/* Results Header */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>
              {score >= 80 ? "🏆" : score >= 60 ? "👍" : score >= 40 ? "📚" : "💪"}
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              Quiz Complete!
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
              {quiz?.title || "Quiz Results"}
            </Text>
          </View>

          {/* Score Ring */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 8,
                borderColor:
                  score >= 80
                    ? "#10B981"
                    : score >= 60
                    ? "#F59E0B"
                    : "#EF4444",
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "800",
                  color:
                    score >= 80
                      ? "#10B981"
                      : score >= 60
                      ? "#F59E0B"
                      : "#EF4444",
                }}
              >
                {score}%
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Score</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Correct",
                value: `${correctCount}/${totalQuestions}`,
                color: "#10B981",
                icon: "✓",
              },
              {
                label: "Wrong",
                value: `${totalQuestions - correctCount}/${totalQuestions}`,
                color: "#EF4444",
                icon: "✗",
              },
              {
                label: "Avg Time",
                value: `${avgTime.toFixed(1)}s`,
                color: colors.primary,
                icon: "⏱",
              },
              {
                label: "Total Time",
                value: `${Math.round(totalTime)}s`,
                color: "#8B5CF6",
                icon: "⌛",
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>
                  {stat.icon}
                </Text>
                <Text
                  style={{
                    color: stat.color,
                    fontSize: 22,
                    fontWeight: "800",
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Topic Breakdown */}
          {Object.keys(topicStats).length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 12,
                }}
              >
                Topic Performance
              </Text>
              {Object.entries(topicStats).map(([topic, stats]) => {
                const topicScore =
                  stats.total > 0
                    ? Math.round((stats.correct / stats.total) * 100)
                    : 0;
                return (
                  <View
                    key={topic}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontWeight: "600",
                          fontSize: 14,
                          flex: 1,
                        }}
                      >
                        {topic}
                      </Text>
                      <Text
                        style={{
                          color:
                            topicScore >= 80
                              ? "#10B981"
                              : topicScore >= 60
                              ? "#F59E0B"
                              : "#EF4444",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {stats.correct}/{stats.total} ({topicScore}%)
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.border,
                        borderRadius: 3,
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          width: `${topicScore}%`,
                          backgroundColor:
                            topicScore >= 80
                              ? "#10B981"
                              : topicScore >= 60
                              ? "#F59E0B"
                              : "#EF4444",
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Question Review */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              Question Review
            </Text>
            {quiz &&
              quizAnswers.map((answer, idx) => {
                const question = quiz.questions[idx];
                if (!question) return null;
                const wasCorrect = answer.selected === answer.correct;
                return (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: wasCorrect ? "#10B981" : "#EF4444",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 13,
                        fontWeight: "600",
                        marginBottom: 4,
                      }}
                    >
                      Q{idx + 1}: {question.question}
                    </Text>
                    <Text
                      style={{
                        color: wasCorrect ? "#10B981" : "#EF4444",
                        fontSize: 12,
                      }}
                    >
                      {wasCorrect
                        ? `✓ ${question.options[answer.selected]}`
                        : `✗ Your: ${question.options[answer.selected]} → Correct: ${question.options[answer.correct]}`}
                    </Text>
                  </View>
                );
              })}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => {
                setCurrentView("quizzes");
                setActiveQuizId(null);
                setActiveAttemptId(null);
                setQuizAnswers([]);
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Back to Quizzes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                handleStartQuiz(activeQuizId);
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Retry Quiz
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Main Planner View ───────────────────────────────────────
  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.foreground,
            }}
          >
            Study Planner
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Plan, practice, and master your subjects
          </Text>
        </View>

        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {(["plans", "quizzes"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setCurrentView(tab);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor:
                  currentView === tab ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  color: currentView === tab ? "#fff" : colors.muted,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {tab === "plans" ? "📋 Plans" : "❓ Quizzes"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Stats */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Active Plans
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              {activePlans.length}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Quizzes
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              {quizzes.length}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Completed
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              {completedPlans.length}
            </Text>
          </View>
        </View>

        {/* Plans View */}
        {currentView === "plans" && (
          <>
            {/* Create Plan Button */}
            <Pressable
              onPress={() => {
                setShowPlanModal(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 20,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                + Create Study Plan
              </Text>
            </Pressable>

            {/* Active Plans */}
            {activePlans.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  Active Plans
                </Text>
                {activePlans.map((plan) => (
                  <View
                    key={plan.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "600",
                            fontSize: 16,
                          }}
                        >
                          {plan.title}
                        </Text>
                        <Text
                          style={{
                            color: colors.muted,
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {plan.subject}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: colors.primary + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {plan.difficulty}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      {plan.description}
                    </Text>

                    {/* Progress */}
                    <View style={{ marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{ color: colors.muted, fontSize: 12 }}
                        >
                          Progress
                        </Text>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {plan.progress}%
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: colors.border,
                          borderRadius: 3,
                        }}
                      >
                        <View
                          style={{
                            height: 6,
                            width: `${plan.progress}%`,
                            backgroundColor: colors.primary,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    </View>

                    {/* Topics */}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      {plan.topics.slice(0, 5).map((topic, idx) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: colors.border,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{ color: colors.muted, fontSize: 11 }}
                          >
                            {topic}
                          </Text>
                        </View>
                      ))}
                      {plan.topics.length > 5 && (
                        <View
                          style={{
                            backgroundColor: colors.border,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{ color: colors.muted, fontSize: 11 }}
                          >
                            +{plan.topics.length - 5} more
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          updatePlanProgress(
                            plan.id,
                            Math.min(plan.progress + 25, 100)
                          );
                        }}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: colors.primary + "20",
                            borderRadius: 10,
                            padding: 10,
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          +25%
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          updatePlanProgress(plan.id, 100);
                        }}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: "#10B98120",
                            borderRadius: 10,
                            padding: 10,
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: "#10B981",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          Complete
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Delete Plan",
                            "Are you sure?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deletePlan(plan.id),
                              },
                            ]
                          );
                        }}
                        style={({ pressed }) => [
                          {
                            backgroundColor: "#EF444420",
                            borderRadius: 10,
                            padding: 10,
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                            paddingHorizontal: 14,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: "#EF4444",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          🗑
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  Recommendations
                </Text>
                {recommendations.slice(0, 3).map((rec) => (
                  <View
                    key={rec.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontWeight: "600",
                          flex: 1,
                        }}
                      >
                        {rec.title}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            rec.priority === "high"
                              ? "#EF444420"
                              : rec.priority === "medium"
                              ? "#F59E0B20"
                              : "#10B98120",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              rec.priority === "high"
                                ? "#EF4444"
                                : rec.priority === "medium"
                                ? "#F59E0B"
                                : "#10B981",
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {rec.priority}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {rec.reason}
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      ~{rec.suggestedDuration} minutes
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Completed Plans */}
            {completedPlans.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  Completed Plans
                </Text>
                {completedPlans.slice(0, 3).map((plan) => (
                  <View
                    key={plan.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                      opacity: 0.7,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "600",
                          }}
                        >
                          {plan.title}
                        </Text>
                        <Text
                          style={{
                            color: colors.muted,
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {plan.subject}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, color: "#10B981" }}>✓</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {activePlans.length === 0 && completedPlans.length === 0 && (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 48,
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  No Plans Yet
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Create a study plan to start your learning journey
                </Text>
              </View>
            )}
          </>
        )}

        {/* Quizzes View */}
        {currentView === "quizzes" && (
          <>
            {/* Generate Quiz Button */}
            <Pressable
              onPress={() => {
                setShowQuizModal(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 20,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                🤖 Generate Quiz with AI
              </Text>
            </Pressable>

            {/* Quiz List */}
            {quizzes.length > 0 ? (
              <View style={{ gap: 12 }}>
                {quizzes.map((quiz) => {
                  const quizAttempts = attempts.filter(
                    (a) => a.quizId === quiz.id
                  );
                  const bestScore =
                    quizAttempts.length > 0
                      ? Math.max(...quizAttempts.map((a) => a.score))
                      : null;

                  return (
                    <View
                      key={quiz.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.foreground,
                              fontWeight: "600",
                              fontSize: 16,
                            }}
                          >
                            {quiz.title}
                          </Text>
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {quiz.subject}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            {quiz.questions.length} Q
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 13,
                          marginBottom: 12,
                        }}
                      >
                        {quiz.description}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <Text
                            style={{ color: colors.muted, fontSize: 12 }}
                          >
                            ~{quiz.estimatedTime} min
                          </Text>
                          {bestScore !== null && (
                            <Text
                              style={{
                                color:
                                  bestScore >= 80
                                    ? "#10B981"
                                    : bestScore >= 60
                                    ? "#F59E0B"
                                    : "#EF4444",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              Best: {bestScore}%
                            </Text>
                          )}
                          {quizAttempts.length > 0 && (
                            <Text
                              style={{ color: colors.muted, fontSize: 12 }}
                            >
                              {quizAttempts.length} attempt
                              {quizAttempts.length !== 1 ? "s" : ""}
                            </Text>
                          )}
                        </View>

                        <Pressable
                          onPress={() => handleStartQuiz(quiz.id)}
                          style={({ pressed }) => [
                            {
                              backgroundColor: colors.primary,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 10,
                              opacity: pressed ? 0.8 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: "700",
                            }}
                          >
                            {quizAttempts.length > 0
                              ? "Retry"
                              : "Start Quiz"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 48,
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: 12 }}>❓</Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  No Quizzes Yet
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Generate a quiz using AI to test your knowledge
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Plan Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "85%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 22,
                  fontWeight: "800",
                  marginBottom: 20,
                }}
              >
                Create Study Plan
              </Text>

              {/* Subject */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Subject *
                </Text>
                {subjectNames.length > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {subjectNames.map((name) => (
                      <Pressable
                        key={name}
                        onPress={() => setPlanSubject(name)}
                        style={{
                          backgroundColor:
                            planSubject === name
                              ? colors.primary
                              : colors.surface,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              planSubject === name ? "#fff" : colors.foreground,
                            fontSize: 13,
                            fontWeight: "500",
                          }}
                        >
                          {name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    placeholder="e.g., Mathematics"
                    placeholderTextColor={colors.muted}
                    value={planSubject}
                    onChangeText={setPlanSubject}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: 10,
                      padding: 12,
                    }}
                  />
                )}
              </View>

              {/* Title */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Plan Title
                </Text>
                <TextInput
                  placeholder="e.g., Number System Mastery"
                  placeholderTextColor={colors.muted}
                  value={planTitle}
                  onChangeText={setPlanTitle}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </View>

              {/* Exam Name */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Exam Name (optional)
                </Text>
                <TextInput
                  placeholder="e.g., IBPS PO, SSC CGL"
                  placeholderTextColor={colors.muted}
                  value={planExamName}
                  onChangeText={setPlanExamName}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </View>

              {/* Hours Per Day */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Hours Per Day
                </Text>
                <TextInput
                  placeholder="2"
                  placeholderTextColor={colors.muted}
                  value={planHoursPerDay}
                  onChangeText={setPlanHoursPerDay}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </View>

              {/* Topics */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Topics (comma-separated)
                </Text>
                <TextInput
                  placeholder="e.g., Algebra, Geometry, Probability"
                  placeholderTextColor={colors.muted}
                  value={planTopics}
                  onChangeText={setPlanTopics}
                  multiline
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: 60,
                  }}
                />
              </View>

              {/* Weak Areas */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Weak Areas (comma-separated, for AI)
                </Text>
                <TextInput
                  placeholder="e.g., Probability, Trigonometry"
                  placeholderTextColor={colors.muted}
                  value={planWeakAreas}
                  onChangeText={setPlanWeakAreas}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </View>

              {/* Strong Areas */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Strong Areas (comma-separated, for AI)
                </Text>
                <TextInput
                  placeholder="e.g., Algebra, Number System"
                  placeholderTextColor={colors.muted}
                  value={planStrongAreas}
                  onChangeText={setPlanStrongAreas}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </View>

              {/* Difficulty */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Difficulty
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["beginner", "intermediate", "advanced"] as const).map(
                    (d) => (
                      <Pressable
                        key={d}
                        onPress={() => setPlanDifficulty(d)}
                        style={{
                          flex: 1,
                          backgroundColor:
                            planDifficulty === d
                              ? colors.primary
                              : colors.surface,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              planDifficulty === d ? "#fff" : colors.foreground,
                            fontSize: 12,
                            fontWeight: "600",
                            textTransform: "capitalize",
                          }}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                {/* AI Generate Button */}
                <Pressable
                  onPress={handleGenerateWithAI}
                  disabled={isGenerating}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#8B5CF6",
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      opacity: isGenerating ? 0.6 : pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 16 }}>🤖</Text>
                  )}
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    {isGenerating
                      ? "Generating..."
                      : "Generate with AI"}
                  </Text>
                </Pressable>

                {/* Manual Create */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      resetPlanForm();
                      setShowPlanModal(false);
                    }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        alignItems: "center",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreatePlan}
                    disabled={isGenerating}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: colors.primary,
                        borderRadius: 14,
                        padding: 14,
                        alignItems: "center",
                        opacity: isGenerating ? 0.5 : pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Create Manually
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generate Quiz Modal */}
      <Modal visible={showQuizModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 20,
              }}
            >
              Generate Quiz with AI
            </Text>

            {/* Subject */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Subject *
              </Text>
              {subjectNames.length > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {subjectNames.map((name) => (
                    <Pressable
                      key={name}
                      onPress={() => setQuizSubject(name)}
                      style={{
                        backgroundColor:
                          quizSubject === name
                            ? colors.primary
                            : colors.surface,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            quizSubject === name ? "#fff" : colors.foreground,
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <TextInput
                  placeholder="e.g., Quantitative Aptitude"
                  placeholderTextColor={colors.muted}
                  value={quizSubject}
                  onChangeText={setQuizSubject}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              )}
            </View>

            {/* Topics */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Topics (optional, comma-separated)
              </Text>
              <TextInput
                placeholder="e.g., Percentages, Profit & Loss"
                placeholderTextColor={colors.muted}
                value={quizTopics}
                onChangeText={setQuizTopics}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: 10,
                  padding: 12,
                }}
              />
            </View>

            {/* Question Count */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Number of Questions
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["5", "10", "15", "20"].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setQuizCount(n)}
                    style={{
                      flex: 1,
                      backgroundColor:
                        quizCount === n ? colors.primary : colors.surface,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: quizCount === n ? "#fff" : colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                onPress={() => setShowQuizModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{ color: colors.foreground, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateQuiz}
                disabled={isGenerating}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#8B5CF6",
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    opacity: isGenerating ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                )}
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {isGenerating ? "Generating..." : "Generate"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
