import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Task types
interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string; // ISO date string
  completed: boolean;
  createdAt: string;
  subject?: string;
}

const PRIORITY_COLORS = {
  low: "#4ADE80", // green
  medium: "#FBBF24", // amber
  high: "#F87171", // red
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const SUBJECTS = [
  "Quantitative Aptitude",
  "English",
  "Logical Reasoning",
  "General Knowledge",
  "Science",
  "History",
  "Geography",
  "Other",
];

export default function TodoScreen() {
  const colors = useColors();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<"low" | "medium" | "high">("medium");
  const [formDueDate, setFormDueDate] = useState("");
  const [formSubject, setFormSubject] = useState("");

  // Load tasks from AsyncStorage
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("tasks");
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  };

  const handleAddTask = async () => {
    if (!formTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: formTitle,
      description: formDescription,
      priority: formPriority,
      dueDate: formDueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      subject: formSubject,
    };

    const updatedTasks = [newTask, ...tasks];
    await saveTasks(updatedTasks);
    resetForm();
    setShowCreateModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? {
            ...task,
            title: formTitle,
            description: formDescription,
            priority: formPriority,
            dueDate: formDueDate,
            subject: formSubject,
          }
        : task
    );

    await saveTasks(updatedTasks);
    resetForm();
    setEditingTask(null);
    setShowCreateModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await saveTasks(updatedTasks);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleComplete = async (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(updatedTasks);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate);
    setFormSubject(task.subject || "");
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormPriority("medium");
    setFormDueDate("");
    setFormSubject("");
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    });
  }, [tasks, filter]);

  // Sort tasks: incomplete by due date, then completed
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredTasks]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (dueDate: string, completed: boolean) => {
    if (completed || !dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-3xl font-bold text-foreground">Tasks</Text>
            <Pressable
              onPress={() => {
                resetForm();
                setEditingTask(null);
                setShowCreateModal(true);
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-2xl text-primary">+</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted mb-1">Active</Text>
              <Text className="text-2xl font-bold text-foreground">{taskStats.active}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted mb-1">Completed</Text>
              <Text className="text-2xl font-bold text-success">{taskStats.completed}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted mb-1">Total</Text>
              <Text className="text-2xl font-bold text-foreground">{taskStats.total}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="px-6 pb-4 flex-row gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: filter === f ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: filter === f ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                className={`font-semibold capitalize ${
                  filter === f ? "text-white" : "text-foreground"
                }`}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Task List */}
        {sortedTasks.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-lg text-muted text-center mb-4">
              {filter === "all"
                ? "No tasks yet. Create one to get started!"
                : `No ${filter} tasks.`}
            </Text>
            <Pressable
              onPress={() => {
                resetForm();
                setEditingTask(null);
                setShowCreateModal(true);
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-white font-semibold">Create Task</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={sortedTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}
            renderItem={({ item: task }) => (
              <Pressable
                onPress={() => handleEditTask(task)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isOverdue(task.dueDate, task.completed)
                      ? colors.error
                      : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View className="flex-row gap-3 items-start">
                  {/* Checkbox */}
                  <Pressable
                    onPress={() => handleToggleComplete(task.id)}
                    style={({ pressed }) => [
                      {
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: task.completed ? colors.success : colors.border,
                        backgroundColor: task.completed ? colors.success : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    {task.completed && <Text className="text-white font-bold text-sm">✓</Text>}
                  </Pressable>

                  {/* Content */}
                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-base mb-1 ${
                        task.completed ? "text-muted line-through" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </Text>

                    {task.description && (
                      <Text
                        className={`text-sm mb-2 ${
                          task.completed ? "text-muted/50" : "text-muted"
                        }`}
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>
                    )}

                    {/* Meta Info */}
                    <View className="flex-row gap-2 flex-wrap">
                      {/* Priority Badge */}
                      <View
                        style={{
                          backgroundColor: PRIORITY_COLORS[task.priority] + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: PRIORITY_COLORS[task.priority],
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </Text>
                      </View>

                      {/* Due Date Badge */}
                      {task.dueDate && (
                        <View
                          style={{
                            backgroundColor: isOverdue(task.dueDate, task.completed)
                              ? colors.error + "20"
                              : colors.primary + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: isOverdue(task.dueDate, task.completed)
                                ? colors.error
                                : colors.primary,
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {formatDate(task.dueDate)}
                          </Text>
                        </View>
                      )}

                      {/* Subject Badge */}
                      {task.subject && (
                        <View
                          style={{
                            backgroundColor: colors.border,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {task.subject}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => handleDeleteTask(task.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text className="text-error text-lg font-bold">×</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
          setEditingTask(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              flex: 1,
              marginTop: "auto",
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 32,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-foreground">
                  {editingTask ? "Edit Task" : "New Task"}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setEditingTask(null);
                  }}
                >
                  <Text className="text-2xl text-muted">×</Text>
                </Pressable>
              </View>

              {/* Title Input */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Title *</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                  placeholder="Task title"
                  placeholderTextColor={colors.muted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Description Input */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Add details..."
                  placeholderTextColor={colors.muted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                />
              </View>

              {/* Priority Selection */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Priority</Text>
                <View className="flex-row gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setFormPriority(p)}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: formPriority === p ? PRIORITY_COLORS[p] : colors.border,
                          backgroundColor:
                            formPriority === p ? PRIORITY_COLORS[p] + "20" : colors.surface,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        className="text-center font-semibold"
                        style={{
                          color: formPriority === p ? PRIORITY_COLORS[p] : colors.muted,
                        }}
                      >
                        {PRIORITY_LABELS[p]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Due Date Input */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Due Date</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={formDueDate}
                  onChangeText={setFormDueDate}
                />
              </View>

              {/* Subject Selection */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Subject</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {SUBJECTS.map((subject) => (
                    <Pressable
                      key={subject}
                      onPress={() => setFormSubject(formSubject === subject ? "" : subject)}
                      style={({ pressed }) => [
                        {
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            formSubject === subject ? colors.primary : colors.border,
                          backgroundColor:
                            formSubject === subject ? colors.primary + "20" : colors.surface,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color:
                            formSubject === subject ? colors.primary : colors.muted,
                        }}
                      >
                        {subject}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <Pressable
                  onPress={editingTask ? handleUpdateTask : handleAddTask}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-white font-bold text-center text-lg">
                    {editingTask ? "Update Task" : "Create Task"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setEditingTask(null);
                  }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-foreground font-semibold text-center">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
