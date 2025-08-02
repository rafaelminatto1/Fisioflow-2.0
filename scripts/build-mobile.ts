#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MobileBuildConfig {
  platform: 'ios' | 'android' | 'both';
  mode: 'development' | 'production';
  open?: boolean;
  build?: boolean;
  verbose?: boolean;
}

class MobileBuildManager {
  private config: MobileBuildConfig;

  constructor(config: MobileBuildConfig) {
    this.config = config;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  private exec(command: string, description: string) {
    this.log(`${description}...`);
    try {
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: this.config.verbose ? 'inherit' : 'pipe'
      });
      if (!this.config.verbose && output) {
        this.log(output.trim());
      }
      return output;
    } catch (error: any) {
      this.log(`Failed: ${error.message}`, 'error');
      throw error;
    }
  }

  private checkPrerequisites() {
    this.log('Checking mobile build prerequisites...');

    // Check if Capacitor is configured
    if (!existsSync('capacitor.config.ts')) {
      throw new Error('Capacitor not configured. Run: npx cap init');
    }

    // Check if package.json exists
    if (!existsSync('package.json')) {
      throw new Error('package.json not found');
    }

    // Check if build script exists
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    if (!packageJson.scripts?.build) {
      throw new Error('Build script not found in package.json');
    }

    // Platform-specific checks
    if (this.config.platform === 'ios' || this.config.platform === 'both') {
      if (process.platform !== 'darwin') {
        this.log('iOS builds require macOS', 'warn');
      }
      
      try {
        execSync('xcodebuild -version', { stdio: 'pipe' });
      } catch {
        this.log('Xcode not found. iOS builds require Xcode to be installed.', 'warn');
      }
    }

    if (this.config.platform === 'android' || this.config.platform === 'both') {
      try {
        execSync('java -version', { stdio: 'pipe' });
      } catch {
        this.log('Java not found. Android builds require Java to be installed.', 'warn');
      }

      const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      if (!androidHome) {
        this.log('ANDROID_HOME not set. Android builds require Android SDK.', 'warn');
      }
    }

    this.log('✅ Prerequisites check completed');
  }

  private buildWebApp() {
    this.log('Building web application...');
    
    const env = this.config.mode === 'production' ? 'production' : 'development';
    this.exec(`NODE_ENV=${env} npm run build`, 'Building web app for ' + env);
    
    this.log('✅ Web app build completed');
  }

  private updateCapacitorConfig() {
    this.log('Updating Capacitor configuration...');

    const configPath = 'capacitor.config.ts';
    let configContent = readFileSync(configPath, 'utf-8');

    // Update server configuration based on mode
    if (this.config.mode === 'development') {
      // For development, we might want to use a local server
      configContent = configContent.replace(
        /server:\s*{[^}]*}/,
        `server: {
    url: 'http://localhost:5173',
    cleartext: true
  }`
      );
    } else {
      // For production, use the built files
      configContent = configContent.replace(
        /server:\s*{[^}]*url:[^,}]*[,}]/,
        'server: {'
      );
    }

    writeFileSync(configPath, configContent);
    this.log('✅ Capacitor configuration updated');
  }

  private syncCapacitor() {
    this.log('Syncing Capacitor...');
    this.exec('npx cap sync', 'Syncing Capacitor plugins and web assets');
    this.log('✅ Capacitor sync completed');
  }

  private buildIOS() {
    this.log('Building iOS app...');

    if (!existsSync('ios')) {
      this.log('iOS platform not found. Adding iOS platform...');
      this.exec('npx cap add ios', 'Adding iOS platform');
    }

    if (this.config.build) {
      this.exec('npx cap build ios', 'Building iOS app');
    }

    if (this.config.open) {
      this.exec('npx cap open ios', 'Opening iOS project in Xcode');
    }

    this.log('✅ iOS build process completed');
  }

  private buildAndroid() {
    this.log('Building Android app...');

    if (!existsSync('android')) {
      this.log('Android platform not found. Adding Android platform...');
      this.exec('npx cap add android', 'Adding Android platform');
    }

    if (this.config.build) {
      this.exec('npx cap build android', 'Building Android app');
    }

    if (this.config.open) {
      this.exec('npx cap open android', 'Opening Android project in Android Studio');
    }

    this.log('✅ Android build process completed');
  }

  private generateBuildInfo() {
    const buildInfo = {
      platform: this.config.platform,
      mode: this.config.mode,
      buildTime: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      nodeVersion: process.version,
    };

    const distPath = join('dist', 'mobile-build-info.json');
    writeFileSync(distPath, JSON.stringify(buildInfo, null, 2));

    this.log(`Mobile build info generated: ${JSON.stringify(buildInfo, null, 2)}`);
  }

  private getGitCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getGitBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  async build() {
    const startTime = Date.now();
    
    try {
      this.log(`🚀 Starting mobile build for ${this.config.platform} (${this.config.mode})...`);
      
      this.checkPrerequisites();
      this.buildWebApp();
      this.generateBuildInfo();
      this.updateCapacitorConfig();
      this.syncCapacitor();

      if (this.config.platform === 'ios' || this.config.platform === 'both') {
        this.buildIOS();
      }

      if (this.config.platform === 'android' || this.config.platform === 'both') {
        this.buildAndroid();
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`🎉 Mobile build completed successfully in ${duration}s`);
      
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`💥 Mobile build failed after ${duration}s: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
function parseArgs(): MobileBuildConfig {
  const args = process.argv.slice(2);
  const config: MobileBuildConfig = {
    platform: 'ios',
    mode: 'development'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--ios':
        config.platform = 'ios';
        break;
      case '--android':
        config.platform = 'android';
        break;
      case '--both':
        config.platform = 'both';
        break;
      case '--production':
      case '--prod':
        config.mode = 'production';
        break;
      case '--development':
      case '--dev':
        config.mode = 'development';
        break;
      case '--open':
        config.open = true;
        break;
      case '--build':
        config.build = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
FisioFlow 2.0 Mobile Build Script

Usage: npm run build:mobile [options]

Options:
  --ios                   Build for iOS (default)
  --android              Build for Android
  --both                 Build for both platforms
  --production, --prod   Production build
  --development, --dev   Development build (default)
  --open                 Open in IDE after build
  --build                Build native app (not just sync)
  --verbose, -v          Verbose output
  --help, -h             Show this help

Examples:
  npm run build:mobile --ios --open           # Build and open iOS project
  npm run build:mobile --android --build      # Build Android APK
  npm run build:mobile --both --production    # Production build for both platforms
        `);
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return config;
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  const builder = new MobileBuildManager(config);
  builder.build();
}

export { MobileBuildManager };