import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getUserProfile } from './storage';

const SCREEN_TIME_KEY = '@winter_arc_screen_time';
const APP_USAGE_KEY = '@winter_arc_app_usage';

// Lazy import notifications to avoid Expo Go error
let scheduleScreenTimeWarning = null;
try {
  const notificationsModule = require('./notifications');
  scheduleScreenTimeWarning = notificationsModule.scheduleScreenTimeWarning;
} catch (error) {
  console.log('Screen time warnings will be logged only (notifications disabled in Expo Go)');
}

class ScreenTimeMonitor {
  constructor() {
    this.currentApp = null;
    this.appStartTime = null;
    this.appStateSubscription = null;
    this.checkInterval = null;
  }

  async initialize() {
    // Track app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start monitoring session
    this.startSession();
    
    // Check limits every 5 minutes
    this.checkInterval = setInterval(() => this.checkLimits(), 5 * 60 * 1000);
    
    console.log('📱 Screen Time Monitor: Initialized');
  }

  handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active') {
      this.startSession();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.endSession();
    }
  };

  startSession() {
    this.currentApp = 'Winter Arc';
    this.appStartTime = new Date();
  }

  async endSession() {
    if (this.appStartTime) {
      const duration = (new Date() - this.appStartTime) / 1000 / 60; // minutes
      await this.logUsage('Winter Arc', duration);
      this.appStartTime = null;
    }
  }

  async logUsage(appName, durationMinutes) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageData = await this.getTodayUsage();
      
      if (!usageData[appName]) {
        usageData[appName] = 0;
      }
      
      usageData[appName] += durationMinutes;
      
      await AsyncStorage.setItem(
        `${APP_USAGE_KEY}_${today}`,
        JSON.stringify(usageData)
      );
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }

  async getTodayUsage() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await AsyncStorage.getItem(`${APP_USAGE_KEY}_${today}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  async getWeekUsage() {
    try {
      const usage = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = await AsyncStorage.getItem(`${APP_USAGE_KEY}_${dateStr}`);
        const dayUsage = data ? JSON.parse(data) : {};
        
        const totalMinutes = Object.values(dayUsage).reduce((sum, min) => sum + min, 0);
        
        usage.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          totalMinutes,
          apps: dayUsage,
        });
      }
      
      return usage;
    } catch (error) {
      console.error('Failed to get week usage:', error);
      return [];
    }
  }

  async checkLimits() {
    try {
      const profile = await getUserProfile();
      if (!profile?.distractionApps) return;

      const todayUsage = await this.getTodayUsage();
      
      for (const app of profile.distractionApps) {
        const usage = todayUsage[app.name] || 0;
        const limit = app.limit || 60; // Default 60 minutes
        
        if (usage >= limit) {
          if (scheduleScreenTimeWarning) {
            await scheduleScreenTimeWarning(app.name, limit);
          }
          console.warn(`⚠️ Screen time limit exceeded for ${app.name}: ${usage.toFixed(0)}/${limit} minutes`);
        }
      }
    } catch (error) {
      console.error('Failed to check limits:', error);
    }
  }

  async getAppBreakdown() {
    try {
      const todayUsage = await this.getTodayUsage();
      const profile = await getUserProfile();
      
      const distractionApps = profile?.distractionApps || [];
      
      return Object.entries(todayUsage).map(([appName, minutes]) => {
        const appConfig = distractionApps.find(a => a.name === appName);
        const limit = appConfig?.limit || 60;
        const percentage = (minutes / limit) * 100;
        
        return {
          name: appName,
          minutes: Math.round(minutes),
          limit,
          percentage: Math.min(percentage, 100),
          exceeded: minutes >= limit,
        };
      }).sort((a, b) => b.minutes - a.minutes);
    } catch (error) {
      console.error('Failed to get app breakdown:', error);
      return [];
    }
  }

  async logManualUsage(appName, durationMinutes) {
    // Allow manual logging for apps tracked outside of Winter Arc
    await this.logUsage(appName, durationMinutes);
    await this.checkLimits();
  }

  async getTotalScreenTime() {
    try {
      const todayUsage = await this.getTodayUsage();
      return Object.values(todayUsage).reduce((sum, min) => sum + min, 0);
    } catch (error) {
      return 0;
    }
  }

  async getScreenTimeStats() {
    try {
      const weekUsage = await this.getWeekUsage();
      const todayUsage = await this.getTodayUsage();
      
      const totalToday = Object.values(todayUsage).reduce((sum, min) => sum + min, 0);
      const weekTotal = weekUsage.reduce((sum, day) => sum + day.totalMinutes, 0);
      const weekAverage = weekTotal / 7;
      
      // Calculate trend (comparing last 3 days vs previous 4 days)
      const recent = weekUsage.slice(-3).reduce((sum, day) => sum + day.totalMinutes, 0) / 3;
      const previous = weekUsage.slice(0, 4).reduce((sum, day) => sum + day.totalMinutes, 0) / 4;
      const trend = recent > previous ? 'increasing' : recent < previous ? 'decreasing' : 'stable';
      
      return {
        today: Math.round(totalToday),
        weekTotal: Math.round(weekTotal),
        weekAverage: Math.round(weekAverage),
        trend,
        dailyData: weekUsage,
      };
    } catch (error) {
      console.error('Failed to get screen time stats:', error);
      return {
        today: 0,
        weekTotal: 0,
        weekAverage: 0,
        trend: 'stable',
        dailyData: [],
      };
    }
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export const screenTimeMonitor = new ScreenTimeMonitor();
