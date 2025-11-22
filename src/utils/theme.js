import { useColorScheme } from "react-native";

// Winter Arc theme - minimalistic black and white
export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Core Winter Arc colors - pure minimalism
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#111111" : "#F8F9FA",
    cardBackground: isDark ? "#111111" : "#FFFFFF",

    // Text - harsh but readable
    textPrimary: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#888888" : "#666666",
    textTertiary: isDark ? "#555555" : "#999999",

    // Winter Arc accent - pure black for focus
    primary: "#000000",
    primaryText: "#FFFFFF",
    secondary: isDark ? "#333333" : "#E5E7EB",

    // Status colors - minimal but clear
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    error: "#EF4444",

    // Borders and structure
    border: isDark ? "#222222" : "#E5E7EB",
    cardShadow: isDark ? "#000000" : "#000000",
    cardBorder: isDark ? "#222222" : "#E5E7EB",

    // Tab bar - clean and focused
    tabBarBackground: isDark ? "#000000" : "#FFFFFF",
    tabBarBorder: isDark ? "#222222" : "#E5E7EB",
    tabBarActive: "#000000",
    tabBarInactive: isDark ? "#666666" : "#999999",

    // Buttons - strong and decisive
    buttonPrimary: "#000000",
    buttonSecondary: isDark ? "#111111" : "#F8F9FA",
    buttonText: isDark ? "#FFFFFF" : "#000000",

    // Inputs - clean and minimal
    inputBackground: isDark ? "#111111" : "#F8F9FA",
    inputBorder: isDark ? "#222222" : "#E5E7EB",
    placeholder: isDark ? "#555555" : "#999999",

    // Progress - Winter Arc focused
    progressActive: "#000000",
    progressPartial: isDark ? "#333333" : "#CCCCCC",
    progressInactive: isDark ? "#1A1A1A" : "#F0F0F0",

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
