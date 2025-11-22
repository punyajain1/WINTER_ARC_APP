import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  ONBOARDING: '@winter_arc_onboarding',
  USER_PROFILE: '@winter_arc_profile',
  GOALS: '@winter_arc_goals',
  CHECK_INS: '@winter_arc_checkins',
  STREAK: '@winter_arc_streak',
  ACTIVITIES: '@winter_arc_activities',
};

// Onboarding Data
export const saveOnboardingData = async (data) => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return false;
  }
};

export const getOnboardingData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    return null;
  }
};

export const isOnboarded = async () => {
  try {
    const data = await getOnboardingData();
    return data !== null && data.onboarded === true;
  } catch (error) {
    return false;
  }
};

// User Profile
export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

export const getUserProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Goals
export const saveGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error saving goals:', error);
    return false;
  }
};

export const getGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
};

export const addGoal = async (goal) => {
  try {
    const goals = await getGoals();
    const newGoal = {
      ...goal,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false,
      progress: 0,
    };
    goals.push(newGoal);
    await saveGoals(goals);
    return newGoal;
  } catch (error) {
    console.error('Error adding goal:', error);
    return null;
  }
};

export const updateGoal = async (id, updates) => {
  try {
    const goals = await getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      await saveGoals(goals);
      return goals[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating goal:', error);
    return null;
  }
};

export const deleteGoal = async (id) => {
  try {
    const goals = await getGoals();
    const filtered = goals.filter(g => g.id !== id);
    await saveGoals(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
};

// Check-ins
export const saveCheckIn = async (checkIn) => {
  try {
    const checkIns = await getCheckIns();
    const newCheckIn = {
      ...checkIn,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    checkIns.unshift(newCheckIn); // Add to beginning
    await AsyncStorage.setItem(KEYS.CHECK_INS, JSON.stringify(checkIns));
    return newCheckIn;
  } catch (error) {
    console.error('Error saving check-in:', error);
    return null;
  }
};

export const getCheckIns = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CHECK_INS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting check-ins:', error);
    return [];
  }
};

export const getTodayCheckIn = async () => {
  try {
    const checkIns = await getCheckIns();
    const today = new Date().toDateString();
    return checkIns.find(c => new Date(c.timestamp).toDateString() === today) || null;
  } catch (error) {
    console.error('Error getting today check-in:', error);
    return null;
  }
};

// Streak
export const getStreak = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STREAK);
    return data ? JSON.parse(data) : { count: 0, lastCheckIn: null, photoUri: null };
  } catch (error) {
    console.error('Error getting streak:', error);
    return { count: 0, lastCheckIn: null, photoUri: null };
  }
};

export const updateStreak = async (photoUri = null) => {
  try {
    const streak = await getStreak();
    const now = new Date();
    const lastDate = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
    
    let newCount = streak.count;
    
    if (!lastDate) {
      // First check-in
      newCount = 1;
    } else {
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day
        newCount = streak.count + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newCount = 1;
      }
      // Same day, keep count
    }
    
    const updatedStreak = {
      count: newCount,
      lastCheckIn: now.toISOString(),
      photoUri: photoUri || streak.photoUri,
    };
    
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(updatedStreak));
    return updatedStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
};

// Activities
export const saveActivity = async (activity) => {
  try {
    const activities = await getActivities();
    const newActivity = {
      ...activity,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newActivity);
    // Keep only last 50 activities
    const trimmed = activities.slice(0, 50);
    await AsyncStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(trimmed));
    return newActivity;
  } catch (error) {
    console.error('Error saving activity:', error);
    return null;
  }
};

export const getActivities = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACTIVITIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

// Clear all data (for testing/reset)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};
