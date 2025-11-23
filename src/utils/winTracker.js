import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const WIN_TRACKER_KEY = '@winter_arc_win_tracker';

// Add evidence (photo/screenshot) to a goal
export const addWinEvidence = async (goalId, imageUri, note = '') => {
  try {
    // Create a permanent copy of the image in app's document directory
    const fileName = `win_${goalId}_${Date.now()}.jpg`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.copyAsync({
      from: imageUri,
      to: newPath,
    });

    const evidence = {
      id: Date.now().toString(),
      goalId,
      imageUri: newPath,
      note,
      timestamp: new Date().toISOString(),
      type: 'photo', // could be 'photo', 'screenshot', 'document'
    };

    // Get existing evidence
    const existing = await AsyncStorage.getItem(WIN_TRACKER_KEY);
    const allEvidence = existing ? JSON.parse(existing) : [];
    
    allEvidence.push(evidence);
    
    await AsyncStorage.setItem(WIN_TRACKER_KEY, JSON.stringify(allEvidence));
    
    return evidence;
  } catch (error) {
    console.error('Error adding win evidence:', error);
    throw error;
  }
};

// Get all evidence for a specific goal
export const getGoalEvidence = async (goalId) => {
  try {
    const data = await AsyncStorage.getItem(WIN_TRACKER_KEY);
    const allEvidence = data ? JSON.parse(data) : [];
    
    return allEvidence
      .filter(e => e.goalId === goalId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error getting goal evidence:', error);
    return [];
  }
};

// Get all evidence across all goals (for timeline view)
export const getAllEvidence = async () => {
  try {
    const data = await AsyncStorage.getItem(WIN_TRACKER_KEY);
    const allEvidence = data ? JSON.parse(data) : [];
    
    return allEvidence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error getting all evidence:', error);
    return [];
  }
};

// Delete evidence
export const deleteEvidence = async (evidenceId) => {
  try {
    const data = await AsyncStorage.getItem(WIN_TRACKER_KEY);
    const allEvidence = data ? JSON.parse(data) : [];
    
    const evidence = allEvidence.find(e => e.id === evidenceId);
    
    // Delete the image file
    if (evidence && evidence.imageUri) {
      try {
        await FileSystem.deleteAsync(evidence.imageUri, { idempotent: true });
      } catch (error) {
        console.log('Could not delete file:', error);
      }
    }
    
    // Remove from storage
    const updated = allEvidence.filter(e => e.id !== evidenceId);
    await AsyncStorage.setItem(WIN_TRACKER_KEY, JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return false;
  }
};

// Get evidence count for a goal
export const getEvidenceCount = async (goalId) => {
  try {
    const evidence = await getGoalEvidence(goalId);
    return evidence.length;
  } catch (error) {
    console.error('Error getting evidence count:', error);
    return 0;
  }
};

// Get timeline data grouped by date
export const getTimelineData = async (goalId = null) => {
  try {
    const evidence = goalId 
      ? await getGoalEvidence(goalId)
      : await getAllEvidence();
    
    // Group by date
    const grouped = {};
    
    evidence.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(item);
    });
    
    // Convert to array and sort by date
    const timeline = Object.keys(grouped)
      .map(date => ({
        date,
        items: grouped[date],
        count: grouped[date].length,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return timeline;
  } catch (error) {
    console.error('Error getting timeline data:', error);
    return [];
  }
};

// Update evidence note
export const updateEvidenceNote = async (evidenceId, note) => {
  try {
    const data = await AsyncStorage.getItem(WIN_TRACKER_KEY);
    const allEvidence = data ? JSON.parse(data) : [];
    
    const updated = allEvidence.map(e => 
      e.id === evidenceId ? { ...e, note } : e
    );
    
    await AsyncStorage.setItem(WIN_TRACKER_KEY, JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.error('Error updating evidence note:', error);
    return false;
  }
};

// Get stats for analytics
export const getWinTrackerStats = async () => {
  try {
    const allEvidence = await getAllEvidence();
    
    // Calculate stats
    const totalWins = allEvidence.length;
    const thisWeek = allEvidence.filter(e => {
      const date = new Date(e.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    
    const thisMonth = allEvidence.filter(e => {
      const date = new Date(e.timestamp);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }).length;
    
    return {
      totalWins,
      winsThisWeek: thisWeek,
      winsThisMonth: thisMonth,
      firstWin: allEvidence.length > 0 ? allEvidence[allEvidence.length - 1].timestamp : null,
      lastWin: allEvidence.length > 0 ? allEvidence[0].timestamp : null,
    };
  } catch (error) {
    console.error('Error getting win tracker stats:', error);
    return {
      totalWins: 0,
      winsThisWeek: 0,
      winsThisMonth: 0,
      firstWin: null,
      lastWin: null,
    };
  }
};
