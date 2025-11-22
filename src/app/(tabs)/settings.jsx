import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings as SettingsIcon,
  Bell,
  Smartphone,
  Shield,
  HelpCircle,
  MessageCircle,
  Flame,
  ExternalLink,
  ChevronRight,
  Moon,
  Sun,
  Clock,
  Target,
  Trash2,
  Zap,
} from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useState, useCallback } from "react";
import { useTheme } from "@/utils/theme";
import { useColorScheme } from "react-native";
import { distractionChecker } from "@/utils/distractionChecker";
import { getUserProfile, saveUserProfile, clearAllData } from "@/utils/storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  scheduleDailyCheckInReminder, 
  scheduleHarshReminder,
  cancelAllNotifications,
  getScheduledNotifications,
} from "@/utils/notifications";
import { screenTimeMonitor } from "@/utils/screenTime";

export default function WinterArcSettings() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  
  // Fetch user profile for settings
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => await getUserProfile(),
    retry: false,
  });

  const [settings, setSettings] = useState({
    notifications: true,
    dailyReminders: true,
    distractionAlerts: true,
    darkMode: colorScheme === "dark",
    motivationStyle: profile?.motivationStyle || "balanced",
    harshReminders: false,
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const updateSetting = useCallback(
    async (key, value) => {
      setSettings((prev) => ({ ...prev, [key]: value }));

      // Update distraction checker settings
      if (key === "distractionAlerts" || key === "motivationStyle") {
        distractionChecker.updateSettings({ ...settings, [key]: value });
      }

      // Save motivation style to user profile
      if (key === "motivationStyle" && profile) {
        await saveUserProfile({ ...profile, motivationStyle: value });
        queryClient.invalidateQueries(["user-profile"]);
      }

      // Handle notification toggles
      if (key === "dailyReminders") {
        if (value) {
          await scheduleDailyCheckInReminder(20, 0); // 8 PM
        } else {
          await cancelAllNotifications();
        }
      }

      if (key === "harshReminders") {
        if (value) {
          // Schedule first harsh reminder in 1 hour
          await scheduleHarshReminder(60);
        }
      }
    },
    [settings, profile, queryClient],
  );

  const handleMotivationStyleChange = () => {
    const styles = [
      {
        id: "supportive",
        title: "Gentle Push",
        desc: "Encouraging but accountable",
      },
      { id: "balanced", title: "Firm Friend", desc: "Direct but fair" },
      {
        id: "tough-love",
        title: "Harsh Truth",
        desc: "Brutal honesty when needed",
      },
    ];

    Alert.alert(
      "Winter Arc Coaching Style",
      "How should I hold you accountable?",
      styles.map((style) => ({
        text: `${style.title}: ${style.desc}`,
        onPress: () => updateSetting("motivationStyle", style.id),
      })),
    );
  };

  const handleTestMotivation = () => {
    distractionChecker.triggerMotivation("manual");
  };

  const handleResetWinterArc = () => {
    Alert.alert(
      "Reset Winter Arc",
      "This will clear all your progress and start over. Are you giving up?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Winter Arc Reset",
              "Starting fresh. Make it count this time.",
            );
          },
        },
      ],
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Your Winter Arc journey data will be exported.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => console.log("Export data") },
      ],
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Icon size={20} color={colors.textPrimary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 16,
            fontFamily: "Inter_600SemiBold",
            marginBottom: subtitle ? 2 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              lineHeight: 16,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightComponent ||
        (showArrow && <ChevronRight size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  const ToggleItem = ({
    icon: Icon,
    title,
    subtitle,
    value,
    onValueChange,
  }) => (
    <SettingItem
      icon={Icon}
      title={title}
      subtitle={subtitle}
      showArrow={false}
      rightComponent={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: colors.surface,
            true: colors.primary + "40",
          }}
          thumbColor={value ? colors.primary : colors.textSecondary}
        />
      }
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 28,
              fontFamily: "Inter_700Bold",
              marginBottom: 4,
            }}
          >
            Winter Arc Settings
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
            }}
          >
            Configure your accountability system
          </Text>
        </View>

        {/* Winter Arc Accountability */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Big Brother Mode
          </Text>

          <ToggleItem
            icon={Zap}
            title="Distraction Alerts"
            subtitle="I'll call you out when you're wasting time"
            value={settings.distractionAlerts}
            onValueChange={(value) => updateSetting("distractionAlerts", value)}
          />

          <ToggleItem
            icon={Clock}
            title="Daily Check-ins"
            subtitle="Mandatory daily accountability"
            value={settings.dailyCheckins}
            onValueChange={(value) => updateSetting("dailyCheckins", value)}
          />

          <ToggleItem
            icon={Flame}
            title="Harsh Reminders"
            subtitle="Use your setbacks against you when necessary"
            value={settings.harshReminders}
            onValueChange={(value) => updateSetting("harshReminders", value)}
          />

          <SettingItem
            icon={Target}
            title="Coaching Style"
            subtitle={`Currently: ${
              settings.motivationStyle === "tough-love"
                ? "Harsh Truth"
                : settings.motivationStyle === "balanced"
                  ? "Firm Friend"
                  : "Gentle Push"
            }`}
            onPress={handleMotivationStyleChange}
          />

          <SettingItem
            icon={MessageCircle}
            title="Test Motivation"
            subtitle="See how I'll talk to you"
            onPress={handleTestMotivation}
          />
        </View>

        {/* Notifications */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Notifications
          </Text>

          <ToggleItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Essential for Winter Arc discipline"
            value={settings.notifications}
            onValueChange={(value) => updateSetting("notifications", value)}
          />

          <ToggleItem
            icon={Clock}
            title="Daily Reminders"
            subtitle="Morning and evening check-ins"
            value={settings.dailyReminders}
            onValueChange={(value) => updateSetting("dailyReminders", value)}
          />
        </View>

        {/* Appearance */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Appearance
          </Text>

          <ToggleItem
            icon={settings.darkMode ? Moon : Sun}
            title="Dark Mode"
            subtitle="Focus mode for serious work"
            value={settings.darkMode}
            onValueChange={(value) => updateSetting("darkMode", value)}
          />
        </View>

        {/* Data & Reset */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Winter Arc Data
          </Text>

          <SettingItem
            icon={Shield}
            title="Export Progress"
            subtitle="Download your Winter Arc journey"
            onPress={handleExportData}
          />

          <SettingItem
            icon={Trash2}
            title="Reset Winter Arc"
            subtitle="Start over (not recommended)"
            onPress={handleResetWinterArc}
          />
        </View>

        {/* Support */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Support
          </Text>

          <SettingItem
            icon={HelpCircle}
            title="How It Works"
            subtitle="Understanding your Winter Arc system"
            onPress={() => {
              Alert.alert(
                "How It Works",
                "I monitor your progress, call you out on distractions, and use your own story to keep you motivated. No participation trophies.",
              );
            }}
          />

          <SettingItem
            icon={MessageCircle}
            title="Feedback"
            subtitle="Help improve your big brother"
            onPress={() => {
              Alert.alert(
                "Feedback",
                "Send suggestions to make your Winter Arc system better.",
              );
            }}
          />
        </View>

        {/* App Info */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Flame size={32} color={colors.textPrimary} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontFamily: "Inter_600SemiBold",
                marginTop: 12,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Winter Arc Companion
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 12,
              }}
            >
              Version 1.0.0 • Your accountability partner for discipline and
              growth
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
              }}
            >
              No excuses. No shortcuts. Just results.
            </Text>
          </View>

          {/* Danger Zone */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Reset All Data",
                "This will delete ALL your data including onboarding, goals, check-ins, and streak. This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset Everything",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await clearAllData();
                        queryClient.clear();
                        Alert.alert(
                          "Data Cleared",
                          "All data has been reset. Restart the app to begin fresh.",
                        );
                      } catch (error) {
                        Alert.alert("Error", "Failed to clear data. Try again.");
                      }
                    },
                  },
                ],
              );
            }}
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.danger,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: `${colors.danger}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Trash2 size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    marginBottom: 2,
                  }}
                >
                  Reset All Data
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  Delete everything and start fresh
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
