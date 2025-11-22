import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Flame,
  CheckCircle,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  Camera,
  Plus,
  X,
  Calendar,
  Circle,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { 
  getUserProfile, 
  getTodayCheckIn, 
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getActivities,
  getStreak,
  updateStreak,
  saveActivity,
} from "@/utils/storage";
import { scheduleHarshReminder, scheduleGoalDeadlineReminder } from "@/utils/notifications";

export default function WinterArcDashboard() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetDate: "",
    why: "",
  });
  const [streakImage, setStreakImage] = useState(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Check onboarding status and user profile
  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const profile = await getUserProfile();
      return profile || {};
    },
    retry: false,
  });

  // Fetch streak data
  const { data: streakData, refetch: refetchStreak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      return await getStreak();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Generate movie-inspired quote based on user's favorite movies - changes daily
  const getMovieQuote = () => {
    const movieQuotes = {
      "rocky": [
        "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
        "Every champion was once a contender who refused to give up.",
        "Going in one more round when you don't think you can - that's what makes all the difference.",
      ],
      "pursuit of happyness": [
        "Don't ever let somebody tell you you can't do something. You got a dream, you gotta protect it.",
        "You want something, go get it. Period.",
      ],
      "warrior": [
        "You were always going to win this fight. The question is, are you gonna be standing when it's over?",
        "I only got tonight to do this, so I will.",
      ],
      "david goggins": [
        "The only person who was going to turn my life around was me.",
        "Suffering is a test. That's all it is. Pain is the price of being alive.",
        "You are in danger of living a life so comfortable that you will die without ever realizing your true potential.",
      ],
      "kobe bryant": [
        "The moment you give up is the moment you let someone else win.",
        "Everything negative - pressure, challenges - is all an opportunity for me to rise.",
      ],
    };

    const inspirations = (onboardingData?.inspiringMovies || "") + " " + (onboardingData?.roleModels || "");
    const lowerInspiration = inspirations.toLowerCase();
    
    let relevantQuotes = [];
    Object.keys(movieQuotes).forEach(key => {
      if (lowerInspiration.includes(key)) {
        relevantQuotes = [...relevantQuotes, ...movieQuotes[key]];
      }
    });

    if (relevantQuotes.length === 0) {
      relevantQuotes = [
        "The only way to do great work is to love what you do.",
        "Don't watch the clock; do what it does. Keep going.",
        "The secret of getting ahead is getting started.",
      ];
    }

    // Use today's date as seed for consistent daily quote
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % relevantQuotes.length;
    
    return relevantQuotes[quoteIndex];
  };

  // Fetch daily check-in status
  const { data: checkInData, refetch: refetchCheckIn } = useQuery({
    queryKey: ["daily-checkin"],
    queryFn: async () => {
      const todayCheckIn = await getTodayCheckIn();
      return todayCheckIn ? { completed: true, ...todayCheckIn } : { completed: false };
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch current goals
  const { data: goals = [], refetch: refetchGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      return await getGoals();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      return await getActivities();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      return await addGoal(goalData);
    },
    onSuccess: async (newGoalData) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      
      // Schedule deadline notification if goal has a deadline
      if (newGoalData?.deadline) {
        await scheduleGoalDeadlineReminder(newGoalData);
      }
      
      setShowAddGoalModal(false);
      setNewGoal({ title: "", description: "", targetDate: "", why: "" });
    },
    onError: () => {
      Alert.alert("Error", "Failed to add goal");
    },
  });

  // Toggle goal completion
  const toggleGoalMutation = useMutation({
    mutationFn: async ({ id, completed }) => {
      return await updateGoal(id, { completed: !completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to update goal");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCheckIn(), refetchGoals(), refetchStreak()]);
    setRefreshing(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }
    if (!newGoal.why.trim()) {
      Alert.alert("Error", "Please explain why this goal matters to you");
      return;
    }
    addGoalMutation.mutate(newGoal);
  };

  const toggleGoal = (id, completed) => {
    toggleGoalMutation.mutate({ id, completed });
  };

  const handleCheckIn = () => {
    if (hasCompletedCheckIn) {
      Alert.alert("Already Complete", "You've already checked in today. Come back tomorrow to keep your streak alive.");
      return;
    }
    router.push("/checkin");
  };

  const handleWinterArcSpark = () => {
    const quote = getMovieQuote();
    
    Alert.alert("Winter Arc Reality Check", quote, [
      {
        text: "I hear you",
        style: "default",
      },
      {
        text: "Get to work",
        style: "default",
        onPress: () => console.log("User motivated"),
      },
    ]);
  };

  const handleUploadStreakPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload your streak photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        setStreakImage(photoUri);
        
        // Update streak with photo
        await updateStreak(photoUri);
        await refetchStreak();

        // Log activity
        await saveActivity({
          title: "Updated streak photo",
          type: "streak_photo",
        });

        // Schedule a harsh reminder for tomorrow
        await scheduleHarshReminder(24 * 60); // 24 hours from now

        Alert.alert("Photo Updated", "Your Winter Arc journey continues. Keep showing up.");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      Alert.alert("Error", "Failed to upload photo. Try again.");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const todayDate = format(new Date(), "EEEE, MMMM d");
  const hasCompletedCheckIn = checkInData?.completed || false;
  const activeGoals = goals.filter((g) => !g.completed);
  const currentStreak = streakData?.count || 0;
  const hasUserProfile = onboardingData && Object.keys(onboardingData).length > 0;

  // Show welcome message if not onboarded
  if (!hasUserProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={colors.statusBarStyle} />
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 40,
            paddingHorizontal: 24,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Flame size={64} color={colors.textPrimary} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
              marginTop: 24,
              marginBottom: 16,
            }}
          >
            Ready for Your{"\n"}Winter Arc?
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 18,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              lineHeight: 24,
              marginBottom: 40,
            }}
          >
            Time to get serious about your goals.{"\n"}No excuses. No shortcuts.
          </Text>
          <TouchableOpacity
            onPress={() => console.log("Navigate to onboarding")}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 32,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Start Winter Arc
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            marginBottom: 32,
          }}
        >
          <View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
                marginBottom: 4,
              }}
            >
              {todayDate}
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 28,
                fontFamily: "Inter_700Bold",
              }}
            >
              Winter Arc
            </Text>
          </View>

          {/* Winter Arc Spark Button */}
          <TouchableOpacity
            onPress={handleWinterArcSpark}
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Flame size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Daily Movie Quote Inspiration */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Flame size={16} color={colors.primary} />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Daily Spark
              </Text>
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 15,
                fontFamily: "Inter_400Regular",
                lineHeight: 24,
                fontStyle: "italic",
              }}
            >
              "{getMovieQuote()}"
            </Text>
          </View>
        </View>

        {/* Streak Card with Photo */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    marginBottom: 4,
                  }}
                >
                  Current Streak
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 48,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {currentStreak}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 18,
                      fontFamily: "Inter_500Medium",
                      marginLeft: 8,
                    }}
                  >
                    days
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleUploadStreakPhoto}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  overflow: "hidden",
                }}
              >
                {streakData?.photoUri || streakImage ? (
                  <Image
                    source={{ uri: streakData?.photoUri || streakImage }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 10,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Camera size={24} color={colors.textSecondary} />
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                        marginTop: 8,
                      }}
                    >
                      Add Photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
              }}
            >
              {currentStreak > 0
                ? `Keep the momentum going. Don't break the chain.`
                : `Start your Winter Arc journey. Check in daily to build your streak.`}
            </Text>
          </View>
        </View>

        {/* Daily Check-in Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleCheckIn}
            style={{
              backgroundColor: hasCompletedCheckIn
                ? colors.success
                : colors.cardBackground,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: hasCompletedCheckIn ? colors.success : colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: hasCompletedCheckIn
                        ? "rgba(255,255,255,0.2)"
                        : colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {hasCompletedCheckIn ? (
                      <CheckCircle size={20} color="white" />
                    ) : (
                      <Clock size={20} color={colors.textSecondary} />
                    )}
                  </View>
                  <Text
                    style={{
                      color: hasCompletedCheckIn ? "white" : colors.textPrimary,
                      fontSize: 18,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {hasCompletedCheckIn
                      ? "Daily Discipline ✓"
                      : "Daily Check-in"}
                  </Text>
                </View>
                <Text
                  style={{
                    color: hasCompletedCheckIn
                      ? "rgba(255,255,255,0.8)"
                      : colors.textSecondary,
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    paddingLeft: 44,
                  }}
                >
                  {hasCompletedCheckIn
                    ? "You showed up today. Keep the momentum."
                    : "How's your Winter Arc discipline today?"}
                </Text>
              </View>
              <Target
                size={20}
                color={hasCompletedCheckIn ? "white" : colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Winter Arc Goals Progress */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Winter Arc Goals
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowAddGoalModal(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>

          {activeGoals.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowAddGoalModal(true)}
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Target size={24} color={colors.textSecondary} />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                No Goals Set
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                }}
              >
                Winter Arc demands goals. Tap to add your first goal.
              </Text>
            </TouchableOpacity>
          ) : (
            <View>
              {activeGoals.map((goal, index) => (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: index < activeGoals.length - 1 ? 12 : 0,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontFamily: "Inter_600SemiBold",
                          marginBottom: 4,
                        }}
                      >
                        {goal.title}
                      </Text>
                      {goal.description && (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 13,
                            fontFamily: "Inter_400Regular",
                            marginBottom: 8,
                          }}
                        >
                          {goal.description}
                        </Text>
                      )}
                      {goal.why && (
                        <View
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                              fontFamily: "Inter_400Regular",
                              fontStyle: "italic",
                            }}
                          >
                            "{goal.why}"
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleGoal(goal.id, goal.completed)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.primary,
                        backgroundColor: goal.completed
                          ? colors.primary
                          : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {goal.completed && (
                        <CheckCircle size={14} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ marginBottom: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        Progress
                      </Text>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 12,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {Math.round(goal.progress || 0)}%
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.surface,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${goal.progress || 0}%`,
                          backgroundColor: colors.primary,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>

                  {/* Target Date */}
                  {goal.targetDate && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Calendar size={12} color={colors.textSecondary} />
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          fontFamily: "Inter_400Regular",
                          marginLeft: 6,
                        }}
                      >
                        Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Progress */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Recent Progress
          </Text>

          {recentActivity.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <TrendingUp size={24} color={colors.textSecondary} />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                No Recent Progress
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                }}
              >
                Your Winter Arc starts with the first action.
              </Text>
            </View>
          ) : (
            <View>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <View
                  key={activity.id}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom:
                      index < recentActivity.slice(0, 5).length - 1 ? 12 : 0,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <CheckCircle size={16} color={colors.primary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        marginBottom: 2,
                      }}
                    >
                      {activity.title}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                      }}
                    >
                      {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: insets.top + 16,
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              New Winter Arc Goal
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddGoalModal(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: insets.bottom + 120,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                }}
              >
                What's your goal? *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                }}
                placeholder="e.g., Read 12 books this winter"
                placeholderTextColor={colors.placeholder}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                autoFocus
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                }}
              >
                Why does this matter to you? *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  height: 80,
                  textAlignVertical: "top",
                }}
                placeholder="This will be your motivation when you need it most..."
                placeholderTextColor={colors.placeholder}
                value={newGoal.why}
                onChangeText={(text) => setNewGoal({ ...newGoal, why: text })}
                multiline
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                }}
              >
                Description (optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  height: 60,
                  textAlignVertical: "top",
                }}
                placeholder="Add any details about your goal..."
                placeholderTextColor={colors.placeholder}
                value={newGoal.description}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, description: text })
                }
                multiline
              />
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                }}
              >
                Target Date (optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.placeholder}
                value={newGoal.targetDate}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, targetDate: text })
                }
              />
            </View>

            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={addGoalMutation.isLoading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: addGoalMutation.isLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {addGoalMutation.isLoading ? "Creating..." : "Create Goal"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
