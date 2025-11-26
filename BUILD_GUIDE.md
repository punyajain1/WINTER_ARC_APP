# 🔥 Winter Arc - Screen Time Feature Build Guide

## ✅ What's Been Added

Your Winter Arc app now includes complete Android screen time tracking functionality:

### Native Android Module
- ✅ **UsageStatsModule.kt** - Kotlin native module to access Android UsageStatsManager
- ✅ **UsageStatsPackage.kt** - React Native package registration
- ✅ **TypeScript interface** - Type-safe JavaScript bridge
- ✅ **Automatic permission handling** - UI prompts and settings navigation
- ✅ **Config plugin** - Auto-configures Android manifest during build

### Features Implemented
- 📊 Real Android screen time data (not just in-app tracking)
- 📱 Per-app usage breakdown
- ⏰ Distraction app monitoring
- 💬 Context-aware motivational messages
- 🎯 Smart notifications based on usage patterns
- 📈 Analytics integration

---

## 🚀 Building Your App

### Option 1: EAS Build (Recommended)

1. **Install EAS CLI** (if not already installed):
```bash
npm install -g eas-cli
```

2. **Login to Expo**:
```bash
eas login
```

3. **Configure your build** (already set up in `app.json`):
```bash
eas build:configure
```

4. **Build for Android**:

**Development Build** (for testing):
```bash
eas build --profile development --platform android
```

**Production Build**:
```bash
eas build --profile production --platform android
```

**Preview Build** (APK for testing):
```bash
eas build --profile preview --platform android
```

5. **Install on device**:
```bash
# After build completes, download and install
# Or use:
eas build:run --profile development --platform android
```

### Option 2: Local Build (Bare Workflow)

1. **Prebuild** (generates native code):
```bash
npx expo prebuild --platform android
```

2. **Build locally**:
```bash
cd android
./gradlew assembleDebug
# Or for release:
./gradlew assembleRelease
```

3. **Install APK**:
```bash
cd ..
npx react-native run-android
```

---

## 📋 First-Time Setup Checklist

### Before Building

- [ ] Ensure `EXPO_PUBLIC_PROJECT_GROUP_ID` is set in your environment
- [ ] Run `npm install` to get all dependencies
- [ ] Verify `eas.json` exists (created during `eas build:configure`)

### After Installing on Device

1. **Grant Usage Access Permission**:
   - Open the app
   - Navigate to Analytics tab
   - Tap "Enable Screen Time Tracking"
   - In Android Settings:
     - Find "Winter Arc" in the list
     - Toggle the switch **ON**
   - Return to app

2. **Verify It's Working**:
   - Check Analytics screen for screen time data
   - Open console logs to see: `📊 Android usage stats retrieved`

---

## 🛠️ Testing Screen Time Features

### Test the Permission Flow
```javascript
import { AndroidUsageStats } from '@/utils/androidUsageStats';

// Check permission
const hasPermission = await AndroidUsageStats.hasPermission();
console.log('Has permission:', hasPermission);

// Request permission
await AndroidUsageStats.requestPermission();
```

### Test Screen Time Retrieval
```javascript
// Get today's screen time
const screenTime = await AndroidUsageStats.getTodayScreenTime();
console.log('Screen time:', screenTime.minutes, 'minutes');

// Get all apps usage
const allApps = await AndroidUsageStats.getTodayAllAppsUsage();
console.log('Apps:', Object.keys(allApps).length);
```

### Test Motivational Messages
```javascript
import { generateMotivationalMessage } from '@/utils/motivationalMessages';

const message = await generateMotivationalMessage();
console.log('Motivation:', message);
```

---

## 📦 Package Names for Distraction Apps

Common apps already mapped in `androidUsageStats.ts`:

