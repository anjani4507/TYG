import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function LegalLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="terms-conditions"
        options={{
          title: "Terms & Conditions",
        }}
      />
      <Stack.Screen
        name="consent"
        options={{
          title: "Data & Consent",
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          title: "App Permissions",
        }}
      />
    </Stack>
  );
}
