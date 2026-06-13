/**
 * Study Heatmap Component
 *
 * GitHub-style calendar heatmap showing daily study intensity.
 * 365-day view with 5 color intensity levels.
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { HeatmapData } from "@/lib/statistics-service";

interface StudyHeatmapProps {
  data: HeatmapData;
}

// 5 intensity levels (minutes per day thresholds)
const INTENSITY_THRESHOLDS = [0, 15, 45, 90, 180]; // 0, 15min, 45min, 1.5h, 3h+

function getIntensityLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  if (minutes < 180) return 4;
  return 5;
}

export function StudyHeatmap({ data }: StudyHeatmapProps) {
  const colors = useColors();

  // Generate heatmap cells for last 365 days
  const heatmapCells = useMemo(() => {
    const cells: Array<{ date: string; minutes: number; level: number }> = [];
    const today = new Date();

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const minutes = data[dateStr] || 0;
      cells.push({
        date: dateStr,
        minutes,
        level: getIntensityLevel(minutes),
      });
    }

    return cells;
  }, [data]);

  // Group cells into weeks (columns)
  const weeks = useMemo(() => {
    const result: typeof heatmapCells[] = [];
    for (let i = 0; i < heatmapCells.length; i += 7) {
      result.push(heatmapCells.slice(i, i + 7));
    }
    return result;
  }, [heatmapCells]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; weekIndex: number }> = [];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: months[month], weekIndex });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  // Intensity colors (dark theme friendly)
  const intensityColors = [
    colors.surface, // Level 0: No study
    "#0e4429", // Level 1: Light
    "#006d32", // Level 2: Medium-low
    "#26a641", // Level 3: Medium
    "#39d353", // Level 4: High
    "#39d353", // Level 5: Very high
  ];

  const cellSize = 12;
  const cellGap = 3;

  return (
    <View style={{ gap: 8 }}>
      {/* Month Labels */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View>
          {/* Month label row */}
          <View style={{ flexDirection: "row", marginBottom: 4, height: 16 }}>
            {monthLabels.map((m, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  position: "absolute",
                  left: m.weekIndex * (cellSize + cellGap),
                }}
              >
                {m.label}
              </Text>
            ))}
          </View>

          {/* Heatmap Grid */}
          <View style={{ flexDirection: "row", gap: cellGap }}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={{ gap: cellGap }}>
                {week.map((cell, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      backgroundColor: intensityColors[cell.level],
                    }}
                  />
                ))}
                {/* Fill remaining days for incomplete weeks */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, i) => (
                    <View
                      key={`empty-${weekIndex}-${i}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 2,
                        backgroundColor: "transparent",
                      }}
                    />
                  ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 10, color: colors.muted, marginRight: 4 }}>
          Less
        </Text>
        {intensityColors.slice(0, 5).map((color, i) => (
          <View
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
        <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 4 }}>
          More
        </Text>
      </View>
    </View>
  );
}
