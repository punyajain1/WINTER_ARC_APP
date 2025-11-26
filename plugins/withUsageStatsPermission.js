const { withAndroidManifest } = require('@expo/config-plugins');

const withUsageStatsPermission = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add PACKAGE_USAGE_STATS permission
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const hasUsagePermission = androidManifest['uses-permission'].some(
      (permission) =>
        permission.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );

    if (!hasUsagePermission) {
      androidManifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });
    }

    // Add tools namespace if not present
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });
};

module.exports = withUsageStatsPermission;
