# Android Screen Time Implementation Guide

## Overview
This guide explains how to get real screen time data on Android using UsageStatsManager API, which is what powers Digital Wellbeing.

## Important Prerequisites

### ⚠️ **This requires a native build - NOT Expo Go**
- UsageStatsManager requires native Android code (Kotlin/Java)
- You must build with **EAS Build** or use a **bare workflow**
- Expo Go cannot run this code

### Build Options:
1. **EAS Build** (Recommended): `eas build --profile development --platform android`
2. **Bare Workflow**: `npx expo prebuild` then build locally
3. **Development Client**: Use `expo-dev-client` for testing

---

## Implementation Steps

### 1. Android Manifest Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    
    <!-- Required for UsageStatsManager -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" 
        tools:ignore="ProtectedPermissions" />
    
    <!-- ... rest of your manifest -->
</manifest>
```

**Note**: This is a special permission - adding it to manifest is required but not sufficient. User must enable it manually in settings.

---

### 2. Create Native Module (Kotlin)

Create `android/app/src/main/java/com/winterarc/usage/UsageStatsModule.kt`:

```kotlin
package com.winterarc.usage

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*

class UsageStatsModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "UsageStatsModule"

    /**
     * Check if user has granted Usage Access permission
     */
    @ReactMethod
    fun hasUsagePermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                promise.resolve(false)
                return
            }

            val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactContext.packageName
            )
            
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message, e)
        }
    }

    /**
     * Open Usage Access Settings screen
     */
    @ReactMethod
    fun openUsageSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Could not open settings", e)
        }
    }

    /**
     * Get screen time for YOUR app only (simple version)
     */
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    @ReactMethod
    fun getAppScreenTime(startMillis: Double, endMillis: Double, promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val packageName = reactContext.packageName
            
            val stats = usm.queryAndAggregateUsageStats(
                startMillis.toLong(), 
                endMillis.toLong()
            )
            
            val appStats = stats[packageName]
            val foregroundMillis = appStats?.totalTimeInForeground ?: 0L
            
            val result = Arguments.createMap().apply {
                putDouble("milliseconds", foregroundMillis.toDouble())
                putDouble("minutes", foregroundMillis / 1000.0 / 60.0)
                putDouble("hours", foregroundMillis / 1000.0 / 60.0 / 60.0)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message, e)
        }
    }

    /**
     * Get screen time for ALL installed apps
     */
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    @ReactMethod
    fun getAllAppsScreenTime(startMillis: Double, endMillis: Double, promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            val stats = usm.queryAndAggregateUsageStats(
                startMillis.toLong(), 
                endMillis.toLong()
            )
            
            val result = Arguments.createMap()
            
            stats.forEach { (packageName, usageStats) ->
                val minutes = usageStats.totalTimeInForeground / 1000.0 / 60.0
                if (minutes > 0) { // Only include apps with usage
                    result.putDouble(packageName, minutes)
                }
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message, e)
        }
    }

    /**
     * Get detailed stats for specific apps
     */
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    @ReactMethod
    fun getAppsUsageDetails(packageNames: ReadableArray, startMillis: Double, endMillis: Double, promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val stats = usm.queryAndAggregateUsageStats(startMillis.toLong(), endMillis.toLong())
            
            val result = Arguments.createArray()
            
            for (i in 0 until packageNames.size()) {
                val pkg = packageNames.getString(i) ?: continue
                val usageStats = stats[pkg]
                
                if (usageStats != null) {
                    val appData = Arguments.createMap().apply {
                        putString("packageName", pkg)
                        putDouble("foregroundTimeMs", usageStats.totalTimeInForeground.toDouble())
                        putDouble("foregroundTimeMinutes", usageStats.totalTimeInForeground / 1000.0 / 60.0)
                        putDouble("lastTimeUsed", usageStats.lastTimeUsed.toDouble())
                        putInt("launchCount", usageStats.totalTimeVisible.toInt())
                    }
                    result.pushMap(appData)
                }
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message, e)
        }
    }
}
```

---

### 3. Register the Module

Create/edit `android/app/src/main/java/com/winterarc/usage/UsageStatsPackage.kt`:

```kotlin
package com.winterarc.usage

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class UsageStatsPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(UsageStatsModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

Register in `MainApplication.kt` (or `.java`):

```kotlin
import com.winterarc.usage.UsageStatsPackage // Add this import

class MainApplication : Application(), ReactApplication {
    override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages.apply {
            add(UsageStatsPackage()) // Add this line
        }
    }
}
```

---

### 4. JavaScript/TypeScript Interface

Create `src/utils/usageStats.ts`:

```typescript
import { NativeModules, Platform } from 'react-native';

const { UsageStatsModule } = NativeModules;

export interface ScreenTimeData {
  milliseconds: number;
  minutes: number;
  hours: number;
}

export class UsageStatsManager {
  /**
   * Check if app has usage permission (Android only)
   */
  static async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await UsageStatsModule.hasUsagePermission();
    } catch (e) {
      console.error('Permission check failed:', e);
      return false;
    }
  }

  /**
   * Request permission by opening settings
   */
  static async requestPermission(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await UsageStatsModule.openUsageSettings();
    } catch (e) {
      console.error('Failed to open settings:', e);
    }
  }

  /**
   * Get screen time for your app today
   */
  static async getTodayScreenTime(): Promise<ScreenTimeData> {
    if (Platform.OS !== 'android') {
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      return await UsageStatsModule.getAppScreenTime(
        startOfDay.getTime(),
        now
      );
    } catch (e) {
      console.error('Failed to get screen time:', e);
      return { milliseconds: 0, minutes: 0, hours: 0 };
    }
  }

  /**
   * Get screen time for all apps
   */
  static async getAllAppsUsage(startTime: Date, endTime: Date): Promise<Record<string, number>> {
    if (Platform.OS !== 'android') return {};
    
    try {
      return await UsageStatsModule.getAllAppsScreenTime(
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (e) {
      console.error('Failed to get all apps usage:', e);
      return {};
    }
  }

  /**
   * Get detailed usage for specific apps (e.g., distraction apps)
   */
  static async getDistractionAppsUsage(
    packageNames: string[],
    startTime: Date,
    endTime: Date
  ): Promise<Array<{
    packageName: string;
    foregroundTimeMs: number;
    foregroundTimeMinutes: number;
    lastTimeUsed: number;
    launchCount: number;
  }>> {
    if (Platform.OS !== 'android') return [];
    
    try {
      return await UsageStatsModule.getAppsUsageDetails(
        packageNames,
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (e) {
      console.error('Failed to get app details:', e);
      return [];
    }
  }
}
```

---

### 5. React Component Usage Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { UsageStatsManager } from '@/utils/usageStats';

export function ScreenTimeView() {
  const [hasPermission, setHasPermission] = useState(false);
  const [screenTime, setScreenTime] = useState<number>(0);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await UsageStatsManager.hasPermission();
    setHasPermission(granted);
    
    if (granted) {
      loadScreenTime();
    }
  };

  const loadScreenTime = async () => {
    const data = await UsageStatsManager.getTodayScreenTime();
    setScreenTime(data.minutes);
  };

  const requestPermission = async () => {
    await UsageStatsManager.requestPermission();
    
    Alert.alert(
      "Enable Usage Access",
      "Please enable Usage Access for Winter Arc in the settings to track screen time.",
      [
        {
          text: "OK",
          onPress: () => {
            // Re-check after user returns
            setTimeout(checkPermission, 1000);
          }
        }
      ]
    );
  };

  if (!hasPermission) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Screen time tracking requires permission</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Today's Screen Time: {Math.round(screenTime)} minutes</Text>
      <Button title="Refresh" onPress={loadScreenTime} />
    </View>
  );
}
```

---

### 6. Integration with Existing Storage

Update `src/utils/screenTime.js` to use real Android data:

```javascript
import { Platform } from 'react-native';
import { UsageStatsManager } from './usageStats';

