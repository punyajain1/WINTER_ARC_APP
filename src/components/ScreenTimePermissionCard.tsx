import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { AndroidUsageStats } from '@/utils/androidUsageStats';
import { useTheme } from '@/utils/theme';

export function ScreenTimePermissionCard() {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setChecking(true);
    const granted = await AndroidUsageStats.hasPermission();
    setHasPermission(granted);
    setChecking(false);
  };

  const requestPermission = async () => {
    await AndroidUsageStats.requestPermission();
    
    Alert.alert(
      "📊 Enable Usage Access",
      "To track screen time accurately:\n\n1. Find 'Winter Arc' in the list\n2. Toggle the switch ON\n3. Return to the app",
      [
        {
          text: "OK",
          onPress: () => {
            // Re-check after user returns
            setTimeout(checkPermission, 2000);
          }
        }
      ]
    );
  };

  if (checking) {
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  if (hasPermission) {
    return (
      <View style={[styles.card, styles.successCard, { backgroundColor: colors.success + '20' }]}>
        <Text style={[styles.successIcon]}>✅</Text>
        <Text style={[styles.title, { color: colors.success }]}>
          Screen Time Tracking Active
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Getting real usage data from Android
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
      <Text style={styles.warningIcon}>⚠️</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Enable Screen Time Tracking
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Grant Usage Access to track your screen time and get personalized insights
      </Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={requestPermission}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          Enable Tracking
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={checkPermission}
      >
        <Text style={[styles.refreshText, { color: colors.textSecondary }]}>
          I've already enabled it
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    alignItems: 'center',
  },
  successCard: {
    borderWidth: 1,
  },
  warningCard: {
    borderWidth: 2,
  },
  successIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  refreshButton: {
    marginTop: 12,
    padding: 8,
  },
  refreshText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  text: {
    fontSize: 14,
  },
});
