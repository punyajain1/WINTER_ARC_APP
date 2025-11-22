import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CheckCircle,
  Flame,
  TrendingUp,
  AlertTriangle,
  Target,
} from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useState } from "react";
import { useTheme } from "@/utils/theme";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { saveCheckIn, updateStreak, saveActivity } from "@/utils/storage";
import { scheduleHarshReminder } from "@/utils/notifications";

export default function DailyCheckIn() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [checkInData, setCheckInData] = useState({
    mood: "",
    accomplishments: "",
    struggles: "",
    tomorrowPlan: "",
    energyLevel: 5,
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleSubmit = async () => {
    if (!checkInData.accomplishments.trim()) {
      Alert.alert("Incomplete", "Share at least one accomplishment from today.");
      return;
    }

    try {
      // Save check-in
      await saveCheckIn(checkInData);

      // Update streak
      await updateStreak();

      // Save activity
      await saveActivity({
        title: "Daily check-in completed",
        type: "checkin",
      });

      // Schedule harsh reminder if user reported struggles
      if (checkInData.struggles.trim().length > 0) {
        // Schedule reminder for next day (23 hours from now)
        await scheduleHarshReminder(23 * 60);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["daily-checkin"]);
      queryClient.invalidateQueries(["streak"]);
      queryClient.invalidateQueries(["recent-activity"]);

      Alert.alert(
        "Check-in Complete",
        "Another day, another step forward. Keep pushing.",
        [
          {
            text: "Back to Winter Arc",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Check-in error:", error);
      Alert.alert("Error", "Failed to save check-in. Try again.");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Flame size={32} color={colors.primary} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 28,
                fontFamily: "Inter_700Bold",
                marginLeft: 12,
              }}
            >
              Daily Check-in
            </Text>
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
            }}
          >
            Time to be honest about your progress.
          </Text>
        </View>

        {/* How was your day? */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <CheckCircle size={20} color={colors.primary} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              How was your day?
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              height: 60,
            }}
            placeholder="One word: Great, Okay, Tough..."
            placeholderTextColor={colors.textSecondary}
            value={checkInData.mood}
            onChangeText={(text) =>
              setCheckInData({ ...checkInData, mood: text })
            }
          />
        </View>

        {/* What did you accomplish? */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Target size={20} color={colors.primary} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              What did you accomplish?
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="List what you got done today. No matter how small."
            placeholderTextColor={colors.textSecondary}
            value={checkInData.accomplishments}
            onChangeText={(text) =>
              setCheckInData({ ...checkInData, accomplishments: text })
            }
            multiline
            numberOfLines={5}
          />
        </View>

        {/* What struggles did you face? */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <AlertTriangle size={20} color={colors.warning} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              What struggles did you face?
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="What held you back? What do you need to fix?"
            placeholderTextColor={colors.textSecondary}
            value={checkInData.struggles}
            onChangeText={(text) =>
              setCheckInData({ ...checkInData, struggles: text })
            }
            multiline
            numberOfLines={5}
          />
        </View>

        {/* What's the plan for tomorrow? */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <TrendingUp size={20} color={colors.primary} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              What's the plan for tomorrow?
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="What will you do better tomorrow? Set your targets."
            placeholderTextColor={colors.textSecondary}
            value={checkInData.tomorrowPlan}
            onChangeText={(text) =>
              setCheckInData({ ...checkInData, tomorrowPlan: text })
            }
            multiline
            numberOfLines={5}
          />
        </View>

        {/* Submit Button */}
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Complete Check-in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
