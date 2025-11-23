import { useColorScheme } from "react-native";

// Winter Arc theme - minimalistic black and white
export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Core Winter Arc colors - cozy dark minimalism
    background: isDark ? "#0A0A0A" : "#FAFAFA",
    surface: isDark ? "#141414" : "#F8F9FA",
    cardBackground: isDark ? "#1A1A1A" : "#FFFFFF",

    // Text - cozy but sharp
    textPrimary: isDark ? "#F5F5F5" : "#0A0A0A",
    textSecondary: isDark ? "#A0A0A0" : "#666666",
    textTertiary: isDark ? "#606060" : "#999999",

    // Winter Arc accent - deep black for focus
    primary: isDark ? "#1A1A1A" : "#000000",
    primaryText: "#FFFFFF",
    secondary: isDark ? "#2A2A2A" : "#E5E7EB",

    // Status colors - minimal but clear
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    error: "#EF4444",

    // Borders and structure - softer edges
    border: isDark ? "#2A2A2A" : "#E5E7EB",
    cardShadow: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)",
    cardBorder: isDark ? "#2A2A2A" : "#E5E7EB",

    // Tab bar - cozy and focused
    tabBarBackground: isDark ? "#0A0A0A" : "#FFFFFF",
    tabBarBorder: isDark ? "#2A2A2A" : "#E5E7EB",
    tabBarActive: isDark ? "#F5F5F5" : "#000000",
    tabBarInactive: isDark ? "#606060" : "#999999",

    // Buttons - strong presence
    buttonPrimary: isDark ? "#F5F5F5" : "#000000",
    buttonSecondary: isDark ? "#1A1A1A" : "#F8F9FA",
    buttonText: isDark ? "#0A0A0A" : "#FFFFFF",

    // Inputs - subtle and clean
    inputBackground: isDark ? "#141414" : "#F8F9FA",
    inputBorder: isDark ? "#2A2A2A" : "#E5E7EB",
    placeholder: isDark ? "#606060" : "#999999",

    // Progress - smooth gradients
    progressActive: isDark ? "#F5F5F5" : "#000000",
    progressPartial: isDark ? "#3A3A3A" : "#CCCCCC",
    progressInactive: isDark ? "#1F1F1F" : "#F0F0F0",

    // Status bar
    statusBarStyle: isDark ? "light" : "dark",
  };

  return { colors, isDark };
};

// Winter Arc themed styles - minimal and focused
export const getThemedStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  surface: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
