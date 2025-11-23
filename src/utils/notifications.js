import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from './storage';
import { generateHarshReminder } from './ai';
import Constants from 'expo-constants';
import { getDistractionPatterns, isHighRiskTime } from './patternAnalytics';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export async function registerForPushNotifications() {
  if (isExpoGo) {
    console.warn('⚠️ Push notifications require a development build. See NOTIFICATIONS_SETUP.md');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    return finalStatus;
  } catch (error) {
    console.warn('Notification permission error:', error.message);
    return null;
  }
}

// Schedule daily check-in reminder
export async function scheduleDailyCheckInReminder(hour = 20, minute = 0) {
  if (isExpoGo) {
    console.log('📅 Daily check-in reminder scheduled (dev build required for actual notifications)');
    return null;
  }

  try {
    const profile = await getUserProfile();
    
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily reminder at specified time
    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Winter Arc Check-In',
        body: profile?.name 
          ? `${profile.name}, how did today go? Time to reflect on your progress.`
          : 'Time for your daily check-in. How did today go?',
        data: { type: 'daily-checkin' },
        sound: true,
      },
      trigger,
    });

    await AsyncStorage.setItem('checkin-notification-id', notificationId);
    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule check-in reminder:', error.message);
    return null;
  }
}

// Schedule harsh motivational reminder
export async function scheduleHarshReminder(delayMinutes = 60) {
  if (isExpoGo) {
    console.log('🔥 Harsh reminder scheduled (dev build required for actual notifications)');
    return null;
  }

  const profile = await getUserProfile();
  
  try {
    // Get AI-generated harsh reminder
    const reminder = await generateHarshReminder(profile);

    const trigger = {
      seconds: delayMinutes * 60,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Reality Check',
        body: reminder,
        data: { type: 'harsh-reminder' },
        sound: true,
        priority: 'high',
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule harsh reminder:', error);
    // Fallback to generic harsh reminder
    const trigger = {
      seconds: delayMinutes * 60,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Reality Check',
        body: 'Stop scrolling. Start doing. Your goals won\'t achieve themselves.',
        data: { type: 'harsh-reminder' },
        sound: true,
      },
      trigger,
    });
  }
}

// Schedule goal deadline reminder
export async function scheduleGoalDeadlineReminder(goal) {
  if (isExpoGo) {
    console.log('⚠️ Goal deadline reminder scheduled (dev build required for actual notifications)');
    return null;
  }

  if (!goal.deadline) return null;

  try {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline <= 0) return null;

    // Schedule reminder 1 day before deadline
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(20, 0, 0, 0);

    if (reminderDate <= now) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Goal Deadline Tomorrow',
        body: `"${goal.title}" is due tomorrow. Are you ready?`,
        data: { type: 'goal-deadline', goalId: goal.id },
        sound: true,
      },
      trigger: {
        date: reminderDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule goal deadline reminder:', error.message);
    return null;
  }
}

// Schedule screen time warning
export async function scheduleScreenTimeWarning(appName, limitMinutes) {
  if (isExpoGo) {
    console.log(`📱 Screen time warning for ${appName} (dev build required for actual notifications)`);
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📱 Screen Time Alert',
        body: `You've been on ${appName} for too long. Time to get back to your Winter Arc.`,
        data: { type: 'screen-time-warning', app: appName },
        sound: true,
        priority: 'high',
      },
      trigger: null, // Immediate notification
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to send screen time warning:', error.message);
    return null;
  }
}

