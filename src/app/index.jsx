import { Redirect } from "expo-router";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/utils/theme";
import { Flame } from "lucide-react-native";
import { isOnboarded } from "@/utils/storage";

export default function Index() {
  const { colors } = useTheme();

  // Check if user has completed onboarding
  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const onboarded = await isOnboarded();
      return { onboarded };
    },
    retry: false,
  });

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Flame size={48} color={colors.textPrimary} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 18,
            marginTop: 16,
          }}
        >
          Winter Arc
        </Text>
      </View>
    );
  }

  // Redirect based on onboarding status
  const isOnboarded = onboardingData?.onboarded || false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isOnboarded ? (
        <Redirect href="/(tabs)/home" />
      ) : (
        <Redirect href="/onboarding" />
      )}
    </View>
  );
}