```javascript
COMMON_DISTRACTION_APPS = {
  instagram: 'com.instagram.android',
  facebook: 'com.facebook.katana',
  twitter: 'com.twitter.android',
  tiktok: 'com.zhiliaoapp.musically',
  youtube: 'com.google.android.youtube',
  reddit: 'com.reddit.frontpage',
  snapchat: 'com.snapchat.android',
  // ... and more
}
```

---

## 🐛 Troubleshooting

### Build Issues

**"Module not found: UsageStatsModule"**
- Ensure you're testing on a **physical device** or emulator with Google Play
- Make sure you built with EAS or prebuild (not Expo Go)
- Clean build: `cd android && ./gradlew clean`

**Manifest permission errors**
- Verify the plugin is in `app.json` plugins array
- Check that prebuild was run: `npx expo prebuild --clean`

**Native module not registered**
- Check that `UsageStatsPackage` is added to `MainApplication.kt`
- The plugin should auto-add it, but you can verify manually

### Runtime Issues

**Permission always returns false**
- User must manually enable in Settings → Apps → Special app access → Usage access
- Check Android version (requires API 21+)
- Some OEMs restrict this permission

**Screen time data is zero**
- Verify permission is granted
- Check time range (start must be before end)
- Try querying last 24 hours instead of just today

**App crashes on permission request**
- Ensure `android.permission.PACKAGE_USAGE_STATS` is in manifest
- Check that `tools:ignore="ProtectedPermissions"` is present

---

## 📱 Integrating with Existing Features

### 1. Update Onboarding Flow

Add distraction apps selection during onboarding:

```jsx
// In onboarding.jsx
import { COMMON_DISTRACTION_APPS } from '@/utils/androidUsageStats';

// Show list of common apps, let user select their distractions
```

### 2. Add to Settings Screen

```jsx
import { ScreenTimePermissionCard } from '@/components/ScreenTimePermissionCard';

// In settings
<ScreenTimePermissionCard />
```

### 3. Schedule Motivational Notifications

```javascript
import { generateMotivationalMessage } from '@/utils/motivationalMessages';
import { scheduleNotification } from '@/utils/notifications';

// Schedule daily check
setInterval(async () => {
  const message = await generateMotivationalMessage();
  await scheduleNotification({
    title: "Reality Check",
    body: message,
  });
}, 3600000); // Every hour
```

---

## 🎯 Next Steps

1. **Build the app**: `eas build --profile development --platform android`
2. **Install on device**: Download from EAS or use `eas build:run`
3. **Grant permission**: Enable Usage Access in settings
4. **Test features**: Check Analytics tab for real screen time data
5. **Customize**: Adjust motivation styles, limits, and notifications

---

## 📊 Monitoring & Analytics

The screen time data is automatically:
- ✅ Stored in AsyncStorage for offline access
- ✅ Integrated with existing `screenTimeMonitor`
- ✅ Displayed in Analytics tab with charts
- ✅ Used for motivational message generation
- ✅ Tracked for pattern analysis

---

## 🔒 Privacy & Permissions

### What Data is Accessed
- **Screen time per app**: Total foreground time only
- **No content**: Cannot see what you did in apps
- **Local only**: All data stays on device (AsyncStorage)

### Why This Permission is Needed
- Android's `PACKAGE_USAGE_STATS` is a protected permission
- Users must explicitly grant it in Settings
- Cannot be granted programmatically (security feature)
- Required to access UsageStatsManager API

---

## 💡 Tips

- **Test on real device**: Screen time tracking won't work in Expo Go
- **Battery optimization**: UsageStatsManager queries are lightweight
- **OEM differences**: Some manufacturers limit data granularity
- **Background sync**: Consider periodic background fetches for fresh data

---

## 🆘 Support

If you encounter issues:

1. Check the console logs for errors
2. Verify permission is granted in Settings
3. Ensure you built with native code (EAS/prebuild)
4. Try `npx expo prebuild --clean` and rebuild

---

**Ready to build?** Run:
```bash
eas build --profile development --platform android
```

Then install, grant permission, and start tracking! 🔥💪
