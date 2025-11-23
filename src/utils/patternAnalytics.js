import AsyncStorage from '@react-native-async-storage/async-storage';

const DISTRACTION_EVENTS_KEY = '@winter_arc_distraction_events';
const FOCUS_PATTERNS_KEY = '@winter_arc_focus_patterns';

// Track when user gets distracted (called from screen time checker)
export const trackDistractionEvent = async (appName, durationMinutes) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    const event = {
      timestamp: now.toISOString(),
      hour,
      dayOfWeek: now.getDay(),
      appName,
      durationMinutes,
    };

    const existing = await AsyncStorage.getItem(DISTRACTION_EVENTS_KEY);
    const events = existing ? JSON.parse(existing) : [];
    
    // Keep last 100 events to analyze patterns
    events.push(event);
    if (events.length > 100) {
      events.shift();
    }

    await AsyncStorage.setItem(DISTRACTION_EVENTS_KEY, JSON.stringify(events));
    
    // Analyze patterns after each event
    await analyzeDistractionPatterns(events);
    
    return event;
  } catch (error) {
    console.error('Error tracking distraction:', error);
    return null;
  }
};

// Analyze patterns to find when user is most distracted
export const analyzeDistractionPatterns = async (events = null) => {
  try {
    if (!events) {
      const existing = await AsyncStorage.getItem(DISTRACTION_EVENTS_KEY);
      events = existing ? JSON.parse(existing) : [];
    }

    if (events.length < 5) {
      return null; // Not enough data
    }

    // Count distractions by hour
    const hourCounts = {};
    const appCounts = {};
    const dayOfWeekCounts = {};
    
    events.forEach(event => {
      // Hour analysis
      hourCounts[event.hour] = (hourCounts[event.hour] || 0) + 1;
      
      // App analysis
      appCounts[event.appName] = (appCounts[event.appName] || 0) + 1;
      
      // Day of week analysis
      dayOfWeekCounts[event.dayOfWeek] = (dayOfWeekCounts[event.dayOfWeek] || 0) + 1;
    });

    // Find peak distraction hour
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );

    // Find most distracting app
    const mostDistractingApp = Object.keys(appCounts).reduce((a, b) => 
      appCounts[a] > appCounts[b] ? a : b
    );

    // Find most distracted day
    const peakDay = Object.keys(dayOfWeekCounts).reduce((a, b) => 
      dayOfWeekCounts[a] > dayOfWeekCounts[b] ? a : b
    );

    const patterns = {
      peakDistractionHour: parseInt(peakHour),
      peakDistractionHourCount: hourCounts[peakHour],
      mostDistractingApp,
      mostDistractingAppCount: appCounts[mostDistractingApp],
      peakDistractionDay: parseInt(peakDay),
      totalEvents: events.length,
      lastAnalyzed: new Date().toISOString(),
      hourlyBreakdown: hourCounts,
      appBreakdown: appCounts,
    };

    await AsyncStorage.setItem(FOCUS_PATTERNS_KEY, JSON.stringify(patterns));
    
    return patterns;
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return null;
  }
};

// Get current distraction patterns
export const getDistractionPatterns = async () => {
  try {
    const data = await AsyncStorage.getItem(FOCUS_PATTERNS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting patterns:', error);
    return null;
  }
};

// Get user-friendly message about their patterns
export const getPatternInsight = async () => {
  try {
    const patterns = await getDistractionPatterns();
    
    if (!patterns || patterns.totalEvents < 5) {
      return "Keep going. We're learning your patterns.";
    }

    const hour = patterns.peakDistractionHour;
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const timeString = hour > 12 ? `${hour - 12}pm` : `${hour}am`;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[patterns.peakDistractionDay];

    return `You usually lose focus around ${timeString} (${period}), especially on ${dayName}s. Your biggest distraction: ${patterns.mostDistractingApp}. Stay locked in.`;
  } catch (error) {
    console.error('Error getting insight:', error);
    return null;
  }
};

// Check if it's currently a high-risk time for distraction
export const isHighRiskTime = async () => {
  try {
    const patterns = await getDistractionPatterns();
    
    if (!patterns || patterns.totalEvents < 5) {
      return false;
    }

    const currentHour = new Date().getHours();
    
    // Within 1 hour of peak distraction time
    return Math.abs(currentHour - patterns.peakDistractionHour) <= 1;
  } catch (error) {
    console.error('Error checking high risk time:', error);
    return false;
  }
};

// Track focus session (when user completes tasks without distraction)
export const trackFocusSession = async (durationMinutes) => {
  try {
    const now = new Date();
    const session = {
      timestamp: now.toISOString(),
      hour: now.getHours(),
      durationMinutes,
    };

    const key = '@winter_arc_focus_sessions';
    const existing = await AsyncStorage.getItem(key);
    const sessions = existing ? JSON.parse(existing) : [];
    
    sessions.push(session);
    if (sessions.length > 50) {
      sessions.shift();
    }

    await AsyncStorage.setItem(key, JSON.stringify(sessions));
    
    return session;
  } catch (error) {
    console.error('Error tracking focus session:', error);
    return null;
  }
};

// Get all distraction events for analytics screen
export const getAllDistractionEvents = async () => {
  try {
    const data = await AsyncStorage.getItem(DISTRACTION_EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};
