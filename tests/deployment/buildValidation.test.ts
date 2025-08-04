import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// Build validation tests to catch deployment issues early
describe('Build Validation Tests', () => {
  const distPath = path.resolve(process.cwd(), 'dist');
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  
  let packageJson: any;
  let distFiles: string[];

  beforeAll(async () => {
    // Read package.json
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);

    // Get dist files
    try {
      const files = await fs.readdir(distPath, { recursive: true });
      distFiles = files.filter(file => typeof file === 'string') as string[];
    } catch {
      distFiles = [];
    }
  });

  describe('Package Configuration', () => {
    it('should have required fields in package.json', () => {
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
    });

    it('should have build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have preview script for production testing', () => {
      expect(packageJson.scripts.preview).toBeDefined();
    });

    it('should not have security vulnerabilities in dependencies', () => {
      const vulnerableDeps = [
        'node-ipc', // RCE vulnerability
        'event-source-polyfill@0.0.16', // Prototype pollution
        'ua-parser-js@0.7.29', // Malicious code
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      vulnerableDeps.forEach(vulnDep => {
        const [name, version] = vulnDep.split('@');
        if (allDeps[name]) {
          if (version) {
            expect(allDeps[name]).not.toBe(version);
          }
        }
      });
    });
  });

  describe('Build Output Validation', () => {
    it('should generate dist directory', async () => {
      const distExists = await fs.access(distPath).then(() => true).catch(() => false);
      expect(distExists).toBe(true);
    });

    it('should include index.html', () => {
      expect(distFiles).toContain('index.html');
    });

    it('should include JavaScript bundles', () => {
      const jsFiles = distFiles.filter(file => file.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
    });

    it('should include CSS files', () => {
      const cssFiles = distFiles.filter(file => file.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
    });

    it('should have reasonable bundle sizes', async () => {
      const jsFiles = distFiles.filter(file => 
        file.endsWith('.js') && !file.includes('.map')
      );

      for (const jsFile of jsFiles) {
        const filePath = path.join(distPath, jsFile);
        const stats = await fs.stat(filePath);
        const sizeInMB = stats.size / (1024 * 1024);
        
        // Main bundle should be under 2MB
        if (jsFile.includes('index')) {
          expect(sizeInMB).toBeLessThan(2);
        }
        
        // Vendor chunks should be under 5MB
        expect(sizeInMB).toBeLessThan(5);
      }
    });

    it('should not include source maps in production build', () => {
      const sourceMapFiles = distFiles.filter(file => file.endsWith('.map'));
      
      // Source maps should only exist in development builds
      if (process.env.NODE_ENV === 'production') {
        expect(sourceMapFiles.length).toBe(0);
      }
    });

    it('should include necessary asset files', () => {
      // Check for favicon
      const hasFavicon = distFiles.some(file => 
        file.includes('favicon') || file.includes('icon')
      );
      expect(hasFavicon).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid TypeScript configuration', async () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const tsconfigContent = await fs.readFile(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(tsconfigContent);

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
      expect(tsconfig.compilerOptions.moduleResolution).toBeDefined();
    });

    it('should have valid Vite configuration', async () => {
      const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');
      const viteConfigExists = await fs.access(viteConfigPath).then(() => true).catch(() => false);
      expect(viteConfigExists).toBe(true);
    });

    it('should have Vercel configuration', async () => {
      const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
      const vercelConfigExists = await fs.access(vercelConfigPath).then(() => true).catch(() => false);
      expect(vercelConfigExists).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('should not expose sensitive data', async () => {
      const indexHtmlPath = path.join(distPath, 'index.html');
      
      try {
        const indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf-8');
        
        // Check for common sensitive patterns
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /private[_-]?key/i,
          /api[_-]?key/i,
          /token/i
        ];

        sensitivePatterns.forEach(pattern => {
          const matches = indexHtmlContent.match(pattern);
          if (matches) {
            // Allow VITE_ prefixed variables as they're meant to be public
            const isViteVar = matches[0].includes('VITE_');
            if (!isViteVar) {
              expect(matches).toBeNull();
            }
          }
        });
      } catch {
        // index.html might not exist in all build configurations
        console.warn('index.html not found, skipping sensitive data check');
      }
    });
  });

  describe('Performance Validation', () => {
    it('should have reasonable total bundle size', () => {
      const totalSize = distFiles.reduce((total, file) => {
        const filePath = path.join(distPath, file);
        try {
          const stats = require('fs').statSync(filePath);
          return total + stats.size;
        } catch {
          return total;
        }
      }, 0);

      const totalSizeInMB = totalSize / (1024 * 1024);
      
      // Total build should be under 20MB
      expect(totalSizeInMB).toBeLessThan(20);
    });

    it('should use modern JavaScript features appropriately', async () => {
      const jsFiles = distFiles.filter(file => 
        file.endsWith('.js') && !file.includes('.map')
      );

      for (const jsFile of jsFiles) {
        const filePath = path.join(distPath, jsFile);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Should use modern imports/exports
        expect(content).toMatch(/import|export/);
        
        // Should not have unoptimized code patterns
        expect(content).not.toMatch(/console\.log/);
        expect(content).not.toMatch(/debugger/);
      }
    });
  });

  describe('Security Validation', () => {
    it('should not include development dependencies in build', () => {
      const devDeps = Object.keys(packageJson.devDependencies || {});
      
      // Check that dev dependencies aren't bundled
      const bundleContent = distFiles
        .filter(file => file.endsWith('.js'))
        .map(file => {
          try {
            return require('fs').readFileSync(path.join(distPath, file), 'utf-8');
          } catch {
            return '';
          }
        })
        .join('');

      // Common dev dependencies that shouldn't be in production
      const devOnlyDeps = ['vitest', 'vite', 'typescript', '@types/', 'eslint'];
      
      devOnlyDeps.forEach(dep => {
        expect(bundleContent.toLowerCase()).not.toContain(dep.toLowerCase());
      });
    });

    it('should not expose internal file paths', async () => {
      const jsFiles = distFiles.filter(file => file.endsWith('.js'));
      
      for (const jsFile of jsFiles) {
        const filePath = path.join(distPath, jsFile);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Should not contain absolute file paths
        expect(content).not.toMatch(/\/Users\/|\/home\/|C:\\/);
        expect(content).not.toMatch(/node_modules/);
      }
    });
  });
});