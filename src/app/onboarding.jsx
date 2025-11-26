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
  ArrowRight,
  ArrowLeft,
  Flame,
  Target,
  Heart,
  Zap,
  CheckCircle,
  AlertTriangle,
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
import { saveOnboardingData, saveUserProfile, addGoal } from "@/utils/storage";

export default function WinterArcOnboarding() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const [onboardingData, setOnboardingData] = useState({
    // Personal story and background
    biggestDream: "",
    biggestSetback: "",
    emotionalBreakdown: "",
    whatKeepsGoing: "",

    // Goals and targets
    primaryGoal: "",
    secondaryGoals: "",
    whyStarted: "",
    deadline: "",

    // Motivation sources
    inspiringMovies: "", // Movies that inspire the user
    inspiringBooks: "", // Books that inspire the user
    roleModels: "", // People who inspire the user

    // Distraction tracking
    distractingApps: "", // Apps that waste time (Instagram, YouTube, etc)
    dailyScreenTimeLimit: "3", // Hours per day limit
    
    // Motivation and accountability
    harshReminders: true,
    dailyCheckIns: true,
    distractionAlerts: true,
    motivationStyle: "tough-love", // tough-love, supportive, balanced

    // Commitment level
    winterArcCommitment: "",
    accountabilityLevel: "high", // high, medium, low
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const updateData = (field, value) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding data to AsyncStorage
      const completeData = {
        ...onboardingData,
        onboarded: true,
        completedAt: new Date().toISOString(),
      };
      
      const onboardingSaved = await saveOnboardingData(completeData);
      console.log('✅ Onboarding data saved:', onboardingSaved);

      // Save user profile
      const profileSaved = await saveUserProfile({
        biggestDream: onboardingData.biggestDream,
        biggestSetback: onboardingData.biggestSetback,
        emotionalBreakdown: onboardingData.emotionalBreakdown,
        whatKeepsGoing: onboardingData.whatKeepsGoing,
        whyStarted: onboardingData.whyStarted,
        inspiringMovies: onboardingData.inspiringMovies,
        inspiringBooks: onboardingData.inspiringBooks,
        roleModels: onboardingData.roleModels,
        distractingApps: onboardingData.distractingApps,
        dailyScreenTimeLimit: onboardingData.dailyScreenTimeLimit,
        motivationStyle: onboardingData.motivationStyle,
        accountabilityLevel: onboardingData.accountabilityLevel,
        deadline: onboardingData.deadline,
      });
      console.log('✅ User profile saved:', profileSaved);
      
      // Create initial goal if primary goal exists
      if (onboardingData.primaryGoal) {
        const goalSaved = await addGoal({
          title: onboardingData.primaryGoal,
          deadline: onboardingData.deadline,
          progress: 0,
        });
        console.log('✅ Primary goal saved:', goalSaved?.id);
      }
      
      console.log("✅ Onboarding completed and saved to AsyncStorage");
      
      // Update the query cache to mark onboarding as complete
      queryClient.setQueryData(["onboarding-status"], { onboarded: true });
      
      console.log('🏁 Navigating to home screen...');
      // Navigate to main app
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Onboarding error:", error);
      Alert.alert("Error", "Failed to complete setup. Please try again.");
    }
  };

  const steps = [
    {
      title: "Welcome to Your\nWinter Arc",
      subtitle: "Time to get serious about your goals.",
      icon: Flame,
      component: (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: "Inter_500Medium",
              lineHeight: 24,
              marginBottom: 32,
            }}
          >
            This winter, you're not just setting goals—you're building
            discipline.
            {"\n\n"}
            I'll be your accountability partner. No excuses, no easy way out.
            {"\n\n"}
            Ready to transform?
          </Text>
        </View>
      ),
    },
    {
      title: "What's Your\nBiggest Dream?",
      subtitle: "The one thing you'd regret not achieving.",
      icon: Target,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="Your biggest dream or life goal..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.biggestDream}
            onChangeText={(text) => updateData("biggestDream", text)}
            multiline
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            Be honest. What would make your life complete?
          </Text>
        </View>
      ),
    },
    {
      title: "Your Biggest\nSetback",
      subtitle: "The failure that still haunts you.",
      icon: Heart,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="Your biggest failure or setback..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.biggestSetback}
            onChangeText={(text) => updateData("biggestSetback", text)}
            multiline
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            I need to know this to push you when you want to quit.
          </Text>
        </View>
      ),
    },
    {
      title: "Emotional\nBreakdown",
      subtitle: "When did you feel most defeated?",
      icon: Heart,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="Describe a time you felt completely defeated..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.emotionalBreakdown}
            onChangeText={(text) => updateData("emotionalBreakdown", text)}
            multiline
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            This helps me remind you of your strength when you're weak.
          </Text>
        </View>
      ),
    },
    {
      title: "What Keeps\nYou Going?",
      subtitle: "Your core motivation when everything sucks.",
      icon: Zap,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="What motivates you when you want to give up..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.whatKeepsGoing}
            onChangeText={(text) => updateData("whatKeepsGoing", text)}
            multiline
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            This is what I'll remind you of every single day.
          </Text>
        </View>
      ),
    },
    {
      title: "Primary Winter\nArc Goal",
      subtitle: "What MUST you achieve this winter?",
      icon: Target,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Your main goal for this winter..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.primaryGoal}
            onChangeText={(text) => updateData("primaryGoal", text)}
          />

          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Why does this matter to you?"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.whyStarted}
            onChangeText={(text) => updateData("whyStarted", text)}
          />

          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
            }}
            placeholder="Deadline (e.g., March 20, 2025)"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.deadline}
            onChangeText={(text) => updateData("deadline", text)}
          />
        </View>
      ),
    },
    {
      title: "What Inspires\nYou?",
      subtitle: "Movies, books, or people that fuel your fire.",
      icon: Zap,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Movies that inspire you (e.g., Rocky, Pursuit of Happyness)"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.inspiringMovies}
            onChangeText={(text) => updateData("inspiringMovies", text)}
          />

          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Books that changed you"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.inspiringBooks}
            onChangeText={(text) => updateData("inspiringBooks", text)}
          />

          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
            }}
            placeholder="Role models or people you look up to"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.roleModels}
            onChangeText={(text) => updateData("roleModels", text)}
          />

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            I'll use quotes and wisdom from your inspirations to keep you motivated.
          </Text>
        </View>
      ),
    },
    {
      title: "Distraction\nTracking",
      subtitle: "What steals your time and focus?",
      icon: AlertTriangle,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Apps that distract you (Instagram, YouTube, TikTok, etc)"
            placeholderTextColor={colors.placeholder}
            value={onboardingData.distractingApps}
            onChangeText={(text) => updateData("distractingApps", text)}
          />

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              marginBottom: 8,
            }}
          >
            Daily Screen Time Limit (hours)
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            {["2", "3", "4", "5", "6"].map((hours) => (
              <TouchableOpacity
                key={hours}
                onPress={() => updateData("dailyScreenTimeLimit", hours)}
                style={{
                  flex: 1,
                  backgroundColor:
                    onboardingData.dailyScreenTimeLimit === hours
                      ? colors.primary
                      : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    onboardingData.dailyScreenTimeLimit === hours
                      ? colors.primary
                      : colors.border,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      onboardingData.dailyScreenTimeLimit === hours
                        ? colors.primaryText
                        : colors.textPrimary,
                    fontSize: 18,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {hours}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            I'll alert you when you're wasting time on these apps and remind you of what really matters.
          </Text>
        </View>
      ),
    },
    {
      title: "Accountability\nLevel",
      subtitle: "How hard should I push you?",
      icon: Zap,
      component: (
        <View style={{ flex: 1 }}>
          {[
            {
              id: "tough-love",
              title: "Tough Love",
              description:
                "Harsh reminders. I'll use your setbacks against you.",
            },
            {
              id: "balanced",
              title: "Balanced",
              description: "Firm but fair. Push without breaking you down.",
            },
            {
              id: "supportive",
              title: "Gentle Push",
              description: "Encouraging but still accountable.",
            },
          ].map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => updateData("motivationStyle", style.id)}
              style={{
                backgroundColor:
                  onboardingData.motivationStyle === style.id
                    ? colors.primary
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  onboardingData.motivationStyle === style.id
                    ? colors.primary
                    : colors.border,
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color:
                    onboardingData.motivationStyle === style.id
                      ? colors.primaryText
                      : colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 4,
                }}
              >
                {style.title}
              </Text>
              <Text
                style={{
                  color:
                    onboardingData.motivationStyle === style.id
                      ? colors.primaryText + "90"
                      : colors.textSecondary,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {style.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      title: "Final\nCommitment",
      subtitle: "Your promise to yourself.",
      icon: CheckCircle,
      component: (
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 8,
              padding: 16,
              color: colors.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="I commit to..."
            placeholderTextColor={colors.placeholder}
            value={onboardingData.winterArcCommitment}
            onChangeText={(text) => updateData("winterArcCommitment", text)}
            multiline
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
            }}
          >
            Write your commitment. I'll hold you to this every single day.
          </Text>
        </View>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
      >
        {/* Progress Bar */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 40,
          }}
        >
          {steps.map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 3,
                backgroundColor:
                  index <= currentStep ? colors.primary : colors.surface,
                marginRight: index < steps.length - 1 ? 8 : 0,
                borderRadius: 2,
              }}
            />
          ))}
        </View>

        {/* Header */}
        <View style={{ marginBottom: 40 }}>
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: colors.surface,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <currentStepData.icon size={24} color={colors.textPrimary} />
          </View>

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              lineHeight: 38,
              marginBottom: 8,
            }}
          >
            {currentStepData.title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 18,
              fontFamily: "Inter_400Regular",
              lineHeight: 24,
            }}
          >
            {currentStepData.subtitle}
          </Text>
        </View>

        {/* Step Content */}
        <View style={{ flex: 1 }}>{currentStepData.component}</View>

        {/* Navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
          }}
        >
          <TouchableOpacity
            onPress={prevStep}
            style={{
              opacity: currentStep === 0 ? 0.3 : 1,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
            }}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                fontFamily: "Inter_500Medium",
                marginLeft: 8,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={
              currentStep === steps.length - 1 ? completeOnboarding : nextStep
            }
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: 16,
                fontFamily: "Inter_600SemiBold",
                marginRight: 8,
              }}
            >
              {currentStep === steps.length - 1
                ? "Start Winter Arc"
                : "Continue"}
            </Text>
            <ArrowRight size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
