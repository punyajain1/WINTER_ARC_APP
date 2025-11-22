import axios from 'axios';

// Update this with your deployed backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_AI_BACKEND_URL || 'http://localhost:3000';

export interface UserProfile {
  biggestDream: string;
  biggestSetback: string;
  emotionalBreakdown: string;
  whatKeepsGoing: string;
  motivationStyle?: 'tough-love' | 'encouraging' | 'balanced';
  currentBehavior?: string;
}

export const generateHarshReminder = async (userProfile: UserProfile): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/generate-reminder`, {
      userProfile,
    });
    return response.data.reminder;
  } catch (error) {
    console.error('Error generating reminder:', error);
    // Fallback reminder if backend is down
    return `Remember ${userProfile.biggestDream}? ${userProfile.biggestSetback} doesn't define you. Get up and do the work.`;
  }
};

export const generateCheckInPrompt = async (userProfile: UserProfile): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/generate-checkin-prompt`, {
      userProfile,
    });
    return response.data.prompt;
  } catch (error) {
    console.error('Error generating check-in prompt:', error);
    return "Did you do everything you could today to get closer to your dream?";
  }
};
