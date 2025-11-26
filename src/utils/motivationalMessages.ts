import { getUserProfile } from './storage';
import { AndroidUsageStats } from './androidUsageStats';
import { Platform } from 'react-native';

export interface MotivationalContext {
  screenTimeMinutes: number;
  userName?: string;
  biggestDream?: string;
  motivationStyle?: 'harsh' | 'balanced' | 'supportive';
}

/**
 * Generate contextual motivational messages based on screen time and user profile
 */
export async function generateMotivationalMessage(): Promise<string> {
  try {
    const profile = await getUserProfile();
    const screenTime = await getScreenTimeContext();
    
    const context: MotivationalContext = {
      screenTimeMinutes: screenTime.minutes,
      userName: profile?.name,
      biggestDream: profile?.biggestDream,
      motivationStyle: profile?.motivationStyle || 'balanced',
    };
    
    return selectMessage(context);
  } catch (error) {
    console.error('Failed to generate motivational message:', error);
    return "Keep grinding. Your future self will thank you.";
  }
}

async function getScreenTimeContext() {
  if (Platform.OS === 'android') {
    try {
      const hasPermission = await AndroidUsageStats.hasPermission();
      if (hasPermission) {
        return await AndroidUsageStats.getTodayScreenTime();
      }
    } catch (e) {
      console.warn('Could not get Android screen time:', e);
    }
  }
  return { milliseconds: 0, minutes: 0, hours: 0 };
}

function selectMessage(context: MotivationalContext): string {
  const { screenTimeMinutes, userName, biggestDream, motivationStyle } = context;
  
  const name = userName || 'Champion';
  const dream = biggestDream || 'your dreams';
  
  // Categorize usage
  const category = screenTimeMinutes < 60 ? 'low' 
    : screenTimeMinutes < 180 ? 'medium' 
    : 'high';
  
  const messages = {
    harsh: {
      low: [
        `${name}, only ${Math.round(screenTimeMinutes)} minutes today. Now we're talking.`,
        `${Math.round(screenTimeMinutes)} minutes. Keep that phone away. Winners don't scroll.`,
        `Impressive. ${Math.round(screenTimeMinutes)} minutes. But don't get comfortable.`,
      ],
      medium: [
        `${Math.round(screenTimeMinutes)} minutes wasted already. Remember: ${dream}.`,
        `${Math.round(screenTimeMinutes)} minutes. You're slipping. Get it together.`,
        `Time check: ${Math.round(screenTimeMinutes)} minutes. Is this who you want to be?`,
        `${Math.round(screenTimeMinutes)} minutes on your phone. Your competition is working.`,
      ],
      high: [
        `${Math.round(screenTimeMinutes)} minutes. Pathetic. ${dream} won't achieve itself.`,
        `${Math.round(screenTimeMinutes)} minutes wasted. Every second counts. Wake up.`,
        `You've spent ${Math.round(screenTimeMinutes)} minutes scrolling. Your future is slipping away.`,
        `${Math.round(screenTimeMinutes)} minutes. While you're scrolling, someone else is winning.`,
        `Reality check: ${Math.round(screenTimeMinutes)} minutes wasted. Is this your Winter Arc?`,
      ],
    },
    balanced: {
      low: [
        `${name}, you're crushing it! Only ${Math.round(screenTimeMinutes)} minutes today. 💪`,
        `Great work! ${Math.round(screenTimeMinutes)} minutes. Keep this momentum going.`,
        `${Math.round(screenTimeMinutes)} minutes - you're in control. ${dream} is getting closer.`,
      ],
      medium: [
        `${Math.round(screenTimeMinutes)} minutes so far. You can do better. Remember: ${dream}.`,
        `Time to refocus. ${Math.round(screenTimeMinutes)} minutes used. Make the rest count.`,
        `${Math.round(screenTimeMinutes)} minutes. Not bad, but your potential is higher.`,
      ],
      high: [
        `${Math.round(screenTimeMinutes)} minutes today. Time to lock back in, ${name}.`,
        `${Math.round(screenTimeMinutes)} minutes. Your dreams need you focused, not scrolling.`,
        `That's ${Math.round(screenTimeMinutes)} minutes. Remember why you started: ${dream}.`,
        `${Math.round(screenTimeMinutes)} minutes wasted. You know you're better than this.`,
      ],
    },
    supportive: {
      low: [
        `Amazing progress, ${name}! Only ${Math.round(screenTimeMinutes)} minutes today. You're doing great! 🌟`,
        `${Math.round(screenTimeMinutes)} minutes - incredible self-control! Keep it up!`,
        `You're absolutely crushing it! ${Math.round(screenTimeMinutes)} minutes. So proud of you!`,
      ],
      medium: [
        `${Math.round(screenTimeMinutes)} minutes today. You're doing well! Keep pushing toward ${dream}.`,
        `${name}, ${Math.round(screenTimeMinutes)} minutes - that's okay! Tomorrow is a new opportunity.`,
        `${Math.round(screenTimeMinutes)} minutes used. You're making progress! Every day is a step forward.`,
      ],
      high: [
        `${Math.round(screenTimeMinutes)} minutes today. It's okay - tomorrow is a fresh start! You've got this.`,
        `${name}, ${Math.round(screenTimeMinutes)} minutes. Remember, progress isn't always linear. Keep going!`,
        `${Math.round(screenTimeMinutes)} minutes. Don't be hard on yourself. Refocus and try again!`,
      ],
    },
  };
  
  const styleMessages = messages[motivationStyle as keyof typeof messages] || messages.balanced;
  const categoryMessages = styleMessages[category];
  
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}

