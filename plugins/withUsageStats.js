const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withUsageStatsPackage = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;
      
      // Copy Kotlin source files
      const sourceDir = path.join(projectRoot, 'modules/usage-stats/android/src/main/java/com/winterarc/usage');
      const targetDir = path.join(platformRoot, 'app/src/main/java/com/winterarc/usage');
      
      try {
        // Create target directory
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy Kotlin files
        const filesToCopy = ['UsageStatsModule.kt', 'UsageStatsPackage.kt'];
        filesToCopy.forEach(file => {
          const sourcePath = path.join(sourceDir, file);
          const targetPath = path.join(targetDir, file);
          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✓ Copied ${file} to android/app`);
          }
        });
      } catch (error) {
        console.warn('Could not copy Kotlin files:', error.message);
      }
      
      // Modify MainApplication.kt
      const mainApplicationPath = path.join(
        platformRoot,
        'app/src/main/java/com/winterarc/app/MainApplication.kt'
      );

      try {
        if (fs.existsSync(mainApplicationPath)) {
          let content = fs.readFileSync(mainApplicationPath, 'utf-8');

          // Add import if not present
          if (!content.includes('import com.winterarc.usage.UsageStatsPackage')) {
            const importInsertPosition = content.indexOf('import expo.modules');
            if (importInsertPosition !== -1) {
              content = content.slice(0, importInsertPosition) +
                'import com.winterarc.usage.UsageStatsPackage\n' +
                content.slice(importInsertPosition);
            }
          }

          // Add package to the list if not present
          if (!content.includes('UsageStatsPackage()')) {
            // Find the packages list
            const packagesPattern = /packages\.add\(([^)]*)\)/g;
            let match;
            let lastIndex = -1;
            
            while ((match = packagesPattern.exec(content)) !== null) {
              lastIndex = match.index + match[0].length;
            }

            if (lastIndex !== -1) {
              // Insert after the last add call
              content = content.slice(0, lastIndex) +
                '\n      packages.add(UsageStatsPackage())' +
                content.slice(lastIndex);
            }
          }

          fs.writeFileSync(mainApplicationPath, content, 'utf-8');
          console.log('✓ Modified MainApplication.kt');
        }
      } catch (error) {
        console.warn('Could not modify MainApplication.kt:', error.message);
      }

      return config;
    },
  ]);
};

module.exports = (config) => {
  config = require('./withUsageStatsPermission')(config);
  config = withUsageStatsPackage(config);
  return config;
};
