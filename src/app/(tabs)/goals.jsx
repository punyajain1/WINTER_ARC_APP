import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  X,
} from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { useState } from "react";
import { useTheme } from "@/utils/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { getGoals, addGoal, updateGoal, deleteGoal } from "@/utils/storage";
import { scheduleGoalDeadlineReminder } from "@/utils/notifications";

export default function Goals() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetDate: "",
    why: "",
  });

  const queryClient = useQueryClient();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_600SemiBold,
  });

  // Fetch goals
  const { data: goals = [], refetch } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      return await getGoals();
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
      
      setShowAddModal(false);
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
    await refetch();
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
    toggleGoalMutation.mutate({ id, completed: !completed });
  };

  if (!fontsLoaded) {
    return null;
  }

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

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
                color: colors.textPrimary,
                fontSize: 28,
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              Goals
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
            >
              {activeGoals.length} active, {completedGoals.length} completed
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 16,
            }}
          >
            Active Goals
          </Text>

          {activeGoals.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Target size={28} color={colors.textSecondary} />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                No Active Goals
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Set your first goal to start your alignment journey. What
                matters most to you?
              </Text>
            </View>
          ) : (
            <View>
              {activeGoals.map((goal, index) => (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: index < activeGoals.length - 1 ? 16 : 0,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
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
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 18,
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
                            fontSize: 14,
                            fontFamily: "Inter_400Regular",
                            lineHeight: 18,
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
                            padding: 12,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 13,
                              fontFamily: "Inter_500Medium",
                              marginBottom: 4,
                            }}
                          >
                            Why this matters:
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 13,
                              fontFamily: "Inter_400Regular",
                              fontStyle: "italic",
                              lineHeight: 16,
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
                  <View style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        Progress
                      </Text>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
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
                        marginTop: 8,
                      }}
                    >
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          fontFamily: "Inter_400Regular",
                          marginLeft: 8,
                        }}
                      >
                        Target:{" "}
                        {format(new Date(goal.targetDate), "MMM d, yyyy")}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={{ paddingHorizontal: 24 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
                marginBottom: 16,
              }}
            >
              Completed Goals
            </Text>

            <View>
              {completedGoals.map((goal, index) => (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: index < completedGoals.length - 1 ? 12 : 0,
                    borderWidth: 1,
                    borderColor: colors.success,
                    opacity: 0.8,
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
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontFamily: "Inter_600SemiBold",
                          textDecorationLine: "line-through",
                          textDecorationColor: colors.success,
                        }}
                      >
                        {goal.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.success,
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          marginTop: 4,
                        }}
                      >
                        Completed{" "}
                        {goal.completedAt
                          ? format(new Date(goal.completedAt), "MMM d, yyyy")
                          : "recently"}
                      </Text>
                    </View>

                    <CheckCircle size={20} color={colors.success} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
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
              New Goal
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
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
                placeholder="e.g., Read 12 books this year"
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