class ScreenTimeMonitor {
  // ... existing code ...

  async getTodayUsage() {
    // Use real Android data if available
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await UsageStatsManager.hasPermission();
        if (hasPermission) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const now = new Date();
          
          const appsUsage = await UsageStatsManager.getAllAppsUsage(today, now);
          
          // Store in AsyncStorage for consistency
          const dateKey = today.toISOString().split('T')[0];
          await AsyncStorage.setItem(
            `${APP_USAGE_KEY}_${dateKey}`,
            JSON.stringify(appsUsage)
          );
          
          return appsUsage;
        }
      } catch (e) {
        console.warn('Failed to get Android usage stats, falling back to tracked data', e);
      }
    }
    
    // Fallback to manual tracking
    const today = new Date().toISOString().split('T')[0];
    const data = await AsyncStorage.getItem(`${APP_USAGE_KEY}_${today}`);
    return data ? JSON.parse(data) : {};
  }
}
```

---

## Testing

### 1. Build the App
```bash
# Development build with EAS
eas build --profile development --platform android

# Or local build (bare workflow)
cd android && ./gradlew assembleDebug
```

### 2. Install and Test
```bash
# Install the built APK
adb install path/to/your.apk

# Or use EAS
eas build:run --platform android
```

### 3. Grant Permission
1. Open the app
2. Tap "Enable Screen Time Tracking"
3. Navigate to Settings → Apps → Special app access → Usage access
4. Find "Winter Arc" and toggle it ON
5. Return to app

---

## Common Package Names (for distraction apps)

```javascript
const COMMON_APPS = {
  instagram: 'com.instagram.android',
  facebook: 'com.facebook.katana',
  twitter: 'com.twitter.android',
  tiktok: 'com.zhiliaoapp.musically',
  youtube: 'com.google.android.youtube',
  reddit: 'com.reddit.frontpage',
  snapchat: 'com.snapchat.android',
  whatsapp: 'com.whatsapp',
  telegram: 'org.telegram.messenger',
};
```

---

## Motivational Message System

Create `src/utils/motivationalMessages.ts`:

```typescript
import { getUserProfile } from './storage';
import { UsageStatsManager } from './usageStats';

