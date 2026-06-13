import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function CalendarScreen() {
  const colors = useColors();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Pressable onPress={handlePrevMonth}>
              <Text style={{ fontSize: 24, color: colors.primary }}>‹</Text>
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              {monthName}
            </Text>
            <Pressable onPress={handleNextMonth}>
              <Text style={{ fontSize: 24, color: colors.primary }}>›</Text>
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 12,
              justifyContent: "space-between",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text
                key={day}
                style={{
                  width: "14.28%",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.muted,
                }}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[...emptyDays, ...days].map((day, index) => (
              <View
                key={index}
                style={{
                  width: "14.28%",
                  aspectRatio: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {day ? (
                  <Pressable
                    style={({ pressed }) => [
                      {
                        width: "90%",
                        height: "90%",
                        borderRadius: 8,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor:
                          day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth()
                            ? colors.primary
                            : colors.surface,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color:
                          day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth()
                            ? "white"
                            : colors.foreground,
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          {/* Upcoming Sessions */}
          <View style={{ marginTop: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Upcoming Sessions
            </Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                No sessions scheduled for today
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
