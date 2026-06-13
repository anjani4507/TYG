import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSubjects } from "@/hooks/use-subjects";
import { useTimer } from "@/hooks/use-timer";
import { useStatistics } from "@/hooks/use-statistics";
import { FeatureMenuModal } from "@/components/feature-menu-modal";
import { SubjectManagerModal } from "@/components/subject-manager-modal";
import { timerService } from "@/lib/timer-service";
import { Subject } from "@/lib/subject-service";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const TABS = ["Timer", "Books", "Statistics", "Planner"] as const;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    subjects,
    isLoading: subjectsLoading,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useSubjects();
  const {
    timerState,
    activeSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    getSubjectStats,
    getTotalStudyTime,
  } = useTimer();
  const { recordSession } = useStatistics();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Timer");
  const [menuVisible, setMenuVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [subjectModalMode, setSubjectModalMode] = useState<"add" | "edit">("add");
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>();

  // Calculate D-Day
  const dDay = useMemo(() => {
    const examDate = new Date(2026, 11, 15); // December 15, 2026
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Format current date
  const currentDate = useMemo(() => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${days[today.getDay()]}, ${today.getMonth() + 1}/${today.getDate()}`;
  }, []);

  // Format total timer
  const totalTimeDisplay = useMemo(() => {
    return timerService.formatTime(getTotalStudyTime());
  }, [timerState.currentTime]);

  // Handle tab press — Timer stays in home, others navigate
  const handleTabPress = useCallback(
    (tab: (typeof TABS)[number]) => {
      setActiveTab(tab);
      if (tab === "Books") {
        router.push("/books");
      } else if (tab === "Statistics") {
        router.push("/statistics");
      } else if (tab === "Planner") {
        router.push("/planner");
      }
    },
    [router]
  );

  // Handle subject press — start/pause/resume timer
  const handleSubjectPress = useCallback(
    async (subjectId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (activeSession && activeSession.subjectId === subjectId) {
        // Same subject tapped — toggle pause/resume
        if (timerState.isPaused) {
          await resumeSession();
        } else {
          await pauseSession();
        }
      } else if (activeSession && activeSession.subjectId !== subjectId) {
        // Different subject — stop current, record, start new
        const prevSubject = activeSession.subjectId;
        const elapsed = timerState.currentTime;
        await stopSession();
        // Record the completed session in statistics
        if (elapsed > 60000) {
          // Only record if > 1 minute
          const subjectName =
            subjects.find((s) => s.id === prevSubject)?.name || "Unknown";
          await recordSession(subjectName, Math.floor(elapsed / 60000));
        }
        await startSession(subjectId);
      } else {
        // No active session — start new one
        await startSession(subjectId);
      }
    },
    [
      activeSession,
      timerState,
      startSession,
      pauseSession,
      resumeSession,
      stopSession,
      recordSession,
      subjects,
    ]
  );

  // Handle stop session via long press
  const handleSubjectLongPress = useCallback(
    async (subjectId: number) => {
      if (activeSession && activeSession.subjectId === subjectId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Stop Session", "Do you want to stop this study session?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Stop",
            style: "destructive",
            onPress: async () => {
              const elapsed = timerState.currentTime;
              await stopSession();
              if (elapsed > 60000) {
                const subjectName =
                  subjects.find((s) => s.id === subjectId)?.name || "Unknown";
                await recordSession(subjectName, Math.floor(elapsed / 60000));
              }
            },
          },
        ]);
      }
    },
    [activeSession, timerState, stopSession, recordSession, subjects]
  );

  // Open edit modal for a subject via the ⋮ menu
  const handleSubjectMenuPress = useCallback(
    (subject: Subject) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingSubject(subject);
      setSubjectModalMode("edit");
      setSubjectModalVisible(true);
    },
    []
  );

  // Handle save from subject modal
  const handleSubjectSave = useCallback(
    async (name: string, color: string) => {
      if (subjectModalMode === "add") {
        await addSubject(name, color);
      } else if (editingSubject) {
        await updateSubject(editingSubject.id, { name, color });
      }
    },
    [subjectModalMode, editingSubject, addSubject, updateSubject]
  );

  // Handle delete from subject modal
  const handleSubjectDelete = useCallback(
    async (id: number) => {
      await deleteSubject(id);
    },
    [deleteSubject]
  );

  // Get the play button icon based on session state
  const getPlayIcon = (subjectId: number): string => {
    if (activeSession?.subjectId === subjectId) {
      if (timerState.isPaused) return "▶"; // Paused — show play
      return "⏸"; // Running — show pause
    }
    return "▶"; // No session — show play
  };

  // Get per-subject time display
  const getSubjectTime = (subjectId: number): string => {
    const stats = getSubjectStats(subjectId);
    if (activeSession?.subjectId === subjectId) {
      return timerService.formatTime(timerState.currentTime);
    }
    return timerService.formatTime(stats.dailyTime);
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => {
    const isActive =
      activeSession?.subjectId === item.id && !timerState.isPaused;
    const isPaused =
      activeSession?.subjectId === item.id && timerState.isPaused;

    return (
      <Pressable
        onPress={() => handleSubjectPress(item.id)}
        onLongPress={() => handleSubjectLongPress(item.id)}
        style={({ pressed }) => [
          {
            backgroundColor: isActive
              ? item.color + "18"
              : colors.surface,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.7 : 1,
            borderWidth: isActive ? 1.5 : 0,
            borderColor: isActive ? item.color + "60" : "transparent",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* Color-coded play/pause button */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: item.color,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
              ...(isActive && {
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 4,
              }),
            }}
          >
            <Text style={{ fontSize: 20, color: "white" }}>
              {getPlayIcon(item.id)}
            </Text>
          </View>

          {/* Subject name and status */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {item.name}
            </Text>
            {isActive && (
              <Text style={{ fontSize: 12, color: item.color, marginTop: 2 }}>
                ● Recording...
              </Text>
            )}
            {isPaused && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                ⏸ Paused
              </Text>
            )}
          </View>
        </View>

        {/* Time and menu */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontSize: 14,
              color: isActive ? item.color : colors.muted,
              fontWeight: isActive ? "700" : "500",
              fontVariant: ["tabular-nums"],
            }}
          >
            {getSubjectTime(item.id)}
          </Text>
          <Pressable
            onPress={() => handleSubjectMenuPress(item)}
            hitSlop={12}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={{ fontSize: 18, color: colors.muted }}>⋮</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, color: colors.muted }}>
            D-{dDay}
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>{currentDate}</Text>
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            accessibilityLabel="Open tools menu"
            accessibilityRole="button"
          >
            {/* Grid icon (4 squares) */}
            <View
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", gap: 3 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.foreground,
                    borderRadius: 1,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.foreground,
                    borderRadius: 1,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 3, marginTop: 3 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.foreground,
                    borderRadius: 1,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.foreground,
                    borderRadius: 1,
                  }}
                />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Large Timer Display */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text
              style={{
                fontSize: 72,
                fontWeight: "700",
                color: timerState.isRunning
                  ? colors.primary
                  : colors.foreground,
                letterSpacing: -2,
                fontVariant: ["tabular-nums"],
              }}
            >
              {totalTimeDisplay}
            </Text>
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => {
                if (activeSession) {
                  // Show session info
                  const subject = subjects.find(
                    (s) => s.id === activeSession.subjectId
                  );
                  Alert.alert(
                    "Current Session",
                    `Subject: ${subject?.name || "Unknown"}\nStatus: ${timerState.isPaused ? "Paused" : "Running"}\nElapsed: ${timerService.formatTime(timerState.currentTime)}`
                  );
                } else {
                  Alert.alert(
                    "Study Timer",
                    "Tap a subject to start studying.\nLong press an active subject to stop."
                  );
                }
              }}
            >
              <Text style={{ fontSize: 20, color: colors.muted }}>ℹ</Text>
            </Pressable>
          </View>
          {timerState.isRunning && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                Session Active
              </Text>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: 16,
          }}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor:
                  activeTab === tab ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: activeTab === tab ? "600" : "400",
                  color:
                    activeTab === tab ? colors.foreground : colors.muted,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Subject List */}
        <FlatList
          data={subjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 80,
          }}
          scrollEnabled={true}
          ListEmptyComponent={
            subjectsLoading ? (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ color: colors.muted }}>Loading subjects...</Text>
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>📚</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                >
                  No subjects yet
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                  Tap + to add your first subject
                </Text>
              </View>
            )
          }
        />

        {/* Add Subject FAB */}
        <Pressable
          onPress={() => {
            setSubjectModalMode("add");
            setEditingSubject(undefined);
            setSubjectModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [
            {
              position: "absolute",
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
          accessibilityLabel="Add subject"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 28, color: "#fff", fontWeight: "300" }}>+</Text>
        </Pressable>
      </View>

      {/* Feature Menu Modal */}
      <FeatureMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />

      {/* Subject Manager Modal */}
      <SubjectManagerModal
        visible={subjectModalVisible}
        onClose={() => setSubjectModalVisible(false)}
        mode={subjectModalMode}
        subject={editingSubject}
        onSave={handleSubjectSave}
        onDelete={handleSubjectDelete}
      />
    </ScreenContainer>
  );
}
