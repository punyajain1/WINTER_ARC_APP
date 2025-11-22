import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Smartphone,
  Flame,
  CheckCircle,
  TrendingDown,
  Award,
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
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { LineChart, BarChart, ProgressChart } from "react-native-chart-kit";
import { getCheckIns, getGoals, getStreak, getActivities } from "@/utils/storage";
import { screenTimeMonitor } from "@/utils/screenTime";

const { width } = Dimensions.get("window");

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Fetch all data for analytics
  const { data: checkIns = [], refetch: refetchCheckIns } = useQuery({
    queryKey: ["checkins-analytics"],
    queryFn: getCheckIns,
  });

  const { data: goals = [], refetch: refetchGoals } = useQuery({
    queryKey: ["goals-analytics"],
    queryFn: getGoals,
  });

  const { data: streak, refetch: refetchStreak } = useQuery({
    queryKey: ["streak-analytics"],
    queryFn: getStreak,
  });

  const { data: screenTimeStats, refetch: refetchScreenTime } = useQuery({
    queryKey: ["screen-time-stats"],
    queryFn: async () => await screenTimeMonitor.getScreenTimeStats(),
  });

  const { data: appBreakdown = [], refetch: refetchAppBreakdown } = useQuery({
    queryKey: ["app-breakdown"],
    queryFn: async () => await screenTimeMonitor.getAppBreakdown(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCheckIns(),
      refetchGoals(),
      refetchStreak(),
      refetchScreenTime(),
      refetchAppBreakdown(),
    ]);
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  // Calculate analytics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Check-in consistency (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const checkInsByDate = checkIns.reduce((acc, checkIn) => {
    const date = format(new Date(checkIn.timestamp), 'yyyy-MM-dd');
    acc[date] = true;
    return acc;
  }, {});

  const checkInData = last7Days.map(date => checkInsByDate[date] ? 1 : 0);
  const checkInRate = (checkInData.filter(v => v === 1).length / 7) * 100;

  // Screen time data
  const screenTimeDailyData = screenTimeStats?.dailyData || [];
  const screenTimeLabels = screenTimeDailyData.map(d => d.day);
  const screenTimeValues = screenTimeDailyData.map(d => d.totalMinutes);

  // Chart config
  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Icon size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontFamily: "Inter_500Medium",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontFamily: "Inter_700Bold",
            }}
          >
            {value}
          </Text>
        </View>
        {trend && (
          <View style={{ alignItems: "flex-end" }}>
            {trend === "up" ? (
              <TrendingUp size={20} color="#10b981" />
            ) : trend === "down" ? (
              <TrendingDown size={20} color="#ef4444" />
            ) : null}
          </View>
        )}
      </View>
      {subtitle && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            fontFamily: "Inter_400Regular",
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const ChartCard = ({ title, children }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontFamily: "Inter_600SemiBold",
          marginBottom: 16,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              marginBottom: 4,
            }}
          >
            Analytics
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
            }}
          >
            Track your Winter Arc progress
          </Text>
        </View>

        {/* Key Metrics */}
        <StatCard
          icon={Flame}
          title="Current Streak"
          value={`${streak?.count || 0} days`}
          subtitle={streak?.lastUpdated ? `Last updated ${format(new Date(streak.lastUpdated), 'MMM d')}` : "Start your streak today"}
          trend={streak?.count > 0 ? "up" : null}
        />

        <StatCard
          icon={Target}
          title="Goal Completion"
          value={`${completedGoals}/${totalGoals}`}
          subtitle={`${Math.round(goalCompletionRate)}% completion rate`}
          trend={goalCompletionRate > 50 ? "up" : goalCompletionRate > 0 ? "down" : null}
        />

        <StatCard
          icon={CheckCircle}
          title="Check-in Consistency"
          value={`${checkInData.filter(v => v === 1).length}/7 days`}
          subtitle={`${Math.round(checkInRate)}% this week`}
          trend={checkInRate >= 70 ? "up" : "down"}
        />

        <StatCard
          icon={Clock}
          title="Screen Time Today"
          value={`${Math.floor((screenTimeStats?.today || 0) / 60)}h ${(screenTimeStats?.today || 0) % 60}m`}
          subtitle={`Week average: ${Math.floor((screenTimeStats?.weekAverage || 0) / 60)}h ${(screenTimeStats?.weekAverage || 0) % 60}m`}
          trend={screenTimeStats?.trend === "decreasing" ? "up" : screenTimeStats?.trend === "increasing" ? "down" : null}
        />

        {/* Check-in Streak Chart */}
        {checkInData.length > 0 && (
          <ChartCard title="Check-in Activity (7 Days)">
            <BarChart
              data={{
                labels: last7Days.map(d => format(parseISO(d), 'EEE')),
                datasets: [{ data: checkInData }],
              }}
              width={width - 80}
              height={200}
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.7,
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
              showValuesOnTopOfBars
              fromZero
            />
          </ChartCard>
        )}

        {/* Screen Time Chart */}
        {screenTimeValues.length > 0 && (
          <ChartCard title="Screen Time Trend">
            <LineChart
              data={{
                labels: screenTimeLabels,
                datasets: [{ data: screenTimeValues.length > 0 ? screenTimeValues : [0] }],
              }}
              width={width - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
              yAxisSuffix=" min"
            />
          </ChartCard>
        )}

        {/* App Usage Breakdown */}
        {appBreakdown.length > 0 && (
          <ChartCard title="App Usage Today">
            {appBreakdown.map((app, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottomWidth: index < appBreakdown.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Smartphone size={16} color={app.exceeded ? "#ef4444" : colors.textPrimary} style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        color: app.exceeded ? "#ef4444" : colors.textPrimary,
                        fontSize: 14,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {app.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {app.minutes} / {app.limit} min
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.background,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${app.percentage}%`,
                      backgroundColor: app.exceeded ? "#ef4444" : colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))}
          </ChartCard>
        )}

        {/* Goals Progress */}
        {totalGoals > 0 && (
          <ChartCard title="Goals Overview">
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 10,
                  borderColor: colors.primary + "30",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                  position: "relative",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 10,
                    borderColor: colors.primary,
                    borderRightColor: "transparent",
                    borderBottomColor: "transparent",
                    transform: [{ rotate: `${(goalCompletionRate / 100) * 360}deg` }],
                  }}
                />
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 32,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {Math.round(goalCompletionRate)}%
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 4,
                }}
              >
                {completedGoals} of {totalGoals} goals completed
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {totalGoals - completedGoals} goals remaining
              </Text>
            </View>
          </ChartCard>
        )}

        {/* Insights */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Award size={24} color={colors.primary} style={{ marginRight: 12 }} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Winter Arc Insights
            </Text>
          </View>

          {checkInRate >= 80 && (
            <Text
              style={{
                color: "#10b981",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ✓ Excellent check-in consistency! Keep it up.
            </Text>
          )}

          {goalCompletionRate >= 50 && (
            <Text
              style={{
                color: "#10b981",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ✓ You're crushing your goals! Over halfway there.
            </Text>
          )}

          {streak?.count >= 7 && (
            <Text
              style={{
                color: "#10b981",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ✓ 7-day streak achieved! Consistency is key.
            </Text>
          )}

          {screenTimeStats?.trend === "decreasing" && (
            <Text
              style={{
                color: "#10b981",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ✓ Screen time decreasing. Great discipline!
            </Text>
          )}

          {checkInRate < 50 && (
            <Text
              style={{
                color: "#ef4444",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ! Low check-in rate. Daily reflection is crucial.
            </Text>
          )}

          {screenTimeStats?.trend === "increasing" && (
            <Text
              style={{
                color: "#ef4444",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ! Screen time increasing. Time to refocus.
            </Text>
          )}

          {appBreakdown.some(app => app.exceeded) && (
            <Text
              style={{
                color: "#ef4444",
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                marginBottom: 8,
              }}
            >
              ! You've exceeded screen time limits on some apps.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