// Schedule weekly streak reminder
export async function scheduleWeeklyStreakReminder() {
  if (isExpoGo) {
    console.log('🔥 Weekly streak reminder scheduled (dev build required for actual notifications)');
    return null;
  }

  try {
    const profile = await getUserProfile();

    const trigger = {
      weekday: 1, // Monday
      hour: 9,
      minute: 0,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Weekly Streak Check',
        body: profile?.name
          ? `${profile.name}, keep your streak alive! Upload today's photo.`
          : 'Don\'t break your streak! Upload today\'s photo.',
        data: { type: 'weekly-streak' },
        sound: true,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule weekly streak reminder:', error.message);
    return null;
  }
}

// Cancel specific notification
export async function cancelNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Handle notification response (when user taps notification)
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Handle notification received while app is in foreground
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

// Initialize default notifications
export async function initializeNotifications() {
  if (isExpoGo) {
    console.warn('⚠️ Running in Expo Go - notifications disabled. Build a development build to enable notifications.');
    console.warn('📖 See NOTIFICATIONS_SETUP.md for instructions');
    return false;
  }

  try {
    const status = await registerForPushNotifications();
    
    if (status === 'granted') {
      // Schedule daily check-in reminder at 8 PM
      await scheduleDailyCheckInReminder(20, 0);
      
      // Schedule weekly streak reminder on Mondays at 9 AM
      await scheduleWeeklyStreakReminder();
      
      // Schedule pattern-based nudges
      await schedulePatternBasedNudges();
      
      console.log('✅ Notifications initialized');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to initialize notifications:', error.message);
    return false;
  }
}

// Schedule smart nudges based on user's distraction patterns
export async function schedulePatternBasedNudges() {
  if (isExpoGo) {
    console.log('🧠 Pattern-based nudges scheduled (dev build required for actual notifications)');
    return null;
  }

  try {
    const patterns = await getDistractionPatterns();
    
    if (!patterns || patterns.totalEvents < 5) {
      console.log('Not enough data for pattern-based nudges yet');
      return null;
    }

    // Cancel existing pattern nudges
    const key = 'pattern-nudge-ids';
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      const ids = JSON.parse(existing);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }

    const profile = await getUserProfile();
    const peakHour = patterns.peakDistractionHour;
    
    // Schedule nudge 30 minutes before peak distraction time
    const nudgeHour = peakHour === 0 ? 23 : peakHour - 1;
    const nudgeMinute = 30;

    const messages = [
      `You usually lose focus around ${peakHour > 12 ? peakHour - 12 : peakHour}${peakHour >= 12 ? 'pm' : 'am'}. Stay locked in.`,
      `High risk time approaching. Your biggest distraction: ${patterns.mostDistractingApp}. Don't slip.`,
      `${peakHour > 12 ? peakHour - 12 : peakHour}${peakHour >= 12 ? 'pm' : 'am'} is when you usually break. Not today.`,
      `Pattern alert: This is your weak hour. Prove yourself wrong.`,
    ];

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧠 Pattern Alert',
        body: messages[Math.floor(Math.random() * messages.length)],
        data: { type: 'pattern-nudge' },
        sound: true,
      },
      trigger: {
        hour: nudgeHour,
        minute: nudgeMinute,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(key, JSON.stringify([notificationId]));
    
    console.log(`Pattern nudge scheduled for ${nudgeHour}:${nudgeMinute} (before peak at ${peakHour}:00)`);
    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule pattern nudges:', error.message);
    return null;
  }
}

// Send immediate nudge if user is in high-risk time
export async function sendHighRiskNudge() {
  if (isExpoGo) {
    console.log('⚠️ High-risk nudge (dev build required for actual notifications)');
    return null;
  }

  try {
    const isHighRisk = await isHighRiskTime();
    
    if (!isHighRisk) {
      return null;
    }

    const patterns = await getDistractionPatterns();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ High Risk Time',
        body: `You're in your danger zone. ${patterns.mostDistractingApp} can wait. Stay focused.`,
        data: { type: 'high-risk-nudge' },
        sound: true,
      },
      trigger: null, // Send immediately
    });

    return true;
  } catch (error) {
    console.warn('Failed to send high-risk nudge:', error.message);
    return null;
  }
}

// Update pattern nudges when patterns change
export async function updatePatternNudges() {
  await schedulePatternBasedNudges();
}
