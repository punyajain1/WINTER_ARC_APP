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
  BookHeart,
  Plus,
  Heart,
  Trophy,
  Mountain,
  Handshake,
  X,
  Sparkles,
  ChevronDown,
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
import { getUserProfile, getCheckIns, getActivities, getStreak } from "@/utils/storage";

const STORY_TYPES = [
  {
    id: "dream",
    label: "Dream",
    icon: Heart,
    color: "#FF6B6B",
    description: "Your aspirations and desires",
  },
  {
    id: "achievement",
    label: "Achievement",
    icon: Trophy,
    color: "#4ECDC4",
    description: "Wins and victories",
  },
  {
    id: "struggle",
    label: "Struggle",
    icon: Mountain,
    color: "#95A5A6",
    description: "Challenges you've faced",
  },
  {
    id: "promise",
    label: "Promise",
    icon: Handshake,
    color: "#F39C12",
    description: "Commitments to yourself",
  },
];

export default function Story() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    type: "dream",
  });

  const queryClient = useQueryClient();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_600SemiBold,
  });

  // Fetch user profile for their story
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => await getUserProfile(),
    retry: false,
  });

  // Fetch check-ins to show journey progress
  const { data: checkIns = [], refetch } = useQuery({
    queryKey: ["check-ins-history"],
    queryFn: async () => await getCheckIns(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => await getActivities(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch streak
  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => await getStreak(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getFilteredEntries = () => {
    if (selectedFilter === "all") return storyEntries;
    return storyEntries.filter((entry) => entry.type === selectedFilter);
  };

  const getTypeConfig = (type) => {
    return STORY_TYPES.find((t) => t.id === type) || STORY_TYPES[0];
  };

  const getEntryCounts = () => {
    return STORY_TYPES.reduce((acc, type) => {
      acc[type.id] = storyEntries.filter(
        (entry) => entry.type === type.id,
      ).length;
      return acc;
    }, {});
  };

  if (!fontsLoaded) {
    return null;
  }

  const filteredEntries = getFilteredEntries();
  const entryCounts = getEntryCounts();

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
            marginBottom: 24,
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
              Your Story
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
            >
              {storyEntries.length} entries that shape who you are
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

        {/* Filter Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 16,
          }}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            style={{
              backgroundColor:
                selectedFilter === "all" ? colors.primary : colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginRight: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Sparkles
              size={16}
              color={selectedFilter === "all" ? "white" : colors.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color:
                  selectedFilter === "all" ? "white" : colors.textSecondary,
                fontSize: 14,
                fontFamily: "Inter_500Medium",
              }}
            >
              All ({storyEntries.length})
            </Text>
          </TouchableOpacity>

          {STORY_TYPES.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedFilter === type.id;
            const count = entryCounts[type.id] || 0;

            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedFilter(type.id)}
                style={{
                  backgroundColor: isSelected ? type.color : colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <IconComponent
                  size={16}
                  color={isSelected ? "white" : colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: isSelected ? "white" : colors.textSecondary,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {type.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Story Entries */}
        <View style={{ paddingHorizontal: 24 }}>
          {filteredEntries.length === 0 ? (
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
                <BookHeart size={28} color={colors.textSecondary} />
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
                {selectedFilter === "all"
                  ? "Your story starts here"
                  : `No ${getTypeConfig(selectedFilter).label.toLowerCase()}s yet`}
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
                {selectedFilter === "all"
                  ? "Add your first dream, achievement, struggle, or promise to begin building your personal story."
                  : `Add your first ${getTypeConfig(selectedFilter).label.toLowerCase()} to capture this part of your journey.`}
              </Text>
            </View>
          ) : (
            <View>
              {filteredEntries.map((entry, index) => {
                const typeConfig = getTypeConfig(entry.type);
                const IconComponent = typeConfig.icon;

                return (
                  <View
                    key={entry.id}
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: index < filteredEntries.length - 1 ? 16 : 0,
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
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: typeConfig.color + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <IconComponent size={20} color={typeConfig.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: typeConfig.color,
                              fontSize: 12,
                              fontFamily: "Inter_600SemiBold",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginRight: 8,
                            }}
                          >
                            {typeConfig.label}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                              fontFamily: "Inter_400Regular",
                            }}
                          >
                            {format(new Date(entry.createdAt), "MMM d, yyyy")}
                          </Text>
                        </View>

                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 18,
                            fontFamily: "Inter_600SemiBold",
                            marginBottom: 8,
                            lineHeight: 22,
                          }}
                        >
                          {entry.title}
                        </Text>

                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 15,
                            fontFamily: "Inter_400Regular",
                            lineHeight: 20,
                          }}
                        >
                          {entry.content}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Entry Modal */}
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
              Add to Your Story
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
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 12,
                }}
              >
                What type of story is this?
              </Text>

              <View>
                {STORY_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = newEntry.type === type.id;

                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() =>
                        setNewEntry({ ...newEntry, type: type.id })
                      }
                      style={{
                        backgroundColor: isSelected
                          ? type.color + "20"
                          : colors.surface,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? type.color : colors.border,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isSelected
                            ? type.color
                            : colors.background,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <IconComponent
                          size={16}
                          color={isSelected ? "white" : type.color}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontFamily: "Inter_600SemiBold",
                            marginBottom: 2,
                          }}
                        >
                          {type.label}
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 13,
                            fontFamily: "Inter_400Regular",
                          }}
                        >
                          {type.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                Title *
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
                placeholder="Give your story a title..."
                placeholderTextColor={colors.placeholder}
                value={newEntry.title}
                onChangeText={(text) =>
                  setNewEntry({ ...newEntry, title: text })
                }
                autoFocus
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
                Your story *
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
                  height: 120,
                  textAlignVertical: "top",
                }}
                placeholder="Tell your story... This will help remind you of your journey when you need motivation."
                placeholderTextColor={colors.placeholder}
                value={newEntry.content}
                onChangeText={(text) =>
                  setNewEntry({ ...newEntry, content: text })
                }
                multiline
              />
            </View>

            <TouchableOpacity
              onPress={handleAddEntry}
              disabled={addEntryMutation.isLoading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: addEntryMutation.isLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {addEntryMutation.isLoading ? "Adding..." : "Add to Story"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
