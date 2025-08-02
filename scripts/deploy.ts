#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  environment: 'preview' | 'production';
  branch?: string;
  skipBuild?: boolean;
  skipTests?: boolean;
  verbose?: boolean;
}

class DeploymentManager {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
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
    this.log('Checking deployment prerequisites...');

    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      throw new Error('Vercel CLI is not installed. Run: npm install -g vercel');
    }

    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
    } catch {
      throw new Error('Not in a git repository. Initialize git first.');
    }

    // Check for uncommitted changes in production
    if (this.config.environment === 'production') {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        if (status.trim()) {
          throw new Error('Uncommitted changes detected. Commit or stash changes before production deployment.');
        }
      } catch (error: any) {
        if (error.message.includes('Uncommitted changes')) {
          throw error;
        }
      }
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

    this.log('✅ Prerequisites check passed');
  }

  private runTests() {
    if (this.config.skipTests) {
      this.log('Skipping tests (--skip-tests flag)');
      return;
    }

    this.log('Running tests...');
    this.exec('npm run test', 'Running unit tests');
    this.exec('npm run lint', 'Running linter');
    this.exec('npm run type-check', 'Running type check');
    this.log('✅ All tests passed');
  }

  private buildApplication() {
    if (this.config.skipBuild) {
      this.log('Skipping build (--skip-build flag)');
      return;
    }

    this.log('Building application...');
    
    // Set environment for build
    const env = this.config.environment === 'production' ? 'production' : 'preview';
    this.exec(`NODE_ENV=${env} npm run build`, 'Building for ' + env);
    
    this.log('✅ Build completed successfully');
  }

  private generateBuildInfo() {
    const buildInfo = {
      version: process.env.npm_package_version || '1.0.0',
      buildTime: new Date().toISOString(),
      environment: this.config.environment,
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      nodeVersion: process.version,
    };

    writeFileSync(
      join('dist', 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );

    this.log(`Build info generated: ${JSON.stringify(buildInfo, null, 2)}`);
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

  private deployToVercel() {
    this.log(`Deploying to Vercel (${this.config.environment})...`);

    let deployCommand = 'vercel';
    
    if (this.config.environment === 'production') {
      deployCommand += ' --prod';
    }

    if (this.config.branch) {
      deployCommand += ` --meta gitBranch=${this.config.branch}`;
    }

    // Add build metadata
    deployCommand += ` --meta buildTime=${new Date().toISOString()}`;
    deployCommand += ` --meta gitCommit=${this.getGitCommit()}`;

    const output = this.exec(deployCommand, 'Deploying to Vercel');
    
    // Extract deployment URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      this.log(`🚀 Deployment successful: ${urlMatch[0]}`);
    }

    return output;
  }

  private postDeploymentChecks(deploymentUrl?: string) {
    if (!deploymentUrl) return;

    this.log('Running post-deployment checks...');

    // Basic health check
    try {
      this.exec(`curl -f ${deploymentUrl}/health || echo "Health check endpoint not available"`, 'Health check');
    } catch {
      this.log('Health check failed or not available', 'warn');
    }

    this.log('✅ Post-deployment checks completed');
  }

  async deploy() {
    const startTime = Date.now();
    
    try {
      this.log(`🚀 Starting ${this.config.environment} deployment...`);
      
      this.checkPrerequisites();
      this.runTests();
      this.buildApplication();
      this.generateBuildInfo();
      
      const deploymentOutput = this.deployToVercel();
      
      // Extract URL for post-deployment checks
      const urlMatch = deploymentOutput.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.postDeploymentChecks(urlMatch[0]);
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`🎉 Deployment completed successfully in ${duration}s`);
      
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`💥 Deployment failed after ${duration}s: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
function parseArgs(): DeploymentConfig {
  const args = process.argv.slice(2);
  const config: DeploymentConfig = {
    environment: 'preview'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--production':
      case '--prod':
        config.environment = 'production';
        break;
      case '--preview':
        config.environment = 'preview';
        break;
      case '--branch':
        config.branch = args[++i];
        break;
      case '--skip-build':
        config.skipBuild = true;
        break;
      case '--skip-tests':
        config.skipTests = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
FisioFlow 2.0 Deployment Script

Usage: npm run deploy [options]

Options:
  --production, --prod    Deploy to production
  --preview              Deploy to preview (default)
  --branch <name>        Specify git branch
  --skip-build           Skip build step
  --skip-tests           Skip test step
  --verbose, -v          Verbose output
  --help, -h             Show this help

Examples:
  npm run deploy                    # Deploy to preview
  npm run deploy --production       # Deploy to production
  npm run deploy --skip-tests       # Deploy without running tests
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
  const deployer = new DeploymentManager(config);
  deployer.deploy();
}

export { DeploymentManager };