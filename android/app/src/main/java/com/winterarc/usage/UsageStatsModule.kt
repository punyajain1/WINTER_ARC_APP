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
     * Get screen time for YOUR app only
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
                if (minutes > 0) {
                    result.putDouble(packageName, minutes)
                }
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message, e)
        }
    }

    /**
     * Get detailed stats for specific apps (distraction apps)
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
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            putInt("launchCount", 0) // Deprecated in API 29+
                        }
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
