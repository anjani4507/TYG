import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function TermsConditionsScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Header */}
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
            Terms & Conditions
          </Text>

          {/* Last Updated */}
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 24 }}>
            Last Updated: June 11, 2026
          </Text>

          {/* Section 1 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            1. Acceptance of Terms
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            By downloading and using TYG, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the app.
          </Text>

          {/* Section 2 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            2. License Grant
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            We grant you a limited, non-exclusive, non-transferable license to use TYG for personal, non-commercial purposes. You may not modify, copy, distribute, or reverse engineer the app without our express written permission.
          </Text>

          {/* Section 3 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            3. User Responsibilities
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            You agree to use TYG only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the app. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Text>

          {/* Section 4 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            4. Disclaimer of Warranties
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            TYG is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the app will be uninterrupted, error-free, or secure. Your use of the app is at your own risk.
          </Text>

          {/* Section 5 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            5. Limitation of Liability
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            In no event shall TYG, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the app.
          </Text>

          {/* Section 6 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            6. Termination
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
            We reserve the right to terminate or suspend your account and access to the app at any time, without notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users.
          </Text>

          {/* Section 7 */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            7. Governing Law
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 24 }}>
            These Terms & Conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
          </Text>

          {/* Contact Section */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Questions?
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              If you have any questions about these terms, please contact us at legal@tyg.app
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
