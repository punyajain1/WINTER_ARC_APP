import { NativeModules, Platform } from 'react-native';

const { UsageStatsModule } = NativeModules;

export interface ScreenTimeData {
  milliseconds: number;
  minutes: number;
  hours: number;
}

export interface AppUsageDetail {
  packageName: string;
  foregroundTimeMs: number;
  foregroundTimeMinutes: number;
  lastTimeUsed: number;
  launchCount?: number;
}

/**
 * Android UsageStatsManager wrapper for screen time tracking
 */
export class AndroidUsageStats {
  /**
   * Check if app has usage permission (Android only)
   */
  static async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !UsageStatsModule) return false;
    try {
      return await UsageStatsModule.hasUsagePermission();
    } catch (e) {
      console.error('Permission check failed:', e);
      return false;
    }
  }

  /**
   * Request permission by opening Usage Access settings
   */
  static async requestPermission(): Promise<void> {
    if (Platform.OS !== 'android' || !UsageStatsModule) return;
    try {
      await UsageStatsModule.openUsageSettings();
    } catch (e) {
      console.error('Failed to open settings:', e);
    }
  }

  /**
   * Get screen time for YOUR app today
   */
  static async getTodayScreenTime(): Promise<ScreenTimeData> {
    if (Platform.OS !== 'android' || !UsageStatsModule) {
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      return await UsageStatsModule.getAppScreenTime(
        startOfDay.getTime(),
        now
      );
    } catch (e) {
      console.error('Failed to get screen time:', e);
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }
  }

  /**
   * Get screen time for a specific time range
   */
  static async getScreenTime(startTime: Date, endTime: Date): Promise<ScreenTimeData> {
    if (Platform.OS !== 'android' || !UsageStatsModule) {
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }

    try {
      return await UsageStatsModule.getAppScreenTime(
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (e) {
      console.error('Failed to get screen time:', e);
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }
  }

  /**
   * Get screen time for all apps in a time range
   */
  static async getAllAppsUsage(
    startTime: Date,
    endTime: Date
  ): Promise<Record<string, number>> {
    if (Platform.OS !== 'android' || !UsageStatsModule) return {};

    try {
      return await UsageStatsModule.getAllAppsScreenTime(
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (e) {
      console.error('Failed to get all apps usage:', e);
      return {};
    }
  }

  /**
   * Get detailed usage for specific apps (e.g., distraction apps)
   */
  static async getDistractionAppsUsage(
    packageNames: string[],
    startTime: Date,
    endTime: Date
  ): Promise<AppUsageDetail[]> {
    if (Platform.OS !== 'android' || !UsageStatsModule) return [];

    try {
      return await UsageStatsModule.getAppsUsageDetails(
        packageNames,
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (e) {
      console.error('Failed to get app details:', e);
      return [];
    }
  }

  /**
   * Get today's usage for all apps
   */
  static async getTodayAllAppsUsage(): Promise<Record<string, number>> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    return this.getAllAppsUsage(startOfDay, now);
  }
}

/**
 * Common app package names for distraction tracking
 */
export const COMMON_DISTRACTION_APPS = {
  instagram: 'com.instagram.android',
  facebook: 'com.facebook.katana',
  twitter: 'com.twitter.android',
  tiktok: 'com.zhiliaoapp.musically',
  youtube: 'com.google.android.youtube',
  reddit: 'com.reddit.frontpage',
  snapchat: 'com.snapchat.android',
  whatsapp: 'com.whatsapp',
  telegram: 'org.telegram.messenger',
  netflix: 'com.netflix.mediaclient',
  spotify: 'com.spotify.music',
  discord: 'com.discord',
} as const;
