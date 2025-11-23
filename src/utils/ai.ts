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
  inspiringMovies?: string;
  roleModels?: string;
}

export const generateHarshReminder = async (userProfile: UserProfile): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/generate-reminder`, 
      { userProfile },
      { timeout: 5000 }
    );
    return response.data.reminder;
  } catch (error) {
    console.log('AI backend unavailable, using fallback reminder');
    // Fallback reminder if backend is down
    return `Remember ${userProfile.biggestDream || 'your goals'}? ${userProfile.biggestSetback || 'Your past'} doesn't define you. Get up and do the work.`;
  }
};

export const generateCheckInPrompt = async (userProfile: UserProfile): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/generate-checkin-prompt`, 
      { userProfile },
      { timeout: 5000 }
    );
    return response.data.prompt;
  } catch (error) {
    console.log('AI backend unavailable, using fallback prompt');
    return "Did you do everything you could today to get closer to your dream?";
  }
};

// Fallback quotes for when backend is offline
const FALLBACK_QUOTES = [
  "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward. - Rocky Balboa",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "It does not matter how slowly you go as long as you do not stop. - Confucius",
];

const getDailyFallbackQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
};

export const generateDailyQuote = async (userProfile: UserProfile): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/generate-daily-quote`, 
      { userProfile },
      { timeout: 5000 } // 5 second timeout
    );
    return response.data.quote;
  } catch (error) {
    console.log('AI backend unavailable, using fallback quote');
    // Return daily rotating quote
    return getDailyFallbackQuote();
  }
};