/**
 * Get a specific message for exceeding screen time limits
 */
export function generateLimitExceededMessage(
  appName: string,
  minutesUsed: number,
  limit: number,
  motivationStyle: 'harsh' | 'balanced' | 'supportive' = 'balanced'
): string {
  const messages = {
    harsh: [
      `${appName}: ${minutesUsed}/${limit}min. Limit exceeded. Delete it if you can't control yourself.`,
      `You've blown past your ${appName} limit. ${minutesUsed} minutes wasted. Lock in.`,
      `${appName} limit exceeded. ${minutesUsed} minutes. This is exactly why you're not where you want to be.`,
    ],
    balanced: [
      `${appName}: ${minutesUsed}/${limit} minutes. You've hit your limit. Time to focus elsewhere.`,
      `Limit reached for ${appName}. ${minutesUsed} minutes used. Let's get back on track.`,
      `${appName}: ${minutesUsed} minutes (limit: ${limit}). Consider taking a break.`,
    ],
    supportive: [
      `${appName}: You've reached your ${limit} minute goal. Great awareness! Time to refocus. 🎯`,
      `${appName} limit reached (${minutesUsed}min). You noticed! That's progress. Keep going!`,
      `${appName}: ${minutesUsed} minutes. Limit reached, but you're doing great at tracking!`,
    ],
  };
  
  const styleMessages = messages[motivationStyle] || messages.balanced;
  return styleMessages[Math.floor(Math.random() * styleMessages.length)];
}

/**
 * Generate a peak distraction time warning
 */
export function generateDistractionWarning(
  peakHour: number,
  mostDistractingApp: string,
  motivationStyle: 'harsh' | 'balanced' | 'supportive' = 'balanced'
): string {
  const hour12 = peakHour > 12 ? peakHour - 12 : peakHour;
  const ampm = peakHour >= 12 ? 'PM' : 'AM';
  
  const messages = {
    harsh: [
      `High risk time approaching (${hour12}${ampm}). Your weakness: ${mostDistractingApp}. Don't slip.`,
      `${hour12}${ampm} - your usual fail time. ${mostDistractingApp} is waiting. Be stronger.`,
      `Pattern alert: You usually crack at ${hour12}${ampm} with ${mostDistractingApp}. Not today.`,
    ],
    balanced: [
      `Heads up: You usually get distracted around ${hour12}${ampm}. Stay focused.`,
      `Peak distraction time: ${hour12}${ampm}. ${mostDistractingApp} can wait. Stay locked in.`,
      `Reminder: ${hour12}${ampm} is when you typically lose focus. You've got this.`,
    ],
    supportive: [
      `Friendly reminder: ${hour12}${ampm} is usually challenging for you. You're aware now! 💪`,
      `${hour12}${ampm} approaching. You've noticed this pattern before. Great awareness!`,
      `Time check: ${hour12}${ampm}. This is when focus gets hard, but you're prepared!`,
    ],
  };
  
  const styleMessages = messages[motivationStyle] || messages.balanced;
  return styleMessages[Math.floor(Math.random() * styleMessages.length)];
}
