import { Alert } from "react-native";
import { trackDistractionEvent, updatePatternNudges } from "./patternAnalytics";
import { updatePatternNudges as updateNotificationNudges } from "./notifications";

class DistractionChecker {
  constructor() {
    this.isActive = false;
    this.checkInterval = null;
    this.distractionStartTime = null;
    this.motivationStyle = "balanced";
    this.dailyCheckInCompleted = false;
  }

  // Initialize the big brother system
  async initialize() {
    try {
      // Use mock data for demo (replace with actual API call when backend is ready)
      const data = {
        profile: {
          motivation_style: "tough-love",
          distraction_alerts: true,
        }
      };

      if (data.profile) {
        this.motivationStyle = data.profile.motivation_style || "balanced";
        this.distractionAlerts = data.profile.distraction_alerts;
      }

      // Start monitoring if enabled
      if (this.distractionAlerts) {
        this.startMonitoring();
      }
    } catch (error) {
      console.error("Failed to initialize distraction checker:", error);
    }
  }

  startMonitoring() {
    if (this.isActive) return;

    this.isActive = true;
    console.log("Winter Arc Big Brother: Monitoring started");

    // Check every 30 seconds for demonstration (in real app, this would be triggered by actual screen time events)
    this.checkInterval = setInterval(() => {
      this.checkForDistraction();
    }, 30000);
  }

  stopMonitoring() {
    this.isActive = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log("Winter Arc Big Brother: Monitoring stopped");
  }

  // Simulate distraction detection (in real app, this would connect to screen time APIs)
  checkForDistraction() {
    // Simulate random distraction events for demo
    const isDistracted = Math.random() > 0.95; // 5% chance every 30 seconds

    if (isDistracted) {
      this.handleDistractionDetected();
    }
  }

  async handleDistractionDetected() {
    try {
      // Get personalized motivation message
      const response = await fetch("/api/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "distraction",
          urgency: "medium",
        }),
      });

      const data = await response.json();
      this.showDistractionAlert(data.message);
    } catch (error) {
      // Fallback message
      this.showDistractionAlert(this.getFallbackMessage());
    }
  }

  showDistractionAlert(message) {
    Alert.alert(
      "Winter Arc Check-In",
      message,
      [
        {
          text: "Just 2 more minutes",
          style: "cancel",
          onPress: () => {
            // Give them a grace period but track it
            this.handleGracePeriod();
          },
        },
        {
          text: "You're right",
          style: "default",
          onPress: () => {
            this.handleBackOnTrack();
          },
        },
      ],
      { cancelable: false },
    );
  }

  handleGracePeriod() {
    // Give 2 minutes, then check again with higher urgency
    setTimeout(() => {
      this.handleDistractionDetected("high");
    }, 120000); // 2 minutes

    console.log("Winter Arc: Grace period given");
  }

  handleBackOnTrack() {
    console.log("Winter Arc: User back on track");
    // Reset distraction timer
    this.distractionStartTime = null;
  }

  // Track distraction event with pattern analytics
  async trackDistraction(appName, durationMinutes) {
    try {
      await trackDistractionEvent(appName, durationMinutes);
      
      // Update notification patterns based on new data
      await updateNotificationNudges();
      
      console.log(`Distraction tracked: ${appName} for ${durationMinutes} minutes`);
    } catch (error) {
      console.error("Failed to track distraction:", error);
    }
  }

  // Check for missed daily check-ins
  async checkMissedCheckIn() {
    try {
      const response = await fetch("/api/checkin/today");
      const data = await response.json();

      if (!data.completed) {
        const now = new Date();
        const hours = now.getHours();

        // If it's past 8 PM and they haven't checked in
        if (hours >= 20) {
          this.handleMissedCheckIn();
        }
      }
    } catch (error) {
      console.error("Failed to check daily check-in:", error);
    }
  }

  async handleMissedCheckIn() {
    try {
      const response = await fetch("/api/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "missed-checkin",
          urgency: "high",
        }),
      });

      const data = await response.json();

      Alert.alert("Winter Arc: Missed Check-In", data.message, [
        {
          text: "Check in now",
          onPress: () => {
            // Navigate to check-in
            console.log("Navigate to check-in");
          },
        },
        {
          text: "Tomorrow",
          style: "cancel",
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Winter Arc Reminder",
        "You missed your daily check-in. Consistency is everything.",
        [{ text: "OK" }],
      );
    }
  }

  getFallbackMessage() {
    const messages = {
      "tough-love": [
        "Stop scrolling. Your future self is watching.",
        "Every minute wasted is a step backward.",
        "This is exactly why you're stuck.",
        "Your goals won't achieve themselves.",
      ],
      balanced: [
        "Time to refocus. Your goals are waiting.",
        "Quick break's over. Back to work.",
        "Remember why you started.",
        "Every moment counts toward your dreams.",
      ],
      supportive: [
        "Hey, let's get back to your goals.",
        "You're capable of more than this.",
        "Small redirect, big impact.",
        "Your dreams are worth the effort.",
      ],
    };

    const styleMessages =
      messages[this.motivationStyle] || messages["balanced"];
    return styleMessages[Math.floor(Math.random() * styleMessages.length)];
  }

  // Manual trigger for testing
  triggerMotivation(context = "manual") {
    this.handleDistractionDetected(context);
  }

  // Update settings
  updateSettings(settings) {
    this.motivationStyle = settings.motivationStyle || this.motivationStyle;
    this.distractionAlerts = settings.distractionAlerts;

    if (this.distractionAlerts && !this.isActive) {
      this.startMonitoring();
    } else if (!this.distractionAlerts && this.isActive) {
      this.stopMonitoring();
    }
  }
}

// Create singleton instance
export const distractionChecker = new DistractionChecker();
export default DistractionChecker;
