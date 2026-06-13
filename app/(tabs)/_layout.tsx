import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* Todo */}
      <Tabs.Screen
        name="todo"
        options={{
          title: "Todo",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle.fill" color={color} />,
        }}
      />

      {/* Statistics */}
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />

      {/* Books */}
      <Tabs.Screen
        name="books"
        options={{
          title: "Books",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />

      {/* Calendar */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
          title: "Calendar",
        }}
      />

      {/* Groups */}
      <Tabs.Screen
        name="groups"
        options={{
          href: null,
          title: "Groups",
        }}
      />

      {/* Search */}
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
          title: "Search",
        }}
      />

      {/* Hidden Screens - Accessible via Menu Modal */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          title: "Settings",
        }}
      />
      <Tabs.Screen
        name="pulse-dashboard"
        options={{
          href: null,
          title: "Pulse",
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
          title: "Leaderboard",
        }}
      />
      <Tabs.Screen
        name="canvas"
        options={{
          href: null,
          title: "Canvas",
        }}
      />
      <Tabs.Screen
        name="post-session"
        options={{
          href: null,
          title: "Post Session",
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          href: null,
          title: "Session",
        }}
      />
    </Tabs>
  );
}
