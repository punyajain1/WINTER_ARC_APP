# Push Notifications Setup for Winter Arc

## Important: Notifications Require Development Build

As of Expo SDK 53+, push notifications **do not work in Expo Go**. You need to create a development build to test notifications.

## Option 1: EAS Build (Recommended - Cloud-based)

### Prerequisites
1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Create an Expo account (if you don't have one):
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

### Build for Android (Faster for testing)
```bash
# Create development build for Android
eas build --profile development --platform android

# After build completes, download and install the APK on your Android device
# Then run:
npx expo start --dev-client
```

### Build for iOS (Requires Apple Developer Account)
```bash
# Create development build for iOS
eas build --profile development --platform ios

# After build completes, install on your iPhone via TestFlight or direct install
# Then run:
npx expo start --dev-client
```

## Option 2: Local Development Build

### For Android (Requires Android Studio)
```bash
# Install development build tools
npm install -g expo-dev-client

# Prebuild native code
npx expo prebuild

# Run on Android
npx expo run:android
```

### For iOS (Requires Xcode on Mac)
```bash
# Prebuild native code
npx expo prebuild

# Run on iOS
npx expo run:ios
```

## Option 3: Quick Test Without Notifications

If you want to test the app **without** push notifications temporarily:

1. The app will work in Expo Go, but notifications will show the error you saw
2. All other features (onboarding, goals, check-ins, streak photos, AI backend) work perfectly
3. Notification scheduling code runs but won't trigger actual notifications

## Notification Features Once Built

Once you have a development build, these features will work:

✅ **Daily Check-In Reminders** - 8 PM every day
✅ **Harsh AI Reminders** - Triggered after struggles or missed streaks  
✅ **Goal Deadline Alerts** - 1 day before goal deadlines
✅ **Weekly Streak Reminders** - Monday mornings at 9 AM
✅ **Screen Time Warnings** - Immediate alerts for distraction apps

## Testing Notifications

After building, you can test notifications by:

1. **Enable in Settings**: Go to Settings tab → Toggle "Daily Reminders" and "Harsh Reminders"
2. **Complete Check-In**: Mention struggles → Harsh reminder scheduled for tomorrow
3. **Upload Streak Photo**: Automatically schedules next day's reminder
4. **Create Goal with Deadline**: Get reminder 1 day before deadline
5. **Check Scheduled**: In Settings, you can view all scheduled notifications

## Recommended Approach

For fastest testing:
1. Use **EAS Build for Android** (free tier available)
2. Build takes ~10-15 minutes in the cloud
3. Download APK and install on Android phone
4. Run `npx expo start --dev-client`
5. Full notifications will work!

## Current Status

- ✅ Notification system fully implemented
- ✅ All notification types configured
- ✅ Settings toggles working
- ⚠️ Requires development build (not Expo Go)

Need help? Check: https://docs.expo.dev/develop/development-builds/introduction/
