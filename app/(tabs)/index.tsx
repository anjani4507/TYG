import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FeatureMenuModal } from "@/components/feature-menu-modal";
import * as Haptics from "expo-haptics";

// Import StatusBar to ensure it's hidden
import { StatusBar } from "expo-status-bar";

// Subject data with color-coded play buttons
const SUBJECTS = [
  { id: 1, name: "Quantitative Aptitude", color: "#FF6B6B", time: "0:00:00" },
  { id: 2, name: "Reasoning", color: "#A78BFA", time: "0:00:00" },
  { id: 3, name: "English", color: "#06B6D4", time: "0:00:00" },
  { id: 4, name: "Banking Awareness", color: "#FBBF24", time: "0:00:00" },
  { id: 5, name: "General Awareness", color: "#60A5FA", time: "0:00:00" },
  { id: 6, name: "Social Issues", color: "#FB7185", time: "0:00:00" },
  { id: 7, name: "Finance", color: "#F3F4F6", time: "0:00:00" },
  { id: 8, name: "General Management", color: "#C084FC", time: "0:00:00" },
  { id: 9, name: "Accountancy", color: "#34D399", time: "0:00:00" },
  { id: 10, name: "Motivation", color: "#EC4899", time: "0:00:00" },
];

const TABS = ["Timer", "Books", "Statistics", "Planner"];

export default function HomeScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("Timer");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Calculate D-Day (days until exam)
  const dDay = useMemo(() => {
    const examDate = new Date(2026, 11, 15); // December 15, 2026
    const today = new Date();
    const diffTime = Math.abs(examDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  const handleSubjectPress = (subjectId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSubject(selectedSubject === subjectId ? null : subjectId);
  };

  const renderSubjectItem = ({ item }: { item: (typeof SUBJECTS)[0] }) => (
    <Pressable
      onPress={() => handleSubjectPress(item.id)}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingVertical: 16,
          paddingHorizontal: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {/* Color-coded play button */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: item.color,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 24, color: "white" }}>▶</Text>
        </View>

        {/* Subject name */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.foreground,
            flex: 1,
          }}
        >
          {item.name}
        </Text>
      </View>

      {/* Time and menu */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
            fontWeight: "500",
          }}
        >
          {item.time}
        </Text>
        <Text style={{ fontSize: 18, color: colors.muted }}>⋮</Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="bg-background">
      {/* Ensure status bar is hidden */}
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
          <Text style={{ fontSize: 16, color: colors.muted }}>D-Day</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>Thu, 6/11</Text>
          <Pressable 
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            {/* Grid icon (4 squares) */}
            <View style={{ width: 24, height: 24, justifyContent: "center", alignItems: "center" }}>
              <View style={{ flexDirection: "row", gap: 3 }}>
                <View style={{ width: 8, height: 8, backgroundColor: colors.foreground, borderRadius: 1 }} />
                <View style={{ width: 8, height: 8, backgroundColor: colors.foreground, borderRadius: 1 }} />
              </View>
              <View style={{ flexDirection: "row", gap: 3, marginTop: 3 }}>
                <View style={{ width: 8, height: 8, backgroundColor: colors.foreground, borderRadius: 1 }} />
                <View style={{ width: 8, height: 8, backgroundColor: colors.foreground, borderRadius: 1 }} />
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
                color: colors.foreground,
                letterSpacing: -2,
              }}
            >
              0:00:00
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
            >
              <Text style={{ fontSize: 20, color: colors.muted }}>ℹ</Text>
            </Pressable>
          </View>
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
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: activeTab === tab ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: activeTab === tab ? "600" : "400",
                  color: activeTab === tab ? colors.foreground : colors.muted,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Subject List */}
        <FlatList
          data={SUBJECTS}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
          scrollEnabled={true}
        />
      </View>

      {/* Feature Menu Modal */}
      <FeatureMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </ScreenContainer>
  );
}