export async function generateMotivationalMessage(): Promise<string> {
  const profile = await getUserProfile();
  const screenTime = await UsageStatsManager.getTodayScreenTime();
  
  const messages = {
    low: [
      `${profile?.name}, you're crushing it today! Only ${Math.round(screenTime.minutes)} minutes on screen.`,
      `Beast mode activated! Keep that phone usage low, champ.`,
    ],
    medium: [
      `${Math.round(screenTime.minutes)} minutes so far. Remember your goal: ${profile?.biggestDream}`,
      `You're doing okay, but you can do better. Your future self is watching.`,
    ],
    high: [
      `${Math.round(screenTime.minutes)} minutes wasted. Is this who you want to be?`,
      `Your dreams won't chase themselves while you're scrolling.`,
      `Every minute on your phone is a minute stolen from your goals.`,
    ]
  };
  
  const category = screenTime.minutes < 60 ? 'low' 
    : screenTime.minutes < 180 ? 'medium' 
    : 'high';
  
  const categoryMessages = messages[category];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}

// Schedule daily motivational notification
export async function scheduleDailyMotivation() {
  // Use this with your notification system
  const message = await generateMotivationalMessage();
  // scheduleNotification({ title: "Reality Check", body: message });
}
```

---

## Troubleshooting

### Permission not working?
- Make sure you're testing on a **real device** (not emulator sometimes has issues)
- Check Android version (requires API 21+)
- Verify manifest has the permission
- User must manually enable in Settings

### Module not found?
- Run `cd android && ./gradlew clean`
- Rebuild: `eas build` or `npx react-native run-android`
- Check that package is registered in MainApplication

### Data always zero?
- Permission not granted by user
- Check time range (start must be before end)
- Some OEMs restrict this data

---

## Alternative: Use Existing Library

If you want to avoid writing native code, try:
```bash
npm install react-native-usage-stats
# or
npm install @react-native-community/hooks
```

Check npm for latest Android usage stats libraries.

---

## Next Steps

1. ✅ Build app with EAS or bare workflow
2. ✅ Test permission flow on real device
3. ✅ Integrate with existing screenTime.js
4. ✅ Add motivational messaging based on usage
5. ✅ Create analytics dashboard showing trends
6. ✅ Set up notifications for high usage alerts

---

Good luck building your Winter Arc! 🔥💪
